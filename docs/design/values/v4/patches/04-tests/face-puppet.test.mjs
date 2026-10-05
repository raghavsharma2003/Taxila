// V4 face-puppet unit tests (pure parts; no DOM, no GL): viseme mapping + Hindi rules, the scheduler on the player
// clock, the acting policy (verdict-neutral, budgets, safety calm), the safety floor on the judged presets, and the driver
// end to end with a fake rig. Patch 04 copies this file to tests/face-puppet.test.mjs so `npm test` gates it.
//   node --test evals/face-puppet/face-puppet.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { AZURE_TO_CONTRACT, OPENNESS, resolveVisemes, weightsAt, wordFlags, stopFlagsFromText } from "../src/face-puppet/visemes.ts";
import { VisemeScheduler, EVENT_LEAD_MS } from "../src/face-puppet/track.ts";
import { ActingPolicy, BIG_EVERY_S } from "../src/face-puppet/policy.ts";
import { applySafetyFloor, presetViolations } from "../src/face-puppet/safety.ts";
import { PuppetDriver } from "../src/face-puppet/driver.ts";
import { EXPRESSIONS, VARIANTS } from "../src/face-puppet/runtime/expr.js";

test("every Azure viseme id 0-21 maps to a contract viseme, with an openness", () => {
  assert.equal(AZURE_TO_CONTRACT.length, 22);
  assert.equal(OPENNESS.length, 22);
  for (const m of AZURE_TO_CONTRACT) assert.match(m.v, /^viseme_(sil|PP|FF|TH|DD|kk|CH|SS|nn|RR|aa|E|I|O|U)$/);
  assert.equal(AZURE_TO_CONTRACT[21].v, "viseme_PP");   // p b m: full seal
  assert.equal(OPENNESS[21], 0);
  assert.ok(AZURE_TO_CONTRACT[19].tongue.tongueTipUp > 0.5); // Hindi dentals show the tip
  assert.ok(AZURE_TO_CONTRACT[14].tongue.tongueWide > 0);    // ल: wide blade
});

test("Hindi word rules: retroflex words curl, dentals tip up, व is a light labiodental", () => {
  assert.deepEqual(wordFlags("मिट्टी").stops, [true, true]);
  assert.deepEqual(wordFlags("पानी").stops, [false]);
  assert.deepEqual(wordFlags("थोड़ा").stops, [false, true]);   // थ dental, ड़ retroflex: order is kept
  assert.deepEqual(wordFlags("thoda").stops, [false, true]);
  assert.deepEqual(wordFlags("tota").stops, [false, false]);   // तोता is dental
  const vis = [{ ms: 0, id: 0 }, { ms: 100, id: 19 }, { ms: 160, id: 8 }, { ms: 200, id: 19 }, { ms: 300, id: 19 }, { ms: 400, id: 1 }, { ms: 500, id: 18 }];
  const words = [{ ms: 90, durMs: 190, text: "थोड़ा" }, { ms: 290, durMs: 150, text: "तो" }, { ms: 480, durMs: 100, text: "वो" }];
  const r = resolveVisemes(vis, words);
  assert.ok(!r[1].target.tongue?.tongueCurl && r[1].target.tongue.tongueTipUp > 0.5, "थ of थोड़ा is dental");
  assert.ok(r[3].target.tongue.tongueCurl > 0.5, "ड़ of थोड़ा curls");
  assert.ok(!r[4].target.tongue?.tongueCurl && r[4].target.tongue.tongueTipUp > 0.5, "the stop of तो is dental");
  assert.equal(r[6].target.w, 0.6, "व is lighter than v");
});

test("viseme-only parts: the text stop list is used only when its count matches Azure's", () => {
  assert.deepEqual(stopFlagsFromText("thoda tota"), [false, true, false, false]);
  const vis = [{ ms: 0, id: 19 }, { ms: 100, id: 19 }, { ms: 200, id: 19 }, { ms: 300, id: 19 }];
  assert.ok(resolveVisemes(vis, [], "thoda tota")[1].target.tongue.tongueCurl > 0.5);
  // a count mismatch never guesses a curl
  assert.ok(!resolveVisemes(vis.slice(0, 3), [], "thoda tota").some((x) => x.target.tongue?.tongueCurl));
});

test("weightsAt: a viseme ramps in over the 50 ms before its onset (no hold) and tongue keys ride it", () => {
  const tr = resolveVisemes([{ ms: 0, id: 0 }, { ms: 200, id: 2 }, { ms: 400, id: 19 }, { ms: 500, id: 0 }]);
  const out = {};
  weightsAt(tr, 300, out);
  assert.equal(out.viseme_aa, 1);
  weightsAt(tr, 175, out);
  assert.ok(out.viseme_aa > 0.4 && out.viseme_aa < 0.6);
  weightsAt(tr, 420, out);
  assert.ok(out.viseme_DD > 0.9 && out.tongueTipUp > 0.7);
  assert.ok(out.jawOpen >= 0);
});

test("scheduler: player clock + measured lead, merge of streamed batches, stale drop, cut", () => {
  const s = new VisemeScheduler();
  assert.equal(s.lead, EVENT_LEAD_MS);
  s.push(0, 1000, [{ ms: 0, id: 0 }, { ms: 200, id: 2 }], [], 900);
  s.push(0, 1000, [{ ms: 400, id: 21 }, { ms: 600, id: 0 }], [], 900);   // a later batch of the same part
  const out = {};
  // the aa at 200 ms is drawn at playAt + 200 - lead
  assert.ok(s.at(1000 + 200 - EVENT_LEAD_MS + 10, out) && out.viseme_aa > 0.9);
  assert.ok(s.at(1000 + 410 - EVENT_LEAD_MS + 10, out) && out.viseme_PP > 0.9, "the merged batch is there");
  assert.equal(s.at(5000, out), false);
  s.push(1, 100, [{ ms: 0, id: 2 }], [], 5000);   // finished long ago
  assert.equal(s.stale, 1);
  s.push(2, 6000, [{ ms: 0, id: 2 }, { ms: 300, id: 0 }], [], 5900);
  s.cut();
  assert.equal(s.at(6100, out), false, "a cut closes the mouth at once");
});

test("policy: verdict-neutral (thinking releases, affect waits for her onset), 30 s big budget, band scale", () => {
  const p = new ActingPolicy("b2");
  p.floor("thinking", 1);
  const armed = p.affect("excited", 2, 1.2);
  assert.equal(armed.length, 0, "no affect while she thinks: armed for her next onset");
  const onset = p.floor("speaking", 2);
  const e = onset.find((c) => c.op === "emote");
  assert.equal(e.name, "delight");
  assert.ok(e.intensity < 1, "band b2 scales amplitude");
  p.floor("your_turn", 4);
  p.affect("excited", 2, 10);
  const second = p.floor("speaking", 10.5).find((c) => c.op === "emote");
  assert.equal(second.name, "warm", `a second delight inside ${BIG_EVERY_S} s plays warm`);
  const think = p.floor("thinking", 12);
  assert.ok(think.some((c) => c.op === "release"), "entering thinking releases");
  assert.ok(think.some((c) => c.op === "emote" && c.name === "thinking"), "and starts the thinking glance");
});

test("policy: duplex poses own the floor face; safety calm blocks delight until the floor leaves it", () => {
  const p = new ActingPolicy("b3");
  const th = p.pose("thinking", 1);
  assert.ok(th.some((c) => c.op === "emote" && c.name === "thinking" && c.intensity === 1));
  // the floor change that follows must not release the duplex's own thinking face
  assert.ok(!p.floor("thinking", 1.05).some((c) => c.op === "release"));
  const calm = p.pose("calm_steady", 2);
  assert.ok(calm.some((c) => c.op === "calm" && c.on));
  assert.equal(p.affect("excited", 2, 2.5).length, 0);
  p.floor("speaking", 3);
  const left = p.pose("listening", 4);
  assert.ok(left.some((c) => c.op === "calm" && !c.on));
});

test("safety floor: no preset or take winks, pouts or pushes one cheek after applySafetyFloor", () => {
  applySafetyFloor();
  assert.deepEqual(presetViolations(), []);
  for (const t of VARIANTS.playful) { assert.equal(t.bs.eyeBlinkRight ?? 0, 0); assert.equal(t.bs.eyeBlinkLeft ?? 0, 0); assert.equal(t.pulse, undefined); }
  assert.ok(EXPRESSIONS.playful.bs.mouthSmileRight > 0.5, "the smirk itself is kept");
});

test("driver: Diya visemes drive the mouth on the player clock; duplex nods are content-blind and never while she speaks", () => {
  const d = new PuppetDriver({ band: "b2" });
  const frames = [];
  const rig = { clock: null, frame: (bs, head) => frames.push({ bs: { ...bs }, head: [...head] }) };
  const tap = { buf: null, sampleRate: 48000, t: 0, level: 0, fresh: false };
  d.visemes.push(0, 1000, [{ ms: 0, id: 0 }, { ms: 300, id: 21 }, { ms: 400, id: 2 }, { ms: 700, id: 0 }], [], 0);
  let sawPP = false, sawAA = false;
  for (let t = 0; t < 2000; t += 16) {
    const f = d.frame({ nowMs: t, tap, status: "speaking", childLevel: 0 }, rig);
    if (f.lipSource === "visemes" && (f.mouth.viseme_PP ?? 0) > 0.9) sawPP = true;
    if (f.lipSource === "visemes" && (f.mouth.viseme_aa ?? 0) > 0.9) sawAA = true;
    if (t > 1100 && t < 1500) assert.equal(f.state, "speaking");
    if (t === 1200) assert.equal(d.nodCue(4, t), false, "no nod while she speaks");
  }
  assert.ok(sawPP && sawAA, "the closure and the open vowel reach the rig");
  // listening: one nod, then the ≤ 1 per 3 s rule
  d.pose("listening", 3000);
  for (let t = 2000; t < 4000; t += 16) d.frame({ nowMs: t, tap, status: "listening", childLevel: 0.4 }, rig);
  assert.equal(d.nodCue(4, 4000), true);
  assert.equal(d.nodCue(4, 5000), false);
  assert.equal(d.nodCue(4, 7100), true);
  assert.ok(frames.length > 200);
});
