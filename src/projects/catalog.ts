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
  readonly href: string;
  readonly featured: boolean;
  readonly roomIndex: number | undefined;
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
  const roomSections = getHeroChapterContent("builds", "zh").body.sections;
  const curatedUrls = new Set(
    roomSections.map((section) => section.link?.href.toLowerCase()),
  );
  const roomIndexes = new Map(
    roomSections.map((section, index) => [section.showcase?.href, index]),
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
      href: `/projects/${project.slug}`,
      featured: false,
      roomIndex: undefined,
      title: { zh: project.content.zh.title, en: project.content.en.title },
      summary: {
        zh: project.content.zh.summary,
        en: project.content.en.summary,
      },
    })),
    ...curated.map(([slug, content]) => ({
      slug,
      href: `/projects/${slug}`,
      featured: true,
      roomIndex: roomIndexes.get(`/projects/${slug}`),
      title: { zh: content.zh.title, en: content.en.title },
      summary: { zh: content.zh.introduction, en: content.en.introduction },
    })),
  ];
  return {
    entries,
    getEntry: (slug: string) => entries.find((entry) => entry.slug === slug),
    getCase: (slug: string, locale: HeroLocale) => cases.get(slug)?.[locale],
  };
}

export const projectCatalog = createProjectCatalog(snapshot.projects);
