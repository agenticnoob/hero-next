import type { Metadata } from "next";
import { HeroExperience } from "../src/experience/HeroExperience";
import { readJournalManifest } from "../src/journal/server";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    types: {
      "text/markdown": [
        { url: "/agent/zh/index.md", title: "中文内容索引" },
        { url: "/agent/en/index.md", title: "English content index" },
      ],
    },
  },
};

export default async function Page() {
  return <HeroExperience journal={await readJournalManifest()} />;
}
