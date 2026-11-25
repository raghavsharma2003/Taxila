FAIL on the scale gate for c4-maths-ch05-t01. It fails one line, "0 contradictions": stuck row 32 is one held-cost contradiction, caused by a sentence this round's script introduced. Every other line holds.

# c4-maths-ch05-t01, director36: hand judgement

## A. Hand counts

| Lesson (rows) | Beats taught | Verdicts / keyed answers | Contradictions | Unsaid boards (strict) | Right→wrong / wrong→right | False keys |
|---|---|---|---|---|---|---|
| steady (141) | 61/70 (bare waits 28–48: 9) | 42/42 | 0 | 0 | 0/0 | 0 |
| stuck (67) | 30/32 (28, AI line 42) | 20/20 | **1 (row 32)** | 0 | 0/0 | 0 |
| offtopic (67) | 29/32 (38, 42, 64) | 18/18 | 0 | 0 | 0/0 | 0 |
| steering (51) | 23/24 (20) | 16/16 | 0 | 0 | 0/0 | 0 |
| **d36** | **143/158 (90.5%)** | **96/96** | **1** | **0** | 0/0 | 0 |
| d35 | 141/157 | 93/93 | 0 | 0 | 0/0 | 0 |

**The contradiction, stuck row 32 (held cost; layer a, with the walk).** After a third "Golu" at the Pinky/Golu card, the walk switches to the remediation's own board at character 25. That board is the 10-piece chocolate with 3 coloured. Over it she says: "Pinky-Golu wali chocolate ke bina rang wale tukde bhi usi chocolate ke the, isliye neeche woh bhi gine jaate hain." The Pinky/Golu chocolate (4 pieces, 2 eaten) comes back on screen only at character 140, for the "Aaram se socho" line that ends the turn.

- The sentence names a figure that is not up, while a different chocolate with other counts is drawn. That is the gate's "describes a figure the held board does not show", and it matches the reasoning of D35 ruling 2.
- It is new. Commit 839b7460d (cold-read Pass 6) rewrote this sentence knowing "the walk says it over the remediation's 10-piece chocolate, offline stuck 32". The D35 text ("Khaane se pehle wali poori chocolate ke saare tukde…") was true of that board.
- The same sentence is fine at steering row 16, where it owns no board.
- Main could instead read it under K1, as a general statement that names no value. I don't: a child sees 10 pieces while she says "Pinky-Golu wali".

**K1 values stated but not drawn (script rows, not contradictions):**
- steady 80: "15 pencil ke 3 barabar group", said over the 5×3 grid.
- steady 116: "aadhi patti mein dhai", said over 2 shaded fifths.
- Nothing on either board denies the value. Both rows were also in D35.

## B. Items

**Boards.** 90 turns changed the board, all at the first word of the part that owns it; 59 held it. I checked `screen.pages` against `pageParts` on every row: every owned board is up at its part's first word. Joints, lead-ins and bridges are said over the board already up.
- Help over another part's board: 1 (stuck 32).
- The one key (steady 134) is said over its answer board.
- Record fault: at steady 102 `held.pages` gives the start as null, but the screen kept the board.

**D35 mechanisms in my topic:**

| Mechanism | Now |
|---|---|
| 1 Hint's board | Gone. Steering 16 says the line and then the words; the round view stays up. |
| 3 Wait with no end | Still there: steady 28–48 (11 turns, 9 of them bare). On d37's list. |
| 5 First turn | Reduced: 53–57 words (was 58–62). |
| 8 Closes | Still there: steady 140 answers "thoda mushkil tha" with "Achha, theek hai, maine sun liya." |
| 9 Key value said twice | Still there: steady 134 ("pehle 1/10, phir 1/7, phir 1/4" twice). |
| 10 Go-on line then back-to | Still there: steady 90→92 and 100→102. |
| 11 Remediation alone | Reduced 3→2: steady 84, 96. |
| 12 Script sentences | The "phir bhi" sentence is gone; stuck 32 is new. |
| 13 Record | The go-on line is still logged as `aside` (steady 74, 90, 100; offtopic 54). |
| D35's "13"/"9" help | Gone: offtopic 30 and steering 44 now get the counting hint, which fits the mistake. |

**Turn shapes:**

| Shape | n | Words | Worst |
|---|---|---|---|
| (a) verdict, reason, point, card | 16 | 54–65 | stuck 20 |
| (b) hook, point, card | 4 | 53–57 | – |
| (c) miss, remediation, card | 7 | 55–58 | stuck 56 (rope, paper, roti in one breath) |
| (d) verdict, lead-in, problem, step | 6 | 54–66 | steady 26 (66 words) |
| (e) aside or park into live part | 5 | 26–69 | offtopic 56 |

- Turns over 60 words: 23. Over 75 and over 90: 0. The longest are stuck 30 and steering 12, both 73 words: help plus the whole card again. They read as dense tutoring, not monologue.
- No turn ends outside the allowed list.

**Check-ins.** steady 5 (68, 84, 96, 104, 134), stuck 1, offtopic 1, steering 1. The longest run is 1. Strictly, 84 and 96 come before a waiting card (a remediation left alone). Only the wait loop is tedious.

**Worked examples.**
- s1 asks a deciding step: "…neeche wala number kya hoga?"
- s2 asks a deciding step: "3 barabar group mein baantoge, ya 3-3…?"
- s3 asks a reasoning step: "3 wali ke ek tukde par 6 wali ke kitne?"
- Stuck 46 gets the "not that" form ("Nahi, yeh nahi hai.") and then the told step.
- One fact is said twice: the bottom number 5 (offtopic 20→22, steering 36→38, steady 50→54).

**Short reasons.** 11 rows, all true and enough.

**Own reasons.** 13 said, each after its named answer: 0 misfires.

**Pictures.** 4 views: steady 18, stuck 18, offtopic 26, steering 14. Captions are authored, match the view drawn, and give nothing away. One no-picture line (steering 16), which is true there: nothing was left to draw.

**Asides.** Replies:
- "Oho, batting! Isi mein tumhe maza aata hai." (steady 56, stuck 44): natural.
- "Achha, toh tumhe batting pasand hai!" (offtopic 40): natural.
- "Arre, chauka! Achha hua tumne bataya." (offtopic 60): flat.

These are the same as D35. Every park was returned to. No taste claims. The second AI question was new ("kab dekha tha?").

**Stop path.**
- stuck 66 and steering 50 get the authored tired-bye line.
- offtopic 66 gets the stop menu after "bas aaj ke liye itna hi". I hear that as a clear stop, so clause 9 fires on its letter. The row is unchanged from D35, where it was not flagged.

**Hindi requests.**
- offtopic 32: a real change.
- stuck 8 and steady 36: the "Hindi" forms keep "fraction".
- steering 8: "Hindi mein bolti hoon", then the hint in the same Hinglish, then "bhinn". That is two words for one thing across the lesson.
- "rangin" means eaten in the remediation but left on the plate in the worked example.

**Reader.** 0 lines read as the wrong kind. 0 model words.

**Frames:**
- "Haan, sahi hai" ×10 (steady).
- Back-to, 3 forms ×5 (steady).
- Invitations ×6 (steady), 4 of them in the wait loop.
- "Nahi, yeh … nahi hai" at stuck 26, 30, 32 and 58, 60.
- "neeche wala number … ginta hai" about 12 times (steady).
- "Toh poora jawab:" at steady 54, 82, 122.

**Wrap.** Steady 138 gives the verdict with its why. The sentence about the child comes from s3 c2's `did`, which she answered right at row 127; it is true.

**Pace.** Same as D35. Steady runs to the end, and the third skill is taught at class level. Stuck and steering stop at the first bridge; offtopic stops in s2's worked example.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| Remediation simpler names the Pinky/Golu chocolate over the 10-piece board | k32 | a (b) | **new** |
| Wait with no end | s28–48 | b | carried (d37) |
| Go-on line followed by back-to | s90, s100 | b/c | carried |
| Key value said twice | s134 | c | carried (d37) |
| Goodbye reply deaf to "thoda mushkil tha" | s140 | c | carried (d37) |
| "bhinn"/"fraction"; Hindi forms still Hinglish | r8, k8, s36 | a | partly new |
| Stop menu after a clear stop | o66 | b | carried |
| Record: go-on line as `aside`; null page at s102 | – | d | carried / new |

## Reversal clauses

- **1:** fires on its second half (stuck 32: a remediation part untrue of its board).
- **3, 4, 15, 17, 33, 47, 55:** stuck 32 under 4 and 15; otherwise 0.
- **2:** I find (d) at 66 words and (e) at 69 too much in one breath. I don't find (a) or (c) too much.
- **6:** steady has 141 rows, 5 check-ins, longest run 1.
- **8:** 2 abrupt seams; does not fire.
- **9:** fires on its letter (offtopic 66).
- **10:** 1 hint untrue of its board (stuck 32).
- **11:** register rows by cause: (a) 3, (b) 1, (c) 2, (d) 7, (e) 3, (f) 4.
- **14:** 1 untrue, 0 giveaway.
- **21:** 2 remediations alone; does not fire.
- **46:** I find the ladder long at the two-option Pinky/Golu card (stuck 26–32, steering 10–16).
- **48:** fires on its letter (6 invitations in steady).
- **49, 58:** not exercised.
- **50:** the kind of sentence came from Pass 6 itself.
- **59:** 1 lesson (steady).
- **64:** does not fire.
- **65: fires.** A rewritten sentence is heard untrue, so it returns to its D35 text.
- **66, 67:** 0.
- **68:** (b)+(c)+(e) = 6 of my 20 rows (D35 had 7). The shape of the turn is still the largest cause.
- **69: fires.** A lesson that passed in D35 fails on this round's script. The offline-walk reader saw this exact row and introduced the fault.
- **70:** c4 keeps its release-61 script.
- **71:** this is a first failure, so the topic stays live.

## D. Scores (director35 → director36)

| Axis | Score |
|---|---|
| Listening | 3.5 → 3.5 |
| Worked example | 4 → 4 |
| Class level | 4 → 4 |
| Screen and speech | 4 → **3.5** (stuck 32) |
| Register | 3.5 → 3.5 |
| Promises | 3.5 → 3.5 |

## E. Verdict

**c4 does not pass the gate. It fails on one contradiction (stuck row 32), which is in the script data (layer a) and was introduced by this round's cold-read fix 839b7460d.** Every other line holds: 90.5% of beats taught, 96/96 verdicts, 0 unsaid boards, 0 misgrades, 0 false keys, and every axis at 3.5 or above. Listening, register and promises each reach exactly 3.5.

The changes that would most move it:
1. Return s1 rem[1].simpler to its D35 text, or give it no board, as at steering 16 (clauses 65 and 70).
2. In d37, make the wait say the step's re-ask (steady 28–48).
3. Never use the go-on line before a back-to, and let the remediation share its turn with its card.

Would I put it in front of a child? **Not with this script.** Yes with the release-61 script, or with this one once that single sentence is reverted: everything else is honest, well paged and aimed at the child's actual mistake.