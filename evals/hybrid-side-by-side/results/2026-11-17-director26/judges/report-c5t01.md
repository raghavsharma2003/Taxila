# c5-t01 judge report: director26

**c5-t01 passes the scale gate on every line.** By my hand count there are 0 contradictions, 0 unsaid boards, 0 misgrades and 0 false keys. Every axis is at 3.5 or above. Listening, register and promises each reach 3.5, but only just.

Three clauses fire anyway:
- **Clause 7:** four authored hints make their question trivial.
- **Clause 9:** one model-written sentence was heard (stuck 74).
- **Clause 4:** I find the check-ins tedious in the worked examples.

## A. Hand counts

| Lesson | Beats taught / beat turns (distinct) | Verdicts / keyed | Contradictions | Unsaid boards | R→W / W→R | False keys |
|---|---|---|---|---|---|---|
| steady | 64/64 (39) | 30/30 | 0 | 0 | 0/0 | 0 |
| stuck | 34/34 (16) | 13/13 | 0 | 0 | 0/0 | 0 |
| offtopic | 29/29 (14) | 11/11 | 0 | 0 | 0/0 | 0 |
| steering | 22/22 (11) | 8/8 | 0 | 0 | 0/0 | 0 |
| **D26** | **149/149 (100%)** | **62/62 (100%)** | **0** | **0** | **0/0** | **0** |
| D25 | 161/162 | 72/74 | 1 (paging, offtopic 34) | 0 | 0/0 | 0 |

- The beat count leaves out rows that carry a beat but teach nothing: returns (steady 48, stuck 52, offtopic 38, steering 28), AI lines (offtopic 8, 20) and try-first (steady 30, stuck 32, offtopic 42, steering 20).
- Two near misses, not counted:
  - **steady 14:** a help wording says "1/8, 1/7 se pehle aata hai". The help board shows 1/8 and an unmentioned 1/2, but no 1/7.
  - **steering 14:** a picture asked for after the key redraws the question's board and its caption, "abhi bina rang ke".
- **Known item:** the "no place" line was not said, so the safety turn did not fire. Steady 37 and stuck 71 answered "1st mark" and were graded right.

## B. Items

| Item | Rating | Evidence |
|---|---|---|
| D25 mechanism 1 (help in several places) | Reduced | 0 help turns with nothing new. Every help wording was said over its own part's board, and every key over its answer board. One gap is left: no help is picked when the row has no part, so steady 128 got silence. |
| D25 mechanism 2 (L unbuilt) | Gone | Every return is in a turn of its own (4/4), and the wrap is two turns. |
| D25 mechanism 3 (give-up after a key) | Reduced | Handled 6 times: the why's other wording at stuck 28 and 50, offtopic 48 and steering 16; the go-on line at stuck 30 and steering 18. **Silence once, steady 128:** the child said "pata nahi, aap batao" after the check-in on the c3 why, and she went straight to the closing question. |
| D25 mechanism 4 (Hindi promise) | Gone | All three forms were used, and each was followed by new words. |
| D25 mechanism 5 (model words) | Reduced | "Batane ke liye thanks" is gone. **Stuck 74 is model-written:** "Theek hai Riya, tum rukna chahti ho—teen vikalp hain…". Its guard flagged wrap and nochoice but did not replace the draft. Steering 50 shows the authored `checkinStop` that should have been said. |
| D25 mechanism 6 (fixed forms) | Still there | Park form [1] and return form [2] in all 4 lessons. "Haan, sahi hai" ×10 and "Toh poora jawab:" ×3 (26, 68, 116) in steady. "Haan, pehle tum try karo." ×4. |
| D25 mechanism 7 (`seams` record) | Reduced | Now right: captions, the wrap's three parts, key, `hindiSwitch` and its `by`. Still wrong: help wordings are recorded as "point"; a "verdict" is recorded that was never said (stuck 30 and 44, steering 18); the closing question's lead-in and the question itself are recorded as "point" (steady 128); the key is folded into the verdict (steady 26). |
| D25 mechanism 8 (script) | Partly | The new explain-card hints are good. "Ab… Ab" is gone. The S1 `problemAlt` paraphrases its problem. "Ginti 4 aayi" is still said. |
| D25 mechanism 9 (harness flags) | Gone | `contradictionsV6` reads 0 on every row, which agrees with my count. |
| Help (by hand) | Working | Table below. |
| Turn length | Working | See the turn-length notes below. |
| Return and wrap | Working | All 4 returns are alone and use an authored form. The wrap is two turns. |
| Reader | Working | 0 lines recorded as the wrong kind. Every right answer was graded. |
| Sentence about the child | Working | S3 c3's `did`. She answered that card right at the first try (steady 125). It is true and natural. |
| Pictures | Working | 4 picture turns, all with authored captions, 0 untrue, 0 giving an answer away. |
| Re-asks | Partly | **Steering 10:** the bare re-ask "Woh 0 se kitne kilometre par hai?" comes with no toy in the turn. |
| Two words for one thing | Partly | "hisse/patti" against "gaps/line" in one turn: stuck 18, offtopic 26. |

**Help, every turn.** For each one I checked whether any sentence had been said earlier in the lesson; none had.

| Lesson | Rows: request → wording |
|---|---|
| steady | 10 give-up → card hint; 14 give-up → second wording; 36 Hindi → switch + simpler; 44 wrong → card hint; 52 clarify → second wording; 78, 114, 120 wrong → simpler; 100 give-up → second wording; 104 give-up → `problemAlt`; 106 give-up → `simpler`; **128 give-up → nothing** |
| stuck | 2 greet clarify → `greetSimpler`; 6, 14 give-up → card hint; 8 Hindi → second wording; 24, 60, 68 → simpler; 26, 62 → key; 28, 50 after a key → why's other wording; 30 → go-on line; 38 → step simpler; 40 → `problemAlt`; 42 → `simpler`; 44 → go-on line + step 2; 58 → remediation's second wording + card |
| offtopic | 24, 44 → simpler; 34 Hindi → card hint; 46 → key; 48 → why's other wording; 54 → `problemAlt`; 58, 60 → simplers |
| steering | 2 → `greetSimpler`; 8 Hindi → remediation's second wording; 10, 32 → simpler; 12 → key; 16 → why's other wording; 18 → go-on line; 42 → `problemAlt`; 46 → step simpler |

- **Help with nothing new: 0 / 0 / 0 / 0.**
- **Paraphrases: 3**, all the S1 `problemAlt`: stuck 40, offtopic 54, steering 42. Steady 104 is borderline.
- **Keys given: 4** (stuck 26 and 62, offtopic 46, steering 12). In every case the ladder was empty, the key was said over the answer board and the card was closed. Keys given while an authored wording was unsaid: 0. Keys where a hint would have done: 0.
- **Hindi, the switch line and what followed:**
  - steady 36: "Theek hai, ise aur aasaan tareeke se bolti hoon." Kept.
  - stuck 8: "Haan, ise seedhe, chhote shabdon mein kehti hoon." Partly kept: the roti wording that followed is longer than the point, and it is about 1/2, not the 1/3 she was asked.
  - offtopic 34 and steering 8: "Achha, yahi baat doosre shabdon mein kehti hoon." Kept.

**Turn length and check-ins.**

| Lesson | Turns over 60 / over 75 words | Check-ins | Back-to-back check-in rows |
|---|---|---|---|
| steady (**133 rows**) | 88 (67), 98 (61), 130 (100) / 130 | 29 | 18-22, 38-40, 50-52, 60-64, 82-84, **102-110 (five in a row)** |
| stuck | 58 (65) / – | 16 | 26-28, 36-44, 48-50 |
| offtopic | – / – | 14 | 46-48, 54-62 |
| steering | 8 (66) / – | 12 | 12-16, 42-48 |

- Every turn over 60 words holds more than one part.
- Stuck 58 and steering 8 put a remediation's wording and a new card in one turn of over 60 words.
- Turns ending with nothing to answer while the lesson goes on: 0.
- **Are the check-ins tedious? Yes,** in the worked examples. There a steady child says "haan" to "Yeh kadam saaf hai?" turn after turn. Elsewhere they read as a pause.
- **Do turns of 61 to 75 words read as monologue? No.** Steady 88 and 98, stuck 58 and steering 8 read as tutoring. The 100-word wrap at steady 130 does read as a monologue.

**The wrap, quoted in full (steady).**
- **Row 130:** "Sahi jawab. Aaj ki baat yeh thi ki 0 aur 1 ke beech ke har fraction ki line par ek pakki jagah hoti hai, aur uska naam marks se nahi, barabar gaps ginkar milta hai. Phir fraction ka upar wala number aaya, jo batata hai ki 0 se kitne gap chalna hai, aur dono number milkar line ki ek hi jagah ka naam hote hain. Aakhir mein line 1 ke aage chali, aur jab upar wala number neeche wale number se bada ho, toh fraction 1 ke aage aata hai. Aaj ki padhai mein kuch aisa tha jo achha laga?"
- The child answers "haan".
- **Row 132:** "Achha, maine sun liya. Aaj ek kaam tumne khud karke dikhaya: 0 se gaps ginkar 2 ke baad doosre mark ka naam rakha. Aaj ke liye itna hi, phir milenge."
- It closes like a person. The verdict on the closing question has no why, and "maine sun liya" is flat.

**Asides.** No taste claims; every park was returned to; no return came without a park.

| Lesson | Park / return | Reply (quoted) | Rating vs D25 |
|---|---|---|---|
| steady | 40 (goes on into the point) / 48 | "Achha, toh tumhe batting sabse achha lagta hai." | natural; the same reply, the return is better |
| stuck | 36 / 52 | the same | natural |
| offtopic | AI lines 8 and 20; park 32 / return 38 | "Achha, toh tumhe batting sabse achha lagta hai." / "Achha, toh tumhara favourite hai Dhoni." / "Achha, toh tumhe sixer sabse achha lagta hai." | natural; the return at 38 asks again what the AI line at 8 asked |
| steering | 24 / 28 | the "batting" reply | natural |

The child's "bye" (offtopic 68) got a goodbye with no menu.

**Joints, counted by hand.**
- Misplaced: stuck 44 ("aise sawaal hum aage phir karenge" said on a worked step).
- Stacked: stuck 30 and steering 18 ("abhi aage chalte hain" followed by "wapas usi sawaal par").
- Missing: steady 128.
- Totals: steady 1, stuck 2, offtopic 0, steering 1.

**Board changes:** 73 changes, all in the right place except the doubtful steering 14. 79 turns held the board.

**Pace:** steady reached the end (D25: 137 rows). The third skill is taught at class level: 6/5, 6/4, 4/2 = 2, 7/3 grouped in threes, a real 7/4 worked example, and 12/5. Stuck reached the S2 bridge (D25: S1 c3). Offtopic reached the S1 worked step and steering S1 step 2 (D25: S2), because those children stopped earlier.

## C. Defects

| Defect | Rows | Layer | Status |
|---|---|---|---|
| Model-written menu on the stop path | stuck 74 | b | new path |
| Help not picked when the row has no part | steady 128; steering 14 | b | carried, smaller |
| Go-on line stacked with back-to | stuck 30; steering 18 | c | new |
| Hints that make the question trivial | stuck 24, offtopic 44, stuck 68, steady 114, steady 120 | a | new finding |
| `problemAlt` paraphrases its problem | stuck 40, offtopic 54, steering 42 | a | carried |
| Run-on step with a "kyunki" that does not follow; "ginti 4 aayi" | steady 108, steady 22 | a | carried |
| Picture after a key redraws the question's board | steering 14 | b | new |
| Check-in cadence in the worked examples | listed above | b | new (L2) |
| `seams` kinds | listed above | b | reduced |

**Gone since D25:** the contradiction, the Hindi promise, glued returns, the one-turn wrap, "Ab… Ab", the model filler and the false harness flags.

## D. Scores, director25 → director26

| Axis | Score | Reason |
|---|---|---|
| Listening | 3 → **3.5** | 0 help turns with nothing new; the give-up at steady 128 was ignored |
| Worked example | 4 → **4** | |
| Class level | 4 → **4** | |
| Screen and speech | 3.5 → **4** | 0 contradictions |
| Register | 3 → **3.5** | Check-in cadence and fixed forms |
| Promises | 3 → **3.5** | Switch line true; stuck 8 only partly kept |

## Clauses

| Clause | Count | Fires? |
|---|---|---|
| 1 | Help with nothing new: 0 per lesson, 0 for the topic | No |
| 2 | Keys given with a wording still unsaid: 0; keys where a hint would have done: 0 | No |
| 3 | Help wording over the wrong board: 0; key not over the answer board: 0 | No |
| 4 | Steady 133 rows; check-ins tedious: yes; turns of 61-75 words read as monologue: no | **My vote counts as one of the two** |
| 5 | Returns not alone: 0; wraps not two turns: 0; turns ending with nothing to answer: 0 | No |
| 6 | Register 3.5. Rows by cause: (a) 2, (b) 1, (c) 2, (d) 6, (e) 4, (f) 5 | Counts toward the run |
| 7 | New explain-card hints faulty: 0 of 5 rows. Other hints that make the question trivial: 4 distinct, 5 rows. Untrue: 0 | **Yes** |
| 8 | Sentence about the child: untrue 0, unnatural 0 | No |
| 9 | Reader: 0 wrong kinds. Captions: 0 untrue or giving an answer away. **Model sentence: 1 (stuck 74)** | **Yes** |
| 10 | Listening 3.5, promises 3.5 | No |
| 11 | Script sentences: untrue 0, giveaway 0, repeated frames 2, unnatural 2 | No |
| 12 | Misgrades 0, unsaid boards 0, contradictions 0 | No |

- Clause 7's hints: the S1 remediation's hint "Chhota gap pehle khatam ho jaata hai" (stuck 24, offtopic 44); S1 c2's hint (stuck 68); S3 c1's hint (steady 120); "7 mein se 4 ghatao" (steady 114).
- Clause 9's path: the stop turn's rewrite kept the model's draft instead of the authored `checkinStop`.
- Clause 11's frames: "0 aur 1 ke beech N marks, barabar doori par" twice in S1; "0 se N gap chalo" in S3. Unnatural: the S3 step 1 run-on; "ginti 4 aayi".

## E. Verdict

c5-t01 passes the scale gate on every line. Listening, register and promises each reach 3.5, but only at the bar.

The changes that would most move it:
1. Close the stop turn's rewrite path (layer b).
2. Rewrite the hints on yes/no and one-step cards so they point at a method, not at the answer (layer a).
3. Pick help from the last part said when the row has none, and let a step's check-in be answered by the next step instead of "samajh aaya?" (layer b).

**30-topic batch: no.** Clauses 7 and 9 fire, and the 30 scripts' check and remediation hints have had no independent read.

What a parent would still find wrong:
- "samajh aaya?" about 29 times in an hour.
- "Haan, sahi hai" ten times.
- The same cricket return question in every lesson.
- A last "pata nahi, aap batao" ignored.
- Yes/no hints that hand over the answer.