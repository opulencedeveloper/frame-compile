import { ConversionErrorCode } from "./enum";

export class ConversionError extends Error {
  constructor(
    public readonly code: ConversionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ConversionError";
  }
}
