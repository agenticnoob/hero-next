import { describe, expect, test, vi } from "vitest";
import { MeshBasicMaterial, Texture } from "three";
import type { DOMTargetState } from "@viselora/dom-webgl";
import { applyHeroTextPalette } from "../src/transition/textPaletteEffect";
import { readHeroTextLayoutKey } from "../src/shared/HeroText";
import { heroTransitionConfig } from "../src/transition/transitionConfig";
import { readJournalPanelOpacity } from "../src/journal/effect";
import { createJournalPanels } from "../src/journal/track";
import { journalTrackConfig } from "../src/journal/config";
import { heroChapterDefinitions } from "../src/chapters/definitions";

describe("native text palette continuity", () => {
  test("recolors the same texture in both directions without rebuilding or disposing glyphs", () => {
    const texture = new Texture();
    const dispose = vi.spyOn(texture, "dispose");
    const material = new MeshBasicMaterial({ map: texture });
    const initialVersion = material.version;
    const textureVersion = texture.version;
    const values = new Map<string, number>();
    const progress = { get: (key: string) => values.get(key) ?? 0 };
    for (const [scheme, foreground] of [
      [0, "424242"],
      [1, "c8c8c8"],
      [0, "424242"],
    ] as const) {
      values.set(heroTransitionConfig.signalKeys.committedScheme, scheme);
      applyHeroTextPalette(material, progress);
      expect(material.color.getHexString()).toBe(foreground);
      expect(material.opacity).toBe(1);
      expect(material.map).toBe(texture);
      expect(material.version).toBe(initialVersion);
      expect(texture.version).toBe(textureVersion);
    }
    applyHeroTextPalette(material, progress, 0.4);
    expect(material.opacity).toBe(0.4);
    expect(dispose).not.toHaveBeenCalled();
    material.dispose();
    texture.dispose();
  });

  test("snapshot signature ignores theme color and fallback opacity but tracks layout and content", () => {
    const element = document.createElement("p");
    element.textContent = "原始日期和正文";
    element.style.fontSize = "20px";
    document.body.append(element);
    const target: DOMTargetState = {
      id: "text",
      element,
      offscreen: "park",
      ready: false,
      visible: true,
      revision: 0,
      rect: {
        left: 0,
        top: 0,
        width: 420,
        height: 100,
        right: 420,
        bottom: 100,
      },
    };
    try {
      const first = readHeroTextLayoutKey(target);
      element.style.color = "#c8c8c8";
      element.style.opacity = "0";
      target.revision += 1;
      expect(readHeroTextLayoutKey(target)).toBe(first);
      element.style.fontSize = "24px";
      expect(readHeroTextLayoutKey(target)).not.toBe(first);
      element.style.fontSize = "20px";
      element.textContent = "更换日期";
      expect(readHeroTextLayoutKey(target)).not.toBe(first);
      element.textContent = "原始日期和正文";
      target.rect.width = 400;
      expect(readHeroTextLayoutKey(target)).not.toBe(first);
    } finally {
      element.remove();
    }
  });

  test("preserves journal entry and depth fades, including reduced motion", () => {
    const panels = createJournalPanels(
      [
        { date: "2026-09-08", tools: ["React"], event: "First day" },
        { date: "2026-09-07", tools: ["Python"], event: "Second day" },
      ],
      { width: 390, height: 844 },
    );
    for (const reduced of [false, true]) {
      for (const progress of [0, 0.3, 0.8, 1]) {
        const read = (exit: number) => ({
          get: (key: string) =>
            key === journalTrackConfig.progressKey
              ? progress
              : key === heroChapterDefinitions.signals.signals.exit
                ? exit
                : 0,
        });
        for (const panel of panels) {
          const full = readJournalPanelOpacity(read(1), panel, panels, reduced);
          expect(full).toBeGreaterThanOrEqual(0);
          expect(full).toBeLessThanOrEqual(1);
          expect(
            readJournalPanelOpacity(read(0.65), panel, panels, reduced),
          ).toBe(0);
          expect(
            readJournalPanelOpacity(read(0.825), panel, panels, reduced),
          ).toBeCloseTo(full / 2);
        }
      }
    }
  });
});
