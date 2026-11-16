# galti-pakdo/kaapi: Gate 2 battery (2026-11-16)

**Why this exists.** `RULINGS-2026-11-16-gate2-answers.md`, answer 2 under "a computed default for every family's picks": add exact `pickOptions` family by family, starting with the picks that are truly among four or more (`galti-pakdo` lines first). Run the habit battery over each family as it is added. A family that fails it has naming switched off until it passes (`RULINGS-2026-11-16-gate2.md`, last paragraph).

**Status.** galti-pakdo names today (it is not in `NAMING_OFF`). It still does after this pass: the battery passes on both goals. Nothing a child sees changed, and no served level changed (64,800 served bodies hash the same before and after, `proof.discriminates` included), so there is no re-cert.

## The pick and its exact options (`galtiLogic.pickOptions`, `galtiPickOptions`)

A working of n lines has the question and n − 1 working lines; n is 3 or 4 (a neat working whose bug is its last step can be one shorter).

| Mix-up | The pick | Options | Shows it |
|---|---|---|---|
| neat-correct | the verdict on a neat working | sab sahi, or one of the n − 1 lines flagged | sab: p = 1/n |
| right-answer | the verdict on a lucky working, after the question is weighed | the same n | sab: p = 1/n |
| check-later | the line the claim is weighed in first, on a neat working | any of the n lines | each line from the bug down: p = (n − at)/n |

The replay of the family's own acts (the default before) saw two or three of these options, so the p it gave was a floor.

**p and k, before → after.** These are over every generated level: each coverage entry × fades 1–3 × 20 seeds × no focus and each mix-up as focus, 11,105 levels. Only levels on which the pick exists are counted.

| Pick | Levels | p before | k before | p after | k after |
|---|---|---|---|---|---|
| pakdo:neat-correct | 250 | 1/3 | 4 | 1/4 to 1/3 | 3 (91 levels), 4 (159) |
| pakdo:right-answer | 741 | 1/2 | 4 | 1/4 to 1/3 | 3 (309), 4 (432) |
| pakdo:check-later | 250 | 1/3 | 4 | 1/4 to 3/4 | 3 (47), 4 (121), never (82: p 2/3 or 3/4) |
| sudhaaro:neat-correct | 833 | not a pick: named from one level | 1 | 1/4 to 1/3 | 3 (329), 4 (504) |
| sudhaaro:right-answer | 501 | not a pick | 1 | 1/4 to 1/3 | 3 (223), 4 (278) |
| sudhaaro:check-later | 833 | not a pick | 1 | 1/4 to 3/4 | 3 (272), 4 (296), never (265) |

**sudhaaro is a chance pick now (`galtiLogic.chancePicks: ["sudhaaro"]`).** Its verdict is the same line pick as pakdo's, made before the fix. It was not declared, so a mix-up there was named from one level. The battery found the result:

These figures are from the gate sweep with `cellIds`, the battery as it is now, under the rules from before.

| Child (sudhaaro) | worst fade, before | worst door sequence, before |
|---|---|---|
| blind: any verdict, any fix | 0.375 (neat-correct), 0.370 (right-answer) | 0.458 |
| blind: any six taps | 0.406 | 0.431 |
| one random slip a level | 0.266 | 0.347 |
| the same slip every level ("the option below": sab sahi when the break is the last line) | 0.594 | 0.708 |
| last time's right line | 0.391 | 0.500 |
| what I did last time | 0.250 | 0.375 |

pakdo before (k 4 on every level): no child who does not hold a mix-up was named in the gate sweep. Holders were named 0 to 0.026 (right-answer); after, 0 to 0.042.

Its correct still needs the fix after the flag, so it is not `oneDecision`. A mix-up row from it is now `chanceMis` at chance weight, named on a repeat by the computed default, as pakdo's is. `tests/r7-games-galti-pakdo.test.mjs` asserts this (it used to assert that sudhaaro's miss kept the game weight).

## The battery

`tests/r8-habit-battery-galti-pakdo.test.mjs` runs `tests/_habit-children.mjs` with `cellIds`. A session's kinds of working (sahi, lucky, neat) are drawn from the child's seed alone, so without `cellIds` the whole sweep would meet only `seeds` sequences of kinds. Children:

- **The ruling's children:**
  - the careful child, and a careful child who weighs the question first;
  - the blind guesser: any verdict and any fix, or any six taps;
  - one random slip a level;
  - the same slip every level: the verdict option above or below the right one;
  - every constant: sab sahi; line 1, 2 or 3 flagged; line 0–3 weighed first; the question weighed, then sab sahi;
  - what I did last time; last time's right line;
  - the first option, the middle option, the last line.
- **Holders:**
  - neat-correct: sab sahi on a neat working, unweighed;
  - right-answer: weighs the question, it balances, sab sahi;
  - check-later: weighs the last line first; weighs where the friend's working settles first; weighs any later line first.
- **Habits listed as the mix-up**, because no level can tell them apart from it:
  - **"sab sahi every level"**, with or without weighing first, holds neat-correct and right-answer. She trusts every working. On a neat working that is exactly the neat-correct act, and on a lucky working exactly the right-answer act.
  - **"Line j ≥ 1 weighed first, every level"** holds check-later. Weighing a later line before the question is the mix-up's own act.

**Result: every child who does not hold a mix-up is named in fewer than 1 session in 10** (worst fade pooled over pL, doors and seeds, and worst door sequence pooled over fades).

| Goal | Sweep | Worst non-holder, worst fade | Worst door sequence |
|---|---|---|---|
| pakdo | gate (2 a cell) | 0.016 (the option below, neat-correct, fade 2) | 0.042 (same, gtg) |
| pakdo | full | 0.025 (the option below, neat-correct, fade 3) | 0.033 (same, ttt) |
| sudhaaro | gate | 0.031 (the option below, neat-correct, fade 2) | 0.042 |
| sudhaaro | full | 0.037 (the option below, neat-correct, fade 2) | 0.042 (same, gtg) |

**Answer 3:** no child with no randomness in her acts has a cell at 0.5 or more in the full sweep. The worst is 0.300: the option below, f3 pL0.9 tgg, n 10.

**Holders (full sweep), named in fewer than half their sessions: reported, not failed.**

| Holder | pakdo | sudhaaro |
|---|---|---|
| neat-correct: sab sahi on a neat working | 0.035 | 0.043 |
| right-answer: the question balances, then sab sahi | 0.055 | 0.058 |
| check-later: the last line first | 0.016 | 0.023 |
| check-later: any later line first | 0.001 | 0.001 |
| sab sahi every level (neat-correct / right-answer) | 0.018 / 0.068 | 0.042 / 0.057 |

This is what the default means here, as the ruling said it would. A session meets a neat, a lucky or a right working a third of the time each. The default asks for 3 or 4 sightings in four levels, and check-later asks for none on a level where most lines show it. So a holder needs three or four workings of her kind in her first four levels, which is rare. The evidence for these mix-ups would be a constructed act confirmed on the same level (H3's shape). Here that would be the flagged line's step written out, or the claim weighed again after the beam tips. It is not built.

**Negative control (runs every time).** With `chancePicks` removed inside the test file, the blind verdict and the same slip in sudhaaro are over the line again.

The full table (`HABIT_FULL=1`: ten sessions a cell, thirty for a random child, four for each constant; about 5 min):

| goal | child | holds | mix-up | named (all sessions) | worst fade | worst door sequence | worst cell |
|---|---|---|---|---|---|---|---|
| pakdo | blind: any six taps (random) |  | check-later | 0.001 (n 2880) | 0.002 (fade 3) | 0.003 (ggt, n 360) | 0.033 (f3 pL0.9 ggt, n 30) |
| pakdo | one random slip a level (random) |  | neat-correct | 0.001 (n 2880) | 0.002 (fade 3) | 0.003 (tgt, n 360) | 0.033 (f3 pL0.9 tgt, n 30) |
| pakdo | same slip every level: the option below |  | neat-correct | 0.016 (n 960) | 0.025 (fade 3) | 0.033 (ttt, n 120) | 0.300 (f3 pL0.9 tgg, n 10) |
| pakdo | what I did last time |  | neat-correct | 0.002 (n 960) | 0.006 (fade 3) | 0.008 (gtg, n 120) | 0.100 (f3 pL0.9 gtg, n 10) |
| pakdo | what I did last time |  | right-answer | 0.003 (n 960) | 0.009 (fade 3) | 0.008 (ggg, n 120) | 0.100 (f3 pL- gtg, n 10) |
| pakdo | the mix-up: sab sahi on a neat working | **holds** | neat-correct | 0.035 (n 960) | 0.056 (fade 3) | 0.050 (gtg, n 120) | 0.300 (f3 pL0.9 tgg, n 10) |
| pakdo | the mix-up: the question balances, so every step is right | **holds** | right-answer | 0.055 (n 960) | 0.116 (fade 3) | 0.083 (gtg, n 120) | 0.400 (f3 pL0.3 ggg, n 10) |
| pakdo | the mix-up: the last line weighed first | **holds** | check-later | 0.016 (n 960) | 0.025 (fade 3) | 0.033 (ttt, n 120) | 0.300 (f3 pL0.9 tgg, n 10) |
| pakdo | the mix-up: any later line weighed first (random) | **holds** | check-later | 0.001 (n 2880) | 0.002 (fade 3) | 0.003 (gtg, n 360) | 0.033 (f3 pL0.9 gtg, n 30) |
| pakdo | constants that do not hold (line 1-3 flagged; the question weighed first) | | any | 0 (n 384 each) | 0 | 0 | 0 |
| sudhaaro | blind: any verdict, any fix (random) |  | right-answer | 0.001 (n 2880) | 0.002 (fade 3) | 0.006 (tgg, n 360) | 0.033 (f1 pL0.9 tgg, n 30) |
| sudhaaro | blind: any six taps (random) |  | right-answer | 0.002 (n 2880) | 0.003 (fade 3) | 0.006 (ggg, n 360) | 0.067 (f2 pL0.9 ttg, n 30) |
| sudhaaro | one random slip a level (random) |  | neat-correct | 0.000 (n 2880) | 0.001 (fade 2) | 0.003 (ttt, n 360) | 0.033 (f2 pL0.9 ttt, n 30) |
| sudhaaro | same slip every level: the option below |  | neat-correct | 0.022 (n 960) | 0.037 (fade 2) | 0.042 (gtg, n 120) | 0.300 (f2 pL0.9 gtg, n 10) |
| sudhaaro | what I did last time |  | neat-correct | 0.004 (n 960) | 0.009 (fade 2) | 0.017 (gtg, n 120) | 0.200 (f2 pL0.9 gtg, n 10) |
| sudhaaro | what I did last time |  | right-answer | 0.011 (n 960) | 0.025 (fade 3) | 0.025 (tgg, n 120) | 0.200 (f3 pL0.3 tgt, n 10) |
| sudhaaro | the mix-up: sab sahi on a neat working | **holds** | neat-correct | 0.043 (n 960) | 0.059 (fade 2) | 0.075 (gtg, n 120) | 0.400 (f2 pL0.9 gtg, n 10) |
| sudhaaro | the mix-up: the question balances, so every step is right | **holds** | right-answer | 0.058 (n 960) | 0.109 (fade 3) | 0.092 (ggt, n 120) | 0.500 (f2 pL0.9 ggt, n 10) |
| sudhaaro | the mix-up: the last line weighed first | **holds** | check-later | 0.023 (n 960) | 0.037 (fade 2) | 0.042 (gtg, n 120) | 0.300 (f2 pL0.9 gtg, n 10) |
| sudhaaro | constants that do not hold | | any | 0 (n 384 each) | 0 | 0 | 0 |

Children not listed are named in no session. The session is still the unit, not the child's day (H6, kept for the first real cohort). A second session in a day would be a second chance.
