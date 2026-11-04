// Round 7, stream G (platform-cost-ledger): the price book, the spend events and the lesson rollup. No DB, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CHAT, STT, TTS, usdChat, usdImage, usdS2s, usdStt, usdTts } from "../server/cost/prices.js";
import { lessonCost, rollupLesson, SPEND_KINDS } from "../server/cost/rollup.js";
import { PRICES, usdOf } from "../server/azure.js";

test("prices: azure.js PRICES IS the book's chat table; usdOf unchanged for every row; classify's deployment is priced", () => {
  assert.equal(PRICES, CHAT);
  for (const d of Object.keys(CHAT)) assert.ok(Math.abs(usdOf(d, { in: 1e6, cached: 2e5, out: 1e5 }) - usdChat(d, { in: 1e6, cached: 2e5, out: 1e5 })) < 1e-9, d);
  assert.equal(usdChat("grok-4-1-fast-non-reasoning", { in: 900, out: 45 }), 0.0002025);   // MODEL-STACK: ≈ $0.00020 per classify
  assert.equal(usdChat("no-such-deployment", { in: 1e6 }), CHAT["taxila-brain"].in, "unpriced = the dearest row, never 0");
  assert.equal(usdChat("taxila-fast", null), 0);
});

test("prices: speech, STT, speech-to-speech and images per their meters", () => {
  assert.equal(usdTts("gpt-4o-mini-tts", 17300), 0.3806);                 // MODEL-STACK §2: 17.3k chars/h × $22/1M ≈ $0.381
  assert.equal(usdTts("en-IN-Diya:DragonHDLatestNeural", 1e6), TTS.dragonhd.perMChars);
  assert.equal(usdStt("gpt-live-transcribe", 3600), STT["gpt-live-transcribe"].perHour);
  assert.equal(usdStt("taxila-mai-tx2-stream", 3600), 0.36);
  assert.equal(usdS2s(60), 0.082);
  assert.equal(usdImage("taxila-image25-flare", 3), 0.0198);
  assert.equal(usdTts("x", -5), 0);
  assert.equal(usdStt("x", NaN), 0);
});

const ROWS = [
  { kind: "model.call", data: { deployment: "taxila-fast", lane: "hot", tokens: { in: 2000, out: 150 }, usd: 0.00058 } },
  { kind: "model.call", data: { deployment: "grok-4-1-fast-non-reasoning", lane: "hot", tokens: { in: 900, out: 45 } } },   // pre-ledger: priced from tokens
  { kind: "model.call", data: { deployment: "taxila-brain", lane: "bg", status: "timeout" } },                                // no tokens, no usd
  { kind: "speech.tts", data: { engine: "gpt-4o-mini-tts", chars: 5000, usd: 0.11 } },
  { kind: "stt.session", data: { model: "gpt-live-transcribe", sec: 1200, usd: 0.34 } },
  { kind: "d5.session", data: { sec: 30, usd: 0.041 } },
  { kind: "image.call", data: { deployment: "taxila-image25-flare", n: 1, usd: 0.0066 } },
  { kind: "turn.end", data: { usd: 99 } },                                                                                    // not a spend event
];

test("lessonCost: sums by meter and lane, prices pre-ledger calls, counts the unpriced, ignores other kinds", () => {
  const c = lessonCost(ROWS, { minutes: 20, now: () => "T" });
  assert.equal(c.meters.chat.calls, 2);
  assert.equal(c.meters.chat.usd, 0.0007825);
  assert.deepEqual([c.meters.tts.chars, c.meters.stt.sec, c.meters.s2s.sec, c.meters.image.n], [5000, 1200, 30, 1]);
  assert.equal(c.unpriced, 1);
  assert.equal(c.usd, 0.4983825);
  assert.equal(c.usdPerMin, 0.02491913);
  assert.deepEqual(Object.keys(c.lanes).sort(), ["hot", "image", "s2s", "stt", "tts"]);
  assert.equal(c.at, "T");
  assert.equal(lessonCost([], { minutes: 0 }).usdPerMin, null);
  assert.ok(!SPEND_KINDS.includes("turn.end"));
});

test("rollupLesson: reads the lesson's spend events by sid and stores lesson.cost; --write false stores nothing", async () => {
  const calls = [];
  const q = async (text, params) => {
    calls.push({ text, params });
    if (/from lesson where id/.test(text)) return [{ started_at: "2026-11-04T10:00:00Z", ended_at: "2026-11-04T10:15:00Z" }];
    if (/from trace_event/.test(text)) return ROWS.slice(0, 2);
    return [];
  };
  const c = await rollupLesson(q, "L1");
  assert.equal(c.minutes, 15);
  assert.deepEqual(calls[1].params, ["L1", SPEND_KINDS]);
  assert.match(calls[2].text, /^update lesson set cost/);
  assert.equal(JSON.parse(calls[2].params[1]).usd, c.usd);
  calls.length = 0;
  await rollupLesson(q, "L1", { write: false });
  assert.ok(!calls.some((x) => /^update/.test(x.text)));
  await assert.rejects(rollupLesson(async () => [], "nope"), /no lesson nope/);
});

test("recorder: model.call carries usd; a TTS call is a speech.tts event with chars and usd, never a model.call", async () => {
  const { recordModelCall } = await import("../server/trace/model.js");
  const { _setTraceDeps, _resetTrace, flushTrace } = await import("../server/trace/writer.js");
  const rows = [];
  _resetTrace();
  _setTraceDeps({ insert: async (r) => { rows.push(...r); return r.length; }, off: false });
  try {
    recordModelCall({ kind: "chat", deployment: "taxila-fast", status: 200, ms: 10, tokens: { in: 1000, out: 100 } });
    recordModelCall({ kind: "tts", deployment: "gpt-4o-mini-tts", status: 200, ms: 50, body: { input: "Namaste bachchon" } });
    await flushTrace();
    const mc = rows.find((r) => r.kind === "model.call"), tts = rows.find((r) => r.kind === "speech.tts");
    assert.equal(mc.data.usd, usdChat("taxila-fast", { in: 1000, out: 100 }));
    assert.deepEqual([tts.data.chars, tts.data.usd], [16, usdTts("gpt-4o-mini-tts", 16)]);
    assert.equal(rows.filter((r) => r.kind === "model.call").length, 1, "TTS is not a model.call");
  } finally { _setTraceDeps({ insert: null, off: null }); _resetTrace(); }
});

test("meter: stt.session, d5.session and image.call carry their usd; bad inputs record 0, never throw", async () => {
  const { sttSession, d5Session, imageCall, ttsSpent } = await import("../server/cost/meter.js");
  const { _setTraceDeps, _resetTrace, flushTrace } = await import("../server/trace/writer.js");
  const rows = [];
  _resetTrace();
  _setTraceDeps({ insert: async (r) => { rows.push(...r); return r.length; }, off: false });
  try {
    sttSession({ model: "gpt-live-transcribe", sec: 1800 });
    d5Session({ sec: 120, reason: "closed" });
    imageCall({ deployment: "taxila-image25-flare" });
    ttsSpent({ engine: "dragonhd", chars: "oops" });
    sttSession();
    await flushTrace();
    const by = (k) => rows.filter((r) => r.kind === k).map((r) => r.data);
    assert.equal(by("stt.session")[0].usd, 0.51);
    assert.equal(by("stt.session")[1].usd, 0);
    assert.equal(by("d5.session")[0].usd, 0.164);
    assert.equal(by("image.call")[0].usd, 0.0066);
    assert.equal(by("speech.tts")[0].usd, 0);
  } finally { _setTraceDeps({ insert: null, off: null }); _resetTrace(); }
});
