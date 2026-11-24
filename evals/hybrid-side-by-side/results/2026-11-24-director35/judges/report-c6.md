# c6-maths-ch06-t01 (perimeter), director35: hand report

**c6 fails one gate line on my count: one contradiction, at stuck row 18. Its cause is in code.** The child says "drawing karke samjhao" at the s1 worked step. The row is recorded as `picture: "hintBoard"`, but `held.drawn` is `"kept"`. The board was the triangle already on screen and nothing new was drawn. The step's `simpler` has no board in the script, so the "hint's own board" the walk picked up was simply the board that was already up. What she said was the rupees-and-book analogy, which describes no drawing. The gate's list names this case ("a picture request answered with nothing new drawn"), so I count it as a contradiction of the second-view kind.

In director34 this row said the no-picture line, and the change came with this round's K2 build. The predicates read `hintBoardNotDrawn` 0 and `pictureSame` 0, so they did not catch it. If main rules this row 0, c6 passes every line.

The script as run is not in `D35/scripts/` (only the two staged scripts are there). I used `data/lesson-scripts/c6-maths-ch06-t01.json` from commit 6f56fc8b7, which has no local changes.

## A. Hand counts

| Lesson (rows) | Beats | Verdicts / keyed | Contradictions | Unsaid boards | R→W / W→R | False keys |
|---|---|---|---|---|---|---|
| steady (93) | 44/44 | 36/36 | 0 | 0 | 0/0 | 0 |
| stuck (81) | 39/39 | 28/28 | **1** (row 18, second view) | 0 | 0/0 | 0 |
| offtopic (67) | 32/32 | 18/18 | 0 | 0 | 0/0 | 0 |
| steering (59) | 28/28 (row 42 is the AI line; its beat is said at row 44) | 18/18 | 0 | 0 | 0/0 | 0 |
| **D35** | **143/143** | **100/100** | **1** | **0** | **0** | **0** |
| D34 | 147/147 | 107/107 | 0 | 0 | 0 | 0 |

- **K1 (stated values not drawn): none.** Steady row 50 now says "Toh 24 + 18 = 42 cm" over an unrolled board showing 42, which closes D34's ruling-1 row. Steady 58 says 84 over an area-grid that writes 2 × 42 = 84.
- **A gap, not a contradiction:** steady 78 shows "3 × 160 = 480 m" on the board, but she never says 160 or works it out.

## B. Items

**Boards: working, apart from row 18.**
- 88 turns draw, 3 clear and 55 keep. Every page starts at its part's first word.
- Hooks are said over a blank board. Joints, lead-ins, parks and bridges keep the board that is up.
- Every point is true of its board. The rectangle board labels only two sides, which matches "10 aur 6 ek-ek baar likhe hain".
- Remediations with no board of their own are said over the card just answered ("Andar ke 1 cm wale square gino" over an ungridded square). That is imagined, so not counted.
- Both keys are over their answer boards (steering 18, steady 88).

**D34's mechanisms, for this topic:**
1. A dead-end second picture: reduced. Steering 16 is the line, then the remediation's easier wording, then the invitation, and the picture stays up. But stuck 18 is new.
2. Help that misses an unnamed answer: gone. Every miss was a named answer.
3. A give-up at a check-in between skills: none happened.
4. The question said again by a side door: gone. Try-first stands alone (steady 28, stuck 28, offtopic 38) or carries the short ask (steering 22).
5. Values no board shows: gone.
6. Fixed forms: "Suno," is gone (9 rows in D34). Aside replies now match the kind of thing said.
7. Script rows: no D34 row named for this topic remains.
8. The record: new mislabels at stuck 18 (`hintBoard`) and steering 44 (the point is labelled `held`).

**Help: working.**
- 0 help turns with nothing new.
- 1 is the same idea as the line before (stuck 44 after 42).
- Keys given with a wording still unsaid: 0. Keys where a hint would have done: 0.
- "Samjhao" now gets help: stuck 8 is the switch line, the point's other wording and the Hindi form.
- The easier-words line at steering 8 keeps its promise.
- The "nothing easier" line is said once (steering 20: "Yahi sabse seedha tareeka hai jo mere paas hai, koi baat nahi."). It is true, but cold: it is followed by a different card.

**Turn shapes:**

| Shape | st / sk / of / sr | Words | Worst |
|---|---|---|---|
| a: verdict, reason, point, card | 5/4/4/4 | 49–67 | stuck 62 (67 words, after two misses) |
| b: hook, point, card | 1/1/1/1 | 60–66 | stuck 4 (66 words, after "pata nahi" twice) |
| c: miss, remediation, card | 4/4/2/2 | 51–60 | reads as a teacher |
| d: verdict, lead-in, problem, step | 3/2/2/2 | 61–66 | steering 32 |
| e: reply or park into the lesson | 2/2/2/1 | 30–71 | steady 40 (71) |

- Turns over 60 words: 8/11/6/8. Over 75: 0.
- Every turn ends on an allowed ending. No quick questions are heard.

**Check-ins:**
- 3/1/1/2 by lesson: steady 32, 66, 88; stuck 48; offtopic 48; steering 18, 40.
- The longest run is 1, none falls in a forbidden place, and I do not find them tedious.

**Worked examples (4):**
- All three asked steps are deciding steps.
- Steady 24 ignores the child's "31 metre" (carried from D34).
- The told steps are generic: "Ek chakkar mil jaaye, toh teeno chakkar usi se nikal aayenge." (steady 76).

**Short reasons:**
- 11 rows, all true.
- One is thin: stuck 62, "do lambi, do chhoti bhujayein: 32 m", said after two misses.

**Own reasons:**
- 17 own reasons, every one after its named answer.
- Each mix-up met again got the reason or remediation of its own skill: offtopic 8, 41, 59; stuck 36, 60, 69.

**The cap:**
- Steering 18 gives the key (before it: "ek aur picture dikhao", then "26 m").
- Offtopic 34 tells the step (before it: the Hindi request, then "pata nahi, aap batao").
- Neither child was about to get there.

**Asides:** her replies:
- "Achha, toh tumhe chauka pasand hai!" (steady 40, stuck 58)
- "Oho, chauka! Isi mein tumhe maza aata hai." (steering 44)
- "Arre wah, Virat! Achha kiya jo bataya." (offtopic 30)

Each carries the child's word and is natural, better than D34. Three faults remain:
- Offtopic 28 asks "Tumhara favourite kaun hai?" after the child had already named Virat (carried).
- The park at offtopic 18 is never returned to.
- Stuck 56 brings up cricket while the e1 card is still open.

**Pictures:**
- Steady 18 and steering 14 drew the unrolled view, with true captions that give nothing away.
- Offtopic 26 says "Iski aur koi tasveer mere paas nahi hai." at a first request. That is not strictly true: the step's view is held back.

**Frames:**
- "36 cm sahi nahi hai." twice in three turns (stuck 70, 74).
- "…m mein A aur B ek-ek baar jude hain" in two s2 reasons (stuck 54, 60). The checker's six-word rule is literal, so it misses a frame whose numbers differ.
- Two words for one thing: parimap / kinaara / chakkar; and *lambai* used for both a side and the edge (steady 16).

**Register (3.5):** five rows per lesson, by cause.
- (a) fixed form: stuck 74
- (b) script sentence: steady 16, 76; stuck 40; offtopic 16
- (c) verdict as written: steady 24
- (d) length or shape of the turn: steady 34, 40; stuck 4, 62; offtopic 52; steering 4, 32, 44, 46
- (e) help: stuck 18; offtopic 26; steering 20
- (f) other: offtopic 18, 28

Totals: a 1, b 4, c 1, d 9, e 3, f 2.

**Wrap:**
- Row 88 gives the key with its why.
- The did-sentence at row 92 ("70 cm ki dori…") is true: row 83 was right at the first try.
- The ending reads as a person closing a lesson.

**Pace:** the same as D34, except offtopic, which stops at the s2 worked example (the child says bye at row 65). Skill 3 is at class level.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| Picture request answered with nothing drawn (the hint's "board" is the board already up) | stuck 18 | b | **new (K2)** |
| No-picture line at a first request, not strictly true | offtopic 26 | b/a | carried |
| "Nothing easier" line followed by another card | steering 20 | b/c | new path |
| Child's value not carried into the confirmation | steady 24 | a | carried |
| AI line asks what the child already said; park never returned to | offtopic 28, 18 | c/b | carried |
| Reason frame repeated in s2, unseen by the literal checker | stuck 54, 60 | a | new |
| Told steps empty; 160 drawn but never said | steady 76, 78 | a | carried |

**Gone since D34:** "Suno,"; "samjhao" answered by the question alone; a value with no result board; the invitation-only no-picture turn.

## D. Scores, D34 → D35

| Axis | Score |
|---|---|
| Listening | 4 → **3.5** (stuck 18 is the owner's "show me a diagram — not done"; steady 24; offtopic 28) |
| Worked example | 4 → **4** |
| Class level | 4 → **4** |
| Screen and speech | 4.5 → **4** |
| Register | 3.5 → **3.5** |
| Promises | 4 → **4** |

## Reversal clauses

- **1:** unsaid boards 0. The one case in my topic is stuck 18, a turn where a picture was asked for and nothing new was drawn.
- **2:** none of the turn shapes too much in one breath; endings off the list 0.
- **3:** requests answered without help 0; the "nothing easier" line once, true.
- **4:** 0 / 0 / 0.
- **5:** 11 short reasons, all true, one thin.
- **6:** steady has 93 rows and 3 check-in turns; longest run 1; forbidden 0.
- **7:** score 4; all asked steps are deciding steps; no bad keys.
- **8:** joints 0 / 0 / 0; abrupt seams 2 (steady 40, stuck 56).
- **9:** stop menu at stuck 80 (frozen); model words 0.
- **10:** 1 (offtopic 16, 22, 30: the step re-ask said three times).
- **11:** as above.
- **12:** reader wrong kinds 0; untrue captions 0.
- **13:** none below 3.5.
- **14:** untrue 1 (offtopic 26), giveaways 0, repeated frames 2, unnatural 2 (steering 20; steady 90 "parimap se ulta bhuja nikalti hai").
- **15:** stuck 18, second view.
- **17:** two picture turns drew their view; stuck 18 drew nothing.
- **18:** easier wordings at asked steps help.
- **19:** "Theek hai, main shuru karti hoon." (stuck 4) and "Achha, pehle main dikhati hoon." (steering 4) do not brush the child aside.
- **20:** not a dead turn.
- **21:** remediations said alone 0.
- **32:** no picture settles its card. That the unrolled view shows "?" as its total is assumed, not checked on screen.
- **33:** 0 misgrades.
- **40:** steady 38 is fine; stuck 56 comes early.
- **41:** five turns of 66–67 words, not a monologue.
- **45:** offtopic 26 and steering 16; no board change inside either.
- **46:** 17 own reasons, all after their named answer.
- **47:** clean.
- **48:** longest run 2 (3 at stuck 4–8, by the Hindi request); invitations 1/3/2/3, none after a park.
- **49:** promise kept.
- **50:** yes: the frame rule.
- **54:** I count the hint's board as a contradiction (stuck 18).
- **55:** no.
- **56:** no.
- **57:** no.
- **58:** not applicable.
- **59:** one case (offtopic 26).
- **60:** **fires.** A gate line fails for a cause in code.
- **61:** I did not count any stated value over a board that does not deny it.
- **62:** 3.5.
- **63:** **counts.** This is a lesson that passed D34 failing on this build.
- **53 and 16:** not applicable to c6.

## E. Verdict

c6 fails the scale gate only on the contradiction line, with one row (stuck 18), and the layer is the runtime walk. Every other line passes, and every axis is at 3.5 or above: listening, register and promises each reach 3.5. The changes that would move it most:

1. When a picture is asked for and the hint has no board of its own, say the no-picture line and the hint in words; never re-hold the board as the "picture".
2. Have the step confirmations carry the child's own value ("31 m").
3. Rewrite s3's told step so it computes one round (2 × (50 + 30) = 160) before the child's own step.

I would put this script in front of a child, but not on this runtime until fix 1 is in. The teaching is true and the help speaks to the mistake, but a child who asks for a drawing must not get the same board back.

**For main:** if stuck 18 is ruled 0, a parent would still hear 60-to-67-word turns after a child says "pata nahi", and would see a request for a picture answered with an analogy.