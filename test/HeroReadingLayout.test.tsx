import {
  act,
  createElement,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { HeroProfileChapterBody } from "../src/profile/HeroProfileChapterBody";
import { HeroAxiomsChapterBody } from "../src/axioms/HeroAxiomsReader";
import { HeroSignalsChapterBody } from "../src/signals/HeroSignalsChapterBody";
import { HeroJournalRunway } from "../src/journal/HeroJournal";
import { HeroChapterNavigation } from "../src/chapters/HeroChapterNavigation";
import {
  getHeroChapterContent,
  heroPublicLinks,
} from "../src/chapters/content";
import { getAxiomsContent } from "../src/axioms/content";
import { heroChapterDefinitions } from "../src/chapters/definitions";
import { resolveHeroChapterScrollState } from "../src/chapters/scrollState";
import { heroTransitionConfig } from "../src/transition/transitionConfig";

vi.mock("@viselora/scroll-adapters/react", () => ({
  WebGLScrollTimeline: ({
    children,
    className,
    style,
  }: PropsWithChildren<HTMLAttributes<HTMLElement>> &
    Record<string, unknown>) =>
    createElement("section", { className, style }, children),
}));

beforeEach(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterEach(() => vi.unstubAllGlobals());

describe("mobile reading experience", () => {
  test.each(["zh", "en"] as const)(
    "keeps %s profile in authored order without animated text exclusion",
    async (locale) => {
      const host = document.createElement("div");
      const root = createRoot(host);
      const content = getHeroChapterContent("self", locale);
      try {
        await act(() =>
          root.render(
            createElement(HeroProfileChapterBody, {
              definition: heroChapterDefinitions.self,
              content,
              locale,
              reading: true,
            }),
          ),
        );
        expect(host.querySelectorAll("[data-profile-wrap-token]")).toHaveLength(
          0,
        );
        expect(
          host.querySelectorAll("[data-profile-reading-slot]"),
        ).toHaveLength(1);
        expect(
          [...host.querySelectorAll("h3")].map(
            (element) => element.textContent,
          ),
        ).toEqual(content.body.sections.map((section) => section.title));
        for (const section of content.body.sections)
          expect(host.textContent).toContain(section.body);
      } finally {
        await act(() => root.unmount());
      }
    },
  );

  test.each(["zh", "en"] as const)(
    "provides real %s article anchors and complete readable text",
    async (locale) => {
      const host = document.createElement("div");
      const root = createRoot(host);
      const content = getAxiomsContent(locale);
      try {
        await act(() =>
          root.render(
            createElement(HeroAxiomsChapterBody, {
              definition: heroChapterDefinitions.axioms,
              content,
              locale,
              reading: true,
            }),
          ),
        );
        for (const link of host.querySelectorAll("nav a")) {
          const target = host.querySelector(link.getAttribute("href")!);
          expect(target).not.toBeNull();
          expect(target?.getAttribute("tabindex")).toBe("-1");
        }
        expect(host.querySelectorAll("nav a")).toHaveLength(
          content.body.sections.length,
        );
        for (const section of content.body.sections)
          expect(host.textContent).toContain(section.body);
        expect(
          host.querySelector<HTMLElement>(".hero-axioms")?.style.minHeight,
        ).toBe("");
      } finally {
        await act(() => root.unmount());
      }
    },
  );

  test("keeps six direct profile links separate from the three QR disclosures", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    try {
      await act(() =>
        root.render(
          createElement(HeroSignalsChapterBody, {
            definition: heroChapterDefinitions.signals,
            content: getHeroChapterContent("signals", "zh"),
            locale: "zh",
            reading: true,
          }),
        ),
      );
      expect(host.querySelectorAll("a")).toHaveLength(6);
      expect(
        host.querySelector(`a[href="${heroPublicLinks.leetcode}"]`),
      ).not.toBeNull();
      expect(host.querySelectorAll("details")).toHaveLength(3);
      expect(host.querySelector("a details, a summary, a img")).toBeNull();
      const disclosure = host.querySelector("details")!;
      expect(disclosure.open).toBe(false);
      await act(() => disclosure.querySelector("summary")!.click());
      expect(disclosure.open).toBe(true);
      expect(disclosure.querySelector("img")?.alt).toBeTruthy();
      await act(() => disclosure.querySelector("summary")!.click());
      expect(disclosure.open).toBe(false);
    } finally {
      await act(() => root.unmount());
    }
  });

  test("loads older dates in batches without dropping or duplicating a day's tools and event", async () => {
    const host = document.createElement("div");
    const root = createRoot(host);
    const entries = Array.from({ length: 29 }, (_, index) => ({
      date: `2026-08-${String(31 - index).padStart(2, "0")}`,
      tools: [`Tool ${index}`],
      event: `事件 ${index}`,
    }));
    const journal = {
      entries,
      panels: [],
      error: undefined,
      retry: vi.fn(),
      available: true,
      viewport: { width: 390, height: 844 },
    };
    try {
      await act(() =>
        root.render(
          createElement(HeroJournalRunway, {
            journal,
            locale: "zh",
            reading: true,
          }),
        ),
      );
      expect(host.querySelector("#hero-journal")).not.toBeNull();
      expect(host.querySelectorAll("article")).toHaveLength(12);
      expect(host.querySelector("article")?.textContent).toContain(
        entries[0].date,
      );
      const first = host.querySelector("article");
      await act(() => host.querySelector<HTMLButtonElement>("button")!.click());
      expect(host.querySelectorAll("article")).toHaveLength(24);
      expect(host.querySelector("article")).toBe(first);
      await act(() => host.querySelector<HTMLButtonElement>("button")!.click());
      expect(host.querySelectorAll("article")).toHaveLength(29);
      expect(host.querySelector("button")).toBeNull();
      const dates = [...host.querySelectorAll("article")].map((element) =>
        element.getAttribute("data-journal-entry"),
      );
      expect(dates).toEqual(entries.map((entry) => entry.date));
      [...host.querySelectorAll("article")].forEach((element, index) => {
        expect(element.textContent).toContain(entries[index].tools[0]);
        expect(element.textContent).toContain(entries[index].event);
      });
    } finally {
      await act(() => root.unmount());
    }
  });

  test("closes the chapter menu with Escape and restores its keyboard focus", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    try {
      await act(() =>
        root.render(createElement(HeroChapterNavigation, { locale: "en" })),
      );
      const menu = host.querySelector("details")!;
      await act(() => menu.querySelector("summary")!.click());
      expect(menu.open).toBe(true);
      expect(host.querySelectorAll("nav a")).toHaveLength(5);
      await act(() =>
        menu.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        ),
      );
      expect(menu.open).toBe(false);
      expect(document.activeElement).toBe(menu.querySelector("summary"));
    } finally {
      await act(() => root.unmount());
      host.remove();
    }
  });

  test("completes the DOM handoff despite subpixel native-anchor rounding", () => {
    const roundedEntry = 1 - 0.04 / (844 * 1.1);
    for (const id of ["self", "axioms", "builds", "signals"] as const) {
      expect(
        resolveHeroChapterScrollState(roundedEntry, 0, id).domContentActive,
      ).toBe(true);
      expect(
        resolveHeroChapterScrollState(1, 0.04 / (844 * 0.6), id)
          .domContentActive,
      ).toBe(true);
      expect(resolveHeroChapterScrollState(0.99, 0, id).domContentActive).toBe(
        false,
      );
    }
  });

  test("provides at least 4.5:1 contrast for ordinary text in either theme", () => {
    const luminance = (hex: string) => {
      const values = [1, 3, 5]
        .map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
    };
    const { light, dark } = heroTransitionConfig.colors;
    expect(
      (luminance(light) + 0.05) / (luminance(dark) + 0.05),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
