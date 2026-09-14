import type { WebGLProgressSignalSource } from "@viselora/dom-webgl";
import { useCallback, useSyncExternalStore } from "react";

import { readHeroChapterScrollState } from "../chapters/scrollState";
import type { HeroLocaleStore } from "../preferences/locale";
import type { HeroThemeStore } from "../preferences/theme";
import { useHeroSiteState } from "./HeroSiteState";

export function useHeroThemeState(): {
  readonly store: HeroThemeStore;
  readonly scheme: ReturnType<HeroThemeStore["getSnapshot"]>;
} {
  const { theme: store } = useHeroSiteState();
  const scheme = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  return { store, scheme };
}

export function useHeroLocaleState(): {
  readonly store: HeroLocaleStore;
  readonly locale: ReturnType<HeroLocaleStore["getSnapshot"]>;
} {
  const { locale: store } = useHeroSiteState();
  const locale = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  return { store, locale };
}

export function useHeroDomContentActive(
  source: WebGLProgressSignalSource,
): boolean {
  const subscribe = useCallback(
    (listener: () => void) => source.subscribe?.(listener) ?? (() => undefined),
    [source],
  );
  const getSnapshot = useCallback(
    () => readHeroChapterScrollState(source).domContentActive,
    [source],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
