// r7 Games, Kyun-Lab chumbak · magnets (class 6 science, c6-science-ch04-t02 and -t03) as two kyun-lab modes: dhruv (a pin
// along a hidden magnet, a toy train, the sure test, a magnet imagined snapped, the kit's 20 pins against 8) and disha (a hung
// magnet and a map, a compass turned with her, a compass by the iron). Nothing ever runs on a clock.
// Pure law checks: every generated level validates, solves and no idea-free play wins; an INDEPENDENT checker (its own
// tables: which spot clings most, which joint couples, what pushes, where the needle points) agrees with the law over random
// play; each mal-rule's acts land on its OWN misconception moment and fold the topic's kit id; every fact the law uses is a
// sentence of the kit and every number is the kit's own or a declared scene value; tampered params are refused; a claim
// never decides; first levels differ across children; the generator and picker are fast (CPU time); every coverage entry
// serves a proven level through the play server; the existing kyun-lab fair-test lab is untouched.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chumbakLogic as L, CHUMBAK_MAL, CHUMBAK_MODES, GOALS_OF, KIT_OF, KIT_PINS, SPOTS, PINS_POLE, PINS_MID, DIRS } from "../src/play/families/kyun-lab/chumbak.logic.ts";
import { labLogic } from "../src/play/families/kyun-lab/lab.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { GAME_WEIGHT, MODES, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { pickLevels } from "../src/play/core/pick.ts";
import { mulberry32 } from "../src/play/core/rng.ts";
import { counted } from "./_work.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const KIT = Object.fromEntries(JSON.parse(readFileSync(`${ROOT}data/kits/c6-science.json`, "utf8")).topics.map((t) => [t.topicId, t]));
const ALL = Object.fromEntries(CHUMBAK_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "kyun-lab", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = Object.entries(GOALS_OF).flatMap(([mode, goals]) => goals.map((g) => [mode, g]));
const levelsOf = (mode, goal, seeds = [1, 7, 42]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of L.generate(req(mode, goal, seed, { fade }))) out.push(c);
  return out;
};
const WANT = { sira: ["middle-strong"], jodo: [], pakka: ["pull-proves"], todo: ["one-pole"], taakat: ["big-stronger"], latkao: [], ghoomo: ["needle-turns"], loha: ["iron-trust"] };

// ───────────────────────────── THE INDEPENDENT CHECKER (its own tables; none of the law's helpers) ─────────────────────────────
// The kit: the attraction is strongest at the poles (the two ends), far fewer pins in the middle, none off the magnet; like
// poles repel, unlike attract; iron is only ever attracted; every piece of a broken magnet has N and S lying the same way;
// a freely hung magnet settles with its N end north; the needle keeps pointing north while the box turns under it, except
// by iron or a magnet, where it turns towards it.
const opp = (q) => (q === "N" ? "S" : "N");
function cling(p, at) { const lo = p.from, hi = p.from + p.len - 1; return at === lo || at === hi ? "most" : at > lo && at < hi ? "few" : "none"; }
function ends(way) { return way === 0 ? ["N", "S"] : ["S", "N"]; }   // a carriage's [left, right]
function couples(p, cars) { let back = p.eng === 0 ? "N" : "S"; return cars.map((w) => { const [l, r] = ends(w); const ok = l !== back; back = r; return ok; }); }
function poleOf(p, i, end) { if (p.goal === "pakka" && i !== p.mag) return null; const left = p.flip === 0 ? "N" : "S"; return end === 0 ? left : opp(left); }

test("chumbak: registered as kyun-lab modes (MODES, logic, views, verbs that never choose); fair-test untouched", () => {
  assert.deepEqual([...MODES["kyun-lab"]], ["fair-test", "dhruv", "disha"]);
  assert.deepEqual([...CHUMBAK_MODES], ["dhruv", "disha"]);
  assert.equal(LOGIC["kyun-lab/fair-test"], labLogic);
  const views = readFileSync(`${ROOT}src/play/families/views.ts`, "utf8"), data = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8"))["kyun-lab"];
  for (const m of CHUMBAK_MODES) {
    assert.equal(LOGIC[`kyun-lab/${m}`], L);
    assert.match(views, new RegExp(`"kyun-lab/${m}": makeChumbakView`));
    const v = playActOf("kyun-lab", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
    assert.doesNotMatch(`${v.hi} ${v.en}`, /chun|choose|pick/i);
    assert.ok(data?.[m]?.act && data[m].hi && data[m].en, `verbs.json kyun-lab/${m}`);
  }
  // the lab's own modes and mal-rules are as they were
  assert.deepEqual([...labLogic.modes], ["fair-test"]);
  assert.ok(!labLogic.malRules.some((m) => CHUMBAK_MAL.includes(m)));
});

test("chumbak: every fact is a kit sentence; every number is the kit's own or a declared scene value", () => {
  for (const [what, [topic, text]] of Object.entries(KIT_OF)) assert.ok(JSON.stringify(KIT[topic]).includes(text), `${what}: "${text}" is not in the ${topic} kit`);
  // the only fact-numbers: the kit's 20 pins and 8 pins (its m1 diagnostic)
  const t02 = KIT["c6-science-ch04-t02"], diag = t02.misconceptions.find((m) => m.id === "c6-science-ch04-t02-m1").diagnostic.prompt_en;
  assert.match(diag, new RegExp(`lifts ${KIT_PINS.small} pins; a big grey magnet lifts only ${KIT_PINS.big}\\b`));
  assert.deepEqual(KIT_PINS, { small: 20, big: 8 });
  // the quarter turn is the kit's ("east ... a quarter turn clockwise from north"), and the compass reads N E S W
  assert.match(JSON.stringify(KIT["c6-science-ch04-t03"]), /east is then marked E, a quarter turn clockwise from north/);
  assert.deepEqual([...DIRS], ["N", "E", "S", "W"]);
  // every other number is a scene value, declared as one
  const logic = readFileSync(`${ROOT}src/play/families/kyun-lab/chumbak.logic.ts`, "utf8"), lines = logic.split("\n");
  const consts = [...logic.matchAll(/^(?:export )?const ([A-Z_]+) = ([0-9.]+);/gm)].map((m) => m[1]).sort();
  assert.deepEqual(consts, ["JITTER", "PINS_MID", "PINS_POLE", "SPOTS"]);
  for (const c of ["SPOTS", "PINS_POLE"]) { const i = lines.findIndex((l) => new RegExp(`export const ${c} = `).test(l)); assert.match(lines.slice(Math.max(0, i - 3), i).join(" "), /scene value, no fact claimed/, c); }
  assert.match(logic, /JODO_CARS[^\n]*\n?[^\n]*/); assert.match(logic, /how many carriages a look pulls \(scene value, no fact claimed\)/);
  assert.match(logic, /where the breaks fall \(scene value: one of three drawn layouts, no fact claimed\)/);
  assert.ok(PINS_POLE > PINS_MID && PINS_MID > 0, "the kit's order: most at a pole, few (\"barely\") in the middle");
  // nothing on screen states a number except the kit's: no digit in any chumbak word (counts arrive as {n} / {small} / {big})
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words;
  for (const [k, v] of Object.entries(words)) if (k.startsWith("chumbak.")) for (const l of ["hinglish", "en", "hi"]) assert.doesNotMatch(v[l].replace(/\{\w+\}/g, ""), /[0-9०-९]/, `${k} ${l}`);
  const view = readFileSync(`${ROOT}src/play/families/kyun-lab/chumbak.view.ts`, "utf8");
  assert.match(view, /small: KIT_PINS\.small, big: KIT_PINS\.big/);
  assert.match(view, /W\("chumbak\.taakat\.pins", \{ n \}\)/);
  assert.match(view, /const n = KIT_PINS\[size\]/);
  // the snapped magnet is imagined, never tried (the kit's own warning, on the goal line)
  assert.match(words["chumbak.goal.todo"].en, /never try/);
  // a goal / why / done line fits two lines of the 320 px Studio box (forge3 Q2.whole clips a longer one)
  for (const [k, v] of Object.entries(words)) if (/^chumbak\.(goal|why|done)\./.test(k)) for (const l of ["hinglish", "en", "hi"]) assert.ok(v[l].replace(/\{\w+\}/g, "xxxxxxxxxx").length <= 64, `${k} ${l} is long`);
});

for (const [mode, goal] of CASES) {
  test(`chumbak ${mode}/${goal}: every level validates, solves, is shortcut-free; mal-rules land on their own misconception`, () => {
    const cands = levelsOf(mode, goal), seen = new Set();
    assert.ok(cands.length >= 12, `only ${cands.length} candidates`);
    for (const c of cands) {
      const level = L.validate(c.level);
      assert.ok(level, c.signature);
      assert.equal(level.params.goal, goal); assert.equal(level.family, "kyun-lab"); assert.equal(level.mode, mode);
      assert.equal(L.shortcut(level), null, `${c.signature} shortcut`);
      const sol = L.solve(level), done = run(level, sol);
      assert.ok(done.s.done && done.ms.some((m) => m.kind === "solved"), `${c.signature} solves`);
      assert.deepEqual(done.refused, [], `${c.signature} solver refused`);
      const g = L.grade(level, env(sol));
      assert.equal(g.verdict, "solved"); assert.ok(g.clean);
      for (const mal of CHUMBAK_MAL) {
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
    assert.deepEqual([...seen].sort(), [...WANT[goal]].sort(), `${goal}: mal-rules shown`);
  });
}

test("chumbak: random play — the checker agrees with every answer the law gives", () => {
  const rnd = mulberry32(2026), pick = (xs) => xs[Math.floor(rnd() * xs.length)];
  let checked = 0;
  for (const [mode, goal] of CASES) for (const c of levelsOf(mode, goal, [5, 11])) {
    const level = L.validate(c.level), p = level.params;
    let s = L.init(level);
    for (let k = 0; k < 40 && !s.done; k++) {
      const by = rnd() < 0.5 ? -1 : 1;
      const a = pick({
        sira: [{ kind: "probe", at: Math.floor(rnd() * SPOTS) }, { kind: "mark", at: Math.floor(rnd() * SPOTS) }, { kind: "run" }],
        jodo: [{ kind: "flip", i: Math.floor(rnd() * (p.cars ?? []).length) }, { kind: "run" }],
        pakka: [{ kind: "near", i: Math.floor(rnd() * (p.bars ?? 1)), end: rnd() < 0.5 ? 0 : 1, p: rnd() < 0.5 ? "N" : "S" }, { kind: "claim", i: Math.floor(rnd() * (p.bars ?? 1)) }],
        todo: [{ kind: "near", i: Math.floor(rnd() * (p.pieces ?? 1)), end: rnd() < 0.5 ? 0 : 1, p: rnd() < 0.5 ? "N" : "S" }, { kind: "label", i: Math.floor(rnd() * (p.pieces ?? 1)), end: rnd() < 0.5 ? 0 : 1, v: pick(["N", "S", "-"]) }, { kind: "run" }],
        taakat: [{ kind: "dip", i: rnd() < 0.5 ? 0 : 1 }, { kind: "claim", i: rnd() < 0.5 ? 0 : 1 }],
        latkao: [{ kind: "twist", by }, { kind: "let" }, { kind: "spin", by }, { kind: "run" }],
        ghoomo: [{ kind: "turn", by }, { kind: "dial", by }, { kind: "run" }],
        loha: [{ kind: "turn", by }, { kind: "dial", by }, { kind: "go", to: rnd() < 0.5 ? 0 : 1 }, { kind: "run" }],
      }[goal]);
      if (rnd() < 0.05) { s = L.apply(level, s, { kind: "undo" }, k + 1).state; continue; }
      const r = L.apply(level, s, a, k + 1), n = r.state;
      if (!r.refused) checked++;
      switch (goal) {
        case "sira":
          if (a.kind === "probe" && !r.refused) { const got = n.probes[a.at]; assert.equal(got === PINS_POLE ? "most" : got > 0 ? "few" : "none", cling(p, a.at), `spot ${a.at}`); }
          if (a.kind === "run" && n.done) assert.deepEqual([...s.marks].sort((x, y) => x - y), [p.from, p.from + p.len - 1]);
          break;
        case "jodo": if (a.kind === "run") assert.equal(n.done, couples(p, s.cars).every(Boolean), "the train joins exactly when every joint has unlike poles"); break;
        case "pakka": case "todo":
          if (a.kind === "near" && !r.refused) { const t = n.tests[n.tests.length - 1], at = poleOf(p, a.i, a.end); assert.equal(t.r, at === a.p ? "push" : "pull", "only a like pole is pushed; iron is only ever pulled"); }
          if (goal === "pakka" && a.kind === "claim" && n.done) { assert.equal(a.i, p.mag); assert.ok(s.tests.some((t) => t.i === a.i && t.r === "push"), "called the magnet only after a push"); }
          if (goal === "todo" && a.kind === "run" && n.done) s.labels.forEach((lb, i) => assert.deepEqual(lb, [poleOf(p, i, 0), poleOf(p, i, 1)], "every piece N and S, lying as the whole did"));
          break;
        case "taakat": if (a.kind === "claim" && n.done) { assert.equal(KIT_PINS[(a.i === 0) === (p.order === 0) ? "small" : "big"], Math.max(KIT_PINS.small, KIT_PINS.big)); assert.ok(s.dipped.every(Boolean)); } break;
        case "latkao":
          if (a.kind === "let" && !r.refused) assert.equal(n.twist, 0, "let go, it settles with its N end north, whatever the twist");
          if (a.kind === "run" && n.done) assert.ok(!s.held && s.map === 0);
          break;
        default: {
          const needle = goal === "loha" && n.spot === 0 ? p.iron : 0;
          if (a.kind === "turn" && !r.refused) { assert.equal(n.box, (s.box + by + 4) % 4, "the box turns with her"); assert.equal(n.face, (s.face + by + 4) % 4); }
          if (a.kind === "run" && n.done) { assert.equal(s.face, p.target); assert.equal(s.box, 0, "read only with N on the dial over true north"); assert.equal(needle, 0, "never by the iron"); assert.equal(DIRS[(s.face - s.box + 4) % 4], DIRS[p.target]); }
        }
      }
      s = n;
    }
  }
  assert.ok(checked > 600, `accepted acts ${checked}`);
});

test("chumbak: the law's answers (probe before a flag, two poles, the train, the sure test, a snapped piece, the kit's pins, the hung magnet, the compass)", () => {
  const lv = (mode, goal, pred, fade = 1) => { for (const seed of [1, 2, 3, 4, 5, 6, 7]) { const c = L.generate(req(mode, goal, seed, { fade })).find((x) => pred(x.level.params)); if (c) return L.validate(c.level); } throw new Error(`no ${goal}`); };
  // sira: a flag needs a touched spot; at most two; the cover's own ends are never the poles
  const sira = lv("dhruv", "sira", (p) => p.len === 4 && p.from === 2);
  assert.deepEqual(run(sira, [{ kind: "mark", at: 2 }]).refused, ["probe_first"]);
  assert.deepEqual(run(sira, [{ kind: "probe", at: 2 }]).s.probes, [-1, -1, PINS_POLE, -1, -1, -1, -1], "a spot shows its pins once touched");
  assert.deepEqual(run(sira, Array.from({ length: SPOTS }, (_, at) => ({ kind: "probe", at }))).s.probes, [0, 0, PINS_POLE, PINS_MID, PINS_MID, PINS_POLE, 0]);
  assert.deepEqual(run(sira, [{ kind: "probe", at: 2 }, { kind: "probe", at: 2 }]).refused, ["probed"]);
  assert.deepEqual(run(sira, [{ kind: "probe", at: 0 }, { kind: "probe", at: 2 }, { kind: "probe", at: 5 }, { kind: "mark", at: 0 }, { kind: "mark", at: 2 }, { kind: "mark", at: 5 }]).refused, ["two_poles"]);
  assert.deepEqual(run(sira, [{ kind: "probe", at: 2 }, { kind: "mark", at: 2 }, { kind: "run" }]).refused, ["both_ends"]);
  assert.deepEqual(run(sira, [{ kind: "probe", at: 0 }, { kind: "probe", at: 5 }, { kind: "mark", at: 0 }, { kind: "mark", at: 5 }, { kind: "run" }]).refused, ["not_pole"]);
  // jodo: like poles at a joint push apart; turned round, the train joins
  const jodo = lv("dhruv", "jodo", (p) => p.cars.length === 2 && p.eng === 0);
  const j0 = run(jodo, [{ kind: "run" }]);
  assert.deepEqual(j0.refused, ["repel_seen"]); assert.ok(j0.s.joints.some((x) => x < 0));
  // pakka: a claim with no test is refused; a pull is not proof; a push is
  const pakka = lv("dhruv", "pakka", (p) => p.bars === 2 && p.mag === 1 && p.flip === 0);
  assert.deepEqual(run(pakka, [{ kind: "claim", i: 1 }]).refused, ["test_first"]);
  assert.deepEqual(run(pakka, [{ kind: "near", i: 1, end: 0, p: "S" }, { kind: "claim", i: 1 }]).refused, ["only_pull"]);
  assert.ok(run(pakka, [{ kind: "near", i: 1, end: 0, p: "N" }, { kind: "claim", i: 1 }]).s.done);
  assert.deepEqual(run(pakka, [{ kind: "near", i: 0, end: 0, p: "N" }, { kind: "near", i: 0, end: 1, p: "S" }]).s.tests.map((t) => t.r), ["pull", "pull"], "iron is only ever pulled");
  // todo: the printed ends cannot be relabelled; an end labelled "no pole" pushes a pole away
  const todo = lv("dhruv", "todo", (p) => p.pieces === 2 && p.flip === 0);
  assert.deepEqual(run(todo, [{ kind: "label", i: 0, end: 0, v: "S" }]).refused, ["printed"]);
  assert.deepEqual(run(todo, [{ kind: "run" }]).refused, ["label_all"]);
  assert.deepEqual(run(todo, [{ kind: "label", i: 0, end: 1, v: "N" }, { kind: "label", i: 1, end: 0, v: "S" }, { kind: "run" }]).refused, ["one_pole"], "N…N is one pole only");
  assert.deepEqual(run(todo, [{ kind: "near", i: 0, end: 1, p: "S" }]).s.tests[0].r, "push", "the new end at the break is an S");
  assert.ok(run(todo, [{ kind: "label", i: 0, end: 1, v: "S" }, { kind: "label", i: 1, end: 0, v: "N" }, { kind: "run" }]).s.done);
  // taakat: the kit's pins; the small one is stronger only once both are dipped
  const tk = lv("dhruv", "taakat", (p) => p.order === 0);
  const d = run(tk, [{ kind: "dip", i: 0 }, { kind: "dip", i: 1 }]);
  assert.deepEqual(d.ms.filter((m) => m.kind === "progress").map((m) => m.facts.pins), [KIT_PINS.small, KIT_PINS.big]);
  assert.deepEqual(run(tk, [{ kind: "dip", i: 0 }, { kind: "claim", i: 0 }]).refused, ["test_both"]);
  // latkao: held, it is not settled; let go from any twist, it rests with its N end north
  const lk = lv("disha", "latkao", (p) => p.twist === 2, 2);
  assert.deepEqual(run(lk, [{ kind: "run" }]).refused, ["held"]);
  for (const tw of [[], [{ kind: "twist", by: 1 }], [{ kind: "twist", by: -1 }, { kind: "twist", by: -1 }]]) assert.equal(run(lk, [...tw, { kind: "let" }]).s.twist, 0);
  assert.deepEqual(run(lk, [{ kind: "let" }, { kind: "let" }]).refused, ["free"]);
  // ghoomo: turning herself turns the box, never the needle; set, turned, read = the needle-stayed consequence
  const gh = lv("disha", "ghoomo", (p) => p.box === 0 && (p.target - p.face + 4) % 4 === 1);
  const t = run(gh, [{ kind: "turn", by: 1 }]);
  assert.equal(t.s.box, 1); assert.ok(t.s.turnedOff);
  assert.deepEqual(run(gh, [{ kind: "turn", by: 1 }, { kind: "run" }]).refused, ["needle_stayed"]);
  assert.ok(run(gh, [{ kind: "turn", by: 1 }, { kind: "dial", by: -1 }, { kind: "run" }]).s.done);
  assert.deepEqual(run(gh, [{ kind: "run" }]).refused, ["not_facing"]);
  // loha: by the iron the needle turns to it; set to it and read = the iron's reading; away, it is north again
  const lo = lv("disha", "loha", (p) => p.box === 0 && p.iron === 1 && (p.target - p.face + 4) % 4 === 1);
  assert.deepEqual(run(lo, [{ kind: "turn", by: 1 }, { kind: "run" }]).refused, ["near_iron"], "the box is set under the pulled needle after her turn");
  assert.deepEqual(run(lo, [{ kind: "go", to: 1 }, { kind: "turn", by: 1 }, { kind: "run" }]).refused, ["needle_stayed"]);
  assert.ok(run(lo, [{ kind: "go", to: 1 }, { kind: "turn", by: 1 }, { kind: "dial", by: -1 }, { kind: "run" }]).s.done);
  assert.deepEqual(run(lo, [{ kind: "go", to: 0 }]).refused, ["here"]);
  // undo steps back
  assert.equal(run(gh, [{ kind: "turn", by: 1 }, { kind: "undo" }]).s.face, gh.params.face);
});

test("chumbak: tampered params are refused; a claim in an act never decides; nothing is timed", () => {
  const level = L.generate(req("dhruv", "sira", 5, { fade: 2 }))[0].level;
  const bad = (lv, patch, o = {}) => L.validate({ ...lv, ...o, params: { ...lv.params, ...patch } });
  assert.ok(L.validate(level));
  assert.equal(bad(level, { from: 0 }), null, "the magnet never starts at the cover's end");
  assert.equal(bad(level, { len: 6 }), null);
  assert.equal(bad(level, { goal: "loha" }), null);
  assert.equal(bad(level, { look: 4 }), null);
  assert.equal(bad(level, { ctx: "nowhere" }), null);
  assert.equal(bad(level, {}, { mode: "disha" }), null);
  const jodo = L.generate(req("dhruv", "jodo", 5, { fade: 3 }))[0].level;
  assert.equal(bad(jodo, { shown: true }), null, "look 3 hides the poles");
  assert.equal(bad(jodo, { cars: [jodo.params.cars[0], 2, 0] }), null);
  const gh = L.generate(req("disha", "ghoomo", 5))[0].level;
  assert.equal(bad(gh, { face: gh.params.target }), null);
  assert.equal(bad(gh, { box: (gh.params.face - gh.params.target + 8) % 4 }), null, "turning to the landmark never sets the dial by itself");
  assert.equal(bad(gh, { iron: 1 }), null);
  const lo = L.generate(req("disha", "loha", 5))[0].level;
  assert.equal(bad(lo, { iron: 0 }), null, "by the iron the needle is pulled off north");
  const forged = sanitizeActs([{ seq: 1, act: { kind: "run", correct: true, solved: true } }]);
  assert.ok(!("correct" in forged[0].act) && !("solved" in forged[0].act));
  assert.notEqual(L.grade(L.validate(level), forged).verdict, "solved");
  const logic = readFileSync(`${ROOT}src/play/families/kyun-lab/chumbak.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  const view = readFileSync(`${ROOT}src/play/families/kyun-lab/chumbak.view.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// ───────────────────────────── the play server ─────────────────────────────
const CH = () => coverage().entries.filter((e) => e.family === "kyun-lab" && CHUMBAK_MODES.includes(e.mode));
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("chumbak coverage: eight entries on c6-science-ch04-t02 and -t03, mapped to their kit misconceptions; t03 m1 not admitted", () => {
  assert.deepEqual(CH().map((e) => `${e.topicId}|${e.mode}|${e.goal}|${e.skillIds.join(",")}`), [
    "c6-science-ch04-t02|dhruv|sira|c6-science-ch04-t02-s1", "c6-science-ch04-t02|dhruv|jodo|c6-science-ch04-t02-s2", "c6-science-ch04-t02|dhruv|pakka|c6-science-ch04-t02-s2",
    "c6-science-ch04-t02|dhruv|todo|c6-science-ch04-t02-s3", "c6-science-ch04-t02|dhruv|taakat|c6-science-ch04-t02-s3",
    "c6-science-ch04-t03|disha|latkao|c6-science-ch04-t03-s1", "c6-science-ch04-t03|disha|ghoomo|c6-science-ch04-t03-s2", "c6-science-ch04-t03|disha|loha|c6-science-ch04-t03-s2"]);
  const t2 = "c6-science-ch04-t02-m", t3 = "c6-science-ch04-t03-m";
  assert.deepEqual(CH().map((e) => e.misMap), [{ "middle-strong": `${t2}3` }, {}, { "pull-proves": `${t2}4` }, { "one-pole": `${t2}2` }, { "big-stronger": `${t2}1` }, {}, { "needle-turns": `${t3}3` }, { "iron-trust": `${t3}2` }]);
  assert.ok(!CH().some((e) => Object.values(e.misMap).includes(`${t3}1`)), "t03 m1 has no mechanic and is not admitted");
  for (const [sk, goal] of [["ch04-t02-s1", "sira"], ["ch04-t02-s2", "jodo"], ["ch04-t02-s3", "todo"], ["ch04-t03-s1", "latkao"], ["ch04-t03-s2", "ghoomo"]]) {
    const id = `c6-science-${sk}`;
    assert.ok(hasPlay(id)); assert.equal(entryFor({ skillId: id }).family, "kyun-lab"); assert.equal(entryFor({ skillId: id }).goal, goal);
  }
  const backlog = readFileSync(`${ROOT}docs/design/round7/games/law-backlog.md`, "utf8");
  assert.doesNotMatch(backlog, /c6-science-ch04-t0[23]/);
  // the magnetic-materials lab is still the fair-test lab
  assert.equal(entryFor({ skillId: "c6-science-ch04-t01-s1" }).mode, "fair-test");
});

for (const e of CH()) for (const fade of [1, 2, 3]) {
  test(`chumbak server ${e.mode}/${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3", "c4", "c5"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e, "Zoya");
      assert.ok(cur && cur.family === "kyun-lab" && cur.mode === e.mode && cur.params.goal === e.goal);
      assert.ok(L.validate(cur), "the served level validates");
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.look, fade);
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
      if (Object.keys(e.misMap).length) assert.ok(level.proof.discriminates.length > 0, "a level that can show a belief is served");
      if (e.goal !== "latkao") assert.ok(hiddenOf(level).length > 0, "hidden values");
    }
  });
}

// r7 (main, 2026-11-08): the picker is deterministic (base − 2.2·|p − band|), so without the seeded difficulty nudge one
// level would be every child's first level
test("chumbak: the first level served differs across children", () => {
  for (const e of CH()) for (const fade of [1, 3]) {
    const sigs = new Set();
    for (let c = 0; c < 20; c++) {
      const child = `var-${c}`, lv = currentLevel(sessionOf(e, { childId: child, fade, seed: seedOf(child, entryKey(e), 0) }), e);
      sigs.add(lv.sig);
    }
    assert.ok(sigs.size >= 3, `${e.goal} fade ${fade}: ${sigs.size} distinct first levels over 20 children`);
  }
});

test("chumbak: the generator's and the picker's work is bounded (counted, not timed)", () => {
  // measured 2026-11-10 over every case below: at most 48 candidates and 1168 calls into the family logic per pick; bounds are 3x above that. A count is the same on every machine; a
  // 50 ms p95 read 5 ms idle and 110 ms under the gate's load (tests/_work.mjs).
  const gen = [], calls = [], considered = [], counter = counted(L);
  for (const [mode, goal] of CASES) for (const fade of [1, 2, 3]) for (let seed = 1; seed <= 6; seed++) {
    gen.push(L.generate(req(mode, goal, seed * 31, { fade })).length);
    counter.reset(); const picked = pickLevels(counter.logic, req(mode, goal, seed * 31, { fade })); assert.ok(picked); calls.push(counter.calls()); considered.push(picked.considered);
  }
  assert.ok(Math.max(...gen) <= 144, `generate made ${Math.max(...gen)} candidates`);
  assert.ok(Math.max(...considered) <= 144, `pick considered ${Math.max(...considered)}`);
  assert.ok(Math.max(...calls) <= 3600, `pick made ${Math.max(...calls)} calls into the family logic`);
});

test("chumbak: every word the view shows exists in all three languages; vakya's words stay last; no economy word", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/kyun-lab/chumbak.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(chumbak\.[a-zA-Z0-9._-]+)"/g), ...view.matchAll(/"(chumbak\.(?:loha)\.(?:walk|back))"/g)].map((m) => m[1]);
  const prefixes = [...view.matchAll(/W\(`(chumbak\.[a-zA-Z0-9._-]+)\$\{/g)].map((m) => m[1]);
  assert.ok(prefixes.length >= 8, `template keys ${prefixes.length}`);
  const logic = readFileSync(`${ROOT}src/play/families/kyun-lab/chumbak.logic.ts`, "utf8");
  // every refusal the child is shown has its words: the law's refuse / mal codes and the soft refusals
  const shown = new Set([...logic.matchAll(/refuse\("([a-z_]+)"/g), ...logic.matchAll(/mal\("[a-z-]+", "([a-z_]+)"/g)].map((m) => m[1]).concat(["probed", "printed", "dipped", "free", "here", "repel", "repel_seen"]));
  const ctxs = { campus: 1, hunt: 1, mela: 1, trek: 1, almirah: 1, table: 1, bar: 1 };
  const dyn = [...Object.values(GOALS_OF).flat().flatMap((g) => [`goal.${g}`, `done.${g}`]), ...[...shown].map((x) => `why.${x}`),
    ...Object.keys(ctxs).flatMap((c) => ["a", "b", "c", "d"].map((l) => `lm.${c}.${l}`)), ...["almirah", "table", "bar"].map((x) => `loha.${x}`), ...["case", "board", "box"].map((x) => `sira.${x}`),
    ...["N", "S"].flatMap((q) => ["pull", "push"].map((r) => `res.${q}.${r}`)), ...["sira", "jodo", "todo", "latkao", "read"].map((x) => `run.${x}`), ...["label", "N", "S"].map((x) => `tool.${x}`),
    ...["small", "big"].flatMap((x) => [`taakat.${x}`, `taakat.claim.${x}`]), ...DIRS.map((x) => `dir.${x}`)].map((k) => `chumbak.${k}`);
  assert.ok(used.length >= 15, `literal keys ${used.length}`);
  for (const pre of prefixes) assert.ok(dyn.some((k) => k.startsWith(pre)), `no word under ${pre}`);
  for (const k of [...used, ...dyn]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const ECON = /\b(points?|coins?|gems?|streaks?|lives|life left|rewards?|leaderboard|rank(ing)?|xp|level up|bonus|jackpot|loot|unlock(ed)?|hurry|jaldi|time'?s up|game over)\b/i;
  for (const [k, v] of Object.entries(words)) if (k.startsWith("chumbak.")) for (const l of ["hinglish", "en", "hi"]) assert.doesNotMatch(v[l], ECON, `${k} ${l}`);
});
