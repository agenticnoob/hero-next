import type {
  HeroChapterBodyContent,
  HeroChapterBodySection,
  HeroChapterLocalizedContent,
} from "../chapters/contentModel";

// The room is a square: each project owns one wall, in clockwise order.
export const projectRoomWalls = ["front", "right", "back", "left"] as const;
export type ProjectRoomWall = (typeof projectRoomWalls)[number];
export const projectRoomWallCount = projectRoomWalls.length;
export const projectRoomAtlas = {
  columns: 2,
  rows: projectRoomWallCount / 2,
} as const;

export type ProjectRoomSections = readonly [
  HeroChapterBodySection,
  HeroChapterBodySection,
  HeroChapterBodySection,
  HeroChapterBodySection,
];

export type ProjectRoomChapterContent = Omit<
  HeroChapterLocalizedContent,
  "body"
> & {
  readonly body: Omit<HeroChapterBodyContent, "sections"> & {
    readonly sections: ProjectRoomSections;
  };
};

export function assertProjectRoomSections(
  sections: readonly HeroChapterBodySection[],
): asserts sections is ProjectRoomSections {
  if (sections.length !== projectRoomWallCount) {
    throw new Error(
      `Project room requires exactly ${projectRoomWallCount} projects; received ${sections.length}.`,
    );
  }
}

export function projectRoomWallIndex(wall: ProjectRoomWall): number {
  return projectRoomWalls.indexOf(wall);
}

export function projectRoomWallAngle(index: number): number {
  return (index * Math.PI * 2) / projectRoomWallCount;
}

export function projectRoomAtlasSlot(index: number) {
  return {
    column: index % projectRoomAtlas.columns,
    row: Math.floor(index / projectRoomAtlas.columns),
  };
}
