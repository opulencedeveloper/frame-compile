import { useEffect, useId, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/redux";
import { requestErrorsActions } from "@/store/redux/request-errors-slice";

// Shows a request's error in the page's one error modal (RequestErrorModal),
// and retries the request when the user clicks "Try again" there.
export const useRequestError = (error: string | null, retry: () => void) => {
  const id = useId();
  const dispatch = useDispatch<AppDispatch>();
  const retryCount = useSelector((state: RootState) => state.requestErrors.retryCount);
  const seenRetryCount = useRef(retryCount);
  const latest = useRef({ error, retry });

  useEffect(() => {
    latest.current = { error, retry };
  }, [error, retry]);

  useEffect(() => {
    dispatch(
      error ? requestErrorsActions.setError({ id, message: error }) : requestErrorsActions.clearError(id),
    );
  }, [dispatch, id, error]);

  useEffect(() => () => void dispatch(requestErrorsActions.clearError(id)), [dispatch, id]);

  useEffect(() => {
    if (retryCount === seenRetryCount.current) return;
    seenRetryCount.current = retryCount;
    if (latest.current.error) latest.current.retry();
  }, [retryCount]);
};
