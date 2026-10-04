// HUMAN-VOICE B1/B4/B5 end to end without a network: the DragonHD client and its gpt-4o-mini-tts fallback (identity
// change logged), prewarm with a DeliveryPlan (governed, compiled SSML per part, exact pauses), tts-stream in framed v2
// (header, PCM, one clause event per part, end) and raw PCM for old clients, the uptake prelude, and the voice config.
import test from "node:test";
import assert from "node:assert/strict";
import { prewarm, take, deliveryFor, __test as warm } from "../server/voice/prewarm.js";
import { setCacheStore, speakChunk } from "../server/voice/speech.js";
import { expressiveSeam } from "../server/voice/expressive/seam.js";
import { routes as voiceRoutes, wantsFrames } from "../server/routes/voice.js";
import { parseFrames, FRAMES_CONTENT_TYPE } from "../server/voice/frames.js";
import { cascadeEngine, dhdVoiceFor, expressiveOn, VOICE_TABLE } from "../server/voice/voices.js";
import { snapshot, resetTelemetry } from "../server/voice/expressive/telemetry.js";
import { createHash } from "node:crypto";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RATE = 24_000;
const tone = (msLen, amp = 8000) => { const n = Math.round((RATE * msLen) / 1000); const b = Buffer.alloc(n * 2); for (let k = 0; k < n; k++) b.writeInt16LE(Math.round(amp * Math.sin(k / 6)), k * 2); return b; };
const quiet = (msLen) => Buffer.alloc(Math.round((RATE * msLen) / 1000) * 2);

/** Fake Azure: Speech (SSML) and /audio/speech (JSON). Each render = 120 ms lead silence + 300 ms tone + 150 ms tail. */
function stubAzure({ speechFails = false } = {}) {
  const orig = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes("/cognitiveservices/v1")) {
      calls.push({ kind: "dhd", ssml: String(init.body), headers: init.headers });
      if (speechFails) return new Response("down", { status: 503 });
    } else if (u.includes("/audio/speech")) calls.push({ kind: "oai", body: JSON.parse(init.body) });
    else return orig(url, init);
    const pcm = Buffer.concat([quiet(120), tone(300), quiet(150)]);
    return new Response(new ReadableStream({ async start(c) { await sleep(2); c.enqueue(new Uint8Array(pcm.subarray(0, 4000))); await sleep(2); c.enqueue(new Uint8Array(pcm.subarray(4000))); c.close(); } }), { status: 200 });
  };
  return { calls, restore: () => { globalThis.fetch = orig; } };
}
const envSet = (vars) => { const prev = {}; for (const [k, v] of Object.entries(vars)) { prev[k] = process.env[k]; if (v === undefined) delete process.env[k]; else process.env[k] = v; } return () => { for (const [k, v] of Object.entries(prev)) if (v === undefined) delete process.env[k]; else process.env[k] = v; }; };
const DHD = { engine: "dhd", dhd: { voice: "en-IN-Diya:DragonHDLatestNeural", baseRate: -35 }, voice: "marin", instructions: "accent: Indian", version: "s1:dhd", spoken: { mode: "hinglish" } };
const moment = (o = {}) => ({ move: "worked_example", verdict: "ungraded", engagement: "engaged", teacherAffect: { display: "neutral_warm", intensity: 1, cause: "none", turn: 2 },
  bondStage: "first_sessions", safety: false, childLaughed: false, thinkAloud: true, band: "B3", lang: "hinglish", ...o });

function fakeRes() {
  const chunks = [];
  const handlers = {};
  const res = {
    statusCode: 0, headers: null, writableEnded: false, destroyed: false,
    writeHead(code, h) { this.statusCode = code; this.headers = h; return this; },
    flushHeaders() {}, write(b) { chunks.push(Buffer.from(b)); return true; }, end() { this.writableEnded = true; },
    on(ev, fn) { (handlers[ev] ??= []).push(fn); return this; }, once(ev, fn) { return this.on(ev, fn); }, off() { return this; },
  };
  return { res, body: () => Buffer.concat(chunks) };
}
const COOKIE = "tx_session";
const reqWith = (token, accept) => ({ headers: { cookie: `${COOKIE}=${token}`, ...(accept ? { accept } : {}) } });
const sha = (t) => createHash("sha256").update(t).digest("hex");

test.beforeEach(() => { setCacheStore({ get: async () => null, put: async () => {} }); resetTelemetry(); });
test.afterEach(() => warm.clear());

test("voices: config-driven; DragonHD only when Azure Speech is configured; per-character override; expressive flag", () => {
  const restore = envSet({ AZURE_SPEECH_REGION: undefined, AZURE_SPEECH_KEY: undefined, TAXILA_CASCADE_ENGINE: undefined });
  try {
    assert.equal(cascadeEngine(), "oai");
    process.env.AZURE_SPEECH_REGION = "centralindia"; process.env.AZURE_SPEECH_KEY = "k";
    assert.equal(cascadeEngine(), "dhd");
    process.env.TAXILA_CASCADE_ENGINE = "oai";
    assert.equal(cascadeEngine(), "oai");
    assert.equal(dhdVoiceFor("asha").dhd, VOICE_TABLE.asha.dhd);
    assert.equal(dhdVoiceFor("nobody").dhd, VOICE_TABLE.asha.dhd);
    process.env.TAXILA_DHD_VOICE_ASHA = "en-IN-Meera:DragonHDLatestNeural"; process.env.TAXILA_DHD_RATE_ASHA = "-20";
    assert.deepEqual([dhdVoiceFor("asha").dhd, dhdVoiceFor("asha").baseRate, dhdVoiceFor("asha").measured], ["en-IN-Meera:DragonHDLatestNeural", -20, false]);
    assert.equal(expressiveOn("dhd"), true);
    assert.equal(expressiveOn("oai"), false);
  } finally { restore(); delete process.env.TAXILA_DHD_VOICE_ASHA; delete process.env.TAXILA_DHD_RATE_ASHA; }
});

test("DragonHD: SSML goes to Azure Speech as raw PCM with the key header; a failure falls back to the character's mini-tts voice and is counted", async () => {
  const restore = envSet({ AZURE_SPEECH_REGION: "centralindia", AZURE_SPEECH_KEY: "speech-key", AZURE_OPENAI_ENDPOINT: "https://example.invalid/openai/v1", AZURE_OPENAI_API_KEY: "k" });
  let f = stubAzure();
  try {
    const job = speakChunk("Chalo, 27 aur 35 jodte hain.", DHD);
    for await (const _ of job.read());
    assert.equal(f.calls[0].kind, "dhd");
    assert.equal(f.calls[0].headers["X-Microsoft-OutputFormat"], "raw-24khz-16bit-mono-pcm");
    assert.equal(f.calls[0].headers["Ocp-Apim-Subscription-Key"], "speech-key");
    assert.match(f.calls[0].ssml, /<voice name="en-IN-Diya:DragonHDLatestNeural"><prosody rate="-35%">Chalo, twenty-seven aur thirty-five jodte hain\.<\/prosody>/);
    f.restore();
    f = stubAzure({ speechFails: true });
    const fb = speakChunk("Ek aur sawaal, dhyan se suno.", DHD);
    for await (const _ of fb.read());
    assert.deepEqual(f.calls.map((c) => c.kind), ["dhd", "oai"]);
    assert.equal(f.calls[1].body.voice, "marin");
    assert.equal(fb.fellBack, true);
    assert.equal(snapshot()["voice.expr.engine_fallback"], 1);
  } finally { f.restore(); restore(); }
});

test("prewarm with a plan: governed, one SSML document per part with markers/rate/breaks, exact pauses, remembered for Hear", async () => {
  const restore = envSet({ AZURE_SPEECH_REGION: "centralindia", AZURE_SPEECH_KEY: "k" });
  const f = stubAzure();
  try {
    const text = "Chalo, 27 aur 35 jodte hain. Pehle tens: 20 aur 30, matlab 50. Phir 7 aur 5, 12. Toh total kya hua?";
    const delivery = expressiveSeam.planDelivery(moment(), text);
    assert.ok(delivery);
    assert.ok(prewarm({ lessonId: "L-pipe", seq: 4, text, tokenHash: "h", guardianId: "g", style: DHD, delivery }));
    const e = take("L-pipe", 4, "h");
    assert.equal(e.parts.length, e.renders.length);
    assert.ok(e.renders.every((r) => r.engine === "dhd" && r.ssml.startsWith("<speak")));
    assert.equal(e.pauses[0], 0);
    assert.ok(e.pauses.slice(1).every((p) => p > 0), e.pauses.join(","));
    e.startUpTo(e.parts.length);
    await sleep(20);
    assert.ok(f.calls.filter((c) => c.kind === "dhd").every((c) => /\[reflective\]|\[appreciative\]/.test(c.ssml)));
    assert.ok(f.calls.every((c) => !/\d/.test(c.ssml.replace(/<[^>]*>/g, ""))), "no digit reached the voice");
    assert.ok(deliveryFor("L-pipe", 4)?.governed, "the governed plan is remembered for Hear and a missed prewarm");
    assert.equal(snapshot()["voice.expr.plan"], 1);
  } finally { f.restore(); restore(); }
});

test("tts-stream framed v2: header, PCM with the planned pause as exact silence, one clause event per part, end; raw PCM for old clients", async () => {
  const restore = envSet({ AZURE_SPEECH_REGION: "centralindia", AZURE_SPEECH_KEY: "k" });
  const f = stubAzure();
  try {
    const text = "Achha, yahan thoda rukte hain. Pizza ke 4 tukde hain, aur tumne 3 khaaye. Ek baar phir dekho?";
    const lessonId = "00000000-0000-0000-0000-0000000000aa";
    const delivery = expressiveSeam.planDelivery(moment({ move: "hint", verdict: "not_yet", thinkAloud: false }), text);
    prewarm({ lessonId, seq: 5, text, tokenHash: sha("tok"), guardianId: "g-framed", style: DHD, delivery });
    const accept = "application/x-taxila-pcm-frames;v=2";
    assert.equal(wantsFrames(reqWith("tok", accept)), true);
    const { res, body } = fakeRes();
    await voiceRoutes["POST /api/voice/tts-stream"](reqWith("tok", accept), res, { lessonId, seq: 5 });
    assert.equal(res.headers["content-type"], FRAMES_CONTENT_TYPE);
    const frames = parseFrames(body());
    assert.equal(frames[0].type, 2);
    assert.equal(frames[0].payload.v, 2);
    assert.equal(frames.at(-1).type, 4);
    assert.equal(frames.at(-1).payload.status, "ok");
    const events = frames.filter((x) => x.type === 1).map((x) => x.payload);
    const e = deliveryFor(lessonId, 5).plan;
    const partsN = new Set(e.clauses.map((c) => c.part)).size;
    assert.equal(events.length, partsN, "one clause event per part");
    assert.ok(events.every((ev, i) => ev.t === "clause" && ev.part === i && (i === 0 ? ev.atSample === 0 : ev.atSample > 0)));
    // per part: 30 ms kept lead + 300 ms tone + 40 ms kept tail (the last part keeps its whole 150 ms tail); plus the
    // planned pause between parts
    const pcmBytes = frames.filter((x) => x.type === 0).reduce((a, x) => a + x.payload.length, 0);
    const pauses = [...new Set(e.clauses.map((c) => c.part))].slice(1).map((p) => e.clauses.find((c) => c.part === p).pauseBeforeMs);
    const expectMs = partsN * (30 + 300) + (partsN - 1) * 40 + 150 + pauses.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(pcmBytes / 48 - expectMs) <= 12 * partsN, `${pcmBytes / 48} ms vs ${expectMs} ms`);
    // the same turn, raw (an old client): no frames at all
    prewarm({ lessonId, seq: 6, text, tokenHash: sha("tok"), guardianId: "g-framed2", style: DHD, delivery: expressiveSeam.planDelivery(moment(), text) });
    const raw = fakeRes();
    await voiceRoutes["POST /api/voice/tts-stream"](reqWith("tok"), raw.res, { lessonId, seq: 6 });
    assert.equal(raw.res.headers["content-type"], "audio/pcm");
    assert.equal(raw.body().length % 2, 0);
    assert.notEqual(raw.body()[0], 2, "starts with PCM, not a header frame");
  } finally { f.restore(); restore(); }
});

test("uptake prelude: the child's token is spoken first (memory cache only), then a gap, then the reply without the echo", async () => {
  const restore = envSet({ AZURE_SPEECH_REGION: "centralindia", AZURE_SPEECH_KEY: "k" });
  const puts = [];
  setCacheStore({ get: async () => null, put: async (k) => { puts.push(k); } });
  const f = stubAzure();
  try {
    const text = "62! Achha, ab mujhe batao ki tumne yeh kaise socha, ek ek step karke?"; // every reply part is too long to cache
    const lessonId = "00000000-0000-0000-0000-0000000000bb";
    const delivery = expressiveSeam.planDelivery(moment({ move: "probe", thinkAloud: false, uptakePrelude: { text: "62" } }), text);
    assert.deepEqual(delivery.prelude, { text: "62" });
    prewarm({ lessonId, seq: 9, text, tokenHash: sha("tok"), guardianId: "g-prelude", style: DHD, delivery });
    const { res, body } = fakeRes();
    await voiceRoutes["POST /api/voice/tts-stream"](reqWith("tok", "application/x-taxila-pcm-frames;v=2"), res, { lessonId, seq: 9 });
    const ssmls = f.calls.filter((c) => c.kind === "dhd").map((c) => c.ssml);
    assert.ok(ssmls.some((s) => /sixty-two/i.test(s) && !/batao/.test(s)), "a prelude document with the token alone");
    assert.ok(ssmls.filter((s) => /batao/.test(s)).every((s) => !/sixty-two/i.test(s)), "the reply no longer echoes it");
    assert.equal(snapshot()["voice.expr.prelude"], 1);
    await sleep(5);
    assert.equal(puts.length, 0, "the prelude (the child's words) never reaches asset_cache");
    assert.equal(parseFrames(body()).at(-1).payload.status, "ok");
  } finally { f.restore(); restore(); }
});
