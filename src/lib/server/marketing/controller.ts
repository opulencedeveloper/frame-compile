import { utils } from "../utils";
import { auth } from "../utils/auth";
import { MessageResponse } from "../utils/enum";
import { userService } from "../user/service";
import { IUnsubscribeQuery } from "./interface";

class MarketingController {
  // Idempotent, and the same success whether or not the user was still
  // subscribed (or still exists): mail clients may retry one-click requests.
  public async unsubscribe({ token }: IUnsubscribeQuery) {
    const userId = await auth.verifyUnsubscribeToken(token);
    if (!userId) {
      return utils.customResponse({
        status: 400,
        message: MessageResponse.Error,
        description: "This unsubscribe link is invalid.",
        data: null,
      });
    }

    await userService.revokeMarketingConsent(userId);

    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "You've been unsubscribed from marketing emails.",
      data: null,
    });
  }
}

export const marketingController = new MarketingController();
