// r7 Games, Guna · multi-digit multiplication and division (a field cut into place-value pieces and a truck that must weigh
// exactly the product; a field rounded for an estimate; a godown shared round by round into equal trucks, a crate opened
// when it cannot go round; stories whose leftover decides: round up, round down, the leftover itself). Pure law checks:
// every generated level validates, its solver solves it, no idea-free set-up wins (shortcut null); an INDEPENDENT checker
// (plain arithmetic: a * b, Math.floor(a / b), a % b, Math.ceil; its own copy of the set-up fed every act the law accepted;
// none of the law's helpers) agrees with the law over random play; each mal-rule's acts land on its OWN misconception
// moment; tampered params are refused; a claim in an act never decides; the generator is fast; and every coverage entry
// serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunaLogic, GUNA_MAL, malSetup, racksOf, RACKS, docketText } from "../src/play/families/guna/guna.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";

const ROOT = new URL("../", import.meta.url).pathname;
const ALL = Object.fromEntries(GUNA_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "guna", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 4, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = gunaLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = gunaLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = [
  ["field", "area", { shapes: ["2x1"] }],
  ["field", "area", { shapes: ["2x10", "2xT"] }],
  ["field", "area", { shapes: ["3x1"] }],
  ["field", "area", { shapes: ["2x2", "2xT"] }],
  ["field", "area", { shapes: ["RxR", "2xH"] }],
  ["field", "round", {}],
  ["pack", "share", { sizes: [2] }],
  ["pack", "share", { sizes: [3] }],
  ["story", "all", { cap: [3, 9], q: [3, 30] }],
  ["story", "full", { cap: [12, 50], q: [3, 40] }],
  ["story", "full", { cap: [3, 12], q: [2, 20] }],
  ["story", "left", { cap: [3, 12], q: [2, 20] }],
  // r7 guna2: class 7 big round × round and big estimates; class 5 checking an answer by its estimate; class 4 sharing,
  // grouping and the leftover at small numbers
  ["field", "area", { shapes: ["BIG"] }],
  ["field", "round", { big: true }],
  ["field", "check", {}],
  ["pack", "each", { cap: [2, 6], q: [2, 9] }],
  ["story", "full", { cap: [3, 9], q: [2, 9] }],
  ["story", "all", { cap: [3, 9], q: [2, 9] }],
  // r7 place2: place value on the yard's truck (class 4 numbers up to 9999; class 7 lakhs and crores; Indian commas)
  ["yard", "build", { forms: ["named", "expanded", "numeral"] }],
  ["yard", "build", { big: true, forms: ["named", "intl"] }],
  ["yard", "commas", {}],
];
const EXPECT = { "2x1": ["ones-only", "no-carry", "forget-carry"], "2x10,2xT": ["adds-ten", "no-zero", "forget-carry"], "3x1": [], "2x2,2xT": ["no-zero", "diagonal", "forget-carry"],
  "RxR,2xH": ["zero-count"], round: ["zero-count"], share: ["digitwise", "short"], all: ["drop"], full: ["up", "short"], left: ["quotient"],
  BIG: ["zero-count", "zero-less", "zero-more"], roundbig: ["zero-count", "zero-less", "zero-more"], check: ["trusts", "must-equal"], each: ["short"],
  build: ["concat", "drop-zero"], buildbig: ["drop-zero", "crore-million"], commas: ["intl-commas"] };
const expectOf = (goal, g) => EXPECT[g.shapes ? g.shapes.join(",") : g.big ? `${goal === "build" ? "build" : "round"}big` : goal];
const levelsOf = (mode, goal, grammar, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of gunaLogic.generate(req(mode, goal, seed, { grammar, fade }))) out.push(c);
  return out;
};

// ───────────────────────────── THE INDEPENDENT CHECKER (plain arithmetic, none of the law's code) ─────────────────────────────
/** the nearest round length at a side's leading place, by plain string reading (48 → 50, 348 → 300) */
const nearestRound = (x) => { const u = 10 ** (String(x).length - 1); return Math.floor(x / u + 0.5) * u; };
const crateValue = (crates) => crates.reduce((s, c, i) => s + c * 10 ** i, 0);
/** check: the dockets as the task states them (the product, ten times it, a tenth of it), in the order ctx names */
const ORDERS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
const claimsOf = (p) => ORDERS[p.ctx].map((i) => [p.a * p.b, p.a * p.b * 10, Math.floor((p.a * p.b) / 10)][i]);
const roundDown = (x) => { const u = 10 ** (String(x).length - 1); return Math.floor(x / u) * u; };
const roundUp = (x) => { const u = 10 ** (String(x).length - 1); return Math.ceil(x / u) * u; };
/** build: the number a docket names, read by plain arithmetic from the words the child is shown (crore, lakh, thousand,
 *  hundred, million; an expanded form's terms added) */
const UNIT = { crore: 1e7, lakh: 1e5, thousand: 1e3, hundred: 100, million: 1e6 };
function readDocket(text) {
  if (text.includes("+")) return text.split("+").reduce((s, t) => s + Number(t.trim()), 0);
  let total = 0, pending = 0;
  for (const tok of text.split(" ")) { if (UNIT[tok]) { total += pending * UNIT[tok]; pending = 0; } else pending = Number(tok); }
  return total + pending;
}
/** commas: the number written with commas left of the given places */
const written = (n, posts) => [...String(n)].map((ch, i, all) => (i > 0 && posts.includes(all.length - i) ? `,${ch}` : ch)).join("");
/** the checker's own copy of the set-up, fed every act the law accepted (undo pops its own stack) */
function checker(p) {
  const places = (x) => String(x).split("").reverse().map(Number);
  const racks = p.goal === "build" || p.goal === "commas" ? p.b
    : p.goal === "round" || p.goal === "check" ? String(nearestRound(p.a)).length + String(nearestRound(p.b)).length : String(p.a).length + String(p.b).length;
  const st = { crates: p.goal === "commas" ? places(p.a) : new Array(racks).fill(0), ra: 0, rb: 0, dock: p.goal === "share" ? places(p.a) : p.goal === "each" ? [p.a] : [], given: 0, n: 0, marks: [0, 0, 0], posts: [] }, stack = [];
  return {
    st,
    feed(a) {
      if (a.kind === "run") return;
      if (a.kind === "undo") { if (stack.length) Object.assign(st, stack.pop()); return; }
      stack.push(JSON.parse(JSON.stringify(st)));
      if (a.kind === "crate") st.crates[a.place] += a.by;
      if (a.kind === "round") { if (a.side === 0) st.ra = a.to; else st.rb = a.to; }
      if (a.kind === "open") { st.dock[a.place] -= 1; st.dock[a.place - 1] += 10; }
      if (a.kind === "deal") { st.dock[a.place] -= p.b; st.given += 10 ** a.place; }
      if (a.kind === "count") st.n = a.n;
      if (a.kind === "stamp") st.marks[a.i] = a.to;
      if (a.kind === "post") st.posts = st.posts.includes(a.at) ? st.posts.filter((k) => k !== a.at) : [...st.posts, a.at];
    },
  };
}
/** does this set-up meet the task? read from the params' plain meaning */
function verdict(p, st) {
  if (p.goal === "area") return crateValue(st.crates) === p.a * p.b;
  if (p.goal === "build") return crateValue(st.crates) === readDocket(docketText(p));
  if (p.goal === "commas") return written(p.a, st.posts) === p.a.toLocaleString("en-IN");
  if (p.goal === "round") return st.ra === nearestRound(p.a) && st.rb === nearestRound(p.b) && crateValue(st.crates) === nearestRound(p.a) * nearestRound(p.b);
  if (p.goal === "check") {
    // reasonable = inside the band the rounded sides allow (both down … both up); the estimate built first
    const lo = roundDown(p.a) * roundDown(p.b), hi = roundUp(p.a) * roundUp(p.b), est = nearestRound(p.a) * nearestRound(p.b);
    return st.ra === nearestRound(p.a) && st.rb === nearestRound(p.b) && crateValue(st.crates) === est && claimsOf(p).every((v, i) => st.marks[i] === (v >= lo && v <= hi ? 1 : 2));
  }
  if (p.goal === "share" || p.goal === "each") { const left = crateValue(st.dock); return left === p.a % p.b && st.given === Math.floor(p.a / p.b) && left + st.given * p.b === p.a; }
  if (p.goal === "all") return st.n * p.b >= p.a && (st.n - 1) * p.b < p.a;
  if (p.goal === "full") return st.n * p.b <= p.a && p.a - st.n * p.b < p.b;
  return st.n === p.a % p.b;
}
const replayCheck = (level, acts) => { const k = checker(level.params); let s = gunaLogic.init(level); for (const a of acts) { const r = gunaLogic.apply(level, s, a, 1); if (!r.refused || r.refused === "missed") k.feed(a); s = r.state; } return { s, ok: verdict(level.params, k.st) }; };

test("guna: the family is registered (FAMILIES, MODES, arts, logic for every mode, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("guna"));
  assert.deepEqual([...MODES.guna], ["field", "pack", "story", "yard"]);
  assert.ok(FAMILY_ARTS.guna.length === 4);
  for (const m of MODES.guna) {
    assert.equal(LOGIC[`guna/${m}`], gunaLogic);
    const v = playActOf("guna", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
  }
});

for (const [mode, goal, grammar] of CASES) {
  test(`guna/${mode}/${goal} ${JSON.stringify(grammar)}: every level validates, solves, is shortcut-free; each mal-rule lands on its own misconception`, () => {
    const seen = new Set(), cands = levelsOf(mode, goal, grammar);
    assert.ok(cands.length > 30, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = gunaLogic.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, mode); assert.equal(level.params.goal, goal);
      assert.equal(gunaLogic.shortcut(level), null, `${c.signature} shortcut`);
      const sol = gunaLogic.solve(level);
      const solved = run(level, sol);
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.ok(replayCheck(level, sol).ok, `${c.signature}: the checker disagrees with the solver`);
      for (const mal of GUNA_MAL) {
        const acts = gunaLogic.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: set up legally, then missed`);
        assert.ok(!r.s.done && !replayCheck(level, acts).ok, `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal);
        const g = gunaLogic.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    for (const m of expectOf(goal, grammar)) assert.ok(seen.has(m), `${mode}/${goal}: mal-rule ${m} never discriminated`);
  });
}

test("guna: mal-rule signatures are the beliefs (+10 for ×10, the tens digit brought down, products side by side, the carry lost, the zero lost, tens×tens + ones×ones, a zero miscounted, places shared alone, a round short, the leftover dropped, always one more, the packets for the leftover)", () => {
  const T = (x) => Math.floor(x / 10), O = (x) => x % 10;
  for (const c of levelsOf("field", "area", { shapes: ["2x1", "2x10", "2xT", "2x2"] })) {
    const { a, b } = gunaLogic.validate(c.level).params;
    const at = malSetup({ goal: "area", face: 1, a, b, ctx: 0 }, "adds-ten"); if (at) { assert.equal(b, 10); assert.equal(at.load, a + 10); }
    const oo = malSetup({ goal: "area", face: 1, a, b, ctx: 0 }, "ones-only"); if (oo) assert.equal(String(oo.load), `${T(a)}${O(a) * b}`);
    const nc = malSetup({ goal: "area", face: 1, a, b, ctx: 0 }, "no-carry"); if (nc) assert.equal(String(nc.load), `${T(a) * b}${O(a) * b}`);
    const fc = malSetup({ goal: "area", face: 1, a, b, ctx: 0 }, "forget-carry");
    if (fc) { const d = Number(String(b)[0]), z = b / d; assert.equal(fc.load, (T(a) * d * 10 + ((O(a) * d) % 10)) * z); }
    const nz = malSetup({ goal: "area", face: 1, a, b, ctx: 0 }, "no-zero"); if (nz) assert.equal(nz.load, a * O(b) + a * T(b));
    const dg = malSetup({ goal: "area", face: 1, a, b, ctx: 0 }, "diagonal"); if (dg) assert.equal(dg.load, T(a) * T(b) * 100 + O(a) * O(b));
  }
  for (const c of [...levelsOf("field", "area", { shapes: ["RxR"] }), ...levelsOf("field", "round", {})]) {
    const p = gunaLogic.validate(c.level).params, zc = malSetup(p, "zero-count");
    if (!zc) continue;
    const x = p.goal === "round" ? nearestRound(p.a) : p.a, y = p.goal === "round" ? nearestRound(p.b) : p.b;
    assert.equal(zc.load * 10, x * y);
    assert.equal((Number(String(x)[0]) * Number(String(y)[0])) % 10, 0, "only where the basic fact ends in 0");
  }
  for (const c of [...levelsOf("field", "area", { shapes: ["BIG"] }), ...levelsOf("field", "round", { big: true })]) {
    const p = gunaLogic.validate(c.level).params, x = p.goal === "round" ? nearestRound(p.a) : p.a, y = p.goal === "round" ? nearestRound(p.b) : p.b;
    const fact = Number(String(x)[0]) * Number(String(y)[0]);
    const zl = malSetup(p, "zero-less"); if (zl) { assert.equal(zl.load * 10, x * y); assert.notEqual(fact % 10, 0, "zero-less only where the fact keeps no zero of its own"); }
    const zm = malSetup(p, "zero-more"); if (zm) assert.equal(zm.load, x * y * 10);
  }
  for (const c of levelsOf("field", "check", {})) {
    const p = gunaLogic.validate(c.level).params;
    assert.deepEqual(malSetup(p, "trusts").marks, [1, 1, 1]); assert.deepEqual(malSetup(p, "must-equal").marks, [2, 2, 2]);
    assert.ok(claimsOf(p).every((v) => v !== nearestRound(p.a) * nearestRound(p.b)), "no docket is the estimate itself");
  }
  for (const c of levelsOf("pack", "each", {})) {
    const p = gunaLogic.validate(c.level).params, sh = malSetup(p, "short");
    assert.deepEqual(sh.dock, [(p.a % p.b) + p.b], "a round less than can go: the leftover a share or more");
  }
  for (const c of levelsOf("pack", "share", { sizes: [2, 3] })) {
    const p = gunaLogic.validate(c.level).params;
    const dw = malSetup(p, "digitwise");
    // each digit shared on its own: what is left of each place stays where it is
    assert.deepEqual(dw.dock, String(p.a).split("").reverse().map((d) => Number(d) % p.b));
    const sh = malSetup(p, "short"); if (sh) assert.deepEqual(sh.dock.reduce((s, c2, i) => s + c2 * 10 ** i, 0), (p.a % p.b) + p.b);
  }
  for (const [goal, mal, f] of [["all", "drop", (a, b) => Math.floor(a / b)], ["full", "up", (a, b) => Math.ceil(a / b)], ["full", "short", (a, b) => Math.floor(a / b) - 1], ["left", "quotient", (a, b) => Math.floor(a / b)]]) {
    for (const c of levelsOf("story", goal, {})) { const p = gunaLogic.validate(c.level).params, m = malSetup(p, mal); if (m) assert.equal(m.n, f(p.a, p.b), `${goal} ${mal}`); }
  }
});

test("guna: no idea-free set-up wins (a + b on the truck, both sides rounded the same way, the trucks sent at once or every place shared without opening, one vehicle, the jar empty)", () => {
  for (const [mode, goal, grammar] of CASES) for (const c of levelsOf(mode, goal, grammar, [3, 5])) {
    const level = gunaLogic.validate(c.level), p = level.params;
    if (goal === "area") {
      const cuts = gunaLogic.solve(level).filter((a) => a.kind === "cut");
      const load = (v) => String(v).split("").reverse().flatMap((d, place) => Array.from({ length: Number(d) }, () => ({ kind: "crate", place, by: 1 })));
      if (String(p.a + p.b).length <= String(p.a).length + String(p.b).length) assert.ok(!replayCheck(level, [...cuts, ...load(p.a + p.b), { kind: "run" }]).ok, `${c.signature}: a + b wins`);
    }
    if (goal === "share" || goal === "each") { assert.ok(!run(level, [{ kind: "run" }]).s.done, `${c.signature}: sent at once`); }
    if (goal === "check") for (const m of [1, 2]) {
      const sol = gunaLogic.solve(level).filter((a) => a.kind !== "stamp" && a.kind !== "run");
      assert.ok(!replayCheck(level, [...sol, ...[0, 1, 2].map((i) => ({ kind: "stamp", i, to: m })), { kind: "run" }]).ok, `${c.signature}: every docket ${m}`);
    }
    if (goal === "all" || goal === "full") assert.ok(!run(level, [{ kind: "count", n: 1 }, { kind: "run" }]).s.done || Math.ceil(p.a / p.b) === 1);
    if (goal === "left") assert.ok(!run(level, [{ kind: "run" }]).s.done, `${c.signature}: an empty jar wins`);
  }
});

test("guna: the law's rules (a cut toggles; only a tiled field drives; racks hold nine; a deal goes to every truck or none; a crate opens into ten; run needs a set-up; a change starts a fresh run)", () => {
  const area = gunaLogic.validate(gunaLogic.generate(req("field", "area", 11, { grammar: { shapes: ["2x2"] } }))[0].level), A = area.params;
  let s = gunaLogic.init(area);
  const ap = (lv, a) => { const r = gunaLogic.apply(lv, s, a, 1); s = r.state; return r.refused; };
  assert.equal(ap(area, { kind: "crate", place: 0, by: 1 }), undefined);
  assert.equal(ap(area, { kind: "run" }), "cut_first", "an uncut field has bare pieces: the truck cannot drive");
  const ta = Math.floor(A.a / 10) * 10, tb = Math.floor(A.b / 10) * 10;
  ap(area, { kind: "cut", side: 0, at: ta }); ap(area, { kind: "cut", side: 0, at: 1 });
  assert.deepEqual(s.cx, [1, ta].sort((x, y) => x - y));
  ap(area, { kind: "cut", side: 0, at: 1 }); assert.deepEqual(s.cx, [ta], "a cut laid again is lifted");
  ap(area, { kind: "cut", side: 1, at: tb });
  for (const bad of [{ kind: "cut", side: 2, at: 3 }, { kind: "cut", side: 0, at: 0 }, { kind: "cut", side: 0, at: A.a }, { kind: "cut", side: 1, at: 2.5 }]) assert.equal(ap(area, bad), "bad_cut");
  ap(area, { kind: "crate", place: 0, by: -1 });
  assert.equal(ap(area, { kind: "crate", place: 0, by: -1 }), "rack_empty");
  for (let i = 0; i < 9; i++) ap(area, { kind: "crate", place: 1, by: 1 });
  assert.equal(ap(area, { kind: "crate", place: 1, by: 1 }), "rack_full", "nine crates to a rack: ten are packed as one of the next place");
  assert.equal(ap(area, { kind: "crate", place: 9, by: 1 }), "bad_crate");
  for (const bad of [{ kind: "deal", place: 0 }, { kind: "open", place: 1 }]) assert.equal(ap(area, bad), "no_godown");
  assert.equal(ap(area, { kind: "count", n: 3 }), "no_count");
  assert.equal(ap(area, { kind: "round", side: 0, to: 40 }), "no_round");
  ap(area, { kind: "run" });
  assert.ok(s.ended && !s.done);
  assert.equal(ap(area, { kind: "run" }), "change_first");
  ap(area, { kind: "crate", place: 1, by: -1 });
  assert.ok(!s.ended, "a change starts a fresh run");

  const share = gunaLogic.validate(gunaLogic.generate(req("pack", "share", 4, { grammar: { sizes: [3] } }))[0].level), P = share.params;
  s = gunaLogic.init(share);
  const top = String(P.a).length - 1;
  assert.deepEqual(s.dock, String(P.a).split("").reverse().map(Number));
  assert.equal(ap(share, { kind: "open", place: 0 }), "ones_stay");
  ap(share, { kind: "open", place: top });
  assert.equal(s.dock[top], Number(String(P.a)[0]) - 1); assert.equal(s.dock[top - 1], Number(String(P.a)[1]) + 10, "a crate opens into ten of the next place");
  const before = s.dock[0];
  if (before < P.b) assert.equal(ap(share, { kind: "deal", place: 0 }), "not_round", "a deal goes to every truck or none");
  s = gunaLogic.init(share);
  for (const a of gunaLogic.solve(share)) assert.equal(ap(share, a), undefined);
  assert.ok(s.done); assert.equal(s.truck.reduce((x, c, i) => x + c * 10 ** i, 0), Math.floor(P.a / P.b)); assert.equal(s.dock.reduce((x, c, i) => x + c * 10 ** i, 0), P.a % P.b);
  assert.deepEqual(hiddenOf(share), [String(Math.floor(P.a / P.b)), ...(P.a % P.b ? [String(P.a % P.b)] : [])], "the teacher never says the share or the leftover first");

  const all = gunaLogic.validate(gunaLogic.generate(req("story", "all", 4, { grammar: { cap: [3, 9], q: [3, 30] } }))[0].level);
  s = gunaLogic.init(all);
  assert.equal(ap(all, { kind: "run" }), "count_first");
  assert.equal(ap(all, { kind: "count", n: 100 }), "bad_count");
  ap(all, { kind: "count", n: Math.ceil(all.params.a / all.params.b) });
  assert.equal(ap(all, { kind: "count", n: Math.ceil(all.params.a / all.params.b) }), "same_count");
  assert.equal(ap(all, { kind: "run" }), undefined); assert.ok(s.done);
  assert.equal(ap(all, { kind: "count", n: 3 }), "level_over");
  const round = gunaLogic.validate(gunaLogic.generate(req("field", "round", 4))[0].level), R = round.params;
  s = gunaLogic.init(round);
  const u = 10 ** (String(R.a).length - 1);
  assert.equal(ap(round, { kind: "round", side: 0, to: Math.floor(R.a / u) * u - u }), "bad_round", "only the round lengths either side");
  assert.equal(ap(round, { kind: "round", side: 0, to: R.a + 1 }), "bad_round");
  assert.equal(ap(round, { kind: "cut", side: 0, at: 1 }), "no_cut");
  ap(round, { kind: "crate", place: 0, by: 1 });
  assert.equal(ap(round, { kind: "run" }), "round_first");
});

test("guna: tampered params are refused", () => {
  const g = (mode, goal, grammar = {}) => gunaLogic.generate(req(mode, goal, 6, { grammar }))[0].level;
  const area = g("field", "area", { shapes: ["2x1"] }), round = g("field", "round"), share = g("pack", "share", { sizes: [3] }), all = g("story", "all", { cap: [3, 9], q: [3, 30] }), left = g("story", "left");
  for (const lv of [area, round, share, all, left]) assert.ok(gunaLogic.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [area, { a: 4, b: 7 }], [area, { a: 1000 }], [area, { a: 999, b: 999 }], [area, { b: 1.5 }], [area, { face: 4 }], [area, { ctx: 2 }], [area, { goal: "share" }], [area, { a: 1 }],
    [round, { a: 50 }], [round, { a: 45 }], [round, { a: round.params.a, b: round.params.a }], [round, { a: 5 }],
    [share, { b: 10 }], [share, { a: 1000 }], [share, { a: 3 * share.params.b }], [share, { a: 84, b: 4 }], [share, { ctx: 1 }],
    [all, { a: all.params.b * 5 }], [all, { b: 60 }], [all, { ctx: 3 }], [all, { a: 1000 }], [all, { a: 1, b: 7 }],
    [left, { a: 7 * 3 + 3, b: 7 }],
    [area, { a: 30000, b: 4000 }], [area, { a: 3000, b: 4 }], [area, { a: 30000, b: 4000, ctx: 1 }],
    [round, { a: 48720, b: 312 }],
  ]) assert.equal(gunaLogic.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch)}`);
  assert.equal(gunaLogic.validate({ ...area, mode: "pack" }), null, "a goal belongs to its mode");
  const check = g("field", "check"), each = g("pack", "each"), big = g("field", "area", { shapes: ["BIG"] });
  for (const lv of [check, each, big]) assert.ok(gunaLogic.validate(lv), lv.levelId);
  for (const [lv, patch] of [[check, { ctx: 6 }], [check, { ctx: -1 }], [check, { a: 50 }], [check, { a: 4872, b: 312 }], [each, { a: 61 }], [each, { b: 10 }], [each, { a: each.params.b }], [each, { ctx: 3 }],
    [big, { a: big.params.a * 10, b: big.params.b * 10 }]]) assert.equal(gunaLogic.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch)}`);
  assert.equal(gunaLogic.validate({ ...area, params: null }), null);
});

test("guna: a claim in an act never decides; the first run decides the evidence; grade replays", () => {
  const level = gunaLogic.validate(gunaLogic.generate(req("story", "full", 4, { grammar: { cap: [3, 12], q: [2, 20] } }))[0].level);
  const forged = gunaLogic.grade(level, sanitizeActs(env([{ kind: "count", n: 1, correct: true }, { kind: "run", solved: true, verdict: "solved" }])));
  assert.notEqual(forged.verdict, "solved");
  assert.notEqual(forged.evidence[0]?.outcome, "correct");
  const ok = gunaLogic.grade(level, env(gunaLogic.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const wrong = [{ kind: "count", n: 1 }, { kind: "run" }, ...gunaLogic.solve(level)];
  const g = gunaLogic.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.equal(g.evidence[0].outcome, "incorrect");
  assert.deepEqual(gunaLogic.grade(level, env(wrong)), g);
});

// ≥ 2000 random acts per case: the law never throws; whenever a run ends the law's verdict equals the checker's on the
// checker's OWN copy of the set-up (fed every act the law accepted); the generator's CPU p95 ≤ 50 ms
for (const [mode, goal, grammar] of CASES) {
  test(`guna/${mode}/${goal} ${JSON.stringify(grammar)}: ≥ 2000 random acts; the run's verdict ⇔ the independent checker; never throws; generator work bounded (counted, not timed)`, () => {
    let seed = 17, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const candCounts = []; // candidates per generate/pick: a count, not a clock (tests/_work.mjs)
    for (let gi = 0; gi < 40; gi++) {
      let cands = [];
      cands = gunaLogic.generate(req(mode, goal, 100 + gi, { grammar, fade: 1 + (gi % 3) }));
      candCounts.push(cands.length);
      for (const c of cands.slice(0, 4)) {
        const level = gunaLogic.validate(c.level), p = level.params, sol = gunaLogic.solve(level);
        let s = gunaLogic.init(level), k = 0;
        const chk = checker(p), pursue = rnd() < 0.5;
        const w = Math.floor(p.a / p.b);
        for (let i = 0; i < 90 && !s.done; i++) {
          const r = rnd(), x = rnd();
          const a = pursue && r < 0.7 && k < sol.length ? sol[k++]
            : r < 0.12 ? { kind: "cut", side: x < 0.6 ? 0 : 1, at: 1 + Math.floor(rnd() * 120), ...(rnd() < 0.2 ? { correct: true } : {}) }
            : r < 0.32 ? (p.goal === "check" && rnd() < 0.3 ? { kind: "stamp", i: Math.floor(x * 3), to: rnd() < 0.5 ? 1 : 2 }
              : p.goal === "commas" && rnd() < 0.8 ? { kind: "post", at: Math.floor(x * 9) }
              : { kind: "crate", place: Math.floor(x * (p.goal === "build" ? 9 : 7)), by: rnd() < 0.7 ? 1 : -1 })
            : r < 0.38 ? { kind: "round", side: x < 0.5 ? 0 : 1, to: 10 * Math.floor(rnd() * 60) }
            : r < 0.5 ? { kind: "deal", place: Math.floor(x * 3) } : r < 0.58 ? { kind: "open", place: Math.floor(x * 3) }
            : r < 0.7 ? { kind: "count", n: Math.max(0, w + Math.floor((x - 0.5) * 6)) }
            : r < 0.9 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = gunaLogic.apply(level, s, a, i + 1);
          acts++;
          if (!out.refused || out.refused === "missed") chk.feed(a);
          if (a.kind === "run" && out.state.ended && !before.ended) {
            judged++;
            assert.equal(out.state.done, verdict(p, chk.st), `${level.levelId}: law and checker disagree (${JSON.stringify(chk.st)})`);
          }
          s = out.state;
        }
        if (gunaLogic.goalMet(level, s)) { solved++; assert.ok(verdict(p, chk.st)); }
      }
    }
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(judged > 20 && solved > 0, `judged ${judged}, solved ${solved}`);
    assert.ok(Math.max(...candCounts) <= 72, `${Math.max(...candCounts)} candidates per call (measured 2026-11-10: 24; bound is 3x)`);
  });
}

test("guna: every word the view shows exists in all three languages; vakya's words stay last; no clock, randomness or colour literal in the law or the view", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/guna/guna.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(guna\.[a-zA-Z0-9.]+)"/g)].map((m) => m[1]);
  const extra = ["area", "round", "share", ...[0, 1, 2].flatMap((i) => [`all${i}`, `full${i}`, `left${i}`])].map((g) => `guna.goal.${g}`)
    .concat(["child", "book", "sweet", "rice", "marble"].map((x) => `guna.item.${x}`), ["bus", "auto", "box", "packet", "sack", "bag"].map((x) => `guna.per.${x}`),
      ["big", "check", "each0", "each1", "each2", "build", "commas"].map((g) => `guna.goal.${g}`), ["crore", "lakh", "thousand", "hundred", "million"].map((u) => `guna.unit.${u}`));
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const logic = readFileSync(`${ROOT}src/play/families/guna/guna.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// the play server: every guna coverage entry serves a proven level at every fade (levelsFor and currentLevel); the solver's
// acts grade solved through the server; a claim never solves; a mal-rule the level discriminates folds its kit id
const GE = () => coverage().entries.filter((e) => e.family === "guna");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("guna coverage: the twenty authored entries, mapped to real kit misconceptions; the nine multiply / divide topics and the two place-value topics are guna's now", () => {
  assert.deepEqual(GE().map((e) => `${e.topicId}|${e.mode}|${e.goal}`), [
    "c4-maths-ch13-t01|field|area", "c4-maths-ch13-t02|pack|share", "c4-maths-ch13-t02|story|all", "c5-maths-ch06-t01|field|area", "c5-maths-ch06-t02|field|area",
    "c5-maths-ch06-t02|field|round", "c5-maths-ch09-t01|pack|share", "c5-maths-ch09-t01|story|full", "c5-maths-ch09-t02|story|all", "c5-maths-ch09-t02|story|full", "c5-maths-ch09-t02|story|left",
    "c7-maths-ch01-t03|field|area", "c7-maths-ch01-t03|field|round", "c5-maths-ch04-t02|field|check", "c4-maths-ch09-t02|pack|each", "c4-maths-ch09-t02|story|full", "c4-maths-ch09-t02|story|all",
    "c4-maths-ch04-t01|yard|build", "c7-maths-ch01-t01|yard|build", "c7-maths-ch01-t01|yard|commas"]);
  const kits = ["c4", "c5", "c7"].map((k) => readFileSync(`${ROOT}data/kits/${k}-maths.json`, "utf8")).join("");
  const ids = new Set([...kits.matchAll(/"(c[457]-maths-ch\d+-t\d+-m-[a-z0-9-]+)"/g)].map((m) => m[1]));
  for (const e of GE()) { assert.ok(Object.keys(e.misMap).length >= 1, e.topicId); for (const kit of Object.values(e.misMap)) { assert.ok(kit.startsWith(`${e.topicId}-m-`), kit); assert.ok(ids.has(kit), `${kit} is a verified kit id`); } }
  for (const sk of ["c4-maths-ch13-t01-s1", "c4-maths-ch13-t01-s2", "c4-maths-ch13-t01-s3", "c4-maths-ch13-t02-s1", "c4-maths-ch13-t02-s3", "c5-maths-ch06-t01-s1", "c5-maths-ch06-t01-s2",
    "c5-maths-ch06-t02-s1", "c5-maths-ch06-t02-s3", "c5-maths-ch09-t01-s1", "c5-maths-ch09-t01-s2", "c5-maths-ch09-t01-s3", "c5-maths-ch09-t02-s1", "c5-maths-ch09-t02-s2", "c5-maths-ch09-t02-s3",
    "c7-maths-ch01-t03-s1", "c7-maths-ch01-t03-s2", "c7-maths-ch01-t03-s3", "c5-maths-ch04-t02-s1", "c4-maths-ch09-t02-s1", "c4-maths-ch09-t02-s2", "c4-maths-ch09-t02-s3",
    "c4-maths-ch04-t01-s1", "c4-maths-ch04-t01-s2", "c4-maths-ch04-t01-s3", "c7-maths-ch01-t01-s1", "c7-maths-ch01-t01-s2"]) {
    assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "guna", sk);
  }
  // no honest mechanic: these stay with the net
  for (const sk of ["c4-maths-ch13-t02-s2", "c5-maths-ch06-t01-s3", "c5-maths-ch06-t02-s2", "c5-maths-ch04-t02-s2", "c5-maths-ch04-t02-s3", "c7-maths-ch01-t01-s3"]) assert.notEqual(entryFor({ skillId: sk })?.family, "guna", sk);
});

for (const e of GE()) for (const fade of [1, 2, 3]) {
  test(`guna server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "guna" && cur.mode === e.mode && cur.params.goal === e.goal, "currentLevel serves");
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.face, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      const g = gradeActs(level, env(gunaLogic.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "run", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && gunaLogic.malActs(level, m));
        const mg = gradeActs(level, env(gunaLogic.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      const hidden = hiddenOf(level);
      assert.ok(Array.isArray(hidden) && hidden.length > 0, "hidden values");
    }
  });
}

// r7 guna2: the existing levels are the very same (levelIds pinned before the change: seed 5, fade 1, first candidate)
test("guna: existing entries generate the same levels as before r7 guna2 (pinned levelIds)", () => {
  const PIN = [
    ["field", "area", { shapes: ["2x1"] }, "guna-area:16:8:0-5"], ["field", "area", { shapes: ["2x10", "2xT"] }, "guna-area:22:80:0-5"],
    ["field", "area", { shapes: ["3x1"] }, "guna-area:161:8:0-5"], ["field", "area", { shapes: ["RxR", "2xH"] }, "guna-area:72:100:0-5"],
    ["field", "area", { shapes: ["RxR", "2xH", "2x10"] }, "guna-area:72:10:0-5"], ["field", "round", {}, "guna-round:67:23:0-5"],
    ["pack", "share", { sizes: [2] }, "guna-share:95:5:0-5"], ["pack", "share", { sizes: [3] }, "guna-share:297:8:0-5"],
    ["story", "all", { cap: [3, 9], q: [3, 30] }, "guna-all:170:7:1-5"], ["story", "full", { cap: [12, 50], q: [3, 40] }, "guna-full:386:15:1-5"],
    ["story", "left", { cap: [3, 12], q: [2, 20] }, "guna-left:146:9:1-5"],
  ];
  for (const [mode, goal, grammar, id] of PIN) assert.equal(gunaLogic.generate(req(mode, goal, 5, { grammar, fade: 1 }))[0].level.levelId, id, `${mode}/${goal} ${JSON.stringify(grammar)}`);
});

// r7 guna2 (main loop): the rack limit is raised only as far as c7-maths-ch01-t03 needs: every one of its products fits a
// truck of RACKS racks and some need all of them; every earlier entry still uses at most the old five
test("guna: the rack limit is exactly what c7-maths-ch01-t03 needs; earlier entries never use more than five racks", () => {
  assert.equal(RACKS, 7);
  let most = 0;
  for (const e of GE()) for (const seed of [1, 2, 3, 5, 8, 13, 21, 34]) for (const fade of [1, 2, 3]) {
    for (const c of gunaLogic.generate(req(e.mode, e.goal, seed, { grammar: e.grammar, fade }))) {
      const p = gunaLogic.validate(c.level).params;
      if (!["area", "round", "check"].includes(p.goal)) continue;
      const racks = racksOf(p), product = p.goal === "area" ? p.a * p.b : nearestRound(p.a) * nearestRound(p.b);
      assert.ok(product < 10 ** racks, `${c.signature}: the truck holds the product`);
      if (e.topicId === "c7-maths-ch01-t03") { assert.ok(racks <= RACKS && racks >= 6, `${c.signature} ${racks}`); most = Math.max(most, racks); }
      else assert.ok(racks <= 5, `${e.topicId} ${c.signature}: ${racks} racks`);
    }
  }
  assert.equal(most, RACKS, "c7-maths-ch01-t03 needs every rack the limit allows");
});

// r7 place2: the yard (place value). Beliefs by their written signatures; the law's rules; tampered params; the existing
// levels unchanged (the pins above, plus the levelIds the play server served before the change)
test("guna/yard: mal-rule signatures are the beliefs (the parts written in full one after another, the counts side by side without the empty places, a crore for a million, a comma after every three places)", () => {
  const cat = (xs) => Number(xs.join(""));
  for (const c of [...levelsOf("yard", "build", { forms: ["named", "expanded", "numeral"] }), ...levelsOf("yard", "build", { big: true, forms: ["named", "intl"] })]) {
    const p = gunaLogic.validate(c.level).params, text = docketText(p);
    const named = text.includes("+") ? text.split(" + ").map((t) => [Number(t), 1]) : [];
    // a numeral is read as it is spoken: its thousands, its hundreds, the rest (9024 → 9 thousand 24)
    if (/^\d+$/.test(text)) for (const [n, u] of [[Math.floor(p.a / 1000), 1000], [Math.floor(p.a / 100) % 10, 100], [p.a % 100, 1]]) { if (n) named.push([n, u]); }
    else if (!text.includes("+")) { const toks = text.split(" "); for (let i = 0; i < toks.length; i++) { const u = UNIT[toks[i + 1]]; named.push([Number(toks[i]), u ?? 1]); if (u) i++; } }
    const cc = malSetup(p, "concat");
    if (cc) assert.equal(cc.load, cat(named.map(([n, u]) => n * u)), `${text}: concat`);
    const dz = malSetup(p, "drop-zero");
    if (dz) {
      // the counts side by side; an expanded term keeps no zeros but the last one's
      const last = named[named.length - 1], counts = text.includes("+") ? named.map(([n]) => String(n)[0]) : named.map(([n]) => n);
      const tailZeros = text.includes("+") ? String(last[0]).length - 1 : String(last[1]).length - 1;
      assert.equal(dz.load, Number(counts.join("") + "0".repeat(tailZeros)), `${text}: drop-zero`);
      assert.ok(dz.load < p.a, "dropping an empty place makes the number smaller");
    }
    const cm = malSetup(p, "crore-million");
    if (cm) {
      const intl = text.includes("million");
      assert.equal(cm.load, named.reduce((s, [n, u]) => s + n * (u === (intl ? 1e6 : 1e7) ? (intl ? 1e7 : 1e6) : u), 0), `${text}: crore-million`);
    }
  }
  for (const c of levelsOf("yard", "commas", {})) {
    const p = gunaLogic.validate(c.level).params, m = malSetup(p, "intl-commas");
    assert.equal(written(p.a, m.posts), p.a.toLocaleString("en-US"), "a comma after every three places");
    assert.notEqual(written(p.a, m.posts), p.a.toLocaleString("en-IN"));
  }
  // the kit's own examples
  const lv = (a, b, ctx) => ({ goal: "build", face: 1, a, b, ctx });
  assert.equal(malSetup(lv(4050, 6, 0), "concat").load, 400050); assert.equal(malSetup(lv(4050, 6, 0), "drop-zero").load, 450);
  assert.equal(malSetup(lv(3006, 6, 2), "drop-zero").load, 36); assert.equal(malSetup(lv(30500000 + 9, 8, 0), "drop-zero").load, 359);
  assert.equal(malSetup(lv(3004000, 8, 0), "drop-zero").load, 304000, "thirty lakh four thousand → 3,04,000");
  assert.equal(malSetup(lv(7005000, 8, 3), "crore-million").load, 70005000, "7 million read as 7 crore");
});

test("guna/yard: the law's rules (racks hold nine; the truck must weigh the docket; a post toggles; run needs a load or a post; hidden values)", () => {
  const b4 = gunaLogic.validate(gunaLogic.generate(req("yard", "build", 3, { grammar: { forms: ["named"] } }))[0].level), P = b4.params;
  let s = gunaLogic.init(b4);
  const ap = (lv, a) => { const r = gunaLogic.apply(lv, s, a, 1); s = r.state; return r.refused; };
  assert.equal(s.crates.length, 6, "a class 4 truck has six racks");
  assert.equal(ap(b4, { kind: "run" }), "load_first");
  for (let i = 0; i < 9; i++) ap(b4, { kind: "crate", place: 0, by: 1 });
  assert.equal(ap(b4, { kind: "crate", place: 0, by: 1 }), "rack_full", "fifty is never fifty crates of one");
  for (const bad of [{ kind: "post", at: 3 }, { kind: "count", n: 3 }, { kind: "deal", place: 0 }, { kind: "cut", side: 0, at: 1 }, { kind: "round", side: 0, to: 10 }]) assert.ok(ap(b4, bad), JSON.stringify(bad));
  assert.equal(ap(b4, { kind: "crate", place: 6, by: 1 }), "bad_crate");
  assert.deepEqual(hiddenOf(b4), [String(P.a), P.a.toLocaleString("en-IN")], "the numeral is never said before the truck is loaded");
  s = gunaLogic.init(b4);
  for (const a of gunaLogic.solve(b4)) assert.equal(ap(b4, a), undefined);
  assert.ok(s.done && crateValue(s.crates) === P.a);
  const num = gunaLogic.validate(gunaLogic.generate(req("yard", "build", 3, { grammar: { forms: ["numeral"] } }))[0].level);
  assert.deepEqual(hiddenOf(num), [], "a numeral docket shows the number itself");

  const cm = gunaLogic.validate(gunaLogic.generate(req("yard", "commas", 4))[0].level), C = cm.params;
  s = gunaLogic.init(cm);
  assert.equal(crateValue(s.crates), C.a, "the number stands on the truck");
  assert.equal(ap(cm, { kind: "run" }), "post_first");
  assert.equal(ap(cm, { kind: "crate", place: 0, by: 1 }), "no_truck", "the crates are given");
  for (const bad of [{ kind: "post", at: 0 }, { kind: "post", at: C.b }, { kind: "post", at: 1.5 }]) assert.equal(ap(cm, bad), "bad_post");
  ap(cm, { kind: "post", at: 4 }); ap(cm, { kind: "post", at: 4 }); assert.deepEqual(s.posts, [], "a post set again is lifted");
  ap(cm, { kind: "post", at: 3 }); ap(cm, { kind: "post", at: 6 });
  assert.equal(ap(cm, { kind: "run" }), "missed");
  assert.equal(ap(cm, { kind: "run" }), "change_first");
  ap(cm, { kind: "post", at: 6 }); for (const k of [5, 7].filter((k) => k < C.b)) ap(cm, { kind: "post", at: k });
  assert.equal(ap(cm, { kind: "run" }), undefined); assert.ok(s.done);
  assert.deepEqual(hiddenOf(cm), [C.a.toLocaleString("en-IN")]);
});

test("guna/yard: tampered params are refused", () => {
  const g = (goal, grammar = {}) => gunaLogic.generate(req("yard", goal, 6, { grammar }))[0].level;
  const small = g("build", { forms: ["named"] }), big = g("build", { big: true, forms: ["named"] }), intl = g("build", { big: true, forms: ["intl"] }), cm = g("commas");
  for (const lv of [small, big, intl, cm]) assert.ok(gunaLogic.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [small, { a: 999 }], [small, { a: 10000 }], [small, { b: 7 }], [small, { ctx: 3 }], [small, { ctx: 4 }], [small, { ctx: -1 }], [small, { ctx: 1.5 }],
    [big, { a: 99999 }], [big, { a: 1e8 }], [big, { ctx: 1 }], [big, { ctx: 2 }], [intl, { a: 12e6 }], [intl, { a: 999999 }],
    [cm, { b: cm.params.b + 1 }], [cm, { a: 99999, b: 5 }], [cm, { ctx: 1 }], [cm, { a: 1e8, b: 9 }],
  ]) assert.equal(gunaLogic.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch)}`);
  assert.equal(gunaLogic.validate({ ...small, mode: "field" }), null, "a goal belongs to its mode");
  assert.equal(gunaLogic.validate({ ...gunaLogic.generate(req("field", "area", 6, { grammar: { shapes: ["2x1"] } }))[0].level, mode: "yard" }), null);
});

// r7 place2: the play server served these levelIds for the existing guna entries before the yard was added (three children
// each, fade 1); the generator over every existing rule, 30 seeds, three fades and three classes hashed the same before
// and after (110,160 candidates)
test("guna: existing entries serve the same levels as before r7 place2 (pinned served levelIds)", () => {
  const PIN = ["guna-area:14:7:0-60776597", "guna-area:14:4:0-806289595", "guna-area:13:5:0-276677232", "guna-share:72:2:0-782800392", "guna-share:68:4:0-731197390",
    "guna-share:42:3:0-894555175", "guna-all:71:5:0-610421553", "guna-all:55:4:0-741123375", "guna-all:88:6:2-829095193", "guna-area:24:90:0-723919729", "guna-area:16:50:0-75252229", "guna-area:28:80:0-824220644"];
  const ids = [];
  for (const e of GE().filter((x) => x.mode !== "yard")) for (let k = 0; k < 3; k++) {
    const key = entryKey(e);
    ids.push(currentLevel({ ...sessionOf(e), childId: `pin${k}`, seed: seedOf(`pin${k}`, key, 0) }, e)?.levelId);
  }
  assert.deepEqual(ids.slice(0, PIN.length), PIN);
});
