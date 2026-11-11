import framerConfig from "./config";
import { JsxComponentKind, JsxNodeKind } from "./enum";
import { IJsxComponent, IJsxElement, IJsxNode } from "./interface";
import { pageDocument } from "./page-document";

const settings = framerConfig.jsx;

// Per page: the names taken, and the page's breakpoints by hash.
interface ISplitContext {
  names: Set<string>;
  breakpoints: Map<string, string>;
}

// Splits a page's content into components a developer would recognise:
// the navigation, each section and the footer, named after what the
// designer called them in Framer (or their heading), plus large inline
// SVGs as graphics.
class JsxSections {
  public split(root: IJsxNode, viewName: string): IJsxComponent {
    if (root.kind !== JsxNodeKind.Element) {
      return { kind: JsxComponentKind.View, name: viewName, root };
    }

    const context: ISplitContext = {
      names: new Set([viewName]),
      breakpoints: this.breakpointLabels(root),
    };
    const withSections = { ...root, children: this.extract(root.children, 0, new Set(), context) };
    return {
      kind: JsxComponentKind.View,
      name: viewName,
      root: this.extractGraphics(withSections, null),
    };
  }

  private extract(
    nodes: IJsxNode[],
    depth: number,
    hidden: Set<string>,
    context: ISplitContext,
  ): IJsxNode[] {
    return nodes.map((node) => {
      if (node.kind === JsxNodeKind.Suspense) {
        return { ...node, children: this.extract(node.children, depth, hidden, context) };
      }
      if (node.kind !== JsxNodeKind.Element) return node;

      const nodeHidden = new Set([...hidden, ...this.hiddenBreakpoints(node)]);
      if (this.isSection(node)) {
        const name = this.uniqueName(`${this.baseName(node)}${this.breakpointSuffix(nodeHidden, context)}`, context.names);
        const section = this.extractGraphics(node, null);
        return {
          kind: JsxNodeKind.Component,
          component: { kind: JsxComponentKind.Section, name, root: section },
        };
      }
      if (depth >= settings.maxSectionDepth) return node;
      return { ...node, children: this.extract(node.children, depth + 1, nodeHidden, context) };
    });
  }

  // Large inline SVGs become graphics, named after their own layer or their
  // parent's (`parentName`).
  private extractGraphics(node: IJsxNode, parentName: string | null): IJsxNode {
    if (node.kind === JsxNodeKind.Suspense) {
      return { ...node, children: node.children.map((child) => this.extractGraphics(child, parentName)) };
    }
    if (node.kind !== JsxNodeKind.Element) return node;

    const ownName = this.layerName(node);
    if (node.tag === "svg" && pageDocument.sizeOf(node.source) >= settings.graphicMinChars) {
      const name = ownName ?? parentName;
      return {
        kind: JsxNodeKind.Component,
        component: {
          kind: JsxComponentKind.Graphic,
          name: `${name ? this.pascal(name) : ""}Graphic`,
          root: node,
        },
      };
    }
    return { ...node, children: node.children.map((child) => this.extractGraphics(child, ownName)) };
  }

  // Semantic elements, layers the designer named, and Framer's component
  // instances ("*-container"), when large enough to be worth a file.
  private isSection(element: IJsxElement): boolean {
    if (pageDocument.sizeOf(element.source) < settings.sectionMinChars) return false;
    return (
      settings.sectionTags.includes(element.tag.toLowerCase()) ||
      this.layerName(element) !== null ||
      this.classes(element).some((name) => name.endsWith("-container"))
    );
  }

  private baseName(element: IJsxElement): string {
    const named = this.namingElement(element);
    const tag = named.tag.toLowerCase();
    if (tag === "nav") return "Navigation";
    if (tag === "footer") return "Footer";
    if (tag === "header") return "Header";

    const layerName = this.layerName(named);
    if (layerName) return this.pascal(layerName);

    const words = this.headingText(element) ?? this.firstWords(element);
    if (words) return `${this.pascal(words)}Section`;
    // An unnamed component instance with no text: usually an embed.
    return this.classes(element).some((name) => name.endsWith("-container")) ? "Widget" : "Section";
  }

  // The first few words of text, for a part with neither a layer name nor
  // a heading (e.g. a chat widget: "TalkToSolaineSection").
  private firstWords(element: IJsxElement): string | null {
    const words = this.text(element)
      .split(/\s+/)
      .filter((word) => /[A-Za-z]/.test(word))
      .slice(0, 3);
    return words.length >= 2 ? words.join(" ") : null;
  }

  // The element itself, or the first descendant that says what it is
  // (a component instance wraps its content in unnamed divs).
  private namingElement(element: IJsxElement): IJsxElement {
    const queue: [IJsxNode, number][] = [[element, 0]];
    while (queue.length) {
      const [node, depth] = queue.shift()!;
      if (node.kind === JsxNodeKind.Suspense) {
        node.children.forEach((child) => queue.push([child, depth]));
        continue;
      }
      if (node.kind !== JsxNodeKind.Element) continue;
      if (["nav", "footer", "header"].includes(node.tag.toLowerCase()) || this.layerName(node)) {
        return node;
      }
      if (depth < 3) node.children.forEach((child) => queue.push([child, depth + 1]));
    }
    return element;
  }

  // The layer name from Framer, unless it is one of its defaults.
  private layerName(element: IJsxElement): string | null {
    const name = element.props.find((prop) => prop.name === "data-framer-name")?.value;
    if (typeof name !== "string" || !name.trim() || settings.genericLayerName.test(name.trim())) {
      return null;
    }
    return name;
  }

  // The first heading's first words.
  private headingText(node: IJsxNode): string | null {
    if (node.kind === JsxNodeKind.Element && /^h[1-6]$/i.test(node.tag)) {
      const words = this.text(node).split(/\s+/).filter(Boolean).slice(0, 4);
      return words.length ? words.join(" ") : null;
    }
    const children = node.kind === JsxNodeKind.Element || node.kind === JsxNodeKind.Suspense ? node.children : [];
    for (const child of children) {
      const text = this.headingText(child);
      if (text) return text;
    }
    return null;
  }

  private text(node: IJsxNode): string {
    if (node.kind === JsxNodeKind.Text) return node.text;
    if (node.kind === JsxNodeKind.Element || node.kind === JsxNodeKind.Suspense) {
      return node.children.map((child) => this.text(child)).join(" ");
    }
    return "";
  }

  // Framer renders each breakpoint's variant and hides the others with
  // "hidden-<hash>" classes.
  private hiddenBreakpoints(element: IJsxElement): string[] {
    return this.classes(element)
      .map((name) => /^hidden-([a-z0-9]+)$/.exec(name)?.[1])
      .filter((hash): hash is string => hash !== undefined);
  }

  // "Desktop", "Phone", or "DesktopTablet" for a part shown on only some
  // breakpoints; nothing for one shown on all.
  private breakpointSuffix(hidden: Set<string>, context: ISplitContext): string {
    const visible = [...context.breakpoints].filter(([hash]) => !hidden.has(hash));
    if (visible.length === 0 || visible.length === context.breakpoints.size) return "";
    return visible.map(([, label]) => label).join("");
  }

  // From Framer's hydration data on #main, e.g.
  // {"breakpoints":[{"hash":"72rtr7","mediaQuery":"(min-width: 1200px)"}]}
  private breakpointLabels(root: IJsxElement): Map<string, string> {
    const labels = new Map<string, string>();
    const data = root.props.find((prop) => prop.name === "data-framer-hydrate-v2")?.value;
    if (typeof data !== "string") return labels;

    let breakpoints: unknown;
    try {
      breakpoints = (JSON.parse(data) as { breakpoints?: unknown }).breakpoints;
    } catch {
      return labels;
    }
    if (!Array.isArray(breakpoints)) return labels;

    const used = new Set<string>();
    for (const breakpoint of breakpoints as { hash?: unknown; mediaQuery?: unknown }[]) {
      if (typeof breakpoint.hash !== "string" || typeof breakpoint.mediaQuery !== "string") continue;
      const hasMin = breakpoint.mediaQuery.includes("min-width");
      const hasMax = breakpoint.mediaQuery.includes("max-width");
      const label = this.uniqueName(hasMin && hasMax ? "Tablet" : hasMax ? "Phone" : "Desktop", used);
      labels.set(breakpoint.hash, label);
    }
    return labels;
  }

  private classes(element: IJsxElement): string[] {
    const value = element.props.find((prop) => prop.name === "className")?.value;
    return typeof value === "string" ? value.split(/\s+/).filter(Boolean) : [];
  }

  // "Hero section" -> "HeroSection", "3D card" -> "Section3DCard".
  public pascal(text: string): string {
    const name = text
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("")
      .slice(0, 48);
    return /^[A-Za-z]/.test(name) ? name : `Section${name}`;
  }

  public uniqueName(name: string, taken: Set<string>): string {
    let candidate = name;
    for (let index = 2; taken.has(candidate); index++) candidate = `${name}${index}`;
    taken.add(candidate);
    return candidate;
  }
}

export const jsxSections = new JsxSections();
