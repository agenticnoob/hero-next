// @vitest-environment node
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import {
  mkdtemp,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  containerArgs,
  diagnosticCodes,
  execute,
  generateContent,
  persistAuth,
  restoreAuth,
  validateManagedAuth,
} from "../scripts/project-auth.mjs";

const roots: string[] = [];
const auth = {
  auth_mode: "chatgpt",
  OPENAI_API_KEY: null,
  tokens: {
    access_token: "synthetic-access-token",
    refresh_token: "synthetic-refresh-token",
    id_token: "synthetic-id-token",
    account_id: "synthetic-account",
  },
  last_refresh: "2026-09-21T00:00:00Z",
};
const rotated = {
  ...auth,
  tokens: { ...auth.tokens, refresh_token: "new-synthetic-refresh-token" },
};

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "hero-auth-test-"));
  roots.push(root);
  await restoreAuth(root, JSON.stringify(auth));
  await writeFile(path.join(root, "prompt.md"), "Public README only");
  return root;
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
  vi.unstubAllEnvs();
});

describe("subscription authentication lifecycle", () => {
  test("classifies process failures without reproducing secret-bearing output", () => {
    expect(
      diagnosticCodes(
        "ERROR error sending request: invalid peer certificate synthetic-secret",
      ),
    ).toEqual(["tls-certificate", "network-request"]);
    expect(diagnosticCodes("unexpected argument synthetic-secret")).toEqual([]);
    expect(
      diagnosticCodes("error: unexpected argument synthetic-secret"),
    ).toEqual(["invalid-cli-option"]);
    expect(diagnosticCodes("ERROR 401 Unauthorized synthetic-secret")).toEqual([
      "unauthorized",
    ]);
  });

  test("process diagnostics remain bounded and suppress child output on failure and timeout", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(
        execute(process.execPath, [
          "-e",
          "console.error('ERROR 403 Forbidden synthetic-secret'); process.exit(1)",
        ]),
      ).rejects.toThrow("Process failed");
      expect(log.mock.calls).toEqual([["Process diagnostic hint: forbidden"]]);
      await expect(
        execute(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
          timeout: 100,
        }),
      ).rejects.toThrow("Process failed");
      expect(log.mock.calls.flat().join(" ")).not.toContain("synthetic-secret");
      expect(log).toHaveBeenCalledWith(
        "Process diagnostic hint: execution-timeout",
      );
    } finally {
      log.mockRestore();
    }
  });
  test.each([
    "broken-json synthetic-secret",
    JSON.stringify({ ...auth, auth_mode: "chatgptAuthTokens" }),
    JSON.stringify({ ...auth, OPENAI_API_KEY: "synthetic-api-key" }),
    JSON.stringify({ ...auth, tokens: { access_token: "synthetic-secret" } }),
    "x".repeat(40_001),
  ])(
    "rejects unsupported or malformed auth without exposing its contents",
    (raw) => {
      expect(() => validateManagedAuth(raw)).toThrow();
      try {
        validateManagedAuth(raw);
      } catch (error) {
        expect(String(error)).not.toContain("synthetic-");
      }
    },
  );

  test("restores owner-only credentials once and never overwrites a refreshed file", async () => {
    const root = await fixture();
    expect((await stat(path.join(root, "codex-home"))).mode & 0o777).toBe(
      0o700,
    );
    expect(
      (await stat(path.join(root, "codex-home/auth.json"))).mode & 0o777,
    ).toBe(0o600);
    await writeFile(
      path.join(root, "codex-home/auth.json"),
      JSON.stringify(rotated),
    );
    await expect(restoreAuth(root, JSON.stringify(auth))).rejects.toThrow();
    expect(
      JSON.parse(
        await readFile(path.join(root, "codex-home/auth.json"), "utf8"),
      ),
    ).toEqual(rotated);
  });

  test("writes the refreshed login through stdin to the environment secret", async () => {
    const root = await fixture();
    await writeFile(
      path.join(root, "codex-home/auth.json"),
      JSON.stringify(rotated),
    );
    const run = vi.fn();
    await persistAuth(root, "example/site", "synthetic-write-token", run);
    const [command, args, options] = run.mock.calls[0];
    expect(command).toBe("gh");
    expect(args).toEqual([
      "secret",
      "set",
      "CODEX_AUTH_JSON",
      "--repo",
      "example/site",
      "--env",
      "project-content",
    ]);
    expect(JSON.parse(options.input)).toEqual(rotated);
    expect(options.env.GH_TOKEN).toBe("synthetic-write-token");
    expect(args.join(" ")).not.toContain("synthetic-");
  });

  test("refuses invalid, symlinked or changed-account credentials without writing a secret", async () => {
    const root = await fixture();
    const filename = path.join(root, "codex-home/auth.json");
    const run = vi.fn();
    for (const value of [
      "corrupt",
      JSON.stringify({
        ...rotated,
        tokens: { ...rotated.tokens, account_id: "different" },
      }),
    ]) {
      await writeFile(filename, value);
      await expect(
        persistAuth(root, "example/site", "token", run),
      ).rejects.toThrow();
    }
    await rm(filename);
    await symlink(path.join(root, "auth-before.json"), filename);
    await expect(
      persistAuth(root, "example/site", "token", run),
    ).rejects.toThrow();
    expect(run).not.toHaveBeenCalled();
  });

  test("blocks success when credential storage stays unavailable", async () => {
    const root = await fixture();
    const run = vi.fn(() => {
      throw new Error("synthetic-secret in child stderr");
    });
    await expect(
      persistAuth(root, "example/site", "token", run),
    ).rejects.toThrow("Cannot save Codex login");
    expect(run).toHaveBeenCalledTimes(3);
  });

  test("exports only model output and removes the container before inspecting files", async () => {
    const root = await fixture();
    vi.stubEnv("GH_TOKEN", "host-only-token");
    const run = vi.fn(async (_command: string, args: string[]) => {
      if (args[0] === "run") {
        writeFileSync(
          path.join(root, "model-output/generated.json"),
          '{"projects":[]}',
        );
        writeFileSync(
          path.join(root, "codex-home/auth.json"),
          JSON.stringify(rotated),
        );
      }
    });
    await generateContent(root, run);
    expect(await readFile(path.join(root, "generated.json"), "utf8")).toBe(
      '{"projects":[]}',
    );
    expect(run.mock.calls[1][1].slice(0, 2)).toEqual(["rm", "--force"]);
    const args = containerArgs(root, "test-container");
    expect(args.join(" ")).not.toMatch(
      /host-only-token|GH_TOKEN|GITHUB_TOKEN|docker\.sock|GITHUB_WORKSPACE/,
    );
    expect(args).toContain("--read-only");
    expect(args).toContain('forced_login_method="chatgpt"');
    expect(args).toContain("features.shell_tool=false");
    expect(args).toContain("features.multi_agent=false");
  });

  test("removes a failed container and still allows saving its refreshed credentials", async () => {
    const root = await fixture();
    const run = vi.fn(async (_command: string, args: string[]) => {
      if (args[0] === "run") {
        writeFileSync(
          path.join(root, "codex-home/auth.json"),
          JSON.stringify(rotated),
        );
        throw new Error("Model failed after refreshing");
      }
    });
    await expect(generateContent(root, run)).rejects.toThrow("Model failed");
    expect(run.mock.calls[1][1].slice(0, 2)).toEqual(["rm", "--force"]);
    const save = vi.fn();
    await persistAuth(root, "example/site", "token", save);
    expect(JSON.parse(save.mock.calls[0][2].input)).toEqual(rotated);
    await expect(stat(path.join(root, "generated.json"))).rejects.toThrow();
  });

  test("does not export model output containing an authentication token", async () => {
    const root = await fixture();
    await writeFile(
      path.join(root, "model-output/generated.json"),
      JSON.stringify({ projects: [auth.tokens.access_token] }),
    );
    await expect(generateContent(root, vi.fn())).rejects.toThrow(
      "Credential detected",
    );
    await expect(stat(path.join(root, "generated.json"))).rejects.toThrow();
  });

  test("the CLI suppresses parser and child-process errors containing secrets", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "hero-auth-cli-"));
    roots.push(root);
    const result = spawnSync(
      process.execPath,
      ["scripts/project-auth.mjs", "restore", root],
      {
        env: { ...process.env, CODEX_AUTH_JSON: "not-json synthetic-secret" },
        encoding: "utf8",
      },
    );
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).not.toContain("synthetic-secret");
    expect(result.stderr).toContain("No sensitive output is logged");
  });

  test("the workflow gates generation, serializes credentials and never uploads auth", async () => {
    const workflow = await readFile(
      ".github/workflows/projects-sync.yml",
      "utf8",
    );
    const generate = workflow.split("  generate:\n")[1].split("  review:\n")[0];
    expect(generate).toContain(
      "needs.collect.outputs.changed == 'true' && github.event.repository.private",
    );
    expect(generate).toContain("environment: project-content");
    expect(workflow).toContain("cancel-in-progress: false");
    expect(generate).toContain(
      "if: always() && steps.auth.outcome == 'success' && steps.stopped.outcome == 'success'",
    );
    expect(generate).not.toContain("OPENAI_API_KEY");
    const artifact = generate
      .split("name: project-content-inputs")[1]
      .split("- name:")[0];
    expect(artifact).toContain("/plan.json");
    expect(artifact).toContain("/generated.json");
    expect(artifact).not.toMatch(/auth|codex-home|model-output/);
    expect(workflow.split("  review:\n")[1]).toContain("needs: generate");
  });
});
