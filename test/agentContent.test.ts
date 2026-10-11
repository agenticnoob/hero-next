import { describe, expect, test } from "vitest";
import { heroAxiomsArticles } from "../src/axioms/content";
import { getHeroChapterContent } from "../src/chapters/content";
import type { JournalSnapshot } from "../src/journal/model";
import { projectCatalog } from "../src/projects/catalog";
import {
  getAgentDocumentParams,
  renderAgentDocument,
  renderLlmsIndex,
} from "../src/agent/markdown";

const snapshot: JournalSnapshot = {
  schemaVersion: 2,
  sourceRevision: null,
  entries: Array.from({ length: 14 }, (_, index) => ({
    date: `2026-09-${String(14 - index).padStart(2, "0")}`,
    tools: ["TypeScript", "Next.js", "A & B", "[literal]"],
    event: `公开记录 ${14 - index}。\n保留完整内容与所有工具。`,
  })).concat({ date: "2026-08-31", tools: [], event: "上个月的公开记录。" }),
};

describe("agent public content exports", () => {
  test.each(["zh", "en"] as const)(
    "%s overview uses the current public profile, catalog and article registry",
    (locale) => {
      const markdown = renderAgentDocument(locale, ["index.md"], snapshot)!;
      const profile = getHeroChapterContent("self", locale).body;
      expect(markdown).toContain(profile.intro);
      for (const section of profile.sections) {
        expect(markdown).toContain(section.title);
        expect(markdown).toContain(section.body);
      }
      for (const entry of projectCatalog.entries) {
        expect(markdown).toContain(entry.title[locale]);
        expect(markdown).toContain(
          `https://zzzxc.com/agent/${locale}/projects/${entry.slug}.md`,
        );
      }
      for (const article of heroAxiomsArticles) {
        expect(markdown).toContain(article.translations[locale].title);
        expect(markdown).toContain(`/axioms/${article.id}.md`);
      }
      for (const section of getHeroChapterContent("signals", locale).body
        .sections) {
        expect(markdown).toContain(section.link!.href);
      }
      expect(markdown).toContain("2026-09-14");
      expect(markdown).toContain("2026-09-03");
      expect(markdown).not.toContain("## 2026-09-02");
      expect(markdown).toContain("journal/2026-08.md");
    },
  );

  test.each(["zh", "en"] as const)(
    "%s case exports keep every section, point, workflow step and public link",
    (locale) => {
      for (const entry of projectCatalog.entries) {
        const copy = projectCatalog.getCase(entry.slug, locale)!;
        const markdown = renderAgentDocument(
          locale,
          ["projects", `${entry.slug}.md`],
          snapshot,
        )!;
        expect(markdown).toContain(copy.introduction);
        for (const section of copy.sections) {
          expect(markdown).toContain(section.title);
          for (const paragraph of section.paragraphs)
            expect(markdown).toContain(paragraph);
          for (const point of section.points ?? [])
            expect(markdown).toContain(point);
        }
        for (const step of copy.pipeline)
          expect(markdown).toContain(step.detail);
        for (const link of copy.links) expect(markdown).toContain(link.href);
      }
    },
  );

  test("article files keep their stable IDs and exact localized body", () => {
    for (const locale of ["zh", "en"] as const) {
      for (const article of heroAxiomsArticles) {
        expect(
          renderAgentDocument(locale, ["axioms", `${article.id}.md`], snapshot),
        ).toContain(article.translations[locale].body);
      }
    }
  });

  test("monthly archives include older dates, complete events and all tools", () => {
    const markdown = renderAgentDocument(
      "en",
      ["journal", "2026-09.md"],
      snapshot,
    )!;
    expect(markdown).toContain("2026-09-02");
    expect(markdown).toContain("公开记录 1。");
    expect(markdown).toContain("保留完整内容与所有工具。");
    expect(markdown).toContain("TypeScript");
    expect(markdown).toContain("Next.js");
    expect(markdown).toContain("A & B");
    expect(markdown).toContain("\\[literal\\]");
    expect(markdown).not.toContain("2026-08-31");
    expect(markdown).toContain("Chinese");
  });

  test.each([
    ["projects", "constructor.md"],
    ["projects", "__proto__.md"],
    ["projects", "unknown.md"],
    ["projects", "viselora"],
    ["projects", "viselora.md", "extra"],
    ["axioms", "unknown.md"],
    ["journal", "2026-01.md"],
    ["journal", "../manifest.json"],
    ["unknown.md"],
  ])("does not resolve unregistered path %j", (...document) => {
    expect(renderAgentDocument("zh", document, snapshot)).toBeUndefined();
  });

  test("enumerates only resolvable documents with no duplicate routes", () => {
    const params = getAgentDocumentParams(snapshot);
    const paths = params.map(
      ({ locale, document }) => `${locale}/${document.join("/")}`,
    );
    expect(new Set(paths).size).toBe(paths.length);
    expect(params).toHaveLength(
      2 * (1 + projectCatalog.entries.length + heroAxiomsArticles.length + 2),
    );
    for (const { locale, document } of params)
      expect(renderAgentDocument(locale, document, snapshot)).toBeTruthy();
  });

  test("preserves literal Markdown punctuation and HTML-like public text", () => {
    const literal: JournalSnapshot = {
      ...snapshot,
      entries: [
        {
          date: "2026-09-14",
          tools: ["[literal]"],
          event:
            "# Heading\n[link](https://example.com)\n<script>alert(1)</script>\n**plain text**",
        },
      ],
    };
    const markdown = renderAgentDocument(
      "zh",
      ["journal", "2026-09.md"],
      literal,
    )!;
    expect(markdown).toContain("\\# Heading");
    expect(markdown).toContain("\\[link\\](https://example.com)");
    expect(markdown).toContain("\\<script\\>alert(1)\\</script\\>");
    expect(markdown).toContain("\\*\\*plain text\\*\\*");
  });

  test("llms.txt links to both language indexes and existing monthly archives", () => {
    const markdown = renderLlmsIndex(snapshot);
    expect(markdown).toMatch(/^# noobli\n/);
    expect(markdown).toContain("https://zzzxc.com/agent/zh/index.md");
    expect(markdown).toContain("https://zzzxc.com/agent/en/index.md");
    expect(markdown).toContain("journal/2026-09.md");
    expect(markdown).toContain("journal/2026-08.md");
    expect(markdown).not.toContain("sourceRevision");
    expect(markdown).not.toContain("/Users/");
  });
});
