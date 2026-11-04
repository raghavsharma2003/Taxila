# Round 7 C1 Studio: the boards that move (fraction split, number-line jump)

Local recordings: headless Chromium, the real child lesson route, API mocked, no model calls. The board is the real board-first pick for c5-maths-ch02-t02 "Comparing fractions" (her first explain move).

| file | what |
|---|---|
| `split-p412.mp4` / `split-p412-strip.png` | 412×915 phone |
| `split-w1280.mp4` / `split-w1280-strip.png` | 1280×800 wide |

The strips show three frames, at 6.5 s, 7.1 s and 8.0 s after her line starts:
1. the whole, cut into 8 equal parts;
2. the parts mid-split, the whole's outline fading;
3. eight separate parts, one of them shaded.

The board then writes 1/8 < 1/4 and highlights it (in the mp4s).

- **What moves:** any whole cut into 2–12 equal sectors. 4 of 250 first-explain boards today: `ms-r7-board-motion-coverage`.
- **Reduced motion:** the parts land split at once.
- **When it doesn't split:**
  - a word is written inside the whole;
  - the moving board fails any gate as it ends; the still board is shown instead.
- **Owner check:** taste of the motion (the distance and the 0.7 s duration).

## The number-line jump

| file | what |
|---|---|
| `jump-p412.mp4` / `jump-p412-strip.png` | 412×915 phone |
| `jump-w1280.mp4` / `jump-w1280-strip.png` | 1280×800 wide |

The board is c1-maths-ch06-t02 "Subtracting within 20", from the item "start at 18 and jump back 5". The strips show three frames:
1. just before the hop: the dot on 18;
2. mid-hop: the dot in the air on the −5 arc;
3. landed on 13.

Each hop of a `number-line-hop@1` board moves its dot as the arrow draws, and the hops add up. Code picks this template for 80 maths items and worked examples (31 kits, classes 1-9).

The recording also caught a still-board bug, fixed in the same commit. The number line was drawn as long as its label count gave (about 180 units) while the dots and hops were placed on a 340-unit line, so the start dot sat off the end and the labels ran together ("1213"). A number line now carries its own length (`w`).

Re-record with `node evals/studio-timing/record-split.mjs <board.json> <outdir> [name]`.
