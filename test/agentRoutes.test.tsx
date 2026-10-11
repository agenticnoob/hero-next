// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Page, { metadata } from "../app/agent/page";
import LocalizedPage, {
  generateMetadata,
  generateStaticParams as generateLocales,
} from "../app/agent/[locale]/page";
import {
  GET,
  dynamic,
  dynamicParams,
  generateStaticParams,
} from "../app/agent/[locale]/[...document]/route";
import { GET as getLlmsIndex } from "../app/llms.txt/route";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { getAgentDocumentParams } from "../src/agent/markdown";
import type { JournalSnapshot } from "../src/journal/model";
import { readJournalSnapshot } from "../src/journal/server";
import { getHeroChapterContent } from "../src/chapters/content";
import { heroAxiomsArticles } from "../src/axioms/content";
import { projectCatalog } from "../src/projects/catalog";

vi.mock("../src/journal/server", () => ({ readJournalSnapshot: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const snapshot: JournalSnapshot = {
  schemaVersion: 2,
  sourceRevision: null,
  entries: [
    {
      date: "2026-09-08",
      tools: ["TypeScript", "Vitest"],
      event: "完整的公开日志。\n第二段。",
    },
    { date: "2026-08-31", tools: [], event: "历史日志。" },
  ],
};

beforeEach(() => {
  vi.mocked(readJournalSnapshot).mockReset().mockResolvedValue(snapshot);
});

describe("agent HTTP routes", () => {
  test("pre-renders every public Markdown document in both languages", async () => {
    expect(dynamic).toBe("force-static");
    expect(dynamicParams).toBe(false);
    expect(await generateStaticParams()).toEqual(
      getAgentDocumentParams(snapshot),
    );
    for (const params of getAgentDocumentParams(snapshot)) {
      const response = await GET(new Request("https://zzzxc.com"), {
        params: Promise.resolve(params),
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(
        "text/markdown; charset=utf-8",
      );
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("Link")).toContain(
        '</llms.txt>; rel="describedby"',
      );
      expect(await response.text()).toMatch(/^# /);
    }
  });

  test.each([
    { locale: "fr", document: ["index.md"] },
    { locale: "constructor", document: ["index.md"] },
    { locale: "zh", document: ["projects", "unknown.md"] },
    { locale: "zh", document: ["journal", "2026-01.md"] },
  ])("unknown content returns a plain 404: %j", async (params) => {
    const response = await GET(new Request("https://zzzxc.com"), {
      params: Promise.resolve(params),
    });
    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
    expect(await response.text()).toBe("Not found\n");
  });

  test("llms.txt advertises only readable, registered site documents", async () => {
    const response = await getLlmsIndex();
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
    const markdown = await response.text();
    const documents = new Set(
      getAgentDocumentParams(snapshot).map(
        ({ locale, document }) =>
          `https://zzzxc.com/agent/${locale}/${document.join("/")}`,
      ),
    );
    const links = [
      ...markdown.matchAll(/\]\((https:\/\/zzzxc\.com[^)]+)\)/g),
    ].map((match) => match[1]);
    expect(links.length).toBeGreaterThan(projectCatalog.entries.length);
    for (const href of links.filter((href) => href.endsWith(".md")))
      expect(documents.has(href)).toBe(true);
  });

  test("robots and sitemap use the production origin and public HTML pages", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://zzzxc.com/sitemap.xml",
    });
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual([
      "https://zzzxc.com/",
      "https://zzzxc.com/projects",
      "https://zzzxc.com/agent",
      "https://zzzxc.com/agent/en",
      ...projectCatalog.entries.map(({ href }) => `https://zzzxc.com${href}`),
    ]);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("agent server-rendered directory", () => {
  test.each(["zh", "en"] as const)(
    "%s contains complete semantic content without client state",
    async (locale) => {
      const element =
        locale === "zh"
          ? await Page()
          : await LocalizedPage({ params: Promise.resolve({ locale }) });
      const html = renderToStaticMarkup(element);
      expect(html).toContain(`lang="${locale === "zh" ? "zh-CN" : "en"}"`);
      expect(html).toContain(
        renderToStaticMarkup(
          <p>{getHeroChapterContent("self", locale).body.intro}</p>,
        ),
      );
      for (const article of heroAxiomsArticles) {
        expect(html).toContain(
          renderToStaticMarkup(<p>{article.translations[locale].body}</p>),
        );
        expect(html).toContain(`/agent/${locale}/axioms/${article.id}.md`);
      }
      for (const { slug } of projectCatalog.entries)
        expect(html).toContain(`/agent/${locale}/projects/${slug}.md`);
      expect(html).toContain("2026-09-08");
      expect(html).toContain("完整的公开日志。");
      expect(html).toContain(`/agent/${locale}/journal/2026-08.md`);
      expect(html).toContain('href="/llms.txt"');
      expect(html).not.toMatch(/<canvas|<script|<button/);
    },
  );

  test("language URLs have matching canonicals and Markdown alternates", async () => {
    expect(generateLocales()).toEqual([{ locale: "zh" }, { locale: "en" }]);
    expect(metadata.alternates?.canonical).toBe("/agent");
    const english = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });
    expect(english.alternates).toEqual({
      canonical: "/agent/en",
      languages: { "zh-CN": "/agent", en: "/agent/en" },
      types: { "text/markdown": "https://zzzxc.com/agent/en/index.md" },
    });
  });

  test("unregistered languages do not silently fall back to Chinese", async () => {
    const props = { params: Promise.resolve({ locale: "fr" }) };
    await expect(LocalizedPage(props)).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(generateMetadata(props)).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
