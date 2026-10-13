import type { MeshBasicMaterial } from "three";
import {
  readHeroTransitionSignals,
  type HeroTransitionSignalReader,
} from "./signals";
import { heroTransitionConfig } from "./transitionConfig";

// Textures contain white glyphs and their original alpha. A theme change only
// updates the native material, preserving texture, geometry, and motion state.
export function applyHeroTextPalette(
  material: MeshBasicMaterial,
  progress: HeroTransitionSignalReader,
  opacity = 1,
): void {
  const { committedScheme } = readHeroTransitionSignals(progress);
  const token = heroTransitionConfig.schemes[committedScheme].foreground;
  material.color.set(heroTransitionConfig.colors[token]);
  material.opacity = opacity;
}
