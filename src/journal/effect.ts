import { heroChapterDefinitions } from "../chapters/definitions";
import type { HeroViewport } from "../shared/viewport";
import type { HeroTransitionSignalReader } from "../transition/signals";
import { journalTrackConfig } from "./config";
import { journalPanelMotion, type JournalPanel } from "./track";

export function readJournalPanelOpacity(
  progress: HeroTransitionSignalReader,
  panel: JournalPanel,
  panels: readonly JournalPanel[],
  reducedMotion: boolean,
): number {
  const motion = journalPanelMotion(
    progress.get(journalTrackConfig.progressKey),
    panel,
    panels,
    reducedMotion,
  );
  return motion.opacity * journalPresence(progress);
}

function journalPresence(progress: HeroTransitionSignalReader): number {
  const lastExit = progress.get(heroChapterDefinitions.signals.signals.exit);
  return Math.max(0, Math.min(1, (lastExit - 0.65) / 0.35));
}

// Keep each day's three text planes at the same depth, with the DOM offsets
// scaled around its lane anchor. Physical glyph sizes remain constant in space.
export function resolveJournalTextFrame(
  progress: HeroTransitionSignalReader,
  panel: JournalPanel,
  panels: readonly JournalPanel[],
  reducedMotion: boolean,
  side: "left" | "right",
  viewport: HeroViewport,
  source: { left: number; top: number; width: number; height: number },
) {
  const motion = journalPanelMotion(
    progress.get(journalTrackConfig.progressKey),
    panel,
    panels,
    reducedMotion,
  );
  const opacity = motion.opacity * journalPresence(progress);
  const inset = 0.3 - 0.26 * Math.min(1, motion.scale);
  const laneX =
    viewport.width / 2 +
    (side === "left" ? -1 : 1) *
      ((0.5 - inset) * viewport.width - (source.width * motion.scale) / 2);
  return {
    visible: opacity > 0.001,
    opacity,
    depth: journalTrackConfig.readingDepth / motion.scale,
    rect: {
      left: laneX + (source.left - viewport.width / 2) * motion.scale,
      top:
        motion.y * viewport.height +
        (source.top - viewport.height / 2) * motion.scale,
      width: source.width * motion.scale,
      height: source.height * motion.scale,
    },
  };
}
