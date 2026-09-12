import type {
  WebGLDeclaration,
  WebGLProgressSignalSource,
} from "@viselora/dom-webgl";
import { WebGLTarget } from "@viselora/dom-webgl/react";
import { WebGLScrollTimeline } from "@viselora/scroll-adapters/react";
import {
  useCallback,
  useMemo,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { heroChapterDefinitions } from "../chapters/definitions";
import { heroInterfaceContent } from "../chapters/uiContent";
import type { HeroLocale } from "../preferences/locale";
import { journalTrackConfig as config } from "./config";
import { readJournalPanelOpacity, type JournalTravelParams } from "./effect";
import type { HeroTextPaletteParams } from "../transition/textPaletteEffect";
import {
  journalPanelGeometry,
  journalTravel,
  journalWindowStart,
  type JournalPanel,
} from "./track";
import type { HeroJournalState } from "./useJournal";

export function HeroJournalStage({
  journal,
  progress,
}: {
  readonly journal: HeroJournalState;
  readonly progress: WebGLProgressSignalSource;
}) {
  const { panels, viewport } = journal;
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    readReducedMotion,
    () => false,
  );
  const subscribe = useCallback(
    (listener: () => void) =>
      progress.subscribe?.(listener) ?? (() => undefined),
    [progress],
  );
  const readWindow = useCallback(
    () =>
      progress.get(heroChapterDefinitions.signals.signals.exit) > 0
        ? journalWindowStart(progress.get(config.progressKey), panels, reduced)
        : -1,
    [progress, panels, reduced],
  );
  const windowStart = useSyncExternalStore(subscribe, readWindow, () => -1);
  const geometry = journalPanelGeometry(viewport);
  const style = {
    "--journal-width": `${geometry.width}px`,
    "--journal-date-size": `${geometry.dateSize}px`,
    "--journal-meta-top": `${geometry.metaTop}px`,
    "--journal-font-size": `${geometry.fontSize}px`,
  } as CSSProperties;
  if (windowStart < 0) return null;
  return (
    <div
      className="hero-journal-stage"
      aria-hidden="true"
      style={style}
      data-journal-window={windowStart}
    >
      {panels
        .slice(windowStart, windowStart + config.slotCount)
        .map((panel) => (
          <JournalPair
            key={`${panel.id}:${viewport.width}:${viewport.height}`}
            panel={panel}
            panels={panels}
            widthFraction={geometry.width / viewport.width}
            aspect={viewport.width / viewport.height}
          />
        ))}
    </div>
  );
}

function subscribeReducedMotion(listener: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
function readReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function JournalPair({
  panel,
  panels,
  widthFraction,
  aspect,
}: {
  readonly panel: JournalPanel;
  readonly panels: readonly JournalPanel[];
  readonly widthFraction: number;
  readonly aspect: number;
}) {
  const declarations = useMemo(() => {
    const palette = {
      kind: "hero.text.palette",
      readOpacity: (progress, reducedMotion) =>
        readJournalPanelOpacity(progress, panel, panels, reducedMotion),
    } satisfies HeroTextPaletteParams;
    const create = (slot: string): WebGLDeclaration => ({
      key: `hero.journal.${panel.id}.${slot}`,
      placement: {
        mode: "screen-depth",
        depth: config.readingDepth,
        size: "dom",
      },
      source: { kind: "dom", type: "text" },
      renderRole: "model",
      effects: [palette],
      lifecycle: {
        hideWhenReady: true,
        hideMode: "self",
        offscreen: { strategy: "restore-dom" },
      },
    });
    const group = (side: "left" | "right"): WebGLDeclaration => ({
      ...create(side),
      source: { kind: "dom", type: "element" },
      transformScope: "subtree",
      effects: [
        {
          kind: "hero.journal.travel",
          panel,
          panels,
          side,
          widthFraction,
          aspect,
        } satisfies JournalTravelParams,
      ],
    });
    return {
      left: group("left"),
      right: group("right"),
      date: create("date"),
      tools: create("tools"),
      body: create("body"),
    };
  }, [panel, panels, widthFraction, aspect]);
  return (
    <div
      className="hero-journal-pair"
      data-journal-panel={panel.id}
      style={{ "--journal-height": `${panel.height}px` } as CSSProperties}
    >
      <WebGLTarget
        as="div"
        webgl={declarations.left}
        className="hero-journal-lane"
        data-journal-left={panel.date}
      >
        <WebGLTarget
          as="p"
          className="hero-journal-date"
          webgl={declarations.date}
        >
          {panel.date.replaceAll("-", ".")}
        </WebGLTarget>
        <WebGLTarget
          as="p"
          className="hero-journal-meta"
          webgl={declarations.tools}
        >
          {panel.tools}
        </WebGLTarget>
      </WebGLTarget>
      <WebGLTarget
        as="div"
        webgl={declarations.right}
        className="hero-journal-lane"
        data-journal-right={panel.date}
      >
        <WebGLTarget
          as="p"
          className="hero-journal-body"
          webgl={declarations.body}
        >
          {panel.text}
        </WebGLTarget>
      </WebGLTarget>
    </div>
  );
}

export function HeroJournalRunway({
  journal,
  locale,
}: {
  readonly journal: HeroJournalState;
  readonly locale: HeroLocale;
}) {
  const { entries, panels, error, retry, available } = journal;
  const ui = heroInterfaceContent[locale].journal;
  const style = {
    minHeight: `${100 + (journalTravel(1, panels) - journalTravel(0, panels)) * config.scrollPerUnit}svh`,
  };
  return (
    <WebGLScrollTimeline
      as="section"
      id="hero-journal"
      progressKey={config.progressKey}
      className="hero-hub-runway hero-hub-runway--final"
      style={style}
      start="top top"
      end="bottom bottom"
      scrub
      aria-labelledby="hero-journal-title"
    >
      <div className="hero-sr-only" lang={locale}>
        <h2 id="hero-journal-title">{ui.title}</h2>
        {entries.map((entry) => (
          <article key={entry.date} data-journal-entry={entry.date}>
            <h3>{entry.date}</h3>
            <h4>{ui.tools}</h4>
            <p>{entry.tools.join(" · ")}</p>
            <p lang="zh-CN">{entry.event}</p>
          </article>
        ))}
      </div>
      {!entries.length ? (
        <div className="hero-journal-status" role="status">
          <p>{error ? ui.error : available ? ui.loading : ui.empty}</p>
          {error ? (
            <button type="button" onClick={retry}>
              {ui.retry}
            </button>
          ) : null}
        </div>
      ) : null}
    </WebGLScrollTimeline>
  );
}
