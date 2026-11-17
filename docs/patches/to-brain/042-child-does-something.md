# To Brain 042: where she asked "samajh aaya?", the child now does something

Judgement and decision: `docs/design/round7/judgements/director27-2026-11-17.md` (`dc-r8-director27`, the third work order). Built after Brain 041 and Learning 016 are both on `int/r6`: 016 adds the two script fields this uses.

Why: all four director27 judges found the comprehension check-ins tedious (steady lessons: 29, 26, 23, 20 turns ending on one; the child says "haan" 16 to 22 times). The clause set before the run names the remedy. The two places every judge named:
- a verdict, its why and a new point, ending on a check-in because the card does not fit; "haan"; then the card alone in 13 to 25 words (6 a steady lesson);
- a worked problem said alone, ending on "Yeh kadam saaf hai?" before any step was told (untrue), and told steps ending on a check-in.

## Q1. A quick question where a card waits

Script: `explain[].quick = { prompt, key, accept, say }` (Learning 016, section A.1).

- Where a point is said and its card does not fit in the turn, the turn ends on `quick.prompt`, not on a check-in.
- The child's answer is read against `quick.key` and `accept` by the same reader that reads a card's answer (a model never grades).
- Right: a short yes from the verdict forms (no why), then the card, in one turn.
- Anything else that is an answer or a give-up: `quick.say`, then the card, in one turn. No hint, no remediation, no second try, no miss verdict form that names the child's answer.
- A clarify, a Hindi request, a picture request or an aside on the quick question is handled as on the point it belongs to (the picker's part is the point); after it the walk goes to the card, not back to the quick question.
- The quick question is said over the point's board. It never moves the board.
- Where the point and its card fit in the turn, there is no quick question.
- The record: the row's `cell.part` is `<beat>:quick`; the child's answer is recorded as evidence on the beat with its own kind, and is not a card verdict (verdict counts, the scale gate's "keyed answers" and the learner model's card evidence do not change meaning).

## Q2. A worked example done with the child

Script: `workedExample.steps[].ask = { prompt, key, accept, right }` on at least one step (Learning 016, section A.2).

- A worked example is a run of segments, each ending on a question: a step's `ask.prompt`, or the child's own step. Told steps without an `ask` are said with what follows them.
- The problem is never alone: lead-in, problem and what follows up to the first question are one turn where they fit in 75 words; where the verdict and its why before them make it longer, the break falls after the why and that turn ends on its check-in (counted).
- An asked step answered right: `ask.right`, then on. Anything else: the step told as today (its do, result and why), then on. No hint ladder on an asked step; a clarify there gets the step's `simpler` as now.
- No turn of a worked example ends on a step check-in ("Yeh kadam saaf hai?", "Yeh kadam samajh aaya?"). Those forms are said only after a told step's `simpler`.
- The child's own step is as now.

## Measure, set by the decision

On the dry matrix, each steady lesson: at most 14 turns ending on a comprehension check-in; none of them before a waiting card or inside a worked example; no turn over 75 words. Gated predicates for the two "never" places. Report the counts by what the turn holds (as `ms-r8-checkins-by-source` did), before and after. If the measure is not met, say so with the numbers and stop there; the main loop reads the sources before any judged run.

## Predicates and tests

- `quickBeforeCard`: a turn that ends on a check-in while the same beat's card is the next thing said (gated, 0). Non-zero on director27's rows: c4 steady 72 to 78 region as the c4 report lists; c5-t01 steady 62, 84, 96, 100; c5-t02 steady 6, 42, 52, 58, 72, 96; c6 steady 6, 12, 42, 52, 74, 78.
- `workedCheckin`: a worked example's turn ending on a step check-in with no told step's `simpler` in it (gated, 0). Non-zero on c6 steady 16, 60, 82; c5-t01 steady 16, steering 40; c5-t02 steady 16, 62, steering 38; c4 steady 46, stuck 66, steering 50.
- `quickGraded`: every quick answer is followed by the short yes or by `say`, and then the card (gated, 0).
- `quickGiveaway`: `quick.say` or `ask.right` never contains the card's key or the child's own step's key (gated, 0; the checker holds the same on the script).
- The scripted children answer quick questions and asked steps from the keys (steady right; stuck wrong or "pata nahi"; the others as their kind does).

## Done means

As 041: every gated predicate 0 on the dry matrix, `check-run.mjs` clean, counts written, the new predicates pinned on their director27 rows, `npx tsc -b` and the touched suites pass. Anything you judge wrong or could not build: say so with the rows.
