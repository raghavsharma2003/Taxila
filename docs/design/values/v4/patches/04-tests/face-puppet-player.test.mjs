// V4 patch 02 contract: Diya's viseme batches leave the PCM player on ITS clock (the same anchor as clause onsets):
// playAt = when the part's first synthesised sample sounds (- the edge-trimmed lead), re-anchored with a cut on an
// underrun gap and on pause/resume, and a stop closes the mouth. Fake AudioContext on performance.now() (as
// voice-player-clock.test.mjs). Needs patch 02 applied to src/lesson/ttsStream.ts.
import test from "node:test";
import assert from "node:assert/strict";
import { PcmStreamPlayer, PCM_RATE } from "../src/lesson/ttsStream.ts";
import { puppetBus } from "../src/face-puppet/bus.ts";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
class FakeAudioContext {
  constructor() { this.t0 = performance.now(); this.sources = []; this.destination = { connect() {}, disconnect() {} }; }
  get currentTime() { return (performance.now() - this.t0) / 1000; }
  createGain() { return { connect() {}, disconnect() {}, gain: { value: 1, cancelScheduledValues() {}, setTargetAtTime(v) { this.value = v; } } }; }
  createBuffer(_ch, length, rate) { const data = new Float32Array(length); return { duration: length / rate, length, getChannelData: () => data }; }
  createBufferSource() {
    const ctx = this;
    const s = { connect() {}, disconnect() {} };
    s.start = (at) => { s.startedAt = at; s.timer = setTimeout(() => { s.onended?.(); }, Math.max(0, (at - ctx.currentTime) * 1000) + s.buffer.duration * 1000); };
    s.stop = () => { clearTimeout(s.timer); s.stopped = true; };
    this.sources.push(s);
    return s;
  }
}
const pcmBytes = (seconds) => new Uint8Array(Math.round(seconds * PCM_RATE) * 2).fill(1);
const perfOf = (ctx, t) => ctx.t0 + t * 1000;

test("player → puppet: viseme batches on the player clock, re-anchored on underrun and resume, cut on stop", async () => {
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
});
