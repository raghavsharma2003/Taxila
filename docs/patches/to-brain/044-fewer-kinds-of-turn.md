# To Brain 044: director28 judged; fewer kinds of turn, help as a hard precondition, a joint keeps what is up

Judgement and decision: `docs/design/round7/judgements/director28-2026-11-17.md` (`dc-r8-director28`). The judges' reports with every row: `evals/hybrid-side-by-side/results/2026-11-17-director28/judges/`. The run's rows: `tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-17-director28/`. Rows are 0-based indexes into a lesson's `director` array. Built by an agent run from the main loop. Learning 017 changes the scripts at the same time (fit limits, quick questions deleted, worked examples reshaped, boards redrawn): write tests from the rules and from the director28 rows, not from a sentence of today's script.

What held and is not to be touched: the picker and its ladder; the key over the answer board; the closing question's path (hint, question again, key); the return turn and its back-to line; the two-turn wrap; the break at 75 words; the reader; the short reason; `holdAuthored`; the director27 paging shapes (all gone).

**After this order a teaching turn ends on one of:** a card's question, an asked worked step, the child's own step, or a check-in after help, after a key or after a bridge. Nothing else.

## T1. A point and its card share a turn

- After a right answer: verdict, reason, point, card, in one turn. The short reason is said when the full one leaves no room (as 043 built it).
- The 60-word cap on a point after a verdict goes (c6: a quick question was asked in 12 of 14 places where the point and its card fit 75).
- A quick question is asked only where the script has one on that beat (Learning 017 deletes the rest) and the point and its card do not fit. Where a script has none and they do not fit: the turn ends on the point's check-in, the row says so, and a gated predicate counts it (it should read 0 on the pilots once 017 is in).
- The first teaching turn: hook, first point and its card in one turn (017 cuts them to 75). The hook never ends a turn. After a request at the greeting, the greeting's simpler wording is its own turn and ends on its own question; the next turn is hook, point, card.
- The switch line is never said before a first telling (row 4 in 11 of the 16 lessons).

## T2. A remediation and its follow-up card: one turn at 60

Where miss form, joint, remediation and follow-up card fit 60 words, they are one turn: the remediation over its own board, the card's board at the card's first word. Where they do not, as today (the remediation alone, ending on its check-in). The help path keeps the same limit (c6 steady 52, stuck 22, 66, steering 8 and c4 steering 12 ran to 55 to 75 words).

## T3. The verdict's turn runs into the worked example

Verdict, short reason, lead-in, problem, and the first question, in one turn where they fit 75 (017 cuts the opening to 53). No invitation: `joints.workedInvite` is not read. Where they do not fit, the verdict's turn ends on its check-in and the row says so (gated count, 0 on the pilots once 017 is in).

## T4. A joint keeps what is up

The page of a part starts at that part's first word, on every path. A joint, a lead-in, an opener, a bridge and a hook are said over what is already up (nothing, if nothing is up).
- The try-first joint: c4 stuck 28; c5-t02 steady 32, offtopic 38.
- The closing question's lead-in: c5-t02 steady 132; c6 steady 112.
- The switch line before the first point: c6 row 4 in all four lessons.
- A point's board at its bridge's or hook's first word: c5-t02 steady 2, 44, 84; stuck 56; offtopic 2, 50; steering 60.

Gated predicate, written from the law: every page in a turn starts at the first character of the part that owns it. Pin it non-zero on the rows above and zero on the dry matrix.

## T5. Help is a hard precondition

A turn that answers a request (clarify, give-up, a Hindi or easier-words request, "let me try" where the walk treats it as a request) says, before anything else that moves the lesson: an unsaid wording of the last part taught, or that part's key, or the "nothing easier" line (`helpSpent`). Under tests and the dry harness a request's turn with none of the three throws.
- **After a key:** an unsaid wording of the key's why if there is one; otherwise `helpSpent`; then the after-key return and the card. The after-key return alone is not help (c5-t01 stuck 30, steering 18, offtopic 62; c5-t02 stuck 30, steering 58).
- **After an aside reply, a park or any turn that taught nothing:** the last part taught is the one before it (c5-t01 stuck 44, steering 40; c5-t02 stuck 44; c6 stuck 46, offtopic 36: a give-up or a Hindi request got the worked problem).
- **At a quick question, after the first request:** help on the point, then the quick question again or the card, never a check-in with the card waiting (c5-t01 steady 8; c6 steady 8).
- The `requestHelped` predicate reads the same three things and nothing else. Pin it non-zero on the rows above.

## T6. An aside reply or a park never ends on a check-in

It goes on into the live part with its authored joint, in the same turn. The reply and its joint (15 words at most; the park line likewise) are not counted in the turn's 75. Rows: c5-t01 stuck 42, steering 34, 38; c5-t02 stuck 42, steady 56, offtopic 10, steering 40; c6 stuck 44, offtopic 30, 34, 40, steering 34, 38; c4 steering 50. Also the aside straight into a worked problem with no joint (c5-t02 offtopic 36, steering 34): the joint is said. Gated predicate: a turn whose last teaching part is an aside reply, a park or a return ends on a check-in → 0.

## T7. "Let me try" at an asked step

She says the step's question again (the try-first joint, then the question). No step is skipped: c4 stuck 28 (steps 1 and 2 never said, recorded `told: true`); c6 offtopic 38 ("16 mein 12 jodo" with the 16 never said); c5-t02 steady 32, offtopic 38. A wrong answer to an asked step hears a `joints.stepMiss` form (017 writes three; code fallback and a compile hole when missing) before the step is told.

## T8. The record

- A re-ask after a hint is not `returnCard` (c5-t02 steady 98, offtopic 18, 20, 42, 56, steering 16; c4 offtopic 26, steering 22; c6 stuck 8).
- A step's confirmation is not `point` (c4 steady 46, steering 38; c5-t02 steady 74, 120, steering 36).
- Row 4's empty `opener` seam goes (c4 stuck, offtopic, steering; c5-t01 all four; c6 steady 4 records one line as both the switch and the opener).
- A quick question's row is addressed as the quick question, not as a check-in (c5-t01 steady 8, offtopic 32; c6 steady 8).
- Every row that says the short reason carries `whyShort: true` (c5-t01 steady 118 did not).
- A bridge or a remediation that owns no board in the script lists none in `pageParts` (c4 steady 64, 94, stuck 62; c6).
- "Phir se bolo" and "sawaal kya hai" at a card get the question again with no back-to line (c4 offtopic 42, steering 16).

## Small

- A second miss is followed by a new hint where one is unsaid, and the re-ask is not said twice running word for word (c4 steady 84, 86, offtopic 50, 52; c5-t01 steering 52, 54).
- After five misses a card gets its key (c5-t02 offtopic 18, 20: the point's wordings were said and the key never came). Say what rule let it run and close it.
- A child who has clearly said stop is not asked the stop menu again (c4 offtopic 70; c5-t02 steering 62).

## Measure

On the dry matrix (the four pilots, with Learning 017's scripts merged): every gated predicate 0, the new ones included; no turn over 75 words except where an aside reply or a park line leads (report those, and none over 90); check-in turns per steady lesson reported by what the turn holds, with none after a point or a right verdict within a skill, none after an aside reply or a park. Report the counts before and after. If a count is not met, say so with the rows and stop there.

## Done means

- The dry matrix clean, `check-run.mjs` exit 0, counts written.
- Each new or changed predicate pinned non-zero on its director28 rows in a test.
- The adversarial probe (`--adversarial`) reads 0.
- `npx tsc -b`, `node --test tests/r7-dry-matrix.test.mjs tests/r8-*.test.mjs tests/r7-brain-*.test.mjs` and every suite that imports what you changed pass. Tests that set a strict flag set it themselves (the leak check runs files in one process, where the runner's own variable is not set).
- Anything in this order you judge wrong or could not build: say so with the rows. Do not build something else in its place.
