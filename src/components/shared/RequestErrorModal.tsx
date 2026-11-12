"use client";

import { useDispatch, useSelector } from "react-redux";
import ErrorModal from "@/components/shared/ErrorModal";
import { AppDispatch, RootState } from "@/store/redux";
import { requestErrorsActions } from "@/store/redux/request-errors-slice";

export default function RequestErrorModal() {
  const dispatch = useDispatch<AppDispatch>();
  const message = useSelector((state: RootState) => Object.values(state.requestErrors.errors)[0] ?? null);

  return <ErrorModal message={message} onRetry={() => dispatch(requestErrorsActions.retryAll())} />;
}
