# Live pilots: what changed in the reader pass (2026-11-11), for the director21 judges

Four fresh readers read the 4 live pilots field by field: 782 fields, 79 faulted, 7 untrue, 48 giveaways, 0 wrong keys. Fixers ran three rounds. Each round's rewrites were read by readers who had not written them: round 1 had 29 fails in 172; round 2, 12 in 81; round 3, 4 in 34 (all low or trivial), and those 4 were fixed by hand. A final hand round removed 10 remediation boards whose general say no longer speaks them (the D12 held-board rule). Every key was re-solved. Below are each fixer's change logs, so the judges can read those places first.

## c4-maths-ch05-t01

### c4-maths-ch05-t01 (live pilot): changes after the read

File: data/lesson-scripts/c4-maths-ch05-t01.json. The kit was not edited. The spoken rewrites, old and new, are in
readers/rewrites-pilot-c4-maths-ch05-t01.json.

Yes/no keys were all 12 "No". Now there are 8 yes/no cards, 3 of them "Yes": s1 No, No, **Yes** · s2 **Yes**, No · s3 No, No, **Yes**.

#### s1 (equal parts of one whole)
| card / field | old key | new key | change |
|---|---|---|---|
| e1.ask.why | No | No | no longer says 1/2 (the key of c1 and c3): "so 2 goes at the bottom, not 1" |
| e4 (board, point, ask) | No ("{friend}: 1/3 eaten, 3 left. Right?") | **1/6** (wrongIfMis 1/5) | The old ask was ladder i07, and the point acted it out. The new ask is on a 6-piece bar. Board: fraction-bars [4 shaded 1 "1/4", 6 shaded 1 "?"]. The point now says "top strip" (it said "circle") so it matches the board on screen. The simpler is rewritten without the old pizza. |
| workedExample | 2/3 (3 pieces, 2 eaten = e3's ask) | **3/5** (5 pieces, 3 eaten; wrongIfMis 3/2) | problem, steps, yourStep, answer, why and boards all changed |
| c1 | No ("is each piece a third?" = e2's ask) | **1/2** (wrongIfMis 1/3) | "what fraction is the big piece?". wholes@1 equal:false draws it as exactly half |
| c3 | No (rl-h1's case; its answer board drew the equal cake) | **1/2** (wrongIfMis 1/4) | "{friend} says 1/4 because 4 pieces; what fraction is the big piece?". The answer board now shows only that cake. |
| ladder | i01, i09, i06, i07, rl-h1 | i09, i07, rl-h1 | i01 is answered by e4's point and i06 by e2's point. The reader's i12 is a teachback, which the runtime refuses on a ladder. |
| remediation[0].say/simpler | — | — | Watermelon (i06) replaced by a rope. "no piece gets a name" becomes "you can't name them by counting; check the sizes first". |
| remediation[0].then | No ("is the smaller piece half?") | **Yes** ("{friend} says the smaller piece is not half. Right?") | The question is now asked the other way round, and "tootkar … ho gayi" is fixed. |
| remediation[1].say | 2/4 | 2/4 | The quarter is said in words (no "1/4"), because 1/4 is now c3's distractor. |
| remediation[1].simpler | 2/4 | 2/4 | "do tukde = do chauthaai" (the then-key) becomes "teen tukde = teen chauthaai". |

#### s2 (fraction of a set)
| card / field | old key | new key | change |
|---|---|---|---|
| e2 (board, point) | 8 (1/3 of 24) | 8 (ask unchanged) | The point said "24 ka 1/4 hai 6", which answers ladder rl-h2 and half of i10. The reader's fix (32 bottles/students) is a kit edit, which was not allowed here, so the point now shows 1/6 of the same 24 mangoes (6 groups of 4) and the ask is unchanged. Test D12.4 needs every s2 board to be one equal-groups grouping that is not the ask's answer. |
| e3 | 5 | 5 | **Not changed** (board fault skipped). Tests D13.3 (tests/r7-learning-d13.test.mjs:50-51: key "5", prompt /20/) and D12.4 (tests/r7-learning-d12.test.mjs:53-55: an equal-groups board whose `each` is not the key) pin it. The only other equal-groups board of 20 is 5 groups of 4, and its point would have to say "5 groups", which is the key: an echo the checker refuses. The reader's 16 as 2×8 (key 4) is refused too: s1's then-key 2/4 "states 4". |
| c2 | No ("is the 7-group a quarter?") | **Yes** ("Rani says the 7-group is not a quarter. Right?") | asked the other way round; the board is now equal-groups sizes [7,3,3,3] |
| remediation[0] (say, board, then) | 1/6 (24 bananas, 6 bags of 4) | 1/6 (30 bananas, 6 bags of 5; wrongIfMis 1/5) | Language: "poore ke saare thaile" became "saare thaile". The numbers changed because 24 in 6 groups of 4 is now e2's own board. |
| remediation[1].say/simpler/board | — | — | The demonstration now uses 15 pencils (7, 4, 4) on its own board. The test is: deal the pencils into 3 groups, and a group exactly that big is one-third. The old rule ("only dealt groups are a fraction's shares") was false at the edge. |
| remediation[1].then | No | No | The prompt now states its own 12 pencils (6, 3, 3). The why and answer board no longer say "12 ka ek-tihaai 4" (ladder i03). |

#### s3 (comparing unit fractions)
| card / field | old key | new key | change |
|---|---|---|---|
| e1.ask.why | No | No | language: stray "bhi" removed |
| e2 (mustSay, board, point, ask) | 1/2 (4 vs 2 = ladder i13) | **1/3** (6 vs 3; wrongIfMis 1/6) | mustSay "ek-chauthaai, 1/4" became "barabar slice, 1/6" |
| e3.simpler | No | No | "the 4 only counts the parts" (false) → "the 4 tells how many equal parts; more parts, thinner piece" |
| workedExample.answer | 1/3 | 1/3 | hi and en now match (no extra "1/3 > 1/4" in the en) |
| c1 | 1/2 (3 vs 2 = ladder i04) | **1/3** (3 vs 5; wrongIfMis 1/5) | |
| c2 | No ("Farhan, 4 vs 2: right?") | **Gita** (wrongIfMis Farhan) | Now 8 vs 2: "who got more, Farhan or Gita?". I used 8 vs 2 instead of the reader's 5 vs 3 because c1 is already 3 vs 5. |
| c3 | 1/4, 1/3, 1/2 (= ladder i11 reversed) | **1/10, 1/6, 1/3** | The reader's 1/3, 1/8, 1/5 was not used: it would pre-answer the kit's new s3 items i14 (1/5 vs 1/8) and i15 (1/6, 1/5, 1/8). |
| ladder | i13, i04, i05, i11, rl-h3 | i04, i14, i11, i15, rl-h3 | i13 was the old e2. i05 is answered by e3's mustSay "zyada hisse, chhota tukda". i14 and i15 are the kit's new s3 items. |
| remediation[0].say/board | No | — | The demonstration now uses two rotis of 3 and 10 pieces, on its own board. Before, it acted out the then-card's 8 and 6 cakes. "The count says nothing about size" becomes "a bigger number is not a bigger piece; more equal parts, thinner pieces". |
| remediation[0].then | No ("Rahul: 8-piece cake's piece bigger?") | **Yes** ("Rahul: 6-piece cake's piece bigger?") | The question is now asked the other way round, and the pieces are said to be equal. 1/6 is not spoken (it is e2's distractor). The simpler no longer says "count, not size". |

#### Not done here
- Kit slips (i13 hint "Half is 2 pieces"; the s3 items still reuse 2, 3, 4): the kit was off limits.
- The s3 ladder now depends on i14 and i15, which another agent is editing. If their ids or texts change, re-run the check.
- Tests that pin the old content (not edited): tests/r7-learning-d9.test.mjs:44 (D9.4-5) pins the s1 worked yourStep
  board `{ parts: 3, shade: 2 }`, which the reader's worked fix changes to 5 and 3. tests/r8-picture-turn.test.mjs:74 (P6) pins
  per-template board counts for the pilots. Changed by this script: fraction-parts 13/13 → 12/12, fraction-bars 17/19 → 19/21
  (s1 e4), shade-grid 1/4 → 1/3 and equal-groups 8/10 → 8/11 (s2 c2). measured 20/21 and shape 1/6 come from another script.

### Round 2 (2026-11-11): the second reader's verdicts (second-pilots-a.json, pass:false and new)

File: data/lesson-scripts/c4-maths-ch05-t01.json (live). Kit not edited. Spoken rewrites, old and new, with the board each one is
said over: readers/rewrites-pilot-r2-c4-maths-ch05-t01.json. check.mjs (no LESSON_SCRIPTS_DIR): ok.

Yes/no keys now: s1 e1 No, e2 No, c3 **Yes**, rem0.then **Yes** · s2 c2 **Yes**, rem1.then No · s3 e1 No, rem0.then **Yes**.
No Yes card hangs on a negated claim any more.

#### s1
| card / field | old key | new key | change |
|---|---|---|---|
| e4 (convey, mustSay, boards, point, ask.why) [0] | 1/6 | 1/6 | The top strip is now 8 parts with 1 coloured ("1/8; 8 at the bottom, not the 7 left"). Before, it was 4 parts with 1 coloured, which acted out ladder i07. mustSay is now "saare hisse", "1/8". The ask (6-piece bar, 1 eaten) is unchanged. |
| c3 [16] | 1/2 ("big piece = ?", c1's frame again) | **Yes** (wrongIfMis No) | "Cake: 4 pieces, 1 big and 3 small. {friend} says one small piece is even smaller than 1/4 of the cake. Right?" Each small piece is 1/6 (the renderer splits the other half equally), so a child who thinks "4 pieces, so each is 1/4" says No. The answer board shows the cake beside an equal 4-cake with 1/4 shaded. |
| rem0.then [21] | Yes ("{friend} says the smaller piece is NOT half") | **Yes** | It is now a direct claim: "{friend} says the bigger piece is more than half the roti." The bigger piece is 2/3 of the roti. |
| rem0.say/simpler (test fix) | — | — | The say named an 8-fold paper over the 2-piece roti board, and W8 failed (tests d11 #19, lesson-scripts #108, both failing before this round). Now the paper is "folded exactly down the middle: both parts match, only then a half", with no count. A version that said "2 equal parts" was refused by rule (f). |
| rem1.say/board [23] | 2/4 | 2/4 | The say now runs on its own 8-piece bar (board fraction-parts 8): "each piece is one-eighth … the bottom 8 names the piece". The then-card stays at 4 pieces with 2 eaten. |
| rem1.simpler [24] | 2/4 | 2/4 | Now reads "each piece is one quarter; count the eaten ones, not the ones left". The old "three pieces = three quarters" answered ladder i09. |

#### s2
| card / field | old key | new key | change |
|---|---|---|---|
| c2 [26] | Yes ("Rani says the 7-group is NOT a quarter") | **Yes** | It is now a positive claim: "Rani says the group of 7 is more than one-quarter of all the marbles." A quarter of 16 is 4, and 7 > 4. The why and simpler changed to match. |
| rem0 (move, say, board, then.simpler) [28] | 1/6 | 1/6 | The say now teaches on its own 35 bananas in 5 bags of 7, with its own equal-groups board. The then-card stays at 30 in 6 bags. I tried the reader's other option (then-card moved to 35/5, key 1/5), and the checker refused it: 1/5 is the key of s3 e3. The then-card's simpler no longer says "all 6 bags at the bottom". |
| rem1.say [32] | No | No | The dealing test now gives its result: "Each gets 5. 7 is not 5, and 4 is not 5, so none of these is a third." I left the board as plain sizes [7,4,4]. Adding equalTo {3×5} tripped W10. |

#### s3
| card / field | old key | new key | change |
|---|---|---|---|
| e1.ask.why (checker) | No | No | It no longer says "1/4" (now e2's key): "each of 4 equal parts is half of a piece from 2 parts". |
| e2 [37] | 1/3 (6 vs 3) | **1/4** (6 vs 4; wrongIfMis 1/6) | point, boards, why, simpler |
| e3 [36][70] | No (1/4 vs 1/2 = e1 again; the point stated it) | **1/5** ("1/5 or 1/2: which is the smaller piece?"; wrongIfMis 1/2) | The board shows strips of 2 and 5 parts. The point is now the general rule only ("the bottom number tells how many equal parts; more parts, smaller piece") and names no piece. |
| workedExample [73][37] | 1/3 (1/3 vs 1/4: which bigger) | **2** ("how many 1/6 pieces fit under one 1/3 piece?") | The problem, find, step 2, yourStep, answer, why and right-hand compare column all changed. The answer board is bars 1/3 and 2/6. The yourStep has no targets/wrongIfMis, like s2's yourStep. |
| c1 [42] | 1/3 (3 vs 5: which biggest) | **Sonu** (wrongIfMis Meena) | New frame: "Meena cuts a roti into 2 equal pieces, Sonu the same kind into 9. Whose piece is smaller than 1/3, Meena's or Sonu's?" |
| c2 [44] | Gita | Gita | Not changed. Its sharing-story twin, ladder i04, was dropped instead. |
| c3 [49] | 1/10, 1/6, 1/3 | **1/10, 1/7, 1/4** | The old rem0 say (3 vs 10) gave this card's extreme pair. The new set {4, 10, 7} shares no pair with any earlier line, and is not i11 or i15. |
| ladder [71][44] | i04, i14, i11, i15, rl-h3 | **i14, i15, rl-h3** | That leaves one ordering rung (i15), one which-bigger rung (i14) and rl-h3. i04 was c2's frame and i11 was a second ordering item. |
| rem0.say/board [49] | Yes | Yes | It now uses rotis of 6 and 12 on its own board. No s3 card or ladder item asks that pair. |
| rem0.then [72] | Yes (8 vs 6) | **Yes** (9 vs 7) | "Rahul says the 7-piece cake's piece is bigger: right?" 9 vs 7 is outside i14–i16. |

#### Keys re-solved
s1: c3: the small piece is 1/2 ÷ 3 = 1/6, and 1/6 < 1/4, so Yes. rem0.then: the bigger piece is 2/3 > 1/2, so Yes. e4: 1/6.
s2: c2: 16 ÷ 4 = 4, and 7 > 4, so Yes. rem0.then: 1/6 (30 = 6 × 5). The say's 35 = 5 × 7. rem1.say: 15 ÷ 3 = 5.
s3: e2: 1/4 > 1/6. e3: 1/5 < 1/2. worked: 1/3 = 2/6, so 2. c1: 1/2 > 1/3 > 1/9, so Sonu. c3: 1/10 < 1/7 < 1/4. rem0.then: 1/7 > 1/9, so Yes.

#### Tests (node --test tests/r7-learning-*.test.mjs tests/r8-*.test.mjs)
- Before this round: d11 #19 and lesson-scripts #108 failed on this script (the W8 rem0 say). Both now pass for c4.
- P6 (tests/r8-picture-turn.test.mjs:81, assert at :77) pins the pilots' board counts. measured@1 20/21 → 24/25 and shape@1 1/6 → 1/7,
  both caused by the c6 remediation boards added in this round (see the c6 log). The c4 counts are unchanged. I did not edit the test.

### Round 3 (2026-11-11): the third reader's verdicts (third-pilots.json, pass:false and new)
Main rule for this round: a remediation's say and simpler are spoken over the THEN-CARD'S board, so they name nothing that
board does not show and do not work the then-card's own case. Spoken rewrites are in rewrites-pilot-r3-c4-maths-ch05-t01.json.
check.mjs (no LESSON_SCRIPTS_DIR): ok.

| card / field | old key | new key | change |
|---|---|---|---|
| s2 rem1.say (+ move) | No | No | It used to deal 15 pencils in groups of 7, 4 and 4 over the then-card's 6, 3, 3 board. Now it gives the general dealing method with no numbers: "deal all the pencils one at a time into 3 piles … one pile's size is one-third; a group not that size is not a third." The child does the dealing. |
| s3 rem0.say, simpler (+ move) | Yes | Yes | The say named rotis of 6 and 12 over the then-card's two cakes (9 and 7). Now: "These two cakes are the same size … the number of pieces tells how many equal parts the cake was cut into; more equal parts, thinner pieces." The simpler said "roti" and now says "cake". |
| s3 e2.simpler | — | — | Language fix: "Pizza jitne kam logon mein **bantta hai**" (singular). |
| s3 e3.ask (+ convey) | 1/5 ("1/5 or 1/2: which is smaller?", the same frame as e2) | **No** (wrongIfMis Yes) | The ask is now a claim to judge: "5 is a bigger number than 2. {friend} says that is why 1/5 of one strip is a bigger piece than 1/2 of it. Is that right?" The why changed to match. The board and answer board are unchanged (strips of 2 and 5). |
| s3 ladder | i14, i15, rl-h3 | **i05, i16, rl-h3** | i14 used e2/e3's which-bigger frame and gave the answer token 1/5. i15 used c3's ordering frame. |

Left as is: rem1.board ([7,4,4]) and rem0.board (rotis 6/12) are kept. They are drawn only in a help re-teach, and the says are now general, so they fit either board.
Residual, flagged: i16 (Meena: "1/8 > 1/6 because 8 > 6: right?") has the same frame as the new e3 claim and the same answer (No). I took it on the reader's own suggestion. Every s3 kit item now echoes some card's frame, so this was the smallest overlap. The other options were i04 (c2's sharing story), i11 and i15 (c3's ordering) and i13 (e1's 1/2 vs 1/4).

#### Keys re-solved
s3 e3: the same strip in 5 parts gives smaller parts than in 2, so 1/5 < 1/2 and the claim "1/5 is bigger" is false, so No. s2 rem1.then is unchanged: the groups 6, 3, 3 are unequal, so No. s3 rem0.then is unchanged: 1/7 > 1/9, so Yes.

#### Tests
`node --test tests/r7-learning-*.test.mjs tests/r8-*.test.mjs`: 385 pass, 1 fail. The failure is P6 (tests/r8-picture-turn.test.mjs:82), caused by the c5-t02 board change. Nothing in c4 affects it.

## c5-maths-ch02-t01

### c5-maths-ch02-t01 (live pilot): changes after the reader's verdict

For the director judges. Each line: what changed, old key → new key. Spoken rewrites with their boards are in rewrites-pilot-c5-maths-ch02-t01.json.

#### Cards
- `skills[0].explain[0].ask`: simpler. Key: `on this line` → `on this line`. Prompt now: "{friend} says 1/3 goes near 3. What do you think: is 1/3 on this line from 0 to 1, or near 3?"
- `skills[0].explain[1].ask`: board, answerBoard. Key: `8` → `8`. Prompt now: "Now look under the line. There are 7 marks between 0 and 1, all evenly spaced. How many equal gaps does that make below?"
- `skills[0].checks[0] (c1)`: prompt, key, accept, wrongIfMis, board, why, answerBoard, simpler. Key: `1/3` → `1/11`. Prompt now: "This line has 10 evenly spaced marks between 0 and 1. What fraction is the first mark after 0?"
- `skills[0].checks[1] (c2)`: prompt, key, accept, wrongIfMis, board, why, answerBoard, simpler. Key: `1/10` → `1/9`. Prompt now: "Once, cut 0 to 1 into 4 equal gaps; once, into 9. Which is closer to 0: 1/4 or 1/9?"
- `skills[0].remediation[0].then`: board, answerBoard. Key: `1/12 m` → `1/12 m`. Prompt now: "On the ribbon's lower line there are 11 evenly spaced marks. At how many metres is the first mark?"
- `skills[0].remediation[2].then`: prompt, key, accept, board, why, answerBoard, simpler, wrongIfMis. Key: `1/7 km` → `wrong`. Prompt now: "Below, the same road is in 6 equal stretches. {friend} says the first mark down there has no number. Right or wrong?"
- `skills[1].explain[0].ask`: prompt, key, accept, why, board, answerBoard. Key: `3/4` → `5/8`. Prompt now: "The lower line is cut into 8 equal gaps. Take 5 hops from 0. Which fraction do you land on?"
- `skills[1].checks[2] (c3)`: prompt, key, accept, wrongIfMis, board, why, answerBoard, simpler. Key: `between 0 and 1` → `one mark`. Prompt now: "{friend} says 3/4 is two numbers, 3 and 4. To show 3/4 on a 0-to-1 line, how many marks do you put: one or two?"
- `skills[1].remediation[0].then`: prompt, key, accept, wrongIfMis, board, why, answerBoard, simpler. Key: `3/5` → `3/7`. Prompt now: "The lower line has 6 evenly spaced marks between 0 and 1. What fraction is the third mark after 0?"
- `skills[1].remediation[1].then`: accept, why. Key: `before 2/3` → `before 2/3`. Prompt now: "On top, 2 hops of 1/3 reached 2/3. Below, 3 hops of 1/6: do they stop before 2/3, or after?"
- `skills[1].remediation[2].then`: prompt, simpler, wrongIfMis. Key: `3/8 km` → `3/8 km`. Prompt now: "A stone every 1/8 km; the toy stops at the third stone. {friend} says 3 and 8, two numbers. Give it as one number."
- `skills[2].explain[0].ask`: prompt, accept, why, board, answerBoard. Key: `after` → `after`. Prompt now: "Now look below: there each hop is 1/5. Take 6 hops from 0. Do you stop before 1, or after?"
- `skills[2].checks[2] (c3)`: prompt, key, accept, wrongIfMis, board, why, answerBoard, simpler. Key: `between 2 and 3` → `12/5`. Prompt now: "The line runs from 0 to 3, each whole in 5 equal gaps. What fraction is the 2nd mark after 2?"
- `skills[2].remediation[0].then`: prompt, board, answerBoard. Key: `7/6` → `7/6`. Prompt now: "The lower line runs 0 to 2 laps, each lap in 6 equal parts. A runner makes 7 hops from 0. How many laps, as a fraction?"

#### Other fields (no key)
- `joints.asideReturn[0]`: "Does anything in {aside} move along or go forward?" → "What's the most fun part of {aside} for you?"
- `skills[0].explain[1].mustSay[0]`: "4 marks" → "6 marks"
- `skills[0].explain[1].mustSay[1]`: "5 equal gaps" → "7 equal gaps"
- `skills[0].explain[1].mustSay[2]`: "1/5" → "1/7"
- `skills[0].explain[1].point`: "Same line from 0 to 1, but now there are 4 marks on top. Don't count the marks, count the gaps: 5 equal gaps. So the first mark after 0 is 1/5." → "Same line from 0 to 1, but now there are 6 marks on top. Don't count the marks, count the gaps: 7 equal gaps. So the first mark after 0 is 1/7."
- `skills[0].explain[1].simpler`: "On top there were 4 marks and 5 gaps, one more gap. The same works for the 7 marks below." → "On top there were 6 marks and 7 gaps, one more gap. The same works for the 7 marks below."
- `skills[0].explain[2].point`: "Now the same 0 to 1, but on top there are 8 equal gaps. More gaps than 5, so each one is a smaller gap. The first mark is 1/8, right up against 0." → "Now the same 0 to 1, but on top there are 8 equal gaps. More gaps than 7, so each one is a smaller gap. The first mark is 1/8, right up against 0."
- `skills[0].remediation[0].say`: "Picture a tailor's ribbon, 0 to 1 metre. On top there are 5 chalk marks, and the ribbon is in 6 equal pieces. The first mark ends the first piece, so its name is 1/6 metre. The name comes from counting pieces, not marks." → "Picture a tailor's ribbon, 0 to 1 metre. On top there are 6 chalk marks, and the ribbon is in 7 equal pieces. The first mark ends the first piece, so its name is 1/7 metre. The name comes from counting pieces, not marks."
- `skills[0].remediation[0].simpler`: "5 marks, 6 pieces. Count the pieces, and the first mark is at 1/6 metre." → "6 marks, 7 pieces. Count the pieces, and the first mark is at 1/7 metre."
- `skills[0].remediation[1].say`: "One line, 0 to 1. On top, 5 equal pieces; below, 6, and both make the same one whole. 6 is the bigger number, but the same whole is shared into more pieces, so each piece below is a little smaller." → "One line, 0 to 1. On top, 2 equal pieces; below, 5, and both make the same one whole. 5 is the bigger number, but the same whole is shared into more pieces, so each piece below is smaller."
- `skills[0].remediation[1].simpler`: "One whole, more pieces, so each piece is smaller. 6 is the bigger number, but its piece is smaller." → "One whole, more pieces, so each piece is smaller. 5 is the bigger number, but its piece is smaller."
- `skills[0].remediation[2].say`: "There's a road from home to the chai stall, 0 to 1 km. On top it's in 6 equal stretches. A toy walks and stops at the first mark. It's standing on a real spot of the road, and that spot's number is 1/6 km." → "There's a road from home to the chai stall, 0 to 1 km. On top it's in 7 equal stretches. A toy walks and stops at the first mark. It's standing on a real spot of the road, and that spot's number is 1/7 km."
- `skills[0].remediation[2].simpler`: "The toy isn't floating; it stands on one real spot of the road. That spot has a number too, 1/6 km." → "The toy isn't floating; it stands on one real spot of the road. That spot has a number too, 1/7 km."
- `skills[1].explain[0].simpler`: "A fraction's bottom number says how many gaps, its top says how many hops. Here: 4 gaps, 3 hops." → "A fraction's bottom number says how many equal gaps one whole has, its top says how many hops. Here: 8 gaps, 5 hops."
- `skills[1].explain[1].mustSay[1]`: "top equals bottom" → "top number and bottom number are equal"
- `skills[1].explain[1].point`: "The top line is cut into 3 equal gaps. Walk three gaps from 0 and you land exactly on 1, so there 3/3 = 1. When the top and the bottom are equal, the walk ends exactly on 1." → "The top line is cut into 3 equal gaps. Walk three gaps from 0 and you land exactly on 1, so there 3/3 = 1. When a fraction's top number and bottom number are equal, the walk ends exactly on 1."
- `skills[1].explain[1].simpler`: "Three gaps reached 1, because 3/3 = 1. With 1/5 gaps too, make the top match the bottom." → "Three gaps reached 1, because 3/3 = 1. With 1/5 hops too, make the fraction's top number match its bottom number."
- `skills[1].remediation[2].say`: "This is a highway from 0 to 1 km, with a stone every 1/5 km. The toy hops 4 times and stops on the fourth stone. It's on one stone, so it has one number: 4/5 km." → "This is a highway from 0 to 1 km, with a stone every 1/6 km. The toy hops 5 times and stops on the fifth stone after 0. It's on one stone, so it has one number: 5/6 km."
- `skills[1].remediation[2].simpler`: "The toy is on one stone. One spot, one number: 4/5 km." → "The toy is on one stone. One spot, one number: 5/6 km."
- `skills[1].bridgeToNext`: "When the top was smaller than the bottom, we stopped before 1. Both equal, like 4/4, and we landed right on 1. Now let's take the line on to 2." → "When the top was smaller than the bottom, we stopped before 1. Both equal, like 3/3, and we landed right on 1. Now let's take the line on to 2."
- `skills[2].explain[0].simpler`: "Remember, 4/4 = 1. With 1/3 hops too, some hops take you to 1, and the rest go past it." → "Remember, 4/4 = 1. Now think how many 1/5 hops make exactly 1, then compare your hops with that."
- `skills[2].remediation[0].say`: "On top the hops are 1/4 each, on a line from 0 to 2. The first 4 hops fill 0 to 1 completely, so the mark at 1 is 4/4. There's no room left inside for the fifth hop, so it lands past 1." → "On top the hops are 1/5 each, on a line from 0 to 2. The first 5 hops fill 0 to 1 completely, so the mark at 1 is 5/5. There's no room left inside for the sixth hop, so it lands past 1."
- `skills[2].remediation[0].simpler`: "4/4 = 1, so 0 to 1 is full. The fifth hop doesn't fit inside; it goes past 1." → "5/5 = 1, so 0 to 1 is full. The sixth hop doesn't fit inside; it goes past 1."
- `skills[2].remediation[1].say`: "Two marks on this line from 0 to 2: 7/8 and 7/4. In 7/8 the top 7 is less than the bottom 8, so it's before 1. In 7/4 the top 7 is more than the bottom 4, so it's past 1." → "Look at 7/8 and 7/4. Both fractions have 7 on top: 7 hops. But the same whole cut into 8 makes each piece smaller, half a 1/4 piece. So 7 short hops stop at 7/8, before 1, and 7 long hops reach 7/4, past 1."
- `skills[2].remediation[1].simpler`: "Top smaller than bottom means before 1; bigger means past 1. So 7/8 comes before, and 7/4 goes past." → "Both have 7 as the top number. A bigger bottom number means smaller pieces, so the 7 hops stop sooner. So 7/8 comes first, 7/4 goes further."
- `skills[0].explain[1].convey`: "same 0 to 1, now 4 marks inside → 5 equal gaps (gaps = marks inside + 1); bottom number = number of equal gaps in 0 to 1; first mark from 0 = end of 1 gap = 1/5; the name comes from gaps, not marks" → "same 0 to 1, now 6 marks inside → 7 equal gaps (gaps = marks inside + 1); bottom number = number of equal gaps in 0 to 1; first mark from 0 = end of 1 gap = 1/7; the name comes from gaps, not marks"
- `skills[0].explain[1].board.params.dens[0]`: 5 → 7
- `skills[0].explain[1].board.params.marks[0][1]`: 5 → 7
- `skills[0].explain[2].convey`: "the same 0 to 1 in 8 equal gaps → more gaps than the 5 before → each gap smaller; 1/8 = first mark, right next to 0; 1/2 still the middle mark (4 of the 8 gaps); more equal gaps in the same whole → each gap shorter → 1/8 sits closer to 0 than 1/5 and 1/2" → "the same 0 to 1 in 8 equal gaps → more gaps than the 7 before → each gap smaller; 1/8 = first mark, right next to 0; 1/2 still the middle mark (4 of the 8 gaps); more equal gaps in the same whole → each gap shorter → 1/8 sits closer to 0 than 1/7 and 1/2"
- `skills[0].remediation[0].move`: "ribbon at a tailor's shop, 0 to 1 m, one line cut in 6 on top and 12 below; marks = chalk marks (nishaan), gaps = ribbon pieces; marks inside + 1 = pieces; a mark's name comes from counting pieces, not marks; top: 5 marks → 6 pieces → first mark at 1/6 m; then below: 11 marks → 12 pieces → 1/12 m (the trap says 1/11)" → "ribbon at a tailor's shop, 0 to 1 m, one line cut in 7 on top and 12 below; marks = chalk marks (nishaan), gaps = ribbon pieces; marks inside + 1 = pieces; a mark's name comes from counting pieces, not marks; top: 6 marks → 7 pieces → first mark at 1/7 m; then below: 11 marks → 12 pieces → 1/12 m (the trap says 1/11)"
- `skills[0].remediation[0].board.params.dens[0]`: 6 → 7
- `skills[0].remediation[0].board.params.marks[0][1]`: 6 → 7
- `skills[0].remediation[1].move`: "one 0-to-1 line cut in 5 equal pieces on top and 6 below, both the same whole: 6 is the bigger number but the same whole shared into more pieces makes each piece smaller → bigger bottom number = smaller piece; then: 1/6 stops between 0 and 1/5, not after it" → "one 0-to-1 line cut in 2 equal pieces on top and 5 below, both the same whole: 5 is the bigger number but the same whole shared into more pieces makes each piece smaller → bigger bottom number = smaller piece; then, on its own fifths-and-sixths board: 1/6 stops between 0 and 1/5, not after it"
- `skills[0].remediation[1].board.params.dens[0]`: 5 → 2
- `skills[0].remediation[1].board.params.dens[1]`: 6 → 5
- `skills[0].remediation[1].board.params.marks[0][0]`: 5 → 1
- `skills[0].remediation[1].board.params.marks[0][1]`: 5 → 2
- `skills[0].remediation[1].board.params.marks[1]`: undefined → [1,5]
- `skills[0].remediation[2].move`: "road from home (0) to the chai stall (1 km), one line in 6 equal stretches on top; a toy walks from home and stops at the first mark → it stands on one real spot of the road → that spot has a number, 1/6 km; then the same road in 7 stretches below → 1/7 km" → "road from home (0) to the chai stall (1 km), one line in 7 equal stretches on top; a toy walks from home and stops at the first mark → it stands on one real spot of the road → that spot has a number, 1/7 km; then the same road in 6 stretches below: {friend} says the lower line's first mark has no number → wrong, that spot is a number too"
- `skills[0].remediation[2].board.params.dens[0]`: 6 → 7
- `skills[0].remediation[2].board.params.dens[1]`: 7 → 6
- `skills[0].remediation[2].board.params.marks[0][1]`: 6 → 7
- `skills[1].ladder[1].itemId`: "c5-maths-ch02-t01-i03" → "c5-maths-ch02-t01-i06"
- `skills[1].ladder[1].why`: "den 5: same den as the worked example → locate 3/5 by gaps moved from 0, now one step further than 2/5" → "den 3: before or after the middle with thirds → 1/3 before, 2/3 after; carries e3's middle test (sixths) to a den whose middle is not a mark"
- `skills[1].remediation[0].move`: "hop arrows instead of marks on one line, sixths on top: each hop = one equal gap = 1/6; hops start at 0, the start is not a hop; 2 hops of 1/6 → 2/6; then below: 4 marks → 5 gaps → 3rd mark = 3/5" → "hop arrows instead of marks on one line, sixths on top: each hop = one equal gap = 1/6; hops start at 0, the start is not a hop; 2 hops of 1/6 → 2/6; then below: 6 marks → 7 gaps → 3rd mark = 3/7"
- `skills[1].remediation[0].board.params.dens[1]`: 5 → 7
- `skills[1].remediation[2].move`: "km stones on a highway from 0 to 1 km, a stone every 1/5 km; a toy walks 4 stretches and stops → it stands on one single stone → that stone's number is 4/5 km, one point between 0 and 1, not two numbers" → "km stones on a highway from 0 to 1 km, a stone every 1/6 km; a toy walks 5 stretches and stops → it stands on one single stone → that stone's number is 5/6 km, one point between 0 and 1, not two numbers; then eighths: {friend} says the toy at the third stone stands on two numbers, 3 and 8 → say it as one number, 3/8 km"
- `skills[1].remediation[2].board.params.den`: 5 → 6
- `skills[1].remediation[2].board.params.marks[0].num`: 4 → 5
- `skills[1].remediation[2].board.params.marks[0].label`: "4/5" → "5/6"
- `skills[2].remediation[0].move`: "quarter-pieces laid end to end on a 0-to-2 line, no squeezing: 4 pieces fill 0 to 1 exactly → 1 is full → the 5th piece must go past 1; a fraction is a length, and lengths can exceed one whole" → "fifth-hops laid end to end on a 0-to-2 line, no squeezing: 5 hops fill 0 to 1 exactly → 1 is full → the 6th hop must go past 1; then below, sixths on laps: 7 hops → 7/6 lap; a fraction is a length, and lengths can exceed one whole"
- `skills[2].remediation[0].board.params.dens[0]`: 4 → 5
- `skills[2].remediation[0].board.params.marks[0][0]`: 4 → 5
- `skills[2].remediation[0].board.params.marks[0][1]`: 4 → 5

#### Round 2 (second reader, second-pilots-b.json, 2026-11-11)
Rewrites for a second read: rewrites-pilot-r2-c5-maths-ch02-t01.json. check.mjs (live, no LESSON_SCRIPTS_DIR): ok.
- **s1 c2 (checks[1]):** it was the same frame as e3.ask ("closer to 0"). It is now {friend}'s claim that 1/9 comes after 1/4 because 9 > 4, right or wrong. The prompt, accept, why and simpler changed; the board and answerBoard stayed (dens [4,9]). Key: 1/9 → wrong (wrongIfMis right).
- **s1 c3 (checks[2]):** e1's point names the middle mark 1/2, which gave the key away. The card now asks about 2/3 on a 0-to-3 line in thirds. The prompt, accept, wrongIfMis (near 3), board (den 3, to 3, target [2,3]), answerBoard (mark 2/3), why and simpler changed. Key: between 0 and 1 (unchanged).
- **s1 remediation[2].then:** the say acted out "the mark has a number". The then-card now asks for the number at the 5th mark after 0 on the lower line (6 stretches, 5 inner marks). The prompt, accept, wrongIfMis (5 and 6), why, simpler, answerBoard ([[1,7],[5,6]]) and move changed. Key: wrong → 5/6 km.
- **s2 e1 simpler:** "Yahan 8 gaps hain aur 5 hop" stated the ask's key in two pieces. It is now the general method. Key: 5/8 (unchanged).
- **s2 remediation[0].then:** s1 e2's point gave its denominator (6 marks → 7 gaps). It now has 9 marks between 0 and 1, and the 3rd mark is 3/10. The prompt, accept, wrongIfMis (3/9), why, board and r.board (dens [6,10]), answerBoard and move changed. Key: 3/7 → 3/10.
- **s2 remediation[2].then prompt:** "after 0" is back, and the clipped "do number." is fixed ("yeh 3 aur 8 hain"). Key: 3/8 km (unchanged).
- **s3 e3.ask:** this was the same "between which two wholes" frame as c1 (5/3). It now only groups in threes: "7/3 mein kitne poore group hain?" The prompt, accept, wrongIfMis (7), why and answerBoard (6/3, 7/3, hop 7) changed. Key: between 2 and 3 → 2.
- **s3 remediation[0]:** the say re-told e1.ask (fifths). It now uses eighths: 8 hops fill 0 to 1, so the 9th lands past 1. The say, simpler, move, r.board, then.board ([8,6], to 2, mark 8/8) and then.answerBoard changed. Then key: 7/6 (unchanged).
- **s3 remediation[1].then:** the say worked out 7/8 vs 7/4 on the then-card's own board. The then-card is now 9/5 vs 9/10 on a new line (dens [5,10], to 2). The prompt, accept, wrongIfMis, why, board, answerBoard and move changed. Key: 6/4 → 9/5.

#### Round 3 (third reader, third-pilots.json, 2026-11-11)
Main rule: a remediation's say and simpler are spoken over the then-card's board. They name nothing that board does not show and do not
work the then-card's own case. Rewrites are in rewrites-pilot-r3-c5-maths-ch02-t01.json. check.mjs (no LESSON_SCRIPTS_DIR): ok.

| card / field | old key | new key | change |
|---|---|---|---|
| s1 c3 (checks[2]) | between 0 and 1 (2/3 on a thirds line to 3; e1.ask's frame again, and a 2-hop fraction) | **1/9** (wrongIfMis "no number") | "The line from 0 to 1 is in 9 equal gaps. A toy walks along and stops at the first mark. {friend} says it is not standing on any number. What number is it on?" Board: fraction-line den 9, mark 1. Answer board: 1/9 labelled. The why and simpler are new. The prompt says "chalkar" rather than "0 se chala" so that it does not reuse s2 rem0.then's exact numbers (0 0 1 9). |
| s1 c2 (checks[1]), knock-on | wrong | wrong | The pair changed from 1/9 vs 1/4 to **1/11 vs 1/4**. c2's why and answer board placed 1/9 at the first ninths mark, which is c3's new key. Each den from 2 to 12 is already a first-mark value somewhere in s1, and only 9 could be freed this way: the checker refused 5, 6, 12 and 15. Board dens [4,11]. The why, simpler and answer board changed to match. |
| s1 rem1.say, simpler (+ move) | between 0 and 1/5 | same | The say named 2 pieces on top and 5 below, over the then-card's board of fifths and sixths. Now it states the general rule: "the same line, the same whole; the bigger a fraction's bottom number, the more pieces, the smaller each". The simpler's "5 is the bigger number" compared 5 with a 2 that is not on the board, and is now general. |
| s2 rem2.say, simpler (+ move) | 3/8 km | same | The highway was in sixths with the toy at 5/6 km, over the then-card's board of eighths. Now: "each mark is a stone, one real spot; wherever the toy stops, one place, one number". The simpler's "5/6 km" was dropped. |
| s3 rem1.say, simpler (+ move) | 9/5 | same | The say walked 7/8 and 7/4 over the then-card's board of fifths and tenths. Now it states the same-top rule as a method: same hop count, a bigger bottom means shorter hops, so the hops stop sooner. The simpler asks "whose one hop is longer, the top line's or the bottom line's?" |
| s3 rem2.say, simpler (+ move), **not in the listed nine** | 8/5 | same | The say put the train at 7/5, but the then-card's board marks the 8th fifth. Now it gives the method only: "wherever the train stops: the parts counted from 0, over 5, one number". "Upar/neeche" was dropped so that the then-card's "3 hisse aage" is not read as a 3-part claim (W10). |
| s3 c2 (checks[1]) | 5/4 (5/4 vs 5/8; its why and answer board gave ladder i04) | **11/6** (wrongIfMis 11/12) | "A line from 0 to 2. 11 hops of 1/6, or 11 hops of 1/12: which goes further from 0?" Board dens [6,12], to 2. The why, simpler, accept and answer board are new. |
| s3 e3.ask wrongIfMis | 2 (wrongIfMis "7") | 2 (wrongIfMis **"0"**) | "7" was not a sign of all-less-than-one. A child who thinks 7/3 < 1 finds no full group. |
| s3 ladder | i04, i14, i10, rl-h3 | **i04, i14, i10** | rl-h3 used c1's between-which-wholes frame again, on thirds, and e3's answer board (7/3 just past 2) showed its answer. Dropping it fixes both, so e3's numbers stay. |

#### Keys re-solved
s1 c3: 9 equal gaps, so the first mark is 1/9. s1 c2: 1/11 < 1/4, so 1/11 stops first and the claim is wrong. s3 c2: 11/6 = 1 5/6 and 11/12 < 1, so 11/6 is further (a 1/6 hop = two 1/12 hops). s3 e3: 7/3 = 2 groups of 3 plus 1, so 2. Unchanged then-keys: 1/5 > 1/6, so 1/6 sits between 0 and 1/5. 3/8 km. 9/5 > 1 > 9/10, so 9/5. 5/5 + 3 = 8/5.
Marks counted: s1 c3, den 9, mark 1 (8 inner marks). s1 c2 answer board [1,4], [1,11]. s3 c2 answer board: [11,6] one sixth before 2 and [11,12] one twelfth before 1. Every den is 2-12 and every line runs to 1 or 2.

#### Tests
385 pass, 1 fail: P6 (tests/r8-picture-turn.test.mjs:82), from the c5-t02 board change. Not edited.

## c5-maths-ch02-t02

### c5-maths-ch02-t02 (live pilot): changes after the independent read

These are the cards and fields I changed in `data/lesson-scripts/c5-maths-ch02-t02.json`. "Key" means old key → new key. The spoken text, old and new, is in `rewrites-pilot-c5-maths-ch02-t02.json`.

#### s1
- **e1 ask:** fixed the prompt's wording: "pehle se" became "upar wale ek hisse se". The pose board's second bar label "?" became "". Key: smaller → smaller.
- **e2 (point, ask, simpler):** this card used to ask e1's question again (1/4 or 1/8). It now asks which fraction of the top bar two 1/8 parts make. The point and the simpler no longer say "each part splits in two". wrongIfMis "1/8" was removed. The answerBoard shows 1/4 over 2/8. Key: 1/4 → 1/4.
- **workedExample:** the problem, simpler, givens, step 2 result and simpler, yourStep board, why and accept, answer, why and boards all changed from 1/6 vs 1/3 to 1/8 vs 1/2. Key: Sana → Sana.
- **c1 simpler:** "Roti wahi hai" became "Dono roti ek jaisi hain". Key: 1/5 → 1/5.
- **c3:** the 4-part line compared with 1/8 became a 3-part line compared with 1/5. The prompt, accept, board, why, answerBoard and simpler all changed. Key: bigger → bigger.
- **remediation[0].then:** the identical bottles story became kite strings. Its numbers stay 1/6 vs 1/12, because 1/4, 1/3 and 1/5 are keys of cards that come later and the checker refuses them. The board is unchanged. Key: Ravi → Ravi.
- **ladder i01 note (not spoken):** now reads "1/3 vs 1/9, a new pair after 1/4 vs 1/8".

#### s2
- **The lesson pair 3/7 vs 5/7 became 2/7 vs 4/7**, so ladder i02 is new to the child. Changed: hook convey and both interest slots; e1 convey, mustSay, board, point, ask prompt, accept, why, board and answerBoard; e2 convey, mustSay, board, point, ask prompt, accept, why and answerBoard.
  - e1 key: 5/7 → 4/7.
  - e2 key: no → no.
- **c1:** Ben 2/4 vs 3/12 became Ben 3/5 vs {friend} 5/10. The prompt, accept, board, why, answerBoard and simpler changed. Key: Ben → Ben. I did not use the reader's 2/3 vs 4/10, because it would ask e4's 2/3 vs 3/10 again.
- **remediation[0] say and move:** the say gives the general step rule and no longer says 6/7 is bigger. The then-card is unchanged. Key: Gopi → Gopi.
- **remediation[2] say and move:** the say no longer concludes which gap is smaller. Key: 9/10 → 9/10.
- **ladder i02 note (not spoken):** now reads "a new pair after 2/7 vs 4/7".

#### s3
- **e2 ask:** Tanvi now claims "3/5 > 3/8, because the 1/5 pieces are bigger". The prompt, accept and why changed, and wrongIfMis is now "no". The yes/no keys in the script are now s2 "no" and s3 "yes". Key: no → yes.
- **e4:** the point is now the general method over the ask's own 4/8 line (1/4 sits over 2/8). It no longer says "3/4 = six steps". Also changed: convey, mustSay (3/4, 3/8 → 1/4, 2/8), the explain board (marks for 3/8 and 3/4 removed) and the simpler. The ask's targets (gap-thinking) was removed. Key: 5/8 → 5/8.
- **workedExample.yourStep board:** the labels "?" became "". Key: Isha → Isha.
- **c2:** fixed the prompt's wording to "Gopi ... leta hai", and the board labels "?" became "". Key: Gopi → Gopi.
- **c3:** 4/5 vs 5/6 became 6/7 vs 8/9. The prompt, accept, board, why, answerBoard and simpler changed. Key: 5/6 → 8/9.
- **remediation[0]:** the say no longer states that 1/7 is bigger than 1/9. The strips are now 6 and 10. The move and simpler changed, and the then-card changed from 3/7 vs 3/9 to 4/6 vs 4/10 (prompt, accept, board, why, answerBoard, simpler). Key: 3/7 → 4/6.
- **remediation[1] say and move:** the say no longer works through 2/12 vs 2/4, and it drops the rule that is false at the edge. Key: 3/4 → 3/4.
- **remediation[2] say and move:** the say no longer concludes which gap is smaller. Key: 11/12 → 11/12.
- **ladder i03 note (not spoken):** now reads "a new pair after the worked example's 2/7 vs 2/3".

#### Round 2 (second reader, second-pilots-b.json, 2026-11-11)
Rewrites for a second read: rewrites-pilot-r2-c5-maths-ch02-t02.json. check.mjs (live, no LESSON_SCRIPTS_DIR): ok.
- **s1 remediation[0].then:** this was still ladder rl-o1's frame (a person takes 1/6, who has more). It is now 1/8 vs 1/12 kite-string pieces with a fraction key. The prompt, accept, wrongIfMis (1/12), why, board (dens [8,12]), answerBoard and move changed. Key: Ravi → 1/8.
- **s2 remediation[0] say:** "Bhinn ke neeche ka 7 / Bhinn ke upar ka number" is restored. "sab ek size ke" was dropped to stay within 45 words; "Kadam ek jaise hon" still carries it. Then key: Gopi (unchanged).
- **s3 c1 (checks[0]):** this was the same frame as e3.ask (2/9 vs 2/5). It is now {friend}'s claim that 4/7 = 4/9 because both have 4 on top; the child says whether that is right and, if not, which is bigger. The prompt, accept, why and simpler changed; the board stayed. The prompt says "chocolate", not "bar", because the card is posed on a line. Key: 4/7 (unchanged).

#### Round 3 (third reader, third-pilots.json, 2026-11-11)
Rewrites are in rewrites-pilot-r3-c5-maths-ch02-t02.json. check.mjs (no LESSON_SCRIPTS_DIR): ok.

| card / field | old key | new key | change |
|---|---|---|---|
| s3 c1 (checks[0]) | 4/7 ("{friend} says 4/7 = 4/9 … Right? If not, which is bigger": it answered its own yes/no, and the tail was e3.ask's frame) | **4/9, 4/7, 4/5** (wrongIfMis "they are all equal") | This is the reader's fix: "Three identical chocolates: 4/5, 4/9, 4/7 taken. {friend} says all three are equal, since each is 4 pieces. Put them in order from smallest to biggest." Board: fraction-bars [5,9,7], unshaded. Answer board: bars 9, 7, 5 with 4 shaded and labelled. The why, simpler and accept are new. The simpler avoids "dekho … 4 tukde", which W10 reads as a 4-part claim. |
| s1 ladder | i01, i05, i04, rl-o1, rl-h1 | **i01, i05, i04, rl-o1** | s1 asked "order three unit fractions" three times (c2, i04, rl-h1), and c2's why gave rl-h1's first item (1/12). I dropped rl-h1 and did not add i07 or i08: their pair, 1/8 vs 1/4, is e1.ask's question and appears in e3's point ("1/8 < 1/4"). Four rungs remain. |
| s1 rem0.say, **checker rule added this round** | 1/8 | same | It said "1/2 is mid-line", which is not on the then-card's board (eighths and twelfths). Now it says only what that board shows (12 parts, one part stops by zero) and the rule. |
| s2 rem1.say, simpler, **checker rule** | 2/4 | same | It named 1/4, 1/12 and 2/12 over the then-card's unlabelled bars of 4 and 12. Now: "one part on top is as long as three pieces below; even two pieces below are smaller than one on top". The wording is "teen tukdon", not "teen hisson", which W10 reads as a 3-part claim. |
| s3 e2.ask prompt, **checker rule (f)** | yes | yes | "Kya Tanvi sahi hai, haan ya nahi?" was read as a Yes keyed on a negated claim. The tail "haan ya nahi / yes or no" is gone. The claim itself was already positive. |

#### Keys re-solved
s3 c1: 1/9 < 1/7 < 1/5, and with 4 pieces each, 4/9 < 4/7 < 4/5. The other keys are unchanged: s1 rem0.then 1/8 > 1/12, s2 rem1.then 2/4 = 6/12 > 5/12, s3 e2 3/5 > 3/8, so yes.

#### Tests
385 pass, 1 fail. P6 (tests/r8-picture-turn.test.mjs:82; test at :46) pins the pilots' board counts. s3 c1 moved from a number line to three bars, so fraction-bars went from 19/21 to 19/22 and fraction-line from 47/65 to 47/64. The new bars board gets no view, which is the same as every other three-bar board. Not edited.

## c6-maths-ch06-t01

### c6-maths-ch06-t01 (live pilot): changes after the reader's verdict

File: /home/user/Taxila/data/lesson-scripts/c6-maths-ch06-t01.json. Kit unchanged.

#### Keys and numbers
| Card | Old | New |
|---|---|---|
| s2 c2 | table mat 9 cm × 5 cm, lace; key 28 cm, wrongIfMis 45 cm | greeting card 16 cm × 9 cm, golden border; key **50 cm**, wrongIfMis **144 cm** (the area slip 16 × 9); board measured@1 16×9, answerBoard area-grid@1 16×9 |

All other keys are unchanged: 15, 30, 20, 28, 30, 28 (s1 c2), 29, 46, 32, 34, 24, 84, 130, 44, 54, 26, 15, 10, 38, 480, 21, ₹1500, 15, 17, ₹600.

#### Spoken fields (same key)
- s1 remediation[0].say: dropped "Aksar aakhri bhuja chhootti hai / The last side is often missed" (gave away ladder i10's word key). Now "Ek bhi bhuja chhooti toh jod adhoora hai / Miss even one side and the sum is unfinished". Also "jaise" became "jaise-jaise".
- s1 c2 prompt, why and simpler: lace became tape, because i09 asks about lace. Key 28 cm unchanged.
- s1 bridgeToNext (hi/en and simpler): "hamesha chalta hai / always works" now reads "seedhi bhujaon wali (har) shape mein / for any shape with straight sides". "Ab is rectangle ko dekho" became "Ab ek rectangle socho".
- s2 workedExample.givens[0].en: "width" became "breadth".
- s2 remediation[0].say and then.prompt: "meter" became "counter" ("ek counter ginti karta hai", "counter 19", "Uska counter kitna dikhayega?"). Key 54 m unchanged.
- s3 e1 point: "bata hai" became "banta hua hai". s3 c1 why: "bata" became "banta".
- s3 e3 point: "Par dekho, ek bhuja par 2 m ka gate hai" now reads "Ab socho, neeche wali 12 m ki bhuja mein 2 m ka gate hai" ("Now suppose the bottom 12 m side has a 2 m gate in it"). Key 38 m unchanged.

#### Boards
- s3 e3 board: was shape@1 rectangle, side "2 m gate", name "plot 12 m × 8 m". Now measured@1 rect, w 12, h 8, unit m, name, trace. The ask's answerBoard was shape@1 with side "2 m gate" and name "taar 40 - 2 = 38 m". Now shape@1 rectangle with only the name "taar 40 - 2 = 38 m".
- s3 workedExample.yourStep.answerBoard: was shape@1, side "1 chakkar 160 m", name "3 × 160 = 480 m". Now shape@1 rectangle with only the name "3 × 160 = 480 m". I tried the reader's measured@1 50×30 first. The checker refuses it under we.answer (W17.her_numbers: 480, 160 and 3 are not on that board).

#### Not spoken
- s2 ladder[3]: i06 (the "why 2 × (l + b)" item, said three times before it) became **i05** (double a square's side: what happens to the perimeter). The script does not answer i05.
- s2 remediation[1].move: "7 × 2 counts tiles" became "11 × 2 counts tiles".
- s3 remediation[0].move: "18 m by 12 m → 60 m round, half = 30 m = 18 + 12" became "a 90 m round with a 28 m length → halve the 90 first (one length + one breadth), then take away the 28".

### Round 2 (2026-11-11): the second reader's verdicts (second-pilots-a.json, pass:false and new)

File: data/lesson-scripts/c6-maths-ch06-t01.json (live). Kit not edited. Spoken rewrites: readers/rewrites-pilot-r2-c6-maths-ch06-t01.json.
check.mjs (no LESSON_SCRIPTS_DIR): ok.

| card / field | old key | new key | change |
|---|---|---|---|
| s1 c1 [75] | 30 m (six-sided L-room, which echoes rl-h1 and i10) | **26 m** (wrongIfMis 22 m) | Now a four-sided park, 9, 6, 7, 4 m. Board: measured quadrilateral. The why and simpler changed to match. |
| s1 c2 [54] | 28 cm | 28 cm | Now an error spot: "{friendF} said 10 × 4 = 40 cm for tape round a 10 cm × 4 cm card. How much tape is really needed?" (wrongIfMis 40 cm). It is no longer e3's "string once round a rectangle" question. |
| s1 ladder [75] | i03, i09, i10, rl-h1 | **i09, i10, rl-h1** | i03 (a plain triangle sum) repeated e1. rl-h1 stays because c1 is no longer six-sided, and a ladder needs at least 3 rungs. |
| s1 rem1.say + new board [74] | 46 cm | 46 cm | The say teaches on its own 13 cm × 6 cm rectangle (board measured rect 13×6). The then-card's 14 × 9 label is unchanged. |
| s2 rem0 (move, say, new board) [60] | 54 m | 54 m | The ant walks its own 13 m × 7 m field (counter 13, then halfway, two sides from home). The then-card's 19 × 8 field is unchanged. The reader's 15 × 6 was refused: 15 is the key of s3 e1 and c3. |
| s2 rem1 (move, say, new board) | 26 cm | 26 cm | The reader did not list this, but it is the same fault as [74]: the say used its then-card's own 11 × 2 bookmark. It now uses its own 12 cm × 3 cm rectangle. |
| s2 ladder [75] | i01, i02, i04, i05, rl-h2 | **i01, i04, i05, rl-h2** | i02 (square, side → perimeter) was the third such question after e3 and c3. |
| s3 rem0 (move, say, new board) [74] | 17 m | 17 m | The say uses its own rectangle with a 46 m edge and a 13 m length (board shape@1 "parimap 46 m", side "13 m"). The reader's 70/20 is s3 c3's own numbers. The checker refused 50 (c3's distractor) and 42 (c1's distractor). The then-card's 90 m / 28 m pond is unchanged. |
| s3 rem1 (say, new board) [74] | ₹600 | ₹600 | The say uses its own 14 m × 5 m plot. The then-card's 9 × 6 plot is unchanged. |

Keys re-solved: s1 c1 9 + 6 + 7 + 4 = 26 (missing the last side: 22). s1 c2 10 + 4 + 10 + 4 = 28. The then-cards are unchanged:
29, 46, 54, 26, 17 (90 ÷ 2 − 28), ₹600 (2 × 15 × 20). None of the new say numbers states or computes a key.

Test pinned by this change (not edited): P6, tests/r8-picture-turn.test.mjs:81 (assert at :77). It counts the pilots' boards per
template. The five new remediation boards change measured@1 "20/21" → "24/25" and shape@1 "1/6" → "1/7".

### Round 3 (2026-11-11): the third reader's verdicts (third-pilots.json, pass:false)
Every say listed is spoken over its then-card's rectangle, so each is now the general method, with no numbers. These are the reader's
own texts. The then-cards, keys and boards are unchanged. The rem moves dropped their own numbers too. The rem.boards are kept: they are
drawn only in a help re-teach, where the general says still fit. Rewrites are in rewrites-pilot-r3-c6-maths-ch06-t01.json.
check.mjs (no LESSON_SCRIPTS_DIR): ok.

| field | then-key | change |
|---|---|---|
| s1 c2 prompt | 28 cm | Language fix: "{friendF} ne kaha ki 10 cm lambe, 4 cm chaude card ke kinaare par 10 × 4 = 40 cm tape lagegi. Sahi mein kitni tape lagegi?" The key is unchanged. |
| s1 rem1.say | 46 cm | "Yeh rectangle 13 cm lamba, 6 cm chauda" over a 14 × 9 label became the thread-and-tiles method. |
| s2 rem0.say | 54 m | The ant walked 13 m and 7 m over a 19 × 8 field. It still walks to the opposite corner and stops at l + b, now without numbers. |
| s2 rem1.say | 26 cm | "Yeh rectangle 12 cm lamba, 3 cm chauda" over an 11 × 2 bookmark became "tiles inside = area, square cm; thread on the edge, add the four edges, cm". |
| s3 rem0.say | 17 m | "46 m, length 13 m" over the 90 m / 28 m pond became "a full round = 2 lengths + 2 breadths; halve first, then subtract the length". |
| s3 rem1.say | ₹600 | "Yeh plot 14 m lamba, 5 m chauda" over a 9 × 6 plot became "l × b is the ground; find the edge's full length, then multiply by the price per metre". |

#### Keys (unchanged, re-checked)
2 × (10 + 4) = 28. 2 × (14 + 9) = 46. 2 × (19 + 8) = 54. 2 × (11 + 2) = 26. 90 ÷ 2 − 28 = 17. 2 × (9 + 6) × 20 = ₹600. None of the says states or works these.

#### Tests
385 pass, 1 fail: P6 (tests/r8-picture-turn.test.mjs:82), from the c5-t02 board change. c6's own counts (measured 24/25, shape 1/7) are unchanged.

## Final hand round (after round 3's read)

- c4: s3 ladder i16 swapped for i14; the own boards of s1 rem1, s2 rem0 and s2 rem1 removed (their says are general).
- c5-t01: rl-o1 dropped from s1's ladder; s3 rem1's say reworded ('utne hi hop', where 'ek ho' could be heard as 'is 1'); the own boards of s1 rem1 and s3 rem1 removed.
- c5-t02: s1 rem0's say says '12 ek bada number hai'; i04 dropped from s1's ladder; s3 e3's point is the general rule (piece size decides when the count matches), and its mustSay is 'tukde ka size' instead of '3/5 > 3/8', which named fractions not on the ask's board.
- c6: s3 rem0's say and simpler now cover a square too (share by 4), because the square cards e1 and c1 route to it; all five remediation own-boards removed.
