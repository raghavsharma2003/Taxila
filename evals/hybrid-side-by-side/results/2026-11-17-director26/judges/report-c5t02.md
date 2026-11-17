# c5-t02 (c5-maths-ch02-t02): director26 hand judgement

**c5-t02 does not pass the scale gate.** It fails on two lines:

- **2 unsaid boards.** On two help turns she said a remediation's other wording over another card's board, and that card had not been asked yet.
- **Register is 3.**

There are 0 contradictions, 0 misgrades and 0 false keys. Rows are 0-based.

## A. Hand counts

| Lesson | Rows | Beats taught | Verdicts | Contradictions | Unsaid boards | Right called wrong / wrong called right | False keys |
|---|---|---|---|---|---|---|---|
| steady | 161 | 78/78 | 39/39 | 0 | **1 (row 82)** | 0/0 | 0 |
| stuck | 71 | 34/34 | 8/8 | 0 | 0 | 0/0 | 0 |
| offtopic | 77 | 37/37 | 12/12 | 0 | 0 | 0/0 | 0 |
| steering | 51 | 24/24 | 8/8 | 0 | **1 (row 12)** | 0/0 | 0 |
| **D26** | | **173/173** | **67/67** | **0** | **2** | 0/0 | 0 |
| D25 | | 81/81 | 71/71 | 0 | 0 (4 watch rows) | 0/0 | 0 |

- **The two unsaid boards** (mechanism: paging; the help board is chosen outside the help function). Both are a remediation's other wording said over the first check card of its skill:
  - Steering 12: "Pizza party socho…" over S1 c1's Roti 10/5 board. c1 is never asked in that lesson.
  - Steady 82: "Ek-ek rupaye ke sikke socho…" over S2 c0's Pinky/Bhai board. c0 is first asked at row 90.
  - The `helpBoard` predicate read 0 on both rows.
- **Watch rows, not counted (as in D25):** a remediation said over its follow-up card's board before that card is asked. Steady 38, 80, 94 and 102; stuck 34; offtopic 10; steering 10.
- **Watch row, not a contradiction:** stuck 64 asks the worked example's own question ("bada hissa kisko mila?") over the shaded, labelled 1/8 and 1/2 board. That board was kept from the help turn at 62 and is that question's answer board.

## B. Items

| Item | Rating | Evidence |
|---|---|---|
| D25 #1, help in several places | **Reduced** | 0 help sentences repeated. The board is still chosen outside the function (steering 12, steady 82). |
| #2, L unbuilt | **Mostly gone** | Returns stand alone (steady 40, offtopic 38). The wrap is two turns. **Steering 4** (a clarify on the hook, answered with the e1 point) ends on no question. |
| #3, give-up after a key | **Gone, but misused** | 9 such turns got the why's other wording or the go-on line. The go-on line is said **with no key**: stuck 58 ("aisa sawaal dobara milega; ab aage chalte hain", then she works the same problem) and stuck 64. At stuck 46 it is stacked with backTo: "ab agli baat. Ab us sawaal par lautte hain…". |
| #4, the Hindi promise | **Gone** | 4 of 4 requests were followed by new words. |
| #5, model-written words | **Gone** | Every sentence I heard is a script part or an authored form. |
| #6, fixed forms | **Reduced** | The joints rotate. "Sahi jawab" opens 13 verdicts in steady. Try-first is one form, 4 times across the topic. The AI line is identical in 3 lessons. |
| #7, the `seams` record | **Reduced** | Captions, greetSimpler, the wrap's parts, the key and the hindiSwitch `by` are now right. Still wrong: every hint, other wording or why's other wording is recorded as "point" (e.g. steady 8, stuck 44). The go-on turns carry a "verdict" that was never said (stuck 46, 58, 64). Steering 4 is recorded as "whole". |
| #8, script | **Partly** | Explain cards now have hints. S1 e1 and e2 `pointAlt`s still paraphrase their points. The "upar" and "hissa" collisions remain. |
| #9, harness | **Partly** | No false key flags. `orderParts` and `orderDisplaced` on steering 6 are false: the point was said at row 4. `helpBoard` read 0 on 2 real rows. |

**Help (whole lesson, by hand)**

- **Help turns with nothing new: 0 in every lesson.** No sentence repeated an earlier row.
- **Paraphrases: 4.** All are S1 `pointAlt`s that restate the point and say nothing about the card:
  - stuck 6 (from row 4);
  - offtopic 24 (from 16);
  - steering 26 (from 4);
  - steering 36 (from 28).
- **Keys given as help:**
  - The keys are at stuck 12, 42 and 48; offtopic 58 and 68; steering 18; steady 148.
  - Every key was said over the answer board, and every card was closed.
  - 0 were given while a rung of the ladder was still unsaid.
  - 1 was given where a hint would have let her do it: steady 148. The child made the tops-only mistake 4 times in S3 (117, 119, 145, 147), and S3's own remediation for it ("Ek patti ko 3 barabar hisson mein kaato…") was never said.
- **After a key's check-in:** 0 got silence or another part's help.
- **Hindi requests:**
  - Switch form [0], "Haan, ise doosre shabdon mein samjhaati hoon.": stuck 10, offtopic 32, steering 8.
  - Switch form [1], "Achha, isko aur aasaan karke bolti hoon.": steady 36.
  - New words followed every time.
  - Stuck 10's words (the e1 `simpler`, about 1/4) do not touch the question asked.
- **Second clarifies:** stuck 26 (ants on the line) and stuck 56 (sharing). Both helped.
- **Third requests:** stuck 12 got the key; stuck 28 got the bare card with no line after "mujhe nahi pata"; stuck 58 went into the steps.

**Turn length and check-ins**

| Lesson | Over 60 words | Over 75 words | More than one part | Point and card over 60 | Ends with nothing to answer | Check-ins | Back-to-back check-ins |
|---|---|---|---|---|---|---|---|
| steady | 11 | 1 (158, the wrap) | 11 | 0 | 0 | 32 | 22-26, 52-56, 134-138, 2/4, 74/76 |
| stuck | 1 (22) | 0 | 1 | 0 | 0 | 18 | 54-62 (five in a row), 22-26, 2/4, 12/14, 42/44, 48/50 |
| offtopic | 1 (28) | 0 | 1 | 0 | 0 | 17 | **42-50 (five in a row)**, 2/4, 34/36, 58/60, 68/70 |
| steering | 1 (38) | 0 | 1 | 0 | **1 (row 4)** | 10 | 10/12, 18/20, 44-48 |

**Tedious: yes.** Two in five of her steady turns end on one of five interchangeable "saaf hai?" questions, the "haan" she gets back is never used, and runs of three to five check-ins come at the worked examples.

**Turns of 61 to 75 words:**
- The verdict + why + new point shape reads as **monologue**. There are 9 such turns: steady 16, 64, 68, 114, 122 and 128, and the same S1 e3 turn at stuck 22, offtopic 28 and steering 38. Each is two ideas in one breath, usually on a new board.
- Verdict + card turns read as tutoring: steady 50, 94, 98 and 100.

**The wrap (steady)**
- Row 157, the child: "mujhe laga aisa hi hoga". She ignores it.
- Row 158, the first wrap turn (85 words): "Aaj ki baat yeh thi ki ek hi poore ke jitne zyada barabar hisse hon, har hissa utna chhota hota hai. Phir yeh dekha ki neeche wala number same ho toh hisse ek size ke hote hain, aur upar wala number, yaani hisson ki ginti, faisla karta hai. Aakhir mein yeh dekha ki upar wala number same ho, toh jis fraction ka neeche wala number chhota hai, uske hisse bade hote hain aur wahi zyada hota hai. Aaj ka kaam aasaan laga ya thoda mushkil?"
- Row 159, the child: "haan, samajh aaya".
- Row 160, the second turn: "Chalo, yeh baat bhi dhyaan mein rakhi. Aaj ke paath mein tumne dekha ki 6/7 aur 8/9 mein kiski kami chhoti hai. Aaj ke liye itna hi, phir milenge!"
- The wrap is two turns, and the first ends on the question about the lesson.
- The sentence about the child is the `did` of S3 c3, answered right at the first try (row 153). It is true and natural.
- It closes like a person, but the recap is a block and the child's reason is dropped.

**Asides**

| Lesson | Park → return | Reply | Rating vs D25 |
|---|---|---|---|
| steady | 34 → 40 (alone, form [2]) | "Oh, chauka. Achha." | flat, **worse**. The return comes mid-remediation, before the follow-up card. |
| offtopic | 30 → 38 (alone) | "Achha, batting! Theek hai." | natural but thin, slightly worse |
| offtopic AI line 1 | 6 | "Achha, toh tumhe chauka sabse achha lagta hai." | natural |
| offtopic AI line 2 | 18 (a new question) | "Achha, toh tumhara favourite hai Virat." | natural |
| stuck / steering AI line | 36 / 30 | same chauka reply | natural |

- Every park was returned to, and there was no return without a park.
- No taste claims, and no reply said twice within a lesson.
- After every "bye" there is a bare goodbye.

**Pictures (4)**
- The four turns are steady 18 (parts view), stuck 18, offtopic 26 and steering 14 (wholes view).
- All captions are true of the view drawn. None names a later answer; stuck 18 and offtopic 26 steer toward it ("8 wale gol ke do saath wale hisse dekho").
- Each turn then asks the question alone. 0 turns lack a caption.

**Other items**
- **Reader:** 0 lines recorded as the wrong kind, and every right answer was graded.
- **A part said once:** 0 parts dropped, and 0 said twice unasked. The S2 and S3 hooks are not said, as in D25.
- **Re-asks:** 1 question not answerable on its own. Steady 146 re-asks "In teeno ko chhote se bade tak order mein lagao." with no fractions and an unlabelled board.
- **Board changes:** 90 turns changed the board, 88 of them in the right place; 75 held it.
- **Frames repeated within 4 of her turns:** 1 ("Dekho," at offtopic 28 and 34).
- **Stitched turns: 4.** At steady 20, 72 and 132 and steering 42, the verdict and why run straight into the worked problem with no lead-in. The child then answers "haan" to the problem's own question (steady 21, 73).
- **Card hints:** 0 say the key, 0 are untrue of the board, 0 make the question trivial.
- **Two words for one thing:**
  - "Yeh hissa saaf hua?" in turns where "hissa" is a fraction part (steady 10, 110, 128; steering 28).
  - "upar" meaning the numerator at steady 22 and the top strip at 26.
- **Pace:** steady runs to the end. S3 is taught at class level, with the Isha/Farhan worked example and the child's own step.

**Joints by hand**

| Lesson | Wrong place | Stacked | Missing | Total |
|---|---|---|---|---|
| steady | 0 | 0 | 4 (20, 72, 132; 158 has no acknowledgement) | 4 |
| stuck | 2 (58, 64) | 1 (46) | 1 (28) | 4 |
| offtopic | 0 | 0 | 0 | 0 |
| steering | 0 | 0 | 1 (42) | 1 |

## C. Defects

| Defect | Rows | Layer | |
|---|---|---|---|
| A remediation's help said over the skill's first check board | steering 12, steady 82 | b (+d: `helpBoard` 0) | new |
| Go-on line with no key; stacked with backTo | stuck 58, 64, 46 | b/c | new |
| Turn ends on no question | steering 4 | b | new |
| The worked example's question asked over its answer-state board | stuck 64 | b | new |
| S3 remediation for a repeated misconception never said | steady 117–148 | b | new |
| Verdict + why + new point at 64–71 words; check-in runs of 3–5 | as above | b | new (L2) |
| The child's reason ignored before the wrap | steady 157–158 | b | carried |
| S1 e1/e2 `pointAlt` paraphrases the point | 4 rows | a | carried |
| No lead-in to the worked problem | 4 rows | c | carried |
| Script sentences: S1 e3 point (a 3/7 line used to compare 1/4 and 1/8), S1 step 1's doubled "ek-ek", S2 c2 bache/khaya, the raw key "Is sawaal ka sahi jawab: neeche wali patti ka hissa chhota" (stuck 12); the worked problem's question asked again as the child's step (×3) | | a | carried |
| Help wordings recorded as "point"; a "verdict" recorded where none was said | | b | carried / new |

**Gone since D25:**
- the point re-said as a hint;
- the return glued onto a verdict;
- the one-turn wrap;
- silence after a give-up following a key;
- the false Hindi promise;
- the model-written opener;
- the hindiSwitch seam without `by`;
- the false key flag.

## D. Scores (D25 → D26)

| Axis | Score | Why |
|---|---|---|
| Listening | 3 → **3.5** | No repeats, and give-ups after a key are answered. But the S3 misconception got no remediation, and steady 157 was ignored. |
| Worked example | 4 → **4** | |
| Class level | 4 → **4** | |
| Screen and speech | 4 → **3.5** | 2 unsaid boards, plus stuck 64. |
| Register | 3 → **3** | |
| Promises | 3.5 → **3.5** | The Hindi promise is now kept. The go-on line is broken 3 times in stuck. |

## The clauses

1. **Help with nothing new:** 0, 0, 0, 0; the topic total is 0. There are 4 paraphrases (stuck 6, offtopic 24, steering 26 and 36), all S1 `pointAlt`, so the fault is the wordings, not the picker. Does not fire.
2. **Keys:** 0 given while a ladder wording was unsaid. 1 given where a hint would have done (steady 148). Does not fire.
3. **A help wording over a board that is not its part's: 2** (steering 12, steady 82). **Fires.** Keys over the answer board: all of them.
4. **Turn length:** the steady lesson is 161 rows. The check-ins are **tedious: yes**. Turns of 61 to 75 words read as **monologue: yes**, for the 9 verdict + why + new point turns.
5. **L2 as written: fires.** Steering 4 ends on no question. 0 returns not alone; 0 wraps not in two turns.
6. **Register 3.** Rows by cause: (a) 2, (b) 1, (c) 0, (d) 6, (e) 4, (f) 7. The (f) rows are wrong-place or stacked joints and the thin aside reply.
7. **Card hints** that give the key, make it trivial, or are untrue: 0.
8. **The sentence about the child:** untrue 0, unnatural 0.
9. **Reader** wrong kinds 0; **captions** untrue or giving an answer away 0; **model sentences** heard 0.
10. **Listening and promises are both 3.5.** The rows that hold them down:
    - steady 117–148, a misconception (rule missing: one remediation per misconception id across the lesson);
    - steady 157, a reason (rule missing);
    - stuck 46, 58 and 64, the go-on line (rule not followed).
11. **Script sentences:** untrue 0, giveaway 0, repeated frames 3, unnatural 4.
12. **Misgrades** 0. **Unsaid boards** 2, both paging (help board). **Contradictions** 0.

The known item ("no place" setting off the safety turn) did not happen in c5-t02.

## E. Verdict

**c5-t02 does not pass the scale gate.** Two lines fail:
- **2 unsaid boards (layer b):** the help path draws the skill's first check board for a remediation.
- **Register at 3 (b and c):** the verdict + why + new point turns, runs of check-ins, go-on lines with no key, and no lead-in to the worked problem.

Listening reaches 3.5; register does not; promises reach 3.5. Help itself now works: nothing is repeated, every request gets something new, and every key is said over its answer board.

**The changes that would move it most:**
1. Say a remediation's help over that remediation's own held board, and fix `helpBoard` from these two rows.
2. Say the go-on line only after a key. Add a lead-in joint before a worked problem, and never stack two joints.
3. Break the verdict + why + new point turn at 60 words, and stop putting a check-in on every help wording at the worked steps. Also let each skill's own remediation fire for a misconception already seen in an earlier skill.

**30-topic batch: no.** The board fault and the joint misuse are in the walk, so they would reach every topic.