// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { readJournalManifest } from "../src/journal/server";

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
