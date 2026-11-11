import config from "../config";
import { LogLevel } from "./enum";
import { LogMetadata } from "./interface";

class Logger {
  private format(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    error?: unknown,
  ) {
    let formatted = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;

    if (metadata && Object.keys(metadata).length > 0) {
      formatted += ` | Metadata: ${JSON.stringify(metadata)}`;
    }

    if (error instanceof Error) {
      formatted += ` | Error: ${error.message}`;
      if (!config.isProduction && error.stack) formatted += `\n${error.stack}`;
    } else if (error !== undefined) {
      formatted += ` | Error: ${String(error)}`;
    }

    return formatted;
  }

  info(message: string, metadata?: LogMetadata) {
    if (!config.isProduction) console.info(this.format(LogLevel.Info, message, metadata));
  }

  warn(message: string, metadata?: LogMetadata) {
    console.warn(this.format(LogLevel.Warn, message, metadata));
  }

  error(message: string, error?: unknown, metadata?: LogMetadata) {
    console.error(this.format(LogLevel.Error, message, metadata, error));
  }

  debug(message: string, metadata?: LogMetadata) {
    if (!config.isProduction) console.debug(this.format(LogLevel.Debug, message, metadata));
  }
}

export const logger = new Logger();
