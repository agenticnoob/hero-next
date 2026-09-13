# Current Status

Last verified: 2026-09-13.

Hero Next is a standalone private Next.js site consuming the public Viselora
`0.1.0-alpha.2` packages. Repository: [agenticnoob/hero-next](https://github.com/agenticnoob/hero-next).
Production source is `main`; local `axmorf/standalone` tracks `origin/main`.
Production: [hero-next-jade.vercel.app](https://hero-next-jade.vercel.app).

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
  spacing. All six public profiles remain direct links, including the exact LeetCode
  destination; three QR disclosures are separate from the links and initially closed.
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

## Verification

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

The last release before the mobile change was application `b083c8c`, followed by
aligned documentation `ffd9593`. Its [successful workflow](https://github.com/agenticnoob/hero-next/actions/runs/34683009838)
actually published and verified the public snapshot. The mobile release receipt is
added after its workflow and independent production readback complete.

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
