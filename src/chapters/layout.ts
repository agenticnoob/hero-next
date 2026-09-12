import type {
  CanvasTextLayout,
  PositionedCanvasTextLayout,
} from "../shared/canvasTextLayout";
import type { HeroViewport } from "../shared/viewport";
import { heroLayoutTokens } from "../shared/layoutTokens";
import { resolveLength } from "../shared/length";
import {
  profileLayoutLengths,
  profileTextMetrics,
} from "../profile/layoutTokens";
import { heroDefaultViewport } from "../shared/viewport";
import type {
  HeroProfileHorizontalBounds,
  HeroProfileWrapExclusion,
  HeroProfileWrapRect,
} from "../profile/wrap";
import type { HeroChapterId } from "./definitions";

const atlasMaxTileWidth = 1_024;
const atlasMaxTileHeight = 1_024;
const { arialChWidthRatio } = heroLayoutTokens;

export type HeroProfileSpeechBubbleLayout = {
  readonly rect: HeroProfileWrapRect;
  readonly tailHeight: number;
  readonly cornerRadius: number;
  readonly fontSize: number;
  readonly lineHeight: number;
};

type HeroChapterBaseLayout = {
  readonly viewport: HeroViewport;
  readonly rootFontSize: number;
  readonly index: PositionedCanvasTextLayout;
  readonly heading: PositionedCanvasTextLayout;
  readonly intro: CanvasTextLayout;
};

export type HeroChapterLayout =
  | (HeroChapterBaseLayout & {
      readonly kind: "profile";
      readonly wrap: {
        readonly bounds: HeroProfileHorizontalBounds;
        readonly exclusions: readonly HeroProfileWrapExclusion[];
        readonly gap: number;
      };
      readonly speechBubble: HeroProfileSpeechBubbleLayout;
    })
  | (HeroChapterBaseLayout & {
      readonly kind: "standard";
      readonly introGap: number;
    });

export type HeroChapterAtlasResolution = {
  readonly tileWidth: number;
  readonly tileHeight: number;
};

export function resolveHeroChapterLayout(
  viewport: HeroViewport,
  chapterId: HeroChapterId = "self",
  rootFontSize: number = heroLayoutTokens.defaultRootFontSize,
): HeroChapterLayout {
  const width = positive(viewport.width, heroDefaultViewport.width);
  const height = positive(viewport.height, heroDefaultViewport.height);
  const normalizedViewport = { width, height } as const;
  const mobile = width <= heroLayoutTokens.compactBreakpoint;
  return chapterId === "self"
    ? resolveProfileLayout(
        normalizedViewport,
        mobile,
        positive(rootFontSize, heroLayoutTokens.defaultRootFontSize),
      )
    : resolveStandardLayout(
        normalizedViewport,
        mobile,
        positive(rootFontSize, heroLayoutTokens.defaultRootFontSize),
      );
}

export function resolveHeroChapterAtlasResolution(
  viewport: HeroViewport,
): HeroChapterAtlasResolution {
  const width = positive(viewport.width, heroDefaultViewport.width);
  const height = positive(viewport.height, heroDefaultViewport.height);
  const scale = Math.min(
    1,
    atlasMaxTileWidth / width,
    atlasMaxTileHeight / height,
  );

  return {
    tileWidth: Math.max(1, Math.round(width * scale)),
    tileHeight: Math.max(1, Math.round(height * scale)),
  };
}

function resolveProfileLayout(
  viewport: HeroViewport,
  mobile: boolean,
  rootFontSize: number,
): Extract<HeroChapterLayout, { readonly kind: "profile" }> {
  const { width, height } = viewport;
  const mode = mobile ? "compact" : "desktop";
  const tokens = profileLayoutLengths[mode];
  const metrics = profileTextMetrics[mode];
  const length = (name: keyof typeof tokens) =>
    resolveLength(tokens[name], viewport, rootFontSize);
  const commonLength = (name: keyof typeof profileLayoutLengths.common) =>
    resolveLength(profileLayoutLengths.common[name], viewport, rootFontSize);
  const pageInset = length("page-inset");
  const flowWidth = Math.min(
    commonLength("flow-max-width"),
    width - pageInset * 2,
  );
  const flowLeft = (width - flowWidth) / 2;
  const columnWidth = length("column-width");
  const columnGap = length("column-gap");
  const gridWidth = columnWidth * 2 + columnGap;
  const gridLeft = flowLeft + (flowWidth - gridWidth) / 2;
  const indexFontSize = commonLength("index-font-size");
  const indexLineHeight = indexFontSize * profileTextMetrics.indexLineHeight;
  const indexTop = length("padding-top");
  const headingFontSize = length("heading-font-size");
  const headingWidth = Math.min(
    columnWidth,
    headingFontSize *
      arialChWidthRatio *
      profileTextMetrics.headingMaxCharacters,
  );
  const headingRight = gridLeft + columnWidth;
  const introFontSize = length("intro-font-size");
  const exclusionWidth = length("model-exclusion-width");
  const exclusionHeight = length("model-exclusion-height");
  const modelExclusion = centeredRect(
    width,
    height,
    exclusionWidth,
    exclusionHeight,
  );
  const speechBubbleWidth = length("speech-width");
  const speechBubbleHeight = length("speech-height");
  const speechBubbleOverlap = length("speech-overlap");
  const speechBubbleTailHeight = length("speech-tail-height");
  const speechBubbleCornerRadius = length("speech-radius");
  const speechBubbleRect = rectFromBottomCenter(
    width,
    modelExclusion.top + speechBubbleOverlap,
    speechBubbleWidth,
    speechBubbleHeight,
  );
  const speechBubbleBalloonRect = {
    ...speechBubbleRect,
    bottom: speechBubbleRect.bottom - speechBubbleTailHeight,
    height: speechBubbleRect.height - speechBubbleTailHeight,
  } satisfies HeroProfileWrapRect;

  return {
    kind: "profile",
    viewport,
    rootFontSize,
    index: createTextLayout({
      left: gridLeft,
      top: indexTop,
      width: columnWidth,
      fontSize: indexFontSize,
      lineHeight: indexLineHeight,
      letterSpacing: indexFontSize * profileTextMetrics.indexLetterSpacing,
      fontWeight: 400,
      align: "right",
    }),
    heading: createTextLayout({
      left: headingRight - headingWidth,
      top: indexTop + indexLineHeight + length("lead-gap"),
      width: headingWidth,
      fontSize: headingFontSize,
      lineHeight: headingFontSize * profileTextMetrics.headingLineHeight,
      letterSpacing: headingFontSize * metrics.headingLetterSpacing,
      fontWeight: 700,
      align: "right",
      balance: true,
    }),
    intro: createTextLayout({
      left: gridLeft + columnWidth + columnGap,
      width: Math.min(columnWidth, commonLength("intro-max-width")),
      fontSize: introFontSize,
      lineHeight: introFontSize * metrics.introLineHeight,
      letterSpacing: 0,
      fontWeight: 400,
      align: "left",
    }),
    wrap: {
      bounds: {
        left: length("edge-inset"),
        right: width - length("edge-inset"),
      },
      exclusions: [
        { kind: "ellipse", rect: modelExclusion },
        {
          kind: "rounded-rectangle",
          rect: speechBubbleBalloonRect,
          radius: speechBubbleCornerRadius,
        },
      ],
      gap: length("line-gap"),
    },
    speechBubble: {
      rect: speechBubbleRect,
      tailHeight: speechBubbleTailHeight,
      cornerRadius: speechBubbleCornerRadius,
      fontSize: length("speech-font-size"),
      lineHeight: length("speech-line-height"),
    },
  };
}

function resolveStandardLayout(
  viewport: HeroViewport,
  mobile: boolean,
  rootFontSize: number,
): Extract<HeroChapterLayout, { readonly kind: "standard" }> {
  const { width, height } = viewport;
  const inset = Math.max(24, width * 0.07);
  const availableWidth = width - inset * 2;
  const indexFontSize = rootFontSize;
  const indexLineHeight = indexFontSize * 1.2;
  const indexTop = height * (mobile ? 0.14 : 0.18);
  const headingFontSize = clamp(
    width * 0.08,
    3 * rootFontSize,
    8 * rootFontSize,
  );
  const headingWidth = Math.min(
    availableWidth,
    headingFontSize * arialChWidthRatio * 11,
  );
  const introWidth = Math.min(44 * rootFontSize, availableWidth);
  const introLeft = mobile ? inset : width - inset - introWidth;
  const introFontSize = clamp(
    width * 0.0225,
    1.2 * rootFontSize,
    2.2 * rootFontSize,
  );

  return {
    kind: "standard",
    viewport,
    rootFontSize,
    index: createTextLayout({
      left: inset,
      top: indexTop,
      width: availableWidth,
      fontSize: indexFontSize,
      lineHeight: indexLineHeight,
      letterSpacing: indexFontSize * 0.15,
      fontWeight: 400,
      align: "left",
    }),
    heading: createTextLayout({
      left: inset,
      top: indexTop + indexLineHeight + height * 0.08,
      width: headingWidth,
      fontSize: headingFontSize,
      lineHeight: headingFontSize * 0.95,
      letterSpacing: headingFontSize * (mobile ? -0.035 : -0.055),
      fontWeight: 700,
      align: "left",
      balance: mobile,
    }),
    intro: createTextLayout({
      left: introLeft,
      width: introWidth,
      fontSize: introFontSize,
      lineHeight: introFontSize * 1.35,
      letterSpacing: 0,
      fontWeight: 400,
      align: "left",
    }),
    introGap: height * 0.08,
  };
}

function createTextLayout(
  input: Omit<PositionedCanvasTextLayout, "right" | "balance"> & {
    readonly balance?: boolean;
  },
): PositionedCanvasTextLayout;
function createTextLayout(
  input: Omit<CanvasTextLayout, "right" | "balance"> & {
    readonly balance?: boolean;
  },
): CanvasTextLayout;
function createTextLayout(
  input: Omit<CanvasTextLayout, "right" | "balance"> & {
    readonly top?: number;
    readonly balance?: boolean;
  },
): CanvasTextLayout | PositionedCanvasTextLayout {
  return {
    ...input,
    right: input.left + input.width,
    balance: input.balance ?? false,
  };
}

function centeredRect(
  viewportWidth: number,
  viewportHeight: number,
  width: number,
  height: number,
): HeroProfileWrapRect {
  const left = (viewportWidth - width) / 2;
  const top = (viewportHeight - height) / 2;
  return {
    left,
    right: left + width,
    top,
    bottom: top + height,
    width,
    height,
  };
}

function rectFromBottomCenter(
  viewportWidth: number,
  bottom: number,
  width: number,
  height: number,
): HeroProfileWrapRect {
  const left = (viewportWidth - width) / 2;
  const top = bottom - height;
  return {
    left,
    right: left + width,
    top,
    bottom,
    width,
    height,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function positive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
