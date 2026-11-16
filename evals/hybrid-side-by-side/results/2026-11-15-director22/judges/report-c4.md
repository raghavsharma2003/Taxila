# c4-maths-ch05-t01: director22 hand judgement

**c4 does not pass the gate.** It fails on 5 contradictions, and listening and register are both at 3. Promises reach 3.5. Listening and register do not.

## A. Hand counts

| Lesson | Beats | Verdicts / keyed | Contradictions | Unsaid boards | R→W / W→R | False keys |
|---|---|---|---|---|---|---|
| steady | 39/39 | 28/29 (row 53 not graded) | 1: row 18, second view | 0 | 0/0 | 0 |
| stuck | 10/11 (e3 point skipped, row 52) | 8/8 | 1: row 20, second view | 0 | 0/0 | 0 |
| offtopic | 15/15 | 10/10 | 2: row 26, second view; row 30, paging | 0 | 0/0 | 0 |
| steering | 15/15 | 10/11 (row 33 not graded) | 1: row 14, second view | 0 | 0/0 | 0 |
| **d22** | **79/80 (98.8%)** | **56/58 (96.6%)** | **5** | **0** | 0/0 | 0 |
| d21 | 83/86 | 74/74 | 1 | 2 | 0/0 | 0 |

There were 167 beat turns in all.

- **The four second-view contradictions.** In each one the child asks for a picture and nothing new is drawn. She says, for example, "Iski doosri tasveer abhi nahi ban rahi" (stuck 20) or "Is par doosri tasveer nahi ban paa rahi" (offtopic 26, steering 14). The held record has `picture.view: null` in every case. These lines also let the child see that the picture failed to build, which the owner's item 9 forbids. In director21, c4 drew a new view for each picture request.
- **The paging contradiction (offtopic 30).** She re-says the e3 point ("Is circle ke 3 barabar tukde hain, ek mein rang…") over the remediation's chocolate bar (4 parts, 2 shaded). The circle only appears at character 166.
- **The harness's own flags are wrong in two places.** It counts steady 102 ("28", a hypothetical) and steady 136 ("4/9", the correct key) as false keys. Neither is.

## B. Items

**Director21 mechanisms**

| # | Status |
|---|---|
| 1 A return takes a part's place | **Gone.** The worked problem is said in 4 of 4 lessons |
| 2 The ending is unscripted | **Gone.** The teach-back and wrap are authored |
| 3 A remediation used as help | **Gone.** 7 of 7 follow their own misconception, on the then-card's board |
| 4 A picture request leaves its part | **Gone**, but now nothing is drawn at all (4 of 4) |
| 5 A second clarify only repeats | **Gone.** There are 2, both new wordings. The why's second wording comes after a key 6 times |
| 6 Authored blocks with no join | **Reduced, 14 → 12** |
| 7 `backTo` never fires | **Partly.** It fires 9 times, but only 3 are real returns. 5 real returns go without it (steady 16, 98, 128; stuck 22; steering 18) |
| 8 The question alone is not enough | **Gone.** 0 of 10 |
| 9 The aside reply is flat or said twice | **Reduced.** None is said twice, but the AI-line replies are still flat |
| 10 The first miss gets the key | **Gone** |
| 11 The child's line read as the wrong kind | **Worse: 10 rows.** Two right answers are taken as asides (see Listening) |
| 12 Script data | "Zoya ka kehna hai" and the bridges are fixed. The repeated frames and word pairs remain |
| 13 Small wording faults | "Is sawaal ka sahi jawab: nahi" is still said (stuck 24, 48) |

**Order laws**

| Law | Rows that break it |
|---|---|
| O1 | 1: stuck 52, the e3 card said with no point |
| O2 | 0 |
| O3 | 0 |
| O4 | 3: a Hindi request leaves its part (stuck 10, steering 8, offtopic 34) |
| O5 | 2: offtopic 70 and steering 68, a break turn with the s2:e1 board still up |
| O6 | 0 |
| O7 | 1: offtopic 30, where "Oh, catch. Achha." comes after three sentences of the point |

Displaced parts said late: steady 0, stuck 0, offtopic 1 (row 30), steering 0.

**The ending (steady).**
- Row 134: the c3 verdict, then "Is circle ke 9 barabar tukde hain…" with no lead-in. The board is the teach-back's, 9 parts with 4 shaded.
- Row 135: the child says "pehle wale step se pata chala".
- Row 136: "Iska jawab hai 4/9, kyunki…". The answer board only appears at character 129, under the wrap. The wrap in full: "Aaj ki baat yeh thi ki tukde barabar hon tabhi unka fraction naam banta hai, aur neeche ka number poori cheez ke saare barabar tukde ginta hai. Phir cheezon ke group ka fraction aaya, aur yeh ki ek hi cheez jitne zyada tukdon mein kate, har tukda utna chhota hota hai. Aaj ke liye itna hi, phir milte hain!"
- It is true of this lesson. It reads as a **form letter**: a syllabus line said right after a missed question, in one 84-word turn.
- It would be untrue on a short path. Stuck, offtopic and steering all stop in s1, and the wrap's text does not depend on the path.

**Asides**

| Child's line | Park | Return | Child | Her reply | Rating |
|---|---|---|---|---|---|
| steady 31 | row 32, form 2, goes on ✓ | row 50, on the key's turn | "bowling karna" | row 52: "Achha, toh tumhara favourite hai bowling karna." | natural |
| steering 27 "sixer" | row 28, form 2, then `backTo` and the card ✓ | row 30, on the key's turn | "bowling karna" | row 32: the same line, with no `afterAside` joint | natural |
| stuck 33 (AI line) | — | — | "batting" | row 36: "Oh, batting. Achha. Achha, ab padhai…" | flat |
| offtopic 5 (AI line) | — | — | "batting" | row 8: "Hmm, batting. Samajh gayi." | flat |
| offtopic 17 (AI line) | — | — | "Dhoni" | row 20: "Hmm, achha, theek hai." | flat |
| offtopic 27 (AI line) | — | — | "fielding karna, catch pakadna" | row 30: "Oh, catch. Achha." | flat, out of place |

- Both parks are returned to, and there is no return without a park.
- The returns use "Cricket mein tumhe kya karna sabse achha lagta hai?" The script's own asideReturn forms are never used.
- There are no taste claims, and 0 replies misstate the child.
- Against director21: the two park replies are better. The four AI-line replies are word for word the same as before.

**Clarify and give-up rows.** Most were handled right: the greeting (4), the first give-up at a card or check-in, a key after a hint, the why's second wording after a key, and a third clarify that moves on (stuck 29, 63). These were wrong:
- stuck 8 and 12: the e1 point is re-said word for word, the third and fourth time she says it;
- offtopic 60 and steering 58: a clarify after a hint gets `backTo` and the same card.

**Second clarifies: 2.**
- stuck 28 uses the point's second wording ("tum aur ek dost ek roti baant rahe ho…"). It helps.
- stuck 62 uses the problem's second wording ("Shaam tak plate par sirf 2 tukde bache…"). It is partly helpful: a different picture, but it adds a subtraction and has no board of its own.

**Read as the wrong kind: 10 rows.**
- A right answer read as an aside: steady 53 ("half") and steering 33 ("ek bata chhah"). She re-asks the card three times. The child protests "woh maine bata diya", and she then gives the key without ever crediting the answer.
- An AI-line answer read as "repeat": stuck 36, offtopic 8, offtopic 20.
- A give-up after a key read as a misconception: stuck 44, offtopic 64, steering 62.
- "haan, samajh aaya" read as a wrong answer: offtopic 24.
- A clarify read as "right": steady 102.

**Re-asks.** 10 hints. All 10 can be answered from the board and her words. The escalation is right, and every posed card ends with its key. A whole card is said again without being asked for in steady 26, 54 and 58; stuck 20; offtopic 60; and steering 14, 34, 38 and 58. It also happens 3 times after "try first".

**Hindi requests (4).**
- steady 36 changes the words (it uses the simpler).
- stuck 10, offtopic 34 and steering 8 say "Haan, Hindi mein samjhaati hoon." and then repeat words she has already said.

**Stitched turns: 12.**
- 5 returns to an earlier card with no `backTo`.
- 2 keys followed by the return question with no join.
- steering 32: the aside reply set against the next point.
- stuck 32: a miss verdict set against the remediation.
- steady 134: no lead-in to the teach-back.
- offtopic 30: "Chalo, pehle wale sawaal ki taraf wapas aate hain. Ab seekhne par wapas aate hain." (two joints back to back).
- stuck 36: "Achha. Achha,".

The new joints sound like a person: "Ek naye tareeke se socho" and "Ab wapas apni padhai par aate hain". But `backTo` is said 6 times where there was nothing to go back to (steady 26, 58; stuck 40; offtopic 60; steering 38, 58).

**Joints and frames**

| Joint or frame | Count |
|---|---|
| Park, form 2 | ×2 |
| Return, the sport question | ×2 |
| Hindi switch, form 2 only | ×4 |
| "Toh sawaal yeh hai" | ×3 |
| `backTo` | 4 / 4 / 1 across its three forms |
| "Phir se dekho:" | ×7 |
| "Ek baar aur dekho:" | ×3 |
| "Haan, sahi hai" | ×18 |
| "Yahan tak theek hai?" | ×12 |

The check-in wheel turns within 4 of her turns at stuck 4–14 and 24–32.

**Board changes.** 75 turns changed the board and 72 were in the right place. The three wrong ones are offtopic 26 and 30, and steady 136. 91 turns kept the board, and there were 0 split views.

**Turns over 60 words: 10.** They are steady 20, 72, 106, 108, 122, 130 and 136; offtopic 10; and steering 22 and 32. All are tutoring. Steady 122 (81 words) and 136 (84 words) are close to monologues.

**Third skill.** It is taught at class level. The worked example (two 1/6 pieces cover one 1/3) has 2 steps and a step for the child; after the child's miss it gets a hint, and it says its final answer. A remediation plays at c1. The lesson ends properly.

**Pace.**
- Steady: 137 rows, to the end of the script.
- Stuck: 67 rows, as far as s1 worked step 1. Director21 reached s1 c3.
- Offtopic: 71 rows, as far as the s2 bridge. Director21 reached s2 e2.
- Steering: 69 rows, as far as the s2 bridge, the same as director21.

**Carried rules.**
- No picture line leaks the key or has a hole.
- No card answered right is posed again.
- Grading holds.

**Two words for one thing.**
- "hissa" in the check-in beside "bhaag" and "tukda".
- "bar" and "patti" for the same thing in the s3 worked example (steady 112–118).
- "equal shares" in the greeting.

**Script sentences.**
- Untrue: 0.
- Giveaways: 1. The s2 e1 point gives each child "2 group" of 3, then asks for half of 12.
- Board giveaways (Studio): 1. The s3 e1 board shows the 4-part bar before the child predicts.
- Repeated question frames: 4 sets.
  - "kitna bhaag…, fraction mein?" ×4 in s1.
  - "N ka 1/k kitna" ×3 in s2.
  - "haan ya nahi?" ×2.
  - "A ka ya B ka?" ×2.
- Unnatural: 7. These are "saari pencilein" with no pencils introduced yet (steady 94), the three "can't draw it" lines, "theek nahi baitha", "Is sawaal ka sahi jawab: nahi", and the doubled joints.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| The line after an aside reply is still read as an aside, so a right answer goes ungraded | steady 53–60, steering 33–40 | b | new |
| No second view is drawn, and she says it cannot be built | 4 rows | b/c | new (a regression) |
| An old point re-said over another unit's board | offtopic 30 | b | new |
| A point skipped | stuck 52 | b | new |
| `backTo` said where there was no return, and missing on real returns | 11 rows | b | new |
| A Hindi request gets words already said | 3 rows | b | carried |
| A give-up after a key read as a misconception | 3 rows | b | carried |
| A break turn keeps another unit's board up | 2 rows | b | new |
| The teach-back key is said on the question board | steady 136 | b | new |
| The AI-line replies are flat; only one form rotates | 4 rows | c/a | carried |
| The wrap does not depend on the path; the asideReturn forms are unused | — | a/b | new |
| `repeatedAuthored` exempts every card, so it misses steady 26/28 and steering 32/34 | — | d | new |

## D. Scores (d21 → d22)

| Axis | d21 | d22 | Why |
|---|---|---|---|
| Listening | 3 | 3 | Re-asks and second wordings are fixed. Two right answers are now ignored, and the Hindi and picture requests are not met |
| Worked example | 3.5 | 4 | The problem is said in 4 of 4 lessons, and the final answer whenever the example is finished |
| Class level | 4 | 4 | |
| Screen and speech | 3.5 | 3 | 5 contradictions |
| Register | 3 | 3 | Joints fire in the wrong places, single forms, flat AI-line replies |
| Promises | 4 | 3.5 | 3 broken Hindi promises; both parks kept |

## Reversal clauses

| Clause | Count | Triggered? |
|---|---|---|
| (1) Displaced parts said late | 1 (offtopic 30); no lesson feels rigid because of them | No |
| (2) The wrap reads as a form letter | My vote: yes | One vote toward two |
| (3) Second clarifies judged unhelpful | 0 of 2 (1 partly) | No |
| (4) Register | 3 | One topic toward two |
| (5) Replies that misstate the child | 0 of 6 | No |
| (6) Re-asks that cannot be answered | 0 of 10 | No |
| (8) Untrue or giveaway script sentences | 1 (2 counting the board) | No |

On (4): the seams are a minor cause. The main causes are that the walk picks the wrong joint and the reader misreads the child, and a model writing the joins would fix neither.

On (7), the rows below 3.5 and what is wrong with each rule:

| Rows | The rule is… |
|---|---|
| steady 53, steering 33 (a right answer after an aside reply) | wrong: rule D reaches one line too far |
| stuck 10, steering 8, offtopic 34 (Hindi) | not followed (L4) |
| 4 picture rows | not followed |
| offtopic 60, steering 58 (a clarify after a hint) | missing |
| stuck 8, 12 (a give-up on a card whose simpler is spent) | not followed (C1) |
| the `backTo` misfires | not followed |
| the flat AI-line replies | missing: R3 is not applied to them |

## E. Verdict

**c4 does not pass the scale gate.** Beats, verdicts, misgrades, false keys and unsaid boards all pass. It fails on contradictions (4 second view, 1 paging; layers b and c) and on listening and register at 3. Listening, register and promises do not all reach 3.5: only promises does.

The three changes that would most move it:
1. Return the reader to the card's column after the aside reply turn.
2. Draw the authored second view. When there is none, say the second wording over the board that is up, and never say that a picture cannot be built.
3. Say `backTo` only on a real return, and always on one. Answer a Hindi request with the second wording.

**Batch: no.** The faults are in the shared walk and reader. The hand count found 5 contradictions, but the run's gate predicates read 0 for c4, apart from the one O1 row.