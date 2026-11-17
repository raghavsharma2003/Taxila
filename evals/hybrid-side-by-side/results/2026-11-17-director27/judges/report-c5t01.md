# c5-t01 judge report, director27

**c5-t01 does not pass the scale gate.** By my hand count it has 0 contradictions, 0 misgrades and 0 false keys. Two lines fail:

- **2 unsaid boards** (steady row 2, offtopic row 2). These are new since director26.
- **Listening is below 3.5**: three requests got a bare card or the next step (stuck rows 30 and 44, steering row 18).

B1 holds completely: every help wording was said over its own part's board. There are 0 model-written sentences, and every stop turn is the authored line.

## A. Hand counts

| Lesson | Beats taught / beat turns | Verdicts / keyed | Contradictions | Unsaid boards | Right called wrong / wrong called right | False keys |
|---|---|---|---|---|---|---|
| steady (133 rows) | 62/62 | 34/34 | 0 | 1 (row 2) | 0/0 | 0 |
| stuck | 37/37 | 17/17 | 0 | 0 | 0/0 | 0 |
| offtopic | 30/30 | 17/17 | 0 | 1 (row 2) | 0/0 | 0 |
| steering | 29/29 | 13/13 | 0 | 0 | 0/0 | 0 |
| **D27** | **158/158** | **81/81** | **0** | **2** | **0/0** | **0** |
| D26 | 149/149 | 62/62 | 0 | 0 | 0/0 | 0 |

- **Beat count.** Returns, the AI line and bare try-first turns are left out of the beat count.
- **Unsaid boards (paging).** The hook and the e1 point (70 words, ending "Ab tak samajh aaya?") are said over the e1 card's board (`dens[2,3]`, with the 3-gap line). That board was preselected, but the card itself is only said at row 4.
  - `pageParts` records the point's own board (`den 2`) at character 187, but that board was never drawn.
  - In director26 the point and the card shared one turn, so the card's board was correct. Joining the hook to the first point (C1) pushed the card into the next turn.
- **Near misses, not counted** (same as director26 steady 14): steady 14 and offtopic 44 say "1/8, 1/7 se pehle aata hai" over a board that shows 1/8 and 1/2 but no 1/7.
- **Steady 128.** The code flags `closeOffBoard`. That is a false flag: the verdict is said over the teachback's answer board.
- **Known item.** The child said "no place" at steady row 37 and stuck row 67. The safety turn did not fire either time. Both rows got a miss verdict and the not-numbers remediation: "Nahi, yeh theek nahi hai. Chalo, isko ek aur dhang se samajhte hain. Ghar 0 par, chai ki dukaan…" (steady 38), and "Yeh jawab sahi nahi hai. Ise ek alag tareeke se dekhte hain…" (stuck 68).

## B. Items

| Item | Rating | Evidence |
|---|---|---|
| D26 mech 1 (remediation help on a card's board) | Gone | The remediation's second wording is said over the remediation's own board (steady 118, stuck 70, steering 8). |
| D26 mech 2 (check-ins in worked examples) | Reduced | Each example now takes 2 step turns and 2 check-ins. Director26 had five in a row (102-110). |
| D26 mech 3 (go-on line misplaced or stacked) | Reduced | Stacking is gone. One misplaced go-on line is left: **steady 82**, "is par hum dobara aayenge", after a *right* answer with no key. |
| D26 mech 4 (stop path says the model's draft) | Gone | Stuck 80, offtopic 68 and steering 64 all say "Aaj ke liye itna hi, phir milenge." |
| D26 mech 5 (a request gets nothing) | Still there | **Stuck 30**: clarify → "Theek hai, ab wapas usi sawaal par chalte hain." + card. **Stuck 44**: 4th clarify → step 2, no word to the child. **Steering 18**: give-up → back-to line + card. The authored `helpSpent` joint is never said. |
| D26 mech 6 (mix-up in a later skill) | Gone | Steady 116 gets the S3 not-numbers remediation. |
| D26 mech 7 (no lead-in to a worked problem) | Gone | Lead-in at 6 of 6 worked problems. Each problem is worded as one to do together. |
| D26 mech 8 (flat replies) | Gone | Offtopic 38: "Achha, toh tumhe chauka sabse achha lagta hai." |
| B1, every help turn's board | Working | 0 of about 45 help turns said over another part's board (table below). All 6 keys were said over the answer board. |
| Remediation boards | Partly | 1 fault. The S1 count-marks board (`dens[7,12]`) draws the 11 lower ticks that its own follow-up card asks the child to count (steady 24, stuck 52, offtopic 18, steering 26). The other three remediation boards are true of what she says. |
| Help against the whole lesson | Working | Help turns with nothing new: 0. Same-idea paraphrases: 2 (stuck 38 and steering 46, the step-1 `simpler`). Keys given with a wording still unsaid: 0. Keys where a hint would have done: 0. |
| Joints | Not working | Misplaced: 1 (steady 82). Stacked: 0. Abrupt: 4. Offtopic 12 returns to the e1 card with no back-to line; stuck 30, stuck 44 and steering 18 read abrupt where the go-on line was removed. Per lesson: 1 / 2 / 1 / 1. |
| `seams` record (10 turns per lesson) | Partly | Help is recorded as help, and verdicts only where one was said. **Stuck 4 and steering 4** record an "aside" seam where none was said. |
| Return and wrap | Working | All 4 returns are alone in their turn. The closing verdict says its why (128). |
| Reader | Working | 0 lines read as the wrong kind; every right answer was graded. |
| Sentence about the child | Working | It uses S3 c2's `did`, which she answered right at the first try (row 113). It is true. |
| Pictures | Partly | 4 picture turns, 0 captions untrue or giving an answer away. **Steering 14** has no authored caption: "Yeh lo, isi cheez ki ek aur tasveer…". Two words for one thing (patti/hisse against line/gaps) at stuck 18 and offtopic 26. "hissa" in two senses in one turn at steady 18. |
| Re-asks | Partly | At stuck 72 and steering 10, "Woh 0 se kitne kilometre par hai?" has no referent in the turn. |
| Hindi requests | Partly | Steady 36 and offtopic 32 are kept. Stuck 8 promises "yahi baat" and then gives the 1/2 wording after a hint about 1/3. Steering 8 promises "aur aasaan" but the wording that follows is not easier. |
| C1, check-ins | Partly | Hook said with the first point: 2 of 4. In stuck 2 and steering 2 the hook stands alone after the greeting clarify. Problem said with the first told step: 0 of 6. |
| Model words | Working | 0 model-written sentences (every sentence traced to the script or to code lines). |

**Help turns, by row.** Every one was said over its own part's board. The ✗ rows are the three requests that got nothing.

| Lesson | Rows |
|---|---|
| steady | 4, 14 (`pointAlt`); 10, 36, 52, 110 (card `simpler`); 54 (`pointAlt`); 68 (step `simpler`); 80 (`whyAlt`); 82 (go-on line); 94 (`pointAlt`); 118 (remediation `sayAlt`); 120 (follow-up card's `simpler`) |
| stuck | 2 (`greetSimpler`); 4; 6, 14, 58, 62; 8 (`pointAlt`); 24, 54, 72; 26, 64, 74 (keys); 28 (`whyAlt`); **30 ✗**; 38; 40 (`problemAlt`); 42 (`simpler`); **44 ✗**; 70 (`sayAlt`) |
| offtopic | 4; 20; 24; 32; 44; 52; 56; 58 (key); 60; 62 (go-on line, after a key) |
| steering | 2; 4; 8; 10; 12 (key); 16; **18 ✗**; 32; 42; 46; 52; 54 (key); 56; 58 |

**Check-ins.**

| Lesson | Check-in turns | Runs of 3 or more |
|---|---|---|
| steady (133 rows) | 26 | 16-20, 64-68, 78-82 |
| stuck | 16 | 34-42 (38-42 made by the child's requests) |
| offtopic | 10 | none |
| steering | 15 | 12-16, 40-46 |

- **Are they tedious? Yes.** The steady child says "haan" to 16 of 26 check-ins.
- Each problem ends on "Yeh kadam saaf hai?" before any step has been said (steady 16, steering 40). That line is untrue.
- Step 1 stands alone (steady 20, 66, 104).
- A verdict plus a new point ends on a check-in, and then the card follows alone in 13 to 25 words (steady 62, 84, 96, 100).
- Where the 26 come from: verdict plus a new point 6; problem alone 3; told step 1 alone 3; close alone 3; remediation 3; help 3; bridge 2; picture, the hook with the first point, go-on line 1 each.

**Turns over 60 words:** 15 in all (steady 2, 16, 24, 92, 98, 108, 118, 130; stuck 34, 52; offtopic 2, 18, 46; steering 8, 40). None is over 75.
- They read as tutoring, except the remediation-plus-card turns at 72 and 73 words (steady 24, stuck 52, offtopic 18). Those bring in a new story, two lines and a new question in one breath: too much.
- A point with its card is fine.

**Frames:** no frame is repeated within 4 of her turns, except "Dekho," (offtopic 22/28 and 64/66). Counts in the steady lesson:
- "Haan, sahi hai" ×10, "Bilkul sahi" ×8, "Haan, bilkul theek" ×6.
- "Toh poora jawab:" ×3.
- Park form 1 in all 4 lessons, return form 2 in all 4.

**Board changes:** 84 changes, of which 82 are in the right place (wrong: steady 2, offtopic 2). The board was held on 71 turns.

**Asides.**
- Parks: steady 40, stuck 36, offtopic 30, steering 24. Each park is one sentence and the turn goes on into the live part.
- Returns, each alone: steady 44, stuck 48, offtopic 36, steering 24 → 28.
- Replies: "Achha, toh tumhe batting sabse achha lagta hai." (the "batting" reply, all 4 lessons) and "…chauka…" (offtopic 38). They are natural, and better than or the same as director26.
- 0 taste claims. The AI line at offtopic 8 is honest. The return at offtopic 36 asks again what the AI line at row 8 had already asked.
- Every "bye" got a goodbye, with no menu. "thak gayi" (stuck 79) is not acknowledged.

**Pace:**
- Steady reached the end, as in director26. The third skill is taught at class level: 6/4, 4/2 = 2, 7/3, a real 7/4 worked example, 12/5, and the teachback 9/7.
- Stuck, offtopic and steering reached the S2 bridge. In director26 offtopic reached S1's worked step and steering S1 step 2.

**The wrap (steady).**
- **Row 130:** "Aaj humne milkar kaafi kuch dekha. Aaj dekha ki har fraction ki line par ek pakki jagah hoti hai, aur uska naam gaps ginkar milta hai. Phir upar wala number aaya, jo batata hai 0 se kitne gap chalna hai; dono milkar ek jagah batate hain. Aakhir mein dekha: upar wala number neeche wale se bada ho, toh fraction 1 ke aage aata hai. Aaj ki padhai mein kuch aisa tha jo achha laga?"
- The child answers "haan".
- **Row 132:** "Kuch baatein aasaan thi, kuch mein mehnat lagi. Aaj ek kaam tumne khud karke dikhaya: 1/6 aur 1/12 ke 11-11 gap chalkar dekha kaun aage gaya. Aaj ke liye itna hi, phir milenge."
- It closes like a person, but its first line does not answer "haan".

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| Card board drawn under the hook-and-point turn | steady 2, offtopic 2 | b | New (side effect of C1) |
| Requests answered with a bare card or step; `helpSpent` never used | stuck 30, 44; steering 18 | b | New form of D26 mech 5 |
| Go-on line after a right answer | steady 82 | b | Carried |
| Return with no back-to line | offtopic 12 | b | New |
| "Yeh kadam saaf hai?" with no step said; problem never said with step 1 | steady 16, steering 40 | b/c | New |
| Hook alone after the greeting clarify | stuck 2, steering 2 | b | New |
| Picture with no authored caption | steering 14 | c | New (replaces D26's untrue caption) |
| Count-marks remediation board shows the follow-up card's answer | 4 lessons | a | New |
| "3 khambon se kul 4 bane" (noun missing); "bata 5"; "Yahi baat doosre sire se" used as a hint | steady 22, 116, 54 | a | Partly carried |
| Spurious "aside" seam; `pageParts` names a board that was not drawn | stuck 4, steering 4; steady 2 | b | New |

**Gone since director26:** the model-written stop menu, stacked joints, the S1 hints that made questions trivial, flat replies, the missing lead-ins, the untrue caption after a key, and "ginti 4 aayi".

## Clauses

| # | Count | Fires? |
|---|---|---|
| 1 | Help turns over another part's board: **0**. Remediation boards untrue or showing a later answer: **1** | No |
| 2 | Help with nothing new: 0. Keys given with a wording unsaid: 0. Keys where a hint would have done: 0 | No |
| 3 | Requests met with nothing: **3** (stuck 30, 44; steering 18) | **Yes** |
| 4 | Steady 133 rows, 26 check-ins, longest run 3 (the child made one of each). Tedious: **yes**. Remediation with its card in one turn too much: **yes**. Point with its card: no | My vote counts toward both |
| 5 | Misplaced go-on line: **1** (steady 82). Stacked: 0. Abrupt seams: **4** | **Yes** |
| 6 | Stop turns authored: 3 of 3. Model-written sentences: 0 | No |
| 7 | 0 | No |
| 8 | Faulty hints: 0 | No |
| 9 | Register 3.5. Rows by cause: (a) 2, (b) 0, (c) 2, (d) 5, (e) 4, (f) 7 | Counts toward the run |
| 10 | Reader: 0 wrong kinds. Captions: 0 untrue (1 without an authored caption). Sentence about the child: true | No |
| 11 | Listening 3. The rows: stuck 30 (clarify after the why's second wording: rule missing); steering 18 (give-up, same place: rule missing); stuck 44 (fourth clarify at a step: rule not followed, `helpSpent` exists) | **Yes** |
| 12 | Script sentences: untrue 0, giveaway 0, repeated frames 2 ("0 aur 1 ke beech N marks hain, barabar doori par" in S1; "0 se 6 gap chalo" twice in S3), unnatural 3 | No |
| 13 | Unsaid boards 2 (paging). Misgrades 0. Contradictions 0 | **Yes** |

The register rows behind clause 9:
- (a) steady 102, offtopic 36
- (c) steady 108, stuck 64
- (d) steady 16, stuck 2, offtopic 18 and 46, steering 40
- (e) steady 54, stuck 40, steering 8 and 10
- (f) steady 132, stuck 30 and 44, offtopic 12 and 26, steering 14 and 18

## D. Scores, director26 → director27

| Axis | Score | Reason |
|---|---|---|
| Listening | 3.5 → **3** | Three requests got nothing; Hindi promises only partly kept |
| Worked example | 4 → **4** | Real problems with lead-ins; still told, with an untrue "kadam" check |
| Class level | 4 → **4** | S3 is solid |
| Screen and speech | 4 → **3.5** | 0 contradictions, but 2 unsaid boards |
| Register | 3.5 → **3.5** | Replies and frame rotation are better; abrupt seams and check-in cadence remain |
| Promises | 3.5 → **3.5** | The go-on line at steady 82 is misplaced; switch lines are partly kept |

Listening does not reach 3.5. Register and promises reach 3.5, only at the bar.

## E. Verdict

c5-t01 **fails** the gate on two lines: 2 unsaid boards (layer b, paging) and listening at 3 (layer b, the walk).

The changes that would move it most:
1. Draw the point's own board whenever the card is pushed out of the turn.
2. When the wordings are spent, say the authored `helpSpent` line before a back-to joint or the next step, and use the back-to line on every return.
3. Replace the problem-alone and step-1-alone check-ins with a small authored question.

**Learning's 30-topic batch: no.** Clauses 3, 5 and 13 fire on runtime paths that every script will exercise.

If it had passed, a parent would still notice:
- 26 "samajh aaya?" in an hour, answered "haan".
- "Yeh kadam saaf hai?" before any step has been said.
- The same cricket question in every lesson.
- A tired child's "thak gayi, bye" answered with only "Aaj ke liye itna hi".