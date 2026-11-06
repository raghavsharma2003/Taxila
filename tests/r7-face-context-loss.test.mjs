// Round 7 face (every look): a GL context loss on the worker path (a phone switching apps) is handled like one on the main
// thread: the first is rebuilt in the worker and she comes back live; a second, or no restore within 3 s, holds her still.
// Measured in docs/design/round7/face/context-loss.json (evals/face-puppet/context-loss.mjs).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const fakeWorker = () => { const sent = []; return { sent, w: { postMessage: (m) => sent.push(m), terminate() {} } }; };

test("remote rig: a frame the worker skipped (no rig during a loss) frees the queue without counting as drawn", async (t) => {
  const hadPerf = typeof globalThis.performance !== "undefined";
  if (!hadPerf) { globalThis.performance = { now: () => 0 }; t.after(() => { delete globalThis.performance; }); }
  const { RemoteRig } = await import("../src/face-puppet/worker/remoteRig.ts");
  const { sent, w } = fakeWorker();
  const r = new RemoteRig(w, "mesh", { dpr: 1, view: [0, 0, 1], reduced: false });
  let drawn = 0;
  r.drawnHook = () => drawn++;
  r.frame({}, [0, 0, 0], [0, 0], 0, 0);
  r.frame({}, [0, 0, 0], [0, 0], 0, 0); // pending while the first is in flight
  assert.equal(sent.filter((m) => m.t === "frame").length, 1);
  r.drawn({ rigMs: 0, gap: 0, name: "", skipped: true });
  assert.equal(drawn, 0, "a skipped frame is not a drawn frame (no reveal on it)");
  assert.equal(r.rigMs.length, 0);
  assert.equal(sent.filter((m) => m.t === "frame").length, 2, "the pending frame goes out: the queue never sticks");
  r.drawn({ rigMs: 4, gap: 1, name: "aa" });
  assert.equal(drawn, 1);
  assert.deepEqual(r.rigMs, [4]);
  r.restored();
  assert.deepEqual(r.rigMs, [], "a rebuilt rig re-reveals on its own timings");
  r.debugLoseContext(250);
  assert.deepEqual(sent.at(-1), { t: "lose", restoreAfterMs: 250 });
});

test("worker: drops the rig on loss, rebuilds on restore, answers every frame; the stage treats a worker loss like a main-thread one", () => {
  const wk = src("src/face-puppet/worker/rigWorker.ts");
  assert.match(wk, /addEventListener\("webglcontextlost", \(e\) => \{\s*e\.preventDefault\(\);\s*rig = null;/);
  assert.match(wk, /addEventListener\("webglcontextrestored", \(\) => \{[\s\S]*?rebuild\(\)/);
  assert.match(wk, /post\(\{ t: "restored", warmFrameMs: res\.warmFrameMs \}\)/);
  assert.match(wk, /m\.t === "frame" && !rig\) \{\s*post\(\{ t: "drawn", rigMs: 0, gap: 0, name: "", skipped: true \}\)/);
  const st = src("src/face-puppet/stage.ts");
  assert.match(st, /if \(m\.t === "lost"\) this\.lost\("worker"\);\s*else if \(m\.t === "restored"\) this\.restoredInWorker\(\);/);
  assert.doesNotMatch(st, /webgl context lost \(worker\)"/, "no more immediate fallback on the first worker loss");
  assert.match(st, /if \(this\.losses > 1\) this\.emit\(\{ type: "fallback", reason: `webgl context lost twice \(\$\{where\}\)` \}\)/);
});

test("measured: both paths come back live after a first loss and hold her still after a second", () => {
  const r = JSON.parse(src("docs/design/round7/face/context-loss.json"));
  for (const arm of ["worker", "main"]) {
    const a = r.arms[arm];
    assert.equal(a.firstLossBackLive, a.n, `${arm}: back live after the first loss`);
    assert.equal(a.secondLossHeldStill, a.n, `${arm}: her still after the second`);
    assert.equal(a.pageErrors, 0);
  }
  assert.ok(r.arms.worker.paths.every((p) => p.startsWith("worker-")), "the worker arm really ran in the worker");
});
