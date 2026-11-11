"use client";

import { useDispatch } from "react-redux";
import Button from "@/components/shared/Button";
import NewConversionModal from "@/components/dashboard/dashboard/NewConversionModal";
import { AppDispatch } from "@/store/redux";
import { conversionsActions } from "@/store/redux/conversions-slice";

export default function NewConvertButton() {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <>
      <Button
        aria-haspopup="dialog"
        onClick={() => dispatch(conversionsActions.openNewConversion())}
        className="rounded-lg w-full max-w-full min-[822px]:max-w-34.5 h-8.5 min-[822px]:h-10"
      >
        New convert
      </Button>
      <NewConversionModal />
    </>
  );
}
