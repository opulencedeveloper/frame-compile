import SmartImage from "@/components/shared/SmartImage";
import { HowItWorksStepCardProps } from "@/types/home";

export default function HowItWorksStepCard({
  step,
  title,
  description,
  image,
}: HowItWorksStepCardProps) {
  return (
    <li className="border-l border-ce2e3e9 pl-7 md:pb-15">
      <h3 className="text-c6155f5 font-nunito-500 text-sm md:text-base mb-4 md:mb-8">
        {String(step).padStart(2, "0")}. {title}
      </h3>
      <div className="h-52 w-full rounded-[17px] bg-cfafafa overflow-hidden mb-10">
        <SmartImage
          src={image}
          alt={title}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-contain"
        />
      </div>

      <p className="text-sm md:text-base text-c292929 font-nunito-400">{description}</p>
    </li>
  );
}
