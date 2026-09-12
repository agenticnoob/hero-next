// @vitest-environment node
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  productionOrigin,
  verifyJournalDeployment,
} from "../scripts/verify-journal-deployment.mjs";

const roots: string[] = [];
const sourceRevision = "a".repeat(40);
const snapshot = {
  schemaVersion: 2,
  sourceRevision,
  entries: [{ date: "2026-09-12", tools: ["TypeScript"], event: "Published." }],
};

async function fixture(manifestOverrides = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "hero-deployment-test-"));
  roots.push(root);
  const serialized = JSON.stringify(snapshot);
  const sha256 = createHash("sha256").update(serialized).digest("hex");
  const manifest = {
    url: `/journal/snapshot-${sha256}.json`,
    sha256,
    entryCount: 1,
    latestDate: "2026-09-12",
    sourceRevision,
    ...manifestOverrides,
  };
  const manifestPath = path.join(root, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest));
  const fetchImpl = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(`<html><script>${manifest.url}</script></html>`, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
    )
    .mockResolvedValueOnce(
      new Response(serialized, {
        headers: { "Content-Type": "application/json" },
      }),
    );
  return { manifest, manifestPath, fetchImpl, serialized };
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
  vi.unstubAllEnvs();
});

describe("production journal readback", () => {
  test("checks the HTML reference and exact snapshot bytes without sending credentials", async () => {
    const { manifest, manifestPath, fetchImpl } = await fixture();
    vi.stubEnv("VERCEL_TOKEN", "private-ci-token");
    const result = await verifyJournalDeployment("https://hero.example.com/", {
      manifestPath,
      fetchImpl,
    });
    expect(result).toEqual({
      productionUrl: "https://hero.example.com",
      sourceRevision,
      entryCount: 1,
      latestDate: "2026-09-12",
      sha256: manifest.sha256,
    });
    expect(fetchImpl.mock.calls).toEqual([
      [
        "https://hero.example.com/",
        {
          headers: { Accept: "text/html", "Cache-Control": "no-cache" },
          redirect: "error",
          signal: expect.any(AbortSignal),
        },
      ],
      [
        `https://hero.example.com${manifest.url}`,
        {
          headers: { Accept: "application/json", "Cache-Control": "no-cache" },
          redirect: "error",
          signal: expect.any(AbortSignal),
        },
      ],
    ]);
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toContain(
      "private-ci-token",
    );
  });

  test.each([
    "http://hero.example.com",
    "https://user:token@hero.example.com",
    "https://hero.example.com/path",
    "https://hero.example.com?token=secret",
    "https://hero.example.com#fragment",
    "https://hero.example.com:8443",
    "https://localhost",
    "https://127.0.0.1",
    "https://[::1]",
    "https://host.local",
    " https://hero.example.com",
    "--token",
  ])("rejects a non-production origin: %s", (url) => {
    expect(() => productionOrigin(url)).toThrow("HTTPS production origin");
  });

  test("fails before fetching the snapshot when HTML belongs to an older deployment", async () => {
    const { manifestPath } = await fixture();
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response("<html>Old deployment</html>", {
        headers: { "Content-Type": "text/html" },
      }),
    );
    await expect(
      verifyJournalDeployment("https://hero.example.com", {
        manifestPath,
        fetchImpl,
      }),
    ).rejects.toThrow("HTML does not reference");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test("rejects modified snapshot bytes even when the JSON content looks valid", async () => {
    const { manifest, manifestPath, serialized } = await fixture();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(manifest.url, {
          headers: { "Content-Type": "text/html" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(`${serialized}\n`, {
          headers: { "Content-Type": "application/json" },
        }),
      );
    await expect(
      verifyJournalDeployment("https://hero.example.com", {
        manifestPath,
        fetchImpl,
      }),
    ).rejects.toThrow("SHA-256 does not match");
  });

  test.each([
    { sourceRevision: "b".repeat(40) },
    { entryCount: 2 },
    { latestDate: "2026-09-11" },
  ])("checks snapshot metadata against the manifest: %j", async (overrides) => {
    const { manifestPath, fetchImpl } = await fixture(overrides);
    await expect(
      verifyJournalDeployment("https://hero.example.com", {
        manifestPath,
        fetchImpl,
      }),
    ).rejects.toThrow("does not match its manifest");
  });

  test("rejects an unversioned local export before any public request", async () => {
    const { manifestPath, fetchImpl } = await fixture({ sourceRevision: null });
    await expect(
      verifyJournalDeployment("https://hero.example.com", {
        manifestPath,
        fetchImpl,
      }),
    ).rejects.toThrow("exact source commit SHA");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test("fails on production protection or an HTTP error", async () => {
    const { manifestPath } = await fixture();
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 401 }));
    await expect(
      verifyJournalDeployment("https://hero.example.com", {
        manifestPath,
        fetchImpl,
      }),
    ).rejects.toThrow("HTTP 401");
  });
});
