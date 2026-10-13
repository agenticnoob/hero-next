import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, test, vi } from "vitest";
import { useHeroJournalWindow } from "../src/journal/HeroJournal";
import {
  readJournalPanelOpacity,
  resolveJournalTextFrame,
} from "../src/journal/effect";
import { createJournalPanels } from "../src/journal/track";
import { journalTrackConfig } from "../src/journal/config";
import { heroChapterDefinitions } from "../src/chapters/definitions";

const viewport = { width: 1440, height: 900 };
const source = { left: 510, top: 450, width: 420, height: 200 };
const panels = createJournalPanels(
  [
    { date: "2026-09-08", tools: ["React"], event: "Day one" },
    { date: "2026-09-07", tools: ["Python"], event: "Day two" },
  ],
  viewport,
);
function signal(progress: number, exit = 1) {
  return {
    get: (key: string) =>
      key === journalTrackConfig.progressKey
        ? progress
        : key === heroChapterDefinitions.signals.signals.exit
          ? exit
          : 0,
  };
}

describe("paired native Timeline movement", () => {
  test("both sides share depth, vertical position and opacity when scrolling in either direction", () => {
    for (const reduced of [false, true]) {
      for (const progress of [0, 0.2, 0.5, 0.8, 1, 0.5, 0]) {
        for (const panel of panels) {
          const read = signal(progress);
          const left = resolveJournalTextFrame(
            read,
            panel,
            panels,
            reduced,
            "left",
            viewport,
            source,
          );
          const right = resolveJournalTextFrame(
            read,
            panel,
            panels,
            reduced,
            "right",
            viewport,
            source,
          );
          expect(left.visible).toBe(right.visible);
          expect(left.opacity).toBe(right.opacity);
          expect(left.opacity).toBe(
            readJournalPanelOpacity(read, panel, panels, reduced),
          );
          expect(left.depth).toBe(right.depth);
          expect(left.rect.top).toBe(right.rect.top);
          expect(
            left.rect.left + left.rect.width + right.rect.left,
          ).toBeCloseTo(viewport.width);
          expect(left.rect.width * left.depth).toBeCloseTo(
            source.width * journalTrackConfig.readingDepth,
          );
        }
      }
    }
  });

  test("keeps date and tools paired with the body's perspective and preserves their DOM offset", () => {
    for (const progress of [0, 0.25, 0.5]) {
      const date = resolveJournalTextFrame(
        signal(progress),
        panels[0],
        panels,
        false,
        "left",
        viewport,
        source,
      );
      const tools = resolveJournalTextFrame(
        signal(progress),
        panels[0],
        panels,
        false,
        "left",
        viewport,
        { ...source, top: 500, height: 400 },
      );
      expect(date.depth).toBe(tools.depth);
      expect(date.opacity).toBe(tools.opacity);
      expect(date.rect.left).toBe(tools.rect.left);
      expect((tools.rect.top - date.rect.top) * date.depth).toBeCloseTo(
        50 * journalTrackConfig.readingDepth,
      );
    }
  });

  test("reduced motion shows one stationary complete day and responds to preference changes", () => {
    const first = panels.map((panel) =>
      resolveJournalTextFrame(
        signal(0.1),
        panel,
        panels,
        true,
        "left",
        viewport,
        source,
      ),
    );
    const second = panels.map((panel) =>
      resolveJournalTextFrame(
        signal(0.9),
        panel,
        panels,
        true,
        "left",
        viewport,
        source,
      ),
    );
    expect(first.map((frame) => frame.visible)).toEqual([true, false]);
    expect(second.map((frame) => frame.visible)).toEqual([false, true]);
    expect(first[0].rect).toEqual(second[1].rect);
    expect(first[0].depth).toBe(journalTrackConfig.readingDepth);
    expect(
      resolveJournalTextFrame(
        signal(0.1),
        panels[0],
        panels,
        false,
        "left",
        viewport,
        source,
      ).rect,
    ).not.toEqual(first[0].rect);
    expect(
      resolveJournalTextFrame(
        signal(0.1, 0.65),
        panels[0],
        panels,
        true,
        "left",
        viewport,
        source,
      ).visible,
    ).toBe(false);
  });
});

test("journal window tracks live reduced-motion changes and releases subscriptions", async () => {
  const mediaListeners = new Set<() => void>();
  const progressListeners = new Set<() => void>();
  const query = {
    matches: false,
    addEventListener: (_type: string, listener: () => void) =>
      mediaListeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      mediaListeners.delete(listener),
  } as unknown as MediaQueryList;
  const media = vi.spyOn(window, "matchMedia").mockReturnValue(query);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const manyPanels = createJournalPanels(
    Array.from({ length: 40 }, (_, index) => ({
      date: `2026-09-${String(index + 1).padStart(2, "0")}`,
      tools: ["React"],
      event: "Daily event",
    })),
    viewport,
  );
  let travel = 0.6;
  let exit = 0;
  const progress = {
    get: (key: string) => signal(travel, exit).get(key),
    subscribe(listener: () => void) {
      progressListeners.add(listener);
      return () => progressListeners.delete(listener);
    },
  };
  let renderCount = 0;
  function Probe() {
    const current = useHeroJournalWindow(progress, manyPanels);
    renderCount += 1;
    return createElement(
      "output",
      { "data-reduced": current.reducedMotion },
      current.windowStart,
    );
  }
  const host = document.createElement("div");
  const root = createRoot(host);
  const notifyProgress = () =>
    progressListeners.forEach((listener) => listener());
  try {
    await act(() => root.render(createElement(Probe)));
    expect(host.textContent).toBe("-1");
    exit = 1;
    await act(notifyProgress);
    const movingWindow = host.textContent;
    const currentRenders = renderCount;
    travel += 0.00001;
    await act(notifyProgress);
    expect(renderCount).toBe(currentRenders);
    Object.defineProperty(query, "matches", {
      value: true,
      configurable: true,
    });
    await act(() => mediaListeners.forEach((listener) => listener()));
    expect(host.querySelector("output")?.dataset.reduced).toBe("true");
    expect(host.textContent).toBe("24");
    expect(host.textContent).not.toBe(movingWindow);
    expect(
      manyPanels.slice(
        Number(host.textContent),
        Number(host.textContent) + journalTrackConfig.slotCount,
      ),
    ).toHaveLength(16);
    exit = 0;
    await act(notifyProgress);
    expect(host.textContent).toBe("-1");
  } finally {
    await act(() => root.unmount());
    media.mockRestore();
    vi.unstubAllGlobals();
  }
  expect(mediaListeners.size).toBe(0);
  expect(progressListeners.size).toBe(0);
});
