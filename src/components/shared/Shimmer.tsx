import { cn } from "@/lib/utils";
import { ClassNameProps } from "@/types/shared";

export default function Shimmer({ className }: ClassNameProps) {
  return (
    <div aria-hidden className={cn("relative overflow-hidden rounded bg-cdcdce1/70", className)}>
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/60 to-transparent animate-[shimmer_1.5s_infinite] motion-reduce:hidden" />
    </div>
  );
}
