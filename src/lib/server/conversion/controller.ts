import config from "../config";
import { utils } from "../utils";
import { MessageResponse } from "../utils/enum";
import { previewHost } from "../utils/preview-host";
import { github } from "../utils/github";
import { logger } from "../utils/logger";
import { ConversionStatus } from "./enum";
import {
  IConversionListDto,
  IConversionListQuery,
  IConversionParams,
  ICreateConversionInput,
  IPreviewParams,
} from "./interface";
import { deploymentService } from "../deployment/service";
import { previewService } from "./preview";
import { conversionService } from "./service";

class ConversionController {
  // Answers at once with the queued conversion; the work runs after the
  // response, and the client polls `get` until it is ready or failed.
  public async create(userId: string, { url }: ICreateConversionInput) {
    const active = await conversionService.countActiveConversions(userId);
    if (active >= config.conversion.maxActivePerUser) {
      return utils.customResponse({
        status: 429,
        message: MessageResponse.Error,
        description: "You already have a conversion in progress. Wait for it to finish.",
        data: null,
      });
    }

    const conversion = await conversionService.createConversion(userId, url);
    utils.runInBackground(
      () => conversionService.process(conversion.publicId),
      (error) => conversionService.markFailed(conversion.publicId, error),
    );

    return utils.customResponse({
      status: 202,
      message: MessageResponse.Success,
      description: "Conversion started.",
      data: conversionService.toDto(conversion),
    });
  }

  public async list(userId: string, query: IConversionListQuery) {
    const { conversions, nextCursor, counts } = await conversionService.listUserConversions(userId, query);
    // Deployments still building are brought up to date.
    const fresh = await Promise.all(conversions.map((conversion) => deploymentService.refresh(conversion)));
    const data: IConversionListDto = {
      conversions: fresh.map((conversion) => conversionService.toDto(conversion)),
      counts,
      nextCursor,
    };
    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "Conversions found.",
      data,
    });
  }

  // Only the user who started a conversion can see it.
  public async get(userId: string, { id }: IConversionParams) {
    const conversion = await conversionService.findUserConversion(userId, id);
    if (!conversion) return this.notFound();

    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "Conversion found.",
      data: conversionService.toDto(await deploymentService.refresh(conversion)),
    });
  }

  // The project as a zip, streamed from its repository.
  public async download(userId: string, { id }: IConversionParams) {
    const conversion = await conversionService.findUserConversion(userId, id);
    if (!conversion?.repository || conversion.status !== ConversionStatus.Ready) return this.notFound();

    // "samuelologwu.framer.website-nextjs": the zip, and the folder in it.
    const name = `${new URL(conversion.sourceUrl).hostname.replace(/[^a-z0-9.-]/gi, "-")}${config.conversion.downloadSuffix}`;
    const archive = await github.archive(conversion.repository, conversion.repository.commitSha, name);
    const fileName = `${name}.zip`;
    return new Response(archive, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  // Removes the conversion and its repository. A running conversion can't
  // be deleted: it would recreate its repository when it finishes.
  public async remove(userId: string, { id }: IConversionParams) {
    const conversion = await conversionService.findUserConversion(userId, id);
    if (!conversion) return this.notFound();
    if (conversionService.isInProgress(conversion) || deploymentService.isInProgress(conversion)) {
      return utils.customResponse({
        status: 409,
        message: MessageResponse.Error,
        description: "This site is still converting or deploying. Delete it once that has finished.",
        data: null,
      });
    }

    if (conversion.repository) {
      const isDeleted = await github.deleteRepository(conversion.repository);
      // The record goes either way; the repository is logged to remove by hand.
      if (!isDeleted) {
        logger.warn("Repository not deleted: the GitHub token lacks permission", {
          repository: `${conversion.repository.owner}/${conversion.repository.name}`,
        });
      }
    }
    await conversionService.deleteConversion(conversion);

    return utils.customResponse({
      status: 200,
      message: MessageResponse.Success,
      description: "Conversion deleted.",
      data: null,
    });
  }

  private notFound() {
    return utils.customResponse({
      status: 404,
      message: MessageResponse.Error,
      description: "Conversion not found.",
      data: null,
    });
  }

  // Served only on the conversion's own preview host. On the app's host
  // the site's scripts would run with the app's origin, and could call the
  // API as whoever is signed in.
  public async preview({ id, path = [] }: IPreviewParams, hostHeader: string | null) {
    if (previewHost.publicIdFromHost(hostHeader) !== id) return this.previewNotFound();

    const file = await previewService.getFile(id, path);
    if (!file) return this.previewNotFound();

    // A view of the cached bytes, not a copy. They were read from a fetch
    // response, so they sit in a plain ArrayBuffer.
    const body = new Uint8Array(
      file.body.buffer as ArrayBuffer,
      file.body.byteOffset,
      file.body.byteLength,
    );
    return new Response(body, {
      status: file.status,
      headers: {
        ...this.previewHeaders(),
        "Content-Type": file.contentType,
        "Cache-Control": file.isImmutable
          ? config.preview.assetCacheControl
          : config.preview.pageCacheControl,
      },
    });
  }

  private previewNotFound() {
    return new Response("Not found", {
      status: 404,
      headers: { ...this.previewHeaders(), "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Previews stay out of search results (they duplicate the user's site)
  // and can only be framed by the app.
  private previewHeaders(): Record<string, string> {
    return {
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": `frame-ancestors ${new URL(config.app.url).origin}`,
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };
  }
}

export const conversionController = new ConversionController();
