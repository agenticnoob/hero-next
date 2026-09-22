import {
  createPersistedPreferenceStore,
  persistPreference,
  readPreference,
  type PreferenceStorage,
  type PreferenceStore,
} from "./persistedStore";

export const heroLocales = ["zh", "en"] as const;
export type HeroLocale = (typeof heroLocales)[number];
export const heroLocaleStorageKey = "viselora.hero.locale.v1";
export type HeroLocaleStorage = PreferenceStorage;
export type HeroLocaleStore = PreferenceStore<HeroLocale>;

const localePreference = {
  key: heroLocaleStorageKey,
  fallback: "zh" as const,
  parse: (value: string | null): HeroLocale => (value === "en" ? "en" : "zh"),
};

export function createHeroLocaleStore(
  storage?: HeroLocaleStorage,
): HeroLocaleStore {
  return createPersistedPreferenceStore(localePreference, storage);
}

export function readPersistedHeroLocale(
  storage: Pick<HeroLocaleStorage, "getItem"> | undefined,
): HeroLocale {
  return readPreference(storage, localePreference);
}

export function persistHeroLocale(
  storage: HeroLocaleStorage | undefined,
  locale: HeroLocale,
): void {
  persistPreference(storage, heroLocaleStorageKey, locale);
}
