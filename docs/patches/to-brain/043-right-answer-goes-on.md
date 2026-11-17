# To Brain 043 (with two script fields): a right answer goes on

Follows Brain 042 on `main/d28-code`. Built by an agent run from the main loop. Decision: `dc-r8-director27`, third work order; this is the main loop's read of 042's measure, which the order asked for before any judged run.

## What 042's dry run shows

Check-in turns per steady lesson: 20, 14, 18, 15 (c4, c5-t01, c5-t02, c6) against a limit of 14. None before a waiting card, none inside a worked example. The largest source left is a right answer's verdict and why standing alone, ending on "samajh aaya?", because what comes next does not fit in 75 words (7, 4, 6, 4 a lesson). Asking a child who has just answered right whether it is clear is the weakest check-in in the lesson.

Two shapes, from the dry run's steady lessons (rows are 0-based indexes into `director`):
- **Before a point or a card:** the next turn is 49 to 64 words and the two together are 76 to 82. c4 70, 74; c5-t01 80; c5-t02 20, 94, 110; c6 46. The whys are 15 to 22 words.
- **Before a worked example:** the first segment is 64 to 74 words; nothing fits with it. c4 80, 116 (and 42); c5-t01 94 (and 16); c5-t02 24, 116; c6 16, 62, 100.

## R1. `whyShort`

Script: on every card that has a `why` (explain cards, remediation follow-up cards, checks; not the closing question, not the child's own worked step):
```
"whyShort": { "hi": "…", "en": "…" }   // 10 words or fewer
```
- The reason in the fewest words, for a child who has just answered right. It does not praise and does not repeat the question.
- Every number in it is in the card's prompt, key or `why`. It names no term the lesson has not taught.
- It reads on after any verdict form, as `why` does ("Haan, sahi hai" + it).
- `why` stays as it is.

`scripts/lesson-scripts/check.mjs` enforces the length and the numbers rule; a card with a `why` and no `whyShort` is a compile hole, not an error (the staged scripts have none and must still walk as today).

Walk, on a right verdict only:
- verdict + `why` + what the walk would add next fits the turn's limit: as now;
- it does not fit, and verdict + `whyShort` + the same does: `whyShort` is said in place of `why`;
- neither fits: as now (and see R2).
Never after a key, a miss or a give-up. The row records that the short form was said.

## R2. Before a worked example, an invitation and not a check-in

Script: `joints.workedInvite`, three forms, each a question of 10 words or fewer that invites the child to do the next problem together.

- A right verdict that stands alone because a worked segment follows ends on a `workedInvite` form, not on a comprehension check-in. The same where her reply to an aside stands alone before a worked segment.
- The next turn starts at the problem: the `beforeWorked` lead-in is not said after an invitation.
- The child's yes goes to the worked segment. Anything else there is handled as it is at a check-in today.
- Code fallback and a compile hole when the joint is missing.
- `counts.mjs` reports turns ending on an invitation as their own line. They are not counted as comprehension check-ins and are not hidden: the judges get both numbers.

## R3. "Phir se bolo" at a quick question

c4 steady 38 to 40: the child asked to hear the quick question again and got the card, with nothing said to her. A repeat at a quick question gets the quick prompt again, once, over the point's board; a second repeat gets `say` and then the card.

## R4. Four breaks to explain

By the main loop's count the two turns fit in 75 words, yet the verdict stands alone: c4 steady 90 → 92 (25 + 32; the same shape is one turn of 63 words at c4 114), c4 96 → 98 (22 + 51), c5-t01 108 → 110 (24 + 50), c5-t02 70 → 72 (17 + 58). For each, name the rule that broke the turn. Where it is a rule a judge asked for (a bridge's own turn, the closing question's own turn, remediation and follow-up at 60), leave it and say so. Where it is a count that is off or a break nobody asked for, fix it.

## Measure

On the dry matrix, each steady lesson: at most 14 turns ending on a comprehension check-in; no turn over 75 words; every gated predicate 0. Report check-ins by source as 042 did, plus the invitations and the `whyShort` uses per lesson, in `context/inbox/d28-043-dry.json`. If a lesson is still over 14, give its sources by row and stop there.

## Done means

- `node scripts/lesson-scripts/check.mjs <topic>` passes on the four pilots; the compile report shows only the new holes on the staged scripts.
- Every new sentence (`whyShort` on each card, the invitation forms) is listed in `docs/status/learning.md` with its card and the card's `why`.
- A staged script (`TAXILA_R7_SCRIPT_DIR=data/lesson-scripts-staged`, `c5-maths-ch02-t03`) walks as before apart from the invitation fallback.
- Unit tests for the fit rule (R1), the invitation (R2) and the repeat (R3); `npx tsc -b`, the suites you touch, `node --test tests/r8-*.test.mjs tests/r7-brain-*.test.mjs`.
- Anything here you judge wrong or could not build: say so with the rows.
