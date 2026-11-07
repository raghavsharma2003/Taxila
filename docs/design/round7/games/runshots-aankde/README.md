# Run shots, r7 Games: aankde (data: tallies, the mean, the median, the mode; 360 px, real Chromium)

The cert shots only show a level's opening board. These show the run itself. Each level is built in the play dev harness
(`src/play/dev`, the same generator the server runs). For the `-sol` / `-mal-` shots from the c6/c7 file names, the law's own acts
went in through `window.__play.dispatch`: `solve()` for a solved run, `malActs(<rule>)` for a misconception run. The
`-taps-` shots used no dispatch at all. Every slip, block, line, card, peg and crate went in by `page.mouse` on the canvas
targets the view registered, and the run button was pressed by its role. All six goals were solved that way. The run
then played out in real time and Chromium took a screenshot at 360 x 740. The shots were taken at 2x and are stored
here at 1x, 64 colours.

| File | What it shows |
|---|---|
| `aankde-c6-ch04-t01-sort-start` | tally/sort, the opening board: the top slip on the pile, four rows, each with its ⟋ "across" button; the next stroke's place dashed (fade 1) |
| `aankde-c6-ch04-t01-sort-mal-tally-five` | every slip in its row but the fifth stroke drawn upright: the row reads 7, but it is not bundled, so the row is marked |
| `aankde-sort-taps-sol` | sort solved by real taps: the car row bundled (four upright, the fifth across) plus two; the total row read |
| `aankde-c6-ch04-t01-missing-mal-tally-five` | tally/missing: the guava bundle read as four, so the lost mango row is stroked one too long; the total row reads 13 against 12 asked |
| `aankde-even-taps-sol` | stack/even solved by real taps: blocks moved tower to tower until all five stand level ("each: 3") |
| `aankde-c7-ch13-t02-pour-mal-middle-value` | stack/pour: the line at 2, the data value nearest the mean (3); the blocks above fill the two gaps and 4 are left over |
| `aankde-c7-ch13-t02-pour-sol` | the line at 3: every block above drops into a gap below; "each: 3" (the mean, which is none of 2, 1, 8, 1) |
| `aankde-c7-ch13-t02-middle-mal-unordered` | line/middle: the written line pegged in its middle; the fold ends on 5 and 39, and the out-of-order cards are marked |
| `aankde-middle-taps-sol` | the cards swapped into order by real taps, the peg in the gap between 21 and 24; "middle: 22.5" |
| `aankde-mode-taps-sol` | tally/mode solved by real taps: the sizes tallied, the stock crate on size 9 (sold 6 times) |
