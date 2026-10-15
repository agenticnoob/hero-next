import type { Metadata } from "next";
import { axmorfBrand } from "../../src/shared/brand";
import { ProjectDirectory } from "../../src/projects/ProjectDirectory";

export const metadata: Metadata = {
  title: `全部项目 | AXMORF — ${axmorfBrand.tagline}`,
  description: `AXMORF 的精选作品与持续构建的公开项目。 ${axmorfBrand.tagline}`,
  alternates: { canonical: "/projects" },
};

export default function Page() {
  return <ProjectDirectory />;
}

// Match case pages: direct visits must not poison Next's interception cache.
export const dynamic = "force-dynamic";
