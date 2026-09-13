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
  onLayoutChange,
  projectRoom,
  journal,
}: {
  readonly locale: HeroLocale;
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
      <HeroLocaleControl locale={locale} onLocaleChange={onLocaleChange} />
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
            <p className="hero-opening-copy__hint">{site.intro.hint}</p>
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
