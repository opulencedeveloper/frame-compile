import crypto from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import config from "../config";
import { siteCapture } from "../framer-to-nextjs/capture";
import framerConfig from "../framer-to-nextjs/config";
import { ConversionErrorCode } from "../framer-to-nextjs/enum";
import { ConversionError } from "../framer-to-nextjs/error";
import { ICaptureResult, IProjectResult } from "../framer-to-nextjs/interface";
import { nextProject } from "../framer-to-nextjs/project";
import { DirectorySnapshotSink } from "../framer-to-nextjs/sink";
import { GitHubError, github } from "../utils/github";
import { IGitHubRepository } from "../utils/interface";
import { logger } from "../utils/logger";
import { previewHost } from "../utils/preview-host";
import { TaskQueue } from "../utils/task-queue";
import Conversion from "./entity";
import { previewService } from "./preview";
import {
  ConversionFailureCode,
  ConversionListFilter,
  ConversionSource,
  ConversionStatus,
} from "./enum";
import {
  ConversionDocument,
  IConversionCounts,
  IConversionDto,
  IConversionListQuery,
  IConversionFailure,
  IConversionRepository,
  IFinishedCapture,
} from "./interface";

const IN_PROGRESS = [ConversionStatus.Queued, ConversionStatus.Capturing, ConversionStatus.Storing];

// Failures caused by what the user entered. The user sees the reason while
// waiting; nothing is kept, so they don't fill the list.
const INPUT_FAILURES = [
  ConversionFailureCode.InvalidUrl,
  ConversionFailureCode.SiteUnreachable,
  ConversionFailureCode.NotFramerSite,
];

// Conversions shown to the user: not ones waiting to be deleted.
const LISTED = { expireAt: { $exists: false } };

const FAILURE_FOR_CAPTURE_ERROR: Record<ConversionErrorCode, ConversionFailureCode> = {
  [ConversionErrorCode.InvalidUrl]: ConversionFailureCode.InvalidUrl,
  [ConversionErrorCode.SiteUnreachable]: ConversionFailureCode.SiteUnreachable,
  [ConversionErrorCode.NotFramerSite]: ConversionFailureCode.NotFramerSite,
};

class ConversionService {
  // Each conversion runs a headless browser: a few at a time per server.
  private readonly queue = new TaskQueue(config.conversion.maxConcurrent);
  // Conversions this server has queued or is running, kept alive by the
  // heartbeat while there are any.
  private readonly held = new Set<string>();
  private heartbeat: NodeJS.Timeout | null = null;

  async createConversion(userId: string, sourceUrl: string): Promise<ConversionDocument> {
    const conversion = await Conversion.create({
      publicId: this.createPublicId(),
      user: userId,
      source: ConversionSource.Framer,
      sourceUrl,
      status: ConversionStatus.Queued,
      heartbeatAt: new Date(),
    });
    logger.info("Conversion created", { conversionId: conversion.publicId, userId });
    return conversion;
  }

  // Conversions the user is waiting on. Ones whose server has gone don't
  // count, so they can't block the user.
  async countActiveConversions(userId: string): Promise<number> {
    const staleBefore = this.staleBefore();
    return Conversion.countDocuments({
      user: userId,
      status: { $in: IN_PROGRESS },
      $or: [
        { heartbeatAt: { $gt: staleBefore } },
        { heartbeatAt: { $exists: false }, createdAt: { $gt: staleBefore } },
      ],
    });
  }

  async findUserConversion(userId: string, publicId: string): Promise<ConversionDocument | null> {
    const conversion = await Conversion.findOne({ publicId, user: userId });
    return conversion && this.failIfStale(conversion);
  }

  // A page of the user's conversions, newest first: one extra is read to
  // know whether another page follows.
  async listUserConversions(userId: string, { limit, before, filter, search }: IConversionListQuery) {
    const found = await Conversion.find({
      user: userId,
      ...LISTED,
      ...(before && { createdAt: { $lt: before } }),
      ...(filter === ConversionListFilter.Deployed && { deployedAt: { $exists: true } }),
      ...(filter === ConversionListFilter.NotDeployed && { deployedAt: { $exists: false } }),
      ...(search && { sourceUrl: { $regex: this.escapeRegex(search), $options: "i" } }),
    })
      .sort({ createdAt: -1 })
      .limit(limit + 1);

    const page = await Promise.all(found.slice(0, limit).map((conversion) => this.failIfStale(conversion)));
    const hasMore = found.length > limit;
    return {
      conversions: page,
      nextCursor: hasMore ? page[page.length - 1].createdAt.toISOString() : null,
      counts: await this.countUserConversions(userId),
    };
  }

  async countUserConversions(userId: string): Promise<IConversionCounts> {
    const [all, deployed] = await Promise.all([
      Conversion.countDocuments({ user: userId, ...LISTED }),
      Conversion.countDocuments({ user: userId, ...LISTED, deployedAt: { $exists: true } }),
    ]);
    return { all, deployed, notDeployed: all - deployed };
  }

  async deleteConversion(conversion: ConversionDocument): Promise<void> {
    await Conversion.deleteOne({ _id: conversion._id });
    logger.info("Conversion deleted", { conversionId: conversion.publicId });
  }

  isInProgress(conversion: ConversionDocument): boolean {
    return IN_PROGRESS.includes(conversion.status);
  }

  // Waits for a free slot, then converts. Errors are left to the caller
  // (see utils.runInBackground), which records them with markFailed.
  async process(publicId: string): Promise<void> {
    this.hold(publicId);
    try {
      await this.queue.run(() => this.convert(publicId));
    } finally {
      this.release(publicId);
    }
  }

  private hold(publicId: string) {
    this.held.add(publicId);
    this.heartbeat ??= setInterval(() => this.beat(), config.conversion.heartbeatIntervalMs).unref();
  }

  private release(publicId: string) {
    this.held.delete(publicId);
    if (this.held.size > 0 || !this.heartbeat) return;
    clearInterval(this.heartbeat);
    this.heartbeat = null;
  }

  private beat() {
    Conversion.updateMany(
      { publicId: { $in: [...this.held] }, status: { $in: IN_PROGRESS } },
      { $set: { heartbeatAt: new Date() } },
    ).catch((error: unknown) => logger.warn("Conversion heartbeat failed", { error }));
  }

  async markFailed(publicId: string, error: unknown): Promise<void> {
    await this.saveFailure(publicId, this.failureFor(error));
  }

  private async saveFailure(publicId: string, failure: IConversionFailure) {
    const now = new Date();
    const expireAt = INPUT_FAILURES.includes(failure.code)
      ? new Date(now.getTime() + config.conversion.inputFailureRetentionMs)
      : undefined;
    await Conversion.updateOne(
      { publicId, status: { $in: IN_PROGRESS } },
      { $set: { status: ConversionStatus.Failed, failure, completedAt: now, ...(expireAt && { expireAt }) } },
    );
    logger.warn("Conversion failed", { conversionId: publicId, code: failure.code });
  }

  toDto(conversion: ConversionDocument): IConversionDto {
    const isReady = conversion.status === ConversionStatus.Ready;
    return {
      id: conversion.publicId,
      sourceUrl: conversion.sourceUrl,
      siteName: new URL(conversion.sourceUrl).hostname,
      status: conversion.status,
      failure: conversion.failure ?? null,
      previewUrl: isReady ? previewHost.urlFor(conversion.publicId) : null,
      thumbnailUrl:
        isReady && conversion.thumbnailPath
          ? `${config.conversion.apiPath}/${conversion.publicId}/thumbnail`
          : null,
      summary: conversion.summary ?? null,
      deployment: conversion.deployment
        ? {
            provider: conversion.deployment.provider,
            status: conversion.deployment.status,
            url: conversion.deployment.url ?? null,
            error: conversion.deployment.error ?? null,
            projectName: conversion.deployment.projectName,
          }
        : null,
      createdAt: conversion.createdAt,
      completedAt: conversion.completedAt ?? null,
    };
  }

  private async convert(publicId: string) {
    // Claimed atomically: a conversion is only ever run once.
    const conversion = await Conversion.findOneAndUpdate(
      { publicId, status: ConversionStatus.Queued },
      { $set: { status: ConversionStatus.Capturing, startedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!conversion) return;

    const workDir = await mkdtemp(path.join(os.tmpdir(), config.conversion.workDirPrefix));
    // The project, and the pages as published for the preview: pushed to
    // separate branches, so the project's branch holds only its source.
    const projectDir = path.join(workDir, "project");
    const previewDir = path.join(workDir, "preview");
    try {
      const project = nextProject.writer(new DirectorySnapshotSink(projectDir));
      const capture = await siteCapture.capture(conversion.sourceUrl, project.sink);
      const written = await project.write(capture, new DirectorySnapshotSink(previewDir));

      await this.setStatus(publicId, ConversionStatus.Storing);
      const repository = await this.store(conversion, projectDir, previewDir);
      await previewService.prime(publicId, repository, projectDir, previewDir);
      await this.markReady(publicId, this.finishedCapture(repository, capture, written));
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  // One private repository per conversion, named after its id.
  private async store(
    conversion: ConversionDocument,
    projectDir: string,
    previewDir: string,
  ): Promise<IConversionRepository> {
    const repository = await github.createRepository(
      `${config.github.repositoryPrefix}${conversion.publicId}`,
      `Next.js project converted from ${conversion.sourceUrl}`,
    );
    // A failed conversion keeps no repository, so one that can't be filled
    // is removed rather than left behind on the account.
    return this.push(conversion, repository, projectDir, previewDir).catch(async (error: unknown) => {
      const isDeleted = await github.deleteRepository(repository).catch(() => false);
      if (!isDeleted) logger.warn("Repository of a failed conversion not deleted", { ...repository });
      throw error;
    });
  }

  private async push(
    conversion: ConversionDocument,
    repository: IGitHubRepository,
    projectDir: string,
    previewDir: string,
  ): Promise<IConversionRepository> {
    const commitSha = await github.pushDirectory(
      projectDir,
      repository,
      `Convert ${conversion.sourceUrl} to Next.js`,
    );
    const previewCommitSha = await github.pushDirectory(
      previewDir,
      repository,
      `Preview of ${conversion.sourceUrl}`,
      framerConfig.preview.branch,
    );
    return { owner: repository.owner, name: repository.name, commitSha, previewCommitSha };
  }

  private finishedCapture(
    repository: IConversionRepository,
    capture: ICaptureResult,
    written: IProjectResult,
  ): IFinishedCapture {
    const issues = [...capture.issues, ...written.issues];
    return {
      repository,
      ...(written.thumbnailPath && { thumbnailPath: written.thumbnailPath }),
      summary: {
        pages: capture.pages.length,
        files: capture.fileCount,
        bytes: capture.totalBytes,
        issueCount: issues.length,
      },
      issues: issues.slice(0, config.conversion.maxStoredIssues),
    };
  }

  private async setStatus(publicId: string, status: ConversionStatus) {
    await Conversion.updateOne({ publicId }, { $set: { status } });
  }

  private async markReady(publicId: string, finished: IFinishedCapture) {
    await Conversion.updateOne(
      { publicId },
      { $set: { status: ConversionStatus.Ready, ...finished, completedAt: new Date() } },
    );
    logger.info("Conversion ready", { conversionId: publicId, ...finished.summary });
  }

  // A conversion still in progress whose heartbeat stopped lost its server
  // (a restart or deploy); nothing will finish it now.
  private async failIfStale(conversion: ConversionDocument): Promise<ConversionDocument> {
    const lastAlive = conversion.heartbeatAt ?? conversion.createdAt;
    const isStale = IN_PROGRESS.includes(conversion.status) && lastAlive <= this.staleBefore();
    if (!isStale) return conversion;

    await this.saveFailure(conversion.publicId, {
      code: ConversionFailureCode.Interrupted,
      message: "This conversion was interrupted. Please start it again.",
    });
    return (await Conversion.findById(conversion._id)) ?? conversion;
  }

  private failureFor(error: unknown): IConversionFailure {
    if (error instanceof ConversionError) {
      return { code: FAILURE_FOR_CAPTURE_ERROR[error.code], message: error.message };
    }
    if (error instanceof GitHubError) {
      return {
        code: ConversionFailureCode.StorageFailed,
        message: "We converted the site but couldn't save the project. Please try again.",
      };
    }
    return {
      code: ConversionFailureCode.Unexpected,
      message: "Something went wrong converting this site. Please try again.",
    };
  }

  // Search text is matched literally, not as a pattern.
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private staleBefore(): Date {
    return new Date(Date.now() - config.conversion.staleAfterMs);
  }

  private createPublicId(): string {
    const alphabet = config.conversion.publicIdAlphabet;
    let id = "";
    let buffer = 0;
    let bits = 0;
    for (const byte of crypto.randomBytes(config.conversion.publicIdBytes)) {
      buffer = (buffer << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        bits -= 5;
        id += alphabet[(buffer >>> bits) & 31];
      }
      buffer &= (1 << bits) - 1;
    }
    if (bits > 0) id += alphabet[(buffer << (5 - bits)) & 31];
    return id;
  }
}

export const conversionService = new ConversionService();
