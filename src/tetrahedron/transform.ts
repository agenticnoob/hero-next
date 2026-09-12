import { heroLayoutTokens } from "../shared/layoutTokens";
import { resolveHeroChapterGeometryFrame } from "../chapters/geometry";
import { heroChapterOrder } from "../chapters/definitions";
import type { HeroChapterScrollState } from "../chapters/scrollState";
import type { HeroViewport } from "../shared/viewport";
import {
  resolveHeroShake,
  type HeroHoldTransitionState,
} from "../transition/holdTransition";
import { heroTransitionConfig } from "../transition/transitionConfig";
import type { HeroMotionState } from "./motion";
import type { HeroFlightFrame } from "./flight";

type Vector3 = readonly [number, number, number];

export type HeroTetrahedronTransformFrame = {
  readonly position: Vector3;
  readonly rotation: Vector3;
  readonly scale: number;
};

export function resolveHeroTetrahedronTransformFrame(input: {
  readonly motion: Pick<HeroMotionState, "tiltX" | "tiltY">;
  readonly time: number;
  readonly transition: Pick<
    HeroHoldTransitionState,
    "coverage" | "phase" | "shakeActive"
  >;
  readonly viewport: HeroViewport;
  readonly reducedMotion: boolean;
  readonly chapter: HeroChapterScrollState;
  readonly flight?: HeroFlightFrame;
}): HeroTetrahedronTransformFrame {
  const activeAttempt =
    input.transition.phase === "expanding" ||
    input.transition.phase === "retracting";
  const hubMotionWeight = activeAttempt
    ? 1 - smoothstep(input.transition.coverage)
    : 1;
  const flightWeight = input.reducedMotion ? 0 : hubMotionWeight;
  const ambientWeight = input.reducedMotion
    ? 0
    : input.chapter.hubInteractive
      ? hubMotionWeight
      : input.chapter.domContentActive
        ? 0
        : heroTransitionConfig.motion.transitionAmbientFactor;
  const interactionWeight =
    input.reducedMotion || input.chapter.domContentActive
      ? 0
      : input.chapter.hubInteractive
        ? hubMotionWeight
        : heroTransitionConfig.motion.transitionPointerFactor *
          (1 - input.chapter.screenLock);
  const shake = resolveHeroShake(
    input.time,
    input.transition,
    input.reducedMotion,
  );
  const baseRotation = input.reducedMotion
    ? heroTransitionConfig.motion.reducedRotation
    : heroTransitionConfig.motion.baseRotation;
  const breathingPhase = (input.time / 6_000) * Math.PI * 2;
  const floatingPhase = (input.time / 8_000) * Math.PI * 2;
  const frame = resolveHeroChapterGeometryFrame(
    input.viewport,
    input.chapter,
    baseRotation,
    input.reducedMotion,
  );
  const journalScale =
    input.viewport.width <= heroLayoutTokens.compactBreakpoint &&
    input.chapter.chapterId === heroChapterOrder.at(-1)
      ? 1 - 0.7 * smoothstep((input.chapter.exitProgress - 0.75) / 0.25)
      : 1;

  return {
    scale:
      frame.scale *
      journalScale *
      (1 + ((input.flight?.scale ?? 1) - 1) * flightWeight) *
      (1 +
        Math.sin(breathingPhase) *
          heroTransitionConfig.motion.breathingScaleAmplitude *
          ambientWeight),
    position: [
      frame.position[0] +
        shake.position[0] +
        (input.flight?.position[0] ?? 0) * journalScale * flightWeight,
      frame.position[1] +
        Math.sin(floatingPhase) *
          heroTransitionConfig.motion.floatingAmplitude *
          ambientWeight +
        shake.position[1] +
        (input.flight?.position[1] ?? 0) * journalScale * flightWeight,
      frame.position[2] +
        shake.position[2] +
        (input.flight?.position[2] ?? 0) * flightWeight,
    ],
    rotation: [
      frame.rotation[0] +
        input.motion.tiltX * interactionWeight +
        shake.rotation[0] +
        (input.flight?.rotation[0] ?? 0) * flightWeight,
      frame.rotation[1] +
        input.motion.tiltY * interactionWeight +
        shake.rotation[1] +
        (input.flight?.rotation[1] ?? 0) * flightWeight,
      frame.rotation[2] +
        shake.rotation[2] +
        (input.flight?.rotation[2] ?? 0) * flightWeight,
    ],
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(value: number): number {
  const safeValue = clamp(value, 0, 1);
  return safeValue * safeValue * (3 - 2 * safeValue);
}
