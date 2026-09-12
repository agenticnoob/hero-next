export type CanvasTextLayout = {
  readonly left: number;
  readonly right: number;
  readonly width: number;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly letterSpacing: number;
  readonly fontWeight: 400 | 700;
  readonly align: "left" | "right";
  readonly balance: boolean;
};

export type PositionedCanvasTextLayout = CanvasTextLayout & {
  readonly top: number;
};

export type CanvasTextBounds = {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
};

export function setTextStyle(
  context: CanvasRenderingContext2D,
  layout: CanvasTextLayout,
): void {
  context.font = `${layout.fontWeight} ${layout.fontSize}px Arial, Helvetica, sans-serif`;
  context.letterSpacing = `${layout.letterSpacing}px`;
}

export function fillTextInLineBox(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  lineTop: number,
  lineHeight: number,
  fontSize: number,
): void {
  const metrics = context.measureText(value || "Hg");
  const ascent = firstFinitePositive(
    metrics.fontBoundingBoxAscent,
    metrics.actualBoundingBoxAscent,
    fontSize * 0.8,
  );
  const descent = firstFiniteNonNegative(
    metrics.fontBoundingBoxDescent,
    metrics.actualBoundingBoxDescent,
    fontSize * 0.2,
  );
  const baseline = lineTop + (lineHeight - ascent - descent) / 2 + ascent;
  context.fillText(value, x, baseline);
}

export function wrapText(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  balance = false,
): readonly string[] {
  const tokens = tokenizeText(value);
  const greedyLines = wrapTokens(context, tokens, maxWidth);
  return balance && greedyLines.length > 1
    ? balanceTokens(context, tokens, maxWidth, greedyLines.length)
    : greedyLines;
}

type TextToken = {
  readonly value: string;
  readonly spaceBefore: boolean;
};

function tokenizeText(value: string): readonly TextToken[] {
  const segments =
    value.match(/\p{Script=Han}|\s+|[^\p{Script=Han}\s]+/gu) ?? [];
  const tokens: TextToken[] = [];
  let pendingSpace = false;
  for (const segment of segments) {
    if (/^\s+$/.test(segment)) {
      pendingSpace = tokens.length > 0;
      continue;
    }
    tokens.push({ value: segment, spaceBefore: pendingSpace });
    pendingSpace = false;
  }
  return tokens;
}

function wrapTokens(
  context: CanvasRenderingContext2D,
  tokens: readonly TextToken[],
  maxWidth: number,
): readonly string[] {
  const lines: string[] = [];
  let start = 0;
  for (let end = 1; end <= tokens.length; end += 1) {
    const candidate = formatTokens(tokens, start, end);
    if (end - start > 1 && context.measureText(candidate).width > maxWidth) {
      lines.push(formatTokens(tokens, start, end - 1));
      start = end - 1;
    }
  }
  if (start < tokens.length) {
    lines.push(formatTokens(tokens, start, tokens.length));
  }
  return lines;
}

function balanceTokens(
  context: CanvasRenderingContext2D,
  tokens: readonly TextToken[],
  maxWidth: number,
  lineCount: number,
): readonly string[] {
  const tokenCount = tokens.length;
  const targetWidth =
    context.measureText(formatTokens(tokens, 0, tokenCount)).width / lineCount;
  const targetTokenCount = Math.max(1, Math.round(tokenCount / lineCount));
  const costs = Array.from({ length: lineCount + 1 }, () =>
    Array.from({ length: tokenCount + 1 }, () => Number.POSITIVE_INFINITY),
  );
  const breaks = Array.from({ length: lineCount + 1 }, () =>
    Array.from({ length: tokenCount + 1 }, () => -1),
  );
  costs[0][0] = 0;

  for (let line = 1; line <= lineCount; line += 1) {
    for (let end = line; end <= tokenCount; end += 1) {
      const remainingTokens = tokenCount - end;
      if (remainingTokens < lineCount - line) {
        continue;
      }
      for (let start = line - 1; start < end; start += 1) {
        if (!Number.isFinite(costs[line - 1][start])) {
          continue;
        }
        const text = formatTokens(tokens, start, end);
        const width = context.measureText(text).width;
        if (width > maxWidth) {
          continue;
        }
        const difference = width - targetWidth;
        const lastLineOverflow =
          line === lineCount ? Math.max(0, difference) : 0;
        // Match text-wrap: balance's short final line without copy-specific breaks.
        const lastLineTokenOverflow =
          line === lineCount ? Math.max(0, end - start - targetTokenCount) : 0;
        const cost =
          costs[line - 1][start] +
          difference * difference +
          lastLineOverflow * lastLineOverflow * 0.01 +
          lastLineTokenOverflow * lastLineTokenOverflow * maxWidth * maxWidth;
        if (cost < costs[line][end]) {
          costs[line][end] = cost;
          breaks[line][end] = start;
        }
      }
    }
  }

  if (breaks[lineCount][tokenCount] < 0) {
    return wrapTokens(context, tokens, maxWidth);
  }
  const lines = Array.from({ length: lineCount }, () => "");
  let end = tokenCount;
  for (let line = lineCount; line > 0; line -= 1) {
    const start = breaks[line][end];
    lines[line - 1] = formatTokens(tokens, start, end);
    end = start;
  }
  return lines;
}

function formatTokens(
  tokens: readonly TextToken[],
  start: number,
  end: number,
): string {
  let value = "";
  for (let index = start; index < end; index += 1) {
    const token = tokens[index];
    if (value && token.spaceBefore) {
      value += " ";
    }
    value += token.value;
  }
  return value;
}

function firstFinitePositive(...values: readonly number[]): number {
  for (const value of values) {
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }
  return 1;
}

function firstFiniteNonNegative(...values: readonly number[]): number {
  for (const value of values) {
    if (Number.isFinite(value) && value >= 0) {
      return value;
    }
  }
  return 0;
}

export function drawTextLines(
  context: CanvasRenderingContext2D,
  lines: readonly string[],
  textLayout: CanvasTextLayout,
  top: number,
  offset?: (line: CanvasTextBounds) => number,
): void {
  for (const [index, text] of lines.entries()) {
    const width = context.measureText(text).width;
    const lineTop = top + index * textLayout.lineHeight;
    const left =
      textLayout.align === "right" ? textLayout.right - width : textLayout.left;
    const shift =
      offset?.({
        left,
        right: left + width,
        top: lineTop,
        bottom: lineTop + textLayout.lineHeight,
        width,
        height: textLayout.lineHeight,
      }) ?? 0;
    fillTextInLineBox(
      context,
      text,
      left + shift,
      lineTop,
      textLayout.lineHeight,
      textLayout.fontSize,
    );
  }
}
