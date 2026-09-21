"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";
import {
  getHeroChapterContent,
  syringeMeterShowcaseUi,
} from "../chapters/content";
import type { HeroProjectCaseStudy } from "../chapters/contentModel";
import { HeroLocaleControl } from "../chapters/HeroLocaleControl";
import { useHeroSiteState } from "../experience/HeroSiteState";
import {
  useHeroLocaleState,
  useHeroThemeState,
} from "../experience/useHeroExperienceState";
import { ProjectVideo } from "./ProjectVideo";
import { syringeMeterMedia } from "./media";
import { projectRoomAnchorId } from "./room";
import { projectCatalog } from "./catalog";

function readSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  event.preventDefault();
  const target = document.getElementById(id);
  if (!target) return;
  const dialog = target.closest("dialog");
  const inset =
    (document.querySelector(".project-case__bar")?.getBoundingClientRect()
      .height ?? 76) + 24;
  const top = dialog
    ? target.getBoundingClientRect().top -
      dialog.getBoundingClientRect().top +
      dialog.scrollTop -
      inset
    : target.getBoundingClientRect().top + window.scrollY - inset;
  (dialog ?? window).scrollTo({
    top,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
  target.focus({ preventScroll: true });
}

export function ProjectShowcase({
  project,
  onClose,
}: {
  readonly project: string;
  readonly onClose?: () => void;
}) {
  const { locale, store } = useHeroLocaleState();
  const { scheme } = useHeroThemeState();
  const { projectRoom } = useHeroSiteState();
  const copy: HeroProjectCaseStudy = projectCatalog.getCase(project, locale)!;
  const hasMedia = project === "syringe-meter";
  const ui = syringeMeterShowcaseUi[locale];
  const firstSectionId = `project-${copy.sections[0].id}`;
  const returnToRoom = () => {
    const index = getHeroChapterContent(
      "builds",
      locale,
    ).body.sections.findIndex(
      (section) => section.showcase?.href === `/projects/${project}`,
    );
    if (index >= 0) {
      projectRoom.select(index);
      projectRoom.requestReturn();
    }
  };

  return (
    <article
      className="project-case"
      data-project={project}
      data-media={hasMedia}
      data-hero-theme={scheme}
      lang={locale === "zh" ? "zh-CN" : "en"}
      aria-labelledby="project-case-title"
    >
      <header className="project-case__bar">
        {onClose ? (
          <button type="button" onClick={onClose}>
            ← {copy.backLabel}
          </button>
        ) : (
          <Link
            href={
              project.startsWith("gh-")
                ? "/projects"
                : `/#${projectRoomAnchorId}`
            }
            prefetch={false}
            onClick={returnToRoom}
          >
            ← {copy.backLabel}
          </Link>
        )}
        <HeroLocaleControl locale={locale} onLocaleChange={store.commit} />
      </header>
      <div className="project-case__inner">
        <header className="project-case__hero">
          <p className="project-case__eyebrow">{copy.eyebrow}</p>
          <h1 id="project-case-title" tabIndex={-1}>
            {copy.title}
          </h1>
          <p className="project-case__subtitle">{copy.subtitle}</p>
          <a
            className="project-case__read"
            href={`#${firstSectionId}`}
            onClick={(event) => readSection(event, firstSectionId)}
          >
            {copy.readLabel} ↓
          </a>
        </header>
        {hasMedia && <ProjectVideo locale={locale} />}
        <p className="project-case__introduction">{copy.introduction}</p>
        <div className="project-case__reading">
          <aside>
            <nav className="project-case__toc" aria-label={copy.tocLabel}>
              <p>{copy.tocLabel}</p>
              {copy.sections.map((section) => (
                <a
                  key={section.id}
                  href={`#project-${section.id}`}
                  onClick={(event) =>
                    readSection(event, `project-${section.id}`)
                  }
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>
          <div className="project-case__prose">
            {copy.sections.map((section) => (
              <section
                key={section.id}
                id={`project-${section.id}`}
                tabIndex={-1}
                className="project-case__section"
              >
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.points && (
                  <ul>
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
                {section.id === "problem" && copy.pipeline.length > 0 && (
                  <section
                    className="project-case__pipeline"
                    aria-label={copy.pipelineTitle}
                  >
                    <h3>{copy.pipelineTitle}</h3>
                    <ol>
                      {copy.pipeline.map((step) => (
                        <li key={step.title}>
                          <strong>{step.title}</strong>
                          <span>{step.detail}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
                {hasMedia && section.id === "measurement" && (
                  <figure>
                    <Image
                      src={syringeMeterMedia.measurement}
                      alt={ui.measurementAlt}
                      width={1440}
                      height={900}
                      unoptimized
                    />
                    <figcaption>{ui.measurementCaption}</figcaption>
                  </figure>
                )}
                {hasMedia && section.id === "recording" && (
                  <figure>
                    <Image
                      src={syringeMeterMedia.csv}
                      alt={ui.csvAlt}
                      width={1440}
                      height={900}
                      unoptimized
                    />
                    <figcaption>{ui.csvCaption}</figcaption>
                  </figure>
                )}
              </section>
            ))}
          </div>
        </div>
        <footer className="project-case__footer">
          <h2>{copy.linksTitle}</h2>
          <div>
            {copy.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        </footer>
      </div>
    </article>
  );
}
