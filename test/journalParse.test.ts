import { describe, expect, test } from "vitest";
import {
  parseJournalManifest,
  parseJournalSnapshot,
} from "../src/journal/parse";

const manifest = {
  url: `/journal/snapshot-${"a".repeat(64)}.json`,
  sha256: "a".repeat(64),
  entryCount: 3,
  latestDate: "2026-09-08",
  sourceRevision: null,
};
const snapshot = {
  schemaVersion: 2,
  sourceRevision: null,
  entries: [
    { date: "2026-09-08", tools: ["React"], event: "最新事件。" },
    { date: "2026-09-07", tools: [], event: "No tools this day." },
    { date: "2026-09-06", tools: ["TypeScript"], event: "Earlier event." },
  ],
};

describe("journal publication parsing", () => {
  test("projects valid data onto the public schema without changing its copy", () => {
    expect(parseJournalManifest({ ...manifest, private: "secret" })).toEqual(
      manifest,
    );
    expect(
      parseJournalSnapshot(
        {
          ...snapshot,
          private: "secret",
          entries: snapshot.entries.map((entry) => ({
            ...entry,
            private: "secret",
          })),
        },
        manifest,
      ),
    ).toEqual(snapshot);
  });

  test.each([
    null,
    [],
    { ...manifest, sha256: "short" },
    { ...manifest, url: "https://example.com/snapshot.json" },
    { ...manifest, url: `/journal/snapshot-${"b".repeat(64)}.json` },
    { ...manifest, entryCount: "3" },
    { ...manifest, entryCount: 0 },
    { ...manifest, entryCount: -1 },
    { ...manifest, entryCount: 1.5 },
    { ...manifest, entryCount: Infinity },
    { ...manifest, latestDate: "2026-02-30" },
    { ...manifest, sourceRevision: undefined },
    { ...manifest, sourceRevision: "short" },
  ])("rejects malformed manifests: %j", (value) => {
    expect(() => parseJournalManifest(value)).toThrow("Journal manifest");
  });

  test.each([
    null,
    [],
    { ...snapshot, schemaVersion: 1 },
    { ...snapshot, entries: null },
    { ...snapshot, entries: [] },
    { ...snapshot, sourceRevision: undefined },
    { ...snapshot, sourceRevision: "a".repeat(40) },
    { ...snapshot, entries: snapshot.entries.slice(1) },
    { ...snapshot, entries: [...snapshot.entries].reverse() },
    {
      ...snapshot,
      entries: [snapshot.entries[0], snapshot.entries[2], snapshot.entries[1]],
    },
    {
      ...snapshot,
      entries: [snapshot.entries[0], snapshot.entries[0], snapshot.entries[2]],
    },
  ])("rejects invalid snapshot metadata and ordering: %j", (value) => {
    expect(() => parseJournalSnapshot(value, manifest)).toThrow(
      "Journal snapshot",
    );
  });

  test.each([
    null,
    [],
    { ...snapshot.entries[1], date: "2026-02-30" },
    { ...snapshot.entries[1], date: "2026-9-07" },
    { ...snapshot.entries[1], tools: null },
    { ...snapshot.entries[1], tools: "React" },
    { ...snapshot.entries[1], tools: [null] },
    { ...snapshot.entries[1], tools: [" "] },
    { ...snapshot.entries[1], event: null },
    { ...snapshot.entries[1], event: [] },
    { ...snapshot.entries[1], event: " " },
  ])("validates every entry before creating render data: %j", (value) => {
    expect(() =>
      parseJournalSnapshot(
        {
          ...snapshot,
          entries: [snapshot.entries[0], value, snapshot.entries[2]],
        },
        manifest,
      ),
    ).toThrow("Journal snapshot.entries[1]");
  });

  test("accepts leap-day dates and the matching full source revision", () => {
    const sourceRevision = "b".repeat(40);
    const leapManifest = parseJournalManifest({
      ...manifest,
      entryCount: 1,
      latestDate: "2024-02-29",
      sourceRevision,
    });
    expect(
      parseJournalSnapshot(
        {
          ...snapshot,
          sourceRevision,
          entries: [{ ...snapshot.entries[0], date: leapManifest.latestDate }],
        },
        leapManifest,
      ).sourceRevision,
    ).toBe(sourceRevision);
  });
});
