# To Brain 051: the no-picture turn keeps the screen; a step's answer is drawn when it is said; the own reason only after its named wrong answer; the cap counts what the child hears

From main, 2026-11-23. Source: `docs/design/round7/judgements/director33-2026-11-23.md` (decision `dc-r8-director33`, items 2,
3, 4, 6, 7, 8, 10 and the wrap line of item 9). Reports: `evals/hybrid-side-by-side/results/2026-11-23-director33/judges/`;
rows below are 0-based rows of the lessons in that folder (fixtures:
`tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-23-director33/`).

Three live lessons failed the gate on C1 alone, and C1 is what to-brain 049 B2 ordered: this note reverses that order. Nothing
here touches the safety floor.

## C1. The no-picture turn keeps the screen (item 2; reverses 049 B2's "over the hint's own board")

**Heard:** steering 16 in c4-ch05-t01 (page change at character 38 to `fraction-parts@1`), c5-ch02-t01 (41), c5-ch02-t02 (49,
`wholes@1`), c6-ch06-t01 (46, `shape@1`), c4-ch06-t01 (35): "Is sawaal ki bas yahi ek tasveer hai." and then a new board, the
turn ending on the invitation with the card's own board gone. And c6-ch07-t01 steering 16: the "scale" view of a compare board
already drawn to scale is the same board, presented as a picture.

**Build:**
- On a picture request with nothing left to draw (`cell.picture` `hint` or `none`): the board on screen at the turn's start stays
  for the whole turn. No page change.
- After the `joints.noPicture` line, help is said only if the part it comes from owns no board, or its board is the one already
  up. Otherwise the turn is the line and the question (by C4's rules), and the help stays unsaid for the next miss or request.
- A second view that would draw the board already on screen (same template and params after expansion) is spent: the request
  takes the no-picture path.

**Predicates (gated):** `noPictureThenBoard` (a page change on a turn that says a `joints.noPicture` form): flags the five rows,
0 after. `viewSameAsBoard` (a `view` picture whose drawn board equals the held board): flags c6-ch07-t01 steering 16, 0 after.

## C2. A step's answer is drawn when it is said (item 4)

**Heard:** c5-ch02-t01 steady 24, steering 36 ("Haan, 4 gap: dono siron par bhi ek-ek gap hai" over a line of two gaps), stuck
24, offtopic 16 (the told step over the same line), steady 56, offtopic 60 ("har gap ke ant par ek mark aata hai" over an uncut
line). Today a worked step's board is the worked example's board for every step (`compile.js`: `${w}.board`).

**Build:**
- A worked step may carry `resultBoard` (script data, Learning 022 writes them). When the step is confirmed (`ask.right`) or told
  (`told`), the page changes to it at that sentence's first word, and it is the held board for the steps that follow until the
  child's own step's board.
- The step's question, its re-ask, its Hindi form and its help are still said over the posing board.
- A card posed over a board with a "?" already has `answerBoard` in the live scripts; nothing changes there in code.

**Predicate (gated):** `stepSaidOverPosing` (a step with a `resultBoard` whose `right` or `told` is said with the posing board
still up): flags the six rows once the script carries the boards, 0 after.

## C3. The own reason only after its named wrong answer (item 3)

**Heard:** the marked `whyAlt` at cards that name no wrong answer, said after any miss: c5-ch02-t03 steady 10, offtopic 6, 14,
44, steering 16, 24, 48 ("3/4 ka matlab 3 gap nahi hai" to a child who said 7); c4-ch05-t01 stuck 66, offtopic 52, 60;
c6-ch07-t01 steady 6; c4-ch01-t02 steady 8, steering 10; c4-ch06-t01 offtopic 44.

**Build:** `ownReasonFits` is true only when the card names a wrong answer and the child's last graded answer at that card was
it. The "names none: any miss" branch goes. Learning 022 names the answers or removes the marks; code assumes neither.

**Predicate:** `whyAltNoMiss` (gated) reads a card with no named wrong answer as never fitting: flags the rows above on the
fixtures, 0 after.

## C4. The cap counts what the child hears (item 6)

**Heard:** one question ending three or four of her turns running through turns the cap does not count: the short ask "Ab phir
se socho, jawab kya hoga?" / "Toh ab batao, kya aayega?" (c6 stuck 62 to 66; c4-ch01 steady 4 to 10; c5-t01 offtopic 22 to 28,
stuck 34 to 38 and 46 to 50; c5-t03 offtopic 22 to 28), the Hindi form (c4 offtopic 28 to 34, steering 6 to 12; c5-t03 stuck 4
to 8; c4-ch06 stuck 8), a picture turn (c4 stuck 14 to 18; c4-ch06 stuck 18), an aside reply that leads back to the card
(c5-t02 stuck 44 to 48), plain misses (c4-ch06 offtopic 40 to 44, stuck 36 to 42; c6-ch07-t03 stuck 70 to 74). And the
invitation in the wrong place: straight after a park line (c5-t02 offtopic 18; c6 offtopic 18; c4-ch01 offtopic 14: heard as
"tell me about cricket"), with no help in the turn (c4-ch01 steady 30), over a help board with the card's board gone (c4-ch01
steady 86, stuck 62).

**Build:**
- A turn "at a question" is any turn that ends on the card, its `reask`, its `hindi` form, a short ask, or an invitation while
  that question is the pending one; a picture turn and an aside reply that returns to the card count. The third such turn running
  ends on the invitation, as built; no path is exempt.
- The invitation is never said in a turn that parks an aside or replies to one (that turn ends on the question, and counts), and
  never in a turn with no help in it (then the question is said).
- A short ask is said only after help that followed an answer; after a clarify or a give-up with no answer yet, the question
  itself is said (c5-t01 offtopic 24: "phir se socho" to a child who had not answered).
- When the invitation is said, the board up is the card's (C1 does this for the no-picture path; do the same when help owns a
  board: the card's board returns before the invitation).

**Predicates (gated):** `questionThreeRunning` over the wider notion of a turn at a question: flags the rows above, 0 after.
`inviteAfterPark`, `inviteNoHelp`, `shortAskNoAnswer`: each flags its rows, 0 after.

## C5. A Hindi request where she has no Hindi (item 7)

**Heard as half-ignored:** c4 steady 36, c5-t02 steady 36, c6-ch07-t01 steady 36, c4-ch01 offtopic 32 ("Hindi mein bolo" → the
hint and the re-ask, no word about the request).

**Build:** at a card with no `hindi` form, a language request opens with one form of `joints.easierWords` (Learning 022 writes
three per script: a promise of easier words only, no word "Hindi"; until a script has them nothing is said, as today), then the
help. With the help spent: the honest "nothing easier" form, as today.

**Predicate (gated):** `hindiNoFormNoLine` once the scripts carry the joint.

## C6. The return, the wrap, the record (items 8, 9, 10)

- **The return in code's forms** (`RETURN_TOLD_Q`: "Tumne sixer ki baat ki thi: woh kab ki baat hai?") is not said when the
  aside already gave a time word ("kal", "aaj", "parso", "abhi"); another told form, or the script's own return form the aside
  has not answered (c5-t01 steady 40; c5-t03 steering 50). The script's return form that asks a liking is not said to a child who
  gave one (c6-ch07-t01 offtopic 68 after row 37).
- **The wrap says `wrap.covered`** where the script has it, not the three skills' `covered` lines joined (c5-t02 steady 124, 66
  words; c6 steady 90, 70 words).
- **A remediation and its card share the turn** where the two fit the remediation limit (c5-t02: eight remediations said alone
  with a check-in, five answered "haan"); where they do not fit, as today.
- **The record:** the invitation is seam kind `yourTurn` with its form (it is `aside` on every topic's rows); a named wrong
  answer is read as `misconception`, not plain wrong (c4 steady 93; c6-ch07-t01 stuck 25, offtopic 17); `cell.part` names the
  point said (c4-ch06 stuck 54, offtopic 50).
- **The harness:** `falseKeys` does not flag a true share (c6-ch07-t01 steady 82, `statedFalse "2/5"`); `pictureMismatch` knows
  the scale view; "pata nahi, shayad wahi" is a give-up in the child's `intent`.
- **A wrong answer at an asked step that has the right operation** ("27 ko 6 se bhaag", c6-ch07-t01 offtopic 16) hears the step
  told without "Nahi, yeh nahi hai." only if the step's key lists it as near; otherwise as today. Leave it if it needs data the
  scripts do not have, and say so.

## Measure

- Every predicate above gated, each first shown flagging its director33 rows (the fixtures) and then reading 0 on the dry matrix
  (seven live topics; `--staged` for the two staged ones).
- `check-run.mjs` exit 0 on the dry matrix. The counted predicates reported with what remains.
- **The whole unit suite**, the list the gate's leak check runs, two files at a time, 0 failing (`dc-r8-agents-run-the-whole-suite`).
- `tests/r8-script-cards-hear.test.mjs` unchanged.
- A `MEASURE.md`: per lesson, the picture requests and what was on screen through each; the longest run at one question by the
  new count; the invitations and what preceded each; second helps by kind.

## Done means

On the dry matrix: no page change on a no-picture turn; no step confirmed over its posing board where a result board exists; no
own reason without its named wrong answer; no question ending three turns running by the wider count; no invitation after a
park or with no help. Each proved by its gated predicate, and each rule's dry rows read once by main against the letter of the
judges' prompt before the run.
