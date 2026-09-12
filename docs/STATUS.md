# Current Status

Last verified: 2026-09-12.

Hero Next is a standalone private Next.js site consuming public Viselora packages.
Its private repository is [agenticnoob/hero-next](https://github.com/agenticnoob/hero-next),
with `main` as the production source branch. The existing local branch remains
`axmorf/standalone`.

## Release preparation

The initial application, documentation and Actions workflow were committed as
`81d27df63a564cca9b817a7f5047b1debef12ca0` and pushed to `main`. The website's
`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_PRODUCTION_URL` and the source
repository's `HERO_NEXT_REPOSITORY` variables are configured.

Vercel project `hero-next` (`prj_DqmZ9hblXxRyX8K51nPM5S9uQMCp`) now exists in
`agent-first`, uses Node.js 22 and has the assigned production domain
`hero-next-jade.vercel.app`. It has no Git integration or deployment yet.
The application's Node engine is also constrained to `22.x`, so Vercel does not
select Node 24 from the previous open-ended range.

A dedicated `agent-first` team-scoped `VERCEL_TOKEN` is stored in the website's
Actions secrets and expires on 2026-12-11. Its broader team scope was explicitly
approved because Vercel CLI 59.16.0 `pull` also queries the owning team; the
previous project-only token returned `403 team_unauthorized`. Production settings
now pull successfully with the new token. Revocation of the replaced project-only
token awaits separate approval. The receiver remains disabled pending first
activation; no successful cloud deployment or automatic data update is claimed yet.

Both GitHub credentials are configured and verified: `JOURNAL_READ_TOKEN` reads
only `vibe-journal-pipeline`; `HERO_NEXT_DISPATCH_TOKEN` grants Contents write
only on `hero-next` for repository dispatch. Both expire on 2026-12-11. The
temporary local GitHub token files have been removed after Secret storage was
read back. The journal repository's pending source update is still unpublished,
preserving the first-deployment-then-source-push verification sequence.

GitHub Actions owns production building and deployment. The workflow receives
`journal_updated` and website pushes to `main`, supports manual/daily
reconciliation, checks out an exact data revision, exports public fields, runs
the quality gate, builds with Vercel CLI and
publishes the prebuilt output. The public page and snapshot must pass
hash/revision/count/date readback. Direct Vercel Git deployments are disabled.
See [journal publishing](./journal-publishing.md) for setup and activation.

The private source repository is `agenticnoob/vibe-journal-pipeline` (`master`).
Its published commit `607dc353080a7dc433bb7d159befead42ddcb11b` has 92 journal
records / 90 Timeline events, latest 2026-08-18. The reviewed local update has
110 journal records / 108 events / 224 skills, latest 2026-09-11. It will be pushed
after the first website deployment to prove the notification and automatic
redeployment path.

## Application and data

The four chapters, paired continuous Timeline, theme text continuity and
reduced-motion semantics remain intact. One runtime, canvas, scroll source and
committed theme own the experience. Published Viselora packages remain pinned to
`0.1.0-alpha.2`; application dependency versions are unchanged.

Profile DOM and Canvas share responsive lengths and actual root font size. Atlas
composition, profile/default artwork and generic Canvas text have separate owners.
The project room enforces four walls in types and input validation; chapter
numbers and interface translations use shared content. React state initializers
retain stores/bindings, shared viewport subscriptions clean up their observers,
and frame state remains outside React.

Journal JSON is validated before rendering. Requests cancel on cleanup, exclude
late results and support retry. Public export contains only date, compact tools
and Timeline event. Tool descriptions after colons or spaced em/en dashes are
stripped, including an identified description containing a local path. The local
snapshot now contains 108 entries, latest 2026-09-11, with source revision null
until generated from a committed revision. Conversations, caches, credentials,
local manifests and generated snapshots remain outside Git.

## Verification

Node.js 22.22.3 / npm 10.9.8:

- `npm run check` passes: ESLint with zero warnings, Prettier, 44 files / 303 tests,
  both typechecks and the 94-file standalone package guard.
- Production build passes; Next.js 16.2.10 prerenders `/`.
- Both GitHub Actions workflows pass Actionlint. Twenty deployment readback tests
  cover exact snapshot bytes and metadata, stale pages, invalid origins and HTTP
  errors without forwarding deployment credentials.
- The preceding TypeScript-aware module scan found no runtime cycles in 87 modules.
- All 110 source journal records pass business/type validation; Timeline/skills
  match deterministic regeneration. The source project's 96 unittest cases pass.
- The 998 strings in the new public snapshot contain no user-directory paths or
  credential patterns. A generic system-service path in one Timeline event is
  intentionally retained as authored.

The preceding full React Doctor 0.9.13 scan covered 138 supported files: 64/100,
five findings. Two Profile cleanup errors and one vendor WASM warning were
rejected by source evidence; two array-iteration suggestions need profiling.
No rules were suppressed. Publishing changes do not alter React components.

Local production Ego/Chromium checks covered 1440×900 desktop and 390×844 / DPR 2
touch: real mesh holds in both theme directions, retained Portal text, locale
switching, all four project selections, 16/20px roots and the Timeline. A settled
wheel round trip moved the journal window `0 → 4 → 0`, retaining 16 paired dates.
Mobile reduced motion retained the complete final date/event. Sampled states had
one canvas, no overflow and no captured page/rejection/JavaScript console errors
or warnings. These are local emulation checks; deployed-site, physical-device
and Safari acceptance are separate.

ESLint 9.39.5 matches pinned Next.js plugin peers; its EOL remains a toolchain
limitation. The journal client checks the hash format/path contract, while
production deployment readback verifies actual bytes. Without-WebGL visual
fallback has not been accepted; semantic Timeline content is present after load.

Earlier implementation and detailed browser evidence are preserved in
[the predeployment record](./archive/2026-09-12-predeployment-status.md).
