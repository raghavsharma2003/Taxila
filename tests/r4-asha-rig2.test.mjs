// Round 4, Asha lamp2: the painted-key schedule (src/face-puppet/rig-keys/schedule.ts). Pure parts, no DOM, no canvas:
// viseme -> painted mouth, the hold and crossfade bounds, the seal that always lands, the blink schedule (rate, cels,
// never a held half lid), gaze keys with hysteresis, brows (calm and the thinking glance stay neutral), the rigid motion
// budget, and the driver end to end through a fake key rig (the safety turn: calm mouth, no smile while speaking).
import { test } from "node:test";
import assert from "node:assert/strict";
import { MouthKeys, EyeKeys, BrowKeys, HeadMotion, FADE_MS, HOLD_MS, MOTION, BLINK_CELS, KEY_LEAD_MS, KEY_OPENNESS } from "../src/face-puppet/rig-keys/schedule.ts";
import { PuppetDriver } from "../src/face-puppet/driver.ts";

test("visemes map to the painted mouth set; the seal wins at half weight", () => {
  const t = (bs, calm) => MouthKeys.target({ bs, calm });
  assert.equal(t({ viseme_PP: 0.5, viseme_aa: 0.9 }), "mbp");
  assert.equal(t({ viseme_aa: 1 }), "aa");
  assert.equal(t({ viseme_aa: 0.6 }), "eh");
  assert.equal(t({ viseme_I: 1 }), "ee");
  assert.equal(t({ viseme_U: 1 }), "oo");
  assert.equal(t({ viseme_O: 1 }), "oh");
  assert.equal(t({ viseme_FF: 1 }), "fv");
  assert.equal(t({ viseme_DD: 1 }), "ltd");
  assert.equal(t({}), "rest");
  assert.equal(t({ mouthSmileLeft: 0.4, mouthSmileRight: 0.4 }), "smile");
  // the safety turn: the calm neutral, never the smile
  assert.equal(t({ mouthSmileLeft: 0.4, mouthSmileRight: 0.4 }, true), "calm");
  // the listening preset's parted lips (jaw ~0.13, no voice) stay closed
  assert.equal(t({ jawOpen: 0.13 }), "rest");
  assert.ok(KEY_LEAD_MS > 0 && KEY_LEAD_MS <= 60);
});

test("mouth: a key holds >= HOLD_MS, a seal lands at once, crossfades are bounded and eased", () => {
  const m = new MouthKeys();
  let s = m.step(0, { bs: { viseme_aa: 1 } });
  // 20 ms later another vowel is wanted: still aa (held)
  s = m.step(20, { bs: { viseme_I: 1 } });
  assert.equal(s.b, "aa");
  // but a bilabial replaces it immediately
  s = m.step(30, { bs: { viseme_PP: 1 } });
  assert.equal(s.b, "mbp");
  // the fade is over within FADE_MS (never two keys on screen longer)
  s = m.step(30 + FADE_MS, { bs: { viseme_PP: 1 } });
  assert.deepEqual([s.a, s.b, s.k], ["mbp", "mbp", 1]);
  assert.ok(FADE_MS <= 60 && HOLD_MS >= 60);
  // mid-fade the weight is between 0 and 1 and monotone
  const m2 = new MouthKeys();
  m2.step(0, { bs: {} });
  m2.step(100, { bs: { viseme_aa: 1 } });
  const ks = [110, 120, 130, 140].map((t) => m2.step(t, { bs: { viseme_aa: 1 } }).k);
  for (let i = 1; i < ks.length; i++) assert.ok(ks[i] >= ks[i - 1]);
  assert.ok(ks[0] > 0 && ks[0] < 1);
  assert.equal(KEY_OPENNESS.mbp, 0);
});

test("blinks: 15-20 a minute over ten simulated minutes, four held cels, the half lid never held", () => {
  for (const speaking of [false, true]) {
    const e = new EyeKeys(5);
    let halfRun = 0, maxHalf = 0;
    for (let t = 0; t < 600000; t += 1000 / 60) {
      const s = e.step(t, { gaze: [0, 0], speaking });
      const k = s.k >= 0.5 ? s.b : s.a;
      halfRun = k === "half" ? halfRun + 1000 / 60 : 0;
      maxHalf = Math.max(maxHalf, halfRun);
    }
    const perMin = e.blinks.length / 10;
    assert.ok(perMin >= 15 && perMin <= 21, `speaking=${speaking}: ${perMin}/min`);
    // the longest half-lid run is the blink's own opening cel (75 ms + one frame), never a held half lid
    assert.ok(maxHalf <= 100, `half lid held ${maxHalf} ms`);
  }
  assert.deepEqual(BLINK_CELS.map((c) => c[1]), ["half", "closed", "half", "open"]);
});

test("gaze: a painted look key with hysteresis and a minimum hold", () => {
  const e = new EyeKeys(1);
  let t = 0;
  // hold a gaze for 400 ms at 60 fps; the key on screen at the end, a blink's cels skipped (a gaze shift may bring one)
  const hold = (g) => { let k = "open"; for (const end = t + 400; t < end; t += 1000 / 60) { const s = e.step(t, { gaze: g, speaking: false }); const c = s.k >= 0.5 ? s.b : s.a; if (c !== "half" && c !== "closed") k = c; } return k; };
  hold([0, 0]);
  assert.equal(hold([12, 0]), "lookR");
  // 7 deg is inside the hysteresis band (in at 9, out at 5): still lookR
  assert.equal(hold([7, 0]), "lookR");
  assert.equal(hold([-12, 0]), "lookL");
  assert.equal(hold([0, 12]), "lookUp");
  assert.equal(hold([0, 0]), "open");
});

test("brows: raised and concern from the expression channels; neutral in a safety turn and under the thinking glance", () => {
  assert.equal(BrowKeys.target({ browOuterUpLeft: 0.32, browOuterUpRight: 0.32, browInnerUp: 0.45 }), "raised");
  assert.equal(BrowKeys.target({ browInnerUp: 0.5 }), "concern");
  assert.equal(BrowKeys.target({ browInnerUp: 0.5 }, true), "neutral");
  assert.equal(BrowKeys.target({ browOuterUpLeft: 0.4, browOuterUpRight: 0.4 }, false, true), "neutral");
});

test("rigid motion stays inside its budget whatever the driver asks", () => {
  const h = new HeadMotion();
  let p;
  for (let t = 0; t < 3000; t += 16) p = h.step(t, [40, 40, 40], 3, 1);
  assert.ok(Math.abs(p.rot) <= MOTION.rotMaxDeg + 1e-9 && MOTION.rotMaxDeg <= 2);
  assert.ok(Math.abs(p.sway) <= MOTION.swayMaxPx + 1e-9);
  assert.ok(Math.abs(p.nod) <= MOTION.nodMaxPx + 1e-9);
});

test("driver end to end: the safety turn keeps the calm mouth and never a smile while she speaks", () => {
  // a fake key rig: the same scheduling KeyRig.apply does, without the canvas
  const mk = new MouthKeys();
  const keys = [];
  let calm = false;
  const rig = { clock: null, frame(bs) { keys.push(mk.step(this.clock * 1000, { bs, calm }).b); } };
  const d = new PuppetDriver({ band: "b2", seed: 3 });
  const TAP = { buf: null, sampleRate: 48000, t: 0, level: 0, fresh: false };
  d.safetyTurn(1000);
  const vis = [{ ms: 0, id: 0 }, { ms: 100, id: 2 }, { ms: 250, id: 21 }, { ms: 330, id: 6 }, { ms: 480, id: 0 }];
  d.visemes.push(1, 1500, vis, [], 1400);
  for (let t = 1000; t < 2600; t += 16) { calm = d.inSafety; d.frame({ nowMs: t, tap: TAP, status: "speaking", childLevel: 0 }, rig); }
  assert.ok(d.inSafety);
  assert.ok(!keys.includes("smile"));
  assert.ok(keys.includes("calm"));
  assert.ok(keys.includes("mbp"));
});
