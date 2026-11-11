import { unstable_rethrow } from "next/navigation";
import { after, NextRequest, NextResponse } from "next/server";
import { MessageResponse } from "./enum";
import { CustomHttpResponse, Handler } from "./interface";
import { logger } from "./logger";

class Utils {
  public customResponse<T>({
    status,
    message,
    description,
    data,
  }: CustomHttpResponse<T>) {
    return NextResponse.json({ message, description, data }, { status });
  }

  // `onError` lets browser-facing routes (e.g. OAuth callbacks) redirect
  // instead of returning JSON the user would see as a raw page.
  // The route context (dynamic `params`) is passed through to the handler.
  public withErrorHandling<C>(handler: Handler<C>, onError?: () => Response) {
    return async (req: NextRequest, context: C) => {
      try {
        return await handler(req, context);
      } catch (error) {
        // Let Next.js handle its own control-flow signals (prerender bailouts,
        // redirect(), notFound()) instead of reporting them as failures.
        unstable_rethrow(error);

        logger.error("Unhandled route error", error, {
          method: req.method,
          path: req.nextUrl.pathname,
        });

        if (onError) return onError();

        return this.customResponse({
          status: 500,
          message: MessageResponse.Error,
          description: "Internal server error",
          data: null,
        });
      }
    };
  }

  // The background counterpart of withErrorHandling. Work scheduled with
  // after() runs once the response has been sent, so no route can catch
  // its errors: they are logged and handed to `onError` (e.g. to record
  // that a job failed).
  public runInBackground(task: () => Promise<void>, onError: (error: unknown) => Promise<void>) {
    after(async () => {
      try {
        await task();
      } catch (error) {
        logger.error("Background task failed", error);
        await onError(error).catch((handlerError: unknown) =>
          logger.error("Background task error handler failed", handlerError),
        );
      }
    });
  }

  // Malformed JSON becomes null, so the validator answers with a 400
  // instead of the parse error surfacing as a 500.
  public async parseJsonBody(req: NextRequest): Promise<unknown> {
    return req.json().catch(() => null);
  }

  // Only same-origin relative paths: blocks open redirects such as
  // "//evil.com" or "/\evil.com", which browsers treat as absolute URLs.
  public getSafeRedirectPath(path: string | null | undefined, fallback = "/") {
    if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
      return fallback;
    }
    return path;
  }
}

export const utils = new Utils();
