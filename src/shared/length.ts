import type { HeroViewport } from "./viewport";

/** The CSS lengths that also need numeric evaluation for Canvas layout. */
export type LengthToken =
  | { readonly value: number; readonly unit: "px" | "rem" | "vw" | "svh" }
  | {
      readonly minRem: number;
      readonly viewportRatio: number;
      readonly maxRem: number;
      readonly addRem?: number;
      readonly axis: "width" | "height";
    }
  | {
      readonly minPx: number;
      readonly viewportRatio: number;
      readonly axis: "width" | "height";
    };

export function lengthToCSS(token: LengthToken): string {
  if ("unit" in token) return `${token.value}${token.unit}`;
  const percentage = Number((token.viewportRatio * 100).toPrecision(12));
  const viewport = `${percentage}${token.axis === "width" ? "vw" : "svh"}`;
  if ("minPx" in token) return `max(${token.minPx}px, ${viewport})`;
  const preferred = token.addRem
    ? `calc(${viewport} + ${token.addRem}rem)`
    : viewport;
  return `clamp(${token.minRem}rem, ${preferred}, ${token.maxRem}rem)`;
}

export function resolveLength(
  token: LengthToken,
  viewport: HeroViewport,
  rootFontSize: number,
): number {
  if ("unit" in token) {
    switch (token.unit) {
      case "px":
        return token.value;
      case "rem":
        return token.value * rootFontSize;
      case "vw":
        return viewport.width * (token.value / 100);
      case "svh":
        return viewport.height * (token.value / 100);
    }
  }
  const preferred = viewport[token.axis] * token.viewportRatio;
  if ("minPx" in token) return Math.max(token.minPx, preferred);
  return Math.max(
    token.minRem * rootFontSize,
    Math.min(
      token.maxRem * rootFontSize,
      preferred + (token.addRem ?? 0) * rootFontSize,
    ),
  );
}
