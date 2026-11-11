import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useHttp } from "@/hooks/useHttp";
import {
  CONVERSION_API,
  CONVERSION_LIST_POLL_INTERVAL_MS,
  CONVERSION_SEARCH_DEBOUNCE_MS,
} from "@/constants/conversion";
import { AppDispatch, RootState } from "@/store/redux";
import { conversionsActions } from "@/store/redux/conversions-slice";
import { ConversionList } from "@/types/conversion";
import { isConversionBusy } from "@/utils/conversion";

// Loads the dashboard's conversions into the store for its filter and
// search (debounced), and keeps checking on conversions still running.
// Used once, by the board; everything else reads the store.
export const useConversions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { conversions, nextCursor, filter, search } = useSelector((state: RootState) => state.conversions);
  const { isLoading, error, sendHttpRequest } = useHttp();
  const { sendHttpRequest: sendRefresh } = useHttp();
  const [query, setQuery] = useState(search.trim());
  // Only the latest request's answer is kept, whatever order they arrive in.
  const latestRequest = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), CONVERSION_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useCallback(
    (before?: string) => ({ filter, ...(query && { search: query }), ...(before && { before }) }),
    [filter, query],
  );

  const refresh = useCallback(() => {
    const request = ++latestRequest.current;
    sendHttpRequest({
      requestConfig: { url: CONVERSION_API.LIST, method: "GET", params: params() },
      successRes: (res) => {
        if (request === latestRequest.current) {
          dispatch(conversionsActions.setPage(res.data.data as ConversionList));
        }
      },
    });
  }, [dispatch, params, sendHttpRequest]);

  const loadMore = useCallback(() => {
    if (!nextCursor) return;
    const request = latestRequest.current;
    sendHttpRequest({
      requestConfig: { url: CONVERSION_API.LIST, method: "GET", params: params(nextCursor) },
      successRes: (res) => {
        if (request === latestRequest.current) {
          dispatch(conversionsActions.appendPage(res.data.data as ConversionList));
        }
      },
    });
  }, [dispatch, nextCursor, params, sendHttpRequest]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!conversions.some(isConversionBusy)) return;
    const timer = window.setTimeout(() => {
      sendRefresh({
        requestConfig: { url: CONVERSION_API.LIST, method: "GET", params: params() },
        successRes: (res) => dispatch(conversionsActions.refreshConversions(res.data.data as ConversionList)),
      });
    }, CONVERSION_LIST_POLL_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [conversions, dispatch, params, sendRefresh]);

  return { isLoading, error, hasMore: nextCursor !== null, loadMore };
};
