// The client half of framed TTS v2 and the round-trip fold (src/lesson/ttsStream.ts): postTurnAudio resolves with the
// TurnResponse and parks the reply's audio, the link's next fetchSpeechStream for that turn plays it with NO second
// request, clause events reach onTtsEvent, "audio: none" falls back to tts-stream, and an old server's raw PCM still plays.
import test from "node:test";
import assert from "node:assert/strict";
import { frame, FRAME } from "../server/voice/frames.js";
import { postTurnAudio, fetchSpeechStream, onTtsEvent, takeFoldedAudio, FRAMES_ACCEPT } from "../src/lesson/ttsStream.ts";

const L = "00000000-0000-0000-0000-00000000c11e";
const body = (bufs, split = 5) => {
  const all = Buffer.concat(bufs);
  return new ReadableStream({ start(c) { for (let i = 0; i < all.length; i += split) c.enqueue(new Uint8Array(all.subarray(i, i + split))); c.close(); } });
};
const readAll = async (s) => { const r = s.getReader(); const out = []; for (;;) { const { done, value } = await r.read(); if (done) break; out.push(Buffer.from(value)); } return Buffer.concat(out); };
function stubFetch(handler) {
  const orig = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => { calls.push({ url: String(url), init }); return handler(String(url), init); };
  return { calls, restore: () => { globalThis.fetch = orig; } };
}
const framed = (bufs) => new Response(body(bufs), { status: 200, headers: { "content-type": "application/x-taxila-pcm-frames;v=2" } });

test("fold: the turn resolves from the turn frame; its audio is parked and played by the next speech fetch with no request", async () => {
  const pcm = Buffer.from(Array.from({ length: 480 }, (_, i) => i % 256));
  const events = [];
  const off = onTtsEvent((e) => events.push(e));
  const f = stubFetch((url) => {
    assert.ok(url.endsWith("/api/lesson/turn-audio"));
    return framed([frame(FRAME.header, { v: 2, audio: "follows" }), frame(FRAME.turn, { teacherReply: "Achha!", teacherReplySeq: 7, move: { kind: "probe" } }),
      frame(FRAME.event, { t: "clause", clause: 0, part: 0, atSample: 0, atMs: 0 }), frame(FRAME.pcm, pcm.subarray(0, 200)),
      frame(FRAME.event, { t: "clause", clause: 2, part: 1, atSample: 100, atMs: 4 }), frame(FRAME.pcm, pcm.subarray(200)), frame(FRAME.end, { t: "end", status: "ok" })]);
  });
  try {
    const turn = await postTurnAudio({ lessonId: L, childText: "haan", turnSeq: 1 });
    assert.equal(turn.teacherReplySeq, 7);
    assert.equal(f.calls[0].init.headers.accept, FRAMES_ACCEPT);
    const stream = await fetchSpeechStream({ lessonId: L, seq: 7 }, new AbortController().signal);
    assert.equal(f.calls.length, 1, "no second request: the audio came with the turn");
    assert.deepEqual(await readAll(stream), pcm);
    assert.deepEqual(events.filter((e) => e.kind === "clause").map((e) => [e.req.seq, e.data.clause, e.data.atMs]), [[7, 0, 0], [7, 2, 4]]);
    assert.equal(takeFoldedAudio(L, 7), null, "taken once");
  } finally { f.restore(); off(); }
});

test("fold: audio 'none' parks nothing, so the link fetches the turn by seq through tts-stream (framed, events emitted)", async () => {
  const events = [];
  const off = onTtsEvent((e) => events.push(e));
  const f = stubFetch((url) => (url.endsWith("/turn-audio")
    ? framed([frame(FRAME.header, { v: 2, audio: "none" }), frame(FRAME.turn, { teacherReply: "Haan.", teacherReplySeq: 8 }), frame(FRAME.end, { t: "end", status: "ok", audio: "none" })])
    : framed([frame(FRAME.header, { v: 2, engine: "dhd" }), frame(FRAME.event, { t: "clause", clause: 0, part: 0, atSample: 0, atMs: 0 }), frame(FRAME.pcm, Buffer.from([1, 0, 2, 0])), frame(FRAME.end, { t: "end", status: "ok" })])));
  try {
    const turn = await postTurnAudio({ lessonId: L, childText: "x", turnSeq: 2 });
    assert.equal(turn.teacherReplySeq, 8);
    await new Promise((r) => setTimeout(r, 5));
    const s = await fetchSpeechStream({ lessonId: L, seq: 8 }, new AbortController().signal);
    assert.equal(f.calls.length, 2);
    assert.ok(f.calls[1].url.endsWith("/api/voice/tts-stream"));
    assert.deepEqual([...(await readAll(s))], [1, 0, 2, 0]);
    assert.ok(events.some((e) => e.kind === "header" && e.data.engine === "dhd"));
  } finally { f.restore(); off(); }
});

test("an old server's raw audio/pcm is played as before; a refused turn-audio throws an ApiError with the server's message", async () => {
  const f = stubFetch((url) => (url.endsWith("/tts-stream")
    ? new Response(body([Buffer.from([5, 0, 6, 0])]), { status: 200, headers: { "content-type": "audio/pcm" } })
    : new Response(JSON.stringify({ error: "lesson has ended" }), { status: 409, headers: { "content-type": "application/json" } })));
  try {
    const s = await fetchSpeechStream({ lessonId: L, seq: 9 }, new AbortController().signal);
    assert.deepEqual([...(await readAll(s))], [5, 0, 6, 0]);
    await assert.rejects(postTurnAudio({ lessonId: L, childText: "x", turnSeq: 3 }), (e) => e.status === 409 && /lesson has ended/.test(e.message));
  } finally { f.restore(); }
});
