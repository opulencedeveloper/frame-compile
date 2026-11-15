import framerConfig from "./config";
import { JsxComponentKind, JsxNodeKind, JsxParamType } from "./enum";
import {
  IComponentImport,
  IJsxComponent,
  IJsxComponentParam,
  IJsxFile,
  IJsxNode,
  IJsxProp,
  IPageView,
  ISectionUse,
} from "./interface";
import { jsxEmitter } from "./jsx-emitter";
import { jsxSections } from "./jsx-sections";

const project = framerConfig.project;

// Props a section's outer element may take from where it is used. Framer
// gives the same section a different container class on each page (and a
// starting style when it animates in), which is what className and style
// are for in React.
const PLACEMENT_PROPS: Record<string, JsxParamType> = {
  className: JsxParamType.String,
  style: JsxParamType.Style,
};

// Decides where every component lives and writes their files:
//   src/views/<Page>.tsx                         one per page
//   src/components/layout/<Name>.tsx             navigation, header, footer
//                                                shared by several pages
//   src/components/shared/<Section>.tsx          other sections on several pages
//   src/components/sections/<page>/<Section>.tsx sections only that page has
//   src/components/graphics/<Name>.tsx           large inline SVGs, once each
// Children are placed before their parents, since a parent's code names
// them.
class JsxFiles {
  public assemble(pages: IPageView[]): IJsxFile[] {
    const imports = new Map<IJsxComponent, IComponentImport>();
    const importOf = (component: IJsxComponent) => imports.get(component)!;
    const identifierOf = (component: IJsxComponent) => importOf(component).identifier;
    const files: IJsxFile[] = [];

    const graphics: [IJsxComponent, string][] = [];
    const sections: ISectionUse[] = [];
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
        target = { identifier: name, path: this.importPath(project.graphicsDir, name) };
        graphicsByBody.set(body, target);
        write(graphic, target, `${project.graphicsDir}${name}.tsx`);
      }
      imports.set(graphic, target);
    }

    // Sections: shared when the same code is on more than one page, even if
    // their outer element is placed differently (see PLACEMENT_PROPS).
    const usesByShape = new Map<string, ISectionUse[]>();
    for (const use of sections) {
      const shape = jsxEmitter.body(this.withoutPlacement(use.component), identifierOf);
      usesByShape.set(shape, [...(usesByShape.get(shape) ?? []), use]);
    }

    const sharedNames = new Set<string>(["RawHtml"]);
    const pageNames = new Map<string, Set<string>>();
    const sectionsByKey = new Map<string, IComponentImport>();
    for (const uses of usesByShape.values()) {
      const isShared = new Set(uses.map((use) => use.slug)).size > 1;
      if (isShared) {
        const component = this.parameterized(uses);
        const name = jsxSections.uniqueName(component.name, sharedNames);
        const dir = project.layoutComponentName.test(name) ? project.layoutDir : project.sharedDir;
        const target = { identifier: name, path: this.importPath(dir, name) };
        imports.set(component, target);
        write(component, target, `${dir}${name}.tsx`);
        continue;
      }

      for (const { component: section, slug } of uses) {
        const key = `${slug}\n${jsxEmitter.body(section, identifierOf)}`;
        let target = sectionsByKey.get(key);
        if (!target) {
          const names = pageNames.get(slug) ?? new Set<string>();
          pageNames.set(slug, names);
          const name = jsxSections.uniqueName(section.name, names);
          const dir = `${project.sectionsDir}${slug}/`;
          target = { identifier: name, path: this.importPath(dir, name) };
          write(section, target, `${dir}${name}.tsx`);
          sectionsByKey.set(key, target);
        }
        imports.set(section, target);
      }
    }

    for (const { component } of pages) {
      write(component, { identifier: component.name, path: "" }, `${project.viewsDir}${component.name}.tsx`);
    }
    return files;
  }

  // One component for every use of a section. Placement props whose value
  // differs between uses become the component's params, and each use passes
  // its own value; identical uses share the component as it is.
  private parameterized(uses: ISectionUse[]): IJsxComponent {
    const [first] = uses;
    const root = first.component.root;
    if (root.kind !== JsxNodeKind.Element) {
      uses.forEach((use) => (use.ref.component = first.component));
      return first.component;
    }

    const valueOf = (use: ISectionUse, name: string) => {
      const useRoot = use.component.root;
      return useRoot.kind === JsxNodeKind.Element ? useRoot.props.find((prop) => prop.name === name) : undefined;
    };
    const params: IJsxComponentParam[] = Object.entries(PLACEMENT_PROPS)
      .filter(([name]) => new Set(uses.map((use) => JSON.stringify(valueOf(use, name)?.value ?? null))).size > 1)
      .map(([name, type]) => ({ name, type, optional: uses.some((use) => !valueOf(use, name)) }));

    const placed = params.map((param) => param.name);
    const props: IJsxProp[] = [
      ...params.map((param) => ({ name: param.name, value: { param: param.name } })),
      ...root.props.filter((prop) => !placed.includes(prop.name)),
    ];
    const component: IJsxComponent = params.length
      ? { ...first.component, params, root: { ...root, props } }
      : first.component;

    for (const use of uses) {
      use.ref.component = component;
      const passed = placed
        .map((name) => valueOf(use, name))
        .filter((prop): prop is IJsxProp => prop !== undefined);
      if (passed.length) use.ref.props = passed;
    }
    return component;
  }

  // The section without the props PLACEMENT_PROPS lets differ, for finding
  // the uses of one section across pages.
  private withoutPlacement(component: IJsxComponent): IJsxComponent {
    const { root } = component;
    if (root.kind !== JsxNodeKind.Element) return component;
    return { ...component, root: { ...root, props: root.props.filter((prop) => !(prop.name in PLACEMENT_PROPS)) } };
  }

  // "src/components/layout/" + "Footer" -> "@/components/layout/Footer".
  private importPath(dir: string, name: string): string {
    return `@/${dir.replace(/^src\//, "")}${name}`;
  }

  public usesRawHtml(files: IJsxFile[]): boolean {
    return files.some((file) => file.source.includes(`from "${framerConfig.jsx.rawHtmlImport}"`));
  }

  // Every component under a node, children before their parents.
  private collect(node: IJsxNode, slug: string, graphics: [IJsxComponent, string][], sections: ISectionUse[]) {
    if (node.kind === JsxNodeKind.Element || node.kind === JsxNodeKind.Suspense) {
      node.children.forEach((child) => this.collect(child, slug, graphics, sections));
      return;
    }
    if (node.kind !== JsxNodeKind.Component) return;

    const { component } = node;
    this.collect(component.root, slug, graphics, sections);
    if (component.kind === JsxComponentKind.Graphic) graphics.push([component, slug]);
    else sections.push({ component, slug, ref: node });
  }
}

export const jsxFiles = new JsxFiles();
