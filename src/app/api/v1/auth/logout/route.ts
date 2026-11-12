import { utils } from "@/lib/server/utils";
import { authController } from "@/lib/server/auth/controller";

async function handler() {
  return authController.logout();
}

export const POST = utils.withErrorHandling(handler);
