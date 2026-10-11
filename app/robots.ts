import type { MetadataRoute } from "next";
import { heroSiteUrl } from "../src/shared/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: heroSiteUrl("/sitemap.xml"),
  };
}
