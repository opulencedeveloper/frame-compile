import framerConfig from "./config";
import { JsxNodeKind } from "./enum";
import {
  IComponentImport,
  IJsxComponent,
  IJsxElement,
  IJsxEmitState,
  IJsxNode,
  IJsxProp,
} from "./interface";

const settings = framerConfig.jsx;
const INDENT = "  ";
const JSX_ATTRIBUTE_NAME = /^[A-Za-z_$][\w$-]*$/;
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
// Text that reads the same as JSX text: no characters JSX would interpret.
const PLAIN_TEXT = /^[^{}<>&\r\n]*$/;
const PLAIN_ATTRIBUTE = /^[^"&{}<>\\\r\n]*$/;
const MAX_PROPS_LINE = 100;

// Writes JSX trees as readable TSX: one element per line, inline text on one
// line so its spacing survives, and raw HTML as named constants.
class JsxEmitter {
  // The component's code without its name and imports, for spotting
  // identical components across pages.
  public body(component: IJsxComponent, identifierOf: (child: IJsxComponent) => string): string {
    const state = this.state(identifierOf);
    const jsx = this.node(component.root, 2, state);
    return `${state.rawConstants.join("\n")}\n${jsx}`;
  }

  public source(
    component: IJsxComponent,
    name: string,
    importOf: (child: IJsxComponent) => IComponentImport,
    rawHtmlImport: string,
  ): string {
    // First pass: which components this one uses. Each import path then
    // gets one identifier, unique in this file (a shared section and one of
    // the page's own can have the same name).
    const used = this.state((child) => importOf(child).identifier);
    this.node(component.root, 2, used);
    const identifiers = this.fileIdentifiers([...used.children].map(importOf), name);

    const state = this.state((child) => identifiers.get(importOf(child).path)!);
    const jsx = this.node(component.root, 2, state);

    const imports: string[] = [];
    if (state.usesSuspense) imports.push('import { Suspense } from "react";');
    if (state.usesRaw) imports.push(`import RawHtml from "${rawHtmlImport}";`);
    for (const [path, identifier] of [...identifiers].sort(([a], [b]) => a.localeCompare(b))) {
      imports.push(`import ${identifier} from "${path}";`);
    }

    const constants = state.rawConstants.length ? `\n${state.rawConstants.join("\n")}\n` : "";
    return `${imports.join("\n")}${imports.length ? "\n" : ""}${constants}
export default function ${name}() {
  return (
${jsx}
  );
}
`;
  }

  // Import path -> identifier, avoiding the component's own name, Suspense
  // and RawHtml.
  private fileIdentifiers(children: IComponentImport[], ownName: string): Map<string, string> {
    const taken = new Set([ownName, "Suspense", "RawHtml"]);
    const identifiers = new Map<string, string>();
    for (const { identifier, path } of [...children].sort((a, b) => a.path.localeCompare(b.path))) {
      if (identifiers.has(path)) continue;
      let candidate = identifier;
      for (let index = 2; taken.has(candidate); index++) candidate = `${identifier}${index}`;
      taken.add(candidate);
      identifiers.set(path, candidate);
    }
    return identifiers;
  }

  private state(identifierOf: (component: IJsxComponent) => string): IJsxEmitState {
    return { identifierOf, usesSuspense: false, usesRaw: false, rawConstants: [], children: new Set() };
  }

  private node(node: IJsxNode, depth: number, state: IJsxEmitState): string {
    const pad = INDENT.repeat(depth);
    switch (node.kind) {
      case JsxNodeKind.Text:
        return `${pad}${PLAIN_TEXT.test(node.text) && node.text === node.text.trim() && node.text ? node.text : `{${JSON.stringify(node.text)}}`}`;
      case JsxNodeKind.Raw:
        return `${pad}<RawHtml html={${this.rawConstant(node.html, state)}} />`;
      case JsxNodeKind.Component:
        state.children.add(node.component);
        return `${pad}<${state.identifierOf(node.component)} />`;
      case JsxNodeKind.Suspense: {
        state.usesSuspense = true;
        if (node.children.length === 0) return `${pad}<Suspense fallback={null} />`;
        const children = node.children.map((child) => this.node(child, depth + 1, state));
        return `${pad}<Suspense fallback={null}>\n${children.join("\n")}\n${pad}</Suspense>`;
      }
      case JsxNodeKind.Element:
        return this.element(node, depth, state);
    }
  }

  private element(element: IJsxElement, depth: number, state: IJsxEmitState): string {
    const pad = INDENT.repeat(depth);
    const props = this.props(element.props);
    const inlineProps = props.length ? ` ${props.join(" ")}` : "";
    const fitsOneLine = inlineProps.length + element.tag.length + pad.length <= MAX_PROPS_LINE;
    const opening = fitsOneLine
      ? `<${element.tag}${inlineProps}`
      : `<${element.tag}\n${props.map((prop) => `${pad}${INDENT}${prop}`).join("\n")}\n${pad}`;

    if (element.children.length === 0) return `${pad}${opening}${fitsOneLine ? " " : ""}/>`;

    const inline = this.inline(element.children);
    if (inline !== null && inline.length <= settings.inlineMaxChars) {
      return `${pad}${opening}>${inline}</${element.tag}>`;
    }

    const children = element.children.map((child) => this.node(child, depth + 1, state));
    return `${pad}${opening}>\n${children.join("\n")}\n${pad}</${element.tag}>`;
  }

  // Short runs of text and inline tags on one line, exactly as spaced, or
  // null when the content needs the multi-line form.
  private inline(nodes: IJsxNode[]): string | null {
    let result = "";
    for (const node of nodes) {
      if (node.kind === JsxNodeKind.Text) {
        result += PLAIN_TEXT.test(node.text) ? node.text : `{${JSON.stringify(node.text)}}`;
      } else if (node.kind === JsxNodeKind.Element && settings.inlineTags.includes(node.tag.toLowerCase())) {
        const props = this.props(node.props);
        const opening = `<${node.tag}${props.length ? ` ${props.join(" ")}` : ""}`;
        if (node.children.length === 0) {
          result += `${opening} />`;
          continue;
        }
        const content = this.inline(node.children);
        if (content === null) return null;
        result += `${opening}>${content}</${node.tag}>`;
      } else {
        return null;
      }
    }
    return result;
  }

  private props(props: IJsxProp[]): string[] {
    const written: string[] = [];
    const spread: string[] = [];
    for (const { name, value } of props) {
      const isValidName = JSX_ATTRIBUTE_NAME.test(name);
      if (value === true) {
        if (isValidName) written.push(name);
        else spread.push(`${JSON.stringify(name)}: true`);
        continue;
      }
      if (typeof value === "string") {
        const isNumber = settings.numericProps.includes(name) && String(Number(value)) === value;
        if (!isValidName) spread.push(`${JSON.stringify(name)}: ${JSON.stringify(value)}`);
        else if (isNumber) written.push(`${name}={${value}}`);
        else if (PLAIN_ATTRIBUTE.test(value)) written.push(`${name}="${value}"`);
        else written.push(`${name}={${JSON.stringify(value)}}`);
        continue;
      }
      if ("style" in value) {
        const entries = value.style.map(
          ([property, css]) => `${IDENTIFIER.test(property) ? property : JSON.stringify(property)}: ${JSON.stringify(css)}`,
        );
        written.push(`style={{ ${entries.join(", ")} }}`);
        continue;
      }
      written.push(`dangerouslySetInnerHTML={{ __html: ${JSON.stringify(value.html)} }}`);
    }
    // Attribute names JSX can't spell (e.g. "@click") are spread in.
    if (spread.length) written.push(`{...{ ${spread.join(", ")} }}`);
    return written;
  }

  private rawConstant(html: string, state: IJsxEmitState): string {
    state.usesRaw = true;
    const name = `rawHtml${state.rawConstants.length + 1}`;
    state.rawConstants.push(`const ${name} =\n  ${JSON.stringify(html)};`);
    return name;
  }
}

export const jsxEmitter = new JsxEmitter();
