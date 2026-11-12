export const AUTH_KEYS = {
  TOKEN: "token",
  AUTH_USER_FULL_NAME: "authUserFullName",
  AUTH_PROGRESS: "authProgress",
  IS_COMPLETED: "isCompleted",
  REDIRECT_AFTER_LOGIN: "redirectAfterLogin",
  REFERRAL_CODE: "referralCode",
} as const;

// Where signed-in users work. Matches config.app.afterLoginPath on the server.
export const DASHBOARD_ROUTE = "/dashboard";

export const SIGN_IN_ROUTE = "/sign-in";

export const AUTH_ROUTES = {
  GOOGLE: "/api/v1/auth/google",
} as const;

// Relative to /api/v1, which useHttp prepends.
export const AUTH_API = {
  REGISTER: "/auth/register",
  LOGIN: "/auth/login",
  VERIFY_EMAIL: "/auth/verify-email",
  RESEND_OTP: "/auth/resend-otp",
  LOGOUT: "/auth/logout",
} as const;

export const AUTH_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  OTP_LENGTH: 6,
  // Stricter than the browser's type="email" (which accepts "a@b"), so the
  // UI only treats an email as valid when the API will accept it too.
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
} as const;

export const AUTH_QUERY_KEYS = {
  REDIRECT_TO: "redirectTo",
  ERROR: "error",
  AUTH_PAGE: "authPage",
  ACCEPT_TERMS: "acceptTerms",
  MARKETING_OPT_IN: "marketingOptIn",
} as const;
