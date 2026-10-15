// @vitest-environment node
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { afterEach, describe, expect, test, vi } from "vitest";
import { waitForVercelDeployment } from "../scripts/wait-vercel-deployment.mjs";

const inputs = {
  deploymentUrl: "https://hero-release.example.vercel.app",
  productionUrl: "https://hero.example.com",
  projectId: "prj_expected",
  teamId: "team_expected",
  websiteSha: "c".repeat(40),
  token: "private-test-token",
};
const deployment = {
  id: "dpl_expected",
  projectId: inputs.projectId,
  target: "production",
  readyState: "READY",
  meta: { githubCommitSha: inputs.websiteSha },
  ready: 100,
};
const alias = { deploymentId: deployment.id, projectId: inputs.projectId };
const json = (value: object, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function clock() {
  let time = 0;
  return {
    now: () => time,
    sleep: vi.fn(async (ms: number) => {
      time += ms;
    }),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Vercel control-plane readiness", () => {
  test("waits for READY and the exact alias binding without resetting the deadline", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ ...deployment, readyState: "BUILDING" }))
      .mockResolvedValueOnce(json(deployment))
      .mockResolvedValueOnce(json({ ...alias, deploymentId: "dpl_previous" }))
      .mockResolvedValueOnce(json(deployment))
      .mockResolvedValueOnce(json(alias));
    const time = clock();
    const events: object[] = [];
    const result = await waitForVercelDeployment({
      ...inputs,
      fetchImpl,
      ...time,
      onRetry: (event) => events.push(event),
    });
    expect(result).toMatchObject({
      deploymentId: deployment.id,
      websiteSha: inputs.websiteSha,
      aliasMatched: true,
      readyState: "READY",
      checkedAt: 3_000,
      deadlineAt: 120_000,
    });
    expect(time.sleep.mock.calls).toEqual([[1_000], [2_000]]);
    expect(
      fetchImpl.mock.calls.every(
        ([url]) => new URL(url).origin === "https://api.vercel.com",
      ),
    ).toBe(true);
    expect(
      fetchImpl.mock.calls.every(
        ([, options]) =>
          options.headers.Authorization === "Bearer private-test-token",
      ),
    ).toBe(true);
    expect(JSON.stringify(events)).not.toContain(inputs.token);
  });

  test.each([
    { projectId: "prj_other" },
    { target: "preview" },
    { meta: { githubCommitSha: "d".repeat(40) } },
    { gitSource: { sha: "d".repeat(40) } },
  ])(
    "fails immediately for an incorrect deployment identity",
    async (overrides) => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValue(json({ ...deployment, ...overrides }));
      const time = clock();
      await expect(
        waitForVercelDeployment({ ...inputs, fetchImpl, ...time }),
      ).rejects.toMatchObject({
        code: "DEPLOYMENT_IDENTITY",
        retryable: false,
      });
      expect(fetchImpl).toHaveBeenCalledOnce();
      expect(time.sleep).not.toHaveBeenCalled();
    },
  );

  test.each(["ERROR", "CANCELED"])(
    "does not wait on a terminal deployment failure: %s",
    async (readyState) => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValue(json({ ...deployment, readyState }));
      const time = clock();
      await expect(
        waitForVercelDeployment({ ...inputs, fetchImpl, ...time }),
      ).rejects.toMatchObject({ code: "DEPLOYMENT_FAILED" });
      expect(time.sleep).not.toHaveBeenCalled();
    },
  );

  test("fails immediately if the production alias belongs to another project", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json(deployment))
      .mockResolvedValueOnce(json({ ...alias, projectId: "prj_other" }));
    const time = clock();
    await expect(
      waitForVercelDeployment({ ...inputs, fetchImpl, ...time }),
    ).rejects.toMatchObject({ code: "ALIAS_PROJECT" });
    expect(time.sleep).not.toHaveBeenCalled();
  });

  test.each([undefined, "UNKNOWN"])(
    "does not retry malformed readiness state: %s",
    async (readyState) => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValue(json({ ...deployment, readyState }));
      const time = clock();
      await expect(
        waitForVercelDeployment({ ...inputs, fetchImpl, ...time }),
      ).rejects.toMatchObject({ code: "DEPLOYMENT_STATE" });
      expect(time.sleep).not.toHaveBeenCalled();
    },
  );

  test.each([401, 403])(
    "never retries a credential/permission failure: %s",
    async (status) => {
      const fetchImpl = vi
        .fn()
        .mockResolvedValue(json({ error: "private payload" }, status));
      const time = clock();
      await expect(
        waitForVercelDeployment({ ...inputs, fetchImpl, ...time }),
      ).rejects.toThrow(`HTTP ${status}`);
      expect(fetchImpl).toHaveBeenCalledOnce();
      expect(time.sleep).not.toHaveBeenCalled();
    },
  );

  test("retries a metadata 503 and accepts the nested project/alias API shape", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({}, 503))
      .mockResolvedValueOnce(
        json({
          ...deployment,
          projectId: undefined,
          project: { id: inputs.projectId },
        }),
      )
      .mockResolvedValueOnce(
        json({
          projectId: inputs.projectId,
          deployment: { id: deployment.id },
        }),
      );
    const time = clock();
    await expect(
      waitForVercelDeployment({ ...inputs, fetchImpl, ...time }),
    ).resolves.toMatchObject({ deploymentId: deployment.id });
    expect(time.sleep.mock.calls).toEqual([[1_000]]);
  });

  test("a deployment that never becomes READY fails within the total budget", async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(json({ ...deployment, readyState: "BUILDING" })),
      );
    const time = clock();
    await expect(
      waitForVercelDeployment({
        ...inputs,
        timeoutMs: 3_500,
        fetchImpl,
        ...time,
      }),
    ).rejects.toMatchObject({
      code: "VERIFICATION_TIMEOUT",
      diagnostics: { attempts: 3, lastCode: "DEPLOYMENT_PENDING" },
    });
    expect(time.now()).toBeLessThanOrEqual(3_500);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  test("does not retry malformed metadata or leak its response body", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("private-api-body"));
    const time = clock();
    await expect(
      waitForVercelDeployment({ ...inputs, fetchImpl, ...time }),
    ).rejects.toThrow("metadata could not be read");
    expect(time.sleep).not.toHaveBeenCalled();
  });

  test.each([
    { deploymentUrl: "https://untrusted.example.com" },
    { deploymentUrl: "https://user:secret@deployment.vercel.app" },
    { websiteSha: "bad" },
    { token: "" },
    { timeoutMs: 120_001 },
  ])(
    "rejects invalid verification inputs before sending the credential",
    async (overrides) => {
      const fetchImpl = vi.fn();
      await expect(
        waitForVercelDeployment({
          ...inputs,
          ...overrides,
          fetchImpl,
          ...clock(),
        }),
      ).rejects.toThrow();
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );
});

describe("build and workflow identity boundary", () => {
  test("writes a validated public commit header into the build configuration", async () => {
    vi.stubEnv("HERO_WEBSITE_SHA", inputs.websiteSha);
    const { default: config } = await import("../next.config");
    expect(await config.headers()).toEqual([
      {
        source: "/",
        headers: [{ key: "X-Hero-Website-Sha", value: inputs.websiteSha }],
      },
    ]);
  });

  test("keeps ordinary local builds valid without a release revision", async () => {
    vi.stubEnv("HERO_WEBSITE_SHA", "");
    const { default: config } = await import("../next.config");
    expect(await config.headers()).toEqual([]);
  });

  test("rejects an invalid build revision rather than publishing an unverifiable marker", async () => {
    vi.stubEnv("HERO_WEBSITE_SHA", "invalid");
    await expect(import("../next.config")).rejects.toThrow(
      "full Git commit SHA",
    );
  });

  test("keeps credentials confined to metadata queries and preserves final failure gates", async () => {
    const require = createRequire(import.meta.url);
    const yaml = require("js-yaml") as { load: (text: string) => unknown };
    type Step = {
      name: string;
      env?: Record<string, string>;
      run?: string;
      if?: string;
    };
    const workflow = yaml.load(
      await readFile(
        new URL("../.github/workflows/journal-build.yml", import.meta.url),
        "utf8",
      ),
    ) as { permissions: object; jobs: { deploy: { steps: Step[] } } };
    expect(workflow.permissions).toEqual({ contents: "read" });
    const steps = workflow.jobs.deploy.steps;
    const identity = steps.find(
      (s) => s.name === "Verify the published deployment identity and alias",
    )!;
    const readback = steps.find(
      (s) => s.name === "Verify the public production snapshot",
    )!;
    const baseline = steps.find(
      (s) => s.name === "Capture the previous public response",
    )!;
    const build = steps.find(
      (s) => s.name === "Build production output in Actions",
    )!;
    expect(identity.env?.VERCEL_TOKEN).toBe("${{ secrets.VERCEL_TOKEN }}");
    expect(readback.env?.VERCEL_TOKEN).toBeUndefined();
    expect(baseline.env?.VERCEL_TOKEN).toBeUndefined();
    expect(build.env?.HERO_WEBSITE_SHA).toBe(
      "${{ steps.website.outputs.sha }}",
    );
    expect(readback.run).toContain("--readiness");
    expect(readback.run).toContain("--baseline");
    expect(
      steps.find((s) => s.name === "Record the verified deployment")?.if,
    ).toBe("steps.readback.outcome == 'success'");
  });
});
