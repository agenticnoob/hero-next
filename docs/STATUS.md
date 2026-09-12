# Current Status

Last verified: 2026-09-12.

Hero Next is a standalone private Next.js site consuming public Viselora packages.
Its private repository is [agenticnoob/hero-next](https://github.com/agenticnoob/hero-next),
with `main` as the production source branch. The existing local branch remains
`axmorf/standalone`.

## Privacy and directory update

Chapter one omits real identity, birth year, dated education/work
history, cities and military references from both languages of chapter one,
including its Portal and body-derived atlas. Four sections now describe reading,
code, experiments and AI. The public nickname and abstract figure remain.
Chapter four adds the user-provided [LeetCode profile](https://leetcode.cn/u/skedush/)
as its sixth row, with bilingual copy, `@skedush`, the existing hover preview and
touch layout. Desktop DOM and atlas use 10svh rows and a 9svh font cap to keep
all six entries above the footer.

`npm run check` passes all gates (44 files / 304 tests), and the production build
passes. Source and generated page/client-bundle scans found no removed identity
or military copy. These changes have not been committed, pushed or deployed;
the production release below describes the preceding published version.

Local production Ego/Chromium checks covered 1440×900 desktop in both languages
and 390×844 / DPR 2 touch emulation: chapter-one scroll and return, language
switching, six directory rows, LeetCode hover copy and the exact link destination.
Desktop rows remain above the footer with no label/arrow overlap. The mobile
English directory retained the complete LeetCode entry with reduced motion
enabled and no hover preview. All sampled states had one canvas, no horizontal
overflow, no removed profile text and no captured page/console errors or warnings.
Screenshots were inspected locally and are not committed. This pass did not test
physical devices, external-platform loading, theme holds or subjective acceptance.

## Production release

The application and aligned documentation are committed and pushed to `main`.
Production is available at [hero-next-jade.vercel.app](https://hero-next-jade.vercel.app).
The website's `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_PRODUCTION_URL` and
the source repository's `HERO_NEXT_REPOSITORY` variables are configured.

Vercel project `hero-next` (`prj_DqmZ9hblXxRyX8K51nPM5S9uQMCp`) now exists in
`agent-first`, uses Node.js 22 and has the assigned production domain
`hero-next-jade.vercel.app`. It has no Vercel Git integration; GitHub Actions
builds and publishes the production output.
The application's Node engine is also constrained to `22.x`, so Vercel does not
select Node 24 from the previous open-ended range.

A dedicated `agent-first` team-scoped `VERCEL_TOKEN` is stored in the website's
Actions secrets and expires on 2026-12-11. Its broader team scope was explicitly
approved because Vercel CLI 59.16.0 `pull` also queries the owning team; the
previous project-only token returned `403 team_unauthorized`. Production settings
now pull successfully with the new token. The replaced project-only token remains
active at the owner's explicit request; Actions uses the new team token. Local
copies of the old credential have been removed. The receiver is enabled.

Both GitHub credentials are configured and verified: `JOURNAL_READ_TOKEN` reads
only `vibe-journal-pipeline`; `HERO_NEXT_DISPATCH_TOKEN` grants Contents write
only on `hero-next` for repository dispatch. Both expire on 2026-12-11. The
temporary local GitHub token files have been removed after Secret storage was
read back. Rotate all three active automation credentials before 2026-12-11.

GitHub Actions owns production building and deployment. The workflow receives
`journal_updated` and website pushes to `main`, supports manual/daily
reconciliation, checks out an exact data revision, exports public fields, runs
the quality gate, builds with Vercel CLI and
publishes the prebuilt output. The public page and snapshot must pass
hash/revision/count/date readback. Direct Vercel Git deployments are disabled.
See [journal publishing](./journal-publishing.md) for setup and activation.

The complete release sequence was verified on 2026-09-12:

- [First website deployment](https://github.com/agenticnoob/hero-next/actions/runs/34679431988)
  built website `3899c36` in Actions and published source
  `607dc353080a7dc433bb7d159befead42ddcb11b`: 90 entries, latest 2026-08-18.
- Source push `e3536f8cf1ffb19a05bdafead65d1f3920bd241b` published 18 additional
  journals and the notifier. Its
  [notification run](https://github.com/agenticnoob/vibe-journal-pipeline/actions/runs/34679666747)
  passed all 96 tests, validated 110 journals, and delivered `journal_updated`.
- The resulting [repository_dispatch deployment](https://github.com/agenticnoob/hero-next/actions/runs/34679672419)
  passed the website quality gate, built and deployed in Actions, and verified
  the public page and snapshot. Independent unauthenticated readback also
  confirmed 108 entries, latest 2026-09-11, exact source `e3536f8`, and SHA-256
  `17561a835e3bf4c19cf6b7bfe2f8fc956e15e924bcfa59715790ec3e8b02160b`.

The private source repository is `agenticnoob/vibe-journal-pipeline` (`master`),
with 110 journal records / 108 Timeline events / 224 skills through 2026-09-11.
Its subsequent documentation-only commit is
`af76a47795743034d8dbcfe15ac0655b539bf6e2`; the next website release or daily
reconciliation records that newer revision with the same data. Every successful
deployment's Actions summary records its exact website/source commits and hash.

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
and production snapshots contain 108 entries, latest 2026-09-11. Cloud snapshots
always record the exact committed source revision. Conversations, caches, credentials,
local manifests and generated snapshots remain outside Git.

## Verification

Node.js 22.22.3 / npm 10.9.8:

- `npm run check` passes: ESLint with zero warnings, Prettier, 44 files / 304 tests,
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
or warnings.

Production Ego/Chromium checks passed at 1440×900 and 390×844 / DPR 2:
the browser loaded all 108 entries through 2026-09-11, with one canvas and no
horizontal overflow. A native wheel round trip moved the window `0 → 7 → 0`
with all 16 date pairs matching. Mobile reduced motion displayed the complete
latest date/event. No page/rejection/console errors were captured during these
interactions. These are browser emulation checks; physical-device and Safari
acceptance remain separate.

ESLint 9.39.5 matches pinned Next.js plugin peers; its EOL remains a toolchain
limitation. The journal client checks the hash format/path contract, while
production deployment readback verifies actual bytes. Without-WebGL visual
fallback has not been accepted; semantic Timeline content is present after load.

Earlier implementation and detailed browser evidence are preserved in
[the predeployment record](./archive/2026-09-12-predeployment-status.md).
