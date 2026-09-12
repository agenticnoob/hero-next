import { describe, expect, test } from "vitest";
import {
  createHeroFlightState,
  heroFlightPresence,
  resolveHeroFlightFrame,
  stepHeroFlight,
} from "../src/tetrahedron/flight";
import { resolveHeroChapterScrollState } from "../src/chapters/scrollState";
import { resolveHeroTetrahedronTransformFrame } from "../src/tetrahedron/transform";

const input = {
  delta: 1000 / 60,
  scrollDelta: 30,
  viewportHeight: 900,
  presence: 1,
  reducedMotion: false,
  holding: false,
};

describe("journal flight", () => {
  test("activates only where the final chapter hands over to the Timeline", () => {
    for (const id of ["self", "axioms", "builds"] as const)
      expect(heroFlightPresence(resolveHeroChapterScrollState(1, 1, id))).toBe(
        0,
      );
    expect(
      heroFlightPresence(resolveHeroChapterScrollState(1, 0.9, "signals")),
    ).toBe(0);
    expect(
      heroFlightPresence(resolveHeroChapterScrollState(1, 0.95, "signals")),
    ).toBeCloseTo(0.5);
    expect(
      heroFlightPresence(resolveHeroChapterScrollState(1, 1, "signals")),
    ).toBe(1);
  });

  test("accelerates, shrinks and banks, then settles after scrolling stops", () => {
    const state = createHeroFlightState();
    for (let i = 0; i < 60; i++) stepHeroFlight(state, input);
    const fast = resolveHeroFlightFrame(state, 1000, 1);
    expect(fast.scale).toBeLessThan(0.85);
    expect(fast.scale).toBeGreaterThanOrEqual(0.78);
    expect(fast.position[2]).toBeLessThan(0);
    expect(fast.rotation[0]).toBeLessThan(0);
    expect(fast.glow).toBeGreaterThan(0.7);
    const movingSpin = state.spin;
    for (let i = 0; i < 240; i++)
      stepHeroFlight(state, { ...input, scrollDelta: 0 });
    const rest = resolveHeroFlightFrame(state, 5000, 1);
    expect(rest.scale).toBeCloseTo(1, 3);
    expect(rest.position[0]).toBeCloseTo(0, 4);
    expect(rest.position[2]).toBeCloseTo(0, 4);
    expect(rest.rotation[0]).toBeCloseTo(0, 4);
    expect(state.spin).toBeGreaterThan(movingSpin);
  });

  test("reverse scroll changes the bank without reversing the daily data", () => {
    const forward = createHeroFlightState();
    const backward = createHeroFlightState();
    for (let i = 0; i < 60; i++) {
      stepHeroFlight(forward, input);
      stepHeroFlight(backward, { ...input, scrollDelta: -input.scrollDelta });
    }
    expect(forward.thrust).toBe(backward.thrust);
    expect(forward.steering).toBeCloseTo(-backward.steering);
    expect(forward.spin).toBe(backward.spin);
  });

  test("normalizes speed by frame duration and viewport height", () => {
    const states = [30, 60, 120].map((fps) => {
      const state = createHeroFlightState();
      for (let i = 0; i < fps; i++)
        stepHeroFlight(state, {
          ...input,
          delta: 1000 / fps,
          scrollDelta: 1800 / fps,
        });
      return state;
    });
    for (const state of states) {
      expect(state.thrust).toBeCloseTo(states[0].thrust, 5);
      expect(state.spin).toBeCloseTo(states[0].spin, 1);
    }
    const mobile = createHeroFlightState();
    for (let i = 0; i < 60; i++)
      stepHeroFlight(mobile, {
        ...input,
        viewportHeight: 450,
        scrollDelta: 15,
      });
    expect(mobile.thrust).toBeCloseTo(states[1].thrust, 5);
  });

  test("removes all flight motion for reduced motion and when leaving the final Hub", () => {
    for (const override of [{ reducedMotion: true }, { presence: 0 }]) {
      const state = { thrust: 1, steering: 1, spin: 3 };
      stepHeroFlight(state, { ...input, ...override });
      expect(state).toEqual(createHeroFlightState());
      const frame = resolveHeroFlightFrame(state, 99999, 1);
      expect(frame.scale).toBe(1);
      expect(frame.glow).toBe(0);
      for (const value of [...frame.position, ...frame.rotation])
        expect(value).toBeCloseTo(0);
    }
  });

  test("freezes self rotation while the tetrahedron is held", () => {
    const state = { thrust: 1, steering: 1, spin: 0.7 };
    for (let i = 0; i < 60; i++)
      stepHeroFlight(state, { ...input, holding: true });
    expect(state.spin).toBe(0.7);
    expect(state.thrust).toBeLessThan(0.1);
    const before = { ...state };
    stepHeroFlight(state, { ...input, delta: 0 });
    expect(state).toEqual(before);
    stepHeroFlight(state, { ...input, delta: 60000, scrollDelta: 1e9 });
    expect(state.thrust).toBeLessThanOrEqual(1);
    expect(state.spin - before.spin).toBeLessThan(0.1);
  });

  test("applies motion through the existing transform while retaining mobile space", () => {
    const base = {
      viewport: { width: 390, height: 844 },
      motion: { tiltX: 0, tiltY: 0 },
      time: 1000,
      transition: { phase: "idle" as const, coverage: 0, shakeActive: false },
      reducedMotion: false,
      chapter: resolveHeroChapterScrollState(1, 1, "signals"),
    };
    const stationary = resolveHeroTetrahedronTransformFrame(base);
    const flight = resolveHeroFlightFrame(
      { thrust: 1, steering: 1, spin: 0.4 },
      1000,
      1,
    );
    const moving = resolveHeroTetrahedronTransformFrame({ ...base, flight });
    expect(moving.scale).toBeCloseTo(stationary.scale * 0.78);
    expect(Math.abs(moving.position[0] - stationary.position[0])).toBeLessThan(
      0.003,
    );
    expect(moving.rotation[1] - stationary.rotation[1]).toBeCloseTo(0.4);
    expect(
      resolveHeroTetrahedronTransformFrame({
        ...base,
        flight,
        reducedMotion: true,
      }),
    ).toEqual(
      resolveHeroTetrahedronTransformFrame({ ...base, reducedMotion: true }),
    );
  });
});
