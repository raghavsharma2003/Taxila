# To Brain 052: the merged d34 tree, before the 34th run

From main, 2026-11-24. Round d34's three branches (051 parts A and B, Learning 022) are merged on `main/d34-code`. The dry matrix on
the merged tree flags turns that no builder saw alone, and the cold reads of the nine scripts left code follow-ups. This order
closes both. It is built by two builders in parallel (parts are marked **E** for the engine builder, **P** for the predicates,
checker and grader builder), then merged, then the engine builder rewrites the counts baseline once and runs the whole unit suite.

Done by main already, on this tree: `c6-maths-ch06-t01` s2 e1 short reason (`be79d35ab`), the third no-picture line of two staged
scripts (`58c1d0d1b`), `c4-maths-ch01-t02` moved to `data/lesson-scripts/` (`b3c7e81fd`).

Topics. Live, seven: `c4-maths-ch05-t01, c4-maths-ch01-t02, c5-maths-ch02-t01, c5-maths-ch02-t02, c5-maths-ch02-t03,
c6-maths-ch06-t01, c6-maths-ch07-t01`. Staged, two: `c4-maths-ch06-t01, c6-maths-ch07-t03`.

**Done means:** the dry matrix of the nine topics ends `check rc=0`; the whole unit suite passes; the counts baseline is rewritten
once, after everything else, with the moved counts listed.

---

## A. Flags of the merged dry matrix

### A1 (E). The ladder after the card's own reason

`steady-c5-ch02-t03` row 58 (`keyBeforeHint`, gated since 049 B3): s2 c3 names the wrong answer "1/12". The child says 1/12 (row 55)
and hears the card's own reason (row 56, right by 051 C3). The child says 1/12 again (row 57) and hears the key (row 58). The card's
`simpler` was never said.

**Build:** the own reason is one rung, not the ladder. At a card with a `simpler`:

| misses heard | she says |
|---|---|
| the named wrong answer, first time | the own reason, and the question again |
| the next miss (named or not) | the card's `simpler`, and the question again |
| the miss after | the key |
| a miss that is not the named answer, first | the `simpler`; then, if the named answer comes, the own reason; then the key |

At a card with no `simpler` the ladder is as built. A give-up is as built.

### A2 (E). A told step's result board is drawn when its line is said

`stepSaidOverPosing` (051 C2's predicate): `c6-maths-ch07-t03` s1 step 2 (steady 24, steering 34, stuck 24, offtopic 16) and
`c4-maths-ch01-t02` s2 step 2 (steady 66). Step 1 is asked; its verdict and step 2's told line are one turn. Step 2 has a
`resultBoard` and no `ask`. The turn draws step 1's board and says step 2's line over it.

**Build:** a step with a `resultBoard` and no `ask` draws that board from the first word of its told line: the turn pages there
(the paging by part of 044). The page before it is whatever was up. No extra words.

### A3 (E). `boardChange` at the opening of c6-ch07-t03 s3

steady 42, steering 54, offtopic 46, stuck 68: "a planned board change not drawn" on the turn that closes s2 and opens s3 ("Ab jodna
dekho. 1/3 ke upar aur neeche mein 1 jodo, …"). Find whether the plan or the drawing is wrong and fix the one that is. If the fix
is the script's board data, make it and say so in the report; if it is a sentence a child hears, do not edit it: report the row.

### A4 (P). `hindiNoFormNoLine` and spent help

`offtopic-c6-ch07-t01` row 32: "Hindi mein bolo" at a card with no Hindi form, help spent. She says the honest line ("Yahi sabse
seedha tareeka hai jo mere paas hai, …") and the card. 051 C5 says exactly that: with the help spent, the honest form, as before.
The predicate exempts a turn that says a nothing-easier form (read the forms from the script's joint, as the other predicates do).

### A5 (P). One count for the turn after a right answer

The checker's F line for c6-ch06 s2 e2 read "43 + card 10 = 53/61" and passed; the engine counted 71 and split the turn. The
checker counts tokens with a letter or digit; the engine counts every token, so "+", "=", "×" are words to one and not the other.

**Build:** one function, exported from where the engine has it, used by both. The checker's budget for a verdict, short reason,
point and card turn uses that count, the script's longest right-verdict opener and the lead-in word the engine adds, and it is an
error above the engine's 70, for scripts in `D34_READY`. Print the turn's parts and their counts in the error.

### A6 (P). A no-picture line is not a refusal

`joints.noPicture` forms that match the predicates' `PICTURE_REFUSAL` are a checker error (export the pattern from one place).
Two staged scripts had one; both are fixed.

---

## B. From the cold reads (engine builder)

### B1. A remediation listed whole is said in one turn with its card

The four remediations of c5-t02 on the checker's `REM_WHOLE` list are written to be said whole. With their follow-up card each is 52
to 65 words. Today such a turn can break between the two. **Build:** a `REM_WHOLE` remediation and its card are one turn up to 65
words; above that, as built. The list is the checker's; read it from there, do not copy it.

### B2. The closing question is graded like a card

The closing question (the teach-back) is graded by its own reader. A denial was read as right in a dry lesson; "8 bata 12" was not
read as 8/12; and its named wrong answer is not read, so its own reason is never said. **Build:** the closing question goes through
the cards' grader (the script grade of 050, the spoken-fraction forms, the named wrong answer). A denial or "pata nahi" is never
`correct`. After its named wrong answer the own reason is said once, then the answer, as at a card.

### B3. Named wrong answers at asked worked steps stay unread (ruling)

`scriptStepAskItem` passes no `wrongIfMis`, and `worked_step` is not a card kind: a miss at an asked step is told the step. That
stays. Reason: the step's told line is the correction, and a second reason before it makes a three-part turn. **P:** the checker
prints a note (F, not an error) where an asked step carries a `whyAlt`, so authors do not write lines nobody hears.
Reversal: a judge cites a step miss where the told line does not meet the child's named wrong answer.

### B4. The third turn running at one question ends on a pointed invitation (ruling)

Staged `offtopic-c4-ch01-t02` rows 10 to 18, before this merge, asked one question five turns running while asides were parked and
answered. 051 C4 counts what the child hears. This rule is its other half: on the third turn or later at one question, a turn that
parks an aside or replies to one does not say the question again and does not end on the bare "Ab tum batao." It ends on an
invitation that points at the question still open, from a new joint `joints.answerFirst` where the script has it, else these code
forms (rotated):

- "Pehle is sawaal ka jawab do."
- "Board wala sawaal abhi baaki hai, uska jawab do."
- "Yeh baad mein; pehle sawaal ka jawab."

The question itself comes back when the child answers it, asks for it, or asks for help. Predicate (gated): on such a turn, the
question's closing sentence is absent and the last sentence is one of the forms.

### B5. Small reads

- A bare "bilkul" is a yes (**P**, in the reader of yes and no).
- The goodbye reply reads what the child said (`toWrap`): a child who says they liked the lesson is not answered as if they said
  bye.
- Aside replies of one shape are rotated across a lesson (`asideReplyLine0`): the same frame is not said twice running.
- The `toldOk` guard (brain/say.js) is by form type, not by string.
- **P:** at a "kitne hisse" card whose key is a number, an answer N/D where N is the key and D is the board's parts is not graded
  `incorrect` by the script grade: it goes to the model, as an unlisted form does (c5-t03 s1 e1 "5/10", s1 e2 "6/12", s2 e1 "4/10").

### B6. Two things to look at and report

- `offtopic-c5-ch02-t02`: against the pre-merge dry lesson, misconception reads went 7 to 11 and hints 5 to 10, and the lesson no
  longer reaches its wrap inside the dry turn limit. Say why. If it is 051's named wrong answers doing their job on a dry child who
  repeats them, say that and raise the dry turn limit for the offtopic kind only if nothing else is wrong.
- `steady` c4-ch05-t01, c5-t01, c5-t03: the closing turn and the wrap are one turn. dc-r8-director25 L2 says the wrap is two turns
  while the child is there. Fix or show why the rows are right.

---

## C. Tests to re-pin (P)

- `tests/r7-brain-j2.test.mjs` lines 15 to 20 and `tests/r8-director26-paths.test.mjs` lines 187 to 192 pin aside reply strings that
  Learning rewrote in `data/lesson-aside-replies.json` (`e12517b3f`). Re-pin to the file.

## D. The seventh live lesson (P)

`c4-maths-ch01-t02` is in `data/lesson-scripts/`. Every list that names live or staged topics follows: the checker's lists, the
dry matrix test and its counts baseline's topic list, the script tests that read `data/lesson-scripts-staged/` for it, the grader
gate, the compile report. The frozen judged copies under `tests/fixtures/eval-results/` do not move.

## E. Last (engine builder, after the merge)

1. Dry matrix, seven live and two staged: `check rc=0`.
2. Rewrite the counts baseline once (`counts.mjs --write` on the seven live). List every moved count by lesson and predicate with
   the part of this order that moved it; a moved count with no part named is a finding, not a rewrite.
3. The WHOLE unit suite (`npm run test:all`, then `DATABASE_URL= npm test` is main's), not a list of files
   (`dc-r8-agents-run-the-whole-suite`).

## What would reverse this order's rulings

- A1: judges read the `simpler` after the own reason as one hint too many at a three-option card (the child has heard two helps
  and the options twice): then at a card of three options or fewer the key follows the own reason.
- B4: a child who is parked twice running stops answering (reads as scolded): then the invitation is said once and the question
  comes back on the turn after.
