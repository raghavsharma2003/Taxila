// duplex-real (round 2): engine fixes found on REAL speech through the REAL STT (evals/duplex-real; RESEARCH.md, REPORT.md).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TurnTranscript } from "../server/duplex/fanin.js";
import { understand } from "../server/duplex/understand.js";
import { CascadeDuplex } from "../src/duplex/cascadeDuplex.ts";

describe("duplex-real: fan-in coverage for items with no reported audio start (MAI streaming, D4 commit items)", () => {
  it("a final whose item has no audio start answers the oldest commit sent before it arrived (was: dropped as stale)", () => {
    const f = new TurnTranscript({ source: "mai_stream" });
    f.begin(1000);
    f.commitSent(2011); // the probe at 150 ms of silence
    f.push({ type: "final", itemId: "i1", text: "हाँ जी, बिल्कुल लगा दीजिए।", t: 2431 });
    const v = f.view(2500, () => 0);
    assert.equal(v.coverageEndMs, 2011, "coverage is the probe time, not arrival - lag");
  });
  it("a final with a reported audio start still takes the commit at or after that start (M-D7 b04 FIFO unchanged)", () => {
    const f = new TurnTranscript({ source: "live_transcribe" });
    f.begin(0);
    f.commitSent(2400);
    f.commitSent(3300);
    f.push({ type: "final", itemId: "a", text: "हम्म सात आठ", t: 2900, audioStartMs: 1000 });
    assert.equal(f.view(3000, () => 0).coverageEndMs, 2400);
  });
  it("commitEmpty forgets the newest pending commit, so the next final is not credited with audio it never covered", () => {
    const f = new TurnTranscript({ source: "mai_stream" });
    f.begin(0);
    f.commitSent(1000);
    f.commitSent(1500);
    f.commitEmpty();
    f.push({ type: "final", itemId: "x", text: "सात", t: 1700 });
    assert.equal(f.view(1800, () => 0).coverageEndMs, 1000);
    f.push({ type: "final", itemId: "y", text: "आठ", t: 1900 });
    assert.notEqual(f.view(2000, () => 0).coverageEndMs, 1500, "the refused commit is gone");
  });
});

describe("duplex-real: copula projection (a head noun + है with no complement yet)", () => {
  for (const t of ["मेरा फोन नंबर है", "और मेरा फोन नंबर है।", "answer है", "मेरा जवाब है", "बात ये है", "mera answer hai"]) {
    it(`"${t}" projects its complement`, () => assert.equal(understand(t).lex.cue, "projection"));
  }
  for (const t of ["मेरा नाम रिया है।", "मेरा answer बारह है", "उसका पता है?", "नमस्ते।", "हाँ जी, बिल्कुल लगा दीजिए।"]) {
    it(`"${t}" does not`, () => assert.notEqual(understand(t).lex.cue, "projection"));
  }
});

describe("duplex-real: an empty micro-commit is not the child", () => {
  const mk = (mode) => {
    let liveRef = null;
    const silent = [];
    const surface = { lessonId: "L", audio: () => ({ ctx: {}, stream: {}, herOutput: null }), herSounding: () => false, duck() {}, pause: () => true, resume() {}, stop() {},
      emitChild: (e) => silent.push(e), sttCommit() {}, setServerVad() {} };
    const d = new CascadeDuplex(surface, { mode, now: () => 0, setTimeout: () => 0, setInterval: () => 1, clearInterval: () => {}, startTap: async ({ live }) => { liveRef = live; return () => {}; }, shadowSink: null });
    return { d, live: () => liveRef };
  };
  it("while the engine decides, input_audio_buffer_commit_empty is consumed (the link must not emit child_silent / resume her)", async () => {
    const { d } = mk("on");
    await d.start();
    assert.equal(d.onServerError("input_audio_buffer_commit_empty", "buffer too small"), true);
  });
  it("in shadow (the shipped path owns the call) it is left to the link, as before", async () => {
    const { d } = mk("shadow");
    await d.start();
    assert.equal(d.onServerError("input_audio_buffer_commit_empty", "buffer too small"), false);
  });
});
