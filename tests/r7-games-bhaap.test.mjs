// r7 Games, Bhaap · processes of water and air (class 6-7 science): the pot heated and cooled through its states
// (c6-science-ch08-t01), water evaporating and condensing (-t02), convection on the beach and in a room (c7-science-ch07-t02),
// the water cycle and the ground (c7-science-ch07-t04). Nothing ever runs on a clock: the child runs each process a step at a
// time.
// Pure law checks: every generated level validates, solves and no idea-free play wins; an INDEPENDENT checker (its own
// reading of the kits' sentences: what happens at 0 °C and 100 °C, what condenses where, which way the breeze blows, what
// rises, where rain goes) agrees with every step the law takes over random play, and no water is ever made or destroyed;
// each mal-rule's acts land on its OWN misconception moment and fold the topic's kit id; every property the law uses is a
// kit sentence and every number on screen is the kit's; tampered params are refused; a claim never decides; first levels
// differ across children; the generator and picker are fast (CPU time); and every coverage entry serves a proven level
// through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bhaapLogic as L, BHAAP_MAL, BHAAP_MODES, GOALS_OF, KIT_OF, ITEM, ITEMS, BOIL_AT, MELT_AT, UNITS, COOK, FAR, avRow, bhRow, naRow, kaRow, baRow, kuRow, toolsOf, movesOf } from "../src/play/families/bhaap/bhaap.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { pickLevels } from "../src/play/core/pick.ts";
import { mulberry32 } from "../src/play/core/rng.ts";
import { counted } from "./_work.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const kitOf = (cls) => Object.fromEntries(JSON.parse(readFileSync(`${ROOT}data/kits/${cls}-science.json`, "utf8")).topics.map((t) => [t.topicId, t]));
const KITS = { ...kitOf("c6"), ...kitOf("c7") };
const TOPIC = { avastha: "c6-science-ch08-t01", bhaapan: "c6-science-ch08-t02", hawa: "c7-science-ch07-t02", chakra: "c7-science-ch07-t04" };
const ALL = Object.fromEntries(BHAAP_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "bhaap", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = Object.entries(GOALS_OF).flatMap(([mode, goals]) => goals.map((g) => [mode, g]));
const levelsOf = (mode, goal, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of L.generate(req(mode, goal, seed, { fade }))) out.push(c);
  return out;
};
const U = (m, at) => (at === undefined ? { kind: "use", m } : { kind: "use", m, at });

test("bhaap: the family is registered (FAMILIES, MODES, arts, logic, views, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("bhaap"));
  assert.deepEqual([...MODES.bhaap], ["avastha", "bhaapan", "hawa", "chakra"]);
  assert.deepEqual([...BHAAP_MODES], [...MODES.bhaap]);
  assert.equal(FAMILY_ARTS.bhaap.length, 4);
  const views = readFileSync(`${ROOT}src/play/families/views.ts`, "utf8"), data = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).bhaap;
  for (const m of BHAAP_MODES) {
    assert.equal(LOGIC[`bhaap/${m}`], L);
    assert.match(views, new RegExp(`"bhaap/${m}": makeBhaapView`));
    const v = playActOf("bhaap", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
    assert.doesNotMatch(`${v.hi} ${v.en}`, /chun|choose|pick/i);
    assert.ok(data?.[m]?.act && data[m].hi && data[m].en, `verbs.json bhaap/${m}`);
  }
});

test("bhaap: every property the law uses is a kit sentence; every number on screen is the kit's; the rest are scene values", () => {
  for (const [topic, sents] of Object.entries(KIT_OF)) {
    const T = JSON.stringify(KITS[topic]);
    assert.ok(T, topic);
    for (const [what, text] of Object.entries(sents)) assert.ok(T.includes(text), `${topic} ${what}: "${text}" is not in the kit`);
  }
  // the thermometer's two marks are the kit's two numbers
  const T1 = KITS["c6-science-ch08-t01"].expectations.join(" ");
  assert.match(T1, /melts into water at 0 °C/); assert.match(T1, /boils at about 100 °C/);
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words;
  assert.deepEqual(["mark.melt", "mark.boil"].map((k) => words[`bhaap.${k}`].en), ["0 °C", "100 °C"]);
  // no other bhaap word holds a digit: nothing else on screen states a number
  for (const [k, v] of Object.entries(words)) if (k.startsWith("bhaap.") && !k.startsWith("bhaap.mark.")) for (const l of ["hinglish", "en", "hi"]) assert.doesNotMatch(v[l].replace(/\{\w+\}/g, ""), /[0-9०-९]/, `${k} ${l}`);
  // every top-level numeric constant is a declared scene value, a thermometer notch, the boat's far place, or the picker's nudge
  const logic = readFileSync(`${ROOT}src/play/families/bhaap/bhaap.logic.ts`, "utf8"), lines = logic.split("\n");
  const consts = [...logic.matchAll(/^(?:export )?const ([A-Z_]+) = ([0-9.]+);/gm)].map((m) => m[1]).sort();
  assert.deepEqual(consts, ["BOIL_AT", "COOK", "FAR", "JITTER", "LAND_MAX", "LAND_STEP", "MELT_AT", "SEA_MAX", "SEA_STEP", "SLOTS", "UNITS", "VAP_MAX"]);
  for (const c of ["UNITS", "SLOTS", "COOK", "VAP_MAX"]) { const i = lines.findIndex((l) => new RegExp(`const ${c} = `).test(l)); assert.match(lines[i - 1], /scene value, no fact claimed/, c); }
  const steps = lines.findIndex((l) => /const LAND_STEP = /.test(l));
  assert.match(lines.slice(steps - 3, steps).join(" "), /scene values, no fact claimed/);
  assert.match(lines[lines.findIndex((l) => /const MELT_AT = /.test(l)) - 1], /0 °C mark.*100 °C mark/);
  // the land changes faster than the sea (the kit's "faster"), in the same direction
  assert.ok(2 > 1 && /LAND_STEP = 2;/.test(logic) && /SEA_STEP = 1;/.test(logic));
  const view = readFileSync(`${ROOT}src/play/families/bhaap/bhaap.view.ts`, "utf8");
  assert.match(view, /particle places are the level's own/);
});

for (const [mode, goal] of CASES) {
  test(`bhaap ${mode}/${goal}: every level validates, solves, is shortcut-free; mal-rules land on their own misconception`, () => {
    const cands = levelsOf(mode, goal), seen = new Set();
    assert.ok(cands.length >= 12, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = L.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.params.goal, goal);
      assert.equal(L.shortcut(level), null, `${c.signature} shortcut`);
      const sol = L.solve(level), done = run(level, sol);
      assert.ok(done.s.done && done.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(done.refused, [], `${c.signature} solver refused`);
      const g = L.grade(level, env(sol));
      assert.equal(g.verdict, "solved"); assert.ok(g.clean);
      for (const mal of BHAAP_MAL) {
        const acts = L.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const m = run(level, acts);
        assert.ok(!m.s.done, `${c.signature} ${mal} must not solve`);
        const mc = m.ms.filter((x) => x.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`); assert.equal(mc[0].misconceptionId, mal);
        const mg = L.grade(level, env(acts));
        assert.equal(mg.evidence[0].outcome, "incorrect"); assert.equal(mg.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    const want = { badlo: ["sugar-melts"], bachao: ["air-bubbles", "cloud-gas"], os: ["glass-leak"], wapas: ["glass-leak", "water-gone"], naav: ["day-landward"],
      kamra: ["cold-rises"], baadal: ["vapour-rains"], kuan: ["never-dry"] }[goal];
    assert.deepEqual([...seen].sort(), [...want].sort(), `${goal}: mal-rules shown`);
  });
}

// ───────────────────────────── THE INDEPENDENT CHECKER (its own reading of the kits; none of the law's helpers) ─────────────────────────────
// t01: ice melts at the 0 °C mark only when heated, water freezes there only when cooled, water boils at the 100 °C mark; the
// pot's water is never made, and it leaves only as vapour from an uncovered (or plate-covered) boiling pot. t02: water goes
// from the wet thing into the air and from the air into drops on a COLD thing only, and into the cup only from the drops;
// nothing is made or lost. c7 t02: the near-ground breeze blows from the cooler side to the warmer; by day both warm, at
// night both cool, the land by more. t04: a cloud comes only from risen vapour, rain only from a cloud; the ground's gaps
// fill by one a rain on open soil (two with the pit) and empty by one a pump, only while the table is above the well's bottom.
function checkStep(p, a, w0, w1, refused) {
  if (refused) { assert.deepEqual(w1, w0, "a refused act changes nothing"); return; }
  const g = p.goal;
  if (g === "badlo" || g === "bachao") {
    assert.ok(w1.units <= w0.units, "water is never made");
    assert.equal(w1.units + w1.lost, w0.units + w0.lost, "what leaves the pot is counted");
    if (w0.phase === "ice" && w1.phase === "water") assert.ok(a.m === "heat" && w0.pos === 1 && w1.pos === 1, "ice melts at the 0 °C mark, heated");
    if (w0.phase === "water" && w1.phase === "ice") assert.ok(a.m === "cool" && w0.pos === 1 && w1.pos === 1, "water freezes at the 0 °C mark, cooled");
    if (w1.lost > w0.lost) assert.ok(a.m === "heat" && w0.pos === 4 && w0.cover !== "lid", "water leaves only as vapour from an uncovered boil");
    if (w1.boils > w0.boils) assert.ok(w0.pos === 4 && w0.phase === "water", "boiling only at the 100 °C mark");
    if (w0.phase === "ice") assert.ok(w1.pos <= 1, "ice stays at or below the 0 °C mark");
    assert.ok(Math.abs(w1.pos - w0.pos) <= 1, "a notch at a time");
  }
  if (g === "os" || g === "wapas") {
    const tot = (w) => w.src + w.air + w.cup + w.bench.reduce((s, b) => s + b.drops, 0);
    assert.equal(tot(w1), tot(w0), "no water is made or destroyed");
    assert.ok(w0.src - w1.src <= 1, "one unit a wait evaporates");
    for (const b of w1.bench) if (b.what === "warmDrink") assert.equal(b.drops, 0, "no drop on a warm glass");
    if (w1.cup > w0.cup) assert.equal(a.m, "wipe");
  }
  if (g === "naav") {
    if (a.m === "wait") {
      const dl = w1.land - w0.land, ds = w1.sea - w0.sea;
      assert.ok(w0.day ? dl >= 0 && ds >= 0 : dl <= 0 && ds <= 0, "by day both warm, at night both cool");
      assert.ok(Math.abs(dl) >= Math.abs(ds), "the land changes faster than the sea");
    }
    if (a.m === "sail") {
      const from = w0.land > w0.sea ? "sea" : w0.land < w0.sea ? "land" : "";
      assert.ok(from, "no breeze, no sailing");
      assert.equal(w1.boat - w0.boat, from === "land" ? 1 : -1, "the boat goes with the breeze: out on a land breeze, in on a sea breeze");
    }
  }
  if (g === "baadal") {
    const tot = (w) => w.vap + w.cloud + w.field + w.flowed;
    if (a.m === "sun") assert.equal(tot(w1), tot(w0) + 1); else assert.equal(tot(w1), tot(w0), "only the sun takes water from the sea");
    if (w1.cloud > w0.cloud) assert.ok(a.m === "rise" && w0.vap > 0, "a cloud only from risen vapour");
    if (w1.field > w0.field) assert.ok(a.m === "rain" && w0.cloud > 0, "rain only from a cloud");
  }
  if (g === "kuan") {
    const r = kuRow(p);
    assert.ok(w1.filled <= r.cap);
    if (a.m === "rain") assert.equal(w1.filled, Math.min(r.cap, w0.filled + (w0.pit ? 2 : 1)), "open soil takes one; the pit takes the concrete's");
    if (a.m === "pump") { assert.ok(w0.filled > r.well, "the well gives water only above its bottom"); assert.equal(w1.filled, w0.filled - 1); }
  }
}

test("bhaap: random play — the checker agrees with every step the law takes, and no water is made or lost", () => {
  const rnd = mulberry32(2026);
  let accepted = 0;
  for (const [mode, goal] of CASES) for (const c of levelsOf(mode, goal, [5, 11])) {
    const level = L.validate(c.level), p = level.params;
    let s = L.init(level);
    for (let k = 0; k < 40 && !s.done; k++) {
      const moves = movesOf(p, s).filter((a) => a.kind !== "done" || rnd() < 0.15);
      const a = rnd() < 0.05 ? { kind: "undo" } : moves[Math.floor(rnd() * moves.length)];
      const r = L.apply(level, s, a, k + 1);
      if (a.kind !== "undo" && a.kind !== "done" && goal !== "kamra") { checkStep(p, a, s.w, r.state.w, r.refused); if (!r.refused) accepted++; }
      s = r.state;
    }
  }
  assert.ok(accepted > 400, `accepted acts ${accepted}`);
});

test("bhaap kamra: convection in the room — warm air never sinks, cool air never rises; the AC high cools, the heater low warms", () => {
  for (const c of levelsOf("hawa", "kamra")) {
    const level = L.validate(c.level), r = kaRow(level.params);
    for (const task of new Set(r.tasks)) {
      const dev = { cool: "ac", warm: "heater", clear: "exhaust" }[task];
      // reach the task (the solver's own acts up to it), then try both places
      const sol = L.solve(level), i = sol.findIndex((a) => a.kind === "put" && a.what === dev), pre = sol.slice(0, i);
      for (const at of [0, 1]) {
        let st = run(level, [...pre, { kind: "put", what: dev, at }]).s;
        for (let k = 0; k < 6; k++) st = L.apply(level, st, U("wait"), 1).state;
        const w = st.w, met = st.w.task > run(level, pre).s.w.task;
        if (task === "cool") assert.equal(met, at === 0, `${c.signature}: the AC ${at ? "low" : "high"}`), at === 1 && assert.equal(w.cells[0], 1, "the ceiling stays warm");
        if (task === "warm") assert.equal(met, at === 1, `${c.signature}: the heater ${at ? "low" : "high"}`), at === 0 && assert.equal(w.cells[2], -1, "the floor stays cool");
        if (task === "clear") assert.equal(met, at === 0, `${c.signature}: the exhaust ${at ? "low" : "high"}`);
      }
    }
  }
});

test("bhaap: the law's answers (the marks, the lid, the card, the bench, the breeze, the cloud, the ground)", () => {
  const lv = (mode, goal, row, fade) => { for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) { const c = L.generate(req(mode, goal, seed, { fade })).find((x) => x.level.params.row === row); if (c) return L.validate(c.level); } throw new Error(`no ${goal} row ${row}`); };
  // kulfi: heated to the 0 °C mark it melts there; cooled there it freezes; boiling it is off the card
  const kulfi = lv("avastha", "badlo", 0, 1);
  const k1 = run(kulfi, [U("heat"), U("heat")]);
  assert.equal(k1.s.w.phase, "water"); assert.equal(k1.s.w.pos, MELT_AT); assert.equal(k1.s.w.next, 1);
  assert.equal(run(kulfi, [U("heat"), U("heat"), U("cool")]).s.w.phase, "ice");
  const off = run(kulfi, [U("heat"), U("heat"), U("heat"), U("heat"), U("heat"), U("heat"), { kind: "done" }]);
  assert.equal(off.s.w.broke, "boil"); assert.deepEqual(off.refused, ["off_card"]);
  assert.deepEqual(run(kulfi, [U("cool")]).refused, ["coldest"]);
  // the cold lid keeps the boiled water; open, the level falls; the plate up in the cloud does not keep it
  const pot = lv("avastha", "bachao", 0, 1);
  const up = [U("heat"), U("heat")];
  assert.equal(run(pot, [...up, U("lid"), U("heat")]).s.w.units, UNITS);
  assert.equal(run(pot, [...up, U("heat")]).s.w.units, UNITS - 1);
  assert.equal(run(pot, [...up, U("plate"), U("heat")]).s.w.units, UNITS - 1);
  assert.ok(run(pot, [...up, U("lid"), U("heat"), { kind: "done" }]).s.done);
  // the bench: drops on the cold things only; the tissue takes them to the cup; two places
  const wap = lv("bhaapan", "wapas", 0, 1);
  const b = run(wap, [{ kind: "put", what: "cold", at: 0 }, { kind: "put", what: "warmDrink", at: 1 }, U("wait")]);
  assert.deepEqual(b.s.w.bench.map((x) => x.drops), [1, 0]);
  assert.deepEqual(run(wap, [{ kind: "put", what: "cold", at: 0 }, { kind: "put", what: "warmDrink", at: 1 }, { kind: "put", what: "coldDrink", at: 2 }]).refused, ["bench_full"]);
  assert.ok(run(wap, [{ kind: "put", what: "coldDrink", at: 0 }, U("wait"), U("wait"), U("wipe", 0), { kind: "done" }]).s.done, "a cold coloured drink gathers clear drops too");
  assert.ok(ITEMS.every((x) => typeof ITEM[x].cold === "boolean"));
  // the beach: calm at the start; by day the sea breeze, at night the land breeze; the boat goes with it
  const beach = lv("hawa", "naav", 0, 1);
  assert.deepEqual(run(beach, [U("sail")]).refused, ["calm"]);
  assert.deepEqual(run(beach, [U("wait"), U("sail")]).refused, ["ashore"]);
  const out = run(beach, [U("night"), U("wait"), U("sail"), U("sail")]);
  assert.equal(out.s.w.boat, FAR); assert.equal(out.s.w.trip, 1);
  // the cycle: no cloud from vapour that has not risen; rain from the cloud
  const sky = lv("chakra", "baadal", 0, 1);
  assert.deepEqual(run(sky, [U("rain")]).refused, ["no_cloud"]);
  assert.equal(run(sky, [U("sun"), U("rise"), U("rain")]).s.w.field, 1);
  // the ground: rain on concrete runs off unless the pit takes it in; a dry well gives nothing
  const gr = lv("chakra", "kuan", 0, 1);
  assert.equal(run(gr, [U("rain")]).s.w.filled, kuRow(gr.params).f0 + 1);
  assert.equal(run(gr, [U("pit"), U("rain")]).s.w.filled, kuRow(gr.params).f0 + 2);
  assert.deepEqual(run(gr, [U("pump")]).refused, ["dry"]);
  assert.equal(COOK, 3); assert.equal(BOIL_AT, 4);
  // undo steps back
  assert.equal(run(pot, [U("heat"), { kind: "undo" }]).s.w.pos, avRow(pot.params).pos);
});

test("bhaap: tampered params are refused; a claim in an act never decides; nothing is timed", () => {
  const level = L.generate(req("avastha", "badlo", 5, { fade: 2 }))[0].level;
  const p = level.params, bad = (patch, o = {}) => L.validate({ ...level, ...o, params: { ...p, ...patch } });
  assert.ok(L.validate(level));
  assert.equal(bad({ row: 99 }), null);
  assert.equal(bad({ row: 0 }), null, "a row of another look");
  assert.equal(bad({ scene: "nowhere" }), null);
  assert.equal(bad({ goal: "naav" }), null);
  assert.equal(bad({ look: 4 }), null);
  assert.equal(bad({ lay: -1 }), null);
  assert.equal(bad({ order: ["cold"] }), null);
  assert.equal(bad({}, { mode: "hawa" }), null);
  const wet = L.generate(req("bhaapan", "wapas", 5, { fade: 2 }))[0].level;
  assert.equal(L.validate({ ...wet, params: { ...wet.params, order: ["cold", "cold", "warmDrink"] } }), null);
  const forged = sanitizeActs([{ seq: 1, act: { kind: "done", correct: true, solved: true } }]);
  assert.ok(!("correct" in forged[0].act) && !("solved" in forged[0].act));
  assert.notEqual(L.grade(L.validate(level), forged).verdict, "solved");
  const logic = readFileSync(`${ROOT}src/play/families/bhaap/bhaap.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  const view = readFileSync(`${ROOT}src/play/families/bhaap/bhaap.view.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// ───────────────────────────── the play server ─────────────────────────────
const BH = () => coverage().entries.filter((e) => e.family === "bhaap");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("bhaap coverage: eight entries on the four topics, mapped to their kit misconceptions; no topic is without a game", () => {
  assert.deepEqual(BH().map((e) => `${e.topicId}|${e.mode}|${e.goal}|${e.skillIds.join(",")}`), [
    "c6-science-ch08-t01|avastha|badlo|c6-science-ch08-t01-s2,c6-science-ch08-t01-s3", "c6-science-ch08-t01|avastha|bachao|c6-science-ch08-t01-s3,c6-science-ch08-t01-s1",
    "c6-science-ch08-t02|bhaapan|os|c6-science-ch08-t02-s2", "c6-science-ch08-t02|bhaapan|wapas|c6-science-ch08-t02-s3,c6-science-ch08-t02-s1",
    "c7-science-ch07-t02|hawa|naav|c7-science-ch07-t02-s3", "c7-science-ch07-t02|hawa|kamra|c7-science-ch07-t02-s4,c7-science-ch07-t02-s1",
    "c7-science-ch07-t04|chakra|baadal|c7-science-ch07-t04-s1", "c7-science-ch07-t04|chakra|kuan|c7-science-ch07-t04-s2,c7-science-ch07-t04-s3"]);
  const m = (t, n) => `${t}-m${n}`, [A, B, C, D] = Object.values(TOPIC);
  assert.deepEqual(BH().map((e) => e.misMap), [
    { "sugar-melts": m(A, 3) }, { "air-bubbles": m(A, 1), "cloud-gas": m(A, 2) }, { "glass-leak": m(B, 1) }, { "glass-leak": m(B, 1), "water-gone": m(B, 3) },
    { "day-landward": m(C, 2) }, { "cold-rises": m(C, 3) }, { "vapour-rains": m(D, 3) }, { "never-dry": m(D, 2) }]);
  // every mapped kit id is a real misconception of its topic, and its belief is the one the mal-rule plays
  for (const e of BH()) for (const kit of Object.values(e.misMap)) assert.ok(KITS[e.topicId].misconceptions.some((x) => x.id === kit), kit);
  for (const [topic, skills] of [[A, ["s2", "s3", "s1"]], [B, ["s2", "s3", "s1"]], [C, ["s3", "s4", "s1"]], [D, ["s1", "s2", "s3"]]]) {
    for (const s of skills) assert.ok(hasPlay(`${topic}-${s}`), `${topic}-${s}`);
    assert.equal(entryFor({ skillId: `${topic}-${skills[0]}` }).family, "bhaap");
  }
  const backlog = readFileSync(`${ROOT}docs/design/round7/games/law-backlog.md`, "utf8");
  for (const t of Object.values(TOPIC)) assert.doesNotMatch(backlog, new RegExp(t));
  // the factors of evaporation stay kyun-lab's
  assert.ok(coverage().entries.some((e) => e.topicId === "c6-science-ch08-t03" && e.family === "kyun-lab"));
  assert.ok(!BH().some((e) => e.topicId === "c6-science-ch08-t03"));
});

for (const e of BH()) for (const fade of [1, 2, 3]) {
  test(`bhaap server ${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3", "c4", "c5", "c6"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e, "Zoya");
      assert.ok(cur && cur.family === "bhaap" && cur.mode === e.mode && cur.params.goal === e.goal);
      assert.ok(L.validate(cur), "the served level validates");
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.look, fade);
      const g = gradeActs(level, env(L.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "done", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && L.malActs(level, m));
        const mg = gradeActs(level, env(L.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      assert.ok(level.proof.discriminates.length > 0, "a level that can show a belief is served");
      assert.ok(hiddenOf(level).length > 0, "hidden values");
    }
  });
}

// r7 (main, 2026-11-08): the picker is deterministic (base − 2.2·|p − band|), so without the seeded difficulty nudge one
// level would be every child's first level
test("bhaap: the first level served differs across children", () => {
  for (const e of BH()) for (const fade of [1, 3]) {
    const sigs = new Set();
    for (let c = 0; c < 20; c++) {
      const child = `var-${c}`, lv = currentLevel(sessionOf(e, { childId: child, fade, seed: seedOf(child, entryKey(e), 0) }), e);
      sigs.add(lv.sig);
    }
    assert.ok(sigs.size >= 3, `${e.goal} fade ${fade}: ${sigs.size} distinct first levels over 20 children`);
  }
});

test("bhaap: the generator's and the picker's work is bounded (counted, not timed)", () => {
  // measured 2026-11-10 over every case below: at most 7 candidates and 165 calls into the family logic per pick; bounds are 3x above that. A count is the same on every machine; a
  // 50 ms p95 read 5 ms idle and 110 ms under the gate's load (tests/_work.mjs).
  const gen = [], calls = [], considered = [], counter = counted(L);
  for (const [mode, goal] of CASES) for (const fade of [1, 2, 3]) for (let seed = 1; seed <= 6; seed++) {
    gen.push(L.generate(req(mode, goal, seed * 31, { fade })).length);
    counter.reset(); const picked = pickLevels(counter.logic, req(mode, goal, seed * 31, { fade })); assert.ok(picked); calls.push(counter.calls()); considered.push(picked.considered);
  }
  assert.ok(Math.max(...gen) <= 21, `generate made ${Math.max(...gen)} candidates`);
  assert.ok(Math.max(...considered) <= 21, `pick considered ${Math.max(...considered)}`);
  assert.ok(Math.max(...calls) <= 500, `pick made ${Math.max(...calls)} calls into the family logic`);
});

test("bhaap: every word the view shows exists in all three languages; vakya's words stay last; no economy word", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/bhaap/bhaap.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(bhaap\.[a-zA-Z0-9._-]+)"/g)].map((m) => m[1]);
  const prefixes = [...view.matchAll(/W\(`(bhaap\.[a-zA-Z0-9._-]+)\$\{/g)].map((m) => m[1]);
  assert.ok(prefixes.length >= 10, `template keys ${prefixes.length}`);
  const logic = readFileSync(`${ROOT}src/play/families/bhaap/bhaap.logic.ts`, "utf8");
  const whys = new Set([...logic.matchAll(/no\("([a-z_]+)"/g), ...logic.matchAll(/why: "([a-z_]+)"/g)].map((m) => m[1]));
  const tools = new Set(CASES.flatMap(([mode, goal]) => levelsOf(mode, goal, [1]).flatMap((c) => toolsOf(c.level.params))));
  const dyn = [
    ...["melt", "freeze", "boil", "condense", "dissolve"].flatMap((x) => [`change.${x}`, `changed.${x}`]), "changed.none",
    ...[...tools, "ac", "heater", "exhaust"].map((t) => `tool.${t}`), ...[...whys].map((x) => `why.${x}`),
    ...CASES.map(([, g]) => `done.${g}`), "goal.badlo", "goal.badlo.end", "goal.bachao", "goal.os", "goal.wapas", "goal.naav.out", "goal.naav.back",
    "goal.kamra.cool", "goal.kamra.warm", "goal.kamra.clear", "goal.baadal", "goal.baadal.flow", "goal.kuan",
    "trip.out", "trip.back", "task.cool", "task.warm", "task.clear", ...["nimbu", "monsoon", "bathroom", "dew"].map((x) => `air.${x}`),
    ...ITEMS.flatMap((x) => [`item.${x}`, `fridge.${x}`]), "dev.ac", "dev.heater", "dev.exhaust", "time.day", "time.night",
  ].map((k) => `bhaap.${k}`);
  assert.ok(used.length >= 20, `literal keys ${used.length}`);
  for (const pre of prefixes) assert.ok(dyn.some((k) => k.startsWith(pre)), `no word under ${pre}`);
  for (const k of [...used, ...dyn]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const ECON = /\b(points?|coins?|gems?|streaks?|lives|life left|rewards?|leaderboard|rank(ing)?|xp|level up|bonus|jackpot|loot|unlock(ed)?|hurry|jaldi|time'?s up|game over)\b/i;
  for (const [k, v] of Object.entries(words)) if (k.startsWith("bhaap.")) for (const l of ["hinglish", "en", "hi"]) assert.doesNotMatch(v[l], ECON, `${k} ${l}`);
  // the contexts drawn are the kits' interest contexts or their items' (never a fact)
  for (const r of [avRow, bhRow, naRow, kaRow, baRow, kuRow]) assert.equal(typeof r, "function");
});
