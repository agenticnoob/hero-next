import type { WebGLScrollSmoothOptions } from "@viselora/scroll-adapters/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { invalidateHeroReadingLayout } from "../chapters/readingLayout";

gsap.registerPlugin(ScrollTrigger);

let activeLenis: Lenis | undefined;
export const heroSmoothScroll = {
  createLenis: () => {
    activeLenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,
      anchors: { immediate: true, offset: 1 },
    });
    return activeLenis;
  },
  gsap,
  ScrollTrigger,
  disableLagSmoothing: true,
} satisfies WebGLScrollSmoothOptions;

export function restoreHeroReadingPosition(top: number) {
  activeLenis?.resize();
  activeLenis?.scrollTo(top, { immediate: true, force: true });
}

let pendingRefresh = 0;
export function refreshHeroScrollLayout(): void {
  if (typeof window === "undefined" || pendingRefresh) return;
  pendingRefresh = window.requestAnimationFrame(() => {
    pendingRefresh = 0;
    // React, fonts, details and paginated content must settle before measuring.
    ScrollTrigger.refresh();
    ScrollTrigger.update();
    invalidateHeroReadingLayout();
  });
}
