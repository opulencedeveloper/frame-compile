import { utils } from "@/lib/server/utils";
import { MessageResponse } from "@/lib/server/utils/enum";

// For the host's health check (Railway, Render, docker compose): answers as long as
// the server is up. It doesn't touch the database, so a database blip
// doesn't get a healthy server restarted.
async function handler() {
  return utils.customResponse({
    status: 200,
    message: MessageResponse.Success,
    description: "OK",
    data: { status: "ok" },
  });
}

export const GET = utils.withErrorHandling(handler);
