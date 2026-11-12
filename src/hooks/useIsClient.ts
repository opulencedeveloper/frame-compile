import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// False while rendering on the server and hydrating, then true: for
// rendering things that need `document`, such as portals.
export const useIsClient = () => useSyncExternalStore(subscribe, () => true, () => false);
