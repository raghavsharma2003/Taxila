# Games: status (newest first)

Per `docs/patches/to-brain/029-report-by-push.md`: Games reports here and in its commit messages, not by message.

## 2026-11-16, a computed default for every family's picks; the day is still the session (branch `claude/r8-picks-default`, from `8bbabd1d6`)

**Done (`NAMING_OFF` untouched; nothing the child sees changed, so no re-cert):** main's ruling 2 of "the per-session reading".
- **The rule** (`server/play/levels.js`): a pick whose blind chance on a level is p is named on the k-th sighting, k the smallest (at least 2) with P(k or more of 4) < 1/10 (`defaultSightings`; 4 for 1/2 and 1/3, 3 for 1/4 to 1/7, 2 from 1/8 down, never above about 0.56). Every pick (oneDecision goals, chancePicks) now goes through it (`namingSpec`); `chanceRepeat` (stambh/tally, kon/place, kon/name) overrides. Every pick is named only on the session's first four levels. Each remembered sighting carries its level's k, and the server asks for the most any sighted level calls for.
- **p, from the level:** `blindChance` replays each of the pick's options through the family's own grade and takes the share that shows the mix-up. The options are the family's list where it gives one (new optional `FamilyLogic.pickOptions`: strips' three buttons, the lab's three predictions); otherwise they are read from the family's acts for that level (where `malActs` first parts from the solve: the mix-up's act, what the solve and every other mal-rule do there, the act with the solve's value). That read is a floor on the options, so k is never below the true default. A pick that cannot be read is taken at 1/2.
- **What changed: 78 (family/mode, goal:mal-rule) pairs, all from 2 sightings:** 75 now need 4, and 3 need 3 or 4 depending on the level (`chhaano/geela` namak clear-pure and salt-gone, `parkar/drop` alt median: 3 options on some levels, 4 on others). The 8 proved pairs keep their own k. Per pair, the worst day (four levels mixed from the pair's p values) is at most 1 in 16.
- **Asserted centrally** in `tests/r8-picks-default.test.mjs`: 16,970 generated levels (every coverage entry × fades 1–3 × 2 seeds × each focus), 10,960 (level, pick) checks. `tests/r8-play-laws.test.mjs`'s law-3 case now expects four sightings.
- **The day (ruling 3): not done, a gap.** The play ledger cannot give it in one query. No table holds a level count per child per mode, and an unnamed sighting is stored only in the signed session token (its row leaves without `chanceMis`). `kt_evidence` holds only folded home rows (`home:<child>:<day>`), with no mode and no picks. Each of the three packets now says this in one line. **What it would take:** one migration (a number from main), e.g. `play_day (child_id, day, family_mode, levels int, chance jsonb, primary key (child_id, day, family_mode))`, where day is IST (`kt/ledger.js dayOf`, the codebase's day). `/api/play/act` would upsert it at each level end, and `/start` and `/next` would read it into the body's `n` and `chance` with one keyed select, through `playDeps.q`. A failed read would fall back to the session, so the tests still pass with an empty `DATABASE_URL`.

**Next:** the judges' verdicts on the three tables; then the laws-audit list.

**Questions for main:**
1. **1/7.** Your ruling says "2 only from one in seven down", but the rule itself gives 3 at 1/7: two or more of four is 241/2401 = 0.1004, just over the line. 2 starts at 1/8 (0.079). I followed the rule. Is that right?
2. **Exact option lists.** Most families read 2 or 3 options from their own acts, so they need 4 sightings. A pick that is truly among four or more (`galti-pakdo` lines, `nazariya/tri` apex cells, `naksha` steps, the tool strips) would need only 3 (or 2) once its family gives `pickOptions`. Should I add those family by family, or leave the floor (rarer naming, never over the line)?
3. **The day table.** Do you want the migration above now (allot a number), or keep the session until real sittings exist?

## 2026-11-16, gate 2 read per session: stambh/tally, kon/place, kon/name (on `claude/r7-games`: `6fc3d0cee` tally, `87c7bbe3d` place, `2817ad776` name, plus this entry; Hindi key words `09f7c8369` before them)

**Done (naming is still off, `NAMING_OFF` untouched):** law 3's line read per session, as ruled (`RULINGS-2026-11-15.md`, "To Games, 2026-11-16").
- **The number of levels.** Nothing in how a session serves levels bounds it (`/api/play/next` always serves; each act re-signs the token), so the server sets it: `NAMING_LEVELS = 4` (`server/play/levels.js`). A pick with a gate-2 spec (`chanceRepeat`) is named only on the session's first four levels (the body's `n`); later levels grade right or wrong and name no such pick. Every figure below is over those four, computed exactly (`tests/_session-figure.mjs`; surfaces left out, so upper bounds).
- **stambh/tally read:** main's way (b). Three sightings whose bundles and loose lines differ two by two, or two when one is a **firm** row, where no single slip, read any way, gives the mix-up's number (`firmSighting`, `oneSlipFromMixup`; rows 20, 22, 30, 33, 35, 36, 40, 41, 44, 45, 47, checked against the proof's own slip table). One-slip child: 67/256 → **13/256 (1 in 19.7)**. Blind guesser: 1 in 1,689. (a) would be 1 in 114, but it never names a child whose rows were all weak, and every fade-1 row is weak. keep is unchanged.
- **kon/place:** named from one level, 1 − (1 − p)⁴ was over for vertex-off (1 in 3.1: a drop that misses), wrong-scale in measure (1 in 2.9: a typing slip at a reading the law names at, 1 in 10) and in draw (1 in 9.4: a blind dot). All four mix-ups are now picks (chance weight, `chanceMis`): vertex-off, centre-on-arm and wrong-scale are named on a second level that differs (draw: another asked size), join-wrong-end on its fourth. Now: vertex-off 1 in 21.9, centre-on-arm 1 in 499, wrong-scale 1 in 19.1 (measure) and 1 in 227 (draw), join 1 in 16. centre-on-arm was under from one level (1 in 13.9), but the cap holds only picks, and at six levels it passes 1 in 10, so it is a pick too. The moments and the play-out are unchanged; `placed=off` still reaches the teacher.
- **kon/name:** on the second occurrence, say was 1 in 7.6 and find 1 in 5.5 (still over at three levels). Now named on the **third**: say 1 in 61.7, find and both together 1 in 36.8.
- Packets: each "Gate 2: evidence" has the per-session column, the n and the arithmetic, and the lines that said otherwise are corrected. No rendering changed and no served level changed, so no re-cert.

**Next:** the judge on the three tables; then the laws-audit list.

**Questions for main:**
1. `NAMING_LEVELS = 4` is the bound I set; nothing measured says how many levels a sitting holds. Four keeps join-wrong-end at its existing four (four of four) and lets tally use (b). At five, (b) is 1 in 9.7 (over) and the join would need five of five. Accept four?
2. The cap applies only to picks with a gate-2 spec (these three modes). Other families' picks (the shared "one prior on another surface" rule, e.g. `kon/ends`, `aakash`, `chhaano`) are not yet read per session. Many are one pick among two to five (1 in 2 to 1 in 5 a level), and a second sighting over four levels is then over the line. Do them family by family, or put a default spec (three sightings) on every pick now?
3. The figure is per session; a child can start a new session (`/api/play/start`) and the count starts again. Is per session the unit you want, or per child per day?
4. join-wrong-end is now named only when all four of a session's first four levels are draw levels with it. In practice that is rare. The drawn ruler line (a constructed act, gate 1 again) remains the way to make it nameable.

## 2026-11-16, gate 2 for kon/name: say and find each name on the second occurrence, faint solves, Wapas (branch `claude/r8-gate2-name`, from `db0ac72d1`)

**Done (this push; naming is still off, `NAMING_OFF` untouched):** the evidence rule for kon/name, worked out and asserted over every generated level (621 say, 1,280 find) in the new `tests/r8-games-kon-name-gate2.test.mjs`. The packet's "Gate 2: evidence" holds the tables and answers the five "kept for gate 2" items.
- **say names nothing from one name.** Three random taps give a vertex-first or vertex-last name 1 in 6 at worst (4 of 24 orders of three different letters; 4 of 64 if a letter may be tapped again), on every level. One tap on another letter never makes it (0 of 18); a swap of two neighbouring taps always does (the mix-up's own act). `say:vertex-name` is now a chance pick: `chanceMis` at chance weight, nothing in rows, trail, seam or facts (say's facts no longer carry `vertex_ok` / `arms_ok`). Named on the second occurrence: 1/6 × 1/6 = 1 in 36.
- **find**: one tap among five arcs, the mix-up's arc 1 in 5 blind; the worst blind rule (a fixed arc, a size rank, a corner) 0.180 of levels; a pair 1 in 25 (1 in 31 for the worst rule; 1 in 30 for one say name and one find tap). Two sightings are enough for both goals (no `chanceRepeat` entry).
- **Surface in two parts** (`nameSurface`: the figure, the letters): a second sighting counts only when both differ.
- **Faint solves** (new `FamilyLogic.faintSolve`, read by `gradeLevel`): the first fade-1 level with O at the asked angle's vertex, and every find level with no mix-up arc (the wide key and the outside vertex angle; 608 of 1,280), solve at CHANCE_WEIGHT with no `discriminates`.
- **Wapas** takes back what she sees, not the check: the miss stays the level's first decision in the grade and the trail (it always did), and now the on-screen count keeps it too (`commits` survives an undo in kon/name; a wrong tap, Wapas, the right tap now ends "jaanch: 2" with the pale tick, not "jaanch: 1" with a full tick). This is a small screen change on that path only.
- Re-certified `--only kon/name`: every sample passing at every size; the sampled levels are unchanged, only the stamp moved (order restored to the base file). Coverage rebuilt, `--check` ok.

**Next:** carry on with the laws-audit list.

**Questions for main:**
1. Switch naming on for kon/name?
2. "A right first tap on a wide level counts for less": every find tap is already at CHANCE_WEIGHT, the learner model's lowest step for a game. The wide level's right tap now carries no `discriminates` and names nothing, but weighs the same 0.25 in the model. A lower weight needs a new temper in `kt/bktr.js` (for example the leak halving, applied when the screen can be read for the key). Want it?
3. The Wapas count change (above) is a screen change on one path. Look at it, or take it on the test?

## 2026-11-16, gate 2 for kon/place: nothing from one join press, the tolerance that names vertex-off (branch `claude/r8-gate2-place`, from `5571e35df`)

**Done (this push; naming is still off, `NAMING_OFF` untouched):** the evidence rule for kon/place, worked out and asserted over every generated level (178 measure, 179 draw) in the new `tests/r8-games-kon-place-gate2.test.mjs`. The packet's "Gate 2: evidence" holds the tables.
- **join-wrong-end: nothing from one press.** The law no longer writes `sign=join-wrong-end` into the facts. One press leaves only an ordinary miss at chance weight (no mix-up, no `chanceMis`, nothing in the facts row, seam or trail), with naming on as well as off. A pair is still 1 in 4 (one of two buttons), so the server names it on the **fourth** sighting: four different asked sizes and both join orders among them. (1/2)^4 = 1 in 16, and a habit of pressing one place never qualifies. New `FamilyLogic.chanceRepeat` (`shared/play.ts`); `levels.js` `repeatMet` (the shared rule unchanged with no spec); kon/place draw's surface in two parts (`drawSurface`: the asked size, the join order); the session keeps the last six picks (was four).
- **vertex-off's tolerance: 10 units** (`VO_BAND`, was the 11 of a placement). The base along an arm within ±3°, the centre within 10 of the bottom-edge pose: 14 to 34 units from O, within 24.6° of the normal. A blind placement gives 1 in 8,905 (board) or 1 in 2,835 (near O); one nudge or turn from any placement gives 0 (12 < 14). A drop that misses gives 1 in 10.8 at worst (r = 30); at 11 it was 1 in 9.3. centre-on-arm unchanged: blind 1 in 390 at worst, slips 0.
- **wrong-scale:** blind 1 in 36. One typing slip on the pad (the view's keys, six columns) gives 1 in 14 at worst (155). Ticks and dot nudges give 0. Measure key 140 is refused (1 in 9: "40", "41"). The law names no wrong-scale at a placed reading over the line (16, 140, 141, 159, 164 to 166; `SCALE_SLIP_READS`).
- size names nothing (one pick of three).
- Re-certified `--only kon/place`: 16 samples, every size passing. The sampled levels are unchanged (fade 1), so only the stamp moved. Coverage rebuilt, `--check` ok.

**Next:** gate 2 for kon/name.

**Question for main:** switch naming on for kon/place? Two points are not decided here:
1. A finger slip onto the other join button makes join-wrong-end every time. With tally's "slip on every level" convention, no number of repeats gets under 1 in 10. The four-sightings rule assumes mis-presses on two 48 px buttons are rare. To close it without that assumption, the join could become a drawn ruler line (a constructed act that names from one level), which changes the screen and needs gate 1 again.
2. As for tally: is the line per pair or per session?

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
