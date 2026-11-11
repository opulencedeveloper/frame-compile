import { ChildNode, Element, isComment, isTag, isText } from "domhandler";
import framerConfig from "./config";
import { JsxNodeKind } from "./enum";
import { IJsxNode, IJsxProp, IJsxRaw } from "./interface";

const settings = framerConfig.jsx;

// Props React would read as instructions rather than attributes.
const RESERVED_PROPS = [
  "key",
  "ref",
  "children",
  "dangerouslySetInnerHTML",
  "suppressHydrationWarning",
  "suppressContentEditableWarning",
];

// Turns Framer's HTML into a tree of JSX nodes: attributes become React
// props, inline styles become style objects, and Framer's <!--$--> markers
// become <Suspense> boundaries, which React renders back as those markers.
// Anything React can't express is kept as raw HTML.
class JsxTree {
  // `rawElements` are kept as written: they rendered differently through
  // React (see JsxVerifier).
  public fromElement(element: Element, html: string, rawElements: Set<Element>): IJsxNode {
    return this.element(element, html, rawElements, false);
  }

  public raw(element: Element, html: string): IJsxRaw {
    return {
      kind: JsxNodeKind.Raw,
      html: html.slice(element.startIndex ?? 0, (element.endIndex ?? -1) + 1),
    };
  }

  // The declarations of a style attribute, or null when it can't be read
  // reliably (comments, or a declaration without a value).
  public parseDeclarations(css: string): [string, string][] | null {
    if (css.includes("/*")) return null;

    const declarations: [string, string][] = [];
    for (const declaration of this.splitOutside(css, ";")) {
      if (!declaration.trim()) continue;
      const [property, ...rest] = this.splitOutside(declaration, ":", 2);
      if (rest.length === 0 || !property.trim()) return null;
      const value = rest[0].trim();
      // React leaves out empty values, and so does the comparison.
      if (value) declarations.push([property.trim(), value]);
    }
    return declarations;
  }

  private element(element: Element, html: string, rawElements: Set<Element>, inSvg: boolean): IJsxNode {
    const tag = element.name;
    if (rawElements.has(element) || settings.rawTags.includes(tag.toLowerCase())) {
      return this.raw(element, html);
    }

    const isSvg = inSvg || tag.toLowerCase() === "svg";
    const props = this.props(element, isSvg);
    if (!props) return this.raw(element, html);

    // CSS is written as is: React would escape its ">" and quotes.
    if (tag.toLowerCase() === "style") {
      const css = element.children.map((child) => (isText(child) ? child.data : "")).join("");
      props.push({ name: "dangerouslySetInnerHTML", value: { html: css } });
      return { kind: JsxNodeKind.Element, tag, props, children: [], source: element };
    }

    // Inside <foreignObject>, content is HTML again.
    const childrenInSvg = isSvg && tag !== "foreignObject";
    return {
      kind: JsxNodeKind.Element,
      tag,
      props,
      children: this.children(element.children, html, rawElements, childrenInSvg),
      source: element,
    };
  }

  private children(
    nodes: ChildNode[],
    html: string,
    rawElements: Set<Element>,
    inSvg: boolean,
  ): IJsxNode[] {
    const root: IJsxNode[] = [];
    // Open Suspense boundaries, innermost last.
    const open: IJsxNode[][] = [root];

    for (const node of nodes) {
      const current = open[open.length - 1];
      if (isComment(node)) {
        if (node.data === settings.suspenseOpen) {
          open.push([]);
        } else if (node.data === settings.suspenseClose && open.length > 1) {
          const children = open.pop()!;
          open[open.length - 1].push({ kind: JsxNodeKind.Suspense, children });
        } else {
          current.push({ kind: JsxNodeKind.Raw, html: `<!--${node.data}-->` });
        }
      } else if (isText(node)) {
        current.push({ kind: JsxNodeKind.Text, text: node.data });
      } else if (isTag(node)) {
        current.push(this.element(node, html, rawElements, inSvg));
      } else {
        // CDATA and processing instructions, as written.
        current.push({
          kind: JsxNodeKind.Raw,
          html: html.slice(node.startIndex ?? 0, (node.endIndex ?? -1) + 1),
        });
      }
    }

    // A boundary that never closes: its marker stays as written.
    while (open.length > 1) {
      const children = open.pop()!;
      open[open.length - 1].push(
        { kind: JsxNodeKind.Raw, html: `<!--${settings.suspenseOpen}-->` },
        ...children,
      );
    }
    return root;
  }

  // null when an attribute can't be a React prop, so the element stays raw.
  private props(element: Element, inSvg: boolean): IJsxProp[] | null {
    const props: IJsxProp[] = [];
    const isInput = element.name.toLowerCase() === "input";

    for (const [name, value] of Object.entries(element.attribs)) {
      const lowerName = name.toLowerCase();
      // Inline handlers ("onclick") are strings; React only takes functions.
      if (lowerName.startsWith("on")) return null;

      if (lowerName === "style") {
        const declarations = this.parseDeclarations(value);
        if (!declarations) return null;
        props.push({
          name: "style",
          value: { style: declarations.map(([property, css]) => [this.styleProperty(property), css]) },
        });
        continue;
      }

      // Uncontrolled inputs: React renders these as the plain attributes.
      if (isInput && lowerName === "checked") {
        props.push({ name: "defaultChecked", value: true });
        continue;
      }
      const propName =
        isInput && lowerName === "value"
          ? "defaultValue"
          : (settings.attributeNames[lowerName] ??
            (inSvg ? settings.svgAttributeNames[lowerName] : undefined) ??
            name);
      if (RESERVED_PROPS.includes(propName)) return null;

      const isPresent = value === "" || value.toLowerCase() === lowerName;
      props.push({
        name: propName,
        value: settings.booleanProps.includes(propName) && isPresent ? true : value,
      });
    }
    return props;
  }

  // "background-color" -> "backgroundColor", "-webkit-mask" ->
  // "WebkitMask", "-ms-grid" -> "msGrid": the names React turns back into
  // those properties. Custom properties stay as they are.
  private styleProperty(property: string): string {
    if (property.startsWith("--")) return property;

    const lower = property.toLowerCase();
    const isMs = lower.startsWith("-ms-");
    const isVendor = !isMs && lower.startsWith("-");
    const bare = isMs ? `ms-${lower.slice(4)}` : isVendor ? lower.slice(1) : lower;
    const camel = bare.replace(/-([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
    return isVendor ? camel.charAt(0).toUpperCase() + camel.slice(1) : camel;
  }

  // Splits on `separator` outside quotes and parentheses, so values such as
  // url("data:image/png;base64,...") stay whole.
  private splitOutside(text: string, separator: string, limit = Infinity): string[] {
    const parts: string[] = [];
    let depth = 0;
    let quote: string | null = null;
    let start = 0;

    for (let index = 0; index < text.length && parts.length < limit - 1; index++) {
      const char = text[index];
      if (quote) {
        if (char === "\\") index++;
        else if (char === quote) quote = null;
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === "(") {
        depth++;
      } else if (char === ")") {
        depth = Math.max(0, depth - 1);
      } else if (char === separator && depth === 0) {
        parts.push(text.slice(start, index));
        start = index + 1;
      }
    }
    parts.push(text.slice(start));
    return parts;
  }
}

export const jsxTree = new JsxTree();
