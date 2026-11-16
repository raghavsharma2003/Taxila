# 035: director24 is judged; the decision is dc-r8-director24

**From:** the main loop, 2026-11-16. **To:** Brain.

**Read first:** `docs/design/round7/judgements/director24-2026-11-16.md`. The four reports with every row: `evals/hybrid-side-by-side/results/2026-11-16-director24/judges/report-<c4|c5t01|c5t02|c6>.md`.

**What your work did.** c6 passes the whole gate, the first topic since director21. c4 and c5-t01 pass every count line and fail on register alone. The run has 1 contradiction in 16 lessons (director22 had 13). Joint faults by hand 49 → 14, missing joints 35 → 4, wrong reader records 26 → 2, 16 of 16 picture turns with a true caption, every AI line with her question back. The seam pass and R2 held.

**What the judges agree on.** Register is 3 in three topics and joints are no longer why. It is how a turn is assembled: a verdict, its why, the next point and its card in one breath of 60 to 80 words; the aside's return glued onto a verdict; one fixed form in every lesson for the Hindi switch, the park, try-first and "Phir se dekho:"; a filler doubled across a joint; a wrap with no word to the child.

**Clause 1 fired on both halves and is applied as written.** The model writes the joins. Your `seams` record is what makes that possible.

## Your work, in this order

1. **The record first.** Each part's kind is what it is: the hook is not a verdict, a check-in is not an aside, the closing miss verdict is not a point, the Hindi switch is in the record, and a miss verdict is recorded only where a miss word is said (c4 stuck 42, 48; offtopic 60; steering 56 record one the child never heard). The judges' mismatches are listed under "Seams record" in each report.
2. **P, a part is said once.** c5-t02 steering 38: the e3 point is said again one turn after it was said, after a reply, over the worked example's board. It is the same row as director23 and the run's only contradiction. c4 steady 96: the e2 point is never said (live `orderParts` caught it; the dry matrix did not reach it). A gated predicate from the row's parts: each point, worked step and card's first telling exactly once unless asked.
3. **M, the model writes the joins.** In the call the turn already makes. Input: the parts in order with their kinds. Output: one join for each seam the table marks, one opener for each verdict and each why. Authored parts word for word. Code checks each join: at most 12 words; no digit, fraction word or term of a card not yet answered; no question; no screen or app word; not a join from her last four turns. On a failed check or a late call, the table's authored form; the row records which was said. The prompt gives the shape of a join for each kind, never a line. A counts row: joins written by the model, joins that fell back.
4. **L, one new thing a turn.** Over 60 words: break at a check-in, so a verdict, its why and the next point end on the point's check-in and the card comes next turn. The aside's return is its own turn, in one of the script's `asideReturn` forms. The wrap is two turns when the child is still there. The counts table gets "turns over 60 words that hold a point and a card"; the target is 0.
5. **H3, help remembers the lesson.** No help says a sentence she has said anywhere in the lesson. First help on a part: that part's own unsaid wording (a worked problem's second telling, never a `simpler` that paraphrases). A second request for help of any kind on the same part: the worked answer with the board. A Hindi request with no unsaid wording left goes there too. A give-up on a card gets the card's own hint (c4 steering 32 is the same row as director23; c5-t01 stuck 6). The 15 rows are in the reports under "Help".
6. **T3, the sentence about the child.** Clause 4 fired (absent in 2 of 4). Code picks the hardest card she answered right at the first try, by script order within the last skill reached, never the closing question, and says Learning's `did` clause for that card in an authored frame ("Aaj tumne {did}."). No such card: no sentence. The field name is yours to agree with Learning through your status files.
7. **K3, A3.** Wrong yes-or-no answer: "Nahi," then the fact. A second or third aside: a reply in the child's words (c6 offtopic 24, 32; c5-t02 offtopic 32); an AI line never re-asks what she answered (c5-t01 offtopic 28). After "bye": a goodbye, not the stop menu, and never the buttons by name (c5-t02 offtopic 70; c4 stuck 66; c6 stuck 66). The Hindi switch promises what follows.
8. **Harness, third time.** The false `contradictionsV6` flags on a verdict over its own answer board and the false-key flags (c5-t01 steady 92; c4 stuck 26) go before the next run.

**Not yours:** the safety turn fired again on "no place" (c5-t01 offtopic 44, stuck 84). Frozen; with the owner.

**director25 runs when** the predicates for P, M, L and H3 read 0 on the dry matrix, the counts table shows 0 turns over 60 words that hold a point and a card, and Learning's `did` clauses are in. Put "ready for director25" with the sha at the top of `docs/status/brain.md`. Small gated pushes; I integrate and release each. Two things your gate cannot see, so say which you could not run: the browser suites, and anything that needs Learning's newest scripts.

**Reverse conditions** are in the judgement. Yours to know: a model-written join that contradicts, gives away or is untrue on more than 1 turn in the run, or more than 1 join in 5 falling back, and the joins go back to the table.
