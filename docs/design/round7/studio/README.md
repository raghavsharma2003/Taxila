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

## Tables (C1 item 5; every cell computed)

`table-*.mp4 / -strip.png`: c9-maths-ch02-t02 "Linear patterns and relationships", y = 3x + 5 with x 0-4 → y 5, 8, 11, 14, 17, the rows appearing one by one.

- **Sources:** the kit names "the table of N", or a linear rule y = ax + b in a linear-pattern, relationship or graph lesson. Units ("h = 20 m") and proof steps ("p = 2k") are never read as rules.
- **Reach:** 5 kits (c3 times tables, c6 multiples of 7, c9 linear patterns and graphs). The table is the board in 2 of them; in the other 3 a code pick comes first.

## The teacher's picture-in-picture never covers a piece (phones)

The table recording showed that with App's stage-first layout (D7) the teacher's picture-in-picture, in the slot's bottom-right, covered the board's last row on a phone. Every piece now stays clear of that square (`src/studio/pipZone.ts`, the box contract's pipZone): it is lifted above it when there is room, and fitted into the space above it when there isn't. `timeline-down-*` was re-recorded with the fix.

## Labelled diagrams (C1 item 5, science)

`label-plant-*.mp4 / -strip.png`: c3-evs-ch04-t01 "Parts of a plant". The plant is drawn as a teacher draws it, then each part gets its label on a leader line: fruit, flower, leaf, stem, root, soil.

- **Who gets one:** a kit that is about a thing's parts (`label-pick.js`): it names the thing and at least 3 of its parts. A plant also needs both stem and root, so "Kinds of waste: flowers, leaves, soil" is not a plant diagram. Each label is the kit's own word.
- **Reach:** 15 science and EVS kits (14 plant, 1 flower), all drawn by the explain rung and all passing every W gate (timed to her line). Before, they showed a key-terms bubble board.
- **Truth fix:** the old plant sketch drew no fruit, and its "fruit" anchor sat on a leaf. It is redrawn with a real fruit, leaves with midribs, a five-petal flower and branching roots, and a test now checks every label points at a drawn part.
- **Soil (fixed):** the ground under the soil line is now hatched, clear of the roots, and "soil" points at the first hatch, so its leader is short and no longer runs along the soil line.

`label-circuit-*.mp4 / -strip.png`: c5-evs-ch07-t01 "Energy makes things work". A closed circuit as a textbook draws it: the cell (long and short plate), wires, a bulb with its filament and a switch, each labelled in the kit's word ("battery" here). 8 kits get it (c5 EVS, c7 circuits and conductors, c8 heating effect and batteries, c9 conduction by ionic compounds); a bulb must be named.

`label-cell-plant-*`: c8-science-ch02-t01 (also c9 ch02 t01). A plant cell as a textbook draws it: the cell wall, the membrane just inside it, a large vacuole, the nucleus and chloroplasts in the cytoplasm, each labelled. "cell membrane" shows as "membrane", the part's short name, because the long name would not fit its column.

`label-cell-animal-*`: an animal cell with a round membrane, cytoplasm, and a nucleus with its nucleolus. It is picked when a kit names the cell's parts but no cell wall. No current kit does, so this one is recorded from a direct call.

`label-atom-*`: c9-science-ch08-t02 "Subatomic particles" (also t01, t03, t04). A helium atom: a nucleus with 2 protons and 2 neutrons, one shell, and 2 electrons on it, labelled down the right column so no two leaders cross.

- **Reach now:** 29 kits get a labelled diagram (14 plant, 8 circuit, 4 atom, 2 plant cell, 1 flower). All 29 pass every W gate, with every anchor on a drawn part.
- **Word fix:** a label is singular only through the part's own word list, so "nucleus" no longer clips to "nucleu" and "batteries" becomes "battery".

## Geometry to scale (C1 item 5, "geometry by constraint")

`geo-rect-*`, `geo-triangle-*`, `geo-circle-*`: a shape the kit states with its measures, drawn to scale.

| file | lesson | what's drawn |
|---|---|---|
| `geo-rect-*` | c4 "Distance around a shape" | 150 cm by 100 cm |
| `geo-triangle-*` | c7 "Constructing triangles" | sides 6, 5 and 4 cm, built from the three sides |
| `geo-circle-*` | c6 "Circles with a compass" | r = 5 cm |

- **Labels:** every measure is written outside the shape. The recordings caught labels touching a side and the rim, and both were fixed.
- **Reach:** 22 maths kits state a measured shape (8 rectangles, 4 squares, 5 triangles, 5 circles). All 22 pass every W gate. It is the drawn board in 11; before, those got a model-written flowchart, a key-terms board or a generic shape.
- **Refusals:** mixed units are never drawn, and an impossible triangle (2, 3, 9) is refused.

## India map places (C1 item 5, decision dc-r7-maps-no-outline)

Places are pinned at their true latitude and longitude on a labelled 5° grid with a compass. Nothing is drawn that could be read as a boundary: no outline of India, its states or its coast. An official Survey of India outline waits on the owner.

| file | lesson | what's drawn |
|---|---|---|
| `map-c6-sst-ch01-t01-*` | c6 "Locating Places on the Earth" | New Delhi, Ujjain, Mumbai, Kolkata, the Tropic of Cancer and the 82.5°E meridian |
| `map-c7-sst-ch03-t01-*` | c7 "Climates of India" | Leh, Delhi, Mumbai, Chennai and the Tropic of Cancer (its name in the margin) |
| `map-c6-sst-ch06-t01-*` | c6 "Beginnings of Indian Civilisation" | Harappa, Mohenjo-daro, Kalibangan, Dholavira, Lothal |
| `map-c5-evs-ch02-t01-*` | c5 "From source to sea" | Prayagraj, Varanasi, Patna: close together, so one name sits out on a leader |

- **Where the positions come from:** `data/geo/india-places.json` (61 places). Cities come from Natural Earth 1:10m populated places (public domain). Heritage sites, Kanyakumari and Darjeeling come from Wikidata's coordinate location (CC0). Each row names its source record, and `scripts/build-india-places.mjs` rebuilds the file.
- **Scale:** one scale both ways, so a degree north is as long as a degree east. North is up.
- **Names:** the lesson's own word ("Bombay" stays Bombay). A name sits beside its pin, or further out on a leader line that crosses nothing. A grid cross where a name needs the room is left out.
- **Reach:** 33 lessons name 3 or more places, and all 33 boards pass every W gate. The map is the board drawn in 29 of them. 138 of the 147 named places are pinned; the rest are too close to a neighbour to label (Delhi and Panipat, Ajanta and Ellora). Her line names only what is drawn.
- **Gate change:** W4 counts 3 or more evenly spaced degree labels ("15°N", "20°N", "25°N") as the grid's axis, like a number line's ticks. A single "23.5°N" is still checked against her line and the kit.

## Motion ops (C1 item 6, M1: the motion family)

Board motion used to be `move` only (a slide or a hop). M1 adds five more motions. Each acts on an earlier op of the same board, is judged where it ends (W19), and has a reduced-motion form that jumps to the end state.

| op | what it does | may act on |
|---|---|---|
| `rotate` | turns `deg` about a point | stroke, line, arrow, polygon, circle, sector |
| `scale` | scales by `k = [kx, ky]` about a point; a negative k mirrors (a fold) | stroke, line, arrow, polygon, rect, ellipse, circle (uniform) |
| `follow` | travels a path of offsets, at even speed along its length | anything, words included (only ever translated) |
| `sweep` | a filled shape's fill comes in from one side | a filled rect, circle, ellipse, polygon or sector |
| `morph` | a stroke's or polygon's points move to new ones | stroke, polygon |

- **Never off the board:** a motion that would carry its target off the board is refused, not clamped.
- **Composition:** motions on one op compose in script order. The Player draws the target under one `matrix(...)`, with stroke width held steady under a scale.
- **Recordings:** `motion-angle-*` shows a protractor arm turning to 60°, then the arc and "60°". `motion-area-*` shows a 5 × 3 area whose rows sweep in one by one, then "5 × 3 = 15". `motion-cycle-*` shows a droplet travelling sea → evaporation → cloud → rain → sea. These are hand-built demo boards (`evals/studio-timing/motion-demos.mjs`). M2 puts the same motion into the code templates children get.

## M2: the templates children get now move (C1 item 6)

Each code template animates its idea, timed inside its board. Each motion also ends exactly where the still board drew it: every template returns claims, and `expand()` checks them on the settled board. A motion that does not end on the explained state fails the template.

| template | the motion |
|---|---|
| angle@1 | the second arm is drawn along the first, then turns open by the angle |
| symmetry@1 | the mirror half is the first half folded over the line; a dot's image jumps across |
| column-op@1 (add) | a column that makes ten sends its 1 up to the next column |
| equal-groups@1 | a heap of dots is shared out group by group |
| place-value@1 | each digit rises into its place box, ones first |
| combine-count@1 (add) | the second group slides over and joins the first |
| area-grid@1, fraction-of@1, bar-chart@1 | rows / columns fill in, bars grow up from the axis |
| flow@1, cycle@1 | a token runs the process, arrow by arrow |

**Reach** (board-first explain beats, classes 4-7, 250 kits; `evals/studio-timing/board-motion-coverage.mjs`):

| | boards | moving before | moving after |
|---|---|---|---|
| all | 245 | 4 | 122 |
| maths | 138 | 4 | 61 |
| science | 67 | 0 | 35 |
| EVS | 40 | 0 | 26 |
| class 4 / 5 / 6 / 7 | 49 / 52 / 67 / 77 | 0 / 1 / 2 / 1 | 28 / 28 / 33 / 33 |

Still boards today: compare@1 (32), the catalogue library (≈54), label@1 (12), shape@1 (10), places, measured.

**Before and after, same kits** (`m2/<topic>-before-*` and `m2/<topic>-after-*`, p412 + w1280):
- c6-maths-ch06-t03 (angle)
- c5-maths-ch10-t01 (symmetry fold)
- c6-science-ch02-t04 (flow)
- c6-science-ch10-t03 (frog cycle)
- c4-maths-ch09-t01 (equal groups)
- c5-maths-ch11-t03 (area)
- c5-maths-ch01-t01 (place value)

**Fixes found on the way:**
- **Gate:** what a moving board shows (W8 counts, W10 claims drawn, W13 fractions, W15 named shape) is judged where it ends. Layout checks still judge the start, and W19 judges the whole end board.
- **Text pick:** the arithmetic text pick (pick.js) now reads an operation's own operands. It used to take the line's first two numbers, which drew "2 + 2" dots for a perimeter formula, "3 + 4" for "3 + 4 × 2 = 11", and "2 + 3" for the Collatz rule. Motion made those boards long enough to pass W6, which exposed it.
- **Products on the number line:** a product there is that many equal jumps from 0.
- **Bar charts from text:** these need a graph word or name labels.

## Perimeter picture request (main via Brain's S4 harness)

`perimeter-picture-*`: c6-maths-ch06-t01, where a child asks for a picture of the rectangle. Before this, no board came up. Now the worked example's park is drawn to scale (50 m × 30 m) and named "rectangle", "perimeter" is written, and a marker walks the boundary side by side, back to where it began.

- **measured@1:** now names the shape and, in a perimeter lesson, walks its boundary. It reads "12 m by 7 m" or "50 m long and 30 m wide" without the word rectangle.
- **Which source wins:** a shape from her line, the item or the worked example now outranks a perimeter-mode area-grid. A shape from some other item never shadows the board her line is about.
- **Masking:** a reveal is masked as "?" even while the timing check (W6) waits for her real line. While the item is the worked example, its stated givens (50, 30) are never masked, even when a later item's answer happens to match.
- **Picture requests in perimeter/area lessons** (asked plain, as "picture", as "perimeter"):
  - c5 ch11 t02: none → measured@1 (all three ways)
  - c6 ch06 t01: catalogue / catalogue / none → measured@1 (all three ways)
  - c6 ch06 t02: none → measured@1 (asked plain and as "picture")

## M3a: the decimal zoom (C1 item 6)

`decimal-zoom-*`: c7-maths-ch03-t03, item "Between which two tenths does 0.47 lie on a number line?". The number line 0–3 is drawn and the unit 0–1 lights up. A copy of that unit lifts off, stretches to the full width and lands as a second number line, joined to the unit by two guide lines. That line has its ten tenths, and 0.47 is marked on it.

- **The zoom is in the drawing, not the camera.** Zooming the board's view would scale the text along with the drawing, so labels that crowd at full size still crowd zoomed. The textbook "magnified segment" keeps every label a normal size, and is built from M1's move and scale. The stretched unit ends exactly on the lower line (a claim).
- **Reach:** 11 boards across the decimal lessons (c7 ch03 t01–t03), used when an item is explained or retaught. A decimal that is an item's answer is never chosen, since it would have to be written "?". A line that adds, subtracts, multiplies or divides never gets the zoom.
- **W9:** a 0 or 1 that ends inside a box (a place-value box) is now judged like any other digit. Only a bare 0 or 1 outside any box still counts as a number line's origin.
- **Pick fixes:** "2.85 + 2.50" is no 85 + 2, and a full stop after a number is not a decimal point.

## M3b: steps land on her words (C1 item 6)

When her real line names a step on the board ("Pehle food…, phir mouth…, uske baad stomach…"), that step's box, arrow and word appear just before she says it, about 250 ms early, instead of being paced evenly across her line. This is `server/stagecraft/board-sync.js` anchorSteps, applied in takePreselected, so no client or Voice change is needed.

- **Timing:** onsets are estimated from each word's position in her line × the line's length. Steps are only ever delayed, never reordered. The board still starts at once, and it ends with her line.
- **Fallback:** the anchored board must pass the full gate, or the evenly paced board is shown.
- **Reach** (first explain, classes 4–7; her line stood in by one naming each thing on the board in a short sentence): 168 of 241 boards have their steps on her words. By template: flow 88/91, label 12/12, cycle 4/4, compare 26/32, angle 6/9, shape 6/9. 16 anchored boards were refused by the gate and fell back to even pacing.
- **Not yet anchored:** boards with no named steps (fraction pictures, column work, places), where the words are numbers rather than names.
- **Live check needed:** the onsets are estimates. Voice's word timings (when they exist) would make them exact.

## M4: Stagecraft fed, never stale (C1 item 9, rest rule of item 11)

Offline replay: `node evals/stagecraft/replay.mjs`. It runs 94 recorded real lessons (conversation-r3 final6-after +
heldout-after; real Director, real replies; c4-7 maths/science/EVS; 469 lesson-minutes) through the PRODUCTION path:
StagecraftHost, productionCatalog, the instant builders, kernel-point `kernelPoint` / `feedPoint`. Spec build times are
drawn from calibration.json. $0, no model call. Results: `evals/stagecraft/results/replay-2026-11-05.json`.

What changed:
- The reveal point uses the skill being taught (`state.lastMove.skillId`), not the kit's first skill.
- Sources are fed at the point (`feedPoint`): a state input first (a topic, skill or beat change invalidates
  immediately), then the beat lookahead on a change (`lookahead.js`, interim until Brain's planBeat), then the stuck
  signal (two non-correct graded answers). `STAGECRAFT_FEEDS=off` turns the feeds off.
- seam `slotFor` has a skill guard (`hint.skillId`, Brain patch `docs/patches/to-brain/009-studio-slot-skill.patch`):
  a Stagecraft piece whose skill is not the move's skill is not revealed, and one still up leaves with that reply. The
  guard is inert until Brain applies 009.

| arm | pieces / 10 min | built ahead | at preferred rung | stale reveals | stale stage turns | stage active |
|---|---|---|---|---|---|---|
| today (production now) | 4.63 | 0 | 0.798 | 67 | 244/717 | 0.516 |
| + skill fix | 5.35 | 0 | 0.934 | 33 | 115/691 | 0.495 |
| + feeds at the point | 5.39 | 0.597 | 0.934 | 34 | 116/694 | 0.497 |
| + feeds after her reply (Brain hook) | 5.46 | 0.590 | 0.934 | 35 | 116/694 | 0.497 |
| + guard (M4) | 5.44 | 0.549 | 0.940 | **0** | **0/643** | **0.470** |
| guard without the rest rule | 6.33 | 0.582 | 0.925 | 0 | 0/782 | 0.554 |

Per subject (M4): maths 5.39 pieces/10 min, active 0.44; science 5.24, active 0.50; EVS 5.90, active 0.50.
Per class (M4): c4 7.06 / 0.46; c5 5.25 / 0.50; c6 5.62 / 0.50; c7 3.95 / 0.39. Stale reveals are 0 in every row.
Spec builds: 0.84 per lesson, about $0.001 per lesson.

How to read it: "built ahead" counts the reveals served by a candidate that was ready before the point, against
on-demand builds. Today the instant rung builds on demand in about 0 ms, so what the child sees changes mostly through
correctness (the right skill, nothing stale) and the rest rule, not through lead time. Feeding at the point gives the
same as a Brain hook after her reply (0.597 vs 0.590), so no hook is needed. Stage active 0.47 is inside the 35-55%
target (the earlier simulator's 0.85 had no rest rule or recorded boards). The guard reads the move's skill, the same
field the replay uses as truth, so its 0 means "what production checks", and the field itself is measured live.

## Fractions on a line (main, director3 judgement 2026-11-05)

c5 "fractions on a line" lessons used to get a shaded circle (fraction-parts@1) while she said "nishaan" and "gap". A
text about the number line now draws `fraction-line@1`. That covers the code pick (the kit item or worked example)
and the claims board (her line: "teesra nishaan", "5 equal gaps"). The board is 0 to 1 (or 0 to 2-3), with ticks at
every 1/den and only the whole numbers written. What it highlights follows the ask:

- the solved example: a dot hops gap by gap and the point is named;
- a named mark asked for its fraction: a tall tick with "?" and no dot (W9 reads a dot as the answer);
- an asked fraction: written above the line, never placed.

A line labelled with every whole number of its range is now its axis for W9.

Measured over c5-maths-ch02-t01 (the worked example + 19 items, code only):

| | fraction-parts@1 | number-line-hop@1 | none | fraction-line@1 |
|---|---|---|---|---|
| before | 8 | 3 | 9 | 0 |
| after | 0 | 0 | 2 | 18 |

All 18 fraction-line boards pass the full gate on their item, with the item's answers withheld. Elsewhere it fires on
c6-ch07-t02 (3 location items), c6-ch07-t03 (1) and c4-ch05-t02 (1, a measuring jug's marks). It is never used for
"write 7/4 as a mixed fraction", a decimal line or a roti.

Board refs for lesson scripts: see `BOARD-REFS.md`.
