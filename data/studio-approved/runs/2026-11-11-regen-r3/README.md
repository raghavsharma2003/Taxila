# Regeneration round 3: judged 2026-11-11

- **Candidates:** 18, from `data/studio-approved/candidates-regen-r3/`. One topic, c5-maths-ch02-t03, had no candidate after two attempts.
- **Lane:** approve-check predicates, then a render at p412 and l1366. Judge A is a separate Claude Opus agent that sees only the packet. Judge B, the same kind of agent, judged only judge A's passes.

## Result: 2 stored
- c4-maths-ch05-t01 (slice-at)
- c6-maths-ch05-t01 (sieve-storm)

Both pieces passed both judges.

## Refused by the predicates before any judge (6 of 18)

| Topic | Engine | Reason |
|---|---|---|
| c4-maths-ch01-t02 | geo-forge | "vritt" in a title is not one of this topic's words |
| c6-maths-ch08-t01 | geo-forge | mixed script: "Tribhuज" |
| c7-maths-ch05-t01 | geo-forge | mixed script: "Tribhuज", "Samलamb" |
| c7-maths-ch05-t02 | geo-forge | mixed script: "Tribhuज" |
| c6-maths-ch07-t03 | catch-on-line | 3/5 and 6/10 are not on a line with 12 ticks |
| c6-maths-ch07-t04 | catch-on-line | 3/5 and 3/8 are not on a line with 12 ticks |

The four geo-forge pieces were re-checked with the later predicate, which adds the lesson-words allowance and the spelling variants such as vishamabahu and lambavat. All four are still refused, for the reasons above.

## Refused by a judge (10 of 12 judged)

| Topic | Engine | Judge | Faults |
|---|---|---|---|
| c4-maths-ch03-t01 | sieve-storm | A | register: even should be "sam sankhya" |
| c4-maths-ch06-t01 | instrument | A | values not on the rule's ticks (8 cm on a 2 km rule); misses the mix-up |
| c4-maths-ch07-t01 | dukaan | A | off topic; unrealistic prices |
| c4-maths-ch09-t01 | sieve-storm | A | misses the mix-up; the title mentions trays |
| c5-maths-ch01-t01 | vault-heist | A | unreadable: the words target overlaps the "Lakshya" label (an engine fault) |
| c5-maths-ch03-t01 | angle-cannon | A | the sub says ghadi (clock) |
| c5-maths-ch03-t02 | angle-cannon | A | misses the mix-up (paper corner); "safai" |
| c6-maths-ch02-t04 | angle-cannon | A | every item is 90°; misses the mix-up (a tilted right angle, which the engine cannot draw) |
| c7-maths-ch03-t01 | instrument | A | 0.7 m on a 2000 m rule; misses the mix-up |
| c5-maths-ch05-t01 | instrument | A pass, B fail | register: "rule" where "ruler" or "scale" is meant |

Files in this folder:
- `verdicts-judge1.json` and `verdicts-judge2.json`: the verdicts;
- `refused.json`: the store's refusal list;
- `predicates.txt`: each candidate's predicate result and render.
