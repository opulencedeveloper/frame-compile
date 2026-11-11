import { DeploymentStatus } from "@/utils/enum";

export const deployModalContent = {
  connectTitle: "Connect Vercel",
  checkingConnection: "Checking your Vercel connection…",
  connectDescription: "Your site is converted. Deploy it with your own Vercel account",
  tokenPlaceholder: "Paste token",
  checkToken: "Check token",
  tokenHelp:
    "Go to Account Settings → Tokens → Create Token, and choose Full Account as the scope. Pick your team after the token is checked. Takes about a minute.",
  createToken: "Create token",
  tokenNotice: "We send the token to Vercel for deployment and store it securely.",
  accountTitle: "Choose where to deploy",
  accountDescription: (username: string | null) =>
    username ? `Connected to Vercel as ${username}` : "Connected to Vercel",
  personalAccount: "Personal account",
  team: "Team",
  deploy: "Deploy",
  differentToken: "Use a different token",
  liveTitle: "Your site is live",
  deployingTitle: "Deploying to Vercel",
  failedTitle: "Deployment failed",
  visitSite: "Visit site",
  deployAgain: "Deploy again",
  tryAgain: "Try again",
  durationHint: "Vercel builds the site, which usually takes one to two minutes.",
};

export const deploymentStatusLabels: Record<DeploymentStatus, string> = {
  [DeploymentStatus.Uploading]: "Uploading your project to Vercel…",
  [DeploymentStatus.Building]: "Vercel is building your site…",
  [DeploymentStatus.Ready]: "Your site is live",
  [DeploymentStatus.Failed]: "Deployment failed",
};

export const deploymentBarContent = {
  liveAt: "Live at",
  copy: "Copy link",
  copied: "Copied",
};
