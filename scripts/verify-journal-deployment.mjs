import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseJournalManifest,
  parseJournalSnapshot,
} from "../src/journal/parse.ts";

export function productionOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Expected a public HTTPS production origin");
  }
  if (
    typeof value !== "string" ||
    value !== value.trim() ||
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(
      url.hostname,
    ) ||
    /\.(?:localhost|local|internal|test|invalid)$/i.test(url.hostname)
  ) {
    throw new Error("Expected a public HTTPS production origin");
  }
  return url.origin;
}

/**
 * @param {string} productionUrl
 * @param {{ manifestPath?: string | URL, fetchImpl?: typeof fetch }} [options]
 */
export async function verifyJournalDeployment(
  productionUrl,
  {
    manifestPath = new URL("../.journal/manifest.json", import.meta.url),
    fetchImpl = fetch,
  } = {},
) {
  const origin = productionOrigin(productionUrl);
  const manifest = parseJournalManifest(
    JSON.parse(await readFile(manifestPath, "utf8")),
  );
  if (!manifest.sourceRevision) {
    throw new Error("Production journal requires an exact source commit SHA");
  }
  const request = async (url, accept) => {
    const response = await fetchImpl(url, {
      headers: { Accept: accept, "Cache-Control": "no-cache" },
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(
        `Production readback failed with HTTP ${response.status}`,
      );
    }
    return response;
  };
  const htmlResponse = await request(`${origin}/`, "text/html");
  if (!htmlResponse.headers.get("content-type")?.includes("text/html")) {
    throw new Error("Production page did not return HTML");
  }
  const html = await htmlResponse.text();
  if (!html.replaceAll("\\/", "/").includes(manifest.url)) {
    throw new Error("Production HTML does not reference the expected snapshot");
  }
  const snapshotResponse = await request(
    `${origin}${manifest.url}`,
    "application/json",
  );
  if (
    !snapshotResponse.headers.get("content-type")?.includes("application/json")
  ) {
    throw new Error("Production snapshot did not return JSON");
  }
  const bytes = Buffer.from(await snapshotResponse.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== manifest.sha256) {
    throw new Error("Production snapshot SHA-256 does not match the manifest");
  }
  parseJournalSnapshot(JSON.parse(bytes.toString("utf8")), manifest);
  return {
    productionUrl: origin,
    sourceRevision: manifest.sourceRevision,
    entryCount: manifest.entryCount,
    latestDate: manifest.latestDate,
    sha256,
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    if (process.argv.length !== 3) {
      throw new Error(
        "Usage: node scripts/verify-journal-deployment.mjs https://production.example.com",
      );
    }
    console.log(JSON.stringify(await verifyJournalDeployment(process.argv[2])));
  } catch (cause) {
    console.error(
      cause instanceof Error ? cause.message : "Production readback failed",
    );
    process.exitCode = 1;
  }
}
