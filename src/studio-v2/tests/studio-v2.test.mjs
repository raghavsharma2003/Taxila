// Studio v2 node tests (RS-4 pre-work). Run: node --test src/studio-v2/tests/
// What is pinned: the client catalogue equals the spec registry; reviewed defaults validate untouched; a seeded fuzz of
// 300 mutated specs per engine never throws and ALWAYS yields a spec that passes the strict schema; outcome tags exist in
// data/curriculum and data/kits; grading uses the raw act only (a forged `correct` changes nothing); shared truths
// (circuit solver, number words, shadow geometry, ecosystem cascades, water plateaus, timeline compile) hold.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../../../shared/studio-spec.ts";
import { mutateSpec } from "../core/mutate.ts";
import { compileTimeline, valueAt, chunksOf } from "../core/timeline.ts";
import { sanitizeBoard } from "../core/board.ts";
import { ENGINES } from "../engines/index.ts";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const A = S.ARCHETYPES_V2;

test("catalogue: client engines == spec registry, ≥ 12 engines, the required mix", () => {
  assert.deepEqual(Object.keys(ENGINES).sort(), [...A].sort());
  assert.ok(A.length >= 12, `only ${A.length} engines`);
  const kinds = A.map((a) => S.ENGINE_SPECS[a].kind);
  assert.ok(kinds.filter((k) => k === "game").length >= 6, "≥ 6 real-time games");
  assert.ok(kinds.filter((k) => k === "explainer").length >= 4, "≥ 4 cinematic explainers");
  assert.ok(kinds.filter((k) => k === "simulation").length >= 2, "≥ 2 simulations");
});

test("reviewed defaults validate with zero repairs and pass their own strict schema as-is", () => {
  for (const a of A) {
    const p = S.ENGINE_SPECS[a].schema.safeParse(S.ENGINE_SPECS[a].defaultSpec);
    assert.ok(p.success, `${a} default fails its schema: ${JSON.stringify(p.error?.issues?.slice(0, 2))}`);
    const v = S.validateSpec(a, structuredClone(S.ENGINE_SPECS[a].defaultSpec));
    assert.equal(v.fellBack, false, a); assert.deepEqual(v.repairs, [], a);
  }
});

test("spec fuzz: 300 mutated specs per engine never throw and always pass the strict schema", () => {
  const summary = {};
  for (const a of A) {
    let repaired = 0, fellBack = 0, clean = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const m = mutateSpec(S.ENGINE_SPECS[a].defaultSpec, seed);
      const v = S.validateSpec(a, m.spec);
      const p = S.ENGINE_SPECS[a].schema.safeParse(v.spec);
      assert.ok(p.success, `${a} seed ${seed} (${m.kind}) produced an invalid spec: ${JSON.stringify(p.error?.issues?.slice(0, 2))}`);
      if (v.fellBack) fellBack++; else if (v.repairs.length) repaired++; else clean++;
    }
    summary[a] = { repaired, fellBack, clean };
  }
  // non-object inputs of every shape fall back to the reviewed default
  for (const a of A) for (const junk of [null, undefined, 42, "nope", "{\"truncated\":", [], [1, 2]]) { const v = S.validateSpec(a, junk); assert.equal(v.fellBack, true); }
  console.log("fuzz summary (n=300 each):", JSON.stringify(summary));
});

test("outcome tags exist in data/curriculum and data/kits; wave targets are tagged misconceptions", () => {
  const topics = new Set(), miscs = new Set();
  for (const f of fs.readdirSync(path.join(repo, "data/curriculum"))) {
    if (!/^c[4-7]-(maths|science|evs)\.json$/.test(f)) continue;
    for (const ch of JSON.parse(fs.readFileSync(path.join(repo, "data/curriculum", f), "utf8")).chapters) for (const t of ch.topics ?? []) topics.add(t.id);
  }
  for (const f of fs.readdirSync(path.join(repo, "data/kits"))) {
    if (!/^c[4-7]-(maths|science|evs)\.json$/.test(f)) continue;
    const j = JSON.parse(fs.readFileSync(path.join(repo, "data/kits", f), "utf8"));
    for (const t of j.topics ?? []) for (const m of t.misconceptions ?? []) miscs.add(m.id);
  }
  for (const a of A) {
    const d = S.ENGINE_SPECS[a];
    for (const t of d.outcomes.topics) assert.ok(topics.has(t), `${a}: unknown topic ${t}`);
    for (const m of d.outcomes.misconceptions) assert.ok(miscs.has(m), `${a}: unknown misconception ${m}`);
    for (const s of d.defaultSpec.skills) assert.ok(topics.has(s), `${a}: default skill ${s}`);
    const targets = JSON.stringify(d.defaultSpec).match(/"targets":"([^"]+)"/g) ?? [];
    for (const t of targets) { const id = t.slice(11, -1); assert.ok(d.outcomes.misconceptions.includes(id), `${a}: target ${id} not in outcomes`); }
  }
  assert.ok(!A.some((a) => S.ENGINE_SPECS[a].outcomes.topics.some((t) => t.startsWith("c7-science-ch06"))), "the adolescence chapter gets no generated piece (child-safety floor)");
});

test("grading: raw act only; a forged `correct` claim changes nothing", () => {
  const g = (a, id, v) => S.gradeAnswer(a, S.ENGINE_SPECS[a].defaultSpec, id, v);
  // Landfall
  assert.equal(g("catch-on-line@1", "w1:1/2", 0.5).verdict, "right");
  assert.equal(g("catch-on-line@1", "w1:1/2", 0.8).verdict, "wrong");
  assert.equal(g("catch-on-line@1", "w1:1/2", { value: 0.8, correct: true }).verdict, "wrong");
  assert.equal(g("catch-on-line@1", "w1:9/10", 0.9).verdict, "ungraded", "an item that is not in the spec grades nothing");
  // Circuit Lab: the host re-solves the circuit as built
  const preset = S.ENGINE_SPECS["circuit-bench@1"].defaultSpec.steps[0].preset.map((p) => ({ at: p.at, type: p.put, ...(p.plus ? { plus: p.plus } : {}) }));
  assert.equal(g("circuit-bench@1", "step:close", { edges: [...preset, { at: "1,1-2,1", type: "wire" }] }).verdict, "right");
  assert.equal(g("circuit-bench@1", "step:close", { edges: preset, correct: true }).verdict, "wrong", "an open loop is wrong whatever the frame claims");
  const loop = [...preset, { at: "1,1-2,1", type: "wire" }];
  assert.equal(g("circuit-bench@1", "step:switch", { edges: loop.map((e) => (e.at === "3,0-3,1" ? { at: e.at, type: "switch", closed: true } : e)) }).verdict, "right");
  assert.equal(g("circuit-bench@1", "step:switch", { edges: [...loop, { at: "3,0-4,0", type: "switch", closed: true }] }).verdict, "wrong", "a switch outside the loop switches nothing");
  const tested = g("circuit-bench@1", "step:test", { tested: ["coin", "pencil", "ruler", "eraser"] });
  assert.equal(tested.verdict, "right"); assert.equal(tested.truth.pencil, "conducts"); assert.equal(tested.truth.ruler, "blocks");
  assert.equal(g("circuit-bench@1", "step:test", { tested: ["coin", "nail", "ruler", "eraser"] }).verdict, "wrong", "pencil lead must be tested");
  // Moon
  assert.equal(g("orbital-explainer@1", "evening_half_moon", 88).verdict, "right");
  assert.equal(g("orbital-explainer@1", "evening_half_moon", 272).detail, "morning-half-moon");
  // Slice
  assert.equal(g("slice-at@1", "w1:0", 0.51).verdict, "right");
  assert.equal(g("slice-at@1", "w3:0", [0.333, 0.667]).verdict, "right");
  assert.equal(g("slice-at@1", "w3:0", [0.2, 0.667]).verdict, "wrong");
  // Runner
  assert.equal(g("line-runner@1", "r1:0", -3.2).verdict, "right");
  assert.equal(g("line-runner@1", "r2:1", 7).detail, "mirror-sign");
  // Plot
  assert.equal(g("area-claim@1", "r1", { w: 4, h: 3 }).verdict, "right");
  assert.equal(g("area-claim@1", "r3", { w: 4, h: 4 }).verdict, "right");
  assert.equal(g("area-claim@1", "r3", { w: 5, h: 3 }).verdict, "right", "5×3 also has perimeter 16");
  assert.equal(g("area-claim@1", "r3", { w: 4, h: 3 }).verdict, "wrong");
  assert.equal(g("area-claim@1", "r3", { w: 4, h: 4, correct: false }).verdict, "right", "a claim cannot fail a right act either");
  assert.equal(g("area-claim@1", "r5", { w: 5, h: 5 }).verdict, "right");
  assert.equal(g("area-claim@1", "r5", { w: 6, h: 4 }).verdict, "partial");
  // Vault: the host totals the columns; a dropped zero is named
  assert.equal(g("vault-heist@1", "r1", { counts: { 1: 2, 10: 5, 100: 1, 1000: 3 } }).verdict, "right");
  assert.equal(g("vault-heist@1", "r2", { counts: { 1: 0, 10: 5, 100: 4, 1000: 0 } }).detail, "c4-maths-ch04-t01-m-drop-zero");
  assert.equal(g("vault-heist@1", "r1", { counts: { 1: 2 }, total: 3152, correct: true }).verdict, "wrong");
  // Turret
  assert.equal(g("angle-cannon@1", "w1:2", 131).verdict, "right");
  assert.equal(g("angle-cannon@1", "w1:3", 150).detail, "c6-maths-ch02-t03-m-wrong-scale");
  assert.equal(g("angle-cannon@1", "w3:1", { fired: true }).verdict, "right");
  assert.equal(g("angle-cannon@1", "w3:0", { fired: true }).verdict, "wrong");
  // Forest
  assert.equal(g("food-web@1", "s2", { predict: "down" }).verdict, "right");
  assert.equal(g("food-web@1", "s3", { predict: "down" }).verdict, "right");
  const arrows = S.foodLinks(S.ENGINE_SPECS["food-web@1"].defaultSpec.species).map(([f, e]) => `${f}>${e}`);
  assert.equal(g("food-web@1", "s1", arrows).verdict, "right");
  assert.match(g("food-web@1", "s1", arrows.map((a) => a.split(">").reverse().join(">"))).detail, /^reversed:/);
  assert.equal(g("food-web@1", "s4", []).verdict, "wrong", "doing nothing through the drought loses species");
  const smart = [{ day: 25, species: "deer", kind: "cull" }, { day: 28, species: "deer", kind: "cull" }, { day: 30, species: "insects", kind: "add" }, { day: 33, species: "insects", kind: "add" }];
  assert.equal(g("food-web@1", "s4", smart).verdict, "right");
  // Phase shift: the host replays the control log
  const melt = { log: [{ t: 0, heat: 0, fan: 0, lid: 0 }, { t: 0.1, heat: 1, fan: 0, lid: 0 }], until: 20, from: 0 };
  assert.equal(g("phase-shift@1", "s1", melt).verdict, "right");
  assert.equal(g("phase-shift@1", "s1", { log: [], until: 20, from: 0, correct: true }).verdict, "wrong");
  assert.equal(g("phase-shift@1", "s3", { pick: "water vapour" }).verdict, "right");
  assert.equal(g("phase-shift@1", "s3", { pick: "air" }).verdict, "wrong");
  // Tilt
  assert.equal(g("balance-beam@1", "r1", { left: [], right: [{ w: 6, d: 1 }] }).verdict, "right");
  assert.equal(g("balance-beam@1", "r1", { left: [], right: [{ w: 2, d: 1 }] }).verdict, "wrong");
  assert.equal(g("balance-beam@1", "r1", { left: [], right: [{ w: 3, d: 2 }] }).detail, "weight-not-in-tray");
  assert.equal(g("balance-beam@1", "r4", { removedLeft: [{ w: 1, d: 2 }, { w: 1, d: 2 }, { w: 1, d: 2 }], removedRight: [{ w: 1, d: 2 }, { w: 1, d: 2 }, { w: 1, d: 2 }] }).verdict, "right");
  assert.equal(g("balance-beam@1", "r4", { removedLeft: [{ w: 1, d: 2 }], removedRight: [] }).detail, "c7-maths-ch15-t02-m-one-side");
  assert.equal(g("balance-beam@1", "r5", { left: [], right: [{ w: 500, d: 4 }, { w: 200, d: 4 }, { w: 200, d: 4 }, { w: 100, d: 4 }] }).verdict, "right");
  // Shadow
  assert.equal(g("shadow-play@1", "s1", { torchX: S.torchForFactor(2) }).verdict, "right");
  assert.equal(g("shadow-play@1", "s1", { torchX: S.torchForFactor(1.5) }).verdict, "wrong");
  const st = S.ENGINE_SPECS["shadow-play@1"].defaultSpec.steps[2], samples = [];
  for (let t = 0; t <= 6; t += 0.1) samples.push([+t.toFixed(2), S.torchForFactor(S.shadowBand(t, st.lo, st.hi).f)]);
  assert.equal(g("shadow-play@1", "s3", { samples }).verdict, "right");
  assert.equal(g("shadow-play@1", "s4", { sorted: { card: "opaque", tracing: "translucent", glass: "transparent", redcard: "opaque" } }).verdict, "right");
  // Explainers and the census
  assert.equal(g("water-cycle@1", "tap_vapour", { x: 300, y: 250 }).verdict, "right");
  assert.equal(g("water-cycle@1", "tap_vapour", { x: 715, y: 212 }).verdict, "wrong");
  assert.equal(g("scale-cinematic@1", "place_planet", { au: 1.7 }).verdict, "right");
  assert.equal(g("angle-sum@1", "third_angle", { angle: 55 }).verdict, "right");
  assert.equal(g("data-rush@1", "m1", 4).verdict, "right");
  assert.equal(g("data-rush@1", "mean", 6.1).verdict, "right");
  assert.equal(g("data-rush@1", "mean", 7).detail, "c7-maths-ch13-t02-m-mean-in-data");
});

test("shared truths", () => {
  // circuit: one cell (1.5 V, 0.4 Ω) + one 5 Ω bulb → I = 1.5 / 5.42 (+ wire resistance)
  const N = S.circuitNid;
  const loop = (cells) => [...cells, { a: N(0, 0), b: N(1, 0), comp: { type: "bulb" } }, { a: N(1, 0), b: N(1, 1), comp: { type: "wire" } }, { a: N(0, 1), b: N(1, 1), comp: { type: "wire" } }];
  const one = S.solveCircuit(loop([{ a: N(0, 0), b: N(0, 1), comp: { type: "cell", plus: N(0, 0) } }]));
  assert.ok(Math.abs(Math.abs(one.I[1]) - 1.5 / (5 + 0.4 + 0.04)) < 2e-3, `I = ${one.I[1]}`);
  const series = [{ a: N(0, 0), b: N(0, 1), comp: { type: "cell", plus: N(0, 0) } }];
  const two = S.solveCircuit([{ a: N(0, 0), b: N(1, 0), comp: { type: "bulb" } }, { a: N(1, 0), b: N(2, 0), comp: { type: "wire" } }, { a: N(2, 0), b: N(2, 1), comp: { type: "wire" } }, { a: N(1, 1), b: N(2, 1), comp: { type: "cell", plus: N(2, 1) } }, { a: N(0, 1), b: N(1, 1), comp: { type: "cell", plus: N(1, 1) } }, ...series.slice(1), { a: N(0, 0), b: N(0, 1), comp: { type: "wire" } }]);
  assert.ok(Math.abs(two.I[0]) > Math.abs(one.I[1]) * 1.7, "two cells in series aid");
  // number words
  assert.equal(S.numberWords(4050), "four thousand fifty");
  assert.equal(S.numberWords(7006), "seven thousand six");
  assert.equal(S.numberWords(205000), "two lakh five thousand");
  assert.equal(S.groupDigits(2050000), "20,50,000");
  assert.equal(S.groupDigits(2050000, "international"), "2,050,000");
  // shadow geometry inverse
  for (const f of [1.4, 2, 2.3]) assert.ok(Math.abs(S.shadowFactor(S.torchForFactor(f)) - f) < 1e-9);
  // ecosystem: the baseline stays near equilibrium; removals cascade the textbook way
  const all = S.SPECIES_IDS, base = S.ecoRun(all, 150), last = base[150].pop;
  for (const id of all) assert.ok(Math.abs(last[id] / S.ECO_EQ[id] - 1) < 0.08, `${id} drifted: ${last[id]}`);
  assert.equal(S.ecoTrend(all, "snake", "frog", 70), "up");
  assert.equal(S.ecoTrend(all, "snake", "insects", 70), "down");
  assert.equal(S.ecoTrend(all, "tiger", "deer", 70), "up");
  // water: the 0 °C plateau holds while ice remains; boiling holds 100 °C
  let w = S.waterInit(-12), plateau = 0;
  for (let i = 0; i < 60 * 40; i++) { w = S.waterStep(w, { heat: 1, fan: 0, lid: 0 }); if (w.ice > 0.02 && w.ice < 0.98) { assert.ok(Math.abs(w.T) < 1e-9, `T=${w.T} while melting`); plateau++; } if (w.liquid > 0.05 && w.liquid < 0.95 && w.T > 99) assert.ok(w.T <= 100 + 1e-9); }
  assert.ok(plateau > 60, "a visible plateau");
  // evaporation below boiling is faster with a fan and cools the water
  let a0 = S.waterInit(40), a1 = S.waterInit(40);
  for (let i = 0; i < 60 * 30; i++) { a0 = S.waterStep(a0, { heat: 0, fan: 0, lid: 0 }); a1 = S.waterStep(a1, { heat: 0, fan: 1, lid: 0 }); }
  assert.ok(a1.escaped + a1.vapour > 3 * (a0.escaped + a0.vapour)); assert.ok(a1.T < a0.T);
});

test("timeline: closed verbs, clause anchors with pre-roll, deterministic values", () => {
  const cfg = { init: { "x.a": 0, "orb": 0 }, showable: ["x"], labels: [], verbs: { orbit: { prop: "orb", key: "to" } } };
  const text = { L1: "One clause here. Two clause there." };
  const tl = compileTimeline([{ line: "L1", gap: 0.3, cues: [{ at: "s2", do: "show", target: "x", dur: 0.5 }, { at: 0, do: "explode" }, { at: "end", do: "orbit", to: 90, dur: 1 }, { at: "end", do: "interactive" }] }], text, {}, cfg);
  assert.ok(tl.repairs.includes("verb:explode"));
  const seg = tl.tracks["x.a"][0];
  const ch = chunksOf(S.estimateLine(text.L1));
  assert.ok(Math.abs(seg.t0 - (0.8 + ch.chunks[1].t0 - 0.4)) < 1e-9, "cue = line start + clause offset − 400 ms");
  assert.equal(valueAt(tl, cfg.init, "orb", 999), 90);
  assert.equal(valueAt(tl, cfg.init, "x.a", tl.tracks["x.a"][0].t0 - 0.01), 0);
  assert.equal(valueAt(tl, cfg.init, "x.a", 50), valueAt(tl, cfg.init, "x.a", 50), "state = f(t)");
});

test("board fallback sanitises anything and JSON schemas export for the planner", () => {
  const b = sanitizeBoard({ title: "<b>x</b>".repeat(20), lines: Array(9).fill("y".repeat(200)) }, "T");
  assert.ok(b.title.length <= 40 && !/[<>]/.test(b.title)); assert.equal(b.lines.length, 4); assert.ok(b.lines.every((l) => l.length <= 64));
  assert.equal(sanitizeBoard(null, "Fallback").title, "Fallback");
  for (const a of A) { const js = S.specJsonSchema(a); assert.ok(js && typeof js === "object" && js.type === "object", a); }
});

test("failure-shaped labels never reach the stage (fuzz seed 5: \"NaN\" as a unit label)", () => {
  for (const a of A) {
    const d = S.ENGINE_SPECS[a], keys = Object.keys(d.defaultSpec.strings ?? {});
    if (!keys.length) continue;
    for (const junk of ["NaN", "undefined", "null", "[object Object]", "Infinity sq"]) {
      const v = S.validateSpec(a, { ...d.defaultSpec, strings: { ...d.defaultSpec.strings, [keys[0]]: junk } });
      assert.equal(v.spec.strings[keys[0]], d.defaultSpec.strings[keys[0]], `${a} kept ${junk}`);
      assert.ok(d.schema.safeParse(v.spec).success);
    }
  }
});
