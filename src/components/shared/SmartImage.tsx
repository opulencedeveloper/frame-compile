"use client";

import Image from "next/image";
import { useState } from "react";
import { SmartImageProps } from "@/types/shared";
import { cn } from "@/lib/utils";

export default function SmartImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  preload = false,
  blurDataURL,
  useSkeleton = false,
  ...props
}: SmartImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const isStatic = typeof src === "object" && src !== null;
  const hasExplicitBlur = !!blurDataURL;
  const hasStaticBlur = isStatic && "blurDataURL" in src && !!src.blurDataURL;

  const shouldUseNextBlur = (hasExplicitBlur || hasStaticBlur) && !useSkeleton;

  const isFill = props.fill === true;
  const wrapperClasses = cn("relative overflow-hidden", isFill && "w-full h-full", containerClassName);

  return (
    <div className={wrapperClasses}>
      {!shouldUseNextBlur && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 z-10 overflow-hidden bg-gray-200/80 transition-opacity duration-500 pointer-events-none",
            isLoaded && "opacity-0",
          )}
        >
          {!isLoaded && (
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent w-full h-full animate-[shimmer_1.5s_infinite] skew-x-[-20deg] motion-reduce:hidden" />
          )}
        </div>
      )}

      <Image
        src={src}
        alt={alt}
        className={`transition-opacity duration-700 ease-in-out ${
          !isLoaded && !shouldUseNextBlur && !isStatic ? "opacity-0" : "opacity-100"
        } ${className}`}
        onLoad={() => setIsLoaded(true)}
        placeholder={shouldUseNextBlur ? "blur" : undefined}
        blurDataURL={blurDataURL}
        loading={preload ? "eager" : "lazy"}
        {...props}
      />
    </div>
  );
}
