import { ProjectExhibition } from "../../../../src/projects/ProjectExhibition";
import { projectCatalog } from "../../../../src/projects/catalog";
import {
  readProjectSlug,
  type ProjectPageProps,
} from "../../../../src/projects/caseRoute";

export function generateStaticParams() {
  return projectCatalog.entries.map(({ slug }) => ({ slug }));
}

export default async function Page({ params }: ProjectPageProps) {
  const project = await readProjectSlug(params);
  return <ProjectExhibition key={project} project={project} />;
}
