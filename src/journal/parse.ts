import type { JournalEntry, JournalManifest, JournalSnapshot } from "./model";

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label}: expected an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label}: expected non-empty text`);
  }
  return value;
}

function date(value: unknown, label: string): string {
  const result = text(value, label);
  const timestamp = Date.parse(`${result}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(result) ||
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== result
  ) {
    throw new Error(`${label}: expected a valid YYYY-MM-DD date`);
  }
  return result;
}

function revision(value: unknown, label: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || !/^[a-f0-9]{40}$/.test(value)) {
    throw new Error(`${label}: expected a full Git commit SHA or null`);
  }
  return value;
}

export function parseJournalManifest(value: unknown): JournalManifest {
  const input = record(value, "Journal manifest");
  const sha256 = text(input.sha256, "Journal manifest.sha256");
  if (!/^[a-f0-9]{64}$/.test(sha256)) {
    throw new Error("Journal manifest.sha256: expected a SHA-256 digest");
  }
  const url = text(input.url, "Journal manifest.url");
  if (url !== `/journal/snapshot-${sha256}.json`) {
    throw new Error(
      "Journal manifest.url: expected the content-hashed snapshot path",
    );
  }
  const { entryCount } = input;
  if (
    typeof entryCount !== "number" ||
    !Number.isSafeInteger(entryCount) ||
    entryCount <= 0
  ) {
    throw new Error("Journal manifest.entryCount: expected a positive integer");
  }
  return {
    url,
    sha256,
    entryCount,
    latestDate: date(input.latestDate, "Journal manifest.latestDate"),
    sourceRevision: revision(
      input.sourceRevision,
      "Journal manifest.sourceRevision",
    ),
  };
}

function entry(value: unknown, index: number): JournalEntry {
  const label = `Journal snapshot.entries[${index}]`;
  const input = record(value, label);
  if (!Array.isArray(input.tools)) {
    throw new Error(`${label}.tools: expected a text array`);
  }
  return {
    date: date(input.date, `${label}.date`),
    tools: input.tools.map((tool: unknown, toolIndex: number) =>
      text(tool, `${label}.tools[${toolIndex}]`),
    ),
    event: text(input.event, `${label}.event`),
  };
}

export function parseJournalSnapshot(
  value: unknown,
  manifest: JournalManifest,
): JournalSnapshot {
  const input = record(value, "Journal snapshot");
  if (input.schemaVersion !== 2) {
    throw new Error("Journal snapshot.schemaVersion: expected version 2");
  }
  if (!Array.isArray(input.entries)) {
    throw new Error("Journal snapshot.entries: expected an array");
  }
  const sourceRevision = revision(
    input.sourceRevision,
    "Journal snapshot.sourceRevision",
  );
  const entries = input.entries.map(entry);
  if (
    entries.length !== manifest.entryCount ||
    entries[0]?.date !== manifest.latestDate ||
    sourceRevision !== manifest.sourceRevision
  ) {
    throw new Error("Journal snapshot does not match its manifest");
  }
  for (let index = 1; index < entries.length; index++) {
    if (entries[index].date >= entries[index - 1].date) {
      throw new Error(
        "Journal snapshot.entries: dates must be unique and newest first",
      );
    }
  }
  return { schemaVersion: 2, sourceRevision, entries };
}
