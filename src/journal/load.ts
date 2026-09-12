import type { JournalSnapshot } from "./model";
import { parseJournalManifest, parseJournalSnapshot } from "./parse";

export async function loadJournalSnapshot(
  manifest: unknown,
  signal: AbortSignal,
): Promise<JournalSnapshot> {
  const expected = parseJournalManifest(manifest);
  const response = await fetch(expected.url, { signal });
  if (!response.ok) {
    throw new Error(`Journal request failed (${response.status})`);
  }
  const value: unknown = await response.json();
  return parseJournalSnapshot(value, expected);
}
