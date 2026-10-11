import type { MetadataRoute } from "next";
import { projectCatalog } from "../src/projects/catalog";
import { heroSiteUrl } from "../src/shared/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/projects",
    "/agent",
    "/agent/en",
    ...projectCatalog.entries.map(({ href }) => href),
  ].map((path) => ({ url: heroSiteUrl(path) }));
}
