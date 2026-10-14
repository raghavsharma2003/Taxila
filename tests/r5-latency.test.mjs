// Round 5, stream 3 (latency): the hedged request (server/azure.js hedged), the note race (conversation/understand.js,
// tested in p5-interaction-conversation), the boot warm (server/boot-warm.js) and the lesson-route preload.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hedged } from "../server/azure.js";

const wait = (ms, signal) => new Promise((res, rej) => { const t = setTimeout(res, ms); signal?.addEventListener("abort", () => { clearTimeout(t); rej(Object.assign(new Error("aborted"), { code: "cancelled" })); }, { once: true }); });

test("hedged: a fast first call wins alone (no twin); a slow one gets a twin at the hedge point and the first answer wins, the other aborted", async () => {
  let calls = 0;
  assert.equal(await hedged(async () => { calls++; await wait(5); return "a"; }, 50), "a");
  assert.equal(calls, 1, "no hedge when the first answers in time");
  const aborted = [];
  const t0 = performance.now();
  const v = await hedged(async (signal, i) => { signal.addEventListener("abort", () => aborted.push(i)); await wait(i === 0 ? 500 : 20, signal); return `arm${i}`; }, 40);
  assert.equal(v, "arm1");
  assert.ok(performance.now() - t0 < 200, "the twin answered, not the hung first call");
  await wait(5);
  assert.deepEqual(aborted, [0], "the slow first call is aborted");
});

test("hedged: a failure before the hedge point starts the twin at once (the retry); both failing rejects with the first error; a content filter never re-sends", async () => {
  let n = 0;
  assert.equal(await hedged(async (s, i) => { n++; if (i === 0) throw new Error("503"); return "ok"; }, 10_000), "ok");
  assert.equal(n, 2);
  await assert.rejects(hedged(async (s, i) => { throw new Error(`fail${i}`); }, 10_000), /fail0/);
  let m = 0;
  await assert.rejects(hedged(async () => { m++; throw Object.assign(new Error("blocked"), { code: "content_filter" }); }, 10), /blocked/);
  await wait(30);
  assert.equal(m, 1, "a content-filter block is the safeguarding signal: never sent twice");
});

test("the reply lane is hedged and the lesson start's one-time builds run at boot, before the port opens", () => {
  const say = readFileSync(new URL("../server/brain/say.js", import.meta.url), "utf8");
  assert.match(say, /hedgeMs: REPLY_HEDGE_MS\(\)/);
  const serve = readFileSync(new URL("../server/serve.mjs", import.meta.url), "utf8");
  assert.ok(serve.indexOf("await warmSync()") > 0 && serve.indexOf("await warmSync()") < serve.indexOf("http.createServer("), "warmSync before listen");
  assert.match(serve, /warmAsync\(\)/);
});

test("boot warm: the stagecraft table is built once and kept (the first lesson start never builds it)", async () => {
  const { warmSync } = await import("../server/boot-warm.js");
  const { productionCatalog } = await import("../server/stagecraft/lesson.js");
  const w = await warmSync();
  assert.equal(typeof w.stagecraftCatalog, "number", JSON.stringify(w));
  const t = performance.now();
  productionCatalog();
  assert.ok(performance.now() - t < 5, "memoised");
});

test("the lesson route's chunk is preloaded from the home (one shared promise with the route's lazy())", () => {
  const routes = readFileSync(new URL("../src/child/routes.tsx", import.meta.url), "utf8");
  assert.match(routes, /const LessonRoute = lazy\(\(\) => loadLessonRoute\(\)/);
  for (const f of ["src/child/screens/Home.tsx", "src/ui-v3/kaksha/screens/KakshaHome.tsx", "src/child/screens/Hello.tsx"]) {
    assert.match(readFileSync(new URL(`../${f}`, import.meta.url), "utf8"), /useEffect\(\(\) => preloadLessonRoute\(\), \[\]\)/, f);
  }
});

// ── the agent loop's streamed speech (server/latency/speech-stream.js) ──
import { clauseSplitter, speakStreamed } from "../server/latency/speech-stream.js";
async function* deltasOf(parts, gapMs = 0) { for (const p of parts) { if (gapMs) await wait(gapMs); yield p; } }
const fakeSynth = (log, ms = 5) => async function* (clause, signal) { log.push(`synth:${clause}`); await wait(ms, signal); yield Buffer.from(clause); };

test("clauseSplitter: sentence ends and long-enough comma phrases are clauses; a short comma is not; the rest flushes", () => {
  const s = clauseSplitter();
  assert.deepEqual(s.push("Achha, "), []);
  assert.deepEqual(s.push("socho ek roti ko teen logon mein baanto, "), ["Achha, socho ek roti ko teen logon mein baanto,"]);
  assert.deepEqual(s.push("kisko zyada milega? Batao"), ["kisko zyada milega?"]);
  assert.deepEqual(s.push(" na।"), []);
  assert.deepEqual(s.flush(), ["Batao na।"]);
});

test("speakStreamed: the first clause is spoken before the model has finished; audio leaves in clause order", async () => {
  const log = [], out = [];
  let modelDone = null;
  const t0 = performance.now();
  const r = await speakStreamed({
    deltas: (async function* () { yield "Haan bilkul sahi! "; await wait(120); yield "Teen logon mein zyada milega, "; await wait(120); yield "kyunki tukde bade hain."; modelDone = performance.now() - t0; })(),
    synth: fakeSynth(log), emit: (e) => { if (e.type === "audio") out.push({ i: e.i, t: performance.now() - t0, s: e.chunk.toString() }); },
  });
  assert.deepEqual(r.spoken, ["Haan bilkul sahi!", "Teen logon mein zyada milega,", "kyunki tukde bade hain."]);
  assert.deepEqual(out.map((x) => x.i), [0, 1, 2]);
  assert.ok(out[0].t < modelDone - 150, `first audio ${out[0].t} ms before the model finished at ${modelDone} ms`);
  assert.equal(r.stopped, null);
});

test("speakStreamed HARD RULE: no audio before the distress read clears; a distress verdict speaks nothing", async () => {
  const out = [];
  let release;
  const before = new Promise((r) => { release = r; });
  const p = speakStreamed({ deltas: deltasOf(["Wah! ", "Bahut badhiya."]), before, synth: fakeSynth([]), emit: (e) => { if (e.type === "audio") out.push(e); } });
  await wait(60);
  assert.equal(out.length, 0, "nothing before the read");
  release({ ok: true });
  const r = await p;
  assert.equal(r.spoken.length, 2);
  const out2 = [];
  const r2 = await speakStreamed({ deltas: deltasOf(["Wah! ", "Bahut badhiya."]), before: Promise.resolve({ ok: false, why: "distress" }), synth: fakeSynth([]), emit: (e) => out2.push(e) });
  assert.equal(out2.length, 0);
  assert.deepEqual(r2.stopped, { why: "distress", clause: null });
  const r3 = await speakStreamed({ deltas: deltasOf(["Wah! "]), before: Promise.reject(new Error("model down")), synth: fakeSynth([]), emit: (e) => out2.push(e) });
  assert.equal(out2.length, 0, "a failed distress read fails closed");
  assert.equal(r3.stopped.why, "distress_read_failed");
});

test("speakStreamed: the floor gate runs on each clause BEFORE synthesis; a blocked clause and everything after it are never spoken", async () => {
  const log = [], said = [];
  const r = await speakStreamed({
    deltas: deltasOf(["Pehli baat theek hai. ", "Yeh line block hogi. ", "Yeh bhi nahi bolegi."]),
    gate: (c) => (/block/.test(c) ? { ok: false, why: "floor:never" } : { ok: true }),
    synth: fakeSynth(log), emit: (e) => { if (e.type === "clause") said.push(e.text); },
  });
  assert.deepEqual(said, ["Pehli baat theek hai."]);
  assert.deepEqual(log, ["synth:Pehli baat theek hai."], "the blocked clause never reached TTS");
  assert.deepEqual(r.stopped, { why: "floor:never", clause: "Yeh line block hogi." });
});

test("child map: parallel readers share ONE request per child; an aborted reader detaches; a failed read is not kept", async () => {
  const realFetch = globalThis.fetch;
  let calls = 0, fail = false;
  globalThis.fetch = async (url) => { calls++; await wait(20); if (fail) return new Response("boom", { status: 500 }); return new Response(JSON.stringify({ mode: "sky", subjects: [] }), { status: 200, headers: { "content-type": "application/json" } }); };
  try {
    const { getChildMap } = await import("../src/child/api.ts");
    const cid = `kid-${Math.random()}`;
    const ac = new AbortController();
    const a = getChildMap(cid, "sky"), b = getChildMap(cid, "garden"), c = getChildMap(cid, "sky", ac.signal);
    ac.abort();
    await assert.rejects(c);
    const [ma, mb] = await Promise.all([a, b]);
    assert.equal(calls, 1, "one request for three readers");
    assert.equal(ma.mode, "sky"); assert.equal(mb.mode, "sky", "the server's mode wins, as before");
    fail = true;
    const other = `kid-${Math.random()}`;
    await getChildMap(other, "sky");
    await wait(5);
    fail = false;
    await getChildMap(other, "sky");
    assert.equal(calls, 3, "a failed read is re-asked, never served from the share");
  } finally { globalThis.fetch = realFetch; }
});

// ── round 5: the non-verbal continuer (owner cohort; server/latency/ack.js + routes.js ackDecision + src/latency/ack.ts) ──
import { continuerPlanOf, continuerPhraseOf, continuerCohortHas, CONTINUERS } from "../server/latency/ack.js";
import { ackDecision, __ack } from "../server/latency/routes.js";
import { AckClient, CONTINUER_MIN_MS } from "../src/latency/ack.ts";
import { createHash } from "node:crypto";

const cls0 = (over = {}) => ({ outcome: "no_evidence", confidence: 1, source: "model", flags: { distress: false }, ...over });
function ackDeps(cls) {
  let t = 1_000_000;
  const synth = [];
  return { synth, clock: () => t, d: {
    now: () => t, sleep: async (ms) => { t += Math.max(0, ms); },
    awaitPerception: async () => ({ at: t, clsP: Promise.resolve(cls), source: "turn" }), perceptionsFor: () => [],
    ackAudio: async (p) => { synth.push(p); return Buffer.from(`pcm:${p}`); }, styleOf: () => ({ engine: "oai" }), history: new Map(), continuerLast: new Map(),
  } };
}
const ackX = (text, over = {}) => ({ lessonId: "L5", text, state: { turn: 4, ctx: { lang: "hinglish" } }, child: { first_name: "Aarav", language_pref: "hinglish" }, item: null, mode: "on", ...over });

test("continuer: never a content word or an agreement; the register follows the child; never the same one twice running", () => {
  for (const p of [...CONTINUERS.hi, ...CONTINUERS.en]) assert.doesNotMatch(p, /sahi|galat|badhiya|right|wrong|correct|good|haan|हाँ|yes/i, p);
  for (let turn = 0; turn < 12; turn++) {
    const last = continuerPhraseOf("hi", turn - 1, null);
    assert.notEqual(continuerPhraseOf("hi", turn, last), last);
  }
  assert.ok(CONTINUERS.en.includes(continuerPlanOf({ cls: cls0(), turn: 3, lang: "en" }).phrase));
});

test("continuer gates: never on distress, a safeguard, a duplex partial-safety hit, a content filter, a stop / goodbye, or two turns running", () => {
  const base = { cls: cls0(), turn: 6, lang: "hi" };
  assert.equal(continuerPlanOf({ ...base, cls: cls0({ flags: { distress: true } }) }).none, "safety");
  assert.equal(continuerPlanOf({ ...base, safeguardOpen: true }).none, "safety");
  assert.equal(continuerPlanOf({ ...base, pendingSafety: true }).none, "safety");
  assert.equal(continuerPlanOf({ ...base, cls: cls0({ source: "content_filter" }) }).none, "safety");
  assert.equal(continuerPlanOf({ ...base, cls: cls0({ request: { type: "goodbye" } }) }).none, "leaving");
  assert.equal(continuerPlanOf({ ...base, history: [5] }).none, "consecutive");
  assert.equal(continuerPlanOf({ ...base, history: [4] }).kind, "continuer", "every other turn is allowed");
});

test("continuer cohort: email or its sha256 on TAXILA_ACK_CONTINUER_FOR; nobody when unset", () => {
  const env = { TAXILA_ACK_CONTINUER_FOR: `owner@gmail.com, ${createHash("sha256").update("second@x.in").digest("hex")}` };
  assert.equal(continuerCohortHas("Owner@Gmail.com", env), true);
  assert.equal(continuerCohortHas("second@x.in", env), true);
  assert.equal(continuerCohortHas("other@x.in", env), false);
  assert.equal(continuerCohortHas("owner@gmail.com", {}), false);
});

test("the route: a non-answer gets the continuer only when asked (cohort + device), after classify, its clip from the phrase alone", async () => {
  __ack.clear();
  const { d } = ackDeps(cls0());
  assert.equal((await ackDecision(d, ackX("pata nahi didi"))).none, "no_token", "not asked: today's behaviour");
  const r = await ackDecision(d, ackX("pata nahi didi", { continuer: true }));
  assert.equal(r.ack.kind, "continuer");
  assert.ok(CONTINUERS.hi.includes(r.ack.phrase));
  assert.equal(String(r.pcm), `pcm:${r.ack.phrase}`);
  const dist = ackDeps(cls0({ flags: { distress: true } }));
  assert.equal((await ackDecision(dist.d, ackX("mujhe kuch acha nahi lag raha", { continuer: true }))).none, "safety");
  // the predicate before anything: words that trip it are never synthesised
  const pred = ackDeps(cls0());
  const rp = await ackDecision(pred.d, ackX("main mar jaana chahta hoon", { continuer: true }));
  assert.equal(rp.none, "safety");
  assert.deepEqual(pred.synth, []);
});

test("the device: a continuer waits until CONTINUER_MIN_MS after the child stopped; her reply starting first drops it", async () => {
  let t = 10_000;
  const played = [];
  const mk = () => new AckClient({ lessonId: "L", now: () => t, decode: (b) => Buffer.from(b, "base64"), onClip: (c) => played.push(c),
    post: async (b) => (assert.equal(b.continuer, true), { ack: { kind: "continuer", phrase: "हम्म…", token: "", pcm: Buffer.from("x").toString("base64"), rate: 24000, ms: 400, turn: 1 } }) });
  const a = mk();
  a.speechEnded(t);
  t += 300; a.onFinal("pata nahi");
  await wait(5);
  assert.equal(played.length, 0, "not before 900 ms after the child stopped");
  t += CONTINUER_MIN_MS; await wait(CONTINUER_MIN_MS - 300 + 50);
  assert.equal(played.length, 1);
  const b = mk();
  b.speechEnded(t);
  b.onFinal("pata nahi"); await wait(5);
  b.replyStarting();
  t += CONTINUER_MIN_MS; await wait(CONTINUER_MIN_MS + 50);
  assert.equal(played.length, 1, "her reply came first: no continuer");
  const c = new AckClient({ lessonId: "L", now: () => t, continuer: () => false, post: async (body) => { assert.equal(body.continuer, undefined, "off (D5): not asked"); return null; } });
  c.onFinal("pata nahi"); await wait(5);
});

// ── QA D12: ADPCM TTS frames on slow links (server/voice/adpcm.js, frames.js, src/lesson/adpcm.ts, ttsStream.ts) ──
import { adpcmEncoder, adpcmDecode } from "../server/voice/adpcm.js";
import { frameWriter, parseFrames, codecOf, FRAME as SFRAME } from "../server/voice/frames.js";
import { decodeAdpcm } from "../src/lesson/adpcm.ts";
import { FrameParser, FRAME as CFRAME } from "../src/lesson/ttsStream.ts";

const tone = (n) => { const b = Buffer.alloc(n * 2); for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(9000 * Math.sin(i * 2 * Math.PI * 180 / 24000) + 2500 * Math.sin(i * 2 * Math.PI * 1900 / 24000)), i * 2); return b; };

test("ADPCM: a quarter of the bytes, the device decoder equals the server's byte for byte, speech-band SNR > 30 dB, any chunking", () => {
  const pcm = tone(24000);
  const enc = adpcmEncoder(), frames = [];
  for (let i = 0; i < pcm.length; i += 1013) { const f = enc.write(pcm.subarray(i, i + 1013)); if (f) frames.push(f); } // odd chunk sizes
  const bytes = frames.reduce((a, f) => a + f.length, 0);
  assert.ok(bytes < pcm.length * 0.27, `${bytes} of ${pcm.length}`);
  const server = Buffer.concat(frames.map(adpcmDecode)), device = Buffer.concat(frames.map((f) => Buffer.from(decodeAdpcm(new Uint8Array(f)))));
  assert.ok(server.equals(device), "the two decoders agree exactly");
  let se = 0, ss = 0;
  for (let i = 0; i < server.length / 2; i++) { const a = pcm.readInt16LE(i * 2), b = server.readInt16LE(i * 2); se += (a - b) ** 2; ss += a * a; }
  assert.ok(10 * Math.log10(ss / se) > 30);
  assert.ok(pcm.length / 2 - server.length / 2 <= 1, "at most one sample held back at the end");
});

test("ADPCM negotiation: only an explicit codec=adpcm on frames v2; the writer frames type 5 and the parsers hand back PCM", () => {
  assert.equal(codecOf({ headers: { accept: "application/x-taxila-pcm-frames;v=2;codec=adpcm" } }), "adpcm");
  assert.equal(codecOf({ headers: { accept: "application/x-taxila-pcm-frames;v=2" } }), "pcm");
  assert.equal(codecOf({ headers: { accept: "audio/pcm, codec=adpcm" } }), "pcm", "never outside frames");
  const chunks = [];
  const res = { write: (b) => { chunks.push(Buffer.from(b)); return true; } };
  const w = frameWriter(res, true, { codec: "adpcm" });
  assert.equal(w.codec, "adpcm");
  w.json(SFRAME.header, { v: 2, codec: "adpcm" });
  const pcm = tone(4800);
  w.pcm(pcm.subarray(0, 3001)); w.pcm(pcm.subarray(3001));
  const all = Buffer.concat(chunks);
  assert.ok(all.length < pcm.length * 0.3);
  const s = parseFrames(all);
  assert.equal(s.filter((f) => f.type === SFRAME.pcm).reduce((a, f) => a + f.payload.length, 0) >= pcm.length - 6, true);
  const p = new FrameParser();
  const got = [...p.push(new Uint8Array(all.subarray(0, 1000))), ...p.push(new Uint8Array(all.subarray(1000)))];
  assert.equal(got[0].type, CFRAME.header);
  assert.ok(got.slice(1).every((f) => f.type === CFRAME.pcm), "the device sees PCM frames only");
  // an old client (no codec) gets raw PCM frames, unchanged
  const raw = []; const w2 = frameWriter({ write: (b) => { raw.push(Buffer.from(b)); return true; } }, true);
  w2.pcm(pcm);
  assert.equal(parseFrames(Buffer.concat(raw))[0].payload.length, pcm.length);
});
