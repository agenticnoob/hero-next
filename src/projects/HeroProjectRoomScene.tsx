import { useFrame } from "@react-three/fiber";
import { useWebGLRuntime } from "@viselora/dom-webgl/react";
import React, { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { PerspectiveCamera, ShaderMaterial, Texture, type Mesh } from "three";
import { getHeroChapterContent } from "../chapters/content";
import { heroChapterDefinitions } from "../chapters/definitions";
import { readHeroChapterScrollState } from "../chapters/scrollState";
import type { HeroLocaleStore } from "../preferences/locale";
import { placeHeroScreenPlane } from "../shared/screenPlane";
import { updateHeroUniforms } from "../shared/shaderUniforms";
import { readHeroTransitionSignals } from "../transition/signals";
import { createProjectRoomTexture } from "./artwork";
import { hideProjectRoomExhibits, updateProjectRoomExhibits } from "./exhibit";
import { syringeMeterMedia, projectHasPoster } from "./media";
import { projectRoomWallAngle } from "./model";
import {
  createProjectRoomProgram,
  createProjectRoomPosterTexture,
  projectRoomColors,
} from "./program";
import {
  projectRoomConfig,
  resolveRoomTurn,
  roomInteractionWeight,
  stepRoomAngle,
  wrapRoomAngle,
} from "./room";
import type { ProjectRoomStore } from "./roomStore";

export function HeroProjectRoomScene({
  locale: localeStore,
  room,
  pointerActive,
}: {
  readonly locale: HeroLocaleStore;
  readonly room: ProjectRoomStore;
  readonly pointerActive: { current: boolean };
}) {
  const runtime = useWebGLRuntime();
  const locale = useSyncExternalStore(
    localeStore.subscribe,
    localeStore.getSnapshot,
    localeStore.getServerSnapshot,
  );
  const mesh = useRef<Mesh>(null);
  const desktop = useMemo(
    () => window.matchMedia(projectRoomConfig.desktopQuery),
    [],
  );
  const reduced = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)"),
    [],
  );
  const material = useMemo(() => {
    const content = getHeroChapterContent("builds", locale).body;
    return new ShaderMaterial(
      createProjectRoomProgram(
        createProjectRoomTexture(content),
        content.sections.findIndex((section) =>
          projectHasPoster(section.showcase?.href),
        ),
      ),
    );
  }, [locale]);
  const motion = useRef({
    yaw: 0,
    parallaxX: 0,
    parallaxY: 0,
    approach: 0,
    armed: false,
    wasVisible: false,
  });
  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth === 0) return;
      updateHeroUniforms(material.uniforms, {
        poster: createProjectRoomPosterTexture(image),
        posterReady: 1,
      });
    };
    image.src = syringeMeterMedia.poster;
    return () => {
      image.onload = null;
      const textures = new Set([
        material.uniforms.inkAtlas?.value,
        material.uniforms.poster?.value,
      ]);
      for (const texture of textures)
        if (texture instanceof Texture) texture.dispose();
      material.dispose();
      hideProjectRoomExhibits(room);
      room.publishFrame({ ready: false, active: false, settled: true });
    };
  }, [material, room]);
  useFrame(({ pointer, size: viewport, camera }, delta) => {
    if (!mesh.current || !(camera instanceof PerspectiveCamera)) return;
    const state = motion.current;
    const chapter = readHeroChapterScrollState(runtime.progress);
    const visible =
      desktop.matches &&
      chapter.chapterId === "builds" &&
      chapter.domContentActive;
    mesh.current.visible = visible;
    if (!visible) {
      hideProjectRoomExhibits(room);
      state.wasVisible = false;
      room.setHovered(false);
      room.setFocused(false);
      room.publishFrame({
        ready: desktop.matches,
        active: false,
        settled: true,
      });
      return;
    }
    if (!state.wasVisible) {
      state.yaw = projectRoomWallAngle(room.getSnapshot().selected);
      state.parallaxX = 0;
      state.parallaxY = 0;
      state.armed = false;
    }
    state.wasVisible = true;
    const weight = roomInteractionWeight(
      runtime.progress.get(heroChapterDefinitions.builds.signals.body),
    );
    const interactive = weight > 0.999;
    const x = pointer.x;
    const y = -pointer.y;
    const pointerEnabled =
      interactive &&
      pointerActive.current &&
      !reduced.matches &&
      !room.getSnapshot().exhibition;
    if (Math.abs(x) < projectRoomConfig.rearmThreshold) state.armed = true;
    const turn =
      pointerEnabled && !room.pointerLocked()
        ? resolveRoomTurn(x, y, state.armed)
        : 0;
    if (turn) {
      room.select(room.getSnapshot().selected + turn);
      state.armed = false;
    }
    const target = projectRoomWallAngle(room.getSnapshot().selected);
    const deltaMs = delta * 1000;
    state.yaw = stepRoomAngle(state.yaw, target, deltaMs, reduced.matches);
    const smoothing = 1 - Math.exp(-Math.max(0, Math.min(deltaMs, 64)) / 120);
    const approach = room.getSnapshot().exhibition ? 1.15 : 0;
    state.approach = reduced.matches
      ? 0
      : state.approach + (approach - state.approach) * smoothing;
    state.parallaxX += ((pointerEnabled ? x : 0) - state.parallaxX) * smoothing;
    state.parallaxY += ((pointerEnabled ? y : 0) - state.parallaxY) * smoothing;
    if (reduced.matches) {
      state.parallaxX = 0;
      state.parallaxY = 0;
    }
    placeHeroScreenPlane(mesh.current, camera, viewport, 3);
    const view = [
      (reduced.matches && !interactive
        ? 0
        : wrapRoomAngle(state.yaw) * weight) +
        state.parallaxX * 0.045 * weight,
      -state.parallaxY * 0.025 * weight,
      state.parallaxX * 0.12 * weight,
      -state.parallaxY * 0.08 * weight,
    ] as const;
    updateHeroUniforms(material.uniforms, {
      viewport: [viewport.width, viewport.height],
      approach: state.approach,
      view,
      ...projectRoomColors(
        readHeroTransitionSignals(runtime.progress).committedScheme ===
          "inverted",
      ),
    });
    updateProjectRoomExhibits(room, viewport, view, state.approach);
    room.publishFrame({
      ready: true,
      active: interactive,
      settled: Math.abs(wrapRoomAngle(target - state.yaw)) < 0.025,
    });
  });
  return (
    <mesh
      ref={mesh}
      name="hero.projects.room"
      material={material}
      visible={false}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
