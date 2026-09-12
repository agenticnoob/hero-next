# Current Status

Last verified: 2026-09-12.

Hero Next is an independent private Next.js project with its own npm lockfile,
TypeScript/Vitest configuration, installed dependencies, and local Git repository.
It consumes published Viselora packages, not a neighboring source checkout.

## Published dependencies

`@viselora/dom-webgl` and `@viselora/scroll-adapters` remain pinned to
`0.1.0-alpha.2`. The lockfile uses registry HTTPS tarballs and integrity hashes.
The standalone guard confirms manifest, lockfile and installed versions agree,
all four public entrypoints resolve locally, and there are no source aliases,
workspace links, private imports or raw Three.js ownership in application code.
The earlier extraction verified the installed files against the reviewed release
artifacts; package publication was completed separately from this site work.

## Code quality and domain boundaries — 2026-09-12

The seven reviewed areas are addressed in this working tree. Profile DOM and
Canvas consume the same responsive length tokens and actual root font size;
a shared viewport subscription coalesces events, preserves unchanged snapshots
and refreshes atlas/text layout when typography changes. Atlas composition,
profile/default chapter artwork and generic Canvas typography have separate owners.

The project room now declares exactly four entries through both TypeScript and
an input guard before texture allocation. Wall order, angles and atlas slots share
one model. Chapter numbers and interface translations are consumed from shared
content declarations. Theme, locale, room and frame-binding instances use React
state initialization; frame updates still remain outside React state.

Journal JSON enters through unknown-to-domain parsers on the server and client.
Every entry, manifest field, revision and ordering invariant is checked before
rendering. Requests are isolated by publication identity, with tested cancellation,
late-result exclusion and explicit retry. SHA validation checks format and the
content-hashed URL contract; it does not recompute response-byte integrity.

`npm run check` now includes complete Next.js Core Web Vitals / TypeScript / React
Hooks lint rules, zero-warning enforcement, Prettier, tests, both typechecks and
the standalone package guard. CI runs this gate before building. Existing runtime
package versions and visual ownership remain unchanged. ESLint 9.39.5 matches
Next 16.2.10's current plugin peer requirements; its upstream EOL is a toolchain
limitation, and ESLint 10 was not forced past incompatible peers.

Final verification on Node.js 22.22.3 / npm 10.9.8:

- `npm run check` passed: ESLint with zero warnings, Prettier, 43 test files /
  281 tests, test and app typechecks, and the 94-file standalone boundary guard.
- `npm run build` passed; Next.js 16.2.10 prerenders `/`. A TypeScript-aware
  scan of the 87 app/source modules found no runtime import cycles.
- `git diff --check` and a check of changed lines against the task-start snapshot
  passed. This repository has no initial commit and its files are untracked;
  the actual snapshot diff, not the empty Git diff, was used for change review.
- Added regressions cover responsive CSS/Canvas lengths at 1440/390 widths and
  16/20px roots, atlas font invalidation, viewport subscription cleanup, exact
  project-room capacity, localized DOM/artwork copy, malformed journal JSON,
  publication replacement, cancellation, late results and retry.

React Doctor 0.9.13 completed a full unfiltered scan of 138 supported files with
no skipped checks: 64/100, five occurrences (two errors and three warnings).
Both cleanup errors are false positives: the existing Profile effects return
unsubscribe, observer/listener teardown and animation-frame cancellation.
The Draco warning concerns an unchanged vendor WASM initializer outside React.
Two array-iteration suggestions still need production profiling to establish a
worthwhile optimization. No rules were suppressed and no speedup is claimed.
The source-only task-start scan omits vendor files, so its score is not directly
comparable. The earlier journal after-await diagnostic is absent from this scan.

Production Ego/Chromium checks covered 1440×900 desktop and 390×844 / DPR 2
touch emulation. Real primary-mesh mouse and touch holds committed both theme
directions; the desktop hold retained all four Portal text nodes. Language
switching and all four project selections worked, including their source links.
At a 20px root, desktop speech width/font were 280px/22.5px and mobile values
were 220px/17.5px, matching the shared declarations. Both root sizes were visually
sampled on mobile, with no horizontal overflow.

The opening screen made no journal request; entering chapter four loaded the
107-entry snapshot once. After waiting for smooth scrolling to settle, a desktop
wheel round trip moved the Timeline window `0 → 4 → 0`, retaining 16 correctly
paired dates. Earlier timing assertions sampled in-flight scroll positions;
the settled round trip passed without application changes. A mobile
reduced-motion load at the document end visibly retained the full 2026-05-16
date/tools/event pair while preserving the 16-pair DOM window. Sampled states had
one canvas and no captured page errors, unhandled rejections or JavaScript
console errors/warnings. Screenshots were kept outside Git. These are Chromium
emulation and sampled visual checks; physical devices, Safari and OS-level
preference switching remain unverified. The browser test space and local preview
server were closed after verification. No data sync, commit, push or deployment
was performed.

## Theme-commit text continuity — 2026-09-12

Real mesh hold reproduced theme-keyed Portal targets being removed and replaced.
New DOM text briefly became visible before WebGL readiness, and the new motion
effect restarted pointer parallax at zero. Journal pairs had the same theme key.
Both stages now retain their targets on a theme commit. Locale, viewport, semantic
content and journal-window lifecycle behavior remains unchanged.

A shared app-owned text effect uses the public managed material layer to reuse
the native texture alpha and geometry, updating foreground uniforms from the
existing committed-theme signal. It keeps Portal glyph fades and gives journal
text the same entry/depth opacity as its subtree, including reduced motion.
Unchanged uniforms are not resubmitted. Disposal restores the source material.
No package, renderer, canvas, source texture or theme store was added.

The regression reproducer failed before the fix. The full suite now passes
38 files / 220 tests, covering target identity in both theme directions, native
texture reuse, color updates, opacity, reduced motion and cleanup. React Doctor
remains 61/100 with the same six pre-existing findings outside these changes.

At 1440×900, a production Chromium real-hold trace captured 26 GPU frames.
Across the theme-color change, all four Portal textures kept their identities
and the maximum model-view matrix delta was zero. The DOM observation recorded
no replacements or visible fallback frames; one canvas and no captured page,
rejection or console errors/warnings. Heavy GPU instrumentation slowed sampling;
these samples are continuity evidence, not frame-rate measurements.

At 390×844 / DPR 2, a real primary touch hold switched initial to inverted;
22 observed frames retained all four Portal nodes with no visible fallback.
At 1440×900, the journal's reverse real-mesh hold retained all 48 native text
nodes across 19 observed frames, also without visible fallback or page errors.
Mobile screenshots confirm the palette reversal. Desktop screenshot requests
intermittently timed out under concurrent host load; desktop continuity is
supported by the GPU/DOM trace rather than a completed post-commit screenshot.

The final production build also passed a 1440×900 reduced-motion browser check:
the complete final 2026-05-16 pair was the only visible date, with one canvas,
no horizontal overflow and no captured page, rejection or console errors/warnings.
The native 16-date DOM window stays mounted while the shader hides other dates.
Test/app typechecks, the 80-file standalone guard, production build and whitespace
checks passed. Browser probes were confined to the test page and removed at
cleanup. Physical devices, Safari and OS-level preference switching remain
unverified. No commit, push, data sync or deployment was performed.

## Continuous Timeline integration

The final Hub after chapter four now displays a continuous daily Timeline.
Date and compact tools appear on the left; the matching Timeline event appears
on the right. Both native text subtrees share one date object, scroll position,
depth and opacity. Multiple days appear together, growing from the upper sides,
moving down and exiting through the bottom. Newest comes first. The tetrahedron
stays central, with a smaller terminal scale on mobile. The old side copy,
bottom links and detailed journal paragraphs are removed.

Viselora owns native text rasterization, perspective, subtree transforms and
resource cleanup. The app maps its existing scroll truth to paired positions;
React mounts a moving window of at most 16 dates. Long events receive more
spacing without splitting a date. Reduced motion selects one stationary pair.
The background now uses depth-tested model ordering at depth 40, behind the
Timeline text; see the GLB correction below. No renderer, canvas, dependency or
upstream edit was added.
Original Timeline Chinese remains unchanged in both locales.

`sync:journal` joins `TIMELINE.json` events to daily tools by exact date, validates
and whitelists date/tools/event, sorts newest first and writes content-hashed,
gitignored snapshots. The opening screen receives only a manifest; the snapshot
loads on entering chapter four. The verified local snapshot contains 107 dates,
2026-05-16 through 2026-09-08, omitting two dates without Timeline events. Full
journal bodies, conversation data and caches are excluded. The previous detailed
snapshot was moved out of the served public directory into ignored local storage.

A resize check also exposed negative second-chapter paper heights when its header
fills a short viewport. Paper-area height now has a positive lower bound, keeping
stamp arcs valid and preventing an exception from interrupting the shared render
loop. A regression test reproduces the previously negative geometry. This does
not redesign the second chapter for very short landscape viewports.

Both repositories now have workflow files for `repository_dispatch` notification
and verified website builds. See [journal publishing](./journal-publishing.md) for
setup. The receiver builds an artifact only. No website remote is configured in
this checkout, no cloud workflow has run, and no deployment platform or Secrets
have been configured. No commit, repository creation, push or site publication
was performed. Existing source-data changes were preserved.

## Timeline spacecraft motion — 2026-09-12

The user accepted the continuous Timeline layout and requested flight feedback
on its central tetrahedron. The existing scene-object effect now applies damped
scroll-speed thrust, up to 22% scale reduction, slight depth pullback, bounded
pitch/bank and vibration, plus slow self rotation that accelerates during scroll.
It reads Viselora's frame scroll displacement and delta; no listener, render loop,
React frame state, duplicate mesh or postprocess pass was introduced. Only the
last 10% of chapter-four exit and the final Hub receive this motion. Returning to
the chapter clears flight state. Real mesh hold pauses self rotation; the existing
hold transition continues to own its motion suppression and theme commit.

An extra uniform in the existing managed shader boosts the Fresnel edge while
accelerating. The public package has no temporal afterimage API; true trails are
not implemented. Canvas/pass-wide blur would also affect the Timeline. Package
versions, shader ownership and the two semantic colors remain unchanged.

The 212-test suite includes flight gating, acceleration and settling, reverse
banking, viewport/frame-rate normalization, paused-tab delta bounds, hold freeze,
mobile offsets, reduced motion, native effect integration and uniform defaults.
Test typecheck, app typecheck, standalone guard and production build passed.
React Doctor's prior findings below were not rescanned: this change adds no React
component or hook logic.

Chrome production checks used 1440×900 desktop and 390×844 mobile/touch. Real
PageDown then PageUp inputs returned to the same newest date. Temporary browser
instrumentation of the existing WebGL uploads measured a peak flight boost of
0.727 and model scale about 0.948 during forward acceleration, returning to 1.121
at rest. Screenshots confirmed rotation and both paired text columns. Mobile
kept the compact tetrahedron between the columns. Reduced-motion was exercised
with a test-only pre-load matchMedia override: flight boost stayed zero and no
repeated transform uploads occurred while the stationary tetrahedron remained
visible. These instrumentation/override patches are browser-only and removed by
final reload. One canvas, no horizontal overflow, and no page errors, unhandled
rejections or console errors/warnings were recorded in these flight checks.

OS-level preference changes, physical devices, Safari and a repeated real hold
interaction were not verified in this revision. Hold behavior is covered by the
existing and new automated checks. No commit, push, data sync or deployment was
performed in this flight revision.

## GLB visibility, face attachment and material correction — 2026-09-12

Production browser inspection reproduced the opaque GLB being overpainted by the
background. The surface role disabled depth testing, while the earlier depth-5
background also intersected the Timeline's farther text. The same managed plane
now uses model ordering at depth 40, behind the farthest text (~30.4) and within
the camera's far plane of 50. Both the profile and distant journal remain visible.

The tetrahedron effect publishes the final applied transform through one
scene-local frame binding. The profile consumes that transform for its face-local
relief instead of integrating pointer motion and recomputing a frame without
flight. Position, bank, spin, thrust scale, hold suppression and mobile scaling
therefore stay aligned. Late model loading and either model/mesh update order are
supported; disposal disconnects the model and clears the last scene output.

The alpha.2 GLB material facade does not provide a shader hook. The previous
optional onBeforeCompile calls silently did nothing and have been removed.
Native GLB material metadata now omits the normal-map reference and shares the
base-color texture with the emissive input. Public material controls set a 0.12
textured fill, 0.72 roughness, zero metalness and the same light tint in both
themes, once on setup, restoring their previous values on disposal. This is not
the formerly documented 32% shader mix. The GLB is 1,824,760 bytes; its Draco and
WebP BIN chunk is byte-identical to the task-start asset. The valid specular color
factor [2, 2, 2] was preserved. Profile-body pointer lighting now uses 1% of Hub
intensity (previously 4%) to retain facial texture near the pointer; other
chapters keep their existing lighting factor. A fast chapter jump also caps any
residual Hub light immediately, avoiding a bright flash while damping settles.

Ego/Chromium production checks covered 1440×900 and 1782×875 desktop, and
390×844 touch emulation. Profile screenshots show the model and texture in both
themes. Real mesh hold committed the inverted theme. Real PageDown/PageUp and
mobile wheel input exercised Timeline flight with 107 dates. Across 22 desktop
and 47 mobile GPU frame samples, inverse(tetrahedron model-view) × profile
model-view stayed constant within 1.4e-7 and 9.8e-7 respectively, including
acceleration; peak flight boosts were 0.664 and 0.735. The sampled profile program
had no normal-map uniform and did have the emissive texture uniform. Background
GPU state confirmed depth testing and depth writes at depth 40.

Browser reduced-motion emulation retained the model and the complete final
2026-05-16 pair, with flight boost zero. Sampled states had one canvas, no
horizontal overflow, and no captured page errors, unhandled rejections or console
errors/warnings. Instrumentation is test-page-only and removed on cleanup.
These are Chromium checks, not physical-device, Safari, or OS preference-switch
acceptance. The earlier browser evidence below remains historical.

Regression coverage now includes relative face matrices across full rotations
and desktop/mobile scales, both runtime update orders, hidden chapter bodies,
material setup without a shader facade, cleanup, native GLB material metadata and
texture references. React Doctor fell back from changed scope to a full scan
because this repository has no initial commit: 61/100, the same six findings in
unchanged files. No package change, commit, push, data sync or deployment occurred.

## Earlier Timeline integration verification

Node.js 22.22.3 / npm 10.9.8:

- `npm test`: 37 files / 216 tests passed.
- `npm run typecheck:tests`, `npm run check:standalone` (79 TypeScript files),
  `npm run typecheck`, and `npm run build` passed. Next.js 16.2.10 prerenders `/`.
- Actionlint 1.7.12 passed both new workflows. The official binary's SHA256 was
  verified before temporary local execution.
- `git diff --check` passed. Because the repository has no initial commit and
  files are untracked, implementation changes were also reviewed against a
  task-start file snapshot instead of treating an empty Git diff as coverage.

Tests cover exact-date joins with distinct daily tools, whitelist exclusion,
invalid dates and malformed tools, deterministic exports, preservation of a
previous snapshot after failure, concurrent visible dates, reversible perspective,
bottom exit, bounded target windows, identical left/right motion, reduced motion,
mobile-only terminal scale, lazy loading, retry, abort and ignored late responses.

That integration's React Doctor scan reported 61/100 with six diagnostic groups. Its two
profile-cleanup findings have explicit unsubscribe, observer/listener cleanup and
animation-frame cancellation in the unchanged code. The new after-await warning
is an intentional one-shot fetch effect with an AbortController and aborted-state
guards; unmount/late-response and retry tests pass. Remaining warnings concern
unchanged array iterations and the third-party Draco decoder. Nothing was
suppressed or refactored just to change the score; no all-green scan is claimed.
The upstream consumer verifier also does not pass this repository: it expects
capability/asset manifests absent from this standalone app and scans generated
`.next` bundles. The app-owned standalone guard and runtime checks are the
verification evidence; no speculative manifest or package modification was added.

## Earlier Timeline production browser evidence and limits

The local production app was checked in Chrome at 1440×900 and 390×844 touch
emulation. That integration's checks included:

- No snapshot request on the opening screen; 107 semantic entries after entering
  chapter four. The served snapshot returns HTTP 200, and its browser-computed
  SHA256 matches the manifest. Its entries contain only date, tools and event.
- Desktop screenshots show several dates simultaneously at matching heights on
  both sides. Two real PageDown inputs move the date window `0 → 2`; two PageUp
  inputs return it to `0`, preserving 16 mounted pairs and the newest entry.
- Mobile screenshots show the two columns with a small central tetrahedron.
  The sampled mounted dates all have identical left/right date identifiers.
- Reduced-motion behavior was checked on mobile using a test-only `matchMedia`
  override before page load: the final 2026-05-16 date, tools and complete event
  remain paired and visible at the document end. The override was removed on
  the final reload. OS-level accessibility preference switching was not tested.
- The rebuilt app was checked at 720×450 after the paper-height correction:
  entering chapter two no longer produced a frame-sync exception.
- One canvas and no horizontal overflow in sampled desktop/mobile states.
  The final normal desktop and reduced-motion mobile loads recorded no page
  errors, unhandled rejections, console errors or warnings.
- Chrome reports a driver-level `GL_INVALID_VALUE: glCopySubTextureCHROMIUM`
  warning during the earlier texture setup (four occurrences), despite successful
  rendering. It did not recur on the final clean loads; the overall session must
  not be described as warning-free.

Ego's viewport screenshot API repeatedly timed out; verification switched to
Chrome at the user's request. A direct canvas frame was readable in Ego and
helped identify the short-viewport geometry exception described above. Ego's
old paginated-journal screenshots are not evidence for this revision.

Screenshots are kept outside Git. These are Chromium emulation and sampled visual
checks, not physical-device/Safari validation or exhaustive review of every date.
Primary-mesh hold/theme interaction was verified on the preceding journal
implementation, but not repeated in this revision. Without-WebGL visual fallback
has not been accepted; complete Timeline content is
present in the accessible DOM after the snapshot loads. Cloud dispatch, deployment
and deployed data readback remain unverified until repository/platform/Secrets
setup is completed.

## Ownership

Continue application work here. Reusable runtime capability changes belong in
Viselora and require a separately authorized upstream change and npm release.
The original workspace app and data repository's existing work remain intact.
