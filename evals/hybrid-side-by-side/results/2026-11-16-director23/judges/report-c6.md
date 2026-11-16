# c6 (c6-maths-ch06-t01): director23 hand report

**c6 fails the gate.** Two things block it: one contradiction (steady row 88, held cost) and register at 3. Every other gate line passes.

## A. Hand counts

| Lesson | Beats taught / beat turns | Verdicts / keyed answers | Contradictions | Unsaid boards | Right called wrong / wrong called right | False keys |
|---|---|---|---|---|---|---|
| steady | 57/57 (43 beats) | 29/29 (row 114 only implicit) | **1, held cost: row 88** | 0 | 0/0 | 0 |
| stuck | 32/32 (15 beats) | 12/12 | 0 | 0 | 0/0 | 0 |
| offtopic | 36/36 (19 beats) | 16/16 | 0 | 0 | 0/0 | 0 |
| steering | 32/32 (17 beats) | 16/16 | 0 | 0 | 0/0 | 0 |
| **D23 total** | **157/157** | **73/73** | **1** | **0** | 0 | 0 |
| D22 hand | 173/173 | 73/73 | 1 (paging) | 0 | 0 | 0 |

- **Row 88 (the contradiction).** She says "Par neeche wali 12 m ki bhuja mein 2 m ka gate hai" over the e3 board, which is a 12×8 rectangle with no gate drawn. Row 90's question ("gate chhod ke…") is asked over the same board. The script's board is missing the gate, so the layer is (a). The template's `mixup` marker could draw it.
- **Borderline, not counted: row 116.** The wrap's sentence about the child ("60 m parimap wale square…") is said over the 27×9 answer board. That is the `orderNoUnit` flag. It recalls a past card and does not describe the screen.

## B. Items

**director22 mechanisms**

| # | Status |
|---|---|
| 1 Pictures | Working. 4/4 views drawn |
| 2 Ending | Reduced. Detail under "Ending" |
| 3 Reader | Reduced: 7 → **5 rows read as the wrong kind**. In all 5 she still did the right thing |
| 4 Joints | No `backTo` fires falsely any more (D22 had 3). Everything else is still there |
| 5 Hindi gets the same words | **Gone.** 4 of 4 requests got new words |
| 6 Bridge puts up the next board | **Gone** (stuck 62, offtopic 58, steering 46) |
| 7 Displaced point said late | 0 in every lesson |
| 8 Whole card said again | 0 against the rule. Every repeat used the authored re-ask |
| 9 Key said twice running | **Gone** |
| 10 Script data | Half-perimeter now has one name ("aadha chakkar"). The gate cost is asked and its answer board reads ₹380. The gate itself is not drawn |

**The reader.** Five lines got the wrong column; in each, what she did was still right:
- `aside_reply` read as `repeat`: steady 43→44 and offtopic 15→16.
- A give-up after a key read as `misconception`: stuck 53, offtopic 49, steering 59. Rule R forbids exactly this.

`readerAgrees` reads 0 on all five, so its equivalence table hides them. No right answer went ungraded.

**Joints, by hand** (misplaced / stacked / missing):

| Lesson | Count | Rows |
|---|---|---|
| steady | 1/1/4 = **6** | 44 ("Achha, ab wapas apne kaam par" between the point and its own card; "Achha" said twice in the turn); bare returns at 12, 54, 76; aside reply into the lesson at 44 |
| stuck | 0/0/3 = **3** | bare returns at 16, 34; AI line straight into the problem at 38 |
| offtopic | 1/1/4 = **6** | 16 ("Ab wahin wapas aate hain jahan hum the" mid-point, the same fault D22 found); 24 ("Theek hai. Achha, ab pehle wale…"); bare returns at 12, 70; reply into the lesson at 16 and 32 |
| steering | 0/0/3 = **3** | bare returns at 12, 44; AI line straight into step 1 at 30 |
| **topic** | **2/2/14 = 18** | |

- `backTo` fired correctly twice (offtopic 24, steering 62). It fires only when the return opens a turn.
- After a then-card answered right it is never said: **9 of the 14 missing joints** are these returns.

**The ending (steady).**
- Row 112: the lead-in "Chalo, ab poore paath se ek aakhri sawaal." The board changes to the 27×9 rectangle at char 78.
- Row 113: the child says "73 cm".
- Row 114: "Iska jawab hai 72 cm, kyunki … 27 × 9 andar ki jagah hoti. Yahan tak theek hai?" The answer board is up from char 0. There is no verdict word and nothing like "bas 1 cm zyada". "hoti" is ungrammatical.
- Row 115: the child gives a reason ("maine pehle chhota wala socha…"). She ignores it.
- Row 116, the wrap in full (107 words, its own turn): "Aaj ki baat yeh thi ki parimap kisi band shape ke poore kinaare ki lambai hai, jismein har bhuja ek baar judti hai aur andar ki jagah nahi aati. Rectangle mein lambai aur chaudai do-do baar aati hain, isliye uska parimap 2 × (lambai + chaudai) hai, aur square ka 4 × bhuja. Parimap se ulta square ki bhuja nikalti hai, aur lambai bhi pata ho toh rectangle ki chaudai, aur parimap se hi chakkaron ki doori aur taar ka kharcha nikalta hai. Tumne 60 m parimap wale square ki ek bhuja 60 ÷ 4 = 15 m nikali. Aaj ke liye itna hi, phir milte hain."
- All three "covered" sentences are true and were reached. The sentence about the child is true (row 83) and specific, not praise. But it picks a trivial card, not the near-miss that just happened.
- **Partly working:** it is structurally right, but she does not close with *this* child.

**Pictures.** 4 requests (steady 18, stuck 18, offtopic 28, steering 14). All drew `unrolled`, and all have a real caption ("…bhujayein seedhi karke ek line/rekha par rakhi hain: …"). The quiet line was used 0 times. No key or hole in any caption. **Working.**

**Asides**

| Lesson | Park | Return | Child | Her reply | Rating |
|---|---|---|---|---|---|
| steady (AI line) | none needed | row 42, "Tumhe Virat ke baare mein sabse achha kya lagta hai?" | chauka | "Achha, toh tumhe chauka sabse achha lagta hai." (44) | natural |
| stuck (AI line) | — | **no question back** (38) | — | — | missing |
| steering (AI line) | — | **no question back** (30) | — | — | missing |
| offtopic | row 10, form 2, goes on into the live part | row 14, on the e2 close, not its own turn, not an authored form | catch pakadna | "Achha, toh tumhara favourite hai catch pakadna." (16) | natural, word for word as D22 |
| offtopic, 2nd/3rd asides | — | — | "sixer maara" / "cricket pasand hai" | "Theek hai." (24) / "Achha." (32) | flat |

- No reply was said twice. No park was left unreturned, and no return came without a park. No taste claims.
- Compared with D22: the same, apart from two AI lines with no reply.
- The park "bas yeh **chakkar** khatam ho jaaye" uses the lesson's own word for a lap to mean something else.

**Clarifies and give-ups: 27, all handled right.**
- Second clarifies: 2, both helpful. Stuck 28 used the honeycomb; stuck 42 walked the flower bed.
- Third clarify: stuck 44 went to step 1, which is right.

**Re-asks.**
- 0 hints fell short of what the child could see.
- "Toh ungli kul kitne cm chali?" is weak as a return line (steady 12, stuck 16, steering 12): the "Toh" refers back several turns. The board still answers it.

**Hindi requests.** 4 of 4 got new words. All four use the same opener: "Theek hai, main yeh Hindi mein bolti hoon".

**Stitched turns: about 17.**
- The 9 bare returns.
- The AI lines at stuck 38 and steering 30.
- "Iska jawab hai kyari ke liye 28 m baad lagegi" (stuck 52, offtopic 48).
- The key run straight into the bridge with no check-in (steering 46).
- The close run straight into the return question (offtopic 14).

**Frames repeated within 4 of her turns: 3** (D22: 12).
- "Dekho," at steady 14 and 22.
- "Ab … kadam" at steady 96–102.
- "Is sawaal ka jawab" then "Iska jawab" at offtopic 22 and 30.

**Board changes.** 78 changes, all in the right place. 75 turns held the board. 4 picture redraws.

**Turns over 60 words: 18** (D22: 12). Six read as monologue:
- steady 88 and 116;
- steady 44 and offtopic 16 (reply, point and joint in one turn);
- stuck 32, offtopic 18 and steering 42 (verdict, remediation and a new card with no check-in).

**Pace.** Steady ran to the end. Stuck reached the s2 e1 point (D22: the s2 bridge). Offtopic and steering reached the s2 e2 point, as in D22.
- **The third skill** is at class 6 level and its worked example (480 m) is real.
- The e1/e2 points still hand over the method ("60 ko 4 se baanto"; "Pehle aadha chakkar nikalo, phir…").

**Script sentences heard:** 0 untrue, 0 giveaways.
- **Repeated question frames: 3.** s3 "chaudai kitni" (84/110); s3 "taar ka kharcha kitna hoga" (90/108); s1 "kitne … chali/chaloge" (4/34).
- **Unnatural: 4.**
  - "Ab ek **naya** khet" with no earlier field;
  - "andar ki jagah hoti";
  - "Toh ungli…" as a return line;
  - "chakkar" in the park.

**Two words for one thing.**
- perimeter/parimap in all four greetings (model-written).
- line/rekha in the same lesson (stuck 8 and 18).
- aakaar/shape/hexagon (steady 18).
- chakkar used for both a lap and the lesson's round.

## C. Defects

| Defect | Rows | Layer | New? |
|---|---|---|---|
| Gate described but not drawn | steady 88 | a | new |
| Bare return after a then-card | 9 rows | b | carried (D22: 5) |
| Joint mid-point; filler stacked | steady 44, offtopic 16, 24 | b/c | carried |
| AI line with no question back and no joint | stuck 38, steering 30 | b | carried |
| Give-up / aside reply in the wrong column | 5 rows | b (reader table) | reduced |
| Near-miss closing answer gets no verdict; the child's reason is ignored | steady 114–115 | b | new path |
| Hindi-switch form never rotates | 4 lessons | c | carried |
| "Iska jawab hai" + a sentence | stuck 52, offtopic 48 | c | new |
| Greeting preference answered "haan, samajh aaya" | steady 1, offtopic 1 | d | carried |

**Gone since D22:** pictures that draw nothing, Hindi requests with the same words, bridge boards, false `backTo`, the key said twice, four names for half a perimeter, the unasked gate cost, and the wrap glued onto the key.

## D. Scores (director22 → director23)

| Axis | Score | Why |
|---|---|---|
| Listening | 3.5 → **3.5** | Give-ups and Hindi are right. Misses: the near-miss, the child's reason, two AI lines with no reply, flat answers to repeat asides |
| Worked example | 4 → **4** | Real, but four steps are told and the child does one |
| Class level | 4 → **4** | Gate cost now asked; the points still hand over the method |
| Screen and speech | 4 → **4** | 1 held-cost contradiction |
| Register | 3 → **3** | 18 joint faults, a fixed Hindi form, the same reply text as D22 |
| Promises | 3.5 → **3.5** | Parks returned, lead-in kept; "Hindi mein bolti hoon" still delivers Hinglish |

## E. Verdict

**c6 fails the gate.**
- **Blocking:**
  - one contradiction (steady 88, script data: the gate is not drawn);
  - register at 3, from the walk's joints (layer b).
- **Listening 3.5 (reaches), register 3 (does not), promises 3.5 (reaches).**
- **Changes that would move it most:**
  1. Place joints in one pass over the assembled turn, so `backTo` is said whenever a return follows a verdict.
  2. Learning draws the gate on s3 e3 (the `mixup` marker).
  3. A near-miss on the closing question gets a verdict that names how close it was, and a reason the child gives after the key is answered.
- **Batch: no.** The joint faults are in the runtime, so every topic would inherit them.

**Reversal clauses**

| # | Clause | Count | Result |
|---|---|---|---|
| 1 | Joints | 18 (6/3/6/3; misplaced 2, stacked 2, missing 14); register 3 | **Over 2 → rebuild the joints as one pass** |
| 2 | Sentence about the child | 1/1 lessons that reached the wrap: present, true, not praise | Does not fire for c6 |
| 3 | Reader | 5 lines (steady 43, offtopic 15, stuck 53, offtopic 49, steering 59) | **Fires.** The reader's table (and `readerAgrees`'s equivalence) is wrong, not the intent tags |
| 4 | Pictures | 4 turns; quiet line 0; unexplained 0 | Does not fire |
| 5 | Displaced parts said late | 0/0/0/0 | Does not fire |
| 6 | Unhelpful second clarifies | 0 of 2 | Does not fire |
| 7 | Whole cards said again | 0; picture turns that said the card whole 0 | Does not fire |
| 8 | Axes below 3.5 | Register: bare returns (rule not followed); AI line with no reply (stuck 38, steering 30: not followed); repeat asides (offtopic 24, 32: rule missing); Hindi form (not followed) | Names given |
| 9 | Script sentences | 0 untrue, 0 giveaway, 3 frames, 4 unnatural | Does not fire |
| 10 | Misgrades, unsaid boards, contradictions | 0 misgrades, 0 unsaid boards, 1 contradiction (steady 88, held cost) | Case given |