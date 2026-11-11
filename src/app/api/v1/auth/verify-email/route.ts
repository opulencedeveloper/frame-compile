import { NextRequest } from "next/server";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { authValidator } from "@/lib/server/auth/validator";
import { authController } from "@/lib/server/auth/controller";

async function handler(req: NextRequest) {
  const validation = authValidator.validateVerifyEmail(await utils.parseJsonBody(req));
  if (!validation.valid) return validation.response;

  await connectDB();

  return authController.verifyEmail(validation.value);
}

export const POST = utils.withErrorHandling(handler);
