import { NextRequest } from "next/server";
import { utils } from "@/lib/server/utils";
import { rateLimiter } from "@/lib/server/utils/rate-limiter";
import { CookieNames, RateLimitBucket } from "@/lib/server/utils/enum";
import { connectDB } from "@/lib/server/utils/db";
import { authValidator } from "@/lib/server/auth/validator";
import { authController } from "@/lib/server/auth/controller";

// Google One Tap on the public pages: GET before showing the prompt (a
// nonce and the client ID), POST with the credential Google returns.
async function startHandler(req: NextRequest) {
  const limit = rateLimiter.byClient(req, RateLimitBucket.GoogleOneTap);
  if (!limit.valid) return limit.response;

  return authController.googleOneTapStart();
}

async function verifyHandler(req: NextRequest) {
  const limit = rateLimiter.byClient(req, RateLimitBucket.GoogleOneTap);
  if (!limit.valid) return limit.response;

  const validation = authValidator.validateGoogleOneTap(await utils.parseJsonBody(req));
  if (!validation.valid) return validation.response;

  await connectDB();

  return authController.googleOneTap(validation.value, req.cookies.get(CookieNames.GoogleOneTapNonce)?.value);
}

export const GET = utils.withErrorHandling(startHandler);
export const POST = utils.withErrorHandling(verifyHandler);
