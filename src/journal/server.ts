import { readFile } from "node:fs/promises";
import path from "node:path";
import type { JournalManifest } from "./model";
import { parseJournalManifest } from "./parse";

export async function readJournalManifest(): Promise<JournalManifest> {
  const filename = path.join(process.cwd(), ".journal/manifest.json");
  let raw: string;
  try {
    raw = await readFile(filename, "utf8");
  } catch (cause) {
    throw new Error(
      "Journal snapshot missing. Run npm run sync:journal -- --source /path/to/vibe-journal-pipeline/data before starting or building Hero Next.",
      { cause },
    );
  }
  const value: unknown = JSON.parse(raw);
  return parseJournalManifest(value);
}
