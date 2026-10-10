// Round 4 stream 5: her blink rate is the human one. The face Behaviour (src/avatar/behaviour.ts) schedules autonomic
// blinks per state at BLINK_PER_MIN (speaking 26 = conversation, rest 17; Bentivoglio et al. 1997), and event blinks
// (a phrase pause, a gaze shift) MOVE the next blink earlier, never add one. Before the fix the speaking face blinked
// 29.4/min (PuppetDriver, Diya's 24 lines at rate 0, n = 8 seeds); an Asha clip read 46/min over 15 s. Driven here by
// Diya's committed battery (evals/face-puppet/out/diya, rate -35) through the real PuppetDriver path.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

globalThis.performance ??= { now: () => Date.now() };
const { PuppetDriver } = await import("../src/face-puppet/driver.ts");
const { Behaviour } = await import("../src/avatar/behaviour.ts");
const DIR = new URL("../evals/face-puppet/out/diya/", import.meta.url).pathname;
const SR = 24000, FPS = 60;

function speech() {
  const parts = [];
  for (const f of fs.readdirSync(DIR).filter((f) => /^\d\d\.pcm$/.test(f)).sort()) {
    const b = fs.readFileSync(DIR + f), s = new Int16Array(b.buffer, b.byteOffset, b.length >> 1);
    const fl = new Float32Array(s.length);
    for (let i = 0; i < s.length; i++) fl[i] = s[i] / 32768;
    parts.push(fl, new Float32Array(Math.round(SR * 0.4)));
  }
  const pcm = new Float32Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) { pcm.set(p, o); o += p.length; }
  return pcm;
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); return (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2; };

test("speaking: the realized blink rate through the puppet driver is the conversational one (22-30/min, median of 6 seeds)", () => {
  const pcm = speech();
  const frames = Math.floor((pcm.length / SR) * FPS), rates = [];
  for (let seed = 1; seed <= 6; seed++) {
    const d = new PuppetDriver({ band: "b2", seed });
    for (let i = 0; i < frames; i++) {
      const end = Math.round((i / FPS) * SR), buf = new Float32Array(2048);
      buf.set(pcm.subarray(Math.max(0, end - 2048), end), 2048 - Math.min(2048, end));
      d.frame({ nowMs: (i / FPS) * 1000, tap: { buf, sampleRate: SR, t: i / FPS, level: 0, fresh: i === 0 }, status: "speaking", childLevel: 0 }, null);
    }
    rates.push(d["behaviour"].log.filter((e) => e.type === "blink").length / (frames / FPS / 60));
  }
  const m = median(rates);
  assert.ok(m >= 22 && m <= 30, `speaking median ${m.toFixed(1)}/min over ${(frames / FPS / 60).toFixed(1)} min (${rates.map((r) => r.toFixed(1)).join(" ")})`);
});

test("rest: idle blinks near the resting human rate (14-21/min), and an event blink moves the next one later", () => {
  const rates = [];
  for (let seed = 1; seed <= 6; seed++) {
    const b = new Behaviour({ band: "b2", seed });
    b.setState("idle");
    for (let i = 0; i < 180 * FPS; i++) b.update(i / FPS, {});
    rates.push(b.log.filter((e) => e.type === "blink").length / 3);
  }
  const m = median(rates);
  assert.ok(m >= 14 && m <= 21, `idle median ${m.toFixed(1)}/min (${rates.join(" ")})`);
  const src = fs.readFileSync(new URL("../src/avatar/behaviour.ts", import.meta.url), "utf8");
  assert.match(src, /this\.blink\.credit \+= Math\.max\(0, this\.blink\.next - this\.t\);/, "an advanced blink credits the time it moved");
  assert.match(src, /gamma\(this\.r, BLINK_K, this\.blink\.mean \/ BLINK_K\) \+ this\.blink\.credit;/, "the credit lands on the next interval");
});
