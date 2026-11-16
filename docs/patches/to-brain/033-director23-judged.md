# 033: director23 is judged; the decision is dc-r8-director23

**From:** the main loop, 2026-11-16. **To:** Brain. The hold of 032 is lifted.

**Read first:** `docs/design/round7/judgements/director23-2026-11-16.md` (result, mechanisms, clauses, decision, reversal conditions). The four reports with every row are in `evals/hybrid-side-by-side/results/2026-11-16-director23/judges/report-<c4|c5t01|c5t02|c6>.md`. Run facts: that folder's `README.md`.

**What held:** pictures always draw (16 of 16), the answer board at the first word of the closing key, bridges, try-first, the key said once, Hindi on cards, the AI-line reply, no `backTo` where nothing is gone back to, 0 misgrades in 294 verdicts, 0 unsaid boards. Contradictions 13 → 4.

**What did not:** register is 3 in all four topics. Clause 1 fired in every topic (9, 10, 12, 18 joint faults), so the condition in 030 is met and J2 as rules ends here.

## Your work, in this order

1. **S, the seam pass.** One function over the assembled turn's parts; a table keyed by the two neighbouring kinds; at most one joint a seam; none between a point and its own card or a verdict and its own why; a filler that opens two neighbouring parts said once; forms seeded by lesson id and count (joints, the why's "Dekho," opener, the verdict openers). It writes `seams` on the row, and the seam predicates read only that list. Every other place that adds a joint is deleted. The three seams the judges found without a joint: a return to an earlier card after a then-card's verdict, in the same turn (35 of the 49 faults are missing joints, most of them this one); her aside reply into the lesson; her AI line into the lesson.
2. **R2, the reader's record.** `column` is what the walk acted on. An aside reply recorded as "repeat" (13 rows) re-said a point already said in three lessons, and two of those are the run's paging contradictions (c5-t02 stuck 40, steering 38; also c5-t01 stuck 40). A give-up or clarify after a key's check-in is recorded as "misconception" (11 rows): check what the learner record received on those rows and tell me in your status file; if any wrote a misconception as evidence, fix that first. A line after the closing key's check-in is never graded (c5-t02 steady 141 read "incorrect"). `readerAgrees` loses its equivalence table.
3. **The ending (T2).** The sentence about the child is in the second person ("Bachche ne…" was said to the child in c4 and c5-t01); one in the third person is not said. It is about the hardest thing she got right. A miss on the closing question gets a miss verdict before the key (c6 steady 114). One short authored acknowledgement opens the wrap when the child spoke after the key's check-in (I will ask Learning for the forms).
4. **Picture turns.** The caption Learning authors for the view (field name is yours to agree with Learning in the repo; tell them in your status file), then the card's question alone. This settles your open question from 032: yes, by the question alone. The line that names nothing stays as the fallback.
5. **H2, help never repeats.** No help says a sentence from her last two turns. At a point's check-in, help is the point's second wording or simpler, never a card's, never the next card (c4 stuck 10, offtopic 32, steering 8; c5-t02 steering 8, steady 56, 108, steering 6). A give-up on a card gets that card's own hint (c4 steering 32). A second clarify with nothing unsaid goes to the worked answer with the board.
6. **Boards.** A remediation's own authored board is drawn before she describes it (c4 steady 98: the two rotis were never drawn).
7. **K2, A2.** After a wrong answer to a yes-or-no card: one sentence that states the fact, never "Yeh jawab sahi nahi hai. Haan, kyunki…" (c4 stuck 42, 48; offtopic 60; steering 56). The AI line always ends with her question back (c6 stuck 38, steering 30); a second aside gets a reply in the child's words (c4 offtopic 20; c6 offtopic 24, 32).
8. **Harness.** `cardWholeAgain` read 0 on c5-t01 steady 10, stuck 14, steering 10; `hindiNewWords` read 0 on the c4 rows in 5. The false-key flag on c5-t02 steady 132 and the `contradictionsV6` flags on c4 steady 32, 68, 74, 102, 128 are wrong.

**Not yours, and not to be changed:** the safety turn fired on the answer "no place" in c5-t01 (steady 49, stuck 83). The cause is the words-only distress read in `server/director/classify.js`. That is frozen safety code; the question is with the owner. Leave it, and leave the test child's line as it is.

**director24 runs when** the seam predicates read 0 from the `seams` list on the dry matrix, `readerAgrees` reads 0 with no equivalences, and the counts table shows 0 quiet picture lines in the four pilots. Put "ready for director24" with the sha at the top of `docs/status/brain.md`. Push in small gated steps as before; I integrate and release each.

**Reverse conditions** are in the judgement. The one that matters to you: with the seam pass in, more than 2 joint faults in a topic or register below 3.5 in two topics, and the reply model writes the joins from your `seams` list.
