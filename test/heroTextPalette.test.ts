import { describe, expect, test, vi } from "vitest";
import type {
  WebGLEffectSetupContext,
  WebGLEffectUpdateContext,
} from "@viselora/dom-webgl";
import {
  heroTextPaletteEffect,
  heroTextPaletteDeclaration,
  heroTextPaletteProgram,
} from "../src/transition/textPaletteEffect";
import { heroTransitionConfig } from "../src/transition/transitionConfig";
import { readJournalPanelOpacity } from "../src/journal/effect";
import { createJournalPanels } from "../src/journal/track";
import { journalTrackConfig } from "../src/journal/config";
import { heroChapterDefinitions } from "../src/chapters/definitions";

describe("native text palette continuity", () => {
  test("recolors the same native texture in both directions without touching glyphs or motion", () => {
    const uniforms = vi.fn();
    const dispose = vi.fn();
    const createMaterialLayer = vi.fn(() => ({
      setUniforms: uniforms,
      dispose,
    }));
    const setGlyphs = vi.fn();
    const rotation = { x: 0.12, y: -0.3, z: 0 };
    const values = new Map<string, number>();
    const ctx = {
      object: {
        text: { material: { createMaterialLayer }, setGlyphs },
        rotation,
      },
      progress: { get: (key: string) => values.get(key) ?? 0 },
    } as unknown as WebGLEffectUpdateContext;
    const params = heroTextPaletteDeclaration;
    const state = heroTextPaletteEffect.setup!(
      ctx as unknown as WebGLEffectSetupContext,
      params,
    );
    for (const [scheme, foreground] of [
      [0, 66 / 255],
      [1, 200 / 255],
      [0, 66 / 255],
    ]) {
      values.set(heroTransitionConfig.signalKeys.committedScheme, scheme);
      heroTextPaletteEffect.update!(ctx, state, params);
      expect(uniforms).toHaveBeenLastCalledWith({
        heroTextColor: [foreground, foreground, foreground],
        heroTextOpacity: 1,
      });
      const calls = uniforms.mock.calls.length;
      heroTextPaletteEffect.update!(ctx, state, params);
      expect(uniforms).toHaveBeenCalledTimes(calls);
    }
    expect(createMaterialLayer).toHaveBeenCalledExactlyOnceWith({
      key: "hero.text.palette",
      mode: "replace-source",
      sourceTextureUniform: "heroTextSource",
      program: heroTextPaletteProgram,
    });
    expect(setGlyphs).not.toHaveBeenCalled();
    expect(ctx.object.rotation).toEqual(rotation);
    const readOpacity = vi.fn((_progress, reduced: boolean) =>
      reduced ? 0.4 : 0.2,
    );
    const faded = { ...params, readOpacity };
    heroTextPaletteEffect.update!(ctx, state, faded);
    expect(uniforms.mock.lastCall?.[0].heroTextOpacity).toBe(0.2);
    Object.defineProperty(state.preference, "matches", { value: true });
    heroTextPaletteEffect.update!(ctx, state, faded);
    expect(uniforms.mock.lastCall?.[0].heroTextOpacity).toBe(0.4);
    heroTextPaletteEffect.dispose!(ctx, state, params);
    expect(dispose).toHaveBeenCalledOnce();
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
