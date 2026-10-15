import type { NextConfig } from "next";

const websiteSha = process.env.HERO_WEBSITE_SHA;
if (websiteSha && !/^[a-f0-9]{40}$/.test(websiteSha)) {
  throw new Error("HERO_WEBSITE_SHA must be a full Git commit SHA");
}

const nextConfig = {
  // Development-only: keep LAN access working across DHCP address changes.
  allowedDevOrigins: ["**.*"],
  devIndicators: false,
  transpilePackages: ["@viselora/dom-webgl", "@viselora/scroll-adapters"],
  async headers() {
    return websiteSha
      ? [
          {
            source: "/",
            headers: [{ key: "X-Hero-Website-Sha", value: websiteSha }],
          },
        ]
      : [];
  },
} satisfies NextConfig;

export default nextConfig;
