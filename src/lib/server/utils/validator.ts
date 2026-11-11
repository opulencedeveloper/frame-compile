import Joi from "joi";
import { utils } from "./index";
import { MessageResponse } from "./enum";

export class BaseValidator {
  protected validate<T>(schema: Joi.ObjectSchema<T>, data: unknown) {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      // Missing or malformed bodies reach here as null (see parseJsonBody).
      messages: { "object.base": "Request body must be a JSON object" },
    });

    if (error) {
      return {
        valid: false as const,
        response: utils.customResponse({
          status: 400,
          message: MessageResponse.Error,
          description: error.details[0].message,
          data: error.details.map((detail) => ({
            field: detail.path[0],
            message: detail.message,
          })),
        }),
      };
    }

    return { valid: true as const, value };
  }
}
