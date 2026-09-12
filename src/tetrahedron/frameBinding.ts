import type { HeroChapterScrollState } from "../chapters/scrollState";
import type { HeroViewport } from "../shared/viewport";
import type { HeroTetrahedronTransformFrame } from "./transform";

export type HeroTetrahedronSceneFrame = {
  readonly tetrahedron: HeroTetrahedronTransformFrame;
  readonly chapter: HeroChapterScrollState;
  readonly viewport: HeroViewport;
  readonly reducedMotion: boolean;
  readonly spinProgress: number;
};

// One scene-local output binding, not another motion integrator. Reapplying the
// last output also handles either order of the runtime's model/mesh updates.
export function createHeroTetrahedronFrameBinding() {
  let current: HeroTetrahedronSceneFrame | undefined;
  let apply: ((frame: HeroTetrahedronSceneFrame) => void) | undefined;
  const refresh = () => {
    if (current) apply?.(current);
  };
  return {
    publish(frame: HeroTetrahedronSceneFrame) {
      current = frame;
      refresh();
    },
    connect(listener: (frame: HeroTetrahedronSceneFrame) => void) {
      apply = listener;
      refresh();
      return () => {
        if (apply === listener) apply = undefined;
      };
    },
    refresh,
    clear() {
      current = undefined;
    },
  };
}

export type HeroTetrahedronFrameBinding = ReturnType<
  typeof createHeroTetrahedronFrameBinding
>;
