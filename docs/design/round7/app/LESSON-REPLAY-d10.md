# One full lesson through the real player: director10 steady-c6-ch06-t01 (r7 App, 2026-11-07)

How it was run:
- **Source:** origin/claude/r4-conversation 14883b7f, `evals/hybrid-side-by-side/results/2026-11-07-director10/`: the run's `director` turns and its `segments.jsonl` rows for this lesson.
- **Teacher turns:** 42. 15 of them are paged, with 33 segments; the rest keep their `boardRef`.
- **Boards:** every page's board was built with the run tree's own `expand()` (templates.js at 14883b7f, B3). All 59 expanded with no refusal.
- **Rendering:** each board was drawn by the real Desk (the dev Desk's work tray, `src/child/lesson/dev/DeskDev.tsx`) at 360x800. Her segment text was the caption and the turn's card was the question, injected through `window.__deskScript / __deskLine / __deskAsk`.
- **Checks per shot:** a board drew; drawn SVG text pairs overlap; text off the board; caption visible and not clamped.
- **Timing:** the paged turns were re-composed with `pagesBoard`'s own rules (board-first.js 14883b7f):
  - each page is retimed to its segment's speech with `retime` (0.5x to 2x, 12 spoken characters a second);
  - page i starts at the speech onset of its cut;
  - every page but the last is clamped to end by the next start (startMs ≤ next − 120) and erased there.

Contact sheets: `shots-replay-d10/contact-1.png` (T01–T45) and `contact-2.png` (T47–T83), plus the turns named below.

## Renders: clean

| Check | Result |
|---|---|
| A board drew | 59 of 59 |
| Text overlap or text off the board | 0 |
| Caption on screen | 59 of 59 |

T01 and T03 have no board. The dev Desk shows its default board there; that is the harness, not the lesson.

## Timing: one page loses its motion (Brain / Studio)

**T55 p0 is the only page whose content is crushed.**
- **What it is:** the verdict "36 cm sahi nahi hai." takes 1.67 s and redraws the 6 cm square with its perimeter trace.
- **What happens:** retimed at 0.5x, the trace runs 1.33 to 2.69 s. Three of its four `follow` ops are squeezed into 1.547 to 1.667 s, so the walk around the edge, the motion that teaches perimeter, is effectively lost.
- **The same board was already up:** T53's last page left this exact square on screen.
- **Suggested fixes:**
  - when page 0's board is the board already on screen, keep it instead of redrawing;
  - a page whose retimed drawing cannot finish before its switch drops its motion ops, the still board, as `takePreselected` already does for a refused split.

**Every other non-last page (16) finishes before its switch.** Nine of them hold the complete board less than 1 s before it is erased: T9, T21, T39, T47, T53, T61 p1, T73, T77 p1 and T81 p0, from 0.30 to 0.99 s. That is an observation, not a defect.

## Card and board: the pinned question meets other boards (App, needs a wire decision)

In **15 of 58 board renders**, the pinned question names a different figure from the board drawn. The Desk keeps the pinned ask until the server sends a different one (`useDesk.ts` item and nextAsk). There are two kinds:

1. **A paged turn's verdict page** (T9-0, T81-0).
   - **No answer chip on the card:** the new question pins at once, over page 0's old board.
   - **An answer chip on the card:** the new question waits for the hand-over, so page 1's new board sits under the old, answered card until she yields.
   - **Proposed:** the card switches at the page switch where the card's board appears (the script's last `switches[].atMs`), not at the first frame and not at the hand-over. Brain should confirm that the card belongs to the last page.
2. **A board about another figure under an open card**: a worked example of a triangle under a rectangle question (T21-1 to T25), the 24 x 18 example under the bookmark card (T61-1 to T65), and compare@1 under the tile card (T77-1).
   - **Proposed:** while the board's figure is not the card's, the card collapses to a quiet "Your question is waiting".
   - This needs one signal on the wire: Brain marks `ui.ask` with the card's board, or the studio artifact with "this is the card's board".

## Fixed here (App): her caption lost words at 360

**Before:** 39 of 273 caption clauses of this lesson were cut by the two-line clamp at 360. The caption box beside her picture is 195 px, and the clause chunker allowed 9 words, or 12 with the tail merge. At 412 it was 6.

**Now:** `captions.ts` chunks a clause into the fewest pieces of at most 9 words and 38 characters, balanced by length. After the change, measured in the real caption box, 0 of 343 clauses are cut at 360 (class 6 and class 4), at 412 and at 1280. Only one chunk is 2 words ("Aamne-saamne ki").
