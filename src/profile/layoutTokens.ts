import type { CSSProperties } from "react";
import { lengthToCSS, type LengthToken } from "../shared/length";

const common = {
  "flow-max-width": { value: 60, unit: "rem" },
  "index-font-size": { value: 0.75, unit: "rem" },
  "intro-max-width": { value: 24, unit: "rem" },
} as const satisfies Readonly<Record<string, LengthToken>>;

const desktop = {
  "page-inset": { minPx: 24, viewportRatio: 0.06, axis: "width" },
  "column-width": {
    minRem: 16,
    viewportRatio: 0.28,
    maxRem: 25,
    axis: "width",
  },
  "column-gap": { minRem: 1, viewportRatio: 0.025, maxRem: 2, axis: "width" },
  "line-gap": { value: 16, unit: "px" },
  "edge-inset": { value: 24, unit: "px" },
  "model-exclusion-width": {
    minRem: 17,
    viewportRatio: 0.26,
    maxRem: 22,
    axis: "width",
  },
  "model-exclusion-height": {
    minRem: 28,
    viewportRatio: 0.66,
    maxRem: 36,
    axis: "height",
  },
  "speech-width": {
    minRem: 14,
    viewportRatio: 0.18,
    maxRem: 18,
    axis: "width",
  },
  "speech-height": {
    minRem: 4.5,
    viewportRatio: 0.112,
    maxRem: 5.25,
    axis: "height",
  },
  "speech-tail-height": { value: 1, unit: "rem" },
  "speech-radius": { value: 1, unit: "rem" },
  "speech-overlap": { value: 24, unit: "px" },
  "speech-font-size": { value: 1.125, unit: "rem" },
  "speech-line-height": { value: 1.5, unit: "rem" },
  "padding-top": { value: 14, unit: "svh" },
  "lead-gap": { value: 10, unit: "svh" },
  "heading-font-size": {
    minRem: 2.75,
    viewportRatio: 0.057,
    maxRem: 6,
    axis: "width",
  },
  "intro-font-size": {
    minRem: 1,
    viewportRatio: 0.0155,
    maxRem: 1.35,
    axis: "width",
  },
  "closing-font-size": {
    minRem: 1.75,
    viewportRatio: 0.034,
    maxRem: 3.5,
    axis: "width",
  },
  "outro-height": { value: 82, unit: "svh" },
} as const satisfies Readonly<Record<string, LengthToken>>;

const compact = {
  "page-inset": { value: 1, unit: "rem" },
  "column-width": {
    minRem: 5.5,
    viewportRatio: 0.25,
    maxRem: 9,
    axis: "width",
  },
  "column-gap": { value: 0, unit: "px" },
  "line-gap": { value: 2, unit: "px" },
  "edge-inset": { value: 2, unit: "px" },
  "model-exclusion-width": {
    minRem: 9.5,
    viewportRatio: 0.38,
    maxRem: 13,
    addRem: 1,
    axis: "width",
  },
  "model-exclusion-height": {
    minRem: 23,
    viewportRatio: 0.48,
    maxRem: 29,
    axis: "height",
  },
  "speech-width": {
    minRem: 11,
    viewportRatio: 0.46,
    maxRem: 13,
    axis: "width",
  },
  "speech-height": {
    minRem: 4.75,
    viewportRatio: 0.11,
    maxRem: 5.5,
    axis: "height",
  },
  "speech-tail-height": { value: 0.875, unit: "rem" },
  "speech-radius": { value: 0.875, unit: "rem" },
  "speech-overlap": { value: 28, unit: "px" },
  "speech-font-size": { value: 0.875, unit: "rem" },
  "speech-line-height": { value: 1.25, unit: "rem" },
  "padding-top": { value: 12, unit: "svh" },
  "lead-gap": { value: 9, unit: "svh" },
  "heading-font-size": {
    minRem: 2,
    viewportRatio: 0.095,
    maxRem: 3,
    axis: "width",
  },
  "intro-font-size": {
    minRem: 0.82,
    viewportRatio: 0.035,
    maxRem: 1,
    axis: "width",
  },
  "closing-font-size": {
    minRem: 1.25,
    viewportRatio: 0.055,
    maxRem: 1.8,
    axis: "width",
  },
  "outro-height": { value: 84, unit: "svh" },
} as const satisfies Readonly<Record<keyof typeof desktop, LengthToken>>;

export const profileLayoutLengths = { common, desktop, compact } as const;

export const profileTextMetrics = {
  headingMaxCharacters: 7,
  indexLineHeight: 1.4,
  indexLetterSpacing: 0.16,
  headingLineHeight: 0.96,
  closingLineHeight: 1.12,
  closingLetterSpacing: -0.035,
  desktop: { headingLetterSpacing: -0.055, introLineHeight: 1.65 },
  compact: { headingLetterSpacing: -0.04, introLineHeight: 1.55 },
} as const;

// Stable expressions let CSS respond to rem and viewport changes before hydration.
export const profileCSSProperties: Readonly<CSSProperties> &
  Readonly<Record<`--hero-profile-${string}`, string | number>> = {
  ...Object.fromEntries(
    Object.entries(common).map(([name, token]) => [
      `--hero-profile-${name}`,
      lengthToCSS(token),
    ]),
  ),
  ...Object.fromEntries(
    Object.entries({ desktop, compact }).flatMap(([mode, tokens]) =>
      Object.entries(tokens).map(([name, token]) => [
        `--hero-profile-${mode}-${name}`,
        lengthToCSS(token),
      ]),
    ),
  ),
  "--hero-profile-index-line-height": profileTextMetrics.indexLineHeight,
  "--hero-profile-index-letter-spacing": `${profileTextMetrics.indexLetterSpacing}em`,
  "--hero-profile-heading-max-width": `${profileTextMetrics.headingMaxCharacters}ch`,
  "--hero-profile-heading-line-height": profileTextMetrics.headingLineHeight,
  "--hero-profile-closing-line-height": profileTextMetrics.closingLineHeight,
  "--hero-profile-closing-letter-spacing": `${profileTextMetrics.closingLetterSpacing}em`,
  "--hero-profile-desktop-heading-letter-spacing": `${profileTextMetrics.desktop.headingLetterSpacing}em`,
  "--hero-profile-compact-heading-letter-spacing": `${profileTextMetrics.compact.headingLetterSpacing}em`,
  "--hero-profile-desktop-intro-line-height":
    profileTextMetrics.desktop.introLineHeight,
  "--hero-profile-compact-intro-line-height":
    profileTextMetrics.compact.introLineHeight,
};
