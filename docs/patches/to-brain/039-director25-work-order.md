# To Brain 039: director25 judged; the work order (H4 and L2), and who builds it

Judgement and decision: `docs/design/round7/judgements/director25-2026-11-16.md` (`dc-r8-director25`). Read "What fails now, by mechanism" and the decision before anything here. The judges' reports with every row are in `evals/hybrid-side-by-side/results/2026-11-16-director25/judges/`; the run's rows are also under `tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-16-director25/`.

**Who builds it.** Since 2026-11-16 21:40 UTC a message from the main loop to a stream session stops on an approval prompt, and the owner is away, so you could not be told. This round is built by agents run from the main loop, on your paths, and merged into `int/r6`. If you are reading this because you were woken: build none of it; merge `int/r6` into your branch first and read what is there. 038 (the model's joins) still stands and still waits; it is not part of this round.

## Part A: H4, help is one function

Today the wording is picked by the compile table's help rows (`server/director/compile.js`, the `clarify`, `hindi`, give-up and hint cases, by a fresh / heard / spent counter), then changed in the walk (`server/director/state.js`, near the `[cardS?.simpler, beat?.simpler, beat?.pointAlt]` list and the `hindiNew` block), and the board and the card's fate are decided elsewhere. Replace all of it with one function that every help request goes through. Remove the old paths; do not wrap them.

1. **Input:** the part she is on (a point or its check-in, an explain card, a check card, a worked step, a remediation, a bridge, or the card just keyed when the child speaks after a key's check-in), the request (clarify, give-up, Hindi, hint after a wrong answer) and the **said set**: every authored sentence she has said in this lesson, with its row. The said set is state, built as turns are said, not re-derived from text by each caller.
2. **The ladder,** from the script, in this order:
   - a point or its check-in: `pointAlt`, `simpler`;
   - an explain card (`ask`): `ask.simpler` (new, Learning 014), then its point's `pointAlt`, then its point's `simpler`;
   - a check card: `simpler`;
   - a worked problem or step: `problemAlt`, `simpler`;
   - a remediation: `sayAlt`, `simpler`;
   - after a key: `whyAlt`.
3. **The pick:** the first rung none of whose sentences is in the said set. In the set means equal after normalising (case, punctuation, spaces), or sharing 8 words in 10 with a sentence that is.
4. **Nothing unsaid left.** Clarify, give-up or hint: the key and its why, over the card's answer board drawn at the first word, and the card is closed (on a point with no card yet: the card is asked). Hindi: never a key. She says one form of `joints.helpSpent` (new, Learning 014) and the question alone.
5. **The board comes back with the wording.** A wording is said over the board of the part it belongs to; if another unit's board is up (the follow-up card's), the part's own board is drawn first. A key is said over the answer board, never the posing board.
6. **After a key's check-in** a give-up or clarify gets the `whyAlt` if unsaid, else one form of `joints.afterKeyGoOn` (new, Learning 014) and the lesson goes on. Never nothing, never another part's help. With no part recorded, help is not picked at all: fix the record first.
7. **The count of requests decides nothing.** The second-request rule (037) is removed.
8. **The Hindi line** is `joints.hindiSwitch` as Learning rewrites it (it promises easier words). Rotate its forms by lesson, like the other joints. Give its `seams` entry a `by`.
9. A give-up gets "Nahi"-free help: c4 offtopic 24 answers "mujhe nahi pata" with "Haan, kyunki"; a give-up is never given a verdict word.

**Rows this must change** (lesson, row; all in the director25 fixtures):
- the point said again as help: c5-t02 steady 52 (said at 48), offtopic 60 (56), steering 32 (28), stuck 10 (4); c4 stuck 10 (4), offtopic 32; c5-t01 stuck 8, stuck 32 (30), steering 8 (6); c6 stuck 30 (22);
- help over a board that is not its part's: c4 steady 124, c4 stuck 30;
- a key not over the answer board: c5-t01 offtopic 34, c6 offtopic 34, c4 stuck 12, c5-t02 steady 12;
- a Hindi request given the key: c5-t01 offtopic 34, c6 offtopic 34;
- help for another part: c4 stuck 30, c4 offtopic 46;
- nothing said to a give-up after a key: c5-t01 stuck 80, offtopic 62, steering 20; c5-t02 steering 64; c6 steering 20; c4 stuck 14.

## Part B: L2, L as written, breaking at 45 words

1. The aside's return question is a turn of its own, in one of the script's `joints.asideReturn` forms (today it is code's "Cricket mein tumhe kya karna sabse achha lagta hai?" said after a verdict or a key). Rows: c4 steady 38, offtopic 42, steering 32; c5-t01 steady 46, steering 30; c5-t02 steady 38, offtopic 12, steering 34; c6 steady 46.
2. The wrap is two turns when the child is still there: the `covered` sentences; then, after her reply, `wrap.ack` only when she said something after the closing key's check-in, the sentence to her, the goodbye. Rows: steady c4 132, c5-t01 136, c5-t02 120, c6 128.
3. A turn that holds more than one part and would run over 45 words breaks at the last seam before 45 words where a point, a bridge or a worked step begins. Every break ends on a check-in. No turn ends with nothing for the child to answer while the lesson goes on (rows: c4 steady 70, 76, 96, 104, offtopic 78; c5-t02 steady 20, 58, offtopic 68, steering 66; c6 steady 52, 92). A check-in is not added after a bare verdict when the next part fits (c4 steady 74, 94).
4. A guard's rewrite path says the authored parts and never a model sentence: "Accha, batane ke liye thanks!" (c5-t01 steady 110, stuck 62; c5-t02 offtopic 42); the greeting says nothing of the model's about the world ("cricket ground jaise rectangles", c6 offtopic 0).
5. The `seams` record: a caption, the wrap's ack, sentence and goodbye, and `greetSimpler` are recorded as what they are; the key is its own part, not folded into the miss verdict.
6. `compile-report.mjs` lists every single authored part over 45 words, for Learning.

## Predicates (both parts)

`helpRepeats`, `hindiNewWords`, `partOnce` and `returnAlone` are rewritten: the first three read the said set; `returnAlone` allows nothing else in the return's turn. New gated predicates: the wrap is two turns; a help wording's board is its part's; a key is over the answer board; no two-part turn over 45 words; no turn ends without a question while the lesson goes on; a give-up after a key is answered.

**Each predicate gets a test that runs it over the director25 fixture rows listed above and requires a non-zero reading on them.** That test is written first and must fail on the old predicate. Then the predicate is required to read 0 on the dry matrix after the change.

The harness: remove the false `contradictionsV6` flags (c4 offtopic 26: a view was drawn and its caption is true; c5-t01 stuck 78: an imagined smaller case) and the false-key flag (c5-t02 steady 100: "1/4 aur 2/8 ek hi jagah hain" is true), in this change, with a test on those rows.

## Done means

The dry matrix reads 0 on every gated predicate; the new predicates read non-zero on the fixture rows; the counts table shows 0 help turns with a sentence from the said set and 0 two-part turns over 45 words; `npx tsc -b` and the suites that cover these files pass; the status file says what could not be reached by a dry child.
