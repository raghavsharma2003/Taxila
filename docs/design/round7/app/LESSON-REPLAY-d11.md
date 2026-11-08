# director11 through the real Desk (r7 App, 2026-11-08): a preview of what director12 will draw

**Source.** claude/r4-conversation 9ebf06c7, `evals/hybrid-side-by-side/results/2026-11-08-director11/`. Two lessons:
- **steering-c5-ch02-t01:** 26 teacher turns, 34 pages, 7 paged turns. The second-view and asked-mark case.
- **stuck-c4-ch05-t01:** 34 teacher turns, 46 pages, 10 paged turns. The answerBoard and paging case.

**Tree.** int/r6 694f58557, which has Studio's S1–S3 second views, `ofCard` wired end to end, and App's card timing.

**How each page was built.** Integration's own `expand()` built every board; all 80 expanded. The turn's card went through App's real reducers (`cardOnAsk / cardOnPage / cardOnHandover`), and the page was rendered in the real Desk at 360 with her segment as the caption.

**`ofCard`.** The run log does not record it, so it is emulated as Brain defines it: a page is the open card's own board.

**Second views.** These are the `altCall` boards for the two turns whose screen reports one, built and rendered the same way.

**Timing.** Paged turns are re-composed with int/r6 `pagesBoard`'s rules:
- retime to the segment's speech, 0.5–2x;
- a page that cannot finish by a fast reading (~330 ms a word) is drawn still;
- the next page starts at its onset;
- a page-0 board already on screen is kept still.

**Not a gate.** Brain's v6.3 paging (P1) is not in this run.

## The numbers

| | steering-c5-ch02-t01 | stuck-c4-ch05-t01 |
|---|---|---|
| Board pages rendered (Desk at 360) | 32 + the second view | 44 + the second view |
| A board drew / text overlap / caption cut | 33/33, 0, 0 | 45/45, 0, 0 |
| **Card over another figure, shown in full** | **0** | **0** |
| The card waits ("Your question is waiting") / on its own board / no card | 13 / 18 / 1 | 18 / 26 / 0 |
| Paged turns with a new card: the card switches exactly on the last page | 1/1 | 5/5 |
| **Second views that drop the asked mark or label** | **0 of 1.** T15: the eighths line's asked mark becomes one 8-part bar, 1 shaded, "?" with the line's 0 and 1 | **0 of 1.** T19: Cake A / Cake B become strips; Cake A keeps 1 big + 2 small, both titles |
| **Captions that name something not drawn** (strict: she describes the board as showing it) | **2:** T13, T29-1 (the card T29–T35) | **0** |
| **Pages whose drawing is crushed** (squeezed into the last 120 ms before the switch) | **0.** T45 p0 would lose its line and "?", but it is the board T43 left up, which the pager keeps still | **0** |
| Pages held complete under 1 s before the next (verdict pages, an observation) | 6 | 3 |

**Caption check.** Fractions her segment says that the page does not write: 9 pages in steering, 14 in stuck. On reading, all but the two above are as they should be:
- an echo of the child's wrong answer ("2/1 sahi nahi hai", "3/8 km sahi nahi hai");
- a claim to weigh (Zoya's "1/3, 3 ke paas");
- a misconception put as a question ("rangin hissa 1/1 hai?");
- the child's own answer quoted in a probe;
- a share of a set over its groups ("8 ka 1/2 = 4").

## Worst shots (`shots-replay-d11/`)

1. **steering-T13** (data): "Us spot ka bhi number hai: 1/2 km, 0 aur 1 ke beech" over the card's line in eighths, whose midpoint has no label. The 1/2 she points at is not on the board.
2. **steering-T29-1, T35-1** (data): the open card asks "Agar yahi line 10 barabar gaps mein bati ho, toh 0 ke zyada paas kaun hoga: 1/5 ya 1/10?" over its own board, the line in eighths. The card is about a line the board never draws, through T29–T35.
3. **steering-T11-0** (timing, an observation): "near 3 sahi nahi hai." is a 4-word verdict page, held about 0.5 s on the halves line before the next page. Readable, but brief.
4. **stuck-T63** (borderline): "8 ka 1/2 = 4" over equal-groups 2 × 4. The groups are drawn and "1/2" is not written; the judges may count it.
5. For contrast, **steering-T15-secondview** and **stuck-T19-secondview**: the two S1–S3 second views, both now right.

## For the Desk (App)

Nothing to fix:
- every card switch and wait matched the board;
- no board failed to draw;
- no text overlapped;
- no caption was cut (the 38-character chunking holds on this lesson too).

Contact sheets of every page: `shots-replay-d11/contact-*.png`.
