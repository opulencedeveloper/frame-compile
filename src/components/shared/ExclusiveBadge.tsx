import Image from "next/image";
import exclusiveBg from "@/assets/images/bg-exc.svg";
import { cn } from "@/lib/utils";
import { ClassNameProps } from "@/types/shared";

export default function ExclusiveBadge({ className }: ClassNameProps) {
  return (
    <div
      className={cn(
        "flex w-max items-center bg-ce9f5ff rounded-full pl-1 pt-1 pb-1 pr-2.5 gap-2",
        className,
      )}
    >
      <p className="relative isolate overflow-hidden text-white font-nunito-500 text-sm rounded-full h-6 flex items-center justify-center px-3 bg-c0081d8">
        <Image
          src={exclusiveBg}
          alt=""
          aria-hidden
          fill
          sizes="84px"
          loading="eager"
          className="-z-10 object-cover"
        />
        Exclusive
      </p>
      <p className="text-c18181b font-nunito-500 text-sm">
        Framer to Production Code Engine
      </p>
    </div>
  );
}
