# GitHub project publishing

GitHub-hosted Actions performs the daily scan and optional Codex generation. No
desktop Codex session, laptop, home server, local scheduler or database is needed.
The website reads the committed `data/projects.json`; visitors never call GitHub
or a model. The four manually written cases remain separate and retain their media.

## Activate with a Codex subscription

The content generator uses ChatGPT-managed Codex authentication and the subscription's
usage limits. It does not use an OpenAI API key. GitHub Actions usage is separate and
remains subject to the GitHub account's minutes and storage limits.

The dedicated `hero-next-codex-auth-writeback` token is restricted to `hero-next`
with Environments read/write and Metadata read. It expires on **2026-12-21**;
replace `CODEX_AUTH_WRITE_TOKEN` in `project-content` before that date.

1. Keep this website repository **private**. The workflow refuses public repositories.
   Public source repositories are read as data; the authenticated job belongs to this
   private website repository.
2. Create a GitHub environment named **project-content** in this repository. Restrict
   its deployment branches to **main**. Use a GitHub plan that supports environment
   secrets for private repositories. Required reviewers on this environment would
   require approval for each generation; leave them unset for unattended operation.
3. Create a fine-grained GitHub personal access token, restricted to this repository,
   with **Environments: Read and write** (and implicit Metadata read). Store it in
   that environment as **CODEX_AUTH_WRITE_TOKEN**. It only manages the saved login;
   it does not need Contents write or Pull requests write. Set an expiration and
   replace it before expiry. The normal `GITHUB_TOKEN` cannot update these secrets.
4. Make a **separate Codex login session** for this workflow and store its `auth.json`
   as the environment secret **CODEX_AUTH_JSON**, following the bootstrap below.
   Never reuse the desktop/CLI's live auth file or use this session in another job.
   Neither secret belongs at repository scope: environment secrets are loaded when
   the generation job starts, after the workflow concurrency lock, so queued runs
   receive the newly refreshed login.
5. In **Settings → Actions → General → Workflow permissions**, enable **Allow
   GitHub Actions to create and approve pull requests**. This workflow creates and merges its validated data-only PRs
   using the job-scoped token. It does not approve arbitrary PRs. Organization policy may restrict this setting.
6. Publish these changes to the default branch; scheduled workflows only run there.
   With `topic: null`, the scan automatically discovers owned public repositories,
   including newly created ones. To opt into manual selection instead, set `topic`
   to `portfolio`; matching topics or full `agenticnoob/name` entries in `include`
   then select repositories. Forks, archived, disabled and private source repositories
   remain excluded in either mode.
7. Run **Publish GitHub project content** from Actions once. Check generation,
   credential writeback, automatic merging and the dispatched production run. An unchanged
   or empty source selection tests only scanning, not subscription authentication.

### One-time login bootstrap

Use an up-to-date Codex CLI and an authenticated GitHub CLI. Run from this website
repository on a trusted computer. The temporary directory isolates this session
from the desktop login; the computer is only needed for this initial authorization.

```bash
project_auth_dir=$(mktemp -d "${TMPDIR:-/tmp}/hero-project-auth.XXXXXX")
CODEX_HOME="$project_auth_dir" codex -c 'cli_auth_credentials_store="file"' login
node --input-type=module - "$project_auth_dir/auth.json" <<'NODE'
import { readFile } from 'node:fs/promises';
import { validateManagedAuth } from './scripts/project-auth.mjs';
validateManagedAuth(await readFile(process.argv[2], 'utf8'));
console.log('Dedicated subscription login validated; no credentials printed.');
NODE
```

After successful login and validation, upload directly through stdin. Do not print
or paste the file into chat. GitHub CLI encrypts the value before sending it.

```bash
gh secret set CODEX_AUTH_JSON --repo agenticnoob/hero-next --env project-content < "$project_auth_dir/auth.json"
```

Only after the upload succeeds, remove that dedicated temporary login directory:

```bash
rm -rf -- "$project_auth_dir"
```

Do not run `codex logout` on the copied session: it is now owned by the cloud job.
No laptop, desktop application or home server needs to stay running afterward.

The default `topic: null` needs no tag maintenance for new public projects. A local
scan on 2026-09-22 found four eligible projects; missing READMEs are skipped. The
config excludes existing manual cases by immutable repository id:
`1272434230` (Viselora's `dom-webgl-workspace`) and `1312260600` (SyringeMeter).
The other manual source repositories were outside that owned-public inventory.
If another manual case becomes eligible, add its id to `excludeIds` to avoid
duplicate copy.

## Operation

The schedule is 02:43 UTC daily (10:43 Asia/Shanghai), with manual dispatch available.
GitHub schedules can be delayed. Each run follows pagination for owned public repos,
pins the default branch commit and reads that commit's README. A digest covers the
README blob, repository name, description, topics and language. Code-only commits
do not call the model again. An id-based `gh-<repository id>` URL survives renames.

At most ten changed projects and 180 KB of README source are generated per run.
Individual READMEs are limited to 120 KB. Unchanged entries and source
metadata retain their previous values. Additional changes follow on the next run.
An open `axmorf/project-content` PR skips scanning and generation; the workflow instead
loads only its data blob into the current trusted main checkout, revalidates it, then
merges it if all gates pass. It never checks out or executes code from that PR. This
also resumes earlier manual-review PRs without spending another model call. A failed
candidate remains open for diagnosis; closing it permits a fresh proposal. Rejected
content will be proposed again unless its source is excluded or corrected.

README and description text are untrusted input. A separate generation job restores
subscription auth only when the scan found changes. Codex CLI 0.155.1 runs with
`gpt-5.6-sol` and explicit `model_reasoning_effort="medium"`, a fixed prompt,
structured output and read-only sandboxing in a disposable,
unprivileged Docker container. Shell, web search, code mode and subagents are disabled.
The container receives only the prompt, schema, dedicated auth directory and output
directory; it does not mount the checkout, Docker socket, GitHub token or deployment
credentials. The Node base image is digest-pinned and the CLI version is fixed.
The runtime explicitly installs and checks the system CA bundle; the slim Node base
removes it, while Codex's native HTTPS client requires it to verify server certificates.
Raw model stdout/stderr are suppressed because they could include newly rotated tokens.
The runner reports only fixed diagnostic categories (for example TLS, authorization,
rate-limit, stream-retry or timeout); these are troubleshooting hints, not raw errors.
It emits only numeric ids and plain bilingual text. A fresh job independently checks
ids, fields, bounds, locale structure and the input digest before composing trusted
GitHub URLs. Only `data/projects.json` can enter the automated PR. No README HTML,
remote scripts, images, arbitrary URLs or source repository code are executed.

The review job runs `npm run check` and `npm run build` before opening the PR, using
a synthetic journal fixture solely for that build. The fixture is gitignored and
never deployed. This pipeline does not depend on a follow-up PR check. Before
merging, it requires an open, non-draft, same-repository PR authored by GitHub Actions
on the dedicated content branch, changing only the regular `data/projects.json` file.
It rejects deleted entries, conflicting published-data changes, an advanced main
revision, or a changed PR head/content. GitHub receives the exact checked head SHA
with the squash-merge request; repository protection rules are not bypassed.

A bot merge using `GITHUB_TOKEN` does not trigger ordinary push workflows. The review
job therefore has scoped `actions: write` permission and explicitly dispatches
`journal-build.yml` on main after a successful merge. The production workflow fetches
the real journal, repeats checks/build, rejects superseded revisions and verifies the
public journal after deployment. PRs remain as an audit trail; manual approval is no
longer required. Automatic checks validate structure and builds, not the factual
accuracy of every generated sentence.

If merging fails, the next run revalidates the pending PR without generating again.
If deployment dispatch fails after a merge, the sync run fails visibly: rerun **Deploy
journal to production** on main; the existing daily production schedule also provides
a fallback. A dispatched run is not itself proof of a completed deployment: follow
its result from the link in the sync summary. No additional PAT or Vercel credential
is exposed to the content workflow.

Missing/empty README sources are skipped with a run log; their old entries survive.
API errors, oversized README files, invalid model output, stale website revisions
and failed checks stop before a PR is published. Existing committed content remains
available. Changes are written atomically after complete validation. Disappearing,
private, archived or newly excluded repositories are never automatically deleted:
remove their snapshot entries in a reviewed change when intentional. This means
making a repository private does not retract text previously published on the site.

## Local maintenance

```bash
npm run check:projects
node scripts/sync-projects.mjs scan /tmp/hero-project-sync
```

The scan is read-only and uses optional `GH_TOKEN` for GitHub API rate limits. It
writes temporary `plan.json` and `prompt.md`, never modifies the snapshot. To test
composition, provide schema-conforming `generated.json` alongside the plan and run:

```bash
node scripts/sync-projects.mjs apply /tmp/hero-project-sync
npm exec -- prettier --write data/projects.json
```

Review the resulting diff and run the full checks. The final data validator is
`scripts/project-data.mjs`; its `.d.mts` declaration is shared with the frontend.
Actions, the container base and Codex CLI are pinned; update them deliberately and
rerun the checks. Model availability must also be checked when updating the CLI.

## Credential refresh and failure recovery

The workflow is serialized (`cancel-in-progress: false`). Before running Codex,
`project-auth.mjs` validates the login and verifies writeback by saving the current
value to the environment secret. The GitHub write token is only exposed to the host
writeback steps, never to the model container.

Codex handles its own refresh during a normal generation call. After the container
has stopped, an `always()` step saves the current `auth.json`, even if generation
failed after rotating tokens. Transient write failures are retried three times.
A failed save fails the job and blocks the content artifact and PR. Temporary auth,
model state and logs are never cached or uploaded; the final artifact names only
`plan.json` and `generated.json`. Local temporary files are removed afterward.

No changes means no Codex startup, login restore, refresh request or model call.
There is no paid/model heartbeat to keep the session alive. Long inactivity, token
revocation, forced cancellation, loss of a runner during rotation, or an expired
GitHub write token may require manual recovery. If the saved login no longer works,
repeat the dedicated login bootstrap while no workflow is running. Do not repeatedly
rerun an old seed or copy the desktop's current session. Renew a failed GitHub token
in the environment before generating again.

The [first successful full cloud run](https://github.com/agenticnoob/hero-next/actions/runs/35648295114)
verified subscription generation in the container, login persistence, content validation,
the full quality gate, the build and content PR creation. A repeat scan against the
generated candidate returned zero changes. Token expiry was not forced; the first run
does not prove long-term unattended refresh. Current publication and verification
details live in [STATUS.md](./STATUS.md).

Primary documentation:
[Codex reasoning configuration](https://learn.chatgpt.com/docs/config-file/config-reference#model_reasoning_effort),
[Codex subscription auth in CI](https://learn.chatgpt.com/docs/auth/ci-cd-auth),
[GitHub secret loading times](https://docs.github.com/en/actions/reference/security/secrets#when-github-actions-reads-secrets),
[environment secret write permissions](https://docs.github.com/en/rest/actions/secrets#create-or-update-an-environment-secret),
[GitHub schedules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule),
[token-triggered workflow limits](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow#triggering-a-workflow-from-a-workflow),
[workflow permissions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication).
