const framerConfig = {
  maxPages: 1000,
  maxFiles: 10_000,
  maxTotalBytes: 2 * 1024 * 1024 * 1024,
  pageConcurrency: 6,
  fileConcurrency: 12,
  // Files under these URLs are downloaded and served from the converted
  // site, so it keeps working after the Framer project is unpublished:
  // Framer's CDN, Google Fonts files, and Framer's code-component CDN
  // (marketplace components such as icon sets load from framer.com/m/).
  // Each must start with absolutePrefix and end with "/".
  mirroredPrefixes: [
    "https://framerusercontent.com/",
    "https://fonts.gstatic.com/",
    "https://framer.com/m/",
  ],
  // A mirrored URL "https://host/x" becomes "/assets/host/x". Both prefixes
  // are 8 characters, so rewriting never changes a file's length. That keeps
  // Framer's binary CMS files valid, whose indexes point at byte offsets.
  absolutePrefix: "https://",
  mirrorPrefix: "/assets/",
  // The same pair in JSON-escaped strings.
  escapedAbsolutePrefix: "https:\\/\\/",
  escapedMirrorPrefix: "\\/assets\\/",
  // Our own runtime files (stubs) live beside the mirror.
  runtimeDir: "/assets/framecompile/",
  editorStubFile: "editor-bar.mjs",
  // The editor bar Framer loads for signed-in owners. It talks to Framer's
  // servers, so on a converted site it is replaced with a stub.
  editorModulePrefixes: ["https://framer.com/edit/", "https://app.framerstatic.com/"],
  // Served files whose extension doesn't say they are JavaScript (e.g.
  // "Icon.js@0.0.28") are reported, so hosting can send the right MIME type;
  // browsers refuse to run modules served as anything else.
  javascriptMimeType: "text/javascript",
  // How far past "__framer-badge-container" in Framer's entry module to look
  // for the badge's lazy import.
  badgeImportWindow: 600,
  // Script tags removed from every page: Framer's analytics.
  removedScriptHosts: ["events.framer.com"],
  // Text files are scanned for further references and have their URLs
  // rewritten. Binary data files are scanned and rewritten byte for byte
  // (Framer's CMS). Everything else is copied unchanged.
  textExtensions: [".mjs", ".js", ".json", ".css", ".svg", ".txt", ".xml"],
  binaryDataExtensions: [".framercms"],
  moduleExtensions: [".mjs", ".js"],
  // Framer's image CDN resizes and re-encodes on request:
  // "x.png?scale-down-to=512" is a 512px WebP or AVIF, chosen by the
  // browser's Accept header. A static host ignores the query and would send
  // the full-size original, so each requested size is downloaded as its own
  // file instead. WebP is used because every current browser supports it.
  imageVariants: {
    urlPrefix: "https://framerusercontent.com/images/",
    extensions: [".png", ".jpg", ".jpeg", ".webp"],
    sizeParam: "scale-down-to",
    // Hints about the image that don't change the bytes the CDN returns.
    // Any other parameter (e.g. "lossless") keeps the original file.
    descriptiveParams: ["width", "height"],
    accept: "image/webp",
    mimeType: "image/webp",
    // "x.png" at 512px is stored as "x-512w.webp", re-encoded at full size
    // as "x-full.webp".
    sizeSuffix: "w",
    fullSizeSuffix: "full",
    fileExtension: ".webp",
  },
  // Some files are only requested while a page runs, under names built at
  // runtime (e.g. icon sets: `${base}${iconName}.js@0.0.28`). The original
  // site is loaded in headless Chromium at each breakpoint and every
  // mirrored file it asks for is captured. All of the browser's requests go
  // through the SSRF-safe fetcher; nothing else reaches the network.
  browserPass: {
    // Pages visited, home page first, then spread across sections.
    maxPages: 40,
    concurrency: 3,
    navigationTimeoutMs: 45_000,
    // Upper bound on waiting for the network to go quiet after scrolling.
    settleTimeoutMs: 8_000,
    scrollStepPx: 600,
    scrollDelayMs: 120,
    viewportHeight: 900,
    // The width used inside each breakpoint range: the smallest range gets a
    // phone width, the largest a desktop width, the others their lower edge.
    phoneWidth: 390,
    desktopWidth: 1440,
    // Used when a page doesn't declare its breakpoints.
    fallbackWidths: [390, 810, 1440],
    // Recorded but not downloaded by the browser: they don't lead to further
    // requests, and the capture fetches them itself.
    recordOnlyResourceTypes: ["image", "media", "font"],
    // The home page's screenshot, the dashboard's thumbnail of the site.
    thumbnail: { width: 1440, height: 900, quality: 80, settleMs: 1500 },
    // Requests are answered by the route handler before Chromium opens a
    // connection. These flags make sure nothing else can: no hostname
    // resolves, and every connection, loopback included, must go through a
    // proxy that doesn't exist. That covers what routing doesn't see
    // (WebSockets, WebRTC, preconnects), so a site's custom code can't reach
    // internal addresses from our servers.
    launchArgs: [
      "--host-resolver-rules=MAP * ~NOTFOUND",
      "--proxy-server=http://framecompile-no-network.invalid:1",
      "--proxy-bypass-list=<-loopback>",
      "--force-webrtc-ip-handling-policy=disable_non_proxied_udp",
    ],
  },
  // The Next.js project a capture is written as.
  project: {
    // Mirrored files are served from public/.
    publicDir: "public/",
    // Each page's HTML without its content (head, Framer's scripts), with
    // a marker where the rendered content goes.
    shellsDir: "site/shells/",
    manifestFile: "site/site.json",
    // Exact versions, so every generated project builds the same way.
    dependencies: { next: "16.4.3", react: "19.3.0", "react-dom": "19.3.0" },
    devDependencies: {
      "@types/node": "20.19.43",
      "@types/react": "19.3.0",
      "@types/react-dom": "19.3.0",
      typescript: "5.9.3",
    },
    nodeVersion: ">=20.9.0",
  },
  // What the preview reads, pushed to its own branch so the project's own
  // branch holds only source: the pages as Framer published them, which
  // render identically to the generated components.
  preview: {
    branch: "framecompile-preview",
    pagesDir: "pages/",
    manifestFile: "site.json",
    // Served from the preview host at /<thumbnailFile>.
    thumbnailFile: "framecompile-thumbnail.jpg",
    // Explains the branch to anyone browsing the repository.
    readmeFile: "README.md",
  },
  // Turning each page's content into React components.
  jsx: {
    // Framer renders a page's content into this element and hydrates it.
    mainId: "main",
    // Where the rendered content goes in a page's shell.
    mainMarker: "<!--framecompile:main-->",
    // Raw HTML (anything React can't reproduce exactly) is rendered as
    // <template data-framecompile-raw=""> holding the markers and the HTML,
    // then unwrapped to the HTML alone.
    rawAttribute: "data-framecompile-raw",
    rawHtmlImport: "@/components/RawHtml",
    rawMarkerOpen: "<!--framecompile:raw-->",
    rawMarkerClose: "<!--/framecompile:raw-->",
    // React writes this between adjacent text nodes; Framer's HTML has none.
    textSeparator: "<!-- -->",
    // Framer's Suspense boundaries, which its runtime hydrates.
    suspenseOpen: "$",
    suspenseClose: "/$",
    // Rendering and comparing again after keeping mismatches as raw HTML.
    maxVerifyPasses: 8,
    // An element becomes its own component above this size (characters of
    // HTML), and an inline SVG above graphicMinChars.
    sectionMinChars: 1500,
    graphicMinChars: 4000,
    maxSectionDepth: 6,
    sectionTags: ["nav", "header", "footer", "section", "aside", "article"],
    // Framer's default layer names, which say nothing about the content.
    genericLayerName:
      /^(?:content|container|wrapper|frame|stack|group|variant|desktop|tablet|mobile|phone|des|main|section|div|block|item|row|column|col|inner|outer|box|layout|image|text|link|button|icon|component)(?:\s+\w+)?\s*\d*$/i,
    // Elements kept as raw HTML: React handles them specially (hoisting,
    // controlled values) or can't express them.
    rawTags: ["script", "noscript", "textarea", "select", "option", "template", "title", "meta", "link", "base"],
    // HTML attribute names (lowercase) that React spells differently.
    attributeNames: {
      class: "className",
      for: "htmlFor",
      "accept-charset": "acceptCharset",
      "http-equiv": "httpEquiv",
      accesskey: "accessKey",
      allowfullscreen: "allowFullScreen",
      autocapitalize: "autoCapitalize",
      autocomplete: "autoComplete",
      autocorrect: "autoCorrect",
      autofocus: "autoFocus",
      autoplay: "autoPlay",
      cellpadding: "cellPadding",
      cellspacing: "cellSpacing",
      charset: "charSet",
      colspan: "colSpan",
      contenteditable: "contentEditable",
      controlslist: "controlsList",
      crossorigin: "crossOrigin",
      datetime: "dateTime",
      disablepictureinpicture: "disablePictureInPicture",
      disableremoteplayback: "disableRemotePlayback",
      enctype: "encType",
      enterkeyhint: "enterKeyHint",
      fetchpriority: "fetchPriority",
      formaction: "formAction",
      formenctype: "formEncType",
      formmethod: "formMethod",
      formnovalidate: "formNoValidate",
      formtarget: "formTarget",
      frameborder: "frameBorder",
      hreflang: "hrefLang",
      imagesizes: "imageSizes",
      imagesrcset: "imageSrcSet",
      inputmode: "inputMode",
      itemid: "itemID",
      itemprop: "itemProp",
      itemref: "itemRef",
      itemscope: "itemScope",
      itemtype: "itemType",
      marginheight: "marginHeight",
      marginwidth: "marginWidth",
      maxlength: "maxLength",
      mediagroup: "mediaGroup",
      minlength: "minLength",
      nomodule: "noModule",
      novalidate: "noValidate",
      playsinline: "playsInline",
      popovertarget: "popoverTarget",
      popovertargetaction: "popoverTargetAction",
      readonly: "readOnly",
      referrerpolicy: "referrerPolicy",
      rowspan: "rowSpan",
      spellcheck: "spellCheck",
      srcdoc: "srcDoc",
      srclang: "srcLang",
      srcset: "srcSet",
      tabindex: "tabIndex",
      usemap: "useMap",
    } as Record<string, string>,
    // SVG attribute names React spells in camelCase, applied inside <svg>.
    svgAttributeNames: {
      "accent-height": "accentHeight",
      "alignment-baseline": "alignmentBaseline",
      "arabic-form": "arabicForm",
      "baseline-shift": "baselineShift",
      "cap-height": "capHeight",
      "clip-path": "clipPath",
      "clip-rule": "clipRule",
      "color-interpolation": "colorInterpolation",
      "color-interpolation-filters": "colorInterpolationFilters",
      "color-profile": "colorProfile",
      "color-rendering": "colorRendering",
      "dominant-baseline": "dominantBaseline",
      "enable-background": "enableBackground",
      "fill-opacity": "fillOpacity",
      "fill-rule": "fillRule",
      "flood-color": "floodColor",
      "flood-opacity": "floodOpacity",
      "font-family": "fontFamily",
      "font-size": "fontSize",
      "font-size-adjust": "fontSizeAdjust",
      "font-stretch": "fontStretch",
      "font-style": "fontStyle",
      "font-variant": "fontVariant",
      "font-weight": "fontWeight",
      "glyph-name": "glyphName",
      "glyph-orientation-horizontal": "glyphOrientationHorizontal",
      "glyph-orientation-vertical": "glyphOrientationVertical",
      "horiz-adv-x": "horizAdvX",
      "horiz-origin-x": "horizOriginX",
      "image-rendering": "imageRendering",
      "letter-spacing": "letterSpacing",
      "lighting-color": "lightingColor",
      "marker-end": "markerEnd",
      "marker-mid": "markerMid",
      "marker-start": "markerStart",
      "overline-position": "overlinePosition",
      "overline-thickness": "overlineThickness",
      "paint-order": "paintOrder",
      "panose-1": "panose1",
      "pointer-events": "pointerEvents",
      "rendering-intent": "renderingIntent",
      "shape-rendering": "shapeRendering",
      "stop-color": "stopColor",
      "stop-opacity": "stopOpacity",
      "strikethrough-position": "strikethroughPosition",
      "strikethrough-thickness": "strikethroughThickness",
      "stroke-dasharray": "strokeDasharray",
      "stroke-dashoffset": "strokeDashoffset",
      "stroke-linecap": "strokeLinecap",
      "stroke-linejoin": "strokeLinejoin",
      "stroke-miterlimit": "strokeMiterlimit",
      "stroke-opacity": "strokeOpacity",
      "stroke-width": "strokeWidth",
      "text-anchor": "textAnchor",
      "text-decoration": "textDecoration",
      "text-rendering": "textRendering",
      "transform-origin": "transformOrigin",
      "underline-position": "underlinePosition",
      "underline-thickness": "underlineThickness",
      "unicode-bidi": "unicodeBidi",
      "unicode-range": "unicodeRange",
      "units-per-em": "unitsPerEm",
      "v-alphabetic": "vAlphabetic",
      "v-hanging": "vHanging",
      "v-ideographic": "vIdeographic",
      "v-mathematical": "vMathematical",
      "vector-effect": "vectorEffect",
      "vert-adv-y": "vertAdvY",
      "vert-origin-x": "vertOriginX",
      "vert-origin-y": "vertOriginY",
      "word-spacing": "wordSpacing",
      "writing-mode": "writingMode",
      "x-height": "xHeight",
      "xlink:actuate": "xlinkActuate",
      "xlink:arcrole": "xlinkArcrole",
      "xlink:href": "xlinkHref",
      "xlink:role": "xlinkRole",
      "xlink:show": "xlinkShow",
      "xlink:title": "xlinkTitle",
      "xlink:type": "xlinkType",
      "xml:base": "xmlBase",
      "xml:lang": "xmlLang",
      "xml:space": "xmlSpace",
      "xmlns:xlink": "xmlnsXlink",
    } as Record<string, string>,
    // React props that are true when present ("" or their own name).
    booleanProps: [
      "allowFullScreen",
      "async",
      "autoFocus",
      "autoPlay",
      "controls",
      "default",
      "defer",
      "disabled",
      "disablePictureInPicture",
      "disableRemotePlayback",
      "formNoValidate",
      "hidden",
      "inert",
      "itemScope",
      "loop",
      "multiple",
      "muted",
      "noModule",
      "noValidate",
      "open",
      "playsInline",
      "readOnly",
      "required",
      "reversed",
    ],
    // Props React's types declare as numbers. Written as numbers when the
    // number reads back as the same text, which React renders identically.
    numericProps: [
      "tabIndex",
      "colSpan",
      "rowSpan",
      "maxLength",
      "minLength",
      "cols",
      "rows",
      "size",
      "span",
      "start",
      "aria-colcount",
      "aria-colindex",
      "aria-colspan",
      "aria-level",
      "aria-posinset",
      "aria-rowcount",
      "aria-rowindex",
      "aria-rowspan",
      "aria-setsize",
      "aria-valuemax",
      "aria-valuemin",
      "aria-valuenow",
    ],
    // Inline elements whose content is printed on one line, so the spaces
    // between words and tags survive JSX's whitespace rules.
    inlineTags: ["a", "abbr", "b", "br", "code", "em", "i", "mark", "s", "small", "span", "strong", "sub", "sup", "u"],
    inlineMaxChars: 160,
  },
  sitemapPath: "/sitemap.xml",
  robotsPath: "/robots.txt",
  // A sitemap index can list further sitemaps; this caps how many are read.
  maxSitemaps: 50,
  // Fetched to capture the site's own "not found" page. Sites without one
  // get Framer's generic page, which isn't captured.
  notFoundProbePath: "/framecompile-page-not-found",
  notFoundRoute: "/404",
  indexFile: "index.html",
  pageFileExtension: ".html",
  // Same-site links to these are files, not pages.
  nonPageExtensions: /\.(?:xml|txt|json|js|mjs|css|map|png|jpe?g|gif|webp|avif|svg|ico|pdf|zip|mp3|mp4|webm|mov|woff2?|ttf|otf)$/i,
};

export default framerConfig;
