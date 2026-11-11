"use client";

import { useState } from "react";
import Input from "@/components/shared/Input";
import Button from "@/components/shared/Button";
import SmartImage from "@/components/shared/SmartImage";
import ArrowRight from "@/assets/icons/arrow-right.svg";
import { cn } from "@/lib/utils";
import { ClassNameProps } from "@/types/shared";

const DEFAULT_SITE = "your-site.framer.website";

export default function FramerUrlForm({ className }: ClassNameProps) {
  const [url, setUrl] = useState("");

  const site = url.trim().replace(/^https?:\/\//i, "") || DEFAULT_SITE;

  return (
    <>
      <div className={cn("max-w-77.5 w-full mx-auto mt-7.5 mb-5", className)}>
        <div className="w-full h-14.75 mb-1 rounded-[7px] bg-white flex items-center justify-center px-2">
          <Input
            autoFocus
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter your Framer website URL"
            aria-label="Framer website URL"
            className="border-0 outline-none text-center placeholder:text-c8a8a8a"
          />
        </div>
        <Button
          className="rounded-lg"
          rightIcon={<SmartImage src={ArrowRight} alt="" width={16} height={16} />}
        >
          Get Next.js
        </Button>
      </div>

      <p className="px-4 py-0.75 bg-cf7f6f5 rounded-[5px] text-c767676 text-sm w-max max-w-full mx-auto truncate">
        https://<span>{site}</span>
      </p>
    </>
  );
}
