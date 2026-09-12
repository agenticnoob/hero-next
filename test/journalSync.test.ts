// @vitest-environment node
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { publicJournal, syncJournal } from "../scripts/sync-journal.mjs";

const roots: string[] = [];
const record = (date: string) => ({
  date,
  session_count: 1,
  turn_count: 10,
  skills_touched: [
    {
      id: "typescript",
      name: "TypeScript",
      category: "language",
      count: 1,
      secret: "private",
    },
  ],
  body: {
    今天用了啥: ["TypeScript"],
    干了啥: ["Built the journal."],
    可写进简历的一件事: "Shipped.",
    private: "secret",
  },
  timeline_event: "ignored",
  private: "secret",
});
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("journal publication", () => {
  test("exports only the matched date, tool names and Timeline summary", () => {
    const result = publicJournal(
      record("2026-09-08"),
      "2026-09-08.json",
      "Timeline summary",
    );
    expect(result).not.toHaveProperty("timeline_event");
    expect(JSON.stringify(result)).not.toContain("private");
    expect(result).toEqual({
      date: "2026-09-08",
      tools: ["TypeScript"],
      event: "Timeline summary",
    });
    expect(result).not.toHaveProperty("body");
  });
  test.each(["—", "–"])(
    "removes descriptions separated by a spaced %s without changing tool names",
    (separator) => {
      const result = publicJournal(
        {
          ...record("2026-05-19"),
          body: {
            今天用了啥: [
              `agent-workspace ${separator} 维护 /Users/example/private/workflow 文档。`,
              `React\t${separator}\tUpdated components`,
              "React: Updated components",
              "TypeScript：Checked types",
              "rust-analyzer",
              "Node.js",
              "D3–geo",
              "Tool—Name",
            ],
          },
        },
        "2026-05-19.json",
        "Timeline summary",
      );
      expect(result.tools).toEqual([
        "agent-workspace",
        "React",
        "TypeScript",
        "rust-analyzer",
        "Node.js",
        "D3–geo",
        "Tool—Name",
      ]);
      expect(JSON.stringify(result)).not.toContain("/Users/");
      expect(JSON.stringify(result)).not.toContain("Updated components");
    },
  );
  test("rejects invalid dates, filename mismatches and malformed tools", () => {
    expect(() =>
      publicJournal(record("2026-02-30"), "2026-02-30.json", "event"),
    ).toThrow();
    expect(() =>
      publicJournal(record("2026-09-08"), "2026-09-07.json", "event"),
    ).toThrow();
    expect(() =>
      publicJournal(
        { ...record("2026-09-08"), body: { 今天用了啥: false } },
        "2026-09-08.json",
        "event",
      ),
    ).toThrow();
  });
  test("publishes deterministically, newest first, retaining the prior snapshot on failure", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "hero-journal-test-"));
    roots.push(root);
    const source = path.join(root, "source");
    const destination = path.join(root, "site");
    await mkdir(path.join(source, "journal"), { recursive: true });
    for (const date of ["2026-09-01", "2026-09-08"])
      await writeFile(
        path.join(source, "journal", `${date}.json`),
        JSON.stringify({
          ...record(date),
          body: { ...record(date).body, 今天用了啥: [`Tool-${date}`] },
        }),
      );
    await writeFile(
      path.join(source, "TIMELINE.json"),
      JSON.stringify({
        timeline: [
          { date: "2026-09-01", event: "Older event" },
          { date: "2026-09-08", event: "Newest event" },
        ],
      }),
    );
    const first = await syncJournal({ source, destination, revision: null });
    const second = await syncJournal({ source, destination, revision: null });
    expect(second).toEqual(first);
    const snapshot = JSON.parse(
      await readFile(path.join(destination, "public", first.url), "utf8"),
    );
    expect(
      snapshot.entries.map((entry: { date: string }) => entry.date),
    ).toEqual(["2026-09-08", "2026-09-01"]);
    expect(snapshot.entries).toEqual([
      { date: "2026-09-08", tools: ["Tool-2026-09-08"], event: "Newest event" },
      { date: "2026-09-01", tools: ["Tool-2026-09-01"], event: "Older event" },
    ]);
    await writeFile(
      path.join(source, "TIMELINE.json"),
      JSON.stringify({
        timeline: [{ date: "2026-09-09", event: "No matching day" }],
      }),
    );
    await expect(
      syncJournal({ source, destination, revision: null }),
    ).rejects.toThrow();
    expect(
      JSON.parse(
        await readFile(
          path.join(destination, ".journal/manifest.json"),
          "utf8",
        ),
      ),
    ).toEqual(first);
  });
});
