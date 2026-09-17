import React, { useEffect } from "react";
import { useHeroViewport } from "../shared/useHeroViewport";
import { HeroChapterNavigation } from "./HeroChapterNavigation";

import { getHeroChapterContent, heroSiteContent } from "./content";
import {
  getHeroChapterDefinition,
  heroChapterCount,
  heroChapterOrder,
} from "./definitions";
import { HeroChapter } from "./HeroChapter";
import { HeroLocaleControl } from "./HeroLocaleControl";
import type { HeroSchemeName } from "../transition/transitionConfig";
import type { HeroLocale } from "../preferences/locale";
import { HeroProfileChapterBody } from "../profile/HeroProfileChapterBody";
import { HeroAxiomsChapterBody } from "../axioms/HeroAxiomsReader";
import { getAxiomsContent } from "../axioms/content";
import { HeroProjectsChapterBody } from "../projects/HeroProjectRoom";
import { HeroSignalsChapterBody } from "../signals/HeroSignalsChapterBody";
import type { ProjectRoomStore } from "../projects/room";
import { HeroJournalRunway } from "../journal/HeroJournal";
import type { HeroJournalState } from "../journal/useJournal";

export function HeroChapterNarrative({
  locale,
  onLocaleChange,
  scheme,
  onThemeChange,
  onLayoutChange,
  projectRoom,
  journal,
}: {
  readonly locale: HeroLocale;
  readonly scheme: HeroSchemeName;
  readonly onThemeChange: (scheme: HeroSchemeName) => void;
  readonly onLocaleChange: (locale: HeroLocale) => void;
  readonly onLayoutChange: () => void;
  readonly projectRoom: ProjectRoomStore;
  readonly journal: HeroJournalState;
}) {
  const site = heroSiteContent[locale];
  const { reading } = useHeroViewport();

  useEffect(() => {
    onLayoutChange();
    const observer = new ResizeObserver(onLayoutChange);
    document
      .querySelectorAll(
        ".hero-chapter__body, .hero-hub-runway--opening, #hero-journal",
      )
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [locale, reading, onLayoutChange]);

  return (
    <>
      <div className="hero-controls">
        {reading && (
          <button
            type="button"
            className="hero-theme-control"
            aria-label={site.themeControlLabel}
            title={site.themeControlLabel}
            aria-pressed={scheme === "inverted"}
            onClick={() =>
              onThemeChange(scheme === "initial" ? "inverted" : "initial")
            }
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              aria-hidden="true"
              focusable="false"
            >
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M10 2a8 8 0 0 1 0 16Z" fill="currentColor" />
            </svg>
          </button>
        )}
        <HeroLocaleControl locale={locale} onLocaleChange={onLocaleChange} />
      </div>
      {reading && <HeroChapterNavigation locale={locale} />}

      <section
        className="hero-hub-runway hero-hub-runway--opening"
        aria-label={site.intro.eyebrow}
      >
        {reading ? (
          <header className="hero-opening-copy">
            <p>{site.intro.eyebrow}</p>
            <h1>{site.intro.title}</h1>
            <p>{site.intro.summary}</p>
            <p className="hero-opening-copy__hint">{site.intro.readingHint}</p>
          </header>
        ) : (
          <p className="hero-sr-only">
            {site.intro.title} {site.intro.summary} {site.intro.hint}
          </p>
        )}
      </section>

      {heroChapterOrder.map((chapterId) => {
        const content = getHeroChapterContent(chapterId, locale);
        const definition = getHeroChapterDefinition(chapterId);

        return (
          <React.Fragment key={chapterId}>
            <HeroChapter
              definition={definition}
              content={content}
              {...(chapterId === "self"
                ? { className: "hero-chapter--profile" }
                : chapterId === "axioms"
                  ? { className: "hero-chapter--axioms" }
                  : chapterId === "builds"
                    ? { className: "hero-chapter--projects" }
                    : {})}
            >
              {chapterId === "self" ? (
                <HeroProfileChapterBody
                  definition={definition}
                  content={content}
                  locale={locale}
                  reading={reading}
                />
              ) : chapterId === "axioms" ? (
                <HeroAxiomsChapterBody
                  definition={definition}
                  content={getAxiomsContent(locale)}
                  reading={reading}
                  locale={locale}
                />
              ) : chapterId === "builds" ? (
                <HeroProjectsChapterBody
                  definition={definition}
                  content={content}
                  locale={locale}
                  room={projectRoom}
                  onLayoutChange={onLayoutChange}
                />
              ) : (
                <HeroSignalsChapterBody
                  key={locale}
                  definition={definition}
                  content={content}
                  locale={locale}
                  reading={reading}
                />
              )}
            </HeroChapter>

            {definition.ordinal < heroChapterCount ? (
              <section className="hero-hub-runway" aria-hidden="true">
                <p className="hero-sr-only">{site.intermediateHub}</p>
              </section>
            ) : null}
          </React.Fragment>
        );
      })}

      <HeroJournalRunway journal={journal} locale={locale} reading={reading} />
    </>
  );
}
