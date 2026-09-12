import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { WebGLProgressSignalSource } from "@viselora/dom-webgl";
import { heroChapterDefinitions } from "../chapters/definitions";
import type { JournalManifest } from "./model";
import { createJournalPanels } from "./track";
import type { HeroViewport } from "../shared/viewport";
import { useJournalSnapshot } from "./useJournalSnapshot";

export function useJournal(
  manifest: JournalManifest | undefined,
  progress: WebGLProgressSignalSource,
  viewport: HeroViewport,
) {
  const subscribe = useCallback(
    (listener: () => void) =>
      progress.subscribe?.(listener) ?? (() => undefined),
    [progress],
  );
  const shouldLoad = useSyncExternalStore(
    subscribe,
    useCallback(
      () => progress.get(heroChapterDefinitions.signals.signals.entry) > 0,
      [progress],
    ),
    () => false,
  );
  const snapshot = useJournalSnapshot(manifest, shouldLoad);
  const panels = useMemo(
    () => createJournalPanels(snapshot.entries, viewport),
    [snapshot.entries, viewport],
  );
  return {
    ...snapshot,
    panels,
    viewport,
  };
}

export type HeroJournalState = ReturnType<typeof useJournal>;
