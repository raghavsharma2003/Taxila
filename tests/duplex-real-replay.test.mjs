// duplex-real (round 2): REAL-SPEECH regression for the live bridge. The fixture is two consecutive eot-bench Hindi turns
// (LiveKit, CC BY 4.0, adult speakers): the device frames computed from the real recording and the real gpt-live-transcribe
// events the production socket sent in the E1 run (evals/duplex-real/make-fixture.mjs). No audio is stored.
//
// The bug it pins (E1, 2026-10-07): a revoke that came BEFORE her reply sounded (the child went on right after the engine
// committed) re-opened the fan-in epoch at the turn start saved at HER LAST LINE, i.e. the PREVIOUS exchange. The merged
// commit then carried the previous, already-answered turn's words ("अच्छा रेट आपके फिक्स हैं…" from hi__4015 inside
// hi__4016's commit), and the runtime would supersede or re-send the child's turn with another turn's words in it.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DuplexLive } from "../src/duplex/live.ts";

const FIX = JSON.parse(fs.readFileSync(new URL("./fixtures/duplex-real-revoke-hi4016.json", import.meta.url), "utf8"));

/** Replay the fixture through DuplexLive on a fake clock (the evals/duplex-real/lib.mjs runSession loop, replay arm). */
function replay(fx) {
  let clock = 0, interval = null;
  const acts = [];
  const port = {
    duck() {}, pause: () => { acts.push([clock, "pause"]); return true; }, resume() {}, stop: () => acts.push([clock, "stop"]),
    commit: (turn) => acts.push([clock, "commit", turn.text, turn.revokeOf?.text ?? null]), sttCommit() {}, dropReply: () => acts.push([clock, "drop"]),
    fallback: (why) => acts.push([clock, "fallback", why]), state() {},
  };
  const live = new DuplexLive({ lessonId: "real-fixture", port, now: () => clock, setInterval: (fn) => { interval = fn; return 1; }, clearInterval: () => { interval = null; }, band: "B4" });
  live.start();
  let ei = 0, hi = 0, herLive = null;
  for (let i = 0; i < fx.db.length; i++) {
    const tf = i * 20;
    clock = tf;
    while (ei < fx.stt.length && fx.stt[ei].t <= tf) live.stt(fx.stt[ei++].raw);
    if (herLive && tf >= herLive.end) { live.herEnd(); herLive = null; }
    if (!herLive && hi < fx.her.length && tf >= fx.her[hi].start) { herLive = fx.her[hi++]; live.setUi({}); live.herStart(herLive.text); }
    live.frame(tf, Math.pow(10, fx.db[i] / 20), fx.f0[i], herLive ? -20 : null);
    if (i % 5 === 4 && interval) interval();
  }
  live.stop();
  return acts;
}

describe("duplex-real: real-speech replay (eot-bench Hindi, real STT events)", () => {
  const acts = replay(FIX);
  const [prev, cur] = FIX.turns;
  const commitsIn = (t) => acts.filter((a) => a[1] === "commit" && a[0] >= t.start && a[0] < t.windowEnd);

  it("the previous exchange's turn is committed on its own", () => {
    assert.ok(commitsIn(prev).length >= 1, JSON.stringify(acts.filter((a) => a[1] === "commit")));
  });

  it("a revoke before her reply sounds never pulls the previous, answered turn's words into this turn", () => {
    const prevWords = commitsIn(prev).map((c) => c[2]).join(" ");
    const marker = prevWords.split(/\s+/).filter((w) => w.length > 3).slice(0, 3);
    assert.ok(marker.length, "the previous turn has words");
    const cs = commitsIn(cur);
    assert.ok(cs.length >= 1, "this turn is committed");
    for (const c of cs) for (const w of marker) assert.ok(!c[2].includes(w), `turn ${cur.id} commit carries the previous turn's word "${w}": ${c[2].slice(0, 160)}`);
  });

  it("a merged commit after a revoke still starts with the revoked commit's words (runtime freshWords contract)", () => {
    for (const c of commitsIn(cur).filter((x) => x[3])) assert.ok(c[2].startsWith(c[3].split(/\s+/)[0]), `merged "${c[2].slice(0, 80)}" vs revoked "${c[3].slice(0, 80)}"`);
  });
});
