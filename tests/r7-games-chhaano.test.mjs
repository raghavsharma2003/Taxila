// r7 Games, Chhaano · separating mixtures (class 6 science, c6-science-ch09-t01 and -t02): dry piles split by threshing,
// winnowing, handpicking and sieving; a beaker of water settled (one wait at a time), decanted, filtered, poured away or dried
// in the sun, every solid scooped into its jar. Nothing ever runs on a clock.
// Pure law checks: every generated level validates, solves and no idea-free play wins; an INDEPENDENT checker (its own
// tables, read from the kit's expectation and item texts: what is finer than what, what the wind carries, what dissolves)
// agrees with every split and every vessel the law makes over random play, and no part is ever lost; each mal-rule's acts
// land on its OWN misconception moment and fold the topic's kit id; every property and number the law uses is the kit's
// own or a scene value that claims no fact; tampered params are refused; a claim never decides; first levels differ across
// children; the generator and picker are fast (CPU time); and every coverage entry serves a proven level through the play
// server.
import { backlogged } from "./_backlog.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chhaanoLogic as L, CHHAANO_MAL, CHHAANO_MODES, GOALS_OF, DRY, WET, DRY_SCENES, KIT_OF, SETTLE_WAITS, dryParts, jarsOf, toolsOf, unseparated } from "../src/play/families/chhaano/chhaano.logic.ts";
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
const KIT = Object.fromEntries(JSON.parse(readFileSync(`${ROOT}data/kits/c6-science.json`, "utf8")).topics.map((t) => [t.topicId, t]));
const T1 = JSON.stringify(KIT["c6-science-ch09-t01"]), T2 = JSON.stringify(KIT["c6-science-ch09-t02"]);
const ALL = Object.fromEntries(CHHAANO_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "chhaano", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = [["sukha", "farak"], ["sukha", "kram"], ["geela", "nithaar"], ["geela", "chhaan"], ["geela", "namak"]];
const levelsOf = (mode, goal, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of L.generate(req(mode, goal, seed, { fade }))) out.push(c);
  return out;
};

// ───────────────────────────── THE INDEPENDENT CHECKER (its own tables; none of the law's helpers) ─────────────────────────────
// Sizes as the kit orders them: what passes a kitchen sieve or a mesh (flour, dust, fine sand) is finer than grain-sized
// things (grain, husk "nearly the same size as wheat grains", small stones "of the same size" as rice, bran that stays in
// the sieve, til), which are finer than large pebbles and stalks (sieved out after winnowing).
const FINE = new Set(["atta", "dust", "sand"]), BIG = new Set(["pebble", "stalks", "bundle"]);
const sizeOf = (x) => (FINE.has(x) ? 1 : BIG.has(x) ? 3 : 2);
const LIGHT = new Set(["husk", "dust"]), HEAVY = new Set(["wheat", "bajra", "rice", "moong", "stone", "pebble"]);
const DISSOLVES = new Set(["salt", "sugar"]), SETTLES = new Set(["mitti", "sand", "paint", "rice"]);
/** the checker's reading of one accepted sukha act: the piles it must leave, from the pile before */
function checkSplit(m, before, scene, grain) {
  const sc = { khet: 2, supa: 1, moong: 1, dal: 1, chakki: 1, site: 1, til: 1 }[scene];
  if (m === "thresh") return [before.filter((x) => x !== "bundle").concat(grain), ["stalks"]];
  if (m === "winnow") return [before.filter((x) => HEAVY.has(x)), before.filter((x) => LIGHT.has(x))];
  if (m === "sieve") return [before.filter((x) => sizeOf(x) > sc), before.filter((x) => sizeOf(x) <= sc)];
  if (m === "pick") { const few = { khet: ["stone"], supa: ["stone"], moong: ["stone"], dal: ["stone"], chakki: ["pebble"], site: [], til: ["tilB"] }[scene]; return [before.filter((x) => !few.includes(x)), ...before.filter((x) => few.includes(x)).map((x) => [x])]; }
  return null;
}
const norm = (piles) => piles.map((x) => [...new Set(x)].sort().join("+")).filter(Boolean).sort();

test("chhaano: the family is registered (FAMILIES, MODES, arts, logic, views, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("chhaano"));
  assert.deepEqual([...MODES.chhaano], ["sukha", "geela"]);
  assert.deepEqual([...CHHAANO_MODES], ["sukha", "geela"]);
  assert.equal(FAMILY_ARTS.chhaano.length, 4);
  const views = readFileSync(`${ROOT}src/play/families/views.ts`, "utf8"), data = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).chhaano;
  for (const m of CHHAANO_MODES) {
    assert.equal(LOGIC[`chhaano/${m}`], L);
    assert.match(views, new RegExp(`"chhaano/${m}": makeChhaanoView`));
    const v = playActOf("chhaano", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
    assert.doesNotMatch(`${v.hi} ${v.en}`, /chun|choose|pick/i);
    assert.ok(data?.[m]?.act && data[m].hi && data[m].en, `verbs.json chhaano/${m}`);
  }
});

test("chhaano: every property the law uses is the kit's own; every number is a scene value that claims no fact", () => {
  // the kit sentences each property rests on are in the topic kit, word for word
  for (const [what, text] of Object.entries(KIT_OF)) assert.ok(T1.includes(text), `${what}: "${text}" is not in the ch09-t01 kit`);
  assert.match(T2, /heavier insoluble particles settle to the bottom when a mixture is left undisturbed/);
  assert.match(T2, /traps insoluble solids and lets the liquid through/);
  assert.match(T2, /Dissolved substances like salt or sugar pass through a filter/);
  assert.match(T2, /the water evaporates and the salt is left behind/);
  assert.match(T2, /may still be a little cloudy/); assert.match(T2, /Filter the liquid to catch the remaining sand/);
  assert.match(T2, /Clear-looking water is not necessarily safe to drink; germs and dissolved substances can remain/);
  // the law's tables agree with the checker's (read from the same kit sentences)
  for (const [x, d] of Object.entries(DRY)) {
    assert.equal(d.size, sizeOf(x), `${x} size`);
    if (d.wt) assert.ok(d.wt === "light" ? LIGHT.has(x) : HEAVY.has(x), `${x} weight`);
  }
  for (const [x, d] of Object.entries(WET)) assert.equal(d.kind === "dis", DISSOLVES.has(x), x), assert.equal(d.kind === "settle", SETTLES.has(x), x);
  // a scene that winnows names a weight for every part that reaches the wind (no weight is ever guessed)
  for (const [scene, sc] of Object.entries(DRY_SCENES)) if (sc.tools.includes("winnow")) for (const c of levelsOf("sukha", "kram").concat(levelsOf("sukha", "farak")).filter((c) => c.level.params.scene === scene)) for (const x of dryParts(c.level.params)) assert.ok(x === "stalks" || DRY[x].wt, `${scene}: ${x}`);
  // the kit states no number of waits, distance or amount: the settling waits are a scene value, declared as one
  const logic = readFileSync(`${ROOT}src/play/families/chhaano/chhaano.logic.ts`, "utf8"), view = readFileSync(`${ROOT}src/play/families/chhaano/chhaano.view.ts`, "utf8");
  const decl = logic.split("\n").findIndex((l) => /export const SETTLE_WAITS = \d+;/.test(l));
  assert.match(logic.split("\n")[decl - 1], /scene value, no fact claimed/);
  assert.equal(SETTLE_WAITS, 3);
  // every top-level numeric constant in the logic is one of: the settling waits (scene), the difficulty nudge (picker only)
  const consts = [...logic.matchAll(/^(?:export )?const ([A-Z_]+) = ([0-9.]+);/gm)].map((m) => m[1]).sort();
  assert.deepEqual(consts, ["JITTER", "SETTLE_WAITS"]);
  assert.match(view, /particle places are the level's own/);
  // nothing on screen states a number: no digit in any chhaano word (the {n} of "Pile {n}" is the pile's place only)
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words;
  for (const [k, v] of Object.entries(words)) if (k.startsWith("chhaano.")) for (const l of ["hinglish", "en", "hi"]) assert.doesNotMatch(v[l].replace(/\{\w+\}/g, ""), /[0-9०-९]/, `${k} ${l}`);
  // the winnowing piles are "near" and "far" only (never a distance)
  assert.deepEqual(["near", "far"].map((s) => words[`chhaano.spot.${s}`].en), ["Near", "Far"]);
});

for (const [mode, goal] of CASES) {
  test(`chhaano ${mode}/${goal}: every level validates, solves, is shortcut-free; mal-rules land on their own misconception`, () => {
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
      // what "separated" means, read plainly: every pile one part (sukha); every jar holding its own part (geela)
      if (mode === "sukha") {
        assert.deepEqual(norm(done.s.piles), dryParts(level.params), `${c.signature}: one pile per part`);
        if (goal === "kram") assert.ok(new Set(sol.filter((a) => a.kind === "use").map((a) => a.m)).size >= 2, `${c.signature}: two methods at least`);
        if (goal === "farak") assert.equal(new Set(sol.filter((a) => a.kind === "use").map((a) => a.m)).size, 1, `${c.signature}: one method`);
      } else assert.deepEqual(done.s.jars, jarsOf(level.params).map((x) => [x]));
      for (const mal of CHHAANO_MAL) {
        const acts = L.malActs(level, mal);
        if (!acts) continue;
        seen.add(mal);
        const m = run(level, acts);
        assert.ok(!m.s.done, `${c.signature} ${mal} must not solve`);
        const mc = m.ms.filter((x) => x.kind === "misconception_consequence");
        assert.equal(mc.length, 1, `${c.signature} ${mal}`); assert.equal(mc[0].misconceptionId, mal);
        const mg = L.grade(level, env(acts));
        assert.equal(mg.evidence[0].outcome, "incorrect"); assert.equal((mg.evidence[0].misconceptionId ?? mg.evidence[0].chanceMis), `k-${mal}`);
      }
    }
    const want = { farak: ["heavy-far", "same-size"], kram: ["one-method", "heavy-far", "same-size"], nithaar: [], chhaan: [], namak: ["salt-gone", "filter-salt", "clear-pure"] }[goal];
    assert.deepEqual([...seen].sort(), [...want].sort(), `${goal}: mal-rules shown`);
  });
}

test("chhaano: random play — the checker agrees with every split and vessel the law makes, and no part is ever lost", () => {
  const rnd = mulberry32(2026);
  let accepted = 0, thrown = 0;
  for (const [mode, goal] of CASES) for (const c of levelsOf(mode, goal, [5, 11])) {
    const level = L.validate(c.level), p = level.params;
    let s = L.init(level);
    for (let k = 0; k < 40 && !s.done; k++) {
      let a;
      if (mode === "sukha") {
        const m = DRY_SCENES[p.scene].tools[Math.floor(rnd() * DRY_SCENES[p.scene].tools.length)];
        const sp = rnd(); a = rnd() < 0.08 ? { kind: "done" } : rnd() < 0.05 ? { kind: "undo" } : { kind: "use", m, at: Math.floor(rnd() * s.piles.length), ...(sp < 0.35 ? {} : { spot: sp < 0.85 ? "near" : "far" }) };
      } else {
        const tools = toolsOf(p), jars = jarsOf(p), r = rnd();
        a = r < 0.06 ? { kind: "done" } : r < 0.1 ? { kind: "undo" } : r < 0.3 ? { kind: "take", at: Math.floor(rnd() * s.ves.length), jar: Math.floor(rnd() * jars.length) } : { kind: "use", m: tools[Math.floor(rnd() * tools.length)], at: Math.floor(rnd() * s.ves.length) };
      }
      const r = L.apply(level, s, a, k + 1);
      if (!r.refused && a.kind === "use" && mode === "sukha" && r.state.why === "thrown") { assert.deepEqual(r.state.piles, s.piles, "a first throw separates nothing"); thrown++; }
      else if (!r.refused && a.kind === "use" && mode === "sukha") {
        accepted++;
        const before = s.piles[a.at], want = checkSplit(a.m, before, p.scene, p.grain);
        const made = r.state.piles.filter((_, i) => i === a.at || i >= s.piles.length);
        assert.deepEqual(norm(made), norm(want), `${c.signature}: ${a.m} on ${before.join("+")}`);
        assert.ok(want.filter((x) => x.length).length >= 2, `${c.signature}: an accepted ${a.m} separates something`);
      }
      if (!r.refused && a.kind === "use" && mode === "geela") {
        accepted++;
        const v = s.ves[a.at], nv = r.state.ves;
        if (a.m === "filter") {
          const paper = nv[nv.length - 2], glass = nv[nv.length - 1];
          assert.deepEqual(paper.parts, v.parts.filter((x) => !DISSOLVES.has(x)).sort(), "the paper keeps every undissolved solid");
          assert.deepEqual(glass.parts, v.parts.filter((x) => DISSOLVES.has(x)).sort(), "what is dissolved passes");
        }
        if (a.m === "dry") assert.deepEqual(nv[a.at].parts, [...v.parts].sort(), "the water goes; everything in it stays");
        if (a.m === "pour") { assert.ok(v.settle >= SETTLE_WAITS, "decanted only once settled"); assert.ok(nv[a.at].parts.every((x) => SETTLES.has(x)), "the settled layer stays"); }
        if (a.m === "wait") assert.equal(nv[a.at].settle, v.settle + 1, "one wait, one step");
      }
      s = r.state;
      // no part is ever lost: every part the level started with is still on the tray / bench / in a jar
      if (mode === "sukha") assert.deepEqual([...new Set(s.piles.flat())].sort().filter((x) => x !== "bundle"), dryParts(p).filter((x) => s.piles.flat().includes("bundle") ? x !== "stalks" && x !== p.grain || s.piles.flat().includes(x) : true));
      else for (const x of jarsOf(p)) assert.ok(s.ves.some((v) => !v.gone && v.parts.includes(x)) || s.jars.some((jr) => jr.includes(x)), `${c.signature}: ${x} lost`);
    }
  }
  assert.ok(accepted > 300, `accepted acts ${accepted}`);
  assert.ok(thrown > 20, `first throws ${thrown}`);
});

test("chhaano: the law's answers (threshing first, same weight, cannot pick, not settled, lost, the cloudy glass, the filter and the sun)", () => {
  const lv = (mode, goal, sig, fade = 2) => { for (const seed of [1, 2, 3, 4, 5]) { const c = L.generate(req(mode, goal, seed, { fade })).find((x) => x.signature === sig); if (c) return L.validate(c.level); } throw new Error(`no ${sig}`); };
  // threshing first: the grain is still on the stalks
  const khet = lv("sukha", "kram", "sukha:kram:khet:bundle+husk+stone:wheat");
  assert.deepEqual(run(khet, [{ kind: "use", m: "winnow", at: 0, spot: "near" }]).refused, ["attached"]);
  assert.deepEqual(run(khet, [{ kind: "use", m: "sieve", at: 0 }]).refused, ["attached"]);
  // the wind drops rice and small stones together (both heavy); a pure pile is one part already
  const supa = lv("sukha", "kram", "sukha:kram:supa:rice+husk+stone");
  const w = run(supa, [{ kind: "use", m: "winnow", at: 0 }, { kind: "use", m: "winnow", at: 0, spot: "near" }, { kind: "use", m: "winnow", at: 0 }]);
  assert.deepEqual(w.refused, ["same_weight"]); assert.deepEqual(w.s.piles, [["rice", "stone"], ["husk"]]);
  assert.deepEqual(run(supa, [{ kind: "use", m: "winnow", at: 0 }, { kind: "use", m: "winnow", at: 0, spot: "near" }, { kind: "use", m: "pick", at: 1 }]).refused, ["pure"]);
  // flour and bran cannot be picked by hand (the kit's "tries to handpick flour from bran")
  const chakki = lv("sukha", "farak", "sukha:farak:chakki:atta+bran", 1);
  assert.deepEqual(run(chakki, [{ kind: "use", m: "pick", at: 0 }]).refused, ["cannot_pick"]);
  assert.ok(run(chakki, [{ kind: "use", m: "sieve", at: 0 }, { kind: "done" }]).s.done);
  // "ho gaya" with a pile still mixed and two methods used: refused, but not the one-method belief
  const two = run(khet, [{ kind: "use", m: "thresh", at: 0 }, { kind: "use", m: "winnow", at: 0 }, { kind: "use", m: "winnow", at: 0, spot: "near" }, { kind: "done" }]);
  assert.deepEqual(two.refused, ["mixed"]); assert.ok(!two.ms.some((m) => m.kind === "misconception_consequence"));
  // settling: one wait, one step; decanting before it settles is refused; the decanted glass is a little cloudy with sand
  const lab = lv("geela", "nithaar", "geela:nithaar:lab:sand+salt");
  assert.deepEqual(run(lab, [{ kind: "use", m: "pour", at: 0 }]).refused, ["not_settled"]);
  const waits = Array.from({ length: SETTLE_WAITS }, () => ({ kind: "use", m: "wait", at: 0 }));
  const settled = run(lab, [...waits, { kind: "use", m: "wait", at: 0 }]);
  assert.equal(settled.s.ves[0].settle, SETTLE_WAITS); assert.deepEqual(settled.refused, ["settled"]);
  const poured = run(lab, [...waits, { kind: "use", m: "pour", at: 0 }]);
  assert.deepEqual(poured.s.ves[0], { ...poured.s.ves[0], wet: false, parts: ["sand"] });
  assert.ok(poured.s.ves[1].cloudy && poured.s.ves[1].parts.includes("sand") && poured.s.ves[1].parts.includes("salt"));
  assert.deepEqual(run(lab, [...waits, { kind: "use", m: "pour", at: 0 }, { kind: "use", m: "wait", at: 1 }]).refused, ["settled"]);
  // pouring the water away is fine when nothing wanted goes with it; never when a wanted solid would
  assert.ok(run(lab, [...waits, { kind: "use", m: "drain", at: 0 }, { kind: "take", at: 0, jar: 0 }, { kind: "done" }]).s.done);
  const chalk = lv("geela", "chhaan", "geela:chhaan:school:chalk", 1);
  assert.deepEqual(run(chalk, [{ kind: "use", m: "drain", at: 0 }]).refused, ["lost"]);
  assert.deepEqual(run(chalk, [{ kind: "take", at: 0, jar: 0 }]).refused, ["wet"]);
  // the worked example: settle, decant, filter the cloudy glass (the remaining sand), the filtrate in the sun gives the salt
  const nm = lv("geela", "namak", "geela:namak:lab:sand+salt");
  const we = run(nm, [...waits, { kind: "use", m: "pour", at: 0 }, { kind: "use", m: "filter", at: 1 }, { kind: "use", m: "dry", at: 3 },
    { kind: "take", at: 0, jar: 0 }, { kind: "take", at: 2, jar: 0 }, { kind: "take", at: 3, jar: 1 }, { kind: "done" }]);
  assert.deepEqual(we.refused, []); assert.ok(we.s.done);
  // dried before filtering, salt and sand come out together (the jar refuses the mix)
  assert.deepEqual(run(nm, [{ kind: "use", m: "dry", at: 0 }, { kind: "take", at: 0, jar: 1 }]).refused, ["mixed"]);
  // undo steps back
  assert.equal(run(nm, [{ kind: "use", m: "filter", at: 0 }, { kind: "undo" }]).s.ves.length, 1);
});

// r7 quiz fix (lead, 2026-11-09): near / far was a 50/50 guess. A FIRST throw (one handful, no sack down) shows where the
// light and the heavy parts land before the sack can be set; the heavy-far belief is a child who still sets it far after.
test("chhaano sukha: winnowing starts with a first throw; the sack is refused before it; heavy-far is far AFTER the throw", () => {
  let tested = 0;
  for (const c of [...levelsOf("sukha", "farak"), ...levelsOf("sukha", "kram")]) {
    const level = L.validate(c.level), sol = L.solve(level), k = sol.findIndex((a) => a.kind === "use" && a.m === "winnow");
    if (k < 0) continue;
    tested++;
    const pre = sol.slice(0, k), at = sol[k].at, before = run(level, pre).s;
    // the solver throws first, then sets the sack near the same pile
    assert.ok(!("spot" in sol[k]), `${c.signature}: the throw first`);
    assert.deepEqual(sol[k + 1], { kind: "use", m: "winnow", at, spot: "near" });
    // a sack set before the throw is refused: nothing moves, no belief is read from a guess
    for (const spot of ["near", "far"]) {
      const r = run(level, [...pre, { kind: "use", m: "winnow", at, spot }]);
      assert.deepEqual(r.refused, ["throw_first"], `${c.signature} ${spot}`);
      assert.deepEqual(r.s.piles, before.piles);
      assert.ok(!r.ms.some((m) => m.kind === "misconception_consequence"));
    }
    // the throw separates nothing; it is what the view shows (heavy near, light far) before the sack's place is asked
    const t = run(level, [...pre, sol[k]]);
    assert.deepEqual(t.refused, []); assert.equal(t.s.why, "thrown"); assert.deepEqual(t.s.piles, before.piles);
    assert.ok(t.s.thrown.includes(before.piles[at].join("+")));
    assert.ok(t.ms.some((m) => m.kind === "progress" && m.facts.thrown === "yes"));
    assert.deepEqual(run(level, [...pre, sol[k], sol[k]]).refused, ["thrown_already"]);
    // undo takes the throw back
    assert.deepEqual(run(level, [...pre, sol[k], { kind: "undo" }, { kind: "use", m: "winnow", at, spot: "near" }]).refused, ["throw_first"]);
    // heavy-far: the child saw the throw and still set the sack far
    const mal = L.malActs(level, "heavy-far");
    assert.ok(mal, `${c.signature}: heavy-far is served`);
    const far = mal.findIndex((a) => a.spot === "far");
    assert.equal(far, mal.length - 1);
    const seen = run(level, mal.slice(0, far)).s;
    assert.ok(seen.thrown.includes(seen.piles[mal[far].at].join("+")), `${c.signature}: the throw was seen before the far sack`);
  }
  assert.ok(tested >= 20, `winnowed levels ${tested}`);
});

test("chhaano: tampered params are refused; a claim in an act never decides; nothing is timed", () => {
  const level = L.generate(req("sukha", "kram", 5, { fade: 2 }))[0].level;
  const p = level.params, bad = (patch, o = {}) => L.validate({ ...level, ...o, params: { ...p, ...patch } });
  assert.ok(L.validate(level));
  assert.equal(bad({ mix: [...p.mix, "salt"] }), null);
  assert.equal(bad({ scene: "nowhere" }), null);
  assert.equal(bad({ goal: "namak" }), null);
  assert.equal(bad({ look: 4 }), null);
  assert.equal(bad({ lay: -1 }), null);
  assert.equal(bad({ grain: p.grain ? "rice" : "wheat" }), null);
  assert.equal(bad({}, { mode: "geela" }), null);
  const wet = L.generate(req("geela", "namak", 5, { fade: 2 }))[0].level;
  assert.equal(L.validate({ ...wet, params: { ...wet.params, mix: ["salt", "sand"] } }), null, "the mixture is one of the goal's own");
  assert.equal(L.validate({ ...wet, params: { ...wet.params, scene: "khet" } }), null);
  const forged = sanitizeActs([{ seq: 1, act: { kind: "done", correct: true, solved: true } }]);
  assert.ok(!("correct" in forged[0].act) && !("solved" in forged[0].act));
  assert.notEqual(L.grade(L.validate(level), forged).verdict, "solved");
  const logic = readFileSync(`${ROOT}src/play/families/chhaano/chhaano.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  const view = readFileSync(`${ROOT}src/play/families/chhaano/chhaano.view.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// ───────────────────────────── the play server ─────────────────────────────
const CH = () => coverage().entries.filter((e) => e.family === "chhaano");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("chhaano coverage: five entries on c6-science-ch09-t01 and -t02, mapped to their kit misconceptions; neither topic is without a game", () => {
  assert.deepEqual(CH().map((e) => `${e.topicId}|${e.mode}|${e.goal}|${e.skillIds.join(",")}`), [
    "c6-science-ch09-t01|sukha|farak|c6-science-ch09-t01-s2", "c6-science-ch09-t01|sukha|kram|c6-science-ch09-t01-s3,c6-science-ch09-t01-s2",
    "c6-science-ch09-t02|geela|nithaar|c6-science-ch09-t02-s1", "c6-science-ch09-t02|geela|chhaan|c6-science-ch09-t02-s2",
    "c6-science-ch09-t02|geela|namak|c6-science-ch09-t02-s3,c6-science-ch09-t02-s2"]);
  const t1 = "c6-science-ch09-t01-m", t2 = "c6-science-ch09-t02-m";
  assert.deepEqual(CH().map((e) => e.misMap), [
    { "heavy-far": `${t1}2`, "same-size": `${t1}3` }, { "one-method": `${t1}1`, "heavy-far": `${t1}2`, "same-size": `${t1}3` }, {}, {},
    { "salt-gone": `${t2}1`, "filter-salt": `${t2}2`, "clear-pure": `${t2}3` }]);
  for (const [sk, goal] of [["ch09-t01-s2", "farak"], ["ch09-t01-s3", "kram"], ["ch09-t02-s1", "nithaar"], ["ch09-t02-s2", "chhaan"], ["ch09-t02-s3", "namak"]]) {
    const id = `c6-science-${sk}`;
    assert.ok(hasPlay(id)); assert.equal(entryFor({ skillId: id }).family, "chhaano"); assert.equal(entryFor({ skillId: id }).goal, goal);
  }
  assert.deepEqual(backlogged(/c6-science-ch09-t0[12]/), [], "still in the law backlog");
});

for (const e of CH()) for (const fade of [1, 2, 3]) {
  test(`chhaano server ${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3", "c4", "c5", "c6"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e, "Zoya");
      assert.ok(cur && cur.family === "chhaano" && cur.mode === e.mode && cur.params.goal === e.goal);
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
        assert.equal((mg.grade.evidence[0].misconceptionId ?? mg.grade.evidence[0].chanceMis), kitId);
      }
      if (Object.keys(e.misMap).length) assert.ok(level.proof.discriminates.length > 0, "a level that can show a belief is served");
      assert.ok(hiddenOf(level).length > 0, "hidden values");
    }
  });
}

// r7 (main, 2026-11-08): the picker is deterministic (base − 2.2·|p − band|), so without the seeded difficulty nudge one
// level would be every child's first level
test("chhaano: the first level served differs across children", () => {
  for (const e of CH()) for (const fade of [1, 3]) {
    const sigs = new Set();
    for (let c = 0; c < 20; c++) {
      const child = `var-${c}`, lv = currentLevel(sessionOf(e, { childId: child, fade, seed: seedOf(child, entryKey(e), 0) }), e);
      sigs.add(lv.sig);
    }
    assert.ok(sigs.size >= 3, `${e.goal} fade ${fade}: ${sigs.size} distinct first levels over 20 children`);
  }
});

test("chhaano: the generator's and the picker's work is bounded (counted, not timed)", () => {
  // measured 2026-11-10 over every case below: at most 12 candidates and 379 calls into the family logic per pick; bounds are 3x above that. A count is the same on every machine; a
  // 50 ms p95 read 5 ms idle and 110 ms under the gate's load (tests/_work.mjs).
  const gen = [], calls = [], considered = [], counter = counted(L);
  for (const [mode, goal] of CASES) for (const fade of [1, 2, 3]) for (let seed = 1; seed <= 8; seed++) {
    gen.push(L.generate(req(mode, goal, seed * 31, { fade })).length);
    counter.reset(); const picked = pickLevels(counter.logic, req(mode, goal, seed * 31, { fade })); assert.ok(picked); calls.push(counter.calls()); considered.push(picked.considered);
  }
  assert.ok(Math.max(...gen) <= 36, `generate made ${Math.max(...gen)} candidates`);
  assert.ok(Math.max(...considered) <= 36, `pick considered ${Math.max(...considered)}`);
  assert.ok(Math.max(...calls) <= 1200, `pick made ${Math.max(...calls)} calls into the family logic`);
});

test("chhaano: every word the view shows exists in all three languages; vakya's words stay last; no economy word", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/chhaano/chhaano.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(chhaano\.[a-zA-Z0-9._-]+)"/g)].map((m) => m[1]);
  // keys built in a template literal: their fixed prefixes are all in the dynamic list below
  const prefixes = [...view.matchAll(/W\(`(chhaano\.[a-zA-Z0-9._-]+)\$\{/g)].map((m) => m[1]);
  assert.ok(prefixes.length >= 6, `template keys ${prefixes.length}`);
  const why = ["pure", "attached", "no_stalks", "same_weight", "far", "cannot_pick", "same_size.stay", "same_size.pass", "mixed", "not_settled", "settled", "nothing_settles", "lost", "salt_gone", "only_water", "dry", "wet", "empty", "not_there", "not_it", "not_yet", "clear"];
  const dyn = [...GOALS_OF.sukha.map((g) => `goal.${g}`), "goal.geela", "goal.geela1", "and", "done.sukha", "done.geela", "title", "spot.near", "spot.far",
    ...["thresh", "winnow", "pick", "sieve", "wait", "pour", "drain", "filter", "dry"].map((m) => `tool.${m}`), ...["beaker", "glass", "paper", "plate"].map((v) => `ves.${v}`),
    ...[...Object.keys(DRY), ...Object.keys(WET)].map((x) => `part.${x}`), ...why.map((x) => `why.${x}`), ...["clear", "salt_gone", "not_there"].map((x) => `slide.${x}`)].map((k) => `chhaano.${k}`);
  assert.ok(used.length >= 5, `literal keys ${used.length}`);
  for (const pre of prefixes) assert.ok(dyn.some((k) => k.startsWith(pre)), `no word under ${pre}`);
  for (const k of [...used, ...dyn]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const ECON = /\b(points?|coins?|gems?|streaks?|lives|life left|rewards?|leaderboard|rank(ing)?|xp|level up|bonus|jackpot|loot|unlock(ed)?|hurry|jaldi|time'?s up|game over)\b/i;
  for (const [k, v] of Object.entries(words)) if (k.startsWith("chhaano.")) for (const l of ["hinglish", "en", "hi"]) assert.doesNotMatch(v[l], ECON, `${k} ${l}`);
  // every refusal code the law can give has its words (a law answer never shows an empty goal line)
  const logic = readFileSync(`${ROOT}src/play/families/chhaano/chhaano.logic.ts`, "utf8");
  for (const code of new Set([...logic.matchAll(/why: "([a-z_]+)"/g)].map((m) => m[1]))) assert.ok(words[`chhaano.why.${code}`] || words[`chhaano.why.${code}.stay`], code);
  void unseparated;
});
