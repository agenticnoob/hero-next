import { WebGLModel, type WebGLModelProps } from "@viselora/dom-webgl/react";
import React, { useMemo } from "react";
import type { HeroTetrahedronFrameBinding } from "../tetrahedron/frameBinding";

const profileModelLoader = {
  draco: { decoderPath: "/draco/gltf/", preload: true },
} satisfies NonNullable<WebGLModelProps["loader"]>;

export function HeroProfileModel({
  frameBinding,
}: {
  readonly frameBinding: HeroTetrahedronFrameBinding;
}) {
  const profileModelEffects = useMemo(
    () =>
      [{ kind: "hero.profile.model", frameBinding }] satisfies NonNullable<
        WebGLModelProps["effects"]
      >,
    [frameBinding],
  );
  return (
    <WebGLModel
      id="hero.profile.model"
      src="/models/noobli-profile.glb"
      loader={profileModelLoader}
      effects={profileModelEffects}
    />
  );
}
