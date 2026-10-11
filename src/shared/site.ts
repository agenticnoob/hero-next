export const heroSiteOrigin = "https://zzzxc.com";

export function heroSiteUrl(path: string): string {
  return new URL(path, heroSiteOrigin).href;
}
