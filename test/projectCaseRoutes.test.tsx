import { describe, expect, test, vi } from "vitest";
import {
  projectCaseStudies,
  getHeroChapterContent,
} from "../src/chapters/content";
import Page, { generateMetadata, dynamic } from "../app/projects/[slug]/page";
import ExhibitionPage, {
  generateStaticParams,
} from "../app/@project/(.)projects/[slug]/page";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

describe("registered project routes", () => {
  test("exposes precisely the four room destinations in both languages", () => {
    const paths = Object.keys(projectCaseStudies).map(
      (slug) => `/projects/${slug}`,
    );
    expect(paths).toHaveLength(4);
    for (const locale of ["zh", "en"] as const) {
      expect(
        getHeroChapterContent("builds", locale).body.sections.map(
          (section) => section.showcase?.href,
        ),
      ).toEqual(paths);
    }
    expect(
      generateStaticParams().map(({ slug }) => `/projects/${slug}`),
    ).toEqual(paths);
    expect(dynamic).toBe("force-dynamic");
  });

  test.each(Object.entries(projectCaseStudies))(
    "resolves %s to the same case in full and intercepted routes",
    async (slug, copy) => {
      const props = { params: Promise.resolve({ slug }) };
      const page = await Page(props);
      const exhibition = await ExhibitionPage(props);
      expect(page.props.project).toBe(slug);
      expect(exhibition.props.project).toBe(slug);
      const metadata = await generateMetadata(props);
      expect(metadata.title).toContain(copy.zh.title);
      expect(metadata.alternates?.canonical).toBe(`/projects/${slug}`);
      expect(metadata.openGraph).toMatchObject({ type: "article" });
      if (slug !== "syringe-meter")
        expect(metadata.openGraph).not.toHaveProperty("images");
    },
  );

  test.each(["unknown-project", "constructor", "__proto__"])(
    "returns not found for %s instead of rendering a fallback case",
    async (slug) => {
      const props = { params: Promise.resolve({ slug }) };
      await expect(Page(props)).rejects.toThrow("NEXT_NOT_FOUND");
      await expect(ExhibitionPage(props)).rejects.toThrow("NEXT_NOT_FOUND");
      await expect(generateMetadata(props)).rejects.toThrow("NEXT_NOT_FOUND");
    },
  );
});
