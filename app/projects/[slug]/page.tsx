import type { Metadata } from "next";
import { ProjectShowcase } from "../../../src/projects/ProjectShowcase";
import { projectCaseStudies } from "../../../src/chapters/content";
import {
  readProjectSlug,
  type ProjectPageProps,
} from "../../../src/projects/caseRoute";

const syringeMeterMetadata: Metadata = {
  title: "SyringeMeter — 从画面到可信读数 | noobli",
  description:
    "一个本地针筒视觉测量项目的完整案例：真实演示、连续容量测量、实时曲线、CSV 记录与桌面应用交付。",
  alternates: { canonical: "/projects/syringe-meter" },
  openGraph: {
    title: "SyringeMeter — 从画面到可信读数",
    description: "观看演示，阅读从视觉测量到桌面交付的完整工程案例。",
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
  if (slug === "syringe-meter") return syringeMeterMetadata;
  const copy = projectCaseStudies[slug].zh;
  const title = `${copy.title} — ${copy.subtitle}`;
  return {
    title: `${title} | noobli`,
    description: copy.introduction,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: { title, description: copy.introduction, type: "article" },
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
