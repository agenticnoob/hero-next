import type { Metadata } from "next";
import { localizeAxiomsArticles, heroAxiomsArticles } from "../axioms/content";
import { getHeroChapterContent, heroSiteContent } from "../chapters/content";
import { journalReadingPageSize } from "../journal/config";
import type { JournalSnapshot } from "../journal/model";
import { heroLocales, type HeroLocale } from "../preferences/locale";
import { projectCatalog } from "../projects/catalog";
import { heroSiteUrl } from "../shared/site";
import { axmorfBrand } from "../shared/brand";

export const agentCopy = {
  zh: {
    title: "面向 Agent 的内容入口",
    intro: "个人介绍、项目与公开记录。沿目录阅读，或获取对应的 Markdown 正文。",
    home: "返回网站",
    navigation: "内容目录",
    profile: "关于我",
    projects: "项目",
    axioms: "理念文章",
    signals: "公开渠道",
    journal: "近期日志",
    archive: "按月阅读日志",
    markdown: "Markdown 正文",
    readCase: "查看项目案例",
    source: "网站原文",
    tools: "工具",
    journalLanguage: "日志保留原始中文，所有工具与事件正文均完整呈现。",
  },
  en: {
    title: "An entry point for agents",
    intro:
      "Profile, projects and public notes. Browse the directory or read the corresponding Markdown document.",
    home: "Back to the website",
    navigation: "Contents",
    profile: "About me",
    projects: "Projects",
    axioms: "Axioms",
    signals: "Public channels",
    journal: "Recent journal",
    archive: "Journal by month",
    markdown: "Read Markdown",
    readCase: "Read case study",
    source: "Website source",
    tools: "Tools",
    journalLanguage:
      "Journal entries remain in their original Chinese, including every tool and the complete event text.",
  },
} as const;

export function readAgentLocale(value: string): HeroLocale | undefined {
  return heroLocales.find((locale) => locale === value);
}

export function agentMarkdownPath(locale: HeroLocale, document = "index.md") {
  return `/agent/${locale}/${document}`;
}

export function getAgentJournalMonths(snapshot: JournalSnapshot): string[] {
  return [...new Set(snapshot.entries.map(({ date }) => date.slice(0, 7)))];
}

export function getAgentContent(locale: HeroLocale, snapshot: JournalSnapshot) {
  return {
    site: heroSiteContent[locale],
    profile: getHeroChapterContent("self", locale).body,
    axioms: localizeAxiomsArticles(heroAxiomsArticles, locale),
    projects: projectCatalog.entries,
    signals: getHeroChapterContent("signals", locale).body,
    recentEntries: snapshot.entries.slice(0, journalReadingPageSize),
    journalMonths: getAgentJournalMonths(snapshot),
  };
}

export function getAgentMetadata(locale: HeroLocale): Metadata {
  const copy = agentCopy[locale];
  return {
    title: `${copy.title} | AXMORF — ${axmorfBrand.tagline}`,
    description: `AXMORF — ${copy.intro} ${axmorfBrand.tagline}`,
    alternates: {
      canonical: locale === "zh" ? "/agent" : "/agent/en",
      languages: { "zh-CN": "/agent", en: "/agent/en" },
      types: { "text/markdown": heroSiteUrl(agentMarkdownPath(locale)) },
    },
  };
}
