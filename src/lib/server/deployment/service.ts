import crypto from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import config from "../config";
import Conversion from "../conversion/entity";
import { ConversionDocument } from "../conversion/interface";
import { userService } from "../user/service";
import { github } from "../utils/github";
import { logger } from "../utils/logger";
import { secretBox } from "../utils/secret-box";
import { TaskQueue } from "../utils/task-queue";
import { vercel, VercelError } from "../utils/vercel";
import { DeploymentProvider, DeploymentStatus } from "./enum";
import { IConversionDeployment, IProjectFile, IVercelConnectionDto } from "./interface";

// Vercel's states for a deployment that finished badly.
const FAILED_STATES = ["ERROR", "CANCELED"];

class DeploymentService {
  // ----- The user's Vercel connection -----

  // The accounts a token can deploy to, which also proves it works.
  // An account-wide token reads its user and teams. A token scoped to one
  // team can do neither; it deploys to its team by default, so that is its
  // only account (its name isn't readable with such a token).
  async vercelAccounts(token: string): Promise<IVercelConnectionDto> {
    const user = await vercel.getUser(token).catch((error: unknown) => this.unlessInvalidToken(error, null));
    if (!user) {
      await vercel.listProjects(token);
      return {
        username: null,
        accounts: [{ teamId: null, name: config.vercel.scopedTokenAccountName, isPersonal: false }],
      };
    }

    const teams = await vercel.listTeams(token).catch((error: unknown) => this.unlessInvalidToken(error, []));
    return {
      username: user.username,
      accounts: [
        { teamId: null, name: user.name || user.username, isPersonal: true },
        ...teams.map((team) => ({ teamId: team.id, name: team.name, isPersonal: false })),
      ],
    };
  }

  // `fallback` when Vercel refused only this request (outside the token's
  // scope); a token Vercel doesn't accept at all is rethrown.
  private unlessInvalidToken<T>(error: unknown, fallback: T): T {
    if (error instanceof VercelError && !error.isInvalidToken) return fallback;
    throw error;
  }

  async saveVercelToken(userId: string, token: string, username: string | null): Promise<void> {
    await userService.setVercelConnection(userId, {
      token: secretBox.seal(token),
      ...(username && { username }),
      connectedAt: new Date(),
    });
  }

  // The user's token, or null when they haven't connected Vercel (or it
  // was sealed with a key that has since changed).
  async vercelToken(userId: string): Promise<string | null> {
    const connection = await userService.findVercelConnection(userId);
    return connection ? secretBox.open(connection.token) : null;
  }

  // ----- Deploying -----

  // Claims the conversion for a new deployment, unless one is already
  // running. Returns null when it is.
  async start(
    conversion: ConversionDocument,
    token: string,
    teamId: string | null,
  ): Promise<ConversionDocument | null> {
    const deployment: IConversionDeployment = {
      provider: DeploymentProvider.Vercel,
      status: DeploymentStatus.Uploading,
      teamId,
      projectName: await this.ensureProject(conversion, token, teamId),
      startedAt: new Date(),
    };
    return Conversion.findOneAndUpdate(
      {
        _id: conversion._id,
        $or: [
          { deployment: { $exists: false } },
          { "deployment.status": { $in: [DeploymentStatus.Ready, DeploymentStatus.Failed] } },
          // An upload cut off by a restart.
          {
            "deployment.status": DeploymentStatus.Uploading,
            "deployment.startedAt": { $lt: new Date(Date.now() - config.vercel.uploadStaleAfterMs) },
          },
        ],
      },
      { $set: { deployment } },
      { returnDocument: "after" },
    );
  }

  // Uploads the project, as stored on GitHub, and asks Vercel to deploy it.
  // Runs in the background; errors are recorded by markFailed.
  async upload(conversionId: string, token: string) {
    const conversion = await Conversion.findById(conversionId);
    const deployment = conversion?.deployment;
    if (!conversion?.repository || deployment?.status !== DeploymentStatus.Uploading) return;

    const checkout = await github.fetchCommit(conversion.repository, conversion.repository.commitSha, true);
    try {
      const files = await this.projectFiles(checkout.directory);
      const uploads = new TaskQueue(config.vercel.uploadConcurrency);
      await Promise.all(
        files.map((file) =>
          uploads.run(async () =>
            vercel.uploadFile(token, deployment.teamId, file, await readFile(file.path)),
          ),
        ),
      );

      const created = await vercel.createDeployment(
        token,
        deployment.teamId,
        deployment.projectName,
        files.map(({ file, sha, size }) => ({ file, sha, size })),
      );
      await Conversion.updateOne(
        { _id: conversionId },
        {
          $set: {
            "deployment.status": DeploymentStatus.Building,
            "deployment.deploymentId": created.id,
            "deployment.checkedAt": new Date(),
          },
        },
      );
      logger.info("Deployment created", { conversionId: conversion.publicId, deploymentId: created.id });
    } finally {
      await checkout.remove();
    }
  }

  async markFailed(conversionId: string, error: unknown) {
    await Conversion.updateOne(
      {
        _id: conversionId,
        "deployment.status": { $in: [DeploymentStatus.Uploading, DeploymentStatus.Building] },
      },
      { $set: { "deployment.status": DeploymentStatus.Failed, "deployment.error": this.messageFor(error) } },
    );
  }

  // A building deployment's status, asked of Vercel at most every few
  // seconds however often the page checks in. Asking on demand, rather
  // than in a background loop, means a restart can't lose track of it.
  async refresh(conversion: ConversionDocument): Promise<ConversionDocument> {
    const deployment = conversion.deployment;
    if (deployment?.status !== DeploymentStatus.Building || !deployment.deploymentId) return conversion;

    const lastChecked = deployment.checkedAt?.getTime() ?? 0;
    if (Date.now() - lastChecked < config.vercel.statusCheckIntervalMs) return conversion;

    const token = await this.vercelToken(conversion.user.toString());
    if (!token) return conversion;

    // A failed check (a network blip) is simply tried again next time.
    const remote = await vercel
      .getDeployment(token, deployment.teamId, deployment.deploymentId)
      .catch((error: unknown) => {
        logger.warn("Vercel status check failed", { conversionId: conversion.publicId, error: String(error) });
        return null;
      });

    const now = new Date();
    const update = !remote
      ? { "deployment.checkedAt": now }
      : remote.readyState === "READY"
        ? {
            "deployment.status": DeploymentStatus.Ready,
            "deployment.url": `https://${remote.alias?.[0] ?? remote.url}`,
            "deployment.readyAt": now,
            "deployment.checkedAt": now,
            deployedAt: now,
          }
        : FAILED_STATES.includes(remote.readyState)
          ? {
              "deployment.status": DeploymentStatus.Failed,
              "deployment.error": remote.errorMessage || "Vercel couldn't build the site. Check the build logs in Vercel.",
              "deployment.checkedAt": now,
            }
          : { "deployment.checkedAt": now };

    return (
      (await Conversion.findOneAndUpdate(
        { _id: conversion._id, "deployment.status": DeploymentStatus.Building },
        { $set: update },
        { returnDocument: "after" },
      )) ?? conversion
    );
  }

  isInProgress(conversion: ConversionDocument): boolean {
    const status = conversion.deployment?.status;
    return status === DeploymentStatus.Uploading || status === DeploymentStatus.Building;
  }

  // The project to deploy to, created if needed. The same project as last
  // time on the same account, so a redeploy updates it. Otherwise a new one
  // named after the site, unless the account already has a project of that
  // name: that one isn't ours to overwrite.
  private async ensureProject(
    conversion: ConversionDocument,
    token: string,
    teamId: string | null,
  ): Promise<string> {
    const previous = conversion.deployment;
    if (previous && previous.teamId === teamId) {
      const stillExists = await vercel.projectExists(token, teamId, previous.projectName);
      if (stillExists) return previous.projectName;
    }

    const base = new URL(conversion.sourceUrl).hostname
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, config.vercel.projectNameMaxLength);
    const isTaken = await vercel.projectExists(token, teamId, base);
    const name = isTaken ? `${base}-${conversion.publicId.slice(0, 6)}` : base;
    await vercel.createProject(token, teamId, name);
    return name;
  }

  // Every file of the project, with what Vercel needs to reference it.
  private async projectFiles(directory: string): Promise<IProjectFile[]> {
    const entries = await readdir(directory, { recursive: true, withFileTypes: true });
    const files = entries.filter(
      (entry) => entry.isFile() && !path.relative(directory, entry.parentPath).split(path.sep).includes(".git"),
    );

    return Promise.all(
      files.map(async (entry) => {
        const filePath = path.join(entry.parentPath, entry.name);
        const [body, info] = await Promise.all([readFile(filePath), stat(filePath)]);
        return {
          path: filePath,
          file: path.relative(directory, filePath).split(path.sep).join("/"),
          sha: crypto.createHash("sha1").update(body).digest("hex"),
          size: info.size,
        };
      }),
    );
  }

  // What the user is told when a deployment fails.
  public messageFor(error: unknown): string {
    if (error instanceof VercelError) {
      if (error.isInvalidToken) {
        return "Vercel didn't accept your token. Connect Vercel again with a new token.";
      }
      if (error.isForbidden) return config.vercel.scopeHelp;
      return `Vercel: ${error.message}`;
    }
    return "Something went wrong deploying this site. Please try again.";
  }
}

export const deploymentService = new DeploymentService();
