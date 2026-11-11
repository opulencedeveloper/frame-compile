import { NextRequest } from "next/server";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { AuthErrorCode, CookieNames } from "@/lib/server/utils/enum";
import { authController } from "@/lib/server/auth/controller";
import { authValidator } from "@/lib/server/auth/validator";

const redirectWithFailure = () =>
  authController.authErrorRedirect(AuthErrorCode.GoogleAuthFailed);

async function handler(req: NextRequest) {
  const validation = authValidator.validateGoogleAuthCallback(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!validation.valid) return redirectWithFailure();

  await connectDB();

  return authController.googleAuthCallback(
    validation.value,
    req.cookies.get(CookieNames.GoogleOAuthState)?.value,
  );
}

export const GET = utils.withErrorHandling(handler, redirectWithFailure);
