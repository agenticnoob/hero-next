import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useWebGLRuntime } from "@viselora/dom-webgl/react";
import { useScrollEffectProgressStore } from "@viselora/scroll-adapters/react";
import React, { useEffect, useMemo, useRef } from "react";
import type { BufferGeometry, Mesh, MeshStandardMaterial } from "three";

import type { HeroLocaleStore } from "../preferences/locale";
import type { HeroThemeStore } from "../preferences/theme";
import { readHeroViewport } from "../shared/viewport";
import { heroTransitionConfig } from "../transition/transitionConfig";
import {
  createHeroTetrahedronResources,
  updateHeroTetrahedronFrame,
} from "./effect";
import type { HeroTetrahedronFrameBinding } from "./frameBinding";

export function HeroTetrahedron({
  theme,
  locale,
  pointerActive,
  frameBinding,
}: {
  readonly theme: HeroThemeStore;
  readonly locale: HeroLocaleStore;
  readonly pointerActive: { current: boolean };
  readonly frameBinding: HeroTetrahedronFrameBinding;
}) {
  const runtime = useWebGLRuntime();
  const signals = useScrollEffectProgressStore();
  const mesh = useRef<Mesh<BufferGeometry, MeshStandardMaterial>>(null);
  const press = useRef({ primary: false, hit: false });
  const resources = useMemo(
    () =>
      createHeroTetrahedronResources(
        readHeroViewport(),
        locale,
        theme,
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
    [locale, theme],
  );

  useEffect(() => {
    const release = () => {
      press.current.primary = false;
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      resources.texture.dispose();
      resources.material.dispose();
      frameBinding.clear();
    };
  }, [resources, frameBinding]);

  useFrame(({ pointer, clock, gl }, delta) => {
    if (!mesh.current) return;
    updateHeroTetrahedronFrame(
      mesh.current,
      resources,
      {
        time: clock.elapsedTime * 1000,
        deltaMs: delta * 1000,
        scrollY: runtime.scroll.scrollY,
        viewport: readHeroViewport(),
        pixelRatio: gl.getPixelRatio(),
        progress: runtime.progress,
        pointer: {
          inside: pointerActive.current,
          x: pointer.x,
          y: pointer.y,
          primaryDown: press.current.primary,
          meshPressed: press.current.primary,
          hit: press.current.hit,
        },
      },
      { theme, locale, signals, frameBinding },
    );
  }, -2);

  const down = (event: ThreeEvent<PointerEvent>) => {
    if (
      event.button !== 0 ||
      event.isPrimary === false ||
      readHeroViewport().reading
    )
      return;
    event.stopPropagation();
    press.current = { primary: true, hit: true };
  };
  return (
    <mesh
      ref={mesh}
      name="hero.tetrahedron.mesh"
      material={resources.material}
      onPointerDown={down}
      onPointerOver={() => {
        press.current.hit = true;
      }}
      onPointerOut={() => {
        press.current.hit = false;
      }}
      onPointerUp={() => {
        press.current.primary = false;
      }}
    >
      <tetrahedronGeometry args={[heroTransitionConfig.geometry.radius, 0]} />
    </mesh>
  );
}
