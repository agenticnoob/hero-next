import {
  defineWebGLSceneObjectEffect,
  type WebGLEffectMaterialFacade,
} from "@viselora/dom-webgl";

import {
  createHeroChapterAtlas,
  heroChapterAtlasMatchesViewport,
  type HeroChapterAtlas,
} from "../chapters/atlas";
import { readHeroViewport, type HeroViewport } from "../shared/viewport";
import {
  readHeroChapterTailAtlasIds,
  readHeroChapterScrollState,
  resolveHeroChapterScrollState,
  type HeroChapterScrollState,
} from "../chapters/scrollState";
import {
  heroChapterDefinitions,
  type HeroChapterId,
} from "../chapters/definitions";
import {
  createHeroHoldTransitionState,
  resolveHeroTransitionVisual,
  stepHeroHoldTransition,
  type HeroHoldTransitionState,
} from "../transition/holdTransition";
import { heroTransitionConfig } from "../transition/transitionConfig";
import {
  publishHeroTransitionSignals,
  type HeroTransitionSignalWriter,
} from "../transition/signals";
import {
  createHeroTetrahedronRadialShader,
  createHeroTetrahedronRadialUniforms,
  heroTetrahedronRadialShaderKey,
} from "./shader";
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

export type HeroEffectParams = {
  kind: "hero.tetrahedron.motion";
  signals: HeroTransitionSignalWriter;
  theme: HeroThemeStore;
  locale: HeroLocaleStore;
  frameBinding: HeroTetrahedronFrameBinding;
};

export type HeroEffectState = {
  readonly reducedMotion: boolean;
  readonly motion: HeroMotionState;
  readonly flight: HeroFlightState;
  transition: HeroHoldTransitionState;
  chapterAtlas: HeroChapterAtlas | undefined;
};

type HeroTarget = {
  position: { set(x: number, y: number, z: number): void };
  rotation: { set(x: number, y: number, z: number): void };
  scale: {
    set(x: number, y: number, z: number): void;
    setScalar(value: number): void;
  };
  visible: boolean;
  opacity: number;
  material?: WebGLEffectMaterialFacade;
};

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
  };
}

export function applyHeroFrame(
  target: HeroTarget,
  motion: HeroMotionState,
  time: number,
  transition: HeroHoldTransitionState,
  viewport: HeroViewport,
  reducedMotion: boolean,
  chapter: HeroChapterScrollState = resolveHeroChapterScrollState(0, 0),
  tailChapterIds: readonly HeroChapterId[] = [],
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
  target.opacity = opacity;
  if (target.material) {
    target.material.color.set(visual.committed.foreground);
    target.material.emissive.set(
      visual.committed.foreground,
      heroTransitionConfig.motion.emissiveIntensity,
    );
    target.material.opacity = opacity;
    target.material.shader?.setUniforms(heroTetrahedronRadialShaderKey, {
      ...createHeroTetrahedronRadialUniforms(
        transition,
        viewport,
        chapter,
        tailChapterIds,
      ),
      heroFlightBoost: (flight?.glow ?? 0) * (1 - transition.coverage),
    });
  }
  return frame;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * clamp(progress, 0, 1);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export const heroTetrahedronEffect = defineWebGLSceneObjectEffect<
  HeroEffectParams,
  HeroEffectState
>({
  kind: "hero.tetrahedron.motion",
  source: "mesh",
  schedule: "frame",
  setup(ctx, params) {
    const shader = ctx.object.material?.shader;
    if (!shader) {
      throw new Error(
        "Hero tetrahedron effect requires the managed material shader facade.",
      );
    }
    const viewport = readHeroViewport();
    const chapterAtlas = createHeroChapterAtlas(
      viewport,
      params.locale.getSnapshot(),
    );
    shader.onBeforeCompile(
      createHeroTetrahedronRadialShader(chapterAtlas.canvas),
    );
    return createHeroEffectState(
      prefersReducedMotion(),
      params.theme.getSnapshot(),
      chapterAtlas,
    );
  },
  update(ctx, state, params) {
    stepHeroMotionState(state.motion, {
      time: ctx.time,
      delta: ctx.delta,
      pointerInside: ctx.pointer.isInside,
      pointerX: ctx.pointer.normalizedX,
      pointerY: ctx.pointer.normalizedY,
    });
    const viewport = readHeroViewport();
    const committedScheme = params.theme.getSnapshot();
    // Button commits and layout changes cancel any incomplete desktop hold.
    if (
      state.transition.committedScheme !== committedScheme ||
      (viewport.reading && state.transition.phase !== "idle")
    ) {
      state.transition = createHeroHoldTransitionState(committedScheme);
    }
    const primaryPointerDown =
      !viewport.reading &&
      ctx.pointer.isDown &&
      (ctx.pointer.button === "primary" ||
        ctx.pointer.buttons.includes("primary"));
    const pointer = {
      x: clamp((ctx.pointer.normalizedX + 1) * 0.5, 0, 1),
      y: clamp((ctx.pointer.normalizedY + 1) * 0.5, 0, 1),
    };
    const chapter = readHeroChapterScrollState(ctx.progress);
    const flightPresence = heroFlightPresence(chapter);
    stepHeroFlight(state.flight, {
      delta: ctx.delta,
      scrollDelta: ctx.input.scroll.velocity,
      viewportHeight: viewport.height,
      presence: flightPresence,
      reducedMotion: state.reducedMotion,
      holding: primaryPointerDown && ctx.objectPointer.isPressed,
    });
    const locale = params.locale.getSnapshot();
    const tailChapterIds = readHeroChapterTailAtlasIds(ctx.progress);
    if (
      state.chapterAtlas &&
      !heroChapterAtlasMatchesViewport(state.chapterAtlas, viewport, locale)
    ) {
      state.chapterAtlas = createHeroChapterAtlas(viewport, locale);
      ctx.object.material?.shader?.setUniforms(heroTetrahedronRadialShaderKey, {
        heroChapterAtlas: {
          kind: "canvas-texture",
          source: state.chapterAtlas.canvas,
        },
      });
    }

    const previousCommittedScheme = state.transition.committedScheme;
    state.transition = stepHeroHoldTransition(state.transition, {
      interactionEnabled: !viewport.reading && chapter.hubInteractive,
      meshPressed: ctx.objectPointer.isPressed,
      primaryPointerDown,
      hitConfirmed: ctx.objectPointer.hit !== undefined,
      pointer,
      viewport,
      deltaMs: ctx.delta,
      reducedMotion: state.reducedMotion,
    });
    if (state.transition.committedScheme !== previousCommittedScheme) {
      params.theme.commit(state.transition.committedScheme);
    }
    publishHeroTransitionSignals(params.signals, state.transition);
    const tetrahedron = applyHeroFrame(
      ctx.object,
      state.motion,
      ctx.time,
      state.transition,
      viewport,
      state.reducedMotion,
      chapter,
      tailChapterIds,
      resolveHeroFlightFrame(
        state.flight,
        ctx.time,
        state.reducedMotion ? 0 : flightPresence,
      ),
    );
    params.frameBinding.publish({
      tetrahedron,
      chapter,
      viewport,
      reducedMotion: state.reducedMotion,
      spinProgress: ctx.progress.get(heroChapterDefinitions.self.signals.body),
    });
  },
  dispose(ctx, state, params) {
    ctx.object.material?.shader?.remove(heroTetrahedronRadialShaderKey);
    state.chapterAtlas = undefined;
    params.frameBinding.clear();
  },
});
