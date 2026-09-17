import { axiomsReaderConfig } from "./config";
import type { AxiomsArtwork } from "./artwork";
import { drawTextTile, type TextTile } from "../shared/canvasText";

type PackedTile = {
  readonly index: number;
  readonly width: number;
  readonly height: number;
};

function packShelves(tiles: readonly PackedTile[], targetWidth: number) {
  const shelves: { y: number; width: number }[] = [];
  const tileOrigins: [number, number][] = [];
  let height = 0;
  for (const tile of tiles) {
    let shelf = shelves.find((row) => row.width + tile.width <= targetWidth);
    if (!shelf) {
      shelf = { y: height, width: 0 };
      shelves.push(shelf);
      height += tile.height;
    }
    tileOrigins[tile.index] = [shelf.width, shelf.y];
    shelf.width += tile.width;
  }
  return {
    tileOrigins,
    logicalWidth: Math.max(1, ...shelves.map((row) => row.width)),
    logicalHeight: Math.max(1, height),
  };
}

export function resolveAxiomsTextureLayout(tiles: readonly TextTile[]) {
  const { gutter, pixelRatio, maxDimension } = axiomsReaderConfig.texture;
  // Tall tiles establish shelf height; short headings and index entries fill
  // the remaining width instead of inheriting the largest tile's empty area.
  const rectangles = tiles
    .map((tile, index) => ({
      index,
      width: Math.ceil(tile.width) + gutter * 2,
      height: Math.ceil(tile.height) + gutter * 2,
    }))
    .sort(
      (a, b) => b.height - a.height || b.width - a.width || a.index - b.index,
    );
  const widest = Math.max(1, ...rectangles.map((tile) => tile.width));
  const totalWidth = rectangles.reduce((sum, tile) => sum + tile.width, 0);
  const density = (layout: ReturnType<typeof packShelves>) =>
    Math.min(
      pixelRatio,
      maxDimension / layout.logicalWidth,
      maxDimension / layout.logicalHeight,
    );
  let packed = packShelves(rectangles, widest);
  // Try a row-width budget for each possible row count. Prefer resolution,
  // then the smaller allocation when multiple layouts reach the same density.
  for (let rows = 1; rows <= rectangles.length; rows++) {
    const candidate = packShelves(
      rectangles,
      Math.max(widest, Math.ceil(totalWidth / rows)),
    );
    if (
      density(candidate) > density(packed) ||
      (density(candidate) === density(packed) &&
        candidate.logicalWidth * candidate.logicalHeight <
          packed.logicalWidth * packed.logicalHeight)
    )
      packed = candidate;
  }
  const scale = density(packed);
  return {
    tiles,
    logicalWidth: packed.logicalWidth,
    logicalHeight: packed.logicalHeight,
    // Both canvas drawing and shader sampling use these exact logical origins.
    tileOrigins: packed.tileOrigins.map(([x, y]): [number, number] => [
      x + gutter,
      y + gutter,
    ]),
    gutter,
    width: Math.min(maxDimension, Math.ceil(packed.logicalWidth * scale)),
    height: Math.min(maxDimension, Math.ceil(packed.logicalHeight * scale)),
  };
}

export type AxiomsTexture = ReturnType<typeof resolveAxiomsTextureLayout> & {
  readonly canvas: HTMLCanvasElement;
};

export function createAxiomsTexture(artwork: AxiomsArtwork): AxiomsTexture {
  const packed = resolveAxiomsTextureLayout([
    artwork.header,
    ...artwork.fans,
    ...artwork.papers,
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = packed.width;
  canvas.height = packed.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Axioms text requires a 2D canvas context.");
  context.scale(
    canvas.width / packed.logicalWidth,
    canvas.height / packed.logicalHeight,
  );
  for (const [i, tile] of packed.tiles.entries()) {
    context.save();
    const [x, y] = packed.tileOrigins[i];
    context.translate(x, y);
    context.fillStyle = "white";
    drawTextTile(context, tile);
    context.restore();
  }
  return { ...packed, canvas };
}
