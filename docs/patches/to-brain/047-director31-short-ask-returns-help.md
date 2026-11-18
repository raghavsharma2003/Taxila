# To Brain 047: director31 judged; the short ask by kind of help, returns by identity, a yes at a step, help that answers the mistake

Judgement and decision: `docs/design/round7/judgements/director31-2026-11-18.md` (`dc-r8-director31`). The judges' reports with every row: `evals/hybrid-side-by-side/results/2026-11-18-director31/judges/`. The run's rows: `tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-18-director31/` (rows are 0-based indexes into a lesson's `director` array; lessons are `<child>-<topic>.json`). Built by an agent run from the main loop. Learning 020 changes script lines and adds fields at the same time: write tests from the rules and from the director31 rows, not from a sentence of today's script.

What held and is not to be touched: a worked step told only on its cue; the aside reply's seam; the worked close's seam; captions chosen by the part; the return waiting for a remediation's follow-up card; a re-ask as the authored re-ask or the whole card; the bridge said with the verdict; the 75-word turn; the stop protocol.

## R1. "Back to the earlier question" by the card's identity
Rows: c4-ch01-t02 steady 34, 72, 102; stuck 48; offtopic 30; steering 32. She says a back-to joint before a card never asked. `server/brain/say.js` near line 3022, `saidBeforeNow`: a card counts as said before when the key of its last sentence is in `state.said`; four cards of that script end "Kya yeh sahi hai?". A card is said before only when that card (its unit or item id) was posed before. At steady 34 the false return also took the card's short re-ask and dropped its framing: a card posed for the first time is said whole. Gated predicate `falseReturn` (a back-to joint before a card whose id was never posed), pinned on the six rows; 0 on the dry matrix.

## R2. The short ask, by the kind of help
The short ask ("Ab phir se socho, jawab kya hoga?" and its forms) is said only straight after the card's own hint or the card's own easier wording (`ask.simpler` and the like, of that card), and only when her turn before ended on that card's question or re-ask. Never after another wording of the part (`pointAlt`, `sayAlt`, `problemAlt`, a remediation's wordings), after a picture caption, after "Haan, pehle tum try karo.", after a bridge's wording, or on a card that Learning 020 marks `askWhole: true` (its question asks for an imagined change). Everywhere else the turn ends on the re-ask or the whole card, by the alternation built in 046. Decide by the help's kind, not by comparing figures (`figureOther` goes). Rows: c4 stuck 18, steering 30; c4-ch01-t02 steady 86, stuck 44, 60, offtopic 56, steering 52; c5-t02 steering 16; c6 stuck 74, steering 20; c5-t03 steering 14, offtopic 14. Gated predicate `shortAskKind`, pinned on those rows.

## R3. A yes at an asked step; no question three turns running
Rows: c5-t01 stuck 16 to 22; c5-t02 stuck 16 to 22, offtopic 14 to 18, steering 28 to 32; c6 stuck 18 to 22, offtopic 14 to 18; c5-t03 stuck 16 to 22; c6-ch07-t01 stuck 16 to 22; c4-ch01-t02 offtopic 10 to 16.
- A yes at an asked step gets the step's question once more; at the next yes, a give-up or a clarify the step's easier wording at once (clause 22). The step is still told only on its cue (046 Q1).
- An asked step's question alternates with its authored `reask` (Learning 020 adds one to every asked step and to the closing question), as cards do. The closing question the same (c5-t02 steady 96 to 98; c6 steady 94 to 96).
- Gated predicate `stepAskRunning`: the same step or closing question sentence ending three turns running; pinned on the rows; 0 on the dry matrix.

## R4. A reason is not a request
Rows: c6 steering 31 to 32. "maine pehle chhota wala socha, phir bada" at an asked step was read as `easier`; she said another part's easier wording over that part's board and a check-in inside a worked example. A child's line about how she thought is read as a reason (find what in the fast reader or `readMethod` matched, as 046's follow-up found "ek ek karke"); at an asked step a reason gets the step's question again. Whatever the reader returns: help is never taken from a part other than the live one, and no comprehension check-in is said between a worked example's problem and its close. Gated predicates `helpOtherPart` and `workedCheckin`, pinned on the row.

## R5. Help answers the mistake
- After a second miss on a card, the next rung is the card's own second reason (`whyAlt`, said as help without the key) where the script has one, before the point's other wording. Rows where the second rung re-taught the point and missed the child's mistake: c5-t03 steering 34 to 36; c6-ch07-t01 stuck 62, offtopic 50 to 52, steering 16 to 18; c4-ch01-t02 steady 8 to 10. Learning 020 marks which cards' `whyAlt` can be said without giving the key (`whyAltAsHelp: true`); the others keep today's order.
- A give-up or a clarify at a bridge's check-in goes on to the next point and its card; the bridge is not said again in other words. Rows: c5-t01 stuck 54 to 56, offtopic 48 to 50; c6-ch07-t01 steady 24 to 26, stuck 54 to 56; c6 stuck 52 to 54.
- "Nothing easier" is never followed in the same turn by a return to an aside (c4-ch01-t02 stuck 68): the turn says the key over its answer board, as it does elsewhere when help is spent.

## R6. The turn's fit, with Learning 020
- A point and card that Learning 020 lists whole (`POINT_WHOLE` in the checker) is said as the verdict and its reason ending on a check-in, then the point and its card. Everything else already fits once the script is cut; `vpcLong` then reads "over 65 with the short reason and not listed". Pin on c5-t03 steady 52 and c5-t02 steady 76 with today's scripts.
- The first teaching turn after the start line is held to 75 with the start line counted (6 rows at 76 to 80: row 4 of stuck and steering in c5-t02, c5-t03, c6-ch07-t01): where it passes 75 the hook is said with the start line and ends on nothing; the point and its card are the next turn. If that needs an ending the walk does not have, say so and leave it.

## R7. Small
- A told worked step is said as sentences: the step's `do`, `result` and `why` are joined today as "do: result, kyunki why" (c5-t03 stuck 24, offtopic 62; c6-ch07-t01 stuck 24, steady 74; c4 stuck 44). Learning 020 writes a `told` sentence for every step; say it, and fall back to today's join with a compile hole.
- A why is not said in two turns running: the rule built in 046 (`whyRepeated`) at 0.70 overlap misses c5-t02 steady 22 to 26 and 82 to 84, c5-t03 steady 56 to 58 and 74 to 76, c4-ch01-t02 steady 64 to 66. Compare the close's why with every why said in her turn before, by authored field first.
- "Dekho," at most three times in a lesson (8 to 10 today): the lead-in to a right verdict's why rotates through forms that include none.
- `cell.part` on every row (null today on a return or AI-line row in every topic); `noFit` on every turn split for the board cap (c4 steady 56, 70; offtopic 54).
- The return to an aside asks one of the script's return forms that the child's own aside has not already answered (c5-t03 offtopic 48; c4-ch01-t02 offtopic 50), and the reply "yeh tumne bataya tha" is said only of something she told before (c4 offtopic 56).
- A picture request over a board with no second view: when Learning 020 and Studio 014 land, every card has something new to draw; until a card has, the request gets the card's unsaid help, not the caption read back. `pictureDrawn` reads "something new was drawn" as well as "the board named". Pin on c6-ch07-t01 stuck 18, offtopic 30.

## Measure
On the dry matrix (the five live lessons and the two staged ones, with Learning 020 merged): every gated predicate 0, the new ones included; no question sentence ending three turns running; no short ask outside R2; turns over 65 words in a verdict, point and card turn only where listed whole; report check-in turns per steady lesson by what the turn holds, before and after. If a count is not met, say so with the rows and stop there.

## Done means
The dry matrix clean, `check-run.mjs` exit 0, counts written; each new predicate pinned non-zero on its director31 rows; the adversarial probe 0; `npx tsc -b` and every suite that imports what you changed pass. Anything in this order you judge wrong or could not build: say so with the rows. Do not build something else in its place.
