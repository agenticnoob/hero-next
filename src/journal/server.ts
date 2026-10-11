import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import type { JournalManifest, JournalSnapshot } from "./model";
import { parseJournalManifest, parseJournalSnapshot } from "./parse";

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

export async function readJournalSnapshot(): Promise<JournalSnapshot> {
  const manifest = await readJournalManifest();
  const filename = path.join(process.cwd(), "public", manifest.url.slice(1));
  const raw = await readFile(filename, "utf8");
  if (createHash("sha256").update(raw).digest("hex") !== manifest.sha256)
    throw new Error("Journal snapshot checksum does not match its manifest");
  const value: unknown = JSON.parse(raw);
  return parseJournalSnapshot(value, manifest);
}
