# c5-t01 judge report: director23

**c5-t01 fails the gate on one line only: listening and register are both 3, below 3.5.** The hand counts are clean: 0 contradictions, 0 unsaid boards, 0 misgrades and 0 false keys. The worst fault is new. A child's wrong answer "no place" set off the child-safety turn in both lessons where it was said (steady 50–54, stuck 84). She gave helpline numbers and in steady asked about "galat sparsh". In stuck the lesson ended there.

## A. Hand counts

| Lesson | Beats taught (distinct) | Verdicts | Contradictions | Unsaid boards | Right→wrong / wrong→right | False keys |
|---|---|---|---|---|---|---|
| steady | 60/60 (41) | 31/31 | 0 | 0 | 0/0 | 0 |
| stuck | 40/41 (17) | **16/17** (83→84: safeguard, no verdict) | 0 | 0 | 0/0 | 0 |
| offtopic | 30/32 (16) | 12/12 | 0 | 0 | 0/0 | 0 |
| steering | 27/27 (16) | 13/13 | 0 | 0 | 0/0 | 0 |
| **D23** | **157/160 (98%)** | **72/73 (98.6%)** | **0** | **0** | **0/0** | **0** |
| D22 | 166/170 (98%) | 74/74 | 5 | 0 (+2 borderline) | 0/0 | 0 |

- **Turns that taught nothing:** stuck 38 and offtopic 8 (the AI line), offtopic 46 (a return question alone).
- **Stuck 40:** the e2 point is said again over the remediation's board. The words happen to match that board ([7,12], 1/7), so I do not count it as a contradiction.

## B. Items

| Item | Rating | Evidence |
|---|---|---|
| D22 #1, pictures | **Gone** | 4 of 4 views drawn |
| D22 #2, ending | **Reduced** | Answer board up from the first word (126); lead-in said; wrap is 112 words |
| D22 #3, reader | **Reduced**, 8→6 | Rows under "Reader" below |
| D22 #4, joints | **Reduced** | 0 misplaced, 2 stacked, 8 missing |
| D22 #5, Hindi same words | **Gone** | 0 of 4 |
| D22 #6, bridge puts up next board | **Gone** | Bridges at steady 58, 84 hold the close's board |
| D22 #8, whole card again | **Reduced**, 7→3 | |
| D22 #9, key two turns running | **Reduced**, 3 | stuck 70, 78; offtopic 44. Each follows a clarify. Steering 16 still says "Is sawaal ka sahi jawab: isi line par" |

**Reader: partly working (6 misreads).** The child's intent tag was right on all 6 rows. The reader's table is wrong, and `readerAgrees` counts these rows as agreeing.
- Her reply after a return or AI-line question read as "repeat": steady 48, stuck 40, offtopic 10. In stuck 40 this re-said the e2 point before her reply.
- A clarify or give-up after a key's check-in read as "misconception": stuck 70, stuck 78, offtopic 44. What she did in those turns was right.
- Right answers never graded: 0.

**Joints, by hand**

| Lesson | Misplaced | Stacked or doubled | Missing | Total |
|---|---|---|---|---|
| steady | 0 | 0 | 3: `backTo` at 12, 44, 98 | 3 |
| stuck | 0 | 1: row 40, "…batting… Chalo, ab pichhle sawaal par wapas chalte hain. Achha, ab phir se padhai…" | 2: rows 16, 52 | 3 |
| offtopic | 0 | 1: row 10, "Achha, toh… Achha, ab phir se…" | 2: row 40; row 18, "Main AI hoon… Pehla kadam dekho" | 3 |
| steering | 0 | 0 | 1: row 12 | 1 |

- Every miss verdict now leads into its remediation with a joint.
- `backTo` is still bare on every return after a remediation unit; `backToJoint` reads 0 on those rows.

**Ending (steady): partly working.**
- Row 124: c3 close, then the lead-in "Aaj jo kuch seekha, us sab par ek aakhri sawaal aa raha hai.", then the closing question. The board changes at character 111.
- The child answers "9/7".
- The wrap in full (row 126): "Sahi jawab. Aaj ki baat yeh thi ki 0 aur 1 ke beech ke har fraction ki line par ek pakki jagah hoti hai, aur uska naam marks se nahi, barabar gaps ginkar milta hai. Phir fraction ka upar wala number aaya, jo batata hai ki 0 se kitne gap chalna hai, aur dono number milkar line ki ek hi jagah ka naam hote hain. Aakhir mein line 1 ke aage chali, aur jab upar wala number neeche wale se bada ho, toh fraction 1 ke aage aata hai. Bachche ne 7/4 ko 1 aur 2 ke beech aur 5/3 ko 1 ke baad pehchana. Aaj ke liye itna hi, phir milenge."
- The three "covered" sentences are true, and all three skills were reached.
- The sentence about the child is concrete, not empty praise. It is right on 5/3 (row 117) and generous on 7/4, where the child supplied only "3". It is said **in the third person to the child herself**.
- It reads as a recap read aloud, not as a person closing a lesson.
- Stuck 86: "Aaj ke liye itna hi, phir milenge" comes straight after a safety question. She does not check on the child.

**Pictures: partly working.** All 4 requests drew a fraction-bars view beside the line (steady 18, stuck 18, offtopic 28, steering 14). All 4 used the line that names nothing, and none explained the picture.

**Asides: working.**

| Lesson | Park | Return | Child | Her reply | Rating |
|---|---|---|---|---|---|
| steady | 42, one sentence, goes on | 46, appended to a close | bowling karna | "Achha, toh tumhara favourite hai bowling karna." | natural |
| steering | 26 | 30, appended to a key | bowling karna | the same (32) | natural |
| offtopic | 32 | 46, its own turn | catch pakadna | "Achha, toh tumhara favourite hai catch pakadna." | natural |
| offtopic, AI line | 8 | — | batting | "Achha, toh tumhe batting sabse achha lagta hai." | natural (D22: flat) |
| stuck, AI line | 38 | — | batting | the same, buried after the point (40) | odd placement |
| offtopic, 2nd AI line | 18 | — | — | none; she goes on to the step | flat |

- Every park is returned to, and no return comes without a park.
- No taste claims, and no reply is said twice in a lesson.
- The return question is never one of the script's `asideReturn` forms.

**Clarifies: working.**
- Second clarifies: 2 (stuck 24 "0 se chalo: har mark se pehle ek gap…", stuck 58), and both help.
- Stuck 78→80 says the answer plainly, then moves on.

**Re-asks: working.**
- 0 of 11 needed givens that were no longer in front of the child.
- A whole card said again within two turns, unasked and not a picture turn: steady 10, stuck 14, steering 10 (3). `cardWholeAgain` reads 0 on these rows.
- Offtopic 38 re-says the card after "main khud karti hoon".
- Picture turns that say the card whole: 4 by the letter. Only steady 18 and offtopic 28 are longer than their question.

**Hints after wrong answers: working, with three exceptions.** The order is remediation, then hint, then the key on the second miss. The exceptions:
- Offtopic 36 is a hint with nothing new: the re-ask was already spent in the Hindi turn at 34.
- Offtopic 62 says the s2 e1 point again word for word as its hint.
- Stuck c3 never had its key said: the safeguard took its place.

**Hindi: working.** All 4 requests got new words (steady 36, stuck 8, offtopic 34, steering 8).

**Frames: 10 repeated within 4 of her turns** (D22: 12).
- ". Dekho,": steady 38→46, 78→84, 114→120.
- "Yahan tak … hai?": stuck 20→24, 70→78; offtopic 6→12, 56→64; steady 94→100.
- "Is sawaal ka jawab / Iska jawab": stuck 68→76.

Rotation is not seeded per lesson:

| Joint | Form used |
|---|---|
| First remediation | form 2 in all 4 lessons |
| Hindi switch | form 1 ×4 |
| Park | form 1 ×3 |
| `afterAside` | form 0 ×3 |

**Board changes:** 76 turns changed the board, all 76 in the right place; 87 turns held it.

**Turns over 60 words: 9.**
- Steady 68, 90, 94, 100, 114, 124 and offtopic 64 are dense tutoring.
- Steady 126 (112 words) and stuck 40 (83 words, stitched) read as monologue.

**Pace**

| Lesson | D22 got to | D23 got to |
|---|---|---|
| steady | end of script | end of script |
| stuck | s1 worked step 2 | s1 c3, then the safeguard |
| offtopic | s2 bridge | s2 e2 |
| steering | s2 bridge | s2 bridge |

The third skill is taught at class level, with a real 7/4 worked example and its answer "1 aur 3/4" (row 114).

**Script sentences**
- Untrue: 0.
- Giveaways: 2. Steady 64 says "upar = neeche → 1" just before "how many 1/5 gaps make 1". Stuck 44: "Gaps jitne zyada, pehla mark 0 ke utna hi paas".
- Repeated frames within a skill: 3. "0 aur 1 ke beech N marks hain" (s1); "0 se N gap chalo…rukoge" (s3); "Line 0 se N tak, har poora M barabar gaps mein" (s3).
- Unnatural: 3. The unexplained "khilona" (steady 6); "1/8, bilkul 0 se chipka hua"; "Accha, batane ke liye thanks!" after "haan" (steady 108, stuck 62).

**Two words for one thing:** "km" and "kilometre" (steady 6). One word for two things: "upar/neeche" means both the line and the numerator or denominator (steady 14, 64, 90).

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| The safety turn fires on a fraction answer; the miss gets no verdict; she misstates the child ("Tumne abhi kaha ki samajh nahi aa raha"); the lesson ends on a bare goodbye | steady 50–54; stuck 84–86 | b | **new** (D22 gave a hint on the same line) |
| Reader table: reply read as "repeat"; clarify after a key read as misconception | 6 rows | b | carried, reduced |
| `backTo` missing after remediation; stacked joints; joint forms not rotated | 10 | b/c | carried, reduced |
| Pictures unexplained | 4 of 4 | b/a | new form of an old fault |
| Child sentence in third person; filler "thanks" | 126; 108, 62 | c | new / carried |
| Whole card re-said | 10, 14, 10; offtopic 38 | b | reduced |

**Gone since D22:** pictures refused, the closing key said on the wrong board, misfired `backTo`, a missing joint before a remediation, the bridge putting up the next board, hisse/gap, lap and rope.

## D. Scores, D22 → D23

| Axis | Score | Reason |
|---|---|---|
| Listening | 3 → **3** | Reader better, but the safety turn fires on a fraction answer, and pictures go unexplained |
| Worked example | 4 → **4** | |
| Class level | 4 → **4** | |
| Screen and speech | 3.5 → **4** | 0 contradictions, 4 of 4 views drawn |
| Register | 3 → **3** | Stacked "Achha… Achha", "Bachche ne", repeated forms |
| Promises | 4 → **4** | Every park kept |

## E. Verdict

c5-t01 **fails the gate on one line only**: every-axis ≥ 3.5, with listening at 3 and register at 3. Promises (4) reaches 3.5. Every count line holds: 98% of beats, 98.6% of verdicts, 0 unsaid boards, 0 contradictions, 0 misgrades, 0 false keys.

**What blocks it**
- In the runtime: the safety turn misfiring on a fraction answer.
- In the reader and the joints.

**The changes that would move it most**
1. Gate the safety turn so a card's wrong answer can never set it off, and always check in after a safety turn.
2. Fix the reader's table (the six rows above) and rebuild the joints as one pass over the assembled turn.
3. A caption for each picture view, and the sentence about the child in the second person.

**The 30-topic batch: no.** A runtime that reads a fraction answer as a safety risk must not reach children.

**What the gate does not measure:** a parent would see a 10-year-old asked about "galat sparsh" after "no place". The gate counts none of that.

**Clauses**

| Clause | Count | Fires? |
|---|---|---|
| (1) Joints | 3 / 3 / 3 / 1 = 10 (misplaced 0, stacked 2, missing 8) | **Yes:** rebuild the joints as one pass |
| (2) Sentence about the child | 1 lesson reached the wrap; present, not empty, not wrong (third person, generous on 7/4) | No (0 of 1) |
| (3) Reader | 6 | **Yes:** the tags are right, the table is wrong (rows above) |
| (4) Pictures | 4 picture turns, 4 quiet lines, 4 unexplained | **Yes** |
| (5) Displaced parts said late | 0 / 1 (stuck 40) / 0 / 0 | No |
| (6) Second clarifies unhelpful | 0 of 2 | No |
| (7) Whole cards again | 3 (steady 10, stuck 14, steering 10); picture turns 4 literal, 2 multi-sentence | **Yes** for whole cards; picture turns: 4 by the letter fires, 2 that matter do not — main loop to decide |
| (9) Untrue + giveaway | 2 | No |
| (10) Misgrades, unsaid boards, contradictions | none | — |

**Clause (8), by row:**

| Rows | Problem | Cause |
|---|---|---|
| Safeguard (steady 50, stuck 84) | Safety turn on a fraction answer | Rule wrong |
| Reader, 6 rows | Read as the wrong kind | Not followed |
| `backTo`, 7 rows | Missing after a remediation | Not followed (the predicate defines the rule too narrowly) |
| Stuck 40, offtopic 10 | Stacked joints | Not followed |
| Picture turns | No caption | Rule missing |
| Stuck 86 | Goodbye after a safety turn, no check | Rule missing |
| Steady 126 | Sentence about the child in the third person | Rule missing |