import type { WebGLProgressSignalSource } from "@viselora/dom-webgl";
import { PerspectiveCamera } from "three";
import { HeroText } from "../shared/HeroText";
import { placeHeroScreenPlane } from "../shared/screenPlane";
import { journalTrackConfig } from "./config";
import { resolveJournalTextFrame } from "./effect";
import { useHeroJournalWindow } from "./HeroJournal";
import type { HeroJournalState } from "./useJournal";

export function HeroJournalScene({
  journal,
  progress,
}: {
  readonly journal: Pick<HeroJournalState, "panels" | "viewport">;
  readonly progress: WebGLProgressSignalSource;
}) {
  const { panels, viewport } = journal;
  const { windowStart, reducedMotion } = useHeroJournalWindow(progress, panels);
  if (windowStart < 0) return null;
  return panels
    .slice(windowStart, windowStart + journalTrackConfig.slotCount)
    .flatMap((panel) =>
      (["date", "tools", "body"] as const).map((slot) => (
        <HeroText
          key={`${panel.id}:${slot}`}
          id={`hero.journal.${panel.id}.${slot}`}
          onFrame={(mesh, binding, { camera }) => {
            if (!(camera instanceof PerspectiveCamera)) return;
            const frame = resolveJournalTextFrame(
              progress,
              panel,
              panels,
              reducedMotion,
              slot === "body" ? "right" : "left",
              viewport,
              binding.rect,
            );
            mesh.visible = frame.visible;
            mesh.material.opacity = frame.opacity;
            if (!frame.visible) return;
            placeHeroScreenPlane(
              mesh,
              camera,
              viewport,
              frame.depth,
              frame.rect,
            );
          }}
        />
      )),
    );
}
