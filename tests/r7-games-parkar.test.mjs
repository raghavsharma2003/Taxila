// r7 Games, Parkar · ruler-and-compass constructions (triangles from arcs, rays and a set-square's right angle; the longest /
// shortest third stick; both SSA triangles; the perpendicular bisector, the tank on the road, the angle bisector, 60°; the
// altitude; nothing ever runs on a clock and a spot exists only where tool marks cross). Pure law checks: every generated
// level validates, its solver solves it, no idea-free construction wins (shortcut null); an INDEPENDENT checker (plain JS
// coordinate geometry of its own: circle–circle and circle–line crossings, distances, angles, and a triangle compared with
// the card's by its six parts; none of the law's helpers) agrees with the law over random play; each mal-rule's acts land on
// its OWN misconception moment; tampered params are refused; a claim in an act never decides; the generator is fast; and
// every coverage entry serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parkarLogic, PARKAR_MAL } from "../src/play/families/parkar/parkar.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { cpuNow } from "./_cpu-ms.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const L = parkarLogic;
const ALL = Object.fromEntries(PARKAR_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "parkar", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = [["build", "sss"], ["build", "sas"], ["build", "asa"], ["build", "rhs"], ["build", "long"], ["build", "short"], ["build", "ssa"],
  ["bisect", "perp"], ["bisect", "equi"], ["bisect", "angle"], ["bisect", "sixty"], ["drop", "alt"]];
const EXPECT = { sss: ["swap"], sas: ["wrong-vertex"], asa: [], rhs: [], long: ["equal-sum", "any-three"], short: ["equal-sum", "any-three"], ssa: ["ssa"],
  perp: ["compass-change"], equi: ["compass-change"], angle: ["compass-change"], sixty: ["compass-change"], alt: ["median", "vertical", "inside-only"] };
const levelsOf = (mode, goal, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of L.generate(req(mode, goal, seed, { fade }))) out.push(c);
  return out;
};

// ───────────────────────────── THE INDEPENDENT CHECKER (its own geometry, none of the law's code) ─────────────────────────────
const TOL = 1e-3;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = (v) => Math.sqrt(v[0] * v[0] + v[1] * v[1]);
const far = (a, b) => len(sub(a, b));
const cosDeg = (d) => Math.cos((d * Math.PI) / 180), sinDeg = (d) => Math.sin((d * Math.PI) / 180);
const turn = (v, d) => [v[0] * cosDeg(d) - v[1] * sinDeg(d), v[0] * sinDeg(d) + v[1] * cosDeg(d)];
/** the angle at vertex V between the directions to P and Q, degrees 0..180 */
const angleAt = (V, P, Q) => { const u = sub(P, V), v = sub(Q, V); return (Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (len(u) * len(v))))) * 180) / Math.PI; };
/** a straight mark as a point, a direction and a parameter range (the checker's own) */
const straight = (P, Q, lo, hi) => { const d = sub(Q, P), n = len(d); return { kind: "s", P, d: [d[0] / n, d[1] / n], lo, hi: hi === undefined ? n : hi }; };
function cross(m1, m2) {
  let out = [];
  if (m1.kind === "c" && m2.kind === "c") {
    const D = far(m1.O, m2.O);
    if (D < 1e-9 || D > m1.r + m2.r + 1e-9 || D < Math.abs(m1.r - m2.r) - 1e-9) return [];
    // along the centre line by x, across it by y: x = (D² + r1² − r2²) / 2D, y = ±√(r1² − x²)
    const x = (D * D + m1.r * m1.r - m2.r * m2.r) / (2 * D), y = Math.sqrt(Math.max(0, m1.r * m1.r - x * x)), e = sub(m2.O, m1.O).map((t) => t / D), f = [-e[1], e[0]];
    out = (y < 1e-7 ? [0] : [y, -y]).map((yy) => [m1.O[0] + e[0] * x + f[0] * yy, m1.O[1] + e[1] * x + f[1] * yy]);
  } else if (m1.kind === "s" && m2.kind === "s") {
    // P1 + t d1 = P2 + u d2 by Cramer's rule
    const det = -m1.d[0] * m2.d[1] + m1.d[1] * m2.d[0];
    if (Math.abs(det) < 1e-12) return [];
    const r = sub(m2.P, m1.P), t = (-r[0] * m2.d[1] + r[1] * m2.d[0]) / det, u = (m1.d[0] * r[1] - m1.d[1] * r[0]) / det;
    if (t >= m1.lo - 1e-7 && t <= m1.hi + 1e-7 && u >= m2.lo - 1e-7 && u <= m2.hi + 1e-7) out = [[m1.P[0] + t * m1.d[0], m1.P[1] + t * m1.d[1]]];
  } else {
    const S = m1.kind === "s" ? m1 : m2, C = m1.kind === "c" ? m1 : m2;
    // |P + t d − O|² = r²: t² + 2 t (d·(P−O)) + |P−O|² − r² = 0
    const w = sub(S.P, C.O), B = w[0] * S.d[0] + w[1] * S.d[1], Cc = w[0] * w[0] + w[1] * w[1] - C.r * C.r, disc = B * B - Cc;
    if (disc < -1e-9) return [];
    const q = Math.sqrt(Math.max(0, disc));
    out = (q < 1e-7 ? [-B] : [-B - q, -B + q]).filter((t) => t >= S.lo - 1e-7 && t <= S.hi + 1e-7).map((t) => [S.P[0] + t * S.d[0], S.P[1] + t * S.d[1]]);
  }
  return out.sort((a, b) => (Math.abs(a[0] - b[0]) > 1e-7 ? a[0] - b[0] : a[1] - b[1]));
}
/** the board from the goal's numbers, built from their plain meaning */
function pageOf(p) {
  const n = p.n, g = p.goal, spots = {}, given = [];
  let arms = {};
  if (["sss", "sas", "asa", "rhs", "long", "short", "ssa"].includes(g)) {
    const c = g === "sss" ? n[2] : g === "asa" ? n[0] : n[1];
    spots.A = [0, 0]; spots.B = [c, 0];
    given.push(straight(spots.A, spots.B, 0));
    arms = { A: { zero: [1, 0], s: 1 }, B: { zero: [-1, 0], s: -1 } };
    if (g === "long" || g === "short") given.push({ kind: "c", O: spots.A, r: n[0] });
    if (g === "ssa") given.push(straight(spots.A, [cosDeg(n[2]), sinDeg(n[2])], 0, 100));
  } else if (g === "perp") { spots.A = turn([-n[0] / 2, 0], n[1]); spots.B = turn([n[0] / 2, 0], n[1]); given.push(straight(spots.A, spots.B, 0)); }
  else if (g === "equi") { spots.A = [0, 0]; spots.B = [n[0], 0]; given.push(straight([-1, n[1]], [n[0] + 1, n[2]], -1e9, 1e9)); }
  else if (g === "angle") { spots.O = [0, 0]; spots.A = turn([7, 0], n[1]); spots.B = turn([7, 0], n[1] + n[0]); given.push(straight(spots.O, spots.A, 0), straight(spots.O, spots.B, 0)); }
  else if (g === "sixty") { spots.O = [0, 0]; spots.A = turn([8, 0], n[0]); given.push(straight(spots.O, spots.A, 0)); }
  else {
    const [base, fx, hgt, r] = n;
    spots.A = turn([fx, hgt], r); spots.B = [0, 0]; spots.C = turn([base, 0], r); spots.M = turn([base / 2, 0], r);
    given.push(straight(spots.B, spots.C, 0), straight(spots.C, spots.A, 0), straight(spots.A, spots.B, 0));
  }
  return { spots, given, arms };
}
/** the checker's own copy of the construction, fed every act the law accepted (undo pops its own stack) */
function checker(p) {
  const pg = pageOf(p), st = { r: 0, marks: [], pins: [], made: [] }, stack = [];
  const at = (id) => pg.spots[id] ?? st.pins.find((q) => q.id === id)?.xy;
  const marks = () => [...pg.given, ...st.made];
  return {
    st, pg, at,
    feed(a) {
      if (a.kind === "run") return;
      if (a.kind === "undo") { if (stack.length) Object.assign(st, stack.pop()); return; }
      stack.push(JSON.parse(JSON.stringify(st)));
      if (a.kind === "open") st.r = a.r;
      else if (a.kind === "arc") { st.marks.push({ t: "arc", c: a.at, r: st.r }); st.made.push({ kind: "c", O: at(a.at), r: st.r }); }
      else if (a.kind === "ray") { const arm = pg.arms[a.at], d = turn(arm.zero, arm.s * a.deg); st.marks.push({ t: "ray" }); st.made.push(straight(at(a.at), [at(a.at)[0] + d[0], at(a.at)[1] + d[1]], 0, 100)); }
      else if (a.kind === "square") {
        const P = at(a.at), on = a.on < 0 ? { d: [1, 0] } : marks()[a.on], d = [-on.d[1], on.d[0]];
        st.marks.push({ t: "sq", at: a.at, on: a.on }); st.made.push(straight(P, [P[0] + d[0], P[1] + d[1]], -1e9, 1e9));
      } else if (a.kind === "join") { st.marks.push({ t: "join", p: a.p, q: a.q }); st.made.push(straight(at(a.p), at(a.q), -1e9, 1e9)); }
      else if (a.kind === "pin") { const xy = cross(marks()[a.a], marks()[a.b])[a.k]; st.pins.push({ id: `P${st.pins.length + 1}`, xy }); }
    },
  };
}
/** the card's triangle's six parts, from the givens alone (law of cosines / sines) */
function cardParts(p) {
  const n = p.n;
  let a, b, c;
  if (p.goal === "sss") [a, b, c] = n;
  if (p.goal === "sas") { [b, c] = n; a = Math.sqrt(b * b + c * c - 2 * b * c * cosDeg(n[2])); }
  if (p.goal === "asa") { c = n[0]; const C = 180 - n[1] - n[2]; a = (c * sinDeg(n[1])) / sinDeg(C); b = (c * sinDeg(n[2])) / sinDeg(C); }
  if (p.goal === "rhs") { b = n[0]; c = n[1]; a = Math.sqrt(b * b - c * c); }
  return { a, b, c };
}
/** six parts equal: three sides and three angles */
function congruent(A, B, C, parts) {
  const { a, b, c } = parts;
  const sides = [far(B, C) - a, far(C, A) - b, far(A, B) - c];
  const angA = (Math.acos((b * b + c * c - a * a) / (2 * b * c)) * 180) / Math.PI, angB = (Math.acos((a * a + c * c - b * b) / (2 * a * c)) * 180) / Math.PI;
  const angs = [angleAt(A, B, C) - angA, angleAt(B, A, C) - angB, angleAt(C, A, B) - (180 - angA - angB)];
  return sides.every((x) => Math.abs(x) < TOL) && angs.every((x) => Math.abs(x) < 0.01);
}
const triangleCloses = (x, y, z) => x + y > z + 1e-9 && y + z > x + 1e-9 && x + z > y + 1e-9;
/** does this construction meet the task? read from the params' plain meaning */
function verdict(p, k) {
  const { st, pg, at } = k, last = st.pins[st.pins.length - 1]?.xy, n = p.n, S = pg.spots;
  const lastMark = (...ts) => { for (let i = st.marks.length - 1; i >= 0; i--) if (ts.includes(st.marks[i].t)) return i; return -1; };
  switch (p.goal) {
    case "sss": case "sas": case "asa": case "rhs": return !!last && congruent(S.A, S.B, last, cardParts(p));
    case "long": case "short": {
      let r = 0; for (const m of st.marks) if (m.t === "arc" && m.c === "B") r = m.r;
      const ok = []; for (let x = 1; x <= 12; x++) if (triangleCloses(n[0], n[1], x)) ok.push(x);
      return r === (p.goal === "long" ? Math.max(...ok) : Math.min(...ok));
    }
    case "ssa": {
      // every triangle with AB, ∠A and BC: where a circle of BC round B meets the ray at A
      const all = cross({ kind: "c", O: S.B, r: n[0] }, straight(S.A, [cosDeg(n[2]), sinDeg(n[2])], 0, 100));
      return all.length === 2 && all.every((C) => st.pins.some((q) => far(q.xy, C) < TOL));
    }
    case "perp": {
      const i = lastMark("join"); if (i < 0) return false;
      const m = st.marks[i];
      return [at(m.p), at(m.q)].every((X) => Math.abs(far(X, S.A) - far(X, S.B)) < TOL);
    }
    case "equi": {
      if (!last) return false;
      const road = pg.given[0], w = sub(last, road.P), off = Math.abs(w[0] * road.d[1] - w[1] * road.d[0]);
      return off < TOL && Math.abs(far(last, S.A) - far(last, S.B)) < TOL;
    }
    case "angle": case "sixty": {
      const i = lastMark("join"); if (i < 0) return false;
      const m = st.marks[i]; if (m.p !== "O" && m.q !== "O") { const P = at(m.p), Q = at(m.q); if (Math.abs((P[0] - Q[0]) * (S.O[1] - Q[1]) - (P[1] - Q[1]) * (S.O[0] - Q[0])) > TOL) return false; }
      const R = at(m.p === "O" ? m.q : m.p);
      if (p.goal === "angle") return Math.abs(angleAt(S.O, R, S.A) - angleAt(S.O, R, S.B)) < 0.01;
      const t = angleAt(S.O, R, S.A);
      return Math.abs(t - 60) < 0.01 || Math.abs(t - 120) < 0.01;
    }
    case "alt": {
      const i = lastMark("join", "sq"); if (i < 0) return false;
      const ln = k.lineOf(i), BC = sub(S.C, S.B), w = sub(S.A, ln.P);
      return Math.abs(w[0] * ln.d[1] - w[1] * ln.d[0]) < TOL && Math.abs(ln.d[0] * BC[0] + ln.d[1] * BC[1]) < TOL;
    }
  }
}
const mkChecker = (p) => { const k = checker(p); k.lineOf = (i) => k.st.made[i]; return k; };
const replayCheck = (level, acts) => { const k = mkChecker(level.params); let s = L.init(level); for (const a of acts) { const r = L.apply(level, s, a, 1); if (!r.refused || r.refused === "missed") k.feed(a); s = r.state; } return { s, ok: verdict(level.params, k) }; };

test("parkar: the family is registered (FAMILIES, MODES, arts, logic for every mode, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("parkar"));
  assert.deepEqual([...MODES.parkar], ["build", "bisect", "drop"]);
  assert.ok(FAMILY_ARTS.parkar.length === 4);
  for (const m of MODES.parkar) {
    assert.equal(LOGIC[`parkar/${m}`], L);
    const v = playActOf("parkar", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
  }
});

for (const [mode, goal] of CASES) {
  test(`parkar/${mode}/${goal}: every level validates, solves, is shortcut-free; each mal-rule lands on its own misconception`, () => {
    const seen = new Set(), cands = levelsOf(mode, goal);
    assert.ok(cands.length > (goal === "sixty" ? 15 : 30), `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = L.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.mode, mode); assert.equal(level.params.goal, goal);
      assert.equal(L.shortcut(level), null, `${c.signature} shortcut`);
      const sol = L.solve(level);
      const solved = run(level, sol);
      assert.ok(solved.s.done && solved.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(solved.refused, [], `${c.signature} solver refused`);
      assert.ok(replayCheck(level, sol).ok, `${c.signature}: the checker disagrees with the solver`);
      for (const mal of PARKAR_MAL) {
        const acts = L.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"], `${c.signature} ${mal}: set up legally, then missed`);
        assert.ok(!r.s.done && !replayCheck(level, acts).ok, `${c.signature} ${mal} must not solve`);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`);
        assert.equal(mc[0].misconceptionId, mal);
        const g = L.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, `k-${mal}`);
      }
    }
    for (const m of EXPECT[goal]) assert.ok(seen.has(m), `${mode}/${goal}: mal-rule ${m} never discriminated`);
  });
}

test("parkar: mal-rule signatures are the beliefs (the sum or difference, any length, one SSA triangle, the opening changed, the midpoint, the page's edge, the side never extended)", () => {
  for (const goal of ["long", "short"]) for (const c of levelsOf("build", goal)) {
    const level = L.validate(c.level), p = level.params, [b, cc] = p.n;
    const es = L.malActs(level, "equal-sum"); if (es) assert.equal(es[0].r, goal === "long" ? b + cc : Math.abs(cc - b), "the stick exactly the sum / difference");
    const at = L.malActs(level, "any-three"); if (at) assert.ok(!triangleCloses(b, cc, at[0].r), "any length: the sticks never meet");
  }
  for (const c of levelsOf("build", "ssa")) { const level = L.validate(c.level), acts = L.malActs(level, "ssa"); assert.equal(acts.filter((a) => a.kind === "pin").length, 1, "one triangle pinned"); }
  for (const goal of ["perp", "equi", "angle", "sixty"]) for (const c of levelsOf("bisect", goal, [3, 5])) {
    const level = L.validate(c.level), acts = L.malActs(level, "compass-change"); if (!acts) continue;
    assert.ok(new Set(acts.filter((a) => a.kind === "open").map((a) => a.r)).size >= 2, "the opening was changed between arcs");
  }
  for (const c of levelsOf("drop", "alt")) {
    const level = L.validate(c.level), p = level.params;
    assert.deepEqual(L.malActs(level, "median")?.[0], { kind: "join", p: "A", q: "M" });
    assert.deepEqual(L.malActs(level, "vertical")?.[0], { kind: "square", at: "A", on: -1 });
    const io = L.malActs(level, "inside-only");
    if (p.look === 3) assert.ok(io, "a foot outside BC: the side never extended"); else assert.equal(io, null, "the foot on BC: no inside-only reading");
  }
});

test("parkar: no idea-free construction wins (an equilateral guess, the lengths from the wrong ends, one SSA triangle, A joined to M, the square along the page)", () => {
  for (const [mode, goal] of CASES) for (const c of levelsOf(mode, goal, [3, 5])) {
    const level = L.validate(c.level), p = level.params;
    if (goal === "sss") {
      const tries = [[p.n[2], p.n[2]], [p.n[0], p.n[1]]];
      for (const [r1, r2] of tries) {
        const acts = [{ kind: "open", r: r1 }, { kind: "arc", at: "A" }, ...(r2 !== r1 ? [{ kind: "open", r: r2 }] : []), { kind: "arc", at: "B" }];
        for (const k of [0, 1]) assert.ok(!replayCheck(level, [...acts, { kind: "pin", a: 1, b: 2, k }, { kind: "run" }]).ok, `${c.signature} ${r1}/${r2}`);
      }
    }
    if (goal === "long" || goal === "short") for (const r of [p.n[0], p.n[1], 12, 1]) assert.ok(!replayCheck(level, [{ kind: "open", r }, { kind: "arc", at: "B" }, { kind: "run" }]).ok, `${c.signature} ${r}`);
    if (goal === "alt") {
      assert.ok(!replayCheck(level, [{ kind: "join", p: "A", q: "M" }, { kind: "run" }]).ok);
      assert.ok(!replayCheck(level, [{ kind: "square", at: "A", on: -1 }, { kind: "run" }]).ok);
    }
    if (goal === "perp") assert.ok(!replayCheck(level, [{ kind: "open", r: 1 }, { kind: "arc", at: "A" }, { kind: "run" }]).ok);
  }
});

test("parkar: the law's rules (a spot only where marks cross; tools on the tray only; run needs a construction; a change starts a fresh run)", () => {
  const lv = L.validate(L.generate(req("build", "sss", 11))[0].level);
  let s = L.init(lv);
  const ap = (level, a) => { const r = L.apply(level, s, a, 1); s = r.state; return r.refused; };
  assert.equal(ap(lv, { kind: "run" }), "pin_first");
  assert.equal(ap(lv, { kind: "arc", at: "A" }), "open_first");
  for (const bad of [{ kind: "open", r: 0 }, { kind: "open", r: 13 }, { kind: "open", r: 2.5 }, { kind: "open", r: "4" + "x" }]) assert.equal(ap(lv, bad), "off_ruler");
  assert.equal(ap(lv, { kind: "ray", at: "A", deg: 60 }), "no_protractor");
  assert.equal(ap(lv, { kind: "join", p: "A", q: "B" }), "no_ruler");
  assert.equal(ap(lv, { kind: "square", at: "A", on: 0 }), "no_square");
  ap(lv, { kind: "open", r: 4 });
  assert.equal(ap(lv, { kind: "open", r: 4 }), "same_opening");
  assert.equal(ap(lv, { kind: "arc", at: "Z" }), "no_spot");
  ap(lv, { kind: "arc", at: "A" });
  assert.equal(ap(lv, { kind: "arc", at: "A" }), "same_mark");
  assert.equal(ap(lv, { kind: "pin", a: 0, b: 1, k: 5 }), "no_crossing", "no crossing there");
  assert.equal(ap(lv, { kind: "pin", a: 1, b: 1, k: 0 }), "no_crossing", "a mark never crosses itself");
  assert.equal(ap(lv, { kind: "pin", a: 0, b: 9, k: 0 }), "no_crossing");
  assert.equal(s.pins.length, 0, "no spot without a crossing");
  const sol = L.solve(lv);
  s = L.init(lv);
  for (const a of sol.slice(0, -1)) assert.equal(ap(lv, a), undefined);
  ap(lv, { kind: "undo" }); assert.equal(s.pins.length, 0, "undo takes back the pin");
  for (const a of sol.slice(-2, -1)) ap(lv, a);
  ap(lv, { kind: "pin", a: 1, b: 2, k: sol[sol.length - 2].k ? 0 : 1 });
  assert.equal(ap(lv, { kind: "pin", a: 1, b: 2, k: sol[sol.length - 2].k }), "same_spot", "a spot is pinned once");
  assert.equal(ap(lv, { kind: "run" }), undefined, "the mirror image below AB is the same triangle");
  assert.ok(s.done);
  assert.equal(ap(lv, { kind: "open", r: 3 }), "level_over");
  const alt = L.validate(L.generate(req("drop", "alt", 4, { fade: 3 }))[0].level);
  s = L.init(alt);
  assert.equal(ap(alt, { kind: "run" }), "line_first");
  assert.equal(ap(alt, { kind: "open", r: 3 }), "no_compass");
  assert.equal(ap(alt, { kind: "square", at: "A", on: 7 }), "no_edge");
  assert.equal(ap(alt, { kind: "join", p: "A", q: "A" }), "no_spot");
  ap(alt, { kind: "join", p: "A", q: "M" });
  assert.equal(ap(alt, { kind: "run" }), "missed");
  assert.equal(ap(alt, { kind: "run" }), "change_first");
  const perp = L.validate(L.generate(req("bisect", "perp", 4))[0].level);
  s = L.init(perp);
  assert.equal(ap(perp, { kind: "square", at: "A", on: -1 }), "no_square");
  assert.equal(ap(perp, { kind: "run" }), "join_first");
  assert.ok(hiddenOf(perp).includes(String(perp.params.n[0] / 2)), "the half length is never said first");
});

test("parkar: tampered params are refused", () => {
  const g = (mode, goal, fade = 2) => L.generate(req(mode, goal, 6, { fade }))[0].level;
  const sss = g("build", "sss"), long = g("build", "long"), ssa = g("build", "ssa"), perp = g("bisect", "perp"), equi = g("bisect", "equi"), alt = g("drop", "alt"), alt3 = g("drop", "alt", 3), sixty = g("bisect", "sixty", 1);
  for (const lv of [sss, long, ssa, perp, equi, alt, alt3, sixty]) assert.ok(L.validate(lv), lv.levelId);
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [sss, { n: [3, 3, 5] }], [sss, { n: [1, 2, 9] }], [sss, { n: [3, 4, 12] }], [sss, { n: [4, 5] }], [sss, { n: [4.5, 5, 6] }], [sss, { max: 20 }], [sss, { look: 4 }], [sss, { goal: "sas" }], [sss, { extra: 1 }],
    [long, { n: [6, 6] }], [long, { n: [6, 7] }], [ssa, { n: [9, 6, 30] }], [ssa, { n: [2, 8, 30] }], [ssa, { n: [5, 8, 33] }],
    [perp, { n: [4, 0] }], [perp, { n: [12, 20] }], [equi, { n: [6, 4, 4] }], [equi, { n: [6, 3, 6] }],
    [alt, { n: [6, 3, 4, 0] }], [alt, { n: [6, 6, 4, 20] }], [alt, { n: [6, 3, 4, 20] }], [alt, { n: [6, -2, 4, 20] }], [alt3, { n: [6, 2, 4, 20] }], [sixty, { n: [20] }],
  ]) assert.equal(L.validate(bad(lv, patch)), null, `${lv.params.goal} ${JSON.stringify(patch)}`);
  assert.equal(L.validate({ ...sss, mode: "bisect" }), null, "a goal belongs to its mode");
  assert.equal(L.validate({ ...sss, params: null }), null);
});

test("parkar: a claim in an act never decides; the first run decides the evidence; grade replays", () => {
  const level = L.validate(L.generate(req("build", "long", 4))[0].level);
  const forged = L.grade(level, sanitizeActs(env([{ kind: "open", r: 1, correct: true }, { kind: "arc", at: "B" }, { kind: "run", solved: true, verdict: "solved" }])));
  assert.notEqual(forged.verdict, "solved");
  assert.notEqual(forged.evidence[0]?.outcome, "correct");
  const ok = L.grade(level, env(L.solve(level)));
  assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
  const wrong = [{ kind: "open", r: 1 }, { kind: "arc", at: "B" }, { kind: "run" }, ...L.solve(level)];
  const g = L.grade(level, env(wrong));
  assert.equal(g.verdict, "solved"); assert.equal(g.evidence[0].outcome, "incorrect");
  assert.deepEqual(L.grade(level, env(wrong)), g);
});

// random play: the law never throws; whenever a run ends the law's verdict equals the checker's on the checker's OWN copy
// of the construction (fed every act the law accepted); the generator's CPU p95 ≤ 50 ms
for (const [mode, goal] of CASES) {
  test(`parkar/${mode}/${goal}: ≥ 2000 random acts; the run's verdict ⇔ the independent checker; never throws; generator p95 ≤ 50 ms`, () => {
    let seed = 17, acts = 0, solved = 0, judged = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const times = [];
    const IDS = ["A", "B", "C", "O", "M", "P1", "P2", "P3", "Z"];
    for (let gi = 0; gi < 30; gi++) {
      let best = Infinity, cands = [];
      for (let k = 0; k < 3; k++) { const t0 = cpuNow(); cands = L.generate(req(mode, goal, 100 + gi, { fade: 1 + (gi % 3) })); best = Math.min(best, cpuNow() - t0); }
      times.push(best);
      for (const c of cands.slice(0, 3)) {
        const level = L.validate(c.level), sol = L.solve(level), mals = PARKAR_MAL.map((m) => L.malActs(level, m)).filter(Boolean);
        let s = L.init(level), k = 0;
        const chk = mkChecker(level.params), plan = rnd() < 0.35 ? sol : rnd() < 0.5 && mals.length ? mals[Math.floor(rnd() * mals.length)] : null;
        for (let i = 0; i < 70 && !s.done; i++) {
          const r = rnd(), x = rnd(), nm = 2 + s.marks.length + 2;
          const a = plan && r < 0.7 && k < plan.length ? plan[k++]
            : r < 0.15 ? { kind: "open", r: Math.floor(x * 14), ...(rnd() < 0.2 ? { correct: true } : {}) }
            : r < 0.3 ? { kind: "arc", at: IDS[Math.floor(x * IDS.length)] }
            : r < 0.37 ? { kind: "ray", at: IDS[Math.floor(x * 3)], deg: Math.floor(rnd() * 185) }
            : r < 0.44 ? { kind: "square", at: IDS[Math.floor(x * IDS.length)], on: Math.floor(rnd() * nm) - 1 }
            : r < 0.52 ? { kind: "join", p: IDS[Math.floor(x * IDS.length)], q: IDS[Math.floor(rnd() * IDS.length)] }
            : r < 0.72 ? { kind: "pin", a: Math.floor(x * nm), b: Math.floor(rnd() * nm), k: Math.floor(rnd() * 2) }
            : r < 0.9 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true } : {}) } : { kind: "undo" };
          const before = s;
          const out = L.apply(level, s, a, i + 1);
          acts++;
          if (!out.refused || out.refused === "missed") chk.feed(a);
          if (a.kind === "run" && out.state.ended && !before.ended) {
            judged++;
            assert.equal(out.state.done, verdict(level.params, chk), `${level.levelId}: law and checker disagree (${JSON.stringify(chk.st.marks)} ${JSON.stringify(chk.st.pins)})`);
          }
          s = out.state;
        }
        if (L.goalMet(level, s)) { solved++; assert.ok(verdict(level.params, chk)); }
      }
    }
    times.sort((a, b) => a - b);
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(judged >= 15 && solved > 0, `judged ${judged}, solved ${solved}`);
    assert.ok(times[Math.floor(times.length * 0.95)] <= 50, `generator p95 ${times[Math.floor(times.length * 0.95)]} ms`);
  });
}

test("parkar: every word the view shows exists in all three languages and none is an economy word; vakya's words stay last; no clock, randomness or colour literal in the law or the view", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/parkar/parkar.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(parkar\.[a-zA-Z0-9.]+)"/g)].map((m) => m[1]);
  const extra = CASES.map(([, g]) => `parkar.goal.${g}`).concat(["compass", "protractor", "square", "ruler", "trace", "hinge", "walk", "measure", "again", "ray", "page"].map((k) => `parkar.${k}`));
  const ECON = /\b(points?|coins?|gems?|streaks?|lives|life left|rewards?|leaderboard|rank(ing)?|xp|level up|bonus|jackpot|loot|unlock(ed)?|hurry|jaldi|time'?s up|game over)\b/i;
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) { assert.ok(words[k]?.[l], `${k} ${l}`); assert.doesNotMatch(words[k][l], ECON, k); }
  const logic = readFileSync(`${ROOT}src/play/families/parkar/parkar.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// the play server: every parkar coverage entry serves a proven level at every fade (levelsFor and currentLevel); the
// solver's acts grade solved through the server; a claim never solves; a mal-rule the level discriminates folds its kit id
const PE = () => coverage().entries.filter((e) => e.family === "parkar");

test("parkar coverage: the twelve authored entries, mapped to real kit misconceptions; the five construction topics are parkar's now", () => {
  assert.deepEqual(PE().map((e) => `${e.topicId}|${e.mode}|${e.goal}`), [
    "c7-maths-ch07-t01|build|sss", "c7-maths-ch07-t01|build|long", "c7-maths-ch07-t01|build|short",
    "c7-maths-ch09-t02|build|sas", "c7-maths-ch09-t02|build|asa", "c7-maths-ch09-t02|build|rhs", "c7-maths-ch09-t02|build|ssa",
    "c7-maths-ch14-t01|bisect|perp", "c7-maths-ch14-t01|bisect|angle", "c7-maths-ch14-t01|bisect|sixty", "c6-maths-ch08-t03|bisect|equi", "c7-maths-ch07-t02|drop|alt"]);
  for (const e of PE()) for (const kit of Object.values(e.misMap)) assert.ok(kit.startsWith(`${e.topicId}-m-`), kit);
  for (const sk of ["c7-maths-ch07-t01-s1", "c7-maths-ch07-t01-s2", "c7-maths-ch07-t01-s3", "c7-maths-ch07-t02-s1", "c7-maths-ch07-t02-s2", "c7-maths-ch09-t02-s1", "c7-maths-ch09-t02-s2",
    "c7-maths-ch09-t02-s3", "c7-maths-ch14-t01-s1", "c7-maths-ch14-t01-s2", "c7-maths-ch14-t01-s3", "c6-maths-ch08-t03-s2", "c6-maths-ch08-t03-s3"]) {
    assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "parkar", sk);
  }
});

for (const e of PE()) for (const fade of [1, 2, 3]) {
  test(`parkar server ${e.topicId} ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3"]) {
      const s = { childId: child, key: entryKey(e), skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade, lang: "hinglish", childArt: null, lastArt: null,
        mis: {}, pL: undefined, n: 0, seed: seedOf(child, entryKey(e), 0), door: "garam", recent: [], hist: null };
      const cur = currentLevel(s, e);
      assert.ok(cur && cur.family === "parkar" && cur.mode === e.mode && cur.params.goal === e.goal, "currentLevel serves");
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.look, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      const g = gradeActs(level, env(L.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "run", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && L.malActs(level, m));
        const mg = gradeActs(level, env(L.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      const hidden = hiddenOf(level);
      assert.ok(Array.isArray(hidden) && hidden.length > 0, "hidden values");
    }
  });
}
