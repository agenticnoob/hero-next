# GitHub project publishing

`hero-next` serves committed `data/projects.json` and owns the public-project scanner,
content validator, curated cases, media, and production workflow. Its active workflows
never read a Codex subscription login. The private
[`hero-next-automation`](https://github.com/agenticnoob/hero-next-automation) repository
owns the daily schedule, trusted prompt, output schema, pinned Docker image, login
lifecycle, PR publisher, and their tests. The four curated cases and manual ordering
remain independent of generated directory entries.

## Current state

The private-cloud changed-source run, no-change follow-up, credential cleanup,
and pre-publication audit passed. The website is now public, and the private
automation's post-publication changed-source run passed generation, content PR
checks and merge, normal-push Vercel Production deployment, and public snapshot
verification. A public-surface credential signature audit also passed within its
documented scope. `PROJECT_SYNC_ACTIVE=true`; the old website Environment has
no subscription secrets. See [STATUS.md](./STATUS.md) for run links and limits.

## Trust and permissions

| App                       | Installed only on                  | Repository permissions                                                                  | Secret location                                                                                                      |
| ------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `hero-next-publisher`     | `agenticnoob/hero-next`            | Contents read/write; Pull requests read/write; Checks read; Actions read; Metadata read | Automation repository Actions repository secrets: `HERO_APP_ID`, `HERO_APP_PRIVATE_KEY`                              |
| `hero-next-session-store` | `agenticnoob/hero-next-automation` | Environments read/write; Metadata read                                                  | Automation repository `project-content` Environment secrets: `SESSION_STORE_APP_ID`, `SESSION_STORE_APP_PRIVATE_KEY` |

Actions read is required to identify the `journal-build.yml` run with `event=push`,
match its merge SHA and wait for its final conclusion. Neither App has Actions write,
Secrets, Administration, or access to the other App's repository. The Publisher App
never receives subscription authentication. Its installation token is created separately
in the `collect` and `review` jobs, restricted to `hero-next`. The Session-store App
token is created only in `generate`, restricted to `hero-next-automation`, and only
writes `CODEX_AUTH_JSON` in `project-content`. Neither token enters the Codex container.

Create the `project-content` Environment in the private automation repository with
**main only** and no required reviewers. Store `CODEX_AUTH_JSON` there as a third
Environment secret; do not create repository-level copies of these three values.
Keep the whole workflow serialized with `cancel-in-progress: false`. Environment
secrets are read when `generate` actually starts, after queued runs have waited.
The repository variable `PROJECT_SYNC_ACTIVE` must be `true` to allow collection;
leave it unset while installing the Apps and moving the old workflow.

The dedicated Hero Next login uses `codex -c 'cli_auth_credentials_store="file"'
login --device-auth` in a new temporary `CODEX_HOME`. Never copy a desktop login,
another project's `auth.json`, or an API key. Before upload, validate it with the
private automation repository's `scripts/project-auth.mjs` validator: `auth_mode`
`chatgpt`, nonempty access/refresh/id tokens and `account_id`, no `OPENAI_API_KEY`,
and at most 40 KB. Upload directly from the temporary file through `gh secret set
CODEX_AUTH_JSON --repo agenticnoob/hero-next-automation --env project-content <
auth.json`; do not print it or send it through chat. Remove that temporary login
only after upload succeeds. Do not log out the uploaded session.

A changed-source run restores the Environment secret, creates a Session-store App
token, and writes the unchanged auth file back before any Codex call. A failed
preflight stops generation. Codex 0.155.1 runs `gpt-5.6-sol` at medium reasoning
with read-only sandboxing, disabled shell/web/code mode/subagents, in a disposable
unprivileged Docker container. It mounts only prompt, schema, a dedicated auth
directory and model-output directory; it receives neither checkout nor GitHub token.
After container shutdown, an `always()` step writes the possibly refreshed login
back. Each write is limited to three attempts. Malformed, oversized, symlinked or
account-switched files are rejected. Child stderr is reduced to fixed diagnostic
codes; raw token-bearing errors are not logged. Failed writeback blocks the output
artifact and PR. The workflow never calls an OAuth refresh endpoint itself.

## Source and publication contract

The scan runs daily at 02:43 UTC (10:43 Asia/Shanghai) and supports manual dispatch.
It discovers owned public, non-fork, non-archived repositories with nonempty README
files. The numeric GitHub repository ID is the stable identity. README blob, name,
description, language and topics form the source digest, so code-only commits do not
call Codex. Newly eligible sources and changed README files are processed; missing
or private sources stay published until deliberately removed in a reviewed change.
The scan handles at most ten changes and 180 KB of README input per run. Source
README text is untrusted and is never executed. The model returns schema-constrained
bilingual content; trusted `scripts/sync-projects.mjs` supplies real repository IDs,
names and URLs. Only `data/projects.json` can be changed by automation.

The stable PR branch is `automation/github-project-introductions`. An existing open
content PR is loaded as a data blob and revalidated without running Codex or creating
another PR. The private review job applies generated content in a trusted main
checkout, runs `npm run check`, `npm run build`, `git diff --check`, and verifies the
changed-file scope. The website's secret-free `project-content-check.yml` performs
the same gates on the PR. Publication waits for every check run to pass. The trusted
publisher checks bot author, branch, base, file mode, exact content, unchanged
published data, and checked head SHA immediately before squash merge. A failure
leaves the PR and run logs for diagnosis.

The Publisher App merge creates a normal `hero-next/main` push. The private workflow
waits for `journal-build.yml` with `event=push` and the exact merge SHA, then requires
a successful conclusion. That production workflow builds with the real journal,
deploys prebuilt output to Vercel Production and verifies the public snapshot. A
started run is never reported as a completed deployment. The synthetic journal used
for candidate checks is never deployed.

## Activation and public-readiness sequence

1. Land the private automation code while `PROJECT_SYNC_ACTIVE` is unset; remove the
   old active `projects-sync.yml` from `hero-next` and land its site PR.
2. Create the two dedicated Apps and store only the secrets listed above. Initialize
   a separate Hero Next ChatGPT-managed device login. Set `PROJECT_SYNC_ACTIVE=true`.
3. Run a changed-source private cloud scan and inspect preflight writeback, Codex,
   post-generation writeback, content PR, checks, exact-head merge, normal main push,
   completed production workflow and Vercel Production receipt.
4. Run a second unchanged scan and confirm `generate` and `review` skip without a
   model call. A no-change run does not validate subscription authentication.
5. Report exact legacy targets and evidence before removing `CODEX_AUTH_WRITE_TOKEN`,
   `CODEX_AUTH_JSON`, and old `project-content` Environment secrets from `hero-next`.
   Confirm no active website workflow can read the subscription login.
6. Only then change `hero-next` to public. Manually run the private automation again,
   verify the cross-repository flow, and audit public Actions, artifacts, logs, Git
   history and build output for credentials.

## Local maintenance

The website scanner is still usable directly. From the website checkout:

```bash
PROJECT_PROMPT_FILE=../hero-next-automation/codex/projects-prompt.md node scripts/sync-projects.mjs scan /tmp/hero-project-sync
npm run check:projects
```

The scanner reads only public source data and writes a temporary plan/prompt. The
private repository holds the prompt, schema, authentication and publication tests.
No local Codex session is needed for routine scheduled runs.
