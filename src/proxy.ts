import { NextRequest, NextResponse } from "next/server";
import appConfig from "@/lib/server/config";
import { auth } from "@/lib/server/utils/auth";
import { CookieNames } from "@/lib/server/utils/enum";
import { previewHost } from "@/lib/server/utils/preview-host";

// Every request to a preview host ("<id>.<PREVIEW_HOST>") is served from the
// preview route, whatever its path, so nothing else in the app (pages, the
// API) is reachable from a converted site's origin.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const routePath = appConfig.preview.routePath;

  const publicId = previewHost.publicIdFromHost(request.headers.get("host"));
  if (publicId) {
    return NextResponse.rewrite(new URL(`${routePath}/${publicId}${pathname}${search}`, request.url));
  }

  // And the preview route is unreachable on the app's own host: there, a
  // converted site's scripts would run with the app's origin.
  if (pathname === routePath || pathname.startsWith(`${routePath}/`)) {
    return new NextResponse(null, { status: 404 });
  }

  // Writes must come from the app's own pages. Browsers send Origin (and
  // Sec-Fetch-Site) with them, so another site, or a converted site's
  // scripts on a preview host, can't act as the signed-in user.
  if (isCrossSiteWrite(request)) {
    return withSecurityHeaders(new NextResponse(null, { status: 403 }), request);
  }

  // Signed-out visitors are sent to sign in before a dashboard page loads,
  // rather than after its first API call fails. Signing in returns them to
  // the page they asked for.
  if (isProtectedPage(pathname)) {
    const userId = await auth.sessionUserId(request.cookies.get(CookieNames.UserAuthToken)?.value);
    if (!userId) {
      const signIn = new URL(appConfig.app.signInPath, request.url);
      signIn.searchParams.set(appConfig.app.redirectToParam, `${pathname}${search}`);
      return withSecurityHeaders(NextResponse.redirect(signIn), request);
    }
  }

  return withSecurityHeaders(NextResponse.next(), request);
}

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

function isCrossSiteWrite(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  if (SAFE_METHODS.includes(request.method) || !pathname.startsWith("/api/")) return false;
  if (appConfig.security.crossSiteWritePaths.includes(pathname)) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site" || fetchSite === "same-site") return true;
  const origin = request.headers.get("origin");
  return origin !== null && origin !== new URL(appConfig.app.url).origin;
}

// The app's own responses: no framing (clickjacking), no type sniffing,
// and HTTPS only once a browser has seen it over HTTPS.
function withSecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  for (const [name, value] of Object.entries(appConfig.security.headers)) {
    response.headers.set(name, value);
  }
  const protocol = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  if (protocol === "https") response.headers.set("Strict-Transport-Security", appConfig.security.hsts);
  return response;
}

// The dashboard, and a conversion's page: "/<conversion id>".
function isProtectedPage(pathname: string): boolean {
  if (appConfig.app.protectedPaths.includes(pathname)) return true;
  const segment = pathname.slice(1);
  return !segment.includes("/") && appConfig.conversion.publicIdPattern.test(segment);
}
