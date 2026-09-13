// Shared CSS/Canvas breakpoints and SSR typography defaults. Pixel values match
// the corresponding media queries in globals.css; rem values use the live root size.
export const heroLayoutTokens = {
  compactBreakpoint: 700,
  finePointerBreakpoint: 901,
  shortViewportBreakpoint: 500,
  defaultRootFontSize: 16,
  arialChWidthRatio: 0.55615234375,
} as const;

export const heroFinePointerQuery = `(min-width: ${heroLayoutTokens.finePointerBreakpoint}px) and (min-height: ${heroLayoutTokens.shortViewportBreakpoint + 1}px) and (hover: hover) and (pointer: fine)`;

// Keep the matching CSS query in globals.css aligned with this boundary.
export const heroReadingQuery = `(max-width: ${heroLayoutTokens.finePointerBreakpoint - 1}px), (max-height: ${heroLayoutTokens.shortViewportBreakpoint}px), (hover: none), (pointer: coarse)`;

export function heroReadingLayoutEnabled() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(heroReadingQuery).matches
  );
}
