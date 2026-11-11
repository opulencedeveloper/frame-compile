import { NextRequest } from "next/server";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { conversionValidator } from "@/lib/server/conversion/validator";
import { conversionController } from "@/lib/server/conversion/controller";

// Reached through src/proxy.ts, which rewrites every request to a preview
// host ("<id>.<PREVIEW_HOST>") here. Public: a preview is shared by its URL.
async function handler(req: NextRequest, { params }: RouteContext<"/api/v1/previews/[id]/[[...path]]">) {
  const validation = conversionValidator.validatePreviewParams(await params);
  if (!validation.valid) return validation.response;

  await connectDB();

  return conversionController.preview(validation.value, req.headers.get("host"));
}

export const GET = utils.withErrorHandling(handler);
