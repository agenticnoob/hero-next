import { heroAxiomsArticles } from "../axioms/content";
import { heroChapterDefinitions } from "../chapters/definitions";
import type { HeroProjectCaseStudy } from "../chapters/contentModel";
import type { JournalEntry, JournalSnapshot } from "../journal/model";
import { heroLocales, type HeroLocale } from "../preferences/locale";
import { projectCatalog } from "../projects/catalog";
import { heroSiteUrl } from "../shared/site";
import { axmorfBrand } from "../shared/brand";
import { axiomStatusLabel } from "../axioms/status";
import {
  agentCopy,
  agentMarkdownPath,
  getAgentContent,
  getAgentJournalMonths,
} from "./content";

// Content is plain text. Escape Markdown syntax instead of interpreting it as markup.
function text(value: string): string {
  return value
    .replace(/[\\`*_\[\]<>]/g, "\\$&")
    .replace(/^([#>+-]|\d+\.)/gm, "\\$1");
}

function link(label: string, href: string): string {
  return `[${text(label)}](${heroSiteUrl(href)})`;
}

function documentText(blocks: readonly string[]): string {
  return `${blocks.filter(Boolean).join("\n\n")}\n`;
}

function journalEntry(
  entry: JournalEntry,
  locale: HeroLocale,
  heading: "##" | "###" = "##",
): string {
  return documentText([
    `${heading} ${entry.date}`,
    entry.tools.length
      ? `${agentCopy[locale].tools}: ${entry.tools.map(text).join(" · ")}`
      : "",
    text(entry.event),
  ]).trimEnd();
}

function overview(locale: HeroLocale, snapshot: JournalSnapshot): string {
  const content = getAgentContent(locale, snapshot);
  const copy = agentCopy[locale];
  return documentText([
    `# AXMORF — ${text(content.site.intro.title)}`,
    axmorfBrand.tagline,
    locale === "zh" ? axmorfBrand.taglineZh : "",
    text(content.site.intro.summary),
    link(copy.source, "/"),
    `## ${copy.profile}`,
    text(content.profile.title),
    text(content.profile.intro),
    ...content.profile.sections.map((section) =>
      documentText([
        `### ${text(section.title)}`,
        text(section.body),
        section.link ? link(section.link.label, section.link.href) : "",
      ]).trimEnd(),
    ),
    content.profile.closing ? text(content.profile.closing) : "",
    `## ${copy.projects}`,
    ...content.projects.map((entry) =>
      documentText([
        `### ${link(entry.title[locale], agentMarkdownPath(locale, `projects/${entry.slug}.md`))}`,
        text(entry.summary[locale]),
        link(copy.readCase, entry.href),
      ]).trimEnd(),
    ),
    `## ${copy.axioms}`,
    content.axioms
      .map(
        (article) =>
          `- ${link(article.title, agentMarkdownPath(locale, `axioms/${article.id}.md`))}`,
      )
      .join("\n"),
    text(axmorfBrand.tagline),
    locale === "zh" ? text(axmorfBrand.taglineZh) : "",
    `## ${copy.signals}`,
    text(content.signals.intro),
    ...content.signals.sections.map((section) =>
      documentText([
        `### ${text(section.title)}`,
        text(section.body),
        section.directory
          ? text(`${section.directory.name} · ${section.directory.detail}`)
          : "",
        section.link ? link(section.link.label, section.link.href) : "",
      ]).trimEnd(),
    ),
    content.signals.closing ? text(content.signals.closing) : "",
    `## ${copy.journal}`,
    copy.journalLanguage,
    ...content.recentEntries.map((entry) => journalEntry(entry, locale, "###")),
    `## ${copy.archive}`,
    content.journalMonths
      .map(
        (month) =>
          `- ${link(month, agentMarkdownPath(locale, `journal/${month}.md`))}`,
      )
      .join("\n"),
  ]);
}

function projectDocument(
  locale: HeroLocale,
  slug: string,
  copy: HeroProjectCaseStudy,
): string {
  const ui = agentCopy[locale];
  return documentText([
    `# ${text(copy.title)}`,
    text(copy.subtitle),
    text(copy.introduction),
    link(ui.source, projectCatalog.getEntry(slug)!.href),
    ...copy.sections.map((section) =>
      documentText([
        `## ${text(section.title)}`,
        ...section.paragraphs.map(text),
        (section.points ?? []).map((point) => `- ${text(point)}`).join("\n"),
      ]).trimEnd(),
    ),
    copy.pipeline.length ? `## ${text(copy.pipelineTitle)}` : "",
    ...copy.pipeline.map((step) =>
      documentText([`### ${text(step.title)}`, text(step.detail)]).trimEnd(),
    ),
    `## ${text(copy.linksTitle)}`,
    copy.links.map((item) => `- ${link(item.label, item.href)}`).join("\n"),
    link(ui.navigation, agentMarkdownPath(locale)),
  ]);
}

export function renderAgentDocument(
  locale: HeroLocale,
  document: readonly string[],
  snapshot: JournalSnapshot,
): string | undefined {
  if (document.length === 1 && document[0] === "index.md")
    return overview(locale, snapshot);
  if (document.length !== 2 || !document[1].endsWith(".md")) return;
  const [kind, filename] = document;
  const id = filename.slice(0, -3);
  if (kind === "projects") {
    const copy = projectCatalog.getCase(id, locale);
    return copy ? projectDocument(locale, id, copy) : undefined;
  }
  if (kind === "axioms") {
    const article = heroAxiomsArticles.find((item) => item.id === id);
    if (!article) return;
    const copy = article.translations[locale];
    return documentText([
      `# ${text(copy.title)}`,
      axiomStatusLabel(article.status, locale),
      text(copy.body),
      text(axmorfBrand.tagline),
      locale === "zh" ? text(axmorfBrand.taglineZh) : "",
      link(
        agentCopy[locale].source,
        `/#chapter-${heroChapterDefinitions.axioms.ordinal}`,
      ),
      link(agentCopy[locale].navigation, agentMarkdownPath(locale)),
    ]);
  }
  if (kind === "journal" && getAgentJournalMonths(snapshot).includes(id)) {
    return documentText([
      `# ${id}`,
      agentCopy[locale].journalLanguage,
      ...snapshot.entries
        .filter((entry) => entry.date.startsWith(`${id}-`))
        .map((entry) => journalEntry(entry, locale)),
      link(agentCopy[locale].navigation, agentMarkdownPath(locale)),
    ]);
  }
}

export function getAgentDocumentParams(snapshot: JournalSnapshot) {
  const documents = [
    ["index.md"],
    ...projectCatalog.entries.map(({ slug }) => ["projects", `${slug}.md`]),
    ...heroAxiomsArticles.map(({ id }) => ["axioms", `${id}.md`]),
    ...getAgentJournalMonths(snapshot).map((month) => [
      "journal",
      `${month}.md`,
    ]),
  ];
  return heroLocales.flatMap((locale) =>
    documents.map((document) => ({ locale, document })),
  );
}

export function renderLlmsIndex(snapshot: JournalSnapshot): string {
  const content = getAgentContent("en", snapshot);
  return documentText([
    "# AXMORF",
    axmorfBrand.tagline,
    `> ${text(content.site.intro.summary)}`,
    "This personal website publishes a public profile, projects, axioms, public channels and a development journal. Chinese and English documents share the same content sources as the visual website. Read an overview first, then follow its links to individual Markdown documents. Journal entries retain their original Chinese.",
    "## Overview",
    `- ${link("中文内容索引", agentMarkdownPath("zh"))}: Profile, project summaries, article links, public channels and recent journal entries.`,
    `- ${link("English content index", agentMarkdownPath("en"))}: The same directory in English.`,
    "## Projects",
    ...content.projects.map(
      (entry) =>
        `- ${link(entry.title.en, agentMarkdownPath("en", `projects/${entry.slug}.md`))}: ${text(entry.summary.en)}`,
    ),
    "## Axioms",
    ...content.axioms.map(
      (article) =>
        `- ${link(article.title, agentMarkdownPath("en", `axioms/${article.id}.md`))}`,
    ),
    "## Journal",
    ...content.journalMonths.map(
      (month) =>
        `- ${link(month, agentMarkdownPath("zh", `journal/${month}.md`))}: Complete public entries for this month.`,
    ),
    "## Optional",
    `- ${link("HTML directory", "/agent")}: Readable without JavaScript, with links to both languages.`,
    `- ${link("Visual website", "/")}: Interactive presentation of the same public content.`,
  ]);
}
