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
    signInPath: "/sign-in",
    // Where sign-in returns to, as given by the proxy.
    redirectToParam: "redirectTo",
    // Pages only signed-in users can open (see src/proxy.ts), besides each
    // conversion's page, "/<conversion id>".
    protectedPaths: ["/dashboard"],
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
  outboundFetch: {
    // Sent with every request we make to a site being converted.
    userAgent: "Mozilla/5.0 (compatible; FrameCompileBot/1.0)",
    timeoutMs: 30_000,
    maxRedirects: 5,
    redirectStatuses: [301, 302, 303, 307, 308],
    maxResponseBytes: 50 * 1024 * 1024,
    defaultAccept: "*/*",
    // Each attempt gets the full timeout; waits are 500ms, then 1s. Server
    // errors (5xx) are retried, and these client statuses.
    retry: { attempts: 3, baseDelayMs: 500, clientStatuses: [408, 429] },
  },
  // Converted projects are stored as one private repository each, on a
  // GitHub account (or organization) kept for that purpose.
  github: {
    // A token for that account. Classic: the "repo" scope. Fine-grained:
    // all repositories, with Administration and Contents read and write.
    get token() {
      return requireEnv("GITHUB_TOKEN");
    },
    // The user or organization that owns the repositories.
    get owner() {
      return requireEnv("GITHUB_OWNER");
    },
    apiUrl: "https://api.github.com",
    apiVersion: "2022-11-28",
    apiAccept: "application/vnd.github+json",
    // Returns a file's bytes instead of JSON describing it.
    rawFileAccept: "application/vnd.github.raw",
    gitUrl: "https://github.com",
    // The username GitHub expects when a token is sent as a password.
    tokenUsername: "x-access-token",
    // Commits are attributed to the storage account's private address.
    noreplyEmailDomain: "users.noreply.github.com",
    repositoryPrefix: "framecompile-",
    branch: "main",
    commitAuthorName: "FrameCompile",
    requestTimeoutMs: 30_000,
    // A project's zip is fetched and streamed through to the user, tens of
    // MB.
    archiveTimeoutMs: 5 * 60_000,
    checkoutDirPrefix: "framecompile-checkout-",
    // Pushing a large site (tens of MB of images) can take a while.
    pushTimeoutMs: 10 * 60_000,
    // A push cut off mid-upload is tried again, waiting a little longer
    // each time. Pushing the same commit again is safe.
    pushAttempts: 3,
    pushRetryDelayMs: 2_000,
    // Settings git runs with. Large uploads over HTTP/2 can be cut off
    // ("HTTP/2 stream was not closed cleanly"); HTTP/1.1 doesn't have that.
    gitSettings: {
      "http.version": "HTTP/1.1",
    } as Record<string, string>,
    gitOutputMaxBytes: 1024 * 1024,
    gitBinary: "git",
    // git runs with only these from the server's environment, so it can find
    // its binary and home directory but nothing else leaks in.
    get gitInheritedEnv() {
      return { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: process.env.NODE_ENV };
    },
    // The machine's git configuration is ignored, so hooks, credential
    // helpers or signing settings can't change what is pushed, and git never
    // stops to ask for a password.
    gitIsolationEnv: {
      GIT_TERMINAL_PROMPT: "0",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: "/dev/null",
    },
  },
  // Converted sites run their own scripts, so they are previewed on another
  // origin, never the app's: "<id>.<host>". In development "localhost:3000"
  // works as is (browsers resolve *.localhost to this machine); in
  // production, a separate domain with a wildcard DNS record and
  // certificate, e.g. "framecompile-preview.app".
  preview: {
    // Optional so the app still runs without it; previews are then off.
    get host(): string | null {
      return process.env.PREVIEW_HOST?.trim().toLowerCase() || null;
    },
    // The internal route preview hosts are rewritten to (see src/proxy.ts).
    routePath: "/api/v1/previews",
    mimeTypes: {
      ".html": "text/html; charset=utf-8",
      ".mjs": "text/javascript; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json",
      ".txt": "text/plain; charset=utf-8",
      ".xml": "application/xml",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".avif": "image/avif",
      ".ico": "image/x-icon",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
      ".otf": "font/otf",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mov": "video/quicktime",
      ".mp3": "audio/mpeg",
      ".pdf": "application/pdf",
    } as Record<string, string>,
    defaultMimeType: "application/octet-stream",
    // Ready sites (their manifest and repository) kept in memory.
    maxCachedSites: 500,
    pageCacheControl: "public, max-age=300",
    assetCacheControl: "public, max-age=31536000, immutable",
    // Files fetched from GitHub are kept in memory, up to this much.
    cacheMaxBytes: 256 * 1024 * 1024,
    // Larger files are served without being cached.
    cacheMaxFileBytes: 8 * 1024 * 1024,
  },
  conversion: {
    // Each conversion runs a headless browser, so only a few at once; the
    // rest wait their turn.
    maxConcurrent: 2,
    // A user can have this many conversions queued or running.
    maxActivePerUser: 1,
    // Where the conversions API is served; links in its answers start here.
    apiPath: "/api/v1/conversions",
    // A conversion's thumbnail never changes, but it is the user's own:
    // cached by their browser only.
    thumbnailCacheControl: "private, max-age=31536000, immutable",
    // While a server holds a conversion (queued or running) it refreshes the
    // conversion's heartbeat this often.
    heartbeatIntervalMs: 30_000,
    // An unfinished conversion whose heartbeat is older than this lost its
    // server (e.g. a restart or deploy) and is reported as interrupted.
    // Several missed heartbeats, so a busy server isn't mistaken for a gone one.
    staleAfterMs: 3 * 60_000,
    // 16 random bytes in lowercase base32: 26 characters, valid as a DNS
    // label, so the id can be the preview's subdomain.
    publicIdBytes: 16,
    publicIdAlphabet: "abcdefghijklmnopqrstuvwxyz234567",
    publicIdPattern: /^[a-z2-7]{26}$/,
    // Issues stored with a conversion; the rest are counted.
    maxStoredIssues: 200,
    workDirPrefix: "framecompile-conversion-",
    listDefaultLimit: 24,
    listMaxLimit: 50,
    searchMaxLength: 100,
    // The downloaded zip, "<site>-nextjs.zip", and the folder inside it.
    downloadSuffix: "-nextjs",
  },
  // Secrets stored for users (their Vercel token) are encrypted with this
  // key: 32 random bytes, base64. Generate one with
  //   openssl rand -base64 32
  // Changing it makes stored tokens unreadable; users then reconnect.
  secrets: {
    get encryptionKey() {
      const key = Buffer.from(requireEnv("TOKEN_ENCRYPTION_KEY"), "base64");
      if (key.length !== 32) {
        throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
      }
      return key;
    },
    algorithm: "aes-256-gcm",
    ivBytes: 12,
    // Prefix of the stored form, so the format can change later.
    version: "v1",
  },
  // Deploying a converted project to the user's own Vercel account.
  vercel: {
    apiUrl: "https://api.vercel.com",
    requestTimeoutMs: 30_000,
    uploadTimeoutMs: 120_000,
    // Files uploaded at once.
    uploadConcurrency: 8,
    framework: "nextjs",
    // How often a building deployment's status is asked of Vercel, at most.
    statusCheckIntervalMs: 3000,
    // A deployment still uploading after this long was interrupted.
    uploadStaleAfterMs: 15 * 60_000,
    // How a team-scoped token's only account is shown: such a token can't
    // read its team's name.
    scopedTokenAccountName: "Your token's team",
    // A working token that may not create projects: tokens scoped to a
    // single team usually can't.
    scopeHelp:
      "This token can't create Vercel projects. Create a new token with Full Account as its scope, then connect it again.",
    // Vercel project names: lowercase letters, digits and dashes.
    projectNameMaxLength: 90,
  },
  // Headless Chromium used to find files a site's runtime only requests
  // while it runs. Unset, Playwright uses the browser installed with
  // `npx playwright-core install chromium`.
  browser: {
    get executablePath() {
      return process.env.BROWSER_EXECUTABLE_PATH?.trim() || undefined;
    },
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
