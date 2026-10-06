# round2 truth: apply order and proof

2026-10-06 · stream truth · base **HEAD 48e3369**. Its server code is identical to production web ee97e9c:
`git diff ee97e9c HEAD -- server src shared data` is empty.

Every patch passes `git apply --check` on HEAD. The five patches were also applied in order to a clean `git archive` of
HEAD. The patched files came out byte-identical to the tree that was measured, and the unit tests below passed there.

New files go straight into the tree, outside the hot list:

| file | what it is |
|---|---|
| `server/grading/corroborate.js` | The code check on a model's grading label. Pure. |
| `tests/round2-truth-corroborate.test.mjs` | Unit tests for that check. Green on HEAD today. |
| `tests/prod/round2-truth.mjs` | The acceptance file. It runs against a local server or taxila.dev. |
| `evals/grading-truth/run.mjs` (changed) | New options: `--classes`, a `hint-as-answer` case kind, `--dump-model`, `--guard`. |
| `evals/grading-truth/guard-eval.mjs` | Scores the same model labels twice: as they are, and after the check. |
| `tests/prod/w1b-mounts.mjs` (changed) | The test fix, see 2 below. |

No hot file in the main tree was edited.

## Order

| # | patch | file(s) | what it changes | proven by |
|---|---|---|---|---|
| 01 | `01-director-reteach-ladder.diff` | `server/director/state.js` | **D1:** `ladderHandover`. A miss that V1.4's pace park would leave, on a skill with a re-teach arm in flight, hands the decision to `engineReteach` at once. The outcome is another arm, then the prerequisite descent, then the engine's park. **D2:** a re-teach on an options item (diagnostic or tap) retires that item, and the re-check is `isomorphicFor` (a fresh produce item). This applies on the engine path and on the kit-remediation path in `afterMiss`. | `tests/round2-truth.test.mjs` (two tests). Acceptance part B. `w1c-reteach` 13/13 on a local server. |
| 02 | `02-ledger-teachback-credit.diff` | `server/learner/kt/ledger.js` | **D4:** a `probe.teachback` event advances the display of EVERY skill in its `skill_ids`, not only `target`. It is derived from stored columns, so replay equals online. | `tests/round2-truth.test.mjs` "teach-back credits…". Acceptance part C. `w1c-three-day` 16/23 → 20/23. |
| 03 | `03-lesson-end-closes-episode.diff` | `server/learner/live.js`, `server/brain/turn.js` | **D3:** `live.js endEvents`. At lesson end, an open item episode with wrong tries writes its leave event (P15 / C4, carrying the misconception and the via). It is written in the end handler's `flushHeld` transaction, and the state marks the episode closed. `answerEvents` now records `ep.via`. | `tests/round2-truth.test.mjs` "the lesson end closes…". Acceptance part A: HEAD writes no row, the patched tree writes `item.open:C4`. |
| 04 | `04-classify-corroborate.diff` | `server/director/classify.js` | **D5:** every model label on a keyed item goes through `corroborate()`. A credit the child's words do not carry becomes `no_evidence`. A fail or partial on words that ARE the key also becomes `no_evidence`. | `tests/round2-truth.test.mjs` "classify: …" (stubbed model). The grading-truth model leg; numbers below. |
| 05 | `05-tests-round2-truth.diff` | `tests/round2-truth.test.mjs` (new) | Pins 01-04 to the production failures. Imports `endEvents`, so it needs 01-04 first. | `node --test tests/round2-truth.test.mjs`: 5/5 on the patched tree. |

Notes for the integrator.
- **03:** a late turn after an end also calls `flushHeld(next)`. The closing event id is deterministic (`<lesson>:end:0`)
  and `ledgerStmts` inserts with `on conflict do nothing`, so a second write is a no-op in the database.
- **02:** this changes fold semantics. Stored `kt_skill_state` rows are not refolded. A child's existing skills pick up
  the rule at their next teach-back. `PARAMS_VERSION` was NOT bumped: that is a main-loop call. The rule is
  replay-stable either way.
- **No switch.** None of 01-04 adds a flag. Each one restores the HEAD behaviour if its hunk is reverted.

## Measurements

All of these are on a local server (`server/serve.mjs`, `TAXILA_DB=test`, real Azure models) with scripted children,
unless marked otherwise. None is from production or from real children.

### 1. w1c-reteach (prod 10/13)

**Deterministic Director sim** (scratch `sim-reteach.mjs`): c5-maths-ch02-t01, an always-wrong child, 40 seeds x 3 skills.

| tree | skill-runs left pace-parked with an arm in flight, no decision | descents | engine parks | max tries on a skill |
|---|---|---|---|---|
| HEAD | **80 / 120** | 40 | 0 | 7 |
| patched | **0 / 120** | 80 | 120 | 9 (V1.4 line: 10) |

**`w1c-reteach.mjs` on a local server, n = 1 per run.** Locally, HEAD passed 13/13 once: the failure is model-dependent.
The patched tree passed 13/13 on 2 runs. In each patched run, s1 went through 2 arms, then a descent, then a park, and
4/4 attempts resolved.

**Acceptance part B, n = 1 each.**
- HEAD FAILS "no skill ends pace-parked with an arm in flight" (s2: gen:pictorial).
- The patched tree passes it, and both skills reach descent then park.

### 2. w1b-mounts G1 (prod: 0 lessons graded)

**Verdict: both were wrong.**
- The test read `debug`, which production never sends.
- The product dropped an open wrong commit at lesson end.

**Fix:**
- The test now reads the server's turn verdict from `ui.verdict` when there is no `debug`.
- English and science lessons now get up to 8 extra key-answering turns.
- The test also asserts the end-closed miss row.

**Local run on the patched tree, n = 1:**
- Forged `correct:true` on a wrong commit was graded incorrect in **2 lessons**.
- A right commit claiming `correct:false` was graded correct in **2 lessons**.

**What still fails (3 + leftover counts):**
- "≥ 1 item-bound mount" on c6-maths-ch07, c4-maths-ch05 and c7-maths-ch08 is the known `p4c-open-w1b-item-bound`.
  The engine adapters have no mode for those topics. That is outside this stream.
- "Leftover guardians" FAILs come from my own parallel local runs sharing one test branch. They are not product
  failures.

### 3. Grading truth (V1.1 bar: 0 wrong in ≥ 2,000 randomised answers)

Sources: `evals/grading-truth/run.mjs` with `--classes 1-9`, then `guard-eval.mjs`. The guard is scored on the SAME
model labels (paired).

**Deterministic paths, HEAD, production configuration (no parts file), n = 78,810 cases, classes 1-9.**
- **870 wrong**, all `false_credit`:
  - 838 are `text:acceptable(partial, 2-rater)`. A kit acceptable entry that two raters call partial is matched exactly
    and credited.
  - 22 are `text-partial:one-part(2-rater)`.
  - 8 are `acceptable(wrong, 2-rater)`.
  - 2 are `numnoun:bare-number(words-decide)`.
- The previous "0 in 35,088" figure was measured with `TAXILA_PARTS_FILE` set. Production does not set it.
- This needs the adjudicated `data/kits-parts.json`. It is data, not code (see "short of the bar").

**Model leg, by truth class, with the guard (final `corroborate.js`, sha below).**
- "proven" means truth by construction: numbers, negations, hints-as-answers, unit and word swaps, verbatim keys.
- "weak" is another item's key.
- "two-rater" means partial labels that are not adjudicated.

| sample | n | proven: wrong before → after | weak: before → after | two-rater: before → after | uncredited correct before → after | right fails turned into no evidence |
|---|---|---|---|---|---|---|
| seed 7 (dev: rules tuned here) | 1,878 | 62 → 7 | 23 → 4 | 300 → 231 | 45 → 56 | 63 |
| seed 11 (seen after the first freeze) | 1,889 | 57 → see RESULTS | 25 → … | 300 → … | 46 → … | … |
| seed 13 (held out; guard frozen before the run, sha d33a436…) | see RESULTS.md | | | | | |

- With the two-rater parts labels loaded as product data (`TAXILA_PARTS_FILE`), seed 7 goes from 385 wrong to 44.
- This is **circular**: the truth and the product data come from the same labels. It shows what adjudicated parts data
  would buy. It is not a claim.

### 4. w1c-three-day (prod 16/23)

| tree | runs | result |
|---|---|---|
| HEAD | 1 | 16/23 |
| patched | 2 | 20/23, 20/23 |

**Root cause, traced locally 3 of 3 times on HEAD:**
- After day 0, s2 is at recent [1,1], pL .987, unaided, but has **no generative pass**. The teach-back went to s1.
- So no skill is `learned_today`, and no check is ever due.

**What the patched tree does:**
- Day 0 makes s2 learned_today.
- +1 day: the opener is a day-0 item (C31, a review) and it is answered correct.
- +2 days: the certifying check is on a never-met item (rl-h2) and is answered correct. s2 is then **mastered with the
  delayed flag**. That is V1.3, end to end. Acceptance part C passed all 8 checks.

**The 3 remaining FAILs are the parent card's state row staying "shallow". Why:**
- The comprehension ladder leaves "shallow" only at U ≥ 0.6, which needs reasons.
- The scripted child's reasons gave U 0.427 and 0.437 after 2 passing whys, and U 0.2 on s2, which had no why.
- This is the comprehension facet's update size, not the delayed check. It is outside this stream's four items.

## Gates
- **`tsc` and `vite build`:** no file under `src/` or `shared/` changed, so neither is affected. tsc covers src and
  shared only.
- **`npm test`:** the full suite was run on the main tree and on the patched copy. Results are in RESULTS.md.
- **Persona invariants:** untouched.
