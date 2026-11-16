// r7 nazariya2 · Nazariya's two new modes: tri (c6-maths-ch06-t03, the area of a triangle as the cloth on the floor plot)
// and solid (c4-maths-ch01-t01, faces, edges and corners of a solid turned in the hand). For every new coverage entry:
// generated levels validate, the solver's acts grade solved and clean, the shortcut search finds nothing, each mapped
// mal-rule lands on its own kit misconception, the picker's p95 stays under 50 ms and the entry serves through
// currentLevel. Then an independent checker (plain arithmetic: the cloth's area from its corners by the shoelace sum, the
// tiles counted, a solid's faces / edges / corners from a table) is fed every act the law accepted and must agree with the
// law's verdict. The existing nazariya levels are pinned (generator hash and served levelIds from before the change).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { triLogic, TRI_MAL, matchMal, boxMal, slantOf } from "../src/play/families/nazariya/tri.logic.ts";
import { solidLogic, SOLID_MAL, geoOf, visibleAt } from "../src/play/families/nazariya/solid.logic.ts";
import { coverage, entryKey, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { CHANCE_WEIGHT, GAME_WEIGHT, MODES } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { pickLevels } from "../src/play/core/pick.ts";
import { gradeLevel } from "../src/play/core/replay.ts";
import { engineFor } from "../src/play/engines/registry.ts";
import { mulberry32 } from "../src/play/core/rng.ts";
import { counted, assertPickWork } from "./_work.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const NEW = () => coverage().entries.filter((e) => e.family === "nazariya" && (e.mode === "tri" || e.mode === "solid"));
const reqOf = (e, seed, fade) => ({ family: "nazariya", mode: e.mode, goal: e.goal, topicId: e.topicId, skillId: e.skillId, classLevel: e.classLevel, fade, mis: {}, misMap: e.misMap, grammar: e.grammar, recent: [], seed });
const levelsOf = (e, seeds = [1, 7, 42]) => {
  const logic = LOGIC[`nazariya/${e.mode}`], out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) { const r = pickLevels(logic, reqOf(e, seed, fade)); if (r) { out.push(r.garam); if (r.teekha) out.push(r.teekha); } }
  return out;
};

test("nazariya2: the modes are registered (MODES, logic, a verb, drawn by the 2D view, not Khand)", () => {
  assert.deepEqual([...MODES.nazariya], ["views", "array", "floor", "powers", "mirror", "tri", "solid"]);
  assert.equal(LOGIC["nazariya/tri"], triLogic); assert.equal(LOGIC["nazariya/solid"], solidLogic);
  for (const m of ["tri", "solid"]) {
    const a = playActOf("nazariya", m);
    assert.ok(a?.act && a.hi && a.en, m);
    assert.doesNotMatch(`${a.hi} ${a.en}`, /chun|choose|pick/i);
    assert.equal(engineFor("nazariya", m), null, `${m} is not a Khand mode`);
  }
  assert.deepEqual([...TRI_MAL], ["lxb", "slant-side", "shape-looks"]);
  assert.deepEqual([...SOLID_MAL], ["visible-only", "edges-corners"]);
});

test("nazariya2 coverage: the six new entries, mapped to verified kit misconceptions; both topics are nazariya's", () => {
  assert.deepEqual(NEW().map((e) => `${e.topicId}|${e.mode}|${e.goal}|${Object.keys(e.misMap).join(",")}`), [
    "c6-maths-ch06-t03|tri|box|slant-side", "c6-maths-ch06-t03|tri|more|shape-looks", "c6-maths-ch06-t03|tri|match|lxb,slant-side",
    "c4-maths-ch01-t01|solid|edges|visible-only,edges-corners", "c4-maths-ch01-t01|solid|faces|visible-only", "c4-maths-ch01-t01|solid|corners|visible-only,edges-corners"]);
  const kits = ["c4", "c6"].map((k) => readFileSync(`${ROOT}data/kits/${k}-maths.json`, "utf8")).join("");
  const ids = new Set([...kits.matchAll(/"(c[46]-maths-ch\d+-t\d+-m-[a-z0-9-]+)"/g)].map((m) => m[1]));
  for (const e of NEW()) for (const kit of Object.values(e.misMap)) { assert.ok(kit.startsWith(`${e.topicId}-m-`), kit); assert.ok(ids.has(kit), `${kit} is a kit id`); }
  for (const sk of ["c6-maths-ch06-t03-s1", "c6-maths-ch06-t03-s2", "c6-maths-ch06-t03-s3", "c4-maths-ch01-t01-s1", "c4-maths-ch01-t01-s2", "c4-maths-ch01-t01-s3"]) {
    assert.ok(hasPlay(sk), sk); assert.equal(entryFor({ skillId: sk }).family, "nazariya", sk);
  }
});

for (const e of NEW()) {
  const logic = LOGIC[`nazariya/${e.mode}`], tag = `${e.mode}/${e.goal} ${JSON.stringify(e.grammar)}`;
  test(`nazariya2 ${tag}: valid, solvable and clean, shortcut-free, every mal-rule on its own misconception, hidden values`, () => {
    const lv = levelsOf(e);
    assert.ok(lv.length >= 6, `${lv.length} levels`);
    const seen = new Set();
    for (const level of lv) {
      const v = logic.validate(level);
      assert.ok(v, level.levelId);
      const g = gradeLevel(logic, v, env(logic.solve(v)), { final: true });
      assert.equal(g.verdict, "solved"); assert.ok(g.clean);
      // tri/more is one corner placed (a lucky tap lands it): its correct enters at the chance-adjusted weight (GAMES-03)
      assert.equal(g.evidence[0].weight, e.goal === "more" ? CHANCE_WEIGHT : GAME_WEIGHT);
      assert.equal(logic.shortcut(v), null);
      for (const [mal, kit] of Object.entries(e.misMap)) {
        const acts = logic.malActs(v, mal);
        if (!acts) continue;
        const mg = gradeLevel(logic, v, env(acts), { final: true });
        assert.notEqual(mg.verdict, "solved", `${mal} never solves`);
        const mis = mg.moments.filter((m) => m.kind === "misconception_consequence").map((m) => m.misconceptionId);
        assert.deepEqual([...new Set(mis)], [mal], `${level.levelId} ${mal}`);
        assert.equal((mg.evidence[0]?.misconceptionId ?? mg.evidence[0]?.chanceMis), kit);
        seen.add(mal);
      }
      const hidden = hiddenOf(v);
      if (e.goal === "match" || e.mode === "solid") assert.ok(hidden.length > 0 && hidden.every((x) => Number.isFinite(x)));
    }
    assert.deepEqual([...seen].sort(), Object.keys(e.misMap).sort(), "every mapped belief is shown by some level");
  });
  test(`nazariya2 ${tag}: the picker's work is bounded (counted, not timed) and the entry serves through currentLevel at every fade`, () => {
    // measured 2026-11-10: at most 60 candidates and 1,275 calls into the family logic per pick over all entries; bound 3x above
    const c = counted(logic);
    for (let seed = 1; seed <= 40; seed++) {
      c.reset();
      const picked = pickLevels(c.logic, reqOf(e, seed, 1 + (seed % 3)));
      assert.ok(picked);
      assertPickWork(`${tag} seed ${seed}`, picked, c.calls(), { maxConsidered: 180, maxCalls: 4000 });
    }
    for (const fade of [1, 2, 3]) {
      const s = { childId: "c1", key: entryKey(e), skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade, lang: "hinglish", childArt: null, lastArt: null, mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(e), 0), door: "garam", recent: [], hist: null };
      const l = currentLevel(s, e);
      assert.ok(l && logic.validate(l), `${tag} fade ${fade}`);
      assert.equal(l.mode, e.mode); assert.equal(l.goal, e.goal);
    }
  });
}

// ───────────────────────────── the independent checker ─────────────────────────────
/** twice a triangle's area from its three corners (the shoelace sum) */
const shoelace2 = (a, b, c) => Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]));
/** faces, edges, corners of each solid (counted by hand: a cube 6 / 12 / 8; a square pyramid 5 / 8 / 5; a triangular prism 5 / 9 / 6) */
const COUNTS = { cube: { face: 6, edge: 12, corner: 8 }, cuboid: { face: 6, edge: 12, corner: 8 }, pyramid: { face: 5, edge: 8, corner: 5 }, prism: { face: 5, edge: 9, corner: 6 } };
const WANT = { faces: "face", edges: "edge", corners: "corner" };
function checker(level) {
  const p = level.params, st = { tiles: new Set(), pt: null, marks: { face: new Set(), edge: new Set(), corner: new Set() } }, stack = [];
  const snap = () => ({ tiles: new Set(st.tiles), pt: st.pt, marks: { face: new Set(st.marks.face), edge: new Set(st.marks.edge), corner: new Set(st.marks.corner) } });
  return {
    st,
    feed(a) {
      if (a.kind === "undo") { const prev = stack.pop(); if (prev) Object.assign(st, prev); return; }
      if (a.kind === "check") return;
      stack.push(snap());
      if (a.kind === "place") st.tiles.add(`${a.x},${a.z}`);
      if (a.kind === "remove") st.tiles.delete(`${a.x},${a.z}`);
      if (a.kind === "layer" || a.kind === "clear") for (let z = Math.max(0, Math.min(a.z0, a.z1)); z <= Math.min(p.d - 1, Math.max(a.z0, a.z1)); z++) for (let x = Math.max(0, Math.min(a.x0, a.x1)); x <= Math.min(p.w - 1, Math.max(a.x0, a.x1)); x++) { if (a.kind === "layer") st.tiles.add(`${x},${z}`); else st.tiles.delete(`${x},${z}`); }
      if (a.kind === "apex") st.pt = [a.x, a.z];
      if (a.kind === "mark") st.marks[a.el].add(a.i);
    },
  };
}
function oneShape(tiles) {
  if (!tiles.size) return false;
  const first = [...tiles][0], seen = new Set([first]), q = [first];
  while (q.length) { const [x, z] = q.pop().split(",").map(Number); for (const k of [`${x + 1},${z}`, `${x - 1},${z}`, `${x},${z + 1}`, `${x},${z - 1}`]) if (tiles.has(k) && !seen.has(k)) { seen.add(k); q.push(k); } }
  return seen.size === tiles.size;
}
/** does the end state meet the task, read from the params' plain meaning? */
function verdict(level, st) {
  const p = level.params;
  if (level.mode === "solid") {
    const want = WANT[p.goal], n = COUNTS[p.solid];
    return st.marks[want].size === n[want] && Object.keys(n).every((k) => k === want || st.marks[k].size === 0);
  }
  const t = p.tri, cloth2 = shoelace2([t.x0, t.zb], [t.x1, t.zb], [t.xa, t.za]);
  if (p.goal === "more") return !!st.pt && st.pt[1] < t.zb && shoelace2([t.x0, t.zb], [t.x1, t.zb], st.pt) > cloth2;
  if (p.goal === "match") return oneShape(st.tiles) && st.tiles.size * 2 === cloth2;
  // box: exactly the rectangle with the base as a side and the top corner on the opposite side; twice the cloth
  const want = new Set(); for (let z = t.za; z < t.zb; z++) for (let x = t.x0; x < t.x1; x++) want.add(`${x},${z}`);
  return st.tiles.size === want.size && [...want].every((k) => st.tiles.has(k)) && st.tiles.size === cloth2;
}

for (const e of NEW()) {
  const logic = LOGIC[`nazariya/${e.mode}`], tag = `${e.mode}/${e.goal} ${JSON.stringify(e.grammar)}`;
  test(`nazariya2 ${tag}: 1,500 acts (random, solver and mal-rule acts mixed) agree with the independent checker`, () => {
    const rnd = mulberry32(17);
    let acts = 0, done = 0;
    for (const level of levelsOf(e, [3, 11, 19, 27])) {
      const v = logic.validate(level), p = v.params, sol = logic.solve(v);
      const mals = Object.keys(e.misMap).map((m) => logic.malActs(v, m)).filter(Boolean);
      for (let run = 0; run < 6 && acts < 1500; run++) {
        const k = checker(v), plan = run % 3 === 0 ? sol : run % 3 === 1 && mals.length ? mals[run % mals.length] : null;
        let s = logic.init(v), seq = 0;
        for (let i = 0; i < 40; i++) {
          let a;
          if (plan && i < plan.length) a = plan[i];
          else {
            const r = rnd();
            if (v.mode === "solid") a = r < 0.25 ? { kind: "turn", dir: ["left", "right", "over"][Math.floor(rnd() * 3)] } : r < 0.85 ? { kind: "mark", el: ["face", "edge", "corner"][Math.floor(rnd() * 3)], i: Math.floor(rnd() * 12) } : r < 0.93 ? { kind: "undo" } : { kind: "check" };
            else if (p.goal === "more") a = r < 0.7 ? { kind: "apex", x: Math.floor(rnd() * (p.w + 1)), z: Math.floor(rnd() * (p.d + 1)) } : r < 0.8 ? { kind: "undo" } : { kind: "check" };
            else { const x = Math.floor(rnd() * p.w), z = Math.floor(rnd() * p.d); a = r < 0.35 ? { kind: "place", x, z } : r < 0.5 ? { kind: "remove", x, z } : r < 0.7 ? { kind: "layer", x0: x, z0: z, x1: Math.min(p.w - 1, x + Math.floor(rnd() * 4)), z1: Math.min(p.d - 1, z + Math.floor(rnd() * 4)) } : r < 0.8 ? { kind: "clear", x0: 0, z0: z, x1: x, z1: z } : r < 0.9 ? { kind: "undo" } : { kind: "check" }; }
          }
          const r = logic.apply(v, s, a, ++seq); acts++;
          if (!r.refused || a.kind === "check") { if (!r.refused) k.feed(a); }
          s = r.state;
          if (a.kind === "check") {
            assert.equal(s.done, verdict(v, k.st), `${v.levelId} check #${seq}: law ${s.done}`);
            if (s.done) { done++; break; }
          }
        }
      }
    }
    assert.ok(acts >= 1000 && done >= 3, `${acts} acts, ${done} solved`);
  });
}

// ───────────────────────────── beliefs as the kit writes them ─────────────────────────────
test("nazariya2 tri: the beliefs say the kit's numbers (a 3-4-5 cloth: 6 tiles; 12 not halved; 10 with the slant 5 × 4 ÷ 2)", () => {
  const t = { x0: 2, x1: 5, zb: 6, xa: 2, za: 2 };   // base 3, upright 4, slant 5
  assert.equal(slantOf(t), 5);
  assert.equal(matchMal(t, "lxb"), 12);
  assert.equal(matchMal(t, "slant-side"), 10);
  const t2 = { x0: 0, x1: 6, zb: 5, xa: 6, za: 1 };  // the kit's 6 by 4 rectangle cut corner to corner: 12, not 24
  assert.equal(matchMal(t2, "lxb"), 24); assert.equal(slantOf(t2), null); assert.equal(matchMal(t2, "slant-side"), null);
  const p = { w: 12, d: 9, hmax: 1, base: [], lock: [], goal: "box", tri: t };
  assert.deepEqual(boxMal(p, "slant-side"), [5, 4], "the slanted side taken as the rectangle's length");
});

test("nazariya2 tri: the law's rules (one piece of floor; tiles refused in more; B's corner above the base; tampered params)", () => {
  const e = NEW().find((x) => x.goal === "match"), v = triLogic.validate(levelsOf(e, [5])[0]), p = v.params;
  let s = triLogic.init(v);
  s = triLogic.apply(v, s, { kind: "place", x: 0, z: 0 }, 1).state;
  s = triLogic.apply(v, s, { kind: "place", x: 5, z: 5 }, 2).state;
  assert.equal(triLogic.apply(v, s, { kind: "check" }, 3).refused, "one_floor");
  assert.equal(triLogic.apply(v, s, { kind: "apex", x: 1, z: 1 }, 3).refused, "no_corner_here");
  const m = triLogic.validate(levelsOf(NEW().find((x) => x.goal === "more"), [5])[0]), t = m.params.tri;
  const s0 = triLogic.init(m);
  assert.equal(triLogic.apply(m, s0, { kind: "place", x: 0, z: 0 }, 1).refused, "no_tiles_here");
  assert.equal(triLogic.apply(m, s0, { kind: "apex", x: 1, z: t.zb }, 1).refused, "below_base");
  assert.equal(triLogic.apply(m, s0, { kind: "check" }, 1).refused, "set_first");
  // sliding A's corner along its own line: the same cloth (the consequence), never solved
  const slid = triLogic.apply(m, triLogic.apply(m, s0, { kind: "apex", x: t.xa === t.x0 ? t.x1 : t.x0, z: t.za }, 1).state, { kind: "check" }, 2);
  assert.equal(slid.state.done, false); assert.ok(slid.moments.some((x) => x.misconceptionId === "shape-looks"));
  for (const bad of [{ ...p, tri: { ...p.tri, x1: p.tri.x0 + 1 } }, { ...p, tri: { ...p.tri, za: p.tri.zb } }, { ...p, hmax: 2 }, { ...p, goal: "nope" }, { ...m.params, tri: { ...m.params.tri, xa: m.params.tri.x0 + 1 } }]) {
    assert.equal(triLogic.validate({ ...v, params: bad, goal: bad.goal }), null, JSON.stringify(bad.tri));
  }
});

test("nazariya2 solid: Euler's counts hold for every solid; every face is in sight from some turn and never all from one; marks out of sight are refused", () => {
  for (const [solid, dims] of [["cube", [1, 1, 1]], ["cuboid", [1.8, 0.7, 1.1]], ["pyramid", [1.4, 1.3, 1.4]], ["prism", [1.3, 1.5, 1.3]]]) {
    const g = geoOf({ solid, dims });
    assert.deepEqual([g.faces.length, g.edges.length, g.verts.length], [COUNTS[solid].face, COUNTS[solid].edge, COUNTS[solid].corner], solid);
    const union = new Set();
    for (let o = 0; o < 8; o++) { const f = visibleAt(g, o).face; assert.ok(f.length < g.faces.length && f.length >= 2, `${solid} o${o}: ${f.length} faces in sight`); f.forEach((x) => union.add(x)); }
    assert.equal(union.size, g.faces.length, `${solid}: every face can be turned into sight`);
  }
  const e = NEW().find((x) => x.goal === "faces"), v = solidLogic.validate(levelsOf(e, [5])[0]), g = geoOf(v.params);
  const s0 = solidLogic.init(v), hidden = g.faces.findIndex((_, i) => !visibleAt(g, s0.o).face.includes(i)), shown = visibleAt(g, s0.o).face[0];
  assert.equal(solidLogic.apply(v, s0, { kind: "mark", el: "face", i: hidden }, 1).refused, "hidden");
  const s1 = solidLogic.apply(v, s0, { kind: "mark", el: "face", i: shown }, 1).state;
  assert.equal(solidLogic.apply(v, s1, { kind: "mark", el: "face", i: shown }, 2).refused, "already", "a second stamp on a face is refused");
  for (const bad of [{ ...v.params, dims: [2, 2, 2] }, { ...v.params, solid: "sphere" }, { ...v.params, start: 9 }]) assert.equal(solidLogic.validate({ ...v, params: bad }), null);
});

test("nazariya2: every word the views show exists in all three languages, before vakya's; the laws read no clock and no RNG", () => {
  const raw = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(raw);
  const used = ["tri", "solid"].flatMap((m) => [...readFileSync(`${ROOT}src/play/families/nazariya/${m}.view.ts`, "utf8").matchAll(/W\("(nazariya\.[a-zA-Z0-9.]+)"/g)].map((x) => x[1]));
  const extra = ["box", "match", "more"].map((g) => `nazariya.tri.goal.${g}`).concat(["faces", "edges", "corners"].map((g) => `nazariya.solid.goal.${g}`), ["cube", "cuboid", "pyramid", "prism"].map((s) => `nazariya.solid.${s}`));
  const firstVakya = keys.findIndex((k) => k.startsWith("vakya."));
  for (const k of [...used, ...extra]) { for (const l of ["hinglish", "en", "hi"]) assert.ok(raw[k]?.[l], `${k} ${l}`); assert.ok(keys.indexOf(k) < firstVakya, `${k} before vakya`); }
  for (const f of ["tri", "solid"]) assert.doesNotMatch(readFileSync(`${ROOT}src/play/families/nazariya/${f}.logic.ts`, "utf8").replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
});

// The existing levels are the very same: before r7 nazariya2 the generator over every existing nazariya entry (20 seeds, three
// fades, classes 4-6: 68,988 candidates) hashed as below, and the play server served these levelIds (two children each, fade 1)
test("nazariya2: existing nazariya entries generate and serve the same levels as before (pinned)", () => {
  const OLD = coverage().entries.filter((x) => x.family === "nazariya" && x.mode !== "tri" && x.mode !== "solid");
  const h = createHash("sha256"); let n = 0;
  for (const e of OLD) { const logic = LOGIC[`nazariya/${e.mode}`];
    for (let seed = 0; seed < 20; seed++) for (const fade of [1, 2, 3]) for (const cls of [4, 5, 6]) {
      for (const c of logic.generate({ family: "nazariya", mode: e.mode, goal: e.goal, topicId: e.topicId, skillId: e.skillId, classLevel: cls, fade, mis: {}, misMap: e.misMap, grammar: e.grammar, recent: [], seed })) { h.update(JSON.stringify(c)); n++; }
    } }
  assert.equal(n, 68988);
  assert.equal(h.digest("hex"), "5782a552e9f54da9411f75a36a6d4824f293192e61cd151272f6328ffac77091");
  const PIN = ["nz-views-build3-2x2-21-466871998", "nz-views-build3-2x2-26-434499354", "nz-views-same-2x2-33-574095199", "nz-views-same-2x2-34-53275136", "nz-array-fill-8x5-111826680", "nz-array-fill-5x8-321711121",
    "nz-array-turn-4x8-141720790", "nz-array-turn-8x4-322178153", "nz-floor-area-18-0-946316849", "nz-floor-area-18-1-939738777", "nz-floor-perimeter-12-0-183634384", "nz-floor-perimeter-12-0-805028267",
    "nz-floor-min-10-0-125899015", "nz-floor-min-10-0-356084394", "nz-floor-perimeter-12-0-407867441", "nz-floor-perimeter-12-0-467665056", "nz-floor-side-10-2-265261289", "nz-floor-side-10-2-721861618",
    "nz-floor-area-18-0-254677034", "nz-floor-area-18-0-137778268", "nz-floor-max-12-0-798065813", "nz-floor-max-10-0-567597030", "nz-powers-square-3-92718729", "nz-powers-square-3-404155120",
    "nz-powers-cube-1-741678132", "nz-powers-cube-1-845341836", "nz-mirror-z-4x6-23-217868049", "nz-mirror-x-8x3-6-420407744", "nz-mirror-x-10x3-35-779573843", "nz-mirror-x-10x4-33-788997643",
    "nz-mirror-z-3x8-30-491665349", "nz-mirror-z-3x8-8-479018769"];
  const ids = [];
  for (const e of OLD) for (let k = 0; k < 2; k++) {
    const s = { childId: `pin${k}`, key: entryKey(e), skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null, mis: {}, pL: undefined, n: 0, seed: seedOf(`pin${k}`, entryKey(e), 0), door: "garam", recent: [], hist: null };
    ids.push(currentLevel(s, e)?.levelId);
  }
  assert.deepEqual(ids, PIN);
});

// r7 (main, 2026-11-08): the first level must differ from child to child. Before the seeded difficulty nudge, every child
// met the same pyramid from the same view (corners) and the same cube (faces, edges), and 3-4-5 for every right-angled
// match. The right-angled match keeps a lean to Pythagorean triples (only those show the slant-side belief), so it is held
// to a lower floor than the rest.
test("tri and solid: the first level served differs across children", async () => {
  const { coverage, currentLevel, entryKey, seedOf } = await import("../server/play/levels.js");
  for (const e of coverage().entries.filter((x) => x.family === "nazariya" && (x.mode === "tri" || x.mode === "solid"))) {
    const key = entryKey(e), sigs = new Set();
    for (let c = 0; c < 20; c++) {
      const child = `var-${c}`;
      const s = { childId: child, key, skillId: e.skillId, lessonId: null, classLevel: e.classLevel, fade: 1, lang: "en", childArt: null, lastArt: null, mis: {}, pL: undefined, n: 0, seed: seedOf(child, key, 0), door: "garam", recent: [], hist: null };
      sigs.add(currentLevel(s, e).sig);
    }
    const floor = e.mode === "tri" && e.goal === "match" && !e.grammar?.any ? 4 : 8;
    assert.ok(sigs.size >= floor, `${e.topicId} ${e.mode}/${e.goal}: ${sigs.size} distinct first levels over 20 children (floor ${floor})`);
  }
});

test("nazariya tri match: one coverage entry lays both right-angled and any-apex cloths (audit GAMES-02)", async () => {
  const { RULES } = await import("../server/play/tools/rules/nazariya.mjs");
  assert.equal(RULES.filter((r) => r.topicId === "c6-maths-ch06-t03" && r.mode === "tri" && r.goal === "match").length, 1);
  const { logicFor } = await import("../src/play/families/index.ts");
  const L = logicFor("nazariya", "tri");
  const kinds = new Set();
  for (let seed = 1; seed <= 6; seed++) for (const c of L.generate({ family: "nazariya", mode: "tri", seed, goal: "match", grammar: {}, fade: 1, skillId: "c6-maths-ch06-t03-s3", topicId: "c6-maths-ch06-t03", classLevel: 6, mis: {}, misMap: {}, recent: [] })) {
    const t = c.level.params.tri; kinds.add(t.xa === t.x0 || t.xa === t.x1 ? "right" : "any");
  }
  assert.deepEqual([...kinds].sort(), ["any", "right"]);
  const cov = JSON.parse(readFileSync(new URL("../data/play/coverage.json", import.meta.url), "utf8"));
  const keys = cov.entries.map((e) => `${e.topicId}|${e.family}/${e.mode}|${e.goal}`);
  assert.equal(new Set(keys).size, keys.length, "no two coverage entries share a session key");
});
