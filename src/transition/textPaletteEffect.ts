import {
  defineWebGLEffect,
  type WebGLEffectMaterialLayerHandle,
  type WebGLEffectMaterialProgram,
} from "@viselora/dom-webgl";
import {
  readHeroTransitionSignals,
  type HeroTransitionSignalReader,
} from "./signals";
import { heroTransitionConfig, type HeroSchemeName } from "./transitionConfig";

export type HeroTextPaletteParams = {
  readonly kind: "hero.text.palette";
  readonly readOpacity?: (
    progress: HeroTransitionSignalReader,
    reducedMotion: boolean,
  ) => number;
};

type HeroTextPaletteState = {
  readonly layer: WebGLEffectMaterialLayerHandle;
  readonly preference: MediaQueryList;
  scheme?: HeroSchemeName;
  opacity?: number;
};

// Reuse the runtime's glyph alpha and geometry. Recoloring must not remount the
// DOM target, rerasterize its text, or reset a sibling motion effect's state.
export const heroTextPaletteProgram = {
  blend: "normal",
  uniforms: { heroTextColor: [1, 1, 1], heroTextOpacity: 1 },
  fragmentShader: `
    uniform sampler2D heroTextSource;
    uniform vec3 heroTextColor;
    uniform float heroTextOpacity;
    varying vec2 vUv;

    void main() {
      float alpha = texture2D(heroTextSource, vUv).a * heroTextOpacity;
      gl_FragColor = vec4(heroTextColor, alpha);
    }
  `,
} satisfies WebGLEffectMaterialProgram;

export const heroTextPaletteEffect = defineWebGLEffect<
  HeroTextPaletteParams,
  HeroTextPaletteState
>({
  kind: "hero.text.palette",
  source: "dom/text",
  schedule: "frame",
  setup(ctx) {
    if (!ctx.object.text)
      throw new Error("Hero text palette requires native text.");
    return {
      layer: ctx.object.text.material.createMaterialLayer({
        key: "hero.text.palette",
        mode: "replace-source",
        sourceTextureUniform: "heroTextSource",
        program: heroTextPaletteProgram,
      }),
      preference: window.matchMedia("(prefers-reduced-motion: reduce)"),
    };
  },
  update(ctx, state, params) {
    const { committedScheme } = readHeroTransitionSignals(ctx.progress);
    const opacity =
      params.readOpacity?.(ctx.progress, state.preference.matches) ?? 1;
    if (state.scheme === committedScheme && state.opacity === opacity) return;
    const token = heroTransitionConfig.schemes[committedScheme].foreground;
    const hex = Number.parseInt(
      heroTransitionConfig.colors[token].slice(1),
      16,
    );
    state.layer.setUniforms({
      heroTextColor: [
        ((hex >> 16) & 255) / 255,
        ((hex >> 8) & 255) / 255,
        (hex & 255) / 255,
      ],
      // Shader layers do not inherit native material opacity. Journal pairs
      // provide the same fade as their managed subtree; Portal uses glyph alpha.
      heroTextOpacity: opacity,
    });
    state.scheme = committedScheme;
    state.opacity = opacity;
  },
  dispose(_ctx, state) {
    state.layer.dispose();
  },
});

export const heroTextPaletteDeclaration = {
  kind: "hero.text.palette",
} as const;
