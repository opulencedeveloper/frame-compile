import { StaticImageData } from "next/image";

export interface PerformanceHighlight {
  title: string;
  description: string;
}

export interface HowItWorksStep {
  title: string;
  description: string;
  image: StaticImageData;
}

export interface HowItWorksStepCardProps extends HowItWorksStep {
  step: number;
}
