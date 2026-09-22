import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { validateProjectSnapshot } from "./project-data.mjs";

const contentPath = "data/projects.json";
const shaPattern = /^[a-f0-9]{40}$/;
const digest = (text) => createHash("sha256").update(text).digest("hex");

export function githubApi(endpoint, body, method = body ? "POST" : "GET") {
  const output = execFileSync(
    "gh",
    ["api", endpoint, "--method", method, ...(body ? ["--input", "-"] : [])],
    {
      encoding: "utf8",
      input: body ? JSON.stringify(body) : undefined,
      maxBuffer: 8_000_000,
      timeout: 60_000,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  return output.trim() ? JSON.parse(output) : null;
}

// Read only the data blob. Never check out or execute a pending PR's code.
export async function inspectCandidate(
  repository,
  number,
  base,
  api = githubApi,
) {
  if (
    !/^[\w-]+\/[\w.-]+$/.test(repository) ||
    !Number.isSafeInteger(number) ||
    number < 1 ||
    !shaPattern.test(base)
  )
    throw new Error("Invalid publication identity");
  const prefix = `repos/${repository}`;
  const metadata = await api(prefix);
  if (!metadata.private || metadata.default_branch !== "main") {
    throw new Error("Publication requires the private main branch");
  }
  const pr = await api(`${prefix}/pulls/${number}`);
  if (
    pr.state !== "open" ||
    pr.draft ||
    pr.user?.login !== "github-actions[bot]" ||
    pr.head?.repo?.full_name !== repository ||
    pr.base?.repo?.full_name !== repository ||
    pr.head.ref !== "axmorf/project-content" ||
    pr.base.ref !== "main" ||
    !shaPattern.test(pr.head.sha) ||
    pr.changed_files !== 1
  )
    throw new Error("Not an eligible automated content PR");
  if ((await api(`${prefix}/commits/main`)).sha !== base) {
    throw new Error(
      "Website advanced; rerun against the current main revision",
    );
  }
  const files = await api(`${prefix}/pulls/${number}/files?per_page=100`);
  if (
    files.length !== 1 ||
    files[0].filename !== contentPath ||
    files[0].status !== "modified" ||
    !shaPattern.test(files[0].sha)
  )
    throw new Error("PR must modify only data/projects.json");
  const tree = await api(`${prefix}/git/trees/${pr.head.sha}?recursive=1`);
  const file = tree.tree.find((entry) => entry.path === contentPath);
  if (
    tree.truncated ||
    file?.type !== "blob" ||
    file.mode !== "100644" ||
    file.sha !== files[0].sha
  ) {
    throw new Error("Candidate must be a regular data file");
  }
  const comparison = await api(`${prefix}/compare/${base}...${pr.head.sha}`);
  const ancestor = comparison.merge_base_commit.sha;
  const readAt = (ref) => api(`${prefix}/contents/${contentPath}?ref=${ref}`);
  const current = await readAt(base);
  const previous = await readAt(ancestor);
  if (current.sha !== previous.sha) {
    throw new Error(
      "Published data changed since this PR; refusing to overwrite it",
    );
  }
  const blob = await api(`${prefix}/git/blobs/${file.sha}`);
  if (blob.encoding !== "base64" || blob.size > 2_000_000) {
    throw new Error("Invalid candidate blob");
  }
  const text = Buffer.from(blob.content, "base64").toString("utf8");
  const snapshot = validateProjectSnapshot(JSON.parse(text));
  const baseline = validateProjectSnapshot(
    JSON.parse(Buffer.from(current.content, "base64").toString("utf8")),
  );
  const ids = new Set(snapshot.projects.map((project) => project.id));
  if (baseline.projects.some((project) => !ids.has(project.id))) {
    throw new Error("Automatic publication cannot delete existing projects");
  }
  return { number, head: pr.head.sha, base, digest: digest(text), text };
}

export async function mergeCandidate(repository, state, text, api = githubApi) {
  const current = await inspectCandidate(
    repository,
    state.number,
    state.base,
    api,
  );
  if (
    current.head !== state.head ||
    current.digest !== state.digest ||
    digest(text) !== state.digest
  ) {
    throw new Error("Candidate changed after validation; refusing to merge");
  }
  if ((await api(`repos/${repository}/commits/main`)).sha !== state.base) {
    throw new Error("Website advanced immediately before merging");
  }
  const result = await api(
    `repos/${repository}/pulls/${state.number}/merge`,
    {
      sha: state.head,
      merge_method: "squash",
      commit_title: `content: refresh public GitHub projects (#${state.number})`,
    },
    "PUT",
  );
  if (!result.merged || !shaPattern.test(result.sha)) {
    throw new Error("GitHub did not merge the validated PR");
  }
  return result.sha;
}

export async function dispatchProduction(repository, api = githubApi) {
  // GITHUB_TOKEN merges do not trigger push workflows. Dispatch explicitly.
  await api(
    `repos/${repository}/actions/workflows/journal-build.yml/dispatches`,
    { ref: "main" },
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [command, directory, rawNumber] = process.argv.slice(2);
  const repository = process.env.GITHUB_REPOSITORY;
  if (
    !directory ||
    !["prepare", "record", "merge", "deploy"].includes(command)
  ) {
    throw new Error(
      "Usage: project-publish.mjs prepare|record|merge|deploy <temporary-directory> [PR-number]",
    );
  }
  const statePath = path.join(directory, "publication.json");
  // create-pull-request restores its original checkout after creating the branch.
  // Compare against the exact bytes saved by the successful checks instead.
  const validatedPath = path.join(directory, "validated-projects.json");
  if (command === "prepare" || command === "record") {
    const { text, ...state } = await inspectCandidate(
      repository,
      Number(rawNumber),
      process.env.GITHUB_SHA,
    );
    if (command === "prepare") await writeFile(contentPath, text);
    else if (digest(await readFile(validatedPath, "utf8")) !== state.digest) {
      throw new Error("PR content differs from the validated working copy");
    }
    await mkdir(directory, { recursive: true });
    await writeFile(statePath, JSON.stringify(state));
  }
  if (command === "merge") {
    const state = JSON.parse(await readFile(statePath, "utf8"));
    const sha = await mergeCandidate(
      repository,
      state,
      await readFile(validatedPath, "utf8"),
    );
    console.log(`Merged content PR #${state.number} as ${sha}`);
  }
  if (command === "deploy") {
    await dispatchProduction(repository);
    console.log(
      `Production workflow dispatched: https://github.com/${repository}/actions/workflows/journal-build.yml`,
    );
  }
}
