import type { BufferGeometry, Mesh, MeshStandardMaterial } from "three";

import {
  createHeroChapterAtlas,
  heroChapterAtlasMatchesViewport,
  type HeroChapterAtlas,
} from "../chapters/atlas";
import type { HeroViewport } from "../shared/viewport";
import {
  readHeroChapterTailAtlasIds,
  readHeroChapterScrollState,
  resolveHeroChapterScrollState,
  type HeroChapterScrollState,
} from "../chapters/scrollState";
import { heroChapterDefinitions } from "../chapters/definitions";
import {
  createHeroHoldTransitionState,
  resolveHeroTransitionVisual,
  stepHeroHoldTransition,
  type HeroHoldTransitionState,
} from "../transition/holdTransition";
import { heroTransitionConfig } from "../transition/transitionConfig";
import {
  publishHeroTransitionSignals,
  type HeroTransitionSignalReader,
  type HeroTransitionSignalWriter,
} from "../transition/signals";
import {
  createHeroTetrahedronMaterial,
  createHeroTetrahedronRadialUniforms,
} from "./shader";
import { updateHeroUniforms } from "../shared/shaderUniforms";
import type { HeroThemeStore } from "../preferences/theme";
import type { HeroLocaleStore } from "../preferences/locale";
import {
  createHeroMotionState,
  stepHeroMotionState,
  type HeroMotionState,
} from "./motion";
import {
  resolveHeroTetrahedronTransformFrame,
  type HeroTetrahedronTransformFrame,
} from "./transform";
import type { HeroTetrahedronFrameBinding } from "./frameBinding";
import {
  createHeroFlightState,
  heroFlightPresence,
  resolveHeroFlightFrame,
  stepHeroFlight,
  type HeroFlightFrame,
  type HeroFlightState,
} from "./flight";

export {
  createHeroMotionState,
  stepHeroMotionState,
  type HeroMotionInput,
  type HeroMotionState,
} from "./motion";

export type HeroEffectState = {
  readonly reducedMotion: boolean;
  readonly motion: HeroMotionState;
  readonly flight: HeroFlightState;
  transition: HeroHoldTransitionState;
  chapterAtlas: HeroChapterAtlas | undefined;
  previousScrollY: number | undefined;
};

type HeroTarget = Mesh<BufferGeometry, MeshStandardMaterial>;

export function createHeroEffectState(
  reducedMotion: boolean,
  committedScheme: HeroHoldTransitionState["committedScheme"] = "initial",
  chapterAtlas?: HeroChapterAtlas,
): HeroEffectState {
  return {
    reducedMotion,
    motion: createHeroMotionState(reducedMotion),
    flight: createHeroFlightState(),
    transition: createHeroHoldTransitionState(committedScheme),
    chapterAtlas,
    previousScrollY: undefined,
  };
}

export function createHeroTetrahedronResources(
  viewport: HeroViewport,
  locale: HeroLocaleStore,
  theme: HeroThemeStore,
  reducedMotion: boolean,
) {
  const atlas = createHeroChapterAtlas(viewport, locale.getSnapshot());
  return {
    ...createHeroTetrahedronMaterial(atlas.canvas),
    state: createHeroEffectState(reducedMotion, theme.getSnapshot(), atlas),
  };
}

export type HeroTetrahedronFrameInput = {
  readonly time: number;
  readonly deltaMs: number;
  readonly scrollY: number;
  readonly viewport: HeroViewport;
  readonly pixelRatio: number;
  readonly progress: HeroTransitionSignalReader;
  readonly pointer: {
    readonly inside: boolean;
    readonly x: number;
    readonly y: number;
    readonly primaryDown: boolean;
    readonly meshPressed: boolean;
    readonly hit: boolean;
  };
};

export function updateHeroTetrahedronFrame(
  target: HeroTarget,
  resources: ReturnType<typeof createHeroTetrahedronResources>,
  input: HeroTetrahedronFrameInput,
  params: {
    readonly theme: HeroThemeStore;
    readonly locale: HeroLocaleStore;
    readonly signals: HeroTransitionSignalWriter;
    readonly frameBinding: HeroTetrahedronFrameBinding;
  },
): void {
  const { state, uniforms, texture } = resources;
  const { viewport, pointer, time, deltaMs, progress } = input;
  stepHeroMotionState(state.motion, {
    time,
    delta: deltaMs,
    pointerInside: pointer.inside,
    pointerX: pointer.x,
    pointerY: pointer.y,
  });
  const committedScheme = params.theme.getSnapshot();
  // Button commits and layout changes cancel any incomplete desktop hold.
  if (
    state.transition.committedScheme !== committedScheme ||
    (viewport.reading && state.transition.phase !== "idle")
  ) {
    state.transition = createHeroHoldTransitionState(committedScheme);
  }
  const primaryPointerDown = !viewport.reading && pointer.primaryDown;
  const chapter = readHeroChapterScrollState(progress);
  const flightPresence = heroFlightPresence(chapter);
  const scrollDelta =
    state.previousScrollY === undefined
      ? 0
      : input.scrollY - state.previousScrollY;
  state.previousScrollY = input.scrollY;
  stepHeroFlight(state.flight, {
    delta: deltaMs,
    scrollDelta,
    viewportHeight: viewport.height,
    presence: flightPresence,
    reducedMotion: state.reducedMotion,
    holding: primaryPointerDown && pointer.meshPressed,
  });
  const locale = params.locale.getSnapshot();
  if (
    state.chapterAtlas &&
    !heroChapterAtlasMatchesViewport(state.chapterAtlas, viewport, locale)
  ) {
    state.chapterAtlas = createHeroChapterAtlas(viewport, locale);
    texture.image = state.chapterAtlas.canvas;
    texture.needsUpdate = true;
  }

  const previousCommittedScheme = state.transition.committedScheme;
  state.transition = stepHeroHoldTransition(state.transition, {
    interactionEnabled: !viewport.reading && chapter.hubInteractive,
    meshPressed: pointer.meshPressed,
    primaryPointerDown,
    hitConfirmed: pointer.hit,
    pointer: {
      x: clamp((pointer.x + 1) * 0.5, 0, 1),
      y: clamp((pointer.y + 1) * 0.5, 0, 1),
    },
    viewport,
    deltaMs,
    reducedMotion: state.reducedMotion,
  });
  if (state.transition.committedScheme !== previousCommittedScheme) {
    params.theme.commit(state.transition.committedScheme);
  }
  publishHeroTransitionSignals(params.signals, state.transition);
  const flight = resolveHeroFlightFrame(
    state.flight,
    time,
    state.reducedMotion ? 0 : flightPresence,
  );
  const tetrahedron = applyHeroFrame(
    target,
    state.motion,
    time,
    state.transition,
    viewport,
    state.reducedMotion,
    chapter,
    flight,
  );
  updateHeroUniforms(uniforms, {
    ...createHeroTetrahedronRadialUniforms(
      state.transition,
      viewport,
      chapter,
      readHeroChapterTailAtlasIds(progress),
    ),
    heroFlightBoost: flight.glow * (1 - state.transition.coverage),
    domWebGLPixelRatio: input.pixelRatio,
    domWebGLViewportSize: [viewport.width, viewport.height],
  });
  params.frameBinding.publish({
    tetrahedron,
    chapter,
    viewport,
    reducedMotion: state.reducedMotion,
    spinProgress: progress.get(heroChapterDefinitions.self.signals.body),
  });
}

export function applyHeroFrame(
  target: HeroTarget,
  motion: HeroMotionState,
  time: number,
  transition: HeroHoldTransitionState,
  viewport: HeroViewport,
  reducedMotion: boolean,
  chapter: HeroChapterScrollState = resolveHeroChapterScrollState(0, 0),
  flight?: HeroFlightFrame,
): HeroTetrahedronTransformFrame {
  const frame = resolveHeroTetrahedronTransformFrame({
    motion,
    time,
    transition,
    viewport,
    reducedMotion,
    chapter,
    flight,
  });

  target.scale.setScalar(frame.scale);
  target.position.set(...frame.position);
  target.rotation.set(...frame.rotation);

  const visual = resolveHeroTransitionVisual(transition);
  const opacity = lerp(
    heroTransitionConfig.motion.initialOpacity,
    1,
    chapter.screenLock,
  );
  target.visible = !chapter.domContentActive;
  target.material.color.set(visual.committed.foreground);
  target.material.emissive.set(visual.committed.foreground);
  target.material.emissiveIntensity =
    heroTransitionConfig.motion.emissiveIntensity;
  target.material.opacity = opacity;
  return frame;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * clamp(progress, 0, 1);
}
