**Judge 2: `kon/name`, gate 1 (play)**

**VERDICT: FAIL**

One fault decides it: on the phone, after a wrong tap, the "≠" row sits on top of the figure and reads as a label for the wrong angle. The other items mostly pass.

**A. Wrong fact: pass.** I measured every "≠" screen by eye against the drawn rays:
- `find-first-letter-played`: ∠APO (corner at P, about 50°) against ∠PAO (corner at A, about 40°). They look different.
- `find-vertex-first-letter-played`: ∠PBC (about 60°) against ∠BPC (about 50°). Different.
- `find-wide-wrong-arc`: ∠EOP (155°) against ∠EOD (70°). Clearly different.

So "≠" is true whichever way she reads it. I also checked the angle sums on the wide level (70 + 60 + 50 = 180), and they hold.

**B. Words against the picture: fail, through C** (see below).

**C. Seeing and reaching: fail.**
- `find-vertex-first-letter-played-360x640`: the brown chip "∠BPC = ∠CPB" is drawn over the figure. It hides part of the wide arc and part of the ∠CBA arc. It sits inside angle CBA, just under ray CB and near B, so it reads as the name of an arc at B, while her brown arc is at P. Both hidden arcs are still targets for her next tap. **Blocks.** The left chip also starts about 4 CSS px from the board edge.
- `find-vertex-*`: the wide arc ends on the dot A, because its radius (84) is almost the length of BA (85). It looks like a curved line joining BP to A. **Should fix.** On `find-wide-*` it ends close to P as well.
- `say-later-mal-vertex-name`: the dashed O-to-P line runs through the lit blue sector at P. **Minor.**
- The dashed rays beside solid lines are clearly separate at both sizes (about 8–9 CSS px apart). Every chip I checked is clear of every letter.

**D. Spelling and language: pass.** All strings are Hinglish, numbers are digits ("jaanch: 1") and there is no English sentence.

**E. Answer given away: pass.**
- `say-initial`: the asked letters read R,B,O / O,B,R by rows and B,R,O / O,R,B by columns. None is ROB or BOR.
- `say-later-initial`: O and C count as one row. The readings are POE, EOP, OEP and PEO. None is OPE.
- `find-*` and `find-vertex-*`: no reading gives the key. On the APO level, reading by columns gives "PAO", which is the mix-up arc, not the key.
- `find-wide-initial`: rows "EOPD" and columns "DEOP" both contain the key EOP, as the builders said. I find this acceptable. For a wide angle, reading E-O-P in order *is* the right reading (arm, vertex, arm). These levels are 1 in 5, and the first tap is graded at chance weight, so it adds nothing over a blind tap.

**G. Passing by trial: pass.** Repeated tries show on screen as "jaanch: N" and a pale tick. The three find keys shown are a corner, an inner vertex arc and the wide arc. "First letter" and "small arc" both miss on these levels.

**H. Fit for class 6: pass.** The instructions are short, nothing is babyish and there are no reward gimmicks.

**I. End screen: pass.** "Tumne ∠APO dhoondha · jaanch: 2" is true and useful, with no praise.

**J. Gate 1 fixes table:**

| Row | Fix | Status |
|---|---|---|
| 1 | No two angles within 8° | Done |
| 2 | Keys spread over all five arcs | Done, as far as the screens can show it (the new `find-wide-*` shots) |
| 3 | "≠" row and name chip clear of letters | Done for letters, partly done overall: the row lies over arcs at 360 |
| 4 | Dashed ray offset visible | Done |

**K1. Green means right: pass.** Tapped letters are blue-violet, her wrong arc and name are brown, green appears only on a solve, and the lime button keeps its own colour.

**K2. No key after a miss: pass, narrowly.** No miss screen marks the key. The overlap on `find-vertex-first-letter-played-360x640` hides two of the wrong arcs, which leaves the key one of the few clear arcs. That should go with the C fix. The game never does the skill for her.

**Faults**
1. **C/B, blocks.** `find-vertex-first-letter-played-360x640`: the "≠" row is drawn over the wide arc and the ∠CBA arc, and reads as their label.
2. **C, should fix.** `find-vertex-*`: the wide arc runs into point A.
3. **C, minor.** `say-later-mal-vertex-name`: the dashed ray cuts through the lit sector.
4. **C, minor.** `find-vertex-first-letter-played-360x640`: the "∠PBC" chip is about 4 CSS px from the board edge.

**For gate 2 (not part of the verdict)**
- On a wide-arc find level, a right first tap tells nothing beyond chance, because reading the letters in order gives the key. It is worth considering a lower weight for it than for other find levels.
- The say end line says "Tumne ∠ROB likha". I could not tell whether it repeats her own order when she writes "BOR".

**Three changes**
1. Treat every arc's stroke and touch area as a keep-out zone for the "≠" row and the name chip, the same way letters and lines are. At 360, put the row above or below the figure.
2. Keep the wide-arc radius clearly shorter than the shortest ray, for example ray length minus about 15 units, so the arc never meets a ray-end point.
3. Draw the dashed ray on the outside of the solid line, away from the lit sector.