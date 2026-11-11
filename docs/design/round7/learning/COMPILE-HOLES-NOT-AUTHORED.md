# Compile holes Learning did not fill, with reasons (for main's ruling with Brain)

**Source:** `scripts/lesson-scripts/compile-report.mjs` over `server/director/compile.js` (claude/r4-conversation), run after
Learning's pilot batch. Ruling: dc-r8-second-clarify-shows-not-rewords, rule 4.

## Pilots: 41 holes → 31 filled, 10 listed here
Filled:
- 12 worked-problem simplers (`workedExample.simpler`).
- 8 bridge simplers (`bridgeToNext.simpler`).
- 9 yourStep whys (`workedExample.yourStep.why`).
- 2 card `targets`, each pointing at the skill's existing remediation for the mix-up its wrong answer shows:
  - c5-t01 s3 e2 (answering "1") → `all-less-than-one`.
  - c5-t02 s3 e4 (picking 2/4) → `gap-thinking`.

## The 10 not filled, all one kind: `card remediation` / `your_step remediation` with `targets=undefined`
The rule asks for "the remediation for the mix-up the card targets". These cards target no mix-up: there is no `targets`
field, and the card is a straight computation or reading with no wrong answer tied to a kit misconception. Writing a
remediation for them would invent a mix-up the kit does not have.

| Card | What it asks | Why there is no mix-up |
|---|---|---|
| c4-maths-ch05-t01 s2 e1 | half of 12 laddoos | a sharing computation; a wrong answer is a slip, not one of the topic's two mix-ups (part-part, unequal-parts) |
| c4-maths-ch05-t01 s2 e2 | 1/3 of 24 mangoes | the same |
| c4-maths-ch05-t01 s2 e3 | 1/4 of 20 marbles | the same |
| c4-maths-ch05-t01 s2 yourStep | 15 pencils in 3 equal groups | the same |
| c5-maths-ch02-t01 s2 e1 | 3 hops on quarters → 3/4 | counting hops on a line already cut into gaps; no marks to miscount |
| c5-maths-ch02-t01 s2 e2 | hops of 1/5 to reach 1 → 5 | **is** count-marks (a child who says 4 counts marks). But that remediation's then-card teaches on fifths (3/5), so making it callable from e2 states e2's own key: check.mjs refuses it. Either Brain lets a card's own remediation state its key once the card is answered wrong, or the remediation is re-authored on another denominator. Main's call. |
| c5-maths-ch02-t01 s2 e3 | is 4/6 before or after the middle | a judgement on one line; none of the four kit mix-ups produces "before" |
| c5-maths-ch02-t02 s2 e1 | colour 5 of 7 parts → 5/7 | naming a fraction from a picture; no mix-up |
| c5-maths-ch02-t02 s3 e1 | 3 of 8 coloured → 3/8 | the same |
| c6-maths-ch06-t01 s3 e3 | fence leaving out the gate → 38 m | a subtraction after a perimeter; neither l-plus-b nor area-perimeter applies |

**What I propose for the rule.** The `card/misconception` and `your_step/misconception` cells apply only when the card has
`targets`. A wrong answer with no recognised mix-up goes to the `wrong` column, which the scripts already serve (the
card's simpler, then its key). `byMixup` still routes a recognised kit mix-up to that mix-up's remediation.
