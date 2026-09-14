import { afterEach, describe, expect, test, vi } from "vitest";
import {
  createProjectRoomTexture,
  drawProjectRoomEndpoint,
} from "../src/projects/artwork";
import { getHeroChapterContent } from "../src/chapters/content";
import {
  projectRoomExhibitLayout as exhibit,
  projectExhibitLayout,
  updateProjectRoomExhibits,
} from "../src/projects/exhibit";
import { projectHasPoster } from "../src/projects/media";
import { createProjectRoomStore } from "../src/projects/room";
import { projectRoomExhibitProjection } from "../src/projects/projection";
import { projectRoomConfig as config } from "../src/projects/room";

const originalGetContext = HTMLCanvasElement.prototype.getContext;
afterEach(() =>
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: originalGetContext,
    writable: true,
  }),
);

describe("project room text and endpoint projection", () => {
  test("uses the text-only hit area for all three written cases and keeps the poster on SyringeMeter", () => {
    const room = createProjectRoomStore();
    const projects = getHeroChapterContent("builds", "zh").body.sections;
    for (const [index, project] of projects.entries()) {
      const hasPoster = projectHasPoster(project.showcase?.href);
      expect(hasPoster).toBe(index === 2);
      const entry = document.createElement("a");
      entry.dataset.projectPoster = String(hasPoster);
      room.registerExhibit(index, entry);
      const view = [(index * Math.PI) / 2, 0, 0, 0] as const;
      const viewport = { width: 1440, height: 900 };
      updateProjectRoomExhibits(room, viewport, view, 0);
      const layout = projectExhibitLayout(hasPoster);
      expect(entry.style.transform).toBe(
        projectRoomExhibitProjection(viewport, index, view, 0, layout)
          .transform,
      );
      expect(entry.style.visibility).toBe("visible");
      if (!hasPoster) {
        expect(layout.height).toBeLessThan(exhibit.height);
        expect(layout.labelTop).toBeGreaterThanOrEqual(layout.y);
        expect(layout.bottom).toBeLessThanOrEqual(layout.y + layout.height);
      }
    }
  });
  test("preserves the poster's aspect ratio on the physical wall", () => {
    const width = (exhibit.width / config.textureWidth) * 2 * config.radius;
    const height =
      (exhibit.posterHeight / config.textureHeight) * 2 * config.halfHeight;
    expect(width / height).toBeCloseTo(16 / 10, 8);
    expect(exhibit.labelTop).toBeGreaterThan(exhibit.y + exhibit.posterHeight);
    expect(exhibit.bottom).toBeLessThan(config.textureHeight);
  });
  test.each([0, 1, 3, 5])(
    "rejects %i projects before allocating a four-wall texture",
    (count) => {
      const body = getHeroChapterContent("builds", "zh").body;
      const createElement = vi.spyOn(document, "createElement");
      try {
        expect(() =>
          createProjectRoomTexture({
            ...body,
            sections: Array.from({ length: count }, () => body.sections[0]),
          }),
        ).toThrow("Project room requires exactly 4 projects");
        expect(createElement).not.toHaveBeenCalled();
      } finally {
        createElement.mockRestore();
      }
    },
  );

  test("fits both languages and copies only bounded source strips into the face atlas", () => {
    const ctx = {
      font: "",
      letterSpacing: "",
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      globalAlpha: 1,
      textBaseline: "alphabetic",
      scale: vi.fn(),
      translate: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      clip: vi.fn(),
      transform: vi.fn(),
      drawImage: vi.fn(),
      measureText(text: string) {
        const size = Number.parseFloat(
          ctx.font.match(/([\d.]+)px/)?.[1] ?? "16",
        );
        return {
          width: Array.from(text).reduce(
            (n, c) => n + size * (/\p{Script=Han}/u.test(c) ? 1 : 0.56),
            0,
          ),
        };
      },
    };
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: vi.fn(() => ctx),
      writable: true,
    });
    for (const locale of ["zh", "en"] as const) {
      ctx.fillText.mockClear();
      ctx.drawImage.mockClear();
      const texture = createProjectRoomTexture(
        getHeroChapterContent("builds", locale).body,
      );
      expect(texture.width).toBe(4096);
      expect(texture.height).toBe(2880);
      const drawn = ctx.fillText.mock.calls.map(([text]) => text).join("");
      for (const project of getHeroChapterContent("builds", locale).body
        .sections) {
        expect(drawn).toContain(project.title);
        if (project.showcase)
          expect(drawn.replace(/\s/g, "")).toContain(
            `${project.showcase.label} →`.replace(/\s/g, ""),
          );
      }
      const target = document.createElement("canvas").getContext("2d");
      if (!target) throw new Error("Missing test canvas");
      drawProjectRoomEndpoint(target, { width: 1440, height: 900 }, texture);
      expect(ctx.drawImage).toHaveBeenCalled();
      for (const call of ctx.drawImage.mock.calls) {
        expect(call).toHaveLength(9);
        const [source, sx, sy, sw, sh] = call;
        expect(source).toBe(texture);
        expect(sx).toBeGreaterThanOrEqual(0);
        expect(sy).toBeGreaterThanOrEqual(0);
        expect(sw).toBeGreaterThan(0);
        expect(sh).toBeGreaterThan(0);
        expect(sx + sw).toBeLessThanOrEqual(texture.width + 1e-6);
        expect(sy + sh).toBeLessThanOrEqual(texture.height);
      }
    }
  });
});
