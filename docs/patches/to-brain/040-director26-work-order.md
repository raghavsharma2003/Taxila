# To Brain 040: director26 judged; the work order

Judgement and decision: `docs/design/round7/judgements/director26-2026-11-17.md` (`dc-r8-director26`). The judges' reports with every row: `evals/hybrid-side-by-side/results/2026-11-17-director26/judges/`. The run's rows are also under `tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-17-director26/`.

As with 039: built by an agent run from the main loop (messages to stream sessions still wait on the owner). If you were woken: build none of it; merge `int/r6` first.

What held and is not to be touched: `pickHelp`'s ladder and said set (help with nothing new 14 to 1; no repeat in about 150 help turns), the return turn, the two-turn wrap, the break at 75 with the point-and-card split at 60.

## B1. A help wording's board is the one the help function returned, on every path

Six rows, all the run's count failures: a give-up, clarify or easier-words request on a remediation gets the remediation's other wording drawn over the skill's first check card for the same mix-up.
- c4 steering 12 (the 12-piece bar of s1 c2, never asked); c6 steady 48 (s2 c1's 40 × 25 playground, asked at 68), stuck 58, steering 8 (s1 c1's park); c5-t02 steady 82 (s2's Pinky/Bhai board, asked at 90), steering 12 (s1 c1's Roti 10/5).
- The rows record `held.unit` as the remediation (`…rem:<mix-up>` or `…#help`) and `boardRef` as the card's board.

Rule: a remediation's help is said over the remediation's own board (Learning 015 gives each one); a remediation with no board keeps the board that is up; it never borrows a card's. The page builder (`heldOf` in `server/brain/propose.js` and whatever feeds it) takes a help turn's board from the help decision and nowhere else. Make that an invariant the code enforces: in a test or dry run, a help page whose board is not the one `pickHelp` returned throws.

`helpBoard` read 0 on all six rows. Rewrite it from them; the test requires a non-zero reading on each of the six and keeps the director25 rows. `partOffBeat` is raised on 41 c6 rows of which 3 are real: make it mean a part said over a board that is not its beat's, or stop writing it.

## B2. The stop path says the authored line

c4 stuck 68; c5-t01 stuck 74; c6 stuck 72, steering 50 ("…samajh gaya. Buttons mein chuno: …"). The guard flagged the draft and the draft was kept. The stop turn is `FALLBACK.checkinStop` (or the script's form) and nothing else: no model draft, no buttons named. Gated predicate on those four rows.

## C1. Check-ins

1. A worked example's told steps are said two to a turn where the two fit in 75 words, with one check-in at the end of the turn. Learning 015 cuts each told step to 30 words or fewer. The child's own step is asked alone, as now.
2. No check-in after a verdict and its why when the next part fits in the turn (c4 steady 74, 86, 92: the estimate of a verdict's words is too high; count the words she will say).
3. A help wording at a step is followed by one check-in, not two.
4. **The measure, on the dry matrix, before this is called done:** every steady lesson has at most 22 turns that end on a check-in, and no run of more than two check-in turns back to back that is not driven by the child's own requests. Report the numbers. If the measure cannot be met, say so with the numbers and stop there: the main loop then drops the break of turns without a card, as the decision's clause says.

## J1. One joint at a seam; the go-on line in its place

1. The go-on line (`joints.afterKeyGoOn`) is said only after a key. At a worked step whose ladder is empty she goes to the next step with the step joint the script already has (rows: c5-t02 stuck 58, 64; c5-t01 stuck 44; c6 stuck 44).
2. The go-on line is a joint of the seam table. Where the back-to joint follows, the go-on line is not said (c5-t01 stuck 30, steering 18; c5-t02 stuck 46; c6 stuck 30, steering 18).
3. A new joint before a worked problem, `joints.beforeWorked` (Learning 015 writes three forms; a code fallback and a compile hole when missing), said between a verdict and the problem (c6 steady 16, 58, 86, stuck 34, offtopic 42, steering 40; c5-t02 steady 20, 72, 132, steering 42).

## N1. No request gets nothing

1. With no part recorded, the part is the last part she said, and help is picked for it (c5-t01 steady 128: "pata nahi, aap batao" after the check-in on c3's why went straight to the closing question; c5-t02 stuck 28: a bare card after "mujhe nahi pata").
2. A clarify or give-up at the opening's check-in is answered through the authored path: one authored line to the child, the first point, its check-in. The model drafts no teaching turn (c5-t02 steering 4: a turn with no parts, cut by the length guard, ending on no question; the same row made `orderParts` and `orderDisplaced` read 1 on row 6; c6 row 4 in all four lessons: the point with no word to her).
3. Gated predicate: a teaching turn has parts.

## R1. A skill's remediation is its own

c5-t02 steady 117 to 148: the same mix-up four times in the third skill and its remediation ("Ek patti ko 3 barabar hisson mein kaato…") never said, because that mix-up was remediated in the first skill. "Said once" is counted for each remediation, not each mix-up id.

## A4. Replies; W1. The wrap

- An aside said again, and a second or third aside, get a reply with the child's word in an authored reply form. "Oh, chauka. Achha." and a bare "Achha." are not replies (c4 offtopic 20, 32; c6 stuck 54; c5-t02 steady 40, offtopic 38). This was right in director25; find what the return's own turn changed.
- The closing verdict says its why (c4 steady 128; c5-t01 steady 130).
- What the child says just before the wrap is answered by the acknowledgement, not dropped (c5-t02 steady 157; c6 steady 113).

## The record

A help wording is recorded as help, not "point". No verdict is recorded on a turn where none was said (go-on turns: c5-t01 stuck 30, 44, steering 18; c5-t02 stuck 46, 58, 64; c6 stuck 30, 44, offtopic 56, steering 18, 32). A picture asked for after a key draws the answered board, not the question's (c5-t01 steering 14).

## Done means

The dry matrix reads 0 on every gated predicate; each new or rewritten predicate reads non-zero on the director26 rows named here; C1's measure is reported; the counts baseline is rewritten on the final tree with the moved counts named; `npx tsc -b` and the suites pass.
