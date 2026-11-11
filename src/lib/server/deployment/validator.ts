import Joi from "joi";
import { BaseValidator } from "../utils/validator";
import { IConnectVercelInput, IDeployInput } from "./interface";

class DeploymentValidator extends BaseValidator {
  private connectVercelSchema = Joi.object<IConnectVercelInput>({
    // Vercel tokens are short alphanumeric strings; this only keeps out
    // empty or absurd input before Vercel itself checks it.
    token: Joi.string().trim().min(8).max(200).pattern(/^[A-Za-z0-9_-]+$/).required().messages({
      "string.empty": "Paste your Vercel token",
      "any.required": "Paste your Vercel token",
      "string.min": "That doesn't look like a Vercel token",
      "string.max": "That doesn't look like a Vercel token",
      "string.pattern.base": "That doesn't look like a Vercel token",
    }),
  });

  private deploySchema = Joi.object<IDeployInput>({
    teamId: Joi.string().trim().max(100).allow(null).default(null),
  });

  validateConnectVercel(data: unknown) {
    return this.validate(this.connectVercelSchema, data);
  }

  validateDeploy(data: unknown) {
    return this.validate(this.deploySchema, data);
  }
}

export const deploymentValidator = new DeploymentValidator();
