# Journal publishing

The site consumes daily JSON from `agenticnoob/vibe-journal-pipeline` without a
backend, database, runtime GitHub token, or access to the local conversation DBs.
The final Hub after chapter four shows the journal; there is no separate journal
page. Only compact Timeline content is displayed, with each date paired across
both visual lanes.

## Local use

```bash
npm ci
npm run sync:journal -- --source /Users/ai/projects/vibe-journal-pipeline/data
npm run build
npm run start -- --hostname 127.0.0.1 --port 3003
```

The input directory must contain `TIMELINE.json` and `journal/YYYY-MM-DD.json`.
The script joins Timeline events to journal tool lists by **exact date**, never
by array position. It rejects duplicate Timeline dates, unmatched dates and
invalid shapes before replacing the current snapshot. Empty events are omitted;
it does not substitute full journal paragraphs when an event is absent.

Schema 2 exports only `{ date, tools, event }`, newest first. Tool names come
from `body.今天用了啥`, with colon-delimited or space-delimited em/en-dash explanations
removed. Descriptions containing local paths are not tool names. The visual lane
shows at most six names plus the total when longer; the semantic DOM retains the
complete compact list. `body.干了啥`, résumé text, session/turn counts, conversation
archives, caches and `skills.json` are not exported. Timeline event text is kept
as authored; long summaries get more track space without splitting the date.

The output is an immutable content-hashed JSON file in `public/journal/` and a
small `.journal/manifest.json`. Both are gitignored. The manifest is written last
so a failed import preserves the previous snapshot. Optional `--revision` records
the full source commit SHA. A fresh build requires a generated snapshot and fails
with a setup instruction if it is missing. Rebuilding a deployment must include
the same snapshot referenced by its manifest; do not deploy only the HTML.

## Cloud flow

1. Generate, review, commit and push journal JSON in the data repository. Its
   existing script creates local commits only; it does not push for you.
2. `.github/workflows/notify-hero-next.yml` in the data repository listens for
   journal or `TIMELINE.json` changes pushed to `master`. It sends `journal_updated` through GitHub's
   `repository_dispatch` API with the source repository and exact commit SHA.
3. `.github/workflows/journal-build.yml` in Hero Next receives the event on the
   website repository's default branch. It checks the source identity and SHA,
   reads only the source journal directory and `TIMELINE.json`, runs the exporter
   and the complete website quality gate, then builds for production with Vercel CLI.
4. The same GitHub Actions run deploys the prebuilt output to Vercel and reads
   the public production page and snapshot back. Deployment succeeds only when
   the snapshot hash, source revision, count and latest date match the local manifest.

GitHub Actions owns production building and deployment. `vercel.json` disables
Vercel's separate Git-triggered deployment path, so a Git push cannot bypass the
quality gate or build a site without its matching journal snapshot. The Vercel CLI
version is pinned in the workflow. Tokens stay in Actions secrets and are never
passed to the public readback script.

Notifications go to GitHub's cloud repository, not this local checkout. Local
updates remain explicit `sync:journal` runs. Website pushes to `main`, a daily
02:23 UTC reconciliation and a manual trigger also run the receiver; these
resolve the current source default-branch head unless a manual full SHA is supplied. Delayed notifications
for a superseded head are skipped. Production builds are serialized. Before
deploying, the workflow checks both source and website heads again so a superseded
build cannot overwrite the production site.

## Publishing website changes

For application or documentation changes, review the diff and run `npm run check`
and `npm run build`, then commit and push the reviewed website revision to `main`.
The local `axmorf/standalone` branch tracks `origin/main`; an explicit
`git push origin HEAD:main` publishes that branch's current commit without renaming
the local branch. Confirm the remote head has not advanced before pushing and
resolve divergence without force-pushing.

Follow the `Deploy journal to production` run for that exact website SHA. A green
run may have skipped publication when either repository advanced: confirm that
both the publish and public snapshot verification steps completed successfully.
After a content change, also read back the affected production content and links;
the journal hash check alone does not validate chapter copy. For the SyringeMeter
showcase, verify direct `/projects/syringe-meter` visits and chapter-three dialog
navigation, the side-wall image and pointer parallax, article content, and actual
video playback/seeking. Check mobile reading mode as well as the desktop room.
Its committed media under `public/projects/syringe-meter/` deploy with the website;
they do not come from the generated journal snapshot. Record the exact application
commit, run URL and readback evidence in [STATUS.md](./STATUS.md).
Documentation follow-up pushes run the same pipeline and must also finish before
the release is considered complete.

## One-time GitHub configuration

The private website repository is `agenticnoob/hero-next` (default branch `main`);
the private data repository is `agenticnoob/vibe-journal-pipeline` (`master`). Put
both workflow files on those branches, create/link the `hero-next` Vercel project
under the existing `agent-first` team, and configure:

| Repository            | Setting                                   | Value / access                                                                         |
| --------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| vibe-journal-pipeline | Actions variable `HERO_NEXT_REPOSITORY`   | `agenticnoob/hero-next`, checked against the sender's allowed destination              |
| vibe-journal-pipeline | Actions secret `HERO_NEXT_DISPATCH_TOKEN` | Fine-grained token restricted to the website repository, Contents: write, for dispatch |
| Hero Next             | Actions secret `JOURNAL_READ_TOKEN`       | Fine-grained token restricted to the private data repository, Contents: read           |
| Hero Next             | Actions secret `VERCEL_TOKEN`             | Dedicated Vercel automation token with team access required by CLI 59.16.0             |
| Hero Next             | Actions variable `VERCEL_ORG_ID`          | Linked Vercel team ID                                                                  |
| Hero Next             | Actions variable `VERCEL_PROJECT_ID`      | Linked Vercel project ID                                                               |
| Hero Next             | Actions variable `VERCEL_PRODUCTION_URL`  | Public HTTPS production origin used for post-deploy verification                       |

Vercel CLI 59.16.0 resolves the owning team during `pull`. A project-scoped token
passes direct project API requests but fails that team lookup with
`403 team_unauthorized`. The standard CLI workflow therefore needs a dedicated
team-scoped token, whose access includes every project in that team. The current
scope decision and activation state are recorded in [STATUS.md](./STATUS.md).

Set token expiration and owner according to the account's policy. A GitHub App
may replace these tokens later; it is not needed for this two-repository setup.
The default `GITHUB_TOKEN` cannot read a different private repository. No token
is stored in source, browser props, generated JSON, or the deployment artifact.

After configuring the project, variables and secrets, enable the receiver with
`gh workflow enable journal-build.yml -R agenticnoob/hero-next`. For the first
release, run the website workflow manually and verify its source
SHA and deployed JSON before publishing the pending data update. Then push the
reviewed journal update to `master` and verify both the notification run and the
resulting website deployment. A successful notification alone is not a successful
deployment. Current activation and run evidence belong in [STATUS.md](./STATUS.md).

The website needs no runtime GitHub credential or database: Vercel receives only
the application build and its public snapshot. The data generator still commits
locally; the existing generation schedule is unchanged and its output must be
pushed before cloud automation can see a new day.

References: [repository dispatch events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#repository_dispatch),
[private cross-repository checkout](https://github.com/actions/checkout#checkout-multiple-repos-private).
Deployment references: [GitHub Actions with Vercel](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel),
[disabling direct Git deployments](https://vercel.com/docs/project-configuration/git-configuration),
[project-scoped Vercel tokens](https://vercel.com/docs/cli/tokens).
