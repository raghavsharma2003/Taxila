# round3 truth: apply order, proof, numbers

**2026-10-09 · stream truth · base HEAD `cadf527`.** Its `server/director`, `server/brain`, `server/learner`,
`server/comprehension` and `db/` are the same as production `145996f`: no file under those paths differs in
the working tree, and `git apply --check` passes on it.

- Every patch passes `git apply --check` on HEAD.
- Patches 01-05 applied in order to a clean copy of HEAD's files come out byte-identical to the measured tree
  (`cmp`).

**Where the numbers come from.** Unless a row says otherwise, every number below comes from:

- a **local** production-profile server (`server/serve.mjs`) running HEAD or HEAD+patches, with the env that
  `scripts/deploy-azure.mjs` sets on Azure: `NODE_ENV=production`,
  `DEPLOY_CLASSIFY=grok-4-1-fast-non-reasoning`, `TAXILA_CLASSIFY_HEDGE_MS=1500`, `TAXILA_TURN_PREFETCH=off`;
- the Neon **TEST** branch;
- real Azure models;
- **scripted adult** turns.

None comes from a real child. Production (taxila.dev) rows say so.

## Root cause of the production regression (w1c-reteach 7/13, `reteach_attempts` 0 rows)

It is two defects. Together they produced "re-teach moves happen, 0 rows".

### 1. The classifier difference: production runs grok, locally it was taxila-fast

`scripts/deploy-azure.mjs` sets `DEPLOY_CLASSIFY=grok-4-1-fast-non-reasoning` on Azure. Local runs use the
default, `taxila-fast`.

**What goes wrong.**

- A reply that is only a wrong number ("999" for "1/4") always goes to the model, because V1.1's by-value code
  path only decided credit.
- grok sometimes abstains on it, as off-topic or unclear. In isolation it did so 3 of 32 times; taxila-fast did
  0 of 32 (`cls-probe.mjs`, 8 per item × 4 items each). Inside a lesson it abstains on repeats and on first tries.
- An abstention is the unclear path. No hint rung is spent, and the card cap then **leaves** the item instead of
  asserting.
- So `failsPostRung3` never reaches 2, `two_fails_post_rung3` never fires, and `engineReteach` never runs.
- That shows in the saved state as `failedArms {}`, exactly as on production.

**Reproduction on the same tree and the same database, changing only the env:**

| config | w1c-reteach |
|---|---|
| prod profile | 6/13 and 6/13, 0 rows |
| `DEPLOY_CLASSIFY=grok` alone | 6/13, 0 rows |
| local profile | 13/13 and 13/13 |

The per-turn trace (`trace-reteach.mjs`) shows the same "999" on `i02` / `rl-o1` graded `not_yet` locally and
`null` on the prod profile.

### 2. The Director's own re-teaches were never logged

These are the kit's remediation for a misconception the answer showed (`afterMiss`, `trap`) and the P21 change of
approach. They do not set `lastReteach`, and `brain/turn.js` writes the row from `lastReteach`.

The production re-teach **moves** were these. On prod-profile HEAD, round3-truth A2 shows "1 row for 2 re-teach
moves" in 2 of 2 runs, and B1 shows a kit re-teach with no row.

The same gap let the engine re-teach a confirmed misconception with the **same** kit primary arm that the kit path
had just used (`selectReteach` step 6), and let a re-teach start with no re-check cooldown.

## Patch order (hot files: patches; owned files: in the tree)

| # | file | what | proven by | switch |
|---|---|---|---|---|
| 03 | `db/migrations/023_reteach_every_decision.sql` (new), `db/migrations/README.md` | Widens `reteach_attempts_trigger_check` (+ `misconception_seen`) and `reteach_attempts_chosen_by_check` (+ `rule`). Additive; no row changes. **Apply to production before or with 02.** A 02 row on an old check fails the turn's one transaction (rj-w2c-child-history-unwritable), and the deploy gate (`migrationsGateFor`) refuses a commit whose migrations are not applied. | Applied to the Neon TEST branch on 2026-10-09 (statements only, not recorded in `schema_migrations`). The kit row `c4-maths-ch05-t01-m-bigger-denominator-bigger:primary (misconception_seen/kit_primary)` was inserted in round3-truth B on the patched server. | — |
| 01 | `server/director/classify.js` | A reply that is only a number (ASCII or Devanagari digits), not the key's value, is `incorrect` when the model abstains (`overridden: bare_wrong_number`, `offTopic` cleared). When both classifier deployments fail, code grades it `incorrect` (source `number`). Distress and stop flags always win. | `tests/round3-truth.test.mjs` (5 tests). Safety proof: `evals/grading-truth/round3/floor-safety.mjs`. | `TAXILA_NUMBER_FLOOR=off` |
| 02 | `server/director/state.js` | The kit remediation (`afterMiss` ×2, `trap`) and the P21 change of approach call `logReteach`. That builds a decision record (`comprehension/reteach.js directorReteachDecision`) and books it like `engineReteach`'s (`bookDirectorReteach`): `lastReteach` (the row), `armsUsed`, `lastArmBySkill`, `reteachCool = 2`, and an in-flight arm it pre-empts during its re-check counts as failed. | `tests/round3-truth.test.mjs` (2) and `tests/round3-truth-learner.test.mjs` (6). | `TAXILA_RETEACH_LOG=off` |
| 04 | `server/director/say.js` | `PRAISE_ANY_WIDE`: up to 8 words between "aapne/tumne/you" and "sahi/correct/right", plus more verb forms. Used for every verdict except a graded `partial`, which keeps the narrow form so the part that is right can be named. `stripPraise` uses the wide form. | `tests/round3-truth.test.mjs` (3). Existing praise tests unchanged: `lesson-truth`, `owner-truth-guards`, 33/33 on both trees. | — |
| 05 | `tests/round3-truth.test.mjs` (new) | Pins 01, 02 and 04. Needs 01-04. | 11/11 patched; 5/11 fail on HEAD, each on the fix it pins. | — |

**In the tree (owned paths, no patch):**

- `server/comprehension/reteach.js` and `index.js`: `directorReteachDecision`, `bookDirectorReteach`,
  `reteachLogOn`. Pure; used only by patch 02.
- `server/learner/live.js`: `CODE_SOURCES` adds `number` and `number_selfcorrect`. A by-value number verdict
  against the verified key is a **code** grade. Until now it was folded with the model's 0.7 confusion
  (`kt/outcomes.js`), dropped from θ (`kt/ability.js` "not_code"), and shown to parents as "AI-checked against
  the book's key idea" (`report/howweknow.js`).
  - Stored `kt_evidence` rows keep the grader they were written with. Replay is unchanged.
  - Not bumped: `PARAMS_VERSION`. That is the main loop's call.
- `tests/round3-truth-learner.test.mjs`: 6/6.
- `tests/prod/round3-truth.mjs`: the acceptance test, parts A, B and D.
- `tests/prod/owner-1-grading.mjs`: the V1.1 oracle and the place-value compare check.
- `tests/prod/w1c-three-day.mjs`: the +2-day child teaches back.
- `evals/grading-truth/round3/`: `floor-safety.mjs`, `human-pass.mjs`, `p1-candidate.mjs`.
- `docs/design/round3/truth/data/`: `human-pass.csv`, `human-pass.summary.json`,
  `kits-parts.p1-candidate.json`. **The candidate is not shipped.**

**Integrator notes.**

- **Beat type changes.** With 02, a kit re-teach carries `lastReteach.misId`, so `brain/beat.js` makes it a
  `contrast` beat. Studio's whiteboard intent then asks `contrast_misconception`, as for an engine re-teach of a
  confirmed misconception. Before, it was an `explain` beat.
- **Re-check cooldown.** With 02, a kit re-teach starts the 2-item re-check, so `engineReteach` waits for it.
- **No new runtime imports** outside `server/`. `tests/runtime-image-imports.test.mjs` is unaffected.
- **Patch 04 overlaps the conversation stream.** It touches `server/director/say.js` G-PRAISE only. If
  conversation also patches `PRAISE_ANY`, apply 04 first, then re-run `tests/round3-truth.test.mjs`.

## Before and after, same harness

### w1c-reteach

| tree / profile | runs | rows |
|---|---|---|
| production taxila.dev 145996f's predecessor 73a83de (2026-10-07) | 7/13 | 0 |
| HEAD, prod profile | 6/13, 6/13 | 0, 0 |
| HEAD, local profile | 13/13, 13/13 | |
| **patched, prod profile** | **12/13, 13/13, RUN3** | |

The one fail in the 12/13 run is the global "leftover @taxila.test guardians" counter, perturbed by concurrent runs.

On every patched run, s1 failed two arms, descended to `c4-maths-ch05-t01-s1`, was parked, and 2/2 attempts
resolved at the next start.

### round3-truth (new acceptance)

| tree / profile | run | result | detail |
|---|---|---|---|
| HEAD, prod profile | 2 | 9/11 | A2 FAIL (1 row for 2 re-teach moves); B1 FAIL (the kit re-teach after the misconception pick wrote no row) |
| HEAD, prod profile | 3 | 9/12 | A2 FAIL again (1 row / 2 moves); the kit path was not exercised; 2 infra fails (see below) |
| **patched, prod profile** | 2 | **11/11** | A2 2 rows + 1 descent / 3 moves; B1 kit row `misconception_seen/kit_primary` |
| **patched, prod profile** | 3 | **9/10** | A2 3/3 rows, including a `wheel_spin/rule` row from the change of approach; the only fail is the guardian counter |
| **patched, prod profile** | 4 | RUN4 | |
| **taxila.dev** (prod HEAD 145996f, API only, no DB) | | PROD_R3 | |

The infra fails in HEAD run 3: the guardian counter, and a cleanup refused with 409 `erase_review`.
**Safety finding, not this stream's to change:** the B child's typed misconception answer "1/3, because 3 is
bigger than 2" raised a `content_filter` safeguarding incident, then a `model_note` one, on the prod-profile HEAD
server (TEST account `prod-r3truth-b+179154589233356fc9b@taxila.test`, left for a human, unhandled by design).
It did not reproduce in 6 isolated `classify()` calls: that diagnostic is graded `exact` before any model call.
n=1.

### w1c-three-day (prod 21/23 on 2026-10-07)

| test | tree | result |
|---|---|---|
| old script | HEAD | run 1: every product check through +3 days passed, including "+2 days above shallow", then the server process was killed by an outside `pkill` (fetch failed). Run 2: 23/23. |
| new script | HEAD | 22/23 (the one fail is the guardian counter), THREEDAY2 |
| new script | patched | 23/23 |

**Why the old script fails intermittently** (local trace, n=1, local profile):

- The +2-day teach-back answer was only the topic's first expectation. It was graded `mid`, then `fail`.
- s1's U went 0.421 → 0.548, below U_FRAGILE 0.6.
- An offline fold of the same events gives 0.693 (fragile) without the failed teach-back and 0.868 with a
  passing one.
- So it depends on whether the teach-back grader passes a one-expectation fragment. The new script teaches back
  as the day-0 child does. That is a test fix, not a product change.

### owner-1 (V1.1 oracle, place-value compare)

OWNER1

### Grading truth at scale, with the shipped parts data

**Deterministic battery** (`evals/grading-truth/run.mjs --classes 1-9 --parts parts-labels-c1-9.json`, no
network). Seeds 7, 11 and 13, HEAD = patched, identical numbers on both trees: the patches touch only the model
leg.

| grader | n per seed | wrong grades |
|---|---|---|
| `classifyFast` | 89,560 | **10 / 9 / 9** |
| modules (frame, flat) | 436-446 | 0 |
| studio.v2 | 444-453 | 0 |
| placement | 1,734 | 0 |
| rKey | 436-470 | 0 |
| studio.w2h | 773-853 | **5 / 4 / 2** |

What the `classifyFast` wrong grades are:

- false credits of one part of a multi-part key that is an **unlabelled, disputed** acceptable entry: "More",
  "Grateful", "No", "9/16", "6, 1, 5, 2, 4, 3", "7 incorrect answers", "बाँधो";
- 1 bare number of a decisive key: "10," for "10, meaning one group of five…";
- 1 "false fail" whose truth is itself the weak kit-claim fallback: "₹40" graded partial on the two-question
  "40; ₹40" item.

The studio.w2h ones are the known `wrong-try:no-item-id` (V1-04 stamping).

**Cost of the open P1 rows.** These are acceptable entries both raters call NOT complete: truth "partial"
(`p1-candidate.mjs`, seed 13).

| data | `classifyFast` wrong grades | of which |
|---|---|---|
| HEAD + shipped data | **290** | **281** are P1 entries credited complete |
| HEAD + `kits-parts.p1-candidate.json` | 8 | — |

The candidate row is circular (the data and the truth come from the same raters). It only shows that the code
path works and that nothing else moves.

**Model leg on production's classifier.** `DEPLOY_CLASSIFY=grok-4-1-fast-non-reasoning`, hedge 1500, HEAD,
seed 13, n = 1,131 stratified deferred cases, 0 model errors, 0 HTTP 429. This was never measured before: round 2
measured taxila-fast.

| measure | value |
|---|---|
| wrong grades | **15 (1.3%)**: 14 false credits, 1 partial miss |
| proven-class wrong grades | **6**: negated key ×3, hint-as-answer ×3 |
| weak-truth (another item's key) | 3 |
| two-rater truth | 6 |
| abstain | 477 |
| right answers left uncredited | 36 / 306 |

**Patch 01 on the same labels (offline rescore).** 4 abstentions become `incorrect`, all with truth incorrect
("१" ×2 for 2/3, "−6" for 6, "३५" for 25 m). That is +4 right grades, 0 lost.

**Floor safety** (`floor-safety.mjs`, 1,103 number-key items, classes 1-9):

- 0 of 6,657 right surface forms are marked a bare wrong number;
- 3,309 of 3,309 near-miss wrong values are.

### The human pass (`docs/design/round3/truth/data/human-pass.csv`, 4,875 rows)

The rater disagreements still without a row number **4,290**: 3,029 acceptable-entry labels and 1,261 parts
counts, over 2,074 items. 667 of those items have no row at all. Every one of the 3,029 disputed entries is
credited **complete** today.

| priority | rows | what | the product today |
|---|---|---|---|
| P1 | 336 | both raters say not complete (partial vs wrong) | credits them complete |
| P2 | 2,527 | complete vs partial | credits them complete |
| P3 | 166 | complete vs wrong | credits them complete |
| P4 | 570 | parts disputed, no row | single-part |
| P5 | 113 | agreed labels that look wrong by a number check | as labelled |
| P6 | 71 | agreed wrong (the kit lists them as acceptable) | not credited |

P5 breaks down as:

- 66 "agreed partial, but the entry carries a number of every part". This is the brief's
  `c8-maths-ch01-t01-i07` "49, 1 left out", which is listed.
- 47 "agreed complete, but the entry carries none of a part's numbers".

**Third-family reads** (this stream, Claude: not a human, not labels):

- **P1:** 30 of 30 sampled rows read as not complete ("cow" for "name two animals", "6,245" for "is she
  right?", "बारिश" for "use a rain word in a sentence"…). So the P1 candidate is the high-confidence fix.
- **P5:** about 1-2 of 20 sampled number flags look mislabelled (for example "16 is 1 ten 6 ones, 60 is 6 tens").
  P5 is a queue, not a finding.

**Decision for the main loop and owner:** ship `kits-parts.p1-candidate.json` (P1 as partial) before the human
pass, or wait for it.

## Gates

- **Unit tests:**
  - `tests/round3-truth.test.mjs`: 11/11 on the patched tree.
  - `tests/round3-truth-learner.test.mjs`: 6/6 in the main tree.
  - `round2-truth`, `classify`, `safety-content-filter`, `comprehension-reteach`, `w2c-director`,
    `learner-live`, `lesson-truth`, `owner-truth-guards`: unchanged results on both trees.
- **Per-file suite**, scratch copies of HEAD and of the patched tree, 3 at a time, 300 s each: SUITE.
  The scratch copies lack `evals/` data, `models/` and `public/`, so some files fail identically on both; the
  integrator should run `npm test` once after applying.
- **tsc and vite build:** nothing under `src/` or `shared/` changed.
- **Persona invariants:** untouched.
