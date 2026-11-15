# c5-t01 judge report: director22

**c5-t01 fails the gate.** There are 5 contradictions: 4 picture requests where nothing new was drawn, and 1 teach-back key said on the wrong board. Listening and register both score 3. Beats, verdicts, grading and keys are clean.

## A. Hand counts

| Lesson | Beats taught (distinct beats) | Verdicts | Contradictions (row, mechanism) | Unsaid boards | Right→wrong / wrong→right | False keys |
|---|---|---|---|---|---|---|
| steady | 73/73 (43) | 40/40 | 18 second view; 146 paging | 0 | 0/0 | 0 |
| stuck | 31/32 (11) | 8/8 | 18 second view | 0 | 0/0 | 0 |
| offtopic | 33/34 (18) | 14/14 | 28 second view | 0 (row 70 borderline) | 0/0 | 0 |
| steering | 29/31 (16) | 12/12 | 14 second view | 0 (row 64 borderline) | 0/0 | 0 |
| **D22** | **166/170 (98%)** | **74/74** | **5** | **0 (+2 borderline)** | **0/0** | **0** |
| D21 | 152/158 (96%) | 67/67 | 0 | 0 | 0/0 | 0 |

- **Turns that taught nothing:** stuck 40 and offtopic 18 (the AI line), steering 34 (a return with nothing else), steering 6 (the card's simpler said before the card).
- **Second view:** "Iska alag chitra abhi nahi hai, isliye board wala hi lete hain." D21 drew a split view for all 4 picture requests; D22 draws none. That is a regression.
- **Paging (steady 146):** "Iska jawab hai 9/7…" is said over the bare teach-back board. The 9/7 answer board only appears at the wrap.
- **Borderline unsaid boards:** offtopic 70 and steering 64 are break turns that keep up the s2 e1 board, a unit she never said (O5). D21's offtopic 68 did the same and was not counted.
- **Automated flags I do not count:**
  - The false-key flags at steady 146, stuck 22 and 38, and offtopic 24 and 32 are wrong: "9/7" and "1/7" are true there.
  - Steady 54 and 78 are not contradictions.

## B. Items

**Director21 mechanisms (those that concern c5-t01)**

| # | Status |
|---|---|
| 1. The return takes a part's place | **Gone.** Every displaced part is said on the next turn, and steady 20's point is now delivered. |
| 2. Unscripted ending | **Reduced.** The teach-back and wrap are authored and true, but the key comes before the answer board does (steady 146). |
| 4. Picture request leaves its part | **Still there:** steady 18 and steering 14. |
| 5. Second clarify repeats | **Reduced.** Stuck 38 and 60 use second wordings. Offtopic 62 repeats row 60 word for word (remediations have no second wording). |
| 6. Stitched turns | **Still there:** 12. |
| 7. `backTo` never fires | **Partly working.** It fires 6 times, but 2 of those are wrong (steady 130, offtopic 28: "Chalo, ab pichhle sawaal par wapas chalte hain" on the same question). Returns after a then-card are still bare: steady 14, 30, 50, 112; offtopic 64; steering 38. |
| 8. Re-ask not enough on its own | **Gone:** 0 of 14. |
| 9. Flat replies | **Reduced.** |
| 11. Reader reads the wrong kind | **Still there:** 8 rows (D21: 6). |
| 12. Script data | **Reduced.** "Zoya kehta" and the "ek hop" bridge are gone. |
| 13. "Is sawaal ka jawab: sahi nahi" | **Still there:** steady 60; steering 56, 58. |

**Order laws**

| Law | Breaks | Rows |
|---|---|---|
| O1 | 1 | steering 6 (the card's simpler before the card) |
| O2 | 0 | |
| O3 | 1 | offtopic 32 (the remediation said again as the Hindi reply) |
| O4 | 4 | steady 18 and steering 14 (a picture request moves on); steering 6 (clarify) and 8 (Hindi) |
| O5 | 2 | offtopic 70, steering 64 |
| O6 | 1 | stuck 26 (the key on the first miss, after two give-ups) |
| O7 | 0 | |
| Displaced parts said late | 0, 0, 0, 0 | |

**The ending: partly working.**
- Row 144 asks the teach-back on its own board, but straight after c3's close with no lead-in.
- The child answers "jaise aapne samjhaya tha, waise hi kiya" (145). She gives the key and the why (146), on the wrong board.
- The wrap in full: "Aaj ki baat yeh thi ki har fraction ki number line par ek pakki jagah hoti hai: neeche wala number 0 se 1 ke barabar gaps ginta hai, aur upar wala batata hai 0 se kitne gap chalna hai. Jab upar wala number neeche wale se bada ho, toh fraction 1 ke aage aata hai. Aaj ke liye itna hi, phir milenge."
- It is true of this lesson. **It reads as a form letter:** nothing about this child, and it is stuck onto the key with no join. The other three lessons end with a spoken menu and no recap.

**Asides: working.**

| Lesson | Park | Return | Child | Her reply | Rating |
|---|---|---|---|---|---|
| steady | 34 (one sentence, goes on) | 42, after a close | bowling karna | "Achha, toh tumhara favourite hai bowling karna." (44) | natural |
| offtopic | 6 | 12, after a close | bowling karna | the same (14) | natural |
| steering | 26 | 34, its own turn, between the remediation and its card | bowling karna | the same (36) | natural |
| stuck, AI line | 40 | — | batting | "Oh, batting. Achha." (42) | flat |
| offtopic, AI line | 18 | — | chauka | "Hmm, chauka. Samajh gayi." (20) | flat |
| offtopic, 2nd sixer | none | — | — | "Achha." (36) | flat; ignored |

- Every park is on time and returned to, and every reply uses the child's own words.
- No taste claims, no reply said twice, no reply misstates the child (0 of 6).
- Better than D21, which had 0 natural replies.
- The return question is not one of the script's `asideReturn` forms.

**Clarify and give-up: partly working.**
- Most get the right cell: the greeting simpler; the simpler at check-ins; the why's second wording after a key (steady 54; stuck 28, 36, 52; steering 58).
- Stuck 8 and 12: a give-up on the 1/3 card gets the 1/2 point's simpler, then that point word for word.
- **Second clarifies: 2.**
  - Stuck 38: "0 se chalo: har mark se pehle ek gap aata hai…" helps.
  - Stuck 60: "ek 1 kilometre lambi rassi par 3 gaanthein" only re-dresses the problem.
- No third clarify came up.
- **Wrong-kind reads: 8.** Return or AI-line answers read as "repeat" (steady 44; stuck 42; offtopic 14, 20). A give-up after a key read as a misconception (steady 54; stuck 28, 52; steering 58).

**Re-asks: working.**
- 0 of 14 re-asks needed givens that were not in front of the child.
- A binary re-ask after "Nahi" leaves only one option (steady 26, 58, 76, 92; stuck 48; steering 54).
- The whole card is said again within two turns 7 times (steady 28, 130; stuck 18, 32; offtopic 28, 38; steering 22).

**Hindi requests: working (4).** All four change the words (steady 36, stuck 10, offtopic 32, steering 8). Offtopic 32 says row 22's Hinglish remediation again. Steering 8 moves the lesson on. No "Hindi mein bolti hoon" followed by the same words.

**Stitched or natural: not working (12 turns).**
- A miss verdict straight into a remediation with no joint: steady 10, offtopic 8, steering 10.
- Six bare returns to the earlier card after a then-card.
- Stuck 42: "Oh, batting. Achha." then the point, then "Achha, ab phir se padhai ki baat karte hain", then the card. The joint lands after the teaching.
- Steady 144: a close straight into the teach-back.
- Stuck 18: "Phir se dekho: Ab…".
- The joints themselves sound like a person when they fire: "Ise ek alag tareeke se dekhte hain", "Lo, sawaal yeh hai".

**Joints and frames**
- Joints heard:
  - park "Cricket ki baat bhi hogi…" ×3; return ×3; reply ×3;
  - `afterAside` form 1 ×3; `afterAiLine` ×2; Hindi switch, always form 2, ×4; try-first, always form 2, ×4;
  - `beforeRemediation` 4/2/2 across its three forms, missing ×3;
  - `backTo` 4/2, missing ×6; ask-again 0.
- Repeated frames within 4 of her turns: **12.**
  - ". Dekho," steady 70→78→86→94 (3);
  - "Is sawaal ka jawab" and "Iska jawab": steady 52→54→60 (2); stuck 26→28→34→36 and 50→52 (4); offtopic 34→40 (1); steering 56→58 (1);
  - "Yeh kadam" stuck 58→60 (1).

**Board changes:** 78 turns changed the board, 77 in the right place (steady 146 was not). 91 turns held the board.

**Hints after wrong answers:** the order is remediation, then the simpler, then the key on the second miss. Every posed card ends with its key or a right answer. Things said again: offtopic 30 repeats row 26.

**Turns over 60 words: 11.**
- Steady 20, 70, 74, 104, 114, 132, 144 are close, point and card: dense tutoring.
- Steady 146, offtopic 32 and stuck 42 read as monologue.

**Pace**
- Steady runs to the end of the script. The third skill is at class level, with a real 7/4 worked example and its final answer.
- Stuck and offtopic got as far as in D21.
- Steering reached the s2 bridge (D21: s1 worked step 2).

**Script sentences**
- Untrue: 0.
- Giveaways: 2. Stuck 16 "Neeche ke 7 marks par bhi yahi chalega" before the card asks about them; steering 6 "1/3 unme se ek gap hai" before its card.
- Question frames repeated within a skill: 4 ("{friend} ka kehna hai"; "0 aur 1 ke beech N marks hain"; "Neeche wali line" in 68 and 72; "neeche har gap 1/N" in 102 and 106).
- Unnatural: 4 (an unexplained "lap" at steady 110; the 1 km rope at stuck 60; "Do tarah ke gap" at steady 90; the bridge and the next point both saying "1 par nahi rukti" at steady 96→98).
- **Two words for one thing:**
  - "hisse" and "gap" in the ribbon remediation (steady 46; stuck 20–28; offtopic 22–34);
  - "lap" and "poora" (steady 110, 112);
  - "Yeh hissa saaf hua?" used for a part of what she just said.

**Carried over:** no regressions in grading, re-posing a card already answered right, or the held board.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| No second view drawn; a picture request moves on | steady 18; stuck 18; offtopic 28; steering 14 | b | new |
| Teach-back key on the posing board; answer board under the wrap | steady 146 | b | new |
| `backTo` missing or misfired; `beforeRemediation` missing; `afterAiLine` misplaced | listed above | b | partly new |
| Key on the first miss | stuck 26 | b | new |
| Clarify or Hindi at a check-in gets card material | steering 6, 8 | b | carried |
| Reader D broken | 8 rows | b | carried |
| Remediations have no second wording | offtopic 62 | a | — |
| The e2 point's simpler gives the card away; lap, rope; hisse/gap | above | a | — |
| Flat AI-line replies; "Is sawaal ka jawab: sahi nahi"; "Accha, batane ke liye thanks!" (steady 120); a spoken menu with "rukhein" | above | c | carried |
| Child says "sixer maara", then "bowling karna" | offtopic | d | carried |

## D. Scores (D21 → D22)

| Axis | Score | Reason |
|---|---|---|
| Listening | 3.5 → **3** | Pictures refused 4 of 4; O4 breaks; 8 misreads |
| Worked example | 4 → **4** | Three examples, each with its final answer |
| Class level | 4 → **4** | Fractions past 1 taught well |
| Screen and speech | 4.5 → **3.5** | 5 contradictions |
| Register | 3.5 → **3** | Seams missing or misfiring |
| Promises | 4 → **4** | Every park returned to |

## E. Verdict

**c5-t01 fails the scale gate.**

- **What blocks it:**
  - In the walk: the lost second view, the teach-back key paging, and `backTo` and joint placement.
  - In rendering and the reader: the reader D misreads.
- **The changes that would move it most:**
  1. Restore the split view, keep picture requests on their part, and put the answer board up at the key.
  2. Fire `backTo` after a then-card's close and never on the same question; place the joints where they belong; fix reader D.
  3. Learning writes remediation second wordings, fixes the e2 simpler giveaway, the lap and the rope, and adds a teach-back lead-in.
- **The 30-topic batch: no.** The picture regression and the seam bugs are in the runtime and would reach every topic.
- **Listening, register and promises:** listening 3 and register 3 do not reach 3.5. Promises at 4 does.

**Reversal clauses**

| Clause | Count | Triggered? |
|---|---|---|
| (1) Displaced parts said late | 0 per lesson, not rigid | No |
| (2) Wrap reads as a form letter | Yes | My vote |
| (3) Second clarifies unhelpful | 1 of 2 | No |
| (4) Register | 3 | Counts toward the two topics |
| (5) Replies that misstate the child | 0 of 6 | No |
| (6) Re-asks not answerable | 0 of 14 | No |
| (7) Axes below 3.5 | Listening, register | See below |
| (8) Untrue + giveaway sentences | 2 | No |
| (9) Misgrades, unsaid boards, contradictions | 5 contradictions | See A |

- **Clause (4):** the cause is seams that do not fire or fire in the wrong place (the walk), not the wording of the joints. A model writing the joins would not fix it.
- **Clause (7), by row:**
  - Picture requests (steady 18, stuck 18, offtopic 28, steering 14): the rule was not followed, and the second view is gone.
  - Steering 6 and 8: not followed.
  - Stuck 8 and 12, a give-up on a card: the rule is missing.
  - The 8 reader-D rows: not followed.
  - AI-line replies (stuck 42, offtopic 20): the R3 rule is missing.
  - The `backTo` and joint rows: not followed.