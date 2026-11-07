# Run shots, r7 Games: nishana ÷ / decimals ± and kon lines / cross / ends (360 px, real Chromium)

The cert shots only show a level's opening board. These show the run itself. Each level is built in the play dev harness
(`src/play/dev`, the same generator the server runs). The law's own acts are applied through `window.__play.dispatch`:
`solve()` for a solved run, `malActs(<rule>)` for a misconception run. The run then plays out in real time and Chromium
takes a screenshot at 360 x 740. The shots were taken at 2x and stored here at 1x, 64 colours.

| File | What it shows |
|---|---|
| `nishana-c7-ch10-t02-hop-f1-sol` | −10 ÷ (−5): two hops of −5 from 0 land on the "reach here" flag; the pod sits at 2 |
| `nishana-c7-ch10-t02-hop-f1-mal-div-neg-neg` | the pod at −2: the chain for −2 hops of −5 runs the other way to +10, past the flag; "off by 4" |
| `nishana-c7-ch10-t02-hop-f3-sol` | fade 3: the chain appears only after "Here!" |
| `nishana-c7-ch03-t04-hop-f1-sol` | a decimal ± landing on a line ticked in tenths |
| `nishana-c7-ch03-t04-hop-f1-mal-dec-smaller-from-larger` | 1.5 − 0.45 taken as 1.15; the true 1.05 is flagged, "off by 0.1" |
| `kon-c7-ch05-t02-parallel-sol` / `-mal-not-meet-on-page` | parallel: solved; then lines that merely look parallel on the sheet, the run zooms out to where they cross, "off by 7°" |
| `kon-c7-ch05-t02-perp-sol` / `-mal-perp-upright` | perpendicular: the set-square fits the corner; an upright line 2 leaves the set-square off by 45° |
| `kon-c7-ch05-t03-corr-sol` | corresponding angles: canal 2 parallel, the tick |
| `kon-c7-ch05-t03-alt-start` / `-mal-alt-same-side` | the protractor at X2 before the run; the same-side belief, the canals meet, "off by 40°" |
| `kon-c6-ch02-t01-ends-sol` / `-mal-ray-two-ends` | ray PH: stop 1 at P, the light runs on past H; two stops for a ray leave a segment |

**Found and fixed while shooting:** the cross run's "off by" chip never appeared, and its meeting ring froze at about
60%. The view stopped redrawing at 1.6 s, but the chip draws only after 1.6 s. `kon.lines.view.ts` now keeps drawing
until `RUN_END` (2.0 s). `tests/r7-games-kon.test.mjs` checks that every timed beat of the run lands before `RUN_END`.
