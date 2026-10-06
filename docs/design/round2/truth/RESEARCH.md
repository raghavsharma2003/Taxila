# Round 2 · truth stream: research and design

2026-10-06. Stream "truth" covers regressions, grading truth and the next-day check (VALUES-100 V1). This study was
written before any product code was changed. The measurements it cites were taken on HEAD 48e3369, which runs the same
server code as production web ee97e9c, against a local server on the Neon TEST branch.

**Labels.** Every number here is from scripted children, simulators or model batteries. None is from a real child.

## 1. The four problems, as found

| # | prod symptom (2026-10-06) | root cause found here (evidence) |
|---|---|---|
| 1 | w1c-reteach 10/13: "two arms failed on one skill" failed, "the next decision is a descent" failed, and only 1 of 2 attempts resolved | **Two policies race on one struggling skill.** V1.4's pace park (7 tries without a run of 3) takes the skill out of the lesson: `selectNext` skips parked skills, and `afterMiss` leaves the item. It does this while W1-C's re-teach re-check is still pending (the cooldown is 2 graded items on the skill). The ladder never gets its next decision, and the arm in flight never gets a later answer to resolve from. **Contributing:** a re-teach launched on an options item (a diagnostic) re-asks the same 2-3 options. That is elimination, and the fold grades only the first try, so the re-check carries no evidence at all. Deterministic sim, 40 seeds x 3 skills on c5-maths-ch02-t01 with an always-wrong child: HEAD leaves **80/120** skill-runs with an arm in flight and no decision. Prod's lesson is one of these runs. |
| 2 | w1b-mounts: the two G1 "forged claim" module-row checks counted 0 lessons graded | **Both the test and the product were wrong.** (a) Test: the open-class branch reads `ans.debug.classification`, and production never sends `debug` (`rows.js debugFor`: local or `TAXILA_DEBUG` only). On taxila.dev the check therefore always fell through to "no module row", and the right commit was never sent. (b) Product: a wrong answer on an OPEN item is not an event until its episode closes, by design. The lesson **end** never closed an open episode (`closeEvents` runs only inside a turn). A child's wrong answer followed by the lesson ending was silently dropped from the record. That contradicts decision `integration-episode-close-carries-misconception` ("C4 when the Director leaves the item"). |
| 3 | owner-1 typed answers: 3/60 wrong (wrong→correct x2, partial→correct x1) | All three came from the classifier's **model leg**. The deterministic paths decided none of them. The model credited "tens first" for "25, 38, 52", and "10/15 and 9/15" for "Ali is wrong: 4/9 < 3/4". The partial→correct case ("An eighth is half the size of a quarter") is **contested truth**: the kit lists "the pieces are different sizes" as a complete answer, and the reply states that more precisely. owner-1's oracle labels any first clause of a key "partial". |
| 4 | w1c-three-day 16/23: no +1 day check, no +2 day certifying check | Day 0 was traced 3/3 times locally (`probe-day0`, Neon test rows), and **no skill reaches learned_today**. s1: generative yes, but recent [0,1]. s2: unaided, pL .987, recent [1,1], but **generative no**. s3: one right answer only. The teach-back is ONE conjunctive `probe.teachback` event over s1-s3 (`live.js answerEvents`), but the ledger advances the display only for `target = skillIds[0]`. So the generative pass went to s1 (the skill least done), never to s2. Nothing is learned, so nothing is due, so there is no check. |

A fifth finding is out of scope but must be on the record: **the deterministic grader's false credits on partial
acceptable entries.**
- On HEAD with no parts file (production ships none: `data/kits-parts.json` does not exist), `classifyFast` credits as
  correct **838** acceptable-entry answers that two raters from different families agreed are *partial* ("LED bulbs"
  for "Any four: …", "July" for "July, 150 mm more than June").
- These are 838 of 78,810 deterministic cases, across 326 items in classes 1-9.
- The earlier "0 wrong in 35,088" figure was measured WITH `TAXILA_PARTS_FILE` set. That is not the production
  configuration.
- The truth here is two-rater and not adjudicated (κ 0.53 on acceptable entries). The decision on record says it needs a
  human pass before it ships.

## 2. How the best systems solve these exact problems

### 2.1 What gets re-checked, and when (problem 4)
- **ASSISTments ARRS** (Heffernan lab; Wang & Heffernan, *Improving retention performance through student modeling*;
  WPI theses).
  - Mastery is 3 right in a row, within at most 10 tries.
  - Every mastered skill is re-tested automatically at **7, 14, 30 and 60 days** after mastery.
  - A miss on a retention test re-assigns the skill's relearning set.
  - Measured: retests raised the average gain from 1.95 to 2.56 versus no reassessment, and the effect was significant.
  - What transfers: **mastery from performance triggers the schedule**. The re-check is a fresh problem of the skill,
    not a repeat.
- **Khan Academy Mastery Challenges** (Khan support docs; M. Faus, *Khan Academy mastery mechanics*, 2014).
  - Spaced review covers skills the learner already reached on performance (Familiar or Proficient).
  - It is 6 questions over 3 skills, chosen by time since the last review and the current level.
  - Two right raises the level, two wrong lowers it, and a mixed result leaves it unchanged.
  - Review gaps double after each success.
  - What transfers: the review population is **every practised-to-level skill**, and the schedule is a function of
    elapsed time and level only.
- **Duolingo half-life regression** (Settles & Meeder, ACL 2016).
  - Every practised item gets a predicted recall half-life. Review is scheduled when predicted recall drops.
  - Measured: the half-life error fell by 45% or more versus baselines, and daily engagement rose 12% in an
    operational A/B test.
  - What transfers: scheduling is per item and per skill, from the attempt history alone.
- **BKT mastery threshold.** Corbett & Anderson (1995) used P(L) ≥ 0.95, which is Taxila's `LEARNED_P`. Pelánek
  (*Conceptual issues in mastery criteria*, AIED 2018) shows that a threshold mixes "how much is known" with "how
  sure we are", so a delayed re-check is how the estimate gets corrected.
- **Wheel-spinning** (Beck & Gong, AIED 2013).
  - In ASSISTments and the Cognitive Tutor, about 38% of student-skill pairs did not reach 3-in-a-row within 10 tries.
  - Those students rarely master the skill later with more of the same practice.
  - The recommended intervention is *different instruction or prerequisite remediation*, not more items. That is
    exactly what W1-C's ladder does, so the ladder must not be cut off by a plain practice cap (problem 1).

**What this means for Taxila.** All three products key the re-check on performance. Taxila deliberately keys
"learned_today" on performance plus a generative pass: the same-day teach-back or why (LEARNER-MODEL §6.1; VALUES V1
"understood"). The bug is not that rule. The bug is that the conjunctive teach-back credited only one of the skills it
covers.

### 2.2 How graders reach "0 wrong" on free answers (problem 3)
- **Auto-grade only what can be checked against a key.**
  - Khan, ASSISTments and Duolingo grade numbers, expressions, multiple choice, and accepted-answer lists with typo
    tolerance.
  - Free-text responses are not auto-scored into mastery. ASSISTments routes open responses to the teacher; Duolingo
    accepts only listed translations.
- **LLM short-answer grading literature, 2024-2026.**
  - Human-LLM agreement is moderate: about 71% versus 80% between humans, with κ from 0.18 to 0.77 depending on the
    task.
  - Adversarial false positives are around 9.6% on ambiguous tokens (*Rubric-conditioned LLM grading*, arXiv
    2601.08843).
  - The answer is **selective grading**: auto-score only the high-confidence share and defer the rest.
  - CHiL(L)Grader (arXiv 2603.11957) automates 35-65% of responses at expert quality and routes the rest to humans.
  - *Confidence estimation in ASAG with LLMs* (arXiv 2605.00200) and SURE do the same.
- **Taxila's own measured history** (rejected.md):
  - The model credited "-180" for 180°, "8 p.m." for "8 a.m." and "3 faces" for "3 edges".
  - Each fix moved a decision from the model into code.
  - The inherited law is "a model never grades — classify against verified keys".

What transfers to a Hindi-English voice tutor on Azure-only:
- We cannot route to a human mid-lesson.
- Taxila's "defer" is the **re-ask in a form code can grade**: the Director's unclear path offers choices (`pick:i`) or
  the key's number form. These are graded in code.
- So a model label that the child's words cannot corroborate must become **no evidence**, never a credit.
- The cost is a re-ask, which is reported as "uncredited", per form.

### 2.3 The re-check after a re-teach (problem 1)
- ASSISTments and the Cognitive Tutor re-check with a NEW problem of the skill.
- A re-ask of the same multiple-choice item after feedback is known to measure elimination, not knowledge. With 2
  options it is right 100% of the time after one wrong.
- Taxila's fold already encodes this: options items grade the first try only. The re-teach's re-check must therefore be
  an isomorphic produce item.

## 3. Design chosen (with reversal conditions)

### D1 · The ladder decides when the pace park fires (problem 1)
- **Rule.** A miss that V1.4's pace park would leave, on a skill with a re-teach arm in flight, *is* the re-check's
  verdict. The cooldown is cleared and `engineReteach` decides at once. The possible decisions are:
  - another arm;
  - the prerequisite descent, after 2 failed arms;
  - the engine's park, after 3 failures (`s.parked`, the Conductor's spaced re-teach).
- With no arm in flight, the plain pace park stands.
- **Bounded.** Each decision moves one rung, and the third failure parks. The sim's maximum is **9 tries** on a skill,
  under V1.4's 10-try wheel-spin line.
- **Reverse if** the V1.4 overload metric (10 tries without 3 right) exceeds 5% of skill-sessions in the
  mastery-calibration sim with D1 on. That would mean the ladder's extra rungs cost more than they repair.

### D2 · A re-teach on an options item re-checks with a fresh item (problem 1)
- The options item is retired with no further verdict. The re-check is `isomorphicFor(item)`, a produce item on the same
  skill, posed next.
- **Reverse if** a kit skill has no isomorphic produce item. Then the re-check falls back to the next queued item, and
  the coverage of that fallback should be measured.

### D3 · The lesson end closes an open episode (problem 2)
- `live.js endEvents` closes an open episode at lesson end, the same way `closeEvents` closes one on a leave: P15, C4,
  `episodeEnded`, with the misconception shown and the via carried.
- It is written in the end handler's `flushHeld` transaction, and the lesson state marks the episode closed so a
  retried end cannot write it twice.
- **Reverse if** the ledger gets an "abandoned" outcome class distinct from C4.

### D4 · The teach-back credits every skill it covers (problem 4)
- In the ledger, a `probe.teachback` event advances the display for every skill in `skill_ids`, not only `target`.
- It is derived from stored columns, so replay equals online.
- The other learned_today conditions are unchanged. Each skill still needs its own unaided correct, 2 of the last 3
  right, and pL ≥ 0.95. The teach-back supplies only the generative (b).
- This means a check gets **scheduled** for every skill the child did unaided and explained that day. "Secure" still
  needs V1.3's certifying check: ≥ 2 learning days later, a never-met item, no hints (unchanged: `checkDayOk` + `novel`).
- **Reverse if**, on the pilot, skills that reached learned_today only through a shared teach-back fail their certifying
  check more than 10 points more often than skills whose (b) came from a skill-specific why. That would mean the shared
  explanation is not evidence per skill. Then per-skill attribution needs an expectation-to-skill map in the kits.
- **Considered, not adopted:** scheduling the check from performance alone, as ARRS and Khan do, without (b).
  - It is closer to the industry products.
  - But it changes what "learned_today" means to parents (the claims audit) and the U/K split of the comprehension
    ladder.
  - Revisit if practice-purpose lessons, which have no teach-back, leave more than 20% of skills with 3 or more unaided
    right answers and no check within 7 days. That is measurable from `kt_skill_state` on the pilot.

### D5 · A model label must be corroborated by the child's words (problem 3)
- `server/grading/corroborate.js` is pure and is applied to every `source: "model"` label on a keyed item.
- **"correct" stands only if one complete form** of the answer is supported by the reply. The complete forms are the
  key, unlabelled or complete acceptable entries, and the correct option. A form is supported when all of these hold:
  - no number the question, key or answers never mention;
  - every number of the form is present, in the form's order;
  - no opposite decisive word (yes/no, true/false, more/less, before/after, odd/even; Hindi and Hinglish sides
    included);
  - no negated key;
  - at least half of the form's content words are present.
  Otherwise the turn is **no evidence**: a re-ask or choices, graded in code.
- **"incorrect", "misconception" or "partial" stand unless the reply is key-like**: every number in order, a cover of
  0.8 or more, and no contradiction. When it is key-like the model is contradicting the key's own words, and the turn is
  no evidence.
- **Measured on paired model labels.** The same model calls are scored before and after the guard
  (`run.mjs --dump-model` → `guard-eval.mjs`). The guard thresholds were tuned on seed 7 and confirmed on a held-out
  seed. The results are in APPLY.md.
- **Reverse if** the uncredited rate on truly correct answers rises above 25% of model-leg cases on the held-out seed,
  or the pilot shows children re-asked more than once per 10 answered items. Either would mean the cost in re-asks
  outweighs the protection.

## 4. What does NOT transfer, and why

- **Human deferral** (CHiL(L)Grader, ASSISTments open response) has no human in a live lesson. The code-gradable
  re-ask is the substitute.
- **Duolingo's HLR weights** come from 12.9 M adult language events. Taxila has no child data yet, so FSRS defaults and
  V1.3's fixed ≥ 2 days stay.
- **Khan's doubling intervals** are not adopted. V1.3 fixes the first certifying gap at ≥ 2 learning days, and FSRS
  sets the later ones.

Sources:
- ASSISTments ARRS:
  - [Wang, Using Student Modeling to Estimate Student Knowledge Retention](https://files.eric.ed.gov/fulltext/ED537181.pdf)
  - [Improving Retention Performance through Student Modeling](https://digital.wpi.edu/downloads/kd17ct060)
  - [Heffernan IES contribution](https://www.neilheffernan.net/from-other-but-not-used/ies-contribution)
- Khan Academy:
  - [What are Mastery Challenges](https://support.khanacademy.org/hc/en-us/articles/360037494231-What-are-Mastery-Challenges)
  - [Khan Academy Mastery Mechanics](https://mattfaus.com/2014/07/03/khan-academy-mastery-mechanics/)
- Duolingo: [Settles & Meeder, A Trainable Spaced Repetition Model for Language Learning](https://research.duolingo.com/papers/settles.acl16.pdf)
- Mastery criteria: [Pelánek, Conceptual Issues in Mastery Criteria](https://www.fi.muni.cz/~xpelanek/publications/mastery-modeling.pdf)
- Wheel-spinning:
  - [Beck & Gong, Wheel-Spinning: Students Who Fail to Master a Skill](https://www.semanticscholar.org/paper/Wheel-Spinning:-Students-Who-Fail-to-Master-a-Skill-Beck-Gong/0890bd77b4615cbe9aa6be27b4c9aa6772f3d74f)
  - [Early Detection of Wheel-Spinning in ASSISTments](https://learninganalytics.upenn.edu/ryanbaker/paper_45a.pdf)
- LLM grading:
  - [Rubric-Conditioned LLM Grading](https://arxiv.org/html/2601.08843)
  - [CHiL(L)Grader](https://arxiv.org/html/2603.11957v1)
  - [Confidence Estimation in ASAG with LLMs](https://arxiv.org/html/2605.00200v2)
  - [Learning When to Defer to Humans for Short Answer Grading](https://dl.acm.org/doi/10.1007/978-3-031-36272-9_34)
