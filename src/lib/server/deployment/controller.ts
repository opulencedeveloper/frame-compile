import { conversionService } from "../conversion/service";
import { IConversionParams } from "../conversion/interface";
import { ConversionStatus } from "../conversion/enum";
import { userService } from "../user/service";
import { utils } from "../utils";
import { MessageResponse } from "../utils/enum";
import { VercelError } from "../utils/vercel";
import { IConnectVercelInput, IDeployInput } from "./interface";
import { deploymentService } from "./service";

class DeploymentController {
  // The accounts the saved token can deploy to, or null data when the user
  // hasn't connected Vercel or the token no longer works.
  public async getVercel(userId: string) {
    const token = await deploymentService.vercelToken(userId);
    // A revoked token: the user is asked for a new one.
    const connection = token
      ? await deploymentService.vercelAccounts(token).catch((error: unknown) => {
          if (error instanceof VercelError && error.isInvalidToken) return null;
          throw error;
        })
      : null;

    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: connection ? "Vercel is connected." : "Vercel isn't connected.",
      data: connection,
    });
  }

  // Checks the token with Vercel before saving it.
  public async connectVercel(userId: string, { token }: IConnectVercelInput) {
    // Vercel's own answers are shown as messages, not as server errors.
    const checked = await deploymentService
      .vercelAccounts(token)
      .then((connection) => ({ connection, error: null }))
      .catch((error: unknown) => {
        if (!(error instanceof VercelError)) throw error;
        return { connection: null, error };
      });
    if (!checked.connection) {
      return this.error(
        400,
        checked.error?.isInvalidToken
          ? "Vercel didn't accept that token. Check it and try again."
          : `Vercel couldn't check that token: ${checked.error?.message}`,
      );
    }
    const { connection } = checked;

    await deploymentService.saveVercelToken(userId, token, connection.username);
    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "Vercel is connected.",
      data: connection,
    });
  }

  public async disconnectVercel(userId: string) {
    await userService.removeVercelConnection(userId);
    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "Vercel is disconnected.",
      data: null,
    });
  }

  // Answers at once; the upload runs after the response, and the client
  // follows the deployment through the conversion's status.
  public async deploy(userId: string, { id }: IConversionParams, { teamId }: IDeployInput) {
    const conversion = await conversionService.findUserConversion(userId, id);
    if (!conversion?.repository || conversion.status !== ConversionStatus.Ready) {
      return this.error(404, "Conversion not found.");
    }

    const token = await deploymentService.vercelToken(userId);
    if (!token) return this.error(400, "Connect Vercel before deploying.");

    // Vercel's refusals (a token that may not create projects) are shown in
    // the modal straight away, before anything is uploaded.
    const started = await deploymentService
      .start(conversion, token, teamId)
      .then((claimed) => ({ claimed, error: null }))
      .catch((error: unknown) => {
        if (!(error instanceof VercelError)) throw error;
        return { claimed: null, error };
      });
    if (started.error) return this.error(400, deploymentService.messageFor(started.error));
    const { claimed } = started;
    if (!claimed) return this.error(409, "This site is already being deployed.");

    utils.runInBackground(
      () => deploymentService.upload(claimed.id, token),
      (error) => deploymentService.markFailed(claimed.id, error),
    );

    return utils.customResponse({
      status: 202,
      message: MessageResponse.Success,
      description: "Deployment started.",
      data: conversionService.toDto(claimed),
    });
  }

  private error(status: number, description: string) {
    return utils.customResponse({ status, message: MessageResponse.Error, description, data: null });
  }
}

export const deploymentController = new DeploymentController();
