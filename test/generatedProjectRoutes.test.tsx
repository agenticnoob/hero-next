import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { HeroSiteStateProvider } from "../src/experience/HeroSiteState";
import { ProjectDirectory } from "../src/projects/ProjectDirectory";
import Page, { generateMetadata } from "../app/projects/[slug]/page";
import ExhibitionPage, {
  generateStaticParams,
} from "../app/@project/(.)projects/[slug]/page";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("../data/projects.json", () => ({
  default: {
    version: 1,
    projects: [
      {
        id: 42,
        slug: "gh-42",
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
            summary: "有证据的项目介绍。",
            sections: [
              {
                id: "problem",
                title: "问题",
                paragraphs: ["来自 README 的实际内容。"],
              },
            ],
          },
          en: {
            title: "New project",
            summary: "An evidenced description.",
            sections: [
              {
                id: "problem",
                title: "Problem",
                paragraphs: ["Actual README content."],
              },
            ],
          },
        },
      },
    ],
  },
}));

describe("generated project integration", () => {
  test("includes the new case in both routes and metadata", async () => {
    const params = Promise.resolve({ slug: "gh-42" });
    const page = await Page({ params });
    expect(page.props.project).toBe("gh-42");
    expect((await ExhibitionPage({ params })).props.project).toBe("gh-42");
    expect(generateStaticParams()).toContainEqual({ slug: "gh-42" });
    expect((await generateMetadata({ params })).alternates?.canonical).toBe(
      "/projects/gh-42",
    );
    const html = renderToStaticMarkup(
      <HeroSiteStateProvider>{page}</HeroSiteStateProvider>,
    );
    const host = document.createElement("div");
    host.innerHTML = html;
    expect(host.textContent).toContain("来自 README 的实际内容。");
    expect(
      host.querySelector(".project-case__bar a")?.getAttribute("href"),
    ).toBe("/projects");
    expect(host.querySelector(".project-case__pipeline")).toBeNull();
    expect(host.querySelector("video, canvas, img")).toBeNull();
  });

  test("exposes the fifth project and preserves all four curated destinations", () => {
    const host = document.createElement("div");
    host.innerHTML = renderToStaticMarkup(
      <HeroSiteStateProvider>
        <ProjectDirectory />
      </HeroSiteStateProvider>,
    );
    const links = [
      ...host.querySelectorAll<HTMLAnchorElement>(".project-directory__link"),
    ];
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/projects/gh-42",
      "/projects/axmorf-studio",
      "/projects/viselora",
      "/projects/syringe-meter",
      "/projects/vibe-journal-pipeline",
    ]);
    expect(host.querySelector(".project-directory__count")?.textContent).toBe(
      "05",
    );
  });
});
