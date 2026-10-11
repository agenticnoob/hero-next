// @vitest-environment node
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  readJournalManifest,
  readJournalSnapshot,
} from "../src/journal/server";

vi.mock("node:fs/promises", () => ({ readFile: vi.fn() }));

const manifest = {
  url: `/journal/snapshot-${"a".repeat(64)}.json`,
  sha256: "a".repeat(64),
  entryCount: 1,
  latestDate: "2026-09-08",
  sourceRevision: null,
};

beforeEach(() => {
  vi.mocked(readFile).mockReset();
});

describe("journal public snapshot boundary", () => {
  const snapshot = {
    schemaVersion: 2,
    sourceRevision: null,
    entries: [
      { date: "2026-09-08", tools: ["TypeScript"], event: "公开记录。" },
    ],
    privateNotes: "must not be exported",
  };
  const raw = JSON.stringify(snapshot);
  const sha256 = createHash("sha256").update(raw).digest("hex");
  const publication = {
    ...manifest,
    sha256,
    url: `/journal/snapshot-${sha256}.json`,
  };

  test("reads only the manifest-selected public snapshot and strips extra fields", async () => {
    vi.mocked(readFile)
      .mockResolvedValueOnce(JSON.stringify(publication))
      .mockResolvedValueOnce(raw);
    await expect(readJournalSnapshot()).resolves.toEqual({
      schemaVersion: 2,
      sourceRevision: null,
      entries: snapshot.entries,
    });
    expect(vi.mocked(readFile).mock.calls[1][0]).toBe(
      `${process.cwd()}/public${publication.url}`,
    );
  });

  test("rejects a snapshot whose bytes differ from the publication hash", async () => {
    vi.mocked(readFile)
      .mockResolvedValueOnce(JSON.stringify(publication))
      .mockResolvedValueOnce(`${raw}\n`);
    await expect(readJournalSnapshot()).rejects.toThrow("checksum");
  });

  test("rejects a correctly hashed snapshot with inconsistent manifest metadata", async () => {
    vi.mocked(readFile)
      .mockResolvedValueOnce(JSON.stringify({ ...publication, entryCount: 2 }))
      .mockResolvedValueOnce(raw);
    await expect(readJournalSnapshot()).rejects.toThrow("does not match");
  });

  test("propagates a missing public snapshot rather than hiding incomplete publication", async () => {
    const cause = new Error("ENOENT");
    vi.mocked(readFile)
      .mockResolvedValueOnce(JSON.stringify(publication))
      .mockRejectedValueOnce(cause);
    await expect(readJournalSnapshot()).rejects.toBe(cause);
  });
});

describe("journal manifest boundary", () => {
  test("reads a validated publication manifest", async () => {
    vi.mocked(readFile).mockResolvedValue(JSON.stringify(manifest));
    await expect(readJournalManifest()).resolves.toEqual(manifest);
  });

  test("rejects malformed metadata before passing it to the client", async () => {
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ ...manifest, entryCount: "1" }),
    );
    await expect(readJournalManifest()).rejects.toThrow("entryCount");
  });

  test("keeps missing-file guidance and its original cause", async () => {
    const cause = new Error("ENOENT");
    vi.mocked(readFile).mockRejectedValue(cause);
    await expect(readJournalManifest()).rejects.toMatchObject({
      message: expect.stringContaining("npm run sync:journal"),
      cause,
    });
  });
});
