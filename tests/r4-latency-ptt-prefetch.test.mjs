// r4-latency: on tap-to-talk the child's Done tap tells the turn prefetcher the child has stopped (CascadeLink.talkEnd →
// TurnPrefetcher.onQuiet), so the stable partial is sent before the final transcript, as on the hands-free path. Only on
// the WebRTC transcription transport (the recording fallback has no partials). The prefetcher's own rules (quiet deltas,
// ≤ 3 per item, never the same text twice) are unchanged (tests/latency-prefetch.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { CascadeLink } from "../src/lesson/cascadeLink.ts";
import { TurnPrefetcher } from "../src/latency/prefetch.ts";
import { LevelMeter } from "../src/lesson/level.ts";

function link() {
  const l = new CascadeLink({ lessonId: "L1", levels: { mic: new LevelMeter(), teacher: new LevelMeter() }, prefetch: false,
    speech: async () => new ReadableStream({ start(c) { c.close(); } }), transcribe: async () => ({ text: "" }),
    fetchToken: async () => { throw new Error("no STT in tests"); } });
  const sent = [];
  const timers = [];
  // the link's own prefetcher, with a recording post and a manual clock
  l.prefetcher = new TurnPrefetcher({ lessonId: "L1", post: async (b) => { sent.push(b.text); }, setTimer: (fn, ms) => (timers.push({ fn, ms }), timers.length), clearTimer: () => {} });
  return { l, sent, run: () => { while (timers.length) timers.shift().fn(); } };
}

test("tap-to-talk: the Done tap sends the stable partial (WebRTC transport)", () => {
  const { l, sent, run } = link();
  l.transportKind = "webrtc";
  l.pushToTalk = true;
  l.talking = true;
  l.prefetcher.onPartial("item1", "teen chauthai");
  run();
  assert.deepEqual(sent, [], "nothing while the child is still talking");
  l.talkEnd();
  run();
  assert.deepEqual(sent, ["teen chauthai"]);
  l.close();
});

test("tap-to-talk on the recording fallback sends nothing (no partials, no quiet signal)", () => {
  const { l, sent, run } = link();
  l.transportKind = "recording";
  l.pushToTalk = true;
  l.talking = true;
  l.prefetcher.onPartial("item1", "teen chauthai");
  l.talkEnd();
  run();
  assert.deepEqual(sent, []);
  l.close();
});

test("tap-to-talk: the press opens a new turn for the echo client (it asks again after her reply closed the last turn)", () => {
  const { l } = link();
  const asked = [];
  l.ack = { onSpeech() { asked.push("open"); }, request() {}, onFinal() {}, isEchoNow: () => false, replyStarting() {} };
  l.transportKind = "webrtc";
  l.pushToTalk = true;
  l.talkStart();
  assert.deepEqual(asked, ["open"]);
  l.close();
});

test("tap-to-talk end to end on the real AckClient: after her reply, the next press lets the prefetched words ask for the echo", async () => {
  const { AckClient } = await import("../src/latency/ack.ts");
  const { l, run } = link();
  const posts = [];
  l.ack = new AckClient({ lessonId: "L1", post: async (b) => { posts.push(b.text); return null; }, onClip: () => {} });
  l.prefetcher = new (await import("../src/latency/prefetch.ts")).TurnPrefetcher({ lessonId: "L1", post: async () => {}, onSend: (b) => l.ack.request(b.text),
    setTimer: (fn) => (run.q ??= []).push(fn), clearTimer: () => {} });
  const flushQ = () => { while (run.q?.length) run.q.shift()(); };
  l.ack.replyStarting(); // her last reply closed the previous turn
  l.transportKind = "webrtc";
  l.pushToTalk = true;
  l.talkStart();
  l.prefetcher.onPartial("item2", "chhe faces");
  l.talkEnd();
  flushQ();
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(posts, ["chhe faces"]);
  l.close();
});
