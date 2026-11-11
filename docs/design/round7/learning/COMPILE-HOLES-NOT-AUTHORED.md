# Compile holes Learning did not fill, with reasons (for main's ruling with Brain)

**Source:** `scripts/lesson-scripts/compile-report.mjs` over `server/director/compile.js` (claude/r4-conversation), run after
Learning's pilot batch. Ruling: dc-r8-second-clarify-shows-not-rewords, rule 4.

## Pilots: 41 holes → 31 filled, 10 listed here
Filled:
- 12 worked-problem simplers (`workedExample.simpler`).
- 8 bridge simplers (`bridgeToNext.simpler`).
- 9 yourStep whys (`workedExample.yourStep.why`).
- 2 card `targets`, each pointing at the skill's existing remediation for the mix-up its wrong answer shows:
  - c5-t01 s3 e2 (answering "1") → `all-less-than-one`.
  - c5-t02 s3 e4 (picking 2/4) → `gap-thinking`.

## The 10 not filled, all one kind: `card remediation` / `your_step remediation` with `targets=undefined`
The rule asks for "the remediation for the mix-up the card targets". These cards target no mix-up: there is no `targets`
field, and the card is a straight computation or reading with no wrong answer tied to a kit misconception. Writing a
remediation for them would invent a mix-up the kit does not have.

| Card | What it asks | Why there is no mix-up |
|---|---|---|
| c4-maths-ch05-t01 s2 e1 | half of 12 laddoos | a sharing computation; a wrong answer is a slip, not one of the topic's two mix-ups (part-part, unequal-parts) |
| c4-maths-ch05-t01 s2 e2 | 1/3 of 24 mangoes | the same |
| c4-maths-ch05-t01 s2 e3 | 1/4 of 20 marbles | the same |
| c4-maths-ch05-t01 s2 yourStep | 15 pencils in 3 equal groups | the same |
| c5-maths-ch02-t01 s2 e1 | 3 hops on quarters → 3/4 | counting hops on a line already cut into gaps; no marks to miscount |
| c5-maths-ch02-t01 s2 e2 | hops of 1/5 to reach 1 → 5 | **is** count-marks (a child who says 4 counts marks). But that remediation's then-card teaches on fifths (3/5), so making it callable from e2 states e2's own key: check.mjs refuses it. Either Brain lets a card's own remediation state its key once the card is answered wrong, or the remediation is re-authored on another denominator. Main's call. |
| c5-maths-ch02-t01 s2 e3 | is 4/6 before or after the middle | a judgement on one line; none of the four kit mix-ups produces "before" |
| c5-maths-ch02-t02 s2 e1 | colour 5 of 7 parts → 5/7 | naming a fraction from a picture; no mix-up |
| c5-maths-ch02-t02 s3 e1 | 3 of 8 coloured → 3/8 | the same |
| c6-maths-ch06-t01 s3 e3 | fence leaving out the gate → 38 m | a subtraction after a perimeter; neither l-plus-b nor area-perimeter applies |

**What I propose for the rule.** The `card/misconception` and `your_step/misconception` cells apply only when the card has
`targets`. A wrong answer with no recognised mix-up goes to the `wrong` column, which the scripts already serve (the
card's simpler, then its key). `byMixup` still routes a recognised kit mix-up to that mix-up's remediation.


## Staged 30 (after dc-r8-second-clarify-shows-not-rewords, approved)
Filled: 90 worked-problem simplers, 60 bridge simplers, 6 yourStep whys, and **5 card `targets`**. Each of the five points at
the skill's existing remediation for the mix-up the card's wrong answer shows:
- c4-ch06-t01 s2 e3 and its yourStep (460 cm and 550 cm into m and cm) → m-is-10cm;
- c5-ch05-t01 s2 e3 (6200 m into km and m) → km-100m;
- c6-ch07-t05 s3 e1 and e2 (adding mixed fractions) → add-across;

The 109 cards below have no `targets`, so under the ruling their misconception cells do not apply. On each, either no kit
mix-up of the skill produces a wrong answer, or the mix-up gives the right answer anyway. A sixth card, c6-ch07-t04 s3 e4 (3/4 vs 9/8), was first given only-num-den, then removed: its remediation compares each fraction with 1/2, but both fractions are above 1/2 (it is 9/8 > 1 that decides), so the remediation cannot help. Examples: ordering 6271, 1890
and 4302 by thousands only still gives the right order; odd/even of 9 + 6 does not test odd + odd. Only one of them records
a distractor (c4-ch07-t01 s1 e2, "Yes"), and that answer is a slip, not misaligned columns.

| Card | Asks | Key |
|---|---|---|
| c4-maths-ch01-t02 s1 e1 | All the corners of this square are the same. How many right angles does this square have i | 4 |
| c4-maths-ch01-t02 s1 e2 | The tester is put on a corner of a table. Some empty space is left between the corner and  | No |
| c4-maths-ch01-t02 s1 yourStep | The tester fits exactly. So what kind of angle is the window's corner? | right angle |
| c4-maths-ch01-t02 s2 e1 | The tip of a cake slice is narrower than the tester. Is the tip's angle less or more than  | kam |
| c4-maths-ch01-t02 s3 e1 | One point on the edge of this circle is 4 cm from the centre. Will another point on the ed | barabar |
| c4-maths-ch01-t02 s3 e3 | Near this circle there is a mark 4 m from the peg. Is that mark on this circle, yes or no? | No |
| c4-maths-ch01-t02 s3 yourStep | Now add the lengths on both sides. How long is the whole line? | 100 cm |
| c4-maths-ch03-t01 s1 e1 | One more child comes to the 4 pairs on the board. Will a child now be without a partner, y | Yes |
| c4-maths-ch03-t01 s1 e2 | 2 more children join the 7 children, so now there are 9. Is 9 odd or even? | Odd |
| c4-maths-ch03-t01 s1 yourStep | One bangle is left alone without a pair. So is 11 odd or even? | Odd |
| c4-maths-ch03-t01 s2 e2 | A train's number is 12153. Which column on the board does its ones digit go in, Even or Od | Odd |
| c4-maths-ch03-t01 s2 yourStep | In the 7 ones, 1 is left alone. So is 247 odd or even? | Odd |
| c4-maths-ch03-t01 s3 e2 | One basket has 9 mangoes and another has 6 mangoes. Will the total number of mangoes be od | Odd |
| c4-maths-ch03-t01 s3 yourStep | Now put both baskets together: the pairs stay pairs, and only 1 mango is alone. So is the  | Odd |
| c4-maths-ch03-t02 s1 e1 | Continue the board's pattern 4, 7, 10, 13. Of the two numbers that come after 13, which is | 19 |
| c4-maths-ch03-t02 s1 yourStep | Now use this rule on the last number, 22. Which number comes after 22? | 27 |
| c4-maths-ch03-t02 s3 e1 | We want to make 5 joined squares in a row, like on the board. How many sticks will it take | 16 |
| c4-maths-ch04-t01 s1 e1 | In this same chart, if the thousands place has 5, the hundreds place 1, the tens place 4 a | 5146 |
| c4-maths-ch04-t01 s2 e3 | Now there are 5 thousand-blocks, 1 hundred-block, 7 ten-blocks and 8 single cubes. What nu | 5178 |
| c4-maths-ch04-t02 s2 e1 | Now put 6271, 1890 and 4302 in order from smallest to biggest. | 1890, 4302, 6271 |
| c4-maths-ch04-t02 s3 e1 | On this same line from 0 to 10000, where does 7000 go? Which mark after 0? | 7 |
| c4-maths-ch04-t02 s3 yourStep | Now how many jumps are there from the 6800 mark to 7000? | 2 |
| c4-maths-ch07-t01 s1 e2 | Now change the bottom number in this same sum: 2567 + 1382. Will a carry go from the ones  | No |
| c4-maths-ch07-t01 s1 yourStep | Now add the hundreds and the thousands, with the carry. How many books does the library ha | 4363 |
| c4-maths-ch07-t01 s3 e2 | The trip was 1360 km by train and 485 km by bus. How many km was the whole trip? | 1845 |
| c4-maths-ch09-t01 s1 e3 | Find 9 × 4 the same way. Start from 10 × 4 = 40. What is 9 × 4? | 36 |
| c4-maths-ch09-t01 s1 yourStep | But each packet has 9, not 10, so each packet has 1 fewer. So take 7 away from 70. How man | 63 |
| c4-maths-ch09-t01 s2 e4 | 4 × 8 = 32. So what is 8 × 8? | 64 |
| c4-maths-ch09-t01 s2 yourStep | Now double 28. What is 28 + 28, that is, what is 8 × 7? | 56 |
| c4-maths-ch09-t01 s3 e2 | Without multiplying, tell me: will the answer to 5 × 7 end in 0, yes or no? | No |
| c4-maths-ch09-t01 s3 e3 | 2 × 9 = 18. So what is 4 × 9? | 36 |
| c5-maths-ch01-t01 s1 e3 | In the same way, splitting into lakh, thousand and the rest, read 2,09,050 in words. What  | two lakh nine thousand fifty |
| c5-maths-ch01-t01 s2 e3 | In the same way, read 4,52,018 group by group in words. What do you say? | four lakh fifty-two thousand eighteen |
| c5-maths-ch01-t01 s2 yourStep | Now read 6,09,275 group by group in words: lakh, thousand, then the rest. What do you say? | six lakh nine thousand two hundred seventy-five |
| c5-maths-ch01-t01 s3 e2 | Compare from the left the same way. Which is bigger: 64,280 or 64,820? | 64,820 |
| c5-maths-ch02-t03 s1 e1 | Below, the same strip is folded down the middle three times, so it has 8 equal parts. The  | 4 |
| c5-maths-ch02-t03 s1 e2 | This time the bottom strip's parts were cut further, into 12 equal pieces. How many of the | 6 |
| c5-maths-ch02-t03 s1 e3 | On this same line, you go from 0 to 3/4. How many 1/8 parts does that take? | 6 |
| c5-maths-ch02-t03 s1 yourStep | The third fold splits every part into two smaller parts again, so the hanky has 8 equal pa | 4 |
| c5-maths-ch02-t03 s2 e1 | Below is the same bar, but every part is split into 2 smaller equal parts, so 10 parts. Th | 4 |
| c5-maths-ch02-t03 s3 e2 | The bar below, in 12 parts, is the same one, and 1/3 = 4/12. By which one number were the  | 4 |
| c5-maths-ch02-t03 s3 e3 | Check the same way: are 1/2 and 2/6 equal fractions, yes or no? | no |
| c5-maths-ch03-t02 s1 e1 | The shaded part of the circle is one paper corner, a quarter turn. How many such corners p | 4 |
| c5-maths-ch03-t02 s2 e2 | The other arm of angle B also goes outside the paper corner, and the two arms do not make  | obtuse |
| c5-maths-ch03-t02 s2 yourStep | An angle bigger than a right angle and smaller than a half turn: is it acute or obtuse? | obtuse |
| c5-maths-ch05-t01 s1 yourStep | 2 rounds make 500 m. How many rounds in all make the full 1000 m? | 4 |
| c5-maths-ch05-t01 s3 e1 | We need to measure the length of an eraser. Will we use cm or m? | cm |
| c5-maths-ch05-t01 s3 yourStep | Now choose the unit for the train journey from Jaipur to Delhi: cm, m or km? | km |
| c5-maths-ch13-t01 s1 e1 | After four jumps the frog is on 12. On which number will it be after its fifth jump? | 15 |
| c5-maths-ch13-t01 s1 e2 | Continue the list of multiples of 8. What is the next multiple of 8 after 32? | 40 |
| c5-maths-ch13-t01 s1 yourStep | Now look at the lists from both steps. Will the piggy bank ever hold exactly ₹50, yes or n | No |
| c5-maths-ch13-t01 s2 e1 | The 2-jumper and the 3-jumper keep jumping on. After 12, what is the next number where bot | 18 |
| c5-maths-ch13-t01 s2 e2 | Continue both lists, for 4 and for 6. What is their third common multiple? | 36 |
| c5-maths-ch13-t01 s3 e1 | After the 12-minute mark, how many minutes from the start will these two bells next ring t | 24 |
| c5-maths-ch13-t02 s1 e1 | If we set these same 12 chairs in 2 equal rows, how many chairs will be in each row? | 6 |
| c5-maths-ch13-t02 s3 e1 | Carry these jumps of 7 further. Is 7 a factor of 30, yes or no? | no |
| c5-maths-ch13-t02 s3 yourStep | We have reached 9 × 4 = 36. How many jumps of 9 from 0 does it take to reach exactly 45? | 5 |
| c6-maths-ch02-t01 s1 e1 | The bottom edge of the blackboard goes from one corner to the other corner, and we can mea | line segment |
| c6-maths-ch02-t01 s2 e1 | A line segment has endpoints M and N. One name for it is MN. What is its other name? | NM |
| c6-maths-ch02-t02 s1 e1 | There is a point B on the upper arm. What is that arm's name: ray OB or ray BO? | ray OB |
| c6-maths-ch02-t02 s2 e1 | On the board, whose second arm has turned more, so which angle is bigger: A or B? | angle B |
| c6-maths-ch02-t02 s2 e2 | The half turn from 12 to 6 equals how many quarter turns? | 2 |
| c6-maths-ch02-t02 s2 yourStep | Now compare the two turns. At which time is the angle between the hands bigger: 2 o'clock  | 4 baje |
| c6-maths-ch02-t02 s3 e1 | Place a copy of angle P on angle Q this way. Whose second arm stays outside, that is, whic | angle Q |
| c6-maths-ch02-t03 s2 e1 | If the arm on the board turns one more quarter turn, how many degrees will it have turned  | 180° |
| c6-maths-ch02-t04 s1 e1 | What type is the 40° angle on the board: acute or right angle? | acute |
| c6-maths-ch02-t04 s1 e2 | And what type is the 130° angle on the board: acute or obtuse? | obtuse |
| c6-maths-ch02-t04 s1 yourStep | Now look at 145°. It is more than 90° and less than 180°. What type is it: acute, right or | obtuse |
| c6-maths-ch02-t04 s3 e1 | How many degrees is the smaller 5 o'clock angle on the board? | 150° |
| c6-maths-ch05-t01 s1 e1 | Lay these same 12 tiles in 2 equal rows. How many tiles go in each row? | 6 |
| c6-maths-ch05-t01 s1 yourStep | The fifth multiple, that is 28 × 5, is how much? | 140 |
| c6-maths-ch05-t01 s2 e2 | Put 21 pencils equally into these same 3 packs too. How many pencils go in each pack? | 7 |
| c6-maths-ch05-t01 s3 e1 | The game goes on. After 15, at which number does the next 'idli-vada' come? | 30 |
| c6-maths-ch07-t01 s1 e1 | The roti beside it is in 8 equal parts. Which fractional unit of the whole roti is one of  | 1/8 |
| c6-maths-ch07-t01 s1 yourStep | Now work out 30 ÷ 5. How many cm long is one piece? | 6 cm |
| c6-maths-ch07-t01 s3 e3 | Below, the same 1 metre is in 5 equal parts. How many cm is one part? | 20 cm |
| c6-maths-ch07-t03 s1 e1 | Split every part of this roti into 4 equal pieces, and the whole roti will have 12 pieces. | 8 |
| c6-maths-ch07-t03 s1 e2 | In this same roti of 12 pieces, 3/4 of the roti equals how many pieces? | 9 |
| c6-maths-ch07-t03 s1 e3 | On this same line, where does 3/5 go: on which mark after 0? | 6 |
| c6-maths-ch07-t03 s3 e1 | Divide both the top and the bottom of 16/20 by the biggest common factor. What is the new  | 4/5 |
| c6-maths-ch07-t03 s3 e3 | In 35/56 the biggest common factor of the top and bottom is 7. Divide once: what is the lo | 5/8 |
| c6-maths-ch07-t04 s1 e1 | On this same line of 9 gaps, think of 4/9 and 8/9. Which is bigger: 4/9 or 8/9? | 8/9 |
| c6-maths-ch07-t04 s3 yourStep | Now both are compared with a half. So whose bottle has more water: Anil's or Bina's? | Bina |
| c6-maths-ch07-t05 s1 e2 | On this same line, take 6/10 away from 8/10. How much is left? | 2/10 |
| c6-maths-ch07-t05 s1 yourStep | The whole wall is 11/11 and 7/11 is already painted. How much of the wall is left? | 4/11 |
| c6-maths-ch07-t05 s3 yourStep | Now add 1 1/6 km to the 3 whole km. What is the total distance? | 4 1/6 km |
| c6-maths-ch08-t01 s1 e1 | Take any two different points on the edge of this circle. Add their distances from the cen | 8 cm |
| c6-maths-ch08-t01 s3 e1 | There are two different chairs on this circle. Add the two chairs' distances from the pole | 10 m |
| c6-maths-ch08-t01 s3 e2 | A point is 8 m from O. Is it inside this circle, on the circle, or outside? | bahar |
| c6-maths-ch08-t01 s3 yourStep | Gate G is 5 m from O and the radius is 4 m. Is G inside the bed, on the edge, or outside? | bahar |
| c7-maths-ch02-t01 s1 e1 | The next day 4 samosas and 3 chai were bought at the same stall, same prices. What is the  | 4 × 15 + 3 × 10 |
| c7-maths-ch02-t01 s1 e3 | Find the value of this expression: how many rupees is each friend's share? | ₹90 |
| c7-maths-ch02-t01 s1 yourStep | Now take the whole bill of ₹170 away from ₹500. How many rupees does Raju get back? | ₹330 |
| c7-maths-ch02-t01 s3 yourStep | In this story, how many rupees does each cousin get? | ₹40 |
| c7-maths-ch03-t01 s1 e2 | On this zoomed line, at how many cm is the 3rd small mark after 2? | 2.3 cm |
| c7-maths-ch03-t01 s1 yourStep | Now write 3 4/10 cm as a decimal. How many cm long is the eraser? | 3.4 cm |
| c7-maths-ch03-t01 s2 e2 | On this line, how many more hundredths are needed to get from 0.62 to 0.7? | 8 hundredths |
| c7-maths-ch03-t01 s2 yourStep | Now write 4 tenths and 7 hundredths as a decimal. | 0.47 |
| c7-maths-ch03-t01 s3 e3 | An insect is 23 mm long. How many cm is it? | 2.3 cm |
| c7-maths-ch05-t01 s1 yourStep | The smaller angle is 75°, and the bigger angle is 30° more than it. What is the bigger ang | 105° |
| c7-maths-ch05-t01 s2 yourStep | Now work out 180° − 122°. What is angle BOD? | 58° |
| c7-maths-ch05-t01 s3 e2 | So what is the sum of all four angles at this crossing? | 360° |
| c7-maths-ch05-t02 s1 e1 | The gap between AB and CD is 3 cm. Below CD a third line EF is drawn, parallel to CD and 2 | 5 cm |
| c7-maths-ch05-t02 s2 e1 | Extend both lines through the meeting point and a crossing forms. How many of the angles a | 4 |
| c7-maths-ch05-t02 s2 e3 | One line is to be turned to open the angle a little more, so that these lines become perpe | 2° |
| c7-maths-ch05-t02 s2 yourStep | At 4:00 the hands are on 12 and 4. Each part is 30°. What is the angle between the hands? | 120° |
| c7-maths-ch05-t02 s3 e1 | The first crease is a straight line, that is 180°. The second fold shared it into two equa | 90° |
| c7-maths-ch05-t02 s3 e2 | A set-square's corner is put on a crossing. One line sits exactly on one edge, but the oth | 95° |
| c7-maths-ch05-t02 s3 e3 | Sliding the set-square this way, three parallel lines are drawn, each one 2 cm below the o | 4 cm |
