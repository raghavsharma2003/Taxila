# c4-maths-ch06-t01 (staged), director34: passes every gate line, stays staged under clause 16

One process note: I wrote one temporary text dump of the script into the judge-d34 scratchpad folder and then deleted it. Nothing else was written or changed.

## A. Hand counts

| Lesson | Rows (D33) | Beats | Verdicts/keyed | Unsaid boards | Contradictions | Misgrades | False keys |
|---|---|---|---|---|---|---|---|
| steady | 101 (101) | 48/48 | 37/37 | 0 (D33 1) | 0 (D33 7) | 0 | 0 |
| stuck | 77 (77) | 27/27 | 25/25 | 0 (1) | 0 (2) | 0 | 0 |
| offtopic | 81 (67) | 31/31 | 29/29 | 0 (1) | 0 (1) | 0 | 0 |
| steering | 65 (65) | 27/27 | 21/21 | 0 (1) | 0 (3) | 0 | 0 |
| **Total** | | all | all | **0 (4)** | **0 (13)** | 0 | 0 |

- **The fixes held.** Every "?" card is now answered over an answer board, at steady 48 and stuck 62/64. The aadha-metre card no longer has a "?". The s1 e2 point board stops at 5. Golu's scale starts at 4 in both turns.
- **Near item, not counted.** The told step "300 mein se 40 gaye, toh 260 centimetre rassi bachi" (steady 58, offtopic 60) is said over the step-1 result board (300 and 40). The 260 appears one sentence later, on the card's own board.

## B. Items

| Item | Rating | Evidence |
|---|---|---|
| Board, part by part | working | I checked every part's board at its first word against `pageParts` (95 changes, 61 kept): all match. Joints, lead-ins and the park are said over the board already up; hooks and bridges draw none. Point and remediation boards are true to their words. The picture re-asks (steady 18, steering 14) are said over the picture, by design |
| J1 no-picture turn | working | stuck 18: "Iski aur koi drawing mere paas nahi hai." + hint (owns no board) + invitation. Steering 16: "Is sawaal ki bas yahi tasveer hai. Apna jawab bolo, jaisa bhi lage." Board unchanged in both. Steering 16 is curt |
| J2 own reason | working | 16 said, every one after the card's named answer. The next miss got the hint. Offtopic 54 skips e2's own reason because the mez reason with the same words was said at 50 (the right call). D33 misfire gone |
| J3 result boards | working | steady 58 is said over "3 metre = 300 cm"; steady 76 over "Chhat: lambe kadam se" |
| J4 cap | working | Longest run 2, except three runs of 3 that are allowed (stuck 4–8 and offtopic 28–32 end on the Hindi form; stuck 36–40 is the child's "phir se bolo"). 13 invitations: steady 10, 88; stuck 18, 34, 42, 60, 70; offtopic 26, 64, 72; steering 10, 16, 54. Each follows help, a picture or the J1 line; none comes after a park, a reply or a question. Pointed invitation needed: 0 |
| J5 easier words | not exercised | All 4 Hindi requests were at cards with a Hindi form |
| J6 wrap and replies | working | `wrap.covered` (41 words). Replies rotate: "Arre, chauka! Achha hua tumne bataya." (stuck 54), "Wah, chauka! Yeh batane ke liye shukriya." (offtopic 46). Warmer than D33's "Oh, chauka. Achha.", but neither picks up the "naap sakte ho" question |
| Help | partly | 0 bare requests, 0 help turns with nothing new, 0 "nothing easier" lines. Two hints repeat the idea of the line before (stuck 42 after 38; stuck 60 after 58). **Remediation mapped to the wrong mistake:** "1 metre 4 cm" gets the 10/90 remediation, which never says the tape's small spaces are 10 cm each (stuck 56, offtopic 48, steering 48; the mez card's own reason later does). The room answer "100 metre" (right unit, wrong size) gets "Sirf number mat suno, unit bhi suno" (steady 84) |
| Turn shapes | working | (a) 16 turns, 52–64 words; the worst is steady 16. (b) 4 turns, 64–70. (c) 11 turns, 48–57. (d) 9 turns, 52–68; steady 22 says "kyunki … kyunki 4 + 8 = 12". (e) 6 turns, 66–72; the worst is stuck 50. The question is always clear. Turns over 60 words: 22; over 75: 0. Endings outside the eight: steady 40 and steering 40 (the AI line ends "Tumhe Virat ke baare mein sabse achha kya lagta hai?"; carried from D33) |
| Check-ins | working | steady 3 (38 and 66 after bridges, 96 after the key); stuck 1; offtopic 2; steering 1. Longest run 1. None in a forbidden place. README's code count is one lower in three lessons |
| Worked examples | working | All three asked steps are decisions: "12 mein se kaunsa nishaan ghataoge?", "40 centimetre ghatane se pehle 3 metre ka kya karoge?", "Ungli, baalisht ya Papa ka lamba kadam". Every step miss got a "not that" line (stuck 22, offtopic 12, steering 28). The s1 own step is a bare 12 − 5. Offtopic 66 repeats "300 − 40 = 260" |
| Short reason | working | 8 rows, all true ("1 se 8 tak 7 khaane, toh 7 centimetre"). "Sahi jawab, kyunki 70 se 100 tak, 30 centimetre." (steady 46) sounds clipped |
| Asides | partly | Park at stuck 50 and offtopic 36: one sentence, on time. Return at 52 and 44, after a right verdict: "…30 centimetre bacha. Cricket mein kya kuch aisa hai jise tum naap sakte ho?" is abrupt, as in D33. No taste claims |
| Pictures | working | 5 requests: 3 authored captions, all true; none settles its card; no key given |
| Reader | working | 1 wrong kind: steady 99, the wrap reply read against the closing question (code). Her line there is the goodbye and is fine. The invitation is still labelled `aside` in `pageParts` (seams fixed) |
| Sentence about the child | working | "Aaj tumne darwaze ki galat unit pakdi." The child answered that card right first time (row 81). It is true |
| Stop path | working (carried) | stuck 76 and steering 64 get the frozen stop menu; offtopic 80 gets `tiredBye` + goodbye. 0 model words |
| Two words for one thing | minor | Two different strings are both "dori" (70 cm, 95 cm; steady 50, 64). Three different ribbons |

**Frames within 4 turns:** the verdict frame "A se B tak 1-1 centimetre ke N khaane" (steady 12/16, stuck 36/44, steering 18/22) and "N chhote khaane aage, har ek 10 centimetre" (stuck 62/64, offtopic 52/56, steering 50/56).

**Pace:** steady reaches the end of the script, and the third skill is at class level with a real example. Stuck and steering stop in the s2 worked example; offtopic stops at the s2 bridge.

## C. Defects

1. **(a) Script data, new.** The tape misreading and the "100 metre" room answer go to remediations that miss them (4 rows). There is no result board for told step 2 ("260").
2. **(b) Walk, carried.** The AI line ends on a question about Virat (2 rows).
3. **(c) Frames.** The parallel verdict frames above. The double "kyunki" at steady 22. The return after a verdict has no joint.
4. **(d) Record.** `readerAgrees` at steady 99. The invitation is still labelled `aside` in `pageParts`.

Gone since D33: all 13 contradictions, all 4 unsaid boards, the 4-then-3 scale, the "30 cm scale" hint, the misfired own reason at offtopic 44, the paging at steering 16, and the "kaam poora" echo.

## D. Scores (D33 → D34)

- Listening: 3.5 → **3.5**. The own reasons are fixed; the remediation mismatches and the thin aside replies hold it.
- Worked example: 4 → **4**.
- Class level: 4 → **4**.
- Screen and speech: 3 → **4.5**.
- Register: 3.5 → **3.5**.
- Promises: 3.5 → **3.5**. The e1 Hindi form "Crayon scale par 3 se 9 tak rakha hai…" is hardly plainer than the card.

## Clauses

| # | Finding |
|---|---|
| 1 | 0 / 0 / 0 / 0. Does not fire |
| 2 | Shapes as above. 2 endings outside the eight (steady 40, steering 40) → close the AI-line path |
| 3, 4 | 0 bare requests; 0 "nothing easier" lines; 0 keys with a wording left; 0 keys where a hint would have done |
| 5 | 8 rows, all true |
| 6 | steady 101 rows, 3 check-ins, run 1; 0 forbidden; not tedious |
| 7 | 4; all three asked steps are decisions; keys right |
| 8 | 0 / 0 / 0; 2 abrupt seams (the returns). Does not fire |
| 9 | 0 model words; the stop menu is the carried frozen item |
| 10 | 0 |
| 11 | 3.5. Causes: a 1, b 4, c 3, d 9, e 1, f 2 |
| 12 | 1 wrong kind (code); captions fine; the sentence about the child is true |
| 13 | Listening and promises at 3.5. Does not fire |
| 14 | Untrue 0, giveaway 0, repeated frame 2, unnatural 2 (steady 84, steady 22); 0 points cut too short |
| 15 | None |
| 17, 32 | Every picture drawn is the one the walk named; none settles its card |
| 18 | The easier wording at a give-up helped (stuck 24, steering 30); `sayAlt` never said |
| 19 | "Theek hai, main shuru karti hoon." (stuck 4) does not brush the child aside |
| 20 | Not a dead turn: in 3 of 4 the next line was an answer |
| 21 | 0 remediations stand alone; steady 84 still reads as notes |
| 33 | 0 misgrades |
| 40 | stuck 52 and offtopic 44 are abrupt (one judge) |
| 41 | 0 turns of verdict, reason, point and card at 66+ words; 0 splits |
| 45 | 2 no-picture turns, 0 board changes |
| 46 | 16 own reasons, 0 misfires; the hint after an own reason is not one too many |
| 47 | 0 over a posing board or a "?"; no result board gives away the child's step |
| 48 | Runs and invitations as above; 5 in stuck, rotated forms, not a fixed form |
| 49 | Not exercised |
| 50 | 0 of the checker's kinds heard. Remediation-against-named-answer needs a cold-read pass |
| 51 | Staged; passes |
| 16 | **Passes.** It goes live only if the next run passes it too |

## E. Verdict

**c4-maths-ch06-t01 passes every line of the scale gate:** every beat taught, every keyed answer given a verdict, 0 unsaid boards, 0 contradictions, 0 misgrades, 0 false keys, and every axis at 3.5 or above. Listening, register and promises each reach exactly 3.5. Under clause 16 it stays staged until the next run passes it too.

Changes that would move it most:
1. Rewrite the s2 tape remediation to say "har chhota khaana 10 centimetre", and re-map "100 metre" at s3 c3 to its own reason, not the unit remediation.
2. Author a joint for the return after a verdict, and end the AI line on the card.
3. Vary the parallel verdict whys.

Would I put it in front of a child? **Yes, after change 1.** The screen now matches her words throughout and the asked steps are real decisions.

What the gate does not measure: a child who misreads the tape hears a remediation about something else. The goodbye praises a card the child got right and passes over the ribbon question they failed. The aside replies thank the child without picking up what they said.