# Learner params kt-r3: pilot replay, before and after (2026-11-10)

SIMULATED children on the real lesson pipeline, offline (`evals/learner-pilot-replay/replay.mjs`): the four pilot lesson
scripts, three lessons a day apart per child, the blind grader answering in time ("present" for right and mixed,
"absent" for wrong and weak). "before" is the branch before the kt-r3 commits (the base checkout); "after" is kt-r3:
LEARN-02 (no learning step after a failed card; teaching capped at +0.20 per skill per lesson), LEARN-04, 05, 25, 28, 29.
`prior` is the estimate before the skill's first event; `weak` is next-topic.js's weak-foundation rule (≥ 3 attempts and
an estimate under 0.4). The child named `why` gets no blind grade in time (every why and teach-back is held on K since
kt-r3; the late correction is not modelled): it reads "practising" before and after, because its classifier guess was
"incorrect" here.

Reproduce: `node evals/learner-pilot-replay/replay.mjs --root <checkout> --label <name> --lessons 3`, then
`node evals/learner-pilot-replay/analyze.mjs before.json after.json`.

## What moved

- **All wrong (the LEARN-02 child):** before, 24-63 wrong answers ended 0.40-0.83, above the prior on all 12 skills, and
  the weak-foundation rule fired on 1 of 12. After, they end 0.13-0.25, below the prior on all 12, and the rule fires on
  all 12. The support level reads "worked" (pKnown < 0.35) for every one.
- **Weak (one right in four):** ends lower (0.39-0.71, was 0.55-0.98). One skill crosses into "weak". Several weak
  children now answer fewer cards in three lessons (the Director wraps or moves on differently once the estimate is low).
- **All right, mixed:** estimates within 0.003. Display unchanged except one mixed skill (c5-maths-ch02-t02 s1: learned today → practising). Traced in
  `docs/design/round7/audit/learner-evidence.md`, item 8: the missed cards no longer add a learning step, so the estimate
  reaches 0.95 only after her unaided right answers are behind her.
- **Not here:** LEARN-07 (placement) is a separate run below. LEARN-26 is a write-path guard and moves no estimate.

## Per child and skill

| topic | child | skill | prior | before: end, display | after: end, display | answers (right/all) before → after | weak before → after |
|---|---|---|---|---|---|---|---|
| c4-maths-ch05-t01 | right | s1 | 0.374 | 1, learned_today | 1, learned_today | 24/24 → 24/24 | no → no |
| c4-maths-ch05-t01 | right | s2 | 0.374 | 1, learned_today | 1, learned_today | 18/18 → 18/18 | no → no |
| c4-maths-ch05-t01 | right | s3 | 0.374 | 1, learned_today | 1, learned_today | 21/21 → 21/21 | no → no |
| c4-maths-ch05-t01 | wrong | s1 | 0.374 | 0.509, practising | 0.137, practising | 0/50 → 0/60 | no → yes |
| c4-maths-ch05-t01 | wrong | s2 | 0.374 | 0.458, practising | 0.18, practising | 0/37 → 0/42 | no → yes |
| c4-maths-ch05-t01 | wrong | s3 | 0.374 | 0.396, practising | 0.241, practising | 0/55 → 0/69 | yes → yes |
| c4-maths-ch05-t01 | mixed | s1 | 0.374 | 1, learned_today | 1, learned_today | 24/47 → 24/47 | no → no |
| c4-maths-ch05-t01 | mixed | s2 | 0.374 | 0.976, practising | 0.975, practising | 18/36 → 18/36 | no → no |
| c4-maths-ch05-t01 | mixed | s3 | 0.374 | 0.998, practising | 0.997, practising | 21/42 → 21/42 | no → no |
| c4-maths-ch05-t01 | weak | s1 | 0.374 | 0.715, practising | 0.437, practising | 15/59 → 12/47 | no → no |
| c4-maths-ch05-t01 | weak | s2 | 0.374 | 0.549, practising | 0.394, practising | 9/36 → 7/31 | no → yes |
| c4-maths-ch05-t01 | weak | s3 | 0.374 | 0.631, practising | 0.706, practising | 12/46 → 10/35 | no → no |
| c4-maths-ch05-t01 | why | s1 | 0.374 | 1, practising | 1, practising | 24/24 → 24/24 | no → no |
| c4-maths-ch05-t01 | why | s2 | 0.374 | 1, practising | 1, practising | 18/18 → 18/18 | no → no |
| c4-maths-ch05-t01 | why | s3 | 0.374 | 1, practising | 1, practising | 21/21 → 21/21 | no → no |
| c5-maths-ch02-t01 | right | s1 | 0.389 | 1, learned_today | 1, learned_today | 21/21 → 21/21 | no → no |
| c5-maths-ch02-t01 | right | s2 | 0.389 | 1, learned_today | 1, learned_today | 21/21 → 21/21 | no → no |
| c5-maths-ch02-t01 | right | s3 | 0.389 | 1, learned_today | 1, learned_today | 21/21 → 21/21 | no → no |
| c5-maths-ch02-t01 | wrong | s1 | 0.389 | 0.631, practising | 0.131, practising | 0/63 → 0/63 | no → yes |
| c5-maths-ch02-t01 | wrong | s2 | 0.389 | 0.506, practising | 0.178, practising | 0/42 → 0/42 | no → yes |
| c5-maths-ch02-t01 | wrong | s3 | 0.389 | 0.679, practising | 0.135, practising | 0/63 → 0/63 | no → yes |
| c5-maths-ch02-t01 | mixed | s1 | 0.389 | 1, learned_today | 1, learned_today | 21/41 → 21/41 | no → no |
| c5-maths-ch02-t01 | mixed | s2 | 0.389 | 0.987, practising | 0.984, practising | 21/43 → 21/43 | no → no |
| c5-maths-ch02-t01 | mixed | s3 | 0.389 | 1, learned_today | 1, learned_today | 21/41 → 21/41 | no → no |
| c5-maths-ch02-t01 | weak | s1 | 0.389 | 0.627, practising | 0.475, practising | 15/58 → 10/38 | no → no |
| c5-maths-ch02-t01 | weak | s2 | 0.389 | 0.555, practising | 0.423, practising | 9/41 → 6/28 | no → no |
| c5-maths-ch02-t01 | weak | s3 | 0.389 | 0.903, practising | 0.617, practising | 12/42 → 8/27 | no → no |
| c5-maths-ch02-t01 | why | s1 | 0.389 | 1, practising | 1, practising | 21/21 → 21/21 | no → no |
| c5-maths-ch02-t01 | why | s2 | 0.389 | 1, practising | 1, practising | 21/21 → 21/21 | no → no |
| c5-maths-ch02-t01 | why | s3 | 0.389 | 1, practising | 1, practising | 21/21 → 21/21 | no → no |
| c5-maths-ch02-t02 | right | s1 | 0.389 | 1, learned_today | 1, learned_today | 21/21 → 21/21 | no → no |
| c5-maths-ch02-t02 | right | s2 | 0.389 | 1, learned_today | 1, learned_today | 24/24 → 24/24 | no → no |
| c5-maths-ch02-t02 | right | s3 | 0.389 | 1, learned_today | 1, learned_today | 24/24 → 24/24 | no → no |
| c5-maths-ch02-t02 | wrong | s1 | 0.389 | 0.419, practising | 0.135, practising | 0/39 → 0/51 | no → yes |
| c5-maths-ch02-t02 | wrong | s2 | 0.389 | 0.526, practising | 0.139, practising | 0/24 → 0/66 | no → yes |
| c5-maths-ch02-t02 | wrong | s3 | 0.389 | 0.45, practising | 0.253, practising | 0/40 → 0/66 | no → yes |
| c5-maths-ch02-t02 | mixed | s1 | 0.389 | 1, learned_today | 0.999, practising | 21/41 → 21/41 | no → no |
| c5-maths-ch02-t02 | mixed | s2 | 0.389 | 1, practising | 0.999, practising | 24/51 → 24/51 | no → no |
| c5-maths-ch02-t02 | mixed | s3 | 0.389 | 1, practising | 1, practising | 24/45 → 24/45 | no → no |
| c5-maths-ch02-t02 | weak | s1 | 0.389 | 0.612, practising | 0.548, practising | 11/43 → 10/39 | no → no |
| c5-maths-ch02-t02 | weak | s2 | 0.389 | 0.695, practising | 0.454, practising | 10/39 → 5/19 | no → no |
| c5-maths-ch02-t02 | weak | s3 | 0.389 | 0.661, practising | 0.596, practising | 10/39 → 8/31 | no → no |
| c5-maths-ch02-t02 | why | s1 | 0.389 | 1, practising | 1, practising | 21/21 → 21/21 | no → no |
| c5-maths-ch02-t02 | why | s2 | 0.389 | 1, practising | 1, practising | 24/24 → 24/24 | no → no |
| c5-maths-ch02-t02 | why | s3 | 0.389 | 1, practising | 1, practising | 24/24 → 24/24 | no → no |
| c6-maths-ch06-t01 | right | s1 | 0.342 | 1, learned_today | 1, learned_today | 18/18 → 18/18 | no → no |
| c6-maths-ch06-t01 | right | s2 | 0.342 | 1, learned_today | 1, learned_today | 21/21 → 21/21 | no → no |
| c6-maths-ch06-t01 | right | s3 | 0.342 | 1, learned_today | 1, learned_today | 21/21 → 21/21 | no → no |
| c6-maths-ch06-t01 | wrong | s1 | 0.342 | 0.757, practising | 0.202, practising | 0/54 → 0/54 | no → yes |
| c6-maths-ch06-t01 | wrong | s2 | 0.342 | 0.786, practising | 0.195, practising | 0/54 → 0/54 | no → yes |
| c6-maths-ch06-t01 | wrong | s3 | 0.342 | 0.827, practising | 0.219, practising | 0/54 → 0/54 | no → yes |
| c6-maths-ch06-t01 | mixed | s1 | 0.342 | 1, learned_today | 1, learned_today | 18/36 → 18/36 | no → no |
| c6-maths-ch06-t01 | mixed | s2 | 0.342 | 1, learned_today | 1, learned_today | 21/41 → 21/41 | no → no |
| c6-maths-ch06-t01 | mixed | s3 | 0.342 | 0.998, practising | 0.998, practising | 21/42 → 21/42 | no → no |
| c6-maths-ch06-t01 | weak | s1 | 0.342 | 0.975, practising | 0.572, practising | 12/43 → 9/34 | no → no |
| c6-maths-ch06-t01 | weak | s2 | 0.342 | 0.782, practising | 0.519, practising | 12/46 → 11/38 | no → no |
| c6-maths-ch06-t01 | weak | s3 | 0.342 | 0.745, practising | 0.513, practising | 9/42 → 7/35 | no → no |
| c6-maths-ch06-t01 | why | s1 | 0.342 | 1, practising | 1, practising | 18/18 → 18/18 | no → no |
| c6-maths-ch06-t01 | why | s2 | 0.342 | 1, practising | 1, practising | 21/21 → 21/21 | no → no |
| c6-maths-ch06-t01 | why | s3 | 0.342 | 1, practising | 1, practising | 21/21 → 21/21 | no → no |

## LEARN-07, cold start (`evals/placement-coldstart/sim.mjs --n 300 --lessons 12`, SIMULATED)

"About right" and "Easy" now keep the calendar's start; only "Hard" or a child's "tricky" moves it back.

| population | answers | condition | too hard on day one (high1) before → after | error at lesson 1 before → after | error at lesson 5 before → after |
|---|---|---|---|---|---|
| model | model | onboarding | 0.39 → 0.42 | 0.97 → 0.94 | 0.46 → 0.43 |
| model | missp | onboarding | 0.37 → 0.41 | 0.95 → 0.92 | 0.61 → 0.59 |
| ontrack | model | onboarding | 0.08 → 0.11 | 0.77 → 0.63 | 0.46 → 0.42 |
| ontrack | missp | onboarding | 0.08 → 0.11 | 0.77 → 0.62 | 0.66 → 0.61 |
| model | model | class rule (no answers), for reference | 0.67 | 1.5 | 1.17 |
| model | missp | class rule (no answers), for reference | 0.68 | 1.49 | 1.08 |
| ontrack | model | class rule (no answers), for reference | 0.3 | 0.69 | 0.58 |
| ontrack | missp | class rule (no answers), for reference | 0.28 | 0.67 | 0.66 |

On-track children start closer (error at lesson 1 0.77 → 0.63) and stay closer by lesson 5. Slightly more of them start
too hard on day one (0.08 → 0.11), and for the behind-the-calendar population too (0.39 → 0.42): a parent's "About
right" for a child who is in fact behind no longer pulls the start back. Covert refinement corrects both within the
first lessons (error at lesson 5 is the same or lower everywhere).
