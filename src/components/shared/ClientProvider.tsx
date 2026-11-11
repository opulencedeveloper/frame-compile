"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store/redux";
import { ClientProviderProps } from "@/types/shared";

export default function ClientProvider({ children }: ClientProviderProps) {
  const [store] = useState(makeStore);
  return <Provider store={store}>{children}</Provider>;
}
