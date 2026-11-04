# Games week 1: recordings of new levels (headless, 412 × 860)

Each recording plays one new r7 level in the play dev harness (`src/play/dev`): first a wrong attempt (the law draws its
answer and the exact gap), then the right one. Each strip shows three frames: aim, miss, solved.

| Level | Topic | File |
|---|---|---|
| kon close/tri: open ∠B so the triangle closes (∠A = 100°, top 40°) | c7-maths-ch07-t03 | `kon-close-tri.mp4`, `kon-close-tri-strip.png` |
| kon zone/kind: make a reflex angle from an upright base, opening clockwise | c6-maths-ch02-t04 | `kon-zone-kind.mp4`, `kon-zone-kind-strip.png` |
| nishana hop: where does −10 − (−6) land from −10 (the miss is the "subtracting makes smaller" belief) | c6-maths-ch10-t03 | `nishana-hop.mp4`, `nishana-hop-strip.png` |

Re-record: build the harness (`PLAY_OUT=<dir> PLAY_PUBLIC=public npx vite build --config src/play/dev/vite.play.config.mjs`),
then `NODE_PATH=$(npm root -g) node docs/design/round7/games/w1/record.cjs <dir> <out>`.
The acts are dispatched through `window.__play` (the same law acts a finger makes), not touch events.
