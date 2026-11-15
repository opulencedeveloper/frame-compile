import { FaqItem, PageSeo } from "@/types/seo";

export const siteSeo = {
  name: "FrameCompile",
  // The production address. Canonical links, the sitemap, structured data
  // and share images always name it, wherever the app runs.
  url: "https://framecompile.com",
  // Search results show about 155 characters of a description.
  description:
    "Convert any published Framer site into a production-ready Next.js project: React components that match your pages exactly, ready to download or deploy.",
  // One sentence that says what the product is, for answer engines and AI
  // search to quote.
  definition:
    "FrameCompile is a tool that converts a published Framer website into a production-ready Next.js project, from nothing but the site's URL.",
  tagline: "Turn your Framer site into clean Next.js code",
  email: "framecompile@gmail.com",
  locale: "en_US",
  category: "technology",
  // When the public pages' content last changed, for the sitemap.
  lastUpdated: "2026-11-15",
};

export const pageSeo = {
  home: {
    title: "Framer to Next.js Converter: Clean React Code | FrameCompile",
    description: siteSeo.description,
    path: "/",
  },
  privacy: {
    title: "Privacy Policy",
    description:
      "How FrameCompile collects, uses and protects your information when you convert Framer sites to Next.js, and the choices you have.",
    path: "/privacy-policy",
  },
  terms: {
    title: "Terms of Service",
    description:
      "The terms for using FrameCompile, the tool that converts Framer websites into Next.js code: accounts, acceptable use, ownership of your code and liability.",
    path: "/terms-of-services",
  },
  signUp: {
    title: "Create your account",
    description:
      "Create a free FrameCompile account to convert your Framer site into a Next.js project, preview it, download the code or deploy it to Vercel.",
    path: "/sign-up",
  },
  signIn: {
    title: "Sign in",
    description: "Sign in to FrameCompile to convert Framer sites to Next.js and manage your projects.",
    path: "/sign-in",
  },
} satisfies Record<string, PageSeo>;

export const faqContent = {
  label: "FAQ",
  title: "Frequently asked questions",
};

// Shown on the home page and published as FAQPage structured data, so the
// two always match (search engines require it).
export const faqItems: FaqItem[] = [
  {
    question: "What is FrameCompile?",
    answer: `${siteSeo.definition} It captures every page, breakpoint, image, font and animation, and turns each page into React components you can preview, download as a ZIP or deploy to Vercel.`,
  },
  {
    question: "How do I convert a Framer site to Next.js?",
    answer:
      "Paste the address of your published Framer site, such as your-site.framer.website or your custom domain, and start the conversion. It usually takes a few minutes. Then preview the result, download the code, or deploy it to Vercel in one click.",
  },
  {
    question: "Will the converted site look exactly like my Framer site?",
    answer:
      "Yes. Before you get the code, every page is rendered and compared element by element with the page Framer published. Animations and interactions keep working, because Framer's own runtime runs inside the converted site.",
  },
  {
    question: "Do I need a Framer plugin or a paid Framer plan?",
    answer:
      "No. FrameCompile works from your site's public URL, so there is nothing to install. The site only needs to be published; a free framer.website address works.",
  },
  {
    question: "Does the converted site still depend on Framer?",
    answer:
      "No. Scripts, fonts, images and CMS content are copied into the project, so it keeps working if the Framer project is unpublished. Embeds you added yourself, like a booking widget, still load from their own services, and forms built with Framer's form component should be connected to your own form handler.",
  },
  {
    question: "Where can I host the converted code?",
    answer:
      "Anywhere that runs Next.js: Vercel in one click from FrameCompile, or Netlify, Railway, Render, Docker or your own server. The project is a standard Next.js app written in TypeScript, with ESLint set up.",
  },
  {
    question: "Can I edit the code after converting?",
    answer:
      "Yes. Each page is ordinary React components, named after the sections in your Framer design, with shared parts like the navigation and footer in their own files. Text, classes and styles can be changed freely.",
  },
  {
    question: "Is FrameCompile affiliated with Framer?",
    answer:
      "No. FrameCompile is an independent tool and is not affiliated with, endorsed by or sponsored by Framer B.V. Only convert sites you own or have permission to reproduce.",
  },
];
