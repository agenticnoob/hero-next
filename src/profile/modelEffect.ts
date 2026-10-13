import { Mesh, MeshStandardMaterial, type Group, type Material } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";

import type { HeroTetrahedronFrameBinding } from "../tetrahedron/frameBinding";
import { heroTransitionConfig } from "../transition/transitionConfig";
import { resolveHeroProfileModelFrame } from "./frame";

export const heroProfileMaterialRoughness = 0.72;
export const heroProfileMaterialFill = 0.12;
export const heroProfileMaterialColor = heroTransitionConfig.colors.light;

export {
  resolveHeroProfileModelFrame,
  type HeroProfileModelFrame,
} from "./frame";

export function createHeroProfileModelResources(scene: Group) {
  const object = clone(scene);
  const materials = new Map<Material, Material>();
  object.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    const prepare = (source: Material) => {
      const existing = materials.get(source);
      if (existing) return existing;
      const material = source.clone();
      if (material instanceof MeshStandardMaterial) {
        material.color.set(heroProfileMaterialColor);
        // The GLB shares its color map with emissive; keep this texture detail.
        material.emissive.set(heroProfileMaterialColor);
        material.emissiveIntensity = heroProfileMaterialFill;
        material.metalness = 0;
        material.roughness = heroProfileMaterialRoughness;
      }
      materials.set(source, material);
      return material;
    };
    child.material = Array.isArray(child.material)
      ? child.material.map(prepare)
      : prepare(child.material);
  });
  return {
    object,
    dispose() {
      // Geometry and textures belong to useGLTF's shared loader cache.
      materials.forEach((material) => material.dispose());
    },
  };
}

export function connectHeroProfileModelFrame(
  root: Group,
  frameBinding: HeroTetrahedronFrameBinding,
): () => void {
  return frameBinding.connect((sceneFrame) => {
    const slot = sceneFrame.viewport.reading
      ? document.querySelector<HTMLElement>("[data-profile-reading-slot]")
      : null;
    const rect = slot?.getBoundingClientRect();
    const frame = resolveHeroProfileModelFrame({
      ...sceneFrame,
      ...(rect
        ? {
            readingSlot: {
              centerY: rect.top + rect.height / 2 - 16,
              height: rect.height - 40,
            },
          }
        : {}),
    });
    root.visible = frame.visible;
    root.position.set(...frame.position);
    root.rotation.set(...frame.rotation);
    root.scale.set(...frame.scale);
  });
}
