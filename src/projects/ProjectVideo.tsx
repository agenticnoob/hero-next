"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  syringeMeterCaseStudy,
  syringeMeterShowcaseUi,
} from "../chapters/content";
import type { HeroLocale } from "../preferences/locale";
import { syringeMeterMedia as media } from "./media";

type VideoSelection = { readonly full: boolean; readonly start: number };

export function ProjectVideo({ locale }: { readonly locale: HeroLocale }) {
  const copy = syringeMeterCaseStudy[locale];
  const ui = syringeMeterShowcaseUi[locale];
  const video = useRef<HTMLVideoElement>(null);
  const [selection, setSelection] = useState<VideoSelection | null>(null);
  const [error, setError] = useState(false);
  const source = selection?.full ? media.full : media.preview;

  useEffect(() => {
    const player = video.current;
    if (!player || !selection) return;
    let current = true;
    const play = () => {
      if (player.readyState < 1) return;
      player.currentTime = selection.start;
      player.play().catch(() => {
        if (current) setError(true);
      });
    };
    player.addEventListener("loadedmetadata", play);
    play();
    return () => {
      current = false;
      player.removeEventListener("loadedmetadata", play);
      player.pause();
    };
  }, [selection]);

  const select = (full: boolean, start = 0) => {
    setError(false);
    setSelection({ full, start });
  };

  return (
    <section className="project-video" aria-label={ui.demoTitle}>
      <div className="project-video__screen">
        {selection ? (
          <video
            key={source}
            ref={video}
            src={source}
            controls
            playsInline
            muted
            preload="metadata"
            poster={media.poster}
            width={1440}
            height={900}
            aria-label={selection.full ? copy.fullLabel : copy.previewLabel}
            aria-describedby="project-video-caption"
            onError={() => setError(true)}
          >
            <a href={source}>{copy.videoFallback}</a>
          </video>
        ) : (
          <button
            type="button"
            className="project-video__poster"
            onClick={() => select(false)}
            aria-label={copy.previewLabel}
          >
            <Image
              src={media.poster}
              alt={ui.posterAlt}
              width={1440}
              height={900}
              priority
              unoptimized
            />
            <span className="project-video__play">▶ {copy.previewLabel}</span>
          </button>
        )}
      </div>
      <div className="project-video__choices">
        <button
          type="button"
          aria-pressed={selection !== null && !selection.full}
          onClick={() => select(false)}
        >
          {copy.previewLabel}
        </button>
        <button
          type="button"
          aria-pressed={selection?.full ?? false}
          onClick={() => select(true)}
        >
          {copy.fullLabel} ↗
        </button>
      </div>
      <p id="project-video-caption" className="project-case__caption">
        {copy.videoCaption}
      </p>
      {error && (
        <p role="status">
          {ui.playbackError}{" "}
          <a href={source} target="_blank" rel="noreferrer">
            {ui.openVideo} ↗
          </a>
        </p>
      )}
      <nav className="project-video__chapters" aria-label={copy.chaptersLabel}>
        {media.chapters.map((start, index) => (
          <button key={start} type="button" onClick={() => select(true, start)}>
            <span>
              {Math.floor(start / 60)}:{String(start % 60).padStart(2, "0")}
            </span>
            {ui.chapters[index]}
          </button>
        ))}
      </nav>
      <noscript>
        <p>
          <a href={media.preview}>{copy.previewLabel}</a> ·{" "}
          <a href={media.full}>{copy.fullLabel}</a>
        </p>
      </noscript>
    </section>
  );
}
