// @vitest-environment node
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  productionOrigin,
  captureProductionBaseline,
  verifyReadyJournalDeployment,
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

const websiteSha = "c".repeat(40);
const previousWebsiteSha = "b".repeat(40);
const productionUrl = "https://hero.example.com";

function htmlResponse(text: string, sha?: string) {
  return new Response(text, {
    headers: {
      "Content-Type": "text/html",
      ...(sha ? { "X-Hero-Website-Sha": sha } : {}),
    },
  });
}

function clock() {
  let time = 0;
  const sleep = vi.fn(async (ms: number) => {
    time += ms;
  });
  return {
    now: () => time,
    sleep,
    advance: (ms: number) => {
      time += ms;
    },
  };
}

function receipt(deadlineAt = 120_000) {
  return {
    productionUrl,
    deploymentId: "dpl_expected",
    websiteSha,
    readyState: "READY",
    aliasMatched: true,
    deadlineAt,
  };
}

describe("bounded version-aware public readback", () => {
  test("retries a known previous commit even when its journal is unchanged", async () => {
    const { manifest, manifestPath, serialized } = await fixture();
    const oldHtml = `<html>${manifest.url}</html>`;
    const baseline = await captureProductionBaseline(productionUrl, {
      fetchImpl: vi
        .fn()
        .mockResolvedValue(htmlResponse(oldHtml, previousWebsiteSha)),
    });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(htmlResponse(oldHtml, previousWebsiteSha))
      .mockResolvedValueOnce(htmlResponse(oldHtml, websiteSha))
      .mockResolvedValueOnce(
        new Response(serialized, {
          headers: { "Content-Type": "application/json" },
        }),
      );
    const time = clock();
    const onRetry = vi.fn();
    const result = await verifyReadyJournalDeployment(
      productionUrl,
      receipt(),
      {
        manifestPath,
        baseline,
        fetchImpl,
        ...time,
        onRetry,
      },
    );
    expect(result.websiteSha).toBe(websiteSha);
    expect(result.deploymentId).toBe("dpl_expected");
    expect(time.sleep.mock.calls).toEqual([[1_000]]);
    expect(onRetry.mock.calls[0][0].code).toBe("KNOWN_PREVIOUS_RESPONSE");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  test("recognizes the exact captured legacy HTML without a revision header", async () => {
    const { manifest, manifestPath, serialized } = await fixture();
    const legacyHtml = `<html>/journal/snapshot-${"d".repeat(64)}.json</html>`;
    const baseline = await captureProductionBaseline(productionUrl, {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse(legacyHtml)),
    });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(htmlResponse(legacyHtml))
      .mockResolvedValueOnce(htmlResponse(manifest.url, websiteSha))
      .mockResolvedValueOnce(
        new Response(serialized, {
          headers: { "Content-Type": "application/json" },
        }),
      );
    const time = clock();
    await verifyReadyJournalDeployment(productionUrl, receipt(), {
      manifestPath,
      baseline,
      fetchImpl,
      ...time,
    });
    expect(time.sleep).toHaveBeenCalledOnce();
  });

  test("recognizes the exact previous journal HTML when the website commit is unchanged", async () => {
    const { manifest, manifestPath, serialized } = await fixture();
    const oldHtml = `<html>/journal/snapshot-${"d".repeat(64)}.json</html>`;
    const baseline = await captureProductionBaseline(productionUrl, {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse(oldHtml, websiteSha)),
    });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(htmlResponse(oldHtml, websiteSha))
      .mockResolvedValueOnce(htmlResponse(manifest.url, websiteSha))
      .mockResolvedValueOnce(
        new Response(serialized, {
          headers: { "Content-Type": "application/json" },
        }),
      );
    const time = clock();
    await verifyReadyJournalDeployment(productionUrl, receipt(), {
      manifestPath,
      baseline,
      fetchImpl,
      ...time,
    });
    expect(time.sleep.mock.calls).toEqual([[1_000]]);
  });

  test("never classifies a captured login page as a known previous application response", async () => {
    const loginHtml = "<html>Login page</html>";
    const baseline = await captureProductionBaseline(productionUrl, {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse(loginHtml)),
    });
    expect(baseline.available).toBe(false);
    const { manifestPath } = await fixture();
    const time = clock();
    await expect(
      verifyReadyJournalDeployment(productionUrl, receipt(), {
        manifestPath,
        baseline,
        fetchImpl: vi.fn().mockResolvedValue(htmlResponse(loginHtml)),
        ...time,
      }),
    ).rejects.toMatchObject({ code: "WEBSITE_IDENTITY" });
    expect(time.sleep).not.toHaveBeenCalled();
  });

  test("does not let identical HTML hide an unknown website revision", async () => {
    const { manifest, manifestPath } = await fixture();
    const baseline = await captureProductionBaseline(productionUrl, {
      fetchImpl: vi.fn().mockResolvedValue(htmlResponse(manifest.url)),
    });
    const time = clock();
    await expect(
      verifyReadyJournalDeployment(productionUrl, receipt(), {
        manifestPath,
        baseline,
        fetchImpl: vi
          .fn()
          .mockResolvedValue(htmlResponse(manifest.url, "d".repeat(40))),
        ...time,
      }),
    ).rejects.toMatchObject({ code: "WEBSITE_IDENTITY" });
    expect(time.sleep).not.toHaveBeenCalled();
  });

  test.each([
    ["<html>Login page</html>", undefined],
    ["<html>Unrelated deployment</html>", "d".repeat(40)],
  ])(
    "fails immediately for an unidentified or unknown version",
    async (html, sha) => {
      const { manifestPath } = await fixture();
      const fetchImpl = vi.fn().mockResolvedValue(htmlResponse(html, sha));
      const time = clock();
      await expect(
        verifyReadyJournalDeployment(productionUrl, receipt(), {
          manifestPath,
          fetchImpl,
          ...time,
        }),
      ).rejects.toMatchObject({ code: "WEBSITE_IDENTITY" });
      expect(fetchImpl).toHaveBeenCalledOnce();
      expect(time.sleep).not.toHaveBeenCalled();
    },
  );

  test("does not retry a real HTML reference error from the new commit", async () => {
    const { manifestPath } = await fixture();
    const baseline = await captureProductionBaseline(productionUrl, {
      fetchImpl: vi
        .fn()
        .mockResolvedValue(
          htmlResponse(`/journal/snapshot-${"d".repeat(64)}.json`, websiteSha),
        ),
    });
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        htmlResponse("<html>Wrong snapshot</html>", websiteSha),
      );
    const time = clock();
    await expect(
      verifyReadyJournalDeployment(productionUrl, receipt(), {
        manifestPath,
        baseline,
        fetchImpl,
        ...time,
      }),
    ).rejects.toMatchObject({ code: "HTML_REFERENCE" });
    expect(time.sleep).not.toHaveBeenCalled();
  });

  test("does not retry checksum or schema mismatches from the new commit", async () => {
    for (const overrides of [{}, { sourceRevision: "e".repeat(40) }]) {
      const { manifest, manifestPath, serialized } = await fixture(overrides);
      const body = Object.keys(overrides).length
        ? serialized
        : serialized + "\n";
      const fetchImpl = vi
        .fn()
        .mockResolvedValueOnce(htmlResponse(manifest.url, websiteSha))
        .mockResolvedValueOnce(
          new Response(body, {
            headers: { "Content-Type": "application/json" },
          }),
        );
      const time = clock();
      await expect(
        verifyReadyJournalDeployment(productionUrl, receipt(), {
          manifestPath,
          fetchImpl,
          ...time,
        }),
      ).rejects.toMatchObject({ retryable: false });
      expect(time.sleep).not.toHaveBeenCalled();
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    }
  });

  test.each([401, 403, 404])(
    "does not retry permanent public HTTP %s",
    async (status) => {
      const { manifestPath } = await fixture();
      const fetchImpl = vi.fn().mockResolvedValue(new Response("", { status }));
      const time = clock();
      await expect(
        verifyReadyJournalDeployment(productionUrl, receipt(), {
          manifestPath,
          fetchImpl,
          ...time,
        }),
      ).rejects.toThrow(`HTTP ${status}`);
      expect(time.sleep).not.toHaveBeenCalled();
    },
  );

  test("recovers from a 503 and a DNS retry without weakening content checks", async () => {
    const { manifest, manifestPath, serialized } = await fixture();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("temporary", { status: 503 }))
      .mockRejectedValueOnce(
        new TypeError("fetch failed", { cause: { code: "EAI_AGAIN" } }),
      )
      .mockResolvedValueOnce(htmlResponse(manifest.url, websiteSha))
      .mockResolvedValueOnce(
        new Response(serialized, {
          headers: { "Content-Type": "application/json" },
        }),
      );
    const time = clock();
    await verifyReadyJournalDeployment(productionUrl, receipt(), {
      manifestPath,
      fetchImpl,
      ...time,
    });
    expect(time.sleep.mock.calls).toEqual([[1_000], [2_000]]);
  });

  test("honors Retry-After and never waits past the shared deadline", async () => {
    const { manifest, manifestPath, serialized } = await fixture();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("", { status: 429, headers: { "Retry-After": "5" } }),
      )
      .mockResolvedValueOnce(htmlResponse(manifest.url, websiteSha))
      .mockResolvedValueOnce(
        new Response(serialized, {
          headers: { "Content-Type": "application/json" },
        }),
      );
    const time = clock();
    await verifyReadyJournalDeployment(productionUrl, receipt(), {
      manifestPath,
      fetchImpl,
      ...time,
    });
    expect(time.sleep.mock.calls).toEqual([[5_000]]);
    const exhausted = vi
      .fn()
      .mockResolvedValue(
        new Response("", { status: 429, headers: { "Retry-After": "600" } }),
      );
    await expect(
      verifyReadyJournalDeployment(productionUrl, receipt(), {
        manifestPath,
        fetchImpl: exhausted,
        ...time,
      }),
    ).rejects.toMatchObject({ code: "VERIFICATION_TIMEOUT" });
    expect(exhausted).toHaveBeenCalledOnce();
  });

  test("a previous version that never converges still fails within budget", async () => {
    const { manifestPath } = await fixture();
    const oldHtml = "<html>Previous deployment</html>";
    const baseline = await captureProductionBaseline(productionUrl, {
      fetchImpl: vi
        .fn()
        .mockResolvedValue(htmlResponse(oldHtml, previousWebsiteSha)),
    });
    const fetchImpl = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(htmlResponse(oldHtml, previousWebsiteSha)),
      );
    const time = clock();
    await expect(
      verifyReadyJournalDeployment(productionUrl, receipt(3_500), {
        manifestPath,
        baseline,
        fetchImpl,
        ...time,
      }),
    ).rejects.toMatchObject({
      code: "VERIFICATION_TIMEOUT",
      diagnostics: { attempts: 3, lastCode: "KNOWN_PREVIOUS_RESPONSE" },
    });
    expect(time.now()).toBeLessThanOrEqual(3_500);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  test("does not make another request after the current request exhausts the budget", async () => {
    const { manifest, manifestPath } = await fixture();
    const time = clock();
    const fetchImpl = vi.fn().mockImplementation(async () => {
      time.advance(120_001);
      return htmlResponse(manifest.url, websiteSha);
    });
    await expect(
      verifyReadyJournalDeployment(productionUrl, receipt(), {
        manifestPath,
        fetchImpl,
        ...time,
      }),
    ).rejects.toMatchObject({ code: "VERIFICATION_TIMEOUT" });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  test("does not treat redirects or arbitrary fetch failures as transient", async () => {
    const { manifestPath } = await fixture();
    const fetchImpl = vi.fn().mockRejectedValue(
      new TypeError("fetch failed", {
        cause: new Error("unexpected redirect"),
      }),
    );
    const time = clock();
    await expect(
      verifyReadyJournalDeployment(productionUrl, receipt(), {
        manifestPath,
        fetchImpl,
        ...time,
      }),
    ).rejects.toMatchObject({ code: "PUBLIC_NETWORK", retryable: false });
    expect(time.sleep).not.toHaveBeenCalled();
  });

  test("records only safe response diagnostics, even if the baseline is unavailable", async () => {
    const baseline = await captureProductionBaseline(productionUrl, {
      fetchImpl: vi.fn().mockResolvedValue(
        new Response("private response", {
          status: 403,
          headers: { "Set-Cookie": "private-cookie" },
        }),
      ),
    });
    expect(baseline.available).toBe(false);
    expect(JSON.stringify(baseline)).not.toContain("private response");
    expect(JSON.stringify(baseline)).not.toContain("private-cookie");
    const { manifestPath } = await fixture();
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(htmlResponse("<html>Unknown</html>"));
    await expect(
      verifyReadyJournalDeployment(productionUrl, receipt(), {
        baseline,
        manifestPath,
        fetchImpl,
        ...clock(),
      }),
    ).rejects.toMatchObject({ code: "WEBSITE_IDENTITY" });
  });

  test.each([
    { deploymentId: "not-a-deployment" },
    { websiteSha: "invalid" },
    { productionUrl: "https://other.example.com" },
    { aliasMatched: false },
    { deadlineAt: 120_001 },
  ])(
    "rejects a malformed readiness receipt before making public requests",
    async (overrides) => {
      const fetchImpl = vi.fn();
      await expect(
        verifyReadyJournalDeployment(
          productionUrl,
          { ...receipt(), ...overrides },
          { fetchImpl, ...clock() },
        ),
      ).rejects.toThrow("readiness receipt");
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );
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
