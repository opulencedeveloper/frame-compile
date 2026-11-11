export enum DeploymentProvider {
  Vercel = "vercel",
}

export enum DeploymentStatus {
  // Sending the project's files to the provider.
  Uploading = "uploading",
  // The provider is installing and building it.
  Building = "building",
  Ready = "ready",
  Failed = "failed",
}
