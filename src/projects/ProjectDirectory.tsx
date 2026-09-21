"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { HeroLocaleControl } from "../chapters/HeroLocaleControl";
import { useHeroSiteState } from "../experience/HeroSiteState";
import {
  useHeroLocaleState,
  useHeroThemeState,
} from "../experience/useHeroExperienceState";
import { projectCatalog } from "./catalog";
import { projectDirectoryCopy } from "../chapters/uiContent";
import { projectRoomAnchorId } from "./room";

export function ProjectDirectory({
  onClose,
}: {
  readonly onClose?: () => void;
}) {
  const { locale, store } = useHeroLocaleState();
  const { scheme } = useHeroThemeState();
  const { projectRoom } = useHeroSiteState();
  const article = useRef<HTMLElement>(null);
  useEffect(() => {
    const position = projectRoom.getDirectoryReturn();
    if (!position) return;
    const frame = window.requestAnimationFrame(() => {
      const entry = article.current?.querySelector<HTMLAnchorElement>(
        `a[href="/projects/${position.slug}"]`,
      );
      if (!entry) return;
      const dialog = article.current?.closest("dialog");
      if (dialog) dialog.scrollTop = position.scrollTop;
      else window.scrollTo({ top: position.scrollTop, behavior: "instant" });
      entry.focus({ preventScroll: true });
      projectRoom.finishDirectoryReturn();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [projectRoom]);
  const ui = projectDirectoryCopy[locale];
  return (
    <article
      ref={article}
      className="project-case project-directory"
      data-hero-theme={scheme}
      lang={locale === "zh" ? "zh-CN" : "en"}
      aria-labelledby="project-case-title"
    >
      <header className="project-case__bar">
        {onClose ? (
          <button type="button" onClick={onClose}>
            ← {ui.back}
          </button>
        ) : (
          <Link
            href={`/#${projectRoomAnchorId}`}
            prefetch={false}
            onClick={() => projectRoom.requestReturn()}
          >
            ← {ui.back}
          </Link>
        )}
        <HeroLocaleControl locale={locale} onLocaleChange={store.commit} />
      </header>
      <div className="project-case__inner">
        <header className="project-case__hero">
          <p className="project-case__eyebrow">03 / PROJECT INDEX</p>
          <h1 id="project-case-title" tabIndex={-1}>
            {ui.title}{" "}
            <span className="project-directory__count">
              {String(projectCatalog.entries.length).padStart(2, "0")}
            </span>
          </h1>
          <p className="project-case__subtitle">{ui.intro}</p>
        </header>
        <ol className="project-directory__list">
          {projectCatalog.entries.map((entry, index) => (
            <li key={entry.slug}>
              <Link
                className="project-directory__link"
                href={`/projects/${entry.slug}`}
                prefetch={false}
                scroll={false}
                onClick={(event) => {
                  if (
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  projectRoom.rememberDirectoryReturn(
                    entry.slug,
                    event.currentTarget.closest("dialog")?.scrollTop ??
                      window.scrollY,
                  );
                }}
              >
                <span className="project-directory__number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2>{entry.title[locale]}</h2>
                  <p>{entry.summary[locale]}</p>
                </div>
                <span className="project-directory__kind">
                  {entry.featured ? ui.selected : ui.more}
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}
