import { NextRequest } from "next/server";
import { utils } from "@/lib/server/utils";
import { auth } from "@/lib/server/utils/auth";
import { connectDB } from "@/lib/server/utils/db";
import { conversionValidator } from "@/lib/server/conversion/validator";
import { conversionController } from "@/lib/server/conversion/controller";

async function createHandler(req: NextRequest) {
  const session = await auth.requireSession(req);
  if (!session.valid) return session.response;

  const validation = conversionValidator.validateCreateConversion(await utils.parseJsonBody(req));
  if (!validation.valid) return validation.response;

  await connectDB();

  return conversionController.create(session.value.userId, validation.value);
}

export const POST = utils.withErrorHandling(createHandler);

async function listHandler(req: NextRequest) {
  const session = await auth.requireSession(req);
  if (!session.valid) return session.response;

  const validation = conversionValidator.validateConversionListQuery(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!validation.valid) return validation.response;

  await connectDB();

  return conversionController.list(session.value.userId, validation.value);
}

export const GET = utils.withErrorHandling(listHandler);
