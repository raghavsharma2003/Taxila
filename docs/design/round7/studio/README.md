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
