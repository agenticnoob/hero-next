import {
  defineWebGLSceneObjectEffect,
  type WebGLEffectMaterialFacade,
} from "@viselora/dom-webgl";

import type { HeroTetrahedronFrameBinding } from "../tetrahedron/frameBinding";
import { heroTransitionConfig } from "../transition/transitionConfig";
import { resolveHeroProfileModelFrame } from "./frame";

export type HeroProfileModelEffectParams = {
  readonly kind: "hero.profile.model";
  readonly frameBinding: HeroTetrahedronFrameBinding;
};

export const heroProfileMaterialRoughness = 0.72;
export const heroProfileMaterialFill = 0.12;

export const heroProfileMaterialColor = heroTransitionConfig.colors.light;

type MaterialSnapshot = {
  readonly material: WebGLEffectMaterialFacade;
  readonly color: string;
  readonly emissive: string;
  readonly emissiveIntensity: number;
  readonly metalness: number;
  readonly roughness: number;
};

type HeroProfileModelEffectState = {
  readonly disconnect: () => void;
  readonly materials: readonly MaterialSnapshot[];
};

export {
  resolveHeroProfileModelFrame,
  type HeroProfileModelFrame,
} from "./frame";

export const heroProfileModelEffect = defineWebGLSceneObjectEffect<
  HeroProfileModelEffectParams,
  HeroProfileModelEffectState
>({
  kind: "hero.profile.model",
  source: "model/glb",
  schedule: "frame",
  setup(ctx, params) {
    const materials = (ctx.object.model?.meshes.all() ?? []).map(
      ({ material }) => {
        const snapshot: MaterialSnapshot = {
          material,
          color: material.color.value,
          emissive: material.emissive.value,
          emissiveIntensity: material.emissive.intensity,
          metalness: material.metalness,
          roughness: material.roughness,
        };
        const color = heroProfileMaterialColor;
        material.color.set(color);
        // The GLB references its base-color texture as emissive too, preserving
        // texture detail in the fill without an unsupported model shader hook.
        material.emissive.set(color, heroProfileMaterialFill);
        material.metalness = 0;
        material.roughness = heroProfileMaterialRoughness;
        return snapshot;
      },
    );
    const disconnect = params.frameBinding.connect((sceneFrame) => {
      const frame = resolveHeroProfileModelFrame(sceneFrame);
      ctx.object.visible = frame.visible;
      ctx.object.position.set(...frame.position);
      ctx.object.rotation.set(...frame.rotation);
      ctx.object.scale.set(...frame.scale);
    });
    return { disconnect, materials };
  },
  update(_ctx, _state, params) {
    params.frameBinding.refresh();
  },
  dispose(_ctx, state) {
    state.disconnect();
    for (const snapshot of state.materials) {
      const { material } = snapshot;
      material.color.set(snapshot.color);
      material.emissive.set(snapshot.emissive, snapshot.emissiveIntensity);
      material.metalness = snapshot.metalness;
      material.roughness = snapshot.roughness;
    }
  },
});
