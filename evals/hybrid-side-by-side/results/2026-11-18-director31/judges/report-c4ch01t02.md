I judged c4-maths-ch01-t02 as a first run, and it **fails the gate**. The board, grading and verdict lines all pass: no unsaid boards, no misgrades, no false keys, and every keyed answer got a verdict. It fails on three axes below 3.5: promises, the worked example and class level. Clause 14 also fires (three untrue or giveaway sentences). The causes are script lines plus one code path in the walk that only this script triggers. The four pilots don't hit it.

## A. Hand counts (director30 column empty: first run)

| Lesson | Rows | Beats taught | Verdicts / keyed | Unsaid boards | Contradictions | Misgrades | False keys |
|---|---|---|---|---|---|---|---|
| steady | 115 | 26/26 units | 39/39 (3 step confirms count as verdicts: 29, 63, 93) | 0 | 0 (picture 18, see note) | 0 | 0 |
| stuck | 85 | 13/13 | 20/20 | 0 | 0 (picture 18) | 0 | 0 |
| offtopic | 69 | 12/12 | 14/14 | 0 | 0 (picture 28) | 0 | 0 |
| steering | 65 | 12/12 | 16/16 | 0 | 0 (picture 14) | 0 | 0 |

- **Picture turns:** all four are over boards with no second view, so she says the board's own caption and draws nothing new. That is by design under F6. Read literally, the gate line "picture request answered with nothing new drawn" would count them as 4 second-view contradictions, and the code's own per-row gate already flags 3 of them (steady 18, stuck 18, offtopic 28).
- **Pages:** in all 125 teacher turns, every page starts at its own part's first word.
- **Keys:** I solved every key myself and all are right.

## The angle board (F8)

| Cards | Answer readable from the words? | Does the drawing settle the card? |
|---|---|---|
| s1 e1 | yes (the point says every corner is a right angle) | yes (4 corner dots to count) |
| s1 e2 (table corner) | yes ("khaali jagah" means no) | yes: a 110° arc with no square, beside the square-marked tester |
| s1 e3, c1–c3, the follow-up card, the closing question | yes (turning keeps the corners) | no. Shape boards carry no right-angle mark; the second copy is turned 25° |
| s1 worked, the child's own step | yes (step 2 is told: "tester bilkul fit hua") | no. The tester is never drawn in the window |
| s2 e1, e2, e3, c1, the follow-up card, the worked own step | **yes: the words already state inside / outside / same opening** | **yes, every one** (45 vs 90, 120 vs 60, 40 vs 40, 70 vs 90, 130 widest) |
| s3 e2 (roti), the follow-up card (slack string) | yes | no. The roti is asked over a perfect circle labelled "sikka", and the slack string over the tight-string circle, so the drawing points the wrong way |

No skill-2 card makes the child judge an opening. Both the words and the picture do it for her, and the board cannot show a tester laid over a corner, which is the act being taught.

## B. Items

- **The board, part by part:** working. Points and remediations are true of their boards, and none shows what its card asks without speaking of it. Joints keep the board that is up; hooks run on a blank page. No card was said without its board.
- **Joints:** not working.
  - She said "Ab pehle wale sawaal ko phir se dekhte hain" before a card she had **never asked**, in 6 rows: steady 34, 72, 102; stuck 48; offtopic 30; steering 32.
  - Cause, in code: `say.js` (around lines 3019–3023, `saidBeforeNow`) treats a card as "said before" when its *last sentence* was said earlier. Here that sentence is "Kya yeh sahi hai?", which s1 c1/c2 and s3 e1/c2 all share.
  - A scan of all 28 lessons finds this only in this topic.
  - At steady 34 the "return" also uses c2's short re-ask, so the Zoya framing is dropped.
  - Other joint faults: stuck 68 puts the cold "nothing easier" line straight into the cricket return; steady 76 has a wrong `returnCard` record.
  - Totals per lesson: steady 3, stuck 2, offtopic 1, steering 1.
- **Help:** partly.
  - 4 help turns gave the child nothing new:
    - steady 8 and 10: a counting slip ("5", "2") gets the definition of a right angle re-taught;
    - stuck 30 and 32: a wrong "no" at the window step gets the problem setup re-said, never "fit means right angle".
  - "Nothing easier" was said once (stuck 68, true that nothing was left). It is a dead end, then a pivot to cricket.
  - Keys: 4 given, 0 with a wording still unsaid.
  - The short ask ("Ab phir se socho, jawab kya hoga?") came after help about a *different* figure 5 times: steady 86; stuck 44, 60; offtopic 56; steering 52. The board makes the question answerable each time.
- **Turn shapes** (words, lowest–highest):
  - verdict, reason, point, card: 58–72. The s1 e2 turn (71–72, steady 12 and steering 12) brings in a new tool, a rule and a scenario in one breath: too much.
  - hook, point, card: 55–61. Fine.
  - miss, remediation, card: 58–60. Fine.
  - verdict, lead-in, problem, question: 54–72. The s2 problem puts six facts in two sentences.
  - aside, then the live part: 29–74 (stuck 56 is the heaviest at 74).
  - Endings outside the five allowed: 0.
  - Turns over 60 words: 28. Over 75: 0.
- **Check-ins:** steady 5 (42, 52, 54, 74, 110), stuck 4, offtopic 3, steering 2. The longest run is 2. None are in a forbidden place. The two bridge check-ins read as a natural pause.
- **Short reason:** 7 steady rows, all true. Steady 72 drops the "2 m" distractor, which was the whole point of that card.
- **Worked examples:**
  - s1 (window): the asked step "kitni baar modna hoga?" is recall, and the own step is given away by the told step 2. A recital.
  - s2: the asked step "lambai ya khulna?" was answered by the point two turns earlier and by the short reason just before. The close's why is a non-sequitur: "R sabse bada… kyunki P ki bhujayein sabse lambi hain" (steady 66). The same why is said in two turns running (64 and 66).
  - s3 (diameter): real. The child's "50 cm" got the "not that" form and a good hint (row 96).
- **Asides:**
  - Parks: stuck 56, offtopic 14. Both returned (stuck 68, offtopic 22); every park was returned to.
  - Replies: "Oh, chauka. Achha." and "Achha, chauka! Theek hai." are flat but carry the child's word. "Achha, toh tumhe batting sabse achha lagta hai." is natural.
  - Offtopic 50: the AI line asks what she likes about Virat, which the child already answered at row 23.
  - No taste claims.
- **Hindi requests (4):** each got the Hindi form, with the same question and plainer syntax. But it swaps "right angle" for the book word "samkon", which is harder for this child.
- **Reader:** 0 real wrong kinds. "pata nahi, shayad wahi" is labelled `miss` by the harness 15 times; reading it as a give-up is right, so that is a harness fault.
- **Stop:** all authored (stuck 84, offtopic 68, steering 64 is the frozen menu). No model words found.
- **The sentence about the child** (steady 114): "chudi aur ande mein se circle chuna". True; she got that card right first try at row 105.
- **Pace:** steady reaches the wrap. The third skill (circle, centre, equal distance, diameter) is at class level.
- **Frames:**
  - "Dekho," is said 8 times in steady, twice within 4 turns (62 and 70).
  - The step question is said 4 turns running (offtopic 10–16), each time at the child's request.
  - Same-word pairs: kona/angle throughout; "kinaara" means both the tester's edge and the circle's rim.

## C. Defects

| Defect | Layer |
|---|---|
| False "back to the earlier question" before a new card (6 rows), from matching on the last sentence | (b) walk, set off by (a) the shared "Kya yeh sahi hai?" frame |
| Skill-2 cards stated in words and settled by the drawing; s1 is mostly yes/no | (a) |
| s1 worked example is a recital; s2 asked step given away; R close why untrue (steady 66) | (a) |
| P/Q in s2 e2 are different angles from P/Q in the worked example | (a) |
| Return led by the "nothing easier" line (stuck 68); short ask after help about another figure (5 rows) | (b) |
| AI line asks what the child already answered (offtopic 50); wrap ack "main yeh yaad rakhungi" after "bas laga" (steady 112) | (c) |
| "pata nahi, shayad wahi" labelled as a miss | (d) |

**Against the director30 list:** told-step cue, the Hindi request and the aside seams are gone. A why said in two turns running is still there once (steady 66). The false return is **new**.

## D. Scores (first run, so no director30 column)

| Axis | Score | Why |
|---|---|---|
| Listening | 3.5 | Requests are helped, but stuck 68 is a dead end and offtopic 50 doesn't listen |
| Worked example | 3 | One real example out of three |
| Class level | 3 | Yes/no s1, word-settled s2 |
| Screen and speech | 4 | Boards are true, but the tester fit is never shown |
| Register | 3.5 | Flagged rows by cause: (a) 2, (b) 2, (c) 1, (d) 5, (e) 5, (f) 5 |
| Promises | 3 | Six false "back to the earlier question" lines |

## E. Verdict

The topic does **not** pass. Listening and register reach 3.5; promises does not (3). The gate fails on promises, the worked example and class level, and clause 14 fires. The cause is script lines plus a code path the script triggers; the pilots are unaffected, so clause 27 does not fire and the script stays staged.

The three changes that would move it most:
1. Key the return on the card's own id, not its last sentence, and give each card its own question wording.
2. Rewrite the s1 and s2 worked examples so the child decides from what is shown, and fix the R close.
3. Rewrite the skill-2 cards so the child judges the opening from the drawing and the words don't state it.

I would not put this script in front of a child: she misstates her own next move six times, and skill 2 never makes the child judge an angle.