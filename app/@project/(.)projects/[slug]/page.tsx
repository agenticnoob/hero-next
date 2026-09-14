import { ProjectExhibition } from "../../../../src/projects/ProjectExhibition";
import { projectCaseStudies } from "../../../../src/chapters/content";
import {
  readProjectSlug,
  type ProjectPageProps,
} from "../../../../src/projects/caseRoute";

export function generateStaticParams() {
  return Object.keys(projectCaseStudies).map((slug) => ({ slug }));
}

export default async function Page({ params }: ProjectPageProps) {
  const project = await readProjectSlug(params);
  return <ProjectExhibition key={project} project={project} />;
}
