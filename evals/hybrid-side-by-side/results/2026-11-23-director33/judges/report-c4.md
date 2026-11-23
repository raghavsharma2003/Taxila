# c4 (c4-maths-ch05-t01): director33 hand judgement

**c4 does not pass the scale gate. It fails one line: one contradiction, at steering row 16, caused by the runtime walk (code).** Every other line holds. Listening reaches 3.5, register 3.5 and promises 4.

## A. Hand counts

| Lesson (rows) | Beats | Verdicts / keyed | Contradictions | Unsaid boards | Right→wrong / wrong→right | False keys |
|---|---|---|---|---|---|---|
| steady (111) | 52/53 (row 30 is an invitation only) | 36/36 | 0 | 0 | 0/0 | 0 |
| stuck (71) | 33/34 (row 42, AI line) | 20/20 | 0 | 0 | 0/0 | 0 |
| offtopic (75) | 35/36 (row 38, "pehle tum try karo" alone) | 22/22 | 0 | 0 | 0/0 | 0 |
| steering (59) | 28/28 | 18/18 | **1** | 0 | 0/0 | 0 |
| **d33** | **148/151 (98%)** | **96/96** | **1** | **0** | 0/0 | 0 |
| d32 | 144/147 | 90/90 | 0 | 0 | 0/0 | 0 |

- **The contradiction (paging, walk), steering row 16.** The child asked "ek aur picture dikhao". She said "Is sawaal ki bas yahi ek tasveer hai.", and at character 38 the remediation's other wording drew a new board (a roti in 8 parts, 3 shaded). H2 names a "no other drawing" line with something new drawn as a contradiction. The card's hint was already spent at row 10, so the rule wanted that line and then the question. Instead the turn ends on "Yahan tak saaf hai?".
- **Unequal drawings checked in code.** I read `templates.js:359`: the big piece of an unequal drawing is exactly half. So "bada tukda theek aadha" (s1 c1) and "chhota tukda 1/4 se kam" (s1 c3) are true.

## B. Items

| D32 mechanism | Status |
|---|---|
| 1 Hindi promise with no Hindi | **Gone.** Stuck 8, offtopic 32 and steering 8 each say the switch line and then the authored form. Steady 36 (own step, no form) gets the hint and the reask with no word about Hindi. The child gets help, but the request reads as half-ignored. |
| 2 Key at a picture request | **Gone.** 0 keys across 5 requests. Replaced by the steering 16 contradiction. |
| 3 Help misses the mistake | **Reduced.** Of 8 second helps, 5 are the card's own reason and speak to the child's named answer: steady 10, stuck 26, offtopic 34, steering 12 and steering 30 ("2/1 ka matlab hota do poore circle"). The other 3 are the own reason said at cards that have no named wrong answer: stuck 66 speaks of "4 aam", which the child never said; offtopic 52 answers the child's earlier "4", not her last "1"; offtopic 60 leaves only 20÷5 to do. |
| 4 One question 3+ turns running | **Still there.** Stuck 14–18 (prompt, reask, picture turn); offtopic 28–34 (four turns, through the Hindi form); steering 6–12 (four turns). None ends the third turn on an invitation. |
| 5 Check-in before a due return | **Gone.** Steady 38 and offtopic 46 end on the return's question. |
| 6 Pictures | **Reduced.** Steering 14 draws the round view and ends on "Ab tum batao."; the view is gone at row 16 before its question is said again. |
| 7 Script lines | The D32 c4 s3 e1 board that gave its answer away is gone, and the s3 asked step is now a reasoning step. |
| 8 Carried | "Dekho," is at most 2 a lesson (was 9). The greeting's start line no longer comes mid-lesson. Still there: "kaam poora ho jaaye. Ab yeh kaam poora karte hain." (steady 32), and a reason said twice running at a worked close (offtopic 20→22). |

**Boards.**
- Turns: 92 changed the board, all in the right place; 55 kept it; 13 others (greeting, hook, picture splits).
- Every joint, lead-in and bridge was said over the earlier card's kept answer board.
- Every remediation board is true of its words.
- At two turns the pending card's board is not on screen when the turn ends: stuck 32 and steering 16 end over the remediation's board.

**Help.**
- Help turns with nothing new: 0.
- New words but the same idea in the same order: 2 (stuck 32, steering 18).
- Requests answered without help: 1. At stuck 58 a give-up at the bridge check-in gets "Koi baat nahi, chalo aage badhte hain." and the next part.
- Keys given: 0. The "nothing easier" line: said 0 times.

**Turn shapes.**

| Shape | n | Words | Worst |
|---|---|---|---|
| (a) verdict, reason, point, card | 16 | 55–65 | stuck 20: three objects in one breath |
| (b) hook, point, card | 4 | 67–71 | stuck 4 |
| (c) miss, remediation, card | 7 | 57–58 | steady 6: "Is chocolate…" for two different chocolates |
| (d) verdict, lead-in, problem, step | 7 | 53–69 | offtopic 18 |
| (e) aside reply or park into the live part | 7 | 26–68 | offtopic 48 ("Toh… Toh") |

- Turns ending outside the allowed endings: 4. Steady 62, stuck 68 and offtopic 54 are the known s2 item. **Offtopic 72 is new:** a check-in after a right answer at the follow-up card, and the Ravi card is never asked again.
- Turns over 60 words: 24. Over 75: 0. The 71-word first turns after "aap batao" read as monologue; the rest read as tutoring.

**Check-ins.** Steady 4 (rows 54, 62, 76, 106), stuck 2, offtopic 4, steering 2; the longest run is 1. They are not tedious.

**Worked examples.** All three asked steps are decisions or reasoning, not recall:
- s1: "neeche wala number kya hoga?"
- s2: "3 barabar group… ya 3-3?"
- s3: "3 wali ke ek tukde par 6 wali ke kitne?"

Stuck 46 tells the step after a "not that" ("Nahi, yeh nahi hai."). They read as working a problem with the child.

**Short reasons.** 11 rows, all true. Steady 88 ("4 wale pizza ke tukde kam, isliye bade") never says 1/4, although the card asked "kaunsa fraction".

**Asides.**
- Steady: park 32, return 38. Reply: "Achha, toh tumhe batting sabse achhi lagti hai." Natural.
- Offtopic: park 44, return 46. Same reply at 48.
- Offtopic 56, "Achha, pichhli baar sixer maara.", is better than D32's "yeh tumne bataya tha".
- Offtopic 70, "Achha, phir se sixer maara.", is odd: it hears the repeated line as a new six.
- The AI line (stuck 42) asks something new. No taste claims. No park left unreturned.

**Script (H7).**
- Overstated, 1: s2 e3 "Jitne barabar group bante hain, wahi neeche wala number hai" (said again in the wrap). Steady 66 and 74 then say "5/20 bhi sahi" and "6/18 bhi sahi", and the accept lists take them.
- Unnatural, 2: "1/3 mein ek group ki ginti jawab hai" (wrap, steady 108), and "Is chocolate" used for two different chocolates in one turn (steady 6).
- Giveaways: 0.

**Record.**
- The reader records one named wrong answer as plain wrong: steady 93 "3" is recorded as `wrong`, but it is the step's named wrong answer.
- "Ab tum batao." is recorded in `seams` as kind `aside` on 9 rows.

**Pictures.** 5 requests. Each caption is authored and true of its view.

**The sentence about the child.** Steady 110 names s3 c3, which the child answered right at the first try (row 103). It is true and natural.

**Pace.** The same as director32. The third skill is taught at class level.

**Frames.** "<answer> sahi nahi hai." ×7 in steady; "Toh poora jawab:" ×3; "Ab phir se socho, jawab kya hoga?" ×2, also said after give-ups (stuck 6, offtopic 24); "Haan, pehle tum try karo. Dhyaan se suno." ×2.

**Register, rows by cause.** (a) 1, (b) 1, (c) 3, (d) 5, (e) 4, (f) 6.

**Known item: safety turn.** None fired in my four lessons.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| A new drawing under the "no other drawing" line, and no question after it | r16 | b | new |
| Question 3–4 turns running through a Hindi or picture turn | k14–18, o28–34, r6–12 | b | carried |
| Own reason said at cards with no named wrong answer | k66, o52, o60 | b/a | new |
| Check-in after a right answer at a follow-up card | o72 | b | new |
| Give-up met with the go-on line and the next part | k58 | b | changed |
| "kaam poora" twice in one breath | s32 | c | carried |
| Overstated group rule | s64, s108 | a | newly seen |
| Record: `aside` for the invitation; "3" read as plain wrong | above | b | new |

## D. Scores (director32 → director33)

| Axis | Score |
|---|---|
| Listening | 3.5 → 3.5 |
| Worked example | 3.5 → 4 |
| Class level | 4 → 4 |
| Screen and speech | 4 → 3.5 (r16) |
| Register | 3.5 → 3.5 |
| Promises | 3.5 → 4 |

## E. Verdict

**c4 fails the gate on one line: one contradiction at steering 16, caused by code (the runtime walk), not the script. Clause 43 therefore fires: the staged batches stop.** Every other line passes, and every axis is at 3.5 or higher.

The three changes that would most move it:
1. On the no-picture path, draw nothing new and end on the question.
2. Count a Hindi turn and a picture turn toward the cap of two turns at one question.
3. Say a card's own reason only after its named wrong answer.

I would put this script in front of a child: it is true, its boards are honest, and its help now speaks to the mistake. I would fix the steering 16 path in the runtime first.

What the gate does not measure: a stuck or steering child hears the Pinky card six to eight turns running.