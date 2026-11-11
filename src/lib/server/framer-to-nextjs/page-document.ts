import { ChildNode, Element } from "domhandler";
import { DomUtils, parseDocument } from "htmlparser2";
import framerConfig from "./config";
import { IPageParts } from "./interface";

// Case is kept (SVG has viewBox, clipPath), SVG's self-closing tags are
// understood, and every node records where it is in the source, so any
// element can be copied out exactly as written.
const PARSE_OPTIONS = {
  lowerCaseTags: false,
  lowerCaseAttributeNames: false,
  recognizeSelfClosing: true,
  withStartIndices: true,
  withEndIndices: true,
};

class PageDocument {
  // The page's content (#main) and everything around it, or null for a page
  // without Framer's content root.
  public split(html: string): IPageParts | null {
    const document = parseDocument(html, PARSE_OPTIONS);
    const main = DomUtils.findOne(
      (element) => element.attribs.id === framerConfig.jsx.mainId,
      document.children,
      true,
    );
    if (!main || main.startIndex === null || main.endIndex === null) return null;

    return {
      html,
      main,
      shell: html.slice(0, main.startIndex) + framerConfig.jsx.mainMarker + html.slice(main.endIndex + 1),
    };
  }

  public parseFragment(html: string): ChildNode[] {
    return parseDocument(html, PARSE_OPTIONS).children;
  }

  // How many characters of the page an element spans.
  public sizeOf(element: Element): number {
    return (element.endIndex ?? 0) - (element.startIndex ?? 0) + 1;
  }
}

export const pageDocument = new PageDocument();
