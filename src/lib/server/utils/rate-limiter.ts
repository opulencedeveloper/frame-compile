import { NextRequest } from "next/server";
import config from "../config";
import { utils } from "./index";
import { MessageResponse, RateLimitBucket } from "./enum";
import { RateLimitCheck, RateLimitWindow } from "./interface";

// Fixed-window request limits, in memory. Per server: with several servers
// each allows the limit, which still stops brute force and floods.
class RateLimiter {
  private readonly windows = new Map<string, RateLimitWindow>();

  // Counts a request from this client (its address) against a bucket.
  public byClient(req: NextRequest, bucket: RateLimitBucket): RateLimitCheck {
    return this.take(bucket, this.clientAddress(req));
  }

  // Counts a request against a bucket for one account or user.
  public take(bucket: RateLimitBucket, key: string): RateLimitCheck {
    const { limit, windowMs } = config.security.rateLimits[bucket];
    const id = `${bucket}:${key}`;
    const now = Date.now();

    let window = this.windows.get(id);
    if (!window || window.resetAt <= now) {
      window = { count: 0, resetAt: now + windowMs };
      this.windows.delete(id);
      this.windows.set(id, window);
      this.evictOldest();
    }
    window.count += 1;
    if (window.count <= limit) return { valid: true };

    const retryAfterSeconds = Math.ceil((window.resetAt - now) / 1000);
    const response = utils.customResponse({
      status: 429,
      message: MessageResponse.Error,
      description: "Too many attempts. Please wait a few minutes and try again.",
      data: { retryAfterSeconds },
    });
    response.headers.set("Retry-After", String(retryAfterSeconds));
    return { valid: false, response };
  }

  // The address the request came from. Hosting proxies (Railway, Render)
  // append it to X-Forwarded-For, so the last entry is the one they saw;
  // earlier entries come from the client and can't be trusted.
  private clientAddress(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean);
    return forwarded?.at(-1) ?? req.headers.get("x-real-ip") ?? "unknown";
  }

  // Map iteration follows insertion order, so the first keys are oldest.
  private evictOldest() {
    const excess = this.windows.size - config.security.maxTrackedKeys;
    if (excess <= 0) return;
    const keys = this.windows.keys();
    for (let index = 0; index < excess; index++) this.windows.delete(keys.next().value!);
  }
}

export const rateLimiter = new RateLimiter();
