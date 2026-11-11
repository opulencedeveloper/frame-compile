import { NextRequest } from "next/server";
import { utils } from "@/lib/server/utils";
import { authValidator } from "@/lib/server/auth/validator";
import { authController } from "@/lib/server/auth/controller";

async function handler(req: NextRequest) {
  const validation = authValidator.validateGoogleAuthStart(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!validation.valid) return validation.response;

  return authController.googleAuthStart(validation.value);
}

export const GET = utils.withErrorHandling(handler);
