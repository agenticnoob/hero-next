import { resolveSignalsMobileLayout } from "../src/signals/layout";
import * as signalLayout from "../src/signals/layout";
import { setSignalImage, removeSignalImage } from "../src/signals/images";
import { drawSignalsEndpoint } from "../src/signals/artwork";
import { getHeroChapterContent } from "../src/chapters/content";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getAxiomsContent } from "../src/axioms/content";
import { axiomsReaderConfig } from "../src/axioms/config";

import {
  createHeroChapterAtlas,
  heroChapterAtlasMatchesViewport,
} from "../src/chapters/atlas";

const fillText = vi.fn();
const fillRect = vi.fn<CanvasRenderingContext2D["fillRect"]>();
const clip = vi.fn<() => void>();
const rect = vi.fn<CanvasRenderingContext2D["rect"]>();
const fillStyles: string[] = [];
const strokeStyles: string[] = [];
const originalGetContext = HTMLCanvasElement.prototype.getContext;
const context: Partial<CanvasRenderingContext2D> & {
  fillStyle: string;
  font: string;
  letterSpacing: string;
  measureText(value: string): TextMetrics;
} = {
  fillStyle: "",
  font: "",
  letterSpacing: "0px",
  globalAlpha: 1,
  textBaseline: "alphabetic",
  strokeStyle: "",
  lineWidth: 1,
  lineJoin: "miter",
  beginPath: vi.fn(),
  arc: vi.fn(),
  bezierCurveTo: vi.fn(),
  clip,
  closePath: vi.fn(),
  fill: vi.fn(() => fillStyles.push(context.fillStyle)),
  fillRect,
  fillText,
  drawImage: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  measureText(value: string): TextMetrics {
    const fontSize = Number.parseFloat(
      context.font.match(/([\d.]+)px/)?.[1] ?? "16",
    );
    const letterSpacing = Number.parseFloat(context.letterSpacing) || 0;
    const glyphWidth = Array.from(value).reduce(
      (width, glyph) =>
        width +
        (/\p{Script=Han}/u.test(glyph) ? fontSize * 0.95 : fontSize * 0.56),
      0,
    );
    return {
      width:
        glyphWidth + Math.max(0, Array.from(value).length - 1) * letterSpacing,
      actualBoundingBoxAscent: fontSize * 0.8,
      actualBoundingBoxDescent: fontSize * 0.2,
      fontBoundingBoxAscent: fontSize * 0.8,
      fontBoundingBoxDescent: fontSize * 0.2,
    } as TextMetrics;
  },
  rect,
  restore: vi.fn(),
  rotate: vi.fn(),
  save: vi.fn(),
  scale: vi.fn(),
  stroke: vi.fn(() => strokeStyles.push(String(context.strokeStyle))),
  translate: vi.fn(),
};

describe("hero chapter atlas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(signalLayout, "signalsHoverEnabled").mockReturnValue(true);
    fillStyles.length = 0;
    strokeStyles.length = 0;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: vi.fn(() => context),
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: originalGetContext,
      writable: true,
    });
  });

  test("draws all four localized faces from their body content", () => {
    const atlas = createHeroChapterAtlas({ width: 1280, height: 720 });

    expect(atlas).toMatchObject({
      tileWidth: 1820,
      tileHeight: 1024,
      layoutWidth: 1280,
      layoutHeight: 720,
    });
    expect(atlas.canvas).toMatchObject({ width: 3640, height: 4096 });
    expect(atlas.locale).toBe("zh");
    const renderedText = fillText.mock.calls
      .map(([text]) => text)
      .join("")
      .replace(/\s/g, "");
    expect(fillText).toHaveBeenCalledWith(
      "01 / 04",
      expect.any(Number),
      expect.any(Number),
    );
    expect(renderedText).toContain(
      getHeroChapterContent("self", "zh").body.title.replace(/\s/g, ""),
    );
    expect(renderedText).toContain("这是我的正面");
    expect(fillText).not.toHaveBeenCalledWith(
      getHeroChapterContent("self", "zh").body.title,
      expect.any(Number),
      expect.any(Number),
    );
    expect(renderedText).toContain(
      getAxiomsContent("zh").body.title.replace(/\s/g, ""),
    );
    expect(renderedText).toContain("把未完成的思考，放进真实交流。");
    expect(renderedText).not.toContain("SELF/NOOBLI");
    expect(
      heroChapterAtlasMatchesViewport(atlas, { width: 1280, height: 720 }),
    ).toBe(true);
    expect(
      heroChapterAtlasMatchesViewport(
        atlas,
        { width: 1280, height: 720 },
        "en",
      ),
    ).toBe(false);
    fillText.mockClear();
    createHeroChapterAtlas({ width: 1280, height: 720 }, "en");
    const renderedEnglish = fillText.mock.calls
      .map(([text]) => text)
      .join("")
      .replace(/\s/g, "");
    expect(renderedEnglish).toContain(
      getHeroChapterContent("self", "en").body.title.replace(/\s/g, ""),
    );
  });

  test("invalidates text layout when root font size changes without a resize", () => {
    const viewport = { width: 1440, height: 900 };
    const atlas = createHeroChapterAtlas(viewport, "zh", 16);
    expect(heroChapterAtlasMatchesViewport(atlas, viewport, "zh", 16)).toBe(
      true,
    );
    expect(heroChapterAtlasMatchesViewport(atlas, viewport, "zh", 20)).toBe(
      false,
    );
  });

  test("encodes the fourth face with black background and white foreground", () => {
    const backgrounds: string[] = [];
    fillRect.mockImplementationOnce(() => {
      backgrounds.push(context.fillStyle);
    });
    const canvasContext = document.createElement("canvas").getContext("2d");
    if (!canvasContext) throw new Error("Missing test canvas context");
    drawSignalsEndpoint(
      canvasContext,
      { width: 1440, height: 900 },
      getHeroChapterContent("signals", "zh").body,
      "zh",
    );
    expect(backgrounds).toEqual(["black"]);
    expect(context.fillStyle).toBe("white");
    expect(context.textBaseline).toBe("alphabetic");
  });

  test("uses the fourth chapter directory at both handoff endpoints", () => {
    createHeroChapterAtlas({ width: 1440, height: 900 });
    for (const [title, y] of [
      ["抖音 · AXMORF", 229.5],
      ["小红书 · AXMORF", 310.5],
      ["哔哩哔哩 · AXMORF", 391.5],
      ["博客 · 长期思考", 472.5],
      ["GitHub · 开源实践", 553.5],
      ["力扣 · 算法练习", 634.5],
      ["简历 · 个人履历", 715.5],
    ] as const) {
      const rows = fillText.mock.calls.filter(
        ([text, x, top]) =>
          text === title &&
          x > 1440 * 0.07 &&
          x < 1440 / 2 &&
          Math.abs(top - (y + 72 * 0.3)) < 0.001,
      );
      expect(rows).toHaveLength(2);
    }
  });

  test("clips and packs body-derived entry and tail tiles without bleed", () => {
    createHeroChapterAtlas({ width: 1280, height: 720 });

    const backgroundDraws = fillRect.mock.calls.filter(
      ([x, y, width, height]) =>
        x === 0 && y === 0 && width === 1280 && height === 720,
    );
    expect(backgroundDraws).toHaveLength(8);
    expect(context.stroke).toHaveBeenCalled();
    expect(fillStyles).toContain("white");
    expect(strokeStyles).toContain("black");
    expect(context.translate).toHaveBeenCalledWith(0, 2048);
    // Each endpoint clips its fan viewport, visible fan titles and article sheets.
    const articleCount = getAxiomsContent("zh").body.sections.length;
    const visibleFanCount = Math.min(
      articleCount,
      Math.floor(
        axiomsReaderConfig.fan.maxAngle / axiomsReaderConfig.fan.angleStep,
      ) + 1,
    );
    const clipCount = 8 + 2 * (1 + visibleFanCount) + 1 + articleCount;
    expect(rect).toHaveBeenCalledTimes(clipCount);
    expect(clip).toHaveBeenCalledTimes(clipCount + 1 + articleCount);
    expect(
      rect.mock.calls.filter(
        ([, , width, height]) => width === 1820 && height === 1024,
      ),
    ).toHaveLength(8);
    expect(fillText).not.toHaveBeenCalledWith(
      "SELF / TRACE",
      expect.any(Number),
      expect.any(Number),
    );
  });

  test("derives the returning face from the chapter's real tail content", () => {
    const atlas = createHeroChapterAtlas({ width: 1280, height: 720 });
    const renderedText = fillText.mock.calls
      .map(([text]) => text)
      .join("")
      .replace(/\s/g, "");

    expect(atlas.canvas.height).toBe(atlas.tileHeight * 4);
    const profileClosing = getHeroChapterContent("self", "zh").body.closing;
    expect(profileClosing).toBeTruthy();
    expect(renderedText).toContain(profileClosing?.replace(/\s/g, ""));
    const lastArticle = getAxiomsContent("zh").body.sections.at(-1);
    expect(lastArticle).toBeDefined();
    expect(renderedText).toContain(lastArticle?.title.replace(/\s/g, ""));
    expect(renderedText).toContain("愿与同道者共研同进，或有所得，亦未可知。");
  });

  test("caps the owned atlas for mobile-safe texture allocation", () => {
    const atlas = createHeroChapterAtlas({ width: 2400, height: 1800 });

    expect(atlas).toMatchObject({
      tileWidth: 1365,
      tileHeight: 1024,
      layoutWidth: 2400,
      layoutHeight: 1800,
    });
    expect(context.scale).toHaveBeenCalledWith(1365 / 2400, 1024 / 1800);
    expect(
      heroChapterAtlasMatchesViewport(atlas, { width: 2400, height: 1800 }),
    ).toBe(true);
  });

  test("wraps the same body title and intro for the mobile face", () => {
    const atlas = createHeroChapterAtlas({ width: 390, height: 844 });

    expect(atlas).toMatchObject({ tileWidth: 473, tileHeight: 1024 });
    expect(atlas.canvas).toMatchObject({ width: 946, height: 4096 });
    expect(fillText).toHaveBeenCalledWith(
      "01 / 04",
      expect.any(Number),
      expect.any(Number),
    );
  });
  test("packs mobile entry and exit from the full content layout and loaded DOM images", () => {
    vi.spyOn(signalLayout, "signalsHoverEnabled").mockReturnValue(false);
    const viewport = { width: 390, height: 844 };
    const content = getHeroChapterContent("signals", "zh").body;
    const layout = resolveSignalsMobileLayout(viewport, content);
    const src = content.sections[0].image!.src;
    const image = document.createElement("img");
    Object.defineProperty(image, "naturalWidth", { value: 1219 });
    Object.defineProperty(image, "complete", { value: true });
    const before = createHeroChapterAtlas(viewport);
    setSignalImage(src, image);
    expect(heroChapterAtlasMatchesViewport(before, viewport)).toBe(false);
    try {
      const atlas = createHeroChapterAtlas(viewport);
      expect(heroChapterAtlasMatchesViewport(atlas, viewport)).toBe(true);
      expect(context.translate).toHaveBeenCalledWith(
        0,
        viewport.height - layout.height,
      );
      expect(context.drawImage).toHaveBeenCalledWith(
        image,
        (viewport.width - layout.imageWidth) / 2,
        layout.rows[0].contentTop,
        layout.imageWidth,
        layout.rows[0].contentHeight,
      );
      expect(layout.height).toBeGreaterThan(viewport.height * 2);
      expect(layout.rows).toHaveLength(7);
      const lastRow = layout.rows.at(-1)!;
      expect(lastRow.top + lastRow.height).toBe(layout.footerTop);
      expect(fillText.mock.calls.some(([text]) => text === "@skedush")).toBe(
        true,
      );
      expect(
        fillText.mock.calls.some(([text]) => text === "点击内容，前往主页 ↗"),
      ).toBe(true);
    } finally {
      removeSignalImage(src, image);
    }
  });
});
