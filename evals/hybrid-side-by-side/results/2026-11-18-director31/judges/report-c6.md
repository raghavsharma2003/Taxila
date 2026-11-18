# c6 (c6-maths-ch06-t01), director31: hand report

**c6 passes every line of the scale gate.** By my hand count there are 0 contradictions, 0 unsaid boards (strict reading), 0 misgrades and 0 false keys, and every axis is at 3.5 or above. These clauses fire: 6, 10 and 14, plus clause 2 on one turn ending.

## A. Hand counts

| Lesson (rows) | Beats | Verdicts / keyed | Contradictions | Unsaid | R→W / W→R | False keys |
|---|---|---|---|---|---|---|
| steady (103) | 49/49 | 40/40 | 0 | 0 | 0/0 | 0 |
| stuck (81) | 39/39 | 26/26 | 0 | 0 | 0/0 | 0 |
| offtopic (73) | 34/34* | 25/25 | 0 | 0 | 0/0 | 0 |
| steering (55) | 26/26 | 16/16 | 0 | 0 | 0/0 | 0 |
| **D31** | **148/148** | **107/107** | **0** | **0** | 0 | 0 |
| D30 | 166/166 | 116/116 | 0 | 0 | 0 | 0 |

\*Offtopic row 36 carries a beat but is the AI line; the beat itself is taught at row 38.

- The code flags `contradictionsV6` on stuck 46 and 74 and on steering 48. All three are miss verdicts said over the answered card's own board, which the gate allows.
- Keys: 3 (stuck 38, offtopic 28, steady 98), each over its answer board.

## B. Items

**Boards: working.**
- Every page starts at the first word of the part that owns it. Hooks are said over a blank board.
- Joints and lead-ins keep the board already up.
- The s1 remediation and its second wording are said over the remediation's own PQRST board (steady 4 and 8).
- Each point and remediation board is true of the words said over it, and none shows what its card asks.
- **One help turn over another part's board: steering 32.** It is said over e3's 6×4 rectangle while the s1 asked step is live. The cause is the walk (see Listening).
- Board changes: 94 turns changed the board (93 in the right place) and 50 held it.

**Listening: partly.**
- F1 works: no step is told off its cue. Stuck 24 tells the step after a second give-up, which is correct.
- F2 works: 4 Hindi requests, each answered with the easier-words line and the card's Hindi form; "nothing easier" is said 0 times. But three of the forms are near-copies of the Hinglish question:
  - steady 36 "Poora ek chakkar lagaya, toh kitne metre hue?" (the card was "Ek poora chakkar kitne metre ka hua?")
  - stuck 8
  - offtopic 32

  Only steering 8 is plainer. The switch line promises "aasaan shabdon mein" and then the child hears the same words.
- F3 works: every aside reply has a joint.
- **New fault at steering 31.** The child's "maine pehle chhota wala socha, phir bada" is a reason, but it was read as `easier`. She answered with e3's easier wording over e3's board, plus "Yeh hissa saaf hua?". That is another part's help and a check-in inside a worked example.
- **The asked step is said three turns running** (stuck 18/20/22, offtopic 14/16/18).

**Help: partly working.**
- Sentence repeated: steady 88 repeats "Poore chakkar mein do lambai aur do chaudai hain" from 86.
- New words for the same idea in the same order: 3 (steady 8; steering 12, 16).
- Keys given with a wording unsaid: 0. Keys where a hint might have done: 1 at most (offtopic 28).
- **The s1 step's easier wording still gives the step away.** "Use pehle yeh jaanna hoga ki kyari ko gherne mein kitni baad lagegi" is heard at stuck 20, offtopic 16 and steering 30, and the child then repeats it back (offtopic 19, steering 35).

**Turn shapes.**

| Shape | Count (steady/stuck/offtopic/steering) | Words | Reading |
|---|---|---|---|
| a | 5/4/4/2 | 49–65 | Readable; the question stands out |
| b | 1/1/1/1 | 68–74 | stuck 4 is dense but fine |
| c | 5/4/3/2 | 54–60 | A teacher talking |
| d | 3/2/2/1 | 61–63 | Clear |
| e | 2/1/2/2 | 28–68 | Fine |

- Turns ending outside the five: **steering 32**.
- Quick questions and invitations: 0. Points giving their card's answer: 0.

**Check-ins.**
- Counts: steady 4 (rows 32, 38, 68, 98), stuck 2, offtopic 3, steering 3. Longest run: 1.
- After a right verdict: steady 38 and steering 38, both before a due return (ruled).
- **Inside a worked example: steering 32.**
- The bridge check-ins (steady 32 and 68, stuck 52, offtopic 34 and 70, steering 52) read as a pause a teacher takes, not a stop. Not tedious.
- Over 60 words: 12/9/9/4, all tutoring rather than monologue. Over 75: 0. Over 90: 0.

**Worked examples: 4.**

| Example | Asked step | Kind |
|---|---|---|
| s1 | "…kya nikaalna hoga?" | deciding |
| s2 | "…aadhe chakkar mein kaun si bhujayein aati hain?" | deciding |
| s3 | "…pehle kaunsi doori nikalni hogi?" | deciding |

- The child's own steps (35 − 31, 2 × 42, 3 × 160) are thin.
- The s1 close says "4 m" twice (steady 26).

**Short reason.**
- 10 rows, all true: steady 14, 48, 74; stuck 14, 62, 68; offtopic 12, 42, 44; steering 26.
- One is thin: stuck 62, "10 aur 6 dono do-do baar aate hain", has no sum after two misses of 16 m.

**Joints.**
- Misplaced lines, double joints, returns with no back-to line, worked problems with no lead-in: all 0.
- Abrupt seams: 2.
  - steady 34: "…yeh kaam poora ho jaaye. Ab yeh kaam poora karte hain."
  - steering 14: the caption and the re-ask each list "8 m, 5 m, 7 m, 6 m aur 3 m", back to back.
- Worked-close seams: 6, all authored.
- The `seams` record matched what was said on the turns I checked. Small record slips: `pageParts` puts the card at 0 over the Hindi switch (stuck 8, steering 8); `cell.part` is null on stuck 40, offtopic 30 and steering 40.

**Asides.**

| Lesson | Park | Return | Reply |
|---|---|---|---|
| steady | 34 | 40 | 42 |
| stuck | AI line 40 | — | 42 |
| offtopic | 30 | 36 (the AI line's Virat question counts as cricket's return) | 38 |
| steering | 34 | 40 | 42 |

- Every reply is "Achha, toh tumhe chauka sabse achha lagta hai." It is natural, carries the child's word, and is better than D30 offtopic 36.
- No taste claims, and no park left unreturned.

**Everything else.**
- Stop: stuck 80 is the frozen stop menu.
- Bye: offtopic 72 and steering 54 each get a goodbye, not a menu.
- Model sentences: 0.
- Mix-ups met again: each got its own skill's remediation, or the card's hint once the remediation was spent.
- Reader: 1 line read as the wrong kind (steering 31).
- Sentence about the child (steady 102) uses s3 c2's `did`, answered right first time at row 83. It is true and natural.
- Wrap: the two openings differ, but "Theek hai, main yeh yaad rakhungi." does not fit the child's "jaise aapne samjhaya tha…".
- Pictures: 4 (steady 18, stuck 18, offtopic 26, steering 14). Each drew the named board, and each caption was authored, true and chosen by its part.
- Pace: steady reaches the end and the third skill is at class level. Offtopic and steering stop earlier than in D30 because the scripted child says bye.
- Re-asks:
  - The closing question is said whole two turns running (steady 94→96).
  - The short ask comes after help that is not about the card's own figure (stuck 74), and after "Haan, pehle tum try karo." (steering 20).
- Register causes: (a) 2, (b) 3, (c) 1, (d) 3, (e) 6, (f) 5. "Dekho," is still said 9 times in steady.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| A reason read as "easier", answered with another part's help and a check-in inside a worked example | steering 31–32 | b | new |
| s1 step easier wording states the step | stuck 20, offtopic 16, steering 30 | a | carried (reworded) |
| Step question three turns running | stuck 18–22, offtopic 14–18 | b | new |
| Closing question whole two turns running | steady 94–96 | a/b | new |
| Hindi forms near-copies of the card | steady 36, stuck 8, offtopic 32 | a | new |
| Help repeats the remediation | steady 88 | a | carried |
| "4 m" twice in the s1 close | steady 26 and 3 others | a | carried |
| Number list doubled; "kaam poora" twice; wrap ack | steering 14, steady 34, steady 100 | c | mixed |

**Gone since D30:** steps told off their cue, "nothing easier" on a Hindi request, the reply with no joint, the remediation alone before a due return, the `whyShort` substring flags, "achha laga" said three times, and the re-ask that needed 140 cm.

## D. Scores, D30 → D31

| Axis | Score |
|---|---|
| Listening | 3.5 → **3.5** |
| Worked example | 4 → **4** |
| Class level | 4 → **4** |
| Screen and speech | 4.5 → **4.5** |
| Register | 3.5 → **3.5** |
| Promises | 4 → **4** |

Listening, register and promises each reach 3.5.

## Clauses

| # | Reading |
|---|---|
| 1 | Unsaid boards 0; parts or cards without their board 0; help over another part's board 1 (steering 32, walk). Script boards: 0 faults. |
| 2 | Shapes as tabled; none is too much in one breath. Fires on the ending at steering 32. |
| 3 | No request went unhelped. "Nothing easier": 0. |
| 4 | Help with nothing new: 1. Keys with a wording unsaid: 0. Does not fire. |
| 5 | 10 short reasons, all true; 1 thin (stuck 62). |
| 6 | Fires: a check-in inside a worked example at steering 32. Not tedious. |
| 7 | Score 4; three deciding steps; no wrong key. Does not fire. |
| 8 | Abrupt seams 2. Does not fire. |
| 9 | Does not fire. |
| 10 | Fires: 3 giveaway hints plus the closing question two turns running. |
| 12 | Wrong kinds 1; captions 0 faults; the sentence about the child is true. |
| 14 | Fires: 3 giveaways heard from 1 line. Untrue 0; repeated frames 2 (s1 e1/c1, s3 e2/c3); unnatural 4. |
| 15 | 0 misgrades, 0 unsaid boards, 0 contradictions. |
| 18 | The easier wording gives the step away rather than slowing the child. The follow-up cards' second wordings mostly helped (steady 8 and 90, stuck 48 and 74). |
| 19 | Start lines: stuck 4 "Theek hai, main shuru karti hoon." and steering 4 "Achha, pehle main dikhati hoon." Neither brushes the child aside. |
| 20 | "Haan, pehle tum try karo." is not a dead turn. |
| 23 | The Hindi forms are not stiff, but they are barely different from the card. |
| 24 | The bridge check-ins read as a pause. |
| 27 | Passes: no gate line fails for a cause in code. |

## E. Verdict

**c6 passes the scale gate on every line.** What would move it most:
1. Close the path from a reason line at an asked step (steering 31). The reader should not take it as "easier", and the walk should never fetch an earlier part's help or put a check-in inside a worked example.
2. Rewrite the s1 step's easier wording so it no longer names the perimeter.
3. Make the Hindi forms actually plainer, and stop the asked step and the closing question being said whole two turns running.

I would put this script in front of a child on this runtime: yes. The boards, grading and keys are sound, and the remaining faults are rare and recoverable.

**What the gate does not measure:** a child who asks for Hindi hears nearly the same sentence again. A stuck child hears "kya nikaalna hoga?" three turns running and is then given the answer through the easier wording. A parent would also hear "Bilkul sahi" and "Dekho," about nine times each in one lesson.