"use client";

import { useState } from "react";
import Button from "@/components/shared/Button";
import NewConversionModal from "@/components/dashboard/dashboard/NewConversionModal";

export default function NewConvertButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
        className="rounded-lg w-full max-w-full min-[822px]:max-w-34.5 h-8.5 min-[822px]:h-10"
      >
        New convert
      </Button>
      <NewConversionModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
