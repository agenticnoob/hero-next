import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "lenis/dist/lenis.css";
import "./globals.css";
import "../src/projects/showcase.css";
import { HeroSiteStateProvider } from "../src/experience/HeroSiteState";
import { heroSiteOrigin } from "../src/shared/site";

export const metadata: Metadata = {
  metadataBase: new URL(heroSiteOrigin),
  title: "noobli — Agent-first builder",
  description: "一个关于自我、AI 公理、开放构建与公共联结的四章节个人站。",
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
