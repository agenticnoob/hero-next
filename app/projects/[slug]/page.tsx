import type { Metadata } from "next";
import { axmorfBrand } from "../../../src/shared/brand";
import { ProjectShowcase } from "../../../src/projects/ProjectShowcase";
import { projectCatalog } from "../../../src/projects/catalog";
import {
  readProjectSlug,
  type ProjectPageProps,
} from "../../../src/projects/caseRoute";

const syringeMeterMetadata: Metadata = {
  title: `SyringeMeter — 从画面到可信读数 | AXMORF — ${axmorfBrand.tagline}`,
  description: `AXMORF 的本地针筒视觉测量项目完整案例：真实演示、连续容量测量、实时曲线、CSV 记录与桌面应用交付。 ${axmorfBrand.tagline}`,
  openGraph: {
    title: `SyringeMeter — 从画面到可信读数 | AXMORF — ${axmorfBrand.tagline}`,
    description: `AXMORF · 观看演示，阅读从视觉测量到桌面交付的完整工程案例。 ${axmorfBrand.tagline}`,
    siteName: axmorfBrand.name,
    images: [
      {
        url: "/projects/syringe-meter/og.png",
        width: 1200,
        height: 630,
        alt: "SyringeMeter",
      },
    ],
    type: "article",
  },
};

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const slug = await readProjectSlug(params);
  const alternates = {
    canonical: `/projects/${slug}`,
    types: {
      "text/markdown": [
        { url: `/agent/zh/projects/${slug}.md`, title: "中文项目正文" },
        { url: `/agent/en/projects/${slug}.md`, title: "English case study" },
      ],
    },
  };
  if (slug === "syringe-meter") return { ...syringeMeterMetadata, alternates };
  const copy = projectCatalog.getCase(slug, "zh")!;
  const title = `${copy.title} — ${copy.subtitle}`;
  return {
    title: `${title} | AXMORF — ${axmorfBrand.tagline}`,
    description: `AXMORF · ${copy.introduction} ${axmorfBrand.tagline}`,
    alternates,
    openGraph: {
      title: `${title} | AXMORF — ${axmorfBrand.tagline}`,
      description: `AXMORF · ${copy.introduction} ${axmorfBrand.tagline}`,
      siteName: axmorfBrand.name,
      type: "article",
    },
  };
}

export default async function Page({ params }: ProjectPageProps) {
  const project = await readProjectSlug(params);
  return <ProjectShowcase key={project} project={project} />;
}
// Next 16.2.10 caches a static interception target as non-interceptable after
// a direct visit (vercel/next.js#94533). Resolve this page's route per request
// so returning to the home page can open its project dialog again.
export const dynamic = "force-dynamic";
