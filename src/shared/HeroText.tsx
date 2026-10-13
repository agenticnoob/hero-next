import { useFrame, type RootState } from "@react-three/fiber";
import { createDOMTextTexture, type DOMTargetState } from "@viselora/dom-webgl";
import { useDOMTarget, useWebGLRuntime } from "@viselora/dom-webgl/react";
import { useEffect, useRef } from "react";
import type { Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import { applyHeroTextPalette } from "../transition/textPaletteEffect";

type HeroTextMesh = Mesh<PlaneGeometry, MeshBasicMaterial>;
export type HeroTextFrame = (
  mesh: HeroTextMesh,
  target: DOMTargetState,
  state: RootState,
  delta: number,
) => void;

type CapturedText = {
  target: DOMTargetState;
  revision: number;
  layoutKey: string;
  image: ReturnType<typeof createDOMTextTexture>;
};

export function HeroText({
  id,
  onFrame,
}: {
  readonly id: string;
  readonly onFrame: HeroTextFrame;
}) {
  const runtime = useWebGLRuntime();
  const target = useDOMTarget(id);
  const mesh = useRef<HeroTextMesh>(null);
  const captured = useRef<CapturedText | undefined>(undefined);
  useEffect(() => {
    const fonts = target?.element.ownerDocument.fonts;
    const invalidateFonts = () => {
      if (captured.current) captured.current.layoutKey = "";
      runtime.invalidate();
    };
    fonts?.addEventListener("loadingdone", invalidateFonts);
    return () => {
      fonts?.removeEventListener("loadingdone", invalidateFonts);
      const previous = captured.current;
      if (!previous || previous.target !== target) return;
      runtime.setTargetReady(id, false, previous.target);
      previous.image.dispose();
      captured.current = undefined;
    };
  }, [id, runtime, target]);

  useFrame((state, delta) => {
    const object = mesh.current;
    if (!object) return;
    if (!target || target.rect.width <= 0 || target.rect.height <= 0) {
      object.visible = false;
      return;
    }
    let previous = captured.current;
    if (
      !previous ||
      previous.target !== target ||
      previous.revision !== target.revision ||
      !previous.layoutKey
    ) {
      const layoutKey = readHeroTextLayoutKey(target);
      if (
        !previous ||
        previous.target !== target ||
        previous.layoutKey !== layoutKey
      ) {
        const image = createDOMTextTexture(target.element, {
          devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        });
        const canvas = image.texture.image as HTMLCanvasElement;
        const context = canvas.getContext("2d");
        if (!context) {
          image.dispose();
          throw new Error("Hero text requires a 2D canvas context.");
        }
        // Keep only glyph alpha; committed theme color belongs to the material.
        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalCompositeOperation = "source-in";
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.restore();
        image.texture.needsUpdate = true;
        object.material.map = image.texture;
        object.material.needsUpdate = true;
        if (previous && previous.target !== target) {
          runtime.setTargetReady(previous.target.id, false, previous.target);
        }
        previous?.image.dispose();
        previous = { target, revision: target.revision, layoutKey, image };
        captured.current = previous;
        runtime.setTargetReady(id, true, target);
      } else {
        previous.revision = target.revision;
      }
    }
    applyHeroTextPalette(object.material, runtime.progress);
    onFrame(object, target, state, delta);
  });
  return (
    <mesh ref={mesh} name={id} visible={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

// Runtime revisions also include inherited theme changes. Only content or layout
// changes need a fresh bitmap; typography is inspected outside the steady frame path.
export function readHeroTextLayoutKey(target: DOMTargetState): string {
  const { element, rect } = target;
  const style = element.ownerDocument.defaultView!.getComputedStyle(element);
  return JSON.stringify([
    element.textContent,
    rect.width,
    rect.height,
    Math.min(element.ownerDocument.defaultView!.devicePixelRatio, 2),
    style.font,
    style.fontFamily,
    style.fontSize,
    style.fontWeight,
    style.fontStyle,
    style.fontVariant,
    style.lineHeight,
    style.letterSpacing,
    style.wordSpacing,
    style.whiteSpace,
    style.textAlign,
    style.alignContent,
    style.placeContent,
    style.paddingLeft,
    style.paddingRight,
    style.paddingTop,
    style.paddingBottom,
  ]);
}
