import {
  act,
  cloneElement,
  type ReactElement,
  createElement,
  type PropsWithChildren,
} from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { heroTransitionConfig } from "../src/transition/transitionConfig";
import { heroChapterDefinitions } from "../src/chapters/definitions";

const progressStore = {
  source: {
    get: vi.fn<(key: string) => number>(() => 0),
    subscribe: vi.fn(() => () => undefined),
  },
  set: vi.fn(),
  reset: vi.fn(),
  clear: vi.fn(),
};
const capturedStates: ReturnType<typeof useHeroSiteState>[] = [];
const capturedScene: ReactElement<{
  frameBinding: object;
  journal?: { panels: readonly unknown[] };
}>[] = [];
const availabilityListeners = new Set<() => void>();
let available = true;
function CaptureSiteState() {
  capturedStates.push(useHeroSiteState());
  return null;
}
const refreshHeroScrollLayout = vi.hoisted(() => vi.fn());

vi.mock("@viselora/scroll-adapters/react", () => ({
  useScrollEffectProgressStore: () => progressStore,
  WebGLScrollRuntime: ({
    children,
    canvas,
    scene,
  }: PropsWithChildren<{
    canvas: { gl: { antialias: boolean }; dpr: [number, number] };
    scene: ReactElement<{ frameBinding: object }>;
  }>) => {
    capturedScene.push(scene);
    return createElement(
      "div",
      {
        "data-runtime": "hero-scroll",
        "data-antialias": canvas.gl.antialias,
        "data-max-device-pixel-ratio": canvas.dpr[1],
      },
      createElement(CaptureSiteState),
      children,
    );
  },
  WebGLScrollTimeline: ({
    children,
    id,
    start,
    end,
    pin,
    scrub,
    progressKey,
    className,
    as = "section",
  }: PropsWithChildren<{
    id: string;
    as?: string;
    className?: string;
    progressKey?: string;
    start?: string;
    end?: string;
    pin?: boolean;
    scrub?: boolean;
  }>) =>
    createElement(
      as,
      {
        className,
        "data-timeline": id,
        "data-progress-key": progressKey,
        "data-start": start,
        "data-end": end,
        "data-pin": pin,
        "data-scrub": scrub,
      },
      children,
    ),
}));

vi.mock("../src/experience/smoothScroll", () => ({
  heroSmoothScroll: false,
  refreshHeroScrollLayout,
  restoreHeroReadingPosition: vi.fn(),
}));

vi.mock("@viselora/dom-webgl/react", () => ({
  useWebGLRuntime: () => ({
    subscribe: (listener: () => void) => {
      availabilityListeners.add(listener);
      return () => {
        availabilityListeners.delete(listener);
      };
    },
    getDebugState: () => ({ ready: available }),
  }),
  WebGLTarget: ({ id, children }: { id: string; children: ReactElement }) =>
    cloneElement(children as ReactElement<{ "data-target"?: string }>, {
      "data-target": id,
    }),
}));

import { HeroExperience as HeroExperienceContent } from "../src/experience/HeroExperience";
import {
  HeroSiteStateProvider,
  useHeroSiteState,
} from "../src/experience/HeroSiteState";

function HeroExperience(props: Parameters<typeof HeroExperienceContent>[0]) {
  return createElement(
    HeroSiteStateProvider,
    null,
    createElement(HeroExperienceContent, props),
  );
}

beforeEach(() => {
  capturedStates.length = 0;
  capturedScene.length = 0;
  available = true;
  vi.clearAllMocks();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: { getItem: vi.fn(() => null), setItem: vi.fn() },
  });
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

describe("HeroExperience", () => {
  test("keeps loaded journal targets and their text on both theme commits", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const entry = {
      date: "2026-09-08",
      tools: ["React"],
      event: "A complete daily event.",
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        schemaVersion: 2,
        sourceRevision: null,
        entries: [entry],
      }),
    } as Response);
    progressStore.source.get.mockImplementation((key) =>
      key === heroChapterDefinitions.signals.signals.entry ||
      key === heroChapterDefinitions.signals.signals.exit
        ? 1
        : 0,
    );
    try {
      await act(async () =>
        root.render(
          createElement(HeroExperience, {
            journal: {
              url: `/journal/snapshot-${"a".repeat(64)}.json`,
              sha256: "a".repeat(64),
              entryCount: 1,
              latestDate: entry.date,
              sourceRevision: null,
            },
          }),
        ),
      );
      const texts = [...host.querySelectorAll(".hero-journal-lane p")];
      expect(texts).toHaveLength(3);
      const theme = capturedStates.at(-1)?.theme;
      expect(theme).toBeDefined();
      for (const scheme of ["inverted", "initial"] as const) {
        act(() => theme?.commit(scheme));
        const nextTexts = [...host.querySelectorAll(".hero-journal-lane p")];
        texts.forEach((text, index) => expect(nextTexts[index]).toBe(text));
        expect(nextTexts[2].textContent).toBe(entry.event);
        expect(
          nextTexts.map((text) => text.getAttribute("data-target")),
        ).toEqual(texts.map((text) => text.getAttribute("data-target")));
      }
    } finally {
      act(() => root.unmount());
      fetchMock.mockRestore();
      progressStore.source.get.mockImplementation(() => 0);
    }
  });

  test("commits both themes without replacing the portal text targets", () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    try {
      act(() => root.render(createElement(HeroExperience)));
      const texts = [...host.querySelectorAll(".hero-portal-line")];
      expect(texts).toHaveLength(4);
      const theme = capturedStates.at(-1)?.theme;
      expect(theme).toBeDefined();
      for (const scheme of ["inverted", "initial"] as const) {
        act(() => theme?.commit(scheme));
        expect(host.querySelector("main")?.dataset.heroTheme).toBe(scheme);
        const nextTexts = [...host.querySelectorAll(".hero-portal-line")];
        texts.forEach((text, index) => expect(nextTexts[index]).toBe(text));
      }
    } finally {
      act(() => root.unmount());
    }
  });

  test("keeps the fixed profile bubble out of the axioms reader", () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    progressStore.source.get.mockImplementation((key) =>
      key === "hero.chapter-2.entry" ? 1 : 0,
    );
    try {
      act(() => root.render(createElement(HeroExperience)));
      expect(
        host.querySelector<HTMLElement>("[data-profile-speech-bubble]")?.style
          .visibility,
      ).toBe("hidden");
      expect(
        host.querySelector(".hero-axioms__semantic")?.textContent,
      ).toContain("一个理解人的入口，协调可演进的执行");
    } finally {
      act(() => root.unmount());
      progressStore.source.get.mockImplementation(() => 0);
    }
  });
  test("declares one scene with the profile model and chapter timelines", () => {
    const html = renderToStaticMarkup(createElement(HeroExperience));

    expect(capturedScene).toHaveLength(1);
    expect(html).toContain('data-runtime="hero-scroll"');
    expect(html).toContain('data-antialias="true"');
    expect(html).toContain('data-max-device-pixel-ratio="2"');
    expect(html.match(/data-timeline=/g)).toHaveLength(17);
    expect(html.match(/class="hero-chapter-cycle"/g)).toHaveLength(4);
    expect(html).toContain('class="hero-hub-runway hero-hub-runway--opening"');
    expect(html.match(/class="hero-portal-stage"/g)).toHaveLength(1);
    expect(html.match(/class="hero-portal-copy /g)).toHaveLength(2);
    expect(html).not.toContain("hero-transition-copy");
    expect(html).toContain('data-timeline="hero.chapter-1.content.timeline"');
    expect(html).toContain('data-progress-key="hero.chapter-1.content"');
    expect(html).toContain('data-start="top top"');
    expect(html).toContain('data-end="bottom top"');
    expect(html).toContain('data-timeline="hero.chapter-1.entry.timeline"');
    expect(html).toContain('data-progress-key="hero.chapter-1.entry"');
    expect(html).toContain('data-end="bottom top"');
    expect(html).toContain('data-timeline="hero.chapter-1.exit.timeline"');
    expect(html).toContain('data-progress-key="hero.chapter-1.exit"');
    expect(html).toContain('data-end="bottom bottom"');
    expect(html).toContain('data-start="top bottom"');
    expect(html).toContain('data-timeline="chapter-1-body-timeline"');
    expect(html).toContain('data-progress-key="hero.chapter-1.body"');
    expect(html).toContain('data-start="top top"');
    expect(html).toContain('data-timeline="hero.chapter-4.entry.timeline"');
    expect(html).toContain('data-progress-key="hero.chapter-4.entry"');
    expect(html).toContain('data-timeline="hero.chapter-4.exit.timeline"');
    expect(html).toContain('data-progress-key="hero.chapter-4.exit"');
    expect(html).toContain('data-timeline="hero.chapter-4.content.timeline"');
    expect(html).toContain('data-progress-key="hero.chapter-4.content"');
    expect(html).not.toContain("data-pin");
    expect(html).toContain('data-target="hero.portal.site.left.primary"');
    expect(html).toContain('data-target="hero.axioms.reader"');
    expect(html).toContain('data-target="hero.projects.room"');
    expect(html).toContain('data-hero-theme="initial"');
    expect(html).toContain('data-hero-locale="zh"');
    expect(html).toContain('data-dom-active="false"');
    expect(html).not.toContain("data-active-chapter");
    expect(html).toContain('id="chapter-1"');
    expect(html).toContain('id="chapter-2"');
    expect(html).toContain('id="chapter-3"');
    expect(html).toContain('id="chapter-4"');
    expect(html).toContain("为智能体重新思考软件");
    expect(html).toContain("与 AI 一起工作之后，我重新想过这些事。");
    expect(html).toContain("把想法，做成可以运行的东西。");
    expect(html).toContain("愿与同道者共研同进，或有所得，亦未可知");
    expect(html).not.toContain('class="hero-chapter__frame');
    expect(html).not.toContain("继续前往章节出口");
    expect(html).not.toContain('class="hero-final-hub"');
    expect(html).not.toContain('class="hero-final-links"');
    expect(html).toContain('data-progress-key="hero.journal.travel"');
    expect(html).not.toContain('id="hero-final-title"');
    expect(html).toContain('class="hero-chapter hero-chapter--profile"');
    expect(html).toContain('class="hero-chapter__body hero-profile"');
    expect(html.match(/data-profile-wrap-text=""/g)).toHaveLength(20);
    expect(html.match(/data-profile-wrap-side="left"/g)).toHaveLength(11);
    expect(html.match(/data-profile-wrap-side="right"/g)).toHaveLength(9);
    expect(html).toContain('data-profile-model-exclusion=""');
    expect(html).toContain('data-profile-speech-bubble=""');
    expect(html).toContain('data-profile-facing="front"');
    expect(html).toContain('data-profile-speech-phase="holding"');
    expect(html).toContain('data-profile-speech-surface=""');
    expect(html).toContain('data-profile-speech-tail=""');
    expect(html).toContain('data-profile-speech-message="front"');
    expect(html).toContain('data-profile-speech-message="side"');
    expect(html).toContain('data-profile-speech-message="back"');
    expect(html).toContain('data-profile-speech-character=""');
    expect(html).toContain('href="https://github.com/agenticnoob"');
    expect(html).toContain('href="https://blog.zzzxc.com"');
    expect(html).toContain('data-hero-locale-option="zh"');
    expect(html).toContain('data-hero-locale-option="en"');
    expect(html).not.toContain("Boo!");

    const host = document.createElement("div");
    host.innerHTML = html;
    expect(
      host.querySelector('[data-profile-speech-message="front"]')?.textContent,
    ).toBe("这是我的正面");
    expect(
      host.querySelector('[data-profile-speech-message="side"]')?.textContent,
    ).toBe("这是我的侧面");
    expect(
      host.querySelector('[data-profile-speech-message="back"]')?.textContent,
    ).toBe("这是我的背面");
    const contentTimeline = host.querySelector(
      '[data-timeline="hero.chapter-1.content.timeline"]',
    );
    expect(
      contentTimeline?.querySelector(".hero-chapter__entry-frame"),
    ).toBeNull();
    expect(
      contentTimeline?.querySelector(
        '[data-timeline="chapter-1-body-timeline"]',
      ),
    ).not.toBeNull();
    expect(
      contentTimeline?.querySelector(
        '[data-timeline="hero.chapter-1.exit.timeline"]',
      ),
    ).toBeNull();
    expect(
      host.querySelectorAll(
        ".hero-chapter__content-cycle > .hero-chapter__body",
      ),
    ).toHaveLength(4);
    expect(host.querySelectorAll(".hero-chapter__entry-frame")).toHaveLength(0);
    expect(host.querySelectorAll(".hero-chapter__exit-frame")).toHaveLength(0);
    expect(host.querySelectorAll(".hero-exit-sticky")).toHaveLength(0);
    for (const exitTimeline of host.querySelectorAll(
      '[data-timeline$=".exit.timeline"]',
    )) {
      expect(exitTimeline.childElementCount).toBe(0);
    }
  });

  test("keeps frame binding, scene stores and Canvas stable across semantic rerenders", () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    act(() => root.render(createElement(HeroExperience)));
    const first = capturedScene.at(-1)?.props.frameBinding;
    const state = capturedStates.at(-1);
    act(() => root.render(createElement(HeroExperience)));
    expect(capturedScene.at(-1)?.props.frameBinding).toBe(first);
    expect(capturedStates.at(-1)).toBe(state);
    expect(refreshHeroScrollLayout).toHaveBeenCalled();
    const renders = capturedScene.length;
    progressStore.set(heroTransitionConfig.signalKeys.coverage, 0.5);
    expect(capturedScene).toHaveLength(renders);
    act(() => root.unmount());
  });

  test("publishes renderer loss and recovery to the semantic fallback", () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    act(() => root.render(createElement(HeroExperience)));
    const room = capturedStates.at(-1)?.projectRoom;
    act(() => room?.publishFrame({ ready: true, active: true, settled: true }));
    act(() => {
      available = false;
      availabilityListeners.forEach((listener) => listener());
    });
    expect(host.querySelector("main")?.dataset.webglReady).toBe("false");
    expect(room?.getSnapshot().ready).toBe(false);
    act(() => {
      available = true;
      availabilityListeners.forEach((listener) => listener());
    });
    expect(host.querySelector("main")?.dataset.webglReady).toBe("true");
    act(() => root.unmount());
    expect(availabilityListeners.size).toBe(0);
  });

  test("offers a persisted theme button only in reading layout with stable scene stores", () => {
    const media = window.matchMedia;
    const query = vi
      .spyOn(window, "matchMedia")
      .mockImplementation((value) => ({
        ...media(value),
        matches: value.includes("pointer: coarse"),
      }));
    const host = document.createElement("div");
    const root = createRoot(host);
    try {
      act(() => root.render(createElement(HeroExperience)));
      const effects = capturedStates.at(-1);
      const button = host.querySelector<HTMLButtonElement>(
        ".hero-theme-control",
      );
      expect(button).not.toBeNull();
      expect(button?.getAttribute("aria-label")).toBe("反转配色");
      expect(
        host.querySelector(".hero-opening-copy__hint")?.textContent,
      ).not.toContain("长按");
      for (const scheme of ["inverted", "initial"] as const) {
        act(() => button?.click());
        expect(host.querySelector("main")?.dataset.heroTheme).toBe(scheme);
        expect(button?.getAttribute("aria-pressed")).toBe(
          String(scheme === "inverted"),
        );
        expect(window.localStorage.setItem).toHaveBeenLastCalledWith(
          "viselora.hero.theme.v1",
          scheme,
        );
        expect(capturedStates.at(-1)).toBe(effects);
      }
      act(() =>
        host
          .querySelector<HTMLButtonElement>('[data-hero-locale-option="en"]')
          ?.click(),
      );
      expect(button?.getAttribute("aria-label")).toBe("Invert colors");
      expect(
        host.querySelector(".hero-opening-copy__hint")?.textContent,
      ).toContain("theme button");
    } finally {
      act(() => root.unmount());
      query.mockRestore();
    }
    const desktopRoot = createRoot(host);
    act(() => desktopRoot.render(createElement(HeroExperience)));
    expect(host.querySelector(".hero-theme-control")).toBeNull();
    act(() => desktopRoot.unmount());
  });

  test("switches semantic content and persists locale without replacing scene stores", () => {
    const host = document.createElement("div");
    const root = createRoot(host);

    act(() => root.render(createElement(HeroExperience)));
    const initialEffects = capturedStates.at(-1);
    const initialPortalText = host.querySelector(
      '[data-target="hero.portal.site.right.primary"]',
    );
    const englishButton = host.querySelector<HTMLButtonElement>(
      '[data-hero-locale-option="en"]',
    );
    expect(englishButton).not.toBeNull();
    const refreshesBeforeLocaleChange =
      refreshHeroScrollLayout.mock.calls.length;

    act(() => englishButton?.click());

    expect(host.textContent).toContain("Rethinking software for agents");
    expect(
      host.querySelector('[data-target="hero.portal.site.right.primary"]'),
    ).not.toBe(initialPortalText);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "viselora.hero.locale.v1",
      "en",
    );
    expect(capturedStates.at(-1)).toBe(initialEffects);
    expect(refreshHeroScrollLayout.mock.calls.length).toBeGreaterThan(
      refreshesBeforeLocaleChange,
    );

    act(() => root.unmount());
  });
});
