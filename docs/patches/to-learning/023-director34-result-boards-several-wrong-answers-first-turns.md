# To Learning 023: after director34

From main, 2026-11-24. Source: `docs/design/round7/judgements/director34-2026-11-24.md` (decision `dc-r8-director34`, items 3,
5, 7, 8, 9). Reports: `evals/hybrid-side-by-side/results/2026-11-24-director34/judges/report-<topic>.md`. Read your topic's
report whole before you touch its script: its tables name rows this note only lists.

All seven live lessons passed. Listening is at the floor in six and register in all nine. This round is about the child whose
wrong answer the script did not expect, the drawing under what she says after an answer, and how long her turns are.

## Part 1. The checker (one builder, before the authors)

New flag `--d35`; `D35_READY` empty until the scripts pass. Each rule is an error for a ready script and prints the part and the
words. A rule that raises more than one false error in three on the nine scripts becomes a printed note: say which.

1. **A stated value needs a board that shows it (decision item 3).** Rule 2 of 022 read a count against a board that draws a
   different number. Widen it: in a step's confirmation (`ask.right`), a step's `told`, the worked example's close (its answer
   line) and the child's own step's reason, every number, fraction or named mark she states must be drawn on the board that is
   up while she says it (the step's `resultBoard`, else its posing board; for the close, the own step's `answerBoard`, else its
   board). The rule that passed c6-ch07-t03's close ("4 mein se 3" over a 12-part bar) read steps only.
2. **Several named wrong answers (item 5).** `wrongAnswers: [{ answer, accept?, why: { hi, en } }]`, at most three, beside
   `wrongIfMis` and `whyAlt` (which stay, as the first). Rule 4 of 022 reads each reason against its own answer; no reason may
   state its card's key or leave one option.
3. **The first teaching turn is 60 words or fewer** by the engine's count: the hook, the first point and its card (64 to 74 in
   every script today).
4. **Every card, follow-up card and child's own step has a `reask`** (13 dry rows say a whole card twice because it has none).
5. **A reason does not open by repeating the verdict.** A `whyAlt` or a named answer's `why` that begins with its own wrong
   answer and "nahi" ("1 nahi: …" after "1 sahi nahi hai.") is an error.
6. **One frame once in a skill (printed, for the reader):** two reasons in one skill that share six words running once numbers
   are masked (c5-t02 skill 1: "X bada number hai, par isse hissa … nahi hota" four times).
7. **Reply kinds.** `data/lesson-aside-replies.json` carries forms by kind: `person`, `done`, `liking`, `whenWhere`, and the
   neutral forms it has. A `liking` form under another kind is an error. "Yeh baat toh do baar aa gayi." goes.

## Part 2. Rows by topic

Every script: rule 1's result boards; rule 3's first turn (cut the point's example, never the card's givens); rule 4's re-asks;
"Suno," and "Dekho," are no longer added by code after a verdict, so a reason must read well straight after "Haan, sahi hai."

- **c4-maths-ch05-t01.** s3's follow-up card: its own reason leaves one option (steady 86). The remediation heard alone at
  offtopic 64 dangles ("jo thaila diya"): say the count. The picture caption at steering 14 nearly settles Pinky's card.
- **c4-maths-ch01-t02.** s2 e2's short reason must say "right angle se zyada khula" (ordered last round; it went live as "6 cm
  wala zyada khula hai, 12 cm wala kam.", which only restates the answer). s1's told step ("bilkul fit hua") settles the child's
  own step "kya Sonu theek keh raha tha?": the told step says what was done, the own step asks what it shows. s1 e1 names its
  miscounts (the judges heard 5, 2 and 6) with a reason for a miscount, not the right-angle lesson again. s1's worked
  `simpler` restates the problem. s2's P step needs its result board.
- **c5-maths-ch02-t01.** s3's worked steps need result boards (the 7/4 mark). s2's asked step is recall: ask the deciding step.
  s3's told step gives the child's own step away. "doosri taraf" is in 18 of 49 of her turns in the steady lesson. The follow-up
  card of s1's second remediation names 1/6 with its own reason (steering 18 re-explains 1/7).
- **c5-maths-ch02-t02.** Skill 1's four reasons share one frame (rule 6). s3 e1's prompt still says "Neeche".
- **c5-maths-ch02-t03.** s1 e1's reason opens "1 nahi:" (rule 5). s2's add-the-same remediation never says "jodna" (stuck 62).
  Two pictures add nothing: a *chaukor* rumal drawn as two circles (steady 18), a plain 12-part strip (offtopic 26). s2 names
  the twelfths mistake (steering 18, 22). s2 and s3's steps need result boards.
- **c6-maths-ch06-t01.** s2 step 2 needs its result board (42). One sentence uses "lambai" for two things. Perimeter has four
  names (parimap, poora kinaara, kinaare ka naap, chakkar): keep "parimap" and one plain one. "andar ke 1 cm wale … square
  ginta hai" is one frame in several reasons. s2 e1's short reason is thin again after two misses ("10, 6, 10, 6 jodkar 32 m",
  main's wording): say why the two come twice, in seven words.
- **c6-maths-ch07-t01.** "1/3 se chhota … 1/6 se bada" is said five times in four turns (steady 32 to 38); "neeche … ginti aati
  hai, lambai nahi" two or three times in a worked example. s2 e2's point states its rule on the card's own three strips.
  "yahi patti" points at a strip that is not drawn (stuck 12). "27 ko 6 se bhaag" is the right operation with the numbers
  turned: name it as a wrong answer with its own reason. The two keyed cards have no answer board.
- **c4-maths-ch06-t01 (staged).** The tape remediation never says the small spaces are 10 cm each; "100 metre" for the room is a
  size mistake and gets a unit remediation: name both with their own reasons. The told "260 centimetre" needs its board. A
  double "kyunki" (steady 22). e1's Hindi form is no plainer than the card. Two different strings are both "dori".
- **c6-maths-ch07-t03 (staged).** The first worked example's close says "4 mein se 3" over a 12-part bar: the own step gets a
  result board that shows it. s2 c2 lost its "?" and got no answer board. s2 e3's point does not fit a turn with its card. s1's
  remediation covers cutting only, and is given for a joining mistake. s2's told step reads as notes ("Neeche 8 se 56 bana, 7 se
  guna hua."). "Toh poora jawab:" closes all three worked examples.

## Part 3. The read

Each script is read cold by a reader who has not seen it, on five passes, then fixed under main's rulings:

1. each sentence against the lesson's own method;
2. each board against its card;
3. each board under every sentence said while it is up, the sentences said after an answer included;
4. each comparison computed, and each reason against the wrong answer it names;
5. **new:** each remediation and each named reason against every wrong answer that routes a child to it (would a child who gave
   that answer hear their own mistake?), and each joint form against the turn it can follow (a no-picture line after a picture
   was just shown).

## What would reverse these

- Rule 1: a result board gives away the child's own step; then the sentence is cut to what the posing board shows.
- Rule 3: a first turn at 60 words drops what the card needs; then the hook is cut, not the point.
- Item 5: reasons multiply past three a card; then the card is two cards.
