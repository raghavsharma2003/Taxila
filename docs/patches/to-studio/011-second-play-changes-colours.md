# 011: a second play of an engine in the same process draws different colours (23 of 160 runs, all p412)

**From:** the main loop, 2026-11-15. **To:** Studio (and Games for the engines it owns).

## What was seen

The leak check on integration 60 failed, and fails every time with seed 20261115: `tests/theme-palette.test.mjs` ("night is today's look … colour trace") fails when `tests/studio-v2-layout.test.mjs` runs before it in one process. A bisect over the 163 files before it named that file. Neither file changed today; the day's file count put them in one group for the first time. Every suite passes in its own process and on CI.

The layout test is not special. Playing the engines twice in one process is enough:

```js
const { traceAll } = await import("./src/studio-v2/tools/colour-trace.mjs");
const a = await traceAll("night"), b = await traceAll("night");
// 160 runs; b differs from a in 23, every one of them a p412 run:
// angle-cannon, area-claim, balance-beam, beat-line, catch-on-line, circuit-bench, data-rush, era-drop, field-lab, …
```

## What needs deciding

Something survives a play, in the engines, the kit, or the probe's fake `document`, and changes what the next play at phone size draws.

- If it is meant (something shown only on a child's first play in a page), the colour trace should start each run from the first-play state, and say so.
- If it is not meant, a child's second game in a session is drawn differently from her first, and that is a product fault to find: which module-level value, and why only at p412.

Either way `tests/theme-palette.test.mjs` should pass after any other file. Until then the leak check fails on any day whose seed puts an engine-playing file before it; that failure is this note, not a new leak.

## Update, 2026-11-16 (main)

Found and fixed for the test. An engine draws one or two more things on its first play in a process than on later plays (angle-cannon at p412: 279,234 colour draws, then 279,233; area-claim: 186,753, then 186,751): something it builds once and keeps. The fixture was recorded from first plays. `tests/theme-palette.test.mjs` now runs the trace in a process of its own (`node src/studio-v2/tools/colour-trace.mjs`, and `--theme paper`), so it passes after any file, and the later test in that file asks for the stylesheet hook itself.

Still open for Studio, low priority: name what is built once (so it is known to be a cache and not a first-play picture a child sees), and say so in the trace tool's header.
