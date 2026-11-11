# c6 (c6-maths-ch06-t01): director21 hand report

c6 passed every line of the gate in director20. It does not pass in director21. Two things block it: 3 contradictions at the end of the steady lesson, and listening and register both fall to 3.

## A. Hand counts

| Lesson | Beat turns | Unique beats | Verdicts | Contradictions | Unsaid boards | Misgrades (R→W / W→R) | False keys |
|---|---|---|---|---|---|---|---|
| steady | 56/57 | 40/40 | 29/29 | **3**, all paging (rows 114, 118, 120) | 0 | 0/0 | 0 |
| stuck | 33/33 | 14/14 | 12/12 | 0 | 0 | 0/0 | 0 |
| offtopic | 34/36 | 18/19 | 16/16 | 0 | 0 | 0/0 | 0 |
| steering | 27/27 | 15/15 | 14/14 | 0 | 0 | 0/0 | 0 |
| **D21** | **150/153 (98%)** | 87/88 | **71/71** | **3** | **0** | 0 | 0 |
| D20 hand | 133/133 | 77/77 | 62/62 | 0 | 0 | 0 | 0 |

- **The 3 contradictions.** The teachback and wrap turns have no unit (`intent.noUnit`), so the last card's board stays up (`held.kept`). At row 114 she says "Ek square ka parimap 36 cm hai; ek bhuja try karo" over the rangoli rectangle labelled "parimap 70 cm". At rows 118 and 120 she talks about the same square over the 12×8 plot. `check-run` reads 0 on these rows because no predicate looks at turns without a unit.
- **The untaught beat.** In offtopic the e3 point was never said. The aside return took row 14, and row 16 posed the e3 card without its point. The child then gave the area answer three times (rows 17, 19/21, 29). Steady row 116 is a re-teach of an earlier part in the wrong place.
- **Not counted as unsaid, by design.** Each remediation is spoken over its then-card's board, so the then-card's numbers are on screen one child turn before that card is said: steady 6 and 50, stuck 10, offtopic 8 and 66, steering 6. The main loop should rule on whether this counts.

## B. Items

**The director20 mechanisms**

| # | Mechanism | Status in director21 |
|---|---|---|
| 1 | Give-up with help spent gets no key | Gone: stuck 24, "Is sawaal ka jawab 30 cm hai" |
| 2 | Park never returned to | Gone: 3 of 3 parks returned, 0 returns without a park |
| 3 | Her reply sentence after an aside | Now authored: 0 odd, **4 flat** |
| 4 | "pata nahi" at a check-in | Gone (steady 52; steering 18, 20). Two were read as misconceptions (stuck 55, offtopic 49), with no harm done |
| 5 | Clarify at the greeting ignored | Gone: stuck 2 and steering 2 say greetSimpler, then the hook |
| 6 | Hindi promise, then the same words | Reduced: no empty promises. But stuck 8 repeats row 6's 23 words exactly |
| 7 | Whole card after every hint | Reduced: all 14 hint re-asks are the question only. 6 whole-card repeats within two turns remain (steady 32 and 74; stuck 8 and 34; offtopic 28 and 44) |
| 8 | Her question after the AI line ignored | Gone: steady 42 asks, row 44 answers |
| 9 | Turn ends with nothing for the child | "Ab isi par ek sawaal" is gone. 6 turns end on "Ab agla kadam dekhte hain" or "Chalo, aage dekhte hain" (steady 26, 62, 64, 100; stuck 46; offtopic 38) |
| 10 | Picture lines | Gone: 4 of 4 clean, no key in the line, no hole where a number was |
| 11 | Script data | The "16 m" simpler now fits (stuck 52). New faults below |
| 12 | Third skill never reached | Gone: s3 taught in full |
| 13 | Harness | Reduced. Stuck 39 answers a question she never asked. Stuck 59 does not answer her return question. Steady 115 answers nothing she said |

**Asides, all of them**

| Lesson | Park (row) | Return (row) | Child's answer | Her reply (row) | Rating |
|---|---|---|---|---|---|
| steady | "aapko virat pasand hai?" (41). The AI line and "Tumhe Virat ke baare mein sabse achha kya lagta hai?" come only after 4 teaching sentences (42) | — | "chauka" | "Hmm, chauka. Samajh gayi." (44) | flat |
| stuck | AI line, no question (38). Then park form 2 "Sixer ki baat bhi hogi…" (40), which goes on into the step | 58, its own turn: "Sixer ki kaunsi baat tumhe yaad hai?" (awkward: "sixer" is not in the sport match list, so the form came from "other") | "batting sabse achhi lagti hai" | "Batting... achha, samajh gayi." (60) | flat |
| offtopic | Form 2, "Cricket" (10), goes on into the then-card | 14, attached to the close of e2 | "catch pakadna" | "Achha, catch! Theek hai." (16) | flat |
| steering | Form 2, "Cricket" (34), goes on into step 1 | 40, attached to the worked close | "catch pakadna" | "Oh, catch. Achha." (42) | flat |

- Every park was one sentence, used the child's word and came on time. No taste claims.
- Offtopic's repeat asides got only "Achha." (row 24) and "Theek hai." (row 32).
- Against director20 ("Ball se sixer dekhna mazedaar lagta hai." and "Theek hai."): better on correctness, the same on warmth. The forms are flat by construction.

**Clarify and give-up rows**
- 12 rows were handled right: steady 9, 51, 59; stuck 1, 5, 13, 23, 41; offtopic 25, 61; steering 1, 29.
- **Second clarifies: 2 (stuck 27→28, 43→44). Both merely repeat**, and a third clarify (45→46) repeats again, then moves on.
- Steering 17 and 19 (give-ups after a key) also repeat the same sentence.
- Stuck 29 moves on to e3 with no sign the child understood.
- Child lines read as the wrong kind: **8** (steady 43, 115, 117, 119; stuck 55; offtopic 15, 49; steering 41). Steady 115 caused a jump back to the s3 e3 gate simpler (row 116).
- "sawaal kya hai", "phir se bolo" and "aage chalo" never occurred in c6.

**Re-asks.** In 0 of 14 did the question alone fall short. **The backTo joint fired 0 times.** 8 returns to an earlier card are bare (steady 12, 54; stuck 16; offtopic 12, 70; steering 12, 52), and offtopic 24 uses the code frame "Phir se dekho:" instead.

**Hindi requests.** Steady 36, offtopic 34 and steering 8 each give changed words, but in the same Hinglish register. Stuck 8 gives nothing new.

**Stitched turns: 14.** Each is two blocks set side by side with no join:
- "9 cm sahi nahi hai. Is khet ke kone P, Q, R, S, T hain." (×4: steady 6, stuck 10, offtopic 8, steering 6)
- AI line glued to teaching: steady 42; stuck 38, "…pasand nahi hoti. Phoolon ki ek kyari…"
- Aside reply glued to a card (×4)
- "Haan, pehle tum try karo — Ab teesri…" (×3)
- The teachback at steady 114

**Frames repeated within 4 of her turns: 12 (director20: 4)**
- The key re-said three turns running, with only the opener rotated ("Is sawaal ka jawab" / "Iska jawab" / "Yahan sahi jawab"): stuck 24–28, steering 16–20
- The same simpler: stuck 42–46 and 6/8
- The worked answer twice: stuck 54/56, offtopic 48/50
- "Iska jawab … kyunki": offtopic 22/30
- "Ab … kadam": steady 94–100
- "Dekho," after a verdict: steady 14/22 and 68/74, steering 32/40
- Steady 62/64

**Joints seen.** Park form 2 ×3. Library returns ×3. hindiSwitch "Theek hai, main yeh Hindi mein bolti hoon." ×3. greetSimpler ×2. askAgain 0. backTo 0.

**Board changes.** 68 changes, all in the right place for her words. 83 turns held the board, 3 of them wrongly (the contradictions). 4 split picture views.

**Hints after misses.** 29 misses. Escalation was right throughout, and every scripted card ended with its key or a right answer. Two exceptions:
- At stuck 54 the key never says 16 + 12 = 28, the step this child got wrong twice.
- The teachback's square-36 question was never answered.

**Turns over 60 words: 10.** 8 are tutoring. Steady 42 and steady 84 (81 words: plot, perimeter, cost and gate in one turn) are monologue.

**Pace.** Steady now runs to the end (director20 stopped at the s3 bridge). Stuck reaches the s2 bridge, short of director20's s2 e2, because the repeat loops ate turns. Offtopic and steering reach the same point as before.

**The third skill** is at class level, with a real 5-step worked example whose final answer is said (row 106). The ending is broken:
- an unscripted square question with a garden "parimap 36 cm" (118);
- a misread that jumps back to the gate (116);
- a wrap with no answer and no goodbye: "Tum chaaho toh jawab do, ya yahin ruk sakti ho."

**Right answers passed without a why.** Unitless answers are accepted where a tutor would probe: steady 57 ("24") comes right after "cm mein aayega, square cm mein nahi". Steady 39 lets Zoya's mistake go without asking why.

**Script sentences heard**
- Untrue: 0. Giveaway: 0.
- Repeated question frames, 4: "…ka parimap kitna hai/hua?" (s1 ×3, s2 ×4) and "Kinaare par ek baar X… kitna X lagega?" (s1 ×3, s2 ×3).
- Unnatural, 6:
  - "paanch kone hain: PQ 8 m…" lists sides after naming corners;
  - "Is khet ke kone…" opens straight after a miss on a triangle or hexagon;
  - "Bracket pehle: 24 + 18 = 42 cm, kyunki 42 cm aadha kinaara hai" (the "kyunki" explains nothing);
  - the same at s3 step 3;
  - s3 e3 says "phir guna", but the cost with the gate (₹380) is never asked;
  - the return question "Sixer ki kaunsi baat tumhe yaad hai?".
- Twins: confirmed steady 20 and steering 28 ("side" beside "bhujayein"); no other pair within a turn. Across turns, the authored lines say "triangle" while the picture lines say "tribhuj"/"rekha" (stuck 18, steering 14).

## C. Defects

| Defect | Rows | Layer | New since director20? |
|---|---|---|---|
| Teachback and wrap: stale board, unscripted question, misread, no close | steady 114–120 | b, c | new |
| A return displaced the e3 point | offtopic 14–16 | b | new |
| Second clarifies and give-ups merely repeat | stuck 28, 44, 46; steering 18, 20 | a, b | new |
| backTo never fires | 9 rows | b, c | carried |
| Authored blocks with no join | 14 rows | c | new |
| Flat reply forms; "sixer" kind missing | 4 rows; stuck 58 | a | changed |
| "phir guna" never finished; "kyunki" non-sequiturs | steady 84, 64, 96 | a | new |
| Child answers questions she never asked | stuck 39, 59; steady 115 | d | carried |

**Gone since director20:** the odd model reply, hollow Hindi promises, a key followed by the next card, the whole card after every hint, the "16 m" data mismatch, the greeting clarify ignored.

## D. Scores, director20 → director21

| Axis | Score | Why |
|---|---|---|
| Listening | 3.5 → **3** | Repeat loops for the stuck child, e3 skipped, steady ending misread |
| Worked example | 4 → **4** | All final answers said; stuck 54 skips the arithmetic |
| Class level | 3.5 → **4** | s3 taught (backward perimeter, cost, laps) |
| Screen and speech | 4.5 → **4** | 3 stale-board rows |
| Register | 3.5 → **3** | Stitched joins, frames up from 4 to 12, flat replies |
| Promises | 3.5 → **3.5** | Parks 3/3, the AI-line question answered; the steady lesson ends with no goodbye |

## E. Verdict

**c6 fails the gate.** It has 3 contradictions, and listening and register are both at 3. Promises reach 3.5. Beats (98%), verdicts (71/71), misgrades (0), false keys (0) and unsaid boards (0) all pass.

**Reversal clauses for the main loop:**
1. Of 4 replies after an aside: 0 odd or wrong, 4 flat, 0 natural. Not triggered, and not worse than director20.
2. Register is below director20. Saying authored parts whole by code causes 11 of the 14 stitched turns, so joins should be allowed under the word-for-word predicate.
3. Question-only re-asks not enough: 0 of 14. Not triggered.
4. Second clarifies: 2, and 2 of 2 merely repeat. **Triggered.**
5. Below 3.5, by row and cause:
   - offtopic 14 (return ate the point): rule missing;
   - steady 115–119 (teachback reply has no cell): rule missing;
   - stuck 27 and 43 (second clarify): rule followed, but no second wording exists;
   - steering 17 and 19 (give-up after a key): rule followed, but it only repeats;
   - steady 42 (child's question answered after the teaching): rule not followed.
6. Script sentences: 0 untrue or giveaway. Not triggered.
7. Contradictions: 3, all paging, at steady 114, 118 and 120.

**What would move it most:**
1. Give the teachback and wrap a unit and a board (or clear it), take the question from the script with a key, and end with the answer and a goodbye.
2. Learning writes second wordings for repeat clarifies, and the walk fires backTo on returns to an earlier card.
3. Authored joins between blocks, and a return that never displaces a point.

**Batch: no.** The teachback ending and the repeat loops are runtime faults, and every topic would inherit them.