import { NextRequest } from "next/server";
import { utils } from "@/lib/server/utils";
import { rateLimiter } from "@/lib/server/utils/rate-limiter";
import { RateLimitBucket } from "@/lib/server/utils/enum";
import { connectDB } from "@/lib/server/utils/db";
import { authValidator } from "@/lib/server/auth/validator";
import { authController } from "@/lib/server/auth/controller";

async function handler(req: NextRequest) {
  const limit = rateLimiter.byClient(req, RateLimitBucket.ResendOtp);
  if (!limit.valid) return limit.response;

  const validation = authValidator.validateResendOtp(await utils.parseJsonBody(req));
  if (!validation.valid) return validation.response;

  await connectDB();

  return authController.resendOtp(validation.value);
}

export const POST = utils.withErrorHandling(handler);
