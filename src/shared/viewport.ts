import { heroReadingLayoutEnabled } from "./layoutTokens";

export type HeroViewport = {
  readonly width: number;
  readonly height: number;
  readonly reading?: boolean;
};

export const heroDefaultViewport = {
  width: 1_440,
  height: 900,
} as const satisfies HeroViewport;

export function normalizeHeroViewport(viewport: HeroViewport): HeroViewport {
  return {
    width: positive(viewport.width, heroDefaultViewport.width),
    height: positive(viewport.height, heroDefaultViewport.height),
    ...(viewport.reading === undefined ? {} : { reading: viewport.reading }),
  };
}

export function readHeroViewport(): HeroViewport {
  if (typeof window === "undefined") {
    return heroDefaultViewport;
  }

  return normalizeHeroViewport({
    width: window.innerWidth,
    height: window.innerHeight,
    reading: heroReadingLayoutEnabled(),
  });
}

function positive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
