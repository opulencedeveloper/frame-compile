import { NextRequest } from "next/server";
import { utils } from "@/lib/server/utils";
import { connectDB } from "@/lib/server/utils/db";
import { marketingValidator } from "@/lib/server/marketing/validator";
import { marketingController } from "@/lib/server/marketing/controller";

// POST only: a GET that unsubscribed would be triggered by link scanners
// and mail previews. The token is always in the query, since one-click
// requests (RFC 8058) post to the List-Unsubscribe URL with a fixed form
// body that carries nothing else.
async function handler(req: NextRequest) {
  const validation = marketingValidator.validateUnsubscribe(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!validation.valid) return validation.response;

  await connectDB();

  return marketingController.unsubscribe(validation.value);
}

export const POST = utils.withErrorHandling(handler);
