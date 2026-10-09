# round3 truth: apply order, proof, numbers

2026-10-09 · stream **truth** (V1: the learning loop and grading truth).

## Base and patch checks

The base is **HEAD `a29cc0b`**. The main loop's WIP checkpoints `7773366` and `a29cc0b` committed an intermediate
copy of this stream's owned files. The working tree holds their final versions.

Every hot file a patch touches is byte-identical to HEAD:

- `server/director/{classify,state,say}.js`
- `db/migrations/README.md`
- `tests/round2-truth.test.mjs`
- `tests/comprehension-reteach.test.mjs`

Its server paths (`server/director`, `server/brain`, `server/routes`, `server/compiler`, `db/`) are the same as
production `145996f`.

- Every patch passes `git apply --check`.
- Patches 01-07 applied in order to a clean copy of the base files come out byte-identical to the measured tree
  (`cmp`).

**Where the numbers come from.** Unless a row says otherwise, every number below comes from:

- a **local** server (`server/serve.mjs`), HEAD or HEAD+patches, with the **production profile**: the env that
  `scripts/deploy-azure.mjs` sets on Azure, which is `NODE_ENV=production`,
  `DEPLOY_CLASSIFY=grok-4-1-fast-non-reasoning`, `TAXILA_CLASSIFY_HEDGE_MS=1500`, `TAXILA_TURN_PREFETCH=off`;
- the Neon **TEST** branch;
- real Azure models;
- **scripted adult** turns.

None comes from a real child. Production (taxila.dev) rows say so.

## Root cause of the production regression (w1c-reteach 7/13, `reteach_attempts` 0 rows)

It is two defects. Together they gave "re-teach moves happen, 0 rows".

### 1. The classifier differs: production runs grok

`scripts/deploy-azure.mjs` sets `DEPLOY_CLASSIFY=grok-4-1-fast-non-reasoning` on Azure. Local runs used the
default, `taxila-fast`.

**What goes wrong.**

- A reply that is only a wrong number ("999" for "1/4") always goes to the model, because V1.1's by-value path
  decides only credit.
- grok sometimes abstains on it. In isolation it did so 3 of 32 times; taxila-fast did 0 of 32 (8 calls per item
  × 4 items). In a lesson it abstains on first tries, too.
- An abstention takes the unclear path: no hint rung, and the card cap **leaves** the item instead of asserting
  it.
- So `failsPostRung3` never reaches 2, and `engineReteach` never runs. The saved state shows `failedArms {}`,
  exactly as on production.

**Reproduction on the same tree and the same database, changing only the env:**

| config | w1c-reteach |
|---|---|
| prod profile | 6/13 and 6/13, 0 rows |
| `DEPLOY_CLASSIFY=grok` alone | 6/13, 0 rows |
| local profile | 13/13 and 13/13 |

### 2. The Director's own re-teaches are never logged

These are the kit's remediation for a misconception the answer showed (`afterMiss`, `trap`) and the P21 change of
approach. They do not set `lastReteach`, and `brain/turn.js` writes the row from `lastReteach`.

On prod-profile HEAD:

- round3-truth A2: 1 row for 2 re-teach moves, in 2 of 2 runs;
- B1: the kit re-teach after a misconception pick wrote no row.

**Logging those decisions exposed two repeats.**

- In round2-truth's fixture, the kit path re-taught a diagnostic with the **same** kit primary arm that the
  engine had already used: 6 of 6 seeds, on HEAD, unlogged.
- In a local run, the change of approach re-taught `gen:worked` on the turn right after the engine's own
  `gen:worked`, inside its re-check.

## Patch order

The hot files get patches. The owned files are already in the tree.

| # | file | what | proven by | switch |
|---|---|---|---|---|
| 03 | `db/migrations/023_reteach_every_decision.sql` (new), `README.md` | Widens `reteach_attempts_trigger_check` (+ `misconception_seen`) and `_chosen_by_check` (+ `rule`). Additive. **Apply to production first:** a 02 row on the old checks fails the turn's transaction (rj-w2c-child-history-unwritable), and the deploy gate refuses unapplied migrations. | Applied to the Neon TEST branch on 2026-10-09 (statements only, not recorded in `schema_migrations`). The kit row `…m-bigger-denominator-bigger:primary (misconception_seen/kit_primary)` was inserted on the patched server. | — |
| 01 | `server/director/classify.js` | `BARE_NUMBER`: ASCII or Devanagari digits only. A bare number that is not the key's value is `incorrect` when the model abstains (`overridden: bare_wrong_number`, `offTopic` cleared), and code grades it when both classifier deployments fail. Distress and stop always win. | `tests/round3-truth.test.mjs` (6). `evals/grading-truth/round3/floor-safety.mjs`. | `TAXILA_NUMBER_FLOOR=off` |
| 02 | `server/director/state.js` | `logReteach` and `directorMayReteach` around the kit remediation (`afterMiss` ×2, `trap`) and the P21 change of approach (chooser `rule`). | `tests/round3-truth.test.mjs` (4), `tests/round3-truth-learner.test.mjs` | `TAXILA_RETEACH_LOG=off` |
| 04 | `server/director/say.js` | `PRAISE_ANY_WIDE`: up to 8 words between "aapne/tumne/you" and "sahi/correct/right", plus more verb forms. Used for every verdict except a graded `partial`, and in `stripPraise`. | `tests/round3-truth.test.mjs` (3). `lesson-truth`, `owner-truth-guards` unchanged (33/33 on both trees). | — |
| 05 | `tests/round3-truth.test.mjs` (new) | Pins 01, 02 and 04. | 13/13 patched; 6 of 13 fail on HEAD, each on the fix it pins. | — |
| 06 | `tests/round2-truth.test.mjs` | The options-item fixture. Its only re-teach on a diagnostic was the forbidden repeat, so the rule is now checked on the same diagnostic with no arm used. | 5/5 on HEAD and on the patched tree. | — |
| 07 | `tests/comprehension-reteach.test.mjs` | The chosen_by static check also reads `director/state.js`, and a new **trigger** check reads both files against the migrations. Needs 02 and 03. | 9/9 patched. | — |

**Patch 02 in detail.**

- Each decision is built by `comprehension/reteach.js` (`directorReteachDecision`, `directorArmOf`) and booked by
  `bookDirectorReteach`. That books the row (`lastReteach`), `armsUsed`, `lastArmBySkill` and a cooldown of 2. An
  arm still in its re-check when it is pre-empted counts as failed.
- `directorMayReteach` forbids an arm already used this lesson, and a change of approach inside a running re-check.
  The kit path is exempt from the cooldown, because the misconception was just shown.

**In the tree (owned paths, no patch):**

- `server/comprehension/reteach.js` and `index.js`:
  - the helpers above;
  - no migration-dependent `chosenBy` literal: the `rule` chooser lives in patch 02, so HEAD's static check stays
    green until 03.
- `server/learner/live.js`: `CODE_SOURCES` adds `number` and `number_selfcorrect`. A by-value number verdict is a
  **code** grade. It was folded with the model's 0.7 confusion, dropped from θ, and shown to parents as
  "AI-checked against the book's key idea". Stored rows keep their grader, so replay is unchanged.
  `PARAMS_VERSION` is not bumped (main-loop call).
- `server/grading/corroborate.js`: `partsVerdict`. On an item with adjudicated parts (data/kits-parts.json), a
  model `incorrect` / `partial` on the key's own words that carries some parts, but not all, is `partial` in code.
  Each part is checked like a complete form, with the other parts' numbers not counted as foreign. Without a row,
  the old rule stands: no evidence. Tested by `tests/round3-truth-grading.test.mjs` (6).
- `tests/round3-truth-learner.test.mjs` (7) and `tests/round3-truth-grading.test.mjs` (6): green in the main tree,
  as are `comprehension-*`, `learner-live`, `learner-order`, `round2-truth-corroborate`, `round2-safety-floor`,
  `round2-truth-nextday` and `runtime-image-imports`.
- `tests/prod/round3-truth.mjs`: the acceptance test, parts A, B and D, for local or taxila.dev.
- `tests/prod/owner-1-grading.mjs`:
  - the V1.1 oracle;
  - place-value compare from first principles;
  - pv.write reads `written`, not its target `value`;
  - the misgrade count in the label is no longer hard-coded "0".
- `tests/prod/w1c-three-day.mjs`: the +2-day child teaches back.
- `evals/grading-truth/run.mjs`: model rows keep `corroboration` and `overridden`, so a patched run re-scores the
  unpatched rules on the same labels.
- `evals/grading-truth/round3/`: `floor-safety.mjs`, `human-pass.mjs`, `p1-candidate.mjs`.
- `docs/design/round3/truth/data/`: `human-pass.csv` (3,783 rows), `human-pass.summary.json`,
  `kits-parts.p1-candidate.json`. **The candidate is not shipped.**

**Integrator notes.**

- **Beat type changes.** With 02, a kit re-teach carries `lastReteach.misId`, so it becomes a `contrast` beat
  (whiteboard intent `contrast_misconception`) instead of `explain`.
- **More re-teach moves for a struggling child.** In the sim below, the kit re-teach counts as a tried arm, so
  more prerequisite descents are reached: re-teach moves 9,375 → 10,836 over 1,542 simulated lessons, with 0 arm
  repeats on either tree.
- **Overlap with the conversation stream.** Patch 04 touches `server/director/say.js` G-PRAISE only. If that
  stream also patches `PRAISE_ANY`, apply 04 first.

## Before and after, same harness

### w1c-reteach

| tree / profile | runs | notes |
|---|---|---|
| taxila.dev 73a83de (2026-10-07) | 7/13 | 0 rows |
| HEAD, prod profile | 6/13, 6/13 | 0 rows |
| HEAD, local profile | 13/13, 13/13 | |
| **patched, final code** | **13/13, 12/13** | the one fail is the global leftover-guardian counter during concurrent runs |
| patched, before `directorMayReteach` | 12/13, 13/13, 12/13 | the second 12/13 was the repeated `gen:worked`, now forbidden |

On every patched run, s1 failed two arms, descended to `c4-maths-ch05-t01-s1`, was parked, and every attempt
resolved at +1 day.

### round3-truth (new acceptance)

| tree | result | detail |
|---|---|---|
| HEAD, prod profile | 9/11 | A2 FAIL (1 row for 2 re-teach moves); B1 FAIL (kit re-teach, no row) |
| HEAD, prod profile | 9/12 | A2 FAIL (1 row / 2 moves); infra: the guardian counter, and a cleanup refused with 409 `erase_review` |
| **taxila.dev** prod `145996f`, API only | **2/3** | A1 FAIL: a bare "999" on `rl-o1` ungraded |
| **patched, before the gate** | 11/11, 9/10, 11/11 | the 9/10 fail is the guardian counter; a `wheel_spin/rule` row was written |
| **patched, final code** | run 1: **500** on a turn; run 2: every product check passes (10/11, guardian counter); part A only ×3 (debug server): every product check passes | the 500 is below |

**The 500.** A `BudgetError` (compiler section cap) on a no-item move in part A, so `instructionsAfter` could not
skip an item.

- **Rate:** 1 in 8 patched part-A runs; 0 in 3 HEAD runs. The message was not logged (`NODE_ENV=production`
  hides it). It did not recur in 3 runs with `TAXILA_LOG_FULL_ERRORS=1`.
- **Simulation:** 0 BudgetErrors in ~59.5k compiles of struggling-child lessons on either tree (514 topics × 3
  seeds, `budget-sim.mjs`). With a CONV2 `insist` mod on every graded turn, a **pre-existing** MOVE-section
  overflow appears on explain moves: 266-267 tokens against the 260 cap, in `c5-evs-ch04-t02` and
  `c7-science-ch06-t01`. HEAD had 6, patched 3.
- **Status:** the live cause is not identified. See "still short".

**Safety observation** (not changed): on prod-profile HEAD, the B child's typed "1/3, because 3 is bigger than 2"
raised a `content_filter` safeguarding incident, then a `model_note` one. The TEST account
`prod-r3truth-b+179154589233356fc9b@taxila.test` is left for the human safeguarding step. It did not reproduce in
isolation. n=1.

### w1c-three-day (taxila.dev 21/23, 2026-10-07)

| script | tree | result |
|---|---|---|
| old | HEAD | run 1: every product check through +3 days passed, then an outside `pkill` killed the server; run 2: 23/23 |
| **new** (the +2-day child teaches back) | HEAD | **22/23, 22/23** (each fail is the guardian counter) |
| **new** | patched | **23/23** |

**Why the old script fails intermittently** (local-profile trace, n=1):

- Its +2-day teach-back was one expectation, graded `mid`, then `fail`.
- U(s1) went 0.421 → 0.548, below 0.6.
- An offline fold of the same events gives 0.693 with the passing why alone, and 0.868 with a passing teach-back.
  Both are fragile.

### owner-1 (V1.1 oracle; place-value compare)

| target | result | detail |
|---|---|---|
| taxila.dev 145996f, old oracle (main loop, 2026-10-09) | 5/7 | praise on an ungraded re-ask; place-value unverified (7/8) |
| **taxila.dev 145996f, V1.1 oracle, same seed 13666** | **7/7** | typed 0/60 wrong; words 0; modules 0/38; frame 0 misgrades over **242** verifiable commits (was 189); place-value 51/51 compare commits verified; **8/8** bindable engines verifiable; V1.1 half answers: 1 graded partial, 3 re-asked |
| HEAD local, seed 13666 | 6/7 | the fail is 6 harness "misgrades": a pv.write's target `value` read as the entry (fixed; re-scored from the logged payloads, 0 real); half answers: 1 graded partial, 5 re-asked |
| **patched local, seed 13666** | **7/7** | half answers **2/2 graded partial** (the corroborate parts rule) |

### Grading truth at scale, with the shipped parts data

**Deterministic battery** (`evals/grading-truth/run.mjs --classes 1-9 --parts parts-labels-c1-9.json`). Seeds 7,
11 and 13; HEAD and patched give the same numbers.

| grader | n per seed | wrong grades |
|---|---|---|
| `classifyFast` | 89,560 | **10 / 9 / 9** |
| modules | 436-446 | 0 |
| studio.v2 | 444-453 | 0 |
| placement | 1,734 | 0 |
| rKey | 436-470 | 0 |
| studio.w2h | 773-853 | 5 / 4 / 2 |

What the `classifyFast` wrong grades are:

- one part of a multi-part key credited through an **unlabelled, disputed** acceptable entry: "More", "Grateful",
  "No", "9/16", "7 incorrect answers", "बाँधो", "6, 1, 5, 2, 4, 3";
- 1 bare number of a decisive key;
- 1 "false fail" whose truth is the weak kit-claim fallback: "₹40" graded partial on "40; ₹40".

The studio.w2h ones are the known `wrong-try:no-item-id`.

**Cost of the open P1 rows.** These are acceptable entries both raters call NOT complete; truth "partial", seed 13.

| data | `classifyFast` wrong grades | of which |
|---|---|---|
| HEAD + shipped data | **290** | 281 are P1 entries credited complete |
| `kits-parts.p1-candidate.json` | 8 | — |

The candidate row is circular: it shows the code path, not new truth.

**Model leg on production's classifier** (grok-4-1-fast-non-reasoning, hedge 1500; seed 13; n = 1,131; 0 errors;
0 HTTP 429). This was not measured in round 2, which used taxila-fast.

| measure | HEAD | patched, on the same labels |
|---|---|---|
| wrong grades | **15 (1.3%)**: 14 false credits, 1 partial miss | **15** |
| abstain | 477 | **393** (HEAD's rules on those labels: 475) |
| right answers left uncredited | 36 / 306 | — |

- HEAD's proven-class wrong grades are 6: negated key ×3, hint-as-answer ×3. Weak-truth 3, two-rater 6.
- What patched changes on the same labels:
  - the parts rule grades 78 two-rater partial answers `partial` instead of re-asking them (partial bucket abstain
    133 → 55), plus 1 weak-truth "incorrect" now `partial`;
  - the floor grades 3 bare wrong numbers `incorrect` (truth incorrect).
- An offline rescore of HEAD's own run with the floor: 4 abstentions become `incorrect`, all with truth incorrect.

**Floor safety:**

- 0 of 6,657 right surface forms flagged (1,103 number-key items);
- 3,309 of 3,309 near-miss wrong values flagged.

### The human pass (`docs/design/round3/truth/data/human-pass.csv`, 3,783 rows)

The rater disagreements still without a row number **4,290**: 3,029 entry labels and 1,261 parts counts, over
2,074 items. 667 of those items have no row at all. All 3,029 disputed entries are credited **complete** today.

| priority | rows | what |
|---|---|---|
| P1 | 336 | both raters say not complete |
| P2 | 2,527 | complete vs partial |
| P3 | 166 | complete vs wrong |
| P4 | 570 | parts disputed, no row: graded single-part |
| P5 | 113 | agreed labels flagged by a number check |
| P6 | 71 | agreed wrong |

P5 breaks down as:

- 66 "partial, but the entry carries a number of every part". This includes the brief's
  `c8-maths-ch01-t01-i07` "49, 1 left out".
- 47 "complete, but the entry misses a part's numbers".

**Third-family reads** (this stream, Claude: not a human, not labels):

- **P1:** 30 of 30 read as not complete.
- **P5:** about 1-2 of 20 look mislabelled. P5 is a queue, not a finding.

**Decision for the owner:** ship the P1 candidate before the human pass, or wait for it.

## Simulation of the patched ladder

The Director with the real compile, no network (`budget-sim.mjs`). 514 topics with kit remediation × 3 seeds;
a struggling child who alternates the misconception and a wrong answer; 45 turns; text lane.

| re-teach moves | HEAD | patched |
|---|---|---|
| total | 9,375 | 10,836 |
| engine re-teach | 6,063 | 5,289 |
| kit re-teach | 3,261 (unlogged) | 3,270 (logged) |
| prerequisite descent | 51 | 2,277 |

On both trees: 0 lessons with an arm used twice, and 0 BudgetErrors.

## Gates

- **Full per-file suite** on scratch copies of HEAD and of the patched tree (194 files, 3 at a time, 300 s each,
  repo `evals/`, `scripts/` and `public/` linked in):
  - 189 files identical.
  - Differences: the 3 new round3 files; `p4-content-unit` 26/2 → 27/1; `relational-policy` 19/1 → 20/0. Both are
    load flakes in the patched tree's favour.
  - 16 files fail on both trees, all browser, geometry or scratch-layout tests.
  - 6 files time out on both under load: `brain-turn`, `engines-browser`, `kit-budget`, `round2-content`,
    `round2-safety-floor`, `round2-truth-nextday`. Run alone, `brain-turn` 10/10 and `round2-safety-floor` 27/27
    and `round2-truth-nextday` 6/6 pass.
  - The integrator should run `npm test` once after applying.
- **tsc and vite build:** nothing under `src/` or `shared/` changed.
- **Persona invariants:** untouched.
- **Runtime image:** `tests/runtime-image-imports.test.mjs` passes.
