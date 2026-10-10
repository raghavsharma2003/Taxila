# Round 4 · stream 2 (live content and the Desk) · RESULTS

Branch `claude/r4-content` from `claude/blissful-mayer-icwe2j` @ `522dca6e`. Every number below is from adult-scripted
harnesses on this cloud container (4 cores, shared with my own background jobs; Azure models shared with production and
other sessions) or from pure code. **No child has used any of this.** Each number says where, n, method and date.

## 0. Status (living section)

| item | state |
|---|---|
| Day 0: box contract | **done** (`docs/design/round4/build/box-contract.json`, measured) |
| (1) one certificate gate | **done**: every producer gated, test fails on an ungated one; 0 uncertified mounts reachable |
| (2) Studio v2 off the child path | **done** (0 of 737 library pieces certified as themselves at all three sizes; the bridge keeps the W2 view) |
| (3) her line matches the board, ≥ 50 boards | **met on the battery**: 51 boards, 0 contradictions, 0 illegible at 360 (§3) |
| (4) interactive asks end in something to DO | **partly**: R2 1/6 → 3/6 strict, 5/6 counting a board drawn on her clause for animation / simulation; game-sst has no engine or play (§3) |
| (5) request → piece ≤ 3 s p90, n ≥ 20 | **not met**: p90 5.5 s (n = 22); engine pieces ride the turn response (§3) |
| (6) owner-5 slots that never became an artifact | **met**: owner-5 14/14 |
| (7) V3.3 at scale | simulation 93.0% right-artifact-ready, 0 stale or wrong reveals, 0 visible failures (n = 200 lessons, SIMULATION) |
| beat-by-beat board, notebook | built behind `TAXILA_BEAT_BOARD` (off); notebook saved per lesson (patch 01), replayable; plan card waits on 4A's session plan |
| Kaksha skin for the tray (audit items 1-5) + K-P12 | **built, inert without the skin** (§2a); 42 before / after shots, 0 failing |

## 2a. The tray under the Kaksha skin (2026-10-10)

Owner directive (via main): modern, futuristic, Gen-Alpha, not "too Indian". The skin is on only where the Kaksha shell
is (`data-skin="kaksha"` on the Desk, a `.kx` ancestor carrying `data-ktheme` night / dawn); the beige shell keeps
today's board, byte for byte (no skin attribute → every new rule is unmatched, `kakshaBoardSkin` returns null).

- **One palette source.** Nothing here defines a colour. The board reads Kaksha's resolved `--k-*` values at mount
  (`palette.ts kakshaBoardSkin`): ground `--k-deep`, edge `--k-line-2`, ink `--k-ink`, accent `--k-ion`, mark `--k-her`,
  good `--k-secure`, soft `--k-ink-3`, grid `--k-line`; mark `--k-look` (K: "look again", never red, never a verdict;
  `--k-her` is hers alone). `--k-move` is never used (Kaksha's one "your move" colour, on the Answer dock). Skeletons:
  Check is `--k-ink` with `--k-void` text; "picked" is a 2px `--k-ion` border on an ion wash over `--k-raise`, `--k-ink`
  text (no text on a solid ion fill). A theme or look switch (`data-ktheme` / `data-klook`) re-reads the tokens under the
  board; a module frame takes them at mount.
  The stage, skeletons and chips map the studio vars onto `--k-*` (`studio.css`); the sandboxed module frame gets the
  resolved values in its init (`host.tsx` → `protocol.ts`, which takes only `--k-*` names with short safe values →
  `bootstrap.tsx`) and maps its `--fx-*` onto them (`frame.css`). A test fails on any colour literal in a skin rule.
- **Type.** The board's hand font gives way to Kaksha's product face (`--k-sans`); numbers and fractions on the board
  are set in Geist Mono (`--k-mono`).
- **Ground.** chalk / paper / grid → one glass ground (`--k-deep` + a `--k-ion` glow edge); the grid keeps a faint
  `--k-line` grid. Young (dawn) gets the cool light variant from Kaksha's own dawn theme.
- **K-P12** (Kaksha's patch, applied): `DeskModel.intake`, QuestionCard `lead` slot, Desk `renderIntake`; nothing renders
  without a skin's `renderIntake`.
- **Measured** (`tests/prod/r4-content-skin-shots.mjs`, /dev/desk fixtures + product-build module frames, 360 × 800,
  412 × 915, 1366 × 768, both families, theme values from the dev mirror of Kaksha's `tokens.css` @ `a0da1109`, kept in
  `tests/fixtures/` only until Kaksha lands): board text worst contrast **7.68:1 night / 6.32:1 dawn** (floor 4.5, Kaksha
  bar 5); smallest board text 19.4 / 22.6 / 28.6 px (beat board) and 16.2 / 18.8 / 22.1 px (skeleton), unchanged by the
  skin; every module frame marked skinned. Shots: `shots/skin/` (`*-before.png` / `*-kaksha.png`).
- **Fixed on the way:** the place-value game ask built 345, not the kit's number (the Director sent `a:`; the engine
  reads `value`); now 45,236 for 5 places (test).
- **Settled with K** (2026-10-10): every pair above measured ≥ 5:1 by K in all six palettes (classic, holo, volt × night,
  dawn); this branch's test checks classic night and dawn from the mirror.

## 2b. UX fixes from the journey audit (stream 5, `claude/r4-asha` AUDIT.md), 2026-10-10

- **#10b "Say it, or tap" read as cut off** (A28, A44). The words were whole on screen; the line itself was a fragment,
  shown when there was nothing to tap. Now "Say your answer" when nothing is up, "Say it, or tap an answer" when tiles
  are. Separately the mode line clipped for real at 360 ("Use the numbers above", 152 px in 122): it now wraps. Probe
  `tests/prod/r4-content-dock-lines.mjs` (12 fixtures × 2 families × 360 / 412 / 1366): 0 clipped. Shots: `shots/ux/`.
- **#13 the child summary vs the parent's evidence** (A31 vs A40, A36). Two halves: (a) "You listened to Asha today"
  after 4 spoken answers: the server's lesson record holds only item and teach-back turns, so it came back empty; the
  Desk now shows the answers it saw (never ticked) and "You tried N questions" (`useDesk.ts`). (b) "On your own" vs
  "Right, with a hint": two sources for one claim (the Director's hint rung vs the engine row). Patch request **04** to
  `server/routes/lesson.js` makes the summary take `engineTick`, the parent page's own claim, whenever the turn has an
  engine row. Kaksha's summary leading with an unanswered prompt (B05) is K's.
- **#14 the chosen picture shown only after a reload** (A32 vs A33). Hello saved the picture but never re-read the
  shell's child record (Me did); now it does. The "Who is learning?" tiles read a page-level cache of their own and
  can still show the old picture until a reload (not measured); that file is not mine (`src/app/api.ts` `refreshMe`).

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

### 2.8 Which classes get typed input (asked by the main session for G2, 2026-10-10)
By design, not a gap: classes 1-4 are the Young family (`src/child/band.ts`: B1 classes 1-2, B2 classes 3-4); Young never
type words (`src/child/lesson/useDesk.ts`, PRODUCT-DESIGN §6.3.4): they answer by voice, tiles and the NumberPad (the
Type row opens `inputMode="numeric"` for them). Classes 5-9 (B3, B4) get the Type row. A parent's "move up one band"
setting (`effectiveBand`) makes a class-4 child Older, with typing. A harness that needs typed asks on a class-4 topic uses
a class-5 child or that setting. Unchanged on this branch.

## 3. Measured on this branch (local production build), before → after, and what is still short
Local production build of `f728cf4a` (`server/serve.mjs` + worker, `NODE_ENV=production`, own Neon branch, same env as the
baseline), headless Chromium, adult-scripted children, 2026-10-10 10:50-11:15 UTC, load average 0.4-0.9 (4 cores; Azure
models shared with production and other sessions). The two commits after it (`19202e6b`…`722d8d55`) fix the last board
lines below in code and tests; the batteries were not re-run on them.

| harness | base `522dca6e` | this branch |
|---|---|---|
| round3-forge R1 something real on stage | 10/12 | 12/12 |
| R2 interactive ask ends in something to DO | 1/6 (taxila.dev: 1/6) | 3/6 strict; 5/6 with a board drawn on her clause for the animation / simulation asks (brief item 4) |
| R3 boards with a meaning failure | 0 / 16 | 0 / 16 |
| R4 views passing the forge3 verdict | 34/36 | 35/36 (animation p360 Q1.legible) |
| owner-5-visual | 11/14 (2 slots never an artifact) | **14/14** |
| r4-content-boards (≥ 50) | not run | 51 boards, **0 contradictions, 0 illegible at 360**, notebook 9/9 lessons; 2 slots unfilled while she pointed (both lines now draw in tests, `722d8d55`) |
| round2-content | not run on base here | 38/39 (R 12/12 requests on stage; the miss: M "an item-bound mount in c6-maths-ch07-t01": only 2 of its 19 items bind an engine, 0 gate refusals in process) |
| request → piece (r4-content-speed, 360 phone, typed) | not run | p50 1.7 s, **p90 5.5 s** (n = 22: 5 play topics, 17 engine topics; 2 with no piece) |

### 3.1 After merging base `9920f21` (stream 5a + safety release) and the practice-beat rule
Local production build of `8e879a4a`, 2026-10-10 12:55-13:20 UTC, load average 0.6 → 4.9 (heavier than §3).
Gates on `8e879a4a`: tsc, vite clean; `npm test` 2,647 pass / 0 fail / 5 skipped; budget PASS; lint-ui 353 (new base 353).

| harness | before the practice-beat rule (`f728cf4a`) | merged tree (`8e879a4a`) |
|---|---|---|
| round3-play | 93/93 | 93/93 |
| round2-content | 38/39 | 36/39: R 12/12, board slots 18/18, 0 pointed-empty, 0 gate fails; 3 × M (an item-bound engine mount): the Director's posed path changed (a break, a worked-example path), no play piece at a practice beat in those lessons |
| owner-5-visual | 14/14 | 12/14: 11/12 requests; the miss is V3.child_draws (the board was drawn; her NEXT reply told the child to draw: the reply guard, stream 3) |
| round3-forge | 45/49 | 45/49 (R1 12/12, R2 3/6 strict / 5/6 with her-clause boards, R3 0 nonsense, R4 36/36; T1 API n = 1 at 3.97 s) |
| r4-content-boards | 51 boards, 0 contradictions, 0 illegible, 2 unfilled | 51 boards, **0 contradictions, 0 illegible**, 4 unfilled (3 of the 4 lines draw in tests, `009c179c`; the 4th states a sub-region count, "3/5 wale hissa mein 9 boxes", which W10 is not loosened for) |
| request → piece | p90 5.5 s (n = 22) | p90 4.4 s (n = 22, loaded); new pieces only p50 3.2 s (n = 14) |

### 3.2 The merge bar: base vs branch, same seed, one tree at a time, production routing (2026-10-10 15:45-16:15 UTC)
Base `39c88fe` and branch `e0872290` (that base merged), each served alone on the same port, own Neon branch,
`--env-file=.env.local --env-file=tests/prod/prod-routing.env` (production's classifier, prefetch, hedge, ack), seed 4242,
every battery started at load1 < 2. The board battery is this branch's harness for both arms (the same yardstick).

| harness | base `39c88fe` | branch `e0872290` |
|---|---|---|
| round3-play | 93/93 | 93/93 |
| round2-content | 25/30 (requests 11/12, board slots 8/9, 2 failed while she pointed, M 2/3) | **38/39** (12/12, 18/18, 0, M 3/3; the miss: piece p90 3.5 s at n = 2) |
| owner-5-visual | 10/14 (9/12 requests: 3 slots never an artifact) | **14/14** |
| round3-forge | 39/46: R1 11/12, R2 1/6, R4 35/36 views | **45/49**: R1 12/12, R2 3/6 (5/6 counting her-clause boards for animation / simulation), R4 36/36; T1 API n = 1 at 3.0 s |
| r4-content-boards | 50 boards, 1 contradiction (W5), 5 unfilled while she pointed (notebook route absent on base) | **51 boards, 0 contradictions, 0 illegible, 1 unfilled**, notebook saved and replayable |

Gates on `e0872290`: tsc, vite clean; budget PASS; lint-ui 353 (= base); persona-invariants 105/105; `npm test` 2,705 pass /
0 fail / 6 skipped. Read with §3.1: round2-content M and owner-5 V3.child_draws were run-to-run variance (both pass on the
branch here, on the same seed).

Still short, and why:
- **(5) speed.** An engine piece arrives in the turn response, so its time is the turn's (3.0 / 4.7 / 5.5 s tails); 7 of
  the 22 asks found an engine already up from an earlier turn (≈ 15 ms; the harness now reports those apart). The early
  piece on the Studio stream (`{t:"slot", early}`) covers Studio pieces only. Closing it needs the engine's open task sent
  before the reply is written (a Director / Desk path outside this stream's files: a proposal for the main session).
- **(4) game asks on topics with no engine and no play level** (game-sst c6-sst-ch01, science): they end on a board drawn
  on her clause; logged by the main session as open-r4-science-sst-engines. 2 of the 5 play topics gave no piece (play is
  admitted only for the lesson's CURRENT skill, round 3 adversarial B1; stream 1's).
- The plan card and "of N" beat progress wait on stream 4A's session plan.
- A test account from the boards battery could not be deleted: the product's safeguarding guard holds it (my Neon branch
  only; recorded by the harness).

## 4. Owner decisions needed
None yet.
