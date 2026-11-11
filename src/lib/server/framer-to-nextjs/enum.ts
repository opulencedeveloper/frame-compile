// Why a conversion stopped before producing anything.
export enum ConversionErrorCode {
  InvalidUrl = "invalid_url",
  SiteUnreachable = "site_unreachable",
  NotFramerSite = "not_framer_site",
}

// Problems that don't stop a conversion but are reported with its result.
export enum CaptureIssueType {
  PageUnavailable = "page_unavailable",
  FileUnavailable = "file_unavailable",
  // A URL whose path can't be stored safely (e.g. an encoded "..").
  FileSkipped = "file_skipped",
  PageLimitReached = "page_limit_reached",
  FileLimitReached = "file_limit_reached",
  SizeLimitReached = "size_limit_reached",
  // The "Made in Framer" badge module wasn't recognised, so it was hidden
  // with CSS instead of replaced.
  BadgeNotStubbed = "badge_not_stubbed",
  // Chromium couldn't be started, so files the runtime only requests while
  // it runs may be missing.
  BrowserPassUnavailable = "browser_pass_unavailable",
  // A page didn't load in the browser pass; files only it requests at
  // runtime may be missing.
  BrowserPassPageFailed = "browser_pass_page_failed",
  // Parts of a page React couldn't reproduce exactly, kept as raw HTML in
  // its components. The page is still identical; those parts are just not
  // JSX.
  RawHtmlKept = "raw_html_kept",
  // A page without Framer's content root, served as published.
  PageNotConverted = "page_not_converted",
}

export enum JsxNodeKind {
  Element = "element",
  Text = "text",
  // One of Framer's hydration boundaries: <!--$-->...<!--/$-->.
  Suspense = "suspense",
  // HTML kept as written.
  Raw = "raw",
  // A part of the tree moved into its own component.
  Component = "component",
}

export enum JsxComponentKind {
  // A page's content.
  View = "view",
  // A part of a page (navigation, hero, footer).
  Section = "section",
  // A large inline SVG.
  Graphic = "graphic",
}

export enum MirroredFileKind {
  // Scanned for references and rewritten.
  Text = "text",
  // Scanned and rewritten without changing its length.
  BinaryData = "binary_data",
  // Copied unchanged.
  Media = "media",
}
