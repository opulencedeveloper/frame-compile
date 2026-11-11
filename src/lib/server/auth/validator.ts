import Joi from "joi";
import config from "../config";
import { BaseValidator } from "../utils/validator";
import { AuthPage } from "../utils/enum";
import { GoogleOAuthState } from "../utils/interface";
import {
  IGoogleAuthCallbackQuery,
  IGoogleAuthStartQuery,
  ILoginInput,
  IRegisterInput,
  IResendOtpInput,
  IVerifyEmailInput,
} from "./interface";

class AuthValidator extends BaseValidator {
  private authPageField = Joi.string().valid(...Object.values(AuthPage));

  private acceptTermsField = Joi.boolean().valid(true).messages({
    "any.only": "You must accept the Terms of Service and Privacy Policy",
    "any.required": "You must accept the Terms of Service and Privacy Policy",
  });

  private googleAuthStartSchema = Joi.object<IGoogleAuthStartQuery>({
    redirectTo: Joi.string().max(2048).optional(),
    authPage: this.authPageField.optional(),
    // Only sign-up can create an account, so only sign-up takes the terms
    // and marketing choices.
    acceptTerms: Joi.when("authPage", {
      is: AuthPage.SignUp,
      then: this.acceptTermsField.required(),
      otherwise: Joi.forbidden(),
    }),
    marketingOptIn: Joi.when("authPage", {
      is: AuthPage.SignUp,
      then: Joi.boolean().default(false),
      otherwise: Joi.forbidden(),
    }),
  });

  private googleAuthCallbackSchema = Joi.object<IGoogleAuthCallbackQuery>({
    code: Joi.string().max(2048).optional(),
    state: Joi.string().max(512).optional(),
    error: Joi.string().max(256).optional(),
  });

  private googleOAuthStateSchema = Joi.object<GoogleOAuthState>({
    state: Joi.string().required(),
    nonce: Joi.string().required(),
    codeVerifier: Joi.string().required(),
    redirectTo: Joi.string().required(),
    // Only these two values, so the cookie can't steer the error redirect
    // to an arbitrary path. Sign-up also means the terms were accepted.
    authPage: this.authPageField.required(),
    marketingOptIn: Joi.boolean().required(),
  });

  private emailField = Joi.string().trim().lowercase().email().max(254).required().messages({
    "string.empty": "Email is required",
    "string.email": "Please enter a valid email address",
    "string.max": "Email is too long",
    "any.required": "Email is required",
  });

  // Where to go after signing in; the controller still checks it is a
  // same-site path.
  private redirectToField = Joi.string().max(2048).optional();

  private registerSchema = Joi.object<IRegisterInput>({
    email: this.emailField,
    password: Joi.string()
      .min(config.password.minLength)
      .max(config.password.maxLength)
      .required()
      .messages({
        "string.empty": "Password is required",
        "string.min": `Password must be at least ${config.password.minLength} characters`,
        "string.max": `Password must be at most ${config.password.maxLength} characters`,
        "any.required": "Password is required",
      }),
    confirmPassword: Joi.string().required().valid(Joi.ref("password")).strip().messages({
      "string.empty": "Confirm password is required",
      "any.only": "Passwords do not match",
      "any.required": "Confirm password is required",
    }),
    // Stripped: the controller records when, not the flag itself.
    acceptTerms: this.acceptTermsField.required().strip(),
    // Optional and off unless ticked: marketing needs its own opt-in.
    marketingOptIn: Joi.boolean().default(false),
  });

  private verifyEmailSchema = Joi.object<IVerifyEmailInput>({
    email: this.emailField,
    otp: Joi.string()
      .trim()
      .pattern(new RegExp(`^\\d{${config.otp.length}}$`))
      .required()
      .messages({
        "string.empty": "Verification code is required",
        "string.pattern.base": `Verification code must be ${config.otp.length} digits`,
        "any.required": "Verification code is required",
      }),
    redirectTo: this.redirectToField,
  });

  // No minimum length here: login must not reveal the password policy, and
  // accounts created under an older policy must still be able to sign in.
  private loginSchema = Joi.object<ILoginInput>({
    email: this.emailField,
    password: Joi.string().max(config.password.maxLength).required().messages({
      "string.empty": "Password is required",
      "string.max": "Invalid email or password.",
      "any.required": "Password is required",
    }),
    redirectTo: this.redirectToField,
  });

  private resendOtpSchema = Joi.object<IResendOtpInput>({
    email: this.emailField,
  });

  validateGoogleAuthStart(data: unknown) {
    return this.validate(this.googleAuthStartSchema, data);
  }

  validateGoogleAuthCallback(data: unknown) {
    return this.validate(this.googleAuthCallbackSchema, data);
  }

  validateGoogleOAuthState(data: unknown) {
    return this.validate(this.googleOAuthStateSchema, data);
  }

  validateRegister(data: unknown) {
    return this.validate(this.registerSchema, data);
  }

  validateVerifyEmail(data: unknown) {
    return this.validate(this.verifyEmailSchema, data);
  }

  validateLogin(data: unknown) {
    return this.validate(this.loginSchema, data);
  }

  validateResendOtp(data: unknown) {
    return this.validate(this.resendOtpSchema, data);
  }
}

export const authValidator = new AuthValidator();
