# c5-t02 · director20 hand judgement

c5-t02 does not pass the scale gate. Every count line passes again, but listening and promises are both 3. Rows are 0-based indices into each lesson's `director` array.

## A. Hand counts

| Lesson | Beats | Verdicts | Contradictions | Unsaid boards | Right called wrong / wrong called right | False keys |
|---|---|---|---|---|---|---|
| steady | 17/17 | 20/20 | 0 | 0 | 0/0 | 0 |
| stuck | 12/12 | 17/17 | 0 | 0 | 0/0 | 0 |
| offtopic | 12/12 | 14/14 | 0 | 0 | 0/0 | 0 |
| steering | 9/9 | 13/13 | 0 | 0 | 0/0 | 0 |
| **D20** | **50/50** | **64/64** | **0** | **0** | 0/0 | 0 |
| D19 | 50/50 | 64/64 | 0 | 0 | 0/0 | 0 |

- **Soft cases, not counted (as in D19):**
  - "jabki 1/2 rekha ke beech" over the unmarked [6,12] line (steady 6, stuck 16, offtopic 16, steering 6).
  - "4/10 ho ya 8/10" over the unmarked tenths line (stuck 64, offtopic 60).
- **Cannot check:** steering 14 says "nishaan ek-chauthai par", but the record does not keep the view's params.
- **Watch:** the break is said over a bridge-unit board whose "?" card was never posed (steady 88, steering 56).
- **Ungraded, correctly:** offtopic 19 ("Zoya").

## B. Items

**The ten director19 faults**

| # | Fault | Status |
|---|---|---|
| 1 | Joints spoken wrongly | **Gone.** The park is one sentence (×3) and the return uses `{aside}` only (×2). |
| 2 | Return and card in one turn | **Gone** (steady 40, offtopic 46) |
| 3 | "Phir se dekho" on a first posing | **Gone.** Used twice, both on re-poses (stuck 8, steering 32). |
| 4 | Clarify at a check-in poses the card | **Gone.** Stuck 24 gives the simpler only. |
| 5 | Give-up with the help spent gets no key | **Still there.** Steering 30 is word for word D19's row: "Ab ek sankhya rekha lo, 0 se 1 tak. Yahan tak theek hai?" (guard `mustsay,leak` "repaired" it to this; `check` null). Smaller cousin: stuck 28 repeats stuck 24's simpler word for word. |
| 6 | Stack after a steering request | **Gone** (0) |
| 7 | Planned board change not drawn | **Gone** (49/49 drawn) |
| 8 | Board up under a joint word | **Gone.** 0 of 13 turns that open on a joint (D19: 11). |
| 9 | Worked example's final answer dropped | **Working.** steady 80: "Toh poora jawab: Raju ne, sirf 3/8". In s1 the close ends on "1/3 bada" (steady 38, offtopic 40). |
| 10 | English word beside its Hindi twin | **Gone** (0) |

**J2, the aside return**

| Lesson | Park | Return | Child's answer | Her reply (j2) | Pick-up |
|---|---|---|---|---|---|
| steady | 32, form 2, one sentence, on time | 40: "Toh cricket mein tumhare saath aur kaun hota hai?", no card | "jab Virat chauka maarta hai, woh" | 42, model, accepted: "Virat ka chauka dekhna mazedaar lagta hai." Natural, but has no subject, so it reads close to her own taste | c1, board at char 43 ✓ |
| offtopic | 30, same form | 46, after c1's verdict, no card | same | 48, model, accepted: "Virat ke saath chauka, cricket ka mazedaar pal raha hoga." **Odd, and wrong about the child's words** (she implies "with Virat"); the child's own sixer (29) is never mentioned | c2, board at 58 ✓ |
| stuck | 34, on time | **never.** 19 more of her turns up to the goodbye | — | — | the park is a broken promise |

- 0 of 2 drafts refused.
- None of her replies repeats the child's sentence, speaks as a man, promises anything, or states a wrong cricket fact.
- The Virat questions are answered on time with the AI line: offtopic 8 and 18, steering 24. In offtopic 18 she asks "Tumhara favourite kaun hai?", the child says "Zoya", and **she ignores it** (row 20).

**Clarify rows**

| Rows | Where | What she did | Verdict |
|---|---|---|---|
| steering 1→2 | greeting question | went on to the hook | wrong: the clarify was read as nothing |
| steady 9→10 | then-card, first posing | then-card's simpler, then re-posed | right |
| stuck 5→6 | e1 point and card | roti simpler, then re-posed | right |
| stuck 23→24 | check-in after the e3 point | simpler, no card | right |

- **Second clarifies:** 0 (the run did not exercise them).
- **Nearest case:** stuck 27→28. A give-up right after row 24 gets the same simpler again (1 of 1 repeated without helping).
- **Reading faults:** 1 (steering 2), plus 3 soft ones where "pata nahi" at a check-in was taken as yes (stuck 66, offtopic 62, steering 18).

**Joints**
- **Park:** "{aside} ki baat bhi hogi, bas yeh mukabla khatam ho jaaye." ×3
- **Return:** "Toh {aside} mein tumhare saath aur kaun hota hai?" ×2
- **Hindi switch:** "Achha, isko Hindi mein bolti hoon." ×4
- **Ask-again:** ×0
- Each joint is said at most once per lesson and is identical across the four lessons (pinned seed).
- Stuck 8 promises Hindi, then says "Phir se dekho:" and the unchanged card.

**Frames (repeats within 4 of her turns)**
- "<verdict>. Dekho, <why>": ×14 in all, 7 of them in steady. Within 4 turns: steady 60/68 and 80/86, offtopic 50/56. Code-written.
- The same simpler re-said: stuck 24/28 (authored).
- Fragment re-said: steering 26/30 (authored).
- "Achha.": steady 62/70 (code).
- "...sahi nahi hai": stuck 44/48/54 (code).
- "Is sawaal ka (sahi) jawab": stuck 48/56 (code).
- **Across lessons:**
  - "Haan, pehle tum try karo —" ×4;
  - the Virat AI line ×2, identical;
  - the picture descriptor "Dekho, yeh do barabar pattiyaan hain: ek N…" ×2.
- Verdict and miss openers vary well: stuck's 7 misses in a row have 6 different openers.

**Carried over**
- **P6 pictures:** 4/4 split views (steady 18, stuck 18, offtopic 26, steering 14).
- **T2:**
  - Asides with no card open were parked without "is sawaal ke baad" ✓.
  - A Hindi request did not use up a card's help (steering 8→10) ✓.
  - Not exercised: "woh maine bata diya" with a card open, and try-first with no card open.
- **No re-pose of a right-answered card** ✓
- **G1:** 0 misgrades ✓
- **R6:** authored lines said as written ✓
- **Answer marks:** 21/21 ✓
- **New script fields heard:** only the step simplers (offtopic 32, steady 74). Not heard: the worked problem's own simpler, the bridge simplers, the yourStep why, the named mix-ups (s3 was never reached).

**Board changes:** 70 turns changed the board (49 new units, 21 answer marks) and all 70 changed in the right place. 64 turns held the board, plus 4 split turns (D19: 69 / 58 / 66).

**Hints after wrong answers:** 23 misses (4 / 11 / 3 / 5). Escalation was right everywhere except steering 30. Stuck 28 re-said a hint. Every posed card ended with its key. Stuck 44, 48 and 52 give three keys in a row on the same misconception, each followed straight away by the next card. The remediation was used once (stuck 16), with no reteach after that.

**Turns over 60 words:** 9 (D19: 9).
- **Monologue:** steady 64 (82 words) and stuck 52 (a key plus a card, said to a stuck child).
- **Dense:** the e3 point turns (steady 20, stuck 22, offtopic 12).
- **Tutoring:** the other 4.

**Pace:** every lesson ended at the same place as in D19. Each lesson is about 2 rows longer, for the return turn.

## C. Defects

| Defect | Rows | Layer | Status |
|---|---|---|---|
| Give-up with spent help turned into a fragment, no key; the dry-matrix predicate missed it | steering 30 | b, c | carried |
| Park never returned | stuck 34 | b | new |
| Odd J2 reply sentence | offtopic 48 | c | new |
| Same simpler re-said | stuck 24/28 | a, b | reduced |
| Her own aside question's answer ignored | offtopic 18–20 | b | new |
| "pata nahi" at a check-in taken as yes | stuck 66, offtopic 62, steering 18 | b | — |
| Hindi request answered with the unchanged card | stuck 8 | a | — |
| Keys stacked with no reteach | stuck 44–52 | b | carried |
| Tenths remediation after a sevenths card | stuck 64, offtopic 60 | a | carried |
| "ben" lowercased | steady 84 | c | carried |
| "Dekho," frame | 14 rows | c | carried |

**Gone since D19:** faults 1–4 and 6–10, the doubled park, `{said}`, and the 11 early board switches.

## D. Scores (D19 → D20)

| Axis | Score | Why |
|---|---|---|
| Listening | 3 → **3** | The return is now its own turn, but steering 30, stuck's unreturned park and offtopic 20 fail. |
| Worked example | 4 → **4** | Real steps; the child does the final step. |
| Class level | 3.5 → **3.5** | Content is right; the stuck child gets stacked keys and the tenths remediation is carried. |
| Screen and speech | 4 → **4.5** | 0 contradictions and every board change is in place. |
| Register | 3 → **3.5** | Joints fixed; what remains is the "Dekho" frame and identical lines across lessons. |
| Promises | 3 → **3** | 1 of 3 parks broken; stuck 8's Hindi promise not kept. |

## E. Verdict

**c5-t02 fails the gate on the axis line only.** The count lines pass. **Listening (3) and promises (3) do not reach 3.5. Register reaches 3.5.**

The blocking faults are in the walk (b): the give-up cell (steering 30), the return that can never be reached in stuck, and the check-in "pata nahi" cell. The reply layer (c) adds the odd J2 sentence.

What would most move it:
1. Make the return happen whenever a check closes, before the lesson ends.
2. Compile the give-up-with-help-spent cell and the check-in give-up cell, and fix the predicate that let steering 30 through.
3. Give the walk a second wording when a simpler has already been spent.

**30-topic batch: no.** These faults are in the runtime and would reach every topic.

**Reversal clauses:**
- **(1) Fires.** 1 of the 2 model sentences is odd and wrong about the child's words (offtopic 48). That is above 1 in 4, though n is only 2.
- **(2) Count is 0.** No second clarifies were exercised. The near case (stuck 28) is 1 of 1 repeated without helping.
- **(3) Fires.** For each failing row, whether the rule is wrong, missing, or was not followed:
  - steering 30, give-up with help spent: the rule exists and was not followed, and its predicate is wrong.
  - stuck 34, park: the rule that forces a return is missing.
  - offtopic 20, her aside question answered: missing.
  - stuck 66, offtopic 62, steering 18, give-up at a check-in: missing.
  - steering 2, clarify at the greeting: missing.
  - stuck 28, give-up after the simpler was spent at the check-in: the second wording is missing.
- **(4) Does not fire** (register is 3.5). The frames are listed above.
- **(5) Does not fire:** 0 misgrades, 0 unsaid boards, 0 contradictions.