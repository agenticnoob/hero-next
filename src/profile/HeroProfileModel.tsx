import { useGLTF } from "@react-three/drei";
import React, {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { Group } from "three";

import type { HeroTetrahedronFrameBinding } from "../tetrahedron/frameBinding";
import {
  connectHeroProfileModelFrame,
  createHeroProfileModelResources,
} from "./modelEffect";

export function HeroProfileModel({
  frameBinding,
}: {
  readonly frameBinding: HeroTetrahedronFrameBinding;
}) {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <ProfileModel frameBinding={frameBinding} />
      </Suspense>
    </ErrorBoundary>
  );
}

function ProfileModel({
  frameBinding,
}: {
  readonly frameBinding: HeroTetrahedronFrameBinding;
}) {
  const gltf = useGLTF("/models/noobli-profile.glb", "/draco/gltf/");
  const root = useRef<Group>(null);
  const resources = useMemo(
    () => createHeroProfileModelResources(gltf.scene),
    [gltf.scene],
  );
  useEffect(() => () => resources.dispose(), [resources]);
  useLayoutEffect(() => {
    if (!root.current) return;
    return connectHeroProfileModelFrame(root.current, frameBinding);
  }, [frameBinding, resources]);
  return (
    <group ref={root} name="hero.profile.model" visible={false} dispose={null}>
      <primitive object={resources.object} />
    </group>
  );
}
