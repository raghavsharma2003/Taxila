# To Learning, 025: the script list from director36 (for the script round after d37)

From: main, 2026-11-25. Judgement: `docs/design/round7/judgements/director36-2026-11-25.md` (decision `dc-r8-director36`, item 6).
Round d37 changes the walk only. Nothing below is built in d37. Rows are `<child> <row>` in
`evals/hybrid-side-by-side/results/2026-11-25-director36/`; each judge's report is in its `judges/` folder.

## 1. c4-maths-ch05-t01 (live; keeps its release-61 script)
The round's rewritten script is at commit `6ec62ad79`. It failed on one sentence: s1 `remediation[1].simpler`, rewritten in
`839b7460d` to "Pinky-Golu wali chocolate ke bina rang wale tukde bhi usi chocolate ke the…", is said by the walk over the
remediation's own board (a chocolate of 10 pieces) while the follow-up card is the one open (stuck 32). The sentence returns to its
director35 text, which is true of that board; nothing else in the rewrite was faulted. It comes back at the next full run.
Rule for every script: a sentence that names a figure is true of every board the walk can put under it.

## 2. Help heard as the same again (clause 66)
- c6-maths-ch06-t01: s1 own step's `simpler` is the told step shortened (stuck 26, offtopic 36); s1 c1's `simpler` is the card's own
  reason again (stuck 50, offtopic 44). The hook lost "yahi parimap hai" when it was cut to one sentence.
- c6-maths-ch07-t01: the unequal-parts remediation restates the point before it over a near-identical board (offtopic 8,
  steering 12, 26; stuck 44); "…upar, bachche neeche" is said twice running (steady 92, 94).

## 3. Sentences
- c6-maths-ch07-t03 (staged; two passing runs; FIRST on this list, because it is the only thing between this lesson and live):
  s3 `remediation[0]` (m-stop-early) carries a board ("48 ÷ 2 = 24" | "66 ÷ 2 = 33") that its `say` never speaks, so the live
  rule director5 SC2 (`tests/r7-board-ref.test.mjs`) refuses the script as live: the say speaks its board, or the board goes.
  Also: s1 c1 asks the follow-up card's 5/6 → 10/12 again, for the steering child straight after
  that key was told; "jodna" is used for joining parts and for adding a number in two turns running (stuck 74, 76); the s2 close
  "teen hisse hain, har ek mein saat page" is loose.
- c4-maths-ch06-t01 (staged): "ginti hazaar se bhi upar" overstates against the accepted "lagbhag 5 metre" (steady 86); the short
  reason at steady 72 is a fragment; the cricket hook dangles.
- c4-maths-ch01-t02 (staged): s2 e2's short reason is a fragment (heard in four lessons); c1's hint restates the e2 rule.
- c5-maths-ch02-t01: the `hindi` forms at steady 38 and offtopic 32 are the same Hinglish reworded; frames repeated inside one
  turn (steady 14, 36, 58). c4: the `hindi` forms keep "fraction"; "bhinn" and "fraction" in one lesson.
- c5-maths-ch02-t02: the s1 c3 reason "gap 3 se zyada hon toh pehla gap chhota hota…" is elliptical; the hook says roti and the
  next sentence "Yeh patti".

## 4. Boards
Cards that still state a value over their posing board: c6-ch07-t01 s1 c2, s1 e3, s1 c1, s2 e2; c4-ch06-t01 s2 e1, e3, c1, c2 and
the pipe card; c6-ch07-t03 s2 e1 and the s3 cards; the teachback verdict said on a cleared screen. Several need a table whose "?"
cells the answer fills, which the checker's figure rule refuses today (`OWN_BOARD_NONE` holds the one step exempted for it): the
rule is written first.

## 5. How this list is checked
Decision item 4: after the last fix, an independent reader reads the offline walk of all four children row by row for every
changed script; a fix after that reading is read the same way or does not ship; a finding that a sentence is said over a board it
is untrue of is the script's to cure.
