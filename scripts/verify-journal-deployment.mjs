import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import {
  parseJournalManifest,
  parseJournalSnapshot,
} from "../src/journal/parse.ts";

export const verificationBudgetMs = 120_000;
const transientStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);
const transientNetworkCodes = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_SOCKET",
]);

export class DeploymentReadbackError extends Error {
  constructor(
    code,
    message,
    { retryable = false, diagnostics = {}, retryAfterMs = 0 } = {},
  ) {
    super(message);
    this.name = "DeploymentReadbackError";
    this.code = code;
    this.retryable = retryable;
    this.diagnostics = diagnostics;
    this.retryAfterMs = retryAfterMs;
  }
}

export function transientNetworkError(cause) {
  return (
    cause?.name === "TimeoutError" ||
    cause?.name === "AbortError" ||
    transientNetworkCodes.has(cause?.cause?.code ?? cause?.code)
  );
}

/**
 * @template T
 * @param {() => Promise<T>} action
 * @param {{deadlineAt: number, now?: () => number, sleep?: (ms: number) => Promise<void>, onRetry?: (event: object) => void}} options
 */
export async function retryUntilDeadline(
  action,
  {
    deadlineAt,
    now = Date.now,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    onRetry = () => {},
  },
) {
  let attempt = 0;
  let lastCode = null;
  let lastResponse = {};
  const expired = () =>
    new DeploymentReadbackError(
      "VERIFICATION_TIMEOUT",
      "Production verification deadline exceeded",
      {
        diagnostics: {
          attempts: attempt,
          lastCode,
          lastResponse,
          deadlineAt,
          checkedAt: now(),
        },
      },
    );
  while (now() < deadlineAt) {
    attempt += 1;
    try {
      const result = await action();
      if (now() >= deadlineAt) throw expired();
      return result;
    } catch (cause) {
      if (!(cause instanceof DeploymentReadbackError) || !cause.retryable)
        throw cause;
      lastCode = cause.code;
      lastResponse = cause.diagnostics;
      const delayMs = Math.max(
        cause.retryAfterMs,
        Math.min(1_000 * 2 ** Math.min(attempt - 1, 4), 10_000),
      );
      if (now() + delayMs >= deadlineAt) throw expired();
      onRetry({
        attempt,
        code: cause.code,
        delayMs,
        remainingMs: deadlineAt - now(),
        ...cause.diagnostics,
      });
      await sleep(delayMs);
    }
  }
  throw expired();
}

export function requestSignal(deadlineAt, now = Date.now) {
  const remaining = deadlineAt === undefined ? 15_000 : deadlineAt - now();
  if (remaining <= 0)
    throw new DeploymentReadbackError(
      "VERIFICATION_TIMEOUT",
      "Production verification deadline exceeded",
    );
  return AbortSignal.timeout(
    Math.max(1, Math.min(15_000, Math.floor(remaining))),
  );
}

export function responseDiagnostics(url, response) {
  const names = [
    "content-type",
    "cache-control",
    "date",
    "x-vercel-cache",
    "x-nextjs-cache",
    "x-vercel-id",
    "age",
    "etag",
  ];
  return {
    url,
    status: response.status,
    observedAt: new Date().toISOString(),
    headers: Object.fromEntries(
      names.flatMap((name) => {
        const value = response.headers.get(name);
        return value === null ? [] : [[name, value.slice(0, 256)]];
      }),
    ),
  };
}

export function retryAfterMs(response, now = Date.now) {
  const value = response.headers.get("retry-after") ?? "";
  if (/^\d+$/.test(value)) return Number(value) * 1_000;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - now()) : 0;
}

async function responseBytes(response, url) {
  try {
    return Buffer.from(await response.arrayBuffer());
  } catch (cause) {
    throw new DeploymentReadbackError(
      "PUBLIC_BODY_NETWORK",
      "Production response body could not be read",
      {
        retryable: transientNetworkError(cause),
        diagnostics: responseDiagnostics(url, response),
      },
    );
  }
}

function snapshotReferences(html) {
  return [
    ...new Set(
      html
        .replaceAll("\\/", "/")
        .match(/\/journal\/snapshot-[a-f0-9]{64}\.json/g) ?? [],
    ),
  ].slice(0, 8);
}

async function publicRequest(url, accept, { fetchImpl, deadlineAt, now }) {
  let response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: accept, "Cache-Control": "no-cache" },
      redirect: "error",
      signal: requestSignal(deadlineAt, now),
    });
  } catch (cause) {
    if (cause instanceof DeploymentReadbackError) throw cause;
    throw new DeploymentReadbackError(
      "PUBLIC_NETWORK",
      "Production readback request failed",
      { retryable: transientNetworkError(cause), diagnostics: { url } },
    );
  }
  if (!response.ok) {
    throw new DeploymentReadbackError(
      "PUBLIC_HTTP",
      `Production readback failed with HTTP ${response.status}`,
      {
        retryable: transientStatuses.has(response.status),
        diagnostics: responseDiagnostics(url, response),
        retryAfterMs: retryAfterMs(response, now),
      },
    );
  }
  return response;
}

export async function captureProductionBaseline(
  productionUrl,
  { fetchImpl = fetch } = {},
) {
  const origin = productionOrigin(productionUrl);
  try {
    const response = await publicRequest(`${origin}/`, "text/html", {
      fetchImpl,
    });
    if (!response.headers.get("content-type")?.includes("text/html"))
      return { productionUrl: origin, available: false };
    const bytes = await responseBytes(response, `${origin}/`);
    const websiteSha = response.headers.get("x-hero-website-sha");
    const hasWebsiteSha = /^[a-f0-9]{40}$/.test(websiteSha ?? "");
    if (
      !hasWebsiteSha &&
      snapshotReferences(bytes.toString("utf8")).length === 0
    )
      return { productionUrl: origin, available: false };
    return {
      productionUrl: origin,
      available: true,
      websiteSha: hasWebsiteSha ? websiteSha : null,
      htmlSha256: createHash("sha256").update(bytes).digest("hex"),
      diagnostics: responseDiagnostics(`${origin}/`, response),
    };
  } catch (cause) {
    return {
      productionUrl: origin,
      available: false,
      errorCode:
        cause instanceof DeploymentReadbackError
          ? cause.code
          : "BASELINE_UNAVAILABLE",
      ...(cause instanceof DeploymentReadbackError
        ? { diagnostics: cause.diagnostics }
        : {}),
    };
  }
}

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
 * @param {{ manifestPath?: string | URL, fetchImpl?: typeof fetch, websiteSha?: string, baseline?: object, deadlineAt?: number, now?: () => number }} [options]
 */
export async function verifyJournalDeployment(
  productionUrl,
  {
    manifestPath = new URL("../.journal/manifest.json", import.meta.url),
    fetchImpl = fetch,
    websiteSha,
    baseline,
    deadlineAt,
    now = Date.now,
  } = {},
) {
  const origin = productionOrigin(productionUrl);
  const manifest = parseJournalManifest(
    JSON.parse(await readFile(manifestPath, "utf8")),
  );
  if (!manifest.sourceRevision) {
    throw new Error("Production journal requires an exact source commit SHA");
  }
  if (websiteSha !== undefined && !/^[a-f0-9]{40}$/.test(websiteSha))
    throw new Error("Expected a full website commit SHA");
  const request = (url, accept) =>
    publicRequest(url, accept, { fetchImpl, deadlineAt, now });
  const htmlResponse = await request(`${origin}/`, "text/html");
  if (!htmlResponse.headers.get("content-type")?.includes("text/html")) {
    throw new DeploymentReadbackError(
      "HTML_TYPE",
      "Production page did not return HTML",
      {
        diagnostics: responseDiagnostics(`${origin}/`, htmlResponse),
      },
    );
  }
  const htmlBytes = await responseBytes(htmlResponse, `${origin}/`);
  const html = htmlBytes.toString("utf8");
  const diagnostics = {
    ...responseDiagnostics(`${origin}/`, htmlResponse),
    htmlSha256: createHash("sha256").update(htmlBytes).digest("hex"),
    snapshotRefs: snapshotReferences(html),
  };
  const observed = htmlResponse.headers.get("x-hero-website-sha");
  const knownOld =
    baseline?.available === true &&
    baseline.productionUrl === origin &&
    ((/^[a-f0-9]{40}$/.test(baseline.websiteSha ?? "") &&
      baseline.websiteSha !== websiteSha &&
      observed === baseline.websiteSha) ||
      (observed === baseline.websiteSha &&
        diagnostics.htmlSha256 === baseline.htmlSha256));
  if (websiteSha !== undefined && observed !== websiteSha) {
    throw new DeploymentReadbackError(
      knownOld ? "KNOWN_PREVIOUS_RESPONSE" : "WEBSITE_IDENTITY",
      knownOld
        ? "Production still serves the captured previous response"
        : "Production response does not identify the expected website commit",
      {
        retryable: knownOld,
        diagnostics: {
          ...diagnostics,
          expectedWebsiteSha: websiteSha,
          observedWebsiteSha: /^[a-f0-9]{40}$/.test(observed ?? "")
            ? observed
            : null,
        },
      },
    );
  }
  if (!html.replaceAll("\\/", "/").includes(manifest.url)) {
    const retryPrevious = websiteSha !== undefined && knownOld;
    throw new DeploymentReadbackError(
      retryPrevious ? "KNOWN_PREVIOUS_RESPONSE" : "HTML_REFERENCE",
      retryPrevious
        ? "Production still serves the captured previous response"
        : "Production HTML does not reference the expected snapshot",
      {
        retryable: retryPrevious,
        diagnostics: { ...diagnostics, expectedSnapshot: manifest.url },
      },
    );
  }
  const snapshotResponse = await request(
    `${origin}${manifest.url}`,
    "application/json",
  );
  if (
    !snapshotResponse.headers.get("content-type")?.includes("application/json")
  ) {
    throw new DeploymentReadbackError(
      "SNAPSHOT_TYPE",
      "Production snapshot did not return JSON",
      {
        diagnostics: responseDiagnostics(
          `${origin}${manifest.url}`,
          snapshotResponse,
        ),
      },
    );
  }
  const bytes = await responseBytes(
    snapshotResponse,
    `${origin}${manifest.url}`,
  );
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== manifest.sha256) {
    throw new DeploymentReadbackError(
      "SNAPSHOT_HASH",
      "Production snapshot SHA-256 does not match the manifest",
      {
        diagnostics: {
          ...responseDiagnostics(`${origin}${manifest.url}`, snapshotResponse),
          expectedSha256: manifest.sha256,
          observedSha256: sha256,
        },
      },
    );
  }
  try {
    parseJournalSnapshot(JSON.parse(bytes.toString("utf8")), manifest);
  } catch {
    throw new DeploymentReadbackError(
      "SNAPSHOT_SCHEMA",
      "Production snapshot does not match its manifest or schema",
      {
        diagnostics: responseDiagnostics(
          `${origin}${manifest.url}`,
          snapshotResponse,
        ),
      },
    );
  }
  return {
    productionUrl: origin,
    sourceRevision: manifest.sourceRevision,
    entryCount: manifest.entryCount,
    latestDate: manifest.latestDate,
    sha256,
    ...(websiteSha
      ? {
          readback: {
            html: diagnostics,
            snapshot: responseDiagnostics(
              `${origin}${manifest.url}`,
              snapshotResponse,
            ),
          },
        }
      : {}),
  };
}

/**
 * @param {string} productionUrl
 * @param {object} receipt
 * @param {{baseline?: object, manifestPath?: string | URL, fetchImpl?: typeof fetch, now?: () => number, sleep?: (ms: number) => Promise<void>, onRetry?: (event: object) => void}} [options]
 */
export async function verifyReadyJournalDeployment(
  productionUrl,
  receipt,
  { baseline, now = Date.now, sleep, onRetry, ...options } = {},
) {
  const origin = productionOrigin(productionUrl);
  if (
    receipt.productionUrl !== origin ||
    receipt.readyState !== "READY" ||
    receipt.aliasMatched !== true ||
    !/^dpl_[a-zA-Z0-9]+$/.test(receipt.deploymentId ?? "") ||
    !/^[a-f0-9]{40}$/.test(receipt.websiteSha ?? "") ||
    !Number.isFinite(receipt.deadlineAt) ||
    receipt.deadlineAt > now() + verificationBudgetMs
  )
    throw new Error("Invalid production deployment readiness receipt");
  const result = await retryUntilDeadline(
    () =>
      verifyJournalDeployment(origin, {
        ...options,
        websiteSha: receipt.websiteSha,
        baseline,
        deadlineAt: receipt.deadlineAt,
        now,
      }),
    { deadlineAt: receipt.deadlineAt, now, sleep, onRetry },
  );
  return {
    ...result,
    websiteSha: receipt.websiteSha,
    deploymentId: receipt.deploymentId,
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const { values, positionals } = parseArgs({
      allowPositionals: true,
      options: {
        readiness: { type: "string" },
        baseline: { type: "string" },
        "capture-baseline": { type: "string" },
      },
    });
    if (positionals.length !== 1) {
      throw new Error(
        "Usage: node scripts/verify-journal-deployment.mjs https://production.example.com",
      );
    }
    const origin = positionals[0];
    if (values["capture-baseline"]) {
      const result = await captureProductionBaseline(origin);
      await writeFile(
        values["capture-baseline"],
        JSON.stringify(result) + "\n",
      );
      console.log(JSON.stringify({ baselineAvailable: result.available }));
    } else if (values.readiness) {
      const receipt = JSON.parse(await readFile(values.readiness, "utf8"));
      const baseline = values.baseline
        ? JSON.parse(await readFile(values.baseline, "utf8"))
        : undefined;
      console.log(
        JSON.stringify(
          await verifyReadyJournalDeployment(origin, receipt, {
            baseline,
            onRetry: (event) => console.error(JSON.stringify(event)),
          }),
        ),
      );
    } else {
      console.log(JSON.stringify(await verifyJournalDeployment(origin)));
    }
  } catch (cause) {
    console.error(
      JSON.stringify(
        cause instanceof DeploymentReadbackError
          ? { code: cause.code, message: cause.message, ...cause.diagnostics }
          : {
              message:
                cause instanceof Error
                  ? cause.message
                  : "Production readback failed",
            },
      ),
    );
    process.exitCode = 1;
  }
}
