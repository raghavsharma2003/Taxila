// Round 7, stream B Voice → C1 Studio board-sync (anchorSteps): her REAL word onsets on the TTS event bus. DragonHD's word
// boundaries already ride the viseme frames (`w: [offsetMs, durMs, word]`, server/routes/voice.js); the player now emits a
// `words` event per part with playAt / endAt on ITS clock (the same anchor as the face and the clauses), re-sent with
// reanchored: true when the timeline moves. Virtual clock and fake AudioContext as tests/p2-face-player.test.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import { PcmStreamPlayer, PCM_RATE, onTtsEvent } from "../src/lesson/ttsStream.ts";

let VNOW = 1000;
const timers = new Set();
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
    s.start = (at) => { s.startedAt = at; s.timer = { at: VNOW + Math.max(0, (at - ctx.currentTime) * 1000) + s.buffer.duration * 1000, fn: () => s.onended?.() }; timers.add(s.timer); };
    s.stop = () => { timers.delete(s.timer); s.stopped = true; };
    this.sources.push(s);
    return s;
  }
}
const pcmBytes = (seconds) => new Uint8Array(Math.round(seconds * PCM_RATE) * 2).fill(1);
const perfOf = (ctx, t) => ctx.t0 + t * 1000;

test("word onsets: per part, on the player's clock (the face's anchor), re-sent reanchored when the timeline moves", onVirtualClock(async () => {
  const ctx = new FakeAudioContext();
  const player = new PcmStreamPlayer(ctx, ctx.destination);
  const words = [];
  const off = onTtsEvent((e) => { if (e.kind === "words") words.push(e.data); });
  let ctl, sink;
  try {
    player.play(async (_s, s) => { sink = s; return new ReadableStream({ start(c) { ctl = c; } }); }, { req: { lessonId: "00000000-0000-0000-0000-0000000000f5", seq: 4 } });
    await sleep(5);
    sink.visemes({ t: "visemes", part: 0, atSample: 0, leadMs: 40, v: [[40, 0]], w: [[40, 180, "Dekho"], [260, 120, "ek"]] });
    ctl.enqueue(pcmBytes(0.5));
    await sleep(10);
    assert.equal(words.length, 1);
    const start = perfOf(ctx, ctx.sources[0].startedAt) - 40; // the part's playAt: its first synthesised sample, lead trimmed
    assert.deepEqual(words[0].words.map((x) => x.w), ["Dekho", "ek"]);
    assert.ok(Math.abs(words[0].words[0].playAt - (start + 40)) <= 10, `${words[0].words[0].playAt} vs ${start + 40}`);
    assert.ok(Math.abs(words[0].words[1].endAt - (start + 380)) <= 10);
    assert.equal(words[0].reanchored, undefined);
    // a part without word boundaries (mini-tts) sends no words event
    sink.visemes({ t: "visemes", part: 1, atSample: Math.round(0.5 * PCM_RATE), leadMs: 0, v: [[0, 2]] });
    // underrun: part 2 arrives after the audio ran dry → re-anchored, its words on the new timeline
    await sleep(800);
    sink.visemes({ t: "visemes", part: 2, atSample: Math.round(0.5 * PCM_RATE), leadMs: 0, v: [[0, 2]], w: [[100, 200, "roti"]] });
    ctl.enqueue(pcmBytes(0.4));
    await sleep(10);
    const last = words.filter((w) => w.part === 2).at(-1);
    assert.ok(last, "part 2's words");
    const second = ctx.sources.at(-1);
    assert.ok(Math.abs(last.words[0].playAt - (perfOf(ctx, second.startedAt) + 100)) <= 10, `${last.words[0].playAt} vs ${perfOf(ctx, second.startedAt) + 100}`);
    assert.ok(!words.some((w) => w.part === 1), "no boundaries, no event");
  } finally { off(); player.stop(); }
}));
