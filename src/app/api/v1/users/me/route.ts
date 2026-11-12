import { NextRequest } from "next/server";
import { utils } from "@/lib/server/utils";
import { auth } from "@/lib/server/utils/auth";
import { connectDB } from "@/lib/server/utils/db";
import { userController } from "@/lib/server/user/controller";

async function handler(req: NextRequest) {
  const session = await auth.requireSession(req);
  if (!session.valid) return session.response;

  await connectDB();

  return userController.getProfile(session.value.userId);
}

export const GET = utils.withErrorHandling(handler);
