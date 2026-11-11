import "server-only";

// Read lazily so a missing variable fails the request that needs it,
// not `next build` (which imports route modules without runtime env).
function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const config = {
  isProduction: process.env.NODE_ENV === "production",
  app: {
    name: "FrameCompile",
    get url() {
      return requireEnv("APP_URL");
    },
    // Where users land after signing in, unless they were sent to sign-in
    // from another page (`redirectTo`).
    afterLoginPath: "/dashboard",
  },
  db: {
    get uri() {
      return requireEnv("MONGODB_URI");
    },
  },
  jwt: {
    get secret() {
      const secret = requireEnv("JWT_SECRET");
      if (secret.length < 32) {
        throw new Error("JWT_SECRET must be at least 32 characters");
      }
      return new TextEncoder().encode(secret);
    },
    expiresInSeconds: 60 * 60 * 24 * 7, // 7 days
  },
  password: {
    minLength: 8,
    // Caps hashing work per request; well above any real passphrase.
    maxLength: 128,
    saltBytes: 16,
    keyLength: 64,
    // OWASP-recommended scrypt profile (N=2^15, r=8, p=3). It needs 32 MiB,
    // which is exactly Node's default limit, so maxmem is raised.
    scrypt: { N: 2 ** 15, r: 8, p: 3, maxmem: 64 * 1024 * 1024 },
  },
  otp: {
    length: 6,
    expiresInSeconds: 60 * 10, // 10 minutes
    maxAttempts: 5,
    resendCooldownSeconds: 60,
  },
  mail: {
    get resendApiKey() {
      return requireEnv("RESEND_API_KEY");
    },
    get from() {
      return requireEnv("MAIL_FROM");
    },
  },
  marketing: {
    // The page an email's unsubscribe link opens; it asks before acting, so
    // link scanners that prefetch URLs can't unsubscribe anyone.
    unsubscribePagePath: "/unsubscribe",
    // Mail clients POST here directly for one-click unsubscribe (RFC 8058).
    unsubscribeApiPath: "/api/v1/marketing/unsubscribe",
  },
  google: {
    get clientId() {
      return requireEnv("GOOGLE_CLIENT_ID");
    },
    get clientSecret() {
      return requireEnv("GOOGLE_CLIENT_SECRET");
    },
    get redirectUri() {
      return new URL(`${config.google.cookiePath}/callback`, config.app.url).toString();
    },
    // Scoped to the Google auth routes so the state cookie is never sent elsewhere.
    cookiePath: "/api/v1/auth/google",
    stateExpiresInSeconds: 60 * 10, // 10 minutes to finish the consent screen
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    jwksUrl: "https://www.googleapis.com/oauth2/v3/certs",
    issuers: ["https://accounts.google.com", "accounts.google.com"],
  },
};

export default config;
