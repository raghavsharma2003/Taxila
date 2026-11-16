# Games: status (newest first)

Per `docs/patches/to-brain/029-report-by-push.md`: Games reports here and in its commit messages, not by message.

## 2026-11-16, gate 2 for stambh/tally: the evidence rule, proved (branch `claude/r8-gate2-tally`, from `1b0d3317a`)

**Done (this push; naming is still off, `NAMING_OFF` untouched):** the slip list is gone and the ruled evidence rule is in (`RULINGS-2026-11-11-night.md`, stambh/tally "For gate 2").
- **keep names from one level.** Over all 269 generated keep levels the mix-up's totals need 3 or more ordinary slips (counting and typing on the pad; any other way of reading counts one step). A blind guess gives "counted" 1 in 10,000 or less and "five" 1 in 32,768 or less. One slip in every row, read the worst way, gives them at most 1 in 16.
- **read names only on two levels whose bundles and loose lines both differ.** One level can be one slip from the mix-up's number (1 in 4 at worst: 17, 19, 23, 25, 29, 31, 37, 43 and 49), so it is a pick at chance weight (`chancePicks: ["read"]`, `chanceMis`; nothing in the facts, seam or trail). The worst of 350 servable pairs is 17 then 23 with the loose lines dropped: 1/4 × 1/4 = 1 in 16. A blind guess on both is 1 in 10,000.
- `tallySurface` gives read two parts (bundles, loose lines). The server's `surfaceOf` keeps parts, and the new `surfacesDiffer` counts a repeat only when every part differs. kon's one-key surfaces compare as before. `FamilyLogic.surfaceOf` may return parts (`shared/play.ts`, type only).
- **The level law:** kept no row with loose lines equal to bundles (a way of reading, which repeats) and keep's bundles in two rows with a row of two. Dropped from read: three bundles or more, never five, a loose line. Read now also serves 20, 25–30, 35, 40 and 45 at fades 2 and 3.
- Tests: the tables are computed in `tests/r8-games-stambh-tally.test.mjs` (gate 2, keep / read / surface / the server's repeat rule with naming on and as served). The packet's "Gate 2: evidence" holds both tables and their arithmetic.
- Re-certified `--only stambh/tally`: 16 samples, every size passing. The sampled levels are unchanged, so only the stamp moved.

**Next:** gate 2 for kon/place (nothing reaches the teacher from one join press; the tolerance that names vertex-off), then kon/name.

**Question for main:** switch naming on for stambh/tally (remove it from `NAMING_OFF`)? The packet's "Gate 2: evidence" is the table to read. Also: is the 1 in 10 line per pair (as ruled, 1 in 16 at worst) or per session? Three read levels at the worst rows give 5 in 32 that some two land.

## 2026-11-16, Design's patch 002 and the 3D focus colour (branch `claude/r7-games`)

**Done (this push):** the 3D selection takes the focus colour, and Design's patch 002 is finished.
- `ArtTokens.you` is the action hue only and is no longer a painter role. 108 canvas uses moved to `focus`, so the screens are unchanged. `laws.mjs` fails any canvas use of "you" as law 1, over every served level.
- Action colour outside the green family in every art. kagaz takes Design's marigold #EFA52E with ink #1C1A16. chalk, blueprint and raat take magenta #FF6FD8 with ink #0F1218, because Design's README keeps lime there and the rulings put it outside green.
- Measured magenta: contrast on the ground 5.5 to 7.9; deuteranopia distance ≥ 0.336 from focus, answer and mix-up in every dark art. Rejected candidates and their numbers are in `context/inbox/r8-focus-action.json`.
- kagaz and raat hold Design's four values (focus, answer, mix-up, action), asserted in `laws.mjs` `tokenBreaks` and `tests/r8-play-roles.test.mjs`.
- Play chrome: `--pl-you` takes the art's action hue (it was #C2F542 lime) and `--pl-focus` is new. The `[data-tx]` block from patch 002 section 4 is in.
- 3D engines (yantra kit and scene, khand, antariksh): selection rings, cursors and her value's label read focus through `styles.ts` `lawColor`, so one token moves the 2D painter and the engines together.
- Shots for main: `docs/design/round8/games-judging/focus-action/` (README lists them).
- Not re-certified: certs check layout and laws, not colour values, and no served level has a canvas "you" left. The laws test runs the new rule over every served level.

**Earlier on 2026-11-15 to 16 (merged):** #133, #134 and #135, as follows.
- kon/place, stambh/tally and kon/name pass gate 1 and are shown with naming off.
- Laws-audit rows: kaal, kaapi, koshtak, kram, feeta, aankde/tally typed totals and the seven science families' miss lines.
- Reduced-motion play-out at stage time 0 in 11 views.
- Laws run in hinglish, en and hi.
- The no-game list: three topics out.

**Next:** gate 2 for the three modes shown with naming off, stambh/tally first. That means the proof table in each packet and an assertion over every generated level (`RULINGS-2026-11-11-night.md`).

## Questions for main

1. **Hindi key words.** For badlaav, jaanch, rang, aakash and yantra/roshni, the hidden key-word lists that law 2 checks have no Hindi-script entries. So the hi laws run catches numbers and `IDEA_WORDS`, but not a word key (e.g. "laal" written in Devanagari). Shall I add them? Unless you say otherwise I'll do it after gate 2's stambh/tally.
2. **Theme B's action colour.** `src/styles/tx-tokens.css` `--tx-move` (Design's file) is still lime. The play chrome overrides it to raat's magenta under `[data-tx="b"]`. Should Design move its token too, so the lesson and the games agree?
