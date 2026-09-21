import { notFound } from "next/navigation";
import { projectCatalog } from "./catalog";

export type ProjectPageProps = {
  readonly params: Promise<{ slug: string }>;
};

export async function readProjectSlug(params: ProjectPageProps["params"]) {
  const { slug } = await params;
  if (!projectCatalog.getCase(slug, "zh")) notFound();
  return slug;
}
