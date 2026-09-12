import { useSyncExternalStore } from "react";
import { heroViewportStore } from "./viewportStore";

export function useHeroViewport() {
  return useSyncExternalStore(
    heroViewportStore.subscribe,
    heroViewportStore.getSnapshot,
    heroViewportStore.getServerSnapshot,
  );
}
