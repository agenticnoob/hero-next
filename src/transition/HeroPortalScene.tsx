import { useWebGLRuntime } from "@viselora/dom-webgl/react";
import { useRef } from "react";
import { PerspectiveCamera } from "three";
import { heroChapterOrder } from "../chapters/definitions";
import { HeroText, type HeroTextFrame } from "../shared/HeroText";
import { placeHeroScreenPlane } from "../shared/screenPlane";
import {
  portalDepth,
  readPortalDeclarations,
  useHeroPortalRenderKey,
  type HeroPortalTarget,
} from "./HeroPortalStage";
import {
  createHeroPortalParallaxState,
  resolvePortalOpacity,
  stepHeroPortalParallax,
} from "./portalEffect";
import {
  readHeroPortalViewState,
  resolveHeroPortalMotion,
  heroPortalTerminalContentId,
  type HeroPortalContentId,
} from "./portalState";
import { heroTransitionConfig } from "./transitionConfig";

export function HeroPortalScene({
  pointerActive,
}: {
  readonly pointerActive: { current: boolean };
}) {
  const runtime = useWebGLRuntime();
  const renderKey = useHeroPortalRenderKey(runtime.progress);
  const ids: readonly HeroPortalContentId[] =
    renderKey === "site"
      ? ["site"]
      : renderKey === "none" || renderKey === heroPortalTerminalContentId
        ? []
        : renderKey === "site+content"
          ? ["site", heroChapterOrder[0]]
          : [renderKey];
  return (
    <>
      {ids.flatMap((id) => {
        const pair = readPortalDeclarations(id);
        return [...pair.left, ...pair.right].map((target) => (
          <PortalPlane
            key={target.id}
            target={target}
            pointerActive={pointerActive}
          />
        ));
      })}
    </>
  );
}

function PortalPlane({
  target,
  pointerActive,
}: {
  readonly target: HeroPortalTarget;
  readonly pointerActive: { current: boolean };
}) {
  const runtime = useWebGLRuntime();
  const parallax = useRef(createHeroPortalParallaxState());
  const onFrame: HeroTextFrame = (
    mesh,
    binding,
    { camera, size, pointer },
    delta,
  ) => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const params = target.motion;
    const frame = resolveHeroPortalMotion(
      readHeroPortalViewState(runtime.progress),
      params,
    );
    const hidden =
      params.hideAfterProgressKey !== undefined &&
      runtime.progress.get(params.hideAfterProgressKey) >= 1 - 0.0001;
    const opacity = hidden
      ? 0
      : resolvePortalOpacity(frame.opacity, size.width);
    stepHeroPortalParallax(parallax.current, {
      delta: delta * 1000,
      pointerInside: pointerActive.current,
      pointerX: pointer.x,
      pointerY: pointer.y,
      reducedMotion: reduced,
      visible: frame.visible && opacity > 0.001,
    });
    const travelPx = reduced
      ? 0
      : Math.min(
          params.maxTravelPx,
          size.width * params.travelViewportFraction,
        );
    placeHeroScreenPlane(mesh, camera, size, portalDepth, {
      ...binding.rect,
      left: binding.rect.left + frame.horizontalOffsetProgress * travelPx,
    });
    mesh.rotateX(
      -parallax.current.y * heroTransitionConfig.portal.pointerPitch,
    );
    mesh.rotateY(
      (reduced ? 0 : frame.rotationY) +
        parallax.current.x * heroTransitionConfig.portal.pointerYaw,
    );
    mesh.visible = !hidden && frame.visible && opacity > 0.001;
    mesh.material.opacity = opacity;
  };
  return <HeroText id={target.id} onFrame={onFrame} />;
}
