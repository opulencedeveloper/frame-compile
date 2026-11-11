import { NextRequest } from "next/server";
import { utils } from "@/lib/server/utils";
import { auth } from "@/lib/server/utils/auth";
import { connectDB } from "@/lib/server/utils/db";
import { conversionValidator } from "@/lib/server/conversion/validator";
import { conversionController } from "@/lib/server/conversion/controller";

// Loaded by an <img> on the dashboard: the session cookie authenticates it.
async function handler(req: NextRequest, { params }: RouteContext<"/api/v1/conversions/[id]/thumbnail">) {
  const session = await auth.requireSession(req);
  if (!session.valid) return session.response;

  const validation = conversionValidator.validateConversionParams(await params);
  if (!validation.valid) return validation.response;

  await connectDB();

  return conversionController.thumbnail(session.value.userId, validation.value);
}

export const GET = utils.withErrorHandling(handler);
