# c6 (c6-maths-ch06-t01), director30: hand report

**c6 passes every line of the scale gate.** I count 0 contradictions and 0 unsaid boards (strict reading). There are no misgrades, no false keys, and every axis is at 3.5 or above. Several reversal clauses still fire: 2, 3, 8, 10, 12 and 14.

## A. Hand counts

| Lesson (rows) | Beats | Verdicts / keyed | Contradictions | Unsaid | R→W / W→R | False keys |
|---|---|---|---|---|---|---|
| steady (103) | 49/49 | 40/40 | 0 | 0 | 0/0 | 0 |
| stuck (83) | 40/40 | 25/25 | 0 | 0 | 0/0 | 0 |
| offtopic (87) | 43/43 | 28/28 | 0 | 0 | 0/0 | 0 |
| steering (71) | 34/34 | 23/23 | 0 | 0 | 0/0 | 0 |
| **D30** | **166/166** | **116/116** | **0** | **0** | 0 | 0 |
| D29 (my hand count) | 156/156 | 106/106 | 1 (paging, steering 14) | 0 | 0 | 0 |

The gate fields leave 6 verdicts unmarked: the step confirms at steady 24, 58, 78 and steering 34, and the closing misses at steady 96 and 98. Each is a verdict by ear.

## B. Items

**Boards: working.**
- 102 turns changed the board and 58 held it. I checked every multi-part turn: each page starts at the first word of the part that owns it.
- Hooks were said over a blank board (row 2 or 4 in all four lessons). Joints, lead-ins, parks and the easier-words line kept the board already up. The easier-words line owns no page (steady 36, stuck 8, steering 8).
- Every key (5) was said over its answer board.
- Point and remediation boards are true of the words over them, and none shows what its card asks. Remediations with no board of their own say "Socho…" over the answered card's board.

**Pictures: working.** There were 4 (steady 18, stuck 18, offtopic 30, steering 14).
- In each, `counts`, `layout.panels` and `preselected` all match the named board.
- Each caption is authored and true, and each turn ends on the re-ask.
- D29's giveaway caption at stuck 18 is now neutral.

**Help: partly working.**
- Requests that got no help: 2.
  - offtopic 32: a Hindi request got "Koi baat nahi, isse aasaan shabd abhi mere paas nahi hain." and then the whole card.
  - steering 20: a give-up got "Yahi sabse seedha tareeka hai…", the after-key return, and the e1 card.
- Both "nothing easier" lines were true, since every wording was spent. Said in answer to a Hindi request, the line is cold.
- Partly repeated: steady 88 says "Poore chakkar mein do lambai aur do chaudai hain" again after row 86.
- New words for the same idea in the same order: 5 (steady 8; stuck 48, 76; steering 10, 12).
- Keys given with a wording unsaid: 0. Keys where a hint would have done: 0.
- **A told step on the wrong cue: 2.** stuck 22 told the step after "haan", and offtopic 18 told it after an aside. The predicates `stepToldEarly` and `keyEarly` read 0 on both.

**Turn shapes: partly working**

| Shape | Count (steady/stuck/offtopic/steering) | Words | Worst |
|---|---|---|---|
| a | 5/4/6/4 | 49–73 | steady 48 (dense, readable) |
| b | 1/1/1/1 | 68–74 | stuck 4 |
| c | 5/4/4/2 | 54–60 | steady 16 (a two-step ribbon card) |
| d | 3/2/2/2 | 62–67 | clear |
| e | 2/1/3/2 | 30–79 | **offtopic 18**: park, joint, told step, sum and own step |

- No point gives away its card's answer. Quick questions and invitations: 0.
- **Ending outside the five: steering 50.** A remediation ends on "Yahan tak theek hai?" because the aside's return was due.

**Check-ins.**
- Counts per lesson: 4, 2, 5, 4. Longest run: 2 (offtopic 40–42, steering 16–18).
- Steady 103 rows: rows 32, 38, 68 and 98.
- After a right verdict: steady 38 and offtopic 22, both before a due return (ruled).
- Before a waiting card: steering 50. After an aside or park: 0. Inside a worked example: 0.
- Mildly tedious only after keys.
- Over 60 words: 12/10/10/8. Over 75: 1 (offtopic 18, 79 words). Over 90: 0.

**Worked examples (4).** All three asked steps are deciding steps.

| Example | Asked step | Kind |
|---|---|---|
| s1 | "…kitni bhujaon ka naap jodna hoga?" | thin |
| s2 | "…aadhe chakkar mein kaun si bhujayein aati hain?" | good |
| s3 | "…pehle kaunsi doori nikalni hogi?" | best |

- The own steps are 35 − 31, 2 × 42 and 3 × 160, so the thinking is thin.
- Fact said twice: steady 26, the 4 m.
- No wrong asked-step answer came up, so no "not that" was heard.
- **The s1 and s2 easier wordings say the step's answer:** "poori baad teeno roll milakar banti hai" (stuck 20, offtopic 16) and "pehle lambi bhuja, phir mud ke chhoti bhuja" (offtopic 52). At offtopic 52–54 the step is then told again.

**Short reason.**
- 22 rows carry `whyShort: true`, but only 3 said the short reason: stuck 62, offtopic 46 and steering 64, each "kyunki 10 aur 6 dono do-do baar aate hain". All 3 are true and enough.
- **The other 19 said the full why** (steady 10, 32, 38, 54, 56, 68 and others). The flag is set wherever the short text is a substring of the full why. Two of the flagged rows are keys (offtopic 74, steering 16).

**Joints.**
- Misplaced "meet again" line: 0. Steering 20 is correctly after a key said as help.
- Two joints at one seam: 0. Return to an earlier card with no back-to line: 0. Worked problem with no lead-in: 0.
- **A reply going into the card with no joint: offtopic 36** ("Haan, sixer maara, yeh tumne bataya tha. Zoya ne…").
- Abrupt seams: 1/1/2/0 (steady 34's "kaam poora… kaam poora", stuck 22, offtopic 18, offtopic 36).
- The `seams` record matches what was said on every row I checked: `greetAsk`, `workedStep`, `startAnyway`, `helpSpent`, `reaskShort`, and one `start` seam per turn.

**Asides.**
- steady: park 34, return 40, reply 42.
- offtopic: park 18, return 24, reply 26; a third aside at 36.
- steering: park 48, return 52, reply 54.
- stuck: AI line 40, reply 42.
- The reply "Achha, toh tumhe chauka sabse achha lagta hai." is natural and the same as D29. Offtopic 36 is flat, also the same as D29.
- Every return is alone in its turn and uses an authored form. No taste claims. No park left unreturned.

**Everything else**
- Stop: stuck 82 and steering 70 are the frozen stop menu, after which the harness ends the lesson.
- Model sentences: 0. Reader: 0 lines read as the wrong kind.
- Mix-ups met again: each got its own skill's remediation or hint. D29's misroute is gone (offtopic 82 now gets the s3 remediation).
- Hindi requests never get Hindi, but no line claims they do.
- The sentence about the child (steady 102) uses s3 c2's `did`, answered right first time at row 83. It is true.
- The wrap acknowledgements still miss what the child said, and "achha laga" is heard 3 times in rows 100–102.
- Pace: steady reaches the end, and the third skill is at class level. stuck and steering reach the s2 worked example; offtopic reaches s3 e3 (D29 offtopic reached the s3 worked example).
- **Register causes:** (a) 1, (b) 2, (c) 1, (d) 6, (e) 7, (f) 3.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| Worked step told after an aside or after "haan" | offtopic 18, stuck 22 | b | new |
| `whyShort` set by a substring test | 19 rows | b | carried |
| Remediation alone with a check-in before a due return | steering 50 | b | new |
| "Nothing easier" plus the bare card on a Hindi request | offtopic 32 | b | new |
| Reply into the card with no joint | offtopic 36 | c | carried |
| Step easier wordings give the step away | stuck 20, offtopic 16, 52 | a | new (rung) |
| Re-ask sentence repeated | steady 88 | a | carried |
| Told-step concatenation "lagegi: teeno par: 8 m…" | stuck 22, offtopic 18 | a/c | carried |
| Wrap acknowledgements | steady 100–102 | a | carried |

**Gone since D29:** the picture contradiction; the giveaway caption; the told step with its easier wording unsaid; "nothing easier" at the greeting; unused remediation wordings; "Ab triangle par."; the s3 misroute; `point` records; duplicate `start` seams.

## D. Scores, D29 → D30

| Axis | Score |
|---|---|
| Listening | 3.5 → **3.5** |
| Worked example | 4 → **4** |
| Class level | 4 → **4** |
| Screen and speech | 4 → **4.5** |
| Register | 3.5 → **3.5** |
| Promises | 3.5 → **4** |

Listening, register and promises each reach 3.5.

## Clauses

| # | Reading |
|---|---|
| 1 | Unsaid boards 0, parts or cards without their board 0, help over another part's board 0, script boards 0 faults. Does not fire. |
| 2 | Fires on endings (steering 50). Limits: the (e) turn at offtopic 18 is too much; (a), (b) and (c) are not. |
| 3 | Fires: 2 requests answered without help, both lines true. One judge finds the line cold. |
| 4 | Help with nothing new: 2 (not over 2). Keys with a wording unsaid: 0. Keys where a hint would have done: 0. |
| 5 | 3 short reasons, all true and enough. Does not fire. |
| 6 | Steady 4 check-ins, run of 1. Fires on steering 50 (before a waiting card). Not tedious. |
| 7 | Score 4; three deciding steps; no wrong key. Does not fire. |
| 8 | Fires: offtopic 36. |
| 9 | 0 model sentences. Does not fire. |
| 10 | Fires: 3 hints state the step's answer; 1 re-ask (stuck 48) needs the 140 cm, which is no longer in front of the child. |
| 11 | Register 3.5. Most rows under help (e). |
| 12 | Fires on the row record (19 wrong `whyShort` flags). Captions: 0 faults. Sentence about the child: true. |
| 13 | Not below 3.5. |
| 14 | Untrue 0; giveaway 3 heard from 2 lines (fires); repeated frames 3; unnatural 4. |
| 15 | No misgrades, unsaid boards or contradictions. |
| 16 | c6 passes. |
| 17 | 4 picture turns, each drawing the named board. None came after a key. |
| 18 | I find the easier wording slows a child who has given up, because it already states the step. The remediation's second wordings helped (steady 8, stuck 48 and 76, steering 58). |
| 19 | Start lines: "Theek hai, main shuru karti hoon." (stuck 4) and "Achha, pehle main dikhati hoon." (steering 4). Neither brushes the child aside. |
| 20 | "Haan, pehle tum try karo." is not a dead turn. |
| 21 | One remediation said alone (steering 50, not a steady lesson). It reads as a teacher. |

## E. Verdict

**c6 passes the scale gate on every line.** What still moves it most:
1. Tell a worked step only on a second request or after a wrong answer, never after an aside or a "yes".
2. Rewrite the s1 and s2 step easier wordings so they lead to the step without stating it, and give a Hindi request real Hindi, not "nothing easier".
3. Fix the `whyShort` flag, and put a joint after every aside reply.

**Staged batch live: no.** The told-step cue and the giveaway easier wordings would carry into all 30 topics. They should get the three-at-a-time read first.

**What the gate does not measure:** a parent would hear a child ask for Hindi and get "isse aasaan shabd abhi mere paas nahi hain". A child who says only "haan" is handed the step. The stuck child hears the same step question three turns running (stuck 16–20). The goodbye says "achha laga" three times.