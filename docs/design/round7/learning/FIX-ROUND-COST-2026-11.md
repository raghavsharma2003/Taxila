# What a fix round costs: faults a fixer introduced (reader pass, November 2026)

Main asked for this list (2026-11-11) to show how many new faults each fix round adds. Every rewrite is judged by a reader
who did not write it. "Failed" means the rewrite did not fix its fault, or fixed it and broke something else. "New nearby"
counts faults the reader found in neighbouring fields, some of them caused by the rewrite.

| Fix round | Rewrites judged | Failed | Failed % | New nearby | Wrong keys introduced |
|---|---|---|---|---|---|
| batch 1, part a | 48 | 6 | 12.5 | 0 | 0 |
| batch 1, part b (crossing cards moved to lines@1) | 58 | 4 | 6.9 | 0 | 0 |
| batch 2 | 104 | 18 | 17.3 | 6 | 0 |
| batch 3, part A | 120 | 9 | 7.5 | 11 | 0 |
| batch 3, part B | 87 | 13 | 14.9 | 5 | 0 |
| batch 3, round 2 | 195 | 12 | 6.2 | 7 | **1 card** (c4-ch04-t01 s2 e2, see below) |
| pilots c4 + c6, round 1 | 70 | 15 | 21.4 | 6 | 0 |
| pilots c5-t01 + c5-t02, round 1 | 102 | 14 | 13.7 | 4 | 0 |
| staged round 3 + batch 1-2 predicate fixes | 27 cards | 12 | 44.4 | 5 | 0 |
| pilots, round 2 (all four) | 81 | 12 | 14.8 | 7 | 0 |
| pilots, round 3 (all four) | 34 | 4 | 11.8 | 11 | 0 |
| **total so far** | **926** | **119** | **12.9** | **62** | **1** |

The staged round-3 row counts whole cards, not fields: most of its fails are a question frame repeating another card or a kit
ladder item, which no predicate compared then. The pilots' rounds shrink, 29 → 12 → 4 fails, and the last 4 (all low) were
fixed by hand.

Batch 2's 24 counted earlier is 18 failed plus 6 new nearby.

## The one wrong key a fixer introduced
c4-maths-ch04-t01 s2 e2: to make the point true of its board, the round-2 fixer moved the ask onto the point's board and asked
"5281 ka 1: kis jagah, value?" with key 10 (tens). The 1 is in the ones. The second read caught it before any commit, and it is
fixed by hand: the card now asks the 2 of 8125 (tens, 20). Predicate (g) (`placeValueKeyErrors`) now solves place-value keys
from the card's number and refuses this card.

## What fixers most often break
- **Moving a number changes another card.** A new number lands on a later card's key, a ladder item, or a distractor. The
  repeat, earlier-key and ladder predicates now catch most of these during the fix.
- **A point made true of its board loses its example.** "The general method, no numbers" stays true, but readers flag it when
  the method alone does not teach.
- **A say that acts out its own then-card.** Predicate (f) catches this now.
- **A yes/no card re-keyed "Yes" on a negated claim** ("{friend} says it is NOT half"), where a child who understands may
  answer "nahi". Rule (f) now requires a positive claim.

Lesson from the pilots: a fix round on live text must be read again. Each round adds about 1 new fault for every 8 it fixes, and a reader who did not write the fix finds them.
