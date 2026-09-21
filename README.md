# Hero Next

`@viselora/hero-next` is a standalone private Next.js App Router personal site.
It consumes published Viselora packages through their public entrypoints.
Both `@viselora/dom-webgl` and `@viselora/scroll-adapters` are pinned to
`0.1.0-alpha.2` from npm; see [current verification](./docs/STATUS.md).

Production: [zzzxc.com](https://zzzxc.com).

All four projects have complete bilingual case studies: `/projects/axmorf-studio`,
`/projects/viselora`, `/projects/syringe-meter` and `/projects/vibe-journal-pipeline`.
Each includes seven sections, a workflow, engineering decisions and current
boundaries. SyringeMeter also retains its on-demand demonstrations and real
measurement/CSV screenshots. Opening a case from chapter three preserves the
room behind a native reading dialog; opening or refreshing its URL renders a
standalone page. The shared root state keeps one theme, locale and room selection.

Chapter three also links to `/projects`, a bilingual directory containing the four
selected cases and generated public projects. GitHub-hosted Actions scans selected
repositories daily, uses Codex only for changed README inputs, and proposes a
content-only PR. Merging an approved PR uses the existing production pipeline.
See [project publishing](./docs/project-publishing.md) for subscription authentication,
selection rules, Actions permissions and activation steps. No local computer is required.

The site has four chapters: self, AI/philosophy axioms, public builds and public
channels, followed by the daily journal. Chinese and English share typed content
and a persisted locale. Chapter one uses the public nickname and abstract figure;
real identity, cities, birth year, dated education/work history and military
service are omitted from both languages and their transition artwork.

Mobile, touch and short landscape windows use a reading layout: full-width
profile copy with a separate model area, a linked article index with complete
text, compact project and profile lists, and QR codes behind native disclosures.
The journal starts with the latest 12 dates and loads 12 older dates per action,
keeping each day's complete tools and event together. A keyboard-accessible
chapter menu uses the same Lenis instance as page scrolling. Entry and exit
runways are 110svh and 60svh in this layout; content has natural height.

Wide windows with a fine pointer retain the circular article index and moving
postage-edged sheets, the four-wall project room, seven public-directory hover
previews and the perspective journal. The public directory includes Douyin,
Xiaohongshu, Bilibili, Blog, GitHub, the supplied LeetCode profile and the
[resume homepage](https://resume.zzzxc.com/). Large-screen
profile copy retains its two columns, measured model/bubble exclusions and
reversible model turn. See [visual behavior and extension instructions](./docs/visual-design.md).

One runtime, canvas, scroll source and committed theme own both layouts. WebGL
keeps the tetrahedron, true face projection, triangular transition, GLB and
lighting. Reading-layout transition tiles snapshot the semantic body's real text
line geometry at its entry and exit; resize, locale, fonts, images and disclosure
changes invalidate those tiles outside the frame loop. Desktop atlas drawing
continues to use its shared layout models. Native scroll-coordinate rounding is
handled at the entry/exit boundaries so reaching a chapter cannot leave its DOM
hidden. Reduced motion keeps readable content and reversible chapter semantics.

The semantic palette is light `#C8C8C8` and dark `#424242`, with at least 4.5:1
normal-text contrast in either direction. Chapter colors invert the committed
Hub theme. Desktop uses a real mesh hold at a complete Hub to switch themes.
Reading layouts use an accessible button beside the language controls, available
throughout the page; tetrahedron holds are disabled there. Both commit to the same
store and persist across refreshes. Changing to a reading layout cancels a pending hold. The optimized
profile GLB stays below 5 MB; its original asset remains outside the repository.

## Run

Use Node.js 22.x (the exact local version is in `.node-version`) and npm 10. From this directory:

```bash
npm ci
npm run sync:journal -- --source /Users/ai/projects/vibe-journal-pipeline/data
npm run dev
```

This project includes its own dependency lockfile, TypeScript configuration,
and test setup. It does not require a checkout of the Viselora repository.
The sync command reads Timeline events and daily tool lists and must run before the first dev
session or build. Run it again and rebuild to publish updated data. Generated
snapshots are gitignored. See [journal publishing](./docs/journal-publishing.md)
for the cross-repository setup. GitHub Actions validates and builds the website,
deploys the prebuilt output to Vercel, then checks the public snapshot against its
source commit. Direct Vercel Git deployments are disabled. Cloud activation and
verified production runs are recorded in [current status](./docs/STATUS.md).

Use the Network URL printed by Next.js to open the app from another device. The
development allowlist intentionally accepts any dotted hostname or IPv4 origin,
so DHCP address changes do not require a configuration edit and the HMR
WebSocket remains available. This applies only to `next dev`; use it only on a
trusted network and never expose the development port to the public internet.

For a local production preview, build first and then keep the server running:

```bash
npm run build
npm run start -- --hostname 127.0.0.1 --port 3002
```

### Development troubleshooting

Keep the development terminal or tool session alive. If the site stops
responding, check the actual listener before starting another server:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Stop only the identified stale app process, then restart it. To keep logs
independent of a tool session's output pipe, redirect them to a local file:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000 > /tmp/viselora-hero-next-dev.log 2>&1
```

This command runs in the foreground; redirection does not supervise the process
or keep it alive after its execution environment terminates. `write EPIPE`
means a pipe or socket's receiving end has closed. Inspect its stack and output
destination before assigning a cause; the error alone does not identify which
connection failed. Check the new server response and logs after restarting.

If a hydration error shows an injected attribute such as `trancy-version` on
`<html>`, disable that browser extension for the local site and reload, or
compare with a browser profile without extensions. See the
[Next.js hydration guidance](https://nextjs.org/docs/messages/react-hydration-error).
Do not suppress all hydration warnings to hide an extension-specific mismatch.

### Validation

Run the full local quality gate with `npm run check`. It includes Next.js/React
Hooks/TypeScript lint rules, formatting, tests, both typechecks and the standalone
package boundary. Use `npm run format` to format app-owned source and current docs.
Individual checks:

```bash
npm run lint
npm run format:check
npm test
npm run typecheck:tests
npm run check:standalone
npm run typecheck
npm run build
```

## Boundary

Project case-study components and media configuration live in `src/projects/`;
their bilingual copy remains in `src/chapters/content.ts`. `app/@project/` owns
the intercepted exhibition routes, and `app/projects/[slug]/` owns the
standalone pages and metadata. `projectCaseStudies` defines the curated slugs;
`src/projects/catalog.ts` adds validated `data/projects.json` entries with stable
`gh-<repository id>` slugs. `src/projects/ProjectDirectory.tsx` renders the directory.
`src/projects/ProjectShowcase.tsx` renders their shared reading layout.
`src/experience/HeroSiteState.tsx` provides the
shared state above both routes. See the media and extension notes in
[visual design](./docs/visual-design.md).

- Consume public Viselora entrypoints only.
- Keep one runtime and one canvas.
- CSS owns semantic DOM layout, accessible theme tokens, stacking, overflow,
  and pointer routing; it does not own the triangular transition window.
- WebGL geometry, face projection, triangular reveal, lighting, shader behavior,
  and motion belong to public package declarations and app-owned effects.
- Do not add raw Three.js ownership, a second renderer, private package imports,
  duplicate visual state, or a Hero-specific package branch.
- Keep runtime/effect declarations referentially stable.

## Source map

| Responsibility                                                                     | Path                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page/runtime composition and subscriptions                                         | `src/experience/`                                                                                                                                                                                                                               |
| Chapter identity, signals, face, and atlas mapping                                 | `src/chapters/definitions.ts`                                                                                                                                                                                                                   |
| Chapter content, semantic composition, and locale control                          | `src/chapters/content.ts`, `src/chapters/contentModel.ts`, `src/chapters/uiContent.ts`, `src/chapters/HeroChapterNarrative.tsx`, `src/chapters/HeroChapter.tsx`, `src/chapters/HeroLocaleControl.tsx`, `src/chapters/HeroChapterNavigation.tsx` |
| Chapter-one profile body, model declaration, and scroll effect                     | `src/profile/`                                                                                                                                                                                                                                  |
| Chapter-two article index, reading layout, sheets and managed effect               | `src/axioms/`                                                                                                                                                                                                                                   |
| Chapter-three project room, exhibitions, and semantic controls                     | `src/projects/`                                                                                                                                                                                                                                 |
| Chapter-four public directory, previews, and endpoint artwork                      | `src/signals/`                                                                                                                                                                                                                                  |
| Final journal data, paginated reading list, native text targets and scroll mapping | `src/journal/`                                                                                                                                                                                                                                  |
| Journal export, Actions deployment and public verification                         | `scripts/sync-journal.mjs`, `scripts/verify-journal-deployment.mjs`, `.github/workflows/journal-build.yml`, `vercel.json`                                                                                                                       |
| Reversible scroll, geometry, layout, and atlas                                     | `src/chapters/scrollState.ts`, `src/chapters/geometry.ts`, `src/chapters/layout.ts`, `src/chapters/atlas.ts`, `src/chapters/artwork.ts`, `src/chapters/readingArtwork.ts`, `src/chapters/readingLayout.ts`                                      |
| Theme and locale persistence                                                       | `src/preferences/`                                                                                                                                                                                                                              |
| Hold/radial/portal state, palette/config, and progress encoding                    | `src/transition/`                                                                                                                                                                                                                               |
| Tetrahedron effect and managed shader                                              | `src/tetrahedron/`                                                                                                                                                                                                                              |
| Background, cursor, and pointer-light effects                                      | `src/ghost/`                                                                                                                                                                                                                                    |
| Shared Canvas text measurement and drawing                                         | `src/shared/canvasText.ts`, `src/shared/canvasTextLayout.ts`                                                                                                                                                                                    |
| Profile DOM/Canvas size tokens                                                     | `src/profile/layoutTokens.ts`                                                                                                                                                                                                                   |
| Shared viewport boundary                                                           | `src/shared/viewport.ts`, `src/shared/viewportStore.ts`, `src/shared/useHeroViewport.ts`                                                                                                                                                        |
| App constraints                                                                    | `AGENTS.md`                                                                                                                                                                                                                                     |
| Current visual direction                                                           | `docs/visual-design.md`                                                                                                                                                                                                                         |

## Current evidence boundary

Current automated coverage, desktop/mobile interaction evidence, and remaining
diagnostics are owned by [the current status](./docs/STATUS.md).
Canvas and DOM glyph
rasterization can still differ slightly, and all content remains a base version
intended for subsequent editorial adjustment.

Standalone verification and migration boundaries are recorded in
[docs/STATUS.md](./docs/STATUS.md). Upstream package ownership remains with
[Viselora](https://github.com/agenticnoob/dom-webgl-workspace).
