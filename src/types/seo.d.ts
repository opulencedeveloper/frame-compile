// A public page's title, description and path, for its metadata.
export interface PageSeo {
  title: string;
  description: string;
  path: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface JsonLdProps {
  // A schema.org object, or a graph of them.
  data: Record<string, unknown>;
}

export interface OgImageContent {
  title: string;
  subtitle: string;
}
