# Code structure review — 2026-09-22

Scope: application source, module dependencies, repeated domain rules, React
diagnostics and existing tests. Preserve the current visuals, copy, runtime
ownership, package versions and publishing workflows.

## Changes

- Theme and locale duplicated storage access, fallback handling, subscriptions
  and commits. `preferences/persistedStore.ts` now owns those mechanics. Each
  preference retains its key, parser and stable server default; each provider
  still creates its own instances. Storage denial or quota errors preserve
  in-memory updates and notifications.
- `projects/room.ts` combined geometry, semantic state, DOM navigation and focus.
  `roomStore.ts` now owns state and exhibit references; `roomNavigation.ts` owns
  return geometry/focus, including the former component-local return capture.
  The caller supplies scroll restoration, avoiding a navigation-to-runtime
  initialization dependency. Existing frame effects remain unchanged.
- Case pages and dialogs separately searched translated chapter content for
  wall positions, and the standalone return link inferred membership from `gh-`.
  Catalog entry metadata now supplies `href` and optional `roomIndex`; the room
  position is derived once from curated chapter links. Generated entries never
  acquire a wall. The directory resolves focus using its registered route and
  literal DOM selector, and derives its chapter number from chapter definitions.

## Deliberately retained

Visual tuning numbers, four-wall geometry, shader parameters, curated URLs and
SyringeMeter-specific media/metadata are intentional domain data. Moving every
literal to a global constants file would obscure ownership without removing
duplication. The bilingual content registry remains the documented copy owner.
No generic event bus, global state singleton, new dependency or compatibility
re-export was introduced.

An optional TypeScript no-unused audit reported only existing default React
imports in eleven TSX modules. The current test transform uses those imports;
they were retained. The repository's configured lint and typechecks pass.

## React Doctor evidence

React Doctor 0.9.14, full unfiltered scope: initial 177 source files, final 181.
Both reported 57/100 with the same two errors and two warnings. The final JSON
report uses schema 3, detects React and reports complete coverage. The separate
changed-scope scan against the starting HEAD includes new source files and reports
100/100, 23 files, zero new diagnostics.

- `HeroProfileSpeechBubble.tsx` and `useProfileWrap.ts`,
  `react-doctor/effect-needs-cleanup`: rejected with high confidence. Both capture
  the optional subscription's teardown, call it in their returned cleanup,
  cancel pending animation frames and guard late scheduling with `disposed`.
  Media listeners / resize and mutation observers are also released. Early
  returns occur before allocation. This matches the published rule's explicit
  exception for a cleanup the detector missed; the pinned local rule explanation
  was also consulted. No cleanup code or suppression was added.
- Two `no-non-literal-selector-query-without-try-catch` warnings in
  `ProjectShowcase.test.tsx`: rejected with high confidence as external-input
  defects. They resolve fixture anchors from the fixed, typed case registry;
  arbitrary href/hash input cannot reach them. The existing tests exercise every
  registered article anchor. No rule was disabled.

The published rule guide identifies plugin rule set 0.9.3; exact detector-version
parity with the CLI could not be established. Source evidence and the pinned
CLI's rule explanation determine applicability, not the score alone.

## Verification

The pre-change `npm run check` passed with 55 files / 450 tests. After refactoring,
the same gate passes with 56 files / 463 tests, zero-warning ESLint, Prettier,
both typechecks and the 118-file standalone package boundary. Production build
and `git diff --check` pass. New tests cover both preference stores' hydration,
storage failures, unsubscribe, commit deduplication and instance isolation, plus
catalog-derived room membership and return destinations.

Browser verification and current publication status are recorded in
[STATUS.md](../STATUS.md). Screenshots and raw scan logs remain outside Git.
