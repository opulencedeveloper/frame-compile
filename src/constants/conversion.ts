// Relative to /api/v1, which useHttp prepends.
export const CONVERSION_API = {
  CREATE: "/conversions",
  LIST: "/conversions",
  DETAIL: (id: string) => `/conversions/${encodeURIComponent(id)}`,
} as const;

// A full path: downloads go through a plain link, not useHttp, so the
// browser saves the file.
// "/dashboard?convert=<url>" opens the New conversion modal with the URL
// filled in, e.g. after the landing page's form.
export const CONVERT_QUERY_KEY = "convert";

export const conversionDownloadUrl = (id: string) =>
  `/api/v1/conversions/${encodeURIComponent(id)}/download`;

// How often a running conversion is checked on. A conversion takes about a
// minute.
export const CONVERSION_POLL_INTERVAL_MS = 2000;

// The dashboard checks on conversions still running less often.
export const CONVERSION_LIST_POLL_INTERVAL_MS = 5000;

// Typing in the dashboard's search waits this long before asking the API.
export const CONVERSION_SEARCH_DEBOUNCE_MS = 300;
