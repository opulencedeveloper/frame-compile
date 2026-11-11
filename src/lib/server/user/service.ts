import User from "./entity";
import { AuthProvider, GoogleUserStatus } from "../auth/enum";
import {
  GoogleUserLookup,
  IEmailVerification,
  ISignUpConsent,
  UserDocument,
} from "./interface";
import { IVercelConnection } from "../deployment/interface";
import { GoogleProfile } from "../utils/interface";
import { logger } from "../utils/logger";

class UserService {
  async findUserByGoogleId(googleId: string): Promise<UserDocument | null> {
    return User.findOne({ googleId });
  }

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  async findUserByEmailWithVerification(
    email: string,
  ): Promise<UserDocument | null> {
    return User.findOne({ email: email.toLowerCase() }).select(
      "+emailVerification",
    );
  }

  async findUserByEmailForLogin(email: string): Promise<UserDocument | null> {
    return User.findOne({ email: email.toLowerCase() }).select(
      "+password +emailVerification",
    );
  }

  async recordLogin(userId: string): Promise<void> {
    await User.updateOne(
      { _id: userId },
      { $set: { lastLoginAt: new Date() } },
    );
  }

  async createEmailUser(
    email: string,
    passwordHash: string,
    emailVerification: IEmailVerification,
    consent: ISignUpConsent,
  ): Promise<UserDocument> {
    const user = await User.create({
      email,
      password: passwordHash,
      authProviders: [AuthProvider.Email],
      isEmailVerified: false,
      emailVerification,
      ...consent,
    });

    logger.info("User created with email", { userId: user.id });
    return user;
  }

  // Lets someone restart an abandoned sign-up instead of the email staying
  // locked to an account nobody can verify.
  async resetUnverifiedEmailUser(
    userId: string,
    passwordHash: string,
    emailVerification: IEmailVerification,
    consent: ISignUpConsent,
  ): Promise<UserDocument | null> {
    return User.findOneAndUpdate(
      { _id: userId, isEmailVerified: false },
      { $set: { password: passwordHash, emailVerification, ...consent } },
      { returnDocument: "after" },
    );
  }

  // Issues a new code for an unverified account, or replaces the code of a
  // pending add-password (resend, or login before verifying).
  async setEmailVerification(
    userId: string,
    emailVerification: IEmailVerification,
  ): Promise<UserDocument | null> {
    return User.findOneAndUpdate(
      {
        _id: userId,
        $or: [
          { isEmailVerified: false },
          { emailVerification: { $exists: true } },
        ],
      },
      { $set: { emailVerification } },
      { returnDocument: "after" },
    );
  }

  // Starts adding a password to a verified, password-less (Google-only)
  // account. Nothing about the account changes until the code is verified.
  async setPendingPassword(
    userId: string,
    emailVerification: IEmailVerification,
  ): Promise<UserDocument | null> {
    return User.findOneAndUpdate(
      {
        _id: userId,
        isEmailVerified: true,
        authProviders: { $ne: AuthProvider.Email },
      },
      { $set: { emailVerification } },
      { returnDocument: "after" },
    );
  }

  async applyPendingPassword(
    userId: string,
    passwordHash: string,
  ): Promise<UserDocument | null> {
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        "emailVerification.pendingPasswordHash": { $exists: true },
      },
      {
        $set: { password: passwordHash, lastLoginAt: new Date() },
        $addToSet: { authProviders: AuthProvider.Email },
        $unset: { emailVerification: 1 },
      },
      { returnDocument: "after" },
    );

    if (user)
      logger.info("Password added to existing user", { userId: user.id });
    return user;
  }

  // Counts the attempt atomically before the code is checked, so parallel
  // guesses can't exceed the limit. Returns false once it is used up.
  async consumeVerificationAttempt(
    userId: string,
    maxAttempts: number,
  ): Promise<boolean> {
    const user = await User.findOneAndUpdate(
      { _id: userId, "emailVerification.attempts": { $lt: maxAttempts } },
      { $inc: { "emailVerification.attempts": 1 } },
    );
    return user !== null;
  }

  // Matches only a current opt-in, so repeat unsubscribes keep the original
  // revokedAt. grantedAt is kept as part of the consent history.
  async revokeMarketingConsent(userId: string): Promise<void> {
    const { modifiedCount } = await User.updateOne(
      { _id: userId, "marketingConsent.granted": true },
      {
        $set: {
          "marketingConsent.granted": false,
          "marketingConsent.revokedAt": new Date(),
        },
      },
    );

    if (modifiedCount) logger.info("Marketing consent revoked", { userId });
  }

  async markEmailVerified(userId: string): Promise<UserDocument | null> {
    const user = await User.findOneAndUpdate(
      { _id: userId, isEmailVerified: false },
      {
        $set: { isEmailVerified: true, lastLoginAt: new Date() },
        $unset: { emailVerification: 1 },
      },
      { returnDocument: "after" },
    );

    if (user) logger.info("User email verified", { userId: user.id });
    return user;
  }

  // Signs in an existing Google user, or links Google to an existing email
  // account. Never creates one: that needs the terms accepted on sign-up.
  async findGoogleUser(profile: GoogleProfile): Promise<GoogleUserLookup> {
    const lastLoginAt = new Date();

    const existingGoogleUser = await User.findOneAndUpdate(
      { googleId: profile.googleId },
      { $set: { lastLoginAt } },
      { returnDocument: "after" },
    );
    if (existingGoogleUser) {
      return { status: GoogleUserStatus.Found, user: existingGoogleUser };
    }

    const existingEmailUser = await this.findUserByEmail(profile.email);
    if (!existingEmailUser) return { status: GoogleUserStatus.NotFound };
    if (existingEmailUser.googleId)
      return { status: GoogleUserStatus.Conflict };

    const linkedUser = await this.linkGoogleAccount(
      existingEmailUser,
      profile,
      lastLoginAt,
    );
    return linkedUser
      ? { status: GoogleUserStatus.Found, user: linkedUser }
      : { status: GoogleUserStatus.Conflict };
  }

  async createGoogleUser(
    profile: GoogleProfile,
    consent: ISignUpConsent,
  ): Promise<UserDocument> {
    const user = await User.create({
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      googleId: profile.googleId,
      authProviders: [AuthProvider.Google],
      isEmailVerified: true,
      ...consent,
      lastLoginAt: new Date(),
    });

    logger.info("User created with Google", { userId: user.id });
    return user;
  }

  // The user's Vercel connection, with its (sealed) token.
  async findVercelConnection(userId: string): Promise<IVercelConnection | null> {
    const user = await User.findById(userId).select("+vercel.token");
    return user?.vercel?.token ? user.vercel : null;
  }

  async setVercelConnection(userId: string, connection: IVercelConnection): Promise<void> {
    await User.updateOne({ _id: userId }, { $set: { vercel: connection } });
    logger.info("Vercel connected", { userId, username: connection.username });
  }

  async removeVercelConnection(userId: string): Promise<void> {
    await User.updateOne({ _id: userId }, { $unset: { vercel: 1 } });
    logger.info("Vercel disconnected", { userId });
  }

  private async linkGoogleAccount(
    user: UserDocument,
    profile: GoogleProfile,
    lastLoginAt: Date,
  ): Promise<UserDocument | null> {
    // If the email was never verified, whoever set the password may not own
    // the inbox. Google just proved ownership, so drop that password rather
    // than leave a second way into the account.
    const keepPassword = user.isEmailVerified;

    const linkedUser = await User.findOneAndUpdate(
      { _id: user._id, googleId: { $exists: false } },
      {
        $set: {
          googleId: profile.googleId,
          isEmailVerified: true,
          lastLoginAt,
          name: user.name ?? profile.name,
          avatarUrl: user.avatarUrl ?? profile.avatarUrl,
          authProviders: keepPassword
            ? [...new Set([...user.authProviders, AuthProvider.Google])]
            : [AuthProvider.Google],
        },
        // Google proved the email, so any pending OTP is no longer needed.
        $unset: { emailVerification: 1, ...(!keepPassword && { password: 1 }) },
      },
      { returnDocument: "after" },
    );

    if (linkedUser) {
      logger.info("Google account linked to existing user", {
        userId: linkedUser.id,
        passwordCleared: !keepPassword,
      });
      return linkedUser;
    }

    // Another request linked a Google account between our read and write.
    return this.findUserByGoogleId(profile.googleId);
  }
}

export const userService = new UserService();
