# c6-maths-ch06-t01: director17 compared with director16

c6 fails the scale gate on two lines. It has 1 paging contradiction at offtopic row 36, the same row and the same mechanism as in director16, and the counter missed it again. The listening axis is 3. The held board cost no teaching: my held-cost count is 0.

## A. Hand counts

| Lesson | Beats | Verdicts | Contradictions | Right called wrong / wrong called right | False keys |
|---|---|---|---|---|---|
| steady | 26/26 | 18/18 | 0 | 0/0 | 0 |
| stuck | 19/19 | 17/17 | 0 | 0/0 | 0 |
| offtopic | 19/19 | 13/13 | 1 paging (row 36) | 0/0 | 0 |
| steering | 15/15 | 11/11 | 0 | 0/0 | 0 |
| **D17** | **79/79** | **59/59** | **1** (paging 1, held cost 0, second view 0, data 0, model words 0) | 0/0 | 0 |
| D16 | 80/81 | 61/61 | 1 (paging 1) | 0/0 | 0 |

- **offtopic row 36 (the contradiction):** "Haan, sahi hai, kyunki ribbon kinaare par lagta hai: 14 + 9 + 14 + 9 = 46 cm. Ab tumhari cricket wali baat…"
  - The take drew c2's board (`preselected` is a 10×4 rectangle, "10 cm | 4 cm"), while `held.unit` still says the remediation unit.
  - So the 14×9 close is said over c2's board.

## B. v6.8 items

| Item | Rating | Evidence |
|---|---|---|
| Held board | partly | 58 board changes; 55 in the right place. Three are wrong: steady 42 and offtopic 36 (c2 drawn on an aside turn, card not said) and steady 82 (s3-e1's "parimap 60 m" drawn on the break turn). One switch is missing: offtopic 40, where the bridge is said over c2's answer board. 0 turns with two changes. 0 unsaid cards graded: steady 43's "40 cm" was not graded. |
| Held cost | working | **0.** All four remediations were reworded to their then-card's figure (PQRST, 14×9, 19×8) and match the board up. The child followed each one: steady 55, stuck 65 and stuck 33 were all answered correctly right after. |
| Picture requests | partly | 4 of 4 drew an unrolled view, and each line matches it ("6 bhujayein seedhi karke ek line par: 5 cm…"). But no row records `split`, so "beside the held board" is not evidenced. All 4 lines lose their "?" and run into the card: "kul lambai kitni Poore hexagon…". |
| A4 | partly | No reply to an aside was graded. But 2 replies got no acknowledgement (stuck 40, offtopic 20), and 2 got a canned "Achha, yeh jaankar achha laga" that does not fit: to "40 cm" (steady 44) and to "pehle main try karun?" (offtopic 38). The next card was pinned twice (steady 42, offtopic 36). |
| G1 | working | 0 misgrades. The near number "26 m" for 29 was called wrong (steering 10). A bare "54" for a meter reading was accepted (steady 56, stuck 66), which is reasonable for a counter. |
| V1″ | working | Hooks are the authored line in 4 of 4 lessons. Card "?" marks are kept. |
| B1‴ | partly | 1 of 4 clean (offtopic 34, which gives the simpler's new words). stuck 8 repeats the body with one word changed ("triangle" → "tribhuj"). steering 8 skips the live remediation and goes straight to the card. No closed card was reopened (D16's steady 38 is fixed). The greeting's "pata nahi" did not carry over. |
| R5 | partly | Check-ins use 6 forms (D16 used 1). Worked closes say their why once. No "Ab agla kadam" after a remediation. "aage chalo" moved on 4 of 4. Still wrong: "Ab doosra kadam. Pehle 7 aur 9…" (stuck 42, offtopic 18, steering 32), and "Pehla kadam dekho." said before the problem (steering 28). |
| H5 | not working | It missed offtopic 36 because it reads `held`, not the take. It raised 39 `partOffBeat` flags, all false: they compare against the beat labels of the answer-state page. It raised 8 `contradictionsV6` flags (steady 14, 58, 64, 80; stuck 22; offtopic 50; steering 24, 40), all on computed totals. |
| D11 | partly | Natural numbers for class 6: 46, 54, 90/28. The four watch items are not in c6. The l-plus-b remediation lost its counter readings, so "saath mein meter" now names a counter that never reads anything. The s1 bridge was reworded but still carries its own 6×4 `bridgeBoard`. Bridges remain units of their own. |
| Carried | mostly holding | A3: 0 asides lost. P5: the preselect rows keep verdict, key and pages. K3: the key comes before the bridge (offtopic 40). Q1: 3 of 4 (offtopic 38 heard a try-first as an aside reply). F2: 0 taste claims. "bhuja mein 4" carried (stuck 22, steering 22). |

**Frames repeated within 4 turns: 7.**
- ". Dekho," steady 14/22, 58/64, 74/80; offtopic 14/22.
- "Achha" steady 42/44.
- The give-up frame stuck 48/52 and steering 16/22.
  - Forms seen: "Nahi, yeh jawab nahi hai"; "Yeh jawab sahi nahi hai".
- Right verdicts rotate: "Haan, sahi hai" / "Bilkul sahi" / "Haan, bilkul theek" / "Sahi jawab".

**Board changes:** 58 turns with a change, 55 in the right place, 4 second views, 69 turns that held the board.

**Asides:**

| Aside | Park → return | Note |
|---|---|---|
| steady cricket (35) | 36 → 42 | On time, but parked "is sawaal ke baad" with no question open. c2 pinned during the return. |
| stuck Virat? (37) | answered 38 | After the worked step. No acknowledgement at 40. |
| offtopic Virat? (7) | answered 8 | Clean; "Theek hai." at 10. |
| offtopic Virat? (17) | answered 18 | After the step. No acknowledgement at 20. |
| offtopic sixer (31) | 32 → 36 | Generic return. The contradiction. |
| steering Virat? (25) | answered 26 | Clean. |

No taste claims ("meri koi pasand nahi hoti").

**Hints after wrong answers:** 22 misses. Escalation was right in every case: simpler, then remediation or key. Every posed card ended with its key except steering s2-e1 (posed at row 48; the goodbye came at row 51). One line re-said: stuck 8.

**Turns over 60 words:** 10 (D16: 11).
- Monologue: stuck 68; steering 16 and 22 (key + new point + card).
- Tutoring: steady 14, 20, 62; stuck 22, 48; offtopic 12, 50.

**Pace:** identical to D16. steady reached the s3 bridge, stuck s2-e2, offtopic the s2 worked close, steering the s2-e1 remediation.

## C. Defects

| Defect | Rows | Layer | Status |
|---|---|---|---|
| Aside-return turn draws the next card; the close goes over it | offtopic 36, steady 42 | b | carried (same row as D16) |
| Break turn advances the held unit and draws s3-e1 | steady 82 | b | carried |
| Bridge after a give-up gets no switch | offtopic 40 | b | new |
| Bridges keep their own `bridgeBoard`, which breaks the unit rule | steady 46, 80; stuck 56; steering 44 | a + b | new |
| A4 acknowledgement missing or not fitting | stuck 40; offtopic 20, 38; steady 44 | b/c | new |
| Step taught first, aside answered second | stuck 38, offtopic 18 | b | carried |
| Hindi request: same sentence / card instead of reworded remediation | stuck 8, steering 8 | b | carried |
| Picture line loses its "?" and runs on | steady 18, stuck 18, offtopic 26, steering 14 | c | new |
| "Ab wahi dekhte hain. Ab aage chalte hain." | steady 46, stuck 56, offtopic 40, steering 44 | a + c | new |
| "Pehla kadam" before the problem; "doosra kadam. Pehle" | steering 28; stuck 42 | c | new |
| `held` record disagrees with the take; no `split` recorded | offtopic 36; all picture rows | d | new |
| Goodbye during an open card | steering 51 | d | carried |

**Gone since D16:** the doubled worked close, the single check-in form, "Ab agla kadam" after remediations, the reopened closed card, hook model lines, the silent c1 pin, the dropped picture line, the steering break drawing a card, and "Kono ke naam A se F tak".

## D. Scores, director16 → director17

| Axis | Score |
|---|---|
| Listening and answering | 3.5 → **3** |
| Worked example | 4 → 4 |
| Class level | 3.5 → 3.5 |
| Screen and speech | 4.5 → 4 |
| Register | 3.5 → 3.5 |
| Promises kept | 3.5 → 3.5 |

## E. Verdict

**c6 does not pass the scale gate.** Beats (100%), verdicts (59/59), misgrades (0) and false keys (0) all pass. Two lines fail:
- **Contradictions:** 1 paging contradiction at offtopic 36, in the runtime walk (layer b). The held board did not stop the aside-return turn from drawing the next card.
- **Listening:** 3, below 3.5.

Listening does not reach 3.5. Promises hold at 3.5, and register holds at 3.5.

**Reversal clauses:**
1. Held cost is **0**. Neither the worked-example axis nor the class-level axis fell below 3.5.
2. **Triggered for c6.** The request × beat-kind pairs that failed:
   - an aside question during a worked step;
   - the reply to an aside question when the reply is a card answer or a try-first;
   - Hindi during a remediation, and Hindi during a point;
   - a cricket statement when no card is open.
3. No misgrades.
4. H5 missed **1 of 1**.

**Changes that would most move it:**
1. On aside-return and break turns, Studio draws only `held` (no preselect), and H5 reads the take.
2. Make the A4 acknowledgement depend on what the child said, and answer the aside before teaching the step.
3. Merge each bridge into the next card's unit, and keep the "?" in picture lines.

**Batch: no.** The blockers are in the runtime and would carry into every topic, and the counter still cannot see them.