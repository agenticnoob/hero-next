import { describe, expect, test, vi } from "vitest";
import type { WebGLEffectUpdateContext } from "@viselora/dom-webgl";
import {
  heroJournalTravelEffect,
  readJournalPanelOpacity,
} from "../src/journal/effect";
import { createJournalPanels } from "../src/journal/track";
import { journalTrackConfig } from "../src/journal/config";

describe("paired native Timeline movement", () => {
  test("both sides of a date share depth, vertical position and opacity at every progress", () => {
    const panels = createJournalPanels(
      [
        { date: "2026-09-08", tools: ["React"], event: "Day one" },
        { date: "2026-09-07", tools: ["Python"], event: "Day two" },
      ],
      { width: 1440, height: 900 },
    );
    for (const progress of [0, 0.2, 0.5, 0.8, 1, 0.5, 0]) {
      for (const panel of panels) {
        const lane = (side: "left" | "right") => {
          const position = vi.fn();
          const object = {
            visible: false,
            opacity: 0,
            position: { set: position },
          };
          const ctx = {
            object,
            progress: {
              get: (key: string) =>
                key === journalTrackConfig.progressKey ? progress : 1,
            },
          } as unknown as WebGLEffectUpdateContext;
          heroJournalTravelEffect.update?.(
            ctx,
            { preference: { matches: false } as MediaQueryList },
            {
              kind: "hero.journal.travel",
              panel,
              panels,
              side,
              widthFraction: 0.3,
              aspect: 1.6,
            },
          );
          expect(object.opacity).toBe(
            readJournalPanelOpacity(ctx.progress, panel, panels, false),
          );
          return { object, position: position.mock.calls[0] };
        };
        const left = lane("left");
        const right = lane("right");
        expect(left.object.visible).toBe(right.object.visible);
        expect(left.object.opacity).toBe(right.object.opacity);
        if (left.object.visible) {
          expect(left.position[0]).toBeCloseTo(-right.position[0]);
          expect(left.position.slice(1)).toEqual(right.position.slice(1));
        }
      }
    }
  });
});
