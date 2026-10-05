// W2-G fixer (2026-10-05): the review's blocker and majors, each as a test.
//   - helplines in every separator form are read digit by digit, in Hinglish and Hindi cells (child-safety floor);
//   - the DragonHD → mini-tts fallback is sticky per reply and per lesson, behind a circuit breaker (one voice);
//   - the uptake echo is stripped only when the prelude actually played (HV-2 in the audio the child hears);
//   - the prelude token is screened (closed class, never a profanity / phone number / the child's name);
//   - minors: safety turns keep 300 ms at every boundary, stage directions never reach DragonHD, plain identity answers
//     are the safety register, Roman fillers for Hinglish, an unprobed voice stays on mini-tts.
import test from "node:test";
import assert from "node:assert/strict";
import { speakable } from "../server/voice/spoken.js";
import { setCacheStore, __breaker, BREAKER_OPEN_MS } from "../server/voice/speech.js";
import { speakingEntry, prewarm, take, __test as warm } from "../server/voice/prewarm.js";
import { expressiveSeam } from "../server/voice/expressive/seam.js";
import { align, withEcho } from "../server/voice/expressive/align.js";
import { renderParts } from "../server/voice/expressive/render.js";
import { createGovernor } from "../server/voice/expressive/governor.js";
import { safetyRegister } from "../server/voice/expressive/safety.js";
import { preludeTokenOk } from "../server/voice/expressive/prelude.js";
import { plainSsml, compileDhd } from "../server/voice/expressive/compile/dhd.js";
import { fillersFor, momentPlan } from "../server/voice/expressive/moment.js";
import { dhdVoiceFor } from "../server/voice/voices.js";
import { routes as voiceRoutes } from "../server/routes/voice.js";
import { parseFrames } from "../server/voice/frames.js";
import { snapshot, resetTelemetry } from "../server/voice/expressive/telemetry.js";
import { createHash } from "node:crypto";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RATE = 24_000;
const tone = (msLen) => { const n = Math.round((RATE * msLen) / 1000); const b = Buffer.alloc(n * 2); for (let k = 0; k < n; k++) b.writeInt16LE(Math.round(8000 * Math.sin(k / 6)), k * 2); return b; };
const envSet = (vars) => { const prev = {}; for (const [k, v] of Object.entries(vars)) { prev[k] = process.env[k]; if (v === undefined) delete process.env[k]; else process.env[k] = v; } return () => { for (const [k, v] of Object.entries(prev)) if (v === undefined) delete process.env[k]; else process.env[k] = v; }; };
const DHD = { engine: "dhd", dhd: { voice: "en-IN-Diya:DragonHDLatestNeural", baseRate: -35 }, voice: "marin", instructions: "accent: Indian", version: "s1:dhd", spoken: { mode: "hinglish" } };
const moment = (o = {}) => ({ move: "probe", verdict: "ungraded", engagement: "engaged", teacherAffect: { display: "neutral_warm", intensity: 1, cause: "none", turn: 2 },
  bondStage: "first_sessions", safety: false, childLaughed: false, thinkAloud: false, band: "B3", lang: "hinglish", ...o });
const sha = (t) => createHash("sha256").update(t).digest("hex");

/** Fake Azure. `dhdFails(ssml, n)` / `oaiFails(input, n)` decide a 503 per call (n = 1-based call index of that kind). */
function stubAzure({ dhdFails = () => false, oaiFails = () => false } = {}) {
  const orig = globalThis.fetch;
  const calls = [];
  let nd = 0, no = 0;
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes("/cognitiveservices/v1")) {
      const ssml = String(init.body);
      calls.push({ kind: "dhd", ssml });
      if (dhdFails(ssml, ++nd)) return new Response("down", { status: 503 });
    } else if (u.includes("/audio/speech")) {
      const body = JSON.parse(init.body);
      calls.push({ kind: "oai", input: body.input, voice: body.voice });
      if (oaiFails(body.input, ++no)) return new Response("down", { status: 503 });
    } else return orig(url, init);
    const pcm = tone(200);
    return new Response(new ReadableStream({ async start(c) { await sleep(2); c.enqueue(new Uint8Array(pcm)); c.close(); } }), { status: 200 });
  };
  return { calls, restore: () => { globalThis.fetch = orig; } };
}
const drain = async (entry) => { for (let i = 0; i < entry.parts.length; i++) { entry.startUpTo(i + 1); for await (const _ of entry.jobs[i].read()); } };
const AZ = { AZURE_SPEECH_REGION: "centralindia", AZURE_SPEECH_KEY: "k", AZURE_OPENAI_ENDPOINT: "https://example.invalid/openai/v1", AZURE_OPENAI_API_KEY: "k" };

test.beforeEach(() => { setCacheStore({ get: async () => null, put: async () => {} }); resetTelemetry(); __breaker.reset(); });
test.afterEach(() => warm.clear());

// ───────────── blocker: helplines in every separator form ─────────────

const FORMS = ["1098", "1-0-9-8", "1 0 9 8", "10 98", "1–0–9–8", "1.0.9.8", "(1098)"];
test("helplines: every separator form is read digit by digit, in Hinglish, Hindi and English cells", () => {
  const cells = [[{ mode: "hinglish" }, "one zero nine eight", "one four four one six"], [{ mode: "hinglish", schoolMedium: "hindi" }, "एक शून्य नौ आठ", "एक चार चार एक छह"],
    [{ mode: "hindi" }, "एक शून्य नौ आठ", "एक चार चार एक छह"], [{ mode: "english" }, "one zero nine eight", "one four four one six"]];
  for (const [cell, childline, tele] of cells) {
    for (const f of FORMS) assert.ok(speakable(`Childline ${f} pe call karo.`, cell).includes(childline), `${JSON.stringify(cell)} ${f}: ${speakable(`Childline ${f} pe call karo.`, cell)}`);
    for (const f of ["14416", "1-4-4-1-6", "1 4 4 1 6", "144 16", "1.4.4.1.6"]) assert.ok(speakable(`Tele MANAS ${f} hai.`, cell).includes(tele), `${f}: ${speakable(`Tele MANAS ${f} hai.`, cell)}`);
    const both = speakable("Call 1098/14416 now.", cell);
    assert.ok(both.includes(childline) && both.includes(tele), both);
    assert.ok(!/\d/.test(speakable("Childline 1-0-9-8, Tele MANAS 1-4-4-1-6.", cell)));
  }
  // maths around them is still maths
  assert.match(speakable("10.98 rupaye", { mode: "hinglish" }), /^Ten point nine eight/i);
  assert.match(speakable("10 - 98 kitna?", { mode: "hinglish" }), /^Ten minus ninety-eight/i);
  assert.match(speakable("10981", { mode: "hinglish" }), /ten thousand/i);
});

test("HV-3 extended: separator forms are the safety register; the plan reads them digit by digit at 300 ms gaps", () => {
  for (const f of FORMS.concat(["1-4-4-1-6", "144 16"])) {
    const reply = `Yeh sunke mujhe chinta hui. Abhi kisi bade ko batao. Childline ${f} pe baat kar sakte ho.`;
    assert.equal(safetyRegister(null, reply), true, f);
    const d = expressiveSeam.planDelivery(moment(), reply);
    assert.equal(d.register, "safety", f);
    assert.ok(d.clauses.every((c) => !c.filler));
  }
});

// ───────────── major: sticky engine fallback ─────────────

const REPLY3 = ["Pehla wakya yahan hai.", "Doosra wakya yahan hai.", "Teesra wakya yahan hai."];
const parts3 = () => REPLY3.map((w) => ({ written: w, render: { engine: "dhd", ssml: plainSsml(w, DHD.dhd, DHD.spoken) } }));

test("sticky fallback: part 1 of 3 fails → all 3 parts speak mini-tts; one switch counted", async () => {
  const restore = envSet(AZ);
  const f = stubAzure({ dhdFails: (ssml) => /Pehla/.test(ssml) });
  try {
    const entry = speakingEntry({ parts: parts3(), style: DHD, abort: new AbortController(), lessonId: "L-stick-1" });
    await drain(entry);
    const dhdCalls = f.calls.filter((c) => c.kind === "dhd");
    assert.equal(dhdCalls.length, 1, "no later part tries DragonHD");
    assert.deepEqual(f.calls.filter((c) => c.kind === "oai").map((c) => c.voice), ["marin", "marin", "marin"]);
    assert.ok(entry.jobs.every((j) => j.fellBack));
    assert.equal(snapshot()["voice.expr.engine_fallback"], 1);
  } finally { f.restore(); restore(); }
});

test("sticky fallback: part 2 fails → part 1 DragonHD, parts 2 and 3 mini-tts, part 3 never tries DragonHD", async () => {
  const restore = envSet(AZ);
  const f = stubAzure({ dhdFails: (ssml) => /Doosra/.test(ssml) });
  try {
    const entry = speakingEntry({ parts: parts3(), style: DHD, abort: new AbortController(), lessonId: "L-stick-2" });
    await drain(entry);
    assert.deepEqual(f.calls.map((c) => `${c.kind}:${(c.ssml ?? c.input).match(/Pehla|Doosra|Teesra/)[0]}`), ["dhd:Pehla", "dhd:Doosra", "oai:Doosra", "oai:Teesra"]);
    assert.deepEqual(entry.jobs.map((j) => !!j.fellBack), [false, true, true]);
  } finally { f.restore(); restore(); }
});

test("breaker: after a failure, other replies skip DragonHD (no 4 s waits); the lesson stays on mini-tts until a probe closes it", async () => {
  const restore = envSet(AZ);
  let down = true;
  const f = stubAzure({ dhdFails: () => down });
  try {
    await drain(speakingEntry({ parts: parts3(), style: DHD, abort: new AbortController(), lessonId: "L-a" }));
    assert.equal(f.calls.filter((c) => c.kind === "dhd").length, 1);
    assert.equal(__breaker.state(DHD.dhd.voice).state, "open");
    assert.ok(BREAKER_OPEN_MS >= 30_000);
    // another lesson's reply while open: straight to mini-tts, counted once for that lesson
    await drain(speakingEntry({ parts: parts3(), style: DHD, abort: new AbortController(), lessonId: "L-b" }));
    assert.equal(f.calls.filter((c) => c.kind === "dhd").length, 1, "no DragonHD attempt while the breaker is open");
    assert.equal(snapshot()["voice.expr.engine_fallback"], 2);
    // half-open: DragonHD is back; the next reply from a lesson that never switched is the probe and closes it
    down = false;
    __breaker.expire(DHD.dhd.voice);
    const c = speakingEntry({ parts: parts3(), style: DHD, abort: new AbortController(), lessonId: "L-c" });
    await drain(c);
    assert.equal(__breaker.state(DHD.dhd.voice).state, "closed");
    assert.ok(c.jobs.every((j) => !j.fellBack));
    // L-a fell back in the old epoch; the breaker closed, so L-a returns to DragonHD (one switch back, not a flap)
    // (these short parts are now in the memory cache as DragonHD audio, so a hit is the DragonHD voice too)
    const oaiBefore = f.calls.filter((x) => x.kind === "oai").length;
    const a2 = speakingEntry({ parts: parts3(), style: DHD, abort: new AbortController(), lessonId: "L-a" });
    await drain(a2);
    assert.equal(f.calls.filter((x) => x.kind === "oai").length, oaiBefore, "no mini-tts once the breaker closed");
    assert.ok(a2.jobs.every((j) => !j.fellBack));
  } finally { f.restore(); restore(); }
});

test("breaker: while half-open with the probe in flight, a lesson that already switched does not flap back", async () => {
  const restore = envSet(AZ);
  const f = stubAzure({ dhdFails: () => true });
  try {
    await drain(speakingEntry({ parts: parts3().slice(0, 1), style: DHD, abort: new AbortController(), lessonId: "L-x" }));
    __breaker.expire(DHD.dhd.voice);
    const n = f.calls.filter((c) => c.kind === "dhd").length;
    await drain(speakingEntry({ parts: parts3(), style: DHD, abort: new AbortController(), lessonId: "L-x" }));
    assert.equal(f.calls.filter((c) => c.kind === "dhd").length, n, "the switched lesson is never the probe");
  } finally { f.restore(); restore(); }
});

// ───────────── major: the echo is stripped only when the prelude played ─────────────

const ECHO_TEXT = "62! Achha, ab mujhe batao ki tumne yeh kaise socha, ek ek step karke?";
test("prelude miss: the reply is spoken WITH the child's echo (joined spoken text = the reply), one engine for the reply", async () => {
  const restore = envSet({ ...AZ, TAXILA_UPTAKE_PRELUDE: "1" });
  // the prelude document (the token alone) fails on both engines → no prelude audio
  const f = stubAzure({ dhdFails: (ssml) => /sixty-two/i.test(ssml) && !/batao/.test(ssml), oaiFails: (input) => /^\s*sixty-two\s*$/i.test(input) });
  try {
    const lessonId = "00000000-0000-0000-0000-0000000000e1";
    const delivery = expressiveSeam.planDelivery(moment({ uptakePrelude: { text: "62" } }), ECHO_TEXT);
    assert.deepEqual(delivery.prelude, { text: "62" });
    prewarm({ lessonId, seq: 3, text: ECHO_TEXT, tokenHash: sha("tok"), guardianId: "g-echo", style: DHD, delivery });
    const res = fakeRes();
    await voiceRoutes["POST /api/voice/tts-stream"]({ headers: { cookie: "tx_session=tok", accept: "application/x-taxila-pcm-frames;v=2" } }, res.res, { lessonId, seq: 3 });
    assert.equal(snapshot()["voice.expr.prelude_miss"], 1);
    assert.equal(parseFrames(res.body()).at(-1).payload.status, "ok");
    // what was synthesised for the reply after the miss: the full part 0 (with "sixty-two") and the rest
    const replyDocs = f.calls.filter((c) => /batao|socha|step/.test(c.ssml ?? c.input ?? ""));
    const last0 = [...replyDocs].reverse().find((c) => /batao/.test(c.ssml ?? c.input));
    assert.match(last0.ssml ?? last0.input, /sixty-two/i, "part 0 after a miss carries the echo");
  } finally { f.restore(); restore(); }
});

test("paths without a prelude keep the echo: renderParts(prelude:false), withEcho for Hear", () => {
  const plan = align(ECHO_TEXT, moment({ uptakePrelude: { text: "62" } }));
  assert.ok(plan.clauses[0].stripped, "align strips the echo for the prelude path");
  const gov = createGovernor();
  const r = renderParts({ lessonId: "L-np", text: ECHO_TEXT, style: DHD, delivery: plan, gov, log: false, prelude: false });
  assert.equal(r.prelude, null);
  assert.match(r.parts[0].written, /^62!/);
  assert.match(r.parts.map((p) => p.render.ssml).join(" "), /sixty-two/i);
  const withP = renderParts({ lessonId: "L-np2", text: ECHO_TEXT, style: DHD, delivery: plan, gov, log: false });
  assert.ok(withP.prelude && withP.full0, "the prelude path also carries the full part 0 for a miss");
  assert.doesNotMatch(withP.parts[0].written, /62/);
  assert.match(withP.full0.written, /^62!/);
  const back = withEcho(plan);
  assert.equal(back.clauses.map((c) => c.text).join(" ").replace(/\s+/g, " "), ECHO_TEXT.replace(/\s+/g, " ").replace(/^62! /, "62! "));
});

// ───────────── major: the prelude token is screened ─────────────

test("prelude token: profanity, a 10-digit number and the child's name give no prelude; numbers and number words do", () => {
  for (const bad of ["bewakoof", "chutiya", "9876543210", "12345", "Riya", "photosynthesis"]) {
    assert.equal(preludeTokenOk(bad, { names: ["Riya"] }), false, bad);
    const plan = align(`${bad}! Achha, ab mujhe batao ki tumne yeh kaise socha?`, moment({ uptakePrelude: { text: bad } }));
    assert.ok(!plan?.prelude, `${bad}: no prelude in the plan`);
  }
  for (const ok of ["62", "3/4", "3.5", "baarah", "twelve"]) assert.equal(preludeTokenOk(ok, { names: ["Riya"] }), true, ok);
  assert.equal(preludeTokenOk("Do", { names: ["Do"] }), false, "a name is never echoed even when it is a number word");
});

// ───────────── minors ─────────────

test("governor: an 8-sentence safety reply keeps 300 ms at every boundary (the silence cap never trims safety)", () => {
  const reply = Array.from({ length: 8 }, (_, i) => `Yeh wakya number ${["ek", "do", "teen", "char", "paanch", "chhe", "saat", "aath"][i]} hai.`).join(" ") + " Childline 1098 hai.";
  const d = expressiveSeam.planDelivery(moment({ safety: true }), reply);
  const g = createGovernor().apply("L-safe", d, {});
  const gaps = g.clauses.filter((c, i) => i > 0 && (c.part !== g.clauses[i - 1].part)).map((c) => c.pauseBeforeMs);
  assert.ok(gaps.length >= 8);
  assert.ok(gaps.every((p) => p === 300), gaps.join(","));
});

test("DragonHD: stage directions never reach the voice (plain and planned documents)", () => {
  const text = "Arre wah! [laughs] Sahi jawab. *smiles* Ab agla.";
  const strip = (ssml) => ssml.replace(/<[^>]*>/g, "");
  assert.doesNotMatch(strip(plainSsml(text, DHD.dhd, DHD.spoken)), /\[|\*|laughs|smiles/);
  const doc = compileDhd([{ text, emotion: "warm", intensity: 0.5, pace: "normal", pauseBeforeMs: 0, nonverbalBefore: "none" }], DHD.dhd, {});
  assert.doesNotMatch(strip(doc).replace(/^\[\w+\] /, ""), /laughs|smiles|\*/);
  assert.match(strip(plainSsml("3 * 4 = 12", DHD.dhd, DHD.spoken)), /three into four equals twelve/i);
});

test("identity: plain positive answers are the safety register; the greeting is not", () => {
  for (const t of ["Haan, main AI hoon.", "Main robot hoon? Haan, main AI hoon.", "I am an AI, not a person.", "मैं AI हूँ।"]) assert.equal(safetyRegister(null, t), true, t);
  for (const t of ["Namaste! Main Asha, tumhari AI teacher hoon.", "Haan, main AI teacher hoon, chalo shuru karein.", "I am an AI teacher.", "Achha, 10.98 rupaye."]) assert.equal(safetyRegister(null, t), false, t);
});

test("Hinglish fillers are Roman (no single-word hi-IN switch); Hindi keeps Devanagari", () => {
  const hl = fillersFor(momentPlan(moment({ move: "explain", lang: "hinglish" })));
  assert.ok(hl.length && hl.every((w) => /^[a-z]+$/.test(w)), hl.join(","));
  const hi = fillersFor(momentPlan(moment({ move: "explain", lang: "hi" })));
  assert.ok(hi.every((w) => /[ऀ-ॿ]/.test(w)));
  assert.equal(speakable("12 + 7 = 19 hota hai", { mode: "hinglish", schoolMedium: "hindi" }), "बारह plus सात equals उन्नीस hota hai");
  assert.equal(speakable("12 + 7 = 19", { mode: "hindi" }), "बारह धन सात बराबर उन्नीस");
});

test("voices: an unprobed DragonHD row is not usable (the character's own mini-tts voice); an owner's config choice is", () => {
  assert.equal(dhdVoiceFor("asha").usable, true);
  assert.equal(dhdVoiceFor("uma").usable, false);
  assert.equal(dhdVoiceFor("uma", { TAXILA_DHD_VOICE_UMA: "en-IN-Aarti:DragonHDLatestNeural" }).usable, true);
});

function fakeRes() {
  const chunks = [];
  const res = {
    statusCode: 0, headers: null, writableEnded: false, destroyed: false,
    writeHead(code, h) { this.statusCode = code; this.headers = h; return this; },
    flushHeaders() {}, write(b) { chunks.push(Buffer.from(b)); return true; }, end() { this.writableEnded = true; },
    on() { return this; }, once() { return this; }, off() { return this; },
  };
  return { res, body: () => Buffer.concat(chunks) };
}
