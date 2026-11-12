// A legal page (privacy policy, terms), rendered by LegalDocument.
export interface LegalDocumentContent {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

export interface LegalSection {
  // The anchor the table of contents links to.
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export type LegalBlock =
  | { type: "paragraph"; text: string; link?: LegalLink }
  | { type: "subheading"; text: string }
  | { type: "list"; items: string[] };

// Shown after a paragraph's text, e.g. the contact email.
export interface LegalLink {
  text: string;
  href: string;
}

export interface LegalDocumentProps {
  content: LegalDocumentContent;
}

export interface LegalBlockContentProps {
  block: LegalBlock;
}

export interface LegalTableOfContentsProps {
  sections: Pick<LegalSection, "id" | "title">[];
}
