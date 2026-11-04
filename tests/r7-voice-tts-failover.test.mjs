// Round 7, stream B Voice, item same-voice TTS failover (B3, QA D30): DragonHD's breaker is per voice PER SPEECH REGION,
// and a second region (AZURE_SPEECH_REGION_2 / _KEY_2) speaks the SAME voice before any identity change to mini-tts.
import test from "node:test";
import assert from "node:assert/strict";
import { setCacheStore, __breaker, dhdRegions } from "../server/voice/speech.js";
import { speakingEntry, __test as warm } from "../server/voice/prewarm.js";
import { plainSsml } from "../server/voice/expressive/compile/dhd.js";
import { snapshot, resetTelemetry } from "../server/voice/expressive/telemetry.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tone = () => Buffer.alloc(4800 * 2, 1);
const envSet = (vars) => { const prev = {}; for (const [k, v] of Object.entries(vars)) { prev[k] = process.env[k]; if (v === undefined) delete process.env[k]; else process.env[k] = v; } return () => { for (const [k, v] of Object.entries(prev)) if (v === undefined) delete process.env[k]; else process.env[k] = v; }; };
const DHD = { engine: "dhd", dhd: { voice: "en-IN-Diya:DragonHDLatestNeural", baseRate: -35 }, voice: "marin", instructions: "accent: Indian", version: "s1:dhd", spoken: { mode: "hinglish" } };
const REPLY = ["Pehla wakya yahan hai.", "Doosra wakya yahan hai."];
const parts = () => REPLY.map((w) => ({ written: w, render: { engine: "dhd", ssml: plainSsml(w, DHD.dhd, DHD.spoken) } }));
const AZ = { AZURE_SPEECH_REGION: "centralindia", AZURE_SPEECH_KEY: "k1", AZURE_SPEECH_REGION_2: "southeastasia", AZURE_SPEECH_KEY_2: "k2", AZURE_SPEECH_ENDPOINT: undefined, AZURE_SPEECH_ENDPOINT_2: undefined,
  TAXILA_DHD_VISEMES: "0", AZURE_OPENAI_ENDPOINT: "https://example.invalid/openai/v1", AZURE_OPENAI_API_KEY: "k" };

/** Fake Azure: `down` is the set of Speech regions answering 503; mini-tts always works. */
function stubAzure(down) {
  const orig = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes("/cognitiveservices/v1")) {
      const region = new URL(u).hostname.split(".")[0];
      calls.push({ kind: "dhd", region, key: init.headers["Ocp-Apim-Subscription-Key"] });
      if (down.has(region)) return new Response("down", { status: 503 });
    } else if (u.includes("/audio/speech")) {
      calls.push({ kind: "oai" });
    } else return orig(url, init);
    return new Response(new ReadableStream({ async start(c) { await sleep(1); c.enqueue(new Uint8Array(tone())); c.close(); } }), { status: 200 });
  };
  return { calls, restore: () => { globalThis.fetch = orig; } };
}
const drain = async (entry) => { for (let i = 0; i < entry.parts.length; i++) { entry.startUpTo(i + 1); for await (const _ of entry.jobs[i].read()); } };

test.beforeEach(() => { setCacheStore({ get: async () => null, put: async () => {} }); resetTelemetry(); __breaker.reset(); });
test.afterEach(() => warm.clear());

test("B3 dhdRegions: primary, then region 2 only when it is a different resource", () => {
  assert.deepEqual(dhdRegions({}).map((r) => r.id), []);
  assert.deepEqual(dhdRegions({ AZURE_SPEECH_REGION: "a", AZURE_SPEECH_KEY: "k" }).map((r) => r.id), ["r1"]);
  const two = dhdRegions({ AZURE_SPEECH_REGION: "a", AZURE_SPEECH_KEY: "k", AZURE_SPEECH_REGION_2: "b", AZURE_SPEECH_KEY_2: "k2", AZURE_SPEECH_ENDPOINT: "https://custom" });
  assert.deepEqual(two.map((r) => [r.id, r.region]), [["r1", "a"], ["r2", "b"]]);
  assert.equal(two[1].env.AZURE_SPEECH_REGION, "b");
  assert.equal(two[1].env.AZURE_SPEECH_KEY, "k2");
  assert.equal(two[1].env.AZURE_SPEECH_ENDPOINT, "", "region 2 never inherits the primary's custom endpoint");
  assert.deepEqual(dhdRegions({ AZURE_SPEECH_REGION: "a", AZURE_SPEECH_KEY: "k", AZURE_SPEECH_REGION_2: "a", AZURE_SPEECH_KEY_2: "k" }).map((r) => r.id), ["r1"], "the same resource twice is one region");
});

test("B3: primary down → the SAME DragonHD voice from region 2; no identity change, no mini-tts", async () => {
  const restore = envSet(AZ);
  const f = stubAzure(new Set(["centralindia"]));
  try {
    const entry = speakingEntry({ parts: parts(), style: DHD, abort: new AbortController(), lessonId: "L-r2" });
    await drain(entry);
    assert.equal(f.calls.filter((c) => c.kind === "oai").length, 0, "never mini-tts");
    assert.ok(entry.jobs.every((j) => !j.fellBack), "the same voice throughout");
    assert.deepEqual(f.calls.map((c) => `${c.kind}:${c.region ?? ""}`), ["dhd:centralindia", "dhd:southeastasia", "dhd:southeastasia"],
      "part 0 tries primary then region 2; part 1 skips the open primary breaker and goes straight to region 2");
    assert.equal(f.calls.find((c) => c.region === "southeastasia").key, "k2", "region 2's own key");
    assert.equal(__breaker.state(DHD.dhd.voice).state, "open");
    assert.equal(__breaker.state(DHD.dhd.voice, "r2").state, "closed");
    const snap = snapshot();
    assert.equal(snap["voice.expr.engine_fallback"] ?? 0, 0);
    assert.ok((snap["voice.expr.region_failover"] ?? 0) >= 1);
  } finally { f.restore(); restore(); }
});

test("B3: both regions down → mini-tts (the identity change), counted once; region 2's breaker opens too", async () => {
  const restore = envSet(AZ);
  const f = stubAzure(new Set(["centralindia", "southeastasia"]));
  try {
    const entry = speakingEntry({ parts: parts(), style: DHD, abort: new AbortController(), lessonId: "L-both" });
    await drain(entry);
    assert.deepEqual(entry.jobs.map((j) => !!j.fellBack), [true, true]);
    assert.equal(snapshot()["voice.expr.engine_fallback"], 1);
    assert.equal(__breaker.state(DHD.dhd.voice, "r2").state, "open");
    // another reply while both are open: no DragonHD attempt at all
    const before = f.calls.filter((c) => c.kind === "dhd").length;
    await drain(speakingEntry({ parts: parts(), style: DHD, abort: new AbortController(), lessonId: "L-other" }));
    assert.equal(f.calls.filter((c) => c.kind === "dhd").length, before);
  } finally { f.restore(); restore(); }
});

test("B3: one region only (no _2 configured) keeps the old behaviour: a failure is the identity change", async () => {
  const restore = envSet({ ...AZ, AZURE_SPEECH_REGION_2: undefined, AZURE_SPEECH_KEY_2: undefined });
  const f = stubAzure(new Set(["centralindia"]));
  try {
    const entry = speakingEntry({ parts: parts(), style: DHD, abort: new AbortController(), lessonId: "L-one" });
    await drain(entry);
    assert.deepEqual(f.calls.map((c) => c.kind), ["dhd", "oai", "oai"]);
    assert.deepEqual(entry.jobs.map((j) => !!j.fellBack), [true, true]);
  } finally { f.restore(); restore(); }
});

test("B3: a lesson stuck on mini-tts returns to DragonHD when either region's breaker closes", async () => {
  const restore = envSet(AZ);
  const down = new Set(["centralindia", "southeastasia"]);
  const f = stubAzure(down);
  try {
    await drain(speakingEntry({ parts: parts(), style: DHD, abort: new AbortController(), lessonId: "L-s" }));
    down.delete("southeastasia");
    __breaker.expire(DHD.dhd.voice, "r2");
    // another lesson probes region 2 and closes it (a new epoch for the voice)
    const probe = speakingEntry({ parts: parts(), style: DHD, abort: new AbortController(), lessonId: "L-probe" });
    await drain(probe);
    assert.ok(probe.jobs.every((j) => !j.fellBack));
    const back = speakingEntry({ parts: parts(), style: DHD, abort: new AbortController(), lessonId: "L-s" });
    const oaiBefore = f.calls.filter((c) => c.kind === "oai").length;
    await drain(back);
    assert.equal(f.calls.filter((c) => c.kind === "oai").length, oaiBefore, "L-s is back on DragonHD");
    assert.ok(back.jobs.every((j) => !j.fellBack));
  } finally { f.restore(); restore(); }
});
