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

  // Signed-out visitors are sent to sign in before a dashboard page loads,
  // rather than after its first API call fails. Signing in returns them to
  // the page they asked for.
  if (isProtectedPage(pathname)) {
    const userId = await auth.sessionUserId(request.cookies.get(CookieNames.UserAuthToken)?.value);
    if (!userId) {
      const signIn = new URL(appConfig.app.signInPath, request.url);
      signIn.searchParams.set(appConfig.app.redirectToParam, `${pathname}${search}`);
      return NextResponse.redirect(signIn);
    }
  }

  return NextResponse.next();
}

// The dashboard, and a conversion's page: "/<conversion id>".
function isProtectedPage(pathname: string): boolean {
  if (appConfig.app.protectedPaths.includes(pathname)) return true;
  const segment = pathname.slice(1);
  return !segment.includes("/") && appConfig.conversion.publicIdPattern.test(segment);
}
