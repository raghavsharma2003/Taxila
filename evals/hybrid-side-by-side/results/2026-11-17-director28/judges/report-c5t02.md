# c5-t02 (c5-maths-ch02-t02), director28: hand report

**c5-t02 does not pass the scale gate.** The faults behind director27's 5 contradictions are gone. P1 now draws each point's own script board, and two of those boards do not show what the point says, which gives **7 held-cost contradictions**. On top of that there are **3 unsaid boards**: a lead-in joint is drawn with its card's board before the card is said. Listening falls to 3, because a struggling child's request is moved on without help in 3 rows (5 counting the hook). All rows are 0-based.

## A. Hand counts

| Lesson | Rows | Beats taught | Verdicts / keyed answers | Contradictions (mechanism) | Unsaid boards (strict) | R→W / W→R | False keys |
|---|---|---|---|---|---|---|---|
| steady | 141 | 68/68 (60 is the aside return; its beat is taught at 62) | 53/53 | 2: 14, 48 (held cost) | 2: 32, 132 | 0/0 | 0 |
| stuck | 79 | 38/38 (32 try-first, 40 AI line, 42 reply) | 18/18 | 2: 10, 62 (held cost) | 0 | 0/0 | 0 |
| offtopic | 75 | 36/36 (12 return) | 26/26 | 2: 22, 58 (held cost) | 1: 38 | 0/0 | 0 |
| steering | 63 | 30/30 (20 try-first, 44 return) | 17/17 | 1: 22 (held cost) | 0 | 0/0 | 0 |
| **D28** | | **172/172** | **114/114** (quick and step answers included) | **7** | **3** | 0/0 | 0 |
| D27 | | 153/154 | 80/80 | 5 (paging) | 1 | 0/0 | 0 |

**Contradictions (all held cost, layer a).** Under P1 a point now pages its own `explain[].board`, so the point's words are measured against that board:
- **S1 e2** says "Dono patti ek hi jagah shuru aur khatam hoti hain, toh inhe seedha milaa sakte ho", but the board is a single 8-part strip, `parts(8,s1)`. Rows: steady 14, stuck 10, offtopic 22, steering 22. In D27 the same words were said over two bars.
- **S2 e2** says "Ab yahi baat ek number line par: 0 se 1 tak 7 barabar gap…", but the board is a strip, `parts(7,s4)`, with no line. Rows: steady 48, stuck 62, offtopic 58. In D27 this point was over `line(7)`.

**Unsaid boards (paging).** A joint that introduces a card is drawn with the card's board:
- steady 32 and offtopic 38: "Dhyaan se suno, sawaal yeh hai." (chars 26–57) under your-step's `bars[8,2]`; the card starts at char 58;
- steady 132: the lead-in "Ab poore paath ko yaad karke bas ek sawaal aur karna hai." (char 102) under the closing question's `bars[10,12]`; the question starts at char 160.

**Not counted.** The code marks a v6 contradiction at stuck 46, offtopic 36 and steering 34. By hand the words match the board there.

## B. Items

### The director27 mechanisms

| D27 mechanism | Now |
|---|---|
| 1a. Remediation and card in one turn | **Gone.** All 9 remediations stand alone and end on a check-in. |
| 1b. Hook and point over the card's board | **Gone** (steady 2, offtopic 2: the e1 point's board; the card's board comes at 4). |
| 1c. A remediation with no board borrows its card's board | **Gone.** A sayAlt with no board keeps the remediation board (steady 94, stuck 68, steering 12). |
| 2. A request ends without help | **Still there:** stuck 30, stuck 44, steering 58; at the hook, stuck 4 and steering 4. |
| 3. The closing question gives its key at the first miss | **Gone.** Steady 134 gives the hint and the question again; the key comes at 136. |
| 4. Check-ins where the child could act | **Reduced.** Steady 23 → 8. 3 remain before a waiting card (below). |
| 6. Missing back-to line | **Gone** (0 of 9 returns). |
| 7. Small paths | The hook is still said alone after a request at the greeting (stuck 2, steering 2). The switch line is followed by the next part (stuck 4, steering 4). Fixed: no aside reply is said twice; a tired bye gets its line (offtopic 74). |
| 9. The record | Opener, stop line and lead-in are fixed. New errors: the invitation is recorded as "aside" (5 rows); a re-ask after a hint is recorded as "returnCard" (steady 98, offtopic 18, 20, 42, 56, steering 16); a step's confirmation is recorded as "point" (steady 74, 120, steering 36). |

### The board, part by part

I checked 94 multi-page turns and every remediation, help, key, return and aside turn.
- **Unsaid boards: 3** (listed in A).
- **A part said without its own board: 0.**
- **A card said without its board: 0.**
- **Help over another part's board: 0.**
- **P1, partly working:** a point's board comes up at the bridge's or the hook's first word. Rows: steady 2, 44, 84; stuck 56; offtopic 2, 50; steering 60. The code flags these as `partOffBeat`. I do not count them as unsaid, because these are points' boards, not cards'.
- **Remediation boards:** 4 kinds said, 0 untrue, 0 showing a later answer.
- **Keys:** every key was said over its answer board (stuck 26, steering 54, steady 136).
- **Board changes:** 114 turns changed the board, 10 of them early by one part (the 3 unsaid rows and the 7 above). 58 turns held it.
- **Watch item, carried:** the worked problem's board is the same as the child's step's answer board (steady 30 and 72; stuck 44; offtopic 36, and 42 during a hint).

### Help against the whole lesson

- **Nothing new: 0.**
- **New words, same idea as the line before: 2.** Steady 28 and stuck 36 give the e3 card's whyAlt right after its why.
- **Keys given with a wording unsaid: 0.** The then-card and c2 whyAlt are post-key help by design.
- **Keys where a hint would have done: 0.**
- **Requests met with nothing: 3.**
  - Stuck 30: "samajh nahi aaya" is answered "Is tarah ka sawaal dobara milega, abhi pehle wale sawaal par wapas chalo." plus the card.
  - Stuck 44: "pata nahi, aap batao" is answered with the next worked problem, while the e3 point's pointAlt and simpler were unsaid.
  - Steering 58: a give-up is answered with the go-on line and the next card.
  - Plus the hook rows, stuck 4 and steering 4: "ise doosre shabdon mein samjhaati hoon" followed by the next point, which is not other words.
- **The "nothing easier" line: said 0 times.** It was due at stuck 30 and steering 58.
- **Off-question help on a card:** offtopic 18 and 20 give the e1 point's pointAlt and simpler, both about 1/4. The child missed the card 5 times and was never given the key.

### Quick questions (28 asked in all, 11 in steady)

| Skill:beat | Question | Rating |
|---|---|---|
| S1e1 | "Is patti mein kitne barabar hisse hain?" | Quiz; the point said "4 barabar hisse" twice |
| S1e2 | "Is patti ka ek hissa kaunsa fraction hai?" | Quiz; just said "ek hissa 1/8" |
| S1e3 | "Line ke neeche kitne barabar gap hain?" | Quiz; just said "neeche 7" |
| S2e1 | "Patti ke kitne hisson mein rang hai?" | Quiz |
| S2e2 | "Zero se 4/7 tak kitne gap chalne padte hain?" | Quiz; repeats the sentence before it word for word |
| **S2e3** | "Is line ka har gap kaunsa fraction hai?" | **Real step:** the child forms 1/5 from "5 gap" |
| S2e4 | "Kis patti ke hisse bade hain…?" | Quiz; "3 wali ke bade" was just said |
| S3e1 | "Is patti ka ek hissa kaunsa fraction hai?" | Quiz; also the same frame as its card at 86 |
| S3e2 | "…1/8 wale kitne gap…?" | Quiz |
| S3e3 | "Board par 3/5 aur 3/8 mein kiske hisse bade hain?" | Quiz; the board prints "bade hisse" |
| S3e4 | "1/4 ki jagah line ke neeche kaunsa fraction aata hai?" | Quiz; just said "usi jagah 2/8" |

- **Totals: 1 real step, 10 quizzes, 0 cards asked twice.**
- **Reading the answers: 0 misreads.**
  - Right answers got a short yes and the card.
  - Wrong answers ("5", "6", "4", "5/1") and give-ups got the answer line and the card.
- **Giveaways: 0.**
- **Asked where the point and its card fit within 75 words: 11.** Steady 14, 48, 84, 88; stuck 4, 10, 62; offtopic 22, 58; steering 4, 22.
- **Missing where a card waited: 0.**
- **Verdict: the same as "samajh aaya?", and a quiz.** The steady child just echoes back the last sentence 10 times. The only gain is for the stuck child, who hears the answer line.

### Check-ins, worked examples, invitations

**Check-ins and long turns:**

| Lesson | Check-ins (D27) | Longest run | Over 60 / over 75 words |
|---|---|---|---|
| steady | 8 (23) | 2: 56–58, made by the aside and a clarify | 14 / 0 |
| stuck | 9 (12) | 2: 26–28, 36–38, 66–68, all made by the child's requests | 5 / 0 |
| offtopic | 3 (12) | 1 | 7 / 0 |
| steering | 6 (9) | 2: 40–42, 54–56 | 3 / 0 |

- **Before a waiting card: 3.** Steady 56, offtopic 10 and steering 40 each end a right verdict on "Yahan tak theek/saaf hai?" while the card waits, because the aside return is due next.
- **Inside a worked example: 0.**
- **Tedious: no.** The kind seen most is the check-in after a remediation (4 of 8 in steady).
- **Monologues among the 61–75 word turns:** the verdict + bridge + point + quick turns (steady 44, stuck 56, offtopic 50, steering 60) and steady 100. All other long turns read as tutoring.

**The three worked examples:**

| Example | Asked step | Child's own step | Reading |
|---|---|---|---|
| S1 | "Kiski chocolate zyada hisson mein kati" (steering 36: "Haan, Rahul ki 8 hisson mein kati…") | Needs thought | Good. In steady 32 and offtopic 38 the child chose try-first, so the step went unresolved. |
| S2 | "5/8 aur 3/8 mein, har hissa kaunsa fraction hai?" ("Haan, har hissa 1/8 hai…", steady 74) | Little left after "Meena 5, Raju 3" | Borderline recital |
| S3 | "Isha ki chocolate 3 mein kati. Uska har hissa kaunsa fraction hai?" (trivial) | Needs thought, since 1/7 is never said | Good |

The problem is never said alone. They read as a teacher working with the child.

**Invitations: 5.**
- Natural: steady 116.
- Check-in in disguise: steady 26 and stuck 34, where the child's "pata nahi" / "samajh nahi aaya" gets card help and a check-in.
- Overtaken by an aside: offtopic 34, steering 32.
- Not a tic.

**Short reasons (`whyShort`): 10 rows.**
- Steady 44, stuck 56, offtopic 50, steering 60: "mark 1/3 hai, aur 1/5 ka gap chhota".
- Steady 64, stuck 76, offtopic 62: "4/7 zero se 4 gap door, 2/7 sirf 2".
- Steady 68, offtopic 72: "Mona teen gap chali, Sonu sirf ek".
- Steady 88: "8 hisson mein se 3 mein rang, yaani 3/8".

All are true and enough after a right answer.

**Steady ending:** row count 141. The third skill is taught at class level, with a real worked example and the authored close.

### Joints, the record, the stop path and model words

- **Joints, per lesson (steady / stuck / offtopic / steering):**
  - misplaced "meet again" line: 0 / 0 / 0 / 0;
  - two joints at one seam: 0;
  - return with no back-to line: 0;
  - worked problem with no lead-in: 0, because the invitation serves as one;
  - abrupt seams: 0 / 1 / 1 / 1.
- **The 3 abrupt seams:**
  - stuck 42: "Achha, toh tumhe chauka sabse achha lagta hai. Ab tak samajh aaya?";
  - offtopic 36: "Haan, cricket, yeh tumne bataya tha. Rahul aur Sana ke paas…";
  - steering 34: "Cricket ki baat bhi karenge, bilkul. Rahul aur Sana…".
- **The after-key return form** was said once, at stuck 30. It sounds like a person, but there it was used to sidestep a confused child.
- **Record check, 10 turns per lesson:** the record says what was heard apart from the 3 error kinds listed under mechanism 9.
- **Stop path:** stuck 78 "Aaj ke liye itna hi, phir milenge!"; offtopic 74 tiredBye + goodbye; steering 62 the authored stop menu. All are authored, though the menu re-asks a child who had already said stop.
- **Model-written sentences: 0.** "Haan, cricket, yeh tumne bataya tha." and "Achha, phir se cricket. Theek hai." are authored `againReplies`.

### Other items

- **Mix-ups met again:**
  - every repeat got a hint or the key, never the remediation again (steady 23, 97, 107, 121, 127; stuck 25, 51, 73; offtopic 15–19, 39, 41; steering 15, 37, 47);
  - steady 103 got S3's own rem[1];
  - R1: 0 remediations said twice.
- **Return and wrap (steady):**
  - Each return is alone in its turn and uses asideReturn[2] (3 times in the topic).
  - Wrap, turn 138: "Har paath mein kuch naya hota hai. [3 covered sentences] Aaj ka kaam aasaan laga ya thoda mushkil?" It ignores the child's "shayad gin ke" at 137.
  - Wrap, turn 140: "Aaj humne milkar kaafi kuch dekha. Aaj ke paath mein tumne dekha ki 6/7 aur 8/9 mein kiski kami chhoti hai. Aaj ke liye itna hi, phir milenge!" The first line ignores "thoda mushkil, thoda aasaan", although ack[1] would fit it.
  - The closing verdict (136) says its why.
- **The sentence about the child:** it is c3's `did`, and the child answered c3 right at the first try (row 131). True and natural.
- **Pictures: 4.**
  - steady 18, offtopic 26 (e2 card caption, wholes view);
  - steering 14 (then-card caption);
  - stuck 18, which used the e3 point's caption rather than the card's.
  - All are authored and true, give nothing away, and are followed by the question.
- **Asides:**
  - steady: park 54 → return 60;
  - offtopic: park 8 → return 12, then 2nd and 3rd asides at 36 and 68 with no park;
  - steering: park 34 → return 44;
  - stuck: the AI line at 40.
  - The reply "Achha, toh tumhe chauka sabse achha lagta hai." is natural and was said 4 times across 4 lessons, the same as D27.
  - The later replies carry "cricket": 36 sounds like listening; 68 is flat.
  - The return ignores "sixer" (offtopic 12, steering 44).
  - 0 taste claims; all on time; no park left unreturned.
- **Clarify rows:**
  - Second clarify on one part: stuck 37 → "Dono taraf ka pehla gap dekho…", a weaker hint said after the why. Steering 3 got the next part.
  - Third request: stuck 29 and steering 57 moved on correctly but without the helpSpent line.
  - Wrong-kind reads: 0.
- **Re-asks:**
  - The question was given every time; a question that needed missing givens: 0.
  - Offtopic 20 used the full prompt, not the authored re-ask.
  - Whole card said again within two turns: 1 (steady 134, the closing question after its hint, as P4 requires).
- **Hindi requests:** steady 36, stuck 8, offtopic 32 and steering 8 each got new, easier words. None claimed Hindi and then repeated itself.
- **Stitched turns: 5.** The hook's "…kis roti ka ek hissa bada hota hai. Yeh patti ek poora hai" (steady 2, offtopic 2), plus the 3 abrupt seams.
- **Frames:**

  | Frame | Where |
  |---|---|
  | Right-verdict openers | steady "Sahi jawab" ×12, "Haan, sahi hai" ×11, "Bilkul sahi" ×9, "Haan, bilkul theek" ×6 |
  | Repeated within 4 turns | "Sahi jawab." steady 64/72 and 82/86; "Dekho," offtopic, 6 pairs (22–70); "…kaunsa fraction hai?" steady 14/16, 64/72, 84/86, 112/118 |
  | Park | asidePark[1] ×3 |
  | Return | asideReturn[2] ×3 |
  | Switch | [1] ×3, [0] ×2, "Koi baat nahi, ise doosre shabdon…" ×1 |
  | Back-to | [1] ×3, [2] ×4, [0] ×1 |
  | Before a remediation | [0] ×5, [1] ×1, [2] ×3 |

- **Reader:** 0 wrong kinds; every right answer was graded.
- **A part said once:** step 2 of the S1 worked example was never resolved in steady and offtopic (try-first). Nothing was repeated unasked.
- **Two words for one thing:**
  - "upar/neeche" in three senses (carried);
  - "roti" in the hook against "patti" on the board (steady 2);
  - "Zoya" for two different people (steady 54, 80).
- **Script reading:**
  - untrue sentences: 0;
  - giveaway: 1 (S2 e1 hint and re-ask, "hisse wahi 7 rehte hain…" and "…4 hisson mein rang": stuck 60, offtopic 54);
  - repeated question frames within a skill: 3 (S1 quick e1 and e3; S2 quick e3 and step 1; S3 quick e1 and step 2);
  - unnatural: 3 (the echo quick questions, "Toh poora jawab:", S3 c2's "liye hue hisse jodkar");
  - wrong quick or step keys: 0;
  - S2 c2 is a skill-1 unit-fraction card sitting in skill 2.
- **Pace:** steady reached the end of the script, with S3 taught at class level. Stuck stopped at S2 e3 (D27: S2 e2), offtopic at S2 e4 (D27: S2 e2), steering at S2 e1 (D27: the S2 bridge).

## C. Defects

| Defect | Rows | Layer | Since D27 |
|---|---|---|---|
| Point boards do not show what the point says (S1 e2, S2 e2) | 7 rows in A | a | new (exposed by P1) |
| A lead-in joint is paged with its card's board | steady 32, 132; offtopic 38 | b | new |
| A point's board comes up at the bridge or hook | 7 rows | b | new |
| A request is moved on with no help and no helpSpent line | stuck 30, 44; steering 58 (stuck 4, steering 4) | b | carried |
| Check-in before a waiting card on the aside path | steady 56, offtopic 10, steering 40 | b | new |
| Echo quick questions; quick asked where the card fit | 10 kinds; 11 rows | a+b | new |
| Off-question help, no key after 5 misses | offtopic 18, 20 | b | carried |
| Aside straight into the worked problem; check-in after the AI line | offtopic 36, steering 34, stuck 42 | c | new |
| Worked board equals the step's answer board | S1, S2 | a | carried |
| S2 e1 hint hands over 4/7 | stuck 60, offtopic 54 | a | new |
| Record errors (invitation as aside, returnCard, point) | 14 rows | d | new |
| Wrap ack ignores the child | steady 138, 140 | c | carried |

**Gone since D27:** the remediation-plus-card paging (5 contradictions), borrowed remediation boards, missing back-to lines, the closing key at the first miss, the worked problem said alone with a "kadam" check-in, the repeated aside reply, and the tired-bye path.

## D. Scores (D27 → D28)

| Axis | Score | Why |
|---|---|---|
| Listening | 3.5 → **3** | 3 requests moved on (5 with the hook), off-question hints, stuck 42 |
| Worked example | 4 → **4** | |
| Class level | 4 → **4** | |
| Screen and speech | 3 → **3** | 7 held-cost contradictions and 3 unsaid boards |
| Register | 3.5 → **3.5** | Fewer check-ins, but the echo quiz and rotating verdicts |
| Promises | 3.5 → **3.5** | "doosre shabdon mein" broken at stuck 4 and steering 4 |

**Listening does not reach 3.5. Register and promises reach 3.5.**

## Reversal clauses (counts for the main loop)

1. **Fires.** 3 unsaid boards: steady 32 (your-step S1), steady 132 (closing question), offtopic 38 (your-step S1). 0 parts without their board, 0 cards without their board, 0 help over another part's board. Remediation boards untrue or showing a later answer: 0.
2. **Does not fire.** Nothing new: 0. Keys with a wording unsaid: 0. Keys where a hint would have done: 0.
3. **Fires.** 3 requests without help (stuck 30, 44; steering 58), plus 2 at the hook. The nothing-easier line was said 0 times while a wording was unsaid.
4. **Steady:** 141 rows, 8 check-ins, longest run 2. Before a waiting card: 3 (steady 56, offtopic 10, steering 40), so the path needs closing. Quick questions: 1 real step, 10 quizzes, 0 asked twice; same as the check-in, and a quiz. Quick giveaways: 0. Misreads: 0. Check-ins tedious: no. The remediation check-in: no. Short reasons: 10 rows, enough. Invitations: 5, not a tic (2 read as check-ins). The verdict + bridge + point + quick turns: monologue (yes).
5. **Fires (abrupt seams).** Misplaced or stacked joints: 0. Returns with no back-to: 0. Abrupt seams: 3 (stuck 42, offtopic 36, steering 34).
6. Does not fire: 0 stop or model-word cases.
7. Does not fire: 0.
8. Does not fire: 1 (S2 e1 hint).
9. Register 3.5. Rows by cause: (a) 1, (b) 2, (c) 0, (d) 4, (e) 7, (f) 6.
   - (a) fixed form: steady 86.
   - (b) script sentence: steady 2 and 48 (echo quick questions).
   - (d) length or shape: steady 44, stuck 14, offtopic 28, steering 60.
   - (e) help: stuck 4, 30, 38; offtopic 18, 20; steering 4, 58.
   - (f) other (wrap ack, seams, aside path): steady 140; stuck 42; offtopic 36, 68; steering 34, 40.
10. Reader: 0 wrong kinds. Captions: 0 untrue. The sentence about the child is true.
11. **Fires (listening 3).**
    - stuck 4 and steering 4 (hook × give-up/clarify): rule missing, since the hook has no second wording;
    - stuck 30 (after a key × clarify): rule not followed, the helpSpent line was skipped;
    - stuck 44 (after an aside check-in × give-up): not followed;
    - steering 58 (after a key × give-up): not followed.
12. Script: 0 untrue, 1 giveaway, 3 repeated frames, 3 unnatural, 0 wrong keys.
13. 0 misgrades; 3 unsaid boards (paging); 7 contradictions (held cost).
14. Worked example: 4.

## E. Verdict

**c5-t02 fails the gate** on unsaid boards (3), contradictions (7), and listening and screen-and-speech below 3.5.

What blocks it:
- **Layer a:** the S1 e2 and S2 e2 point boards were written for director27, where a point was said over its card's board. P1 now draws the point's own board, which shows one strip where she speaks of "dono patti", and a strip where she speaks of "number line".
- **Layer b:** joints and bridges are paged with the next part's board, and requests are moved on without the helpSpent line.

The changes that would move it most:
1. Redraw those two boards, and read every `explain[].board` in the 30 topics against its point.
2. Page every joint, bridge and hook with what is already up, and draw a card's board only at the card's first word.
3. Make help or helpSpent a hard precondition for every request. At the same time, rewrite the echo quick questions as real steps (S2 e3 is the model), and skip the quick question where the point and its card fit in 75 words.

**Learning's 30-topic batch: no.** Every topic's point boards now face this same new read, and the request path still drops struggling children.

**For the main loop:** the topic does not pass, so the "what the gate misses" line does not apply. Even so, a parent would hear the steady child asked eleven times to repeat what Asha had just said.