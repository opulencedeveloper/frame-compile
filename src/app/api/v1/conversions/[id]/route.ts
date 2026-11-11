import { NextRequest } from "next/server";
import { utils } from "@/lib/server/utils";
import { auth } from "@/lib/server/utils/auth";
import { connectDB } from "@/lib/server/utils/db";
import { conversionValidator } from "@/lib/server/conversion/validator";
import { conversionController } from "@/lib/server/conversion/controller";

async function getHandler(req: NextRequest, { params }: RouteContext<"/api/v1/conversions/[id]">) {
  const session = await auth.requireSession(req);
  if (!session.valid) return session.response;

  const validation = conversionValidator.validateConversionParams(await params);
  if (!validation.valid) return validation.response;

  await connectDB();

  return conversionController.get(session.value.userId, validation.value);
}

async function deleteHandler(req: NextRequest, { params }: RouteContext<"/api/v1/conversions/[id]">) {
  const session = await auth.requireSession(req);
  if (!session.valid) return session.response;

  const validation = conversionValidator.validateConversionParams(await params);
  if (!validation.valid) return validation.response;

  await connectDB();

  return conversionController.remove(session.value.userId, validation.value);
}

export const GET = utils.withErrorHandling(getHandler);
export const DELETE = utils.withErrorHandling(deleteHandler);
