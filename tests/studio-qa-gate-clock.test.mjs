// Round 4 content (main session, 2026-10-10: the 240 s CI timeout of "gate (browser): goldens pass…"): the studio gate's
// waits end at their own deadline whatever performance.now / Date / timers do after import. A frozen performance.now and
// mocked timers must not turn a piece that never answers into a forever loop. No browser.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { waitUntil } from "../server/studio/qa/gate.js";
import { sleep } from "../server/studio/qa/common.js";

describe("studio gate waits under a frozen or mocked clock", () => {
  it("a condition that never holds ends near its deadline with performance.now frozen", async () => {
    const real = performance.now;
    const frozen = performance.now();
    performance.now = () => frozen;
    try {
      const t0 = Date.now();
      assert.equal(await waitUntil(() => false, 300, 20), false);
      const took = Date.now() - t0;
      assert.ok(took >= 250 && took < 3000, `ended after ${took} ms`);
    } finally { performance.now = real; }
  });
  it("mocked timers and Date do not hang the gate's sleep or its polls", { timeout: 5000 }, async (t) => {
    // setTimeout through mock.timers; Date.now frozen by hand (mock.timers' Date cannot be enabled when another harness
    // has already replaced Date, as the suite's per-test virtual clocks may have)
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const realNow = Date.now, at = Date.now();
    Date.now = () => at;
    try {
      let n = 0;
      await sleep(10);                                    // the mocked setTimeout never fires; the gate's sleep still does
      assert.equal(await waitUntil(() => ++n > 3, 500, 5), true);
      assert.equal(await waitUntil(() => false, 100, 10), false, "a never-true condition still ends");
    } finally { Date.now = realNow; t.mock.timers.reset(); }
  });
  it("a condition that holds returns at once", async () => {
    assert.equal(await waitUntil(() => true, 5000, 50), true);
  });
});
