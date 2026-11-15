import { absoluteUrl } from "@/lib/seo";
import { faqItems, pageSeo, siteSeo } from "@/resources/seo";
import { howItWorksSteps, performanceHighlights } from "@/resources/home";

// /llms.txt: the site summarised for AI assistants and answer engines
// (llmstxt.org), built from the same content as the pages so the two never
// disagree. Rendered once at build time.

export function GET() {
  const body = `# ${siteSeo.name}

> ${siteSeo.definition}

${siteSeo.description}

## How it works

${howItWorksSteps.map((step) => `- **${step.title}**: ${step.description}`).join("\n")}

## Why the output is fast

${performanceHighlights.map((item) => `- **${item.title}**: ${item.description}`).join("\n")}

## Frequently asked questions

${faqItems.map((item) => `### ${item.question}\n\n${item.answer}`).join("\n\n")}

## Pages

- [${siteSeo.name}](${absoluteUrl(pageSeo.home.path)}): ${pageSeo.home.description}
- [${pageSeo.signUp.title}](${absoluteUrl(pageSeo.signUp.path)}): ${pageSeo.signUp.description}
- [${pageSeo.privacy.title}](${absoluteUrl(pageSeo.privacy.path)}): ${pageSeo.privacy.description}
- [${pageSeo.terms.title}](${absoluteUrl(pageSeo.terms.path)}): ${pageSeo.terms.description}

## Contact

${siteSeo.email}
`;
  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
