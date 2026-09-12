import { heroChapterOrder } from "../chapters/definitions";
import type { HeroChapterScrollState } from "../chapters/scrollState";

export const heroFlightConfig = {
  fullSpeedViewportsPerSecond: 2.2,
  attackMs: 100,
  releaseMs: 420,
  shrink: 0.22,
  pullback: 0.14,
  vibration: 0.008,
  idleSpin: 0.16,
  thrustSpin: 0.65,
} as const;

export type HeroFlightState = {
  thrust: number;
  steering: number;
  spin: number;
};

export type HeroFlightFrame = {
  readonly scale: number;
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly glow: number;
};

export function createHeroFlightState(): HeroFlightState {
  return { thrust: 0, steering: 0, spin: 0 };
}

export function heroFlightPresence(chapter: HeroChapterScrollState): number {
  if (chapter.chapterId !== heroChapterOrder.at(-1)) return 0;
  const value = Math.max(0, Math.min(1, (chapter.exitProgress - 0.9) / 0.1));
  return value * value * (3 - 2 * value);
}

export function stepHeroFlight(
  state: HeroFlightState,
  input: {
    readonly delta: number;
    readonly scrollDelta: number;
    readonly viewportHeight: number;
    readonly presence: number;
    readonly reducedMotion: boolean;
    readonly holding: boolean;
  },
): void {
  if (input.reducedMotion || input.presence <= 0) {
    state.thrust = 0;
    state.steering = 0;
    state.spin = 0;
    return;
  }
  if (!Number.isFinite(input.delta) || input.delta <= 0) return;
  const delta = Math.min(64, input.delta);
  // Viselora reports displacement per frame, not pixels per second. Normalize
  // using the original elapsed time before capping the damping/integration step.
  const speed =
    input.holding || !Number.isFinite(input.scrollDelta)
      ? 0
      : (input.scrollDelta * 1000) /
        (input.delta *
          Math.max(1, input.viewportHeight) *
          heroFlightConfig.fullSpeedViewportsPerSecond);
  const direction = Math.max(-1, Math.min(1, speed));
  const target = Math.abs(direction);
  const damping =
    1 -
    Math.exp(
      -delta /
        (target > state.thrust
          ? heroFlightConfig.attackMs
          : heroFlightConfig.releaseMs),
    );
  state.thrust += (target - state.thrust) * damping;
  state.steering += (direction - state.steering) * (1 - Math.exp(-delta / 180));
  if (!input.holding) {
    state.spin =
      (state.spin +
        (delta / 1000) *
          input.presence *
          (heroFlightConfig.idleSpin +
            state.thrust * heroFlightConfig.thrustSpin)) %
      (Math.PI * 2);
  }
}

export function resolveHeroFlightFrame(
  state: HeroFlightState,
  time: number,
  presence: number,
): HeroFlightFrame {
  const thrust = state.thrust * presence;
  const seconds = time / 1000;
  return {
    scale: 1 - heroFlightConfig.shrink * thrust,
    position: [
      Math.sin(seconds * Math.PI * 2 * 7.1) *
        heroFlightConfig.vibration *
        thrust,
      Math.sin(seconds * Math.PI * 2 * 9.3) *
        heroFlightConfig.vibration *
        0.7 *
        thrust,
      -heroFlightConfig.pullback * thrust,
    ],
    rotation: [
      (-0.12 * state.steering +
        Math.sin(seconds * 1.3) * 0.025 * state.thrust) *
        presence,
      state.spin * presence,
      (0.07 * state.steering + Math.sin(seconds * 2.1) * 0.018 * state.thrust) *
        presence,
    ],
    glow: thrust,
  };
}
