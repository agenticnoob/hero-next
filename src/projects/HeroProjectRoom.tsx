import type { WebGLDeclaration } from "@viselora/dom-webgl";
import { WebGLTarget } from "@viselora/dom-webgl/react";
import { WebGLScrollTimeline } from "@viselora/scroll-adapters/react";
import React, { useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { syringeMeterMedia, projectHasPoster } from "./media";
import { syringeMeterShowcaseUi } from "../chapters/content";
import type { HeroChapterBodyProps } from "../chapters/HeroChapter";
import {
  formatHeroChapterCounter,
  formatHeroChapterHeading,
} from "../chapters/definitions";
import { heroInterfaceContent } from "../chapters/uiContent";
import type { HeroLocale, HeroLocaleStore } from "../preferences/locale";
import { assertProjectRoomSections } from "./model";
import { projectRoomAnchorId } from "./roomNavigation";
import type { ProjectRoomStore } from "./roomStore";
import { projectExhibitLayout } from "./exhibit";
import { projectDirectoryCopy } from "../chapters/uiContent";

export function HeroProjectRoomStage({
  locale,
  room,
}: {
  readonly locale: HeroLocaleStore;
  readonly room: ProjectRoomStore;
}) {
  const declaration = useMemo(
    () =>
      ({
        key: "hero.projects.room",
        placement: { mode: "screen-depth", depth: 3, size: "dom" },
        source: { kind: "dom", type: "element" },
        renderRole: "model",
        lifecycle: { hideWhenReady: true, hideMode: "self" },
        effects: [{ kind: "hero.projects.room", locale, room }],
      }) satisfies WebGLDeclaration,
    [locale, room],
  );
  return (
    <WebGLTarget
      as="div"
      className="hero-projects-surface"
      aria-hidden="true"
      webgl={declaration}
    />
  );
}

export function HeroProjectsChapterBody({
  definition,
  content,
  locale,
  room,
  onLayoutChange,
}: HeroChapterBodyProps & {
  readonly locale: HeroLocale;
  readonly room: ProjectRoomStore;
  readonly onLayoutChange: () => void;
}) {
  const snapshot = useSyncExternalStore(
    room.subscribe,
    room.getSnapshot,
    room.getServerSnapshot,
  );
  useEffect(() => {
    onLayoutChange();
  }, [snapshot.ready, onLayoutChange]);
  const bodyId = `chapter-${definition.ordinal}-body`;
  const projects = content.body.sections;
  assertProjectRoomSections(projects);
  const selected = projects[snapshot.selected];
  const controlsEnabled = snapshot.ready && snapshot.active;
  const ui = heroInterfaceContent[locale].projects;
  return (
    <WebGLScrollTimeline
      as="section"
      id={`${bodyId}-timeline`}
      progressKey={definition.signals.body}
      className="hero-chapter__body hero-projects"
      start="top top"
      end="bottom bottom"
      scrub
      aria-labelledby={bodyId}
      data-room-ready={snapshot.ready}
      data-room-active={controlsEnabled}
      data-room-selected={snapshot.selected}
      data-room-settled={snapshot.settled}
    >
      <span
        id={projectRoomAnchorId}
        className="hero-projects__return-anchor"
        aria-hidden="true"
      />
      <div className="hero-projects__content">
        <p className="hero-chapter__index">
          {formatHeroChapterCounter(definition)}
        </p>
        <h2 id={bodyId}>{content.body.title}</h2>
        <p>{content.body.intro}</p>
        <Link
          href="/projects"
          prefetch={false}
          scroll={false}
          className="hero-projects__directory"
          data-project-directory-entry="reading"
          tabIndex={snapshot.ready ? -1 : undefined}
        >
          {projectDirectoryCopy[locale].title} ↗
        </Link>
        <div className="hero-chapter__notes">
          {projects.map((project, index) => (
            <section className="hero-chapter__note" key={project.title}>
              <p>
                {String(index + 1).padStart(2, "0")} / {project.label}
              </p>
              <h3>{project.title}</h3>
              <p>{project.body}</p>
              {project.showcase && (
                <Link
                  href={project.showcase.href}
                  prefetch={false}
                  scroll={false}
                  className="hero-projects__case-link"
                  data-project-index={index}
                  tabIndex={snapshot.ready ? -1 : undefined}
                  onClick={() => room.select(index)}
                >
                  {projectHasPoster(project.showcase.href) && (
                    <Image
                      src={syringeMeterMedia.poster}
                      alt={syringeMeterShowcaseUi[locale].posterAlt}
                      width={1280}
                      height={800}
                      unoptimized
                    />
                  )}
                  <span>{project.showcase.label} →</span>
                </Link>
              )}
              {project.link && (
                <a
                  href={project.link.href}
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={snapshot.ready ? -1 : undefined}
                >
                  {project.link.label} ↗
                </a>
              )}
            </section>
          ))}
        </div>
      </div>
      <div
        className="hero-projects__controls"
        hidden={!controlsEnabled}
        onPointerEnter={() => room.setHovered(true)}
        onPointerLeave={() => room.setHovered(false)}
        onFocusCapture={() => room.setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            room.setFocused(false);
        }}
      >
        <header className="hero-projects__heading">
          <span>{formatHeroChapterHeading(definition, ui.title)}</span>
          <span className="hero-projects__hint">{ui.hint}</span>
          <Link
            href="/projects"
            prefetch={false}
            scroll={false}
            className="hero-projects__directory"
            data-project-directory-entry="desktop"
          >
            {projectDirectoryCopy[locale].title} ↗
          </Link>
        </header>
        {projects.map(
          (project, index) =>
            project.showcase && (
              <Link
                key={project.title}
                ref={(element) => room.registerExhibit(index, element)}
                className="hero-projects__exhibit"
                data-project-index={index}
                data-project-poster={projectHasPoster(project.showcase.href)}
                href={project.showcase.href}
                prefetch={false}
                scroll={false}
                style={{
                  width: projectExhibitLayout(
                    projectHasPoster(project.showcase.href),
                  ).width,
                  height: projectExhibitLayout(
                    projectHasPoster(project.showcase.href),
                  ).height,
                }}
                aria-label={`${project.title} · ${project.showcase.label}`}
                aria-disabled={!controlsEnabled}
                tabIndex={controlsEnabled ? 0 : -1}
                onClick={(event) => {
                  if (!controlsEnabled) event.preventDefault();
                  else room.select(index);
                }}
              >
                <span className="hero-sr-only">{project.showcase.label} →</span>
              </Link>
            ),
        )}
        <button
          type="button"
          className="hero-projects__turn hero-projects__turn--left"
          aria-label={ui.previous}
          onClick={() => room.select(snapshot.selected - 1)}
        >
          ←
        </button>
        <button
          type="button"
          className="hero-projects__turn hero-projects__turn--right"
          aria-label={ui.next}
          onClick={() => room.select(snapshot.selected + 1)}
        >
          →
        </button>
        <footer className="hero-projects__footer">
          <nav aria-label={ui.nav}>
            {projects.map((project, index) => (
              <button
                type="button"
                key={project.title}
                aria-pressed={snapshot.selected === index}
                onClick={() => room.select(index)}
              >
                {project.title}
              </button>
            ))}
          </nav>
          {selected?.link && (
            <a
              className="hero-projects__source"
              href={selected.link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`${ui.link}: ${selected.title}`}
              aria-disabled={!snapshot.settled}
              tabIndex={snapshot.settled ? 0 : -1}
              onClick={(event) => {
                if (!snapshot.settled) event.preventDefault();
              }}
            >
              {ui.link} ↗
            </a>
          )}
        </footer>
      </div>
    </WebGLScrollTimeline>
  );
}
