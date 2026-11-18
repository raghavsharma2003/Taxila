# To Brain 046: director30 judged, three topics pass; a step's cue, a Hindi request, the reply's seam, 65 words, re-asks

Judgement and decision: `docs/design/round7/judgements/director30-2026-11-18.md` (`dc-r8-director30`). The judges' reports with every row: `evals/hybrid-side-by-side/results/2026-11-18-director30/judges/`. The run's rows: `tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-18-director30/`. Rows are 0-based indexes into a lesson's `director` array. Built by an agent run from the main loop. Learning 019 changes script lines and adds fields at the same time: write tests from the rules and from the director30 rows, not from a sentence of today's script.

What held and is not to be touched: everything orders 044 and 045 built that is not named below (the turn shapes, the picture turn, the page's start, the rungs, the start line, the park joint, the boards, the key over its answer board, the aside's return as its own turn, the two-turn wrap, the reader, `holdAuthored`, the op cap and its `noFit` splits, the stop protocol).

## Q1. A worked step is told only on its cue

A step is told at a second request (give-up or clarify) at that step, or after a wrong answer to it (`stepMiss`). Never after a yes, an aside, a remark, or anything else. Rows where it was told on the wrong cue: c5-t01 stuck 22 ("haan"; the row has no `cell`); c5-t02 stuck 22 ("haan"), offtopic 18 (an aside: park, joint, told step, sum and own step in 71 words); c6 stuck 22 ("haan"), offtopic 18 (an aside, 79 words).
- A yes at an asked step gets the step's question again (once), then the step's easier wording.
- An aside at an asked step is parked or replied to as anywhere else, and the turn goes back to the step's question.
- The gated predicate `stepToldEarly` reads the cue as `keyEarly` reads a key's. Pin it non-zero on those five rows.

## Q2. A request for Hindi gets Hindi

Learning 019 gives every card, follow-up card and asked step a `hindi` form of its question (`prompt` stays as it is; the new field sits beside `reask`). A request for Hindi at a card: the easier-words line (a lead, as built), then the `hindi` form, over the card's board. A second request for Hindi on the same card: the card's unsaid help as for any request, then the `hindi` form again. The "nothing easier" line (`helpSpent`) is never the answer to a request for Hindi. Rows: c4, c5-t02 and c6 offtopic 32 ("Koi baat nahi, isse aasaan shabd abhi mere paas nahi hain." and the same card). Also c5-t01 stuck 8: a Hindi request on a card got the point's other wording (a roti analogy about 1/2 for a 1/3 card) after promising "chhote shabdon": with a `hindi` form the card's own question is what she says.
- Code fallback where a script has no `hindi` form: today's behaviour, and a compile hole.
- Gated predicate `hindiSpentCold`: a Hindi request answered with `helpSpent`. Pin on the three rows.

## Q3. An aside reply's turn

- The reply is followed by its joint (`afterAside`) into the live part on every path, a card and a point alike. Rows with none: c5-t01 offtopic 58; c5-t02 offtopic 36; c6 offtopic 36.
- c4 offtopic 46 (director29's row, unchanged): reply, bridge, point, "Yahan tak saaf hai?", the card dropped because a park's return is due. Where the card is held for a due return, the reply's turn ends on the return's question (the return is said in that turn, after the point), not on a check-in. If that cannot be done without breaking `parkReturned`, give the trace and stop.
- c6 steering 50: a remediation said alone ends on a check-in because an aside's return is due; the same rule: the return's question ends that turn.
- `replyCheckin` becomes gated.

## Q4. The verdict, point and card turn is 65 words

- Where verdict, full why, point and card would pass 65 words, the short reason is said (where the card has one). Where the turn still passes 75, as today.
- A skill's bridge never rides in a turn that holds a verdict, a point and a card: the bridge goes with the verdict (ending on its check-in), and the next turn is the point and its card. Rows: c4 steady 42, stuck 64, steering 56 (74 to 75 words); c5-t02 stuck 74, offtopic 52 (a full why then a new figure, 72 to 75).
- Report the count of such turns over 65 before and after, and the steady check-in table (this adds check-ins after a bridge: say how many).

## Q5. Re-asks and the worked close

- No re-ask sentence is said in two turns running. The walk alternates: the card's authored `reask`, the short ask (only after help about the card's own figure), the card's last question clause, the card's `hindi` form is NOT part of this rotation. Rows: c5-t01 steady 8, stuck 62, 70, 72 (three running), offtopic 22, 62, steering 10; c5-t02 steady 88, 90; c6 steady 88; c4 steering 12, 14, 16 (the full card three turns running: a hint, a picture, then asked).
- The short ask after help about another figure: c5-t02 steering 10 (help about a pizza, then "Ab phir se socho, jawab kya hoga?"). The number test missed it; find why and close it.
- A worked example's close going into the next card says `joints.afterWorked` between them (Learning 019 writes three forms; code fallback and a compile hole when missing). Rows: c5-t01 steady 26, 56, stuck 34, offtopic 48, steering 36; c5-t02 steady 26, 64, 82, stuck 34, offtopic 72, steering 36.
- The close does not say a why that her turn before it said (c5-t01 steady 76 to 78: "4 gap = 1" three times; c5-t02 steady 80, 82).
- `repeatedAuthored` is split: a question said at the end of two turns running stays pending; the same re-ask sentence in two turns running is gated (`reaskRunning`). Pin on the rows above.

## Q6. Small

- A picture's caption is chosen by the part the picture is of, not by matching board parameters (c5-t01 offtopic 26 said e2's caption on a follow-up card with an identical board; c4 steady 18 the point's on the card's).
- `whyShort: true` only where the short reason's sentence was said in place of the full why: today it is set where the short text is a substring of the full why (c6: 19 of 22 flagged rows; c5-t02 steady 50, 66, 92, 94, stuck 74, offtopic 52, 76; two c6 rows are keys). The harness reads which was said, not a substring.
- Every teacher row has its `cell` (c5-t01 and c5-t02 stuck 22). The closing question's miss is not recorded `verdict` (c5-t02 steady 98).
- The verdict's lead-in to its why, "Dekho,", is heard 9 to 11 times a lesson, six times within four turns of itself: rotate it with the other forms ("kyunki" joined, a colon) so no form is said in two verdicts running.

## Measure

On the dry matrix (the four pilots with Learning 019's pilot changes merged): every gated predicate 0, the new ones included; verdict-point-card turns over 65 reported (0 where a short reason exists); no turn over 75 except park-, reply- or start-led, none over 90; the steady check-in table by what the turn holds; `reaskRunning` 0. If a count is not met, say so with the rows and stop there.

## Done means

- The dry matrix clean, `check-run.mjs` exit 0, counts written.
- Each new or changed predicate pinned non-zero on its director30 rows in a test.
- The adversarial probe (`--adversarial`) reads 0.
- `npx tsc -b`, `node --test tests/r7-dry-matrix.test.mjs tests/r8-*.test.mjs tests/r7-brain-*.test.mjs` and every suite that imports what you changed pass. Tests that set a strict flag set it themselves.
- Anything in this order you judge wrong or could not build: say so with the rows. Do not build something else in its place.
