import { describe, expect, test } from "vitest";

import {
  getHeroChapterContent,
  heroChapterContent,
  heroPublicLinks,
} from "../src/chapters/content";
import {
  heroChapterDefinitions,
  heroChapterOrder,
} from "../src/chapters/definitions";

describe("hero chapter content", () => {
  test("defines four stable bilingual chapters in narrative order", () => {
    expect(Object.keys(heroChapterContent)).toHaveLength(
      heroChapterOrder.length,
    );
    expect(
      heroChapterOrder.map(
        (chapterId) => heroChapterDefinitions[chapterId].number,
      ),
    ).toEqual(["01", "02", "03", "04"]);

    for (const chapterId of heroChapterOrder) {
      for (const locale of ["zh", "en"] as const) {
        const content = getHeroChapterContent(chapterId, locale);
        expect(content).not.toHaveProperty("frame");
        expect(content).not.toHaveProperty("exitFrame");
        expect(content.body.eyebrow.length).toBeGreaterThan(0);
        expect(content.body.title.length).toBeGreaterThan(0);
        expect(content.body.intro.length).toBeGreaterThan(0);
        expect(content.portal.left.body.length).toBeGreaterThan(0);
        expect(content.portal.right.items.length).toBeGreaterThan(0);
        expect(content.body.sections.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test("uses verified public destinations without inventing private contact data", () => {
    expect(heroPublicLinks.githubProfile).toBe(
      "https://github.com/agenticnoob",
    );
    expect(heroPublicLinks.currentProject).toBe(
      "https://github.com/agenticnoob/dom-webgl-workspace",
    );
    expect(heroPublicLinks.blog).toBe("https://blog.zzzxc.com");
    expect(heroPublicLinks.leetcode).toBe("https://leetcode.cn/u/skedush/");
    expect(heroPublicLinks.douyin).toBe(
      "https://www.douyin.com/user/MS4wLjABAAAATcqt2Tq3UxNiJz8Qg5eEHhOkdpfNuEP1KuthHYn-oIycjaF24_KxkL9pY8bgbW3Z",
    );
    expect(heroPublicLinks.xiaohongshu).toBe(
      "https://www.xiaohongshu.com/user/profile/651c334600000000240144aa",
    );
    expect(heroPublicLinks.bilibili).toBe(
      "https://space.bilibili.com/269573670",
    );
    for (const locale of ["zh", "en"] as const) {
      const sections = getHeroChapterContent("signals", locale).body.sections;
      expect(sections.slice(0, 3).map((section) => section.link?.href)).toEqual(
        [
          heroPublicLinks.douyin,
          heroPublicLinks.xiaohongshu,
          heroPublicLinks.bilibili,
        ],
      );
      expect(sections.slice(0, 3).every((section) => section.image)).toBe(true);
      expect(sections).toHaveLength(6);
      expect(sections.at(-1)).toMatchObject({
        directory: { detail: "@skedush" },
        link: { href: heroPublicLinks.leetcode },
      });
    }
    expect(Object.keys(heroPublicLinks)).not.toContain("email");
    expect(Object.keys(heroPublicLinks)).not.toContain("phone");
  });

  test.each(["zh", "en"] as const)(
    "keeps real identity, dated biography and military service out of the %s body and portals",
    (locale) => {
      const profile = getHeroChapterContent("self", locale);
      const copy = JSON.stringify(profile);

      expect(profile.body.eyebrow).toContain("SELF");
      expect(profile.body.sections).toHaveLength(4);
      expect(copy).not.toMatch(
        /徐力|Xu Li|\b(?:19|20)\d{2}\b|出生|年生|岁|born|eighteen|军营|军旅|入伍|当兵|号声|barracks|military|reveille|杭州|温州|上海|Hangzhou|Wenzhou|Shanghai|校园|毕业|自由职业|campus|graduation|freelancer/i,
      );
      expect(copy).toContain("AI");
      expect(profile.body.closing).toBeTruthy();
    },
  );
});
