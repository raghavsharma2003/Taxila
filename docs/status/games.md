# Games: status (newest first)

Per `docs/patches/to-brain/029-report-by-push.md`: Games reports here and in its commit messages, not by message.

gate 2 battery passes: stambh/tally (sha: <placeholder>)
gate 2 battery passes: kon/place (sha: <placeholder>)
gate 2 battery passes: kon/name (sha: <placeholder>)

## 2026-11-16, gate 2: a sighting counts only on a discriminating level (branch `claude/r8-gate2-discrim`, from `e608271c9` + `origin/int/r6`)

**Done (`dc-r8-gate2-discriminating-level`, `RULINGS-2026-11-16-gate2-answers.md`; `NAMING_OFF` untouched; before a miss nothing a child sees changes except which levels are served; every battery assertion is real, no todo):**
- **Answer 4, the level mix (kon/place measure, draw).** No acute angle had ever been served: centred, its vertex sat too near the side for the protractor, and the generator refused every one. A figure that does not fit centred is now moved across. From a session's fourth level, while it lacks an acute angle or one opening anticlockwise, the level supplies it (`placeNeeds`). Asserted over every served session in the battery test.
- **Answer 1, vertex-off.** Her sighting carries the level's base direction and her offset in the protractor's frame. A second one counts only on a level 45° or more away with the same frame offset (so another board offset) (`discriminatingPair`). After a first sighting the session is steered there (`basesOf` → `GenRequest.bases`; fade 1 may tilt for it). New child: the finger held on the board where the bottom edge sat on her first level: named 0.
- **Answer 2, kon/name say.** A level where every reading across puts the vertex in the middle (`readsAcrossAll`) is served (its solve is faint; its play-out clear of the lit sector). It is found directly after a first sighting (the angle inside the triangle, ≥ 100°, facing a diagonal). `say:vertex-name` is named only with a sighting on such a level among them, then on the second; H3 confirms each.
- **Answer 3.** The battery also asserts the worst door sequence pooled over fades, and lists any cell ≥ 0.5 of a child with no randomness (none, in any mode, full sweep).
- **Q1 wording:** 2 sightings start at 1/8 (one test comment said otherwise).
- **Served levels changed** (gate-sweep sessions of the battery): kon/place about two levels in three (careful child 518/768 measure, 464/768 draw; distinct levels 35 → 49 and 42 → 53); kon/name say only after a first sighting (holder 505/768; careful and slip children unchanged); find, tally none. **Re-certified** kon/place (4480 samples) and kon/name (4484): all pass at every size; base sample and pieces order restored (4 first levels of kon/place and 1 focus level of kon/name differ).
- **Worst child who does not hold the mix-up (full sweep), worst fade before → after; worst door now:** measure 0.006 → 0.005, door 0.011; draw 0.021 → **0.075** ("last time's right dot", wrong-scale, fade 3), door 0.050; say 0 → 0.007, door 0.008; find 0.005 → 0.005, door 0.008; tally read 0.013 → 0.013, door 0.008; keep 0.
- **Holders (full sweep):** **vertex-off 0.92 measure, 0.93 draw (were 0.46, 0.43)**; say any order 0.58 (was 0.23); vertex first/last 1.00; find first letter 0.50; other scale 1.00; smaller 0.92; outer 0.96/0.98; always A 0.60; **"always the larger number" 0.06, "always the inner scale" 0 (both goals): now tested, not named**; tally as before.
- **Mix-ups with no discriminating level (main's reverse-if): none.** Every one has a level that tells it apart; centre-on-arm is not mapped by the coverage.
- **Tests run (each on its own; not the full gate, not the browser suites, not `r8-games-kon-layout`):** the three battery files (gate sweep and `HABIT_FULL=1`: 8, 5.4 and 2.8 min), `r8-games-kon-place{,-gate2}`, `r8-games-kon-name{,-gate2,-view}`, `r7-games-kon`, `r7-games-kon-angles`, `r4-games-core-kon`, `r8-games-stambh-tally`, `r7-games-stambh`, `r8-picks-default`, `r8-play-laws`, `r8-naming-off`, `play-evidence`, `r8-play-{trail,pick,adapt,follow,phone-seam}`, `cert-item-hash`, `r7-games-cert-twin`, `play-server`, `r4-games-core-server`, `r4-khand-server`, `r7-audit-beliefs`, `r7-games-friend-fill`, `round3-integration`, `test-isolation`; `tsc -b`, `vite build`, prompt budget, `build-coverage --check`, `context.mjs --check`.

**Next:** H5 (the facts row), H7 (every generated level), the per-day count; one judge per mode.

**Questions for main:**
1. **The inner-scale and larger-number holders are tested now and named 0 and 0.06.** The picker's steer toward wrong-scale goes to levels opening clockwise, because only there is a solve evidence on the scale (judging round 2). On those levels the inner reading is right. Steer wrong-scale, after a sighting on an anticlockwise level, to another anticlockwise one too?
2. **Base direction.** I took it as the protractor's base line as the solver lays it. An angle opening the other way has the same one (OA reversed, the protractor lies the same), so the mix does not give question 1 its 45°: tilt does, and a steered fade-1 level may tilt up to 50°. Accept the tilt at fade 1 after a sighting?
3. **say's discriminating levels are faint solves** (a reader across gives the right name there). Accept?
4. **draw's worst non-holder rose to 0.075** ("last time's right dot", fade 3): the new acute levels give that habit sightings. Under the line; watch it, or add a rule?
5. `tests/r8-games-kon-layout.test.mjs` (browser) was not run: acute and tilted place levels are new to it.

## 2026-11-16, gate 2 H1, H3, H4: the habit battery passes on all three modes (branch `claude/r8-gate2-habits`, from `claude/r7-games` `3731cca54`)

**Done (`NAMING_OFF` untouched; nothing a child sees changes; no served level or drawing changed, so no re-cert):** H1, H3 and H4 of `RULINGS-2026-11-16-gate2.md`, one commit each. Every battery `todo` is now a hard assertion. Each negative control still runs every time: the battery's `legacy` runs the same children under the old rules (`shared/play.ts` `HABIT_RULES`, a test seam, off inside one synchronous run) and still finds them named.
- **H1, two sightings are two different acts.** New `FamilyLogic.sightingOf` gives what she did at the sighting as a value. The grade carries it as `chanceAct` on the pick's row, the session remembers it, and `nameOnRepeat` counts only sightings whose value differs from every earlier one. The value never leaves the play server.
  - tally read: the number she typed.
  - kon/place measure: the surface is the key on both scales (`measureSurface`), and the value is the typed number.
  - draw wrong-scale: the rim mark she dotted.
  - vertex-off and centre-on-arm: the protractor centre's offset from the vertex on the board, offsets within `tolPx` being one act.
  - join-wrong-end: no value. It is a pick between two buttons, and its spec already needs both orders.
- **H3** (kon/name say): an order act is a sighting only when her next name, after the play-out, again puts the vertex at an end (`confirmSay`). Unconfirmed, the row keeps its outcome and weight and loses `chanceMis`. **Nothing shown changes.** After a miss the level already waits for her next name, so it does not ask again.
- **H4** (tally keep): `five` is a pick (new `FamilyLogic.chanceAt`, read by the grade and by the server's `chancePick` for trail, seam and trace). It is named on a second keep level with other counts and other totals. `counted` still names from one level. `five` no longer puts `mal`/`sign` in her facts from one level (teacher-side only).
- **Battery additions:**
  - the same drop every level with a 4 px wobble (place). Under the old rules: 0.97 measure, 0.92 draw.
  - say's holders name it their way again after the play-out, and the blind guessers guess again (`again`).
  - a tally test showing `five` is named from the first level under the old rules and never under H4.
- **Worst child who does not hold the mix-up, worst fade, before → after.**

| Goal | Gate sweep | Full sweep |
|---|---|---|
| tally read | 0.172 → 0 | 0.234 → 0.013 |
| keep | 0 → 0 | 0 → 0 |
| measure | 0.938 (0.974 with a wobble) → 0.016 | 0.967 → 0.006 |
| draw | 0.891 (0.911) → 0.026 | 0.920 → 0.021 |
| say | 1.000 → 0 | 1.000 → 0 |
| find | 0 → 0 | 0.005 → 0.005 |

  Full-sweep run times: 102 s, 77 s, 79 s. The tables are in each packet's "Gate 2 battery".
- **Holders (full sweep):**
  - tally read 0.80 (half her levels: 0.32);
  - keep 1.00 each (`five` from the second keep level);
  - measure other scale, smaller and outer 1.00;
  - **vertex-off 0.46 measure, 0.43 draw (were 1.00);**
  - draw always A 0.45;
  - say vertex first and last 1.00, **any order 0.23 (was 0.58)**;
  - find first letter 0.50.
- **Tests run (each file on its own):**
  - the three battery files, gate sweep and `HABIT_FULL=1`;
  - `r8-games-{stambh-tally,kon-place,kon-place-gate2,kon-name,kon-name-gate2}`, `r7-games-{kon,stambh}`, `r4-games-core-kon`, `r7-games-kon-angles`;
  - `r8-picks-default`, `r8-play-laws`, `r8-naming-off`, `play-evidence`;
  - `r8-play-{trail,pick,adapt,follow,phone-seam}`, `r7-games-friend-fill`, `round3-integration`, `test-isolation`;
  - `tsc -b`, the prompt budget, `build-coverage --check`, `context.mjs --check`.
  - Not the full gate.

**Next:** H5 (the facts row), H7 (the full sweep of every generated level), and the count per child per day; then one judge per mode on "is a child missing from the battery?".

**Questions for main:**
1. **The placement frame (your open question 1): I took the board.** In the protractor's frame the holder repeats one value and is never named. On the board, offsets within `tolPx` (11, a finger's drop) are one act, so a drop habit with a finger's wobble is caught. The cost is that the vertex-off holder is named only when two of her levels' arms lie more than about 27° apart. Fade 1 tilts lie within 10°, so she is seldom named there: 0.46 and 0.43 overall. A smaller tolerance would name her more often, and would also let a wobbling drop habit through. Keep `tolPx`?
2. **Say's three sightings under H3.** Confirmation makes a blind child about 1 in 36 a level. At two sightings, "any order" would be named 0.57 (not 0.23), with every non-holder still under 0.011 in the gate sweep. I left it at three. Lower it to two?
3. **find and H1.** I gave find no act value: it passes without one, and an arc index means nothing across figures. Is "a different pressed target" meant for find too (for example, the arc's place on the screen)?
4. **A child who repeats her slip on the name after the play-out** (the same swap twice on one level) is named, as H3 intends: by her acts she cannot be told from the belief. Accept?

## 2026-11-16, gate 2 H2: the habit battery, the negative control (branch `claude/r8-habit-battery`, from `cbd958e59` + `origin/int/r6`)

**Done (no naming rule changed; `NAMING_OFF` untouched; nothing a child sees changes):** H2 of `RULINGS-2026-11-16-gate2.md`.
- **The tool** `tests/_habit-children.mjs`: whole sessions through the real path as served (`currentLevel` → her acts → `gradeActs` → `nameOnRepeat(lessonEvidence)` → `afterLevelBody` → `nextBody`), naming forced on inside the tool only (the grade skips `withNaming`). Cells: every fade × pL (none, 0.3, 0.6, 0.9) × all 8 door sequences, the session's four levels. After a miss she does the solve. The children are the ruling's list for each goal; the holders are listed with why (the kit's own signs). For each child and mix-up it returns the share of sessions named, over all sessions, at the worst fade, and in the worst cell.
- **Tests:** `tests/r8-habit-battery-{stambh-tally,kon-place,kon-name}.test.mjs`. The "every non-holder child under 1 in 10 at every fade" assertion is `todo` where it fails today: tally read, place measure and draw, name say. tally keep and name find pass and are asserted. Separate tests always run and assert that the known failures show, that holders are reported, and that the generator memo changes no served session. Gate sweep: 11–18 s a file. `HABIT_FULL=1`: about 1–3 min a file. `HABIT_PRINT=<file>` writes the table.
- **Reproduced:** tally "16 every time" (1.0 in single cells, 0.13 at fade 1) and "what I typed last time" (0.17). kon/place: a key served twice. About 65% of measure sessions repeat a key within four levels, and every naming of a constant number or a fixed pad slip was a second sighting on the same key. "75 every level" is 0.5 at fade 2. kon/name: the same swap 1.0, the missed tap added last 1.0, reading across 1.0.
- **Full sweep (`HABIT_FULL=1`: 10 sessions a cell, 30 for random children, 4 for each constant over every pL; 1.6 min, 55 s and 1.2 min):** the same verdicts. tally: "what I typed last time" 0.23, "16 every time" 0.19, both at fade 1. measure: "first key one row low" 0.22 at fade 2 (the judge's 0.19). The gate sweep shows only 0.06 for it, so it shows there only in single cells. Constants 48–62 and 68–77 are named. say: one random slip 0.15, constant taps 021 0.29.
- **Not reproduced as the judge had it:** The judge's tally 0.95 at fade 2 came from a model that typed n−1 as the miss, so the picker was not steered. Through the real path the figure is lower, but it is still over the line. keep's "| only" is named 1.0, but it is the kit's second sign, so it is listed as a holder.
- **New:** the same drop every level, the finger 16–32 board px up or up-right of the vertex, is named vertex-off 0.94 (measure) and 0.89 (draw). Nearly every served level opens clockwise, so that offset is where vertex-off's band lies. One random slip a level in say (swaps and missed taps among the slips): 0.15. Constant taps 012/210 in say: 0.5.

**Next:** H1, H3, H4, H5, H7 and the per-day count, each turning its todo into an assertion; then "gate 2 battery passes: <mode>".

**Questions for main:**
1. **A fixed drop (kon/place).** A finger always 20 px above the vertex is named vertex-off in nearly every session. Is she a holder (on these levels it is the bottom edge on the vertex) or a slip habit H1 must stop? For a placement, what is "a different value" under H1: the offset on the board, or the offset in the protractor's own frame? In the protractor's frame, the true holder would also repeat one value and never be named.
2. **Reading across (say).** The generator never serves a say level where reading across puts the vertex in the middle, so this child gives the mix-up's name on every level. No rule that reads only her acts can tell her from vertex-first. Only H3 (the same level, after the play-out) can. Is H3 the route?
3. **The statistic.** The tests assert on the worst fade, pooled over pL, doors and seeds (64 sessions, 192 for a random child). A single cell holds 1–6 sessions, which is too few for a random child, so the worst cell is reported but not asserted. Is that the reading of "at every fade and door" you want?
4. **Holders the served levels never test.** Measure and draw serve almost only obtuse angles that open clockwise, so "always the larger number" and "always the inner scale" are never named. find's last-letter reader is never named either: the law names only the first-letter pick. Are both acceptable?

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
