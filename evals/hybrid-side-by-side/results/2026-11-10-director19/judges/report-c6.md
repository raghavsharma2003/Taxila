# c6 (c6-maths-ch06-t01) director19 report, compared with director18

c6 does not pass the gate. It has one second-view contradiction (steady row 18), and register and promises both fall to 3.

## A. Hand counts

| Lesson | Beats taught | Verdicts | Contradictions | Unsaid boards | Right called wrong / wrong called right | False keys |
|---|---|---|---|---|---|---|
| steady | 27/27 | 20/20 | 1 second view (row 18) | 0 | 0/0 | 0 |
| stuck | 20/21: the s1 worked problem was never said (row 38) | 21/21 | 0 | 0 | 0/0 | 0 |
| offtopic | 21/21 | 16/16 | 0 | 0 | 0/0 | 0 |
| steering | 15/15 | 13/13 | 0 | 0 | 0/0 | 0 |
| **D19** | **83/84 (98.8%)** | **70/70** | **1**: second view 1; paging, held cost, data and model words 0 | **0** | 0/0 | 0 |
| D18 hand | 79/80 | 59/59 | 2, both second view | 0 | 0/0 | 0 |

- **steady row 18:** the child says "picture dikhao" over the hexagon (`shape@1`, only one side labelled). She answers "Iska alag chitra abhi nahi hai, isliye board wala hi lete hain." The record shows `picture.view: null` and the board kept. Her words are true, but the gate counts "a picture request answered with nothing new drawn". The cause is that a `shape@1` board carries no sides array, so no view can be built from it.
- **What is not a contradiction:**
  - "Board par 10 aur 6 ek-ek baar likhe hain" (s2 e1) is true. `measuredBoard` writes only the bottom and right labels.
  - The harness flagged steady rows 14, 58 and 76. These are closes said over their own answer-state boards, so the flags are false.
- **Watch item, not counted:** the l-plus-b ant and its meter exist only in words (stuck 64, offtopic 56).

## B. v6.10 items

| Item | Rating | Evidence |
|---|---|---|
| P6 | working | Three views are drawn with `layout.split`: stuck 18, offtopic 28 and steering 14 ("Is tribhuj ki 3 bhujayein seedhi karke ek rekha par: 4 cm, 5 cm, 6 cm."). None of these lines states the key. **0 picture lines are spoken with no view.** The honest line appears once in the whole run (steady 18). It sounds natural, but with one instance its variation cannot be judged. |
| T2 | partly | **Pass:** aside during a worked step (offtopic 18, "Main AI hoon… Pehle 7 aur 9 jodo"). Hindi does not spend help (steering 8, then a miss gets the simpler at 10). Hindi on an open card does not give the key (stuck 8). Resume after an aside reply (offtopic 10, steering 26: next point, nothing lost). Clarify at a check-in re-says the point in other words (offtopic 68). Try-first with a card open (4 of 4). "pata nahi" at a check-in poses the card (steady 52, offtopic 50, 58). "haan" in a worked step (10 of 10). A miss after spent help gets the key (7 of 7). "Kuch poochna hai?" appears 0 times. **Fail:** stuck 38, where the walk resumes after the aside at step 1 and the kyari problem is dropped. **Weak:** "pata nahi" after a key moves on (stuck 74, steering 18). **Untested:** "woh maine bata diya" after a card, and try-first with no card open. |
| A6 | working | 0 canned acknowledgements. After an aside reply she says one neutral "Theek hai." and then the point. The board changes under that one word, which is harmless. |
| R7 | partly | Keys get a why and a check-in (stuck 36, 72; steering 16). Step openers are right (steady 66, stuck 38, steering 40). Nothing is appended after a bridge. **Fails:** key plus the next card in one turn after a miss (stuck 46 and 50); stuck 46 names a "kyari" the child never heard. The Hindi twin "Square… Is varg ka" appears 3 times (steady 58, stuck 74, offtopic 64). |
| Joints | not working | **asidePark** form 1, ×2 (steady 36, offtopic 36), both with the second sentence doubled: "Pehle yeh kinaara naap lete hain. Pehle yeh kinaara naap lete hain." No edge follows. **asideReturn** form 1, ×2 (steady 40, offtopic 44), with `{said}` dropped by the guard repair. What remains is "Uske baare mein thoda aur batao." followed at once by a card. **hindiSwitch:** "Haan, Hindi mein hi chalte hain." ×2 and "Theek hai, ab Hindi mein kinaara naapte hain." ×2. Only a few nouns change (aayat, tribhuj, varg, bagal). **askAgain:** never fired. |
| No re-pose | working | No card answered right was posed again. |
| D13 data | partly | The joint forms are true but clash with the walk. All three return forms ask the child a question, yet a card follows straight after. "kinaara naap lete hain" was said after the worked example had ended. |
| Carried | partly | **N1:** 0 unsaid boards. **N2:** 5 of 5 bridges switch on their first spoken part. **A4:** aside replies are not graded. **G1:** 0 misgrades. **A3 regressed:** both cricket asides are lost. **R6 regressed:** joints doubled or truncated, and the worked answer is dropped in 3 of 4 worked closes (steady 34, 70; offtopic 34). D18 said it all 4 times. |

**Frames repeated within 4 of her turns: 6** (D18: 7).
- The new "Phir se dekho:" / "Ek baar aur dekho:" opener: steady 44/52, stuck 58/66, offtopic 50/58. It appears 11 times in all, nearly always on a card's first posing.
- The ". Dekho," close: steady 14/22 and 70/76, steering 46/54.

**Board changes:**
- 72 turns changed the board; 70 changes were in the right place.
- Misplaced: stuck 38, where the aside answer was said over the worked board, and steady 38, where the Hindi joint was said over c1's board.
- 68 turns held the board, and 3 split picture turns neither changed nor kept it.

**Asides:**

| Aside | Park → return | Note |
|---|---|---|
| steady cricket (35) | 36 → 40 | Answers her own greeting question, yet it is parked. The park doubles its sentence and the return is garbled. Lost. |
| offtopic cricket (35) | 36 → 44 | The same failure. Lost. |
| stuck Virat? (37) | 38 | Answered, but the board changes under the answer and the worked problem is dropped. |
| offtopic Virat? (7) | 8 → 10 | Clean, with a question back to the child. |
| offtopic Virat? again (17) | 18 | One clause, then the step. On time. |
| steering Virat? (23) | 24 → 26 | Clean. |

Taste claims: 0.

**Hints after wrong answers:** 28 misses (steady 4, stuck 14, offtopic 4, steering 6). Escalation was right every time: the remediation or simpler first, the key only once help was spent. Nothing was re-said word for word. Every posed card ended with its key or a right answer.

**Turns over 60 words: 6** (D18: 9). Tutoring: steady 14, 20 and 58; stuck 22; offtopic 12. Monologue: stuck 46 (a key, then a new card).

**Pace:**

| Lesson | Compared with D18 |
|---|---|
| steady | 1 unit further (s3 e1 answered) |
| stuck | 2 units further (s2 worked) |
| offtopic | the same |
| steering | 2 units shorter: the child left at s2's bridge after extra picture and Hindi turns |

## C. Defects

| Defect | Rows | Layer | Status |
|---|---|---|---|
| Hexagon has no second view | steady 18 | a (`shape@1` has no sides) and Studio | carried, now honest |
| Park sentence doubled | steady 36, offtopic 36 | c | new |
| Return truncated, `{said}` dropped, card stacked after it | steady 40, offtopic 44 | c (guard repair) and b | new |
| Aside resume drops the worked problem | stuck 38 | b | new |
| Worked final answer missing after a right answer | steady 34, 70; offtopic 34 | c (R7 over-applied) | new |
| "Phir se dekho" opener on a card's first posing | 11 rows | c | new |
| Key plus next card after a miss | stuck 46, 50 | b | new |
| English word beside its Hindi twin ("Square… varg") | steady 58, stuck 74, offtopic 64 | c | new form |
| "pata nahi" after a key ignored | stuck 74, steering 18 | b | carried |

**Gone since D18:**
- the canned acknowledgement;
- the late aside answer;
- the Hindi request giving the key;
- "bhuja mein 4";
- "Ab aage chalte hain." after bridges;
- the lost e2 point;
- the missing `layout` record;
- the goodbye over an open card.

## D. Scores, director18 → director19

| Axis | Score | Why |
|---|---|---|
| Listening | 3.5 → **3.5** | The T2 rows mostly work. The cricket asides and stuck 38 hold it back. |
| Worked example | 4 → **3.5** | The final answer is missing in 3 closes, and stuck's problem was dropped. |
| Class level | 3.5 → 3.5 | |
| Screen and speech | 3.5 → **4** | Three true views drawn, and no line spoken without a view. |
| Register | 3.5 → **3** | Doubled and truncated joints, plus 11 "Phir se dekho". |
| Promises | 3.5 → **3** | "yaad rakhti hoon" ×2 not kept. "kinaara naap lete hain" was never done. "Hindi mein" swaps nouns only. |

## E. Verdict

**c6 does not pass.**
- It fails on contradictions: 1, second view (steady 18, layer a/Studio).
- It fails on axes: register 3 and promises 3, both in layer c (joint rendering).

Listening reaches 3.5. Register and promises do not.

**Reversal clauses:**
1. **Picture lines with no view drawn: 0.** Not triggered.
2. **Listening is 3.5.** Not triggered. The rows closest to failing:
   - aside × check-in (stuck 38): the rule was not followed;
   - aside × no card (cricket, steady 36/40 and offtopic 36/44): the park rule was followed, but the return was not, because rendering broke it;
   - "pata nahi" × after a key (stuck 74, steering 18): the rule is missing.
3. **Register is below 3.5: triggered.** The repeated code-written sentences, with counts:
   - "Phir se dekho:" ×8 and "Ek baar aur dekho:" ×3;
   - "Haan, pehle tum try karo —" ×4;
   - "Main AI teacher hoon, isliye meri apni koi pasand nahi hoti." ×3, plus one shorter variant;
   - "Tumhe Virat ke baare mein sabse achha kya lagta hai?" ×2;
   - the verdict frames "X sahi nahi hai." ×16, "Haan, sahi hai, kyunki" ×17 and "theek nahi baitha" ×5.

   The authored joints also arrived mangled: the park's second sentence doubled ×2, and the return cut to "Uske baare mein thoda aur batao." ×2.
4. **Misgrades, unsaid boards and held cost: 0.** Not triggered.

**The changes that would most move it:**
1. Say joints whole and once, never stack a return in front of a card, and keep the worked answer after a right answer.
2. Let Studio build an unrolled view from a regular polygon's single side label, or change e2's board to `measured@1`.
3. After an aside, resume at the worked problem, and keep "Phir se dekho" for real re-poses only.

**Batch: no.** The joint rendering and the dropped-part faults are in the runtime and would reach every topic.

**Untested by the gate:** a child would notice the doubled sentence, a teacher who asks what they like about cricket and then shelves the answer for good, and a "Hindi" that sounds exactly like before.