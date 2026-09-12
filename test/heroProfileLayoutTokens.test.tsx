import { readFileSync } from "node:fs";
import {
  act,
  createElement,
  type CSSProperties,
  type PropsWithChildren,
} from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getHeroChapterContent } from "../src/chapters/content";
import { heroChapterDefinitions } from "../src/chapters/definitions";
import { resolveHeroChapterLayout } from "../src/chapters/layout";
import { HeroProfileChapterBody } from "../src/profile/HeroProfileChapterBody";
import {
  profileLayoutLengths,
  profileCSSProperties,
} from "../src/profile/layoutTokens";
import {
  lengthToCSS,
  resolveLength,
  type LengthToken,
} from "../src/shared/length";

vi.mock("@viselora/scroll-adapters/react", () => ({
  WebGLScrollTimeline: ({
    children,
    style,
  }: PropsWithChildren<{ style: CSSProperties }>) =>
    createElement("section", { style }, children),
}));
vi.mock("../src/profile/useProfileWrap", () => ({
  useHeroProfileWrap: () => ({
    flowRef: { current: null },
    modelExclusionRef: { current: null },
    speechBubbleExclusionRef: { current: null },
  }),
}));
vi.mock("../src/profile/HeroProfileSpeechBubble", () => ({
  HeroProfileSpeechBubble: () => null,
}));

beforeEach(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterEach(() => vi.unstubAllGlobals());

describe("profile DOM and canvas length declarations", () => {
  test("keeps CSS viewport/rem expressions responsive and evaluates the same clamp in pixels", () => {
    const length: LengthToken = {
      minRem: 9.5,
      viewportRatio: 0.38,
      maxRem: 13,
      addRem: 1,
      axis: "width",
    };
    expect(lengthToCSS(length)).toBe("clamp(9.5rem, calc(38vw + 1rem), 13rem)");
    expect(resolveLength(length, { width: 200, height: 844 }, 16)).toBe(152);
    expect(resolveLength(length, { width: 390, height: 844 }, 16)).toBeCloseTo(
      164.2,
    );
    expect(resolveLength(length, { width: 900, height: 844 }, 16)).toBe(208);
    expect(resolveLength(length, { width: 390, height: 844 }, 20)).toBe(190);
    const height: LengthToken = {
      minRem: 4.5,
      viewportRatio: 0.112,
      maxRem: 5.25,
      axis: "height",
    };
    expect(lengthToCSS(height)).toBe("clamp(4.5rem, 11.2svh, 5.25rem)");
    expect(resolveLength(height, { width: 1440, height: 650 }, 16)).toBeCloseTo(
      72.8,
    );
    const inset: LengthToken = {
      minPx: 24,
      viewportRatio: 0.06,
      axis: "width",
    };
    expect(lengthToCSS(inset)).toBe("max(24px, 6vw)");
    expect(resolveLength(inset, { width: 100, height: 800 }, 20)).toBe(24);
  });

  test.each([
    { viewport: { width: 1440, height: 900 }, mode: "desktop" as const },
    { viewport: { width: 390, height: 844 }, mode: "compact" as const },
  ])(
    "shares $mode geometry with the DOM custom properties at either root size",
    ({ viewport, mode }) => {
      const tokens = profileLayoutLengths[mode];
      for (const rootFontSize of [16, 20]) {
        const layout = resolveHeroChapterLayout(viewport, "self", rootFontSize);
        if (layout.kind !== "profile")
          throw new Error("Expected profile layout");
        const pixels = (name: keyof typeof tokens) =>
          resolveLength(tokens[name], viewport, rootFontSize);
        expect(layout.index.width).toBe(pixels("column-width"));
        expect(layout.heading.fontSize).toBe(pixels("heading-font-size"));
        expect(layout.intro.fontSize).toBe(pixels("intro-font-size"));
        expect(layout.speechBubble.rect.width).toBe(pixels("speech-width"));
        expect(layout.speechBubble.rect.height).toBe(pixels("speech-height"));
        expect(layout.speechBubble.fontSize).toBe(pixels("speech-font-size"));
        expect(layout.wrap.exclusions[0].rect.width).toBe(
          pixels("model-exclusion-width"),
        );
        for (const [name, token] of Object.entries(tokens)) {
          expect(profileCSSProperties[`--hero-profile-${mode}-${name}`]).toBe(
            lengthToCSS(token),
          );
        }
      }
    },
  );

  test("mounts stable CSS expressions and selects them through the existing CSS media query", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const stylesheet = document.createElement("style");
    stylesheet.textContent = readFileSync("app/globals.css", "utf8");
    document.head.append(stylesheet);
    try {
      await act(() =>
        root.render(
          createElement(HeroProfileChapterBody, {
            definition: heroChapterDefinitions.self,
            content: getHeroChapterContent("self", "zh"),
            locale: "zh",
          }),
        ),
      );
      const section = host.querySelector("section")!;
      for (const [property, value] of Object.entries(profileCSSProperties)) {
        expect(section.style.getPropertyValue(property)).toBe(String(value));
      }
      const rules = Array.from(stylesheet.sheet!.cssRules);
      const desktop = rules.find(
        (rule) =>
          rule instanceof CSSStyleRule && rule.selectorText === ".hero-profile",
      ) as CSSStyleRule;
      const compactMedia = rules.find(
        (rule) =>
          rule instanceof CSSMediaRule &&
          rule.conditionText === "(max-width: 700px)",
      ) as CSSMediaRule;
      const compact = Array.from(compactMedia.cssRules).find(
        (rule) =>
          rule instanceof CSSStyleRule && rule.selectorText === ".hero-profile",
      ) as CSSStyleRule;
      const outro = rules.find(
        (rule) =>
          rule instanceof CSSStyleRule &&
          rule.selectorText === ".hero-profile__outro",
      ) as CSSStyleRule;
      expect(outro.style.getPropertyValue("min-height")).toBe(
        "var(--hero-profile-outro-height)",
      );
      expect(outro.style.getPropertyValue("margin-top")).toBe("0");
      expect(outro.style.getPropertyValue("align-items")).toBe("end");
      expect(profileCSSProperties["--hero-profile-desktop-outro-height"]).toBe(
        "82svh",
      );
      expect(profileCSSProperties["--hero-profile-compact-outro-height"]).toBe(
        "84svh",
      );
      for (const [mode, rule] of [
        ["desktop", desktop],
        ["compact", compact],
      ] as const) {
        for (const name of Object.keys(profileLayoutLengths[mode])) {
          const variable = `var(--hero-profile-${mode}-${name})`;
          const expected =
            mode === "compact" && name === "page-inset"
              ? `max(${variable},env(safe-area-inset-right),env(safe-area-inset-left))`
              : variable;
          expect(
            rule.style
              .getPropertyValue(`--hero-profile-${name}`)
              .replace(/\s+/g, ""),
          ).toBe(expected);
        }
      }
    } finally {
      await act(() => root.unmount());
      stylesheet.remove();
    }
  });
});
