import { describe, expect, test } from "vitest";
import {
  createJournalPanels,
  journalPanelMotion,
  journalWindowStart,
} from "../src/journal/track";
import type { JournalEntry } from "../src/journal/model";
import { resolveHeroChapterScrollState } from "../src/chapters/scrollState";
import { resolveHeroTetrahedronTransformFrame } from "../src/tetrahedron/transform";

const entries: JournalEntry[] = Array.from({ length: 40 }, (_, i) => ({
  date: `2026-08-${String(31 - (i % 31)).padStart(2, "0")}-${i}`,
  tools: ["React", "TypeScript"],
  event: `当天 ${i} 的 Timeline 摘要。`,
}));
const panels = createJournalPanels(entries, { width: 1440, height: 900 });

describe("continuous timeline lanes", () => {
  test("keeps each date, tools and event together without splitting a day", () => {
    expect(panels).toHaveLength(entries.length);
    panels.forEach((panel, i) => {
      expect(panel.id).toBe(entries[i].date);
      expect(panel.text).toBe(entries[i].event);
      expect(panel.tools).toBe(entries[i].tools.join(" · "));
    });
  });

  test("keeps several days visible before the leading day exits", () => {
    for (const progress of [0, 0.1, 0.25, 0.5, 0.75]) {
      const visible = panels.filter(
        (panel) =>
          journalPanelMotion(progress, panel, panels, false).opacity > 0.1,
      );
      expect(visible.length).toBeGreaterThanOrEqual(3);
      expect(visible.length).toBeLessThanOrEqual(16);
      visible.forEach((panel) => {
        const index = panels.indexOf(panel);
        const start = journalWindowStart(progress, panels);
        expect(index).toBeGreaterThanOrEqual(start);
        expect(index).toBeLessThan(start + 16);
      });
    }
  });

  test("grows and descends continuously, then exits through the bottom", () => {
    const early = journalPanelMotion(0, panels[0], panels, false);
    const next = journalPanelMotion(0.01, panels[0], panels, false);
    expect(next.scale).toBeGreaterThan(early.scale);
    expect(next.y).toBeGreaterThan(early.y);
    expect(journalPanelMotion(0, panels[0], panels, false)).toEqual(early);
    const last = journalPanelMotion(1, panels.at(-1)!, panels, false);
    expect(last.y).toBeGreaterThan(1);
    expect(last.opacity).toBeCloseTo(0);
  });

  test("reserves more track distance for a long day without creating pages", () => {
    const longer = createJournalPanels(
      [entries[0], { ...entries[1], event: "完整摘要。".repeat(40) }],
      { width: 1440, height: 900 },
    );
    expect(longer).toHaveLength(2);
    expect(longer[1].offset).toBeGreaterThan(panels[1].offset);
    expect(longer[1].text).toBe("完整摘要。".repeat(40));
  });

  test("reduced motion keeps the selected pair mounted and stationary through the last day", () => {
    for (const progress of [0, 0.2, 0.5, 0.9, 1]) {
      const frames = panels.map((panel) =>
        journalPanelMotion(progress, panel, panels, true),
      );
      const selected = frames.findIndex((frame) => frame.opacity === 1);
      const start = journalWindowStart(progress, panels, true);
      expect(frames.filter((frame) => frame.opacity === 1)).toHaveLength(1);
      expect(selected).toBeGreaterThanOrEqual(start);
      expect(selected).toBeLessThan(start + 16);
      expect(frames[selected]).toEqual({ scale: 1, y: 0.22, opacity: 1 });
    }
  });

  test("makes room for mobile journal text only at the final chapter exit", () => {
    const frame = (width: number, exit: number, chapter: "self" | "signals") =>
      resolveHeroTetrahedronTransformFrame({
        viewport: { width, height: 844 },
        time: 0,
        motion: { tiltX: 0, tiltY: 0 },
        transition: { phase: "idle", coverage: 0, shakeActive: false },
        reducedMotion: true,
        chapter: resolveHeroChapterScrollState(1, exit, chapter),
      });
    expect(frame(390, 1, "signals").scale).toBeCloseTo(
      frame(390, 1, "self").scale * 0.3,
    );
    expect(frame(1440, 1, "signals").scale).toBe(frame(1440, 1, "self").scale);
    expect(frame(390, 0.75, "signals").scale).toBe(
      frame(390, 0.75, "self").scale,
    );
    expect(frame(390, 1, "signals").position).toEqual(
      frame(390, 1, "self").position,
    );
  });
});
