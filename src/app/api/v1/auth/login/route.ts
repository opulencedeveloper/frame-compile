import { NextRequest } from "next/server";
import { utils } from "@/lib/server/utils";
import { rateLimiter } from "@/lib/server/utils/rate-limiter";
import { RateLimitBucket } from "@/lib/server/utils/enum";
import { connectDB } from "@/lib/server/utils/db";
import { authValidator } from "@/lib/server/auth/validator";
import { authController } from "@/lib/server/auth/controller";

async function handler(req: NextRequest) {
  const limit = rateLimiter.byClient(req, RateLimitBucket.Login);
  if (!limit.valid) return limit.response;

  const validation = authValidator.validateLogin(await utils.parseJsonBody(req));
  if (!validation.valid) return validation.response;

  // Per account too, so guesses spread over many addresses still stop.
  const accountLimit = rateLimiter.take(RateLimitBucket.LoginAccount, validation.value.email.toLowerCase());
  if (!accountLimit.valid) return accountLimit.response;

  await connectDB();

  return authController.login(validation.value);
}

export const POST = utils.withErrorHandling(handler);
