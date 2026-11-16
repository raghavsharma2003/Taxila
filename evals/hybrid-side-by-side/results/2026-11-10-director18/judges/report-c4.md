# c4-maths-ch05-t01: director18 hand judgement

**c4 fails the gate, but only narrowly.** N1 and N2 work: no board moved on a turn that taught nothing, and all four bridges switched in the right place. One contradiction is left (steady row 18), and register is still at 3.

## A. Hand counts

| Lesson | Beats | Verdicts | Contradictions (row: mechanism) | Unsaid boards | Right called wrong / wrong called right | False keys |
|---|---|---|---|---|---|---|
| steady | 26/26 | 22/22 | 18: second view | 0 | 0/0 | 0 |
| stuck | 17/17 | 14/14 | 0 | 0 | 0/0 | 0 |
| offtopic | 18/18 | 12/12 | 0 | 0 | 0/0 | 0 |
| steering | 11/11 | 8/8 | 0 | 0 | 0/0 | 0 |
| **d18** | **72/72 (100%)** | **56/56** | **1** (second view 1, paging 0, held cost 0) | **0** | 0/0 | 0 |
| d17 | 71/71 | 59/59 | 3 against the board, plus 4 unsaid | 4 | 0/0 | 0 |

- **Steady 18:** the child says "picture dikhao". The record shows `drawn: kept` with no `beside` page, so nothing new was drawn. Her line still says "Wahi poora ab patti: 2 barabar hisse…" and no patti is on screen.
  - I ran the same board split through Studio's `heldBoard` in isolation, also after row 16's switch, and it split fine. So the request was lost between the line and the draw. The line comes from `heldAltOf` and the drawing from `heldBoard`: two separate calls.
- **Unsaid boards:** I count 0 under v6.9's unit rule. The stop menus at steady 90 and stuck 70 keep the next unit's board ("1/2 | ?" and the 4×3 grid), whose card was never said; only its bridge was. That is N2 by design. If the main loop reads "a card she has not said" literally, the count is 2.
- **Held cost:** 0. The unequal-parts remediation is said four times (steady 56, stuck 60, offtopic 54, steering 32) over the torn-roti board, and it only says "socho".

## B. v6.9 items

| Item | Rating | Evidence |
|---|---|---|
| N1 | working | Every non-teaching turn kept its board and its unit: aside questions and returns (steady 46, offtopic 6/24/30, steering 24), try-first (stuck 28, offtopic 42) and menus (steady 90, stuck 70, offtopic 66). d17's steady 46 silent pin is gone. 0 boards went up for an unsaid card. |
| N2 | working | 4/4 bridges (steady 62 and 88, stuck 68, offtopic 62) switch exactly at the bridge part. Each is true of its board: "bahut saare laddoo… barabar samooh" over 4×3; "lambi patti… barabar hisson" over the bars. |
| T1 | partly | Passes: a request where an aside reply is expected is served (offtopic 26 picture, offtopic 32 Hindi); "nahi pata" after a spent simpler gets the key (offtopic 24); "haan" in a worked step gets the next step (offtopic 36, steady 38); "pata nahi" at a check-in poses the card (stuck 24 and 62, steering 12). Fails: listed under clause 2 in E. |
| A5 | working, but the positive path is untested | No reply was about an aside, and no acknowledgement was said. d17's misplaced acknowledgement is gone. Three or more forms: not exercised. |
| R6 | partly | "jitne tukde humne liye" is said as written 4/4. Two step openers in one turn: "Pehle yeh hissa. Ab upar ka number" (steady 38, offtopic 38); "Pehla kadam dekho… Ab agla kadam dekhte hain" (stuck 44). The picture lines end with a full stop, keep the card's "?", and say fractions as words. |
| S10/S11 | partly | Three splits (stuck 18, offtopic 26, steering 14) are built only from the held board's parts. Their lines are true: "Pizza: 3 alag-alag; Cake: 3 barabar". Steady 18 drew nothing. **`layout` is recorded in 0 rows.** |
| D12 | partly | Each s2 point models one grouping. **Watch item:** the order does not confuse, but it gives the answer away. e1's spoken "12… 4 barabar group, har group mein 3" (steady 64) is e3's key (12 ka 1/4 = 3), and e3's model, 12 as 2×6, is e1's answer board. e3 teaches nothing new. |
| Carried | holding | 0 cards graded off an aside reply (A4); 0 misgrades (G1); no aside lost (A3, fixed since d17). K1, K3, K4 and Q1 hold, and there are 0 taste claims. L1 mixes terms in Hindi mode: "group" and "samooh" in steady 84–88. |

**Frames:**
- Right: 3 stems × 2 joints in strict rotation ("Haan, sahi hai", "Bilkul sahi", "Haan, bilkul theek" with ", kyunki" or ". Dekho,"). 0 same-form repeats within 4 turns.
- Wrong: 6 forms.
- Re-pose: "Phir se dekho:" ×7.
- Identical in all 4 lessons: "Ab tumhari cricket wali baat: usmein tumhe sabse achha kya lagta hai?" and "Theek hai, ab Hindi mein."

**Board changes:** 57 turns had a change, all 57 in the right place; 76 turns held the board. The steering 50 menu has no `held` record. The record's own `changed` and `kept` flags are wrong (steady 46, 48, 70): the harness compares against the page the preselect drew earlier in the same turn (hybrid-side-by-side.mjs lines 322 and 363).

**Asides:** 0 taste claims.

| Lesson | Aside | Park | Return | Note |
|---|---|---|---|---|
| steady | cricket, row 33 | 34, "thodi der mein" | 46 | on time; "sixer" never picked up |
| stuck | cricket, row 33 | 34, "is sawaal ke baad", no card open | 40 | return stacked after the worked problem's "?" |
| offtopic | Virat, row 5 | 6, honest AI answer | — | |
| offtopic | cricket, row 19 | 20, "is sawaal ke baad", no card open | 24 | |
| offtopic | cricket again, row 29 | 30, engaged once | — | |
| steering | cricket, row 23 | 24 | 26 | |

**Hints after wrong answers:** 21 misses, escalation right 21/21, nothing re-said. Every posed card ended with its key said. Two misses after a spent simpler went to the unspent remediation rather than the key (steady 10, steering 10); I count that as right.

**Turns over 60 words:** 6. Four read as tutoring (steady 20, 22 and 70; offtopic 10). Two read as monologue: steady 72 (73 words, three number sets) and stuck 10 (75 words, given in answer to "Hindi mein bolo").

**Pace against d17:** steady, stuck and steering are level. Offtopic is +1 (it reaches the s2 e1 point).

## C. Defects

| Defect | Rows | Layer | Since d17 |
|---|---|---|---|
| Picture line spoken, split not drawn | steady 18 | b (Studio seam) | changed form |
| Clarify on a point poses the card instead of re-saying the point | steering 6, 44 | b | new |
| "is sawaal ke baad" said with no card open | stuck 34, offtopic 20 | b/c | new |
| Hindi on a point spends the card's simpler, so the next miss gets the key | offtopic 32→34 | b (table rule) | changed form |
| Same aside-return line and Hindi line in every lesson; two step openers in one turn; group/samooh mix | listed above | c | carried |
| e1's point states e3's key; e3 repeats e1 | steady 64, 72 | a | new (D12) |
| `layout` never recorded; wrong `changed`/`kept` flags; no record on the steering 50 menu | all | d | new |

**Gone since d17:** the silent pins at asides and menus, the bridge with no switch, the misplaced acknowledgement, the lost aside, the spent simpler re-said, "jitna tukda", the stop menu after "haan", and the undrawn answer state (steady 68).

## D. Scores (d17 → d18)

- **Listening:** 3 → 3.5. Request handling is mostly right; 5 table failures remain.
- **Worked example:** 4 → 4. The steps are real and on their board.
- **Class-level work:** 3.5 → 3.5. s2 now models, but e3 is redundant.
- **Screen and speech:** 3 → 4. One contradiction.
- **Register:** 3 → 3. A rotating template, the same lines in every lesson, and the step-opener slips.
- **Promises:** 3 → 3.5. Every aside was returned; one picture was promised and not drawn.

## E. Verdict

**c4 fails the gate.**

- **Passes:** beats taught (100%), verdicts (56/56), unsaid boards (0), misgrades (0) and false keys (0).
- **Fails:**
  - 1 contradiction (steady 18: the line is written by one call and the drawing done by another, layer b);
  - register at 3 (layer c).
- **Listening reaches 3.5, promises reach 3.5, and register does not reach 3.5.**

**Reversal clauses:**
- **(1) Unsaid boards:** 0. Not triggered.
- **(2) Listening:** 3.5. Not triggered. The failing table rows, for the record:
  - clarify × point (steering 6, 44): the rule was not followed;
  - aside × no card open (stuck 34, offtopic 20): the rule was not followed;
  - picture × open card (steady 18): the rule was not followed;
  - Hindi × point (offtopic 32): the rule was followed, but it is wrong, because it burns the card's hint.
- **(3) Held cost:** 0. Not triggered.
- **(4) Misgrades:** 0. Not triggered.

**The changes that would move it most:**
1. Speak the picture line only from the draw result (`heldBoard`'s `altLine`).
2. Make the aside return pick up what the child said, and vary the shared lines.
3. Re-author s2 e3 on a new heap, and fix the clarify-on-a-point row.

**Batch: no.** The remaining faults are small, but they are in the runtime and the reply layer, so every topic would inherit them. Register still sounds like templates.