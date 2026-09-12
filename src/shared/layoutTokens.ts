// Shared CSS/Canvas breakpoints and SSR typography defaults. Pixel values match
// the corresponding media queries in globals.css; rem values use the live root size.
export const heroLayoutTokens = {
  compactBreakpoint: 700,
  finePointerBreakpoint: 901,
  defaultRootFontSize: 16,
  arialChWidthRatio: 0.55615234375,
} as const;

export const heroFinePointerQuery = `(min-width: ${heroLayoutTokens.finePointerBreakpoint}px) and (hover: hover) and (pointer: fine)`;
