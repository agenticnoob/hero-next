import { describe, expect, test } from "vitest";
import { createAxiomsArtwork } from "../src/axioms/artwork";
import { getAxiomsContent } from "../src/axioms/content";
import { resolveAxiomsFrame } from "../src/axioms/frame";
import { createAxiomsProgram } from "../src/axioms/program";
import { resolveAxiomsTextureLayout } from "../src/axioms/texture";

const measure = {
  font: "",
  letterSpacing: "0px",
  measureText(text: string) {
    const size = Number.parseFloat(this.font.match(/([\d.]+)px/)?.[1] ?? "16");
    return {
      width: Array.from(text).reduce(
        (sum, char) => sum + size * (/\p{Script=Han}/u.test(char) ? 1 : 0.6),
        0,
      ),
    };
  },
};

describe("axioms text atlas resolution", () => {
  test.each(["zh", "en"] as const)(
    "keeps eight %s articles above native text resolution within the texture budget",
    (locale) => {
      const artwork = createAxiomsArtwork(
        measure,
        { width: 1440, height: 900 },
        getAxiomsContent(locale).body,
        "02 / 04 · AXIOMS / WORKING NOTES",
      );
      const packed = resolveAxiomsTextureLayout([
        artwork.header,
        ...artwork.fans,
        ...artwork.papers,
      ]);
      const canvas = document.createElement("canvas");
      canvas.width = packed.width;
      canvas.height = packed.height;
      const program = createAxiomsProgram(
        artwork,
        { ...packed, canvas },
        resolveAxiomsFrame(1, artwork.layout),
      );
      const atlasSize = program.uniforms?.atlasSize as readonly number[];
      expect(canvas.width / atlasSize[0]).toBeGreaterThanOrEqual(1.5);
      expect(canvas.height / atlasSize[1]).toBeGreaterThanOrEqual(1.5);
      expect(canvas.width).toBeLessThanOrEqual(4096);
      expect(canvas.height).toBeLessThanOrEqual(4096);
      expect(program.uniforms?.tileOrigins).toEqual(packed.tileOrigins);
      for (const [i, tile] of packed.tiles.entries()) {
        const [x, y] = packed.tileOrigins[i];
        expect(x).toBeGreaterThanOrEqual(packed.gutter);
        expect(y).toBeGreaterThanOrEqual(packed.gutter);
        expect(x + tile.width + packed.gutter).toBeLessThanOrEqual(
          atlasSize[0],
        );
        expect(y + tile.height + packed.gutter).toBeLessThanOrEqual(
          atlasSize[1],
        );
        for (let j = 0; j < i; j++) {
          const [otherX, otherY] = packed.tileOrigins[j];
          const other = packed.tiles[j];
          expect(
            x >= otherX + other.width + packed.gutter * 2 ||
              otherX >= x + tile.width + packed.gutter * 2 ||
              y >= otherY + other.height + packed.gutter * 2 ||
              otherY >= y + tile.height + packed.gutter * 2,
          ).toBe(true);
        }
      }
    },
  );
});
