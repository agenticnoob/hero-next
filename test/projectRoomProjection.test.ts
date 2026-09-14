import { describe, expect, test } from "vitest";
import { projectRoomExhibitProjection } from "../src/projects/projection";
import { projectRoomConfig } from "../src/projects/room";
import type { HeroViewport } from "../src/shared/viewport";

type Vector = readonly [number, number, number];
type View = readonly [number, number, number, number];

function cssPoint(transform: string, x: number, y: number) {
  const values = transform.slice("matrix3d(".length, -1).split(",").map(Number);
  expect(values).toHaveLength(16);
  expect(values.every(Number.isFinite)).toBe(true);
  const w = values[3] * x + values[7] * y + values[15];
  return [
    (values[0] * x + values[4] * y + values[12]) / w,
    (values[1] * x + values[5] * y + values[13]) / w,
  ] as const;
}

// Trace a screen ray forwards into the bounded room, independently of the
// projection's inverse camera transform and CSS matrix construction.
function traceRoom(
  viewport: HeroViewport,
  screen: readonly [number, number],
  view: View,
  approach: number,
) {
  const [yaw, pitch, horizontalEye, verticalEye] = view;
  const { radius, halfHeight, tangent } = projectRoomConfig;
  const cameraRay: Vector = [
    ((((screen[0] * 2) / viewport.width - 1) * viewport.width) /
      viewport.height) *
      tangent,
    (1 - (screen[1] * 2) / viewport.height) * tangent,
    -1,
  ];
  const pitched: Vector = [
    cameraRay[0],
    Math.cos(pitch) * cameraRay[1] - Math.sin(pitch) * cameraRay[2],
    Math.sin(pitch) * cameraRay[1] + Math.cos(pitch) * cameraRay[2],
  ];
  const ray: Vector = [
    Math.cos(yaw) * pitched[0] - Math.sin(yaw) * pitched[2],
    pitched[1],
    Math.sin(yaw) * pitched[0] + Math.cos(yaw) * pitched[2],
  ];
  const eye: Vector = [
    horizontalEye * Math.cos(yaw) + Math.sin(yaw) * approach,
    verticalEye,
    horizontalEye * Math.sin(yaw) - Math.cos(yaw) * approach,
  ];
  const planes = [
    { axis: 2, coordinate: -radius, wall: 0 },
    { axis: 0, coordinate: radius, wall: 1 },
    { axis: 2, coordinate: radius, wall: 2 },
    { axis: 0, coordinate: -radius, wall: 3 },
    { axis: 1, coordinate: halfHeight, wall: -1 },
    { axis: 1, coordinate: -halfHeight, wall: -1 },
  ];
  const intersections = planes
    .flatMap(({ axis, coordinate, wall }) => {
      if (Math.abs(ray[axis]) < 1e-10) return [];
      const time = (coordinate - eye[axis]) / ray[axis];
      if (time <= 0) return [];
      const point = eye.map((value, index) => value + time * ray[index]);
      if (
        Math.abs(point[0]) > radius + 1e-8 ||
        Math.abs(point[1]) > halfHeight + 1e-8 ||
        Math.abs(point[2]) > radius + 1e-8
      )
        return [];
      return [{ wall, point, time }];
    })
    .sort((a, b) => a.time - b.time);
  const hit = intersections[0];
  expect(hit).toBeDefined();
  const [x, y, z] = hit.point;
  const u =
    [x + radius, z + radius, radius - x, radius - z][hit.wall] / (2 * radius);
  return {
    wall: hit.wall,
    textureX: u * projectRoomConfig.textureWidth,
    textureY:
      ((halfHeight - y) / (2 * halfHeight)) * projectRoomConfig.textureHeight,
  };
}

const viewport = { width: 1440, height: 900 };
const rect = { x: 140, y: 190, width: 740, height: 330 };

describe("project exhibit projection onto the shader room", () => {
  test("places an unrotated full front wall at the room's exact screen bounds", () => {
    const wall = projectRoomExhibitProjection(viewport, 0, [0, 0, 0, 0], 0, {
      x: 0,
      y: 0,
      width: 1024,
      height: 720,
    });
    expect(wall.visible).toBe(true);
    expect(cssPoint(wall.transform, 0, 0)).toEqual([220, 150]);
    expect(cssPoint(wall.transform, 1024, 720)).toEqual([1220, 750]);
    expect(wall.bounds).toEqual({ x: 220, y: 150, width: 1000, height: 600 });
  });

  test.each([0, 1, 2, 3])(
    "matches ray intersections for wall %s at center and both viewing angles with parallax and approach",
    (wallIndex) => {
      const yaw = (wallIndex * Math.PI) / 2;
      const samples: readonly { view: View; approach: number }[] = [
        { view: [yaw, 0, 0, 0], approach: 0 },
        { view: [yaw - 0.47, -0.14, -0.11, 0.07], approach: 0.85 },
        { view: [yaw + 0.47, 0.12, 0.12, -0.08], approach: 1.15 },
      ];
      for (const { view, approach } of samples) {
        const projection = projectRoomExhibitProjection(
          viewport,
          wallIndex,
          view,
          approach,
          rect,
        );
        expect(projection.visible).toBe(true);
        for (const [x, y] of [
          [0, 0],
          [rect.width, 0],
          [rect.width, rect.height],
          [0, rect.height],
          [rect.width / 2, rect.height / 2],
          [rect.width * 0.3, rect.height * 0.6],
        ]) {
          const hit = traceRoom(
            viewport,
            cssPoint(projection.transform, x, y),
            view,
            approach,
          );
          expect(hit.wall).toBe(wallIndex);
          expect(hit.textureX).toBeCloseTo(rect.x + x, 7);
          expect(hit.textureY).toBeCloseTo(rect.y + y, 7);
        }
      }
    },
  );

  test.each([
    { wall: 1, x: 0 },
    { wall: 3, x: 824 },
  ])(
    "keeps a visible side exhibit on wall $wall while looking straight ahead",
    ({ wall, x }) => {
      const sideRect = { x, y: 150, width: 200, height: 400 };
      const projection = projectRoomExhibitProjection(
        viewport,
        wall,
        [0, 0, 0, 0],
        0,
        sideRect,
      );
      expect(projection.visible).toBe(true);
      const hit = traceRoom(
        viewport,
        cssPoint(projection.transform, 100, 200),
        [0, 0, 0, 0],
        0,
      );
      expect(hit.wall).toBe(wall);
      expect(hit.textureX).toBeCloseTo(x + 100, 7);
      expect(hit.textureY).toBeCloseTo(350, 7);
    },
  );

  test("hides a positive-depth exhibit outside the viewport", () => {
    const projection = projectRoomExhibitProjection(
      { width: 390, height: 844 },
      0,
      [0.9, 0, 0, 0],
      0,
      { x: 400, y: 300, width: 150, height: 120 },
    );
    expect(projection.visible).toBe(false);
    expect(projection.bounds).not.toBeNull();
    expect(projection.bounds!.x + projection.bounds!.width).toBeLessThan(0);
  });

  test("keeps the visible part of the real exhibit when its other corners cross behind the eye", () => {
    const wide = { width: 2560, height: 900 };
    const view: View = [(100 * Math.PI) / 180, 0, 0, 0];
    const projection = projectRoomExhibitProjection(wide, 2, view, 0, {
      x: 342,
      y: 410,
      width: 340,
      height: 298,
    });
    expect(projection.visible).toBe(true);
    expect(Object.values(projection.bounds!).every(Number.isFinite)).toBe(true);
    const visiblePoint = cssPoint(projection.transform, 10, 40);
    expect(visiblePoint[0]).toBeGreaterThan(0);
    expect(visiblePoint[0]).toBeLessThan(wide.width);
    expect(visiblePoint[1]).toBeGreaterThan(0);
    expect(visiblePoint[1]).toBeLessThan(wide.height);
    const hit = traceRoom(wide, visiblePoint, view, 0);
    expect(hit.wall).toBe(2);
    expect(hit.textureX).toBeCloseTo(352, 7);
    expect(hit.textureY).toBeCloseTo(450, 7);
  });

  test("hides a near-plane crossing when its entire forward part is offscreen", () => {
    const projection = projectRoomExhibitProjection(
      viewport,
      1,
      [0, 0, 0, 0],
      0,
      {
        x: 400,
        y: 300,
        width: 300,
        height: 120,
      },
    );
    expect(projection.visible).toBe(false);
    expect(projection.bounds).not.toBeNull();
    expect(projection.transform).not.toMatch(/Infinity|NaN/);
  });

  test("hides walls entirely behind the eye", () => {
    const projection = projectRoomExhibitProjection(
      viewport,
      2,
      [0, 0, 0, 0],
      0,
      rect,
    );
    expect(projection.visible).toBe(false);
    expect(projection.bounds).toBeNull();
    expect(projection.transform).not.toMatch(/Infinity|NaN/);
  });

  test("does not expose a wall's back face when the eye is outside the room", () => {
    const projection = projectRoomExhibitProjection(
      viewport,
      0,
      [Math.PI, 0, 0, 0],
      -4,
      rect,
    );
    expect(projection.bounds).not.toBeNull();
    expect(projection.visible).toBe(false);
  });

  test("hides empty viewports and exhibit rectangles", () => {
    expect(
      projectRoomExhibitProjection(
        { width: 0, height: 900 },
        0,
        [0, 0, 0, 0],
        0,
        rect,
      ).visible,
    ).toBe(false);
    expect(
      projectRoomExhibitProjection(viewport, 0, [0, 0, 0, 0], 0, {
        ...rect,
        width: 0,
      }).visible,
    ).toBe(false);
  });
});
