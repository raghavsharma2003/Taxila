// Round 7 face-puppet-raster-cost-main-thread: the weak-device gate, the light mouth and the live-stage arming rule.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const L = await import("../src/face-puppet/lite.ts");
const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const facts = (o) => ({ webgl2: true, majorCaveat: false, renderer: "Adreno (TM) 650", saveData: false, ...o });

test("static gate: software raster, no WebGL2 or a known-bad GPU → lite; a good GPU or the key rig → live", () => {
  L.setLiteFactsForTests(facts({ majorCaveat: true, renderer: "SwiftShader" }));
  assert.equal(L.liteGate("r8").lite, true);
  L.setLiteFactsForTests(facts({ webgl2: false, renderer: "" }));
  assert.equal(L.liteGate("r8").lite, true);
  L.setLiteFactsForTests(facts({ renderer: "Mali-T830" }));
  assert.equal(L.liteGate("r8").lite, true);
  L.setLiteFactsForTests(facts({ renderer: "Mali-G52 MC1" }));
  assert.equal(L.liteGate("r8").lite, false, "a lite GPU (B-lite) still runs the rig; the runtime governor watches it");
  L.setLiteFactsForTests(facts());
  assert.equal(L.liteGate("r8").lite, false);
  L.setLiteFactsForTests(facts({ majorCaveat: true }));
  assert.equal(L.liteGate("lamp2").lite, false, "the Canvas 2D key rig is never gated");
  L.setLiteFactsForTests(null);
});

test("arming: her first audio, an idle page outside a lesson, or the fallback timer; never before in a lesson", () => {
  const base = { status: "thinking", spokeYet: false, sinceMountMs: 500, idle: true };
  assert.equal(L.armLive(base), false, "a lesson before her first sound: still + light mouth");
  assert.equal(L.armLive({ ...base, status: "speaking" }), true);
  assert.equal(L.armLive({ ...base, spokeYet: true, status: "your_turn" }), true);
  assert.equal(L.armLive({ ...base, status: null }), true, "outside a lesson, once idle");
  assert.equal(L.armLive({ ...base, status: null, idle: false }), false);
  assert.equal(L.armLive({ ...base, sinceMountMs: L.LIVE_ARM_FALLBACK_MS }), true);
});

test("light mouth: closed in silence, opens with her level, holds each key, closes within two ticks of a gap", () => {
  const m = new L.LiteMouth();
  assert.equal(m.step(0.9, false, 0), "closed", "not speaking: closed whatever the meter");
  const m2 = new L.LiteMouth();
  assert.equal(m2.step(0.6, true, 0), "open");
  assert.equal(m2.step(0.2, true, 30), "open", "held for LITE_HOLD_MS");
  m2.step(0.0, true, 96);
  assert.equal(m2.step(0.0, true, 162), "closed", "a gap closes within two ticks");
  const seen = new Set();
  let t = 1000;
  for (let i = 0; i < 40; i++) { seen.add(m2.step(i % 4 === 0 ? 0 : i % 4 === 1 ? 0.25 : i % 4 === 2 ? 0.4 : 0.8, true, (t += 100))); }
  for (const k of ["closed", "ee", "half", "open", "oh"]) assert.ok(seen.has(k), `uses ${k}`);
});

test("liteBox: the sprite rect maps onto each framing's poster box", () => {
  const b = L.liteBox([310, 523, 787, 817], [60, 8, 904]);
  assert.equal(b.aspect, "904 / 1016");
  assert.ok(Math.abs(b.left - (250 / 904) * 100) < 1e-9);
  assert.ok(Math.abs(b.top - (515 / 1016) * 100) < 1e-9);
});

test("the r8 lite pack ships every non-closed key, and the face wires gate, arming and the layer", () => {
  const g = JSON.parse(src("public/face-puppet/r8/lite/lite.json"));
  assert.equal(g.rect.length, 4);
  for (const k of L.LITE_KEYS.filter((k) => k !== "closed")) assert.ok(existsSync(new URL(`../public/face-puppet/r8/lite/${k}.webp`, import.meta.url)), k);
  const face = src("src/face-puppet/PuppetFace.tsx");
  assert.match(face, /if \(!kept && !armed\) return cleanup;/, "no stage before it is armed");
  assert.match(face, /const g = liteGate\(look\);/);
  assert.match(face, /phase !== "live" && <LiteLayer/);
  const stage = src("src/face-puppet/stage.ts");
  assert.match(stage, /const raster = rafP95 > RASTER_LATE_MS \|\| longs >= RASTER_LONG_TASKS;/);
});
