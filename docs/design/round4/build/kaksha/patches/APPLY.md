# Stream K (Kaksha) · patch requests

Apply these in the order listed. Each one is also on `claude/r4-app-design` as its own commit, with a subject starting
`[patch-request]`. The numbers follow BUILD-SPEC §10.2.

| # | file (owner) | diff | why | proved by |
|---|---|---|---|---|
| K-P8 | `src/child/routes.tsx` (stream 5) | `08-child-routes-kaksha.diff` | Behind `ui.kaksha` (default off), the index route renders `KakshaHome`, `map` renders `KakshaWorld`, and the new `hangar` route renders `KakshaHangar`. The flag is read at render time, and the Kaksha chunks are lazy. With the flag off, every route renders exactly what it does today; `hangar` redirects to Home. | `npx tsc -b`; `npx vite build`; `npm test` (incl. `ui-v2-b2`, `child-routes` unit tests); `tests/prod/r4-kaksha-shots.mjs` 0 findings over 48 states |
| K-P10 | `server/routes/account.js` (main) + new `server/ui/kaksha-cohort.js` | `10-server-kaksha-cohort.diff` | The owner cohort is enforced server-side (main session, 2026-10-10). `TAXILA_UI_KAKSHA` holds hashed or plain guardian emails, and GET /api/me (and /api/child/boot, which folds `meData`) answers `ui: { kaksha }`. In a production build, the client honours `?ui=kaksha` and the device key only when that answer is true. In dev builds the URL stays free. The answer never reveals the list. K-P8 (rev 2) passes `me.ui.kaksha` to the switch. | `tests/r4-kaksha-cohort.test.mjs` 4 / 4: an account outside the cohort that types `?ui=kaksha` still gets today's Home; plain and hashed lists; the classic override; dev freedom |
| K-P7 | `scripts/lint-ui.mjs` (main) | `07-lint-ui-kaksha-allow.diff` | L-HEX allow for the Kaksha palette files (`src/ui-v3/kaksha/tokens.{css,ts}`). L-DEVA and L-HING allow for the dormant localisation columns in `src/ui-v3/kaksha/copy.ts`: `CHROME_LANG` is fixed to `"en"` (K-O1 answer), and K-EN proves nothing else is rendered. | `node scripts/lint-ui.mjs --json` gives 353 findings with the patch (the baseline) and 491 without it; `tests/ui-v2-lint` unchanged; `tests/r4-kaksha-lint` K-EN |

**K1** (the Desk skin and the Debrief):

| # | file (owner) | diff | why | proved by |
|---|---|---|---|---|
| K-P2 | `src/child/lesson/Desk.tsx`, `src/child/lesson/LessonScreen.tsx` (stream 2) | `02-desk-skin-debrief.diff` | Desk: optional `skin` (written as `data-skin` on the root), `data-zone` on its zones (top, teacher / window, caption, card, tray, strip, dock), and an optional `renderSummary` that replaces the Summary. LessonScreen: behind `ui.kaksha` and the server cohort (`me.ui.kaksha`, K-P10), the Desk renders inside the lazy `KakshaLesson` frame, which passes `skin="kaksha"` and the Debrief. **Flag off: the Desk renders with no skin and the Summary, exactly as today**; nothing of the Kaksha chunk loads. No layout, zone size, floor, sheet or behaviour changes. Stream 2's `claude/r4-content` has the same Desk.tsx / LessonScreen.tsx as base, so the diff applies on either. | `npx tsc -b`; `npx vite build`; `npm test` (`round3-fix`, `ui-v2-*`, `w1a-*` unchanged); `tests/r4-kaksha-desk.test.mjs` 7 / 7; `tests/prod/r4-kaksha-desk-shots.mjs` 0 findings over 81 pages; `tests/prod/r4-kaksha-latency.mjs` (no added turn latency, RESULTS.md) |

**K2** (the Briefing, the Hangar colours on Antariksh). Both go to **G1** (`claude/r4-games-core`) and apply on its tree
at `78b7a86b` (checked against a clean index): K-P3 first, then K-P4.

| # | file (owner) | diff | why | proved by |
|---|---|---|---|---|
| K-P3 | `src/play/PlayStudioRenderer.tsx`, `src/play/PlaySession.tsx` (G1); new `src/play/briefing.ts` (the seam, already on `claude/r4-app-design`); new dev page `src/ui-v3/kaksha/dev/briefing.{html,tsx}` (K; it needs G1's engines, so it travels in this patch) | `03-play-briefing-seam.diff` | The optional Briefing slot. When a shell provides `PlayBriefingContext`, and the level will **really** mount an engine (an engine renders this family/mode, the server did not send `render: "2d"`, and the device is not 2D-tier: the tier is probed once), the renderer shows the card in the box, fetches the model's dress **while the card is up**, mounts `PlaySession` on `launch()`, keeps the card over it for the warp, and removes it on `done()`. `PlaySession` takes that dress reply (`dressReply`), so there is no second fetch at mount, and the look the card names is the look that plays. With no provider, play is unchanged. Acts, tokens and grades are untouched. | `tests/r4-kaksha-play.test.mjs`; `tests/prod/r4-kaksha-briefing.mjs` on G1 + K-P3/K-P4: 0 findings over 6 pages; HOLD-1, KEY-1, TRUTH-1, WARP-1; FRAME-1 (Briefing 1,229 / 1,341 ms vs the engine alone 1,200 / 1,345 ms, p50 / p90) |
| K-P4 | `src/play/engines/core3d/api.ts`, `src/play/engines/antariksh/{world,index}.ts` (G1) | `04-antariksh-cosmetics.diff` | `DressedSpec.cosmetics?: PlayCosmetics`: **client-only** (the child's Hangar choice; never a model's, never the server's). Antariksh tints its own craft: the hull material, the flame, and the exhaust puffs' colour. These are colour setters only, with the craft's own colours as the default. `PlaySession` puts the colours on the dress it hands the stage (memoised, so there is no spurious redress). | REPLAY-1: the same presses with the colours off and on post **byte-identical** acts (2 posts, 3 acts); `tests/r4-kaksha-play.test.mjs` (only colour setters in the diff; no law, generator or server file) |

**Not needed in K0:** K-P1 (lit ground on `<Teacher>`), K-P2 (Desk skin), K-P3 and K-P4 (play), K-P5
(`secure_since`), K-P6 (parent cards) and K-P9 (app router).
- Kaksha draws her lit ground itself behind `<Teacher ground={false}>`.
- The world reads the existing `/api/child/map`. Until K-P5 lands, the settlement slots fall back to each skill's
  seed.
