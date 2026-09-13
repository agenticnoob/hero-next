import { describe, expect, test } from "vitest";

import type { HeroChapterId } from "../src/chapters/definitions";
import { resolveHeroChapterCameraFrame } from "../src/chapters/geometry";
import { resolveHeroChapterScrollState } from "../src/chapters/scrollState";
import {
  heroProfileMaterialColor,
  resolveHeroProfileModelFrame,
} from "../src/profile/modelEffect";
import { resolveHeroTetrahedronTransformFrame } from "../src/tetrahedron/transform";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import type { HeroFlightFrame } from "../src/tetrahedron/flight";

const desktopViewport = { width: 1_280, height: 720 } as const;

type FrameOverrides = {
  readonly flight?: HeroFlightFrame;
  readonly entryProgress?: number;
  readonly spinProgress?: number;
  readonly exitProgress?: number;
  readonly chapterId?: HeroChapterId;
  readonly viewport?: { readonly width: number; readonly height: number };
  readonly reducedMotion?: boolean;
  readonly time?: number;
  readonly motion?: { readonly tiltX: number; readonly tiltY: number };
};

function resolveFrame(overrides: FrameOverrides = {}) {
  return resolveHeroProfileModelFrame(resolveFrameInput(overrides));
}

function resolveFrameInput(overrides: FrameOverrides = {}) {
  const entryProgress = overrides.entryProgress ?? 1;
  const exitProgress = overrides.exitProgress ?? 0;

  const input = {
    chapter: resolveHeroChapterScrollState(
      entryProgress,
      exitProgress,
      overrides.chapterId ?? "self",
    ),
    spinProgress: overrides.spinProgress ?? 0,
    viewport: overrides.viewport ?? desktopViewport,
    reducedMotion: overrides.reducedMotion ?? false,
    motion: overrides.motion ?? { tiltX: 0, tiltY: 0 },
    time: overrides.time ?? 0,
    transition: { coverage: 0, phase: "idle", shakeActive: false },
  } as const;
  return {
    ...input,
    tetrahedron: resolveHeroTetrahedronTransformFrame({
      ...input,
      flight: overrides.flight,
    }),
  };
}

function resolveTetrahedronFrame(overrides: FrameOverrides) {
  return resolveFrameInput(overrides).tetrahedron;
}

function cameraDepth(position: readonly [number, number, number]): number {
  const camera = resolveHeroChapterCameraFrame();
  return (
    (position[0] - camera.position[0]) * camera.forward[0] +
    (position[1] - camera.position[1]) * camera.forward[1] +
    (position[2] - camera.position[2]) * camera.forward[2]
  );
}

function projectedFrame(frame: ReturnType<typeof resolveFrame>) {
  const camera = resolveHeroChapterCameraFrame();
  const offset = [
    frame.position[0] - camera.position[0],
    frame.position[1] - camera.position[1],
    frame.position[2] - camera.position[2],
  ] as const;
  const depth = cameraDepth(frame.position);

  return {
    x: offset[0] / depth,
    y:
      (offset[0] * camera.up[0] +
        offset[1] * camera.up[1] +
        offset[2] * camera.up[2]) /
      depth,
    scale: frame.scale[0] / depth,
  };
}

describe("hero profile model frame", () => {
  test("follows the mobile portrait slot through scrolling and retains the face relief before entry", () => {
    const input = resolveFrameInput({ viewport: { width: 390, height: 844 } });
    const resting = resolveHeroProfileModelFrame({
      ...input,
      readingSlot: { centerY: 500, height: 300 },
    });
    const scrolled = resolveHeroProfileModelFrame({
      ...input,
      readingSlot: { centerY: 200, height: 300 },
    });
    expect(scrolled.position[1]).toBeGreaterThan(resting.position[1]);
    expect(scrolled.scale).toEqual(resting.scale);
    const hub = resolveFrameInput({
      entryProgress: 0,
      viewport: { width: 390, height: 844 },
    });
    expect(
      resolveHeroProfileModelFrame({
        ...hub,
        readingSlot: { centerY: 1600, height: 300 },
      }),
    ).toEqual(resolveHeroProfileModelFrame(hub));
  });
  test("holds the body model in place while content drives one clockwise turn", () => {
    const start = resolveFrame({ spinProgress: 0 });
    const middle = resolveFrame({ spinProgress: 0.5 });
    const end = resolveFrame({ spinProgress: 1 });

    expect(start.position).toEqual(middle.position);
    expect(middle.position).toEqual(end.position);
    expect(start.scale).toEqual(middle.scale);
    expect(middle.scale).toEqual(end.scale);
    expect(start.rotation).toEqual([0, 0, 0]);
    expect(middle.rotation[1]).toBeCloseTo(-Math.PI);
    expect(end.rotation[1]).toBeCloseTo(-Math.PI * 2);
  });

  test("is deterministic when scrolling backwards and clamps invalid progress", () => {
    const forward = resolveFrame({ spinProgress: 0.37 });
    resolveFrame({ spinProgress: 0.91 });
    const backward = resolveFrame({ spinProgress: 0.37 });

    expect(backward).toEqual(forward);
    expect(resolveFrame({ spinProgress: 2 }).rotation[1]).toBeCloseTo(
      -Math.PI * 2,
    );
    expect(resolveFrame({ spinProgress: Number.NaN }).rotation[1]).toBe(0);
  });

  test("does not add local spin during tetrahedron entry or return", () => {
    const entryWithoutDrift = resolveFrame({
      entryProgress: 0.2,
      spinProgress: 0,
    });
    const entryWithDrift = resolveFrame({
      entryProgress: 0.2,
      spinProgress: 0.5,
    });
    const returnWithoutDrift = resolveFrame({
      entryProgress: 1,
      exitProgress: 0.5,
      spinProgress: 1,
    });
    const returnWithDrift = resolveFrame({
      entryProgress: 1,
      exitProgress: 0.5,
      spinProgress: 0.5,
    });

    expect(entryWithDrift).toEqual(entryWithoutDrift);
    expect(returnWithDrift).toEqual(returnWithoutDrift);
  });

  test("starts as a shallow relief on the first tetrahedron face", () => {
    const face = resolveFrame({ entryProgress: 0 });
    const body = resolveFrame({ entryProgress: 1 });

    expect(face.visible).toBe(true);
    expect(face.scale[2]).toBeLessThan(face.scale[0]);
    expect(face.position).not.toEqual(body.position);
    expect(body.position).toEqual([0, 0.3, 0.18]);
    expect(body.scale).toEqual([1, 1, 1]);
  });

  test("keeps the model in front of the tetrahedron during entry and return", () => {
    for (const transition of [
      { entryProgress: 0.96, exitProgress: 0, spinProgress: 0 },
      { entryProgress: 1, exitProgress: 0.04, spinProgress: 1 },
    ]) {
      const model = resolveFrame(transition);
      const tetrahedron = resolveTetrahedronFrame(transition);

      expect(cameraDepth(model.position)).toBeLessThan(
        cameraDepth(tetrahedron.position),
      );
    }
  });

  test("preserves the projected body frame across entry and return handoffs", () => {
    for (const [transitioning, body] of [
      [
        resolveFrame({ entryProgress: 0.999_999 }),
        resolveFrame({ entryProgress: 1 }),
      ],
      [
        resolveFrame({ entryProgress: 1, exitProgress: 0.000_001 }),
        resolveFrame({ entryProgress: 1, exitProgress: 0 }),
      ],
    ]) {
      const projectedTransition = projectedFrame(transitioning);
      const projectedBody = projectedFrame(body);

      expect(projectedTransition.x).toBeCloseTo(projectedBody.x, 5);
      expect(projectedTransition.y).toBeCloseTo(projectedBody.y, 5);
      expect(projectedTransition.scale).toBeCloseTo(projectedBody.scale, 5);
    }
  });

  test("returns to the first face after exit and hides only inside other bodies", () => {
    expect(resolveFrame({ entryProgress: 0 }).visible).toBe(true);
    expect(resolveFrame({ entryProgress: 1, exitProgress: 0.2 }).visible).toBe(
      true,
    );
    expect(resolveFrame({ entryProgress: 1, exitProgress: 1 }).visible).toBe(
      true,
    );
    expect(
      resolveFrame({
        entryProgress: 0.1,
        chapterId: "axioms",
      }).visible,
    ).toBe(true);
    expect(
      resolveFrame({
        entryProgress: 1,
        chapterId: "axioms",
      }).visible,
    ).toBe(false);
  });

  test("keeps the first face responsive but removes body spin for reduced motion", () => {
    const face = resolveFrame({
      entryProgress: 0,
      motion: { tiltX: 0.04, tiltY: -0.03 },
    });
    const stillBody = resolveFrame({
      spinProgress: 0.5,
      reducedMotion: true,
    });

    expect(face.rotation).not.toEqual([0, 0, 0]);
    expect(stillBody.rotation).toEqual([0, 0, 0]);
  });

  test("uses a smaller fixed body scale for the narrow viewport", () => {
    const desktop = resolveFrame();
    const mobile = resolveFrame({ viewport: { width: 375, height: 812 } });

    expect(mobile.position).toEqual([0, 0.32, 0.18]);
    expect(mobile.scale[0]).toBeLessThan(desktop.scale[0]);
  });

  test("keeps the same light neutral material tint across both themes", () => {
    expect(heroProfileMaterialColor).toBe("#C8C8C8");
  });

  test("keeps the relief rigidly attached through all journal flight rotations and scales", () => {
    let reference: Matrix4 | undefined;
    for (const viewport of [desktopViewport, { width: 390, height: 844 }]) {
      for (const spin of [0, 0.7, 1.8, 3.2, 5.8]) {
        const overrides = {
          chapterId: "signals" as const,
          entryProgress: 1,
          exitProgress: 1,
          viewport,
          time: spin * 1000,
          flight: {
            scale: 0.78,
            position: [0.01, -0.02, -0.14],
            rotation: [0.13, spin, -0.07],
            glow: 1,
          } as const,
        };
        const model = resolveFrame(overrides);
        const tetrahedron = resolveTetrahedronFrame(overrides);
        const matrix = (
          position: readonly number[],
          rotation: readonly number[],
          scale: readonly number[],
        ) =>
          new Matrix4().compose(
            new Vector3(...position),
            new Quaternion().setFromEuler(new Euler(...rotation)),
            new Vector3(...scale),
          );
        const local = matrix(
          tetrahedron.position,
          tetrahedron.rotation,
          Array(3).fill(tetrahedron.scale),
        )
          .invert()
          .multiply(matrix(model.position, model.rotation, model.scale));
        reference ??= local.clone();
        local.elements.forEach((value, i) =>
          expect(value).toBeCloseTo(reference!.elements[i], 8),
        );
        expect(model.visible).toBe(true);
      }
    }
  });
});
