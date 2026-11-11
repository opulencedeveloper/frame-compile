"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CONVERT_QUERY_KEY } from "@/constants/conversion";
import { AppDispatch } from "@/store/redux";
import { conversionsActions } from "@/store/redux/conversions-slice";

export default function ConvertFromQuery() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const url = useSearchParams().get(CONVERT_QUERY_KEY);

  useEffect(() => {
    if (!url) return;
    dispatch(conversionsActions.openNewConversion(url));
    router.replace(pathname);
  }, [dispatch, pathname, router, url]);

  return null;
}
