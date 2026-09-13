import { heroLayoutTokens, heroReadingQuery } from "./layoutTokens";
import {
  heroDefaultViewport,
  readHeroViewport,
  type HeroViewport,
} from "./viewport";

export type HeroViewportSnapshot = HeroViewport & {
  readonly rootFontSize: number;
  readonly reading: boolean;
};

const serverSnapshot: HeroViewportSnapshot = {
  ...heroDefaultViewport,
  rootFontSize: heroLayoutTokens.defaultRootFontSize,
  reading: false,
};

export function createHeroViewportStore() {
  let snapshot = serverSnapshot;
  const listeners = new Set<() => void>();
  let stop: (() => void) | undefined;

  const update = () => {
    const viewport = readHeroViewport();
    const measured = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    const rootFontSize =
      measured > 0 && Number.isFinite(measured)
        ? measured
        : heroLayoutTokens.defaultRootFontSize;
    const reading = window.matchMedia(heroReadingQuery).matches;
    if (
      viewport.width === snapshot.width &&
      viewport.height === snapshot.height &&
      rootFontSize === snapshot.rootFontSize &&
      reading === snapshot.reading
    )
      return;
    snapshot = { ...viewport, rootFontSize, reading };
    for (const listener of listeners) listener();
  };

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!stop) {
        let frame = 0;
        const schedule = () => {
          if (frame) return;
          frame = window.requestAnimationFrame(() => {
            frame = 0;
            update();
          });
        };
        const resizeObserver =
          typeof ResizeObserver === "undefined"
            ? undefined
            : new ResizeObserver(schedule);
        const mutationObserver = new MutationObserver(schedule);
        resizeObserver?.observe(document.documentElement);
        mutationObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["style", "class"],
        });
        window.addEventListener("resize", schedule, { passive: true });
        const media = window.matchMedia(heroReadingQuery);
        media.addEventListener?.("change", schedule);
        document.fonts?.addEventListener("loadingdone", schedule);
        stop = () => {
          window.removeEventListener("resize", schedule);
          media.removeEventListener?.("change", schedule);
          document.fonts?.removeEventListener("loadingdone", schedule);
          resizeObserver?.disconnect();
          mutationObserver.disconnect();
          window.cancelAnimationFrame(frame);
        };
        update();
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          stop?.();
          stop = undefined;
        }
      };
    },
  };
}

// This store is only activated by client subscriptions; SSR always reads the
// immutable server snapshot and never installs observers or writes browser state.
export const heroViewportStore = createHeroViewportStore();
