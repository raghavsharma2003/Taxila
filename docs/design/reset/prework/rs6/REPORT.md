# RS6 pre-work report (2026-10-05)

## RS-6 pre-work: content re-levelling and placement

**Bottom line:** the F0 patch stops the owner's dice opener even before any data changes. With the re-levelled overlay merged, the share of first questions two or more classes too easy fell from 44% to 30%. That 30% comes from the original v1 judge, which took no part in choosing items. It is still above RS-6's target of 0 in the first 10.

Nothing was committed and no existing file was modified. All gates pass. Azure spend was **USD 14.27 of the USD 15 cap**.

**REPORT.md was not written.** The harness blocked report files for subagents, so its content is in this message: please save it to `docs/design/reset/prework/rs6/REPORT.md`. The inbox file `context/inbox/prework-rs6.json` was written and parses.

### Files created
- **Placement code:** `server/placement/{grade.js, bank.js, cat.js, session.js, index.js}`
  - grade.js grades answers by code only: Indian digit grouping, units, fractions, mixed numbers, English and Hindi number words, and choices by text, letter, index or tap.
  - cat.js is the adaptive test. It uses `gridPosterior` from `server/learner/kt/ability.js`, imported as a library only. It starts mid-class, moves up and down, has skip-ahead probes, and returns a result that `initialBase({ placement })` can take.
  - session.js is a serialisable state machine (`startPlacement`, `answerPlacement`). The item sent to the client never contains the answer.
- **Placement items:** `data/placement/c{3..8}-{maths,evs,science}.json` plus a README.
  - 456 items, of which 426 are usable. All are numeric or 4-option choice.
  - 451 keys were confirmed by a blind solver from another model family. For the 5 disagreements I checked the keys myself and all 5 were correct; they are marked as a model's check, not a human's.
  - 30 items are excluded because both raters put them more than one class away from their target level.
- **Re-levelled overlay:** `data/kits-relevel/c{4..7}-*.json` covering all 385 class 4-7 topics, plus `merge.mjs` and a README.
  - Each topic has 2 openers, 3 to 6 harder items, and 3 extra on-grade items in 38 repaired topics.
  - Every new item has a grade level set by two raters (`ge`).
  - It also adds a measured `ge` for the old opening items, 50 hint fixes, drops the dice item and the two class-6 copies of class-4 items, and rewrites the dice-picture diagnostic (a cuboid box with hidden faces).
- **Rubric and harness:** `evals/content-level-v2/**`
  - `rubric-v2.mjs` is frozen by hash.
  - `judge.mjs` and `score.mjs` run two raters from different families (`taxila-gpt6` and `DeepSeek-V4-Pro`) and report kappa and too-easy rates.
  - `crosscheck-v1.mjs` re-runs the original v1 judge, with the rubric pinned to the original file.
  - Also: `relevel/gen.mjs`, `placement/gen.mjs`, `solve.mjs`, `calibrate.mjs`, `served.mjs`, `placement/simulate.mjs`, `lib/f0-sandbox.mjs`, and 28 tests in `tests/*.test.mjs`.
- **Patches:** `docs/design/reset/prework/rs6/patches/`
  - `01-content-f0.patch`: the F0 change to `server/director/items.js` and `server/content/next-topic.js`.
  - `02-kits-ge.patch`: lets `server/content/kits.js` keep the `ge` and `demand` fields.
  - `03-routes-placement.js`: a proposed new `server/routes/placement.js`.
  - `04-migration-placement.sql`: a `placement` table and `child.school_chapter`.
  - `05-contracts-and-schema.md`: additions for `shared/contracts.ts` and `data/kits/SCHEMA.md`.
  - `README.md`: where each patch applies and in what order.
- **Inbox:** `context/inbox/prework-rs6.json` with 4 decisions (each with a reversal condition), 5 measurements and 3 rejections.

### What F0 does (patch 01, flag `TAXILA_CONTENT_F0`, on by default)
- **First two questions:**
  - picked by expected success (target 0.85, then 0.75);
  - never an item two or more classes below unless the child is weak on this topic;
  - items with a measured level are preferred over the old difficulty guess;
  - both must be at least start-of-class level;
  - neither may be the topic's hardest level when easier openers exist, so "harder one" has somewhere to go.
- **Diagnostic** goes third or later, never on the same theme as item 1.
- **Queue cap** keeps every skill and drops the easiest items first.
- **New helpers:**
  - `harderThan` for the "harder one" chip; it returns nothing at the top rather than stepping down.
  - `fastForwardSkips` and `testedOut`.
- **Topic start** uses the school's current chapter, else the placement result, else the calendar. A new class-4 child on 4 Oct starts around chapter 7 of 14, not chapter 1.
- `TAXILA_CONTENT_F0=off` restores the old behaviour exactly; a test checks this.
- Patch 01 alone already keeps the dice question out of positions 1 and 2.

### Gates (2026-10-05)
- `node --test evals/content-level-v2/tests/*.test.mjs`: **28/28 pass** (F0 11, merged kits 6, placement 11).
- The F0 tests apply patches 01 and 02 to a temp copy of just those files, not the working tree.
- Patches 01 and 02 dry-run clean against the working tree.
- `npx tsc -b`: exit 0.
- `npx vite build`: exit 0, printing a manifest warning that predates RS-6. Nothing failed, so nothing needed blaming on Wave 2.

### Measured numbers (2026-10-04/05)
**Rubric v2 against v1, on v1's 240-item sample:**

| | too easy | rater agreement (kappa) |
|---|---|---|
| v1 judge | 76/240 | 0.45 (judge vs Claude) |
| v2, both raters agree | 13/240 | 0.57 |
| v2, either rater | 30/240 | |

**Rubric v2 precision on v1's 40 flags checked against NCERT:**
- 6/8 for each rater, and 4/5 when both agree (95% CI 0.38-0.96).
- Recall is only 26%.
- **The RS-6 bar of 90% precision is not met.** Rubric v2 is a better agreement tool, not a reliable gate on its own.

**First question served, all 385 topics, judged by the original v1 judge:**

| class | old | new |
|---|---|---|
| 4 | 35% | 21% |
| 5 | 59% | 34% |
| 6 | 45% | 37% |
| 7 | 40% | 28% |
| all | 44% | **30%** |

- The second question is too easy 23% of the time.
- The "old" row reproduces CONTENT-LEVEL's figures exactly, which confirms the replay is faithful.
- The v2 raters show 19% falling to 1% for questions 1-2. That is partly true by construction, because the same raters set the levels. The 30% is the honest number.

**Re-levelled items:**
- 2,072 generated; the blind solver agreed on 1,894 (91%).
- The "gentle first step" openers came out easier than the old openers in 5 of 6 subjects:

| subject | old openers too easy | new openers too easy |
|---|---|---|
| English | 44% | 63% |
| Hindi | 28% | 64% |
| EVS | 10% | 24% |
| SST | 9% | 21% |
| Science | 4% | 9% |
| Maths | 18% | 12% |

- Selecting by measured level is what made the merge work; harder items often became the openers. This is logged as a rejection.
- 1,586 items were merged.
- An end-of-class item exists in 380 of 385 topics. The 5 gaps are all language topics.
- The "harder one" chip goes strictly above question 1 in 323 of 385 topics. In the rest, question 1 is already the topic's top level.

**My spot check of the 60 class-4 maths opening questions (I am a model, not a human):**
- None is at the dice level.
- About 5 are one class below, for example "how many grams make 1 kg" and "how many ml make 1 litre".

**Placement, simulation only (no child answered anything):** 100 runs for each of 56 class and ability combinations, two response models.
- The shipped selection rule ("target"):
  - error is 0.61 grade levels under the test's own model and 0.78 under a deliberately wrong one;
  - it uses 10.5 questions on average;
  - it moves down for 98% of children two or more classes behind, and up for 95% of children ahead.
- The alternative ("blend") has error 0.58 but only moves down for 76% of children who are behind.
- Weak spots:
  - children three classes behind are overestimated by about 0.6 grade levels;
  - 21% of on-track children get flagged for skip-ahead.

**Spend:** re-level generation 6.94, placement generation 0.76, blind solving 0.65, v2 rating 4.77, v1 cross-check 1.15. Total **USD 14.27**, logged in `evals/content-level-v2/out/spend.jsonl`.

### What is left
1. A human pass over every item where the raters disagree or either rater says too easy, the 5 language gaps, and the 30 excluded placement items.
2. Reaching 90% precision needs a teacher-rated anchor set or a third rater.
3. The 30% first-question rate under the v1 judge needs one of these, each followed by a re-run of `crosscheck-v1.mjs`:
   - raise `OPEN_FLOOR_OFFSET` to +0.25;
   - keep old items without a measured level out of positions 1-2;
   - rate all 5,076 old items under v2, about USD 3.5.
4. English and Hindi need learning outcomes before those kits are regenerated.
5. Not built here:
   - the 30-second reading probe;
   - the placement round rendered as a Studio game (RS-4);
   - the onboarding chapter question and parent summary (RS-2);
   - wiring fast-forward, the harder chip and test-out into `state.js` (RS-5);
   - F3 adaptation in every lesson;
   - real-child success rates, which are the real test of all of this.

### Merge notes
1. Apply `01-content-f0.patch`, then `02-kits-ge.patch`. Patch 01 is safe to land on day 0 by itself: it is selection-only, flagged and tested.
2. Run `node data/kits-relevel/merge.mjs --out data/kits` **only after the human pass**.
3. Copy `04-migration-placement.sql` to `db/migrations/0NN_placement.sql` and run `node scripts/migrate.mjs`.
4. Copy `03-routes-placement.js` to `server/routes/placement.js` and register it in `router.js`.
5. Calls the other streams need to add are listed in `patches/README.md`:
   - **RS-5:** `selectNext({ harder })`, `fastForwardSkips`, `testedOut`.
   - **RS-2:** store `school_chapter` and show the placement summary to the parent.
   - **Learner ledger:** pass `initialBase({ placement })`.
6. Move the three test files into `tests/` so `npm test` runs them.

## Review (PASS after fixes. Two placement problems were blockers and are now fixed, both in RS-6's own new paths: the grader marked some correct answers wrong and gave credit for hedged guesses, and a retried answer crashed the round with a 500. The build report's numbers re-ran identically. Nothing was committed.)

## Review of RS-6 (adversarial, 2026-10-05)

**Verdict: pass after fixes.** I fixed two blockers in RS-6's new placement files. Everything else in the build report checked out when I re-ran it.

### Checks I re-ran myself
- **Only new paths touched.** Nothing RS-6 needed to leave alone is modified: `server/director/items.js`, `server/content/next-topic.js`, `server/content/kits.js`, the router and the migrations are unchanged. The other modified files in `git status` (`shared/contracts.ts`, `db/migrations/README.md`, `tests/*`) contain no placement, `ge` or `school_chapter` content, so they come from Wave 2.
- **Patches.** `git apply --check` is clean for 01 and 02 against the working tree.
- **Tests.** `node --test evals/content-level-v2/tests/*.test.mjs` was 28/28 before my changes and is 31/31 after (3 review tests added).
- **First-question numbers.** `served.mjs both` reproduced `served-old.json` and `served-new.json` byte for byte. `out/crosscheck-v1-table.json` gives the reported figures exactly:

  | class | old | new |
  |---|---|---|
  | 4 | 26/75 | 16/75 |
  | 5 | 44/74 | 25/74 |
  | 6 | 50/112 | 41/112 |
  | 7 | 50/124 | 35/124 |
  | all | 170/385 (44%) | 117/385 (30%) |

  Question 2 is too easy in 87/385 (23%).
- **Placement simulation.** `placement/simulate.mjs --select target --n 100` reproduced its output byte for byte: 5,600 runs, error 0.61 under the test's own model and 0.78 under the wrong one, 10.5 questions on average.
- **Spend.** `spend.jsonl` sums to USD 14.27, under the USD 15 cap.
- **Safety floor.** Untouched. A word scan of the new content found only curriculum context (food webs, soldiers' remembrance, "gun" as Hindi for properties).
- **Gates.** `npx tsc -b` exit 0. `npx vite build` exit 0, with only the art-manifest warnings that were already there.

### What I fixed
**1. The placement grader marked children wrongly** (`server/placement/grade.js`). I tested each case before fixing it:
- Typing the correct option's own words, "a rectangle", was read as option A and marked wrong. Same for any option starting with "a ", "b ", "c " or "d "; 22 bank items have such options.
- Typing "3" on a choice whose options are numbers was read as the third option.
- Hedges like "1/2 or 3/4" and "12 or 13" got credit.
- "i do not know" was read as 2 (Hindi "do") and got credit.
- "two thousand" was read as 2.
- The options "10%" and "10" became identical once punctuation was stripped.

The grader now matches the option's exact words first. It treats a letter or index as a choice only when that is all the child typed. Any second number or a hedge word makes the answer unclear (no credit), refusal words stop number-word parsing, and it understands thousand, hazaar and lakh. The "I don't know" check is now shared with `session.js`. A new test confirms that all 426 usable bank items grade their own key as correct, and grade every option correctly whether the child types the words, taps it or types its letter.

**2. Bad input could crash a round** (`server/placement/session.js`).
- Resending the answer just graded (a double tap or network retry) used to throw, which becomes a 500. It now simply returns the current item again.
- Any other out-of-date item id throws with code `PLACEMENT_STALE`.
- An item removed from the bank mid-round is recorded as no evidence instead of crashing.
- Answers are capped at 200 characters, objects that are not a tap are ignored, and a non-number `ms` is dropped.

**3. Proposed route** (`patches/03-routes-placement.js`).
- Class 1-2 children get `{skip:true}` instead of an error.
- A malformed `placementId` returns 404 instead of a Postgres 500.
- An out-of-date item returns 409 with the current item so the app can show it again, and a retried answer returns 200.
- The response shapes are documented in `05-contracts-and-schema.md`.

**4. Inbox** (`context/inbox/prework-rs6.json`). I added two rejections with edges, one for the grader bug and one for the crash.

### Remaining risks (not blockers)
- **First question still too easy in 30% of topics** by the independent v1 judge, against a target of 0. Some examples are plain quiz items, such as class 5 "36 × 100 = ?" and "Is it the national anthem or national song?". A human pass is still needed before running `merge.mjs --out data/kits`.
- **Rubric v2 precision** is 4/5 when both raters agree (95% CI 0.38-0.96), with recall at 26%. It is an agreement tool, not a gate.
- **Placement level label is often wrong.** The "behind / on track / ahead" label is right only 77% of the time under the test's own model and 70% under the wrong one, falling to 51% for children one class ahead. The build report left this out. Children three classes behind are overestimated by about 0.6 to 0.8 grade levels, and 21% of on-track children get flagged for skip-ahead.
- **The "weak" exception does nothing yet.** `weak` is never passed by `state.js` or `forge/index.js`, so a struggling child cannot get below-floor openers until RS-5 wires it.
- **"Harder one" chip** (`harderThan` in patch 01) can serve an `error_spot` item and skip its usual readiness check. I did not edit this because changing the patch hunks by hand risked breaking them.
- **Existing children will jump ahead.** The calendar start also applies to children already using the app, so a class-4 child partway through will jump to about chapter 7.
- **REPORT.md is still missing.** Neither RS-6 nor I could write it (subagent rule). The main loop needs to save the build report's text to `docs/design/reset/prework/rs6/REPORT.md`.

### Files changed in this review
- `/home/user/Taxila/server/placement/grade.js`
- `/home/user/Taxila/server/placement/session.js`
- `/home/user/Taxila/evals/content-level-v2/tests/placement.test.mjs`
- `/home/user/Taxila/docs/design/reset/prework/rs6/patches/03-routes-placement.js`
- `/home/user/Taxila/docs/design/reset/prework/rs6/patches/05-contracts-and-schema.md`
- `/home/user/Taxila/context/inbox/prework-rs6.json`

### Merge notes
The merge order in `patches/README.md` still holds: 01, then 02, then `merge.mjs` only after the human pass, then the migration and route. Also move the three test files into `tests/`; the placement test file now holds the 3 review tests too.
