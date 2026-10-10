# Stream K · Kaksha: RESULTS

**Branch:** `claude/r4-app-design` (stream K runs on the U1 branch, per the main session's 2026-10-10 GO).
**Spec:** `docs/design/round4/app/BUILD-SPEC.md`. **Decisions:** `dc-r4-app-kaksha`, `dc-r4-kaksha-k-o-answers`.
**Updated:** 2026-10-10.

**Honesty:** no child has used any of this. Every performance number below is a **G35-class proxy**: headless
Chromium with CPU ×4 throttling at 360 × 800, DPR 2. None was measured on a phone (K-O3 is open).

## K2: the Briefing and the Hangar colours on Antariksh (flag `ui.kaksha`, owner cohort only)

**Built against G1's `claude/r4-games-core` (`78b7a86b`) as a read-only reference.** G1 merges after stream 2. Every
change to G1's files is a patch request: K-P3 and K-P4, see `patches/APPLY.md`.

| piece | where | what it does |
|---|---|---|
| seam (K-P3) | `src/play/briefing.ts` (on this branch) + `03-play-briefing-seam.diff` (G1's renderer and session) | Covered below. |
| Briefing | `src/ui-v3/kaksha/play/{Briefing.tsx,recipe.ts,play.kaksha.css}` | Covered below. |
| Hangar colours (K-P4) | `src/ui-v3/kaksha/play/cosmetics.ts` + `04-antariksh-cosmetics.diff` | The equipped hull and trail become two colours on the dress, from the Kaksha palette. An item counts only if it is **open now** (a matching secure skill), so a stale device choice never shows. Antariksh tints its craft: hull, flame and exhaust puffs. Colour only: replayed acts are byte-identical with and without. |
| frame | `src/ui-v3/kaksha/lesson/KakshaLesson.tsx` | Provides the Briefing and the colours (from the map it already reads once at lesson start). |
| play HUD | no pip; see "Not done in K2" below | |

**The seam (K-P3):**
- An optional card in front of a real-game engine.
- It shows only when the engine will really mount: not on a 2D-tier device, not under the server's 2D switch, and only for a law an engine renders.
- The model's dress is fetched **while the card is up** and handed to `PlaySession`, so there is no second fetch, and the look the card names is the look that plays.

**The Briefing:**
- **Title:** the engine (Antariksh), then the story wrapper and mode in mono ("Beacon rescue · number line").
- **Recipe lines** (`recipe.ts`), each read from the level or the dress and mapped to fixed words in `copy.ts`. Missing data drops the line rather than being guessed. The lines:
  - "Built from today's lesson";
  - "Checks: …", the level's own mal-rules in plain words, never "your mistake";
  - the line params ("Fractions in 3 parts, on a line from 0 to 2");
  - "Look: red planet · pace: steady", shown **only once the model's dress has answered**.
- **Launch:** hold to launch is a 650 ms fill, and releasing drains it. Enter or Space launches at once. The warp is 950 ms of streaks with a flash, drawn as one path per frame at DPR 1, then the card goes. Reduced motion: a press launches, with a 200 ms fade.

**Numbers (2026-10-10):**

| check | result | method |
|---|---|---|
| `tests/r4-kaksha-play.test.mjs` | **7 / 7** | Covered below. |
| `tests/prod/r4-kaksha-briefing.mjs` (on G1 + K-P3/K-P4, a **production build** of the dev page) | **0 findings over 6 pages** (class 4 / 6 / 7 × phone box 328 × 460 and laptop box 736 × 460); HOLD-1, KEY-1, TRUTH-1, WARP-1 pass | The real `PlayStudioRenderer` and Antariksh, with the play API answered in the page (a level from the real generator, the base dress, then a "model" dress after 600 ms). SwiftShader, 3D forced as G1's cert harness does. |
| REPLAY-1 | **byte-identical** acts with the Hangar colours off and on | Same presses (steer right ×3, Fire); 2 posts, 3 acts. |
| FRAME-1, launch → the engine's first painted frame | Briefing **1,229 / 1,341 ms** p50 / p90 vs **the engine alone 1,200 / 1,345 ms** (n = 12 each, interleaved) | CPU ×4, SwiftShader, 360 × 800 DPR 2: a **G35-class proxy, not a phone**. "The engine alone" means level → first frame with no Briefing. |
| `npx tsc -b`; `npx vite build`; `lint-ui` | pass; pass; **353** (baseline) | The lazy `KakshaLesson` chunk with the Briefing is **4.5 KB JS + 3.1 KB CSS gzip** (K1 alone: 2.1 + 2.6). |

What `r4-kaksha-play.test.mjs` checks:
- every recipe line comes from data, and unknown mal-rules are dropped;
- no look line before the dress is final;
- only open Hangar items tint the engine;
- the Briefing has no clock race, score or lock words;
- the K-P3 diff gates on a real engine mount, fetches the dress once, and never touches acts, tokens or grades;
- the K-P4 diff only sets colours and touches no law, generator or server file.

**Shots:** `shots-k2/c<class>-{briefing,briefing-hold,warp,engine}__{phone,laptop}.webp`: the card, the hold fill, the warp, and the engine wearing the model's dress with the equipped hull and trail.

**The spec's 1,200 ms bar is not met, and the Briefing is not the reason.** On this proxy the engine alone takes 1,200 ms at p50 and 1,345 ms at p90 from the level to its first frame. The Briefing adds nothing measurable on top (+29 ms p50, −4 ms p90, inside the run's spread). The warp hides the mount, and the reduced-motion path was the fastest in an earlier run (1,191 ms p50).

Earlier measurements on the dev server's unbundled modules read about 1,440 ms. That is why the bar is measured on a production build.

The real fix is G1's: the engine could compile its stage while the card is up (for example a `prewarm()` that builds the three.js renderer and compiles the materials offscreen). I'm proposing it to main, not doing it, because it is G1's code.

**Not done in K2, and why:**
- **The in-play HUD pip** (§3.4). In the Desk, play is embedded and her SpeechRow (face plus caption) already sits above the play box, so a pip inside the box would be a second face on screen (§5 rule 1, one face at a time). The pip belongs to a full-screen play mode, which the product doesn't have today.
- **A "next tile" (Khand) on the Briefing.** The spec allows it only when the plan already holds it, and no plan field carries it yet.
- **Khand.** G2's engine isn't on G1's branch, so the Briefing's Khand words are written and tested in `recipe.ts`, but no Khand shot exists.
- **The "board" and "rim" Hangar items** don't reach a surface yet. The hull and trail do.

## K1: the Desk skin and the Debrief (flag `ui.kaksha`, owner cohort only)

**Built:**

| piece | where | what it does |
|---|---|---|
| K-P2 (patch request, stream 2's files) | `src/child/lesson/Desk.tsx`, `LessonScreen.tsx`; diff `patches/02-desk-skin-debrief.diff` | The Desk takes an optional `skin` (written as `data-skin`), puts `data-zone` on its zones, and takes an optional `renderSummary`. LessonScreen mounts the lazy `KakshaLesson` frame only when `ui.kaksha` is on AND the server marks the account in the cohort (K-P10). **Flag off: the Desk renders with no skin and the Summary, unchanged, and no Kaksha code loads.** |
| frame | `src/ui-v3/kaksha/lesson/KakshaLesson.tsx` | `.v3.kx` themed by band family. Reads the child's map **once** at lesson start: the "before" half of the Debrief diff. No per-turn work, no timer, no rAF. |
| skin | `src/ui-v3/kaksha/lesson/desk.kaksha.css` | CSS only. Re-points the Desk's own tokens at the Kaksha palette and dresses the zones: chamfered glass panels, the comms frame on the lit warm ground with corner ticks and a kesar rim while she speaks, a mission board with a 32 px grid, the phase line as a segment bar, Space Grotesk. The lamp stays on the Answer dock alone, now plasma (its tokens are re-pointed on `.dk-dock` only, so L-LAMP passes). A wrong answer is look-again violet. Changes no zone size, layout row, element or behaviour. |
| Debrief | `src/ui-v3/kaksha/lesson/{Debrief.tsx,debrief.ts}` | Covered below. |
| dev page | `src/ui-v3/kaksha/dev/desk.{html,tsx}` | Covered below. Never shipped. |

**The Debrief:**
- **What you did:** the Summary's own cards, with a mint tick when the verified-key classifier said so.
- **Now secure:** the ledger read through `/api/child/map`, before vs now. A skill counts only if it was not secure at the start and is secure now.
  - A failed, empty or private read claims nothing; unknown is never shown as "none".
  - The empty-read guard exists because `getChildMap` answers a failed read with an empty map, which would have made every secure skill look new.
- **Opened:** the structure and the Hangar item, from the World's own function.
- **Her closing line:** her last caption, shown only when it is a statement. A lesson the child ended early stops on her open question; the live shots caught this and it is fixed.
- **Kept from the Summary:** Finish (disabled while the lesson is still saving) and the Young "Show your parents?" view. All the Summary's test ids are kept.
- **No points, score or minutes.** Her name always carries "AI teacher".

**The dev page:** the real Desk fed `DeskDev`'s fixture models, plus `?live=1`. The live mode runs the real LessonRuntime on the scripted Director, with the skin on or off, for the client-latency check.

**Numbers (2026-10-10, merged tree with base `38431ab`):**

| check | result | method |
|---|---|---|
| `tests/r4-kaksha-desk.test.mjs` | **7 / 7** | Covered below. |
| rendered lint + safety, `tests/prod/r4-kaksha-desk-shots.mjs` | **0 findings over 81 pages** (9 states × class 4 / 6 / 7 × 360 / 412 / 1366; 1,434 text elements) | Same in-page lint as K0. Plus HELP-1 (Pause visible, enabled, ≥ 44 px and on screen in every lesson state), HELP-2 (the Pause sheet prints 1098 and 14416 on screen with no scroll), AI-1, LAMP-1 (lamp on the dock only, only at YOUR TURN), SKIN-1, TRUTH-1. The first run found real defects; each was fixed, then 0 (covered below). |
| `node scripts/lint-ui.mjs` | **353** (baseline) | The first draft was 354: the lamp tokens were re-pointed on the Desk root. They are now set on `.dk-dock` itself. |
| `npm test` (merged tree, base `39c88fe`, migration 025 applied to this stream's branch DB) | 2,684 tests: **2,618 pass, 60 fail, 6 skipped** | All 60 failures are `engines-browser.test.mjs`, the known container-only vite HMR vs frame CSP failure (K0 section) |
| `npx tsc -b`, `npx vite build` | pass | The `KakshaLesson` chunk is **2.1 KB JS + 2.6 KB CSS gzip**, lazy, and loads only with the flag on. |
| live-lesson check, through the r4-timeline driver | classes 4, 6 and 7, owner cohort, real models | The skin and Debrief render on a real lesson: `data-skin="kaksha"`, the Debrief with "AI teacher", and no "Now secure" for a child with nothing newly secure. |

What `r4-kaksha-desk.test.mjs` checks:
- the Now-secure truth, including a 300-map property test (0 false "secure");
- unknown-is-not-none;
- no clock, randomness, loop or network call in the frame or the Debrief;
- the Summary's test ids are kept and "AI teacher" is printed;
- the skin CSS uses tokens only, is scoped to the skin, hides nothing, keeps the lamp on the dock only, and has no font under 14 px;
- the K-P2 wiring, including the flag-off path.

What the first rendered run found, each fixed before the 0:
- the Send key at 1.06 : 1 contrast, because a skin rule outranked it;
- a 13 px word inside the mic disc (the Desk's own size; the skin sets 14 px);
- a hit-area measure that ignored the Desk's `::after` 48 dp extension on "Wait" (the harness now counts it);
- the dock's mode line truncated in mono on class 4 (now Space Grotesk);
- secondary buttons chamfered so their borders broke (now plain).

**Shots:**
- `shots-k1/c<class>-<state>__<viewport>.webp`: the real Desk with fixture models, at 360 × 800 and 1366 × 768. The states are speaking, your turn, tiles, look-again board, pad, Pause, Debrief, Debrief with a newly secure skill, and tried-only.
- `shots-k1-live/`: a live lesson, Pause and the Debrief for class 4, 6 and 7 on phone and laptop, from the local production build.

**Latency: the Desk adds no measurable latency to the turn.** Two measurements:

1. **Live models (as asked).** The r4-timeline driver ran a local production build on real Azure models and this stream's Neon TEST branch, with the fixed 750 ms fake ASR and a synthetic child clip (not a child). **Turn prefetch was OFF** (`TAXILA_TURN_PREFETCH=off`, the r4-timeline preload's default; production runs it ON), and model routing came from that preload rather than `tests/prod/prod-routing.env`, which landed later. Arms were interleaved by round, n = 12 turns each, `docs/design/round4/build/kaksha/latency-k1.json`:

| arm | end of speech → POST leaves, p50 / p90 ms | POST duration p50 / p90 | end → her reply's sound p50 / p90 |
|---|---|---|---|
| Kaksha, puppet | 1,988 / 4,061 | 2,535 / 3,482 | 4,974 / 8,295 |
| classic, puppet | 2,000 / 3,944 | 2,311 / 2,669 | 4,909 / 6,920 |
| Kaksha, still face | 2,185 / 3,868 | 1,991 / 2,714 | 5,012 / 6,652 |
| classic, still face | 1,374 / 3,618 | 2,451 / 3,897 | 4,424 / 8,089 |

   **This run cannot resolve a skin effect.** End → POST is bimodal in every arm: the POST leaves 10-35 ms after the final transcript, or is held 1-5 s. The hold is the turn-taking deciding, and it follows the conversation (the same turn index lands in the same range in every arm), not the skin. The lessons diverge in content, so n = 12 per arm gives intervals wider than any plausible skin effect. The 811 ms gap in the still-face medians is that spread: the classic-still arm happened to land 6 of its 12 turns on the immediate path. The POST's own duration is server time, which the skin cannot touch.

2. **Deterministic client check (what the skin could actually cost).** The real LessonRuntime ran on the Desk dev page's scripted Director, so every arm sees the same lesson. Timed on the page clock: the child's answer sent → the turn call leaves the client, and the answer lands → the next frame is painted. Setup: 360 × 800, DPR 2, CPU ×4 throttled, SwiftShader (a **G35-class proxy, not a phone**). Arms were interleaved, n = 30 each, paired by turn position, `latency-k1-client.json`:

| comparison | send → turn call: Kaksha − classic | answer → painted: Kaksha − classic |
|---|---|---|
| still face | **+1.4 ms** mean, 95% CI ± 12.6 (p50 128 vs 122 ms) | +17.7 ± 26.5 ms |
| puppet | **+13 ms** mean, 95% CI ± 47 (p50 530 vs 430 ms; p90 1,104 vs 1,097) | −4.6 ± 24.0 ms |

   Every interval includes 0. On this proxy the skin's effect on the turn is under about 15 ms with the still face and under about 60 ms with the puppet. The puppet arms are noisy because the live face competes for the throttled main thread. **No real-phone number yet (K-O3).**

**Not done in K1, and why:**
- **The caption's current word in kesar** (§3.3). It needs word timings from the runtime's reveal (`stagecraft/reveal.ts`, not K's), so the phrase-level caption stays as today.
- **The checkpoint chip and the beat segment bar.** They need stream 2's `checkpoint` card kind and beat plan in the Desk model. Neither is on base or in `shared/contracts.ts`. The phase line is styled as the segment bar in the meantime.
- **The "Tomorrow" re-check line and the session minutes.** Neither is in `DeskModel.summary`. They need a plan / summary field, which would be a patch request when wanted.
- **"Now secure" is the v1 client diff.** K-P5 (`secure_since` on `/api/child/map`, main) would make it a server fact. §11.4 (20 scripted sessions with real delayed checks) is not run yet; it needs a TEST-branch clock harness.

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
