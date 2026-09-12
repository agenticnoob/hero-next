export type HeroViewport = {
  readonly width: number;
  readonly height: number;
};

export const heroDefaultViewport = {
  width: 1_440,
  height: 900,
} as const satisfies HeroViewport;

export function normalizeHeroViewport(viewport: HeroViewport): HeroViewport {
  return {
    width: positive(viewport.width, heroDefaultViewport.width),
    height: positive(viewport.height, heroDefaultViewport.height),
  };
}

export function readHeroViewport(): HeroViewport {
  if (typeof window === "undefined") {
    return heroDefaultViewport;
  }

  return normalizeHeroViewport({
    width: window.innerWidth,
    height: window.innerHeight,
  });
}

function positive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
