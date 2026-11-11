import dns from "node:dns";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { Agent, fetch, type Response } from "undici";
import config from "../config";
import { FetchFailureReason } from "./enum";
import { FetchFailure, FetchResult, SafeFetchOptions } from "./interface";

class BlockedAddressError extends Error {
  constructor(hostname: string) {
    super(`Refused to connect to non-public address for ${hostname}`);
  }
}

// Fetches URLs supplied by users. Every connection is checked against the
// IP it actually connects to, inside the DNS lookup the socket uses, so a
// hostname can't pass a check with one address and then connect to another
// (DNS rebinding). Each redirect hop is checked again.
class SafeFetcher {
  private readonly blockList = this.createBlockList();

  private readonly dispatcher = new Agent({
    connect: {
      lookup: (hostname, options, callback) =>
        this.lookup(hostname, options, callback),
    },
  });

  // Transient failures (timeouts, dropped connections, 429 and 5xx) are
  // retried with exponential backoff: a crawl makes thousands of requests,
  // and a CDN stalling on one of them must not lose that file.
  public async get(
    input: string | URL,
    options: SafeFetchOptions = {},
  ): Promise<FetchResult> {
    const { attempts, baseDelayMs } = config.outboundFetch.retry;
    for (let attempt = 1; ; attempt++) {
      const result = await this.getOnce(input, options);
      if (result.ok || attempt >= attempts || !this.isTransient(result)) return result;
      await delay(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  private isTransient(failure: FetchFailure): boolean {
    if (
      failure.reason === FetchFailureReason.Timeout ||
      failure.reason === FetchFailureReason.NetworkError
    ) {
      return true;
    }
    const status = failure.status;
    return (
      failure.reason === FetchFailureReason.HttpError &&
      status !== undefined &&
      (status >= 500 || config.outboundFetch.retry.clientStatuses.includes(status))
    );
  }

  private async getOnce(input: string | URL, options: SafeFetchOptions): Promise<FetchResult> {
    let url = this.parseUrl(input);
    if (!url) return this.failure(null, FetchFailureReason.InvalidUrl);

    const signal = AbortSignal.timeout(config.outboundFetch.timeoutMs);

    for (let hop = 0; hop <= config.outboundFetch.maxRedirects; hop++) {
      if (!this.isAllowedUrl(url)) {
        return this.failure(url, FetchFailureReason.BlockedAddress);
      }

      const response = await this.request(url, signal, options.accept);
      if (typeof response === "string") return this.failure(url, response);

      if (config.outboundFetch.redirectStatuses.includes(response.status)) {
        await response.body?.cancel();
        const next = this.parseUrl(response.headers.get("location") ?? "", url);
        if (!next) {
          return this.failure(url, FetchFailureReason.HttpError, response.status);
        }
        url = next;
        continue;
      }

      if (response.status >= 400 && !options.acceptErrorStatus) {
        await response.body?.cancel();
        return this.failure(url, FetchFailureReason.HttpError, response.status);
      }

      const body = await this.readBody(response);
      if (!Buffer.isBuffer(body)) return this.failure(url, body);

      return {
        ok: true,
        url,
        status: response.status,
        contentType: response.headers.get("content-type") ?? "",
        body,
      };
    }

    return this.failure(url, FetchFailureReason.TooManyRedirects);
  }

  // Returns the failure reason instead of throwing: one unreachable file
  // must not abort a conversion that fetches thousands.
  private async request(
    url: URL,
    signal: AbortSignal,
    accept = config.outboundFetch.defaultAccept,
  ): Promise<Response | FetchFailureReason> {
    try {
      return await fetch(url, {
        dispatcher: this.dispatcher,
        redirect: "manual",
        signal,
        headers: {
          "user-agent": config.outboundFetch.userAgent,
          accept,
        },
      });
    } catch (error) {
      return this.reasonFor(error);
    }
  }

  // Streams the body so an oversized response is cut off rather than
  // buffered whole. Returns the failure reason instead of throwing.
  private async readBody(response: Response): Promise<Buffer | FetchFailureReason> {
    const limit = config.outboundFetch.maxResponseBytes;
    const declared = Number(response.headers.get("content-length"));
    if (declared > limit) {
      await response.body?.cancel();
      return FetchFailureReason.TooLarge;
    }
    if (!response.body) return Buffer.alloc(0);

    const chunks: Buffer[] = [];
    let size = 0;
    try {
      for await (const chunk of response.body) {
        size += chunk.byteLength;
        if (size > limit) {
          await response.body.cancel();
          return FetchFailureReason.TooLarge;
        }
        chunks.push(Buffer.from(chunk));
      }
    } catch (error) {
      return this.reasonFor(error);
    }
    return Buffer.concat(chunks, size);
  }

  private parseUrl(input: string | URL, base?: URL): URL | null {
    if (!URL.canParse(input, base)) return null;
    const url = new URL(input, base);
    url.hash = "";
    return url;
  }

  // Default ports only: Framer sites are always on 80/443, and refusing
  // others keeps a public hostname from being aimed at an internal service.
  private isAllowedUrl(url: URL): boolean {
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (url.port !== "" || url.username || url.password) return false;

    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    if (net.isIP(hostname)) return !this.isBlockedIp(hostname);
    return hostname.includes(".");
  }

  private lookup(
    hostname: string,
    options: dns.LookupOptions,
    callback: (
      error: NodeJS.ErrnoException | null,
      address: string | dns.LookupAddress[],
      family?: number,
    ) => void,
  ) {
    dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
      if (error) return callback(error, "");

      // Refuse the host outright if any of its addresses is private, rather
      // than picking a public one: the socket may fall back to the others.
      if (
        addresses.length === 0 ||
        addresses.some(({ address }) => this.isBlockedIp(address))
      ) {
        return callback(new BlockedAddressError(hostname), "");
      }

      if (options.all) return callback(null, addresses);
      callback(null, addresses[0].address, addresses[0].family);
    });
  }

  private isBlockedIp(address: string): boolean {
    const mappedV4 = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1];
    if (mappedV4) return this.blockList.check(mappedV4, "ipv4");
    return this.blockList.check(address, net.isIPv6(address) ? "ipv6" : "ipv4");
  }

  private createBlockList(): net.BlockList {
    const list = new net.BlockList();
    const v4: [string, number][] = [
      ["0.0.0.0", 8],
      ["10.0.0.0", 8],
      ["100.64.0.0", 10],
      ["127.0.0.0", 8],
      ["169.254.0.0", 16],
      ["172.16.0.0", 12],
      ["192.0.0.0", 24],
      ["192.0.2.0", 24],
      ["192.88.99.0", 24],
      ["192.168.0.0", 16],
      ["198.18.0.0", 15],
      ["198.51.100.0", 24],
      ["203.0.113.0", 24],
      ["224.0.0.0", 4],
      ["240.0.0.0", 4],
    ];
    const v6: [string, number][] = [
      ["::", 128],
      ["::1", 128],
      // IPv4-mapped addresses (::ffff:0:0/96) are deliberately absent: Node
      // matches them against the IPv4 rules above, and listing the range
      // here would block every IPv4 address.
      ["64:ff9b::", 96],
      ["64:ff9b:1::", 48],
      ["100::", 64],
      ["2001::", 23],
      ["2001:db8::", 32],
      ["2002::", 16],
      ["fc00::", 7],
      ["fe80::", 10],
      ["ff00::", 8],
    ];
    for (const [network, prefix] of v4) list.addSubnet(network, prefix, "ipv4");
    for (const [network, prefix] of v6) list.addSubnet(network, prefix, "ipv6");
    return list;
  }

  private reasonFor(error: unknown): FetchFailureReason {
    if (error instanceof Error) {
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        return FetchFailureReason.Timeout;
      }
      if (error.cause instanceof BlockedAddressError) {
        return FetchFailureReason.BlockedAddress;
      }
    }
    return FetchFailureReason.NetworkError;
  }

  private failure(
    url: URL | null,
    reason: FetchFailureReason,
    status?: number,
  ): FetchFailure {
    return { ok: false, url, reason, status };
  }
}

export const safeFetch = new SafeFetcher();
