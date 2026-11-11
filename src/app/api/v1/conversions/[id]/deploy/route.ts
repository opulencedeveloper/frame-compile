import { NextRequest } from "next/server";
import { utils } from "@/lib/server/utils";
import { auth } from "@/lib/server/utils/auth";
import { connectDB } from "@/lib/server/utils/db";
import { conversionValidator } from "@/lib/server/conversion/validator";
import { deploymentValidator } from "@/lib/server/deployment/validator";
import { deploymentController } from "@/lib/server/deployment/controller";

async function handler(req: NextRequest, { params }: RouteContext<"/api/v1/conversions/[id]/deploy">) {
  const session = await auth.requireSession(req);
  if (!session.valid) return session.response;

  const paramsValidation = conversionValidator.validateConversionParams(await params);
  if (!paramsValidation.valid) return paramsValidation.response;

  const validation = deploymentValidator.validateDeploy(await utils.parseJsonBody(req));
  if (!validation.valid) return validation.response;

  await connectDB();

  return deploymentController.deploy(session.value.userId, paramsValidation.value, validation.value);
}

export const POST = utils.withErrorHandling(handler);
