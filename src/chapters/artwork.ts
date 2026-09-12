import { heroLayoutTokens } from "../shared/layoutTokens";
import type { HeroViewport } from "../shared/viewport";
import type { HeroChapterBodyContent } from "./contentModel";
import type { HeroChapterLayout } from "./layout";
import {
  drawTextLines,
  setTextStyle,
  wrapText,
  type CanvasTextLayout,
  type CanvasTextBounds,
} from "../shared/canvasTextLayout";

export function drawStandardEndpoint(
  context: CanvasRenderingContext2D,
  layout: Extract<HeroChapterLayout, { kind: "standard" }>,
  counter: string,
  content: HeroChapterBodyContent,
  endpoint: "entry" | "exit",
) {
  fillTileBackground(context, layout.viewport.width, layout.viewport.height);
  if (endpoint === "entry") drawChapterLead(context, layout, counter, content);
  else drawStandardTail(context, layout, content);
}

export function drawChapterLead(
  context: CanvasRenderingContext2D,
  layout: HeroChapterLayout,
  chapterCounter: string,
  content: Pick<HeroChapterBodyContent, "title" | "intro">,
  lineOffset?: (line: CanvasTextBounds, side: "left" | "right") => number,
): void {
  setTextStyle(context, layout.index);
  drawTextLines(
    context,
    [chapterCounter],
    layout.index,
    layout.index.top,
    lineOffset ? (line) => lineOffset(line, "left") : undefined,
  );

  setTextStyle(context, layout.heading);
  const headingLines = wrapText(
    context,
    content.title,
    layout.heading.width,
    layout.heading.balance,
  );
  drawTextLines(
    context,
    headingLines,
    layout.heading,
    layout.heading.top,
    lineOffset ? (line) => lineOffset(line, "left") : undefined,
  );

  setTextStyle(context, layout.intro);
  const introLines = wrapText(
    context,
    content.intro,
    layout.intro.width,
    layout.intro.balance,
  );
  const headingBottom =
    layout.heading.top + headingLines.length * layout.heading.lineHeight;
  const introTop =
    layout.kind === "profile"
      ? headingBottom - introLines.length * layout.intro.lineHeight
      : headingBottom + layout.introGap;
  drawTextLines(
    context,
    introLines,
    layout.intro,
    introTop,
    lineOffset ? (line) => lineOffset(line, "right") : undefined,
  );
}

function drawStandardTail(
  context: CanvasRenderingContext2D,
  layout: Extract<HeroChapterLayout, { readonly kind: "standard" }>,
  content: HeroChapterBodyContent,
): void {
  const { width, height } = layout.viewport;
  const mobile = width <= heroLayoutTokens.compactBreakpoint;
  const inset = Math.max(24, width * 0.07);
  const gap = clamp(width * 0.03, layout.rootFontSize, 3 * layout.rootFontSize);
  const sections = content.sections
    .map((section, index) => ({ number: index + 1, section }))
    .slice(mobile ? -1 : -2);
  const cardWidth = mobile ? width - inset * 2 : (width - inset * 2 - gap) / 2;
  const bottomPadding = height * 0.18;
  const closingLayout = content.closing
    ? createStandardClosingLayout(layout.viewport, inset, layout.rootFontSize)
    : undefined;
  let closingTop = height - bottomPadding;

  if (closingLayout && content.closing) {
    setTextStyle(context, closingLayout);
    const closingLines = wrapText(
      context,
      content.closing,
      closingLayout.width,
    );
    closingTop -= closingLines.length * closingLayout.lineHeight;
    drawTextLines(context, closingLines, closingLayout, closingTop);
  }

  const cardsBottom = closingLayout
    ? closingTop - height * 0.18
    : height - bottomPadding;
  const cardHeight = height * (mobile ? 0.55 : 0.53);
  const cardTop = cardsBottom - cardHeight;
  for (const [index, item] of sections.entries()) {
    drawTailCard(
      context,
      item.number,
      item.section,
      inset + index * (cardWidth + gap),
      cardTop,
      cardWidth,
      cardHeight,
      layout.viewport,
      layout.rootFontSize,
    );
  }
}

function createStandardClosingLayout(
  viewport: HeroViewport,
  inset: number,
  rootFontSize: number,
): CanvasTextLayout {
  const fontSize = clamp(
    viewport.width * 0.05,
    2 * rootFontSize,
    5 * rootFontSize,
  );
  const width = Math.min(
    viewport.width - inset * 2,
    22 * heroLayoutTokens.arialChWidthRatio * fontSize,
  );
  return {
    left: viewport.width - inset - width,
    right: viewport.width - inset,
    width,
    fontSize,
    lineHeight: fontSize * 1.1,
    letterSpacing: fontSize * -0.035,
    fontWeight: 400,
    align: "left",
    balance: false,
  };
}

function drawTailCard(
  context: CanvasRenderingContext2D,
  number: number,
  section: HeroChapterBodyContent["sections"][number],
  left: number,
  top: number,
  width: number,
  height: number,
  viewport: HeroViewport,
  rootFontSize: number,
): void {
  const padding = clamp(
    viewport.width * 0.03,
    1.2 * rootFontSize,
    3 * rootFontSize,
  );
  const contentWidth = Math.max(1, width - padding * 2);
  const labelFontSize = clamp(
    viewport.width * 0.012,
    0.75 * rootFontSize,
    rootFontSize,
  );
  const headingFontSize = clamp(
    viewport.width * 0.04,
    2 * rootFontSize,
    4 * rootFontSize,
  );
  const bodyFontSize = clamp(
    viewport.width * 0.0125,
    0.875 * rootFontSize,
    1.1 * rootFontSize,
  );
  const labelLayout = createCardTextLayout(
    left + padding,
    contentWidth,
    labelFontSize,
    labelFontSize * 1.45,
    labelFontSize * 0.08,
    400,
  );
  const headingLayout = createCardTextLayout(
    left + padding,
    contentWidth,
    headingFontSize,
    headingFontSize,
    headingFontSize * -0.035,
    700,
  );
  const bodyLayout = createCardTextLayout(
    left + padding,
    contentWidth,
    bodyFontSize,
    bodyFontSize * 1.55,
    0,
    400,
  );

  drawRectOutline(context, left, top, width, height);
  setTextStyle(context, labelLayout);
  drawTextLines(
    context,
    [`${String(number).padStart(2, "0")} / ${section.label}`],
    labelLayout,
    top + padding,
  );

  setTextStyle(context, headingLayout);
  const headingLines = wrapText(context, section.title, contentWidth, true);
  const headingTop = top + padding + viewport.height * 0.1;
  drawTextLines(context, headingLines, headingLayout, headingTop);

  setTextStyle(context, bodyLayout);
  const bodyTop =
    headingTop +
    headingLines.length * headingLayout.lineHeight +
    2 * rootFontSize;
  const bodyLines = wrapText(context, section.body, contentWidth);
  drawTextLines(context, bodyLines, bodyLayout, bodyTop);
  if (section.link) {
    drawTextLines(
      context,
      [`${section.link.label} ↗`],
      bodyLayout,
      bodyTop + bodyLines.length * bodyLayout.lineHeight + 1.5 * rootFontSize,
    );
  }
}

function createCardTextLayout(
  left: number,
  width: number,
  fontSize: number,
  lineHeight: number,
  letterSpacing: number,
  fontWeight: 400 | 700,
): CanvasTextLayout {
  return {
    left,
    right: left + width,
    width,
    fontSize,
    lineHeight,
    letterSpacing,
    fontWeight,
    align: "left",
    balance: false,
  };
}

function drawRectOutline(
  context: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
): void {
  const edge = 1;
  context.fillRect(left, top, width, edge);
  context.fillRect(left, top + height - edge, width, edge);
  context.fillRect(left, top, edge, height);
  context.fillRect(left + width - edge, top, edge, height);
}

export function fillTileBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.fillStyle = "black";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "white";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
