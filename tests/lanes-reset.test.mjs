// TE-14: a hot 429 settled on the process-wide lanes pauses the background lane for 10 s; _resetDefaultLanes forgets it, so
// suites sharing a process (scripts/test-leak-check.mjs) do not inherit it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { admit, settle, _resetDefaultLanes } from "../server/lanes.js";

test("a hot 429 pauses a background call on that deployment; the reset lets it through at once", () => {
  _resetDefaultLanes();
  const call = { quotaLane: "background", deployment: "taxila-fast", kind: "chat" };
  assert.equal(admit(call), undefined, "no pause yet");
  settle({ quotaLane: "hot", deployment: "taxila-fast", kind: "chat", status: 429 });
  assert.ok(admit(call) instanceof Promise, "paused: the background call queues");
  _resetDefaultLanes();
  assert.equal(admit(call), undefined, "after the reset: admitted at once");
  _resetDefaultLanes();
});

test("a waiting background call keeps its process alive until it is admitted (no silent exit with the call pending)", async () => {
  const { wakeTimer } = await import("../server/lanes.js");
  const t = wakeTimer(() => {}, 1000);
  assert.equal(t.hasRef(), true, "the wake timer is ref'd while a call waits");
  clearTimeout(t);
  // a standalone process: a hot 429, then a background call; it must resolve (bg pause 10 s is too slow for a unit test,
  // so a lanes instance with a 50 ms pause stands in through the same default timer)
  const { spawnSync } = await import("node:child_process");
  const script = `import { createLanes } from ${JSON.stringify(new URL("../server/lanes.js", import.meta.url).href)};
    let t = 0; const L = createLanes({ now: () => Date.now() + t, shared: ["d"] });
    L.settle({ quotaLane: "hot", deployment: "d", kind: "chat", status: 429 });
    t = -9950; // the pause ends 50 ms from now
    await L.admit({ quotaLane: "background", deployment: "d", kind: "chat" });
    console.log("ADMITTED");`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8", timeout: 20_000 });
  assert.match(r.stdout, /ADMITTED/, r.stderr);
});
