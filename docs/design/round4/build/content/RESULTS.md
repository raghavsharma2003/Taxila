# Round 4 · stream 2 (live content and the Desk) · RESULTS

Branch `claude/r4-content` from `claude/blissful-mayer-icwe2j` @ `522dca6e`. Every number below is from adult-scripted
harnesses on this cloud container (4 cores, shared with my own background jobs; Azure models shared with production and
other sessions) or from pure code. **No child has used any of this.** Each number says where, n, method and date.

## 0. Status (living section)

| item | state |
|---|---|
| Day 0: box contract | **done** (`docs/design/round4/build/box-contract.json`, measured) |
| (1) one certificate gate | **built + tested** (in-process); batteries on a local production build pending |
| (2) Studio v2 off the child path | **done in code** (0 of 737 library pieces certified as themselves at all three sizes) |
| (3) her line matches the board, ≥ 50 boards | harness written (`tests/prod/r4-content-boards.mjs`); claims board built; run pending |
| (4) interactive asks end in something to DO; "half ka half" | `fraction-of@1` built; play/engine coverage gaps named below |
| (5) request → piece ≤ 3 s p90, n ≥ 20 | early piece on the Studio stream built; harness written (`tests/prod/r4-content-speed.mjs`); run pending |
| (6) owner-5 slots that never became an artifact | claims board built (her line's own screen claims drawn and gated); run pending |
| (7) V3.3 at scale | not started |
| beat-by-beat board, notebook | not started (after 1-7) |

## 1. Baseline (the untouched base `522dca6e`, re-run first)

| gate / harness | result | where, method, date |
|---|---|---|
| `npx tsc -b` | clean | this container, 2026-10-10 |
| `npx vite build` | clean | this container, 2026-10-10 |
| `npm test` | 2,505 pass / 64 fail / 6 skipped of 2,575 | git worktree of `522dca6e`, own Neon branch, 37 min. 60 of the 64 are `engines-browser` scenarios failing on Chromium 141's CSP notice wording for the dev server's HMR socket ("Refused to connect to 'ws://…'"), which the test's dev-noise filter did not know (fixed on this branch); 1 `module-tray-geometry` and 3 `w2b-whiteboard-browser` "frame was detached" (pass in isolation on this branch: load-related, re-checked in the full run). The container's Playwright 1.63 expects `chromium_headless_shell-1243`; only 1194 is installed, so 1243 is a symlink to 1194 (container setup, nothing committed). |
| `check-prompt-budget` | PASS, worst + note 1,696 / 2,600 | 2026-10-10 |
| `lint-ui --json` | 353 findings (the baseline) | 2026-10-10 |
| `round3-forge` | R1 10/12, R2 1/6, R2b 3/18, R3 0 nonsense / 16 boards, R4 34/36 views, R5 3 grounds, T1 p50 674 / p90 2,877 ms (n = 2), T2 −700 / −700 ms (n = 8) | local production build of `522dca6e` (`server/serve.mjs` + worker, `NODE_ENV=production`, own Neon branch, `DEPLOY_CLASSIFY=grok-4-1-fast-non-reasoning`, `TAXILA_CLASSIFY_HEDGE_MS=1500`), headless Chromium, 2026-10-10 09:05-09:11 UTC |
| `owner-5-visual` | 11/14 checks; requests on stage 10/12 (2 × "a Studio slot was opened but never became an artifact") | same build, 2026-10-10 |

Why the base fails where it does (server log of that run): 5 board slots ended `failed` because every rung's board failed
the gate against her line, 3 of them on W10 (her line claims "5 barabar parts, 3 shaded" / "3 groups of 5" on the screen
and the board does not draw it); interactive asks: play admits only the lesson's CURRENT skill (round 3 adversarial fix B1)
and c7-science-ch01, c5-maths-ch01, c4-maths-ch05 cover one skill each, c6-maths-ch06, c6-science-ch01, c6-sst-ch01 none.

## 2. What is built (this branch)

### 2.1 Day 0 · the stage box contract
`tests/prod/r4-content-box-contract.mjs` opens `/dev/desk` with two new fixtures (`work-studio`, `work-play`) at the three
sizes, both bands, and writes the `[data-testid=studio-stage]` boxes (`--write` refuses to shrink a box; `--check` fails
when a box shrank). Measured 2026-10-10 (n = 12 boxes): Older tray 328×404 / 380×519 / 752×408 (identical to round 3's live
taxila.dev measurement), Young 328×380 / 380×495 / 752×408; play mode Older 328×532 / 380×647 / 752×552, Young 328×484 /
380×599 / 752×552.

### 2.2 (1) ONE certificate gate (`server/forge3/tray-gate.js`)
- `certifyForTray(artifact, ctx)` and `certifyModule(plan, ctx)` decide every pixel in the tray at the device's viewport
  class, BEFORE reveal: whiteboard (the client's own `boardFit` + camera, imported from `src/studio`, at the device's box:
  smallest word ≥ 14 px), Studio v2 (certified as itself at all three sizes), play (the play certificate; never judged = not
  shown, round 3 allowed it), skeleton (`certs/skeleton.json`), frame (a live verdict; else its certified skeleton), image
  and anything unknown (refused), module engines (`certs/modules.json` per engine, mode and band; `explainer@1` by its script).
- Wired at every producer: `seam.js` (slotFor's three returns, the slot snapshot, statusFacts' proposals, every board on
  the stream: board-first, kept, board-sync, template fallback; the subscribe replay), `seam-bridge.js` (a Stagecraft reveal
  is gated before its piece exists), `modules.js` (`mountable`, the explainer@1 mount, the G1 fill mount), `live.js` (play),
  `board-first.js` (a board the device cannot show is never preselected: her line is written from it).
- The Desk reports its work-tray box (`POST /api/studio/viewport`; `src/child/lesson/trayBox.ts` = the same `solveDesk`);
  class = the box's width class against the contract; a short tray is `tight` (boards are judged at the real box); unknown
  = the 360 phone.
- `tests/r4-content-tray-gate.test.mjs` (16 tests): scans `server/**` and `shared/**` for every producer of a tray artifact
  or mount and fails on an unregistered one; checks the gate sits before the reveal in source order; each kind's rule; each
  path end to end in process (skeleton slot held then revealed when the box grows; a piece on screen retired when the box
  stops being certified; an illegible board never reaches the slot or the wire; a module mount refused then mounted;
  play refused when never judged). Mutation check: switching the board gate or the play gate off makes it fail.

### 2.3 Certificates for engines and skeletons (`server/forge3/certify-tray.js`)
Rendered offline in Chromium at the contract boxes, judged by the forge3 checks (plus a new frame overlap check Q3 and a
side-edge rule for Q2), samples from the real distribution (engines: `planEngine` over every kit item in the Director's
modes, filtered by `validModes` + `engineConfigError` like `mountable`; skeletons: `seam.candidateIntents` over every kit,
which only ever proposes fraction archetypes: 36 of 830 topics). A cell passes at a size only when every sample passes.

Engine legibility at the phone tray, smoke runs (n = 2 samples per (engine, mode, band), contract boxes, 2026-10-10):

| | 360 | notes |
|---|---|---|
| before (base frame fit, floor 0.75) | 0 of 15 engines with every cell passing | 18 px words scaled to 13.5 px, 54 px keys to 40 px; SVG tick labels 10-13 px |
| after | every sampled cell passes at all three sizes | fit floor per engine (never below 14/16 px words or 44 px targets; scroll instead), SVG words grown to the floor at the SVG's real width with crowded labels thinned (`svgText.ts`), place-value / data-graphs / skeleton text sizes raised |

The full certification (8 samples per engine cell, 10 per skeleton cell) is running; its tables are what the gate reads.

### 2.4 (2) Studio v2 off the child path
The round 3 certificate passed 295 library games and 342 explainers at the 360 phone only because the stage showed their
BOARD TWIN there (a 1000-unit world's 38-unit labels in a 324 px box = 12.3 px). The tray gate now requires the piece
itself at all three sizes (`studioV2Certified` / `studioV2PlayableAt`): of the 737 catalogue pieces, 0 qualify (pure code
over the 385 class 4-7 topics, 2026-10-10), so the Stagecraft bridge keeps the W2 view and counts the refusal
(`host.gateRefusals`; `tests/stagecraft.test.mjs` "seam bridge"). The catalogue itself still LISTS by round 3's rule (key
verification and coverage read it; `ship5-review-stagecraft-key` stays green): listing is not showing. A Studio v2 world
comes back only when it is relaid for the phone and certified as itself.

### 2.5 (3, 6) Boards that match her line; slots that never fill
- `server/stagecraft/claims-board.js`: when no other board passes against her line, the board that draws exactly her line's
  own screen claims ("5 barabar parts; 3 shaded", "3 equal groups, with 5 dots in each", "har group mein 4") from the code
  templates, re-gated with the full gate (W0-W13), result hidden when her line asks for it. The three base-run failing lines
  now get a passing, legible board (`tests/r4-content-claims-board.test.mjs`).
- More claims her line makes, each from a measured failed slot on a local production run of this branch (2026-10-10): a
  grid ("5 columns aur 3 rows", or "15 equal parts, unmein 6 marked": `shade-grid@1`, a new code-only template; the grid is
  one claim for W10, where before "3 rows mein" read as 3 equal parts and "3 rows mein hai: total 15" as 3 groups of 15),
  and a flow she lists over the screen ("Flow mein dekhiye: Observe, Ask, Predict, Test, phir Conclude. Pehla step kya
  hai?": `flow@1`, the step she asks for written "?"; W12 treats a "?" box as revealing nothing). Her line naming shaded
  cells without a count draws nothing (a grid with none shaded would contradict her).
- A board refused ONLY for writing the answer to her question (W9) keeps its picture with that answer written "?" and is
  re-gated in full (`maskReveals`, up to 3 passes); 4 of 6 refused boards on the first branch run were W9-only.
- `tests/prod/r4-content-boards.mjs`: the ≥ 50-board battery (meaning W10-W13 and gate W0-W9 re-checked independently
  against her line, legibility at the reported 360 box, unfilled slots she pointed at).

### 2.6 (4) "half ka half"
`fraction-of@1` (`server/forge/explainer/templates.js`): a/b of c/d as the class 6-7 area model, drawn step by step while she
speaks (the whole; c of d columns; a of b rows inside them; the product), picked by `codePick` from numerals ("3/5 of 2/3",
"1/2 × 1/4") or words ("half ka half", "aadhe ka aadha", "half of a quarter"); passes the gate against her line and the tray
gate at all three sizes, both bands (`tests/r4-content-explainers.test.mjs`).

### 2.7 (5) Request → piece
A certified piece composed for the child's own interactive ask goes to her stage on the Studio stream at once
(`{t:"slot"}`), before her reply is written; the Desk shows it until the turn lands (which carries the same slot, or a
`{t:"retract"}` follows). Kill switch `TAXILA_EARLY_PIECE=0`. `round3-forge` now also times the piece from what the page
shows (T1dom); `tests/prod/r4-content-speed.mjs` runs ≥ 20 asks.

## 3. Not met yet, and why
To be filled from the batteries on the local production build of this branch.

## 4. Owner decisions needed
None yet.
