import { Color, Mesh, PerspectiveCamera, PointLight } from "three";
import { placeHeroScreenPlane } from "../src/shared/screenPlane";
import { describe, expect, test } from "vitest";

import {
  resolveHeroGhostCursorIntensityScale,
  resolveHeroGhostProgramState,
  resolveHeroPointerLightIntensityScale,
} from "../src/ghost/backgroundEffect";
import {
  createHeroPointerLightState,
  heroPointerLightKey,
  resolveHeroPointerLightTarget,
  updateHeroPointerLight,
} from "../src/ghost/pointerLight";
import { createHeroHoldTransitionState } from "../src/transition/holdTransition";
import {
  publishHeroTransitionSignals,
  type HeroTransitionSignalReader,
  type HeroTransitionSignalWriter,
} from "../src/transition/signals";

describe("hero Ghost Cursor effects", () => {
  test("resolves responsive world scale with six-percent overscan", () => {
    const mesh = new Mesh();
    const camera = new PerspectiveCamera(38, 2048 / 403);
    placeHeroScreenPlane(
      mesh,
      camera,
      { width: 2048, height: 403 },
      5,
      undefined,
      1.06,
    );
    expect(mesh.scale.toArray()).toEqual([
      expect.closeTo(18.548236455, 9),
      expect.closeTo(3.649872701, 9),
      1,
    ]);
  });

  test("resolves semantic radial state from shared transition signals", () => {
    const viewport = { width: 1200, height: 835 };
    const values = new Map<string, number>();
    const writer = {
      set(key: string, value: number) {
        values.set(key, value);
      },
    } satisfies HeroTransitionSignalWriter;
    const reader = {
      get(key: string) {
        return values.get(key) ?? 0;
      },
    } satisfies HeroTransitionSignalReader;
    const idle = createHeroHoldTransitionState("initial");

    publishHeroTransitionSignals(writer, idle);
    expect(resolveHeroGhostProgramState(reader, viewport)).toEqual({
      baseBackgroundColor: "#C8C8C8",
      baseForegroundColor: "#424242",
      targetBackgroundColor: "#C8C8C8",
      targetForegroundColor: "#424242",
      radialOrigin: [0.5, 0.5],
      radialRadiusPx: 0,
      radialEdgePx: 1.5,
      sceneOpacity: 1,
    });

    const expanding = {
      ...idle,
      targetScheme: "inverted" as const,
      coverage: 0.5,
      origin: { x: 0.25, y: 0.75 },
      phase: "expanding" as const,
      shakeActive: true,
    };
    publishHeroTransitionSignals(writer, expanding);
    const expandingProgram = resolveHeroGhostProgramState(reader, viewport);
    expect(expandingProgram).toMatchObject({
      baseBackgroundColor: "#C8C8C8",
      baseForegroundColor: "#424242",
      targetBackgroundColor: "#424242",
      targetForegroundColor: "#C8C8C8",
      radialOrigin: [0.25, 0.75],
      radialRadiusPx: expect.any(Number),
      radialEdgePx: 1.5,
      sceneOpacity: 1,
    });
    expect(expandingProgram.radialRadiusPx).toBeGreaterThan(0);
    expect(expanding).toMatchObject({
      coverage: 0.5,
      origin: { x: 0.25, y: 0.75 },
      phase: "expanding",
    });

    publishHeroTransitionSignals(writer, {
      ...expanding,
      coverage: 0.25,
      phase: "retracting",
    });
    expect(resolveHeroGhostProgramState(reader, viewport)).toMatchObject({
      baseBackgroundColor: "#C8C8C8",
      targetBackgroundColor: "#424242",
      targetForegroundColor: "#C8C8C8",
      sceneOpacity: 1,
    });

    publishHeroTransitionSignals(writer, idle);
    expect(resolveHeroGhostProgramState(reader, viewport)).toMatchObject({
      baseBackgroundColor: "#C8C8C8",
      targetBackgroundColor: "#C8C8C8",
      targetForegroundColor: "#424242",
      radialRadiusPx: 0,
      sceneOpacity: 1,
    });

    publishHeroTransitionSignals(writer, {
      ...idle,
      committedScheme: "inverted",
      targetScheme: "inverted",
      coverage: 1,
      phase: "awaiting-release",
    });
    expect(resolveHeroGhostProgramState(reader, viewport)).toMatchObject({
      baseBackgroundColor: "#424242",
      baseForegroundColor: "#C8C8C8",
      targetBackgroundColor: "#424242",
      targetForegroundColor: "#C8C8C8",
      sceneOpacity: 1,
    });

    publishHeroTransitionSignals(writer, idle);
    values.set("hero.chapter-1.entry", 1);
    expect(resolveHeroGhostProgramState(reader, viewport)).toMatchObject({
      baseBackgroundColor: "#424242",
      baseForegroundColor: "#C8C8C8",
      targetBackgroundColor: "#424242",
      targetForegroundColor: "#C8C8C8",
      sceneOpacity: 1,
    });
    expect(resolveHeroPointerLightIntensityScale(reader)).toBeCloseTo(0.01);
    expect(resolveHeroGhostCursorIntensityScale(reader)).toBeCloseTo(0.1);

    values.set("hero.chapter-1.exit", 0.5);
    expect(resolveHeroPointerLightIntensityScale(reader)).toBeCloseTo(0.505);
    expect(resolveHeroGhostCursorIntensityScale(reader)).toBeCloseTo(0.55);

    values.set("hero.chapter-1.exit", 1);
    expect(resolveHeroPointerLightIntensityScale(reader)).toBe(1);
    expect(resolveHeroGhostCursorIntensityScale(reader)).toBe(1);
  });

  test("maps target-local pointer coordinates around the tetrahedron", () => {
    expect(
      resolveHeroPointerLightTarget({
        localX: 500,
        localY: 250,
        width: 1000,
        height: 500,
      }),
    ).toEqual([0, 0.365, 0.8]);
    expect(
      resolveHeroPointerLightTarget({
        localX: 1000,
        localY: 0,
        width: 1000,
        height: 500,
      }),
    ).toEqual([1.05, 1.085, 0.8]);
  });

  test("damps pointer-light position and updates one stable light key", () => {
    const light = new PointLight();
    const state = createHeroPointerLightState(false);

    updateHeroPointerLight(light, state, {
      active: true,
      localX: 1000,
      localY: 0,
      width: 1000,
      height: 500,
      delta: 16,
    });
    updateHeroPointerLight(light, state, {
      active: true,
      localX: 1000,
      localY: 0,
      width: 1000,
      height: 500,
      delta: 16,
    });

    expect(state.x).toBeGreaterThan(0);
    expect(state.x).toBeLessThan(1.05);
    expect(state.y).toBeGreaterThan(0.365);
    expect(state.y).toBeLessThan(1.085);
    expect(light.name).toBe(heroPointerLightKey);
    expect(light.color).toEqual(new Color("#f0f0f0"));
    expect(light.intensity).toBe(state.intensity);
    expect(light.distance).toBe(1.8);
    expect(light.decay).toBe(3);
    expect(light.position.toArray()).toEqual([state.x, state.y, state.z]);
  });

  test("raises the focused pointer light toward intensity ten", () => {
    const light = new PointLight();
    const state = createHeroPointerLightState(false);

    for (let frame = 0; frame < 20; frame += 1) {
      updateHeroPointerLight(light, state, {
        active: true,
        localX: 500,
        localY: 250,
        width: 1000,
        height: 500,
        delta: 64,
      });
    }

    expect(state.intensity).toBeCloseTo(10, 3);
  });

  test("caps the focused pointer light at a restrained chapter intensity", () => {
    const light = new PointLight();
    const state = createHeroPointerLightState(false);

    for (let frame = 0; frame < 20; frame += 1) {
      updateHeroPointerLight(light, state, {
        active: true,
        localX: 500,
        localY: 250,
        width: 1000,
        height: 500,
        delta: 64,
        intensityScale: 0.04,
      });
    }

    expect(state.intensity).toBeCloseTo(0.4, 3);
  });

  test("immediately caps residual Hub light when jumping into the profile", () => {
    const light = new PointLight();
    const state = createHeroPointerLightState(false);
    state.intensity = 10;
    updateHeroPointerLight(light, state, {
      active: true,
      localX: 500,
      localY: 250,
      width: 1000,
      height: 500,
      delta: 16,
      intensityScale: 0.01,
    });
    expect(state.intensity).toBeCloseTo(0.1);
  });

  test("fades pointer-light intensity after the pointer leaves", () => {
    const light = new PointLight();
    const state = createHeroPointerLightState(false);

    updateHeroPointerLight(light, state, {
      active: true,
      localX: 500,
      localY: 250,
      width: 1000,
      height: 500,
      delta: 64,
    });
    const activeIntensity = state.intensity;
    updateHeroPointerLight(light, state, {
      active: false,
      localX: 0,
      localY: 0,
      width: 1000,
      height: 500,
      delta: 16,
    });

    expect(activeIntensity).toBeGreaterThan(0);
    expect(state.intensity).toBeGreaterThan(0);
    expect(state.intensity).toBeLessThan(activeIntensity);
  });

  test("keeps a static low-intensity light under reduced motion", () => {
    const light = new PointLight();
    const state = createHeroPointerLightState(true);

    updateHeroPointerLight(light, state, {
      active: true,
      localX: 1000,
      localY: 0,
      width: 1000,
      height: 500,
      delta: 16,
    });
    updateHeroPointerLight(light, state, {
      active: true,
      localX: 0,
      localY: 500,
      width: 1000,
      height: 500,
      delta: 16,
    });

    expect(state).toMatchObject({
      x: 0,
      y: 0.365,
      z: 0.8,
      intensity: 0.45,
    });
    expect(light.position.toArray()).toEqual([0, 0.365, 0.8]);
    expect(light.intensity).toBe(0.45);
  });

  test("safely no-ops before the R3F light ref is attached", () => {
    const state = createHeroPointerLightState(false);

    expect(() =>
      updateHeroPointerLight(undefined, state, {
        active: true,
        localX: 1000,
        localY: 0,
        width: 1000,
        height: 500,
        delta: 16,
      }),
    ).not.toThrow();
  });
});
