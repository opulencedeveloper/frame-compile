import Joi from "joi";
import config from "../config";
import { BaseValidator } from "../utils/validator";
import { ConversionListFilter } from "./enum";
import {
  IConversionListQuery,
  IConversionParams,
  ICreateConversionInput,
  IPreviewParams,
} from "./interface";

class ConversionValidator extends BaseValidator {
  private publicIdField = Joi.string().pattern(config.conversion.publicIdPattern).required().messages({
    "string.pattern.base": "Conversion not found",
    "any.required": "Conversion not found",
  });

  // People paste "your-site.framer.website" as often as a full URL, so a
  // missing scheme means https. The capture checks the address again before
  // fetching it, against the IP it actually connects to.
  private siteUrlField = Joi.string()
    .trim()
    .max(2048)
    .required()
    .custom((value: string, helpers) => {
      const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;
      if (!URL.canParse(withScheme)) return helpers.error("string.uri");

      const url = new URL(withScheme);
      const isWebUrl = url.protocol === "https:" || url.protocol === "http:";
      if (!isWebUrl || url.username || url.password || !url.hostname.includes(".")) {
        return helpers.error("string.uri");
      }
      url.hash = "";
      return url.href;
    })
    .messages({
      "string.empty": "Enter your Framer site's URL",
      "string.max": "That URL is too long",
      "string.uri": "Enter the address of a published Framer site, e.g. your-site.framer.website",
      "any.required": "Enter your Framer site's URL",
    });

  // Path segments must not climb out of the site's directories.
  private pathSegmentField = Joi.string()
    .max(1024)
    .invalid(".", "..")
    .pattern(/^[^/\\\0]+$/);

  private createConversionSchema = Joi.object<ICreateConversionInput>({
    url: this.siteUrlField,
  });

  private conversionParamsSchema = Joi.object<IConversionParams>({
    id: this.publicIdField,
  });

  // Newest first, a page at a time: `before` is the previous page's
  // nextCursor.
  private conversionListQuerySchema = Joi.object<IConversionListQuery>({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(config.conversion.listMaxLimit)
      .default(config.conversion.listDefaultLimit),
    before: Joi.date().iso().optional(),
    filter: Joi.string()
      .valid(...Object.values(ConversionListFilter))
      .default(ConversionListFilter.All),
    search: Joi.string().trim().max(config.conversion.searchMaxLength).allow("").optional(),
  });

  private previewParamsSchema = Joi.object<IPreviewParams>({
    id: this.publicIdField,
    path: Joi.array().items(this.pathSegmentField).max(64).optional(),
  });

  validateCreateConversion(data: unknown) {
    return this.validate(this.createConversionSchema, data);
  }

  validateConversionParams(data: unknown) {
    return this.validate(this.conversionParamsSchema, data);
  }

  validateConversionListQuery(data: unknown) {
    return this.validate(this.conversionListQuerySchema, data);
  }

  validatePreviewParams(data: unknown) {
    return this.validate(this.previewParamsSchema, data);
  }
}

export const conversionValidator = new ConversionValidator();
