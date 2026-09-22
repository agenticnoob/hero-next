export type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;

export type PreferenceStore<Value extends string> = {
  getSnapshot(): Value;
  getServerSnapshot(): Value;
  subscribe(listener: () => void): () => void;
  commit(value: Value): void;
};

type PreferenceDefinition<Value extends string> = {
  readonly key: string;
  readonly fallback: Value;
  readonly parse: (value: string | null) => Value;
};

export function readPreference<Value extends string>(
  storage: Pick<PreferenceStorage, "getItem"> | undefined,
  definition: PreferenceDefinition<Value>,
): Value {
  try {
    return storage
      ? definition.parse(storage.getItem(definition.key))
      : definition.fallback;
  } catch {
    // Storage can be denied by the browser; the in-memory preference still works.
    return definition.fallback;
  }
}

export function persistPreference(
  storage: PreferenceStorage | undefined,
  key: string,
  value: string,
): void {
  try {
    storage?.setItem(key, value);
  } catch {
    // Persistence is best effort and must not prevent notifying subscribers.
  }
}

export function createPersistedPreferenceStore<Value extends string>(
  definition: PreferenceDefinition<Value>,
  storage: PreferenceStorage | undefined = readBrowserStorage(),
): PreferenceStore<Value> {
  let value = readPreference(storage, definition);
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => value,
    getServerSnapshot: () => definition.fallback,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    commit(next) {
      if (next === value) return;
      value = next;
      persistPreference(storage, definition.key, next);
      for (const listener of listeners) listener();
    },
  };
}

function readBrowserStorage(): PreferenceStorage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
