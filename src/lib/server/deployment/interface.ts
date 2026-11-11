import { DeploymentProvider, DeploymentStatus } from "./enum";

// A conversion's latest deployment.
export interface IConversionDeployment {
  provider: DeploymentProvider;
  status: DeploymentStatus;
  // The Vercel team deployed to; null for the personal account.
  teamId: string | null;
  projectName: string;
  // Set once the provider has accepted the deployment.
  deploymentId?: string;
  // The live address, once ready.
  url?: string;
  // Shown to the user when it failed.
  error?: string;
  startedAt: Date;
  // When the provider was last asked about a building deployment.
  checkedAt?: Date;
  readyAt?: Date;
}

// The user's Vercel connection. The token is sealed (see SecretBox).
export interface IVercelConnection {
  token: string;
  // Unknown for a token scoped to one team.
  username?: string;
  connectedAt: Date;
}

export interface IConnectVercelInput {
  token: string;
}

export interface IDeployInput {
  // null deploys to the personal account.
  teamId: string | null;
}

// Where the user can deploy: their personal account and each team.
export interface IVercelAccountDto {
  teamId: string | null;
  name: string;
  isPersonal: boolean;
}

export interface IVercelConnectionDto {
  // Null for a token scoped to one team, which can't read it.
  username: string | null;
  accounts: IVercelAccountDto[];
}

export interface IDeploymentDto {
  provider: DeploymentProvider;
  status: DeploymentStatus;
  url: string | null;
  error: string | null;
  projectName: string;
}

// A file of the project, ready to upload.
export interface IProjectFile {
  path: string;
  file: string;
  sha: string;
  size: number;
}
