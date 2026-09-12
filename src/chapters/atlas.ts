import { heroViewportStore } from "../shared/viewportStore";
import { getSignalImageRevision } from "../signals/images";
import { signalsHoverEnabled } from "../signals/layout";
import { drawSignalsEndpoint } from "../signals/artwork";
import { normalizeHeroViewport, type HeroViewport } from "../shared/viewport";
import {
  createProjectRoomTexture,
  drawProjectRoomEndpoint,
} from "../projects/artwork";
import { projectRoomEnabled } from "../projects/room";
import { createHeroAxiomsArtwork } from "../axioms/reader";
import { drawAxiomsFrame } from "../axioms/canvas";
import { resolveAxiomsFrame } from "../axioms/frame";
import { getHeroProfileSpeechBubbleCopy } from "../profile/speechBubble";
import { drawProfileEndpoint } from "../profile/artwork";
import { drawStandardEndpoint } from "./artwork";
import { getHeroChapterContent } from "./content";
import {
  formatHeroChapterCounter,
  getHeroChapterDefinition,
  heroChapterOrder,
} from "./definitions";
import type { HeroLocale } from "../preferences/locale";
import {
  resolveHeroChapterAtlasResolution,
  resolveHeroChapterLayout,
  type HeroChapterLayout,
} from "./layout";

export type HeroChapterAtlas = {
  readonly canvas: HTMLCanvasElement;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly layoutWidth: number;
  readonly layoutHeight: number;
  readonly locale: HeroLocale;
  readonly rootFontSize: number;
  readonly projectRoom: boolean;
  readonly signalsHover: boolean;
  readonly signalImagesRevision: number;
};

export function createHeroChapterAtlas(
  viewport: HeroViewport,
  locale: HeroLocale = "zh",
  rootFontSize: number = heroViewportStore.getSnapshot().rootFontSize,
): HeroChapterAtlas {
  const normalizedViewport = normalizeHeroViewport(viewport);
  const { tileWidth, tileHeight } = resolveHeroChapterAtlasResolution(viewport);
  const canvas = document.createElement("canvas");
  canvas.width = tileWidth * 2;
  canvas.height = tileHeight * 4;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Hero chapter atlas requires a 2D canvas context.");
  }

  context.textBaseline = "alphabetic";
  const projectRoom = projectRoomEnabled();
  const signalsHover = signalsHoverEnabled();
  for (const chapterId of heroChapterOrder) {
    const definition = getHeroChapterDefinition(chapterId);
    const layout = resolveHeroChapterLayout(viewport, chapterId, rootFontSize);
    const content = getHeroChapterContent(chapterId, locale);
    const axioms =
      chapterId === "axioms"
        ? createHeroAxiomsArtwork(context, layout.viewport, locale)
        : undefined;
    const roomTexture =
      chapterId === "builds" && projectRoom
        ? createProjectRoomTexture(content.body)
        : undefined;
    const counter = formatHeroChapterCounter(definition);
    const drawEndpoint = (endpoint: "entry" | "exit") => {
      if (chapterId === "signals") {
        drawSignalsEndpoint(
          context,
          layout.viewport,
          content.body,
          locale,
          endpoint,
          signalsHover,
        );
      } else if (roomTexture) {
        drawProjectRoomEndpoint(context, layout.viewport, roomTexture);
      } else if (axioms) {
        drawAxiomsFrame(
          context,
          axioms,
          resolveAxiomsFrame(endpoint === "entry" ? 0 : 1, axioms.layout),
        );
      } else if (layout.kind === "profile") {
        drawProfileEndpoint(
          context,
          layout,
          counter,
          content.body,
          getHeroProfileSpeechBubbleCopy(locale).front,
          endpoint,
        );
      } else {
        drawStandardEndpoint(context, layout, counter, content.body, endpoint);
      }
    };
    for (const [index, endpoint] of (["entry", "exit"] as const).entries()) {
      drawAtlasTile(
        context,
        layout,
        definition.atlas.column,
        definition.atlas.row + index * 2,
        tileWidth,
        tileHeight,
        () => drawEndpoint(endpoint),
      );
    }
  }

  return {
    canvas,
    tileWidth,
    tileHeight,
    layoutWidth: normalizedViewport.width,
    layoutHeight: normalizedViewport.height,
    locale,
    rootFontSize,
    projectRoom,
    signalsHover,
    signalImagesRevision: getSignalImageRevision(),
  };
}

export function heroChapterAtlasMatchesViewport(
  atlas: HeroChapterAtlas,
  viewport: HeroViewport,
  locale: HeroLocale = "zh",
  rootFontSize: number = heroViewportStore.getSnapshot().rootFontSize,
): boolean {
  const normalizedViewport = normalizeHeroViewport(viewport);
  const resolution = resolveHeroChapterAtlasResolution(viewport);
  return (
    atlas.layoutWidth === normalizedViewport.width &&
    atlas.layoutHeight === normalizedViewport.height &&
    atlas.tileWidth === resolution.tileWidth &&
    atlas.tileHeight === resolution.tileHeight &&
    atlas.locale === locale &&
    atlas.rootFontSize === rootFontSize &&
    atlas.projectRoom === projectRoomEnabled() &&
    atlas.signalsHover === signalsHoverEnabled() &&
    (atlas.signalsHover ||
      atlas.signalImagesRevision === getSignalImageRevision())
  );
}

function drawAtlasTile(
  context: CanvasRenderingContext2D,
  layout: HeroChapterLayout,
  column: number,
  row: number,
  tileWidth: number,
  tileHeight: number,
  draw: () => void,
): void {
  context.save();
  context.beginPath();
  context.rect(column * tileWidth, row * tileHeight, tileWidth, tileHeight);
  context.clip();
  context.translate(column * tileWidth, row * tileHeight);
  context.scale(
    tileWidth / layout.viewport.width,
    tileHeight / layout.viewport.height,
  );
  draw();
  context.restore();
}
