import { spawnSync } from "node:child_process";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { pathToFileURL } from "node:url";

const environment = "project-content";
const secret = "CODEX_AUTH_JSON";
export const image = "hero-project-codex:0.155.1";

// Errors must never contain JSON parser excerpts or child-process output: both
// can contain credentials, including newly rotated tokens GitHub cannot mask yet.
export function validateManagedAuth(raw) {
  let auth;
  try {
    if (typeof raw !== "string" || Buffer.byteLength(raw) > 40_000) throw 0;
    auth = JSON.parse(raw);
  } catch {
    throw new Error("Invalid Codex authentication JSON; log in again.");
  }
  if (
    auth?.auth_mode !== "chatgpt" ||
    auth.OPENAI_API_KEY ||
    !["access_token", "refresh_token", "id_token"].every(
      (key) =>
        typeof auth.tokens?.[key] === "string" &&
        auth.tokens[key].trim().length > 0,
    )
  ) {
    throw new Error("A dedicated ChatGPT-managed Codex login is required.");
  }
  return auth;
}

function execute(command, args, options = {}) {
  const result = spawnSync(command, args, {
    ...options,
    timeout: options.timeout ?? 60_000,
    stdio: ["pipe", "ignore", "ignore"],
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} failed; secret-bearing output was suppressed.`);
  }
}

async function readAuth(filename) {
  const info = await lstat(filename);
  if (!info.isFile() || info.size > 40_000) {
    throw new Error("Invalid Codex authentication file.");
  }
  const raw = await readFile(filename, "utf8");
  validateManagedAuth(raw);
  return raw;
}

export async function restoreAuth(root, raw) {
  validateManagedAuth(raw);
  await mkdir(path.join(root, "codex-home"), { mode: 0o700 });
  await mkdir(path.join(root, "model-output"), { mode: 0o700 });
  await writeFile(path.join(root, "auth-before.json"), raw, {
    mode: 0o600,
    flag: "wx",
  });
  await writeFile(path.join(root, "codex-home/auth.json"), raw, {
    mode: 0o600,
    flag: "wx",
  });
}

export async function persistAuth(root, repository, token, run = execute) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? "") || !token) {
    throw new Error("Repository and CODEX_AUTH_WRITE_TOKEN are required.");
  }
  const raw = await readAuth(path.join(root, "codex-home/auth.json"));
  const before = validateManagedAuth(
    await readAuth(path.join(root, "auth-before.json")),
  );
  if (validateManagedAuth(raw).tokens.account_id !== before.tokens.account_id) {
    throw new Error(
      "Codex account changed; refusing to replace the saved login.",
    );
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      run(
        "gh",
        ["secret", "set", secret, "--repo", repository, "--env", environment],
        {
          input: raw,
          env: { ...process.env, GH_TOKEN: token, GH_HOST: "github.com" },
        },
      );
      return;
    } catch {
      if (attempt === 2)
        throw new Error(
          "Cannot save Codex login; generation must not be published. Reseed the dedicated login before retrying.",
        );
      await setTimeout(1000 * (attempt + 1));
    }
  }
}

export function containerArgs(root, name) {
  return [
    "run",
    "--name",
    name,
    "--interactive",
    "--user",
    `${process.getuid()}:${process.getgid()}`,
    "--read-only",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--pids-limit=256",
    "--memory=2g",
    "--cpus=2",
    "--tmpfs",
    "/tmp:rw,nosuid,nodev,size=268435456,mode=1777",
    "--mount",
    `type=bind,src=${root}/codex-home,dst=/codex-home`,
    "--mount",
    `type=bind,src=${root}/model-output,dst=/output`,
    "--mount",
    `type=bind,src=${root}/schema.json,dst=/schema.json,readonly`,
    "--workdir",
    "/tmp",
    "--env",
    "CODEX_HOME=/codex-home",
    "--env",
    "HOME=/tmp",
    image,
    "exec",
    "--model",
    "gpt-5.6-sol",
    "--sandbox",
    "read-only",
    "--ephemeral",
    "--skip-git-repo-check",
    "--ignore-user-config",
    "--ignore-rules",
    "-c",
    'cli_auth_credentials_store="file"',
    "-c",
    'forced_login_method="chatgpt"',
    "-c",
    'approval_policy="never"',
    "-c",
    'web_search="disabled"',
    "-c",
    "features.shell_tool=false",
    "-c",
    "features.multi_agent=false",
    "-c",
    "features.code_mode=false",
    "-c",
    "features.code_mode_host=false",
    "--output-schema",
    "/schema.json",
    "--output-last-message",
    "/output/generated.json",
    "-",
  ];
}

export async function generateContent(root, run = execute) {
  const runId = process.env.GITHUB_RUN_ID ?? String(process.pid);
  const attempt = process.env.GITHUB_RUN_ATTEMPT ?? "1";
  if (!/^\d+$/.test(runId) || !/^\d+$/.test(attempt)) {
    throw new Error("Invalid workflow run identity.");
  }
  const name = `hero-project-codex-${runId}-${attempt}`;
  try {
    run("docker", containerArgs(root, name), {
      input: await readFile(path.join(root, "prompt.md"), "utf8"),
      timeout: 12 * 60_000,
    });
  } finally {
    // Remove a container left running after timeout before any credential writeback.
    run("docker", ["rm", "--force", name]);
  }
  const output = path.join(root, "model-output/generated.json");
  const info = await lstat(output);
  if (!info.isFile() || info.size > 1_000_000) {
    throw new Error("Invalid generated content file.");
  }
  const generated = await readFile(output, "utf8");
  for (const filename of ["auth-before.json", "codex-home/auth.json"]) {
    const auth = validateManagedAuth(await readAuth(path.join(root, filename)));
    if (
      ["access_token", "refresh_token", "id_token"].some((key) =>
        generated.includes(auth.tokens[key]),
      )
    )
      throw new Error(
        "Credential detected in model output; refusing publication.",
      );
  }
  await writeFile(path.join(root, "generated.json"), generated, { flag: "wx" });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [command, directory] = process.argv.slice(2);
  try {
    if (!directory || !["restore", "persist", "generate"].includes(command)) {
      throw new Error(
        "Usage: project-auth.mjs restore|persist|generate <temporary-directory>",
      );
    }
    const root = path.resolve(directory);
    if (command === "restore")
      await restoreAuth(root, process.env.CODEX_AUTH_JSON);
    if (command === "persist")
      await persistAuth(
        root,
        process.env.GITHUB_REPOSITORY,
        process.env.GH_TOKEN,
      );
    if (command === "generate") await generateContent(root);
  } catch {
    // Do not forward filesystem/CLI errors that might include secret values.
    console.error(
      `Project ${command} failed. Check private-environment setup, login validity and secret-write permission. No sensitive output is logged.`,
    );
    process.exitCode = 1;
  }
}
