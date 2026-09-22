import { describe, expect, test } from "vitest";
import {
  getHeroChapterContent,
  projectCaseStudies,
} from "../src/chapters/content";
import { createProjectCatalog } from "../src/projects/catalog";

const generated = {
  id: 123,
  slug: "gh-123",
  repository: "agenticnoob/new-project",
  url: "https://github.com/agenticnoob/new-project",
  sourceCommit: "a".repeat(40),
  readmeSha: "b".repeat(40),
  sourceDigest: "c".repeat(64),
  updatedAt: "2026-09-21T00:00:00Z",
  topics: ["portfolio"],
  language: "TypeScript",
  content: {
    zh: {
      title: "新项目",
      summary: "来自 README 的简介。",
      sections: [
        { id: "overview", title: "项目介绍", paragraphs: ["已有功能。"] },
      ],
    },
    en: {
      title: "New project",
      summary: "A README summary.",
      sections: [
        {
          id: "overview",
          title: "Overview",
          paragraphs: ["Existing functionality."],
        },
      ],
    },
  },
};

describe("static project catalog", () => {
  test("derives curated room positions from chapter content in either locale", () => {
    const catalog = createProjectCatalog([generated]);
    for (const locale of ["zh", "en"] as const) {
      const sections = getHeroChapterContent("builds", locale).body.sections;
      for (const slug of Object.keys(projectCaseStudies)) {
        const entry = catalog.getEntry(slug)!;
        expect(entry.featured).toBe(true);
        expect(entry.roomIndex).toBeDefined();
        expect(sections[entry.roomIndex!].showcase?.href).toBe(entry.href);
      }
    }
    expect(catalog.getEntry("constructor")).toBeUndefined();
    expect(catalog.getEntry("unknown")).toBeUndefined();
  });

  test("keeps generated projects outside the room regardless of their slug prefix", () => {
    const catalog = createProjectCatalog([
      { ...generated, slug: "new-project" },
    ]);
    expect(catalog.getEntry("new-project")).toMatchObject({
      href: "/projects/new-project",
      featured: false,
      roomIndex: undefined,
    });
  });

  test("adds generated projects without replacing the four editorial cases", () => {
    const catalog = createProjectCatalog([generated]);
    expect(catalog.entries.map((entry) => entry.slug)).toEqual([
      "gh-123",
      ...Object.keys(projectCaseStudies),
    ]);
    expect(catalog.getCase("gh-123", "zh")?.sections).toEqual(
      generated.content.zh.sections,
    );
    expect(catalog.getCase("gh-123", "en")?.introduction).toBe(
      generated.content.en.summary,
    );
    expect(catalog.getCase("gh-123", "en")?.links[0].href).toBe(generated.url);
    expect(catalog.getCase("syringe-meter", "zh")).toBe(
      projectCaseStudies["syringe-meter"].zh,
    );
    expect(catalog.getCase("constructor", "zh")).toBeUndefined();
    expect(catalog.getCase("unknown", "zh")).toBeUndefined();
  });

  test("deduplicates a curated repository by its canonical URL", () => {
    const catalog = createProjectCatalog([
      { ...generated, url: "https://github.com/agenticnoob/syringe-meter" },
    ]);
    expect(catalog.entries).toHaveLength(4);
    expect(catalog.getCase("gh-123", "zh")).toBeUndefined();
  });
});
