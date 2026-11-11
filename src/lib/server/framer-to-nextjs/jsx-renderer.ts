import { ChildNode, Element, isComment, isTag, isText } from "domhandler";
import { createElement, Suspense, type ReactNode } from "react";
import framerConfig from "./config";
import { JsxNodeKind } from "./enum";
import { IJsxNode, IPageParts, IVerifiedJsx, JsxPropValue } from "./interface";
import { jsxTree } from "./jsx-tree";
import { pageDocument } from "./page-document";

const settings = framerConfig.jsx;

// Renders JSX trees with React, exactly as a generated project does (see
// its src/render.ts), and proves the result is the page Framer published.
class JsxRenderer {
  // The page's content as JSX that renders to the same DOM as Framer's
  // HTML. Every element React renders differently is kept as raw HTML, and
  // the tree is rendered and compared again until nothing differs.
  public async verified(parts: IPageParts): Promise<IVerifiedJsx> {
    const rawElements = new Set<Element>();

    for (let pass = 0; pass < settings.maxVerifyPasses; pass++) {
      const root = jsxTree.fromElement(parts.main, parts.html, rawElements);
      const rendered = pageDocument.parseFragment(await this.render(root));
      const mismatches = new Set<Element>();
      this.compare(rendered, [parts.main], parts.main, mismatches);
      if (mismatches.size === 0) return { root, rawCount: rawElements.size };

      // The content root itself can only be kept whole.
      if (mismatches.has(parts.main) || [...mismatches].every((element) => rawElements.has(element))) {
        break;
      }
      mismatches.forEach((element) => rawElements.add(element));
    }

    return { root: jsxTree.raw(parts.main, parts.html), rawCount: 1 };
  }

  // The HTML React renders for a tree, as the generated project's
  // src/render.ts post-processes it.
  public async render(root: IJsxNode): Promise<string> {
    // Imported when called: Next.js only allows react-dom/server in route
    // code that loads it at request time, and this runs inside one.
    const { renderToString } = await import("react-dom/server");
    // Rendered inside <body> so the preloads React adds for priority images
    // land before it, outside the content, and are dropped.
    const body = renderToString(createElement("body", null, this.toReact(root)));
    const start = body.indexOf("<body>") + "<body>".length;
    return body
      .slice(start, body.lastIndexOf("</body>"))
      .replaceAll(settings.textSeparator, "")
      .replaceAll(`<template ${settings.rawAttribute}="">${settings.rawMarkerOpen}`, "")
      .replaceAll(`${settings.rawMarkerClose}</template>`, "");
  }

  private toReact(node: IJsxNode): ReactNode {
    switch (node.kind) {
      case JsxNodeKind.Text:
        return node.text;
      case JsxNodeKind.Suspense:
        return createElement(Suspense, { fallback: null }, ...node.children.map((child) => this.toReact(child)));
      case JsxNodeKind.Raw:
        return createElement("template", {
          [settings.rawAttribute]: "",
          dangerouslySetInnerHTML: {
            __html: `${settings.rawMarkerOpen}${node.html}${settings.rawMarkerClose}`,
          },
        });
      case JsxNodeKind.Component:
        return this.toReact(node.component.root);
      case JsxNodeKind.Element: {
        const props = Object.fromEntries(node.props.map(({ name, value }) => [name, this.propValue(value)]));
        return createElement(node.tag, props, ...node.children.map((child) => this.toReact(child)));
      }
    }
  }

  private propValue(value: JsxPropValue) {
    if (value === true || typeof value === "string") return value;
    if ("style" in value) return Object.fromEntries(value.style);
    return { __html: value.html };
  }

  // Walks both trees together. Where they first differ, the original
  // element is recorded: its attributes differ, or (for a different number
  // or kind of children) its parent's content does.
  private compare(
    rendered: ChildNode[],
    original: ChildNode[],
    parent: Element,
    mismatches: Set<Element>,
  ) {
    if (rendered.length !== original.length) {
      mismatches.add(parent);
      return;
    }

    for (let index = 0; index < original.length; index++) {
      const a = rendered[index];
      const b = original[index];
      if (a.type !== b.type) {
        mismatches.add(parent);
        return;
      }
      if (isText(a) && isText(b)) {
        if (a.data !== b.data) {
          mismatches.add(parent);
          return;
        }
      } else if (isComment(a) && isComment(b)) {
        if (a.data !== b.data) {
          mismatches.add(parent);
          return;
        }
      } else if (isTag(a) && isTag(b)) {
        if (a.name.toLowerCase() !== b.name.toLowerCase()) {
          mismatches.add(parent);
          return;
        }
        if (!this.sameAttributes(a, b)) {
          mismatches.add(b);
          continue;
        }
        this.compare(a.children, b.children, b, mismatches);
      }
    }
  }

  // Names are case-insensitive in HTML; inline styles compare by their
  // declarations, since React writes "a:b" where Framer wrote "a: b;".
  private sameAttributes(rendered: Element, original: Element): boolean {
    const a = this.normalizedAttributes(rendered);
    const b = this.normalizedAttributes(original);
    if (a.size !== b.size) return false;
    for (const [name, value] of b) {
      if (a.get(name) !== value) return false;
    }
    return true;
  }

  private normalizedAttributes(element: Element): Map<string, string> {
    const attributes = new Map<string, string>();
    for (const [name, value] of Object.entries(element.attribs)) {
      const lower = name.toLowerCase();
      attributes.set(lower, lower === "style" ? this.normalizedStyle(value) : value);
    }
    return attributes;
  }

  private normalizedStyle(css: string): string {
    const declarations = jsxTree.parseDeclarations(css);
    if (!declarations) return css;
    // Like a style object: a repeated property keeps its first position and
    // its last value.
    const merged = new Map<string, string>();
    for (const [property, value] of declarations) {
      const key = property.startsWith("--") ? property : property.toLowerCase();
      merged.set(key, value.replace(/\s+/g, " "));
    }
    return [...merged].map(([property, value]) => `${property}:${value}`).join(";");
  }
}

export const jsxRenderer = new JsxRenderer();
