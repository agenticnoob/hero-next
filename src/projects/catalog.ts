import snapshot from "../../data/projects.json";
import type { GeneratedProject } from "../../scripts/project-data.mjs";
import {
  getHeroChapterContent,
  projectCaseStudies,
  type HeroProjectSlug,
} from "../chapters/content";
import type { HeroProjectCaseStudy } from "../chapters/contentModel";
import type { HeroLocale } from "../preferences/locale";
import { projectDirectoryCopy } from "../chapters/uiContent";

export type ProjectCatalogEntry = {
  readonly slug: string;
  readonly featured: boolean;
  readonly title: Readonly<Record<HeroLocale, string>>;
  readonly summary: Readonly<Record<HeroLocale, string>>;
};

function generatedCase(
  project: GeneratedProject,
  locale: HeroLocale,
): HeroProjectCaseStudy {
  const content = project.content[locale];
  const ui = projectDirectoryCopy[locale];
  return {
    eyebrow: project.repository,
    title: content.title,
    subtitle: ui.generated,
    introduction: content.summary,
    backLabel: ui.backToDirectory,
    tocLabel: ui.toc,
    readLabel: ui.read,
    sections: content.sections,
    pipelineTitle: "",
    pipeline: [],
    linksTitle: ui.links,
    links: [{ href: project.url, label: ui.source }],
  };
}

export function createProjectCatalog(projects: readonly GeneratedProject[]) {
  const curated = Object.entries(projectCaseStudies) as [
    HeroProjectSlug,
    (typeof projectCaseStudies)[HeroProjectSlug],
  ][];
  const curatedUrls = new Set(
    getHeroChapterContent("builds", "zh").body.sections.map((section) =>
      section.link?.href.toLowerCase(),
    ),
  );
  const generated = projects
    .filter((project) => !curatedUrls.has(project.url.toLowerCase()))
    .sort((a, b) => b.id - a.id);
  const cases = new Map<
    string,
    Readonly<Record<HeroLocale, HeroProjectCaseStudy>>
  >(curated);
  for (const project of generated) {
    cases.set(project.slug, {
      zh: generatedCase(project, "zh"),
      en: generatedCase(project, "en"),
    });
  }
  const entries: readonly ProjectCatalogEntry[] = [
    ...generated.map((project) => ({
      slug: project.slug,
      featured: false,
      title: { zh: project.content.zh.title, en: project.content.en.title },
      summary: {
        zh: project.content.zh.summary,
        en: project.content.en.summary,
      },
    })),
    ...curated.map(([slug, content]) => ({
      slug,
      featured: true,
      title: { zh: content.zh.title, en: content.en.title },
      summary: { zh: content.zh.introduction, en: content.en.introduction },
    })),
  ];
  return {
    entries,
    getCase: (slug: string, locale: HeroLocale) => cases.get(slug)?.[locale],
  };
}

export const projectCatalog = createProjectCatalog(snapshot.projects);
