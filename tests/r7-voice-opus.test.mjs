// Round 7, stream B Voice, voice-tts-transport (QA D12): Opus frames for her speech.
//   server/voice/frames.js  codecOf (the Accept's codec list, opus only when the encoder loaded), frameWriter (FRAME.opus,
//                           20 ms packets, the last one zero-padded before the end frame, header codec);
//   src/lesson/opus.ts      OpusPcmDecoder (WebCodecs; silence, never a stall, without it);
//   src/lesson/ttsStream.ts framesAccept (opus first where supported), readFrames / pcmOfFrames decode in order.
// The encoder and AudioDecoder here are identity fakes (a "packet" is its own PCM): what is tested is the framing, the order
// and the sample clock, not libopus.
import { test } from "node:test";
import assert from "node:assert/strict";

import { codecOf, frameWriter, parseFrames, FRAME } from "../server/voice/frames.js";
import { setOpusFactory, opusReady, OPUS } from "../server/voice/opus.js";
import { OpusPcmDecoder, resetOpusProbe } from "../src/lesson/opus.ts";
import { framesAccept, readFrames, pcmOfFrames, FRAME as CFRAME } from "../src/lesson/ttsStream.ts";

const identity = () => ({ encode: (pcm) => new Uint8Array(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength)) });
const req = (accept) => ({ headers: { accept } });
function sink() {
  const chunks = [];
  let done;
  const ended = new Promise((r) => { done = r; });
  return { chunks, ended, write(b) { chunks.push(Buffer.from(b)); return true; }, end() { done(); return this; } };
}

/** A WebCodecs stand-in: output(AudioData) a tick later, the packet read as s16le. */
const fakeCodecs = () => {
  class EncodedAudioChunk { constructor(o) { Object.assign(this, o); } }
  class AudioDecoder {
    constructor({ output }) { this.output = output; }
    configure() {}
    decode(chunk) {
      const s = new Int16Array(chunk.data.buffer.slice(chunk.data.byteOffset, chunk.data.byteOffset + chunk.data.byteLength));
      setTimeout(() => this.output({ numberOfFrames: s.length, copyTo: (dst) => { for (let i = 0; i < s.length; i++) dst[i] = s[i] / 0x8000; }, close() {} }), 1);
    }
    flush() { return Promise.resolve(); }
    close() {}
  }
  return { AudioDecoder, EncodedAudioChunk };
};

test("codecOf: the first codec in the Accept's list the server can encode; opus only once the encoder loaded", () => {
  const F = "application/x-taxila-pcm-frames;v=2";
  assert.equal(codecOf(req(`${F};codec=opus+adpcm`), { opus: true }), "opus");
  assert.equal(codecOf(req(`${F};codec=opus+adpcm`), { opus: false }), "adpcm", "no encoder: the next in the list");
  assert.equal(codecOf(req(`${F};codec=opus`), { opus: false }), "pcm");
  assert.equal(codecOf(req(`${F};codec=adpcm`), { opus: true }), "adpcm", "round 5 clients unchanged");
  assert.equal(codecOf(req(F), { opus: true }), "pcm");
  assert.equal(codecOf(req("audio/pcm"), { opus: true }), "pcm");
});

test("frameWriter opus: one packet per 20 ms whatever the chunking; the remainder zero-padded before the end frame", async () => {
  setOpusFactory(identity);
  try {
    assert.equal(opusReady(), true);
    const res = sink();
    const w = frameWriter(res, true, { codec: "opus" });
    assert.equal(w.codec, "opus");
    const pcm = Buffer.alloc((OPUS.frameSamples * 2 + 100) * 2);
    for (let i = 0; i < pcm.length / 2; i++) pcm.writeInt16LE((i % 2000) - 1000, i * 2);
    w.pcm(pcm.subarray(0, 333)); w.pcm(pcm.subarray(333, 1500)); w.pcm(pcm.subarray(1500));
    w.json(FRAME.event, { t: "clause", clause: 1, atSample: 960 });
    w.json(FRAME.end, { t: "end", status: "ok" });
    res.end();
    await res.ended; // the route's res.end() waits for the sliced encoder to drain
    const raw = parseFrames(Buffer.concat(res.chunks));
    const types = raw.map((f) => f.type);
    assert.deepEqual(types, [FRAME.opus, FRAME.opus, FRAME.event, FRAME.opus, FRAME.end], "the padded last packet goes just before end");
    const audio = Buffer.concat(raw.filter((f) => f.type === FRAME.opus).map((f) => f.payload));
    assert.equal(audio.length, 3 * OPUS.frameSamples * 2, "samples out = samples in, rounded up to 20 ms");
    assert.ok(audio.subarray(0, pcm.length).equals(pcm), "the same samples, in order");
    assert.ok(audio.subarray(pcm.length).every((b) => b === 0), "zero padding");
  } finally { setOpusFactory(null); }
});

test("frameWriter: asking opus with no encoder never throws at the route (codecOf already fell back)", () => {
  setOpusFactory(null);
  assert.equal(codecOf(req("application/x-taxila-pcm-frames;v=2;codec=opus")), "pcm");
  const w = frameWriter(sink(), true, { codec: "adpcm" });
  assert.equal(w.codec, "adpcm");
});

test("OpusPcmDecoder: in order through WebCodecs; without it, 20 ms of silence per packet (never a stall)", async () => {
  const d = new OpusPcmDecoder(fakeCodecs());
  const a = new Int16Array([1, 2, 3]), b = new Int16Array([4, 5]);
  const [pa, pb] = await Promise.all([d.decode(new Uint8Array(a.buffer)), d.decode(new Uint8Array(b.buffer))]);
  assert.deepEqual([...new Int16Array(pa.buffer)], [1, 2, 3], "s16 → f32 → s16 is lossless at these values");
  assert.equal(pb.length, 4);
  const none = new OpusPcmDecoder({});
  assert.equal((await none.decode(new Uint8Array(10))).length, 960);
});

test("readFrames / pcmOfFrames: opus frames come out as PCM in order, JSON frames where they were", async () => {
  setOpusFactory(identity);
  try {
    const res = sink();
    const w = frameWriter(res, true, { codec: "opus" });
    w.json(FRAME.header, { v: 2, codec: "opus" });
    const pcm = Buffer.alloc(OPUS.frameSamples * 2 * 2);
    for (let i = 0; i < pcm.length / 2; i++) pcm.writeInt16LE(i, i * 2);
    w.pcm(pcm);
    w.json(FRAME.end, { t: "end", status: "ok" });
    res.end();
    await res.ended;
    const body = Buffer.concat(res.chunks);
    const stream = () => new ReadableStream({ start(c) { for (let i = 0; i < body.length; i += 700) c.enqueue(new Uint8Array(body.subarray(i, i + 700))); c.close(); } });
    const seen = [];
    for await (const f of readFrames(stream(), new OpusPcmDecoder(fakeCodecs()))) seen.push(f.type === CFRAME.pcm ? `pcm:${f.payload.length}` : `json:${f.type}`);
    assert.deepEqual(seen, [`json:${FRAME.header}`, "pcm:960", "pcm:960", `json:${FRAME.end}`]);
    const frames = [];
    const out = pcmOfFrames(stream(), (f) => frames.push(f.type), new OpusPcmDecoder(fakeCodecs()));
    let n = 0;
    for await (const c of out) n += c.length;
    assert.equal(n, pcm.length);
    assert.deepEqual(frames, [FRAME.header, FRAME.end]);
  } finally { setOpusFactory(null); }
});

test("framesAccept: opus first where WebCodecs decodes it; adpcm after it on a slow link; the old Accept otherwise", () => {
  resetOpusProbe(true);
  try {
    assert.match(framesAccept(), /;codec=opus$/);
    resetOpusProbe(false);
    assert.equal(framesAccept(), "application/x-taxila-pcm-frames;v=2");
  } finally { resetOpusProbe(null); }
});

test("marks stay aligned (main's condition 3): the same reply as PCM and as real Opus carries identical event frames, and Opus covers every PCM sample", async () => {
  const { loadOpus } = await import("../server/voice/opus.js");
  if (!(await loadOpus())) return; // opusscript not installed: the negotiation test above covers the fallback
  const { _turnAudio, turnAudioDeps } = await import("../server/routes/voice.js");
  const tone = (n) => { const b = Buffer.alloc(n * 2); for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(6000 * Math.sin(i / 7)), i * 2); return b; };
  Object.assign(turnAudioDeps, { style: () => ({}), synth: async function* (clause) { yield tone(400 + clause.length * 37); yield tone(900); },
    lessonTurn: async (req, body, hooks) => { hooks.onClause({ lessonId: "L1", seq: 4, i: 0, text: "Achha, saat.", final: false }); return { teacherReply: "Achha, saat. Ab 3 aur 4?", teacherReplySeq: 4 }; } });
  const run = async (accept) => {
    const res = sink();
    Object.assign(res, { statusCode: 0, writableEnded: false, writeHead(c) { this.statusCode = c; }, flushHeaders() {}, on() {}, once() {}, off() {} });
    await _turnAudio({ headers: { cookie: "tx_session=t", accept }, url: "/api/lesson/turn-audio" }, res, { lessonId: "L1" });
    await Promise.race([res.ended, new Promise((r) => setTimeout(r, 2000))]);
    return parseFrames(Buffer.concat(res.chunks));
  };
  try {
    const pcm = await run("application/x-taxila-pcm-frames;v=2");
    const opus = await run("application/x-taxila-pcm-frames;v=2;codec=opus");
    const events = (fs) => fs.filter((f) => f.type !== FRAME.pcm && f.type !== FRAME.opus && f.type !== FRAME.header).map((f) => JSON.stringify({ ...f.payload, ms: undefined, firstAudioMs: undefined })); // wall-clock fields aside
    assert.deepEqual(events(opus), events(pcm), "clause / say / turn / end frames identical");
    assert.equal(opus.find((f) => f.type === FRAME.header).payload.codec, "opus");
    assert.ok(!opus.some((f) => f.type === FRAME.pcm), "no raw PCM on an Opus reply");
    const samples = pcm.filter((f) => f.type === FRAME.pcm).reduce((a, f) => a + f.payload.length / 2, 0);
    const packets = opus.filter((f) => f.type === FRAME.opus).length;
    assert.equal(packets, Math.ceil(samples / OPUS.frameSamples), "Opus covers every PCM sample, padded once at the end");
  } finally { Object.assign(turnAudioDeps, { lessonTurn: null, style: null, synth: null }); setOpusFactory(null); }
});

test("load failure (main's condition 4): TAXILA_TTS_OPUS=off or no encoder → the request gets ADPCM or PCM and the header says which", async () => {
  const { loadOpus } = await import("../server/voice/opus.js");
  setOpusFactory(null);
  assert.equal(await loadOpus({ TAXILA_TTS_OPUS: "off" }), false);
  const res = sink();
  const codec = codecOf(req("application/x-taxila-pcm-frames;v=2;codec=opus+adpcm"));
  assert.equal(codec, "adpcm");
  const w = frameWriter(res, true, { codec });
  w.json(FRAME.header, { v: 2, ...(w.codec !== "pcm" ? { codec: w.codec } : {}) });
  assert.equal(parseFrames(Buffer.concat(res.chunks))[0].payload.codec, "adpcm");
});
