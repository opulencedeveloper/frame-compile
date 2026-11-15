import { NextRequest } from "next/server";
import { utils } from "@/lib/server/utils";
import { rateLimiter } from "@/lib/server/utils/rate-limiter";
import { RateLimitBucket } from "@/lib/server/utils/enum";
import { auth } from "@/lib/server/utils/auth";
import { connectDB } from "@/lib/server/utils/db";
import { deploymentValidator } from "@/lib/server/deployment/validator";
import { deploymentController } from "@/lib/server/deployment/controller";

async function getHandler(req: NextRequest) {
  const session = await auth.requireSession(req);
  if (!session.valid) return session.response;

  await connectDB();

  return deploymentController.getVercel(session.value.userId);
}

async function connectHandler(req: NextRequest) {
  const session = await auth.requireSession(req);
  if (!session.valid) return session.response;

  const limit = rateLimiter.take(RateLimitBucket.ConnectVercel, session.value.userId);
  if (!limit.valid) return limit.response;

  const validation = deploymentValidator.validateConnectVercel(await utils.parseJsonBody(req));
  if (!validation.valid) return validation.response;

  await connectDB();

  return deploymentController.connectVercel(session.value.userId, validation.value);
}

async function disconnectHandler(req: NextRequest) {
  const session = await auth.requireSession(req);
  if (!session.valid) return session.response;

  await connectDB();

  return deploymentController.disconnectVercel(session.value.userId);
}

export const GET = utils.withErrorHandling(getHandler);
export const POST = utils.withErrorHandling(connectHandler);
export const DELETE = utils.withErrorHandling(disconnectHandler);
