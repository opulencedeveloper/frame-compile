import framerConfig from "./config";
import { JsxComponentKind, JsxNodeKind } from "./enum";
import { IComponentImport, IJsxComponent, IJsxFile, IJsxNode, IPageView } from "./interface";
import { jsxEmitter } from "./jsx-emitter";
import { jsxSections } from "./jsx-sections";

// Decides where every component lives and writes their files:
//   src/views/<Page>.tsx               one per page
//   src/sections/<page>/<Section>.tsx  sections only that page has
//   src/components/<Section>.tsx       sections identical on several pages
//   src/components/graphics/<Name>.tsx large inline SVGs, once each
// Children are placed before their parents, since a parent's code names
// them.
class JsxFiles {
  public assemble(pages: IPageView[]): IJsxFile[] {
    const imports = new Map<IJsxComponent, IComponentImport>();
    const importOf = (component: IJsxComponent) => imports.get(component)!;
    const identifierOf = (component: IJsxComponent) => importOf(component).identifier;
    const files: IJsxFile[] = [];

    const graphics: [IJsxComponent, string][] = [];
    const sections: [IJsxComponent, string][] = [];
    for (const { component, slug } of pages) {
      this.collect(component.root, slug, graphics, sections);
    }

    const write = (component: IJsxComponent, target: IComponentImport, path: string) => {
      files.push({
        path,
        source: jsxEmitter.source(component, target.identifier, importOf, framerConfig.jsx.rawHtmlImport),
      });
    };

    // Graphics: one file per distinct SVG, wherever it appears.
    const graphicNames = new Set<string>();
    const graphicsByBody = new Map<string, IComponentImport>();
    for (const [graphic] of graphics) {
      const body = jsxEmitter.body(graphic, identifierOf);
      let target = graphicsByBody.get(body);
      if (!target) {
        const name = jsxSections.uniqueName(graphic.name, graphicNames);
        target = { identifier: name, path: `@/components/graphics/${name}` };
        graphicsByBody.set(body, target);
        write(graphic, target, `src/components/graphics/${name}.tsx`);
      }
      imports.set(graphic, target);
    }

    // Sections: shared when the same code is on more than one page.
    const bodies = new Map<IJsxComponent, string>();
    const pagesByBody = new Map<string, Set<string>>();
    for (const [section, slug] of sections) {
      const body = jsxEmitter.body(section, identifierOf);
      bodies.set(section, body);
      pagesByBody.set(body, (pagesByBody.get(body) ?? new Set()).add(slug));
    }

    const sharedNames = new Set<string>(["RawHtml"]);
    const pageNames = new Map<string, Set<string>>();
    const sectionsByKey = new Map<string, IComponentImport>();
    for (const [section, slug] of sections) {
      const body = bodies.get(section)!;
      const isShared = pagesByBody.get(body)!.size > 1;
      const key = isShared ? body : `${slug}\n${body}`;

      let target = sectionsByKey.get(key);
      if (!target) {
        if (isShared) {
          const name = jsxSections.uniqueName(section.name, sharedNames);
          target = { identifier: name, path: `@/components/${name}` };
          write(section, target, `src/components/${name}.tsx`);
        } else {
          const names = pageNames.get(slug) ?? new Set<string>();
          pageNames.set(slug, names);
          const name = jsxSections.uniqueName(section.name, names);
          target = { identifier: name, path: `@/sections/${slug}/${name}` };
          write(section, target, `src/sections/${slug}/${name}.tsx`);
        }
        sectionsByKey.set(key, target);
      }
      imports.set(section, target);
    }

    for (const { component } of pages) {
      write(component, { identifier: component.name, path: "" }, `src/views/${component.name}.tsx`);
    }
    return files;
  }

  public usesRawHtml(files: IJsxFile[]): boolean {
    return files.some((file) => file.source.includes(`from "${framerConfig.jsx.rawHtmlImport}"`));
  }

  // Every component under a node, children before their parents.
  private collect(
    node: IJsxNode,
    slug: string,
    graphics: [IJsxComponent, string][],
    sections: [IJsxComponent, string][],
  ) {
    if (node.kind === JsxNodeKind.Element || node.kind === JsxNodeKind.Suspense) {
      node.children.forEach((child) => this.collect(child, slug, graphics, sections));
      return;
    }
    if (node.kind !== JsxNodeKind.Component) return;

    const { component } = node;
    this.collect(component.root, slug, graphics, sections);
    (component.kind === JsxComponentKind.Graphic ? graphics : sections).push([component, slug]);
  }
}

export const jsxFiles = new JsxFiles();
