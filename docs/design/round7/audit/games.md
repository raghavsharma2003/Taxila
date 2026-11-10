# Audit: games (area 5), 2026-11-10

Branch `claude/r7-audit-games`, started from `int/r6` (merged again at integration 21b, which added the `jaanch` family and the arena rebuild). **Audit only: no product code was changed.** Scripts are in `docs/design/round7/audit/games-scripts/`.

Not reported again (already fixed by the Games stream): the arena builder cutting a numbered list to key "1", number tiles on yes/no questions, a raw `{friendF}` in `server/forge/g2/levels.js`. The served-text script below would catch any of the three coming back; it finds none.

## Short answer

The game logic is in good shape. Across **9,270 served levels** (515 coverage entries, 31 families, fades 1 to 3, both doors) the right answer was accepted every time, no level could be won before any act, and no mal-rule's acts won a level that claims to tell that belief apart. The 2,907-challenge arena bank, the Forge G2 level expansion, the served text and a 360 px sweep came back clean. What is left is thinner than a defect list usually is: four beliefs the game can never detect, one unreachable variant, a handful of levels a child can win by guessing, two dead routes and one empty file, and one level the 360 px QA never saw.

## Findings

Seven findings: 0 P0, 0 P1, 3 P2, 4 P3. By kind: 1 broken, 2 inconsistent, 2 not good enough, 2 no longer needed.

| id | sev | kind | owner | title | where | fix | status |
|---|---|---|---|---|---|---|---|
| GAMES-01 | P2 | broken | games | Four kit misconceptions are mapped to a mal-rule that no level can tell apart, so a child holding that belief is never flagged | `server/play/tools/rules/todo-jodo.mjs:24`, `kyun-lab.mjs:16`, `stambh.mjs:18`, `stambh.mjs:19`; `data/play/coverage.json` misMap of those entries | Build a level that discriminates each one (the picker already prefers one), or take the belief out of the entry's `misMap` so the coverage counts (358 mapped beliefs) stop promising it | open |
| GAMES-02 | P2 | inconsistent | games | Two coverage entries share one key, so the second ("any apex" cloth, obtuse triangles) can never be served | `server/play/tools/rules/nazariya.mjs:41-42`; key built at `server/play/levels.js:43-44`; the variant is read at `src/play/families/nazariya/tri.logic.ts:240,253` | Give the second a goal id of its own (for example `match-any`) or put the grammar in `entryKey`. Then `entryByKey` finds it and the cert table gets a second row | open |
| GAMES-03 | P2 | not good enough | games | Single-pick levels where a random first tap is "correct" 22 to 41 % of the time, and the evidence row says `correct` | `src/play/families/galti-pakdo/galti.logic.ts` (pakdo), `hissa/hissa.logic.ts` (pour part, fit, deci; grid shift), `nazariya/tri.logic.ts` (more), `kon/kon.logic.ts` (zone kind), and every arena level (16 % overall) | Make the guessable goals need a second decision before the level can grade `correct` (a "why" pick, or a second card), or weight their evidence by the chance rate. Arena already enters at 0.25 | open |
| GAMES-04 | P3 | no longer needed | games | `GET /api/play/world`, `/admit` and `/builds` have no caller in the app; a solved Khand build is written to `play_build` and nothing ever shows it | `server/play/routes.js:156,168,179`; `server/play/builds.js` (`saveBuild`, `listBuilds`); `db/migrations/026_r4khand_play_build.sql` | Either build the gallery the comment promises ("a gallery, not a tally") or stop the write and drop the three routes. `/world` is already inside the `/start` reply | open |
| GAMES-05 | P3 | no longer needed | games | `server/routes/modules.js` is an empty route table ("filled by its workstream") that `server/index.js` still imports and spreads | `server/routes/modules.js:1-2`; `server/index.js:9,46` | Delete the file and its two lines in `server/index.js` (platform's file: send as a patch) | open |
| GAMES-06 | P3 | inconsistent | games | The forge3 play cert has no sample at all for `c5-english-ch09-t01` (vakya), though coverage serves it: that level was never judged at 360 px | `server/forge3/certs/play.json` (no sample with that topic; 6 of 7 vakya topics present); coverage entry `c5-english-ch09-t01\|vakya/rail\|build` | Re-run `server/forge3/play-cert.js --only vakya` (nothing paid; needs the harness build) | open |
| GAMES-07 | P3 | not good enough | games | At 360 px that same level's two-line hint ("Dibbe line par kheencho; ⟳ dabakar roop badlo") touches the bottom edge of the yard card; at 412 px it is one line and clear | `src/play/families/vakya/vakya.view.ts` (yard card and hint layout); screenshot `games-scripts/shots/vakya-c5-360.png` | Reserve the hint's height below the yard (the yard grows to two rows of wagons on this level) | open |

### Evidence notes

**GAMES-01.** `focus-discriminates.mjs` serves each entry with the Director's `focus` set to each mapped belief, over every skill the entry admits, fades 1 to 3 and 3 seeds. A belief counts as reachable if any of those levels lists it in `proof.discriminates`. Four never do: `c5-maths-ch02-t03` strips/equal `more-pieces-more`; `c7-science-ch10-t01` fair-test `light-only` (kit m3); `c6-maths-ch04-t02` stambh/picto `key-ignored` (kit `ignore-key`); `c6-maths-ch04-t03` stambh/bars `scale-as-one` (kit `count-units`). For three of them `malActs` returns nothing on every level, so there is not even a wrong-belief act sequence to replay. The promise in `server/play/start.js` ("the next level tests exactly that belief") cannot be kept for these four. (A fifth that looked the same, vakya `question-order`, is not a finding: it is served when the lesson names skill s5, and my first run had only used the entry's default skill.) A further 27 belief/entry pairs miss on some fade or seed only; that is the picker serving its best candidate and is not reported.

**GAMES-02.** `coverage.json` has two entries for `c6-maths-ch06-t03|nazariya/tri|match`, grammars `{}` and `{"any":true}`. Every session route resolves the level through `entryByKey(s.key)` (`routes.js:79,91,130,147`) and takes the first match, so `{"any":true}` is dead. Reproduced: `entryByKey(entryKey(second))` returns the entry with grammar `{}`. The generator does honour the flag (`tri.logic.ts:253` puts the apex anywhere along the base), so the content exists and is simply unreachable. It is the only duplicate key in 515 entries.

**GAMES-03.** From `play-family.mjs`: for each served level, 200 random act lists drawn from the solver's own act shapes with random arguments (a number from the level or any whole number on the board), then `grade`. First-try-correct by luck: galti-pakdo `pakdo` 41 %, hissa/pour `part` 30 %, nazariya/tri `more` 26 %, kon/zone `kind` 26 %, hissa/pour `fit` 25 % and `deci` 24 %, hissa/grid `shift` 22 %; arena 16 % across 202 entries. This is a generous model of random tapping (it already knows which act kinds matter), so it is an upper bound. A wrong tap does lower the evidence (the same lists graded `incorrect` or `partial` when a miss came first), so the harm is the lucky first tap, not retries. Each of these is a one-decision level; the families with several-step levels (todo-jodo, parkar, rang, bhaap, aakash, badlaav, chhaano, vakya, jaanch) were 0 to 0.1 % by luck. Wins that need random acts to land in order are rare.

**GAMES-04.** No `fetch` of these three paths in `src/`, `server/` or `scripts/`; the only callers are `tests/prod/*` and design docs. The Director's admission uses `hasPlay` directly (`server/studio/seam.js:608`), not `/admit`. `buildOf` runs on every solved Nazariya level (`routes.js` act handler) and inserts a row that `listBuilds` alone reads, and `listBuilds` is called only by the unused route. Parked or retired is the owner's call (Khand is in-scope for the games stream); I have not deleted anything.

**GAMES-05.** `server/index.js:9` imports `routes as modules`; `:46` spreads it into `register`. The table is `{}`. Nothing else reads the file.

**GAMES-06 / 07.** `server/forge3/certs/play.json` was built 2026-11-09 and is otherwise complete: 105 pieces, 4,320 samples (1,632 arena), and zero 360 px or 412 px failures, no text under 14 px (16 px for classes 4 to 5). The one coverage entry with no sample is the c5 vakya topic. I mounted it in the play dev harness with the bank items the server attaches (`shot-vakya-c5.mjs`). Level: "Galti dhoondo: 'My mother is teacher in a school.'", seven wagons in the yard in two rows.

## What I checked and found clean

| check | script | result |
|---|---|---|
| right answer accepted, server grade `solved` | `play-family.mjs` | 9,270 levels, 0 rejected, 0 "goal met but not solved" |
| nothing won before an act; a bare `done / run / check / commit / fire / weigh` at the start does not win | `play-family.mjs` | 0 |
| a mal-rule's acts do not reach the goal on a level that claims to tell that belief apart | `play-family.mjs`, `focus-discriminates.mjs` | 0 (30 hits in nishana/compare are levels with `discriminates: []` or a belief the level only lists in `targets`, by design) |
| random tapping | `play-family.mjs` | table below |
| extreme numbers in the server's replay (1e9, 2^53, 1e300, negatives, -0, 0.5) | `fuzz-acts.mjs` | 11,528 requests through `gradeActs`: 0 throws, none over 150 ms. Extreme values that still win are clamped fills (a layer past the plot edge) or an index the law ignores for that goal (badlaav `ghol`'s `at`) |
| arena bank against its own law | `arena-bank.mjs` | 2,907 challenges: all validate, key accepted, every other option refused, no duplicate options, no raw slots. Two "hint contains the key" hits are substring accidents ("360°" holds "60°") |
| Forge G2 specs against the kits | `g2-specs.mjs` | 2,203 specs: no distractor equals the key, an accepted form or the key's value. Two duplicate options are deliberate (the capital letter is the answer) |
| served text | `served-text.mjs` | 12,360 levels: no raw `{slot}`, `undefined`, `NaN`, `[object`, or doubled spaces |
| builders in step with their data | `build-coverage / build-arena / build-vakya / build-kaal --check` | all four pass |
| every logic has a coverage entry and a view; no engine renders a mode no topic reaches | `reachability.mjs` | 105 of 105; 104 view keys (one view serves two modes) |
| 360 × 640, 2D renderer | `shots-360.mjs` | 214 family/mode/goal combos mounted, 0 sideways overflow, 0 controls past the edge, 0 chrome buttons under 44 px, 0 text under 14 px (16 px for classes 4 to 5), 0 page errors |
| reaction lines | read `src/play/core/react.ts:28-37` | a line with an unfilled slot is skipped, never shown raw |

Random tapping by family (the model described under GAMES-03; "any win" counts a win after misses, "luck" a first-try `correct`):

| family | entries | levels played | trials | any win | first-try correct by luck |
|---|---|---|---|---|---|
| aakash | 6 | 108 | 21600 | 0.0% | 0.0% |
| aankde | 6 | 108 | 21600 | 1.0% | 0.5% |
| arena | 202 | 3636 | 727200 | 18.8% | 16.0% |
| badlaav | 6 | 108 | 21600 | 0.0% | 0.0% |
| bhaap | 8 | 144 | 28800 | 0.0% | 0.0% |
| chhaano | 5 | 90 | 18000 | 0.0% | 0.0% |
| darpan | 9 | 162 | 32400 | 0.8% | 0.4% |
| feeta | 14 | 252 | 50400 | 1.9% | 1.4% |
| galti-pakdo | 2 | 36 | 7200 | 30.4% | 26.6% |
| gati | 7 | 126 | 25200 | 1.5% | 1.3% |
| ghadi | 8 | 144 | 28800 | 1.6% | 0.9% |
| guna | 20 | 360 | 72000 | 2.1% | 1.0% |
| hissa | 10 | 180 | 36000 | 16.0% | 10.7% |
| jaanch | 3 | 54 | 10800 | 0.0% | 0.0% |
| kaal | 11 | 198 | 39600 | 0.2% | 0.2% |
| kila | 17 | 306 | 61200 | 2.7% | 2.2% |
| kon | 15 | 270 | 54000 | 10.4% | 5.6% |
| koshtak | 4 | 72 | 14400 | 7.2% | 2.2% |
| kram | 12 | 216 | 43200 | 0.4% | 0.2% |
| kyun-lab | 26 | 468 | 93600 | 1.1% | 0.7% |
| naksha | 9 | 162 | 32400 | 0.7% | 0.6% |
| nazariya | 23 | 414 | 82800 | 3.2% | 2.1% |
| nishana | 18 | 324 | 64800 | 0.6% | 0.6% |
| paheli | 6 | 108 | 21600 | 1.6% | 1.4% |
| parkar | 12 | 216 | 43200 | 0.0% | 0.0% |
| rang | 4 | 72 | 14400 | 0.0% | 0.0% |
| stambh | 7 | 126 | 25200 | 0.5% | 0.5% |
| taraazu | 10 | 180 | 36000 | 8.9% | 2.8% |
| todo-jodo | 19 | 342 | 68400 | 0.1% | 0.0% |
| vakya | 7 | 126 | 25200 | 0.0% | 0.0% |
| yantra | 9 | 162 | 32400 | 0.3% | 0.1% |

## Looked at and not a finding

- **"A perturbed solution still wins" (872 cases).** Each is a tolerance (an angle within the level's `tol`, a year within 2 % of the river's span, `kaal` order where only the sequence counts), a second valid route (a different prime split, a different shading of the same fraction), or a prediction that the later act replaces (strips `choose`: the first choose is the prediction, the last is the answer). I read a sample of each family's list; none was a wrong answer accepted.
- **Two game systems for one topic.** 95 of the 114 class 4 to 7 topics with a frame engine (`shared/engine-topic-map.json`) also have a play family. The two lanes are separate on purpose (Studio seam for play, `server/director/modules.js` for engines) and the engine lane only binds a plan when the kit item's key matches, so I did not report it. `fraction-bars@1` is live (the Forge uses it).
- **Mapped topic and game fit.** I read the whole topic-to-game table (310 non-arena entries) against the topic titles. I found no game that teaches something else; the weakest fits (c6 integers "token model" on the number-line hop, c7 "Patterns in products" on a multiplication field) are close enough to leave to a content review.

## Coverage

**Read fully:** `shared/play.ts` (contract and acts), `src/play/families/index.ts`, `src/play/engines/registry.ts`, `server/play/*.js` (levels, start, grade, routes), `server/forge/g2/levels.js`, `server/routes/modules.js`, `modules.html`, `data/play/coverage.json` shape, `server/forge3/play-cert.js` header and `coverageLevels`.

**Exercised by script, not read line by line:** all 105 family logics (`validate / solve / apply / goalMet / grade / malActs`) through the server's own level path; 2,907 arena challenges; 66 vakya items through their levels; 2,203 G2 specs; all 214 mountable family/mode/goal combos at 360 px.

**Sampled:** the per-family view files (read the vakya view layout only); the perturbed and random-tap lists (read by group, then 3 to 8 cases per group); the topic-to-engine map (read as a table, not each engine against its topic).

**Not read or not reached:**
- `src/modules/frame/engines/**` (the 14 older frame engines): not played. Their own tests exist (`tests/engines-logic.test.mjs`, `engines-fixes`) and `server/forge3/certs/modules.json` (built 2026-10-10) shows no failures, but I did not run them against kits.
- `src/play/engines/{antariksh,khand,yantra,core3d}`: 3D renderers not mounted (the harness ran with `engine=2d`; headless WebGL is not what a child's phone does).
- The 360 px sweep measures buttons and elements with a pointer cursor, plus all text. Hit areas inside a board (a square on the kila path, a clock hand) are drawn on the board and are not counted by it; the forge3 cert's own check covers those and shows no failures.
- Arena, kaal `order` and vakya need server-attached bank items, which the dev harness does not load: those three mounted blank in the sweep and were judged from the forge3 cert instead (and the c5 vakya level separately, above).
- No sound, voice, or live-lesson behaviour; no `tests/prod` anything.

## Scripts (`docs/design/round7/audit/games-scripts/`)

All run with `DATABASE_URL` blank, no network, no model, no secrets. The first six are pure Node and take under a minute each. `shots-360.mjs` and `shot-vakya-c5.mjs` need the play dev harness (`npx vite --config src/play/dev/vite.play.config.mjs --port 5199 --host 127.0.0.1`) and Playwright's Chromium; the sweep takes about eight minutes.

| script | what it does |
|---|---|
| `play-family.mjs [family ...]` | Per coverage entry, fades 1 to 3, both doors, 3 seeds: solver acts accepted and graded `solved`; nothing wins at init or on a bare claim; mal-rule acts do not win; perturbed solutions listed; random tapping |
| `focus-discriminates.mjs` | The Director's focus belief against `proof.discriminates` (GAMES-01) |
| `reachability.mjs` | Logic, mode, view, coverage and engine registrations against each other |
| `arena-bank.mjs` | Every arena challenge played right and wrong through its own law |
| `g2-specs.mjs` | The Forge G2 specs against the kits |
| `served-text.mjs` | Raw slots and broken text in every served level |
| `fuzz-acts.mjs` | Extreme numbers through `gradeActs` |
| `shots-360.mjs [family ...]` | 360 × 640 mount and measure of every family/mode/goal |
| `shot-vakya-c5.mjs` | The one level the cert never judged (GAMES-06/07) |
| `shots/vakya-c5-360.png` | The screenshot for GAMES-07 |

## Proposed context entry

`context/inbox/r7-audit-games.json` carries one note: "a belief mapped in coverage but with no discriminating level is a silent gap in the learner model: the coverage count (358 mapped beliefs) counts it, `proof.discriminates` does not" (measured 2026-11-10 by `focus-discriminates.mjs`, n = 515 entries, 4 beliefs).
