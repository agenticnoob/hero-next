import type { HeroViewport } from "../shared/viewport";
import { projectRoomWallAngle } from "./model";
import { projectRoomConfig as config } from "./room";

export type ProjectRoomExhibitRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type ProjectRoomExhibitProjection = {
  readonly transform: string;
  readonly visible: boolean;
  readonly bounds: ProjectRoomExhibitRect | null;
};

type Point = readonly [number, number];
type HomogeneousPoint = readonly [number, number, number];

const hiddenProjection: ProjectRoomExhibitProjection = {
  transform: "none",
  visible: false,
  bounds: null,
};

function clipNearPlane(
  points: readonly HomogeneousPoint[],
  near: number,
): HomogeneousPoint[] {
  const clipped: HomogeneousPoint[] = [];
  for (let index = 0; index < points.length; index++) {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    const startInside = start[2] >= near;
    const endInside = end[2] >= near;
    if (startInside) clipped.push(start);
    if (startInside === endInside) continue;
    const amount = (near - start[2]) / (end[2] - start[2]);
    if (amount > 0 && amount < 1)
      clipped.push([
        start[0] + amount * (end[0] - start[0]),
        start[1] + amount * (end[1] - start[1]),
        near,
      ]);
  }
  return clipped;
}

function intersectsViewport(points: readonly Point[], viewport: HeroViewport) {
  const screen: readonly Point[] = [
    [0, 0],
    [viewport.width, 0],
    [viewport.width, viewport.height],
    [0, viewport.height],
  ];
  // A bounding box alone can overlap the screen while a tilted wall misses it.
  for (const polygon of [points, screen]) {
    for (let index = 0; index < polygon.length; index++) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
      const axisX = start[1] - end[1];
      const axisY = end[0] - start[0];
      const project = ([x, y]: Point) => x * axisX + y * axisY;
      const wallRange = points.map(project);
      const screenRange = screen.map(project);
      if (
        Math.max(...wallRange) <= Math.min(...screenRange) ||
        Math.max(...screenRange) <= Math.min(...wallRange)
      )
        return false;
    }
  }
  return true;
}

export function projectRoomExhibitProjection(
  viewport: HeroViewport,
  wallIndex: number,
  view: readonly [
    yaw: number,
    pitch: number,
    horizontalEye: number,
    verticalEye: number,
  ],
  approach: number,
  rect: ProjectRoomExhibitRect,
): ProjectRoomExhibitProjection {
  if (
    viewport.width <= 0 ||
    viewport.height <= 0 ||
    rect.width <= 0 ||
    rect.height <= 0
  )
    return hiddenProjection;

  const [yaw, pitch, horizontalEye, verticalEye] = view;
  const angle = projectRoomWallAngle(wallIndex) - yaw;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const pitchCosine = Math.cos(pitch);
  const pitchSine = Math.sin(pitch);
  const focal = viewport.height / (2 * config.tangent);
  const stepX = (2 * config.radius) / config.textureWidth;
  const stepY = (-2 * config.halfHeight) / config.textureHeight;
  const localX = rect.x * stepX - config.radius;
  const localY = rect.y * stepY + config.halfHeight;

  // Undo the shader's yaw, subtract its eye, then undo pitch. Keeping depth
  // homogeneous gives CSS the same perspective divide as the room's rays.
  const homogeneous = (x: number, y: number, z: number): HomogeneousPoint => {
    const depth = pitchSine * y - pitchCosine * z;
    return [
      (viewport.width / 2) * depth + focal * x,
      (viewport.height / 2) * depth - focal * (pitchCosine * y + pitchSine * z),
      depth,
    ];
  };
  const origin = homogeneous(
    cosine * localX + sine * config.radius - horizontalEye,
    localY - verticalEye,
    sine * localX - cosine * config.radius + approach,
  );
  const horizontal = homogeneous(cosine * stepX, 0, sine * stepX);
  const vertical = homogeneous(0, stepY, 0);
  const corners: readonly Point[] = [
    [0, 0],
    [rect.width, 0],
    [rect.width, rect.height],
    [0, rect.height],
  ];
  const homogeneousCorners = corners.map(([x, y]): HomogeneousPoint => [
    origin[0] + horizontal[0] * x + vertical[0] * y,
    origin[1] + horizontal[1] * x + vertical[1] * y,
    origin[2] + horizontal[2] * x + vertical[2] * y,
  ]);
  // A wide viewport can see part of a side exhibit whose far corner is behind
  // the eye. Clip only the visibility polygon; CSS clips the original matrix.
  const clipped = clipNearPlane(homogeneousCorners, config.radius * 0.000001);
  if (clipped.length < 3) return hiddenProjection;
  const projected: Point[] = clipped.map(([x, y, depth]) => [
    x / depth,
    y / depth,
  ]);

  const left = Math.min(...projected.map(([x]) => x));
  const right = Math.max(...projected.map(([x]) => x));
  const top = Math.min(...projected.map(([, y]) => y));
  const bottom = Math.max(...projected.map(([, y]) => y));
  const frontFacing =
    config.radius - horizontalEye * sine - approach * cosine > 0;
  const matrix = [
    horizontal[0],
    horizontal[1],
    0,
    horizontal[2],
    vertical[0],
    vertical[1],
    0,
    vertical[2],
    0,
    0,
    1,
    0,
    origin[0],
    origin[1],
    0,
    origin[2],
  ];
  return {
    transform: `matrix3d(${matrix.join(",")})`,
    visible: frontFacing && intersectsViewport(projected, viewport),
    bounds: { x: left, y: top, width: right - left, height: bottom - top },
  };
}
