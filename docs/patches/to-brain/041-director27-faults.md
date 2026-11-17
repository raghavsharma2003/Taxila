# To Brain 041: director27 judged; the faults (no script format change)

Judgement and decision: `docs/design/round7/judgements/director27-2026-11-17.md` (`dc-r8-director27`). The judges' reports with every row: `evals/hybrid-side-by-side/results/2026-11-17-director27/judges/`. The run's rows are also under `tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-17-director27/`. Rows are 0-based indexes into a lesson's `director` array.

Built by an agent run from the main loop, as 039 and 040 were. If you were woken: build none of it; merge `int/r6` first.

What held and is not to be touched: `pickHelp`'s ladder and said set, the help board from the help function (0 of about 180 help turns over another part's board), the authored stop line, R1, the return turn, the two-turn wrap, the break at 75 words, a point with its own card to 75.

Brain 042 (quick questions and asked steps) follows this and is a separate order. Do not start it here.

## P1. A turn's board is chosen part by part

One fault in four shapes. In each the record shows it: `pageParts` lists the right board for the part, and `held.pages` / `boardRef` show another was drawn.

- **A remediation and its follow-up card in one turn:** c5-t02 steady 24, 90; stuck 20; offtopic 6; steering 10. `pageParts` gives the remediation two boards (its own, then the card's) and `held.pages` switches at the remediation's first word to the card's.
- **The hook and the first point with the card pushed to the next turn:** c5-t01 steady 2, offtopic 2. `boardRef` is the e1 card's board (`dens [2,3]`); the point's own board (`den 2`, in `pageParts` at character 187) was not drawn.
- **A remediation with no board in the script:** c5-t02 steady 118; c4 steady 58, stuck 22, offtopic 62, steering 32; c6 steady 46, 92, offtopic 30, 64. The follow-up card's board is drawn under the remediation, before that card is said.
- **A card posed after the AI line:** c6 offtopic 10. The card's page (in `pageParts` at character 71, `measured@1` with the side lengths) was dropped; `held` kept the names-only pentagon.

The law: a turn's pages come from the parts said in it, in order. A part with a board of its own pages it at its own first word. A part with no board keeps what is up. A card's board is never drawn before the card's first word, on any path.

Predicates, gated, written from the gate's sentences and not from these shapes:
1. every board on screen during a turn belongs to a part said in that turn or earlier in the lesson (never a card not yet said);
2. a part that has its own board has that board up at its first word;
3. a turn that says a card (first telling, re-ask or return) has that card's board up from the card's first word.

Each reads non-zero on the director27 rows above (a test pins the rows) and zero on the dry matrix after the fix. `fd-predicate-must-fail-on-judges-rows` and `fd-predicate-proved-on-last-runs-fault` in `context/` say why: a predicate proved only on the last run's shape missed this run's.

## P2. A remediation and its follow-up card are separate turns again

The limit for adding the follow-up card to a remediation's turn goes back to 60 words (two judges: two new stories and a question in 68 to 74 words is too much in one breath). The remediation ends on its check-in. A point and its own card keep 75.

## P3. A request gets help for the part she is on

- c5-t01 stuck 30 and steering 18: a clarify and a give-up after a key got the back-to line and the card, nothing to the child. After a key said as help, the turn says the after-key return form (`joints.afterKeyReturn`, Learning 016 writes three forms: this will come again, and now back to the earlier question, as one sentence; code fallback and a compile hole when missing), then the card. It is one joint; the go-on line and the back-to line are still never stacked.
- c5-t01 stuck 44: a fourth clarify at a worked step got the next step. With nothing left for the part, the turn says the `helpSpent` line and then goes on. `helpSpent` was not said once in 16 lessons.
- c5-t01 steady 80 and 82; c6 stuck 58, offtopic 54: a request at a bridge's check-in got the previous card's `whyAlt`, the row's `cell.part` is that card with `keyed: true`, and the next request got the go-on line though no key had been said as help. After a bridge the address is the bridge; a request there gets the bridge's own second wording. `keyed` is set only when a key was said as help.
- c5-t02 stuck 42: a second clarify after the key got the go-on line while the worked example's `simpler` was unsaid. The picker decides before any joint does.

Gated predicate: a teacher turn that answers a request (`intent` clarify, give_up, hindi, try_first where the walk treats it as a request) contains a help part of the part she was on, its key, or the `helpSpent` line. A back-to line with a card, or a next step, does not count. Non-zero on the rows above.

## P4. The closing question's miss goes through the picker

c5-t02 steady 126 and c6 steady 108: a miss on the teachback got the key at once; `teachback.simpler` was unsaid. First miss: the hint and the question again. Second: the key. The verdict stays its own turn over its answer board.

## P5. Joints

- **Back-to on every return to an earlier card.** c4 offtopic 32, steering 18; c5-t01 offtopic 12; c5-t02 steady 92, offtopic 10, steering 20; c6 offtopic 12. The seam is recorded `verdict → card` with no joint where the card is one that was posed before and left.
- **Lead-in before a worked problem on the aside-reply path** (c4 steady 46).
- **The go-on line only after a key said as help** (c5-t01 steady 82; P3's `keyed` fix covers it; keep `goOnAfterKey` and make it read non-zero on that row).
- c6 steering 32: "abhi aage badhte hain. Ab cricket ki baat karte hain" (the go-on line into the aside's return). After a key the return is led by the return form alone.

Gated predicate: a card said for the second time after other parts were said between (a return) is led by a back-to or after-key return joint. Non-zero on the seven rows.

## P6. Small paths

1. **The greeting's help path.** After a request at the greeting, the hook is said with the first point as on the ordinary path (c4 row 2 in all four lessons; c5-t01 stuck 2, steering 2; c6 stuck 2, steering 2), and the first point is always said (c5-t02 offtopic: the e1 point never said; the run's `partOnce` read 1 there).
2. **A picture asked for after a key** keeps its part and gets the part's authored caption (c5-t01 steering 14, c6 steering 14, c5-t02 steady 18: code captions).
3. **An aside reply is not said twice** (c4 offtopic 20 and 32, word for word). A repeated aside takes the next form (Learning 016 adds one).
4. **After a switch line, the part's own easier wording**: on a card, the card's `ask.simpler` before the point's (c5-t02 stuck 10: a Hindi request on the e1 card got the point's wording about 1/4; c4 stuck 10; c5-t01 stuck 8, steering 8; c6 steering 4, 8). If the picker's order is right and the wordings are the fault, say so with the rows and leave it to Learning.
5. **A tired child's bye.** "thak gayi, bye" gets one authored sentence about that before the goodbye (`joints.tiredBye`, Learning 016; code fallback). No menu, as now.
6. **Re-asks.** Where a card has an authored `reask`, the hint is followed by it and not by the bare question (c5-t02 steady 56, 110; c5-t01 stuck 72, steering 10: "Woh 0 se kitne kilometre par hai?" with no referent).

## P7. The record and the harness

- The opener before the first point and the stop line are recorded as their own kinds, not "aside" (c5-t01 stuck 4, steering 4; c5-t02 stuck 4, 68, steering 4; c6 three rows). The closing question's lead-in is not "point" (c5-t02 steady 124, c6 steady 106). "Phir se dekho:" is not a point (c4).
- `closeOffBoard` does not fire on the closing verdict over the closing question's own answer board (c4 steady 138, c5-t01 steady 128).
- The harness child answers the wrap's question with a short word about the lesson ("achha laga", "thoda mushkil tha"), not "haan".

## Done means

- Every gated predicate 0 on the dry matrix (`--topics c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --dry`), `check-run.mjs` clean, counts written.
- Each new predicate pinned non-zero on its director27 rows in a test.
- Report the check-in turns per steady lesson and the turns over 60 and over 75 words, before and after.
- `npx tsc -b`, the suites you touched, and `node --test tests/r8-*.test.mjs tests/r7-brain-*.test.mjs` pass. The main loop runs the full gate.
- Anything in this order you judge wrong or could not build: say so with the rows. Do not build something else in its place.
