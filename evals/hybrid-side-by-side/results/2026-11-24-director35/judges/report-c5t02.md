**c5-maths-ch02-t02 (director35) passes every line of the gate on my own counts. This is its second passing run.** There are 0 contradictions, 0 unsaid boards, 0 misgrades and 0 false keys, and every axis is 3.5 or above.

The run folder has no `scripts/c5-maths-ch02-t02.json`. I read the script from `/home/user/taxila-int/data/lesson-scripts/c5-maths-ch02-t02.json` at 6f56fc8b7, the tree the README names; that file has no local changes.

## A. Hand counts

| Lesson | Rows | Beats taught | Verdicts | Contradictions | Unsaid boards | R→W / W→R | False keys |
|---|---|---|---|---|---|---|---|
| steady | 107 | 51/51 | 43/43 | 0 | 0 | 0/0 | 0 |
| stuck | 83 | 39/40 (row 44 is an AI line) | 26/26 | 0 | 0 | 0/0 | 0 |
| offtopic | 77 | 34/37 (18 park, 20 and 28 AI lines) | 23/23 | 0 | 0 | 0/0 | 0 |
| steering | 71 | 33/34 (46 AI line) | 24/24 | 0 | 0 | 0/0 | 0 |
| **D35** | | **157/162 (97%)** | **116/116** | **0** | **0** | 0/0 | 0 |
| D34 | | 165/169 | 128/128 | 0 | 0 | 0/0 | 0 |

K1 script row (a), not a contradiction: steady 82, the told line "har hissa 1/3; … har hissa 1/7" over a line in 7 and 3 gaps with no marks. The gaps are drawn but the fractions are not labelled, and nothing on the board denies them.

## B. Items

- **Boards: working.**
  - 92 turns changed the board, and every page change fell at a part's first character. I checked every owning part against the board up at its first word. 67 turns kept the board.
  - Hooks are said over a blank page. Joints, lead-ins, bridges and parks are said over the board already up.
  - Every point and remediation board is true of its words, and none shows what its card asks.
  - Each key was said over its answer board: steady 102, stuck 42, steering 18.
- **The director34 mechanisms in this topic:**
  - (1) The second picture is not a dead end any more. Steering 16 says "Iski aur koi tasveer mere paas nahi hai.", then an unsaid remediation wording, and keeps the view up.
  - (2) Partly working. The answers 7/4 and 4/1 now have their own reasons, said at stuck 62, offtopic 54 and steering 26. One path was not built: at **steering 50** the child said 7/4 and got the hint. That reason opens with "Tumne dono number ulat diye.", which was already said at row 26, and `help.js` treats a reason as spent if any sentence of it has been said.
  - (4) Reduced. The try-first line is now the whole turn (4 times). A bare "haan" gets the short ask (stuck 22, offtopic 24). The steering follow-up card is held 7 turns (rows 6–18) and the cap then gives the key; in director34 it was 8 turns with no key.
  - (6) Mostly gone: "Suno," 0 times (director34: 3), aside replies chosen by kind, "do baar aa gayi" gone, first turn 60 words.
- **Help: working.**
  - Help turns with nothing new: 2. Stuck 50 and offtopic 44 say "Ek hi roti ke jitne zyada barabar hisse hon, har hissa utna chhota hota hai." one turn after "Roti jitne zyada hisson mein kate, har hissa utna chhota."
  - Same idea in new words: steady 92 after 90, and steering 16 after 10 and 12.
  - Keys given with a wording still unsaid: 0. Keys where a hint would have done: 0.
  - Every request got help for its own part.
  - The "nothing easier" line was said once (steering 20). It is true, but cold: "Main ise aur aasaan nahi bol paa rahi, koi baat nahi. Theek hai; ab pehle wala sawaal…"
- **Turn shapes: partly working.**

  | Kind | n | Words | Worst |
  |---|---|---|---|
  | (a) verdict, reason, point, card | 22 | 56–66 | steady 50 jumps from the sevenths line to the fifths line with no join |
  | (b) hook, point, card | 4 | 60–66 | stuck 4: 66 words to a child who said "pata nahi" |
  | (c) miss, remediation, card | 10 | 59–72 | **offtopic 68**: three fraction pairs in one breath |
  | (d) verdict, lead-in, problem, step | 9 | 56–64 | reads fine |
  | (e) aside or park into the live part | 6 | 27–69 | steady 44 |

  - Every ending is on the list.
  - No quick question was heard, and no point gives its card's answer away.
- **Check-ins and worked examples: working.**
  - Check-in turns: steady 3 (rows 38, 70, 102), stuck 2, offtopic 1, steering 2. The longest run is 1, and none is of a forbidden kind. I do not find them tedious.
  - All three asked steps are decisions: "kam hisson mein kati, ya zyada?", "upar wala number ya neeche wala?", "khaye hue hisson ki ginti, ya hisse ka size?"
  - The child's own step is nearly settled by the told step in skills 1 and 3. They read as a teacher working a problem with a child.
  - Turns over 60 / 75 / 90 words: 31 / 0 / 0 (director34: 39 / 1 / 0).
  - 18 rows use the short reason, all true and enough, e.g. "Mona teen gap chali, Sonu sirf ek."
- **Joints: working.**
  - Misplaced joints, two joints at one seam, and returns with no back-to line: 0 each.
  - Abrupt seams: 2 (steering 20, the stacked consolations quoted above; steady 50).
  - The after-key form was said once: "Theek hai; ab pehle wala sawaal phir se saath mein dekhte hain." It sounds like a person.
  - The row's `seams` record matched what was said on the turns I checked.
- **Asides: working.**

  | Lesson | Rows | What she said | Reading |
  |---|---|---|---|
  | steady | park 40, return 42, reply 44 | "Oho, chauka! Isi mein tumhe maza aata hai." | natural |
  | stuck | AI line 44, reply 46 | "Achha, toh tumhe chauka pasand hai!" | natural |
  | offtopic | park 18, reply 22 | "Achha, toh tumhe chauka pasand hai!" | natural; the park is **never returned to** (carried) |
  | offtopic | second AI line 28, reply 30 | "Tumhara favourite kaun hai?" then "Arre wah, Virat! Achha kiya jo bataya." | the question asks what the child had already said; the reply is flat but fits a person |
  | steering | reply 48 | "Wah, chauka! Toh tumhara favourite yahi hai." | natural |

  - Better than director34, which had one reply in all four lessons. No taste claims.
- **Pictures: working.** Steady 18, stuck 18, offtopic 26 and steering 14 each drew the view the walk named, with a true authored caption that names nothing a later card asks.
- **Hindi: working.** The easier-words line was said at steady 36 and steering 8; the README lists only steady 36. Every Hindi request got new words, and promises were kept.
- **Wrap: working.** The closing verdict says its why (row 102). "Batane ke liye shukriya." after "aasaan laga" is flat. The sentence about the child (s3 c3, answered right first time at row 97) is true.
- **Script sentences:**
  - Untrue: 0.
  - Giveaway: 2. The reason "Tumne dono number ulat diye." for 4/1 (s1 e2) and for 7/4 (s2 e1) hands a child who flipped the fraction its answer.
  - Repeated frame: 2. One is "ulat diye" across two skills. The other is a family of "N ginta hai ki … kitne hisson mein kati" in skill 1's reasons (steady 6, 16, 30).
  - Unnatural: 1, "Chhota 9 chhota hissa nahi banata" (steady 6).
  - Overstated: 1, the s2 e4 point "jo aadhe se aage jaaye, woh bada", heard in all four lessons.
- **Register rows by cause:**

  | Cause | Rows | n |
  |---|---|---|
  | (a) fixed form heard too often | steady 62 ("Toh poora jawab" ×3); stuck 40 (7 invitations); offtopic 30 (the same step re-ask at 16, 22 and 30); steering 42 ("Yeh jawab sahi nahi hai." ×5) | 4 |
  | (b) a script sentence | steady 6, stuck 32, steering 10, offtopic 66 | 4 |
  | (c) the verdict and its why | none | 0 |
  | (d) length or shape of the turn | steady 50, stuck 4, stuck 70, offtopic 68, steering 52 | 5 |
  | (e) help | steady 24 (re-says row 22's told line), stuck 50, offtopic 44, steering 12 ("Pizza party…" over a board titled "Roti") | 4 |
  | (f) other | steady 106, offtopic 28, steering 20 | 3 |

- **Pace.** The steady lesson runs to the end, and skill 3 is taught at class level with a real worked example. The other three lessons stop at the skill 2 worked step when the child says stop; offtopic is 77 rows against director34's 93.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| Named reason skipped because its first sentence is shared | steering 50 | b, caused by a | New |
| "Tumne dono number ulat diye" gives the answer | s1 e2, s2 e1 | a | New |
| Park never returned to | offtopic 18 | b | Carried |
| Same step re-ask heard 3 times | offtopic 16, 22, 30 | b | New |
| Hint near-repeats the reason from the turn before | stuck 50, offtopic 44 | a | Carried |
| 72-word miss, remediation and card | offtopic 68 | a/b | New |
| Stacked consolations around the "nothing easier" line | steering 20 | c | New |
| Pizza words over a "Roti" board | steering 12 | a | New |
| Labels: the named reason is logged as `whyAlt`; steering 48's point is logged as `held` | | c | |
| Live script missing from `scripts/`; README misses the easier-words line at steering 8 | | d | |

Gone since director34: "Suno," after a verdict; the single aside reply; "do baar aa gayi"; steady 36 ending on a check-in; the whole card re-asked after a bare "haan"; the 8-turn follow-up card with no key; the 84-word turn.

## D. Scores, director34 → director35

| Axis | Score |
|---|---|
| Listening | 3.5 → **4** |
| Worked example | 4 → **4** |
| Class level | 4 → **4** |
| Screen and speech | 4 → **4** |
| Register | 3.5 → **3.5** |
| Promises | 4 → **4** (offtopic park still not returned) |

## Reversal clauses

- **(1)** 0 / 0 / 0 / 0.
- **(2)** Counts as in the turn-shape table. Offtopic 68 is too long, but it is the only one. Endings outside the list: 0.
- **(3)** Requests left without help: 0. The "nothing easier" line is true; I hear it as cold, not a dead end.
- **(4)** 2 help turns with nothing new, not more than 2. Keys with a wording unsaid: 0.
- **(5)** 18 short-reason rows, all true and enough.
- **(6)** Steady has 107 rows, 3 check-ins, longest run 1. Forbidden check-ins: 0.
- **(7)** Score 4; all three asked steps are deciding steps.
- **(8)** 0 / 0 / 0; abrupt seams 2.
- **(9)** Model words: 0. Steering 70 is the carried stop menu.
- **(10)** Hints and re-asks with a fault: 1 (offtopic's re-ask repeated). Near-giveaways at the third rung: stuck 40, stuck 74.
- **(11)** Register 3.5; rows by cause as in the table above.
- **(12)** Wrong kinds: 0. Captions authored and true. The sentence about the child is true.
- **(13)** Does not fire.
- **(14)** Giveaway 2, which is not more than 2. Untrue 0.
- **(15)** None.
- **(17)** All 4 picture turns drew the named board.
- **(18)** The step's easier wording before the told step is one useful rung. The extra wording before the key on steering's follow-up card (sayAlt at 12) is one more thing between the child and the answer.
- **(19)** Stuck 4 "Theek hai, main shuru karti hoon." and steering 4 "Chalo, main batati hoon." do not brush the child aside.
- **(20)** Not a dead turn.
- **(21)** 0 remediations said alone.
- **(32)** The views add little and settle nothing.
- **(33)** 0 misgrades.
- **(40)** Steady 42 is not abrupt.
- **(41)** Offtopic 58 and steering 52 (66 words each); not a monologue.
- **(45)** Steering 16: no board change inside the turn.
- **(46)** 19 own reasons and 3 named reasons, every one after its named answer.
- **(47)** 0 lines over a posing board or a "?".
- **(48)** Longest run by ear is 2 in every lesson. Stuck has 7 invitations in three rotating forms, each after help; I would not name them a fixed form.
- **(49)** Not heard as a broken promise.
- **(50)** The overstated s2 e4 point should have been caught by the fifth pass. The shared "ulat diye" sentence is a kind the six-word frame rule misses because it crosses skills.
- **(53), (16)** Do not apply to this topic.
- **(54)** I count no hint board as a contradiction.
- **(55)** Offtopic 34 and steering 18: neither child was about to get there.
- **(56)** "Sahi jawab, kyunki…" does not run the verdict and reason together.
- **(57)** Fires by its letter for s1 e2 and s2 e1. I would reword the reason, not split the card.
- **(58)** Not exercised.
- **(59)** 1 lesson (stuck 22), so it does not fire.
- **(60)** Passes. This is run two of two.
- **(61)** I count 0.
- **(62)** Register is 3.5 again in this topic.
- **(63)** Does not fire.

## E. Verdict

**c5-t02 passes the scale gate on every line, and listening, register and promises each reach 3.5.** No gate line is blocked.

The three changes that would move it most:
1. Count a named reason as spent only when the whole reason has been said. Separately, rewrite the "ulat diye" reasons so they point at which number counts the parts and do not reveal the answer.
2. Cap the miss, remediation and card turn so it carries two fraction pairs at most (offtopic 68).
3. Return to every parked side-topic, and vary a re-ask heard a third time.

**Child: yes.** Every sentence is true over its board and every answer is graded right.

What a parent would still notice: dense 60–66-word turns, one fixed phrase heard 5 times in a lesson, and "Main ise aur aasaan nahi bol paa rahi" said to a child who has given up.