// What a conversion starts from. Only Framer today; other converters (e.g.
// HTML) add their own value.
export enum ConversionSource {
  Framer = "framer",
}

export enum ConversionStatus {
  // Waiting for a free conversion slot.
  Queued = "queued",
  // Downloading the site and building the project.
  Capturing = "capturing",
  // Pushing the project to its GitHub repository.
  Storing = "storing",
  Ready = "ready",
  Failed = "failed",
}

export enum ConversionFailureCode {
  InvalidUrl = "invalid_url",
  SiteUnreachable = "site_unreachable",
  NotFramerSite = "not_framer_site",
  StorageFailed = "storage_failed",
  // The server stopped (e.g. a deploy) while the conversion ran.
  Interrupted = "interrupted",
  Unexpected = "unexpected",
}

// The dashboard's filters. Values match the client's SiteFilter.
export enum ConversionListFilter {
  All = "all",
  Deployed = "deployed",
  NotDeployed = "not-deployed",
}
