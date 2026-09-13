import { WebGLScrollTimeline } from "@viselora/scroll-adapters/react";
import React from "react";

import {
  formatHeroChapterCounter,
  type HeroChapterDefinition,
} from "../chapters/definitions";
import type { HeroChapterLocalizedContent } from "../chapters/contentModel";
import type { HeroLocale } from "../preferences/locale";
import { HeroProfileSpeechBubble } from "./HeroProfileSpeechBubble";
import { HeroProfileWrappedText } from "./HeroProfileWrappedText";
import type { HeroProfileWrapSide } from "./wrap";
import { useHeroProfileWrap } from "./useProfileWrap";
import { profileCSSProperties } from "./layoutTokens";

type HeroProfileChapterBodyProps = {
  readonly definition: HeroChapterDefinition;
  readonly content: HeroChapterLocalizedContent;
  readonly locale: HeroLocale;
  readonly reading?: boolean;
};

export function HeroProfileChapterBody(props: HeroProfileChapterBodyProps) {
  return props.reading ? (
    <HeroReadingProfile {...props} />
  ) : (
    <HeroDesktopProfile {...props} />
  );
}

function HeroReadingProfile({
  definition,
  content,
  locale,
}: HeroProfileChapterBodyProps) {
  const bodyId = `chapter-${definition.ordinal}-body`;
  return (
    <WebGLScrollTimeline
      as="section"
      id={`${bodyId}-timeline`}
      progressKey={definition.signals.body}
      className="hero-chapter__body hero-profile-reading"
      start="top top"
      end="bottom bottom"
      scrub
      aria-labelledby={bodyId}
    >
      <header>
        <p className="hero-reading-index">
          {formatHeroChapterCounter(definition)}
        </p>
        <h2 id={bodyId}>{content.body.title}</h2>
        <p className="hero-reading-intro">{content.body.intro}</p>
      </header>
      <div
        className="hero-profile-reading__portrait"
        data-profile-reading-slot=""
        aria-hidden="true"
      >
        <p>
          {locale === "zh"
            ? "在这里，慢慢认识。"
            : "A little more, as you explore."}
        </p>
      </div>
      <div className="hero-profile-reading__stories">
        {content.body.sections.map((section) => (
          <section key={section.title}>
            <p className="hero-reading-label">{section.label}</p>
            <h3>{section.title}</h3>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
      {content.body.closing && <blockquote>{content.body.closing}</blockquote>}
    </WebGLScrollTimeline>
  );
}

function HeroDesktopProfile({
  definition,
  content,
  locale,
}: HeroProfileChapterBodyProps) {
  const chapterId = `chapter-${definition.ordinal}`;
  const chapterCounter = formatHeroChapterCounter(definition);
  const { flowRef, modelExclusionRef, speechBubbleExclusionRef } =
    useHeroProfileWrap(definition.signals.body);
  const leftSections = content.body.sections.filter(
    (_, index) => index % 2 === 0,
  );
  const rightSections = content.body.sections.filter(
    (_, index) => index % 2 === 1,
  );

  return (
    <WebGLScrollTimeline
      as="section"
      id={`${chapterId}-body-timeline`}
      progressKey={definition.signals.body}
      className="hero-chapter__body hero-profile"
      style={profileCSSProperties}
      start="top top"
      end="bottom bottom"
      scrub
      aria-labelledby={`${chapterId}-body`}
    >
      <div ref={flowRef} className="hero-profile__flow">
        <HeroProfileSpeechBubble
          locale={locale}
          progressKey={definition.signals.body}
          exclusionRef={speechBubbleExclusionRef}
        />
        <header className="hero-profile__lead">
          <p className="hero-profile__index">
            <HeroProfileWrappedText side="left" text={chapterCounter} />
          </p>
          <h2 id={`${chapterId}-body`}>
            <HeroProfileWrappedText side="left" text={content.body.title} />
          </h2>
          <p>
            <HeroProfileWrappedText side="right" text={content.body.intro} />
          </p>
        </header>

        <div className="hero-profile__story">
          <div
            className="hero-profile__story-column"
            data-profile-column="left"
          >
            {leftSections.map((section) => (
              <section key={section.title} className="hero-profile__story-item">
                <HeroProfileRule side="left" />
                <p>
                  <HeroProfileWrappedText side="left" text={section.label} />
                </p>
                <h3>
                  <HeroProfileWrappedText side="left" text={section.title} />
                </h3>
                <p>
                  <HeroProfileWrappedText side="left" text={section.body} />
                </p>
              </section>
            ))}
          </div>
          <div
            className="hero-profile__story-column"
            data-profile-column="right"
          >
            {rightSections.map((section) => (
              <section key={section.title} className="hero-profile__story-item">
                <HeroProfileRule side="right" />
                <p>
                  <HeroProfileWrappedText side="right" text={section.label} />
                </p>
                <h3>
                  <HeroProfileWrappedText side="right" text={section.title} />
                </h3>
                <p>
                  <HeroProfileWrappedText side="right" text={section.body} />
                </p>
              </section>
            ))}
          </div>
        </div>

        {content.body.closing ? (
          <div className="hero-profile__outro">
            <blockquote className="hero-profile__closing">
              <HeroProfileWrappedText side="left" text={content.body.closing} />
            </blockquote>
          </div>
        ) : null}

        <div
          ref={modelExclusionRef}
          className="hero-profile__model-exclusion"
          data-profile-model-exclusion=""
          aria-hidden="true"
        />
      </div>
    </WebGLScrollTimeline>
  );
}

function HeroProfileRule({ side }: { readonly side: HeroProfileWrapSide }) {
  return (
    <span
      className="hero-profile__story-rule"
      data-profile-wrap-text=""
      data-profile-wrap-side={side}
      aria-hidden="true"
    >
      <span
        className="hero-profile__wrap-token hero-profile__story-rule-line"
        data-profile-wrap-token=""
      />
    </span>
  );
}
