// Round 7 face-puppet-raster-cost-main-thread, part 2: the rig draws in an OffscreenCanvas worker. The main-thread side
// never queues frames (latest wins), and the stage keeps a main-thread fallback and the turn hold only for that path.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { RemoteRig, workerRigSupported, resetWorkerRigProbe } = await import("../src/face-puppet/worker/remoteRig.ts");

const fakeWorker = () => { const sent = []; return { sent, postMessage: (m) => sent.push(m), terminate() {} }; };

test("frames never queue: one in flight, newer frames replace the pending one", () => {
  const w = fakeWorker();
  const r = new RemoteRig(w, "mesh", { dpr: 1, view: [0, 0, 100], reduced: false });
  r.clock = 1; r.frame({ jawOpen: 0.1 }, [0, 0, 0], [0, 0], 0, 0);
  r.clock = 2; r.frame({ jawOpen: 0.2 }, [0, 0, 0], [0, 0], 0, 0);
  r.clock = 3; r.frame({ jawOpen: 0.3 }, [0, 0, 0], [0, 0], 0, 0);
  assert.equal(w.sent.filter((m) => m.t === "frame").length, 1, "only the first is in flight");
  assert.equal(r.dropped, 1, "frame 2 was replaced by frame 3");
  r.drawn({ rigMs: 12, gap: 3, name: "aa" });
  const frames = w.sent.filter((m) => m.t === "frame");
  assert.equal(frames.length, 2);
  assert.equal(frames[1].clock, 3, "the latest frame goes next");
  assert.equal(r.mouth.name, "aa"); assert.equal(r.mouth.p.g, 3); assert.deepEqual(r.rigMs, [12]);
  r.drawn({ rigMs: 10, gap: 0, name: "mbp" });
  assert.equal(w.sent.filter((m) => m.t === "frame").length, 2, "nothing pending: nothing sent");
});

test("view and size reach the worker; dispose stops frames", () => {
  const w = fakeWorker();
  const r = new RemoteRig(w, "keys", { dpr: 2, view: [1, 2, 3], reduced: true });
  r.view = [4, 5, 6];
  r.size(320, 240);
  assert.deepEqual(w.sent.slice(0, 2), [{ t: "view", view: [4, 5, 6] }, { t: "size", css: [320, 240] }]);
  r.dispose();
  r.frame({}, [0, 0, 0], [0, 0], 0, 0);
  assert.ok(!w.sent.some((m) => m.t === "frame"), "no frame after dispose");
  assert.ok(w.sent.some((m) => m.t === "dispose"));
});

test("no OffscreenCanvas (node): the worker path is not offered", () => {
  resetWorkerRigProbe();
  assert.equal(workerRigSupported("mesh"), false);
  assert.equal(workerRigSupported("keys"), false);
});

test("the stage: the worker path where supported, a fresh canvas on the main thread otherwise; the turn hold only on the main-thread path", () => {
  const s = readFileSync(new URL("../src/face-puppet/stage.ts", import.meta.url), "utf8");
  assert.match(s, /if \(this\.o\.worker && workerRigSupported\(kind\)\)/);
  assert.match(s, /this\.canvas = this\.makeCanvas\(\);\s*old\.replaceWith\(this\.canvas\);/, "a transferred canvas is replaced on fallback");
  assert.match(s, /now < this\.holdUntil && this\.status !== "speaking" && !\(rig instanceof RemoteRig\)/);
  const f = readFileSync(new URL("../src/face-puppet/PuppetFace.tsx", import.meta.url), "utf8");
  assert.match(f, /worker: rigWorkerEnabled\(\)/, "the product turns it on");
});
