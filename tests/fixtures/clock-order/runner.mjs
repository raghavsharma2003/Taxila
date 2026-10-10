// The load order that froze performance.now in npm test's one process (tests/index.js imports files while earlier files'
// tests run). p2-face-player's test installs its virtual clock; voice-player-clock is imported WHILE that clock is in
// place (deterministic here: wait until performance.now is not the native one); then a probe checks the clock still runs.
// A test file that captures "the real performance.now" at import saves p2's fake and restores it for good.
const files = JSON.parse(process.env.CLOCK_ORDER_FILES);
const native = performance.now;
await import(files.first);
for (let t = Date.now(); performance.now === native; ) {
  if (Date.now() - t > 10_000) throw new Error("the first file never installed its virtual clock");
  await new Promise((r) => setTimeout(r, 1));
}
await import(files.second);
await import(new URL("./probe.mjs", import.meta.url).href);
