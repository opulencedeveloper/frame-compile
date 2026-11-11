import Joi from "joi";
import { BaseValidator } from "../utils/validator";
import { IUnsubscribeQuery } from "./interface";

class MarketingValidator extends BaseValidator {
  private unsubscribeSchema = Joi.object<IUnsubscribeQuery>({
    token: Joi.string().max(2048).required().messages({
      "string.empty": "This unsubscribe link is invalid.",
      "any.required": "This unsubscribe link is invalid.",
    }),
  });

  validateUnsubscribe(data: unknown) {
    return this.validate(this.unsubscribeSchema, data);
  }
}

export const marketingValidator = new MarketingValidator();
