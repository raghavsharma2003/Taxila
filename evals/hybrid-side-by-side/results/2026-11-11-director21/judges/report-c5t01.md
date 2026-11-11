# c5-t01 judge report: director21

**c5-t01 passes every counted line of the gate. All six axes reach 3.5, but listening and register only just reach it.** Second clarifies repeat themselves without helping (clause 4 is triggered). Two script faults matter most: "Zoya **kehta**" is said in 6 rows, and the scripts use two words for one thing in 14 rows that are not on the known list.

## A. Hand counts

| Lesson | Beat turns taught (distinct beats) | Verdicts | Contradictions | Unsaid boards | Right→wrong / wrong→right | False keys |
|---|---|---|---|---|---|---|
| steady | 67/69 (41) | 38/38 | 0 | 0 | 0/0 | 0 |
| stuck | 31/32 (11) | 7/7 | 0 | 0 | 0/0 | 0 |
| offtopic | 32/33 (18) | 14/14 | 0 | 0 | 0/0 | 0 |
| steering | 22/24 (11) | 8/8 | 0 | 0 | 0/0 | 0 |
| **D21** | **152/158 (96%), 81 beats** | **67/67** | **0** (every mechanism) | **0** | **0/0** | **0** |
| D20 | 141/146, 83 beats | 70/70 | 0 | 0 | 0/0 | 0 |

- **Turns that taught nothing (6):**
  - steady 20: the e3 point was dropped (`delivered:false`). The card is posed over an eighths line she never explained.
  - steady 100 and steering 6: a clarify got text about a card not yet said.
  - stuck 52 and steering 34: return-only turns.
  - offtopic 18: the AI line.
- **Automated flag at steady 78:** her line is true, so I do not count it.
- **The return answers "bowling" and "chauka"** were read as `incorrect` but never graded.

## B. Items

| Item | Rating | Evidence |
|---|---|---|
| D20 mechanisms 1, 2, 5, 6, 8, 12 | Gone | Give-up with help spent gets the key (stuck 12). All 4 parks returned, including offtopic 6→12 and steering 28→34. The greeting clarify gets `greetSimpler` (stuck 2, steering 2). All 4 Hindi requests change the words. The Virat question is answered (18→20). The steady lesson reaches its end. |
| Mechanism 3 (replies) | Partly | 0 odd, 6 flat, 0 natural (table below). |
| Mechanism 4 (give-up) | Reduced | Offtopic 60 repeats row 58's simpler word for word. At stuck 8, "aap batao" on the 1/3 card gets the 1/2 point's simpler. |
| Mechanism 7 (card again) | Reduced, 23→6 | Whole card again within two turns, after try-first or a picture: steady 28; stuck 18, 28; offtopic 28, 38; steering 24. 0 after a hint. |
| Mechanism 9 (empty announcements) | Gone | No "Ab isi par ek sawaal". "Ab agla kadam dekhte hain." (steady 122) is kept in the next turn. |
| Mechanism 10 (pictures) | Reduced | No holes ("doosri patti bhi barabar hisson mein bati hai"). Offtopic 28's "aur ek 12 barabar hisson mein" gives away the 11-marks→1/12 card. |
| Mechanism 11 (script data) | Still there, new faults | See C. |
| Mechanism 13 (harness) | Reduced | The child says "sixer maara" and then "bowling karna". Teachback answers are non-answers (steady 141, 143). |
| Clarify after a point | Still there | Steering 6 (carried from D20) and steady 100 (new, data): "Ab socho 1/5 wale kitne hop…" is said before the 1/5 card. |
| Second clarifies | Not working | 2 of 2 merely repeat. Stuck 38 says the same why for the third time running (34, 36, 38). Stuck 60 says the problem's simpler again. |
| Wrong-kind reads (cell) | 6, all harmless | After a key, a give-up or clarify was read as `misconception` (steady 54, stuck 50, steering 20). The return answer was read as `repeat` (steady 44, offtopic 14, 20). |
| Re-asks | Working | 19 question-only re-asks. The question alone was not enough in 2 (stuck 26, offtopic 26): "Pehla nishaan kitne metre par hai?" drops "neeche…11 nishaan", and the top line's first mark was just called 1/7. |
| Back to an earlier card (S1) | Not working | `backTo` was used 0 times. Instead: "Phir se dekho:" ×4 (stuck 32, 54; offtopic 32; steering 22) and no lead-in ×7 (steady 14, 30, 50, 112; offtopic 14, 62; steering 38). |
| Hindi requests | Partly | 4 of 4 change the words (steady 36, stuck 10, offtopic 34, steering 8), but they stay Hinglish ("Upar 6 marks the aur gaps 7"). |
| Stitched turns | 12 | Close then return with no join (steady 42, offtopic 12). The 7 bare jumps back. "Achha. Phir se dekho: Ab line ke neeche dekho" (offtopic 32, stuck 54). Steady 116: "teen-teen karke gino. Teen-teen ke group banao". |
| Why after a right answer | Missed | Steady 90 accepts "2/3" with "yaani 4/6" and never links them. Steady 104 accepts "6/5" for a before-or-after question. Every binary re-ask after "Nahi" leaves only one option (26, 58, 76, 92, 134). |
| Third skill (steady) | Partly | Class-level work: fractions past 1, grouping in threes, a real 7/4 worked example. But it ends weakly: the model's teachback ignores two non-answers, and the wrap says "tumne 1 ke baad 4 gaps ginne ka tareeka lagaya", which the child never did. Steady 120 opens "Accha, batane ke liye thanks!" to "achha". |
| Carried over | No regression | Grading clean; no card re-posed after a right answer; held board kept. |
| Known pairs | Seen | "marks"/"nishaan" at steady 50 and steering 38. |

**Asides**

| Lesson | Park (form 2, one sentence, goes on) | Return | Child | Her reply | Rating |
|---|---|---|---|---|---|
| steady | 34 | 42, led by a close | bowling karna | "Hmm, bowling. Samajh gayi." | flat |
| stuck | 40 | 52, own turn | bowling karna | "Oh, bowling. Achha." | flat; ignores the sixer |
| offtopic | 6, with the card | 12, led by a close | bowling karna | "Hmm, bowling. Samajh gayi." | flat |
| offtopic (Virat) | AI line at 18 | — | chauka | "Hmm, chauka. Samajh gayi." | flat; same frame as 14 |
| offtopic (2nd cricket) | none | — | — | "Achha." (32) | flat |
| steering | 28 | 34, own turn (cuts in between remediation and its card) | bowling karna | "Oh, bowling. Achha." | flat |

- Every return was on time, with the child's word in the slot.
- No taste claims.
- Against D20's two natural sentences ("Batting mein timing ka maza…"), these are safer and flatter.

**Joints heard**
- Park form 2 ×4. Return "Cricket mein tumhe kya karna sabse achha lagta hai?" ×4.
- Hindi switch form 2 ×4.
- "Haan, pehle tum try karo —" ×4.
- `greetSimpler` ×2 (it uses "bhinn").
- Ask-again 0. `backTo` 0.
- Rotation is untested: every lesson uses the same form.

**Frames repeated within 4 of her turns**
- ". Dekho," in steady 70→78→86→94.
- "Is sawaal ka jawab" / "Iska jawab": steady 52→60; stuck 30→34→36→38; steering 18→26.
- "Samajh gayi" in offtopic 14→20.
- "Zoya kehta" in steady 56→62 and offtopic 54→62→64.
- "Yeh kadam saaf/samajh" in stuck 58→60.

**Board changes:** 71 turns had a change, all 71 in the right place, every switch after the joint. 85 turns held the board. All 4 picture requests drew a split view.

**Hints after wrong answers:** the order was remediation first, then the simpler, then the key. Every posed card ends with its key said or a right answer. S2 and s3 remediations are never used once a misconception has been remedied before (steady 88, 92, 134).

**Turns over 60 words: 9** (steady 70, 74, 104, 114, 130; stuck 40; offtopic 36; steering 28, 40). Each is a close, a point and a card: dense tutoring, not monologue.

**Pace**
- steady: the end of s3 (D20 stopped at the s3 bridge).
- offtopic: the s2 bridge, the same as D20.
- stuck: s1 worked step 2 (D20 reached the s2 bridge). The cause is clarify turns.
- steering: s1 worked step 2 (D20 reached the s2 bridge). The harness ended the lesson at row 49.

## C. Defects

| Defect | Rows | Layer | Status |
|---|---|---|---|
| Second clarify repeats word for word | stuck 38, 60 | a: no second wordings | new |
| Clarify after a point gets card text | steering 6 (cell); steady 100 (s3 e1 simpler) | b; a | carried; new |
| `backTo` never chosen; bare jumps back | 11 rows | b | new |
| "{friend} kehta" said with Zoya | steady 56, 62, 94; offtopic 54, 62, 64 | a | new |
| Two words for one thing, not on the known list: "gaps"/"hisse", "gap"/"quarter", "hisse"/"kadam" | steady 14, 38, 80, 82, 120, 122, 124, 130; stuck 64; offtopic 12, 46; steering 18, 20, 48 | a, and the predicate misses them | new |
| Untrue: "Abhi tak hum 0 se sirf ek hop chale" after the 5/6 card | steady 66, offtopic 66 | a | new |
| e3 point dropped | steady 20 | b/c | new |
| Model words wrong about the child | steady 120, 142, 144 | c | new |
| "Is sawaal ka sahi jawab: sahi nahi" | steady 60 | c | new |
| Picture line gives the card away | offtopic 28 | Studio | new |
| Cell misreads | 6 rows | b | new |
| Child inconsistency; early end | stuck 39/53, steering | d | new |

## D. Scores (D20 → D21)

| Axis | Score | Reason |
|---|---|---|
| Listening | 3 → **3.5** | Cells are right in kind; repeats remain at second clarifies; steering 6 is carried |
| Worked example | 4 → **4** | Three examples, each final answer said |
| Class level | 3.5 → **4** | s3 is taught |
| Screen and speech | 4 → **4.5** | No holes, 0 contradictions |
| Register | 3 → **3.5** | Card re-poses down 23→6, but "Zoya kehta", the new pairs and 12 stitches |
| Promises | 2.5 → **4** | Every park returned; Hindi requests stay Hinglish |

## E. Verdict

**c5-t01 passes the scale gate on every line.** It has 96% of beats, 67/67 verdicts, 0 contradictions, 0 unsaid boards, 0 misgrades, 0 false keys, and every axis at 3.5 or above.

- **Listening:** 3.5, reached.
- **Register:** 3.5, reached only just.
- **Promises:** 4, reached.

**The three changes that would move it most:**
1. Learning authors second wordings and fixes the data faults: "kehta" with a female friend, the "gaps"/"hisse" pairs, the s1 bridge, and the s3 e1 simpler. Widen the twins predicate so it catches these pairs.
2. The walk uses `backTo` when it returns to an earlier card and puts a joint before a return. Fix the steering 6 cell.
3. Keep the model off the wrap and teachback, or ground them in what the child actually said.

**The 30-topic batch: no.** The repeating second clarifies, the unused `backTo` and the twins predicate's blind spot are in the runtime and the data checker, so they would reach every topic.

**Reversal clauses:**

| Clause | Count | Triggered? |
|---|---|---|
| (1) Aside replies | 0 odd, 6 flat, 0 natural. Flatter than D20's two but not worse overall. | No |
| (2) Register | Not below D20 | No |
| (3) Question alone not enough | 2 of 19 | No |
| (4) Second clarifies | 2, both merely repeated | **Yes**: Learning authors second wordings |
| (5) Axes below 3.5 | None. Rows at the margin: second clarify after a key (stuck 38) and after the problem statement (stuck 60) have no second wording, so the rule is missing; clarify at a point check-in (steering 6) was not followed. | No |
| (6) Script sentences | 1 untrue, 0 script giveaways (+1 picture giveaway, offtopic 28, Studio), 3 repeated frames (s1 c1 vs rem0.then; c3 vs rem2's toy; s3 "har hop…0 se N hop lo" ×2), 6 unnatural kinds | No (untrue + giveaway = 2) |
| (7) Misgrades, unsaid boards, contradictions | None | No |

**What the gate does not measure:** a parent would hear:
- grammar errors in authored text ("Zoya kehta");
- "Samajh gayi" said to a child's cricket story;
- the same why said three times to a confused child;
- a goodbye that praises work the child never did.