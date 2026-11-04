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

## Beat cards on (C1 item 5)

`beat-card-p412-strip.png`, `beat-card-w1280-strip.png`: a fresh board now carries its beat card, a header saying what kind of board it is (picture, formula, steps, example, takeaway), dots for the beats done so far, and "Checkpoint ahead" before a check. On by default; `TAXILA_BEAT_BOARD=0` turns it off.

## Timelines (C1 item 5, true scale)

| file | what |
|---|---|
| `timeline-across-*.mp4 / -strip.png` | c8-sst-ch09-t01 "India's Long Road to Freedom": 1905 Partition of Bengal, 1919 Jallianwala Bagh, 1930 Dandi March, 1942 Quit India |
| `timeline-down-*.mp4 / -strip.png` | c7-sst-ch16-t01 "Turning Tides": 1010 Brihadeeswara completed … 1206 Delhi Sultanate founded |

- **Source:** each event is the kit's own words and year, from the chains its authors wrote ("X (year) → Y (year)", or "X (9 December 1946); Y (…)"), so nothing is invented.
- **Scale:** each tick sits at its year's true place, so the long gap from 1025 to 1191 shows as a long gap.
- **Layout:** with up to 4 events, labels alternate above and below a left-to-right axis. With 5 or 6, the axis runs down and each event gets its own row. Labels are spread so they never touch, with a leader line back to the tick.
- **Reach:** 7 topics today (c7-c9 social science, plus the history of cell theory in c9 science). It is picked before the library's model-written flowchart for those topics.
