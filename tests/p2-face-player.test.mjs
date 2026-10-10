// ship5 p2-face, patch 02 contract: Diya's viseme batches leave the PCM player on ITS clock (the same anchor as clause
// onsets): playAt = when the part's first synthesised sample sounds (- the edge-trimmed lead), re-anchored with a cut on an
// underrun gap and on pause/resume, a stop closes the mouth, and (ship5 fix) every batch of one part on one anchor carries
// the SAME playAt even when the AudioContext clock steps between batches. Fake AudioContext on performance.now() (as
// voice-player-clock.test.mjs). Runs once patch 02 (docs/design/ship5/p2-face/patches/02-client-visemes.diff) is applied;
// before that it is skipped, never failed, so the shared `npm test` stays green while the patch waits.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { puppetBus } from "../src/face-puppet/bus.ts";

const APPLIED = /visemes\?\(f: TtsVisemeFrame\)/.test(fs.readFileSync(new URL("../src/lesson/ttsStream.ts", import.meta.url), "utf8"));
const SKIP = APPLIED ? false : "patch 02 (src/lesson/ttsStream.ts viseme sink) not applied yet";
const { PcmStreamPlayer, PCM_RATE } = APPLIED ? await import("../src/lesson/ttsStream.ts") : { PCM_RATE: 24000 };

// r4-latency (2026-10-10): the clock is VIRTUAL, as in voice-player-clock.test.mjs. performance.now() (the player's clock
// and the fake AudioContext's) reads VNOW, the fake sources end on a virtual timer queue, and sleep(ms) advances virtual
// time. Real sleeps let a loaded CI runner move the deltas ("re-anchor cuts" failed on CI 2026-10-10, run 38050190655).
let VNOW = 1000;
const timers = new Set(); // { at, fn }
const flush = () => new Promise((r) => setImmediate(r));
async function sleep(ms) {
  const end = VNOW + ms;
  await flush();
  for (;;) {
    const due = [...timers].filter((t) => t.at <= end).sort((a, b) => a.at - b.at)[0];
    if (!due) break;
    timers.delete(due);
    VNOW = Math.max(VNOW, due.at);
    due.fn();
    await flush();
  }
  VNOW = end;
  await flush();
}
// Per test, not test.before/after: npm test runs EVERY test file in one process (tests/index.js), where a root-level hook
// holds for the whole run, so the virtual clock leaked into (or was replaced by) other files' clocks.
// The clock being replaced is read when the test STARTS, not at import: this file can be imported while another file's
// test has its own virtual clock installed, and keeping that one as "real" would freeze performance.now for good.
const onVirtualClock = (fn) => async (t) => {
  const prev = Object.getOwnPropertyDescriptor(performance, "now");
  performance.now = () => VNOW;
  try { return await fn(t); } finally { if (prev) Object.defineProperty(performance, "now", prev); else delete performance.now; timers.clear(); }
};
class FakeAudioContext {
  constructor() { this.t0 = performance.now(); this.sources = []; this.destination = { connect() {}, disconnect() {} }; }
  get currentTime() { return (performance.now() - this.t0) / 1000; }
  createGain() { return { connect() {}, disconnect() {}, gain: { value: 1, cancelScheduledValues() {}, setTargetAtTime(v) { this.value = v; } } }; }
  createBuffer(_ch, length, rate) { const data = new Float32Array(length); return { duration: length / rate, length, getChannelData: () => data }; }
  createBufferSource() {
    const ctx = this;
    const s = { connect() {}, disconnect() {} };
    s.start = (at) => {
      s.startedAt = at;
      s.timer = { at: VNOW + Math.max(0, (at - ctx.currentTime) * 1000) + s.buffer.duration * 1000, fn: () => s.onended?.() };
      timers.add(s.timer);
    };
    s.stop = () => { timers.delete(s.timer); s.stopped = true; };
    this.sources.push(s);
    return s;
  }
}
const pcmBytes = (seconds) => new Uint8Array(Math.round(seconds * PCM_RATE) * 2).fill(1);
const perfOf = (ctx, t) => ctx.t0 + t * 1000;

test("player → puppet: viseme batches on the player clock, re-anchored on underrun and resume, cut on stop", { skip: SKIP }, onVirtualClock(async () => {
  const ctx = new FakeAudioContext();
  const player = new PcmStreamPlayer(ctx, ctx.destination);
  const ev = [];
  const off = puppetBus.on((e) => ev.push(e));
  let ctl, sink;
  try {
    const pb = player.play(async (_s, s) => { sink = s; return new ReadableStream({ start(c) { ctl = c; } }); }, { req: { lessonId: "00000000-0000-0000-0000-0000000000f4", seq: 3 } });
    await sleep(5);
    assert.equal(typeof sink.visemes, "function", "the player offers a viseme sink");
    sink.visemes({ t: "visemes", part: 0, atSample: 0, leadMs: 40, v: [[40, 0], [120, 21], [200, 2]] });
    ctl.enqueue(pcmBytes(0.3));
    await sleep(10);
    const v0 = ev.filter((e) => e.kind === "visemes");
    assert.equal(v0.length, 1);
    const first = ctx.sources[0];
    assert.ok(Math.abs(v0[0].playAt - (perfOf(ctx, first.startedAt) - 40)) <= 10, `${v0[0].playAt} vs ${perfOf(ctx, first.startedAt) - 40}`);
    // underrun: part 1 arrives after part 0 ran dry → the timeline moves; the face is cut and re-sent on it
    await sleep(400);
    sink.visemes({ t: "visemes", part: 1, atSample: Math.round(0.3 * PCM_RATE), leadMs: 0, v: [[0, 2], [100, 0]] });
    ctl.enqueue(pcmBytes(0.4));
    await sleep(10);
    const second = ctx.sources[1];
    assert.ok(ev.some((e) => e.kind === "cut"), "re-anchor cuts");
    const p1 = ev.filter((e) => e.kind === "visemes" && e.part === 1).at(-1);
    assert.ok(Math.abs(p1.playAt - perfOf(ctx, second.startedAt)) <= 10, `part 1 ${p1.playAt} vs ${perfOf(ctx, second.startedAt)}`);
    // pause: cut; resume: re-sent on the new timeline
    const n = ev.length;
    pb.pause();
    assert.equal(ev.at(-1).kind, "cut");
    await sleep(30);
    pb.resume();
    await sleep(10);
    assert.ok(ev.slice(n).some((e) => e.kind === "visemes" && e.part === 1), "resume re-sends part 1");
    pb.stop();
    assert.equal(ev.at(-1).kind, "cut", "stop closes the mouth");
  } finally { off(); player.stop(); }
}));

// Measured on the product path before the fix (evals/p2-face/out/lipsync-product-base-raw.json): one part's batches came
// out with playAt up to 8 ms apart, because the anchor's ctx -> performance conversion was redone per batch against a
// clock that steps (desktop ~10 ms; Android's audio callback 20-40 ms). The face then split one part into several tracks.
class SteppedAudioContext extends FakeAudioContext {
  // the audio clock advances in 20 ms render callbacks, as on a budget Android phone
  get currentTime() { return Math.floor((performance.now() - this.t0) / 20) * 0.02; }
}

test("player → puppet: every batch of one part on one anchor carries the SAME playAt on a stepping audio clock", { skip: SKIP }, onVirtualClock(async () => {
  const ctx = new SteppedAudioContext();
  const player = new PcmStreamPlayer(ctx, ctx.destination);
  const ev = [];
  const off = puppetBus.on((e) => ev.push(e));
  let ctl, sink;
  try {
    player.play(async (_s, s) => { sink = s; return new ReadableStream({ start(c) { ctl = c; } }); }, { req: { lessonId: "00000000-0000-0000-0000-0000000000f5", seq: 4 } });
    await sleep(5);
    ctl.enqueue(pcmBytes(1.5));
    await sleep(3);
    // Azure's metadata arrives in batches while the part plays; send them at uneven moments of the stepping clock
    for (const [i, gap] of [[0, 7], [1, 13], [2, 9], [3, 17], [4, 11]]) {
      sink.visemes({ t: "visemes", part: 0, atSample: 0, leadMs: 30, v: [[i * 200, 2], [i * 200 + 100, 21]] });
      await sleep(gap);
    }
    const p0 = ev.filter((e) => e.kind === "visemes" && e.part === 0).map((e) => e.playAt);
    assert.equal(p0.length, 5);
    assert.equal(Math.max(...p0) - Math.min(...p0), 0, `one anchor, one playAt: ${p0.map((x) => x.toFixed(2)).join(", ")}`);
    assert.ok(!ev.some((e) => e.kind === "cut"), "no re-anchor happened");
  } finally { off(); player.stop(); }
}));
