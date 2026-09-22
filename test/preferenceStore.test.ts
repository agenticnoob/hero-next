import { afterEach, describe, expect, test, vi } from "vitest";
import {
  createHeroLocaleStore,
  heroLocaleStorageKey,
} from "../src/preferences/locale";
import {
  createHeroThemeStore,
  heroThemeStorageKey,
} from "../src/preferences/theme";
import type {
  PreferenceStorage,
  PreferenceStore,
} from "../src/preferences/persistedStore";

afterEach(() => vi.restoreAllMocks());

function preferenceContract<Value extends string>(
  name: string,
  create: (storage?: PreferenceStorage) => PreferenceStore<Value>,
  key: string,
  fallback: Value,
  alternate: Value,
) {
  describe(name, () => {
    test("keeps the server snapshot stable after hydration and commits", () => {
      const storage = { getItem: vi.fn(() => alternate), setItem: vi.fn() };
      const store = create(storage);
      expect(storage.getItem).toHaveBeenCalledWith(key);
      expect(store.getSnapshot()).toBe(alternate);
      expect(store.getServerSnapshot()).toBe(fallback);
      store.commit(fallback);
      expect(storage.setItem).toHaveBeenCalledWith(key, fallback);
      expect(store.getServerSnapshot()).toBe(fallback);
    });

    test("notifies once per change and releases subscriptions", () => {
      const storage = { getItem: () => null, setItem: vi.fn() };
      const store = create(storage);
      const received: Value[] = [];
      const unsubscribe = store.subscribe(() =>
        received.push(store.getSnapshot()),
      );
      store.commit(fallback);
      store.commit(alternate);
      store.commit(alternate);
      expect(received).toEqual([alternate]);
      expect(storage.setItem).toHaveBeenCalledTimes(1);
      unsubscribe();
      store.commit(fallback);
      expect(received).toEqual([alternate]);
    });

    test("continues in memory when storage reads and writes throw", () => {
      const store = create({
        getItem() {
          throw new Error("Storage denied");
        },
        setItem() {
          throw new Error("Quota exceeded");
        },
      });
      const listener = vi.fn();
      store.subscribe(listener);
      expect(store.getSnapshot()).toBe(fallback);
      store.commit(alternate);
      expect(store.getSnapshot()).toBe(alternate);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test("tolerates a denied browser localStorage getter", () => {
      vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
        throw new Error("SecurityError");
      });
      const store = create();
      expect(store.getSnapshot()).toBe(fallback);
      store.commit(alternate);
      expect(store.getSnapshot()).toBe(alternate);
    });

    test("keeps provider instances independent", () => {
      const storage = { getItem: () => null, setItem: vi.fn() };
      const first = create(storage);
      const second = create(storage);
      first.commit(alternate);
      expect(second.getSnapshot()).toBe(fallback);
    });
  });
}

preferenceContract(
  "locale preference",
  createHeroLocaleStore,
  heroLocaleStorageKey,
  "zh",
  "en",
);
preferenceContract(
  "theme preference",
  createHeroThemeStore,
  heroThemeStorageKey,
  "initial",
  "inverted",
);
