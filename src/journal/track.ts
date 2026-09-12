import { heroLayoutTokens } from "../shared/layoutTokens";
import type { HeroViewport } from "../shared/viewport";
import { journalTrackConfig as config } from "./config";
import type { JournalEntry } from "./model";

export type JournalPanel = {
  readonly id: string;
  readonly date: string;
  readonly tools: string;
  readonly text: string;
  readonly offset: number;
  readonly height: number;
};

export function journalPanelGeometry(viewport: HeroViewport) {
  const narrow = viewport.width <= heroLayoutTokens.compactBreakpoint;
  const width = narrow
    ? viewport.width * 0.36
    : Math.min(420, viewport.width * 0.3);
  const fontSize = narrow ? 14 : 20;
  return {
    width,
    fontSize,
    dateSize: narrow ? 19 : 30,
    metaTop: narrow ? 35 : 50,
  };
}

export function createJournalPanels(
  entries: readonly JournalEntry[],
  viewport: HeroViewport,
): readonly JournalPanel[] {
  const geometry = journalPanelGeometry(viewport);
  // Reserve full-width glyph space, including native word-wrap slack. Each day
  // gets enough track distance for its taller column, without splitting the day.
  const lines = (text: string) =>
    Math.ceil(
      Array.from(text).reduce(
        (sum, char) => sum + (/[^\x00-\xff]/.test(char) ? 1 : 0.62),
        0,
      ) /
        (geometry.width / geometry.fontSize),
    ) + 2;
  let offset = 0;
  return entries.map((entry, index) => {
    const shown = entry.tools.slice(0, config.toolLimit);
    const tools = [
      ...shown,
      ...(entry.tools.length > shown.length
        ? [`等 ${entry.tools.length} 项`]
        : []),
    ].join(" · ");
    const height = Math.max(
      lines(entry.event) * geometry.fontSize * 1.5,
      geometry.metaTop + lines(tools) * geometry.fontSize * 1.5,
    );
    if (index > 0)
      offset +=
        Math.log(1 + (height / viewport.height + 0.085) / config.slope) /
        config.perspectiveRate;
    return {
      id: entry.date,
      date: entry.date,
      tools,
      text: entry.event,
      offset,
      height,
    };
  });
}

export function journalTravel(
  progress: number,
  panels: readonly JournalPanel[],
): number {
  const value = Number.isFinite(progress)
    ? Math.max(0, Math.min(1, progress))
    : 0;
  const start = Math.log(config.initialScale) / config.perspectiveRate;
  const end =
    (panels.at(-1)?.offset ?? 0) +
    Math.log(config.exitScale) / config.perspectiveRate;
  return start + value * (end - start);
}

export function journalWindowStart(
  progress: number,
  panels: readonly JournalPanel[],
  reduced = false,
): number {
  if (reduced)
    return Math.max(
      0,
      Math.min(
        Math.max(0, panels.length - config.slotCount),
        Math.floor(Math.max(0, Math.min(1, progress)) * panels.length),
      ),
    );
  const travel = journalTravel(progress, panels);
  const exitDistance = Math.log(config.exitScale) / config.perspectiveRate;
  const first = panels.findIndex(
    (panel) => travel - panel.offset <= exitDistance,
  );
  return Math.max(
    0,
    Math.min(
      Math.max(0, panels.length - config.slotCount),
      first < 0 ? panels.length - 1 : first,
    ),
  );
}

export function journalPanelMotion(
  progress: number,
  panel: JournalPanel,
  panels: readonly JournalPanel[],
  reduced: boolean,
) {
  const travel = journalTravel(progress, panels);
  if (reduced) {
    const selected = Math.min(
      panels.length - 1,
      Math.max(
        0,
        Math.floor(Math.max(0, Math.min(1, progress)) * panels.length),
      ),
    );
    return {
      scale: 1,
      y: 0.22,
      opacity: panels[selected]?.id === panel.id ? 1 : 0,
    };
  }
  const scale = Math.exp((travel - panel.offset) * config.perspectiveRate);
  const opacity =
    smoothstep(config.farScale, config.farScale + 0.08, scale) *
    (1 - smoothstep(config.exitScale - 0.05, config.exitScale, scale));
  return { scale, y: config.horizon + config.slope * scale, opacity };
}

function smoothstep(min: number, max: number, value: number) {
  const p = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return p * p * (3 - 2 * p);
}
