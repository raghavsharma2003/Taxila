// The pause realiser (HV-5's successor while clips are off) and framed TTS v2 (server writer ↔ client parser).
import test from "node:test";
import assert from "node:assert/strict";
import { edgeTrim, silence, RATE, KEEP_MS, KEEP_TAIL_MS, MAX_LEAD_MS } from "../server/voice/expressive/pauses.js";
import { frame, frameWriter, parseFrames, FRAME } from "../server/voice/frames.js";
import { FrameParser, FRAME as CFRAME } from "../src/lesson/ttsStream.ts";

const ms = (n) => Math.round((RATE * n) / 1000);
/** PCM with [silenceMs, toneMs, silenceMs, toneMs, ...] segments; tone at -12 dBFS. */
function pcm(segments) {
  const parts = segments.map((d, i) => {
    const b = Buffer.alloc(ms(d) * 2);
    if (i % 2 === 1) for (let k = 0; k < ms(d); k++) b.writeInt16LE(Math.round(8000 * Math.sin((2 * Math.PI * 220 * k) / RATE)), k * 2);
    return b;
  });
  return Buffer.concat(parts);
}
async function* chunked(buf, size) { for (let i = 0; i < buf.length; i += size) yield buf.subarray(i, i + size); }
async function collect(it) { const out = []; for await (const c of it) out.push(Buffer.from(c)); return Buffer.concat(out); }
const samples = (b) => b.length >> 1;

test("edgeTrim: leading silence is cut to KEEP_MS before the onset, trailing to KEEP_TAIL_MS; inner pauses are untouched", async () => {
  const src = pcm([300, 500, 180, 400, 350]); // 300 lead, speech, a natural 180 ms pause, speech, 350 tail
  for (const size of [97, 480, 4801, 1 << 16]) { // odd chunk boundaries included
    const out = await collect(edgeTrim(chunked(src, size), { lead: true, tail: true }));
    const expect = ms(KEEP_MS) + ms(500) + ms(180) + ms(400) + ms(KEEP_TAIL_MS);
    assert.ok(Math.abs(samples(out) - expect) <= ms(10) + 1, `chunk ${size}: ${samples(out)} vs ${expect}`);
  }
});

test("edgeTrim: lead only keeps the tail; tail only keeps the lead; neither is the identity", async () => {
  const src = pcm([200, 300, 250]);
  assert.equal(samples(await collect(edgeTrim(chunked(src, 1000), {}))), samples(src));
  const lead = await collect(edgeTrim(chunked(src, 1000), { lead: true }));
  assert.ok(Math.abs(samples(lead) - (ms(KEEP_MS) + ms(300) + ms(250))) <= ms(10));
  const tail = await collect(edgeTrim(chunked(src, 1000), { tail: true }));
  assert.ok(Math.abs(samples(tail) - (ms(200) + ms(300) + ms(KEEP_TAIL_MS))) <= ms(10));
});

test("edgeTrim: never eats more than MAX_LEAD_MS of a quiet opening (a soft onset survives)", async () => {
  const src = pcm([1500, 300]);
  const out = await collect(edgeTrim(chunked(src, 2400), { lead: true }));
  assert.ok(samples(src) - samples(out) <= ms(MAX_LEAD_MS) + ms(10), `${samples(src) - samples(out)} samples dropped`);
});

test("silence(ms) is exact digital silence", () => {
  const s = silence(450);
  assert.equal(samples(s), ms(450));
  assert.ok(s.every((b) => b === 0));
});

test("framed TTS v2: server frames parse back on the client across any chunk boundary", () => {
  const written = [];
  const res = { write: (b) => { written.push(Buffer.from(b)); return true; } };
  const w = frameWriter(res, true);
  w.json(FRAME.header, { v: 2, sentences: 2 });
  w.pcm(pcm([0, 50]));
  w.json(FRAME.event, { t: "clause", clause: 2, part: 1, atSample: 1200, atMs: 50 });
  w.pcm(Buffer.from([1, 2, 3]));
  w.json(FRAME.end, { t: "end", status: "ok" });
  const all = Buffer.concat(written);
  const server = parseFrames(all);
  assert.deepEqual(server.map((f) => f.type), [2, 0, 1, 0, 4]);
  for (const size of [1, 3, 7, 64, all.length]) {
    const p = new FrameParser();
    const got = [];
    for (let i = 0; i < all.length; i += size) got.push(...p.push(new Uint8Array(all.subarray(i, i + size))));
    assert.deepEqual(got.map((f) => f.type), [2, 0, 1, 0, 4], `chunk ${size}`);
    assert.deepEqual(got[2].payload, { t: "clause", clause: 2, part: 1, atSample: 1200, atMs: 50 });
    assert.equal(got[1].payload.length, ms(50) * 2);
    assert.deepEqual([...got[3].payload], [1, 2, 3]);
  }
  assert.deepEqual(CFRAME, { pcm: 0, event: 1, header: 2, turn: 3, end: 4 });
  // unframed: raw PCM only, JSON dropped (old clients)
  const raw = [];
  const w2 = frameWriter({ write: (b) => { raw.push(Buffer.from(b)); return true; } }, false);
  w2.json(FRAME.header, { v: 2 });
  w2.pcm(Buffer.from([9, 9]));
  assert.deepEqual(Buffer.concat(raw), Buffer.from([9, 9]));
  assert.throws(() => frame(0, Buffer.alloc(0x1000000)), /too large/);
});
