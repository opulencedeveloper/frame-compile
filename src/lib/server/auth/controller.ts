import { NextResponse } from "next/server";
import config from "../config";
import { utils } from "../utils";
import { auth } from "../utils/auth";
import { googleOAuth } from "../utils/google-oauth";
import { email } from "../utils/email";
import {
  AuthErrorCode,
  AuthPage,
  CookieNames,
  EmailVerificationPurpose,
  MessageResponse,
} from "../utils/enum";
import { AuthProvider, GoogleUserStatus } from "./enum";
import { GoogleOAuthState } from "../utils/interface";
import { logger } from "../utils/logger";
import { userService } from "../user/service";
import { IEmailVerification, ISignUpConsent } from "../user/interface";
import { authValidator } from "./validator";
import {
  IGoogleAuthCallbackQuery,
  IGoogleAuthStartQuery,
  ILoginInput,
  IRegisterInput,
  IResendOtpInput,
  IVerifyEmailInput,
} from "./interface";

class AuthController {
  public googleAuthStart({
    redirectTo,
    authPage = AuthPage.SignIn,
    marketingOptIn = false,
  }: IGoogleAuthStartQuery) {
    const oauthState = googleOAuth.createState(
      utils.getSafeRedirectPath(redirectTo, config.app.afterLoginPath),
      authPage,
      marketingOptIn,
    );
    const response = NextResponse.redirect(
      googleOAuth.getAuthorizationUrl(oauthState),
    );

    response.cookies.set(
      CookieNames.GoogleOAuthState,
      JSON.stringify(oauthState),
      {
        httpOnly: true,
        secure: config.isProduction,
        // Must be "lax": Google's redirect back is a cross-site navigation.
        sameSite: "lax",
        path: config.google.cookiePath,
        maxAge: config.google.stateExpiresInSeconds,
      },
    );

    return response;
  }

  public async googleAuthCallback(
    { code, state, error }: IGoogleAuthCallbackQuery,
    stateCookie: string | undefined,
  ) {
    // Read first so every failure below, including a cancel on Google's
    // screen, returns to the page the flow started from.
    const oauthState = this.parseOAuthState(stateCookie);
    const authPage = oauthState?.authPage;

    if (error) {
      return this.authErrorRedirect(
        error === "access_denied"
          ? AuthErrorCode.GoogleAuthCancelled
          : AuthErrorCode.GoogleAuthFailed,
        authPage,
      );
    }

    if (
      !code ||
      !state ||
      !oauthState ||
      !googleOAuth.isValidState(oauthState.state, state)
    ) {
      logger.warn("Google callback rejected: missing or mismatched state");
      return this.authErrorRedirect(AuthErrorCode.GoogleAuthFailed, authPage);
    }

    const profile = await googleOAuth.getProfile(code, oauthState);
    if (!profile.emailVerified) {
      return this.authErrorRedirect(
        AuthErrorCode.GoogleEmailUnverified,
        authPage,
      );
    }

    const lookup = await userService.findGoogleUser(profile);
    if (lookup.status === GoogleUserStatus.Conflict) {
      return this.authErrorRedirect(
        AuthErrorCode.GoogleAccountConflict,
        authPage,
      );
    }

    let userId: string;
    if (lookup.status === GoogleUserStatus.Found) {
      userId = lookup.user.id;
    } else if (authPage === AuthPage.SignUp) {
      // The start route only accepts sign-up with the terms accepted.
      const consent = this.signUpConsent(oauthState.marketingOptIn);
      userId = (await userService.createGoogleUser(profile, consent)).id;
    } else {
      return this.authErrorRedirect(
        AuthErrorCode.GoogleAccountNotFound,
        AuthPage.SignUp,
      );
    }

    const response = this.redirectTo(
      utils.getSafeRedirectPath(
        oauthState.redirectTo,
        config.app.afterLoginPath,
      ),
    );
    await auth.setSessionCookie(response, { userId });
    return response;
  }

  public async register({
    email: userEmail,
    password,
    marketingOptIn,
  }: IRegisterInput) {
    const existingUser =
      await userService.findUserByEmailWithVerification(userEmail);

    // A verified account that already has a password: changing it is a
    // password reset, not a sign-up.
    if (
      existingUser?.isEmailVerified &&
      existingUser.authProviders.includes(AuthProvider.Email)
    ) {
      return utils.customResponse({
        status: 409,
        message: MessageResponse.Error,
        description:
          "This email is already registered. Please sign in instead.",
        data: null,
      });
    }

    if (existingUser) {
      const cooldown = this.getResendCooldown(existingUser.emailVerification);
      if (cooldown) return cooldown;
    }

    const passwordHash = await auth.hashPassword(password);
    // Any remaining verified account here is Google-only: the password is
    // held as pending and only applied once the code proves inbox ownership.
    const isAddingPassword = existingUser?.isEmailVerified === true;

    if (isAddingPassword) {
      const { code, emailVerification } =
        this.createEmailVerification(passwordHash);

      await userService.setPendingPassword(existingUser.id, emailVerification);

      await email.sendVerificationCode(
        userEmail,
        code,
        EmailVerificationPurpose.AddPassword,
      );
    } else {
      const { code, emailVerification } = this.createEmailVerification();
      // The validator only lets a request through with the terms accepted.
      const consent = this.signUpConsent(marketingOptIn);
      if (existingUser) {
        await userService.resetUnverifiedEmailUser(
          existingUser.id,
          passwordHash,
          emailVerification,
          consent,
        );
      } else {
        await userService.createEmailUser(
          userEmail,
          passwordHash,
          emailVerification,
          consent,
        );
      }
      await email.sendVerificationCode(
        userEmail,
        code,
        EmailVerificationPurpose.SignUp,
      );
    }

    return utils.customResponse({
      status: 201,
      message: MessageResponse.Success,
      description: "Enter the code we sent to your email.",
      data: this.pendingVerificationData(userEmail),
    });
  }

  public async verifyEmail({
    email: userEmail,
    otp,
    redirectTo,
  }: IVerifyEmailInput) {
    const user = await userService.findUserByEmailWithVerification(userEmail);
    const verification = user?.emailVerification;

    // One message for "no such user", "already verified" and "no pending
    // code", so this endpoint can't be used to probe which emails exist.
    // A verified user only has a pending code while adding a password.
    if (
      !user ||
      !verification ||
      (user.isEmailVerified && !verification.pendingPasswordHash)
    ) {
      return this.verificationError(
        400,
        "Invalid or expired verification code.",
      );
    }

    if (verification.expiresAt.getTime() <= Date.now()) {
      return this.verificationError(
        400,
        "This code has expired. Request a new one.",
      );
    }

    const hasAttemptsLeft = await userService.consumeVerificationAttempt(
      user.id,
      config.otp.maxAttempts,
    );
    if (!hasAttemptsLeft) {
      return this.verificationError(
        429,
        "Too many incorrect attempts. Request a new code.",
      );
    }

    if (!auth.isValidOtp(otp, verification.codeHash)) {
      return this.verificationError(
        400,
        "Invalid or expired verification code.",
      );
    }

    const verifiedUser = verification.pendingPasswordHash
      ? await userService.applyPendingPassword(
          user.id,
          verification.pendingPasswordHash,
        )
      : await userService.markEmailVerified(user.id);
    if (!verifiedUser) {
      return this.verificationError(
        400,
        "Invalid or expired verification code.",
      );
    }

    return this.sessionResponse(verifiedUser.id, redirectTo, "Email verified.");
  }

  public async login({ email: userEmail, password, redirectTo }: ILoginInput) {
    const user = await userService.findUserByEmailForLogin(userEmail);

    // Runs a full scrypt even when there is no user or no password, and uses
    // one message for every failure, so neither the response nor its timing
    // reveals which emails have accounts. Google-only accounts land here too.
    const isPasswordValid = await auth.verifyPassword(password, user?.password);
    if (!user || !isPasswordValid) {
      return this.verificationError(401, "Invalid email or password.");
    }

    // Only reached with the right password, so this can't be used to make
    // the app email codes to someone else.
    if (!user.isEmailVerified) {
      let resendAvailableInSeconds = this.secondsUntilResend(
        user.emailVerification,
      );

      // Inside the cooldown the last code is still valid, so the user is
      // sent to the code screen without another email.
      if (resendAvailableInSeconds <= 0) {
        const { code, emailVerification } = this.createEmailVerification();

        await userService.setEmailVerification(user.id, emailVerification);
        await email.sendVerificationCode(
          userEmail,
          code,
          EmailVerificationPurpose.SignUp,
        );
        resendAvailableInSeconds = config.otp.resendCooldownSeconds;
      }

      return utils.customResponse({
        status: 200,
        message: MessageResponse.VerifyEmail,
        description:
          "Verify your email to continue. Enter the code we sent you.",
        data: this.pendingVerificationData(userEmail, resendAvailableInSeconds),
      });
    }

    await userService.recordLogin(user.id);
    return this.sessionResponse(user.id, redirectTo, "Signed in.");
  }

  public async resendOtp({ email: userEmail }: IResendOtpInput) {
    const user = await userService.findUserByEmailWithVerification(userEmail);

    const pending = user?.emailVerification;

    if (
      !user ||
      !pending ||
      (user.isEmailVerified && !pending.pendingPasswordHash)
    ) {
      return this.verificationError(
        400,
        "There is no pending verification for this email.",
      );
    }

    const cooldown = this.getResendCooldown(pending);
    if (cooldown) return cooldown;

    // A resend keeps the pending password, so adding one survives a new code.
    const { code, emailVerification } = this.createEmailVerification(
      pending.pendingPasswordHash,
    );
    await userService.setEmailVerification(user.id, emailVerification);
    await email.sendVerificationCode(
      userEmail,
      code,
      pending.pendingPasswordHash
        ? EmailVerificationPurpose.AddPassword
        : EmailVerificationPurpose.SignUp,
    );

    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "A new code has been sent to your email.",
      data: this.pendingVerificationData(userEmail),
    });
  }

  // Sessions are stateless JWTs, so signing out removes the cookie. Works
  // without a valid session, so an expired one can still be cleared.
  public logout() {
    const response = utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "Signed out.",
      data: null,
    });
    auth.clearSessionCookie(response);
    return response;
  }

  private signUpConsent(marketingOptIn: boolean): ISignUpConsent {
    const now = new Date();
    return {
      termsAcceptedAt: now,
      marketingConsent: marketingOptIn
        ? { granted: true, grantedAt: now }
        : { granted: false },
    };
  }

  private createEmailVerification(pendingPasswordHash?: string) {
    const code = auth.generateOtp();
    const now = Date.now();
    const emailVerification: IEmailVerification = {
      codeHash: auth.hashOtp(code),
      expiresAt: new Date(now + config.otp.expiresInSeconds * 1000),
      sentAt: new Date(now),
      attempts: 0,
      ...(pendingPasswordHash && { pendingPasswordHash }),
    };
    return { code, emailVerification };
  }

  private secondsUntilResend(verification: IEmailVerification | undefined) {
    if (!verification) return 0;
    const elapsedSeconds = (Date.now() - verification.sentAt.getTime()) / 1000;
    return Math.max(
      0,
      Math.ceil(config.otp.resendCooldownSeconds - elapsedSeconds),
    );
  }

  // Returns a 429 response while the last code is too recent to resend.
  private getResendCooldown(verification: IEmailVerification | undefined) {
    const retryAfterSeconds = this.secondsUntilResend(verification);
    if (retryAfterSeconds <= 0) return null;

    return utils.customResponse({
      status: 429,
      message: MessageResponse.Error,
      description: `Please wait ${retryAfterSeconds} seconds before requesting another code.`,
      data: { retryAfterSeconds },
    });
  }

  private pendingVerificationData(
    userEmail: string,
    resendAvailableInSeconds: number = config.otp.resendCooldownSeconds,
  ) {
    return { email: userEmail, resendAvailableInSeconds };
  }

  private async sessionResponse(
    userId: string,
    redirectTo: string | undefined,
    description: string,
  ) {
    const response = utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description,
      data: {
        redirectTo: utils.getSafeRedirectPath(
          redirectTo,
          config.app.afterLoginPath,
        ),
      },
    });
    await auth.setSessionCookie(response, { userId });
    return response;
  }

  private verificationError(status: number, description: string) {
    return utils.customResponse({
      status,
      message: MessageResponse.Error,
      description,
      data: null,
    });
  }

  // Falls back to sign-in when the state cookie is missing or invalid, since
  // then there is no trustworthy record of where the flow started.
  public authErrorRedirect(
    code: AuthErrorCode,
    authPage: AuthPage = AuthPage.SignIn,
  ) {
    return this.redirectTo(`/${authPage}?error=${code}`);
  }

  // Every callback outcome clears the state cookie: it is single-use.
  private redirectTo(path: string) {
    const response = NextResponse.redirect(new URL(path, config.app.url));
    response.cookies.set(CookieNames.GoogleOAuthState, "", {
      path: config.google.cookiePath,
      maxAge: 0,
    });
    return response;
  }

  private parseOAuthState(
    stateCookie: string | undefined,
  ): GoogleOAuthState | null {
    if (!stateCookie) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(stateCookie);
    } catch {
      return null;
    }

    const validation = authValidator.validateGoogleOAuthState(parsed);
    return validation.valid ? validation.value : null;
  }
}

export const authController = new AuthController();
