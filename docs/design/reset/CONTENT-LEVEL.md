# Content level: why a class-4 child was asked "how many faces does a dice have", and the fix

Stream E of the owner reset, 2026-10-04. This answers OWNER-RESET-2026-10-04 requirement 2 ("Wrong level ... questions must match
the selected class and the child's demonstrated level, NCERT/CBSE class 4-7 depth, adaptively"). Nodes: `owner-reset-2026-10-04`,
`owner-test-0-of-100-2026-10-04`. No product code was edited. Everything below can be re-run from `evals/content-level/`.

## 0. Summary

- **Where the dice question came from.** It is item `c4-maths-ch01-t01-i01` (`data/kits/c4-maths.json:143-162`, difficulty 1). It
  is the first item of the first topic of the first subject. Every new class-4 child gets it as **question 1** of lesson 1. Question 2
  is the diagnostic `c4-maths-ch01-t01-m-visible-only` (`data/kits/c4-maths.json:47`), which is another dice question. Reproduced
  with the real selection code (`evals/content-level/sample.mjs`). The topic itself is real class-4 content: Maths Mela ch.1 "Shapes
  Around Us" does teach faces, edges and corners. The question chosen to open it is a class-1 or class-2 question, and its own
  hint 2 gives the answer away (the blind solver noted this in `verified.note`, and nothing acted on it).
- **It is systemic, not one bad item.** Six mechanisms stack up, and each one pushes the first questions down (§2):
  1. Kit difficulty is relative to the topic. Every topic was written with a difficulty-1 entry rung.
  2. The practice queue serves the easiest item first.
  3. The queue cap cuts the hardest items.
  4. Topic choice always starts at chapter 1 of the book, maths first, even in October.
  5. There is no placement test. The decided onboarding CAT was never built.
  6. Adaptation inside a lesson only goes down ("an easier one"), never up.
- **Measured mismatch** (two raters, rubric fixed in advance; §1):

| class | bank, too easy, both raters agree (floor) | bank, judge GE ≤ C−2 (strict) | bank, judge "too easy" (ceiling) | **first item served, judge GE ≤ C−2** | first item served, judge "too easy" | too hard (bank, judge) |
|---|---|---|---|---|---|---|
| 4 | 12/60 (20%) | 15/60 (25%) | 26/60 (43%) | **26/75 (35%)** | 44/75 (59%) | 0/60 |
| 5 | 8/60 (13%) | 20/60 (33%) | 36/60 (60%) | **44/74 (59%)** | 61/74 (82%) | 1/60 |
| 6 | 4/60 (7%) | 18/60 (30%) | 21/60 (35%) | **50/112 (45%)** | 58/112 (52%) | 0/60 |
| 7 | 11/60 (18%) | 23/60 (38%) | 29/60 (48%) | **50/124 (40%)** | 73/124 (59%) | 0/60 |

  - In **every class the first item a child sees is easier than the bank average**. That is the queue mechanism, measured.
    Judge mean grade, bank vs first item served: c4 3.12 vs 2.93; c5 4.03 vs 3.22; c6 5.17 vs 4.58; c7 5.60 vs 5.49.
  - Too-hard items are almost absent: 32 of 5,076 across the whole class 4-7 bank (0.6%). The bank is skewed downward, not noisy.
  - **The owner's path.** The first item of each of the 30 class-4 maths topics: I rate 19/30 (63%) below class-4 demand; the judge
    rates 18/30.
  - The first item is a kit-difficulty-1 item in **318 of 385** class 4-7 topics (83%). 27 of 36 difficulty-1 bank items (75%) were
    judged too easy by at least one rater.
- **Full bank, every class 4-7 item (n = 5,076), judge GE ≤ C−2:** c4 17.4%, c5 30.0%, c6 26.3%, c7 26.9%. That is 1,294 items in
  the review queue. **The judge's precision on that list is 23/40 (58%, 95% CI about 41-73%)** when adjudicated against the 2025-26
  NCERT books. So expect about 750 (range about 530-940) items that genuinely need regenerating.
  - Language kits are far worse than content kits: c7-english 68%, c7-hindi 61%, c5-english 59%, c5-hindi 58%, against c7-science 8%
    and c4-maths 8% (§4).

## 1. Method (n, method, date: 2026-10-04)

- **Samples** (`evals/content-level/sample.mjs`, seed 20261004, read-only over `data/**` and the real selection code):
  - **Bank:** 60 items per class, stratified equally by subject (4×15 for classes 4-5 maths/evs/english/hindi; 5×12 for classes 6-7
    maths/science/english/hindi/sst).
  - **Served:** for every one of the 385 class 4-7 topics, the first 3 items of the real practice queue
    (`server/director/items.js buildPracticeQueue` over `server/content/kits.js kitFromFile`, no learner history). 1,155 items.
  - **Full:** all 5,076 normalised class 4-7 items (6 raw items are dropped by `normalizeKit`).
- **Rater 1, blind judge** (`evals/content-level/judge.mjs`): `taxila-brain` (gpt-5 family, Azure). It sees class, subject, NCERT
  book, chapter, topic outcome, question and key. It does not see kit difficulty, queue position or the other rater. Output: the
  class (1-10) whose NCERT exercises match the item's demand, plus a verdict. Strict metric: grade ≤ C−2.
  - Spend: about 0.71M tokens in and 0.44M out over all runs, about USD 5 at gpt-5 list price. The deployment's actual rate was not
    checked.
- **Rater 2:** Claude (this session) rated all 240 bank items blind to the judge (`out/rater-claude.json`), with the same rubric.
  - Agreement: 162/240, Cohen's κ = 0.32 (c4 0.49, c5 0.18, c6 0.23, c7 0.39).
  - The disagreement is one-sided. Every item I flagged, the judge also flagged; the judge flags many more. Most of the extra flags
    are literal-recall comprehension questions ("who were the two friends?"), which I counted as legitimate NCERT exercise shapes.
    So the table reports floor, strict and ceiling, not one number.
- **Judge biases found.** Both biases mean the judge does not replace a teacher pass.
  1. It anchors on the chapter: the dice item was "right, grade 4" because "requires knowing and counting all faces of a cube".
  2. It rates against the legacy CBSE syllabus: NCERT 2023 moved decimals, arithmetic expressions and cryptarithms into Ganita
     Prakash 7, and the judge rates them grade 5. 7 of the 17 false positives in the precision check were this.
- **Precision check:** 40 random full-bank flags (`out/precision-sample.json`), adjudicated in `out/precision-adjudication.json`.
- **Not measured:**
  - No human teacher rated anything. Both raters are models.
  - No child answered anything, so these are demand judgements, not P(correct).
  - The lexical near-duplicate check (`overlap.py`) is English-token only and finds few cross-class copies. Only `c6-maths-ch09-t01-i01`
    and `-i12` are verbatim copies of class-4 items. Shallowness comes from item shape, not copying.
- Re-run:
  ```
  node evals/content-level/sample.mjs
  node --env-file=.env.local evals/content-level/judge.mjs all|full
  node evals/content-level/score.mjs
  node evals/content-level/report.mjs
  ```

## 2. Root causes (file:line)

| # | cause | where | measured effect |
|---|---|---|---|
| R1 | **Kit difficulty has no grade anchor.** `difficulty: 1-5` is relative to the topic, and the generator wrote a difficulty-1 entry rung for every topic. `verified` checks the answer key only. The kit-workflow prompt is not in the repo; the mini-kit generator hard-codes "3 practice (difficulty 1-2)". | `data/kits/SCHEMA.md:24`; `server/content/minikit.js:67` | First item is difficulty 1 in 318/385 topics. 75% of difficulty-1 bank items judged too easy. All 5,082 class 4-7 items are `verified`. |
| R2 | **Easiest-first queue.** Skills in kit order, then items by ascending difficulty. The misconception diagnostic is spliced in second, so a topic opens with its two easiest prompts on one motif (dice, dice). | `server/director/items.js:154-162` (sort at `:158`, splice at `:161`) | The first item served is easier than the bank in all 4 classes (§0). |
| R3 | **The queue cap cuts the hard end.** `QUEUE_MAX = 12` is applied after the easiest-first sort. | `server/director/items.js:14`, `:162` | Only 221 of 420 difficulty-4+ items (53%) can ever be posed. In 83 of 385 topics the hardest skill never enters the queue. |
| R4 | **Topic placement starts at chapter 1, maths first, always.** It picks the first not-done topic in book order, and back-chaining only goes *down* to prerequisites. Nothing uses the child's school position: on 4 Oct a class-4 class is around chapter 6-8, not chapter 1. | `server/content/next-topic.js:39`, `:44-50`, `:75`; `server/content/curriculum.js:10` | Every new class 4-7 child starts at `cN-maths-ch01-t01`. For class 4 that is the dice. |
| R5 | **No placement test.** The decision `learner-ge-scale-one-cat` and the spec `docs/research/learner/onboarding-diagnostic.md` (OD1-OD12) were never built. Onboarding asks for the class and nothing else. The parent's "Where your child is starting" screen is a stub. The `diagnostic` lesson kind exists only in a schema. The CAT primitive has no caller, and the ability prior is opened without a placement. | `src/onboarding/Layout.tsx:14`; `src/onboarding/Setup.tsx:194-202`; `server/conductor/events.js:63`; `server/learner/kt/ability.js:260` (`gridPosterior`, 0 callers); `server/learner/kt/ledger.js:109` (`initialBase` with no `placement`) | No evidence of the child's level reaches item or topic choice before lesson 1. |
| R6 | **Adaptation only goes down.** There is an "an easier one" chip and an `easier` sort. Nothing serves "harder" or skips ahead (kt-algorithms §2.6 fast-forward is not built), and nothing tests the child out of a topic. θ is computed and written but never read by selection. | `server/director/state.js:684-687`, `:346`; `server/director/items.js:174-175`; `server/learner/kt/ledger.js:326` | A child who answers everything instantly still walks the whole easy-first queue. |
| R7 | **Language kits have no outcome anchor.** English and Hindi curriculum files are "titles" depth: chapter titles with no grade learning outcomes. Generated items fell back to literal recall, rhymes, opposites and spelling. | `data/curriculum/index.json` (`depth: "titles"` for english/hindi/sst) | Language kits reach 42-68% GE ≤ C−2 in classes 5-7, against 8-28% for maths and science. SST is also titles-depth but content-heavy, at 11%. |
| R8 | **The design prior starts low by intent.** The mixture prior (0.4 far-behind) and OD4 "teach at q30" place children below grade on purpose. The cost was meant to be recovered by fast-forward, which (R6) does not exist. | `server/learner/kt/ability.js:147-157`; onboarding-diagnostic OD4 | With no fast-forward, the downward placement becomes permanent. |

Solver notes saying a hint leaks the answer were ignored: 226 of 5,082 class 4-7 items have one, including the dice item.

## 3. Fix plan

The order is chosen so the owner's next test cannot reproduce the failure even before regeneration finishes.

### F0. Today, selection-only. No content changes; for the Wave 2 owner of `server/director/items.js` and `next-topic.js`.
1. **Do not open a topic with its easiest rung for an on-track child.**
   - Order the queue by target P(correct) (OD5: 0.85 for the first item, then 0.70 after a right answer and 0.80 after a wrong one)
     against the child's θ and an item `b`. Until F1 lands, use the interim proxy `b = classLevel − 1 + (difficulty − 3) × 0.5` GE.
   - Never pose an item with `ge ≤ C − 2` as item 1 or 2 unless the child has shown weakness on this topic or its prerequisite.
2. **Cap by skill coverage, not by position.** Fill the queue round-robin across skills so the hardest skill always enters (fixes
   R3). Then drop the easiest items first, not the hardest.
3. **Move the diagnostic to position 3+** and never put it on the same motif as item 1.
4. **Start where the school is.** Ask "which chapter is your class doing now?" (parent at onboarding; child can change it). Start
   topic placement there, back-chaining down only on evidence, not at `ch01-t01`.
5. **Fast-forward and "spicy".**
   - Two correct, unaided, fast answers on the first two items skip the rest of that skill's ≤ difficulty-2 items.
   - Three in a row move to the next skill.
   - Add a "harder one" chip symmetric to "an easier one" (OD12 "warm-up or spicy").
   - A topic test-out: 3 on-grade items all right means skills go to `practising` and the topic moves on.
6. **Acceptance:** replay a new class-4, -5, -6 and -7 child through `nextTopicFor` and the queue. None of their first 10 questions may
   have judged GE ≤ C−2, with a human spot check of the class-4 replay. Add this as `tests/prod/owner-content-level.mjs` under the
   reset's experience acceptance.

### F1. Re-level the bank (1-2 days of workflow, about USD 10-15 on Azure)
1. **Schema.** Add per item `ge` (the grade-equivalent on the `learner-ge-scale-one-cat` scale; class C starts at GE C−1) and
   `demand` (`recall|apply|reason|transfer`). Keep `difficulty` as the in-topic rung only. Record it in `data/kits/SCHEMA.md` and
   `shared/contracts.ts`.
2. **Calibration with judge rubric v2.** Two different model families as raters (gpt-5 plus a non-OpenAI Foundry model), then a
   human (owner or teacher) pass on every item where they disagree or flag GE ≤ C−2. The rubric must be given the 2025-26 NCERT
   chapter scope, which removes the legacy-syllabus bias, and must judge the question independent of the chapter title, which
   removes the chapter anchoring.
3. **Lint gate** in `scripts/lint-kits.mjs`. A class-C kit fails when any of these holds:
   - more than 10% of items have `ge ≤ C−2`;
   - any skill has fewer than 2 items at `ge ≥ C−0.5`;
   - a topic's first-served item has `ge ≤ C−1.5`;
   - an item still carries a hint-leak solver note.
4. **Language kits get outcomes first** (fixes R7). Add CBSE/NCERT learning outcomes per chapter for English and Hindi, classes 4-7
   (grammar targets, inference, writing formats, vocabulary in context). Then regenerate against them.

### F2. Placement test: build OD1-OD12 for B3-B4, ages 9-15
- **Session-1 shape:** a quick chat plus a warm-up round. Up to 8 maths items on the back-chain of the current school chapter, up to 4
  on-grade items on that chapter, and a 30 s reading probe at class−2 as in onboarding-diagnostic §4.2. The items come from the
  re-levelled bank (F1), because the CAT needs `ge`.
- **Write the result:** call `gridPosterior` and pass `placement` into `initialBase`.
- **Fill the parent summary screen** (`Setup.tsx:194`) and emit a `diagnostic` lesson kind.
- **Revisit OD4 "teach at q30" under the reset.** Start at q50 for children whose posterior is unimodal near grade. Keep q30 only
  when the far-behind component dominates. Make fast-forward (F0.5) mandatory, since it is what makes a low start recoverable.
- **Tone:** this must not feel like a test, and it must not look babyish (reset requirement 1). It is a game round for 9-15-year-olds.

### F3. Adaptive difficulty that keeps working after lesson 1
- θ by strand (already maintained in the ledger) drives item choice in every lesson, not only placement.
- The topic choice can move *up*: a topic whose skills test out is skipped, as in TaRL regrouping.
- Feed the kit-generation queue from evidence. A child at P(correct) > 0.9 across a topic triggers Forge or kit isomorphs at
  `ge ≥ C` ("spicy") rather than more of the same.
- Measure on real sessions: experienced P(correct) target band 0.65-0.85, first-item P(correct) for on-track children, and the
  M-OD-10 reversal check ("first-lesson foundation items with P > 0.9 for more than 40% of children means placement is too
  conservative").

## 4. Kits and items to regenerate or drop

The full per-item list, with judge grade and reason, is `evals/content-level/out/regenerate.json` (1,294 items, judge GE ≤ C−2).
**It is a review queue.** Judge precision was 58%, and class-7 maths flags are mostly NCERT-2023 syllabus shifts, so adjudicate
before regenerating.

**Drop now** (no review needed):
- `c4-maths-ch01-t01-i01`, the dice queue head. Hint 2 also leaks the answer.
- `c6-maths-ch09-t01-i01` and `c6-maths-ch09-t01-i12`, verbatim copies of `c4-maths-ch11-t01-i02` and `c4-maths-ch11-t01-i13`.

**Rewrite at class level:** the diagnostic `c4-maths-ch01-t01-m-visible-only` (dice picture). Use a cuboid net or hidden-face
reasoning instead, which is class-4 work.

**Regenerate whole kit, after the outcome anchors (F1.4) exist**

| kit | n | judge GE ≤ C−2 | judge mean grade |
|---|---|---|---|
| c7-english | 187 | 68.4% | 4.76 |
| c7-hindi | 124 | 61.3% | 5.06 |
| c5-english | 126 | 58.7% | 3.26 |
| c5-hindi | 158 | 57.6% | 3.40 |
| c6-hindi | 172 | 45.3% | 4.59 |
| c6-english | 248 | 41.9% | 4.63 |
| c4-english | 155 | 33.5% | 3.01 |
| c4-hindi | 182 | 29.7% | 3.09 |

**Regenerate topics with ≥ 50% flagged** (after adjudicating for syllabus shift):

- **c6-maths:** `ch03-t01`, `ch03-t02`, `ch03-t04`, `ch04-t01` (11/13: tally and frequency at class-2 numbers), `ch04-t02`, `ch04-t03`,
  `ch06-t01`, `ch07-t01`, `ch08-t02`.
- **c7-maths:** `ch01-t03`, `ch06-t01`, `ch06-t02`, `ch06-t04`, `ch08-t03`, `ch13-t01`.
  - Review `ch02-t01` and `ch03-t01`/`-t03`/`-t04` before acting: 13/13 are flagged, but Ganita Prakash 7 opens decimals and
    expressions at this level. Keep the topic and re-level the entry items only.
- **c5-maths:** `ch12-t02`.
- **c5-evs:** `ch04-t02` (11/13).
- **c6-science:** `ch06-t02`.
- **c7-science:** `ch06-t02`.
- **c6-sst:** `ch09-t01`.

**Re-level the entry rung in every class 4-7 maths, science, EVS and SST topic.** The first two items of the 385 topics are the most
over-exposed items in the product: the served sample shows 35-59% of them at GE ≤ C−2. Replace each difficulty-1 opener with an
on-grade "gentle first step" that needs the class-C idea.

**Too hard: review, don't drop** (32 items, in `regenerate.json` `hard`). Examples:
- c4-evs buoyancy of a clay boat (`c4-evs-ch07-t01-i10`, `-i13`);
- c4-evs Moon phases (`ch10-t02-i06`, `-i12`);
- c5-maths truncated-axis graphs (`ch15-t02-i05`, `-i06`, `-i10`).

These may be fine as `spicy` far-transfer items once `ge` exists. They must never be served as openers.

## 5. What would change these conclusions
- A human teacher rating the 240-item bank sample with this rubric gives a floor-to-ceiling band that excludes these rates. That would
  re-anchor every number in §0.
- Real children's first-item P(correct) on class-C topics is ≤ 0.85 for on-track children. That would mean the openers are
  appropriately gentle and the problem is only presentation. This has not been measured: no child data was used.
