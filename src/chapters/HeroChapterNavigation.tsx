import { useRef } from "react";
import { heroChapterOrder, getHeroChapterDefinition } from "./definitions";
import { getHeroChapterContent } from "./content";
import type { HeroLocale } from "../preferences/locale";

export function HeroChapterNavigation({
  locale,
}: {
  readonly locale: HeroLocale;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  return (
    <details
      ref={menu}
      className="hero-navigation"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menu.current) {
          menu.current.open = false;
          menu.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary
        aria-label={locale === "zh" ? "章节" : "Chapters"}
        title={locale === "zh" ? "章节" : "Chapters"}
      >
        <span aria-hidden="true">☰</span>
      </summary>
      <nav aria-label={locale === "zh" ? "跳转章节" : "Jump to chapter"}>
        {[
          ...heroChapterOrder.map((id) => ({
            href: `#chapter-${getHeroChapterDefinition(id).ordinal}`,
            label: getHeroChapterContent(id, locale).body.eyebrow,
          })),
          {
            href: "#hero-journal",
            label: locale === "zh" ? "每日记录" : "Daily journal",
          },
        ].map(({ href, label }) => (
          <a
            key={href}
            href={href}
            onClick={() => {
              if (menu.current) menu.current.open = false;
              document
                .querySelector<HTMLElement>(href)
                ?.focus({ preventScroll: true });
            }}
          >
            {label} <span aria-hidden="true">↓</span>
          </a>
        ))}
      </nav>
    </details>
  );
}
