import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

function record(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label}: expected an object`);
  }
  return value;
}

function string(value, label) {
  if (typeof value !== "string") throw new Error(`${label}: expected text`);
  return value.trim();
}

function strings(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label}: expected a text array`);
  return value.map((item, index) => string(item, `${label}[${index}]`));
}

// Explicitly project public fields. Never copy the data directory or arbitrary keys.
export function publicJournal(value, filename, event) {
  const input = record(value, filename);
  const date = string(input.date, `${filename}.date`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date ||
    filename !== `${date}.json`
  ) {
    throw new Error(`${filename}: invalid date or filename mismatch`);
  }
  const body = record(input.body, `${filename}.body`);
  return {
    date,
    tools: [
      ...new Set(
        strings(body.今天用了啥, `${filename}.body.今天用了啥`)
          .map((tool) => tool.split(/[：:]|\s+[—–]\s+/u)[0].trim())
          .filter(Boolean),
      ),
    ],
    event: string(event, `${filename}.timeline.event`),
  };
}

async function atomicWrite(filename, content) {
  await mkdir(path.dirname(filename), { recursive: true });
  const temporary = `${filename}.${process.pid}.tmp`;
  await writeFile(temporary, content);
  await rename(temporary, filename);
}

export async function syncJournal({ source, destination, revision = null }) {
  if (revision !== null && !/^[a-f0-9]{40}$/.test(revision)) {
    throw new Error("revision must be a full Git commit SHA");
  }
  const directory = path.join(source, "journal");
  const files = (await readdir(directory, { withFileTypes: true })).filter(
    (entry) => entry.name.endsWith(".json"),
  );
  if (!files.length)
    throw new Error("No journal JSON files found; refusing an empty snapshot");
  const journals = await Promise.all(
    files.map(async (entry) => {
      if (!entry.isFile())
        throw new Error(`${entry.name}: expected a regular file`);
      return publicJournal(
        JSON.parse(await readFile(path.join(directory, entry.name), "utf8")),
        entry.name,
        "",
      );
    }),
  );
  const timeline = record(
    JSON.parse(await readFile(path.join(source, "TIMELINE.json"), "utf8")),
    "TIMELINE.json",
  );
  if (!Array.isArray(timeline.timeline))
    throw new Error("TIMELINE.json.timeline: expected an array");
  const byDate = new Map(journals.map((entry) => [entry.date, entry]));
  const dates = new Set();
  const entries = [];
  for (const raw of timeline.timeline) {
    const item = record(raw, "timeline entry");
    const date = string(item.date, "timeline.date");
    if (dates.has(date)) throw new Error(`Duplicate timeline date: ${date}`);
    dates.add(date);
    const journal = byDate.get(date);
    if (!journal)
      throw new Error(`Timeline date ${date} has no matching journal`);
    const event = string(item.event, `${date}.event`);
    if (event) entries.push({ ...journal, event });
  }
  if (!entries.length)
    throw new Error("No timeline events found; refusing an empty snapshot");
  entries.sort((a, b) => b.date.localeCompare(a.date));
  const serialized = JSON.stringify({
    schemaVersion: 2,
    sourceRevision: revision,
    entries,
  });
  const hash = createHash("sha256").update(serialized).digest("hex");
  const url = `/journal/snapshot-${hash}.json`;
  const manifest = {
    url,
    sha256: hash,
    entryCount: entries.length,
    latestDate: entries[0].date,
    sourceRevision: revision,
  };
  // Publish the manifest last: a failed validation/write leaves the previous snapshot usable.
  await atomicWrite(path.join(destination, "public", url), serialized);
  await atomicWrite(
    path.join(destination, ".journal/manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  return manifest;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const { values } = parseArgs({
    options: {
      source: { type: "string" },
      revision: { type: "string" },
    },
  });
  const source = values.source ?? process.env.JOURNAL_SOURCE_DIR;
  if (!source)
    throw new Error(
      "Use npm run sync:journal -- --source /path/to/vibe-journal-pipeline/data",
    );
  const manifest = await syncJournal({
    source: path.resolve(source),
    destination: fileURLToPath(new URL("../", import.meta.url)),
    revision: values.revision ?? null,
  });
  console.log(
    `Journal snapshot: ${manifest.entryCount} days; latest ${manifest.latestDate}; sha256 ${manifest.sha256}`,
  );
}
