# To Learning 022: boards under what is said after an answer, a named wrong answer for every own reason, a checker that refuses what got through

From main, 2026-11-23. Source: `docs/design/round7/judgements/director33-2026-11-23.md` (decision `dc-r8-director33`, items 3,
4, 5, 7, 9). Reports: `evals/hybrid-side-by-side/results/2026-11-23-director33/judges/report-*.md` (cited by topic and row).
Six scripts are live after release 57: `c4-maths-ch05-t01`, `c5-maths-ch02-t01`, `c5-maths-ch02-t02`, `c5-maths-ch02-t03`,
`c6-maths-ch06-t01`, `c6-maths-ch07-t01`. Staged: `c4-maths-ch01-t02` (passed; goes live after Part 2 E), `c4-maths-ch06-t01`,
`c6-maths-ch07-t03`.

## Part 1. The checker (clause 42: each of these got past the author, two cold passes and main)

1. **A card posed over a "?" carries an answer board.** Error when a card's posing board draws a "?" (a label, a mark or a text
   item) and the card has no `answerBoard`. Found: 8 of 8 such cards in `c4-maths-ch06-t01`, three in `c6-maths-ch07-t03` (which
   has no answer board on any of its 22 cards). List every hit in the nine scripts and the staged batch.
2. **A step's sentence counts what its board draws.** For every asked worked step: when `ask.right` or `told` states a count of
   gaps, parts, pieces or marks ("4 gap", "5 barabar gaps", "har gap ke ant par ek mark"), the board it is said over (the step's
   `resultBoard`, else the worked example's `board`) must draw that many; a different count, or an uncut board under a sentence
   about gaps, is an error. Found: `c5-maths-ch02-t01` s1 ("4 gap" over `den: 2`) and s2 (gaps over `den: 1`).
3. **A sentence that compares two fractions is computed.** Every sentence in a point, remediation, reason, hint, close or
   `covered` line that names two fractions with a comparison ("A … B jitna nahi", "A, B se kam / chhota", "se zyada / bada",
   "ke barabar", "barabar nahi") is evaluated; a false one is an error, and "jitna nahi" is read as "less than" (as a child
   hears it). Found: `c6-maths-ch07-t03` s2 e3 point, "Pattiyon par 2/4 ka rang 1/3 ke rang jitna nahi hai". Print every such
   sentence with its value in `--rules` (a `C` line) so the reader sees them all.
4. **`whyAltAsHelp` needs a named wrong answer.** Error when a card is marked and has no `wrongIfMis`. List the hits (director33
   found: c5-t03 s1 e1, e2, e3, s2 e1; c4 the cards at stuck 66, offtopic 52, 60; c6-ch07-t01 s1 e1; c4-ch01 s1 e1; c4-ch06 the
   card at offtopic 44).
5. **A given does not change inside one problem.** Within a worked example, and between a point and its own card, a named thing
   with a number ("Golu ka scale 4 se shuru", "… 3 ke nishaan se shuru") that appears again with another number is a report
   line; an error when the two are in consecutive parts (c4-ch06 s1 e3 → the s1 worked problem).
6. **One name, one person, per skill.** A `{friend}` or a written name on more than two cards of one skill is a report line
   (c4-ch01 skill 3: three cards; c6-ch07-t03: three people in one lesson).
7. **New joint:** `joints.easierWords` (three forms `{ hi, en }`, 8 words or fewer: a promise to say it in easier words; no word
   "Hindi", no question, nothing about the answer). Required for a script in `D34_READY`.
8. A rule that raises more than one false error in three on the nine scripts becomes a printed line, not an error: say which.

## Part 2. The scripts, by row

One author a script. Each change is solved again; the checker passes with Part 1 on; `tests/r8-script-cards-hear.test.mjs` passes.

**A. Result boards (item 4).** `c5-maths-ch02-t01`: the s1 worked step gets `resultBoard` = the road with its three poles (four
gaps), the s2 one = the line cut in five; check that the child's own step that follows is still work (if drawing the result
gives it away, rewrite the confirmation to claim only what the posing board shows, and tell main). Then every asked step in the
nine scripts by Part 1 rule 2.

**B. A named wrong answer for every own reason (item 3).** For each hit of rule 4: if the reason was written against one answer
(c5-t03 s1 e3: "3/4 ka matlab 3 gap nahi hai" is about "3"; s1 e2 about "2"), name that answer in `wrongIfMis` with its accept
forms as a child says them, and check that the grader takes each as the named wrong answer; if no single answer is typical,
remove the mark. Never invent a wrong answer to keep a mark.

**C. Answer boards.** `c4-maths-ch06-t01` and `c6-maths-ch07-t03`: every card posed over a "?" gets its answer board; s1 e2's
point in c4-ch06 gets a board of its own (it is the card's board today: four unsaid boards).

**D. Sentences, live scripts.**
- `c6-maths-ch07-t01` s1 remediation: "doosri ke chhote bade hisson ko 1/3 nahi keh sakte" lost its "gin kar" in round d33 and
  is followed by a card whose answer is an unequal piece that is 1/3 (stuck 32, offtopic 8, steering 12): restore the sense
  (counting unequal pieces does not name them; a piece is 1/3 when three of it make the whole). s2 e2 is posed over bars cut in
  3, 5 and 10 under "sabse chhota kaunsa": a text board, as c3 got after director32. "kitne cm lamba hai?" where the key is 0.
- `c4-maths-ch05-t01` s2 e3 and the wrap: "Jitne barabar group bante hain, wahi neeche wala number hai" against its own accepted
  5/20 and 6/18. "Is chocolate" for two chocolates in one turn (steady 6). The wrap's "1/3 mein ek group ki ginti jawab hai".
- `c5-maths-ch02-t03`: an "8" at the s1 own step is answered by that step's own reason, not by the smaller-pieces remediation
  and a chocolate card inside the worked example (stuck 26, offtopic 20); the s2 rem0 sentence "neeche ke saath upar bhi" said to
  a child who multiplied only the top (stuck 56); s3 c3 `whyAlt` "ek hi number se guna" (2/4 = 3/6 has no whole multiplier); the
  closes at steady 74 and 56; "4 jodkar 7 nahi" after a right 6 (steady 60); the s2 e1 Hindi form.
- `c5-maths-ch02-t02`: the s1 e1 short reason states counts and no rule (stuck 10, offtopic 10, steering 24); the remediations
  are cut so that each fits one turn with its card (to-brain 051 C6 says them together); the s3 hint frame "Dono ne N-N …; ab
  socho ki …" four times; `wrap.covered` is what the wrap says.
- `c5-maths-ch02-t01`: the s2 e3 `whyAlt` cites "4/6 beech ke baad tha", which its point no longer says; the picture at
  offtopic 26 lets the answer be counted; "Line ki doosri taraf" opens four cards.
- `c6-maths-ch06-t01`: s1 c1 `whyAlt` "Jod chhota aaya toh koi bhuja chhoot gayi" is not always so; the s2 worked step accepts
  "dono ka do guna"; the steady 50 line says one fact twice.

**E. `c4-maths-ch01-t02`, four lines, then live.** The s2 e2 short reason ("kyunki 6 cm wala zyada khula hai" is no reason);
the s1 e2 "table ka kona" drawn at 115° (a table's corner is a child's right angle: another object, or the tabletop named as
slanted and drawn so); s3 c1 and c3 draw both shapes the card names; "Zoya" on one card of skill 3. Plus the hook that repeats
the greeting's "tester … kone jaanchenge", and the s1 e3 picture whose caption gives the worked step away (stuck 18). The
changed cards are read cold before it moves to `data/lesson-scripts/`.

**F. The two new staged scripts, rewritten on their reports.** `c4-maths-ch06-t01`: C above; Golu's scale starts at one mark;
"Tumhara 30 centimetre ka scale" out of the wording at a card whose key is 30; s3 e1 is settled by its board ("3 lambe kadam",
"1 kadam = 1 metre"); the two pictures that nearly settle their cards (steady 18, stuck 18); five s1 cards in one frame; the
grip's Hindi form. `c6-maths-ch07-t03`: C; the s2 e3 point teaches the comparison its card asks, truly; the c1 Hindi form keeps
"kam se kam"; the s2 worked example asks its deciding step, not two sums; the m-one-side remediation covers division; "Zoya";
"Ab 30/66 lo" and "Ab 30/48 lo" back to back; tulya / barabar one word.

**G. Every script:** `joints.easierWords`; aside replies in three forms that do not all open "Achha, toh tumhe … sabse achha
lagta hai" and do not say "sabse" of something the child did not rank; the goodbye's two replies not both "Hmm, … samajh gayi".

## Part 3. The read

Every script changed in Part 2 is read by a reader who has not read it, under the d33 brief plus one pass: **every board is
looked at under each sentence said while it is up**, the sentences said after the answer included (the verdict's reason, a
step's confirmation, a told step, a close), not only under its question. The reader lists every comparison sentence (the `C`
lines) and computes it.

## Done means

All nine scripts pass the checker with Part 1 on; no card is marked for its own reason without a named wrong answer; no step is
confirmed over a board that denies it; every "?" has its answer board; the comparison lines have been computed by the checker
and by a reader; the grader gate passes.
