// Round 3, stream relational-human (no network, no DOM): the face reacting to the child's KNOWLEDGE STATE, never an
// emotion (src/face-puppet/knowledge.ts K1-K3, wired in src/face-puppet/driver.ts). Verdict-blind by construction: the
// layer's inputs are the floor and time; there is no verdict anywhere in its API.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { KnowledgeFace, RECEIPT_NOD_DEG, WORK_LOOK_AFTER_S, WORK_LOOKS_MAX } from "../src/face-puppet/knowledge.ts";
import { PuppetDriver } from "../src/face-puppet/driver.ts";
import { puppetBus } from "../src/face-puppet/bus.ts";

const TAP0 = { buf: null, sampleRate: 48000, t: 0, level: 0, fresh: false };
const TAPV = { buf: null, sampleRate: 48000, t: 0, level: 0.35, fresh: false };
const fakeRig = () => { const frames = []; return { frames, rig: { clock: null, frame: (bs, head, gaze) => frames.push({ bs: { ...bs }, head: [...head], gaze: [...gaze] }) } }; };
const N = { calm: false, reduced: false };

describe("KnowledgeFace (pure)", () => {
  test("K1: the child's turn ends (listening → thinking): one receipt nod; never from idle, never in a safety turn", () => {
    const k = new KnowledgeFace();
    assert.deepEqual(k.step("listening", 0, N), []);
    const acts = k.step("thinking", 1, N);
    assert.equal(acts.length, 1);
    assert.equal(acts[0].op, "nod");
    assert.equal(acts[0].peakDeg, RECEIPT_NOD_DEG);
    assert.deepEqual(k.step("thinking", 1.5, N), [], "once per boundary");
    const k2 = new KnowledgeFace();
    k2.step("idle", 0, N);
    assert.deepEqual(k2.step("thinking", 1, N), [], "no turn ended: no nod");
    const k3 = new KnowledgeFace();
    k3.step("listening", 0, N);
    assert.deepEqual(k3.step("thinking", 1, { calm: true, reduced: false }), [], "safety turn: a still face");
  });
  test("K3: the child's turn, silent: a look at the work after 2.5 s, every 5 s, at most 3, none in safety or reduced motion", () => {
    const k = new KnowledgeFace();
    k.step("your_turn", 0, N);
    const looks = [];
    for (let t = 0; t <= 30; t += 0.1) for (const a of k.step("your_turn", t, N)) looks.push({ t, a });
    assert.equal(looks.length, WORK_LOOKS_MAX);
    assert.ok(looks[0].t >= WORK_LOOK_AFTER_S - 1e-9);
    assert.ok(looks[1].t - looks[0].t >= 5 - 1e-6);
    const calm = new KnowledgeFace();
    calm.step("your_turn", 0, { calm: true, reduced: false });
    let n = 0;
    for (let t = 0; t <= 20; t += 0.1) n += calm.step("your_turn", t, { calm: true, reduced: false }).length;
    assert.equal(n, 0);
  });
  test("a new state resets the work-look count (each wait gets its own looks)", () => {
    const k = new KnowledgeFace();
    k.step("your_turn", 0, N);
    let n = 0;
    for (let t = 0; t <= 20; t += 0.1) n += k.step("your_turn", t, N).length;
    k.step("listening", 21, N);
    k.step("your_turn", 22, N);
    for (let t = 22; t <= 40; t += 0.1) n += k.step("your_turn", t, N).length;
    assert.equal(n, 2 * WORK_LOOKS_MAX);
  });
});

describe("the driver with the knowledge layer", () => {
  test("K1 on a real frame loop: her head nods when the child's turn ends, the same after any answer", () => {
    const run = () => {
      const d = new PuppetDriver({ band: "b2", seed: 3 });
      const { rig, frames } = fakeRig();
      let t = 0;
      for (; t < 2000; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "listening", childLevel: 0 }, rig);
      const from = frames.length;
      for (; t < 3500; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "thinking", childLevel: 0 }, rig);
      const pitch = frames.slice(from).map((f) => f.head[0]);
      return { range: Math.max(...pitch) - Math.min(...pitch), log: d.knowledge.log.join("|") };
    };
    const a = run(), b = run();
    assert.ok(a.log.includes("K1 nod"), a.log);
    assert.ok(a.range > 0.8, `a visible nod (pitch range ${a.range.toFixed(2)} deg)`);
    assert.equal(a.range.toFixed(6), b.range.toFixed(6), "deterministic: no input could make a right and a wrong answer differ");
  });
  test("K2: while her acknowledgement sounds the face stays THINKING; afterwards it is still thinking (not handing over)", () => {
    const d = new PuppetDriver({ band: "b2", seed: 4 });
    const { rig } = fakeRig();
    let t = 0;
    for (; t < 1500; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "listening", childLevel: 0 }, rig);
    for (; t < 2500; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "thinking", childLevel: 0 }, rig);
    d.ack("start", t);
    const during = [];
    for (; t < 3400; t += 16) during.push(d.frame({ nowMs: t, tap: TAPV, status: "thinking", childLevel: 0 }, rig).state);
    d.ack("end", t);
    const after = [];
    for (; t < 5000; t += 16) after.push(d.frame({ nowMs: t, tap: TAP0, status: "thinking", childLevel: 0 }, rig).state);
    assert.ok(during.every((s) => s === "thinking"), `during the echo: ${[...new Set(during)]}`);
    assert.ok(after.slice(-20).every((s) => s === "thinking"), `after the echo: ${[...new Set(after)]} (was "your_turn" without K2)`);
  });
  test("K2: an affect armed while the echo sounds waits for her REPLY's onset (it never rides the echo)", () => {
    const d = new PuppetDriver({ band: "b2", seed: 6 });
    const { rig } = fakeRig();
    let t = 0;
    for (; t < 1000; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "thinking", childLevel: 0 }, rig);
    d.ack("start", t);
    for (; t < 1400; t += 16) d.frame({ nowMs: t, tap: TAPV, status: "thinking", childLevel: 0 }, rig);
    d.affect("excited", 2, t);
    for (; t < 2000; t += 16) d.frame({ nowMs: t, tap: TAPV, status: "thinking", childLevel: 0 }, rig);
    assert.ok(!d.policy.log.some((l) => l.includes("emote delight")), `no delight on the echo: ${d.policy.log.slice(-4).join(" | ")}`);
    d.ack("end", t);
    for (; t < 2600; t += 16) d.frame({ nowMs: t, tap: TAP0, status: "thinking", childLevel: 0 }, rig);
    for (; t < 3600; t += 16) d.frame({ nowMs: t, tap: TAPV, status: "speaking", childLevel: 0 }, rig);
    assert.ok(d.policy.log.some((l) => l.includes("emote delight")), "it plays on her reply");
  });
  test("the page bus carries the ack phases to every live face", () => {
    const seen = [];
    const off = puppetBus.on((e) => { if (e.kind === "ack") seen.push(e.phase); });
    puppetBus.emit({ kind: "ack", phase: "start", at: 1 });
    puppetBus.emit({ kind: "ack", phase: "end", at: 2 });
    off();
    assert.deepEqual(seen, ["start", "end"]);
  });
});
