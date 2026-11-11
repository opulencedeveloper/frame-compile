import config from "../config";
import {
  IVercelDeployment,
  IVercelFile,
  IVercelRequestOptions,
  IVercelTeam,
  IVercelUser,
} from "./interface";

export class VercelError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    private readonly invalidToken: boolean,
  ) {
    super(message);
  }

  // Vercel refused the token itself: wrong, revoked or expired. A 403 alone
  // isn't enough: a token scoped to one team gets 403 for what's outside
  // its scope.
  public get isInvalidToken(): boolean {
    return this.status === 401 || this.invalidToken;
  }

  // A working token that isn't allowed to do this, e.g. create projects
  // with a token scoped to a single team.
  public get isForbidden(): boolean {
    return this.status === 403 && !this.invalidToken;
  }
}

// The Vercel REST API, called with the user's own token. `teamId` is the
// team to act for; null is the token's default: the personal account for
// an account-wide token, its team for a team-scoped one.
class VercelClient {
  public async getUser(token: string): Promise<IVercelUser> {
    const response = await this.request(token, "/v2/user");
    return ((await response.json()) as { user: IVercelUser }).user;
  }

  public async listTeams(token: string): Promise<IVercelTeam[]> {
    const response = await this.request(token, "/v2/teams");
    return ((await response.json()) as { teams: IVercelTeam[] }).teams;
  }

  // One project, enough to prove a token works whatever its scope.
  public async listProjects(token: string): Promise<{ accountId: string }[]> {
    const response = await this.request(token, "/v9/projects", { query: { limit: "1" } });
    return ((await response.json()) as { projects: { accountId: string }[] }).projects;
  }

  public async projectExists(token: string, teamId: string | null, name: string): Promise<boolean> {
    const response = await this.request(token, `/v9/projects/${encodeURIComponent(name)}`, {
      teamId,
      allowedStatuses: [404],
    });
    return response.status !== 404;
  }

  // A Next.js project. Created before anything is uploaded, so a token
  // that isn't allowed to create projects fails at once.
  public async createProject(token: string, teamId: string | null, name: string) {
    await this.request(token, "/v11/projects", {
      teamId,
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, framework: config.vercel.framework }),
      },
    });
  }

  // Vercel keeps files by their SHA-1, so one already uploaded (by any
  // deployment) costs little to send again.
  public async uploadFile(token: string, teamId: string | null, file: IVercelFile, body: Buffer) {
    await this.request(token, "/v2/files", {
      teamId,
      timeoutMs: config.vercel.uploadTimeoutMs,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Length": String(file.size),
          "x-vercel-digest": file.sha,
        },
        body: new Uint8Array(body.buffer as ArrayBuffer, body.byteOffset, body.byteLength),
      },
    });
  }

  // A production deployment of uploaded files. Vercel installs and builds
  // the project itself, creating the project on its first deployment.
  public async createDeployment(
    token: string,
    teamId: string | null,
    project: string,
    files: IVercelFile[],
  ): Promise<IVercelDeployment> {
    const response = await this.request(token, "/v13/deployments", {
      teamId,
      query: { skipAutoDetectionConfirmation: "1" },
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: project,
          project,
          target: "production",
          files,
          projectSettings: { framework: config.vercel.framework },
        }),
      },
    });
    return (await response.json()) as IVercelDeployment;
  }

  public async getDeployment(token: string, teamId: string | null, id: string): Promise<IVercelDeployment> {
    const response = await this.request(token, `/v13/deployments/${encodeURIComponent(id)}`, { teamId });
    return (await response.json()) as IVercelDeployment;
  }

  private async request(token: string, path: string, options: IVercelRequestOptions = {}) {
    const { teamId = null, init = {}, allowedStatuses = [], query = {} } = options;
    const url = new URL(path, config.vercel.apiUrl);
    if (teamId) url.searchParams.set("teamId", teamId);
    for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value);

    const response = await fetch(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...init.headers },
      signal: AbortSignal.timeout(options.timeoutMs ?? config.vercel.requestTimeoutMs),
    });
    if (!response.ok && !allowedStatuses.includes(response.status)) {
      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string; invalidToken?: boolean };
      } | null;
      throw new VercelError(
        body?.error?.message ?? `Vercel ${init.method ?? "GET"} ${path} failed with status ${response.status}`,
        response.status,
        body?.error?.invalidToken === true,
      );
    }
    return response;
  }
}

export const vercel = new VercelClient();
