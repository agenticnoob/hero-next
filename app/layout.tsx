import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "lenis/dist/lenis.css";
import "./globals.css";
import "../src/projects/showcase.css";
import { HeroSiteStateProvider } from "../src/experience/HeroSiteState";
import { heroSiteOrigin } from "../src/shared/site";
import { axmorfBrand } from "../src/shared/brand";

export const metadata: Metadata = {
  metadataBase: new URL(heroSiteOrigin),
  title: `${axmorfBrand.name} — ${axmorfBrand.tagline}`,
  description: `${axmorfBrand.introductionZh} ${axmorfBrand.tagline} ${axmorfBrand.taglineZh}`,
  openGraph: {
    type: "website",
    url: heroSiteOrigin,
    siteName: axmorfBrand.name,
    title: `${axmorfBrand.name} — ${axmorfBrand.tagline}`,
    description: `${axmorfBrand.introductionZh} ${axmorfBrand.tagline} ${axmorfBrand.taglineZh}`,
    locale: "zh_CN",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary",
    title: `${axmorfBrand.name} — ${axmorfBrand.tagline}`,
    description: `${axmorfBrand.introductionEn} ${axmorfBrand.tagline}`,
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
  project,
}: {
  children: ReactNode;
  project: ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="describedby" href="/llms.txt" type="text/plain" />
      </head>
      <body>
        <HeroSiteStateProvider>
          {children}
          {project}
        </HeroSiteStateProvider>
      </body>
    </html>
  );
}
