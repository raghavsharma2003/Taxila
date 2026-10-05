// W2-G fixer (2026-10-05, w2g-clause-events-on-player-clock): the PLAYER is the source of timing for the whiteboard.
// The line anchor (clock.ts markLineAudioStart) is marked at the time the first sample is scheduled to sound, on the
// performance.now() clock, and each clause onset is emitted when its sample is scheduled, with playAt = when it sounds:
// the start lead, an underrun gap and a pause/resume all included. A fake AudioContext whose clock is performance.now().
import test from "node:test";
import assert from "node:assert/strict";
import { PcmStreamPlayer, onTtsEvent, START_LEAD_S, PCM_RATE } from "../src/lesson/ttsStream.ts";
import { awaitLineAnchor } from "../src/modules/whiteboard/clock.ts";

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

test("player clock: line anchor at the first sample; clause onsets at their scheduled playback time across an underrun", async () => {
  const ctx = new FakeAudioContext();
  const player = new PcmStreamPlayer(ctx, ctx.destination);
  const events = [];
  const off = onTtsEvent((e) => { if (e.kind === "clause") events.push(e); });
  let ctl, sink;
  const req = { lessonId: "00000000-0000-0000-0000-00000000c10c", seq: 11 };
  try {
    const pb = player.play(async (_signal, s) => { sink = s; return new ReadableStream({ start(c) { ctl = c; } }); }, { req });
    await sleep(5);
    // part 0: its onset comes before its PCM (frame order), at sample 0
    sink.clause({ t: "clause", clause: 0, part: 0, atSample: 0, atMs: 0 });
    ctl.enqueue(pcmBytes(0.2));
    await sleep(80); // past the start lead: in Node (no window events) awaitLineAnchor reads an anchor that has sounded
    const first = ctx.sources[0];
    // the anchor: the first sample's scheduled time (start lead included), on performance.now()
    let anchor = null;
    awaitLineAnchor({ lessonId: req.lessonId, teacherReplySeq: req.seq }, (at) => { anchor = at; }, { since: performance.now() - 100 });
    assert.ok(anchor !== null, "the anchor fired");
    assert.ok(Math.abs(anchor - perfOf(ctx, first.startedAt)) <= 10, `anchor ${anchor} vs ${perfOf(ctx, first.startedAt)}`);
    assert.ok(first.startedAt >= START_LEAD_S - 0.02);
    // the link stalls past the end of part 0 → an underrun; part 1's onset is at its sample, which now sounds later
    await sleep(250);
    sink.clause({ t: "clause", clause: 3, part: 1, atSample: Math.round(0.2 * PCM_RATE), atMs: 200 });
    ctl.enqueue(pcmBytes(1.5)); // long, so the pause below lands before part 2 sounds even on a loaded machine
    await sleep(5);
    const second = ctx.sources[1];
    assert.equal(player.underruns, 1);
    assert.equal(events.length, 2);
    assert.ok(events.every((e) => e.req.seq === 11));
    const [e0, e1] = events.map((e) => e.data);
    assert.ok(Math.abs(e0.playAt - perfOf(ctx, first.startedAt)) <= 10, `clause 0 ${e0.playAt} vs ${perfOf(ctx, first.startedAt)}`);
    assert.ok(Math.abs(e1.playAt - perfOf(ctx, second.startedAt)) <= 10, `clause 3 ${e1.playAt} vs ${perfOf(ctx, second.startedAt)}`);
    // the network atMs (200) is NOT the playback offset: the underrun pushed it out
    assert.ok(e1.playAt - e0.playAt > e1.atMs + 100, `${e1.playAt - e0.playAt} ms apart vs atMs ${e1.atMs}`);
    // part 2 is scheduled, then the child barges in before it sounds: on resume its onset is told again, on the new timeline
    sink.clause({ t: "clause", clause: 5, part: 2, atSample: Math.round(1.7 * PCM_RATE), atMs: 1700 });
    ctl.enqueue(pcmBytes(0.2));
    await sleep(5);
    assert.equal(events.length, 3);
    pb.pause();
    await sleep(30);
    pb.resume();
    await sleep(5);
    const again = events.filter((e) => e.data.clause === 5);
    assert.equal(again.length, 2, "re-emitted once on resume");
    const resumed = ctx.sources.at(-1);
    const resumedFromPos = Math.round((again[1].data.playAt - perfOf(ctx, resumed.startedAt)) / 1000 * PCM_RATE);
    assert.ok(Math.abs(again[1].data.playAt - again[0].data.playAt) > 5, "a new playback time");
    assert.ok(resumedFromPos >= 0, "clause 5 sounds at or after the resumed buffer's start");
    ctl.close();
    pb.stop();
  } finally { off(); player.stop(); }
});

test("player clock: no req → anchor still marked (any line), clause events not emitted by the player", async () => {
  const ctx = new FakeAudioContext();
  const player = new PcmStreamPlayer(ctx, ctx.destination);
  const events = [];
  const off = onTtsEvent((e) => events.push(e));
  try {
    let ctl, sink;
    player.play(async (_s, k) => { sink = k; return new ReadableStream({ start(c) { ctl = c; } }); });
    await sleep(5);
    sink.clause({ t: "clause", clause: 0, part: 0, atSample: 0, atMs: 0 });
    ctl.enqueue(pcmBytes(0.1));
    await sleep(80);
    let anchor = null;
    awaitLineAnchor({ lessonId: "any", teacherReplySeq: 2 }, (at) => { anchor = at; }, { since: performance.now() - 100 });
    assert.ok(anchor !== null && Math.abs(anchor - perfOf(ctx, ctx.sources[0].startedAt)) <= 10);
    assert.equal(events.length, 0);
    ctl.close();
  } finally { off(); player.stop(); }
});
