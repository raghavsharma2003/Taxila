# c6 (c6-maths-ch06-t01), director28: hand report

c6 passes every line of the gate except one: the strict count of unsaid boards. In five turns a board is drawn under the joint that leads into its part, 8 to 10 words before that part's first word. If the main loop accepts a board drawn at the lead-in to its own part, c6 passes every line. Two more things fire: two requests were answered with the next step, and asides now end on check-ins with nothing to check.

## A. Hand counts

| Lesson (rows) | Beats taught | Verdicts / keyed answers | Contradictions | Unsaid boards (strict) | Right→wrong / wrong→right | False keys |
|---|---|---|---|---|---|---|
| steady (121) | 58/58 | 41/41 | 0 | 2 (rows 4, 112) | 0/0 | 0 |
| stuck (77) | 37/37 | 15/15 | 0 | 1 (row 4) | 0/0 | 0 |
| offtopic (67) | 32/32 | 14/14 | 0 | 1 (row 4) | 0/0 | 0 |
| steering (53) | 25/25 | 12/12 | 0 | 1 (row 4) | 0/0 | 0 |
| **D28** | **152/152** | **82/82** | **0** | **5** | **0** | **0** |
| D27 hand count | 154/154 | 77/77 | 2 | 0 (4 on a literal reading) | 0 | 0 |

How I counted verdicts: on quick questions and asked steps, the short yes, the `say` line or the step told counts as the verdict, as the rule intends. Stuck 48 tells the step with no "nahi".

**The unsaid boards, all paging:**
- **Row 4 in all four lessons** (the help path at the hook). The e1 triangle page starts at character 0, under the opener ("Koi baat nahi, ise doosre, aasaan shabdon mein bolti hoon."). The point starts at 51–59. Before this turn nothing was on screen, so the joint should have kept a blank board.
- **Steady 112.** The closing question's board (27×9) is drawn at 82, under the lead-in "Chalo, ab poore paath se ek aakhri sawaal." The question starts at 125. The lead-in is recorded as `body` with the teachback board.
- Other joints keep the board correctly: afterAiLine (offtopic 10), afterAside (offtopic 48), and backTo, which only ever brings back a card already said.
- Nothing is given away: the boards show only givens.

Contradictions: 0. Every miss verdict is said over the answered card's own board, and every close is over its answer board. Remediations with no board keep the board of the card that was just answered.

## B. Items

**D27 mechanisms for c6**

| Mechanism | Status |
|---|---|
| 1. Board chosen part by part | **Reduced**: "remediation borrows the follow-up card's board" is gone (steady 50, 72, 82; stuck 20, 64; offtopic 52 keep the answered card's board). The card after the AI line now has its own page (offtopic 10, at character 71). New: the early draw at a joint (5 rows above) |
| 2. Request without help | Bridge give-up: **gone** (stuck 58 uses the bridge's own simpler). **New**: stuck 46 (give-up → worked problem) and offtopic 36 (Hindi → worked problem), both at a check-in after an aside reply |
| 3. Closing question keyed at the first miss | **Gone**: steady 114 gives the hint and asks again; the key comes at 116 |
| 4. Check-ins where the child could act | **Reduced**: steady 20 → 10 |
| 5. Remediation and its card in one breath | Normal path **gone** (P2). **Still there** on the help path: steady 52 (62 words), stuck 22 (55), stuck 66 (62), steering 8 (75) |
| 6. Abrupt seams | Returns without a back-to line: **gone**. Hook: **still there** in a new shape ("Yahi chakkar ab ek triangle par. Ab tak samajh aaya?", row 2 ×4) |
| 7. Small paths | Hook alone after a request at the greeting: **still there** (stuck 2, steering 2; greetSimpler, hook and point exceed 75 words). Picture after a key: **gone** (steering 14, authored caption). Tired bye: **gone** (stuck 76, steering 52). Switch line before words that are not easier: **still there** (steering 4 says "yahi baat" and then gives a new point; steering 8) |
| 8. Script | c2 hint fixed. Points still name the operation (s3 e1, steady 80) |
| 9. Record | opener, leadIn and stop line are now recorded as their own kinds. New: the invitation is recorded as "aside" (6 rows); steady 8's cell is `e2:checkin` although a quick question was pending |

**Boards part by part.** 86 turns changed the board: 81 in the right place, the 5 above early. 65 turns kept the board.
- Help over another part's board: 0.
- A part that owns a board said without it: 0. `pageParts` lists the next card's board for remediations and bridges that own none in the script, and `held` correctly does not draw it.
- A card said without its board: 0.
- Remediation boards: only s1 rem0 has a board of its own (pentagon PQRST, names only; steady 26, offtopic 6, steering 6). It is true of what she says and shows no later answer.
- Keys over the answer board: 5 of 5 (stuck 26, 70; offtopic 58; steering 12; steady 116).

**Help against the whole lesson.** About 34 help turns.
- Nothing new: 1. Stuck 58, the bridge's simpler, nearly word for word what stuck 56 had just said ("Seedhi bhujaon wali … shape mein … jodna chalta hai").
- Same idea, same order: 2. Steady 86 repeats remediation 82 ("Poore chakkar mein do lambai aur do chaudai… aadha… lambai nikal"). Offtopic 44 repeats 38 and 42.
- Keys given with a wording unsaid: 0. Keys where a hint would have done: 0.
- Requests met with the next step: 2 (stuck 46, offtopic 36). Four more are on the designed hook path (row 4 ×4): the hook has no wording of its own, so the switch line is followed by the first point.
- The "nothing easier is left" line: 1 (stuck 60). It was true, because both of the bridge's wordings had been said.

**Quick questions (14 asked)**

| Rows | Question | Kind |
|---|---|---|
| steady 6, stuck 10, offtopic 14, steering 22 | "Hexagon ki kitni bhujaon par label likha hai?" (one sentence after "label sirf ek par hai") | quiz |
| steady 12, stuck 14, offtopic 22, steering 26 | "Dhaaga kahan chalta hai, kinaare par ya andar?" (the card then begins "Kinaare par…") | quiz |
| steady 42, stuck 60 | "Is rectangle mein 10 m ki kitni bhujayein hain?" | quiz |
| steady 46, stuck 74 | "Aadhe chakkar mein lambai kitni baar aati hai?" | real small step |
| steady 56 | "…6 cm ki bhuja kitni baar aati hai?" (the point said "chaar baar") | quiz |
| steady 92 | "Gate kitne metre ka hai?" | quiz |

- Real small steps 2, quizzes 12, cards asked twice 0.
- Answers misread: 0. Right answers: steady 14/44/48/58/94, offtopic 16, steering 24. Give-ups got `say` and the card: stuck 12/16/62, offtopic 24, steering 28.
- Giveaways: 0.
- Quick questions placed where the card fit in 75 words: **12 of 14** (63–72 words with the card; only s2 e2 needs 80). The code caps a point after a verdict at 60 words.
- Steady 8: a clarify at the quick got help and "Yeh hissa saaf hua?", then the bare card. The quick question was dropped.
- My verdict: **about the same as "samajh aaya?"**. The child says a word instead of "haan", but it is a word she heard two seconds earlier.

**Check-ins and worked examples**
- Check-in turns: 10, 11, 11, 8. Steady has 121 rows; its longest run is 1.
- Runs of three: offtopic 40–44 (42 and 44 answer the child's requests; 40 does not), steering 12–16 (all the child's requests).
- Before a waiting card: **2**. Offtopic 40 (the worked example's close; c1 waits because the park's return is due) and steady 8 (after help).
- Inside a worked example: 0.
- New path: a check-in after a park or an aside reply while the invited problem waits: stuck 44, offtopic 30, 34, steering 34, 38.
- Tedious: **after a remediation**. Steady 26/50/72/82: "Yahan tak saaf hai?", then "mujhe lagta hai haan", then the bare follow-up card in 17–29 words.

| Worked example | Turns | Asked step → child → her line | Own step |
|---|---|---|---|
| s1 (steady 20–24) | 3 | "Pehle 7 aur 9 jodo" → solah → "Haan, 7 + 9 = 16 m; do bhujayein jud gayi." | "16 mein 12 jodo": addition only |
| s2 (steady 62–66) | 3 | "Bracket pehle: 24 + 18 kitna hua?" → 42 → "Haan, 42 cm: ek lambai aur ek chaudai." | "2 × 42 kitna hoga?": arithmetic only |
| s3 (steady 100–106) | 4 | "50 + 30 kitna?" → eighty; "2 × 80 kitna?" → 160 | "teen chakkar… kul?": the one step that needs thought |

- The problem is never said alone.
- The examples read as an **arithmetic quiz**: the reasoning is told, the sums are asked.
- Offtopic 38 is worse: a try-first at "7 + 9" skipped the step, and "16 mein 12 jodo" followed with the 16 never said.

**Invitations (6): steady 16, 60, 98; stuck 36; offtopic 28; steering 32.** Steady 60 and 98 lead naturally into the problem. In the other four the child answered with a picture request, a clarify or an aside. As a pattern it is a check-in in disguise: a yes/no question whose only answer is "haan". Steady 16→20 also says "kadam-kadam… milkar" twice in three turns.

`whyShort` rows: 0.

**Turns over 60 words:** 12, 7, 3, 4; over 75: 0.
- Monologue: steering 8 (75 words, the chowkidaar story and a card after "aur aasaan").
- Dense: steady 46 and stuck 74 (74 words each: a verdict, a formula derivation and a quick question). Worked openers run 73–75 words.
- The rest read as tutoring. My answer to clause 4's question on 61–75-word turns being a monologue: **no**.

**Joints**

| | steady | stuck | offtopic | steering |
|---|---|---|---|---|
| Misplaced "meet again" | 0 | 0 | 0 | 0 |
| Two at one seam | 0 | 0 | 0 | 0 |
| Return without back-to | 0 | 0 | 0 | 0 |
| Worked problem without lead-in | 0 | 0 | 0 | 0 |
| Abrupt | 1 (2) | 2 (2, 44) | 4 (2, 30, 34, 38) | 3 (2, 34, 38) |

- After-key returns: "Aisa sawaal phir aayega; ab pichhle sawaal par wapas chalte hain." (offtopic 62) and "Is tarah ka hisaab dobara milega, abhi pehle wale sawaal par wapas chalo." (steering 18). Both sound like a person, but neither acknowledges the child's "nahi pata".
- `seams` against what was heard, 10 rows per lesson: accurate, except the invitation recorded as "aside" (6 rows), stuck 8's re-ask recorded as "returnCard", and steady 4 recording one line as both the switch and the opener.

**Stop path and model words.** Stuck 76: "Thakaan ho toh aaram karna bilkul theek hai. Aaj ke liye itna hi…" Steering 52: tiredBye[1] and the goodbye. Offtopic 66: the goodbye alone. All authored; model-written sentences: 0.

**Mix-up met again.** Steady 81 gets skill 3's own remediation. Repeats within one skill get hints: stuck 33 and 53, offtopic 17 and 19, steering 9 and 43. Correct throughout.

**Wrap.**
- Row 118 (74 words): "Kuch baatein aasaan thi, kuch mein mehnat lagi. Aaj dekha ki parimap… taar ka kharcha nikala. Aaj ki padhai mein kuch aisa tha jo achha laga?"
- Row 120: "Har paath mein kuch naya hota hai. Aaj tumne 70 cm ki dori se ulta chalkar rectangle ki chaudai nikali. Aaj ke liye itna hi, phir milte hain."
- The closing verdict gives its why (116). Row 118 ignores the child's line at 117, and row 120's first line does not answer "thoda mushkil tha".
- The sentence about the child comes from s3 c3, answered right at the first try (row 111). It is true and natural.

**Register: 3.5.**

| Cause | Rows | Count |
|---|---|---|
| (a) fixed forms | steady 68 (right-verdict openers 29×: "Bilkul sahi" 10, "Haan, bilkul theek" 9, "Sahi jawab" 7, "Haan, sahi hai" 3); steering 20 | 2 |
| (b) script sentence | offtopic 16–20 (no re-ask is authored for the e2 card, so it is said 3× verbatim) | 1 |
| (c) verdict as written | stuck 26 | 1 |
| (d) length or shape | steady 2, 46, 118; stuck 2, 46; steering 8 | 6 |
| (e) help | stuck 58; offtopic 62; steering 4 | 3 |
| (f) other: empty check-ins after asides, quiz questions, the skipped step | steady 12; stuck 44; offtopic 30, 34, 38; steering 34, 38 | 7 |

**Asides**

| Lesson | Park / AI line | Return | Child said | Her reply | Rating vs D27 |
|---|---|---|---|---|---|
| steady | AI line 40 | — | chauka | 42: "Achha, toh tumhe chauka sabse achha lagta hai. Ab wapas apne kaam par." + point | natural; same |
| stuck | AI line 42 | — | chauka | 44: the same reply + "Yahan tak theek hai?" | odd ending; worse |
| offtopic | AI line 8; park 30 ("Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye." + check-in); AI line 32 (a new question) | 46, alone, authored form [2] | chauka; Virat; batting | 10 natural; 34 "Achha, toh tumhara favourite hai Virat. Ab tak samajh aaya?"; 48 natural, but ignores "sixer maara" | mixed; worse |
| steering | park 34 + check-in | 36, the very next turn | chauka | 38 + "Yeh hissa saaf hua?" | the park was pointless; worse |

No taste claims, no reply said twice, every park returned to, no return without a park. The second AI line asked something new.

**Clarify, give-up and Hindi rows.**
- Second clarify on the same part: 2, both new and helpful (stuck 40, the photo frame; offtopic 44). No third clarify.
- Hindi requests: steady 36 and stuck 8 got new words. Steering 8 got another story, not easier. Offtopic 36 got nothing.

**Re-asks.**
- The question alone was not enough once: offtopic 38, where the 16 was never said.
- A card repeated word for word within two turns: stuck 6→8 (the child asked) and steering 18→20 (try-first). No picture turns among them.

**Script sentences**
- Untrue or misleading: 1. s2 rem1: "Parimap aur area ko jawab ki ikaai se pehchaano" (steady 72), said to a child whose wrong answer, 121 cm, was already in cm.
- Numeric giveaways: 0.
- Method given before the card: 4.
  - s3 e1: "60 m chaaron mein barabar bat-ta hai" (80).
  - s3 rem0: "…aadha karo aur lambai ghatao; square ka parimap 4 se baanto" (82), which covers both waiting cards.
  - "16 mein 12 jodo" (22).
  - "2 × 42 kitna hoga?" (64).
- Repeated frames: 2. "kitni baar aati hai" in consecutive s2 quick questions (46, 56); the e2 card repeated with no re-ask.
- Unnatural: 2. The hook's "Yahi chakkar ab ek triangle par." placed before a check-in. The e1 hint "Board ki line dekho" (stuck 6), the caption's wording used on the triangle board; I count it borderline, not a contradiction.
- Keys: all correct.
- Two words for one thing: "lambai" as the long side and as "a length" (steady 48/56); "line" for both the outline and the unrolled view (stuck 6).

**Pictures.** Steady 18, stuck 18, offtopic 26 and steering 14 all use authored captions. All are true of the unrolled view and none gives an answer away.

**Pace.**
- Steady reaches the end (121 rows; D27 113). The third skill is at class level.
- Stuck reaches s2 e2 (D27: e1).
- Offtopic reaches the s2 bridge (D27: s2's third point).
- Steering reaches the s2 bridge (same as D27).

## C. Defects

| Defect | Rows | Layer | Since D27 |
|---|---|---|---|
| Board drawn at the joint before its part | steady 4, 112; stuck 4; offtopic 4; steering 4 | b | new under the strict reading |
| Request after an aside reply's check-in answered with the next step | stuck 46, offtopic 36 | b | new |
| Aside reply or park ends on an empty check-in | stuck 44; offtopic 30, 34; steering 34, 38 | b/c | new |
| Try-first skips the asked step | offtopic 38 | b | new |
| Check-in before a waiting card | offtopic 40; steady 8 | b | new |
| Quick questions ask back the sentence just said; placed where the card fit in 75 | 12 of 14 | a + b | new |
| Asked steps are arithmetic; own step reduced to arithmetic | all six worked examples | a | new |
| Hook alone on a check-in; greeting request without the first point | row 2 ×4; stuck 2, steering 2 | a/b | carried |
| Remediation help and its card in one turn | steady 52; stuck 22, 66; steering 8 | b | carried |
| Wrap ignores the child | steady 118, 120 | a/b | carried |
| Points or remediations name the operation; unit premise | steady 72, 80, 82 | a | carried |
| Record: invitation as "aside"; quick recorded as checkin | 7 rows | b | new |

**Gone since D27:** the dropped card page, the c2 hint untrue of its board, the closing key at the first miss, the wrong help after a bridge give-up, the code caption, the problem said alone, the bare goodbye for a tired child, and remediations borrowing their card's board.

## D. Scores, D27 → D28

| Axis | Score | Why |
|---|---|---|
| Listening | 4 → **3.5** | stuck 46, offtopic 36, offtopic 38, empty check-ins after asides, the wrap |
| Worked example | 4 → **3.5** | the child works, but the asked step is the wrong step (arithmetic) |
| Class level | 4 → **4** | NCERT class 6 depth; points still hand over the operation |
| Screen and speech | 3.5 → **4** | 0 contradictions; 5 short early draws |
| Register | 3.5 → **3.5** | rotating verdict forms, quiz questions, check-ins about nothing |
| Promises | 3.5 → **3.5** | switch lines followed by the next point (row 4 ×4); "Yahi chakkar ab ek triangle par" followed by a check-in; steering 34; offtopic 38 |

## E. Verdict

**Gate.** c6 fails only on the strict count of unsaid boards: 5 rows, paging, the board drawn at the joint before its part instead of at the part's first word. If the main loop allows a board drawn at the lead-in to its own part, c6 passes every line. Listening, register and promises each reach 3.5.

**Changes that would move it most:**
1. Make every joint and opener keep what is up, on every path: the hook-help path and the closing lead-in.
2. After an aside reply or a park, go on into the live part with the authored joint, never a check-in. Requests at that point get help for the last part.
3. Ask the reasoning step, not the sum ("aadhe chakkar mein kaun si bhujayein?"), and let the card follow the point within 75 words instead of a quiz question.

**Batch: no.** Clause 3 fires (stuck 46, offtopic 36). The aside path is new in the runtime and every topic would inherit it.

**Clauses**
- (1) Strict unsaid boards 5; parts said without their board 0; cards without their board 0; help over another part's board 0; remediation boards untrue or showing a later answer 0.
- (2) Nothing new 1; keys with a wording unsaid 0; keys where a hint would do 0.
- (3) Requests answered without help 2 (+4 on the designed hook path); helpSpent 1, true.
- (4) Steady 121 rows, 10 check-ins, longest run 1. Before a waiting card: offtopic 40, steady 8. Quick questions: 2 real, 12 quizzes, 0 cards asked twice; verdict: the same as the check-in. Tedious: after a remediation (this counts as my naming of the remediation's check-in). Invitations: a check-in in disguise. Short reasons 0. Turns of 61–75 words: not a monologue.
- (5) Abrupt seams: 10.
- (6) 0.
- (7) 0.
- (8) 1, borderline.
- (9) Register 3.5; (a) 2, (b) 1, (c) 1, (d) 6, (e) 3, (f) 7.
- (10) Wrong kinds 0; captions 0 bad; the sentence about the child true.
- (11) Neither axis is below 3.5.
- (12) Untrue 1, giveaways 0, repeated frames 2, unnatural 2; wrong keys 0.
- (13) Above.
- (14) Worked example 3.5.

The safety turn did not fire in c6.

**What a child or parent would still find wrong:** "Bilkul sahi" and its three siblings 29 times in one lesson. Being asked back what she said two seconds ago. "Yahan tak theek hai?" right after naming a favourite shot. Worked examples that are sums. A child who leaves with "bye" gets a bare goodbye, with no acknowledgement or short wrap-up as the owner's standard (item 7) asks.