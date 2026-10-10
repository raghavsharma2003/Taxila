# Stream K · Kaksha: RESULTS

**Branch:** `claude/r4-app-design` (stream K runs on the U1 branch, per the main session's 2026-10-10 GO).
**Spec:** `docs/design/round4/app/BUILD-SPEC.md`. **Decisions:** `dc-r4-app-kaksha`, `dc-r4-kaksha-k-o-answers`.
**Updated:** 2026-10-10.

**Honesty:** no child has used any of this. Every performance number below is a **G35-class proxy**: headless
Chromium with CPU ×4 throttling at 360 × 800, DPR 2. None was measured on a phone (K-O3 is open).

## K0: built (flag `ui.kaksha`, default OFF)

| piece | where | what it does |
|---|---|---|
| tokens | `src/ui-v3/kaksha/tokens.{ts,css}` | Night (Older family) and Dawn (Young family), keyed on the band family (K-O2). A scoped layer `.v3.kx` over src/ui-v3 |
| font | `public/fonts/space-grotesk-latin.woff2` (22 KB, OFL; noted in `OFL-NOTICE.txt`) | Latin UI and display. Geist Mono and Mukta were already shipped |
| shell | `src/ui-v3/kaksha/Shell.tsx` | `KakshaRoot`; `Sky` (3-layer parallax starfield; paused when hidden; a still frame under reduced motion; 120 stars at DPR ≤ 1.5 on a low device); `Comms` (her chamfered window with the lit ground, the kesar rim while she speaks, and "AI teacher" always shown) |
| Home | `src/ui-v3/kaksha/screens/KakshaHome.tsx` and `views.tsx` `HomeView` | Start only: her face, her name, one Start. No topic and no tiles. States from the plan: start, first, homework, test_window → Start; done → Start plus a calm line; capped and resting → no CTA. **safety_hold, offline and signed-out render today's Home unchanged** (the hold copy, HelpSheet and the 1098 / 14416 floor are untouched). The `primary-card`, `start-lesson` and `grownups` test ids are kept |
| World | `src/ui-v3/kaksha/world.ts`, `Orbit.tsx`, `Settlement.tsx`, `screens/KakshaWorld.tsx` | Draws from the existing `/api/child/map` (pure; see the economy test). Orbit: subject rings, a station per secure skill, a moving point per got_it, and city lights on the night side. Settlement (the Nagar layer): one structure per secure skill that embodies the idea (stepwell, jantar, minaret, bridge…). A Yesterday/Today toggle comes from a per-child device snapshot. With consent hidden, the World shows the planet and the Hangar only |
| Hangar | `views.tsx` `HangarView`, `data/kaksha/catalog.json` | Items open only on a matching secure skill; not-yet items are shown as "Opens when secure: …". No locks and no counts. Equipping is per child (`memory.ts`, keyed by cid) and changes nothing else |
| copy | `src/ui-v3/kaksha/copy.ts` | `CHROME_LANG` fixed to `"en"` (K-O1). Dormant Hinglish and Hindi columns. Proper nouns: Kaksha, Antariksh, Khand, Asha |
| dev page | `src/ui-v3/kaksha/dev/` | Fixture page for shots and the rendered lint. Not a build input; never shipped |
| routes | **[patch-request] K-P8** `src/child/routes.tsx` | Index → `KakshaHome`, `map` → `KakshaWorld`, new `hangar` → `KakshaHangar`, only when `ui.kaksha` is on. The flag is read at render; the chunks are lazy |
| lint allow | **[patch-request] K-P7** `scripts/lint-ui.mjs` | L-HEX for the Kaksha palette files; L-DEVA and L-HING for the dormant copy columns |

**Turn it on (owner cohort):** set `TAXILA_UI_KAKSHA` on the Container App to the owner's sha256(email). That is
K-P10: a server-side cohort answered on /api/me. Then open a child URL once with `?ui=kaksha`, which stores
`tx.flag.ui.kaksha` on the device.
- In a production build, the URL and device key count **only** for accounts in that cohort. Anyone else who types
  `?ui=kaksha` keeps today's Home (`tests/r4-kaksha-cohort.test.mjs`).
- `?ui=classic` turns it off. `?ui=default` clears it.
- Dev builds keep the URL switch free.

## Numbers (2026-10-10, this tree)

| check | result | method |
|---|---|---|
| `tests/r4-kaksha-economy.test.mjs` | **6 / 6 pass** | E1 iff: 200 random maps. E2 monotonic: 300 random maps with random promotions. E3 no clock and no randomness in `world.ts`. E4 stable, with append-only slots given `since`. E5 no counts exposed. E6 equip only for open items, with no price, chance or currency fields |
| `tests/r4-kaksha-lint.test.mjs` | **8 / 8 pass** | K-MIRROR, K-CONTRAST (every text pair ≥ 5:1 in both themes), K-FLOOR, K-NOLOCK / K-NOCOUNT / K-ECON, K-EN, K-AI, K-THEME |
| `tests/ui-v3-lint.test.mjs` (existing) | **8 / 8 pass** with the Kaksha files under `src/ui-v3` | the existing RS-1 lint now also covers Kaksha |
| rendered lint, `tests/prod/r4-kaksha-shots.mjs` | **0 findings over 48 page states** (8 states × 360 / 412 / 1366 × night / dawn; 606 text elements): 0 text < 14 px, 0 Devanagari < 16 px, 0 targets < 44 px, 0 contrast failures, 0 overflow, 0 page errors | Playwright Chromium on the dev page. The **first run found a real defect**: the Start label was 1.33 : 1 on plasma (a reset rule outranked the CTA colour). Fixed with `:where()` resets, then 0 |
| `tests/r4-kaksha-cohort.test.mjs` (K-P10) | **4 / 4 pass** | Outside the cohort, `?ui=kaksha` gives today's Home. Covers plain and hashed lists, the classic override and dev freedom |
| `node scripts/lint-ui.mjs --json` | **353 findings** (the baseline) with K-P7; 491 without | static scan over `src/` |
| `npx tsc -b`, `npx vite build` | pass | Kaksha lazy chunks: `views` 9.4 KB, `KakshaWorld` 2.3 KB, `KakshaHome` 0.7 KB JS gzip; CSS 4.9 KB gzip, loaded only when the flag is on. Spec budget ≤ 45 + 30 KB |
| `node scripts/check-prompt-budget.mjs` | PASS | unchanged (no prompt code touched) |
| `npm test` | see the end of this file | full suite on this stream's TEST branch |

**Shots:** `docs/design/round4/build/kaksha/shots/<state>-<theme>__<viewport>.webp`, covering Home (start, done,
resting), World (today, yesterday, empty, settlement) and Hangar.

## Not done or not met in K0, and why

- **Today's face is the r8 pack.** lamp1 stays behind its switch (5b), so the Home and World shots show r8 in the lit
  window.
- **K-P1** (the rig's clear colour follows the lit ground) is not needed yet. Kaksha draws the lit ground behind
  `<Teacher ground={false}>`.
- **The "Yesterday" world is a device snapshot,** rolled on the child's first World view of a day. The real secure
  date per skill is K-P5 (`secure_since`, main). Until then the settlement slots fall back to each skill's seed: stable
  for a given set, but a newly secured skill can shift slot order.
- **No real-phone performance** (K-O3). The proxy numbers are below.
- **Out of K0 scope** and waiting on merges, per the BUILD-SPEC §10.3 slices:
  - the Desk skin, Debrief, Briefing and in-play HUD (K1-K2);
  - the intake UI (K3);
  - the parent cards (K-P6).
- **Spec deviations:**
  - tokens are a scoped layer rather than a retune of v3 Night/Day, so the unrouted v3 screens and their tests stay
    intact;
  - one `catalog.json` instead of two files.

## `npm test` on this tree (2026-10-10, local container, this stream's TEST branch)

**Result:** 2,589 tests. **2,523 pass, 60 fail, 6 skipped.**

**All 60 failures are in one file,** `tests/engines-browser.test.mjs`. Each is the same error: the vite HMR websocket
is refused by the sandboxed frame's CSP (`connect-src 'none'`).

**They are environmental, not this change:**
- The same file fails **60 / 60 on the pre-K0 commit `34b1526a`** in this container.
- CI `gates` on the remote head without K0 (`adb399cc`) is **green**.
- The container's Playwright 1.63 expects `chromium_headless_shell-1243`, but the image ships 1194. I symlinked 1194
  into place so the browser tests can run at all; that leaves this one older-shell difference.
- K0 touches no frame, engine or vite-config file.

**Other checks:** `npx tsc -b` and `npx vite build` pass, and `check-prompt-budget` reports PASS.

## Performance: G35-class PROXY, not a phone (2026-10-10)

**Setup:** the dev fixture page at 360 × 800, DPR 2. Headless Chromium on SwiftShader (software WebGL) with CPU ×4
throttling. Each run takes 6 s of frames after a 2.5 s settle, n = 1 run per screen. Probe: `/tmp` script, method
recorded here.

| screen | frame interval p50 / p95 | JS inside rAF p50 / p95 | long tasks |
|---|---|---|---|
| Home, live face (r8) | 66.7-83.2 / 83.4 ms (about 12-15 fps) | 0.8 / 15 ms | 80-82 (max about 100 ms) |
| Home, still face (`face=plate`) | 16.7 / 16.7 ms (60 fps) | 0.1 / 1.1 ms | 0 |
| World, orbit | 16.7 / 16.8 ms | 0.2 / 1.3 ms | 0 |
| World, settlement | 16.7 / 16.7 ms | 0.1 / 1.3 ms | 0 |
| Hangar | 16.7 / 16.7 ms | 0.1 / 1.0 ms | 0 |

**Reading:**
- The Kaksha shell (starfield, orbit canvas, settlement SVG) stays inside the §7 budgets on this proxy. Starfield and
  orbit JS stay ≤ 1.3 ms p95, against budgets of ≤ 2 ms and ≤ 4 ms.
- **Home's drop is the live face rendered on software WebGL,** the same r8 runtime that today's Home mounts. It is
  stream 5's governor and tier logic, not the shell.
- On a real GPU the face's own governor applies. This proxy cannot judge that. The reference phone (K-O3) can.
