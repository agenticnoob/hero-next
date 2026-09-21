import type { Metadata } from "next";
import { ProjectDirectory } from "../../src/projects/ProjectDirectory";

export const metadata: Metadata = {
  title: "全部项目 | noobli",
  description: "noobli 的精选作品与持续构建的公开项目。",
  alternates: { canonical: "/projects" },
};

export default function Page() {
  return <ProjectDirectory />;
}

// Match case pages: direct visits must not poison Next's interception cache.
export const dynamic = "force-dynamic";
