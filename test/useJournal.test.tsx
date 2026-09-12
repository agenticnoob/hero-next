import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useJournal, type HeroJournalState } from "../src/journal/useJournal";
import type { JournalManifest } from "../src/journal/model";
import { heroDefaultViewport } from "../src/shared/viewport";

const manifest: JournalManifest = {
  url: `/journal/snapshot-${"a".repeat(64)}.json`,
  sha256: "a".repeat(64),
  entryCount: 1,
  latestDate: "2026-09-08",
  sourceRevision: null,
};
const snapshot = {
  schemaVersion: 2,
  sourceRevision: null,
  entries: [
    {
      date: manifest.latestDate,
      tools: ["React"],
      event: "实现 Timeline。",
    },
  ],
};

beforeEach(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterEach(() => vi.unstubAllGlobals());

describe("journal loading", () => {
  test("waits for chapter four and retries a failed snapshot request", async () => {
    let entered = false;
    const listeners = new Set<() => void>();
    const progress = {
      get: () => (entered ? 1 : 0),
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    };
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: async () => snapshot });
    vi.stubGlobal("fetch", fetcher);
    let state!: HeroJournalState;
    const root = createRoot(document.createElement("div"));
    function Probe() {
      state = useJournal(manifest, progress, heroDefaultViewport);
      return null;
    }
    try {
      await act(async () => root.render(createElement(Probe)));
      expect(fetcher).not.toHaveBeenCalled();
      await act(async () => {
        entered = true;
        listeners.forEach((listener) => listener());
      });
      expect(state.error).toContain("503");
      expect(state.entries).toHaveLength(0);
      await act(async () => state.retry());
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(state.error).toBeUndefined();
      expect(state.entries[0].date).toBe(manifest.latestDate);
    } finally {
      await act(async () => root.unmount());
    }
    expect(listeners.size).toBe(0);
  });

  test("aborts pending work on unmount and ignores its late result", async () => {
    let finish!: (value: unknown) => void;
    let signal!: AbortSignal;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url, options) => {
        signal = options.signal;
        return new Promise((resolve) => {
          finish = resolve;
        });
      }),
    );
    const progress = { get: () => 1 };
    const observed: HeroJournalState[] = [];
    const root = createRoot(document.createElement("div"));
    function Probe() {
      observed.push(useJournal(manifest, progress, heroDefaultViewport));
      return null;
    }
    await act(async () => root.render(createElement(Probe)));
    await act(async () => root.unmount());
    expect(signal.aborted).toBe(true);
    const renders = observed.length;
    await act(async () => finish({ ok: true, json: async () => snapshot }));
    expect(observed).toHaveLength(renders);
    expect(observed.at(-1)?.entries).toHaveLength(0);
  });

  test("reports malformed entries as load failures before building panels", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...snapshot,
            entries: [{ ...snapshot.entries[0], tools: null }],
          }),
        })
        .mockResolvedValueOnce({ ok: true, json: async () => snapshot }),
    );
    let state!: HeroJournalState;
    const progress = { get: () => 1 };
    const root = createRoot(document.createElement("div"));
    function Probe() {
      state = useJournal(manifest, progress, heroDefaultViewport);
      return null;
    }
    try {
      await act(async () => root.render(createElement(Probe)));
      expect(state.error).toContain("tools");
      expect(state.entries).toHaveLength(0);
      expect(state.panels).toHaveLength(0);
      await act(async () => state.retry());
      expect(state.error).toBeUndefined();
      expect(state.entries).toEqual(snapshot.entries);
    } finally {
      await act(async () => root.unmount());
    }
  });

  test("replaces loaded data when the manifest identifies another snapshot", async () => {
    const nextManifest: JournalManifest = {
      ...manifest,
      url: `/journal/snapshot-${"b".repeat(64)}.json`,
      sha256: "b".repeat(64),
      latestDate: "2026-09-09",
    };
    const nextSnapshot = {
      ...snapshot,
      entries: [{ ...snapshot.entries[0], date: nextManifest.latestDate }],
    };
    let finishNext!: (value: unknown) => void;
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => snapshot })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishNext = resolve;
          }),
      );
    vi.stubGlobal("fetch", fetcher);
    let state!: HeroJournalState;
    const progress = { get: () => 1 };
    const root = createRoot(document.createElement("div"));
    function Probe({ current }: { current: JournalManifest }) {
      state = useJournal(current, progress, heroDefaultViewport);
      return null;
    }
    try {
      await act(async () =>
        root.render(createElement(Probe, { current: manifest })),
      );
      expect(state.entries[0].date).toBe(manifest.latestDate);
      await act(async () =>
        root.render(createElement(Probe, { current: nextManifest })),
      );
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(state.entries).toHaveLength(0);
      expect(state.panels).toHaveLength(0);
      await act(async () =>
        finishNext({ ok: true, json: async () => nextSnapshot }),
      );
      expect(state.entries[0].date).toBe(nextManifest.latestDate);
    } finally {
      await act(async () => root.unmount());
    }
  });

  test("does not restart a pending request for an equivalent manifest object", async () => {
    let finish!: (value: unknown) => void;
    let signal!: AbortSignal;
    const fetcher = vi.fn((_url, options) => {
      signal = options.signal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    vi.stubGlobal("fetch", fetcher);
    let state!: HeroJournalState;
    const progress = { get: () => 1 };
    const root = createRoot(document.createElement("div"));
    function Probe({ current }: { current: JournalManifest }) {
      state = useJournal(current, progress, heroDefaultViewport);
      return null;
    }
    try {
      await act(async () =>
        root.render(createElement(Probe, { current: manifest })),
      );
      await act(async () =>
        root.render(createElement(Probe, { current: { ...manifest } })),
      );
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(signal.aborted).toBe(false);
      await act(async () => finish({ ok: true, json: async () => snapshot }));
      expect(state.entries).toEqual(snapshot.entries);
    } finally {
      await act(async () => root.unmount());
    }
  });

  test("aborts replaced requests and ignores their late result", async () => {
    const nextManifest: JournalManifest = {
      ...manifest,
      url: `/journal/snapshot-${"b".repeat(64)}.json`,
      sha256: "b".repeat(64),
      latestDate: "2026-09-09",
    };
    let finishOld!: (value: unknown) => void;
    let oldSignal!: AbortSignal;
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementationOnce((_url, options) => {
          oldSignal = options.signal;
          return new Promise((resolve) => {
            finishOld = resolve;
          });
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...snapshot,
            entries: [
              { ...snapshot.entries[0], date: nextManifest.latestDate },
            ],
          }),
        }),
    );
    let state!: HeroJournalState;
    const progress = { get: () => 1 };
    const root = createRoot(document.createElement("div"));
    function Probe({ current }: { current: JournalManifest | undefined }) {
      state = useJournal(current, progress, heroDefaultViewport);
      return null;
    }
    try {
      await act(async () =>
        root.render(createElement(Probe, { current: manifest })),
      );
      await act(async () =>
        root.render(createElement(Probe, { current: nextManifest })),
      );
      expect(oldSignal.aborted).toBe(true);
      expect(state.entries[0].date).toBe(nextManifest.latestDate);
      await act(async () =>
        finishOld({ ok: true, json: async () => snapshot }),
      );
      expect(state.entries[0].date).toBe(nextManifest.latestDate);
      await act(async () =>
        root.render(createElement(Probe, { current: undefined })),
      );
      expect(state.available).toBe(false);
      expect(state.entries).toHaveLength(0);
      expect(state.panels).toHaveLength(0);
    } finally {
      await act(async () => root.unmount());
    }
  });
});
