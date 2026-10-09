# round3 truth: research, then the design

Stream "truth", round 3, 2026-10-09. Owner directive for the round: a two-way teacher whose loop holds
together, and no lying. This stream covers V1, "knowing whether the child learnt it", in four parts:

1. **The re-teach record.** On production, re-teaches happen but none is written. w1c-reteach scored 7/13 on
   2026-10-07, and `reteach_attempts` had 0 rows.
2. **Grading truth with the kit answer-part data in place.** The data shipped on 2026-10-09.
3. **The next-day check and an unverifiable engine.** w1c-three-day scored 21/23, and owner-1 could not
   verify place-value@1.
4. **Praise before a verdict.** owner-1 on 2026-10-09 caught it on `c5-maths-ch07-t02-i06`.

The research comes first. The design follows, then what was rejected. Every number below was measured in this
stream; the numbers sit in APPLY.md, with their n, method and place.

---

## 1. What the best systems do, and what transfers

### 1.1 Logging a decision where it is acted on (the re-teach record)

**Microsoft's Decision Service** (Agarwal et al., *Making Contextual Decisions with Low Technical Debt*,
arXiv 1606.03966, 2016) is the reference design for a learning loop that chooses actions, like our re-teach
bandit. Its loop has four steps: explore, log, learn, deploy. The paper's failure (F2) is "incorrect data
collection".

- In complex pipelines, it is common to log "not the action chosen by the ML algorithm, but the outcome at
  the end of the pipeline".
- An override path then acts, and the action actually taken is logged wrongly or not at all. The paper's
  example is editorial locking on MSN.
- They simulated this by overriding 10% of the training actions, and policy evaluation went wrong.

Their fix is a rule: the action actually taken is logged **at the point of decision**, by the same code that
takes it, and the reward is joined to it later.

**What transfers.** Our Director has three re-teach paths:

| path | where | chosen by the engine? |
|---|---|---|
| `engineReteach` | `selectReteach` | yes |
| the kit's once-per-misconception remediation | `afterMiss`, `trap` | no |
| the P21 change-of-approach fallback | `afterMiss` | no |

Only the engine path set `lastReteach`, and `brain/turn.js` writes the row from `lastReteach`. So the other
two paths acted without being logged. That is exactly failure F2. It has four consequences:

- No row is written.
- Nothing resolves at the next lesson start.
- The kit's arm is never excluded. `selectReteach` step 6 gives the first re-teach of a confirmed
  misconception to the kit's primary arm, so a child could be given the identical re-teach twice in one
  lesson.
- No re-check cooldown follows. The spec (§5.4) and the rejection `reteach-without-cooldown` both require
  one.

**Mastery systems log every hint and every attempt as an event.** ASSISTments and the Cognitive Tutor family
do this, and partial-credit knowledge tracing is built on those logs (Wang & Heffernan, AIED 2013,
*Extending Knowledge Tracing to Allow Partial Credit*). The record is complete because there is no second,
unlogged path to the student.

### 1.2 Code decides when code can decide (the bare wrong number)

**STACK** (Sangwin; the Moodle maths question type) grades by checking properties of the answer in code. A CAS
answer test feeds a *potential response tree*, and feedback and partial credit come from which properties
held. A model is never asked whether 999 equals 1/4.

**ASSISTments, WeBWorK and Khan Academy's numeric inputs** all compare values the same way.

**VALUES-100 V1.1** already says this for the lesson grader: "a key that IS a number is graded by value in code".
But that rule only covered **credit**. A wrong number went to the model so that the model could name a
misconception (for example, "1/3" for "1/4" is the count-the-marks error). When the model **abstained**, the
child's wrong answer earned nothing.

The production classifier is `grok-4-1-fast-non-reasoning` (`scripts/deploy-azure.mjs` sets
`DEPLOY_CLASSIFY`). It reads a repeated "999" as off-topic or unclear far more often than `taxila-fast`, which
local runs used. The cost of that abstention:

- the hint ladder did not move;
- the card cap "left" the item instead of asserting it;
- the two-fails-past-rung-3 trigger never accrued;
- so the engine never re-taught.

**What transfers.** The model may still **refine** a wrong number into a misconception. It may never turn a
reply that is only a number, and not the key's value, into "no evidence". The same holds in an outage: a 429
on both classifier deployments no longer costs a bare wrong number its grade.

### 1.3 Multi-part answers and partial credit

**SemEval-2013 Task 7** (Dzikovska et al., *The Joint Student Response Analysis and 8th Recognizing Textual
Entailment Challenge*) labels student answers five ways, including *partially_correct_incomplete*. That label
exists because human graders needed it for answers that are right but miss a required part.

**AutoTutor** (Graesser et al.) grades an answer against a list of *expectations*, one by one, so "which parts
are present" is a separate judgement from "is it right". Our parts data follows that design. In
`classify.js`, the model reports `parts_present`, and code decides.

**How much raters agree.**

- Human graders of short answers often agree only modestly. One two-annotator study reports κ 0.295.
- In the SteLLA biology study, model-to-human agreement was κ ≈ 0.67, against 0.83 between humans.
- Our two model raters (gpt-5.6-terra and DeepSeek-V4-Pro) reached κ 0.51 to 0.63 on acceptable entries.

**How to use an LLM evaluator.** *Who Validates the Validators?* (Shankar et al., UIST 2024) argues that an
LLM-made evaluator must be aligned with human grades on a sample. It also finds that the criteria themselves
drift while humans read outputs. The design consequence is to put the disagreements in front of a human,
grouped by the criterion they turn on, rather than letting a third model decide.

**What transfers.** The shipped data holds agreed labels only. Every disputed acceptable entry is still
credited as complete, because an entry with no row falls back to the kit's claim. So the human pass has to
start where today's grade is most likely wrong: entries that **both** raters call not complete (P1 in the list).
Next come entries one rater calls partial (P2), then entries one rater calls wrong (P3), then disputed parts
counts (P4). Code checks for agreed labels that look wrong (P5) are low-precision queues for the human, not
findings.

### 1.4 Retention, explanation and what "above shallow" needs

- **Learning is not the same as performance** (Soderstrom & Bjork 2015). Good performance during the lesson
  does not show learning; a later check does. That is V1.3 (a delayed check on a new item).
- **The testing effect** (Roediger & Karpicke 2006): retrieval is itself learning.
- **Self-explanation** (Chi et al. 1989, 1994) is the evidence for understanding, as opposed to doing.

The comprehension ladder encodes this:

- "shallow" means "does it, has not explained it": U < U_FRAGILE (0.6).
- An explanation that fails is negative U evidence.

**What this means for w1c-three-day.** Its +2-day child "gives reasons", but at the teach-back it said only
the topic's first expectation. The grader rightly failed that. An offline fold of the same events reproduces
the live numbers exactly:

| events at +2 days | U | state |
|---|---|---|
| a passing why | 0.693 | fragile |
| a passing why, then a passing teach-back | 0.868 | fragile |
| a passing why, then the fragment teach-back (the scripted child) | 0.548 | shallow |

So the product applied its rule. The test's child failed its own teach-back, so the test is what needed fixing.

### 1.5 Feedback that agrees with the grade

- **Feedback level matters** (Hattie & Timperley 2007). Feedback about the task and the process helps.
  Praise of the self is the weakest kind.
- **Feedback can hurt** (Kluger & DeNisi 1996). In about a third of the studies, feedback lowered performance.
- **Inflated praise hurts children** (Brummelman et al. 2014). Children with low self-esteem avoided
  challenges after it.
- **Elaborated feedback beats bare verdicts** (Shute 2008). Feedback that says which part is right and what is
  missing works better.
- **LLM tutors get feedback wrong.** In MathDial's human evaluation (Macina et al., Findings of EMNLP 2023),
  ChatGPT as a tutor gave incorrect feedback in 59% of cases and revealed the solution in 66%.
- **Verify first, then write.** Daheim et al. (EMNLP 2024, *Stepwise Verification and Remediation of Student
  Reasoning Errors with LLM Tutors*) check the student's work with a verifier before the tutor model writes.
  That gave more correct, less hallucinated feedback.

**What transfers.** The verdict comes first and is decided in code. The words must agree with it, and a
predicate checks that they do (G-PRAISE-1).

The owner-1 failure was a re-ask with **no** verdict. It went out as "Aapne Pattern A ka niyam sahi pehchaana",
and the predicate missed it because it allowed at most 3 words between "aapne" and "sahi". The fix widens that
window for every verdict except a **graded partial**. On a partial, naming the part that is right ("A's rule is
right; now B?") is exactly the elaborated feedback the research supports, so it stays allowed.

### 1.6 Test oracles

*The Oracle Problem in Software Testing: A Survey* (Barr et al., IEEE TSE 2015) makes the point that a test is
only as good as its oracle, and an oracle must not share the system's mistakes. That applies twice here.

**owner-1's typed-answer oracle**

- It took a "partial" answer from a split of the key on commas and "and". That is the rejected
  `v1-rj-multipartkey-punctuation`, which read 97% of agreed single-part keys as multi-part.
- It treated every acceptable entry as complete, which V1.1 contradicts.
- **Fix:** the oracle now follows the answer-part data. Disputed items are reported, never scored on an
  unknown truth.

**place-value@1 compare commits**

- These carry `{chosen, a, b, question}`, so the truth is first principles, as it already was for fraction
  compares.
- The harness read only `value`-like fields, so place-value could never be verified.

---

## 2. The design chosen

| # | change | where | why |
|---|---|---|---|
| 01 | **The bare-wrong-number floor.** A reply that is only a number (ASCII or Devanagari digits), and not the key's value, is `incorrect` when the model abstains. It is also `incorrect` from code when both classifier deployments fail. Switch: `TAXILA_NUMBER_FLOOR=off`. | `server/director/classify.js` (patch) | §1.2. Root cause of the production regression. Proven unable to fail a right form: 0 of 6,657 right surface forms over 1,103 number-key items flagged (`evals/grading-truth/round3/floor-safety.mjs`). |
| 02 | **Every Director re-teach is one logged decision.** The kit's remediation and the P21 change of approach get a decision record shaped like `selectReteach`'s, booked the same way: the row, resolution, arm excluded, re-check cooldown. They also obey the engine's own rules: never the same arm twice in a lesson, and no change of approach inside a running re-check. Logging the decisions exposed both repeats. Switch: `TAXILA_RETEACH_LOG=off`. | `server/director/state.js` (patch); helpers in `server/comprehension/reteach.js` (owned) | §1.1. The record was incomplete by construction, and arms repeated. |
| 03 | **Migration 023** widens two checks: trigger `misconception_seen` and chosen_by `rule`. | `db/migrations` (patch) | A Director decision must log what actually triggered it. Calling one classified answer a "confirmed misconception" would be false data. |
| 04 | **No praise before a verdict.** Wide window for every verdict but a graded partial. | `server/director/say.js` (patch) | §1.5. The owner-1 failure. |
| 05 | Unit tests for 01-04. | `tests/round3-truth.test.mjs` (patch: it needs 01-04) | |
| 06 | round2-truth's options-item fixture. Its only re-teach on a diagnostic was the kit path repeating the engine's kit arm (6/6 seeds). It now checks the rule on the same diagnostic with no arm used. | `tests/round2-truth.test.mjs` (patch) | |
| 07 | The reteach_attempts static checks also read `director/state.js`, and a new trigger check reads both files against the migrations. | `tests/comprehension-reteach.test.mjs` (patch) | |
| — | **A number graded by value is a code grade.** `CODE_SOURCES` gains `number` and `number_selfcorrect`. | `server/learner/live.js` (owned) | Until now such answers were folded with the model's 0.7 confusion, dropped from θ, and shown to parents as "AI-checked against the book's key idea" although no model read them. |
| — | **Adjudicated parts decide a half answer.** On an item with a parts row, a model `incorrect` / `partial` on the key's own words that carries some parts, and not all, is `partial` in code. Without a row, the old rule stands: no evidence. | `server/grading/corroborate.js` (owned) | §1.3. On the same grok labels, 78 partial answers are graded partial instead of re-asked, and there are 0 new wrong grades. |
| — | **owner-1 follows V1.1**, and checks place-value compares from first principles. It also reads a pv.write commit's entry, not its target. | `tests/prod/owner-1-grading.mjs` (owned) | §1.6 |
| — | **w1c-three-day's +2-day child teaches back**, as its day-0 child does. | `tests/prod/w1c-three-day.mjs` (owned) | §1.4 |
| — | **The human-pass list** (P1-P6, 3,783 rows), plus a P1 candidate data file (not shipped). | `evals/grading-truth/round3/`, `docs/design/round3/truth/data/` | §1.3 |

## 3. What was rejected, and why

- **Giving w1c-reteach's child "realistic" wrong answers instead of "999".** That would have hidden the product
  defect, because a bare wrong number earned no evidence. The test child stays the same. `round3-truth` adds
  checks on top of it.
- **Pinning `DEPLOY_CLASSIFY` back to `taxila-fast` on production.** The classifier choice was measured for
  other properties: grok scored 38/40 on the real `classify()` and is faster. The defect was that code handed a
  verdict it can decide by value to a model.
- **Logging the kit path as `misconception_confirmed` to avoid a migration.** That writes a false trigger. The
  ladder and the bandit read the trigger.
- **Crediting the teach-back's U to every skill in `skill_ids`.** The kit expectations are topic-level, not
  tagged by skill, so this would over-credit (rule E7). The three-day failure was the scripted child's failing
  teach-back, not the credit rule.
- **Retuning U_FRAGILE or the facet step to make w1c-three-day pass.** Rule SIM6 says parameters are never
  fitted to a test's output.
- **Using the wide praise window on graded partials too.** It would strip the honest feedback that names the
  part that is right (§1.5).
- **Shipping P2 and P3 disputes as partial.** One rater says complete, so those need the human pass. Only P1,
  where both raters say not complete, is offered as a candidate. It is still not shipped: the data decision is
  the owner's.
- **A third model adjudicating the disputes.** That breaks the inherited law "a model never grades", and the
  brief asks for a human pass. The 30-row and 20-row reads in APPLY.md were done by this stream (Claude, a
  third model family). They are estimates of the queue's precision, not labels.

## Sources

- Agarwal et al. 2016, *Making Contextual Decisions with Low Technical Debt*, https://arxiv.org/abs/1606.03966
- Dzikovska et al. 2013, *SemEval-2013 Task 7*, https://aclanthology.org/S13-2045/
- Daheim et al. 2024, *Stepwise Verification and Remediation of Student Reasoning Errors with LLM Tutors*,
  https://aclanthology.org/2024.emnlp-main.478
- Macina et al. 2023, *MathDial*, https://arxiv.org/abs/2305.14536
- Shankar et al. 2024, *Who Validates the Validators?*, https://arxiv.org/abs/2404.12272
- Wang & Heffernan 2013, *Extending Knowledge Tracing to Allow Partial Credit* (AIED),
  https://link.springer.com/doi/10.1007/978-3-642-39112-5_19
- STACK (Sangwin; potential response trees), https://docs.moodle.org/en/question/type/stack
- Short-answer grading agreement:
  - SteLLA (structured grading with LLMs and RAG): LLM-to-human κ ≈ 0.67, human-to-human κ 0.83
  - a two-annotator study, CEUR-WS Vol-3772: κ 0.295, https://ceur-ws.org/Vol-3772/paper10short.pdf
- Books and papers cited by their standard references:
  - Hattie & Timperley 2007, *The Power of Feedback*, Review of Educational Research 77(1)
  - Kluger & DeNisi 1996, Psychological Bulletin 119(2)
  - Shute 2008, *Focus on Formative Feedback*, Review of Educational Research 78(1)
  - Brummelman et al. 2014, Psychological Science 25(3)
  - Soderstrom & Bjork 2015, Perspectives on Psychological Science 10(2)
  - Roediger & Karpicke 2006, Psychological Science 17(3)
  - Chi et al. 1989, Cognitive Science 13; Chi et al. 1994, Cognitive Science 18
  - Graesser et al. 2004, AutoTutor, Behavior Research Methods 36(2)
  - Barr et al. 2015, IEEE TSE 41(5)
