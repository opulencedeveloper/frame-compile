import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RequestErrorsState } from "@/types/shared";

const initialState: RequestErrorsState = {
  errors: {},
  retryCount: 0,
};

// Retry functions can't live in the store, so "Try again" only clears the
// errors and raises retryCount; each failed request then retries itself
// (see useRequestError).
const requestErrorsSlice = createSlice({
  name: "requestErrors",
  initialState,
  reducers: {
    setError(state, action: PayloadAction<{ id: string; message: string }>) {
      state.errors[action.payload.id] = action.payload.message;
    },

    clearError(state, action: PayloadAction<string>) {
      delete state.errors[action.payload];
    },

    retryAll(state) {
      state.errors = {};
      state.retryCount += 1;
    },
  },
});

export const requestErrorsActions = requestErrorsSlice.actions;
export default requestErrorsSlice;
