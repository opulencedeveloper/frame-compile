import AutomatedNextExportImage from "@/assets/images/automated-Next-export.svg";
import UrlBasedConversionImage from "@/assets/images/url-based-conversion.svg";
import PreviewImage from "@/assets/images/preview.svg";
import DeployAnyWhereImage from "@/assets/images/deploy-anywhere.svg";
import { HowItWorksStep, PerformanceHighlight } from "@/types/home";

export const performanceHighlights: PerformanceHighlight[] = [
  {
    title: "3x Faster Load Speeds",
    description:
      "Zero unnecessary JavaScript libraries attached to your visual layouts.",
  },
  {
    title: "100% Web Vitals Ready",
    description:
      "Asset optimization out of the box with modern WebP images and SVG handling.",
  },
  {
    title: "Clean DOM Structure",
    description:
      "Human-readable code generated specifically for seamless developer handoff.",
  },
];

export const howItWorksSteps: HowItWorksStep[] = [
  {
    title: "Automated Next.js Export",
    description:
      "Transform your canvas into a full Next.js web application with structured component mappings and clean React code.",
    image: AutomatedNextExportImage,
  },
  {
    title: "URL Based Conversion",
    description:
      "No plugins required. Drop in your live Framer link and get production-ready Next.js code in seconds.",
    image: UrlBasedConversionImage,
  },
  {
    title: "Preview",
    description:
      "Preview project file structures, asset sizes, and interactive elements before downloading your codebase.",
    image: PreviewImage,
  },
  {
    title: "Deploy Anywhere",
    description:
      "Grab your clean Next.js ZIP bundle and ship instantly to Vercel, Netlify, or any modern hosting stack.",
    image: DeployAnyWhereImage,
  },
];
