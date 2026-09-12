import { heroLayoutTokens } from "../shared/layoutTokens";
import { resolveLength } from "../shared/length";
import { profileLayoutLengths, profileTextMetrics } from "./layoutTokens";
import type { HeroChapterLayout } from "../chapters/layout";
import type { HeroChapterBodyContent } from "../chapters/contentModel";
import { drawChapterLead, fillTileBackground } from "../chapters/artwork";
import {
  drawTextLines,
  setTextStyle,
  wrapText,
  fillTextInLineBox,
  type CanvasTextLayout,
  type CanvasTextBounds,
} from "../shared/canvasTextLayout";
import { resolveHeroProfileLineShiftForExclusions } from "./wrap";

type ProfileLayout = Extract<HeroChapterLayout, { readonly kind: "profile" }>;

function profileLineOffset(
  layout: ProfileLayout,
  line: CanvasTextBounds,
  side: "left" | "right",
) {
  return resolveHeroProfileLineShiftForExclusions(
    line,
    layout.wrap.exclusions,
    layout.wrap.bounds,
    side,
    layout.wrap.gap,
  );
}

export function drawProfileEndpoint(
  context: CanvasRenderingContext2D,
  layout: ProfileLayout,
  counter: string,
  content: HeroChapterBodyContent,
  speech: string,
  endpoint: "entry" | "exit",
) {
  fillTileBackground(context, layout.viewport.width, layout.viewport.height);
  if (endpoint === "entry") {
    drawProfileSpeechBubble(context, layout, speech);
    drawChapterLead(context, layout, counter, content, (line, side) =>
      profileLineOffset(layout, line, side),
    );
  } else drawProfileTail(context, layout, content, speech);
}

function drawProfileTail(
  context: CanvasRenderingContext2D,
  layout: Extract<HeroChapterLayout, { readonly kind: "profile" }>,
  content: HeroChapterBodyContent,
  speechBubbleText?: string,
): void {
  const mode =
    layout.viewport.width <= heroLayoutTokens.compactBreakpoint
      ? "compact"
      : "desktop";
  const tokens = profileLayoutLengths[mode];
  const fontSize = resolveLength(
    tokens["closing-font-size"],
    layout.viewport,
    layout.rootFontSize,
  );
  const lineHeight = fontSize * profileTextMetrics.closingLineHeight;
  const closing = content.closing ?? content.sections.at(-1)?.title;
  if (speechBubbleText) {
    drawProfileSpeechBubble(context, layout, speechBubbleText);
  }
  if (!closing) {
    return;
  }
  const closingLayout = {
    ...layout.index,
    fontSize,
    lineHeight,
    letterSpacing: fontSize * profileTextMetrics.closingLetterSpacing,
    fontWeight: 400,
    align: "right",
    balance: false,
  } as const satisfies CanvasTextLayout;
  setTextStyle(context, closingLayout);
  const lines = wrapText(context, closing, closingLayout.width);
  const bottom = resolveLength(
    tokens["outro-height"],
    layout.viewport,
    layout.rootFontSize,
  );
  drawTextLines(
    context,
    lines,
    closingLayout,
    bottom - lines.length * lineHeight,
    (line) => profileLineOffset(layout, line, "left"),
  );
}

function drawProfileSpeechBubble(
  context: CanvasRenderingContext2D,
  layout: Extract<HeroChapterLayout, { readonly kind: "profile" }>,
  text: string,
): void {
  const { rect, tailHeight, cornerRadius, fontSize, lineHeight } =
    layout.speechBubble;
  const balloonBottom = rect.bottom - tailHeight;
  const balloonHeight = balloonBottom - rect.top;
  const radius = Math.min(cornerRadius, rect.width / 2, balloonHeight / 2);
  const curveControl = radius * 0.5522847498;
  const centerX = rect.left + rect.width / 2;
  const tailLeft = rect.left + rect.width * 0.45;
  const tailTip = rect.left + rect.width * 0.52;
  const tailRight = rect.left + rect.width * 0.61;

  context.save();
  context.fillStyle = "white";
  context.strokeStyle = "black";
  context.lineWidth = 2;
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(rect.left + radius, rect.top);
  context.lineTo(rect.right - radius, rect.top);
  context.bezierCurveTo(
    rect.right - radius + curveControl,
    rect.top,
    rect.right,
    rect.top + radius - curveControl,
    rect.right,
    rect.top + radius,
  );
  context.lineTo(rect.right, balloonBottom - radius);
  context.bezierCurveTo(
    rect.right,
    balloonBottom - radius + curveControl,
    rect.right - radius + curveControl,
    balloonBottom,
    rect.right - radius,
    balloonBottom,
  );
  context.lineTo(tailRight, balloonBottom);
  context.lineTo(tailTip, rect.bottom);
  context.lineTo(tailLeft, balloonBottom);
  context.lineTo(rect.left + radius, balloonBottom);
  context.bezierCurveTo(
    rect.left + radius - curveControl,
    balloonBottom,
    rect.left,
    balloonBottom - radius + curveControl,
    rect.left,
    balloonBottom - radius,
  );
  context.lineTo(rect.left, rect.top + radius);
  context.bezierCurveTo(
    rect.left,
    rect.top + radius - curveControl,
    rect.left + radius - curveControl,
    rect.top,
    rect.left + radius,
    rect.top,
  );
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "black";
  context.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`;
  context.letterSpacing = "0px";
  const textWidth = context.measureText(text).width;
  fillTextInLineBox(
    context,
    text,
    centerX - textWidth / 2,
    rect.top + (balloonHeight - lineHeight) / 2,
    lineHeight,
    fontSize,
  );
  context.restore();
}
