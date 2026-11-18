# To Brain 045: director29 judged; the picture is drawn from the part it is of, two rungs, the start after a second greeting request

Judgement and decision: `docs/design/round7/judgements/director29-2026-11-18.md` (`dc-r8-director29`). The judges' reports with every row: `evals/hybrid-side-by-side/results/2026-11-18-director29/judges/`. The run's rows: `tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-18-director29/`. Rows are 0-based indexes into a lesson's `director` array. Built by an agent run from the main loop. Learning 018 changes script lines at the same time: write tests from the rules and from the director29 rows, not from a sentence of today's script.

What held and is not to be touched: the turn shapes of 044 (point and card, hook and first point and card, remediation and card at 60, the verdict into the worked example); the 75-word turn; the short reason; the boards; the key over the answer board; the aside's return as its own turn; the two-turn wrap; the reader; `holdAuthored`; the op cap and its `noFit` splits; the stop protocol.

**After this order a teaching turn ends on one of:** a card's question, an asked worked step, the child's own step, a check-in after help, after a key or after a bridge, or "go on, you try" at a card. Nothing else.

## P1. A picture turn draws the board the walk named

Rows: steering row 14 in all four topics. The child asks for a picture after help on a card that was just keyed. `boardRef` and `screen.preselected` name the keyed card's answer board; `held.layout.panels[0].unit` is the lesson's held unit (`…-s1:e1`) and `screen.counts` are that first card's figure; she says the code line "Yeh lo, isi cheez ki ek aur tasveer, ise dhyan se dekho." The guard flagged `screenmismatch` on c4 and c6.

- One function decides the board a picture turn is of: the part being helped, or the answered card's answer board after its key. The intent handed to Studio carries that board as the held board for the turn, and Studio's held panel draws it (never the lesson's held unit by default). Read `server/stagecraft/board-first.js` `heldBoard` / `pictureTurn` and `server/director/propose.js` `heldOf`.
- The caption is that board's authored caption (`answerViewCaption` after a key, which Learning 018 writes for every follow-up card and check; else the card's `viewCaption` where the board is the card's own). Where the script has no caption for the board drawn, or the board has no second view: redraw the board alone, no split, and say help's own words with no line about a picture. The code line "Yeh lo, isi cheez ki ek aur tasveer…" is never said over a board that is not the one named.
- Gated predicate `pictureDrawn`, written from the law: on a picture turn, the held panel's drawn facts (`screen.counts` / the panel's unit) are those of the board the plan named (`screen.preselected`). Pin it non-zero on the four steering rows; zero on the dry matrix.
- A `screenmismatch` from the guard on a scripted turn throws under tests and the dry harness.

## P2. The page's start, one function, every path

Row: c5-t01 stuck 8. On a Hindi request the easier-words line ("Haan, ise seedhe, chhote shabdon mein kehti hoon.") is recorded inside the `simpler` part (part from char 0), so the help's board goes up at the line's first word. The line is a lead: it owns no page and the help's page starts at the help's first word. Take every page's start from one function; the `pageStart` predicate reads that function's output. Pin non-zero on the row.

## P3. Two rungs and two cues

- **At an asked worked step** a give-up or a clarify gets the step's `simpler` (every step has one), then the step's question again. The step is told only at the second request, or after a wrong answer (`stepMiss`, as today). Rows where the step was told with its `simpler` unsaid: c4 stuck 36; c5-t01 stuck 20; c5-t02 stuck 20, offtopic 16, steering 28; c6 stuck 20, offtopic 16, steering 28.
- **A remediation's unsaid wordings are help for its follow-up card.** Before that card's key: the card's own hint, then the remediation's `sayAlt`, then its `simpler` (each over its own board, as help is today). Rows where the follow-up card was keyed with those unsaid: c5-t01 steady 88, stuck 42, offtopic 22, steering 10; c6 steady 8, 90, stuck 42, 76, steering 10. The "nothing easier" line is said for a follow-up card only when these are spent too (c6 stuck 46, steering 16; c5-t02 steering 16).
- **A key is never the answer to an aside or to a yes.** c5-t01 offtopic 32 (two misses, then an aside: the aside got the key, her aside reply and a check-in) and steering 20 (a key in answer to "haan"; the row has no `cell`). An aside is parked or replied to as anywhere else; a yes to a re-ask gets the question again.
- The `keyEarly` predicate reads these rungs. Pin it non-zero on the rows above.

## P4. A second request at the greeting starts the lesson

Rows: row 4 in stuck c4, c5-t02, c6; offtopic c4; steering c4, c5-t02, c6 (and stuck / steering c5-t01 at 75 words). After the greeting's simpler wording, a second "pata nahi, aap batao" gets `joints.startAnyway` (Learning 018 writes three forms of six words or fewer, e.g. "Chalo, main batati hoon."; code fallback and a compile hole when missing), then the hook, the first point and its card. The line is a lead, not counted in the 75. `helpSpent` is never said before something has been taught; gated predicate `helpSpentCold` (the line with no part taught before it), pinned on those rows.

## P5. A right answer goes on

- The short reason is allowed after a right answer whatever came before it on that card, a hint included (043 R1 forbade it after a miss). Rows: c4 steady 48, stuck 70, offtopic 58, steering 60: a right verdict after a hint ended on a check-in where verdict, short reason, the next point and its card fit 75.
- A worked example's close says the answer without its why ("Sahi jawab. Toh poora jawab: …" and the script's `answer`) when the close with its why and the next card would pass 75. Row: c4 steady 76 (45 + 38 words). Mark the row (`closeShort: true`).
- c5-t01 steady 94: the closing question's verdict ends on a check-in. Say what rule makes it and whether the wrap can follow in the same turn; if it is the closing path as built (the verdict, then the two-turn wrap), leave it and say so.

## P6. Endings and seams

- "Haan, pehle tum try karo." at a card is an allowed ending: the turn waits for the child. Predicates that read turn endings accept it.
- An aside reply's turn never ends on a check-in. Three rows left: c4 offtopic 46 (reply, bridge, point, check-in: the `noFit` path dropped the joint and the card), c5-t02 offtopic 38 (reply, point, check-in), c5-t01 offtopic 32 (see P3). Where the live part and its card do not fit after a reply, the reply's turn says the reply, the joint and the card's question; the point is not said again.
- A park line is followed by its authored joint into the live part on every path, or (where Learning 018 rewrites the park forms to lead back themselves) by nothing. Rows where none was said: c5-t02 steady 40, offtopic 30; c6 steady 34, offtopic 24, 64; c5-t01 steady 36, offtopic 10. Agree the seam with the script: read `joints` after 018 lands and build to it.
- The short ask ("Ab phir se socho, jawab kya hoga?") is said only when the card's question was said in her turn before this one. After a hint about another figure, or a turn that did not say the question, she says the card's authored re-ask. Rows: c5-t01 stuck 64, 70, offtopic 30.

## P7. The record

- `whyShort: true` only on a row that said the card's short reason (c6: 18 of 20 flagged rows said the full why; c5-t02 steady 50, 64, 84, stuck 68, offtopic 48, 74, steering 62).
- A told worked step is not `point` (c4 stuck 36; c5-t01 steady 24, 50, 76, stuck 20; c6 three rows). The greeting's question is not `point` (row 2 in stuck and steering lessons, c4 steady 2).
- One `start` seam a turn; no `hook > hook` seam (row 4 and the switch rows: c4 steady 36, stuck 8, steering 8).
- A picture turn's `held.unit` is the unit of the board drawn (c6 steering 14).

## Measure

On the dry matrix (the four pilots, with Learning 018's scripts merged): every gated predicate 0, the new ones included; no turn over 75 words except where an aside reply, a park line or the start line leads, none over 90; no check-in after a point, a right verdict within a skill, an aside reply or a park; check-in turns per steady lesson reported by what the turn holds. Report the counts before and after. If a count is not met, say so with the rows and stop there.

## Done means

- The dry matrix clean, `check-run.mjs` exit 0, counts written.
- Each new or changed predicate pinned non-zero on its director29 rows in a test.
- The adversarial probe (`--adversarial`) reads 0.
- `npx tsc -b`, `node --test tests/r7-dry-matrix.test.mjs tests/r8-*.test.mjs tests/r7-brain-*.test.mjs` and every suite that imports what you changed pass. Tests that set a strict flag set it themselves.
- Anything in this order you judge wrong or could not build: say so with the rows. Do not build something else in its place.
