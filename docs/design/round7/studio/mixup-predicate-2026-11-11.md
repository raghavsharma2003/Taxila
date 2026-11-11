# "Aims at the mix-up" as a predicate: measured, not wired (C1 Studio, 2026-11-11)

Main asked (07:32 item 6, 08:49 item 5) for the predicate where it is possible: value items with a numeric diagnostic case.

**Coverage.** Of the 30 regeneration targets (regen-r1-topics.txt), 19 have a numeric kit diagnostic case (the question has
numbers and the mix-up's answer and the true answer are different numbers). The other 11 (c4-ch01-t02, c4-ch03-t01,
c4-ch04-t01, c5-ch01-t01, c5-ch03-t01, c5-ch03-t02, c5-ch13-t02, c6-ch02-t02, c6-ch02-t03, c6-ch02-t04, c7-ch05-t02)
have word answers: a judge item only.

**The rule tried.** A spec aims at the mix-up when an item carries the case's own numbers (its givens), or the mix-up's
answer is among the values the child can pick (a trap). Numbers harvested from every spec field except layout, pacing and
seeding (seed, count, lo/hi, ticks, step, timer…).

**Measured against the judges**, on every candidate since 2026-11-10 whose topic has a numeric case and that a judge saw
(rubric v2, `misses_mixup` or not):

| | judge: aimed | judge: missed |
|---|---|---|
| predicate pass | 2 | 3 |
| predicate fail | 16 | 4 |

Agreement 6 of 25. It refuses 16 pieces the judges found well aimed (among them the stored c5-maths-ch02-t01 retry 7 and
c6-maths-ch06-t01): an aimed piece makes the mix-up bite with its OWN numbers, not the diagnostic's. And it passes 3 the
judges found missed (c4-ch14-t01, c5-ch13-t01, c7-ch02-t01): the numbers are there, used the wrong way.

**Decision.** Not wired. A predicate that refuses good pieces costs more regenerations than the judge it saves. What would
make it decidable is an executable mal-rule per misconception (a function: item → the answer a child holding the belief
gives), so a spec can be checked for an item where the belief's answer differs from the truth. The kit has diagnostic
options only; Games' play families have mal-rules for their own levels (data/play/coverage.json), not for Studio items.
Reversal: mal-rules authored for the targeted misconceptions (19 numeric ones first).

**What changed instead.** The aimed generation prompt now carries the mix-up's signs and its diagnostic case and asks for a
round where the belief's answer and the true answer differ (a1f41373f). The judge keeps item 2.
