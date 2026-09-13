import type { HeroViewport } from "../shared/viewport";
import { fillTileBackground } from "./artwork";

/** Snapshot the app's semantic endpoint after layout, including real line wraps.
 * This runs on layout invalidation only. Scrolling selects the prepared tile.
 */
export function drawReadingChapterEndpoint(
  context: CanvasRenderingContext2D,
  body: HTMLElement,
  viewport: HeroViewport,
  endpoint: "entry" | "exit",
) {
  fillTileBackground(context, viewport.width, viewport.height);
  const bounds = body.getBoundingClientRect();
  const top =
    bounds.top +
    (endpoint === "exit" ? Math.max(0, bounds.height - viewport.height) : 0);
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent || !node.textContent?.trim() || parent.closest(".hero-sr-only"))
      continue;
    const rect = parent.getBoundingClientRect();
    if (!rect.width || rect.bottom <= top || rect.top >= top + viewport.height)
      continue;
    const style = getComputedStyle(parent);
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    context.letterSpacing =
      style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
    context.fillStyle = "white";
    let offset = 0;
    let line = "";
    let lineRect: DOMRect | undefined;
    const flush = () => {
      if (!lineRect || !line.trim()) return;
      const metrics = context.measureText(line);
      const ascent =
        metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent;
      const descent =
        metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent;
      const y =
        lineRect.top - top + (lineRect.height - ascent - descent) / 2 + ascent;
      context.fillText(line, lineRect.left, y);
    };
    for (const char of node.textContent) {
      range.setStart(node, offset);
      offset += char.length;
      range.setEnd(node, offset);
      const glyph = range.getBoundingClientRect();
      if (
        !glyph.width ||
        glyph.bottom <= top ||
        glyph.top >= top + viewport.height
      )
        continue;
      if (lineRect && Math.abs(glyph.top - lineRect.top) > 1) {
        flush();
        line = "";
        lineRect = undefined;
      }
      lineRect ??= glyph;
      line += char;
    }
    flush();
  }
  // Paper and disclosure edges use the same computed geometry as their text.
  for (const element of body.querySelectorAll<HTMLElement>(
    "article, section, summary",
  )) {
    const rect = element.getBoundingClientRect();
    if (!rect.width || rect.bottom <= top || rect.top >= top + viewport.height)
      continue;
    const style = getComputedStyle(element);
    const edge = Number.parseFloat(style.borderTopWidth);
    if (edge > 0) context.fillRect(rect.left, rect.top - top, rect.width, edge);
  }
  for (const image of body.querySelectorAll("img")) {
    const rect = image.getBoundingClientRect();
    if (
      image.complete &&
      image.naturalWidth &&
      rect.width &&
      rect.bottom > top &&
      rect.top < top + viewport.height
    ) {
      context.drawImage(
        image,
        rect.left,
        rect.top - top,
        rect.width,
        rect.height,
      );
    }
  }
}
