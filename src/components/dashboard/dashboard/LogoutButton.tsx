"use client";

import { useState } from "react";
import PowerIcon from "@/assets/icons/power.svg";
import Button from "@/components/shared/Button";
import SmartImage from "@/components/shared/SmartImage";
import LogoutModal from "@/components/dashboard/dashboard/LogoutModal";
import { cn } from "@/lib/utils";
import { profileContent } from "@/resources/dashboard";
import { ClassNameProps } from "@/types/shared";

export default function LogoutButton({ className }: ClassNameProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        data-keep-drawer-open
        className={cn("bg-transparent text-c292929 w-max", className)}
        rightIcon={<SmartImage src={PowerIcon} alt="" width={16} height={16} />}
      >
        {profileContent.logout}
      </Button>
      <LogoutModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
