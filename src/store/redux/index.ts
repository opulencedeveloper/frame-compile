import { combineReducers, configureStore } from "@reduxjs/toolkit";
import conversionsReducer from "./conversions-slice";

// Nothing is persisted: every slice is loaded fresh from the API.
const rootReducer = combineReducers({
  conversions: conversionsReducer.reducer,
});

// A new store per browser tab (see ClientProvider), not one per module: on
// the server a module-level store would be shared by every request, so one
// user's state could render into another's page.
export const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // Disabled in production for performance.
        immutableCheck: process.env.NODE_ENV !== "production",
      }),
    // Only in development.
    devTools: process.env.NODE_ENV !== "production",
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
