# c4 (fractions as equal shares): director23 hand judgement

**c4 does not pass the scale gate.** It fails on one contradiction (steady row 98, held cost) and on register, which scores 3. Listening and promises reach 3.5. Register does not.

## A. Hand counts

| Lesson | Beats | Verdicts / keyed | Contradictions | Unsaid boards | Right called wrong / wrong called right | False keys |
|---|---|---|---|---|---|---|
| steady | 39/39 | 34/34 | 1: row 98, held cost | 0 | 0/0 | 0 |
| stuck | 11/11 | 8/8 | 0 | 0 | 0/0 | 0 |
| offtopic | 16/16 | 14/14 | 0 | 0 | 0/0 | 0 |
| steering | 17/17 | 14/14 | 0 | 0 | 0/0 | 0 |
| **d23** | **83/83** | **70/70** | **1** | **0** | 0/0 | 0 |
| d22 | 79/80 | 56/58 | 5 | 0 | 0/0 | 0 |

**Steady row 98.** She says "Socho, board par do ek jaisi roti hain: ek 3 barabar tukdon mein kati, ek 12 mein" while the then-card's cakes (9 and 7 parts) are on screen. The script authors this remediation's own board (Roti 3, Roti 12), but the walk never drew it. Layer b.

The code flags `contradictionsV6` on steady 32, 68, 74, 102 and 128. Each of these is a verdict over its own card's answer board, so none is a contradiction.

## B. Items

**The director22 mechanisms**

| # | Status |
|---|---|
| 1 Picture draws nothing | **Gone.** 4 of 4 views are drawn |
| 2 Ending | **Gone** (see The ending) |
| 3 Reader | **Reduced, 10 → 7 rows.** Ungraded right answers fell from 2 to 0 |
| 4 Joints | **Reduced.** Misplaced `backTo` fell from 6 to 0, but 5 real returns still have no `backTo` |
| 5 Hindi, same words | **Partly.** 1 clear case (stuck 10) and 2 partial |
| 6 Bridge board | **Gone.** Steady 54, offtopic 72 and steering 66 keep the board |
| 7 Displaced point | **Gone** |
| 8 Whole card re-said | **Reduced, 9 → 1** (stuck 10). Try-first: 3 of 3 short go-aheads |
| 9 Key twice running | **Gone.** But "Yeh jawab sahi nahi hai. Haan, kyunki…" breaks rule K (stuck 42 and 48, offtopic 60, steering 56) |
| 11 Harness | Fixed, but `readerAgrees`, `backToJoint` and `hindiNewWords` read 0 on rows the hand count fails |

**The reader: 7 lines read as the wrong kind.** In every case below, what she said was acceptable.
- The answer to her return or AI-line question is read as "repeat": steady 46, stuck 36, offtopic 8 and 20.
- "pata nahi, aap batao" after a key's check-in is read as a misconception: stuck 44, offtopic 62, steering 58.

Every right answer was graded.

**Joints, counted per lesson**

| Lesson | Misplaced | Stacked | Missing | Total |
|---|---|---|---|---|
| steady | 0 | 0 | 2 (16, 102) | 2 |
| stuck | 0 | 1 (36, "Achha… Achha") | 1 (22) | 2 |
| offtopic | 1 (44) | 1 (8) | 1 (28) | 3 |
| steering | 1 (38) | 0 | 1 (18) | 2 |
| **topic** | 2 | 2 | 5 | **9** |

The two misplaced joints (offtopic 44, steering 38) are the same fault: "Ab wapas apni padhai par aate hain" comes after the worked problem has already been posed, not at the seam after her aside reply.

**The ending (steady only; the other three children left before it)**
- Row 132: the c3 verdict, then the lead-in "Chalo, aaj ka ek aakhri sawaal, poore paath se.", then the 9-part circle question. The question board is up (circle, 4 shaded, answer hidden).
- Row 133: the child answers "4/9", which is right.
- Row 134: the answer board is up from the first character. The verdict leads the wrap. The wrap in full: "Haan, bilkul theek. Aaj ki baat yeh thi ki kisi cheez ke barabar tukdon ka hi fraction naam hota hai, aur neeche ka number saare barabar tukde ginta hai. Phir bahut saari cheezon ka fraction aaya: neeche ka number batata hai kitne barabar group banane hain, aur ek group ki ginti jawab hoti hai. Aakhir mein dekha ki ek jaisi cheez jitne zyada barabar tukdon mein kate, har tukda utna chhota hota hai. Bachche ne 1/3 wale tukde ke neeche 1/6 ke do tukde gin kar sahi jawab diya. Aaj ke liye itna hi, phir milte hain!"
- All 3 "covered" sentences are true of skills this lesson reached.
- The sentence about the child is true (rows 117 to 119) and specific, not empty praise. But it is in the **third person** ("Bachche ne"), which no teacher says to the child in front of her.
- The turn is 97 words. It reads as a close, but a stiff one.

**Pictures: 4 requests and 4 views drawn** (steady 18, stuck 20, offtopic 26, steering 14). All 4 use "Yeh lo, isi cheez ki ek aur tasveer, ise dhyan se dekho." and none of them says what to look at. Offtopic 26 is that line alone.
- Unexplained: 4 of 4.
- Picture turns that also say the whole card again: 3 (steady 18, stuck 20, steering 14).

**Asides**

| Aside | Park | Return | Child | Her reply | Rating |
|---|---|---|---|---|---|
| steady 33 | row 34, park form 2, goes on ✓ | row 44, attached to the key's turn | "bowling karna" | row 46: "Achha, toh tumhara favourite hai bowling karna." | natural, same as d22 |
| steering 29 | row 30 ✓ | row 36, attached to the verdict | "bowling karna" | row 38: same line, then the misplaced joint | natural |
| offtopic 27 | row 28 ✓, but no `backTo` | row 42, attached to the verdict | "batting karna" | row 44: "Achha, toh tumhara favourite hai batting karna." | natural |
| stuck 33 (AI line) | — | row 34: "Main AI teacher hoon…Tumhe Virat ke baare mein sabse achha kya lagta hai?" | "batting" | row 36: "Achha, toh tumhe batting sabse achha lagta hai." | natural, better than d22 |
| offtopic 5 (AI line) | — | row 6, same | "batting" | row 8: the same line | natural, better than d22 |
| offtopic 17 (AI line) | — | row 18: "Tumhara favourite kaun hai?" | "Dhoni" | row 20: "Hmm, achha, theek hai." | flat, and does not use the child's word (rule A) |

- No reply is said twice in a lesson, there are no taste claims, every park is returned to, and there is no return without a park.
- The return question is never one of the script's own `asideReturn` forms.

**Clarifies, give-ups and re-asks**
- **Second clarifies: 2.**
  - Stuck 28 is helpful: "Socho, tum aur ek dost ek roti baant rahe ho…"
  - Stuck 62 is not: "Shaam tak plate par sirf 2 tukde bache…" re-states the problem and shows no step.
- **Wrong help:**
  - Stuck 8 and 12 re-say the e1 point word for word, for the second and third time.
  - Steering 32 answers a give-up on the Raju card with the point's hint about the upper strip ("Upar wali patti…") instead of the card's own hint about the ribbon.
- **Hints: 16.** The escalation is right everywhere and every posed card ends with its key. Steady 62 re-says the whole point as its hint.
- **Re-asks:** 0 cases where the question alone was not enough.

**Hindi requests: 4.** Every one opens with the same line, "Haan, Hindi mein samjhaati hoon."
- Steady 36 uses new, simpler words ✓.
- Stuck 10 says the same card again.
- Offtopic 32 re-says the point instead of its unspent simpler.
- Steering 8 poses the card, with no explanation at all.

**Stitched turns: 16** (d22 counted 12):
- 5 returns to an earlier card with no `backTo`;
- 3 return questions glued onto a verdict;
- 2 misplaced after-aside joints;
- 4 rows of "Yeh jawab sahi nahi hai. Haan/Nahi, kyunki";
- 2 rows of "Achha… Achha".

**Frames and forms**
- Each joint uses one form only: park ×3, `backTo` ("Chalo, pehle wale sawaal…") ×4, Hindi switch ×4, after-aside ×3.
- "Bilkul sahi / Haan, sahi hai. Dekho," opens the verdict 11 times in steady, within 4 of her turns throughout.
- "sahi nahi hai." twice within 4 turns: steady 118/124, offtopic 54/60, steering 50/56.

**Other items**
- **Board changes:** 80 turns changed the board, 79 in the right place (the wrong one is steady 98). 84 turns kept it, and there were 3 split views.
- **Turns over 60 words: 13.** Steady 20, 22, 64, 94, 96, 104, 120, 134; stuck 32; offtopic 10, 36; steering 22, 24. Steady 120 (80 words), steady 134 (97) and offtopic 36 (68) read close to monologue; the rest are tutoring.
- **Third skill:** taught at class level, with a real worked example (two 1/6 pieces cover one 1/3). The lesson ends properly.
- **Pace:** steady 135 rows, stuck 67, offtopic 75 and steering 69. Each reached the same point as in d22.
- **Two words for one thing:** "hissa" (in the check-ins) beside "bhaag" and "tukda"; "bhaag" used both for a fraction and for a split of groups (steady 68); "equal shares" and "barabar shares" in the greetings.

**Script sentences**
- Untrue: 0.
- Giveaways: 1, borderline. The e1 point says "aadha" before the card asks "1/2 hai ya 1/1?".
- Repeated question frames: 1 set, "kitna bhaag…?" ×4 in s1.
- Unnatural: 3.
  - "Ek hi chocolate ke teen tukde: 1/4, 1/10 aur 1/7", while the board shows three separate bars.
  - The e4 why opens with "kyunki upar ka rangin tukda 1/8", which has nothing to do with Raju's ribbon.
  - "theek nahi baitha".

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| A remediation's authored board is not drawn | steady 98 | b | new |
| `backTo` is missing after a then-card verdict | 5 | b | carried |
| Joints stacked or placed after the problem | 4 | b | 2 new |
| A yes-or-no key said as a bare "Haan"/"Nahi" | 4 | b/c | new |
| Picture line names nothing, and the whole card is said again on the picture turn | 4 / 3 | a/b | new |
| A Hindi request is not met | 3 | b | carried |
| A give-up gets the point verbatim, or the wrong part's hint | stuck 8, 12; steering 32 | b | carried / new |
| Reader column wrong | 7 | b | carried |
| Sentence about the child in the third person | steady 134 | c | new |
| Predicates blind to these faults | — | d | carried |

## D. Scores (d22 → d23)

| Axis | d22 | d23 | Why |
|---|---|---|---|
| Listening | 3 | **3.5** | Every answer graded, every view drawn; stuck child and Hindi still mishandled |
| Worked example | 4 | 4 | |
| Class level | 4 | 4 | |
| Screen and speech | 3 | **3.5** | 1 contradiction, down from 5 |
| Register | 3 | **3** | Single-form joints, the "Dekho," formula, "Haan, kyunki", "Bachche ne" |
| Promises | 3.5 | 3.5 | Parks and try-firsts kept; Hindi promise broken 3 times |

## Reversal clauses

| Clause | Count | Fires? |
|---|---|---|
| (1) Joints | 9 (2 / 2 / 3 / 2); register 3 | **Yes: rebuild as one pass** |
| (2) Sentence about the child | 1 of 1 present, true and specific; 0 wrong or empty in content, but third person | No |
| (3) Reader | 7 | **Yes.** The intent tags are right; the reader's columns after a reply and after a key's check-in are wrong |
| (4) Pictures | 4 of 4 quiet line, 4 unexplained | **Yes** |
| (5) Displaced parts | 0 / 0 / 0 / 0 | No |
| (6) Unhelpful second clarifies | 1 of 2 | No |
| (7) Whole cards re-said | 1, plus 3 on picture turns | **Picture part: yes** |
| (8) Register rows | Below | |
| (9) Untrue or giveaway sentences | 0 untrue, 1 borderline giveaway | No |
| (10) Gate failures | Steady 98, held cost | |

Clause 8, for register:

| Rows | The rule is… |
|---|---|
| The 9 joint rows above | not followed (J2) |
| One form per joint in every lesson | not followed (rotation) |
| 4 bare yes-or-no keys | not followed (K) |
| Offtopic 20 | not followed (A) |
| The return question | missing: the `asideReturn` forms are not used |
| Steady 134, "Bachche ne" | missing: the rule does not require the second person |

Promises sits at 3.5, the threshold, so clause 8 does not apply to it. The rows holding it there are stuck 10 and steering 8 (Hindi not followed).

## E. Verdict

**c4 fails the gate** on 1 contradiction (layer b) and on register at 3.

The three changes that would most move it:
1. The single seam pass from J2: `backTo` on every return, one joint per seam, the after-aside joint straight after the reply, forms rotated.
2. Draw a remediation's own authored board, and say a yes-or-no key as a sentence.
3. Give each picture view a caption and ask by the question alone; meet a Hindi request with the second wording; answer a give-up with the card's own hint, never the point verbatim.

**Batch: no.** The faults are in the shared walk, and the gated predicates read 0 on rows the hand count fails.

Listening reaches 3.5 and promises reaches 3.5; **register does not.**