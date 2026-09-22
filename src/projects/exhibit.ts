import type { HeroViewport } from "../shared/viewport";
import { projectRoomConfig as config } from "./room";
import type { ProjectRoomStore } from "./roomStore";
import { projectRoomExhibitProjection } from "./projection";

// Coordinates on the same 1024 × 720 wall used by the room's text atlas.
// Texture pixels are not square on the wall; preserve the poster's 16:10 ratio
// in world space before the camera adds its perspective.
const width = 340;
const y = 410;
const posterHeight =
  ((width / config.textureWidth) * config.radius * config.textureHeight) /
  config.halfHeight /
  (16 / 10);
const labelTop = y + posterHeight + 16;
const bottom = labelTop + 33;
export const projectRoomExhibitLayout = {
  x: (config.textureWidth - width) / 2,
  y,
  width,
  height: bottom - y,
  posterHeight,
  labelTop,
  labelSize: 18,
  bottom,
} as const;

const projectRoomTextExhibitLayout = {
  x: 212,
  y: 490,
  width: 600,
  height: 70,
  posterHeight: 0,
  labelTop: 506,
  labelSize: 24,
  bottom: 552,
} as const;

export function projectExhibitLayout(hasPoster: boolean) {
  return hasPoster ? projectRoomExhibitLayout : projectRoomTextExhibitLayout;
}

export function hideProjectRoomExhibits(room: ProjectRoomStore) {
  for (const element of room.getExhibits().values())
    element.style.visibility = "hidden";
}

export function updateProjectRoomExhibits(
  room: ProjectRoomStore,
  viewport: HeroViewport,
  view: readonly [number, number, number, number],
  approach: number,
) {
  for (const [index, element] of room.getExhibits()) {
    const projection = projectRoomExhibitProjection(
      viewport,
      index,
      view,
      approach,
      projectExhibitLayout(element.dataset.projectPoster === "true"),
    );
    element.style.transform = projection.transform;
    element.style.visibility = projection.visible ? "visible" : "hidden";
  }
}
