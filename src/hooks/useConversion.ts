import { useCallback, useEffect, useRef, useState } from "react";

import { useHttp } from "@/hooks/useHttp";
import { CONVERSION_API, CONVERSION_POLL_INTERVAL_MS } from "@/constants/conversion";
import { Conversion } from "@/types/conversion";
import { isConversionBusy } from "@/utils/conversion";

// Starts a conversion, or loads one by id, and keeps checking on it until
// it is ready or has failed.
export const useConversion = () => {
  const { isLoading: isStarting, error: startError, sendHttpRequest: sendStart } = useHttp();
  const { error: loadError, sendHttpRequest: sendLoad } = useHttp();
  const [conversion, setConversion] = useState<Conversion | null>(null);
  // Answers for a conversion that is no longer shown (after reset) are dropped.
  const activeId = useRef<string | null>(null);

  const load = useCallback(
    (id: string) => {
      activeId.current = id;
      sendLoad({
        requestConfig: { url: CONVERSION_API.DETAIL(id), method: "GET" },
        successRes: (res) => {
          const loaded = res.data.data as Conversion;
          if (activeId.current === loaded.id) setConversion(loaded);
        },
      });
    },
    [sendLoad],
  );

  const start = useCallback(
    (url: string) => {
      sendStart({
        requestConfig: { url: CONVERSION_API.CREATE, method: "POST", body: { url } },
        successRes: (res) => {
          const started = res.data.data as Conversion;
          activeId.current = started.id;
          setConversion(started);
        },
      });
    },
    [sendStart],
  );

  // An answer from elsewhere (e.g. starting a deployment) for the same
  // conversion; checking on it continues from there.
  const replace = useCallback((updated: Conversion) => {
    if (activeId.current === updated.id) setConversion(updated);
  }, []);

  const reset = useCallback(() => {
    activeId.current = null;
    setConversion(null);
  }, []);

  // Each answer replaces `conversion`, which schedules the next check.
  useEffect(() => {
    if (!conversion || !isConversionBusy(conversion)) return;
    const timer = window.setTimeout(() => load(conversion.id), CONVERSION_POLL_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [conversion, load]);

  return { conversion, start, load, replace, reset, isStarting, error: startError ?? loadError };
};
