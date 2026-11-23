# To Brain 049: she promises Hindi only where she has it; a picture request never costs the card; the card's own reason; a question twice, not four times

From main, 2026-11-23. Source: `docs/design/round7/judgements/director32-2026-11-23.md` (decision `dc-r8-director32`,
items 2, 3, 4, 5, 7, 8 first sentence, 12). The judges' reports are in
`evals/hybrid-side-by-side/results/2026-11-23-director32/judges/`; rows below are 0-based rows of the lessons in that
folder (fixtures: `tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-23-director32/`).

Listening and register have sat at 3.5 in every topic for six judged runs. Every item here is something all or most of the
seven judges named in nearly the same words. Nothing here touches the safety floor.

## B1. The Hindi switch line only where the card has a `hindi` form

**Heard:** "Achha, ab Hindi mein kehti hoon." then the card's help in the same Hinglish, at a card with no form: c4
offtopic 32 (then the bare card), c5-t01 steady 38 / stuck 8 / offtopic 32 / steering 8, c5-t03 steady 36 / stuck 8 /
steering 8, c6 all four, c6-ch07 all four, c4-ch01 all four (promises 3). And the turn then says the previous turn's re-ask
again word for word: stuck 6 → 8 in c5-t01, c5-t02, c5-t03, c6, c6-ch07; steering 6 → 8 in c5-t03, c6-ch07.

**Build:**
- A request for Hindi at a card **with** a `hindi` form: as today (the switch line, the form).
- At a card **without** one: it is a help request. The card's unsaid help under the ordinary help lead-in (no switch line,
  no sentence that names Hindi), then the card's question in the wording NOT said in the turn before (the card whole if
  the re-ask was just said; the re-ask if the card was). With every help spent: the honest "nothing easier" form and the
  other wording.
- Never the same question sentence in two turns running on this path (the existing `reaskRunning` rule did not cover it).
- Learning 021 adds forms; nothing in code assumes a card has one.

**Predicates (gated):** `hindiPromiseNoForm` (a switch-line seam on a turn whose card has no `hindi`): flags the rows above,
0 after. `reaskSameAfterHelp` (the turn's closing question equals the previous teacher turn's closing question, any path):
flags the stuck 6 → 8 rows, 0 after.

## B2. A picture request with nothing left to draw

**Heard:** the steering child's second request (row 16). c5-t01, c5-t02 and c6: the hints were spent and she **gave the
key** ("Is sawaal ka jawab 1/11 hai…"), and the row recorded `cell.picture: "hint"`. c4, c5-t03, c6-ch07: help with no word
about a picture. c4-ch01: the hint over the board kept (a contradiction by the gate's letter).

**Build:**
- When the card's `pictureBoard` and second view are spent (or it has neither): one authored line from the script's
  `joints.noPicture` forms (Learning 021 writes three per script; until a script has them, the line is not said and the rest
  still holds), then the card's unsaid hint if one is left (over the hint's own board, as help), then the card's question in
  the wording not just said.
- **Never the key.** A picture request does not advance the miss ladder and never closes a card. If no hint is left: the
  line and the question, nothing else.
- The row records what happened: `cell.picture` is one of `pictureBoard`, `view`, `hint`, `none`. It is never `hint` on a
  turn whose move is a key.
- A picture drawn at a request **stays up until the question it was asked at has been said** (c6-ch07 steady 18: the
  authored scale is replaced by the compare board at char 94, before the question; stuck 18 at char 85). The card's own
  board returns with the next turn.

**Predicates (gated):** `pictureKey` (a picture request answered by a key): flags c5-t01, c5-t02, c6 steering 16; 0 after.
`pictureGoneBeforeAsk` (a page change between a picture's first word and the turn's question): flags c6-ch07 steady 18,
stuck 18; 0 after. `pictureSame` stays gated and now also covers the "none" path: the line must be said when nothing is
drawn.

## B3. The second help is the card's own other reason; a mix-up met again gets the hint first

**Heard:** where a card is marked `whyAltAsHelp` the second help answers the mistake (c5-t02 stuck 74, offtopic 42; c6
steady 90, stuck 48, 62). Where it is not, she says the point's other wording, which is about the idea and not about what
the child did: c4 steering 30, 32 and offtopic 52 and stuck 26 to 32; c4-ch01 stuck 36, 38; c5-t03 steady 38, offtopic 44,
steering 48; c6-ch07 steering 16 to 18, offtopic 34. And a card whose mix-up was met earlier in the lesson gets the key at
the first miss with its own hint unsaid: c6-ch07 steady 48, offtopic 62; c5-t01 offtopic 28.

**Build:**
- The help order at a card after a miss or a request: the card's `simpler`; the card's `whyAlt` where marked (Learning 021
  marks every card the checker's rule 9 passes); then the point's other wording; then the key.
- A problem restated (`problemAlt`) is not help at a child's own step: it is said only at the asked step (c4 stuck 46;
  c5-t02 stuck 36, offtopic 24; c4-ch01 stuck 36, 38 restate the problem to a child who keeps giving the same wrong answer).
- A mix-up met again: the remediation is not said twice (as today), and the card's hint is said before its key.

**Predicates:** `helpNotOwn` (gated): the second help at a card is the point's other wording while the card has a marked
`whyAlt` unsaid. `keyBeforeHint` (gated): a key at a card with an authored `simpler` unsaid, except on the third miss.

## B4. A question is heard at most two turns running

**Heard:** the asked step's question in three or four turns running, in alternating forms, each after a request: stuck 16
to 22 (c5-t01, c5-t02, c5-t03, c6, c6-ch07), offtopic 14 to 18 (c5-t02, c6), steering 28 to 32 (c5-t01, c5-t02, c6), c4
offtopic 58 to 62.

**Build:** a question (card, step or closing question, in either of its forms) ends at most two teacher turns running. On
the third turn at the same question the help is said and the turn ends on an authored invitation that is not the question
("Ab batao." forms: Learning 021, `joints.yourTurn`); the fourth is the question again, or at an asked step the cue rule
tells the step. A picture turn counts as a turn at the question.

**Predicate (gated):** `questionThreeRunning`, on the normalised closing question of the turn, both forms treated as one.

## B5. A right verdict before a due return ends on the return's question

**Heard:** all seven topics, rows listed as an ending outside the five allowed: c4 steady 46, 56, 70, stuck 68, offtopic 54,
74; c5-t01 steady 40, offtopic 34, steering 36; c5-t02 steady 42, offtopic 28, steering 36; c5-t03 steady 40, offtopic 46,
steering 50; c6 steady 38, offtopic 28, steering 36; c6-ch07 stuck 48, offtopic 54 (inside a worked example), steering 38;
c4-ch01 offtopic 20. This was main's ruling in director30 (the return is a turn of its own) and it is reversed.

**Build:** when a return to a parked aside is due after a right verdict, the turn is: the verdict and its reason, the
back-to-your-topic joint, the return's question. No check-in. The next turn (her reply to the child's answer) goes on into
the live part as today. A return is never placed inside a worked example: it waits for the close.

**Predicate (gated):** `verdictCheckinBeforeReturn`; `returnInsideWorked`.

## B6. Carried from 047, built this time

- **A turn of 66 words or more** that holds verdict, reason, point and card is split at the point (the rows: c4 steady 86;
  c5-t01 steady 14, 72, offtopic 12, steering 26; c5-t03 steady 6, stuck 10, offtopic 8; c6-ch07 steady 66): verdict and
  reason end on the bridge form, point and card are the next turn. `vpcUnlisted` becomes gated at 0.
- **"Dekho," at most three times a lesson**, and never within four of her turns (8 or 9 in every steady lesson). The verdict
  forms that open with it get two more openers each (Learning 021).
- **The return uses what the child said.** If the child's aside already named the thing ("kal maine cricket khela, sixer
  maara"), the return does not ask it again, and no reply says "yeh tumne bataya tha" of something she is hearing for the
  first time (c4 offtopic 56; c5-t01 steady 42, steering 38; c5-t03 offtopic 48; c6 steering 38; c4-ch01 offtopic 50).
- **The greeting's start line is said only at the greeting.** "Theek hai, main shuru karti hoon." at a bridge's give-up
  (c4 stuck 62; c5-t01 stuck 64; c6-ch07 stuck 64) becomes the go-on joint.
- **A reason is not said in two turns running** at a worked close (c4 steady 88 → 90; c5-t03 steady 56 → 58, 74 → 76;
  c5-t01 steady 76 → 78; c6 steady 24 → 26; c6-ch07 steering 26 → 28).
- **A key's check-in never runs into the next card with no joint** (c5-t01 stuck 50; c6-ch07 offtopic 66).
- **047 R5's third bullet:** "nothing easier" followed by an aside's return.
- **The record:** `cell.part` on every row (null on four to seven rows a topic); `verdictGiven` on step confirmations
  (c5-t03 steady 15, 55, 73); the `seams` entry for a "not that" line (c5-t03 offtopic 62); `held.picture.line` equal to what
  was said (c4-ch01 steady 18, steering 14).
- **A reply in the child's gender:** "Achha, toh tumhe batting sabse achha lagta hai." after the child said "achhi lagti"
  (c6-ch07 stuck 52, steering 44): the reply form takes the child's own adjective ending, or uses a form that has none.

## Measure

- Every predicate named above gated, each first shown flagging its director32 rows (the fixtures) and then reading 0 on the
  dry matrix (six live topics; `--staged` for the staged ones).
- `check-run.mjs` exit 0; `repeatedAuthored` reported with the count that remains and why.
- `tests/r8-script-cards-hear.test.mjs` unchanged; the suites 0 failing.
- A `MEASURE.md`: per lesson, the Hindi requests and what each got; the picture requests and `cell.picture`; the turns that
  end on a check-in, each with its reason; the longest run of one question.

## Done means

On the dry matrix: no switch line without a form; no question three turns running; no picture request answered with a key;
no right verdict ending on a check-in before a return; no turn of verdict, point and card at 66 words or more; "Dekho," at
most three a lesson. Each proved by its gated predicate, not by reading.
