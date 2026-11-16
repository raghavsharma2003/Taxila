// Round 7 face-reacts (TAXILA_R7_FACE_REACT, off by default): between the child's last word and her first audio the face
// THINKS. heard (the child stopped talking, the transcript not in yet) maps to thinking instead of holding the listening
// face, and entering thinking takes one breath, never under reduced motion or in a safety turn, cut at her first audio.
// Verdict-blind by construction: nothing here reads an answer.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const TAP0 = { buf: null, sampleRate: 48000, t: 0, level: 0, fresh: false };
const breathRig = () => { const b = []; return { b, rig: { clock: null, frame: (_bs, _h, _g, _l, breath) => b.push(breath) } }; };

test("heard is THINKING with the flag, the listening face without it; every other floor is unchanged", async () => {
  const { faceStatusOf } = await import("../src/ui/teacher/floor.ts");
  assert.equal(faceStatusOf("heard", false), "listening");
  assert.equal(faceStatusOf("heard", true), "thinking");
  for (const react of [false, true]) {
    assert.equal(faceStatusOf("listening", react), "listening");
    assert.equal(faceStatusOf("thinking", react), "thinking");
    assert.equal(faceStatusOf("speaking", react), "speaking");
    assert.equal(faceStatusOf("your_turn", react), "your_turn");
  }
});

/** Drive listening → thinking for `ms`, then optionally speaking; returns the breath values while thinking. */
async function breaths(opts, { thinkMs = 1600, then = null } = {}) {
  const { PuppetDriver } = await import("../src/face-puppet/driver.ts");
  const d = new PuppetDriver({ band: "b3", seed: 3, ...opts });
  if (opts.safety) d.safetyTurn(0);
  const { b, rig } = breathRig();
  let t = 0;
  for (; t < 1000; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "listening", childLevel: 0.4 }, rig);
  const start = b.length;
  for (const end = t + thinkMs; t < end; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "thinking", childLevel: 0 }, rig);
  const think = b.slice(start);
  if (then) for (const end = t + 300; t < end; t += 16) d.frame({ nowMs: t, tap: { ...TAP0, level: 0.5 }, status: then, childLevel: 0 }, rig);
  return { think, after: b.slice(start + think.length), d };
}
const idle = (tMs) => Math.sin((tMs / 1000) * 2 * Math.PI * 0.25);

test("entering THINKING takes one breath with the flag: above the idle breath, then back to it", async () => {
  const { THINK_INHALE } = await import("../src/face-puppet/driver.ts");
  const on = await breaths({ react: true });
  const off = await breaths({ react: false });
  const lift = on.think.map((v, i) => v - off.think[i]);
  const peak = Math.max(...lift);
  assert.ok(peak > 0.8 * THINK_INHALE.amp && peak <= THINK_INHALE.amp + 1e-9, `peak lift ${peak}`);
  const endFrame = Math.ceil((THINK_INHALE.s * 1000) / 16) + 1;
  assert.ok(lift.slice(endFrame).every((x) => Math.abs(x) < 1e-9), "back to the idle breath after the inhale");
  assert.ok(off.think.every((v, i) => Math.abs(v - idle(1008 + i * 16)) < 1e-9), "without the flag: only the idle breath");
});

test("no thinking breath under reduced motion or in a safety turn", async () => {
  for (const o of [{ react: true, reducedMotion: true }, { react: true, safety: true }]) {
    const r = await breaths(o);
    const off = await breaths({ ...o, react: false });
    assert.deepEqual(r.think, off.think, JSON.stringify(o));
  }
});

test("her first audio ends the breath at once (never during her speech)", async () => {
  const r = await breaths({ react: true }, { thinkMs: 300, then: "speaking" });
  const base = await breaths({ react: false }, { thinkMs: 300, then: "speaking" });
  assert.notDeepEqual(r.think, base.think, "breathing while thinking");
  assert.deepEqual(r.after, base.after, "the idle breath only, from her first audio frame");
});

test("the flag: server env TAXILA_R7_FACE_REACT=1 only; the client reads the config's react and a ?react device override", async () => {
  const { faceConfig } = await import("../server/face-puppet/config.js");
  assert.equal(faceConfig({}).react, false);
  assert.equal(faceConfig({ TAXILA_R7_FACE_REACT: "1" }).react, true);
  assert.equal(faceConfig({ TAXILA_R7_FACE_REACT: "true" }).react, false, "exactly 1");
  const flag = readFileSync(new URL("../src/face-puppet/flag.ts", import.meta.url), "utf8");
  assert.match(flag, /react: j\?\.react === true/);
  assert.match(flag, /export function faceReactEnabled\(\): boolean/);
  const face = readFileSync(new URL("../src/face-puppet/PuppetFace.tsx", import.meta.url), "utf8");
  assert.match(face, /react: faceReactEnabled\(\)/);
});
