import { notFound } from "next/navigation";
import { projectCaseStudies, type HeroProjectSlug } from "../chapters/content";

export type ProjectPageProps = {
  readonly params: Promise<{ slug: string }>;
};

export async function readProjectSlug(params: ProjectPageProps["params"]) {
  const { slug } = await params;
  if (!Object.hasOwn(projectCaseStudies, slug)) notFound();
  return slug as HeroProjectSlug;
}
