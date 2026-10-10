// Round 4, stream duplex: the overlap rows added this round (src/duplex/config.ts OVERLAP.hushAfterRelease,
// OVERLAP.hushGiveUpForMs), on the engine host with synthetic device frames. The real-speech numbers (AMI, real STT
// events) are in docs/design/round4/build/duplex/RESULTS.md.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { EngineHost, NEUTRAL_CONTEXT } from "../src/duplex/host.ts";
import { OVERLAP } from "../src/duplex/config.ts";

const FREE = { ...NEUTRAL_CONTEXT, exchange: "free" };
const FLAGS = { shadow: false, semantic: false, trained: false, cutIn: false, audioBackchannel: false, lexicalBackchannel: false };
const dbOf = (db) => Math.pow(10, db / 20);

function rig() {
  const cmds = [];
  const host = new EngineHost({ session: { lessonId: "L", band: "B3", startedAt: 0, flags: FLAGS }, source: "live_transcribe", supportsCommit: true, emit: (c) => cmds.push(c) });
  let t = 0, nextTimer = 100;
  const step = (db, f0) => { host.frame(t, dbOf(db), f0); if (t >= nextTimer) { host.timer(t); nextTimer += 100; } t += 20; };
  const r = { host, cmds, get t() { return t; },
    quiet(ms) { for (const end = t + ms; t < end;) step(-58, null); },
    /** a voiced burst: `f0s` per frame (the last value repeats) */
    voice(ms, db = -24, f0s = [260]) { let k = 0; for (const end = t + ms; t < end; k++) step(db, f0s[Math.min(k, f0s.length - 1)]); },
    her(text) { host.herEvent({ kind: "start", t, utteranceId: `u${t}`, text, act: "explaining", handsOver: false, msPerChar: 70, outputDb: -55 }); },
    hushes: () => cmds.filter((c) => c.to === "voice" && c.op === "duck" && c.level <= OVERLAP.hushLevel) };
  r.quiet(600);
  host.context(FREE, t, { handsOver: true });
  return r;
}
const LONG = "आज हम भिन्न के बारे में बात करेंगे, और देखेंगे कि आधा और चौथाई में क्या फ़र्क है, फिर एक खेल खेलेंगे और फिर एक कहानी सुनेंगे जिसमें बहुत सारे हिस्से हैं।".repeat(4);

describe("r4 duplex: the hush meets a burst whose reflex duck was released at its onset", () => {
  it("a child burst that inherited 'not the child' at onset is still hushed once its own pitch reads as the child", () => {
    const r = rig();
    r.host.setChildF0(260);
    r.her(LONG);
    r.quiet(1500);
    r.voice(300, -24, [120]); // a low adult voice in the room (>= 5 st below the child): attributed "not the child"
    r.quiet(300);
    const before = r.hushes().length;
    const onset = r.t;
    r.voice(700, -24, [null, null, 260]); // the child: no pitch on its first frames (inherits), then its own
    const after = r.hushes().filter((c) => c.t >= onset);
    assert.ok(r.hushes().length > before && after.length, "the child's burst is hushed");
    assert.ok(after[0].t - onset <= 200, `hushed ${after[0].t - onset} ms after the onset`);
  });

  it("off (round 3): the same burst is never hushed", () => {
    const was = OVERLAP.hushAfterRelease;
    OVERLAP.hushAfterRelease = false;
    try {
      const r = rig();
      r.host.setChildF0(260);
      r.her(LONG);
      r.quiet(1500);
      r.voice(300, -24, [120]);
      r.quiet(300);
      const onset = r.t;
      r.voice(700, -24, [null, null, 260]);
      assert.equal(r.hushes().filter((c) => c.t >= onset).length, 0);
    } finally { OVERLAP.hushAfterRelease = was; }
  });
});

describe("r4 duplex: a hush give-up lasts OVERLAP.hushGiveUpForMs", () => {
  const giveUpThenWait = (waitMs) => {
    const r = rig();
    r.her(LONG);
    r.quiet(1000);
    // echo-like wordless bursts (within echoNearDb of her output level, not within 3 dB): each is hushed, none confirmed
    for (let k = 0; k < OVERLAP.hushGiveUp; k++) { r.voice(300, -46); r.quiet(900); }
    const given = r.hushes().length;
    r.voice(300); r.quiet(900); // a loud burst right after: the hush has given up
    const rightAfter = r.hushes().length - given;
    r.quiet(waitMs);
    const onset = r.t;
    r.voice(400);
    return { given, rightAfter, later: r.hushes().filter((c) => c.t >= onset).length };
  };
  it("gives up after hushGiveUp echo-like bursts, and re-arms after hushGiveUpForMs", () => {
    assert.ok(OVERLAP.hushGiveUpForMs > 0);
    const x = giveUpThenWait(OVERLAP.hushGiveUpForMs + 1000);
    assert.equal(x.given, OVERLAP.hushGiveUp, "every echo-like burst was hushed until the give-up");
    assert.equal(x.rightAfter, 0, "given up");
    assert.equal(x.later, 1, "re-armed");
  });
  it("still given up before hushGiveUpForMs has passed", () => {
    assert.equal(giveUpThenWait(Math.max(0, OVERLAP.hushGiveUpForMs - 5000)).later, 0);
  });
});
