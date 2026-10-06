# round2 truth: apply order and proof

2026-10-06 · stream truth · base **HEAD 4af5be6**. Its server code is the same as 48e3369 and production web ee97e9c:
`git diff ee97e9c HEAD -- server/director server/brain server/learner server/comprehension` is empty.

Every patch passes `git apply --check` on HEAD. Patches 01-07 were also applied in order to a clean `git archive` of
the files they touch. The result came out byte-identical to the measured tree (`git apply` in order, then `cmp`).

## New files, straight into the tree

None of these is on the hot list.

| file | what it is |
|---|---|
| `server/grading/corroborate.js` | The code check on a model grading label. Pure. Used by patch 04. |
| `tests/round2-truth-corroborate.test.mjs` | Unit tests for that check. Green on HEAD. |
| `tests/prod/round2-truth.mjs` | Acceptance, parts A-D. Runs against a local server or taxila.dev. |
| `tests/prod/w1b-mounts.mjs` (changed) | The test fix, section 2. |
| `evals/grading-truth/run.mjs` (changed) | Adds `--classes`, a `hint-as-answer` case kind, `--dump-model` and `--guard`. |
| `evals/grading-truth/guard-eval.mjs` | Scores the same model labels twice: as they are, and after the guard. |
| `evals/grading-truth/label-parts.mjs` (changed) | Adds `--classes` and `--out`, so a run over every class does not overwrite the battery's truth file. |
| `evals/next-day-check/sim.mjs` | Simulates the session-open pipeline. Results are in `results/2026-10-06/`. |
| `evals/grading-truth/build-parts.mjs` | Builds a CANDIDATE parts file from agreed labels only. It never writes `data/kits-parts.json`. |
| `evals/grading-truth/data/parts-labels-c1-9.json` | Two-rater labels for all 5,579 list-shaped kit items in classes 1-9 (2026-10-06, $13.04). |
| `docs/design/round2/truth/data/kits-parts.candidate.json` | The candidate `data/kits-parts.json`: agreed labels only. **Not shipped.** |
| `docs/design/round2/truth/data/parts-disagreements.json` | 4,290 rater disagreements, for the human pass. |
| `docs/design/round2/truth/data/third-rater-audit.json` | 40 agreed-partial labels audited by a third model family. |

## Patch order

| # | patch | file(s) | what it changes | proven by |
|---|---|---|---|---|
| 01 | `01-director-reteach-ladder.diff` | `server/director/state.js` | **D1:** `ladderHandover`. When V1.4's pace park would leave a skill that has a re-teach arm in flight, the decision goes to `engineReteach` at once: another arm, then the prerequisite descent, then the engine's park. **D2:** a re-teach on an options item retires the item; the re-check is `isomorphicFor`, a fresh produce item. | `tests/round2-truth.test.mjs` (two tests). Acceptance B. |
| 02 | `02-ledger-teachback-credit.diff` | `server/learner/kt/ledger.js` | **D4:** a `probe.teachback` event advances the display of every skill in its `skill_ids`. Before, only `target` advanced. The rule reads stored columns, so a replay gives the same result. | `tests/round2-truth.test.mjs`. Acceptance C. |
| 03 | `03-lesson-end-closes-episode.diff` | `server/learner/live.js`, `server/brain/turn.js` | **D3:** `endEvents`. When the lesson ends on an open item episode with wrong tries, it writes the leave event: P15 / C4, with the misconception and the via. The write runs in the end handler's `flushHeld` transaction. | `tests/round2-truth.test.mjs`. Acceptance A. |
| 04 | `04-classify-corroborate.diff` | `server/director/classify.js` | **D5:** every model label on a keyed item passes `corroborate()`. A credit the child's words do not carry becomes `no_evidence`. So does a fail or partial on words that ARE the key. | `tests/round2-truth.test.mjs`. Grading-truth model leg, section 3. |
| 05 | `05-tests-round2-truth.diff` | `tests/round2-truth.test.mjs` (new) | Pins 01-04 to the production failures. Needs 01-04 applied first. | 5/5 on the patched tree. |
| 06 | `06-delayed-check-leads.diff` | `server/learner/live.js`, `server/comprehension/weave.js`, `server/learner/checks.js`, `tests/round2-truth-nextday.test.mjs` (new) | **D6:** a due delayed check takes the first opener slot. Checks go first, oldest anchor first, then FSRS reviews. An opener with no item passes its slot to the next due check. A skill that cannot be certified (no unseen item) only fills a spare slot, as a review tagged `uncertifiable`. | New test: 6/6 patched, 1/6 on HEAD. `evals/next-day-check/sim.mjs`, section 4. |
| 07 | `07-card-shows-delayed-check.diff` | `server/comprehension/fuse.js`, `tests/round2-truth-card.test.mjs` (new) | The session-open check / callback (shape C31) writes a reason, and so a parent-card chip ("used it again days later"), even when only K moved. Before, a +1-day review left the card byte-identical (V1.5). | New test: 2/2 patched, 1/2 on HEAD. w1c-three-day "+1 day card changes", section 4. |

Notes for the integrator:
- **03:** a late turn after an end also calls `flushHeld(next)`. The closing event id is deterministic (`<lesson>:end:0`)
  and the insert is `on conflict do nothing`, so a second write is a no-op.
- **02 and 07 change fold semantics.** Stored `kt_skill_state` / `comp_facet_state` rows are not refolded; a child picks
  the rule up at their next event. `PARAMS_VERSION` / `COMP_PARAMS_VERSION` were not bumped. That is a main-loop call.
  Both rules are replay-stable.
- **06 and 03 both touch `live.js`** in different hunks. 06 applies on HEAD alone and after 01-05.
- **No switches.** No patch adds a flag. Reverting a hunk restores HEAD behaviour.
- **Not applied, proposed as data:** the parts labels, section 3c. That is a decision for the main loop and owner.

## Measurements

Unless marked otherwise, every number is from a local server (`server/serve.mjs`, Neon TEST branch, real Azure models)
with scripted children, or from a deterministic simulator. **None is from production, and none is from a real child.**

### 1. w1c-reteach (prod 10/13)

**Root cause.** Two policies race on one struggling skill:
- V1.4's pace park (7 tries without a run of 3) leaves the item and skips the skill while W1-C's re-teach re-check is
  still pending.
- A re-teach launched on an options item re-asks the same 2-3 options. That is elimination, and the fold grades only
  the first try.

**Deterministic Director sim** (scratch `sim-reteach.mjs`): c5-maths-ch02-t01, an always-wrong child, 40 seeds x 3 skills.

| tree | skill-runs left pace-parked with an arm in flight and no decision | descents | engine parks | max tries on a skill |
|---|---|---|---|---|
| HEAD | **80 / 120** | 40 | 0 | 7 |
| 01 | **0 / 120** | 80 | 120 | 9 (V1.4 line: 10) |

**`w1c-reteach.mjs`, local, n = 1 per run.**
- HEAD: 13/13 on one run. The prod failure depends on the model's path; the sim shows it in 80 of 120 runs.
- Patched: 13/13 on 2 runs.

**Acceptance B.**
- HEAD FAILS "no skill ends pace-parked with an arm in flight" (s2, gen:pictorial).
- Patched passes 5/5. Both skills went to the descent and then the park, and 4/4 attempts resolved.

### 2. w1b-mounts G1 (prod: 0 lessons graded)

**Both the test and the product were wrong** (owner-truth rules: frame claims are never trusted, and a child's wrong
answer is never dropped from the record).
- **Test.** The open-class branch read `ans.debug.classification`. Production never sends `debug` (`rows.js debugFor`:
  local or `TAXILA_DEBUG` only). So on taxila.dev the check always fell through to "no module row" and the right commit
  was never sent.
  - Fixed: the test reads the server's verdict from `ui.verdict` when `debug` is absent.
  - Science and English lessons get up to 8 extra turns answered with the key.
- **Product.** A wrong answer on an OPEN item becomes an event only when its episode closes, and the lesson end never
  closed one. A wrong commit followed by the end was silently dropped. Patch 03 fixes this, and the test now asserts
  the C4 row.

**Local run, patched tree, n = 1.**
- A forged `correct:true` on a wrong commit was graded incorrect in **2 lessons**.
- A right commit with `correct:false` was graded correct in **2 lessons**.

**Acceptance A.**
- HEAD writes **no row**.
- Patched writes `item.open:C4`.

**Still failing, outside this stream:** "≥ 1 item-bound mount" on c6-maths-ch07, c4-maths-ch05 and c7-maths-ch08. That is
the known `p4c-open-w1b-item-bound`: the engine adapters have no mode for those topics.

### 3. Grading truth (V1.1 bar: 0 wrong grades in ≥ 2,000 randomised answers on every form)

`evals/grading-truth/run.mjs --classes 1-9`, three seeds. The guard is scored offline on the SAME model labels
(`guard-eval.mjs`; paired).

**Truth classes:**
- **proven:** truth by construction. Numbers, negations, hint-as-answer, unit and word swaps, verbatim keys.
- **weak:** another item's key.
- **two-rater:** partial / complete labels from two model families (gpt-5.6-terra, DeepSeek-V4-Pro), not adjudicated.

#### 3a. Per grader path and form, HEAD, production configuration (no parts file), seed 13

| path | n | wrong | what the wrong ones are |
|---|---|---|---|
| `classifyFast` (deterministic lesson grader) | 78,810 | **879** | 838 exact match on a kit acceptable entry two raters call partial; 31 one part of a multi-part key; 8 acceptable entries two raters call wrong; 2 `numnoun:bare-number(words-decide)` |
| bound engines, frame protocol | 374 | 0 | |
| bound engines, flat | 374 | 0 | |
| Studio W2-H host (`server/studio/grade.js`) | 773 | **2** | `wrong-try:no-item-id`. A frame that does not stamp the item id; already known: V1-04 stamping fixes it, 0/853 with the stamp |
| Studio v2 specs | 444 | 0 | |
| Studio v2 extension | 472 | 0 | |
| placement | 1,734 | 0 | |
| comprehension rKey (dormant) | 436 | 0 | |
| `classify()` model leg (taxila-fast), before the guard | 1,890 | **388** | see 3b |

Seeds 7 and 11 agree: `classifyFast` 870 and 878; W2-H 5 and 4; every other deterministic path 0. The earlier "0 in
35,088" was measured with `TAXILA_PARTS_FILE` set. Production ships no parts file.

#### 3b. Model leg, before → after patch 04's guard (same labels)

| seed | role | n | proven: wrong | weak: wrong | two-rater: wrong | correct answers uncredited (re-asked) |
|---|---|---|---|---|---|---|
| 7 | dev (rules tuned here) | 1,878 | 62 → 5 | 23 → 3 | 300 → 234 | 45 → 56 |
| 11 | first check | 1,889 | 57 → 3 | 25 → 2 | 300 → 233 | 46 → 60 |
| 13 | **held out** (guard frozen before the run; `corroborate.js` sha1 d33a436, unchanged since) | 1,890 | **69 → 2** | **16 → 3** | 303 → 241 | 51 → 68 |

- **Held-out cost.** 68 of 476 truly correct answers (14.3%) are re-asked instead of credited. The reversal line is 25%.
- **What the 10 proven-class residuals are** (3 seeds together):
  - Most are a hint that restates a kit acceptable entry. "2 rows, 7 dots in each" against acceptable "2 rows of 7";
    "Samosas: 3 × 15; chai: 2 × 10" against acceptable "3×15 + 2×10". For these the harness's "proven incorrect" label
    is itself doubtful.
  - Two look genuine. "Short time → weather; long-term pattern → climate" was credited for a sorting task. An echoed
    hint question ("For 5 ÷ 0, what number times 0 gives 5") was credited.
- **The two-rater remainder is the same root cause as 3a:** kit acceptable entries that answer only part of a several-part
  question ("LED bulbs" for "Name four ways…").

#### 3c. The root cause of most remaining wrong grades is data: partial answers listed as acceptable

- The kits' `acceptable` lists contain partial answers. V1.1 says multi-part keys are graded partial. The product credits
  these entries as complete, both exactly (`classifyFast`) and through the model.
- The designed fix exists: `server/content/parts.js` reads `data/kits-parts.json`, built from agreed two-rater labels plus
  a human pass on disagreements. The file was never shipped.
- **Third-family audit** (`docs/design/round2/truth/data/third-rater-audit.json`):
  - 40 of the 947 agreed-partial labels were drawn uniformly and read by a third family (Claude, this stream).
  - 37 agree. 3 are ambiguous: "AB BC CA" naming all three segments, "they get aggressive" as a full prediction, and
    "haan" for "are they congruent".
  - 0 disagree.
  - This is not a human adjudication.
- **Full labelling, done this round.** `label-parts.mjs --classes 1-9`: 5,579 list-shaped items, all of them rated by
  both raters, for $13.04.
  - Agreed labels: 6,111 complete, 4,638 partial, 71 wrong.
  - 4,290 disagreements.
  - Cohen's κ: 0.51 to 0.63 on acceptable entries, 0.48 to 0.54 on multi- vs single-part, depending on the class band.
- **The same deterministic battery with the full labels as truth** (seed 13, classes 1-9, production configuration):

| product data | `classifyFast` n | wrong | of which |
|---|---|---|---|
| HEAD, no parts file (production today) | 89,560 | **4,330** (4.8%) | 4,091 exact matches on an acceptable entry the raters call partial; 183 one part of a multi-part key; 54 entries the raters call wrong; 2 bare-number |
| HEAD + the candidate (`TAXILA_PARTS_FILE`) | 89,560 | **9** | 7 one part of a multi-part key; 1 bare-number; 1 false fail of a kit acceptable entry |

- **The candidate row is circular.** The truth and the data come from the same agreed labels, so it shows what shipping
  the data buys, and nothing more. What it does show: the code path works end to end, and 4,321 of the 4,330 wrong
  grades are data.
- **What is needed to ship it:**
  - A human pass over the 4,290 disagreements, as the parts decision requires. The candidate gives disagreements no
    row, so they keep today's behaviour.
  - A decision on whether agreed labels ship before that pass. The third-family audit above (37/40 agree, 0 disagree)
    supports shipping them first.
  - Copying `kits-parts.candidate.json` to `data/kits-parts.json`. The production image already copies `data/`.
- **Owner-1 conflicts with this truth.** owner-1's oracle treats a kit acceptable entry as complete. Once the parts data
  ships, owner-1's "noisy = correct" items with a missing "why" (3d) must follow V1.1 as well.

#### 3d. owner-1 typed answers (prod 3/60 wrong), local, n = 1 run per seed

| tree | seed | typed answers | wrong | which |
|---|---|---|---|---|
| HEAD | default | 61 | 0 | |
| HEAD | 8 | 62 | 3 | 2 noisy→partial, 1 partial→correct. Module answers: 1/39 (forged right value with `correct:false` not credited) |
| patched | default | 58 | 2 | 2 noisy→re-asked |
| patched | 7 | 40 | 0 | the run threw at `/api/parent/controls` 500 after the typed phase |
| patched | 8 | 68 | 2 | 2 noisy→re-asked |

- **Patched: 0 false credits in 166 typed answers and 0 in the module rows.**
- **All 4 patched "wrong" grades are one item.** c2-maths-ch03-t02-i05, "58 and 85 use the same digits. Which is bigger,
  and why?", answered "mujhe lagta hai 85".
  - owner-1's oracle calls it correct, because the kit lists "85" as acceptable.
  - V1.1 and both raters call it partial, because the "why" is missing.
  - The guard re-asks. That is neither a credit nor a fail.
  - The two oracles conflict, and the parts data in 3c is what settles it.

### 4. The next-day check (prod w1c-three-day 16/23)

**Root cause 1: no check was ever due** (patch 02; traced 3/3 local runs on HEAD).
- The teach-back is one conjunctive event over s1-s3, but the ledger credited its generative pass only to `skillIds[0]`
  (s1, recent [0,1]).
- s2 had recent [1,1] and pL .987, but no generative pass.
- So no skill reached learned_today and nothing was ever due.

**Root cause 2: when a check WAS due it often did not lead** (patch 06).

`evals/next-day-check/sim.mjs`: real kits (c1-c9 maths), the real ledger fold and the real Director start, 2,000 lesson
starts per seed. The children carry 1-4 skills learned 1-5 days ago and 0-8 mastered skills with FSRS reviews due.
"exhaust" means day 0 answered every non-reserved check item of the skill, as a long lesson does.

| config | lessons with a due check | opening move is the due check: HEAD → 01-07 | every due check (up to the cap) gets an opener | certifiable check due → first opener certifies |
|---|---|---|---|---|
| seed 7 | 1,289 | 722 (56.0%) → **1,289 (100%)** | 869 → 1,289 | 892/904 → 904/904 |
| seed 11 | 1,304 | 711 (54.5%) → **1,304 (100%)** | 883 → 1,304 | 910/924 → 924/924 |
| seed 7, exhaust | 1,949 | 999 (51.3%) → **1,949 (100%)** | 427 → 1,949 | 764/1,290 → 1,290/1,290 |
| seed 11, exhaust | 1,937 | 982 (50.7%) → **1,937 (100%)** | 375 → 1,937 | 783/1,326 → 1,326/1,326 |

**Local end to end** (w1c-three-day and acceptance C, n = 1-2 runs each):

| tree | w1c-three-day | acceptance C |
|---|---|---|
| HEAD | 16/23 | 4 FAIL: no skill learned_today, no +1 opener, no +2 check |
| 01-05 | 20/23, 20/23 | all 8 PASS. +1 day: C31 review on i03, answered right. +2 days: certifying check on never-met rl-h2, right; s2 mastered with `delayed: true` (V1.3) |
| 01-07 | 22/23 (patch 07 first cut); 21/23 (07 final) | A + B + C: 19/19 PASS |

**w1c-three-day on 01-07, the remaining fails.** Each check passed in at least one 01-07 run. None passed in all of them.
- **"+1 day: the parent card changes after the delayed check alone."**
  - It FAILED with 07's first cut. That cut keyed on `shapeId === "C31"`, but item events carry no shapeId on the live
    path: only why events do (`live.js`). The unit test had passed only because its synthetic events carried one.
  - The final 07 keys on held state instead: the first item answer on a learned skill in a session ≥ 20 h after its
    anchor. It PASSES (s2 gets a chip at +1 day).
- **"+2 days: with reasons, a day-0 skill is above shallow"** and **"the card's state row changes by +3 days."**
  - They PASSED in the first 01-07 run (s1 fragile) and FAILED in the second.
  - Cause: the comprehension ladder leaves shallow only at U ≥ 0.6. Two passing whys from the scripted child gave U
    0.43-0.44, and whether the why-grader passes a given scripted reason varies run to run.
  - This is the comprehension facet's update size (`server/comprehension/params.js`, calibrated by
    `evals/comprehension-sim`). It is not the delayed check, so it was not changed here.

## Gates

- **tsc / vite build:** nothing under `src/` or `shared/` changed (tsc covers src and shared only).
- **npm test.** One `node --test tests/` run hangs after test 560 in both the main tree and the patched copy, so the
  suite was swept per file (`node --test <file>`, 300 s each, 4 at a time).
  - **Main tree (HEAD + this stream's non-hot files):** 180 files, 0 failures. `kit-budget` timed out at 300 s under
    load.
  - **Patched copy (01-07):** every non-browser file passes. That includes the 3 new test files and the comprehension,
    learner-live, w1c and p5 suites: 148/148 in one run.
  - **Browser files in the scratch copy:** `module-tray-geometry` (1 fail), `w2b-whiteboard-browser` (3) and
    `engines-browser` (timeout) fail there. `module-tray-geometry` fails identically with all 7 patches reverted
    ("Frame was detached"), and passes in the main tree. So it is the scratch copy, not the patches. The integrator
    should re-run `npm test` once after applying.
- **Persona invariants:** untouched.
- **Production image:** `tests/runtime-image-imports.test.mjs` passes. Every new runtime file is under `server/`.
