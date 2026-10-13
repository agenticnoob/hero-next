import { describe, expect, test, vi } from "vitest";
import { BufferGeometry, Group, Mesh, MeshStandardMaterial } from "three";

import { createHeroTetrahedronFrameBinding } from "../src/tetrahedron/frameBinding";
import {
  connectHeroProfileModelFrame,
  resolveHeroProfileModelFrame,
} from "../src/profile/modelEffect";
import {
  applyHeroFrame,
  createHeroEffectState,
  createHeroMotionState,
  stepHeroMotionState,
  updateHeroTetrahedronFrame,
  type HeroTetrahedronFrameInput,
} from "../src/tetrahedron/effect";
import { createHeroTetrahedronMaterial } from "../src/tetrahedron/shader";
import { resolveHeroChapterGeometryFrame } from "../src/chapters/geometry";
import { resolveHeroChapterScrollState } from "../src/chapters/scrollState";
import {
  createHeroHoldTransitionState,
  type HeroHoldTransitionState,
} from "../src/transition/holdTransition";
import { heroTransitionConfig } from "../src/transition/transitionConfig";
import { getHeroChapterDefinition } from "../src/chapters/definitions";
import { createHeroThemeStore } from "../src/preferences/theme";
import { createHeroLocaleStore } from "../src/preferences/locale";

const desktop = { width: 1200, height: 835 } as const;
const mobile = { width: 390, height: 844 } as const;

function createTarget(
  material = new MeshStandardMaterial({
    opacity: 0.92,
    metalness: 0.62,
    roughness: 0.28,
  }),
) {
  const target = new Mesh(new BufferGeometry(), material);
  vi.spyOn(target.position, "set");
  vi.spyOn(target.rotation, "set");
  vi.spyOn(target.scale, "set");
  vi.spyOn(target.scale, "setScalar");
  return target;
}

function createFrameFixture(reducedMotion = false) {
  const resources = {
    ...createHeroTetrahedronMaterial(document.createElement("canvas")),
    state: createHeroEffectState(reducedMotion),
  };
  const target = createTarget(resources.material);
  const params = {
    frameBinding: createHeroTetrahedronFrameBinding(),
    signals: { set: vi.fn() },
    theme: createHeroThemeStore({ getItem: () => null, setItem: vi.fn() }),
    locale: createHeroLocaleStore({ getItem: () => null, setItem: vi.fn() }),
  };
  const input: HeroTetrahedronFrameInput = {
    time: 16,
    deltaMs: 16,
    scrollY: 0,
    viewport: desktop,
    pixelRatio: 2,
    progress: { get: () => 0 },
    pointer: {
      inside: true,
      x: 0.4,
      y: -0.2,
      primaryDown: true,
      meshPressed: true,
      hit: true,
    },
  };
  return {
    target,
    resources,
    params,
    input,
    update(overrides: Partial<HeroTetrahedronFrameInput> = {}) {
      updateHeroTetrahedronFrame(
        target,
        resources,
        { ...input, ...overrides },
        params,
      );
    },
  };
}

function transition(
  values: Partial<HeroHoldTransitionState>,
): HeroHoldTransitionState {
  return { ...createHeroHoldTransitionState(), ...values };
}

describe("hero tetrahedron native frames", () => {
  test.each(["model-first", "mesh-first"])(
    "shares the exact final frame with the profile for %s connection",
    (order) => {
      const fixture = createFrameFixture();
      const model = new Group();
      const publish = vi.spyOn(fixture.params.frameBinding, "publish");
      if (order === "mesh-first") fixture.update();
      const disconnect = connectHeroProfileModelFrame(
        model,
        fixture.params.frameBinding,
      );
      const chapterSignals = getHeroChapterDefinition("signals").signals;
      for (let index = 0; index < 120; index++) {
        fixture.update({
          time: index * 16,
          scrollY: index < 60 ? index * 30 : (120 - index) * 30,
          pointer: {
            ...fixture.input.pointer,
            primaryDown: false,
            meshPressed: false,
          },
          progress: {
            get: (key) =>
              key === chapterSignals.entry
                ? 1
                : key === chapterSignals.exit && index < 100
                  ? 1
                  : 0,
          },
        });
        const frame = publish.mock.lastCall![0];
        const expected = resolveHeroProfileModelFrame(frame);
        expect(fixture.target.position.toArray()).toEqual(
          frame.tetrahedron.position,
        );
        expect(model.position.toArray()).toEqual(expected.position);
        expect(model.rotation.toArray().slice(0, 3)).toEqual(expected.rotation);
        expect(model.scale.toArray()).toEqual(expected.scale);
        expect(model.visible).toBe(expected.visible);
      }
      disconnect();
      const last = model.position.clone();
      fixture.update();
      expect(model.position).toEqual(last);
      fixture.params.frameBinding.clear();
      const next = vi.fn();
      fixture.params.frameBinding.connect(next);
      expect(next).not.toHaveBeenCalled();
    },
  );

  test("derives flight from shared scroll displacement, avoids a mount impulse and resets on chapter return", () => {
    const fixture = createFrameFixture();
    const signals = getHeroChapterDefinition("signals").signals;
    let exit = 1;
    const progress = {
      get: (key: string) =>
        key === signals.entry ? 1 : key === signals.exit ? exit : 0,
    };
    const pointer = {
      ...fixture.input.pointer,
      primaryDown: false,
      meshPressed: false,
    };
    fixture.update({ scrollY: 20_000, progress, pointer });
    expect(fixture.resources.state.flight.thrust).toBe(0);
    for (let index = 1; index < 60; index++)
      fixture.update({
        scrollY: 20_000 + index * 30,
        time: index * 16,
        progress,
        pointer,
      });
    expect(fixture.resources.state.flight.thrust).toBeGreaterThan(0.5);
    expect(fixture.resources.uniforms.heroFlightBoost!.value).toBe(
      fixture.resources.state.flight.thrust,
    );
    exit = 0.5;
    fixture.update({ progress, pointer });
    expect(fixture.resources.state.flight).toEqual({
      thrust: 0,
      steering: 0,
      spin: 0,
    });
    expect(fixture.resources.uniforms.heroFlightBoost!.value).toBe(0);
  });

  test("uses millisecond hold timing and requires a primary mesh press and confirmed hit", () => {
    const fixture = createFrameFixture();
    fixture.update();
    expect(fixture.resources.state.transition).toMatchObject({
      phase: "expanding",
      origin: { x: 0.7, y: 0.4 },
      coverage: 0.016,
    });
    expect(fixture.params.signals.set).toHaveBeenCalledTimes(6);
    for (const key of ["primaryDown", "meshPressed", "hit"] as const) {
      const idle = createFrameFixture();
      idle.update({ pointer: { ...idle.input.pointer, [key]: false } });
      expect(idle.resources.state.transition.phase).toBe("idle");
    }
  });

  test("commits only at a complete Hub and persists once after a full hold", () => {
    const fixture = createFrameFixture();
    const commit = vi.spyOn(fixture.params.theme, "commit");
    const self = getHeroChapterDefinition("self").signals;
    fixture.update({
      progress: { get: (key) => (key === self.entry ? 1 : 0) },
    });
    expect(fixture.resources.state.transition.phase).toBe("idle");
    expect(commit).not.toHaveBeenCalled();
    for (let index = 0; index < 63; index++) fixture.update();
    expect(fixture.resources.state.transition).toMatchObject({
      phase: "awaiting-release",
      committedScheme: "inverted",
    });
    expect(commit).toHaveBeenCalledExactlyOnceWith("inverted");
  });

  test("cancels desktop holds on reading layout and follows external button commits", () => {
    const fixture = createFrameFixture();
    fixture.update();
    expect(fixture.resources.state.transition.phase).toBe("expanding");
    const viewport = { ...mobile, reading: true };
    for (let index = 0; index < 100; index++) fixture.update({ viewport });
    expect(fixture.resources.state.transition).toMatchObject({
      phase: "idle",
      coverage: 0,
      committedScheme: "initial",
    });
    for (const scheme of ["inverted", "initial"] as const) {
      fixture.params.theme.commit(scheme);
      fixture.update({ viewport });
      expect(fixture.resources.state.transition).toMatchObject({
        phase: "idle",
        committedScheme: scheme,
        targetScheme: scheme,
        coverage: 0,
      });
      expect(fixture.target.material.color.getHexString()).toBe(
        scheme === "initial" ? "424242" : "c8c8c8",
      );
      expect(fixture.params.signals.set).toHaveBeenCalledWith(
        heroTransitionConfig.signalKeys.committedScheme,
        heroTransitionConfig.signalCodes.scheme[scheme],
      );
    }
  });

  test("selects packed tail tiles and updates native uniforms without replacing the atlas texture", () => {
    const fixture = createFrameFixture();
    const values = new Map<string, number>();
    const progress = { get: (key: string) => values.get(key) ?? 0 };
    const pointer = {
      ...fixture.input.pointer,
      primaryDown: false,
      meshPressed: false,
    };
    const texture = fixture.resources.texture;
    const version = texture.version;
    const self = getHeroChapterDefinition("self").signals;
    const axioms = getHeroChapterDefinition("axioms").signals;
    values.set(self.entry, 1);
    values.set(self.exit, 1);
    fixture.update({ progress, pointer });
    expect(fixture.resources.uniforms.heroTailFaces!.value).toEqual([
      1, 0, 0, 0,
    ]);
    values.set(axioms.entry, 0.01);
    values.set(axioms.exit, 0.001);
    fixture.update({ progress, pointer });
    expect(fixture.resources.uniforms.heroTailFaces!.value).toEqual([
      1, 1, 0, 0,
    ]);
    values.set(axioms.exit, 0);
    fixture.update({ progress, pointer });
    expect(fixture.resources.uniforms.heroTailFaces!.value).toEqual([
      1, 0, 0, 0,
    ]);
    expect(fixture.resources.uniforms.heroChapterAtlas!.value).toBe(texture);
    expect(texture.version).toBe(version);
    expect(fixture.resources.uniforms.domWebGLPixelRatio!.value).toBe(2);
    expect(fixture.resources.uniforms.domWebGLViewportSize!.value).toEqual([
      desktop.width,
      desktop.height,
    ]);
  });

  test("keeps committed PBR colors while radial uniforms expand and retract", () => {
    const fixture = createFrameFixture();
    for (let index = 0; index < 30; index++) fixture.update();
    expect(fixture.target.material.color.getHexString()).toBe("424242");
    expect(fixture.target.material.emissive.getHexString()).toBe("424242");
    expect(fixture.target.material.emissiveIntensity).toBe(0.035);
    expect(
      fixture.resources.uniforms.heroTargetColor!.value.getHexString(),
    ).toBe("c8c8c8");
    const expanding = fixture.resources.uniforms.heroRadialRadiusPx!.value;
    fixture.update({
      pointer: {
        ...fixture.input.pointer,
        primaryDown: false,
        meshPressed: false,
      },
    });
    expect(fixture.resources.state.transition.phase).toBe("retracting");
    fixture.update({
      pointer: {
        ...fixture.input.pointer,
        primaryDown: false,
        meshPressed: false,
      },
    });
    expect(fixture.resources.uniforms.heroRadialRadiusPx!.value).toBeLessThan(
      expanding,
    );
  });

  test("fades ambient motion with coverage and restores it immediately at commit", () => {
    const target = createTarget();
    const motion = createHeroMotionState(false);
    const idle = createHeroHoldTransitionState();
    const expanding = transition({
      targetScheme: "inverted",
      coverage: 0.5,
      phase: "expanding",
      shakeActive: true,
    });
    const committed = transition({
      committedScheme: "inverted",
      targetScheme: "inverted",
      coverage: 1,
      phase: "awaiting-release",
      shakeActive: false,
    });

    applyHeroFrame(target, motion, 1_500, idle, desktop, false);
    applyHeroFrame(target, motion, 1_500, expanding, desktop, false);
    applyHeroFrame(target, motion, 1_500, committed, desktop, false);

    expect(target.scale.setScalar).toHaveBeenNthCalledWith(
      1,
      expect.closeTo(
        heroTransitionConfig.motion.baseScale *
          (1 + heroTransitionConfig.motion.breathingScaleAmplitude),
        6,
      ),
    );
    expect(target.scale.setScalar).toHaveBeenNthCalledWith(
      2,
      expect.closeTo(
        heroTransitionConfig.motion.baseScale *
          (1 + heroTransitionConfig.motion.breathingScaleAmplitude * 0.5),
        6,
      ),
    );
    expect(target.scale.setScalar).toHaveBeenNthCalledWith(
      3,
      expect.closeTo(
        heroTransitionConfig.motion.baseScale *
          (1 + heroTransitionConfig.motion.breathingScaleAmplitude),
        6,
      ),
    );
  });

  test("composes curved flight and keeps rotating through the centered reveal", () => {
    const { orientEnd, lockEnd } = heroTransitionConfig.chapterScroll.entry;
    const chapters = [
      firstChapterFlightEntry(0.1),
      firstChapterFlightEntry(orientEnd),
      firstChapterFlightEntry(0.44),
      firstChapterFlightEntry(lockEnd),
      firstChapterFlightEntry(0.8),
      firstChapterFlightEntry(1),
    ].map((entry) => resolveHeroChapterScrollState(entry, 0));
    const frames = chapters.map((chapter) =>
      resolveHeroChapterGeometryFrame(
        desktop,
        chapter,
        heroTransitionConfig.motion.baseRotation,
      ),
    );
    const targets = chapters.map(() => createTarget());

    for (const [index, chapter] of chapters.entries()) {
      applyHeroFrame(
        targets[index]!,
        createHeroMotionState(false),
        0,
        createHeroHoldTransitionState(),
        desktop,
        false,
        chapter,
      );
    }

    expect(chapters[0]).toMatchObject({
      phase: "orient-approach",
      screenLock: 0,
    });
    expect(chapters[0]!.orientation).toBeGreaterThan(0);
    expect(chapters[0]!.approach).toBeGreaterThan(0);
    expect(chapters[1]).toMatchObject({
      phase: "face-approach",
    });
    expect(chapters[1]!.orientation).toBeGreaterThan(chapters[0]!.orientation);
    expect(chapters[1]!.orientation).toBeLessThan(1);
    expect(chapters[2]!.orientation).toBeGreaterThan(chapters[1]!.orientation);
    expect(chapters[2]!.orientation).toBeLessThan(1);
    expect(chapters[2]!.approach).toBeGreaterThan(chapters[1]!.approach);
    expect(chapters[3]).toMatchObject({
      approach: 1,
      screenLock: 0,
      triangleReveal: 0,
    });
    expect(chapters[3]!.orientation).toBeLessThan(1);
    expect(chapters[4]!.triangleReveal).toBeGreaterThan(0);
    expect(chapters[4]!.screenLock).toBe(chapters[4]!.triangleReveal);
    expect(chapters[4]!.orientation).toBeGreaterThan(chapters[3]!.orientation);
    expect(chapters[4]!.orientation).toBeLessThan(1);
    expect(chapters[5]).toMatchObject({
      orientation: 1,
      approach: 1,
      screenLock: 1,
      triangleReveal: 1,
      domContentActive: true,
    });
    expect(frames[0]!.position[2]).toBeLessThan(0);
    expect(frames[0]!.rotation).not.toEqual(
      heroTransitionConfig.motion.baseRotation,
    );
    expect(frames[1]!.rotation).not.toEqual(
      getHeroChapterDefinition("self").face.targetRotation,
    );
    expect(frames[2]!.rotation).not.toEqual(frames[1]!.rotation);
    expect(frames[3]!.rotation).not.toEqual(
      getHeroChapterDefinition("self").face.targetRotation,
    );
    expect(frames[4]!.rotation).not.toEqual(frames[3]!.rotation);
    expect(frames[5]!.rotation).toEqual(
      getHeroChapterDefinition("self").face.targetRotation,
    );
    expect(frames[1]!.position[2]).toBeLessThan(frames[2]!.position[2]);
    expect(frames[2]!.position[2]).toBeLessThan(frames[3]!.position[2]);
    expect(frames[3]!.position[2]).toBeLessThan(frames[4]!.position[2]);
    expect(frames[4]!.position[2]).toBeLessThan(frames[5]!.position[2]);

    for (const [index, target] of targets.entries()) {
      expect(target.position.set).toHaveBeenCalledWith(
        ...frames[index]!.position,
      );
      expect(target.rotation.set).toHaveBeenCalledWith(
        ...frames[index]!.rotation,
      );
      expect(target.scale.setScalar).toHaveBeenCalledWith(
        heroTransitionConfig.motion.baseScale,
      );
    }
  });

  test("keeps a restrained breathing layer through entry and return flight", () => {
    const idle = createHeroHoldTransitionState();
    const entry = resolveHeroChapterScrollState(
      firstChapterFlightEntry(0.44),
      0,
    );
    const exit = resolveHeroChapterScrollState(
      1,
      (heroTransitionConfig.chapterScroll.exit.contractEnd +
        heroTransitionConfig.chapterScroll.exit.retreatEnd) /
        2,
    );
    const entryTarget = createTarget();
    const exitTarget = createTarget();
    const expectedScale =
      heroTransitionConfig.motion.baseScale *
      (1 +
        heroTransitionConfig.motion.breathingScaleAmplitude *
          heroTransitionConfig.motion.transitionAmbientFactor);

    applyHeroFrame(
      entryTarget,
      createHeroMotionState(false),
      1_500,
      idle,
      desktop,
      false,
      entry,
    );
    applyHeroFrame(
      exitTarget,
      createHeroMotionState(false),
      1_500,
      idle,
      desktop,
      false,
      exit,
    );

    expect(entryTarget.scale.setScalar).toHaveBeenCalledWith(
      expect.closeTo(expectedScale, 6),
    );
    expect(exitTarget.scale.setScalar).toHaveBeenCalledWith(
      expect.closeTo(expectedScale, 6),
    );
  });

  test("keeps damped pointer parallax through entry and return flight", () => {
    const motion = createHeroMotionState(false);
    motion.tiltX = 0.03;
    motion.tiltY = -0.04;
    const entry = resolveHeroChapterScrollState(
      firstChapterFlightEntry(0.44),
      0,
    );
    const exit = resolveHeroChapterScrollState(
      1,
      (heroTransitionConfig.chapterScroll.exit.contractEnd +
        heroTransitionConfig.chapterScroll.exit.retreatEnd) /
        2,
    );
    const locked = resolveHeroChapterScrollState(
      firstChapterFlightEntry(0.8),
      0,
    );

    for (const chapter of [entry, exit, locked]) {
      const target = createTarget();
      const frame = resolveHeroChapterGeometryFrame(
        desktop,
        chapter,
        heroTransitionConfig.motion.baseRotation,
      );
      applyHeroFrame(
        target,
        motion,
        0,
        createHeroHoldTransitionState(),
        desktop,
        false,
        chapter,
      );

      const pointerWeight =
        heroTransitionConfig.motion.transitionPointerFactor *
        (1 - chapter.screenLock);
      expect(target.rotation.set).toHaveBeenCalledWith(
        expect.closeTo(frame.rotation[0] + motion.tiltX * pointerWeight, 6),
        expect.closeTo(frame.rotation[1] + motion.tiltY * pointerWeight, 6),
        expect.closeTo(frame.rotation[2], 6),
      );
    }
  });

  test("composes deterministic hold shake only during non-reduced expansion", () => {
    const expanding = transition({
      targetScheme: "inverted",
      coverage: 0.5,
      phase: "expanding",
      shakeActive: true,
    });
    const first = createTarget();
    const second = createTarget();

    applyHeroFrame(
      first,
      createHeroMotionState(false),
      137,
      expanding,
      desktop,
      false,
    );
    applyHeroFrame(
      second,
      createHeroMotionState(false),
      137,
      expanding,
      desktop,
      false,
    );

    expect(vi.mocked(first.position.set).mock.calls).toEqual(
      vi.mocked(second.position.set).mock.calls,
    );
    expect(vi.mocked(first.rotation.set).mock.calls).toEqual(
      vi.mocked(second.rotation.set).mock.calls,
    );
    expect(vi.mocked(first.position.set).mock.calls[0]?.[0]).not.toBe(0);

    const reduced = createTarget();
    applyHeroFrame(
      reduced,
      createHeroMotionState(true),
      137,
      expanding,
      desktop,
      true,
    );
    expect(reduced.position.set).toHaveBeenCalledWith(0, 0.365, 0);
    expect(reduced.rotation.set).toHaveBeenCalledWith(-0.6, 0.85, 0.08);
  });

  test("preserves breathing, float, pointer tilt, responsive pose, opacity, and PBR", () => {
    const desktopTarget = createTarget();
    const motion = createHeroMotionState(false);
    motion.tiltX = 0.02;
    motion.tiltY = -0.03;
    const idle = createHeroHoldTransitionState();

    applyHeroFrame(desktopTarget, motion, 1_500, idle, desktop, false);
    applyHeroFrame(desktopTarget, motion, 4_500, idle, desktop, false);

    expect(desktopTarget.position.set).toHaveBeenNthCalledWith(
      1,
      0,
      expect.closeTo(
        0.365 +
          Math.sin((1_500 / 8_000) * Math.PI * 2) *
            heroTransitionConfig.motion.floatingAmplitude,
        6,
      ),
      0,
    );
    expect(desktopTarget.rotation.set).toHaveBeenNthCalledWith(
      1,
      expect.closeTo(-0.58, 6),
      expect.closeTo(0.79, 6),
      0.08,
    );
    expect(desktopTarget.rotation.set).toHaveBeenNthCalledWith(
      2,
      expect.closeTo(-0.58, 6),
      expect.closeTo(0.79, 6),
      0.08,
    );
    expect(desktopTarget.visible).toBe(true);
    expect(desktopTarget.material.opacity).toBe(0.92);
    expect(desktopTarget.material.metalness).toBe(0.62);
    expect(desktopTarget.material.roughness).toBe(0.28);

    const mobileTarget = createTarget();
    applyHeroFrame(
      mobileTarget,
      createHeroMotionState(false),
      0,
      idle,
      mobile,
      false,
    );
    expect(mobileTarget.scale.setScalar).toHaveBeenCalledWith(
      heroTransitionConfig.motion.baseScale *
        heroTransitionConfig.motion.mobileScaleFactor,
    );
    expect(mobileTarget.position.set).toHaveBeenCalledWith(
      0,
      heroTransitionConfig.motion.mobileYOffset,
      0,
    );
  });

  test("adds proximity tilt while moving and returns after 120ms idle", () => {
    const state = createHeroMotionState(false);

    stepHeroMotionState(state, {
      time: 16,
      delta: 16,
      pointerInside: true,
      pointerX: 0.4,
      pointerY: -0.2,
    });
    expect(state.targetTiltX).toBeCloseTo(
      heroTransitionConfig.motion.pointerPitch * 0.2,
      6,
    );
    expect(state.targetTiltY).toBeCloseTo(
      heroTransitionConfig.motion.pointerYaw * 0.4,
      6,
    );

    stepHeroMotionState(state, {
      time: 160,
      delta: 16,
      pointerInside: true,
      pointerX: 0.4,
      pointerY: -0.2,
    });
    expect(state.targetTiltX).toBe(0);
    expect(state.targetTiltY).toBe(0);
  });
});

function firstChapterFlightEntry(flightProgress: number): number {
  const { introHandoffEnd } = heroTransitionConfig.chapterScroll.entry;
  return introHandoffEnd + (1 - introHandoffEnd) * flightProgress;
}
