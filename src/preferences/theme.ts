import type { HeroSchemeName } from "../transition/transitionConfig";
import {
  createPersistedPreferenceStore,
  persistPreference,
  readPreference,
  type PreferenceStorage,
  type PreferenceStore,
} from "./persistedStore";

export const heroThemeStorageKey = "viselora.hero.theme.v1";
export type HeroThemeStorage = PreferenceStorage;
export type HeroThemeStore = PreferenceStore<HeroSchemeName>;

const themePreference = {
  key: heroThemeStorageKey,
  fallback: "initial" as const,
  parse: (value: string | null): HeroSchemeName =>
    value === "inverted" ? "inverted" : "initial",
};

export function createHeroThemeStore(
  storage?: HeroThemeStorage,
): HeroThemeStore {
  return createPersistedPreferenceStore(themePreference, storage);
}

export function readPersistedHeroTheme(
  storage: HeroThemeStorage | undefined,
): HeroSchemeName {
  return readPreference(storage, themePreference);
}

export function persistHeroTheme(
  storage: HeroThemeStorage | undefined,
  scheme: HeroSchemeName,
): void {
  persistPreference(storage, heroThemeStorageKey, scheme);
}
