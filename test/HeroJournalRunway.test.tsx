import {
  act,
  createElement,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { HeroJournalRunway } from "../src/journal/HeroJournal";
import type { HeroJournalState } from "../src/journal/useJournal";

vi.mock("@viselora/scroll-adapters/react", () => ({
  WebGLScrollTimeline: ({
    children,
  }: PropsWithChildren<HTMLAttributes<HTMLElement>>) =>
    createElement("section", null, children),
}));

beforeEach(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterEach(() => vi.unstubAllGlobals());

describe("journal interface language", () => {
  test.each([
    {
      locale: "zh",
      title: "每日 Timeline",
      tools: "今天用了什么",
      error: "日志暂时未能载入。",
      loading: "正在载入日志…",
      empty: "暂无开发日志。",
      retry: "重新载入",
    },
    {
      locale: "en",
      title: "Daily timeline",
      tools: "Tools used today",
      error: "The journal could not be loaded.",
      loading: "Loading journal…",
      empty: "No development journal yet.",
      retry: "Reload",
    },
  ] as const)(
    "localizes $locale controls while preserving the original Timeline event",
    async (copy) => {
      const host = document.createElement("div");
      const root = createRoot(host);
      const retry = vi.fn();
      const journal: HeroJournalState = {
        entries: [],
        panels: [],
        error: undefined,
        retry,
        available: false,
        viewport: { width: 1440, height: 900 },
      };
      const render = (overrides: Partial<HeroJournalState>) =>
        act(() =>
          root.render(
            createElement(HeroJournalRunway, {
              locale: copy.locale,
              journal: { ...journal, ...overrides },
            }),
          ),
        );
      try {
        await render({});
        expect(host.querySelector("h2")?.textContent).toBe(copy.title);
        expect(host.querySelector('[role="status"] p')?.textContent).toBe(
          copy.empty,
        );
        await render({ available: true });
        expect(host.querySelector('[role="status"] p')?.textContent).toBe(
          copy.loading,
        );
        await render({ available: true, error: "HTTP 503" });
        expect(host.querySelector('[role="status"] p')?.textContent).toBe(
          copy.error,
        );
        const button = host.querySelector("button");
        expect(button?.textContent).toBe(copy.retry);
        await act(() => button?.click());
        expect(retry).toHaveBeenCalledOnce();
        const event = "实现 Timeline，保留原始中文。";
        await render({
          entries: [{ date: "2026-09-08", tools: ["React"], event }],
        });
        expect(host.querySelector("h4")?.textContent).toBe(copy.tools);
        expect(host.querySelector('article p[lang="zh-CN"]')?.textContent).toBe(
          event,
        );
        expect(host.querySelector('[role="status"]')).toBeNull();
      } finally {
        await act(() => root.unmount());
      }
    },
  );
});
