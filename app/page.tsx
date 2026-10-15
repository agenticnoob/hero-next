import type { Metadata } from "next";
import { HeroExperience } from "../src/experience/HeroExperience";
import { readJournalManifest } from "../src/journal/server";
import { axmorfBrand } from "../src/shared/brand";
import { heroSiteOrigin } from "../src/shared/site";

const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: axmorfBrand.name,
  alternateName: axmorfBrand.chineseName,
  url: heroSiteOrigin,
  description: `${axmorfBrand.introductionZh} ${axmorfBrand.tagline}`,
  sameAs: [
    "https://github.com/agenticnoob",
    "https://blog.zzzxc.com/",
    "https://resume.zzzxc.com/",
  ],
};

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
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(person).replace(/</g, "\\u003c"),
        }}
      />
      <HeroExperience journal={await readJournalManifest()} />
    </>
  );
}
