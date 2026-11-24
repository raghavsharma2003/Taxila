# c6-maths-ch06-t01 (perimeter), director34: hand report

**c6 passes every line of the gate on my count.** One ruling is left to main, at clause 47: steady 50 and offtopic 50 say "Toh 24 + 18 = 42 cm" over the board the step was asked on. No "?" is on screen and nothing there disagrees, but the board does not show 42, and the script's s2 step 2 has no `resultBoard`. If J3 is read to its letter, these are 2 data contradictions and c6 fails, on script lines only.

## A. Hand counts

| Lesson (rows) | Beats | Verdicts / keyed | Contradictions | Unsaid boards | R→W / W→R | False keys |
|---|---|---|---|---|---|---|
| steady (93) | 44/44 | 36/36 | 0 | 0 | 0/0 | 0 |
| stuck (81) | 39/39 | 28/28 | 0 | 0 | 0/0 | 0 |
| offtopic (75) | 36/36 | 24/24 | 0 | 0 | 0/0 | 0 |
| steering (59) | 28/28 | 19/19 | 0 | 0 | 0/0 | 0 |
| **D34** | **147/147** | **107/107** | **0** | **0** | **0** | **0** |
| D33 | 146/146 | 105/105 | 1 (paging) | 0 | 0 | 0 |

Steady row 86 has a legacy `closeOffBoard` flag. It is not a contradiction: "79 cm sahi nahi hai" is said over the closing question's own board.

## B. Items

**D33 mechanisms:** the no-picture turn is gone. The own reason with no named wrong answer is gone (17 own reasons, every one after its named answer). The cap's uncounted turns are gone. The Hindi request at a card with no form now gets the easier-words line (steering 8). The fixed forms are reduced: "Suno," after "Haan, sahi hai" is still there (steady 74; stuck 14, 38, 76; offtopic 10, 30, 44; steering 46, 56). The record is reduced: the invitation is still labelled `aside` in `pageParts` (steady 8; stuck 44, 66, 74; steering 10), though its seam now reads `yourTurn`.

**Boards: working.**
- 92 turns change the board, all in the right place; 53 hold it.
- Every page starts at its owning part's first word. Hooks are said over a blank board; joints and lead-ins keep the board that is up.
- Every point is true of its board.
- Remediations with no board of their own are said over the card just answered. "Ek cheenti khet…" is said over the notebook cover (steady 52, offtopic 52), and "Andar ke 1 cm wale square gino" over an ungridded square. Both are imagined, so not counted.

**No-picture turns (J1):**
- Stuck 18: the line, then the step's easier wording (which owns no board), then the re-ask. The board is kept. The line is not strictly true: the step's view is held back on purpose (carried from D33).
- Steering 16: "Isse alag koi chitra abhi mere paas nahi hai. Chalo, ab tumhari baari." The board is kept and the line is true, but the child gets nothing new.

**Pictures:** steady 18, offtopic 28 and steering 14 each drew the named view. Every caption is authored and true and none gives an answer away.

**Ladder (J2):** correct everywhere. In stuck, each named answer gets the own reason, the next miss gets the hint, and the one after that the invitation. The only key is the closing question's (steady 88), said after its hint.

**Cap and invitations (J4):**
- Longest run of one question by ear is 2, except stuck 4–8 (card, re-ask, Hindi form). That run is allowed by the Hindi exception.
- Steering hears the PQRST question 6 times in 8 turns, broken up by invitations.
- Invitations: 6 in all, each after help or the no-picture line, never after a park, reply or question.
- Pointed invitation: offtopic 18 only. It is curt but not scolding.

**Help:**
- 0 help turns with nothing new, and 0 requests answered without help. The "nothing easier" line is never said.
- 3 help turns are the same idea in the same order as the line before: stuck 42 and 72 ("andar ke 1 cm … square ginta hai") and stuck 36.
- Hindi: stuck 8 and offtopic 32 ask "thoda hindi mein samjhao" and get the switch line and the question's form, with no explanation (as in D33).

**Turn shapes:**

| Shape | st / sk / of / sr | Words | Worst |
|---|---|---|---|
| a: verdict, reason, point, card | 5/4/4/4 | 49–68 | steering 46; dense, but the question is clear |
| b: hook, point, card | 1/1/1/1 | 67–73 | stuck 4 (73 words, after "pata nahi" twice) |
| c: miss, remediation, card | 4/4/3/2 | 53–60 | reads as a teacher |
| d: verdict, lead-in, problem, step | 3/2/2/2 | 62–66 | none |
| e: reply or park into the lesson | 2/2/2/1 | 32–73 | steady 40 |

Turns over 60 words: 9/11/9/8. Over 75: 0. Over 90: 0. Every turn ends on an allowed ending.

**Check-ins:** steady 3 (rows 32, 66, 88), stuck 1, offtopic 2, steering 1. The longest run is 1, and none fall in a forbidden place. This does not match the README for steady (2) and stuck (0). I do not find them tedious.

**Worked examples: 4.**
- All three asked steps are deciding steps.
- Steady 24 ignores the child's "31 metre".
- Offtopic 50 confirms only "jod lete hain" after the child said "jodkar double".
- The s3 own step (3 × 160) is real work.

**Short reasons:** 11 rows, all true. Stuck 62 ("10, 6, 10, 6 jodkar 32 m", after two misses) is thin.

**Joints:**
- 0 misplaced joints, 0 double joints, 0 missing back-to lines.
- Abrupt seams: 3. Steady 40 ("wapas aate hain jahan hum the" before a new rectangle), offtopic 24 (a bare step re-ask), steering 16.

**Asides:**
- Replies: "Wah, chauka! Toh yeh tumhe achha lagta hai." (steady 40, stuck 58, offtopic 22, steering 44) and "Arre, Virat! Toh tumhara favourite yahi hai." (offtopic 40). Both natural; better than D33. No taste claims.
- Offtopic 38: the second AI line asks "Tumhara favourite kaun hai?" after the child had already named Virat.
- Offtopic's park at row 18 is never returned to. Rows 20–22 cover the cricket talk in substance.

**Wrap:** row 88 is "Iska jawab hai 72 cm, kyunki…". Row 90 says the short `wrap.covered`. Row 92 uses s3 c3's `did` (right at first try, row 83); it is true.

**Reader:** 1 wrong kind, steady 91 ("sawaal achhe the" read as wrong, a harness fault). What she said there is right.

**Stop path:** stuck 80 is the frozen stop menu (carried). Offtopic 74 and steering 58 are authored goodbyes. Model words: 0.

**Script sentences:**
- "Lambai guna chaudai … ginta hai, kinaare ki lambai nahi" uses *lambai* for two things in one sentence.
- Four names for perimeter: parimap, poora kinaara, kinaare ka naap, chakkar.

**Register (3.5):** rows by cause: (a) 3, (b) 3, (c) 1, (d) 5, (e) 4, (f) 4, a total of 20.

**Pace:** the same as D33. Steady reaches the end and skill 3 is at class level. Stuck and steering stop at the s2 worked example; offtopic stops at the s3 bridge.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| A value said over the posing board, with no result board | steady 50, offtopic 50 | a | flagged under J3 |
| "Samjhao" answered by the question's form alone | stuck 8, offtopic 32 | b | carried |
| No-picture line, then invitation only | steering 16 | b | changed |
| "Suno," and the "andar ke 1 cm" frame | above | c/a | carried |
| `aside` label on the invitation; wrap answer read as a miss | above; steady 91 | b/d | changed |

**Gone since D33:** steering 16's board change, and own reasons said after an answer they were not written for.

## D. Scores, D33 → D34

| Axis | Score |
|---|---|
| Listening | 4 → **4** |
| Worked example | 4 → **4** |
| Class level | 4 → **4** |
| Screen and speech | 4 → **4.5** |
| Register | 3.5 → **3.5** |
| Promises | 3.5 → **4** |

## Reversal clauses

1. Boards: 0 / 0 / 0 / 0, and no point or remediation board is untrue of its words.
2. Shapes as in the table; I find none too much in one breath. Off-list endings: 0.
3. Requests answered without help: 0. "Nothing easier" line: 0.
4. Nothing-new help: 0. Keys given with a wording unsaid: 0. Keys where a hint would have done: 0.
5. Short reasons: 11, all true; one thin.
6. Check-ins as above. Steady has 93 rows and 3 check-in turns; longest run 1; forbidden ones 0.
7. Worked example 4; all deciding steps; no bad keys.
8. Joints: 0 / 0 / 0; abrupt seams 3, so the form clause fires.
9. Stop and model words: 0 new.
10. Hints and re-asks: 1 (stuck 62→64 says the whole e2 card twice running; it has no re-ask form).
11. Register 3.5; causes as above.
12. Reader 1 (harness); captions 0; the sentence about the child is true.
13. Not below 3.5.
14. Untrue 1 (stuck 18's no-picture line), giveaways 0, repeated frames 4, unnatural 1.
15. None.
17. All three picture turns drew the named view.
18. Easier wordings at asked steps help. The follow-up card's second wordings (steering 12, 18) are new angles and of use.
19. "Theek hai, main shuru karti hoon." (stuck 4) and "Achha, pehle main dikhati hoon." (steering 4) do not brush the child aside.
20. Not a dead turn.
21. Remediations said alone: 0.
32. No second view settles its card.
33. 0 misgrades.
40. Returns (steady 38, stuck 56) are not abrupt.
41. Turns of 66 words or more: 4 (stuck 14, 62; offtopic 44; steering 46), not a monologue.
45. Two no-picture turns, no board change.
46. 17 own reasons, all after the named answer.
47. Steady 50 and offtopic 50: the script lacks the board.
48. Invitations as above; never after a park, reply or question.
49. Steering 8: the words after the line are easier.
50. No refused kind heard.
51. **Passes** (pending the clause 47 ruling).
52. Not applicable to c6.
53. Not applicable to c6.
16. Not applicable to c6.

## E. Verdict

c6 passes every line of the scale gate, unless main counts steady 50 and offtopic 50 under J3's letter; then it fails on script data. The changes that would move it most:
1. Give s2 step 2 a result board.
2. Answer "samjhao" with help as well as the Hindi form.
3. Retire "Suno," and the "andar ke 1 cm" frame.

**Yes, I would put it in front of a child:** it is true, the help speaks to what the child got wrong, and the screen matches the words. Listening reaches 3.5 (4), register is exactly 3.5, and promises reach 3.5 (4).

**For the main loop:** a parent would still hear the same aside reply in every lesson, and long first turns to a child who has just said "pata nahi". Steering hears one question six times in eight turns.

One note on the read-only rule: I wrote two temporary helper files to my scratchpad while reading the JSON and deleted them afterwards. Nothing else was changed.