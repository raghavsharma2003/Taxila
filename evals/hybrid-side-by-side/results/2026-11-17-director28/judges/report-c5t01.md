# Judge report: c5-t01 (fractions on the number line), director28

## Summary

**c5-t01 does not pass the scale gate.** It fails on two lines:
- **Unsaid boards (strict reading): 19 turns, in 10 episodes.** All come from the script, not from the walk's paging: the script gives the e2 point and three remediations exactly the same board as the card that follows them.
- **Listening is 3:** 10 requests got no help for the part the child was on.

Everything else on the gate holds: 0 contradictions, 0 misgrades, 0 false keys, every beat taught and every keyed answer given a verdict. The known safety item did not happen: the child's "koi mark nahi" got the remediation for its mix-up (steady 40, stuck 56).

## A. Hand counts

| Lesson (rows) | Beats taught / beat turns | Verdicts / keyed answers | Contradictions | Unsaid boards (strict) | Right called wrong / wrong called right | False keys |
|---|---|---|---|---|---|---|
| steady (125) | 58/58 | 43/43 | 0 | 6: rows 6, 8, 40, 42, 72, 82 | 0/0 | 0 |
| stuck (69) | 30/30 | 15/15 | 0 | 4: rows 10, 12, 56, 58 | 0/0 | 0 |
| offtopic (67) | 28/28 | 17/17 | 0 | 5: rows 6, 8, 10, 14, 16 | 0/0 | 0 |
| steering (67) | 28/28 | 19/19 | 0 | 4: rows 6, 8, 22, 24 | 0/0 | 0 |
| **D28 total** | **144/144** | **94/94** | **0** | **19** | **0/0** | **0** |
| D27 total | 158/158 | 81/81 | 0 | 2 | 0/0 | 0 |

How these were counted:
- Beat turns leave out try-first turns, returns, AI lines and parks.
- Keyed answers include answers to quick questions.

**Where the unsaid boards come from (mechanism: data, layer a).** In each case the board on screen is the follow-up card's posing board, up before the card's first word.

| Script part | Board it carries (same as its card's) | Rows |
|---|---|---|
| s1 e2 point | `dens[7,8]`: the lower line's 7 marks and 8 gaps are what the card asks about | steady 6, 8; stuck 10, 12; offtopic 14, 16; steering 22, 24 |
| s1 remediation for "not numbers" | `dens[7,6]`: she speaks only the upper line | steady 40, 42; stuck 56, 58; offtopic 6, 8 (the AI line), 10; steering 6, 8 |
| s2 remediation for "not numbers" | `den8, mark3` | steady 72 |
| s3 remediation for "all less than one" | `dens[8,6]`: she speaks only the upper line | steady 82 |

- The walk's own paging is clean: 0 turns where a board is drawn for a part that is not being said.
- Clause 1's remedy (pages derived only from the script compile) would not fix these. The compile itself assigns these pages.

## B. Items

| Item | Rating | Evidence |
|---|---|---|
| **D27 mechanism 1 (board part by part)** | Partly | The D27 shapes are gone: steady 2 and offtopic 2 now show no board under the hook, and a remediation and its card are no longer in one turn. The shared script boards above replace them. |
| **D27 mechanism 2 (a request ends without help)** | Still there | Stuck 30 and steering 18 fail exactly as they did in D27. |
| **D27 mechanism 4 (check-ins)** | Reduced | Steady 26→11, stuck 16→9, offtopic 10→6, steering 15→8 |
| **D27 mechanism 6 (seams)** | Partly | Returns with no back-to line: 0. There are new abrupt seams (see Joints). |
| **D27 mechanism 7 (small paths)** | Partly | Fixed: the tired child's bye now gets its sentence (stuck 68), and the picture after a key gets its authored caption (steering 14). Still there: after a request at the greeting the hook is said without the first point (stuck 2, steering 2), and switch lines are followed by words that are not easier (see Help). |
| **Every turn's board** | Partly | Turns where a part that owns a board is said without it: 0. Cards said without their board: 0. Help over another part's board: 0. Keys over the answer board: 4/4 (stuck 26, 62; offtopic 58; steering 12). Remediation boards untrue: 0. Remediation boards showing a later answer: 0. But 3 of the 5 remediation boards are the follow-up card's own board. |
| **Help** | Not working | See the help table below. |
| **Quick questions** | Not working | 16 asked. Real small steps: 0. Quizzes that test nothing: **16**. Cards asked twice: 0. See below. |
| **Check-ins** | Partly | Longest run: steady 1, stuck 2, offtopic 2, steering 3. See below. |
| **Worked examples** | Partly | No problem is said alone and no "Yeh kadam saaf hai?" remains. The asked steps are trivial in s2 and s3. See below. |
| **Short reasons (`whyShort`)** | Working | 4 flagged rows (steady 50, stuck 66, offtopic 64, steering 64): "1/9 matlab 0 se ek gap, yaani pehla mark". It is true and enough for that answer. Steady 118 also says a short reason ("2 tak 10 gaps, aur 2 gap aage: 12/5") but the row is not flagged. |
| **Invitations** | Partly | 5 in all (steady 16, 102; stuck 34; offtopic 46; steering 32). One reads as a natural step into the problem (offtopic 46→48). The other four work as **check-ins in disguise**: the children answer them with a request, the walk records that as a reply about the card, and later the lead-in repeats the invitation's own words ("Ek-ek kadam karke, agla sawaal milkar dekhein?" → "Ab ek sawaal milkar, ek-ek kadam karke dekhte hain", steady 102→106 and steering 32→40). |
| **Joints** | Not working | Misplaced: 0. Two joints at one seam: 0. Returns with no back-to line: 0. Worked problems with no lead-in: 0 (offtopic 48 follows the invitation, as R intends). **Abrupt: 3**: stuck 42 "Achha, toh tumhe batting sabse achha lagta hai. Ab tak samajh aaya?"; steering 34, a park followed by "Yahan tak theek hai?"; steering 38, the aside reply followed by "Yahan tak saaf hai?". Per lesson: 0, 1, 0, 2. |
| **After-key forms** | Partly | "Yeh baat phir milegi; tab tak pichhla sawaal ek baar aur dekhte hain." (stuck 30) sounds like a person. "Is par hum dobara aayenge, abhi pehle wale sawaal par wapas chalo." (steering 18) is stiff. Both are said where help was owed. |
| **`seams` record (10 turns per lesson)** | Partly | Correct: help is recorded as help, verdicts only where one was said, and the lead-in, stop line and tired-bye line as their own kinds. Wrong: each invitation is recorded as an "aside" (5 rows); row 4 carries a spurious `start>opener` seam (4 lessons); a quick question is addressed as `e2:checkin` or `e3:checkin` (steady 8, offtopic 32). |
| **Stop path and model words** | Working | Stuck 68: "Thak jaana theek hai; thoda aaram karo aur paani pi lo. Aaj ke liye itna hi, phir milenge." Offtopic 66: the goodbye. Steering 66: the authored stop line. Model-written sentences: 0. |
| **A mix-up met again** | Working | Each skill's own remediation, said once. Later misses get hints (steady 94, 100, 112; offtopic 44; steering 48, 58). R1: 0. |
| **The return and the wrap** | Working | Wrap turn 1 (steady 122): "Aaj humne milkar kaafi kuch dekha. Aaj dekha ki har fraction ki line par ek pakki jagah hoti hai, aur uska naam gaps ginkar milta hai. Phir upar wala number aaya, jo batata hai 0 se kitne gap chalna hai; dono milkar ek jagah batate hain. Aakhir mein dekha: upar wala number neeche wale se bada ho, toh fraction 1 ke aage aata hai. Aaj ki padhai mein kuch aisa tha jo achha laga?" Wrap turn 2 (steady 124): "Kuch baatein aasaan thi, kuch mein mehnat lagi. Aaj ek kaam tumne khud karke dikhaya: 0 se gaps ginkar 2 ke baad doosre mark ka naam rakha. Aaj ke liye itna hi, phir milenge." Its first line fits the child's "thoda mushkil tha". The closing verdict (120) says its why. It closes like a person. |
| **Reader** | Working | 0 lines read as the wrong kind; every right answer was graded. |
| **Sentence about the child** | Working | It uses S3 c3's `did`, answered right at the first try (row 117). It is true. |
| **Pictures** | Working | Steady 18, stuck 18, offtopic 26 and steering 14 all have authored captions. 0 untrue among those I could check. Offtopic 26 says "Doosri patti abhi poori hai, bina kisi mark ke"; the record does not store the bars view, so I could not verify it. |
| **Re-asks** | Working | Every re-ask carries its givens. Steering 52 and 54 repeat the same re-ask word for word, after misses. |
| **Hindi requests** | Partly | Steady 36: simpler words, kept. Offtopic 32: easier (the chocolate wording). Stuck 8: "yahi baat doosre shabdon mein" is followed by the 1/2 roti point after a hint about 1/3 (carried from D27). Steering 8: "aur aasaan" is followed by the alternate remediation wording, which is not easier. |
| **Third skill** | Working | Taught at class level: 4/4, 6/5, 6/4, 4/2, 7/3, the 7/4 example, 5/3, 11/6, 12/5 and the teachback 9/7. |
| **Carried over** | Working | No hole in any picture line, no card answered right re-posed, the held board correct. |
| **Two words for one thing** | Partly | km and kilometre (steering 44, 52 and 54 against 42 and 50). "bata" means "divided" in her lines but the child reads fractions as "ek bata do". "sahi nahi" in two senses (offtopic 58). |

### Help, by hand

| What went wrong | Count | Rows |
|---|---|---|
| A request answered with no help for the part she was on | **10** | Next step: steady 4, stuck 4, offtopic 4, steering 4 (each a switch line, then the next point and card), stuck 44 and steering 40 (the worked example), offtopic 62 (the go-on line and the next card). Back-to line and a card: stuck 30, steering 18. Another part's help: stuck 8. |
| Help with nothing new | 1 | Steering 52: the worked problem's alternate wording, to a child who had already counted the gaps |
| Same idea, same order, new words | 2 | Stuck 28; steering 16 (both the why's alternate wording after a key) |
| Keys with a wording still unsaid | 0 | |
| Keys where a hint would have done | 0 | |
| "Nothing easier is left" line said | 0 | It was owed at stuck 30, offtopic 62 and steering 18 |

### Quick questions

Each one asks back the last sentence of the point just said, and several answers are also printed on the board:

| Row | Quick question | What the point had just said |
|---|---|---|
| Steady 6 | "Line ke upar 0 ke baad pehla mark kaunsa fraction hai?" | "pehla mark hai 1/7" |
| Steady 12 | "Is line par kitne barabar gaps hain?" | "8 barabar gaps" |
| Steady 50 | "2/3 tak pahunchne ke liye 0 se kitne gap chale?" | "0 se 2 gap chalo… 2/3" |
| Steady 54 | "3/3 line par kis number par aata hai?" | "3/3 = 1" |
| Steady 58 | "Beech wala mark kaunsa fraction hai?" | "beech ka mark 3/6" |
| Steady 90 | "6/4 tak… kitne gap chale?" | "chhe gap aage badho" |
| Steady 96 | "Is line par ek poore mein kitne gap hain?" | "har poore ke 3 barabar gaps" |

The other lessons ask the same two s1 questions (stuck 10 and 14, offtopic 14 and 30, steering 22 and 26) and the s2 e1 question where the child stops (stuck 66, offtopic 64, steering 64).

- **Answers read right: all of them.** Right answers got the yes; stuck 11 and 15 and steering 27 got the answer line and the card.
- **Giveaways of the card's answer: 0.**
- **A quick question where the card would have fitted:** steady 54 (67 words) and 58 (61 words). Steady 12, stuck 14, offtopic 30 and steering 26 would have come to exactly 75. The short reason would also have made room at steady 6 and 96.
- **Quick questions dropped after a request:** steady 8 (the turn ends on a check-in with the card waiting) and offtopic 32.
- **My verdict: worse than "samajh aaya?".** It is the same information (a "haan" in another form) in a quiz register that a class-5 child hears as patronising.

### Check-ins

| Lesson | Turns ending on a check-in | Rows |
|---|---|---|
| steady | 11 | 2, 8, 18, 26, 40, 44, 72, 78, 82, 104, 120 |
| stuck | 9 | 2, 20, 26, 28, 36, 38, 42, 56, 62 |
| offtopic | 6 | 2, 6, 18, 34, 58, 60 |
| steering | 8 | 2, 6, 12, 14, 16, 34, 38, 44 |

- The only run of three is steering 12-14-16. The child's picture request and give-up made it.
- Before a waiting card: 1 (steady 8).
- Inside a worked example: 1 (steering 44, the remediation's own check-in in the middle of the example; a P2 rule collision).
- Tedious? Not in the steady lesson as a whole. The kind I name is **the check-in after a remediation**: the child says "mujhe lagta hai haan", then a bare 21-word card follows (steady 26→28, 40→42, 72→74, 82→84). The worst single ones are the bare check-ins after asides (stuck 42, steering 34 and 38).

### Turns over 60 words

There are 21 in all (steady 9, stuck 3, offtopic 4, steering 5); none is over 75.
- Steady 90 reads as a monologue (73 words): the verdict on sixths, then a jump to quarters, then the quick question.
- The verdict + bridge + point + quick turns (steady 50, stuck 66, offtopic 64, steering 64, at 70-72 words) read as tutoring.

### Worked examples

| Row | Asked step | Child | Her line after it | Child's own step |
|---|---|---|---|---|
| Steady 20-24 | "3 khambon se… kitne gaps bane?" | "four" | "Haan, 4 gaps, kyunki gaps hamesha beech ke khambon se ek zyada hote hain." | 1/4 km: needs thought |
| Steady 62-66 | "5 barabar gaps ke liye beech mein kitne marks lagenge?" | "4 marks" | Confirmed | Near-trivial, and the board shows the 4 marks |
| Steady 106-110 | "0 se 4 gap chalkar kis fraction par pahunchoge?" | "4/4" | Confirmed | 7 − 4 is given away by the turn before it |
| Stuck 44-48 | (s1) | "2" | The step told: "Khambe mat gino… 3 khambon se kul 4 gaps bane" | |
| Offtopic 48-52 | (s1) | | | |
| Steering 40-56 | (s1) | | | Missed three times; got the remediation, then 2 hints |

The s1 example reads as a teacher working with the child. The s2 and s3 examples read as a quiz.

### Asides

| Lesson | Park | Return | Child | Her reply | Rating |
|---|---|---|---|---|---|
| steady | Row 42, form 2, goes on into the card | Row 46, alone | "batting" | "Achha, toh tumhe batting sabse achha lagta hai." | Natural |
| steering | Row 34, form 2, then a check-in (does not go on) | Row 36, alone, right after the park with nothing in between | "batting" | Same reply, then a check-in (row 38) | Natural reply, abrupt turn |
| stuck | AI question, row 40 | | "batting" | Same reply, then "Ab tak samajh aaya?" (row 42) | Natural reply, abrupt turn |
| offtopic | AI questions at rows 8, 20 and 36, each asking something new | | "batting" / "Dhoni" / "papa ke saath dekhta hoon" | Row 10 natural; row 22 "Achha, toh tumhara favourite hai Dhoni." natural; row 38 **"Hmm, hoon. Samajh gayi."** | Row 38 is odd: the slot is filled with "hoon" |

- Taste claims: 0. No reply said twice. Compared with D27's replies: the same.
- Every park was returned to; there was no return without a park.
- After each "bye": a goodbye, not a menu.

### Frames and board changes

- **Repeated within 4 of her turns:**

  | Frame | Rows |
  |---|---|
  | "Haan, sahi hai" | steady 54/58 |
  | "kitne barabar gaps" | steady 10/12, stuck 12/14, offtopic 28/30, steering 24/26 |
  | "Dekho," | stuck 48/54 |
  | "sahi nahi hai" | offtopic 56/58, steering 10/12 |

  Counts in the steady lesson: "Haan, sahi hai" ×12, "Bilkul sahi" ×9, "Haan, bilkul theek" ×7, "Toh poora jawab" ×3. In the offtopic lesson "Haan, bilkul theek. Dekho," comes as a fixed pair 5 times. The park and the return each use one form only (park form 2, return form 3).
- **Board changes:** 99 turns with a change. 89 are in the right place; the other 10 put up a later card's board at a point's or remediation's first word. The board was held on 56 turns.
- **Pace:** steady reached the end (125 rows; D27 had 133). Stuck, offtopic and steering reached S2's first point, as in D27.

### Register: the five rows per lesson that hold it down

| Cause | Rows | Count |
|---|---|---|
| (a) a fixed form heard too often | steady 44; steering 16 | 2 |
| (b) a sentence of the script | steady 106 ("har gap 1/4 ka… Har gap 1/4 ka hai") | 1 |
| (c) the verdict and its why, as written | steady 110 ("7 = 4 + 3:"); stuck 62; offtopic 58 ("Is sawaal ka jawab: sahi nahi") | 3 |
| (d) the length or shape of the turn | steady 90; offtopic 32 | 2 |
| (e) help | stuck 4, 30; offtopic 4, 62; steering 18, 52 | 6 |
| (f) other: echo quick questions and bare check-ins after an aside | steady 58; stuck 14, 42; offtopic 38; steering 34, 38 | 6 |

### Script sentences

| Kind | Count | What |
|---|---|---|
| Untrue | 0 | |
| Giving away a later answer | 0 | |
| Repeated question frame within a skill | 2 | In s1, "kitne barabar gaps" (the e2 card, the e3 quick question and the worked step), and "0 ke baad pehla mark kaunsa fraction hai" (the e2 quick question and c1) |
| Unnatural | 5 | "Pehle 7 gaps the" (s1 e3, right after the child counted 8); the doubled "har gap 1/4 ka"; "1/12 metre matlab" (a value the card never named); "7 = 4 + 3:"; "Is sawaal ka jawab: sahi nahi" |
| Wrong keys | 0 | |

The quick-question keys and the asked-step keys all solve correctly. 0 hints state the answer's numbers, leave one option, or say something the board does not show.

## C. Defects

| Defect | Rows | Layer | New since D27? |
|---|---|---|---|
| The e2 point and three remediations carry the follow-up card's board | 19 turns (see A) | a | New in effect: the quick question and P2 now split the point and the remediation from their cards |
| The count-marks card's own board draws the 11 lower ticks the card asks the child to count | Steady 28, offtopic 22, steering 46 | a | Moved: in D27 this was the remediation's board |
| Echo quick questions | 16 rows | a | New |
| The hook stands alone on "Ab tak samajh aaya?"; the request that follows gets an untrue switch line and the next point | Row 4 in all four lessons | a + b | New |
| The "nothing easier is left" line is never said; a request after a key gets a back-to line or the go-on line and a card | Stuck 30, steering 18, offtopic 62 | b | Carried (same rows as D27) |
| A give-up at a filler check-in gets the worked example | Stuck 44, steering 40 | b | New |
| A park or aside reply ends on a bare check-in | Stuck 42, steering 34, 38 | b | New |
| A quick question is placed where the card fits, the short reason is unused, or the quick is dropped after a request | Steady 54, 58, 8; offtopic 32 | b | New |
| Aside reply slot filled with "hoon" | Offtopic 38 | c | New |
| Record faults: invitation recorded as an aside; spurious opener seam; `whyShort` not flagged; picture row's cell is null | 5 rows; row 4 ×4; steady 118; steering 14 | b | New |

**Gone since D27:**
- the hook with the first point over the card's board;
- a remediation and its card in one turn;
- returns with no back-to line;
- "Yeh kadam saaf hai?" and the problem said alone;
- the tired child's bye answered with the goodbye alone;
- a picture after a key with no authored caption;
- the count-marks remediation board;
- the three sentences D27 named ("3 khambon se kul 4 bane", "bata 5", "Yahi baat doosre sire se");
- stuck 44's fourth clarify answered with the next step.

## D. Scores, director27 → director28

| Axis | Score | Reason |
|---|---|---|
| Listening | 3 → **3** | 10 requests got no help; stuck 30 and steering 18 fail exactly as in D27 |
| Worked example | 4 → **4** | Done with the child now; the asked steps in s2 and s3 are trivial |
| Class level | 4 → **4** | S3 is solid |
| Screen and speech | 3.5 → **3.5** | The walk's paging is clean and there are 0 contradictions, but there are 19 strict unsaid boards from the script |
| Register | 3.5 → **3.5** | Fewer check-ins; echo quizzes, bare check-ins and untrue switch lines |
| Promises | 3.5 → **3** | Switch lines promise easier words and then give the next part (row 4 ×4, stuck 8, steering 8); 4 of 5 invitations are left hanging |

**Listening and promises do not reach 3.5. Register reaches it, only just.**

## E. Verdict

c5-t01 **fails** the gate on two lines: unsaid boards (19 turns under the strict reading, all script data, layer a) and listening at 3 (10 requests met without help, the runtime walk, layer b). Clause 5 also fires on 3 abrupt seams.

The three changes that would move it most:
1. **Script:** give the e2 point and the three remediations a board of their own (the upper line only), and draw the count-marks card's lower line without its ticks.
2. **Walk:** make help a hard precondition for any request. When the wordings are spent, say the "nothing easier is left" line before any return or go-on line. Author an easier hook, or keep the hook with its first point. Never end a park or an aside reply on a bare check-in.
3. **Quick questions:** rewrite them as one-step applications rather than echoes, or drop them wherever the point and its card fit 75 words with the short reason.

**Learning's 30-topic batch: no.** The shared boards and the request paths are runtime and authoring patterns that every script will exercise.

**Clause votes for the main loop:**
- Quick questions: a quiz.
- Invitations: a check-in in disguise.
- Check-ins: not tedious in steady overall; the kind I name is after a remediation.
- Short reasons: they explain enough.
- The 61-75-word turns with a verdict, a bridge, a point and a quick question: tutoring.
- Worked example: 4.