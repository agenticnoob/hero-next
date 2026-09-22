// @vitest-environment node
import { readFile } from "node:fs/promises";
import { describe, expect, test, vi } from "vitest";
import {
  dispatchProduction,
  inspectCandidate,
  mergeCandidate,
} from "../scripts/project-publish.mjs";

const repository = "example/site";
const base = "a".repeat(40);
const head = "b".repeat(40);
const blobSha = "c".repeat(40);
const ancestor = "d".repeat(40);
const empty = { version: 1, projects: [] };
const content = {
  title: "Demo",
  summary: "A useful tool",
  sections: [
    { id: "overview", title: "Overview", paragraphs: ["From the README."] },
  ],
};
const project = {
  id: 42,
  slug: "gh-42",
  repository: "example/demo",
  url: "https://github.com/example/demo",
  readmeSha: base,
  sourceCommit: base,
  sourceDigest: "e".repeat(64),
  updatedAt: "2026-09-22T00:00:00Z",
  topics: [],
  language: null,
  content: { zh: content, en: content },
};
const serialized = JSON.stringify({ version: 1, projects: [project] });
function fixture() {
  const pr = {
    state: "open",
    draft: false,
    user: { login: "github-actions[bot]" },
    changed_files: 1,
    head: {
      sha: head,
      ref: "axmorf/project-content",
      repo: { full_name: repository },
    },
    base: { sha: ancestor, ref: "main", repo: { full_name: repository } },
  };
  const files = [
    { filename: "data/projects.json", status: "modified", sha: blobSha },
  ];
  const tree = {
    truncated: false,
    tree: [
      {
        path: "data/projects.json",
        mode: "100644",
        type: "blob",
        sha: blobSha,
      },
    ],
  };
  const current = {
    sha: "f".repeat(40),
    content: Buffer.from(JSON.stringify(empty)).toString("base64"),
  };
  const previous = { ...current };
  const blob = {
    encoding: "base64",
    size: serialized.length,
    content: Buffer.from(serialized).toString("base64"),
  };
  const main = { sha: base };
  const endpoints: Record<string, unknown> = {
    "": { private: true, default_branch: "main" },
    "/pulls/1": pr,
    "/commits/main": main,
    "/pulls/1/files?per_page=100": files,
    [`/git/trees/${head}?recursive=1`]: tree,
    [`/compare/${base}...${head}`]: { merge_base_commit: { sha: ancestor } },
    [`/contents/data/projects.json?ref=${base}`]: current,
    [`/contents/data/projects.json?ref=${ancestor}`]: previous,
    [`/git/blobs/${blobSha}`]: blob,
    "/pulls/1/merge": { merged: true, sha: "9".repeat(40) },
    "/actions/workflows/journal-build.yml/dispatches": null,
  };
  const api = vi.fn(async (...args: [string, object?, string?]) => {
    const [endpoint] = args;
    const key = endpoint.replace(`repos/${repository}`, "");
    if (!(key in endpoints)) throw new Error(`Unexpected endpoint ${endpoint}`);
    return endpoints[key];
  });
  return { api, pr, files, tree, current, previous, blob, main, endpoints };
}

describe("automatic project publication", () => {
  test("revalidates an older data-only PR against current main without executing PR code", async () => {
    const { api } = fixture();
    const candidate = await inspectCandidate(repository, 1, base, api);
    expect(candidate).toMatchObject({
      number: 1,
      head,
      base,
      text: serialized,
    });
    const merged = await mergeCandidate(repository, candidate, serialized, api);
    expect(merged).toBe("9".repeat(40));
    expect(api).toHaveBeenLastCalledWith(
      `repos/${repository}/pulls/1/merge`,
      {
        sha: head,
        merge_method: "squash",
        commit_title: "content: refresh public GitHub projects (#1)",
      },
      "PUT",
    );
    expect(
      api.mock.calls.some(([endpoint]) => endpoint.includes("/dispatches")),
    ).toBe(false);
    await dispatchProduction(repository, api);
    expect(api).toHaveBeenLastCalledWith(
      `repos/${repository}/actions/workflows/journal-build.yml/dispatches`,
      { ref: "main" },
    );
  });

  test.each([
    "foreign",
    "human",
    "draft",
    "closed",
    "branch",
    "extra-file",
    "rename",
    "symlink",
    "truncated",
    "advanced-main",
    "changed-data",
    "invalid-data",
    "deletion",
  ])("blocks unsafe candidate: %s", async (scenario) => {
    const f = fixture();
    if (scenario === "foreign") f.pr.head.repo.full_name = "other/site";
    if (scenario === "human") f.pr.user.login = "example";
    if (scenario === "draft") f.pr.draft = true;
    if (scenario === "closed") f.pr.state = "closed";
    if (scenario === "branch") f.pr.head.ref = "feature";
    if (scenario === "extra-file")
      f.files.push({ ...f.files[0], filename: "scripts/project-publish.mjs" });
    if (scenario === "rename") f.files[0].status = "renamed";
    if (scenario === "symlink") f.tree.tree[0].mode = "120000";
    if (scenario === "truncated") f.tree.truncated = true;
    if (scenario === "advanced-main") f.main.sha = "7".repeat(40);
    if (scenario === "changed-data") f.current.sha = "8".repeat(40);
    if (scenario === "invalid-data")
      f.blob.content = Buffer.from('{"projects":[]}').toString("base64");
    if (scenario === "deletion") {
      f.current.content = Buffer.from(
        JSON.stringify({ version: 1, projects: [project] }),
      ).toString("base64");
      f.blob.content = Buffer.from(JSON.stringify(empty)).toString("base64");
    }
    await expect(
      inspectCandidate(repository, 1, base, f.api),
    ).rejects.toThrow();
    expect(f.api.mock.calls.some(([, body]) => body !== undefined)).toBe(false);
  });

  test.each(["head", "working-copy", "remote-content", "base"])(
    "refuses mutations after checks: %s",
    async (scenario) => {
      const f = fixture();
      const state = await inspectCandidate(repository, 1, base, f.api);
      let text = serialized;
      if (scenario === "head") state.head = "8".repeat(40);
      if (scenario === "working-copy") text += "\n";
      if (scenario === "remote-content")
        f.blob.content = Buffer.from(serialized + "\n").toString("base64");
      if (scenario === "base") f.main.sha = "8".repeat(40);
      await expect(
        mergeCandidate(repository, state, text, f.api),
      ).rejects.toThrow();
      expect(f.api.mock.calls.some(([, body]) => body !== undefined)).toBe(
        false,
      );
    },
  );

  test("a refused GitHub merge never dispatches production", async () => {
    const f = fixture();
    const state = await inspectCandidate(repository, 1, base, f.api);
    f.endpoints["/pulls/1/merge"] = { merged: false };
    await expect(
      mergeCandidate(repository, state, serialized, f.api),
    ).rejects.toThrow("did not merge");
    expect(
      f.api.mock.calls.some(([endpoint]) => endpoint.includes("/dispatches")),
    ).toBe(false);
  });

  test("rechecks main after the candidate API reads before sending the merge", async () => {
    const f = fixture();
    const state = await inspectCandidate(repository, 1, base, f.api);
    let mainReads = 0;
    const api = vi.fn(async (...args: [string, object?, string?]) => {
      if (args[0].endsWith("/commits/main") && ++mainReads === 2) {
        return { sha: "8".repeat(40) };
      }
      return f.api(...args);
    });
    await expect(
      mergeCandidate(repository, state, serialized, api),
    ).rejects.toThrow("immediately before merging");
    expect(api.mock.calls.some(([, body]) => body !== undefined)).toBe(false);
  });

  test("the workflow checks pending data before merging and dispatches only after success", async () => {
    const workflow = await readFile(
      ".github/workflows/projects-sync.yml",
      "utf8",
    );
    const review = workflow.split("  review:\n")[1];
    expect(review).toContain("needs: [collect, generate]");
    expect(review).toContain("needs.generate.result == 'success'");
    expect(review).toContain("needs.collect.outputs.pending != ''");
    expect(review.indexOf("project-publish.mjs prepare")).toBeLessThan(
      review.indexOf("npm run check"),
    );
    expect(review.indexOf("npm run build")).toBeLessThan(
      review.indexOf("project-publish.mjs merge"),
    );
    expect(review).toContain("if: steps.merge.outcome == 'success'");
    expect(review).toContain("actions: write");
    expect(review.indexOf("cp data/projects.json")).toBeLessThan(
      review.indexOf("uses: peter-evans/create-pull-request"),
    );
    expect(review).not.toMatch(/CODEX_AUTH|secrets\.VERCEL/);
  });
});
