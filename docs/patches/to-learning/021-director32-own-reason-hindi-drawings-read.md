# To Learning 021: the card's own reason as help, Hindi where it is honest, boards that do not answer, a read that looks at method and drawings

From main, 2026-11-23. Source: `docs/design/round7/judgements/director32-2026-11-23.md` (decision `dc-r8-director32`,
items 2, 4, 6, 9, 10, 11, 13). Reports: `evals/hybrid-side-by-side/results/2026-11-23-director32/judges/report-*.md`
(cited below by topic and row). Six scripts are live after release 55: `c4-maths-ch05-t01`, `c5-maths-ch02-t01`,
`c5-maths-ch02-t02`, `c5-maths-ch02-t03`, `c6-maths-ch06-t01`, `c6-maths-ch07-t01`. `c4-maths-ch01-t02` is staged.

## Part 1. The checker

1. **A script never trips the safety reader (item 9).** For every key, accept form and named wrong answer of every card:
   the frozen safety predicate (`scanSafety` in `server/`; import it, change nothing in it) reads the form as a child's
   reply; a form it marks is a checker error naming the card and the form. Found: `c4-maths-ch01-t02` skill 2, "chhote
   blade wali" set off the safety check-in on a right answer (steering 45 to 48). Run it over all seven scripts and the
   staged batch and list every hit.
2. **`whyAltAsHelp` everywhere it is safe.** A report line (not an error) for every card whose `whyAlt` passes rule 9 and
   is not marked, and for every card whose `whyAlt` fails rule 9 with the reason. Part 2 uses it.
3. **A posing board that is its own answer.** Error when a card's prompt asks for a cut, a count or a mark that its posing
   board already draws: the board's parts equal the number the prompt tells the child to cut into (c4 s3 e1: "isi patti ko
   ab 4 barabar tukdon mein kaato" over a bar drawn in 4); a count card ("kitne gap", "kitne hisse") over a line or bar that
   draws exactly that many unlabelled parts with nothing else to count (c5-t01 s1 e2, the s1 asked step). List every card
   the rule catches in the seven scripts before making it an error; main confirms the list.
4. **The rule list** already prints bare contrasts (integration 89). Add: every sentence in a remediation, a point or a
   `covered` line that names an arithmetic operation, printed with the skill it is in and the first later sentence in the
   script that names the same operation, so the reader sees the pair.
5. **New fields:** `joints.noPicture` (three forms: there is no other drawing of this; it promises nothing and names no
   answer), `joints.yourTurn` (three forms: an invitation that is not a question, for the turn after a question has been
   said twice). Required for a script in `D33_READY`.

## Part 2. The six live scripts and the staged one

One author a script, as in round d32. Each change is solved again; the checker passes; the grader gate
`tests/r8-script-cards-hear.test.mjs` passes.

**A. The card's own other reason answers the mistake.** For every card: its `whyAlt` says what the child who gave the named
wrong answer got wrong, in a sentence that does not state the key, and is marked `whyAltAsHelp`. Rows where the judges heard
the point's wording instead: c4 steering 30 and 32 (the Raju card; its `whyAlt` "kaatne se pehle 6 tukde the…" was never
said), offtopic 52, stuck 26 to 32 (the one sentence that answers Golu, "2/2 ka matlab poori chocolate hoti", is in a
`then.whyAlt`); c4-ch01 stuck 36, 38 (Sonu: "Sonu ne tester ko tile ke saath nahi ghumaya"); c5-t03 steady 38, offtopic 44,
steering 48 (the slip is doubling; the help is about what the numbers mean), stuck 36 to 38 (the child keeps saying 8;
nothing speaks of the coloured parts); c6-ch07 steering 16 to 18, offtopic 34 ("1/6 chhota hai" a third time to a child who
answered "4 hisse"). A hint and a `whyAlt` that are the same idea (c5-t03 `rem[0].then`, steady 82 / 84) are made two.

**B. Hindi where it is honest.** A `hindi` form on a card only where a different, plainer sentence exists (Learning 020
rule 1 stands, the 50% overlap check stands). Aim first at the questions a child stops at: the first card of each skill, the
asked worked steps, the checks. c5-t02 c1's form (offtopic 34: near the card, and it drops "roti zyada chahiye") is
rewritten or deleted. Report, per script, how many cards have a form after the pass.

**C. Boards.**
- c4 s3 e1 (steady 76): the prediction is posed over an uncut strip; the cut is the answer board.
- c5-t01 s1 e2 (the 8 gaps drawn), the s1 asked step (the 4 gaps), s2 e3 (the 4/6 tick between labelled 1/2 and 5/6): pose
  so that the count or the place is the child's.
- c5-t03 s2 e3 (steady 52: the board labels 1/2 at mark 3 and the card asks where 2/4 lands): near; fix if a clean way exists.
- c6: the s3 authored pictures that cut the strip into 4 pieces or 2 halves draw what those cards test: redraw or put the
  card on `PICTURE_NONE`.
- Pictures that let the answer be counted at the step they are asked at: c5-t01 stuck 18 (a bar of 4 parts), c6 stuck 18,
  c6-ch07 steady 18 (the scale marked every 6 cm at "kaunsa fractional unit"): the own step gets a picture that does not
  count the answer, or none.
- Second views that add nothing: c6-ch07 offtopic 30, steering 14 (bars as wholes beside the same bars); c5-t03 stuck 18
  (the first fold only, for "kitne hisse after three folds"): an authored `pictureBoard` of the thing asked about, or
  `PICTURE_NONE`.

**D. Asked steps.** c4 s3 "chhota tukda kaunsi chocolate se aayega?" is answered by the sentence before it (steady 88);
c5-t01 s2 "har gap kitne ka hoga?" is read off the denominator; c5-t03 s2 "5 kis se guna hua?" is a sum and goes back to the
director31 step ("Neeche 2 se guna hua; upar ke 3 ka kya karein?"), with a close that says why Mohan's share is less (steady
76). c6's own steps (35 − 31, 2 × 42, 3 × 160) are each given one decision to make.

**E. `c4-maths-ch01-t02`, rewritten once more** (its report, E and C): the roti card (s3 e2) and the slack-string card over
drawings of their own (Studio 015 adds the uneven round shape and the slack curve); no point that states its card's answer
(s1 e3 "kone nahi badle", s3 e1, s3 e2 "Jis gol cheez mein yeh doori badle, woh circle nahi"); one of the two "Zoya ka kehna
hai" cards in skill 1 replaced; the s1 own step's question without a negative inside it ("kya Sonu ki baat theek thi ki …
nahi hai?"); the s3 asked step ("kitni door hai?", a given restated) made a decision; the ghadi key no longer says a few
measurements prove a circle; "blade" replaced by a word the safety reader does not take and a class 4 child knows; "string"
and "rassi" made one word; the bare-tester pictures (stuck 18, offtopic 28) replaced by the tester laid on the turned shape.

**F. Small, by row.** c5-t02: the wrap's `covered` turn (66 words, a recital) cut to three short sentences; s3 e2 "Dono mein
teen-teen gap chalne hain" before a card about 4/5 and 4/8; "rangeen / rang wala" one word. c5-t01: the steering 14 caption
names "chai ki dukaan", never said aloud; "taraf" and "qatar" for one thing; s2 e1 and e2 open the same way. c5-t03: "doosri
patti" names three strips in consecutive turns; the s3 e1 point re-teaches 3/4 = 6/8; steady 56 says "neeche 2 se guna hua"
twice. c6: the caption that repeats a given just before its question (stuck 18, offtopic 26). c6-ch07: the s3 e2 point cut
to one case (steady 60, offtopic 82: it never says 2/4 = 1/2 for the child who answered "1/2"); "Is sawaal ka jawab 6 wala
hai"; "1/6 wale doston". c4: the s2 c1 accept form "ek plate" for a "kaunsa fraction" card. Every script: the closes written
"Toh poora jawab: …: …" with two colons become two sentences; two more openers for each verdict form that opens "Dekho,".

## Part 3. The read (item 10)

Every script, after Part 2, is read by a reader who has not read it before, under the d32 brief plus two passes:

1. **Rules against the lesson's method.** Every line the checker's rule list prints, and every sentence that says what an
   operation or a method is not or only is, is read against everything the script teaches AFTER it, not only against the
   keys. (What got through twice: c4's "fraction naam nahi hota" in director31, c6's "jodte hain, guna nahi" in director32.)
2. **Boards as pictures.** Every board a question is posed over, and every picture a child can ask for at it, is built and
   looked at: can the answer be counted, read or seen. (What got through: c4 s3 e1, three boards of c5-t01, c6-ch07 c3.)

The reader still solves every key and runs children's phrasings through the grader. A fix agent applies the findings under
main's rulings. Then main reads the checker's rule list and the dry lessons.

## Part 4. Two new staged scripts (item 13)

Two topics from the staged batch, one class 4 and one class 6, each next in the syllabus graph to a live topic and with a
complete verified kit, authored under one brief that carries Parts 1 to 3 from the first line. They join the next judged
run only after the two-pass read and main's.

## Done means

All seven scripts and the two new ones pass the checker with Part 1's rules on; the checker's safety rule finds no hit; the
rule list of every script has been read twice (the reader, main); every card has a `whyAlt` that is marked or a recorded
reason why not; the grader gate passes.
