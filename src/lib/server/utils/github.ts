import { execFile, spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { promisify } from "node:util";
import config from "../config";
import { IGitCheckout, IGitHubAccount, IGitHubRepository } from "./interface";
import { logger } from "./logger";

const run = promisify(execFile);

export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

// Stores converted projects as private repositories on one GitHub account.
//
// Repositories are created through the REST API, but their files are pushed
// with git: the API commits one file per request, and GitHub limits
// content-creating requests to a few hundred an hour, fewer than a single
// site can have files.
class GitHubStorage {
  private account: Promise<IGitHubAccount> | null = null;

  public async createRepository(name: string, description: string): Promise<IGitHubRepository> {
    const { login } = await this.getAccount();
    const owner = config.github.owner;
    // A user's repositories and an organization's are created differently.
    const path =
      owner.toLowerCase() === login.toLowerCase()
        ? "/user/repos"
        : `/orgs/${encodeURIComponent(owner)}/repos`;

    const response = await this.request(path, {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        private: true,
        has_issues: false,
        has_projects: false,
        has_wiki: false,
        auto_init: false,
      }),
    });
    const repository = (await response.json()) as { name: string; owner: { login: string } };
    return { owner: repository.owner.login, name: repository.name };
  }

  // Commits every file in `directory` and pushes it as the first commit of
  // `branch`. Returns the commit's SHA.
  public async pushDirectory(
    directory: string,
    repository: IGitHubRepository,
    message: string,
    branch: string = config.github.branch,
  ): Promise<string> {
    const env = await this.gitEnv();
    const git = (...args: string[]) =>
      run(config.github.gitBinary, args, {
        cwd: directory,
        env,
        timeout: config.github.pushTimeoutMs,
        maxBuffer: config.github.gitOutputMaxBytes,
      });

    await git("init", "--quiet", `--initial-branch=${branch}`);
    await git("add", "--all");
    await git("commit", "--quiet", "--no-verify", `--message=${message}`);
    const { stdout } = await git("rev-parse", "HEAD");
    await this.retryPush(() => git("push", "--quiet", this.remoteUrl(repository), `HEAD:refs/heads/${branch}`));
    return stdout.trim();
  }

  // A push that fails is tried again; the last failure is reported as a
  // GitHubError, so the conversion is marked as a storage failure.
  private async retryPush(push: () => Promise<unknown>, attempt = 1): Promise<void> {
    await push().catch(async (error: unknown) => {
      const reason = error instanceof Error ? error.message : String(error);
      if (attempt >= config.github.pushAttempts) {
        throw new GitHubError(`git push failed after ${attempt} attempts: ${reason}`);
      }
      logger.warn("git push failed, retrying", { attempt, reason: reason.slice(0, 300) });
      await new Promise((resolve) => setTimeout(resolve, config.github.pushRetryDelayMs * attempt));
      return this.retryPush(push, attempt + 1);
    });
  }

  // A file at a commit, or null if the repository has no such file.
  public async getFile(
    repository: IGitHubRepository,
    commitSha: string,
    path: string,
  ): Promise<Buffer | null> {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const response = await this.request(
      `${this.repositoryPath(repository)}/contents/${encodedPath}?ref=${encodeURIComponent(commitSha)}`,
      { headers: { Accept: config.github.rawFileAccept } },
      [404],
    );
    if (response.status === 404) return null;
    return Buffer.from(await response.arrayBuffer());
  }

  // A local copy of the repository at a commit, in a temporary folder:
  // only git's data, or (`withFiles`) the files too. Call remove() when done.
  public async fetchCommit(
    repository: IGitHubRepository,
    commitSha: string,
    withFiles: boolean,
  ): Promise<IGitCheckout> {
    const directory = await mkdtemp(path.join(os.tmpdir(), config.github.checkoutDirPrefix));
    const remove = () => rm(directory, { recursive: true, force: true });
    const env = await this.gitEnv();
    const git = (...args: string[]) =>
      run(config.github.gitBinary, args, {
        cwd: directory,
        env,
        timeout: config.github.archiveTimeoutMs,
        maxBuffer: config.github.gitOutputMaxBytes,
      });

    // The folder is removed if any step fails, then the error goes on.
    await git("init", "--quiet")
      .then(() => git("fetch", "--quiet", "--depth=1", this.remoteUrl(repository), commitSha))
      .then(() => (withFiles ? git("checkout", "--quiet", "FETCH_HEAD") : undefined))
      .catch(async (error: unknown) => {
        await remove();
        throw error;
      });
    return { directory, remove, env };
  }

  // The repository's files at a commit as a zip, with every path under
  // `folder/`. GitHub's own zips name that folder "<owner>-<repo>-<sha>",
  // so the commit is fetched and archived with git instead. The zip is
  // streamed as git writes it; the fetched copy is removed once it ends.
  public async archive(
    repository: IGitHubRepository,
    commitSha: string,
    folder: string,
  ): Promise<ReadableStream<Uint8Array>> {
    const { directory, remove, env } = await this.fetchCommit(repository, commitSha, false);
    const archive = spawn(
      config.github.gitBinary,
      ["archive", "--format=zip", `--prefix=${folder}/`, "FETCH_HEAD"],
      { cwd: directory, env, stdio: ["ignore", "pipe", "ignore"], timeout: config.github.archiveTimeoutMs },
    );
    archive.on("close", () => void remove());
    return Readable.toWeb(archive.stdout) as ReadableStream<Uint8Array>;
  }

  // False when the token may not delete repositories (it needs the
  // "delete_repo" scope, or Administration on a fine-grained token).
  // A repository that is already gone counts as deleted.
  public async deleteRepository(repository: IGitHubRepository): Promise<boolean> {
    const response = await this.request(
      this.repositoryPath(repository),
      { method: "DELETE" },
      [403, 404],
    );
    return response.status !== 403;
  }

  private getAccount(): Promise<IGitHubAccount> {
    this.account ??= this.request("/user")
      .then((response) => response.json() as Promise<IGitHubAccount>)
      .catch((error: unknown) => {
        // Not kept, so a fixed token works without a restart.
        this.account = null;
        throw error;
      });
    return this.account;
  }

  private async request(
    path: string,
    init: RequestInit = {},
    allowedStatuses: number[] = [],
    timeoutMs: number = config.github.requestTimeoutMs,
  ) {
    const response = await fetch(`${config.github.apiUrl}${path}`, {
      ...init,
      headers: {
        Accept: config.github.apiAccept,
        Authorization: `Bearer ${config.github.token}`,
        "Content-Type": "application/json",
        "User-Agent": config.app.name,
        "X-GitHub-Api-Version": config.github.apiVersion,
        ...init.headers,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok && !allowedStatuses.includes(response.status)) {
      const detail = await response.text().catch(() => "");
      throw new GitHubError(
        `GitHub ${init.method ?? "GET"} ${path} failed with status ${response.status}: ${detail.slice(0, 300)}`,
        response.status,
      );
    }
    return response;
  }

  private repositoryPath({ owner, name }: IGitHubRepository): string {
    return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  }

  private remoteUrl({ owner, name }: IGitHubRepository): string {
    return `${config.github.gitUrl}/${encodeURIComponent(owner)}/${encodeURIComponent(name)}.git`;
  }

  // The token goes in an HTTP header set through the environment, never on
  // the command line, where other processes on the machine could read it.
  private async gitEnv(): Promise<NodeJS.ProcessEnv> {
    const { login, id } = await this.getAccount();
    const email = `${id}+${login}@${config.github.noreplyEmailDomain}`;
    const credentials = Buffer.from(
      `${config.github.tokenUsername}:${config.github.token}`,
    ).toString("base64");

    const settings = Object.entries({
      ...config.github.gitSettings,
      "http.extraHeader": `Authorization: Basic ${credentials}`,
    });

    return {
      ...config.github.gitInheritedEnv,
      ...config.github.gitIsolationEnv,
      GIT_CONFIG_COUNT: String(settings.length),
      ...Object.fromEntries(
        settings.flatMap(([key, value], index) => [
          [`GIT_CONFIG_KEY_${index}`, key],
          [`GIT_CONFIG_VALUE_${index}`, value],
        ]),
      ),
      GIT_AUTHOR_NAME: config.github.commitAuthorName,
      GIT_AUTHOR_EMAIL: email,
      GIT_COMMITTER_NAME: config.github.commitAuthorName,
      GIT_COMMITTER_EMAIL: email,
    };
  }
}

export const github = new GitHubStorage();
