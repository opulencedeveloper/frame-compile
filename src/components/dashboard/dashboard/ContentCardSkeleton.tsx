import Shimmer from "@/components/shared/Shimmer";

export default function ContentCardSkeleton() {
  return (
    <div className="w-full">
      <Shimmer className="w-full h-58.5 rounded-xl mb-2.5" />
      <div className="flex justify-between items-start">
        <div className="space-y-1.5">
          <Shimmer className="h-4 w-36" />
          <Shimmer className="h-3 w-24" />
        </div>
        <Shimmer className="h-6 w-8 rounded-md" />
      </div>
    </div>
  );
}
