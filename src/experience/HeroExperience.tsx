"use client";

import type { CanvasProps } from "@react-three/fiber";
import { useWebGLRuntime } from "@viselora/dom-webgl/react";
import {
  WebGLScrollRuntime,
  useScrollEffectProgressStore,
} from "@viselora/scroll-adapters/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useHeroViewport } from "../shared/useHeroViewport";
import { HeroChapterNarrative } from "../chapters/HeroChapterNarrative";
import { heroSiteContent } from "../chapters/content";
import { HeroTetrahedron } from "../tetrahedron/HeroTetrahedron";
import {
  createHeroTetrahedronFrameBinding,
  type HeroTetrahedronFrameBinding,
} from "../tetrahedron/frameBinding";
import { HeroProfileModel } from "../profile/HeroProfileModel";
import {
  useHeroDomContentActive,
  useHeroLocaleState,
  useHeroThemeState,
} from "./useHeroExperienceState";
import { HeroGhostBackground } from "../ghost/HeroGhostBackground";
import {
  heroSmoothScroll,
  refreshHeroScrollLayout,
  restoreHeroReadingPosition,
} from "./smoothScroll";
import { readHeroChapterScrollState } from "../chapters/scrollState";
import { getHeroChapterDefinition } from "../chapters/definitions";
import { HeroPortalStage } from "../transition/HeroPortalStage";
import { HeroPortalScene } from "../transition/HeroPortalScene";
import { heroTransitionConfig } from "../transition/transitionConfig";
import { HeroAxiomsStage } from "../axioms/HeroAxiomsReader";
import { HeroAxiomsScene } from "../axioms/HeroAxiomsScene";
import { HeroProjectRoomStage } from "../projects/HeroProjectRoom";
import { HeroProjectRoomScene } from "../projects/HeroProjectRoomScene";
import { useHeroSiteState } from "./HeroSiteState";
import { useProjectRoomReturn } from "../projects/useProjectRoomReturn";
import type { JournalManifest } from "../journal/model";
import { useJournal, type HeroJournalState } from "../journal/useJournal";
import { HeroJournalStage } from "../journal/HeroJournal";
import { HeroJournalScene } from "../journal/HeroJournalScene";

type JournalSceneData = Pick<HeroJournalState, "panels" | "viewport">;

export const heroCanvasOptions = {
  gl: { antialias: true, alpha: true },
  dpr: [1, 2],
  camera: {
    fov: heroTransitionConfig.chapterGeometry.cameraFov,
    near: 0.1,
    far: 50,
    position: [0, 0, heroTransitionConfig.chapterGeometry.cameraDistance],
  },
  onCreated: ({ camera }) => {
    camera.lookAt(0, heroTransitionConfig.chapterGeometry.cameraTargetY, 0);
    camera.updateMatrixWorld();
  },
} satisfies Omit<CanvasProps, "children" | "eventSource">;

export function HeroExperience({
  journal,
}: {
  readonly journal?: JournalManifest;
}) {
  const [frameBinding] = useState(createHeroTetrahedronFrameBinding);
  const [journalScene, setJournalScene] = useState<JournalSceneData>();
  return (
    <WebGLScrollRuntime
      className="hero-runtime"
      smooth={heroSmoothScroll}
      canvas={heroCanvasOptions}
      scene={
        <HeroCanvasScene frameBinding={frameBinding} journal={journalScene} />
      }
    >
      <HeroScene journalManifest={journal} onJournalChange={setJournalScene} />
    </WebGLScrollRuntime>
  );
}

export function HeroCanvasScene({
  frameBinding,
  journal,
}: {
  readonly frameBinding: HeroTetrahedronFrameBinding;
  readonly journal?: JournalSceneData;
}) {
  const theme = useHeroThemeState();
  const locale = useHeroLocaleState();
  const { projectRoom } = useHeroSiteState();
  const viewport = useHeroViewport();
  const runtime = useWebGLRuntime();
  const pointerActive = useRef(false);
  useEffect(() => {
    const enter = () => {
      pointerActive.current = true;
    };
    const leave = () => {
      pointerActive.current = false;
    };
    window.addEventListener("pointermove", enter, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      window.removeEventListener("pointermove", enter);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
    };
  }, []);
  return (
    <group name="hero.tetrahedron.scene">
      <HeroTetrahedron
        theme={theme.store}
        locale={locale.store}
        pointerActive={pointerActive}
        frameBinding={frameBinding}
      />
      <HeroGhostBackground pointerActive={pointerActive} />
      <HeroProfileModel frameBinding={frameBinding} />
      {!viewport.reading && (
        <>
          <HeroPortalScene pointerActive={pointerActive} />
          <HeroAxiomsScene locale={locale.store} />
          <HeroProjectRoomScene
            locale={locale.store}
            room={projectRoom}
            pointerActive={pointerActive}
          />
          {journal && (
            <HeroJournalScene journal={journal} progress={runtime.progress} />
          )}
        </>
      )}
      <directionalLight
        name="hero.tetrahedron.key"
        color="#f2f2f2"
        intensity={heroTransitionConfig.visual.keyLightIntensity}
        position={[1.6, 2.2, 2.6]}
      />
      <directionalLight
        name="hero.tetrahedron.rim"
        color="#b8b8b8"
        intensity={heroTransitionConfig.visual.rimLightIntensity}
        position={[-2.2, -1.2, 0.8]}
      />
    </group>
  );
}

function HeroScene({
  journalManifest,
  onJournalChange,
}: {
  readonly journalManifest?: JournalManifest;
  readonly onJournalChange: (journal: JournalSceneData) => void;
}) {
  const store = useScrollEffectProgressStore();
  const viewport = useHeroViewport();
  const journal = useJournal(journalManifest, store.source, viewport);
  // Share only loaded panel/layout changes with the Canvas; fetching and retry
  // remain in this semantic owner, and frame progress stays in the runtime.
  useEffect(() => {
    onJournalChange({ panels: journal.panels, viewport });
  }, [journal.panels, viewport, onJournalChange]);
  useEffect(refreshHeroScrollLayout, [journal.panels, viewport]);
  const { projectRoom } = useHeroSiteState();
  useProjectRoomReturn(projectRoom, viewport);
  const theme = useHeroThemeState();
  const locale = useHeroLocaleState();
  const runtime = useWebGLRuntime();
  const readReady = useCallback(() => runtime.getDebugState().ready, [runtime]);
  const ready = useSyncExternalStore(runtime.subscribe, readReady, () => false);
  useEffect(() => {
    if (!ready)
      projectRoom.publishFrame({ ready: false, active: false, settled: true });
    refreshHeroScrollLayout();
  }, [ready, projectRoom]);
  const previousReading = useRef<boolean | undefined>(undefined);
  useLayoutEffect(() => {
    const previous = previousReading.current;
    previousReading.current = viewport.reading;
    if (previous === undefined || (!previous && !viewport.reading)) return;
    // Keep the reader in the same chapter when translation, orientation or
    // enlarged text changes its position and length. The runtime remains the
    // sole progress source and its existing Lenis performs the correction.
    const chapter = readHeroChapterScrollState(store.source);
    if (!chapter.domContentActive) return;
    const definition = getHeroChapterDefinition(chapter.chapterId);
    const body = document.querySelector<HTMLElement>(
      `#chapter-${definition.ordinal} .hero-chapter__body`,
    );
    if (!body) return;
    const bounds = body.getBoundingClientRect();
    const progress = store.source.get(definition.signals.body);
    restoreHeroReadingPosition(
      window.scrollY +
        bounds.top +
        progress * Math.max(0, bounds.height - viewport.height) +
        1,
    );
  }, [locale.locale, viewport, store.source]);
  const domContentActive = useHeroDomContentActive(store.source);
  return (
    <main
      className="hero-space"
      aria-label={heroSiteContent[locale.locale].ariaLabel}
      data-hero-theme={theme.scheme}
      data-hero-locale={locale.locale}
      data-reading-layout={viewport.reading}
      data-dom-active={domContentActive ? "true" : "false"}
      data-webgl-ready={ready ? "true" : "false"}
    >
      <HeroPortalStage locale={locale.locale} progress={store.source} />
      {!viewport.reading && (
        <>
          <HeroAxiomsStage />
          <HeroProjectRoomStage />
          <HeroJournalStage journal={journal} progress={store.source} />
        </>
      )}
      <HeroChapterNarrative
        locale={locale.locale}
        onLocaleChange={locale.store.commit}
        scheme={theme.scheme}
        onThemeChange={theme.store.commit}
        onLayoutChange={refreshHeroScrollLayout}
        projectRoom={projectRoom}
        journal={journal}
      />
    </main>
  );
}
