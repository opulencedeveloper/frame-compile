import config from "../config";

// Each conversion is previewed on its own origin, "<id>.<PREVIEW_HOST>".
// Converted sites run their own scripts; on the app's origin those scripts
// could call the API as the signed-in user. A separate origin can't, and
// the session cookie, set for the app's host only, is never sent to it.
class PreviewHost {
  public urlFor(publicId: string): string {
    const host = config.preview.host;
    if (!host) throw new Error("Missing required environment variable: PREVIEW_HOST");
    const { protocol } = new URL(config.app.url);
    return `${protocol}//${publicId}.${host}/`;
  }

  // The conversion a request's Host header names, or null for any other
  // host, including the app's own.
  public publicIdFromHost(hostHeader: string | null): string | null {
    const host = config.preview.host;
    if (!host || !hostHeader) return null;

    const suffix = `.${host}`;
    const requested = hostHeader.toLowerCase();
    if (!requested.endsWith(suffix)) return null;

    const label = requested.slice(0, -suffix.length);
    return config.conversion.publicIdPattern.test(label) ? label : null;
  }
}

export const previewHost = new PreviewHost();
