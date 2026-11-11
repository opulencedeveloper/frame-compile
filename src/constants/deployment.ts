// Relative to /api/v1, which useHttp prepends.
export const DEPLOYMENT_API = {
  VERCEL: "/integrations/vercel",
  DEPLOY: (conversionId: string) => `/conversions/${encodeURIComponent(conversionId)}/deploy`,
} as const;

// Where users create a Vercel token.
export const VERCEL_TOKEN_URL = "https://vercel.com/account/settings/tokens";
