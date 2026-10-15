# Current Status

Last verified locally: 2026-10-15 (AXMORF brand candidate, not merged).
Last production readback: 2026-10-14 (Viselora 0.2 migration, bilingual case study and public snapshot).

Hero Next is a standalone public Next.js site consuming the public Viselora
`0.2.0-alpha.0` packages in production. Repository: [agenticnoob/hero-next](https://github.com/agenticnoob/hero-next).
Production source is `main`; reviewed feature branches publish through the existing
production workflow after integration with the current remote head.
Production: [zzzxc.com](https://zzzxc.com).

## Viselora 0.2 migration (2026-10-14, published)

Both published packages are pinned to `0.2.0-alpha.0`, alongside R3F 9.8.1,
Three.js 0.184.0 and Drei 10.7.9. The original workspace's release source
[7b9c361](https://github.com/agenticnoob/dom-webgl-workspace/commit/7b9c361361d5bbfd07dcf4c124030e76204c00b3),
architecture and public migration guide were inspected before porting the
standalone consumer. The npm `alpha` tag resolves to this release; `latest`
still resolves to the retired API. Dependencies resolve inside this repository,
with no source aliases, linked packages or vendored runtime implementation.

Native R3F components replace managed effect/scene/material declarations.
Viselora still owns DOM registration, shared progress and fallback readiness;
R3F owns one Canvas and frame loop. The app retains its own chapter geometry,
paired journal travel, profile frame binding, reading layouts, persisted state,
project exhibition and return navigation. Owned textures and cloned model
materials are disposed without destroying the shared GLB cache. Semantic
fallback restores articles and journal text when the renderer is unavailable.
A review caught and fixed a CSS specificity regression affecting reading-mode
and printed axioms; both were checked in the final production build. The bilingual
Viselora wall introduction, full case study and shared Agent exports describe the
0.2 DOM/R3F ownership instead of the retired managed scene and loader APIs.
The latest generated project content from `origin/main` is retained.

**Automated verification:** `npm run check` passed: 56 files / 463 tests,
zero-warning ESLint, formatting, application and test typechecks, project-data
validation and the 137-file standalone boundary. `npm run build` and
`git diff --check` passed. Tests exercise native shader uniforms, real-hit hold
inputs, external theme commits, profile binding/material ownership, journal
window/reduced-motion changes and subscription cleanup. Vitest reports an
ESM/CJS Three.js duplication warning in two suites; `npm ls` resolves one
Three.js version, and the production browser did not report that warning.

**Production-build browser verification:** Ego Lite Chromium at 1440×900
covered a real mesh hold, profile model, article sheets, project selection,
SyringeMeter exhibition open → Escape return (selected wall and focus retained),
16-panel journal, reverse return to the Hub, and real WebGL context loss/recovery.
At 390×844 with reduced motion active, theme and locale controls, all eight
reading-mode articles, printing and journal pagination from 12 to 24 days passed.
Sampled states retained exactly one Canvas, no horizontal overflow and no
captured page/console errors. Screenshots were inspected and remain outside Git.
Physical devices, GPU performance and pixel-identical cross-browser parity were
not verified.

React Doctor 0.9.18's changed-scope scan reported 84/100 with five warnings:
two mixed component/helper exports, two diagnostics on the intentional low-rate
journal-data bridge between semantic DOM and Canvas, and a test-only material
opacity warning. The bridge has one fetch/retry owner, passes stable panel/layout
references and never carries frame progress. No rules were disabled. The npm
audit reports the same 15 dependency findings as the pre-migration lockfile,
with no additional findings; framework/test-tool upgrades are outside this change.

**Production publication:** application commit
[43e91c0](https://github.com/agenticnoob/hero-next/commit/43e91c0f5da3d44c0d87f64b6559b4fe046011ec)
was committed and pushed to `main` and `axmorf/agent-reading-entry`, retaining
`fb644a7`'s generated project refresh. The exact-commit
[production run](https://github.com/agenticnoob/hero-next/actions/runs/38455918732)
completed its quality gate, production build, both head rechecks, publication and
public snapshot verification. Deployment:
[hero-next-4d1d7vln0-agent-first.vercel.app](https://hero-next-4d1d7vln0-agent-first.vercel.app).

Public HTTP readback passed on both `https://zzzxc.com` and
`https://hero-next-jade.vercel.app`: all 48 registered Markdown documents across
both languages, 10 HTML/discovery routes, production Agent canonicals, current
Viselora case HTML/Markdown and three unknown-route 404s. The matching journal
contains 145 entries through 2026-10-13 from source
`655d522639f30258abaf2fb520723ff294ae1d27`; snapshot SHA-256 is
`594dc24618d79975d06bd453520f0e89faaffbcd541ff9ccb6d15d81044e19d3`.

Public-browser smoke checks covered the desktop Hub, Viselora wall selection,
case dialog, English switching and Escape return with wall selection and focus
retained. At 390×844, the reading layout, theme button, current seven-section
case dialog and Agent entry passed with no horizontal overflow. Reduced motion
was explicitly confirmed active for the mobile case. The homepage and its dialog
retained one Canvas; the Agent entry had none. Captured page/console errors were
empty. Screenshots were inspected outside Git. These release checks supplement
the full local interaction coverage above; physical devices and pixel-identical
parity remain unverified.

**Delivery boundary:** implemented, verified, committed, pushed and published.
This status record is a documentation follow-up to the application release; its
push uses the same production pipeline. The upstream package repository was not
changed.

## Agent reading entry and static exports (2026-10-11)

**Implemented and published:** `/agent` and `/agent/en` render the public profile,
axioms, project directory, public channels and latest 12 journal dates without
depending on JavaScript. `/agent/zh` is a Chinese alias with `/agent` as its
canonical. The homepage Agent link follows its selected language; directory
language links use explicit URLs and do not create a second preference store.

`/llms.txt` indexes bilingual Markdown overviews, every registered project and
axiom, and complete monthly journal archives. All exports use the current
content registries and the manifest-selected public journal snapshot, validated
against both its SHA-256 and schema. Original Chinese journal events and all
tools are preserved. Normal builds regenerate the static routes. Unknown
languages, projects, articles and months return 404. Crawl discovery includes
`/robots.txt`, `/sitemap.xml`, HTML `describedby` links and alternate Markdown
links on the homepage and project pages. Canonicals use `https://zzzxc.com`.

Localized HTML pages pre-render both supported locales and explicitly call
`notFound()` for other values. They leave `dynamicParams` at its default to avoid
Next 16.2.10's [known NoFallbackError logging issue](https://github.com/vercel/next.js/issues/90537);
Markdown routes retain their build-time parameter allowlist. Unknown-language
HTTP checks also verify that the server does not log this internal error.

**Local verification:** `npm run check` passed (56 files / 460 tests,
zero-warning lint, formatting, both typechecks and the 129-file standalone
boundary), as did `npm run build` and `git diff --check`. React Doctor 0.9.17's
changed-scope scan was 100/100 with no diagnostics. HTTP-only verification of
the production build checked all 46 generated Markdown documents, every linked
export, all 13 sitemap URLs, response content types, discovery metadata,
production canonicals, unknown-route 404s and exclusion of private source
metadata from the directory. These checks were repeated after integrating
remote `main` at `532689f`, retaining its current nine-project catalog. Counts
describe the local journal snapshot, not the production data revision.

Ego Lite's preceding local checks covered 1440×900 and 390×844: home Agent
link → directory → English → standalone case, with no open exhibition dialog on
the standalone case. Mobile reduced motion retained one canvas on home and
zero in the directory; controls did not overlap and sampled pages had no
horizontal overflow or captured page/console errors. With page JavaScript
disabled, native browser input verified home → directory → English → journal
anchor. The full directory remained readable at 320×740, with eight articles,
eight projects, 12 recent dates and five monthly archives. Screenshots and the
HTTP verification script remain outside Git. Physical devices, GPU performance
and universal agent discovery were not verified. The browser checks used the
pre-integration eight-project snapshot; the updated catalog passed the full
automated and HTTP checks above.

**Production verification:** application commit
`2fe0edee16d5b7fb5b4c535d961c302924bc4421` was pushed to `main`. Its
[production run](https://github.com/agenticnoob/hero-next/actions/runs/38133000233)
completed the quality gate, production build, publication, public snapshot
verification and deployment receipt. Vercel Production deployment
`dpl_78j54opzCLtRqyLhxRmE8iNKbdVi` is READY, records that exact application SHA
and aliases `zzzxc.com` to the published build.

HTTP readback of the formal domain verified all 48 Markdown documents and their
internal links, all 13 sitemap URLs, content types, discovery metadata,
production canonicals and unknown-route 404s. The production catalog contains
nine projects and eight axioms. Six monthly archives in both language paths
match every date, complete event and tool in the 142-entry public snapshot;
the latest date is `2026-10-10`. Its source revision is
`f763d2f6a1fc3e6b9e6fd8f010224984cd644c36` and its SHA-256 is
`018041dfcbeb45e021939bfe510692eec20b288e5830494b26447f54874925e1`.
The Agent directory does not expose source-revision or project-input metadata.

Production Ego Lite at 1440×900 verified home language selection → Agent →
English → a generated standalone case; the case has no open exhibition dialog.
At 390×844, normal and explicitly active reduced-motion checks retained one
canvas on home and zero in the directory. Sampled states had no horizontal
overflow or captured page/console errors. With JavaScript disabled at 320×740,
native browser input verified home → directory → English → journal anchor;
all nine projects, eight axioms, 12 recent dates and six archives remained
available. Desktop, mobile and no-JavaScript directory screenshots were visually
inspected and remain outside Git. Physical devices and GPU performance remain
unverified. A deployment-scoped Vercel runtime query over the preceding 30 minutes
returned no error/fatal records; no external Drains are configured for this project.

The documentation follow-up uses the same production pipeline and must complete
publication and public snapshot verification before release closeout.

## Agent collaboration profile and axiom copy (2026-10-08)

The fourth profile section and the existing `agent-first` axiom now describe the
June 2026 personal workflow: a local entry agent discusses goals and coordinates
a remote team using Kanban. The axiom records the June 2 conversation evidence
and compares this collaboration design with OpenAI's September 29 Dots launch.
Chinese and English retain the same chronology and scope. The four profile
sections, eight axiom IDs, layout and runtime ownership remain unchanged.

Local `npm run check` passed on the publication worktree based on current `main`
(54 files / 427 tests, zero-warning lint, formatting, both typechecks and the
112-file standalone check), as did `npm run build` and `git diff --check`.
The preceding local browser checks covered 1440×900 and 390×844, language
switching and mobile reading with reduced motion. Sampled states retained one
canvas and had no horizontal overflow or captured page/console errors.
Screenshots remain outside Git; physical devices and GPU performance were not
tested.

Application commit `0bdb63fd4e018bcc1b731bb94dce9a94a55096cd` was pushed to
`main`. Its [production run](https://github.com/agenticnoob/hero-next/actions/runs/37761636335)
completed both production publication and public snapshot verification.
Production Ego Lite at 1440×900 and 390×844 verified the exact Chinese/English
profile title/body and axiom title/body against the committed copy, including
language switching and mobile reduced motion. The new profile section and the
complete Chinese mobile article were visually inspected. Sampled states retained
one canvas, no horizontal overflow and no captured page/console errors.
The documentation follow-up uses the same production pipeline.

## Two-repository project automation migration (2026-09-23)

**Implemented and merged:** the website no longer has an active subscription-auth
`projects-sync.yml`, Codex runner, authentication helper or publisher. It keeps
scanner/data validation and a secret-free content PR check. The private
`hero-next-automation` repository owns the schedule, trusted prompt/schema,
isolated runner, App-token boundaries and deployment-run tracking. The dedicated
content branch is `automation/github-project-introductions`; the private
repository and both GitHub Apps are configured for their separate scopes.

**Local verification:** website `npm run check` (54 files / 427 tests),
`npm run build`, and `git diff --check` passed. Private automation `npm run check`
(39 tests) and Actionlint 1.7.12 for both repositories' workflows passed.
**Private-cloud verification:** `PROJECT_SYNC_ACTIVE=true`. The
[changed-source run](https://github.com/agenticnoob/hero-next-automation/actions/runs/35823252151)
passed source collection, Environment-only login restoration, Session-store App
preflight writeback, Codex generation, container cleanup, post-generation
writeback, full candidate checks/build, and exact-head merge of
[content PR #3](https://github.com/agenticnoob/hero-next/pull/3). That PR changed
only `data/projects.json`. Its merge produced the exact-SHA
[normal main push](https://github.com/agenticnoob/hero-next/actions/runs/35823641058);
`journal-build.yml` completed Vercel Production deployment and public snapshot
verification. The [unchanged follow-up](https://github.com/agenticnoob/hero-next-automation/actions/runs/35823903063)
passed collection with `generate` and `review` skipped. This confirms the
no-change path does not call Codex; it does not test token rotation under forced
expiry.

**Credential cleanup and public-readiness:** the old `CODEX_AUTH_JSON` and
`CODEX_AUTH_WRITE_TOKEN` were removed from the website's `project-content`
Environment after reporting their exact scope. That Environment now has no
secrets; the website has only its deployment and secret-free content-check
workflows. The dedicated login and Session-store App secrets remain only in the
private automation Environment. A pre-publication signature audit found no
token, private-key or auth-file patterns in the website's available Git history,
eight project-workflow logs, four historical project artifacts, two production
pages and their 13 loaded static assets. One cancelled run supplied incomplete
logs; pattern scanning cannot prove the absence of every secret format.

**Public-cloud verification:** the website is public and the automation
repository remains private. The
[post-publication run](https://github.com/agenticnoob/hero-next-automation/actions/runs/35892417823)
detected the newly eligible website README (repository ID `1366880001`), passed
both credential writebacks and Codex generation, and merged data-only
[content PR #5](https://github.com/agenticnoob/hero-next/pull/5) after checks.
The exact-SHA [main push](https://github.com/agenticnoob/hero-next/actions/runs/35893000837)
completed Vercel Production deployment and public snapshot verification.
The public `/projects` and `/projects/gh-1366880001` pages returned HTTP 200.
A post-publication signature scan found no token, private-key or auth-file
patterns in Git history through that content merge, 12 relevant public Actions
logs, the four historical website artifacts, the new private automation
artifacts, those public pages, or their 13 loaded static assets. One cancelled
historical run still has incomplete logs; this scan checks known credential
patterns and is not proof against every possible secret format. The historical
records below describe the prior single-repository workflow.

## Code structure and responsibility boundaries (2026-09-22)

Theme and locale share persistence/subscription mechanics while retaining separate
keys, parsers, defaults and provider-local instances. Project room geometry,
semantic state and DOM return navigation now have separate owners. Navigation
receives the existing scroll restoration function from its caller. Catalog entries
provide routes and optional wall positions to case views and dialogs, replacing
slug-prefix inference and repeated searches through translated chapter content.
The project directory also reads its chapter number from the chapter definitions.
Visual constants, curated content, dependencies and publishing workflows are unchanged.

`npm run check` passes: 56 files / 463 tests, zero-warning ESLint, formatting,
both typechecks and the 118-file standalone boundary. `npm run build` and
`git diff --check` pass. React Doctor 0.9.14's complete full scan remains 57/100
with the same four reviewed diagnostics; the complete changed-scope scan against
the starting HEAD is 100/100 with no new diagnostics across 23 files. The existing
optional subscriptions have real cleanup, and the two selector warnings only
consume fixed test fixtures. No rules were disabled. See the
[review and verification record](./archive/2026-09-22-code-structure-review.md).

Ego Lite checked the local production app at 1440×900 and 390×844. Paths covered
standalone case → home/selected wall, case dialogs and language switching,
directory → generated case → directory focus restoration, and mobile theme/locale
persistence across refresh. The mobile case also opened and closed with reduced
motion explicitly confirmed active. Home-backed dialogs retained one canvas;
standalone cases had none. Sampled pages had no horizontal overflow. Instrumented
desktop and mobile dialog interactions reported no page/console errors; mobile
instrumentation began after navigation and does not cover its initial loads.
Physical devices, GPU performance and a full visual redesign were not tested.
This section records local verification; publication status is reported by the
deployment workflow for the pushed commit.

## GitHub project catalog and publishing pipeline (2026-09-21)

Chapter three retains its four curated walls and adds an all-projects directory.
The directory combines the manual cases with validated bilingual static snapshots;
generated entries have stable repository-id routes and no invented artwork. Native
route dialogs preserve the room's selected wall and restore directory scroll and
focus when returning from a case. Direct directory and case URLs also work.

The daily GitHub-hosted workflow discovers eligible owned public repositories at
10:43 Asia/Shanghai. Changed README sources pass through the pinned Codex CLI
in an isolated container using subscription authentication, strict validation, full
checks and a production build before a content-only PR is created. An existing
content PR skips generation and is revalidated for automatic merging. Successful
content-only updates explicitly dispatch the existing deployment workflow. See [project publishing](./project-publishing.md).

Local verification: `npm run check` (54 files / 429 tests), `npm run build`, React
Doctor (100/100) and `git diff --check`. Tests cover source filtering, incremental
generation, malformed responses, retained entries, generated routes, catalog
deduplication and directory return behavior. Independent review also verified
formatting a nonempty generated snapshot and exporting the workflow's isolated
journal fixture. Actionlint passes for the subscription workflow (ShellCheck was
not available); its CLI flags were checked against the Codex 0.155.1 binary.

Subscription regression tests cover owner-only login files, unsupported auth modes,
refreshed-token writeback, storage failures, container cleanup after failed generation,
credential-output rejection, environment/concurrency gates and code-only scan skips.
The local Docker daemon is unavailable, but the
[configured cloud run](https://github.com/agenticnoob/hero-next/actions/runs/35648295114)
passed collection, real subscription generation, credential writeback, data validation,
all checks and the production build. Generation took 2m36s including container setup;
the review job took 1m34s. It created [content PR #1](https://github.com/agenticnoob/hero-next/pull/1),
changing only `data/projects.json` with four bilingual projects. The copy was reviewed
against its pinned READMEs and matched the PR snapshot; scanning again against this
candidate returned zero changes. At that verification point the content PR was not merged or deployed;
automatic publication verification is tracked below. Login
persistence is verified; no forced expiry/token rotation was induced.
The [follow-up cloud run](https://github.com/agenticnoob/hero-next/actions/runs/35648826674)
passed the pending-PR guard and skipped scanning, generation and review as expected.

The initial run timed out because the pinned slim Node image had no system CA bundle.
The diagnostic run exposed TLS errors, and all Linux amd64 image layers were inspected
to confirm the missing bundle. The container now installs `ca-certificates` and checks
it during the build. Both timeout and normal cancellation successfully stopped the
container, saved the current login and cleaned temporary authentication. Fixed
diagnostic labels never forward raw process output. No API credentials or existing
desktop login were read or transferred.

Ego Lite inspected the local production build at 1440×900 and 390×844, including
directory/case navigation, language switching, back/Escape, selected-wall retention,
directory return focus, mobile reduced motion and desktop-to-mobile resize. Sampled
views had no horizontal overflow; the home-backed dialogs retained one canvas.
Instrumented mobile navigation reported no page/console errors; instrumentation did
not cover every initial load. Screenshots were inspected and remain outside Git.
Physical devices and the rendering of the live generated content were not browser-tested.

Implementation commit `35ab0ea` is published to `main`. The private
`project-content` environment exists with a main-only branch policy, and Actions
PR creation is enabled. The first [cloud scan](https://github.com/agenticnoob/hero-next/actions/runs/35618929809)
passed with zero changed sources under the original topic filter; generation and PR
jobs were skipped. The default now uses `topic: null` to discover new public projects
automatically; a local read-only scan found four eligible sources. The dedicated
subscription login and restricted environment-secret write token are saved in the
environment. The token only grants Environments read/write and Metadata read on
`hero-next`, and expires on 2026-12-21. No OpenAI API key is used. The production
snapshot was empty before the automatic-publication follow-up below.

The [production deployment](https://github.com/agenticnoob/hero-next/actions/runs/35618865637)
passed its checks, build, publication and public-journal verification. A public readback
of `/projects` returned HTTP 200 and the expected curated case links. This readback
does not replace the local browser interaction evidence above.

## Automatic project publication (2026-09-22)

The user authorized unattended merging and publication. The sync workflow now resumes
an existing bot content PR without a model call, validates only its data blob against
trusted main, runs the full quality gate/build, and squash-merges the checked head.
Only a same-repository, regular-file `data/projects.json` change is eligible. It rejects
stale main, candidate mutations, conflicting published-data changes and entry deletion.
After merging, it explicitly dispatches the existing production workflow because a
`GITHUB_TOKEN` merge does not trigger normal push workflows. No new secrets are needed.
Codex remains `gpt-5.6-sol`; reasoning is now explicitly pinned to `medium` rather than
leaving it to the model/CLI default. Local `npm run check` passes (55 files / 450
tests), as do the production build, Actionlint (without ShellCheck) and diff check.
A read-only inspection of real PR #1 passed the new publication guard.

The [automatic publication run](https://github.com/agenticnoob/hero-next/actions/runs/35682241662)
passed: collection resumed PR #1, generation was skipped, full checks/build passed,
and the workflow squash-merged it as `d3911f51493a18d60a9151f4b50dce3b160018cc`.
The review job completed in 2m17s and explicitly dispatched the
[production deployment](https://github.com/agenticnoob/hero-next/actions/runs/35682405678),
which passed publication and public-journal verification in 2m23s. No model call or
manual merge was needed for this follow-up. The new `medium` setting is covered by
the invocation regression test; this resumed run did not execute the model again.

Public HTTP/HTML readback returned 200 for `/projects` and all four generated case
URLs. The directory includes every generated link, and each case contains the exact
Chinese title and summary from the committed snapshot. This was content verification,
not a new browser interaction or visual acceptance pass. Existing curated cases and
media remain unchanged. Implementation commit: `b45e043`.

A future failing candidate stays open and is revalidated on the next run without
regeneration. A dispatch failure after merging fails the sync job and can be recovered
by running the production workflow; its existing daily schedule remains a fallback.

## Tetrahedron face-text resolution (2026-09-18)

The eight endpoint tiles keep their existing 2-column / 4-row mapping. A 2×
rasterization target now uses the available atlas width: tile limits are 2048×1024,
with a 4096px maximum on either atlas side. The former 1024px width limit reduced
1440×900 content to 0.711× logical resolution; it now uses 1638×1024 tiles (about
1.138×). At 1920×1080, density increases from 0.533× to about 0.948×; at 390×844,
from 1× to about 1.213×. Logical layout, face UVs, entry/tail selection, material
sampling, runtime ownership and dependencies are unchanged.

This uses more actual texture area: at 1440×900 the base RGBA allocation rises
from 20 MiB to about 51.2 MiB, excluding mipmaps and the CPU canvas. The existing
4096px side limit bounds the base allocation to 64 MiB. Small and oblique faces
still have perspective/minification limits; this is not a hardware-anisotropy
change or a measured GPU performance improvement.

Regression tests first reproduced desktop undersampling and the missing small-view
supersampling. Density, small-view 2× rendering, portrait/landscape/4K/ultrawide
allocation bounds, invalid dimensions, actual Canvas tile transforms and existing
bilingual entry/tail content are covered. `npm run check` passes (50 files / 386
tests, zero-warning lint, formatting, both typechecks and the 111-file standalone
boundary); `npm run build` and `git diff --check` pass.

The local production build was inspected with Ego Lite at 1440×900 DPR 1 with
reduced motion, 1920×1080 DPR 2 with normal motion, and 390×844 DPR 2 with touch
and reduced motion. Checks covered Hub/approach, all four incoming faces, the
first chapter's tail/retreat, language changes and mobile approach. Screenshots
show improved face-text edges; sampled states kept one canvas, no horizontal
overflow and no instrumented page/console errors. Instrumentation was attached
after navigation, so this does not establish an error-free initial load. Screenshots
remain outside Git. Physical devices, sustained motion shimmer and GPU memory/frame
time were not measured. Production publication and readback are recorded below.

## Chapter-four resume entry (2026-09-17)

The public directory now includes the user-supplied [resume homepage](https://resume.zzzxc.com/)
as its seventh entry, titled 简历 / Resume. Both portal lists, desktop hover previews,
reading-layout links and transition artwork use the same bilingual chapter content.
Desktop rows use 9svh height and an 8svh font-size cap in both DOM and Canvas,
keeping the seventh row above the footer. The existing six destinations and three
QR disclosures remain intact.

`npm run check` passes (50 files / 377 tests, zero-warning lint, formatting, both
typechecks and the 111-file standalone boundary). `npm run build` and
`git diff --check` pass. Regression assertions cover the exact destination in
both languages, seven entries, resume preview, mobile link and both atlas endpoints.

Ego Lite inspected the local production build at 1440×900 and 390×844. Desktop
Chinese/English hover previews render correctly; the last row ends at y=756 and
the footer begins at y=784. Mobile chapter navigation, bilingual content and
keyboard activation opened the supplied resume URL in a new tab; reduced motion
was confirmed for that activation. Sampled states retained one canvas, no horizontal
overflow and no instrumented page/console errors. Desktop and mobile screenshots
were inspected and remain outside Git. Physical devices and other browsers were
not tested. Production publication and readback are recorded separately below.

## Reading-layout theme control (2026-09-17)

Mobile, touch and short landscape layouts now show a 44px theme button beside
language controls throughout the home page. Its bilingual accessible name and
pressed state describe color inversion; keyboard activation uses native button
semantics. Opening hints match each layout. Desktop retains real mesh holds at a
complete Hub. Reading layouts ignore holds and cancel an incomplete desktop hold
on layout change. The button commits to the existing persisted theme store, and
the managed effect reconciles its material and transition signals on the next
frame. No new canvas, theme store or frame-driven React state is introduced.

Regression tests cover a held mesh across layout changes, button commits in both
directions, shared shader/signals, localStorage, bilingual controls and stable
effect declarations. `npm run check` passes (50 files / 377 tests, lint,
formatting, both typechecks and the 111-file standalone boundary), as do
`npm run build` and `git diff --check`. React Doctor's changed-file local scan
found no issues; network scoring and supply-chain queries were disabled.

Ego Lite verified the production build at 390×844: button commits, persisted
refresh, a 1.6-second touch hold without a theme change, English keyboard
activation, and a chapter-two button click. At 320×740 with 200% root text and
reduced motion, controls retain 44px minimum targets, no overlap and no horizontal
overflow. At 1440×900 the button is absent and an actual mesh hold commits the
theme. Sampled mobile paths kept one canvas and recorded no instrumented page
errors; the initial button path also recorded no console errors. Physical mobile
browsers and native long-press menus were not tested. Production release evidence
is recorded separately below.

## Axioms text-atlas clarity (2026-09-17)

The old uniform-cell atlas sized every cell for the widest header and tallest paper.
With eight articles, the 4096px limit reduced text to 0.623 backing pixels per logical
pixel at 1440×900. Variable-size shelf packing now uses the actual tile dimensions,
keeps original tile identities, and shares explicit logical origins with the shader.
The 2× target and 4096px per-side cap are unchanged; improved density uses more of
that existing area budget. Layer ownership, disposal and page canvas count are unchanged.

Measurements using the browser's actual Canvas font metrics for the current content:
1440×900 Chinese 0.623 → 1.848 and English 0.623 → 1.673; 1920×1080 both languages
0.468 → 1.553. These are atlas sampling densities, not perceptual-quality scores.
Two regression cases first reproduced the low-density failure and now require at least
1.5× sampling for both languages at 1440×900, with bounded dimensions, in-bounds tiles,
non-overlapping gutters and matching shader origins. Existing 0/1/4/7/12-article
render and overflow checks also pass.

`npm run check` passes (50 files / 375 tests, lint, format, both typechecks and standalone
boundary); `npm run build` passes. Ego Lite checks covered 1440×900 DPR 1 in Chinese
and English, 1920×1080 DPR 2 with reduced motion, and 390×844 mobile reading with
final-article anchor navigation. Screenshots show clearer glyph edges; sampled paths
kept one canvas, no horizontal overflow, and no instrumented page/console errors.
Physical devices and other browsers were not tested. Included in the September 17
production release recorded below.

## Profile and working propositions (2026-09-17)

Chapter one now describes concrete projects, full-stack delivery, tool selection,
and Agent engineering habits in both languages, drawing on the local résumé while
preserving the public identity boundary. Opening and chapter portal copy follow
that direction. Chapter two expands from four to eight bilingual working propositions,
retains existing article IDs, and connects each idea to practice or an explicitly
open question. The desktop reader derives an 820svh body from the same registry.

Browser verification reproduced a reading-layout defect: navigating to a short final
article crossed into the exit runway, hiding its text and preventing focus. The final
article now reserves a viewport minus the anchor inset as its minimum height.
The same index click now keeps the article visible and focuses its heading container.

`npm run check` passes (49 files / 373 tests, lint, format, both typechecks and the
111-file standalone boundary); `npm run build` passes. Existing render assertions
follow the revised copy while retaining wrapping, tail-content and privacy checks.
The local production build was inspected in Ego Lite at 1440×900 and 390×844, in
Chinese and English. Profile/model separation, all eight semantic articles, desktop
final-card reading, mobile index jumps and reduced-motion navigation were checked.
The sampled paths kept one canvas, had no horizontal overflow, and recorded no
page exceptions or console errors after instrumentation. Physical devices and other
browsers remain unverified. Included in the September 17 production release below.

## Four-project case studies (2026-09-15)

AXMORF Studio, Viselora and Vibe Journal Pipeline now have complete Chinese and
English case studies alongside SyringeMeter. Each has seven sections, a six-step
workflow, a reading index and project links. The typed `projectCaseStudies`
registry drives `/projects/[slug]` and the intercepted native dialog; unknown
slugs return 404. All four chapter-three entries open their corresponding case.
The new cases use text entries, while the existing poster, preview and screenshots
remain attached specifically to SyringeMeter. No dependencies or runtime packages
changed. The checks in this section describe local implementation verification;
production publication and readback are recorded separately under Production release.

Return handling now selects and focuses the corresponding project in either
layout. Reading coordinates stay inside the chapter's content range: aligning
the short final card to the viewport top previously entered the exit runway and
hid the chapter. Regression tests reproduced that failure before the fix. A
standalone return also waits for the chapter's visibility commit before focusing.

`npm run check` passes: zero-warning lint, formatting, 49 files / 373 tests,
both typechecks and the 111-file standalone boundary. `npm run build` passes:
all four intercepted cases are prerendered; standalone cases retain the existing
`force-dynamic` interception-cache workaround. `git diff --check` passes.
React Doctor 0.9.14 scanned 19 changed files locally with network scoring and
supply-chain checks disabled. Its only two warnings are href-derived selectors
in `test/ProjectShowcase.test.tsx`; these resolve fixture anchors from the typed,
static case registry, so malformed external selectors cannot reach them. No
application diagnostics or rule suppressions were introduced; no online score
is claimed.

The local production app was checked in the Codex in-app Chromium browser at
1440×900 and 390×844, plus 320×740 with reduced motion and 200% root text.
All four desktop entries opened the correct seven sections, switched languages,
and restored the selected wall, scroll and focus on close. The three new mobile
cases passed direct page → home → keyboard-opened dialog → close, with the correct
entry focused and the chapter visible. Journal dialog resizing passed both
desktop → mobile and mobile → desktop. Browser forward reopened the exhibition;
Escape worked with reduced motion. The original SyringeMeter preview played
muted, reached readyState 4, and was removed on close. Article anchors focused
their real sections; the sampled pages had no horizontal overflow. Home kept
one canvas, and standalone cases had none. With JavaScript disabled, each new
case still had all seven sections, seven anchors and its project link.

Wall, mobile-card and case screenshots were inspected. A fresh 1440×900 session
had no captured runtime exceptions or console entries. The session with repeated
viewport/emulation changes reported Chromium rendering warnings:
`GL_INVALID_VALUE: glCopySubTextureCHROMIUM: Offset overflows texture dimensions`.
The checked return paths and visible content still worked; the warning's underlying
cause has not been isolated. Physical mobile devices and other browsers remain
unverified. Preview tooling, screenshots and diagnostics stay outside Git.

## SyringeMeter showcase (2026-09-14)

Chapter three now opens a complete bilingual project exhibition: a 17-second
preview, 3:13 demonstration with three chapter jumps, seven long-form sections,
a six-step measurement flow, real measurement/CSV screenshots and project links.
The room retains its selected wall, scroll and focus through a native dialog;
the independent `/projects/syringe-meter` page supports direct visits and sharing.
Theme and locale use the same root stores as the home page. No runtime package,
dependency version, second canvas or second scroll controller was introduced.

`npm run check` passes: zero-warning lint, formatting, 48 files / 356 tests,
both typechecks and the 110-file standalone boundary. The production build passes;
the home page and intercepted exhibition are static. Only the independent case
page renders per request to avoid Next 16.2.10's confirmed interception-cache bug
([upstream issue](https://github.com/vercel/next.js/issues/94533)). `git diff --check`
passes. The earlier showcase implementation scored 100/100 in React Doctor;
its rerun for the wall-entry fix was blocked by automatic approval review because
of possible third-party disclosure of private repository diagnostics. Local
lint, tests, typechecks and browser checks provide this fix's verification.

The image and entry label now belong to the SyringeMeter wall: the existing room
shader renders its image texture and atlas text throughout turns and parallax.
They no longer appear only after selecting and settling that wall. The semantic
link follows the same camera projection, including partially visible side walls,
while viewport clipping removes off-screen hit regions. Hover locks edge turning
without stopping parallax. Wall geometry preserves the poster's 16:10 aspect ratio.
Regression tests cover four-wall projection via independent ray intersection,
wide-view near-plane clipping, stable link registration and poster proportions.
The wall-entry fix was checked in local production Chromium at 1440×900 and
2560×900: left/right turn screenshots retain the wall image, pointer movement
changes the entry projection, and all 46 sampled on-screen side-wall points hit
the semantic link (including eight points across the near plane). Reduced motion
kept the transform unchanged; opening/closing worked. A fresh 390×844 mobile
entry opened all seven case sections without overflow. One canvas and no captured
page/console errors remained. Physical-device and other-browser limits below still
apply; screenshots are outside Git under `/tmp/syringe-showcase-review/`.

Local production Ego/Chromium checks covered 1440×900 desktop, 390×844 mobile,
and 320×740 with reduced motion and 200% root text. Verified paths include direct
case → home → exhibition, preview playback, seeking the full video to 02:46,
article anchors, close/Escape, browser forward, and desktop/mobile layout changes
while the exhibition is open. Desktop close restored the recorded scroll position
and entry focus; resizing returned to the corresponding project card or wall.
The home kept one canvas; the independent case had none. Before play there was
no video element or MP4 request. Sampled interactions produced no captured page
or console errors. Screenshots of the room, case and prose were inspected.
With JavaScript disabled, all seven sections and both video file links remained
available. The full video supports HTTP 206 byte ranges; both media files decoded.

Production publication and browser readback are recorded below. Physical iOS
Safari/Android playback and audio/subtitle quality have not been verified.
Local screenshots and logs remain outside the repository.

## Mobile reading layout

The approved mobile audit recommendations are implemented across the experience:

- Narrow, short-landscape and touch windows use one reading layout. Profile copy
  is single-column with a separate model area; it retains the public nickname and
  omits real identity, dates/cities, career biography and military service in both languages.
- Entry/exit runways are 110svh / 60svh, with natural-height bodies. The opening
  introduction scrolls normally and grows with enlarged text instead of clipping
  fixed text. Intermediate Hubs occupy 24svh.
- Chapter navigation and article anchors use the existing Lenis. Pixel-rounding
  tolerance prevents a reached chapter from remaining hidden. Resize, locale,
  root-font and body-height changes refresh scroll boundaries and endpoint artwork;
  layout changes preserve the current reading chapter through the same scroll controller.
- The article index links to complete full-width prose. Project cards have compact
  spacing. All seven public entries remain direct links, including the exact LeetCode
  and resume destinations; three QR disclosures are separate from the links and initially closed.
- The journal displays the latest 12 dates and appends 12 earlier dates per action.
  Each date retains its complete tools and event. Reading mode does not mount the
  spatial article surface or perspective journal text targets.
- Semantic colors are `#C8C8C8` / `#424242`, approximately 6.01:1 contrast in either
  direction. Lighting inputs remain separate. The chapter menu and language controls
  remain usable at 200% root font size.

One runtime, canvas, scene/render pass, scroll source and committed theme remain.
Desktop profile wrapping, article sheets, project room and directory previews are
retained. Reading endpoint tiles use the real DOM's measured text lines and geometry;
scrolling selects the prepared tile instead of rebuilding it per frame. No package,
model asset, decoder, dependency version or generated journal data was changed.
See [current visual behavior](./visual-design.md) and the
[previous design](./archive/2026-09-13-pre-mobile-visual-design.md).

## Mobile-layout verification (2026-09-13)

Node.js 22.22.3 / npm 10.9.8:

- `npm run check` passes: lint with zero warnings, formatting, 45 files / 315 tests,
  both typechecks and the 97-file standalone package boundary.
- `npm run build` passes; Next.js prerenders the production page.
- React Doctor 0.9.14, `--scope changed --base HEAD --include-untracked`: 100/100,
  no issues in the changed files. Its initial full-scan fallback reported existing
  Profile cleanup false positives and two new complexity warnings; the new functions
  were simplified. No rules or tests were suppressed.
- New regression coverage includes profile reading order, complete article anchors,
  independent QR disclosure/link semantics, ordered journal pagination, menu keyboard
  focus, contrast, input-mode changes, the model's reading slot and subpixel handoff.

Local production Ego/Chromium verification covered 320×740, 375×812, 390×844,
430×932, 844×390 landscape and 1024×768 touch emulation, plus 1440×900 desktop.
Chinese/English changes, normal/reduced motion and 200% root text were exercised.
Reading content remained active after viewport/locale changes; no horizontal
DOM overflow, duplicate canvas, captured page error or console warning/error was found
in the sampled states. Mobile prose is 17px, growing to 34px at 200%; navigation
and language controls do not overlap at 320px. Screenshots were inspected after
compositor frames settled; immediate screenshots during resize are not acceptance evidence.

Mobile interactions verified chapter jumps in both directions, article reading,
QR open/close, the real journal anchor and pagination from 12 to 24 dates, starting
with 2026-09-11. Existing nodes remain while older dates append. At 1440×900,
desktop mesh holds changed the theme in both directions, the article sheets rendered,
all four project selections settled with their correct enabled source links, and
the six-link directory retained hover previews and English translation.
The final production readback is recorded with the release receipt below.
Screenshots, logs and browser profiles are local evidence and are not committed.

## Production release

GitHub Actions owns production building and publishing; Vercel Git integration is
not enabled. Website pushes, journal dispatches, manual runs and daily reconciliation
use the same [production workflow](https://github.com/agenticnoob/hero-next/actions/workflows/journal-build.yml).
The workflow resolves exact website/data commits, runs the quality gate, builds with
Vercel CLI, publishes prebuilt output and verifies the public page/snapshot bytes.
An apparently green stale run is insufficient: publication and readback steps must run.

### Tetrahedron face-text release (2026-09-18)

Application `90f0d7e483d726a14974be413edf4050ec5a1f7f` was committed and pushed to
`main`. Its [successful workflow](https://github.com/agenticnoob/hero-next/actions/runs/35259122568)
passed all 386 tests and the full quality gate, completed the production build
step in 32 seconds, published `hero-next-lmfl3ud3f-agent-first.vercel.app`, and
completed public snapshot verification. Vercel deployment
`dpl_GZNm4T3acEuGeSguXqAhNnm8QD2s` reported `READY` for that exact application SHA
and was aliased to [zzzxc.com](https://zzzxc.com). The selected journal source was
`242c3fee901d148b47f37be3889de923a8b74726`.

Ego Lite read back the production domain at 1440×900 DPR 1 and 390×844 DPR 2,
with reduced motion confirmed active and mobile touch enabled. Instrumented Canvas
creation after navigation and desktop language changes confirmed the actual face
atlas sizes: 3276×4096 on desktop and 946×4096 on mobile. Chinese/English face text
and mobile approach screenshots were inspected; sampled states kept one visible
canvas, no horizontal overflow and no captured page/console errors. Instrumentation
began after navigation; physical devices and sustained GPU performance remain
unverified. Screenshots and diagnostic logs stay outside Git.

A deployment-scoped Vercel error/fatal log query found no matching entries from
2026-09-17 18:23:43 to 18:33:43 UTC. This is a bounded release observation;
persistent monitoring and log drains were not audited or changed.
Documentation-only follow-up pushes retain the same application behavior and run
the same deployment pipeline; each run records its exact commit and receipt in Actions.

### Resume directory release (2026-09-17)

Application `31d518f6024e53b3bc382ba8e290351aa2e52b1c` was committed and pushed to
`main`. Its [successful workflow](https://github.com/agenticnoob/hero-next/actions/runs/35211084042)
ran the full quality gate, built production output in 30 seconds, published
`hero-next-c4tizffpe-agent-first.vercel.app` and completed public snapshot verification.
The selected journal source was `242c3fee901d148b47f37be3889de923a8b74726`.

Ego Lite read back [zzzxc.com](https://zzzxc.com) at 1440×900 and 390×844.
The desktop directory has seven entries and the correct Chinese/English resume
hover previews. Mobile chapter navigation and a click on 简历, with reduced motion
confirmed active, opened `https://resume.zzzxc.com/` in a new tab. Sampled states
kept one canvas, no horizontal overflow and no instrumented page/console errors.
The production desktop screenshot was inspected; physical devices were not tested.
Documentation-only follow-up runs retain the same application behavior and record
their exact commit and deployment receipt in Actions.

### Mobile theme and chapter release (2026-09-17)

Application `0c3ccdec4c8bc1437471efe7c39aedf4835e054f` was committed and pushed to
`main`. Its [successful workflow](https://github.com/agenticnoob/hero-next/actions/runs/35181039130)
completed in 3m06s; quality checks, production build, publication and public snapshot
verification all ran successfully. Vercel deployment
`hero-next-pp4e53zmb-agent-first.vercel.app` was aliased to [zzzxc.com](https://zzzxc.com).
The selected journal source was `242c3fee901d148b47f37be3889de923a8b74726`.

Ego Lite read back the public custom domain at 390×844 DPR 2. The new theme button
changed the DOM and rendered WebGL palette, localStorage and pressed state;
refresh retained the selection, and a 1.6-second touch hold left it unchanged.
The opening copy and button hint match this release. The sampled click recorded
no page/console errors, kept one canvas and had no horizontal overflow. Broader
local interaction checks are described above; physical devices remain unverified.

### Four-project release (2026-09-15)

Application `ea7ea2bf417ad76b78b60d7cee36740d20d4e36a` was committed and pushed to
`main`. Its [successful workflow](https://github.com/agenticnoob/hero-next/actions/runs/34884679241)
completed in 3m04s, including a 34-second production build. Publication, public
snapshot verification and receipt recording all completed successfully. Deployment
`dpl_9nZNy8wfYugmH8xH6gz5KR3KgSfy` reported `READY` for that exact application SHA,
with the production domain assigned. The release retains the 108-date journal
snapshot, source revision and SHA-256 recorded under Data and limitations.

Independent HTTP readback returned 200 for all four project pages. Each contained
seven sections with paragraphs matching the committed source, valid reading
anchors, the correct canonical URL and a return link. Home exposed all four
destinations; an unknown project returned 404. Both SyringeMeter MP4s returned
HTTP 206 and the expected total byte sizes. The public journal page and snapshot
passed the repository verification script independently of the Actions check.

Production Codex in-app Chromium at 1440×900 opened all four room entries, switched
their seven sections between Chinese and English, followed the final article
anchor and returned through Escape to the matching wall, scroll 33399 and entry
focus. Browser forward reopened the journal exhibition. Resizing that exhibition
1440×900 → 390×844 → 1440×900 restored the correct card or wall in both directions;
the last short card stayed inside the visible reading range at scroll 10722.
At 390×844, each new case passed direct page → home → keyboard entry → dialog →
close, with the correct focus and visible chapter. Sampled pages had no horizontal
overflow; independent cases had zero canvases and home/dialog retained one.
The SyringeMeter preview played with readyState 4, and its full-demo control
selected the correct source at 166 seconds. Reduced-motion article navigation
was separately verified with the media query confirmed active. Desktop case and
mobile return screenshots were inspected.

The final bounded browser log sample had no exceptions or console entries.
Earlier events were evicted from the browser buffer, so this is not an error-free
claim for the whole session; the local resize warning and physical-device limits
above remain open. Vercel runtime logs for this deployment returned no error/fatal
entries from 2026-09-14 19:07:40 to 19:13:16 UTC. Persistent monitoring and log drains
were not audited or changed. Documentation follow-up revisions use the same
pipeline; each run records its own exact website SHA and snapshot verification.

### SyringeMeter release (2026-09-14)

Application `e6e67dd8daf242ca8d3895b9ee2ec5fbfd501fd6` was committed and pushed to
`main`. Its [successful workflow](https://github.com/agenticnoob/hero-next/actions/runs/34837239880)
completed in 3m49s, including a 29-second production build. Publication, public
snapshot verification and receipt recording all ran successfully. Vercel deployment
`dpl_6CjCLWyxBQLp2UhkUM6gifuosWeS` reported `READY` for that exact application SHA,
with the production domain assigned. It includes the unchanged 108-date journal
snapshot and exact source/hash recorded below.

Production Ego/Chromium at 1440×900 verified direct case → home → project dialog,
the wall poster during both left and right turns, pointer parallax, seven sections
in Chinese and English, article anchors and Escape return. The entry's projected
x coordinate changed from 553.98 to 545.75 with pointer movement; closing restored
scroll 33399 and entry focus. The preview played at 1280×800 for a 17-second source;
the 193.109-second full demo decoded at 1440×900 and played from 02:46. The independent
case had no canvas; the home/dialog kept one. Before requesting playback there was
no video element or MP4 request. All four production image files matched the local
committed bytes by SHA-256; both videos returned the expected HTTP 206 byte ranges.
Wall and article screenshots were inspected and remain outside Git.

With reduced motion enabled, edge-pointer movement left the desktop entry transform
and selected wall unchanged; the independent mobile page also retained all seven
sections. At 390×844 with touch, the independent case → home → project card → dialog →
close path passed: all seven sections remained,
the dialog and page had no horizontal overflow, one canvas remained behind the dialog,
and closing restored focus to the visible project card. The mobile screenshot was
inspected. Navigation reset the browser's emulated reduced-motion setting, so the
complete mobile dialog path was verified with normal motion. These are browser-emulation
checks; physical-device limits remain below.

No page/console errors were captured in these sampled interactions. Vercel's runtime
log query for this deployment found no error/fatal entries between publication and
the 2026-09-14 11:24 UTC check. This is a bounded release check; persistent monitoring
and log-drain configuration were not audited or changed.

### Previous mobile release (2026-09-13)

Application `a010b837dffa6dba8238188cc8d2aabe9b395359` was committed and pushed to
`main`. Its [successful workflow](https://github.com/agenticnoob/hero-next/actions/runs/34746790657)
completed in 2m36s; both production publication and public snapshot verification
ran successfully. The preceding privacy/LeetCode release was `b083c8c`, with
documentation `ffd9593` and [its successful workflow](https://github.com/agenticnoob/hero-next/actions/runs/34683009838).

Independent production HTTP readback verified all four public profile sections,
six directory destinations and the exact LeetCode URL. Removed identity/military
copy was absent from the profile and nine loaded client scripts. The deployed
108-date snapshot, source revision and hash match the data receipt below.
Production Ego/Chromium at 390×844 verified reading mode, four complete articles
and their index, three initially closed QR disclosures with open/close interaction,
chapter jumps in both directions, and journal pagination from 12 to 24 unique dates.
Synthetic native touch scrolling advanced the page; English switching kept reading
content active. The sampled states had one canvas, no horizontal overflow and no
captured page or console errors. The settled production screenshot was inspected.
Physical-device limitations remain below.

Documentation-only follow-up pushes use the same production workflow. Their exact
website SHA and independent snapshot verification are recorded in each Actions run.

Vercel project `hero-next` (`prj_DqmZ9hblXxRyX8K51nPM5S9uQMCp`) belongs to `agent-first`,
uses Node.js 22 and the assigned production domain above. Required repository
variables and secrets are configured. A dedicated team-scoped `VERCEL_TOKEN` is
used because CLI 59.16.0 `pull` also queries the owning team; the previously approved
project-only token remains active at the owner's request but is not used by Actions.
`JOURNAL_READ_TOKEN` has source read access; `HERO_NEXT_DISPATCH_TOKEN` has Contents
write access only to this website for repository dispatch. Rotate all three active
automation credentials before 2026-12-11. Local credential copies are absent.
See [publishing instructions](./journal-publishing.md) for the authorization and scope history.

## Data and limitations

The local snapshot contains 108 public Timeline dates through 2026-09-11 from source
`af76a47795743034d8dbcfe15ac0655b539bf6e2`, SHA-256
`ccacd99e9d0274bdf44b59bbfc3a34551a777da8259dc13d8ef1f213c97dcee0`.
Each cloud release records its exact source revision and hash independently.
Exports contain only date, compact tool names and Timeline events; conversations,
private logs, credentials, local manifests and generated snapshots remain outside Git.

The browser checks are emulation, not physical iOS Safari or Android Chrome
acceptance. Real-device frame rate, temperature and network behavior remain unmeasured.
Render quality still uses antialiasing and a maximum DPR of 2; no claim of a measured
mobile GPU speedup is made. The 449,954-triangle GLB is unchanged. Canvas/DOM glyph
antialiasing can differ, and without-WebGL visual fallback is not accepted.
External profile App handoff and physical QR scanning were not repeated.
ESLint 9.39.5 matches the pinned Next.js peers but remains an existing EOL limitation.

Previous production setup, verification and privacy-release evidence are preserved in
[the preceding status](./archive/2026-09-13-pre-mobile-status.md).

## AXMORF brand candidate (2026-10-15, not merged)

The isolated brand branch updates the public identity, bilingual introduction,
Tagline, metadata, Agent exports, channel directory and an unassigned status
placeholder for every axiom. Proposition two and its related profile paragraph now state the core collaboration method without dates, priority claims or product comparisons.
The favicon is a tetrahedron candidate awaiting subjective approval. Public
journal projection normalizes identity text without editing source records.

The candidate includes main `298194b5be5501d4dc5c641c4e96fec1360e9f1e` and
preserves its generated project data exactly. `npm run check`, `npm run build`
and `git diff --check` pass: 56 test files / 465 tests. The four stale assertions
now use the AXMORF llms heading, renamed profile GLB and current directory copy;
asset limits, geometry checks and all other gates remain unchanged. Dependency
versions and verification commands are unchanged.

Production-build Ego/Chromium checks at 1440×900 covered the Hub, English →
Chinese switching and the Agent reading entry. At 390×844 with reduced motion,
the settled WebGL readiness flag, visible tetrahedron and theme toggle/restore
passed. Sampled homepage states had one Canvas and no horizontal overflow; the
Agent entry had none. Screenshots were captured and inspected outside Git.
No page exceptions were captured. Three.js Clock deprecation warnings and a
Chromium texture-copy warning during viewport emulation were observed; these
were not suppressed or addressed through unrelated runtime/dependency changes.
These checks do not constitute physical-device, full four-chapter or final
subjective brand acceptance.

This branch is a review candidate. Production URLs still serve the existing
production revisions until the user approves merging and publication. Drafts,
settings suggestions and pending decisions are in
`docs/archive/2026-10-15-axmorf-brand/`.
