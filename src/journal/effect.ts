import { defineWebGLEffect } from "@viselora/dom-webgl";
import { heroChapterDefinitions } from "../chapters/definitions";
import { resolveHeroChapterCameraFrame } from "../chapters/geometry";
import { heroTransitionConfig } from "../transition/transitionConfig";
import type { HeroTransitionSignalReader } from "../transition/signals";
import { journalTrackConfig } from "./config";
import { journalPanelMotion, type JournalPanel } from "./track";

export type JournalTravelParams = {
  readonly kind: "hero.journal.travel";
  readonly panel: JournalPanel;
  readonly panels: readonly JournalPanel[];
  readonly side: "left" | "right";
  readonly widthFraction: number;
  readonly aspect: number;
};

type JournalTravelState = { readonly preference: MediaQueryList };
const camera = resolveHeroChapterCameraFrame();
const cameraSlope =
  2 *
  Math.tan((heroTransitionConfig.chapterGeometry.cameraFov * Math.PI) / 360);

export function readJournalPanelOpacity(
  progress: HeroTransitionSignalReader,
  panel: JournalPanel,
  panels: readonly JournalPanel[],
  reducedMotion: boolean,
): number {
  const lastExit = progress.get(heroChapterDefinitions.signals.signals.exit);
  const motion = journalPanelMotion(
    progress.get(journalTrackConfig.progressKey),
    panel,
    panels,
    reducedMotion,
  );
  return motion.opacity * journalPresence(lastExit);
}

function journalPresence(lastExit: number): number {
  return Math.max(0, Math.min(1, (lastExit - 0.65) / 0.35));
}

// Each date owns both lanes. Viselora applies perspective and moves the native
// text subtree; the consumer only supplies its camera-space path and opacity.
export const heroJournalTravelEffect = defineWebGLEffect<
  JournalTravelParams,
  JournalTravelState
>({
  kind: "hero.journal.travel",
  source: "dom/element",
  schedule: "frame",
  setup() {
    return {
      preference: window.matchMedia("(prefers-reduced-motion: reduce)"),
    };
  },
  update(ctx, state, params) {
    const lastExit = ctx.progress.get(
      heroChapterDefinitions.signals.signals.exit,
    );
    const motion = journalPanelMotion(
      ctx.progress.get(journalTrackConfig.progressKey),
      params.panel,
      params.panels,
      state.preference.matches,
    );
    const presence = journalPresence(lastExit);
    ctx.object.visible = lastExit > 0 && motion.opacity > 0.001;
    ctx.object.opacity = motion.opacity * presence;
    if (!ctx.object.visible) return;
    const depth = journalTrackConfig.readingDepth / motion.scale;
    const viewHeight = depth * cameraSlope;
    const inset = 0.3 - 0.26 * Math.min(1, motion.scale);
    const x =
      (params.side === "left" ? -1 : 1) *
      (0.5 - inset - (params.widthFraction * motion.scale) / 2) *
      viewHeight *
      params.aspect;
    const up = (0.5 - motion.y) * viewHeight;
    ctx.object.position.set(
      camera.position[0] + camera.forward[0] * depth + camera.up[0] * up + x,
      camera.position[1] + camera.forward[1] * depth + camera.up[1] * up,
      camera.position[2] + camera.forward[2] * depth + camera.up[2] * up,
    );
  },
});
