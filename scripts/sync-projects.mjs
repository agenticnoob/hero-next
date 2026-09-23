import { createHash } from "node:crypto";
import {
  readFile,
  writeFile,
  rename,
  mkdir,
  appendFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  object,
  validateContent,
  validateProjectSnapshot,
} from "./project-data.mjs";

export const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const readJson = async (filename) =>
  JSON.parse(await readFile(filename, "utf8"));

export function validateConfig(value) {
  object(
    value,
    ["version", "owner", "topic", "include", "excludeIds"],
    "config",
  );
  if (
    value.version !== 1 ||
    !/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$/.test(value.owner) ||
    (value.topic !== null &&
      (typeof value.topic !== "string" ||
        !/^[a-z0-9-]{1,50}$/.test(value.topic))) ||
    !Array.isArray(value.include) ||
    value.include.some(
      (name) =>
        typeof name !== "string" ||
        !new RegExp(`^${value.owner}/[a-zA-Z0-9_.-]{1,100}$`, "i").test(name),
    ) ||
    !Array.isArray(value.excludeIds) ||
    value.excludeIds.some((id) => !Number.isSafeInteger(id) || id <= 0)
  ) {
    throw new Error("Invalid public-project selection config");
  }
  return value;
}

export function githubClient(token, fetcher = fetch) {
  return async (endpoint, { missing = false } = {}) => {
    if (!endpoint.startsWith("/") || endpoint.startsWith("//"))
      throw new Error("Expected a GitHub API path");
    const response = await fetcher(`https://api.github.com${endpoint}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    if (missing && response.status === 404) return null;
    if (!response.ok)
      throw new Error(`GitHub ${response.status} for ${endpoint}`);
    return response.json();
  };
}

export async function collectProjects(configInput, snapshotInput, api) {
  const config = validateConfig(configInput);
  const snapshot = validateProjectSnapshot(snapshotInput);
  const repos = [];
  for (let page = 1; ; page++) {
    if (page > 100) throw new Error("Repository pagination exceeded its limit");
    const batch = await api(
      `/users/${config.owner}/repos?type=owner&sort=full_name&per_page=100&page=${page}`,
    );
    if (!Array.isArray(batch))
      throw new Error("GitHub returned an invalid repository list");
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  const selected = repos.filter(
    (repo) =>
      !repo.private &&
      !repo.fork &&
      !repo.archived &&
      !repo.disabled &&
      repo.owner?.login.toLowerCase() === config.owner.toLowerCase() &&
      !config.excludeIds.includes(repo.id) &&
      (config.topic === null ||
        repo.topics?.includes(config.topic) ||
        config.include.some(
          (name) => name.toLowerCase() === repo.full_name.toLowerCase(),
        )),
  );
  const projects = [];
  let sourceBytes = 0;
  const skipped = [];
  for (const previous of snapshot.projects) {
    if (!selected.some((repo) => repo.id === previous.id)) {
      skipped.push(
        `${previous.repository}: retained previous publication; source is no longer public/eligible. Review removal manually.`,
      );
    }
  }
  const seen = new Set();
  for (const repo of selected.sort((a, b) => a.id - b.id)) {
    if (seen.has(repo.id))
      throw new Error("Duplicate GitHub repository id; retry the scan");
    seen.add(repo.id);
    if (
      !Number.isSafeInteger(repo.id) ||
      !new RegExp(`^${config.owner}/[a-zA-Z0-9_.-]{1,100}$`, "i").test(
        repo.full_name,
      )
    ) {
      throw new Error("GitHub returned an invalid repository identity");
    }
    if (!repo.size) {
      skipped.push(`${repo.full_name}: empty repository`);
      continue;
    }
    const endpoint = `/repos/${repo.full_name}`;
    const commit = await api(
      `${endpoint}/commits/${encodeURIComponent(repo.default_branch)}`,
    );
    if (!/^[a-f0-9]{40}$/.test(commit.sha))
      throw new Error("GitHub returned an invalid commit");
    const readme = await api(`${endpoint}/readme?ref=${commit.sha}`, {
      missing: true,
    });
    if (!readme) {
      skipped.push(`${repo.full_name}: no README`);
      continue;
    }
    if (
      readme.type !== "file" ||
      readme.encoding !== "base64" ||
      !/^[a-f0-9]{40}$/.test(readme.sha) ||
      typeof readme.content !== "string"
    ) {
      throw new Error(`${repo.full_name}: unsupported README response`);
    }
    const bytes = Buffer.from(readme.content, "base64");
    if (bytes.length > 120_000)
      throw new Error(
        `${repo.full_name}: README exceeds 120 KB; curate it before publishing`,
      );
    const readmeText = new TextDecoder("utf-8", { fatal: true })
      .decode(bytes)
      .trim();
    if (!readmeText) {
      skipped.push(`${repo.full_name}: empty README`);
      continue;
    }
    const topics = [...(repo.topics ?? [])].sort();
    const inputs = {
      repository: repo.full_name,
      description: repo.description ?? null,
      topics,
      language: repo.language ?? null,
      readmeSha: readme.sha,
    };
    const sourceDigest = hash(inputs);
    if (
      snapshot.projects.find((project) => project.id === repo.id)
        ?.sourceDigest === sourceDigest
    )
      continue;
    if (sourceBytes + bytes.length > 180_000) break;
    sourceBytes += bytes.length;
    projects.push({
      id: repo.id,
      slug: `gh-${repo.id}`,
      repository: repo.full_name,
      url: `https://github.com/${repo.full_name}`,
      readmeSha: readme.sha,
      sourceCommit: commit.sha,
      sourceDigest,
      updatedAt: repo.updated_at,
      topics,
      language: repo.language ?? null,
      description: repo.description ?? null,
      readme: readmeText,
    });
    if (projects.length === 10) break;
  }
  return { version: 1, baseDigest: hash(snapshot), projects, skipped };
}

export function mergeGenerated(snapshotInput, plan, generated) {
  const snapshot = validateProjectSnapshot(snapshotInput);
  object(plan, ["version", "baseDigest", "projects", "skipped"], "plan");
  if (
    plan.version !== 1 ||
    plan.baseDigest !== hash(snapshot) ||
    !Array.isArray(plan.projects) ||
    plan.projects.length > 10
  ) {
    throw new Error("Stale or invalid scan plan; rescan before publishing");
  }
  object(generated, ["projects"], "model output");
  if (
    !Array.isArray(generated.projects) ||
    generated.projects.length !== plan.projects.length
  )
    throw new Error("Model project count mismatch");
  const content = new Map();
  for (const item of generated.projects) {
    object(item, ["id", "content"], "model project");
    if (
      !Number.isSafeInteger(item.id) ||
      content.has(item.id) ||
      !plan.projects.some((project) => project.id === item.id)
    ) {
      throw new Error("Unknown or duplicate model project id");
    }
    content.set(item.id, validateContent(item.content));
  }
  const merged = new Map(
    snapshot.projects.map((project) => [project.id, project]),
  );
  for (const project of plan.projects) {
    const { description, readme, ...metadata } = project;
    if (
      typeof readme !== "string" ||
      (description !== null && typeof description !== "string")
    )
      throw new Error("Invalid scanned source");
    const expected = hash({
      repository: metadata.repository,
      description,
      topics: metadata.topics,
      language: metadata.language,
      readmeSha: metadata.readmeSha,
    });
    if (metadata.sourceDigest !== expected)
      throw new Error("Scan digest mismatch");
    merged.set(project.id, { ...metadata, content: content.get(project.id) });
  }
  return validateProjectSnapshot({
    version: 1,
    projects: [...merged.values()].sort((a, b) => a.id - b.id),
  });
}

async function writeJson(filename, value) {
  await mkdir(path.dirname(filename), { recursive: true });
  const temporary = `${filename}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, filename);
}

async function main() {
  const [command, workdir] = process.argv.slice(2);
  const filename = "data/projects.json";
  const snapshot = validateProjectSnapshot(await readJson(filename));
  if (command === "validate") {
    validateConfig(await readJson("data/projects.config.json"));
    return;
  }
  if (!workdir)
    throw new Error(
      "Usage: sync-projects.mjs scan|apply <temporary-directory>, or validate",
    );
  if (command === "scan") {
    const plan = await collectProjects(
      await readJson("data/projects.config.json"),
      snapshot,
      githubClient(process.env.GH_TOKEN),
    );
    await writeJson(path.join(workdir, "plan.json"), plan);
    if (!process.env.PROJECT_PROMPT_FILE) {
      throw new Error("PROJECT_PROMPT_FILE is required for a scan");
    }
    const instructions = await readFile(
      process.env.PROJECT_PROMPT_FILE,
      "utf8",
    );
    await writeFile(
      path.join(workdir, "prompt.md"),
      `${instructions}\n\nUNTRUSTED_SOURCE_JSON:\n${JSON.stringify({ projects: plan.projects })}\n`,
    );
    if (process.env.GITHUB_OUTPUT)
      await appendFile(
        process.env.GITHUB_OUTPUT,
        `changed=${plan.projects.length > 0}\n`,
      );
    if (process.env.GITHUB_STEP_SUMMARY)
      await appendFile(
        process.env.GITHUB_STEP_SUMMARY,
        `Changed projects: ${plan.projects.length}\n\n${plan.skipped.map((item) => `- ${item}`).join("\n")}\n`,
      );
    console.log(
      JSON.stringify({ changed: plan.projects.length, skipped: plan.skipped }),
    );
  } else if (command === "apply") {
    const result = mergeGenerated(
      snapshot,
      await readJson(path.join(workdir, "plan.json")),
      await readJson(path.join(workdir, "generated.json")),
    );
    await writeJson(filename, result);
  } else throw new Error("Unknown project sync command");
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
