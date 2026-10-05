// ship5 p2-face: the 2D puppet as the lesson face. Pure parts (no DOM, no GL): viseme mapping and the Hindi rules, the
// scheduler on the player clock (incl. the product-path merge fix), the acting policy (verdict-neutral, budgets, safety
// turns NEUTRAL), the safety floor on the judged presets, the driver end to end with a fake rig (lip-sync, thinking
// glance, Listener vs duplex nods, the safety-neutral mouth), and the duplex bridge (the one hook the engine drives).
// Supersedes docs/design/values/v4/patches/04-tests/face-puppet.test.mjs (whose calm_steady case expected the concern
// preset: replaced by R6, see policy.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { AZURE_TO_CONTRACT, OPENNESS, resolveVisemes, weightsAt, wordFlags, stopFlagsFromText } from "../src/face-puppet/visemes.ts";
import { VisemeScheduler, EVENT_LEAD_MS, MERGE_TOLERANCE_MS } from "../src/face-puppet/track.ts";
import { ActingPolicy, BIG_EVERY_S } from "../src/face-puppet/policy.ts";
import { applySafetyFloor, presetViolations, assertPresetsSafe } from "../src/face-puppet/safety.ts";
import { PuppetDriver, SAFETY_NEUTRAL } from "../src/face-puppet/driver.ts";
import { EXPRESSIONS, VARIANTS } from "../src/face-puppet/runtime/expr.js";
import { puppetBus } from "../src/face-puppet/bus.ts";
import { puppetDuplexSink, withPuppet, puppetDuplexDetach } from "../src/face-puppet/duplexBridge.ts";

const TAP0 = { buf: null, sampleRate: 48000, t: 0, level: 0, fresh: false };
const fakeRig = () => { const frames = []; return { frames, rig: { clock: null, frame: (bs, head, gaze) => frames.push({ bs: { ...bs }, head: [...head], gaze: [...gaze] }) } }; };
const smileOf = (bs) => Math.max(bs.mouthSmileLeft ?? 0, bs.mouthSmileRight ?? 0);

// ───────── visemes ─────────

test("every Azure viseme id 0-21 maps to a contract viseme, with an openness", () => {
  assert.equal(AZURE_TO_CONTRACT.length, 22);
  assert.equal(OPENNESS.length, 22);
  for (const m of AZURE_TO_CONTRACT) assert.match(m.v, /^viseme_(sil|PP|FF|TH|DD|kk|CH|SS|nn|RR|aa|E|I|O|U)$/);
  assert.equal(AZURE_TO_CONTRACT[21].v, "viseme_PP");
  assert.equal(OPENNESS[21], 0);
  assert.ok(AZURE_TO_CONTRACT[19].tongue.tongueTipUp > 0.5);
  assert.ok(AZURE_TO_CONTRACT[14].tongue.tongueWide > 0);
});

test("Hindi word rules: retroflex curls in letter order, dentals tip up, व is light", () => {
  assert.deepEqual(wordFlags("मिट्टी").stops, [true, true]);
  assert.deepEqual(wordFlags("थोड़ा").stops, [false, true]);
  assert.deepEqual(wordFlags("tota").stops, [false, false]);
  const vis = [{ ms: 0, id: 0 }, { ms: 100, id: 19 }, { ms: 160, id: 8 }, { ms: 200, id: 19 }, { ms: 300, id: 19 }, { ms: 400, id: 1 }, { ms: 500, id: 18 }];
  const words = [{ ms: 90, durMs: 190, text: "थोड़ा" }, { ms: 290, durMs: 150, text: "तो" }, { ms: 480, durMs: 100, text: "वो" }];
  const r = resolveVisemes(vis, words);
  assert.ok(!r[1].target.tongue?.tongueCurl && r[1].target.tongue.tongueTipUp > 0.5);
  assert.ok(r[3].target.tongue.tongueCurl > 0.5);
  assert.equal(r[6].target.w, 0.6);
  // the count gate (Review v4): chhota has 2 id-19 events for 1 stop letter → no curl anywhere
  const c = resolveVisemes([{ ms: 0, id: 0 }, { ms: 15, id: 16 }, { ms: 77, id: 19 }, { ms: 138, id: 7 }, { ms: 323, id: 19 }], [{ ms: 0, durMs: 430, text: "chhota" }]);
  assert.ok(!c.some((x) => x.target.tongue?.tongueCurl));
  assert.deepEqual(stopFlagsFromText("thoda tota"), [false, true, false, false]);
});

test("weightsAt: 50 ms ramp-in, no hold, tongue keys ride the viseme", () => {
  const tr = resolveVisemes([{ ms: 0, id: 0 }, { ms: 200, id: 2 }, { ms: 400, id: 19 }, { ms: 500, id: 0 }]);
  const out = {};
  weightsAt(tr, 300, out);
  assert.equal(out.viseme_aa, 1);
  weightsAt(tr, 175, out);
  assert.ok(out.viseme_aa > 0.4 && out.viseme_aa < 0.6);
  weightsAt(tr, 420, out);
  assert.ok(out.viseme_DD > 0.9 && out.tongueTipUp > 0.7);
});

// ───────── the scheduler (product-path fixes) ─────────

test("scheduler: player clock + measured lead, stale drop, cut", () => {
  const s = new VisemeScheduler();
  assert.equal(s.lead, EVENT_LEAD_MS);
  s.push(0, 1000, [{ ms: 0, id: 0 }, { ms: 200, id: 2 }], [], 900);
  const out = {};
  assert.ok(s.at(1000 + 200 - EVENT_LEAD_MS + 10, out) && out.viseme_aa > 0.9);
  assert.equal(s.at(5000, out), false);
  s.push(1, 100, [{ ms: 0, id: 2 }], [], 5000);
  assert.equal(s.stale, 1);
  s.push(2, 6000, [{ ms: 0, id: 2 }, { ms: 300, id: 0 }], [], 5900);
  s.cut();
  assert.equal(s.at(6100, out), false, "a cut closes the mouth at once");
});

test("scheduler: one part's batches with jittered playAt merge into ONE track (product-path defect, ship5 p2-face)", () => {
  // measured on the product path before the fix: one part's 9 batches arrived with playAt spread over 0.1-8 ms; keyed on
  // |d| < 5 ms they split into separate tracks and each track's 200 ms tail hid the next batch's first visemes
  const s = new VisemeScheduler();
  s.push(0, 1000.0, [{ ms: 0, id: 0 }, { ms: 100, id: 2 }, { ms: 300, id: 21 }], [], 900, undefined, "L:1");
  s.push(0, 1007.9, [{ ms: 420, id: 6 }, { ms: 520, id: 2 }], [], 900, undefined, "L:1");
  const out = {};
  // at the second batch's first viseme (420 ms) the merged track draws it; a separate track would still be in batch 1's tail
  const v6 = AZURE_TO_CONTRACT[6].v;
  assert.ok(s.at(1000 + 430 - EVENT_LEAD_MS, out) && (out[v6] ?? 0) > 0.9, `batch 2's opening viseme (${v6}) is drawn: ${JSON.stringify(out)}`);
  assert.equal(s.active, 1, "one track");
  // a batch beyond the tolerance is another timeline (a real re-anchor is always preceded by a cut)
  s.push(0, 1000 + MERGE_TOLERANCE_MS + 5, [{ ms: 600, id: 2 }], [], 900, undefined, "L:1");
  assert.equal(s.active, 2);
  // another reply's part 0 never merges into this one
  const t = new VisemeScheduler();
  t.push(0, 1000, [{ ms: 0, id: 2 }], [], 900, undefined, "L:1");
  t.push(0, 1001, [{ ms: 50, id: 2 }], [], 900, undefined, "L:2");
  assert.equal(t.active, 2);
});

test("scheduler: word boundaries in their own batch are merged, never dropped (they gate the retroflex curls)", () => {
  const s = new VisemeScheduler();
  // words that arrive before the part's visemes are held and merged when the visemes come
  s.push(1, 2000, [], [{ ms: 0, durMs: 300, text: "मिट्टी" }], 1900, undefined, "L:1");
  s.push(1, 2000, [{ ms: 10, id: 21 }, { ms: 80, id: 6 }, { ms: 150, id: 19 }, { ms: 220, id: 19 }, { ms: 290, id: 6 }], [], 1900, undefined, "L:1");
  const out = {};
  assert.ok(s.at(2000 + 160 - EVENT_LEAD_MS, out) && (out.tongueCurl ?? 0) > 0.5, `the ट of मिट्टी curls: ${JSON.stringify(out)}`);
  // and a words-only batch after the visemes merges too
  const t = new VisemeScheduler();
  t.push(1, 2000, [{ ms: 10, id: 21 }, { ms: 80, id: 6 }, { ms: 150, id: 19 }, { ms: 220, id: 19 }, { ms: 290, id: 6 }], [], 1900, undefined, "L:1");
  t.push(1, 2000, [], [{ ms: 0, durMs: 300, text: "मिट्टी" }], 1900, undefined, "L:1");
  assert.ok(t.at(2000 + 160 - EVENT_LEAD_MS, out) && (out.tongueCurl ?? 0) > 0.5);
});

test("scheduler: the next part's opening viseme is not hidden by the previous part's closing tail", () => {
  const s = new VisemeScheduler();
  s.push(0, 1000, [{ ms: 0, id: 2 }, { ms: 300, id: 0 }], [], 900, undefined, "L:1"); // part 0 ends ~1300, tail to 1500
  s.push(1, 1380, [{ ms: 0, id: 21 }, { ms: 100, id: 2 }], [], 900, undefined, "L:1"); // part 1 starts 120 ms after
  const out = {};
  assert.ok(s.at(1380 + 10 - EVENT_LEAD_MS + 50, out) && (out.viseme_PP ?? 0) > 0.9, `part 1's closure: ${JSON.stringify(out)}`);
});

// ───────── the acting policy ─────────

test("policy: verdict-neutral (thinking releases, affect waits for her onset), 30 s big budget, band scale", () => {
  const p = new ActingPolicy("b2");
  p.floor("thinking", 1);
  assert.equal(p.affect("excited", 2, 1.2).length, 0, "armed, not played, while she thinks");
  const e = p.floor("speaking", 2).find((c) => c.op === "emote");
  assert.equal(e.name, "delight");
  assert.ok(e.intensity < 1);
  p.floor("your_turn", 4);
  p.affect("excited", 2, 10);
  assert.equal(p.floor("speaking", 10.5).find((c) => c.op === "emote").name, "warm", `second delight inside ${BIG_EVERY_S} s plays warm`);
  const think = p.floor("thinking", 12);
  assert.ok(think.some((c) => c.op === "release"));
  assert.ok(think.some((c) => c.op === "emote" && c.name === "thinking"), "the thinking glance");
});

test("policy R6: a safety turn is NEUTRAL (no preset, no affect, concern included) and outlives her reply", () => {
  const p = new ActingPolicy("b2");
  p.floor("thinking", 1);
  const s = p.safetyTurn(1.5);
  assert.ok(s.some((c) => c.op === "calm" && c.on));
  assert.ok(s.some((c) => c.op === "release"));
  assert.ok(!s.some((c) => c.op === "emote"), "no preset on a safety turn");
  assert.equal(p.affect("concerned", 1, 1.6).length, 0, "the concern preset is not played either");
  assert.equal(p.affect("excited", 2, 1.7).length, 0);
  assert.ok(!p.floor("speaking", 2).some((c) => c.op === "emote" || (c.op === "calm" && !c.on)), "her safeguarding reply stays neutral");
  assert.ok(!p.floor("listening", 6).some((c) => c.op === "emote"), "no listening preset in safety");
  assert.ok(!p.floor("thinking", 8).some((c) => c.op === "emote"), "no thinking glance in safety");
  // the child spoke again, the Director did not mark this reply a safety turn: her onset leaves the calm
  const back = p.floor("speaking", 9);
  assert.ok(back.some((c) => c.op === "calm" && !c.on));
  assert.equal(p.inSafety, false);
  // a fresh calm_steady cue before her onset keeps it
  const q = new ActingPolicy("b2");
  q.safetyTurn(1); q.floor("speaking", 2); q.floor("listening", 4); q.floor("thinking", 5);
  q.safetyTurn(5.5);
  assert.ok(!q.floor("speaking", 6).some((c) => c.op === "calm" && !c.on));
  assert.equal(q.inSafety, true);
});

test("policy R6 with the duplex engine: calm_steady plays no preset; a child-floor pose then her onset leaves it", () => {
  const p = new ActingPolicy("b3");
  assert.ok(p.pose("thinking", 1).some((c) => c.op === "emote" && c.name === "thinking"), "the engine's thinking glance");
  const calm = p.pose("calm_steady", 2);
  assert.ok(calm.some((c) => c.op === "calm" && c.on));
  assert.ok(!calm.some((c) => c.op === "emote"), "no concern preset (it read as a smile at 0.35)");
  assert.equal(p.affect("excited", 2, 2.5).length, 0);
  assert.ok(!p.pose("speaking", 3).some((c) => c.op === "calm" && !c.on), "her safeguarding reply stays calm");
  assert.ok(!p.pose("listening", 5).some((c) => c.op === "emote"), "a child-floor pose in calm: no listening preset");
  const left = p.pose("speaking", 7);
  assert.ok(left.some((c) => c.op === "calm" && !c.on), "her next onset after a normal child turn leaves safety");
  assert.ok(p.pose("listening", 9).some((c) => c.op === "emote" && c.name === "listening"));
  p.detachDuplex(10);
  assert.equal(p.duplexAttached, false);
});

// ───────── the safety floor on the judged presets ─────────

test("safety floor: no preset winks, pouts or pushes one cheek; fails closed", () => {
  applySafetyFloor();
  assert.deepEqual(presetViolations(), []);
  for (const t of VARIANTS.playful) { assert.equal(t.bs.eyeBlinkRight ?? 0, 0); assert.equal(t.pulse, undefined); }
  const p = Object.values(EXPRESSIONS)[0];
  p.bs.eyeBlinkRight = 1;
  try { assert.throws(() => assertPresetsSafe(), /puppet safety floor/); } finally { delete p.bs.eyeBlinkRight; }
  assert.deepEqual(presetViolations(), []);
});

// ───────── the driver ─────────

test("driver: Diya visemes drive the mouth on the player clock (closure and open vowel reach the rig)", () => {
  const d = new PuppetDriver({ band: "b2" });
  const { rig } = fakeRig();
  d.visemes.push(0, 1000, [{ ms: 0, id: 0 }, { ms: 300, id: 21 }, { ms: 400, id: 2 }, { ms: 700, id: 0 }], [], 0);
  let pp = false, aa = false;
  for (let t = 0; t < 2000; t += 16) {
    const f = d.frame({ nowMs: t, tap: TAP0, status: "speaking", childLevel: 0 }, rig);
    if (f.lipSource === "visemes" && (f.mouth.viseme_PP ?? 0) > 0.9) pp = true;
    if (f.lipSource === "visemes" && (f.mouth.viseme_aa ?? 0) > 0.9) aa = true;
  }
  assert.ok(pp && aa);
});

test("driver: the thinking glance moves her eyes off the child; listening nods come from the mic level (Listener)", () => {
  const d = new PuppetDriver({ band: "b2", seed: 3 });
  const { rig, frames } = fakeRig();
  let t = 0;
  for (; t < 3000; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "listening", childLevel: 0 }, rig);
  const gListen = frames.at(-1).gaze;
  for (; t < 6000; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "thinking", childLevel: 0 }, rig);
  const gThink = frames.at(-1).gaze;
  assert.ok(Math.hypot(gThink[0] - gListen[0], gThink[1] - gListen[1]) > 2, `thinking glance: ${gListen} → ${gThink}`);
  // the child talks in phrases (0.6 s voice, 0.3 s pause): the Listener nods at the pauses
  const before = frames.length;
  for (t = 6000; t < 12000; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "listening", childLevel: (t % 900) < 600 ? 0.4 : 0 }, rig);
  const pitch = frames.slice(before).map((f) => f.head[0]);
  assert.ok(Math.max(...pitch) - Math.min(...pitch) > 1.5, `nods visible in head pitch (range ${(Math.max(...pitch) - Math.min(...pitch)).toFixed(2)} deg)`);
});

test("driver R6: a safety turn holds a soft-neutral mouth (no smile, no cheek push, no frown), no nods, no laugh", () => {
  const run = (safety) => {
    const d = new PuppetDriver({ band: "b2", seed: 5 });
    const { rig, frames } = fakeRig();
    let t = 0;
    for (; t < 1000; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "thinking", childLevel: 0 }, rig);
    if (safety) d.safetyTurn(t);
    else d.affect("warm", 2, t);
    d.visemes.push(0, t + 100, [{ ms: 0, id: 0 }, { ms: 200, id: 2 }, { ms: 500, id: 21 }, { ms: 700, id: 4 }, { ms: 1400, id: 0 }], [], t);
    const from = frames.length;
    for (; t < 4000; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "speaking", childLevel: 0 }, rig);
    const speakSmile = Math.max(...frames.slice(from + 20).map((f) => smileOf(f.bs)));
    const nodOk = d.nodCue(4, t + 5000);
    return { d, speakSmile, nodOk, frames };
  };
  const calm = run(true), warm = run(false);
  assert.ok(calm.speakSmile <= SAFETY_NEUTRAL.mouthSmile + 1e-3, `safety reply smile ${calm.speakSmile}`);
  assert.ok(warm.speakSmile > SAFETY_NEUTRAL.mouthSmile * 3, `a normal warm reply smiles (${warm.speakSmile})`);
  for (const f of calm.frames.slice(-60)) {
    assert.ok((f.bs.cheekSquintLeft ?? 0) <= SAFETY_NEUTRAL.cheekSquint + 1e-3 && (f.bs.cheekSquintRight ?? 0) <= SAFETY_NEUTRAL.cheekSquint + 1e-3);
    assert.ok((f.bs.mouthFrownLeft ?? 0) < 0.01 && (f.bs.mouthFrownRight ?? 0) < 0.01);
  }
  assert.equal(calm.d.inSafety, true);
  assert.equal(calm.nodOk, false, "no nod in a safety turn");
  // listening in safety: the mic-level Listener does not nod either
  const d = calm.d, { rig, frames } = fakeRig();
  for (let t = 9000; t < 14000; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "listening", childLevel: (t % 900) < 600 ? 0.4 : 0 }, rig);
  const pitch = frames.map((f) => f.head[0]);
  assert.ok(Math.max(...pitch) - Math.min(...pitch) < 1.5, "a still, attentive face: no nods");
});

test("driver: duplex nods replace the Listener, ≤ 1 per 3 s, never while she speaks; detach hands nods back", () => {
  const d = new PuppetDriver({ band: "b2" });
  const { rig } = fakeRig();
  d.visemes.push(0, 100, [{ ms: 0, id: 2 }, { ms: 800, id: 0 }], [], 0);
  for (let t = 0; t < 600; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "speaking", childLevel: 0 }, rig);
  assert.equal(d.nodCue(4, 600), false, "no nod while she speaks");
  d.pose("listening", 2000);
  for (let t = 1000; t < 3000; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "listening", childLevel: 0.4 }, rig);
  assert.equal(d.policy.duplexAttached, true);
  assert.equal(d.nodCue(4, 3000), true);
  assert.equal(d.nodCue(4, 4000), false);
  assert.equal(d.nodCue(4, 6100), true);
  d.detachDuplex(7000);
  assert.equal(d.policy.duplexAttached, false);
});

// ───────── the duplex bridge (the one hook the engine drives) ─────────

test("duplex bridge: face cues, yield → cut, safety → calm_steady pose, detach; commands pass through unchanged", () => {
  const seen = [];
  const off = puppetBus.on((e) => seen.push(e));
  try {
    const cmds = [
      { to: "face", t: 1, cue: { kind: "pose", pose: "listening", why: "child_turn" } },
      { to: "face", t: 2, cue: { kind: "nod", peakDeg: 4 } },
      { to: "voice", op: "yield", t: 3, reason: "barge_in", atWordBoundary: true, resumable: true, heardUpTo: null },
      { to: "safety", op: "attend", t: 4, kind: "distress" },
      { to: "floor", t: 5, phase: "safety_attend", floor: "listening" },
      { to: "think", op: "handover", t: 6, turnSeq: 1, itemId: null },
    ];
    const out = [];
    const emit = withPuppet((c) => out.push(c));
    for (const c of cmds) emit(c);
    assert.deepEqual(out, cmds, "the host's commands are forwarded unchanged");
    assert.deepEqual(seen.map((e) => e.kind), ["duplex", "duplex", "cut", "duplex", "duplex"]);
    assert.equal(seen[3].cue.pose, "calm_steady");
    assert.equal(seen[4].cue.pose, "calm_steady");
    assert.ok(!JSON.stringify(seen).includes("handover"), "content and think commands never reach the face");
    puppetDuplexDetach();
    assert.equal(seen.at(-1).kind, "duplex-detach");
    assert.equal(puppetDuplexSink(cmds[5]), cmds[5]);
  } finally { off(); }
});
