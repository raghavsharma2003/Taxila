// duplex-real (round 2): the shadow telemetry (src/duplex/shadowTelemetry.ts), its wiring in CascadeDuplex, and the
// POST /api/duplex/shadow log line (server/duplex/shadowLog.js). Content-blind by construction: no words, no hashes.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ShadowTelemetry, sanitizeShadowSummary, SHADOW_SCHEMA } from "../src/duplex/shadowTelemetry.ts";
import { shadowLine } from "../server/duplex/shadowLog.js";
import { CascadeDuplex } from "../src/duplex/cascadeDuplex.ts";

const LOUD = 0.1, QUIET = 0.0005;
/** Feed frames [from, to) at 20 ms with a level. */
function feed(tel, from, to, rms, her = false) { for (let t = from; t < to; t += 20) tel.frame(t, rms, her); }
const row = (t, action, reasons = [], detail = null) => ({ t, cause: "timer", phase: "child_turn", action, proposed: action, detail, reasons, pComplete: 0.9, pHoldWanted: 0.1, engine: "rules/A", turnSeq: 1 });
const FINAL = "conversation.item.input_audio_transcription.completed";

describe("duplex-real shadow telemetry", () => {
  it("records the engine gap and the shipped gap of a turn, no cut", () => {
    const tel = new ShadowTelemetry({ mode: "shadow", band: "B3" });
    feed(tel, 0, 1000, QUIET);
    feed(tel, 1000, 2000, LOUD); // child answers
    feed(tel, 2000, 2400, QUIET);
    tel.row(row(2300, "SPEAK", ["turn_end"], "turn_end"));
    feed(tel, 2400, 3200, QUIET);
    tel.stt(3100, FINAL, true); // the shipped final (900 ms VAD)
    feed(tel, 3200, 6000, QUIET);
    const s = tel.summary();
    assert.equal(s.schema, SHADOW_SCHEMA);
    assert.equal(s.turns.length, 1);
    const [t] = s.turns;
    assert.ok(t.eg >= 280 && t.eg <= 320, `engine gap ${t.eg}`);
    assert.ok(t.sg >= 1080 && t.sg <= 1120, `shipped gap ${t.sg}`);
    assert.equal(t.ec, 0);
    assert.equal(t.sc, 0);
    assert.equal(t.r, "turn_end");
  });

  it("marks an engine cut-off when the child goes on after its SPEAK, and keeps the pause length", () => {
    const tel = new ShadowTelemetry({ mode: "shadow" });
    feed(tel, 0, 500, QUIET);
    feed(tel, 500, 1500, LOUD);
    feed(tel, 1500, 2700, QUIET); // a 1.2 s thinking pause
    tel.row(row(2300, "SPEAK", ["backstop_silence"], "backstop_silence"));
    feed(tel, 2700, 3600, LOUD); // she goes on
    feed(tel, 3600, 4000, QUIET);
    tel.row(row(3950, "SPEAK", ["turn_end"], "turn_end"));
    feed(tel, 4000, 4600, QUIET);
    tel.stt(4500, FINAL, true);
    const [t] = tel.summary().turns;
    assert.equal(t.ec, 1);
    assert.ok(t.ep >= 1150 && t.ep <= 1250, `pause ${t.ep}`);
    // the gap is the engine's LATER decision, the one after the real end
    assert.ok(t.eg >= 330 && t.eg <= 370, `gap ${t.eg}`);
    assert.equal(t.r, "turn_end");
  });

  it("marks a shipped cut-off when the child goes on within 3 s of the shipped final", () => {
    const tel = new ShadowTelemetry({ mode: "shadow" });
    feed(tel, 0, 500, QUIET);
    feed(tel, 500, 1500, LOUD);
    feed(tel, 1500, 2500, QUIET);
    tel.stt(2450, FINAL, true);
    feed(tel, 2500, 3500, LOUD);
    feed(tel, 3500, 4000, QUIET);
    assert.equal(tel.summary().turns[0].sc, 1);
  });

  it("an empty final is not a shipped turn; finals while she talks are not turns", () => {
    const tel = new ShadowTelemetry({ mode: "shadow" });
    feed(tel, 0, 1000, LOUD);
    feed(tel, 1000, 2000, QUIET);
    tel.stt(1900, FINAL, false);
    tel.herStart(2000);
    tel.stt(2100, FINAL, true);
    tel.herEnd(3000, false);
    assert.equal(tel.summary().turns.length, 0);
  });

  it("an overlap over her records engine yield vs the shipped stop", () => {
    const tel = new ShadowTelemetry({ mode: "shadow" });
    feed(tel, 0, 500, QUIET);
    tel.herStart(500);
    feed(tel, 500, 1000, QUIET, true);
    feed(tel, 1000, 1600, LOUD, true); // child barges in at 1000
    tel.row(row(1180, "YIELD", ["sustained_voice"]));
    tel.herEnd(1400, true); // the shipped path stopped her at 1400
    const s = tel.summary();
    assert.equal(s.overlaps.length, 1);
    assert.ok(s.overlaps[0].ey >= 170 && s.overlaps[0].ey <= 190, `ey ${s.overlaps[0].ey}`);
    assert.ok(s.overlaps[0].ss >= 390 && s.overlaps[0].ss <= 410, `ss ${s.overlaps[0].ss}`);
  });

  it("counts safety rows and fallbacks; a short burst over her is not an overlap", () => {
    const tel = new ShadowTelemetry({ mode: "shadow" });
    tel.row(row(10, "SPEAK", ["safeguard"], "safeguard"));
    tel.row(row(20, "fallback:rules", ["fallback_rules"]));
    tel.herStart(100);
    feed(tel, 100, 200, LOUD, true); // 100 ms only
    feed(tel, 200, 800, QUIET, true);
    tel.herEnd(800, false);
    const s = tel.summary();
    assert.equal(s.safetyRows, 1);
    assert.deepEqual(s.fallbacks, ["rules"]);
    assert.equal(s.overlaps.length, 0);
  });

  it("sanitize drops anything outside the schema: no words survive, codes are closed, numbers clamped", () => {
    assert.equal(sanitizeShadowSummary({ schema: "x" }), null);
    const s = sanitizeShadowSummary({ schema: SHADOW_SCHEMA, mode: "shadow", band: "B9", lane: "Live Transcribe!", durMs: -5, frames: 10, text: "मेरा नाम",
      turns: [{ eg: 1e9, sg: "300", ec: true, ep: 12.4, sc: 0, r: "मुझे मार" }], overlaps: [{ ey: null, ss: 50, bm: 200, words: "x" }], safetyRows: 2, fallbacks: ["stt_rate_limited", "<script>"] });
    assert.equal(s.band, null);
    assert.equal(s.lane, "other");
    assert.equal(s.durMs, 0);
    assert.deepEqual(s.turns[0], { eg: 600000, sg: null, ec: 1, ep: 12, sc: 0, r: "other" });
    assert.deepEqual(s.overlaps[0], { ey: null, ss: 50, bm: 200 });
    assert.deepEqual(s.fallbacks, ["stt_rate_limited", "script"]);
    assert.ok(!JSON.stringify(s).match(/[ऀ-ॿ]/), "no Devanagari anywhere");
    assert.ok(!("text" in s));
  });

  it("the server line hashes the lesson id and carries only the sanitized summary", () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";
    const line = shadowLine({ lessonId: id, summary: { schema: SHADOW_SCHEMA, mode: "shadow", turns: [{ eg: 300, sg: 1100, ec: 0, sc: 0, r: "turn_end" }], overlaps: [], frames: 5 }, childText: "secret" }, { now: 0, rev: "r1" });
    assert.equal(line.kind, "duplex_shadow");
    assert.ok(line.lesson && line.lesson.length === 12 && !JSON.stringify(line).includes(id));
    assert.ok(!JSON.stringify(line).includes("secret"));
    assert.equal(shadowLine({ lessonId: id, summary: { schema: "nope" } }), null);
    assert.equal(shadowLine(null), null);
  });

  it("CascadeDuplex flushes one summary on close through the sink (shadow), with frames from the tap", async () => {
    const got = [];
    let liveRef = null;
    const surface = {
      lessonId: "L1", audio: () => ({ ctx: {}, stream: {}, herOutput: null }), herSounding: () => false,
      duck() {}, pause: () => true, resume() {}, stop() {}, emitChild() {}, sttCommit() {}, setServerVad() {},
    };
    let clock = 0;
    const d = new CascadeDuplex(surface, {
      mode: "shadow", now: () => clock, setTimeout: () => 0, setInterval: () => 1, clearInterval: () => {},
      startTap: async ({ live }) => { liveRef = live; return () => {}; },
      shadowSink: (s, lessonId) => got.push({ s, lessonId }),
    });
    assert.equal(await d.start(), true);
    for (clock = 0; clock < 3000; clock += 20) liveRef.frame(clock, clock >= 1000 && clock < 2000 ? LOUD : QUIET, null, null);
    d.onSttEvent({ type: FINAL, item_id: "i1", transcript: "baarah" });
    d.close();
    d.close();
    assert.equal(got.length, 1, "exactly one summary per lesson");
    assert.equal(got[0].lessonId, "L1");
    assert.equal(got[0].s.mode, "shadow");
    assert.ok(got[0].s.frames >= 150);
    assert.equal(got[0].s.turns.length, 1);
    assert.ok(!JSON.stringify(got[0].s).includes("baarah"), "no words in the summary");
  });
});
