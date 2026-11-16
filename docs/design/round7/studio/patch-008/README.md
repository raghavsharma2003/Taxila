# Patch 008 (Design): the board fills its card. What C1 Studio built

These were taken on the Desk dev fixture (`src/ui-v3/kaksha/dev/desk.html?class=5&fixture=work-beat`). The `-tx` images
set `data-tx` on the page, standing in for Design's round 8 root. The `-live` images have no attribute: that is what is
live today, and it is unchanged.

| | box at 360 | box at 1366 |
|---|---|---|
| live (head above the box) | 338 × 253 | 765 × 574 |
| under `[data-tx]` (head folded into the box) | 338 × 287 | 810 × 608 |

1. **Head folded.** Under a `[data-tx]` ancestor, the "Picture" chip and the beat dots sit over the box's top-left
   corner, on the board's ground, and the box takes the whole slot. A drawing that reaches into that corner moves down
   by the head's height (`src/studio/boardView.ts` `keepHeadClear`, the `--pip-zone` idea at the top-left). A drawing
   whose corner is empty keeps its frame.
2. **Fitted to content.** Under the round 8 card, the frame crops to the drawn content plus a margin of at least 14
   units at any gain; elsewhere a frame still needs an 8 % gain. It is still fixed once per piece.
3. **The "1/2" on the line.** This is the dev fixture's own hand copy of the board, not the server's
   (`src/child/lesson/dev/DeskDev.tsx` BEAT_SCRIPT: label at y 30, rectangle at y 46). The server's `fraction-of@1`
   puts the label at y 33 over a rectangle at y 62, so the label ends 5.6 units clear of the line. In the `-tx` images,
   the fold moves the fixture's label clear too.
4. **Fill tints.** Paper draws focus and answer fills with Design's tints (#DCE0F5 and #DAEFE8, at full strength)
   instead of stroke × alpha. Night has none, so night is unchanged. The contrast test checks ink, focus and answer on
   each tint at 4.5:1.
