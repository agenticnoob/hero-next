import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  DeploymentReadbackError,
  productionOrigin,
  requestSignal,
  responseDiagnostics,
  retryAfterMs,
  retryUntilDeadline,
  transientNetworkError,
  verificationBudgetMs,
} from "./verify-journal-deployment.mjs";

/**
 * Only this control-plane helper receives the existing Vercel credential.
 * Application readback is a separate credential-free process.
 * @param {{deploymentUrl: string, productionUrl: string, projectId: string, teamId: string, websiteSha: string, token: string, fetchImpl?: typeof fetch, now?: () => number, sleep?: (ms: number) => Promise<void>, onRetry?: (event: object) => void, timeoutMs?: number}} options
 */
export async function waitForVercelDeployment({
  deploymentUrl,
  productionUrl,
  projectId,
  teamId,
  websiteSha,
  token,
  fetchImpl = fetch,
  now = Date.now,
  sleep,
  onRetry,
  timeoutMs = verificationBudgetMs,
}) {
  const deploymentOrigin = productionOrigin(deploymentUrl);
  const production = productionOrigin(productionUrl);
  if (
    !new URL(deploymentOrigin).hostname.endsWith(".vercel.app") ||
    !/^prj_[a-zA-Z0-9]+$/.test(projectId ?? "") ||
    !/^team_[a-zA-Z0-9]+$/.test(teamId ?? "") ||
    !/^[a-f0-9]{40}$/.test(websiteSha ?? "") ||
    !token ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0 ||
    timeoutMs > verificationBudgetMs
  )
    throw new Error("Invalid Vercel deployment verification inputs");
  const deadlineAt = now() + timeoutMs;
  const api = async (endpoint) => {
    const url = new URL(`https://api.vercel.com${endpoint}`);
    url.searchParams.set("teamId", teamId);
    let response;
    try {
      response = await fetchImpl(url.href, {
        headers: { Authorization: `Bearer ${token}` },
        redirect: "error",
        signal: requestSignal(deadlineAt, now),
      });
    } catch (cause) {
      if (cause instanceof DeploymentReadbackError) throw cause;
      throw new DeploymentReadbackError(
        "VERCEL_NETWORK",
        "Vercel metadata request failed",
        {
          retryable: transientNetworkError(cause),
          diagnostics: { url: url.href },
        },
      );
    }
    if (!response.ok)
      throw new DeploymentReadbackError(
        "VERCEL_HTTP",
        `Vercel metadata returned HTTP ${response.status}`,
        {
          retryable: [404, 408, 429, 500, 502, 503, 504].includes(
            response.status,
          ),
          diagnostics: responseDiagnostics(url.href, response),
          retryAfterMs: retryAfterMs(response, now),
        },
      );
    try {
      return await response.json();
    } catch (cause) {
      throw new DeploymentReadbackError(
        "VERCEL_METADATA",
        "Vercel metadata could not be read",
        {
          retryable: transientNetworkError(cause),
          diagnostics: responseDiagnostics(url.href, response),
        },
      );
    }
  };
  return retryUntilDeadline(
    async () => {
      const deployment = await api(
        `/v13/deployments/${encodeURIComponent(new URL(deploymentOrigin).hostname)}`,
      );
      const state = deployment.readyState ?? deployment.state;
      const project = deployment.projectId ?? deployment.project?.id;
      const commit =
        deployment.meta?.githubCommitSha ?? deployment.gitSource?.sha;
      if (
        !/^dpl_[a-zA-Z0-9]+$/.test(deployment.id ?? "") ||
        project !== projectId ||
        deployment.target !== "production" ||
        commit !== websiteSha ||
        (deployment.meta?.githubCommitSha &&
          deployment.gitSource?.sha &&
          deployment.meta.githubCommitSha !== deployment.gitSource.sha)
      )
        throw new DeploymentReadbackError(
          "DEPLOYMENT_IDENTITY",
          "Published deployment identity does not match the expected project, commit and production target",
        );
      if (["ERROR", "CANCELED"].includes(state))
        throw new DeploymentReadbackError(
          "DEPLOYMENT_FAILED",
          `Published deployment ended in ${state}`,
          { diagnostics: { deploymentId: deployment.id, state } },
        );
      if (!["INITIALIZING", "QUEUED", "BUILDING", "READY"].includes(state))
        throw new DeploymentReadbackError(
          "DEPLOYMENT_STATE",
          "Published deployment has an unknown readiness state",
        );
      if (state !== "READY")
        throw new DeploymentReadbackError(
          "DEPLOYMENT_PENDING",
          "Published deployment is not READY",
          {
            retryable: true,
            diagnostics: { deploymentId: deployment.id, state },
          },
        );
      const alias = await api(
        `/v4/aliases/${encodeURIComponent(new URL(production).hostname)}`,
      );
      if (alias.projectId && alias.projectId !== projectId)
        throw new DeploymentReadbackError(
          "ALIAS_PROJECT",
          "Production alias belongs to another project",
        );
      const aliasDeployment =
        alias.deploymentId ??
        alias.deployment?.id ??
        (/^dpl_[a-zA-Z0-9]+$/.test(alias.id ?? "") ? alias.id : null);
      if (aliasDeployment !== deployment.id)
        throw new DeploymentReadbackError(
          "ALIAS_PENDING",
          "Production alias has not selected the published deployment",
          {
            retryable: true,
            diagnostics: {
              deploymentId: deployment.id,
              aliasDeploymentId: /^dpl_[a-zA-Z0-9]+$/.test(
                aliasDeployment ?? "",
              )
                ? aliasDeployment
                : null,
            },
          },
        );
      return {
        deploymentId: deployment.id,
        deploymentUrl: deploymentOrigin,
        productionUrl: production,
        projectId,
        websiteSha,
        readyState: "READY",
        aliasMatched: true,
        readyAt: deployment.ready ?? null,
        checkedAt: now(),
        deadlineAt,
      };
    },
    { deadlineAt, now, sleep, onRetry },
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const { values } = parseArgs({
      options: {
        "deployment-url-file": { type: "string" },
        "production-url": { type: "string" },
        "project-id": { type: "string" },
        "team-id": { type: "string" },
        "website-sha": { type: "string" },
      },
    });
    const deploymentUrl = (
      await readFile(values["deployment-url-file"], "utf8")
    ).trim();
    const result = await waitForVercelDeployment({
      deploymentUrl,
      productionUrl: values["production-url"],
      projectId: values["project-id"],
      teamId: values["team-id"],
      websiteSha: values["website-sha"],
      token: process.env.VERCEL_TOKEN,
      onRetry: (event) => console.error(JSON.stringify(event)),
    });
    console.log(JSON.stringify(result));
  } catch (cause) {
    console.error(
      JSON.stringify(
        cause instanceof DeploymentReadbackError
          ? { code: cause.code, message: cause.message, ...cause.diagnostics }
          : {
              message:
                cause instanceof Error
                  ? cause.message
                  : "Vercel deployment verification failed",
            },
      ),
    );
    process.exitCode = 1;
  }
}
