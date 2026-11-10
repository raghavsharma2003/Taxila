// r7 Games, Yantra · roshni: sources of light and materials (class 7 science, c7-science-ch11-t01). A light bench: a lane
// per thing, a slot for a screen, and the child's eye on the right. Nothing runs on a clock: a switch, a screen or a cover
// changes only on a tap, and LOOK asks the law what the eye sees.
// Pure law checks: every generated level validates, solves and no idea-free play wins; an INDEPENDENT checker (its own
// reading of the kit's sentences, read out of data/kits/c7-science.json: which things give out their own light, which
// materials let all, some or no light pass, the Moon lit only by sunlight) agrees with what the law says the eye sees at
// every look over random play; each mal-rule's acts land on its OWN misconception moment and fold the topic's kit id;
// every source and material on the bench is named in the kit; no ray is ever drawn from the eye and the eye never looks at
// the Sun; no word holds a number or an economy word; tampered params are refused; first levels differ across children;
// the generator and picker are fast (CPU time); and every coverage entry serves a proven level through the play server.
import { backlogged } from "./_backlog.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  roshniLogic as L, ROSHNI_GOALS, ROSHNI_MAL, KIT_OF, THINGS, SOURCES, MATS, MAT_IDS, isSource, seenOf, raysOf, litOf, plan,
} from "../src/play/families/yantra/roshni.logic.ts";
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
const KIT = JSON.parse(readFileSync(`${ROOT}data/kits/c7-science.json`, "utf8"));
const T = "c7-science-ch11-t01";
const TOPIC = KIT.topics.find((t) => t.topicId === T);
const TEXT = JSON.stringify(TOPIC), EXP = TOPIC.expectations;
const WORDS = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words;
const MY_WORDS = Object.entries(WORDS).filter(([k]) => k.startsWith("yantra.roshni."));
const LANGS = ["hinglish", "en", "hi"];
const ALL = Object.fromEntries(ROSHNI_MAL.map((m) => [m, `k-${m}`]));
const req = (goal, seed, o = {}) => ({ family: "yantra", mode: "roshni", goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const levelsOf = (goal, seeds = [1, 7, 42, 99]) => { const out = []; for (const seed of seeds) for (const fade of [1, 2, 3]) out.push(...L.generate(req(goal, seed, { fade }))); return out; };
const WANT = { parda: ["blur-clear"], roshan: ["moon-alone", "look-hard"], dhak: ["moon-cover"] };
const VIEW = readFileSync(`${ROOT}src/play/families/yantra/roshni.view.ts`, "utf8");
const LOGIC_SRC = readFileSync(`${ROOT}src/play/families/yantra/roshni.logic.ts`, "utf8");

test("roshni: the mode is registered (MODES, logic, view, a verb that never chooses); the other yantra modes stay", () => {
  assert.deepEqual([...MODES.yantra], ["beam", "circuit", "pendulum", "roshni"]);
  assert.equal(LOGIC["yantra/roshni"], L);
  assert.match(readFileSync(`${ROOT}src/play/families/views.ts`, "utf8"), /"yantra\/roshni": makeRoshniView/);
  const v = playActOf("yantra", "roshni");
  assert.ok(v && v.hi && v.en && v.act !== "choose");
  assert.doesNotMatch(`${v.hi} ${v.en}`, /chun|choose|pick/i);
  const data = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).yantra.roshni;
  assert.ok(data?.act && data.hi && data.en);
  for (const m of ["beam", "circuit", "pendulum"]) assert.ok(LOGIC[`yantra/${m}`], m);
});

// ───────────────────────────── the kit: every name, kind and property is its own ─────────────────────────────
test("roshni: every sentence the law rests on is the kit's", () => {
  for (const [what, text] of Object.entries(KIT_OF)) assert.ok(TEXT.includes(text), `${what}: "${text}" is not in the kit`);
  for (const k of ["luminous", "non-luminous", "moon", "transparent", "translucent", "opaque"]) assert.ok(EXP.some((e) => e.includes(KIT_OF[k])), `${k} is an expectation`);
});

test("roshni: the luminous things and each material's kind are read out of the kit's own sentences", () => {
  // the luminous list, as the kit's expectation gives it
  const lum = EXP.find((e) => /^Luminous objects/.test(e)).split(": ")[1].replace(/\.$/, "").split(", ");
  assert.deepEqual(lum, ["the Sun", "other stars", "a candle flame", "a glowing bulb", "a firefly"]);
  for (const t of SOURCES) {
    const name = WORDS[`yantra.roshni.thing.${t}`].en.toLowerCase().replace(/^(an?|the) /, "");
    assert.ok(lum.some((x) => x.toLowerCase().includes(name)), `${t} (${name}) is luminous in the kit`);
  }
  // the Moon is non-luminous by the kit's sentence; a steel plate by its worked example
  assert.ok(EXP.some((e) => e.includes("The Moon is non-luminous")));
  assert.ok(TOPIC.workedExample.steps.some((x) => /Steel plate: .*non-luminous/.test(x)));
  assert.deepEqual(Object.keys(THINGS).filter((t) => !isSource(t)).sort(), ["moon", "plate"]);
  // each material's kind, from the kit's parentheses
  const listOf = (re) => EXP.find((e) => re.test(e)).match(/\(([^)]+)\)/)[1].split(", ");
  const kinds = { transparent: listOf(/^Transparent/), translucent: listOf(/^Translucent/), opaque: listOf(/^Opaque/) };
  assert.deepEqual(kinds.transparent, ["clear glass", "clean water", "air"]);
  for (const m of MAT_IDS) {
    const name = WORDS[`yantra.roshni.mat.${m}`].en.toLowerCase();
    const kind = Object.keys(kinds).find((k) => kinds[k].includes(name));
    assert.equal(kind, MATS[m], `${m} (${name}) is ${MATS[m]} in the kit`);
  }
  assert.equal(WORDS["yantra.roshni.mat.air"].en.toLowerCase(), "air", "an empty slot is air (the kit's transparent)");
  // every material the kit names is on the bench somewhere (air as the empty slot)
  for (const k of Object.values(kinds).flat()) assert.ok(k === "air" || MAT_IDS.some((m) => WORDS[`yantra.roshni.mat.${m}`].en.toLowerCase() === k), `${k} is used`);
  // every thing name is kit-named
  for (const t of Object.keys(THINGS)) {
    const name = WORDS[`yantra.roshni.thing.${t}`].en.toLowerCase().replace(/^(an?|the) /, "");
    assert.ok(TEXT.toLowerCase().includes(name), `${t} "${name}" is not kit-named`);
  }
});

test("roshni: the eye never looks at the Sun; the Sun is not in parda; no number in the law but declared scene values", () => {
  for (const goal of ROSHNI_GOALS) for (const c of levelsOf(goal)) {
    const p = c.level.params, sun = p.things.indexOf("sun");
    if (goal === "parda") assert.equal(sun, -1);
    if (sun >= 0) { assert.ok(p.walls.includes(sun), "the Sun's lane is walled"); assert.equal(p.want[sun], "not"); }
    // over the law's own solution and every mal-rule, the Sun's lane is never seen
    for (const acts of [L.solve(c.level), ...ROSHNI_MAL.map((m) => L.malActs(c.level, m)).filter(Boolean)]) {
      const { s } = run(c.level, acts);
      if (sun >= 0) assert.ok(["hidden", "dark"].includes(seenOf(p, s)[sun]));
    }
  }
  const consts = [...LOGIC_SRC.matchAll(/^(?:export )?const ([A-Z_]+) = ([0-9.]+);/gm)].map((m) => m[1]);
  assert.deepEqual(consts, ["JITTER"]);
  assert.match(LOGIC_SRC, /covers: number;/);
  assert.match(LOGIC_SRC, /as many as the things that give out their own light; a scene value/);
});

// ───────────────────────────── no ray from the eye ─────────────────────────────
test("roshni: every ray starts at a thing and runs toward the eye; none starts at the eye; the Moon is lit only by the Sun", () => {
  let n = 0;
  for (const goal of ROSHNI_GOALS) for (const c of levelsOf(goal, [3, 17])) {
    const p = c.level.params;
    for (const acts of [[], L.solve(c.level), ...ROSHNI_MAL.map((m) => L.malActs(c.level, m)).filter(Boolean)]) {
      const { s } = run(c.level, acts.filter((a) => a.kind !== "run"));
      for (const r of raysOf(p, s)) {
        n++;
        assert.ok(Number.isInteger(r.from) && r.from >= 0 && r.from < p.things.length, "a ray starts at a thing on the bench");
        assert.ok(r.to === "slot" || r.to === "eye" || Number.isInteger(r.to));
        if (Number.isInteger(r.to)) { assert.ok(isSource(p.things[r.from]) && !isSource(p.things[r.to]), "light falls from a source on a non-luminous thing"); if (p.things[r.to] === "moon") assert.equal(p.things[r.from], "sun"); }
        if (r.to === "eye") assert.ok(litOf(p, s, r.from));
      }
      // with no light on, no ray at all
      if (!p.things.some((t, j) => isSource(t) && s.on[j] && !s.cover[j])) assert.deepEqual(raysOf(p, s), []);
    }
  }
  assert.ok(n > 200, `rays checked ${n}`);
  // the view draws only the law's rays, each from a thing's icon or a slot toward the eye: never a segment from the eye
  const code = VIEW.replace(/\/\/.*$/gm, "");
  assert.match(code, /list = raysOf\(p, s\)/);
  assert.doesNotMatch(code, /seg\(\[g\.eyeX/, "no ray segment starts at the eye");
  for (const m of code.matchAll(/seg\(\[([^\]]+)\],/g)) assert.doesNotMatch(m[1], /eye/, `a ray from the eye: seg([${m[1]}]`);
});

for (const goal of ROSHNI_GOALS) {
  test(`roshni ${goal}: every level validates, solves, is shortcut-free; mal-rules land on their own misconception`, () => {
    const cands = levelsOf(goal), seen = new Set();
    assert.ok(cands.length >= 30, `only ${cands.length} candidates`);
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
      // each look's own work: look 1 places no screen in roshan; looks 2-3 need one in parda and roshan
      const screens = sol.filter((a) => a.kind === "place" && a.part !== "cover").length;
      if (goal !== "dhak" && level.params.look > 1) assert.ok(screens >= 1, c.signature);
      if (goal === "roshan" && level.params.look === 1) assert.equal(screens, 0);
      for (const mal of ROSHNI_MAL) {
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

// ───────────────────────────── THE INDEPENDENT CHECKER (its own reading of the kit; none of the law's helpers) ─────────────────────────────
// A thing gives out its own light if the kit lists it as luminous and it is switched on and not covered. The Moon gives back
// light only while the Sun shines (it shines by reflecting sunlight); a steel plate while any source shines. Through air,
// clear glass or clean water the eye sees it clearly; through butter paper, frosted glass or oiled paper, not clearly;
// through cardboard, wood, a steel plate or a brick wall, not at all; a covered thing is not seen. Nothing lit, nothing seen.
const OWN = new Set(["sun", "star", "candle", "bulb", "firefly"]);
const LETS = { glass: "all", water: "all", butter: "some", frosted: "some", oiled: "some", cardboard: "none", wood: "none", steel: "none", brick: "none" };
function eyeSees(p, on, slot, cover) {
  const shines = (j) => OWN.has(p.things[j]) && on[j] && !cover[j];
  return p.things.map((t, i) => {
    if (cover[i]) return "hidden";
    const lit = OWN.has(t) ? shines(i) : t === "moon" ? p.things.some((x, j) => x === "sun" && shines(j)) : p.things.some((_, j) => shines(j));
    if (!lit) return "dark";
    const m = p.walls.includes(i) ? "brick" : slot[i];
    return !m || LETS[m] === "all" ? "clear" : LETS[m] === "some" ? "blur" : "hidden";
  });
}
test("roshni: random play — the checker agrees with what the law says the eye sees at every look, and with every win", () => {
  const rnd = mulberry32(2026);
  let looks = 0, wins = 0, accepted = 0;
  for (const goal of ROSHNI_GOALS) for (const c of levelsOf(goal, [5, 11, 23])) {
    const level = L.validate(c.level), p = level.params, n = p.things.length;
    let s = L.init(level);
    const on = p.things.map((t) => OWN.has(t) && goal !== "roshan"), slot = Array(n).fill(null), cover = Array(n).fill(false);
    for (let k = 0; k < 40 && !s.done; k++) {
      const i = Math.floor(rnd() * n), x = rnd();
      let a;
      if (x < 0.22) a = { kind: "run" };
      else if (x < 0.3) a = { kind: "undo" };
      else if (goal === "dhak") a = x < 0.75 ? { kind: "place", part: "cover", x: i, y: 0 } : { kind: "remove", id: `cover-${i}` };
      else if (goal === "roshan" && x < 0.55) a = { kind: "toggle", id: `thing-${i}` };
      else if (x < 0.8 && p.tray.length) a = { kind: "place", part: p.tray[Math.floor(rnd() * p.tray.length)], x: i, y: 0 };
      else a = { kind: "remove", id: `slot-${i}` };
      const r = L.apply(level, s, a, k + 1);
      if (a.kind === "undo") { s = r.state; for (let j = 0; j < n; j++) { on[j] = s.on[j]; slot[j] = s.slot[j]; cover[j] = s.cover[j]; } continue; }
      if (a.kind === "run") {
        looks++;
        const mine = eyeSees(p, on, slot, cover);
        assert.deepEqual(r.state.shown, mine, `${c.signature}: what the eye sees`);
        const met = goal === "dhak" ? !p.things.some((t, j) => OWN.has(t) && on[j] && !cover[j]) : p.want.every((w, j) => (w === "not" ? mine[j] !== "clear" && mine[j] !== "blur" : w === mine[j]));
        assert.equal(!r.refused, met, `${c.signature}: a win only when the card is met`);
        if (met) wins++;
      } else if (!r.refused) {
        accepted++;
        if (a.kind === "toggle") { assert.ok(OWN.has(p.things[i]), "only a luminous thing has a switch"); on[i] = !on[i]; }
        if (a.kind === "place" && a.part === "cover") { assert.ok(cover.filter(Boolean).length < p.covers); cover[i] = true; }
        else if (a.kind === "place") { assert.ok(!p.walls.includes(i) && !slot[i] && !slot.includes(a.part)); slot[i] = a.part; }
        if (a.kind === "remove") { if (a.id.startsWith("cover-")) cover[i] = false; else slot[i] = null; }
      } else assert.deepEqual([r.state.on, r.state.slot, r.state.cover], [s.on, s.slot, s.cover], "a refused act changes nothing");
      if (a.kind === "toggle" && !OWN.has(p.things[i])) assert.ok(r.refused, "no switch on a non-luminous thing");
      s = r.state;
    }
  }
  assert.ok(looks > 150 && accepted > 300 && wins >= 1, `looks ${looks}, accepted ${accepted}, wins ${wins}`);
});

test("roshni: the law's answers (a translucent screen, the Moon without the Sun, total dark, a cover on the Moon)", () => {
  const lv = (goal, fade, pred) => { for (let seed = 1; seed < 80; seed++) { const c = L.generate(req(goal, seed, { fade })).find((x) => pred(x.level.params)); if (c) return L.validate(c.level); } throw new Error(`no ${goal}`); };
  // parda: a translucent screen makes a clear lane "not clearly"; an opaque one hides it; air shows it clearly
  const pd = lv("parda", 2, (p) => p.tray.some((m) => MATS[m] === "opaque")), pp = pd.params;
  const clear = pp.want.indexOf("clear"), tr = pp.tray.find((m) => MATS[m] === "translucent"), op = pp.tray.find((m) => MATS[m] === "opaque");
  assert.equal(seenOf(pp, run(pd, [{ kind: "place", part: tr, x: clear, y: 0 }]).s)[clear], "blur");
  assert.equal(seenOf(pp, run(pd, [{ kind: "place", part: op, x: clear, y: 0 }]).s)[clear], "hidden");
  assert.equal(seenOf(pp, L.init(pd))[clear], "clear");
  assert.deepEqual(run(pd, [{ kind: "place", part: tr, x: clear, y: 0 }, { kind: "run" }]).refused, ["blur_clear"]);
  assert.deepEqual(run(pd, [{ kind: "place", part: tr, x: clear, y: 0 }, { kind: "place", part: tr, x: (clear + 1) % 3, y: 0 }]).refused, ["in_use"], "one piece, one slot");
  assert.deepEqual(run(pd, [{ kind: "toggle", id: "thing-0" }]).refused, ["no_switch"], "parda's lights are lit; no switch");
  // roshan: the Moon wanted and dark until the Sun is on; nothing at all on is total dark
  const rm = lv("roshan", 1, (p) => p.things.includes("moon")), rp = rm.params, moon = rp.things.indexOf("moon"), sun = rp.things.indexOf("sun");
  const other = rp.things.findIndex((t) => isSource(t) && t !== "sun");
  assert.deepEqual(run(rm, [{ kind: "run" }]).refused, ["moon_dark"]);
  assert.deepEqual(run(rm, [{ kind: "toggle", id: `thing-${other}` }, { kind: "run" }]).refused, ["moon_dark"], "a candle flame does not light the Moon here: only sunlight");
  assert.equal(seenOf(rp, run(rm, [{ kind: "toggle", id: `thing-${sun}` }]).s)[moon], "clear");
  assert.deepEqual(run(rm, [{ kind: "toggle", id: `thing-${moon}` }]).refused, ["no_switch"], "the Moon has no switch");
  const rr = lv("roshan", 1, (p) => p.things.includes("plate")), rq = rr.params;
  assert.deepEqual(run(rr, [{ kind: "run" }]).refused, ["all_dark"]);
  assert.ok(run(rr, [{ kind: "run" }]).ms.some((m) => m.kind === "misconception_consequence" && m.misconceptionId === "look-hard"));
  // a light on in an open lane is seen by the eye: the card says not
  const open = rq.things.findIndex((t, i) => isSource(t) && !rq.walls.includes(i));
  assert.deepEqual(run(rr, [{ kind: "toggle", id: `thing-${open}` }, { kind: "run" }]).refused, ["light_seen"]);
  // dhak: a cover on the Moon leaves the room lit (the Sun still shines); covers run out; the Sun covered darkens the Moon
  const dk = lv("dhak", 1, () => true), dp = dk.params, dm = dp.things.indexOf("moon"), ds = dp.things.indexOf("sun");
  assert.deepEqual(run(dk, [{ kind: "place", part: "cover", x: dm, y: 0 }, { kind: "run" }]).refused, ["moon_covered"]);
  assert.equal(seenOf(dp, run(dk, [{ kind: "place", part: "cover", x: ds, y: 0 }]).s)[dm], "dark", "the Moon goes dark by itself");
  const all = dp.things.map((_, i) => ({ kind: "place", part: "cover", x: i, y: 0 }));
  assert.ok(run(dk, all).refused.includes("no_covers_left"));
  assert.deepEqual(run(dk, [{ kind: "place", part: "cover", x: ds, y: 0 }, { kind: "remove", id: `cover-${ds}` }]).s.cover.filter(Boolean).length, 0);
  // undo steps back; LOOK changes nothing on the bench
  assert.equal(run(dk, [{ kind: "place", part: "cover", x: ds, y: 0 }, { kind: "undo" }]).s.cover[ds], false);
  const looked = run(rm, [{ kind: "run" }]).s;
  assert.deepEqual([looked.on, looked.slot, looked.cover], [L.init(rm).on, L.init(rm).slot, L.init(rm).cover]);
  assert.ok(plan(dp));
});

test("roshni: tampered params are refused; a claim in an act never decides; nothing is timed", () => {
  const level = L.generate(req("roshan", 5, { fade: 2 }))[0].level, p = level.params;
  const bad = (patch, o = {}) => L.validate({ ...level, ...o, params: { ...p, ...patch } });
  assert.ok(L.validate(level));
  assert.equal(bad({ goal: "nope" }), null);
  assert.equal(bad({ look: 4 }), null);
  assert.equal(bad({ things: [...p.things, "lantern"] }), null);
  assert.equal(bad({ things: [p.things[0], p.things[0], ...p.things.slice(2)] }), null);
  assert.equal(bad({ want: p.want.map(() => "not") }), null, "a card with nothing to see");
  assert.equal(bad({ tray: ["glass", "glass"] }), null);
  assert.equal(bad({ covers: 2 }), null);
  assert.equal(bad({}, { mode: "beam" }), null);
  const sk = L.generate(req("roshan", 3, { fade: 1 })).find((c) => c.level.params.things.includes("sun"))?.level ?? L.generate(req("roshan", 4, { fade: 1 })).find((c) => c.level.params.things.includes("sun")).level;
  assert.equal(L.validate({ ...sk, params: { ...sk.params, walls: [] } }), null, "the Sun's lane is always walled");
  const forged = sanitizeActs([{ seq: 1, act: { kind: "run", correct: true, solved: true } }]);
  assert.ok(!("correct" in forged[0].act) && !("solved" in forged[0].act));
  assert.notEqual(L.grade(L.validate(level), forged).verdict, "solved");
  const code = (s) => s.replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(code(LOGIC_SRC), /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(code(VIEW), /Math\.random|Date\.now|performance\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

test("roshni: no word holds a number or an economy word; lines fit the Studio box; every word exists in all three languages", () => {
  const ECON = /\b(points?|coins?|gems?|streaks?|lives|life left|rewards?|leaderboard|rank(ing)?|xp|level up|bonus|jackpot|loot|unlock(ed)?|hurry|jaldi|time'?s up|game over|timer|seconds?)\b/i;
  const strings = MY_WORDS.flatMap(([k, v]) => LANGS.map((l) => [`${k} ${l}`, v[l]]));
  const v = playActOf("yantra", "roshni"); strings.push(["play-verbs", `${v.hi} ${v.en}`]);
  for (const m of code(VIEW).matchAll(/"([^"\n]*)"/g)) strings.push([`view "${m[1]}"`, m[1]]);
  for (const [where, s] of strings) assert.doesNotMatch(s, ECON, `${where}: "${s}"`);
  for (const [k, w] of MY_WORDS) for (const l of LANGS) assert.doesNotMatch(w[l].replace(/\{\w+\}/g, ""), /[0-9०-९]/, `${k} ${l} states a number`);
  for (const [k, w] of MY_WORDS) if (/\.(goal|why|done|note)\./.test(k)) for (const l of LANGS) assert.ok(w[l].replace(/\{\w+\}/g, "xxxxxxxxxx").length <= 64, `${k} ${l} is long`);
  // the longest real fill still fits
  const longest = (pre, l) => Math.max(...Object.keys(WORDS).filter((k) => k.startsWith(pre)).map((k) => WORDS[k][l].length));
  for (const [k, w] of MY_WORDS) if (/\.why\./.test(k)) for (const l of LANGS) {
    const fill = (w[l].includes("{thing}") ? longest("yantra.roshni.thing.", l) : 0) + (w[l].includes("{mat}") ? longest("yantra.roshni.mat.", l) : 0);
    assert.ok(w[l].replace(/\{\w+\}/g, "").length + fill <= 72, `${k} ${l} with the longest fill`);
  }
  // every key the view and the law use exists in all three languages; vakya's words stay last
  const keys = Object.keys(WORDS), first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const whys = new Set([...LOGIC_SRC.matchAll(/return \[(?:[^\]]*?\? )?"([a-z_]+)"/g)].map((m) => m[1]));
  for (const m of LOGIC_SRC.matchAll(/"([a-z_]+)" : "([a-z_]+)" : "([a-z_]+)"/g)) for (const x of m.slice(1)) whys.add(x);
  const decisive = LOGIC_SRC.match(/decisiveRefusals: \[([^\]]+)\]/)[1].match(/"([a-z_]+)"/g).map((x) => x.slice(1, -1));
  for (const w of decisive) whys.add(w);
  const dyn = [
    ...ROSHNI_GOALS.flatMap((g) => [`goal.${g}`, `done.${g}`]), ...Object.keys(THINGS).map((t) => `thing.${t}`), ...MAT_IDS.map((m) => `mat.${m}`), "mat.air",
    ...[...whys].map((x) => `why.${x}`), "note.pick", "look", "card",
  ].map((k) => `yantra.roshni.${k}`);
  for (const k of dyn) for (const l of LANGS) assert.ok(WORDS[k]?.[l], `${k} ${l}`);
  for (const m of VIEW.matchAll(/W\("(yantra\.roshni\.[a-zA-Z0-9._-]+)"/g)) for (const l of LANGS) assert.ok(WORDS[m[1]]?.[l], `${m[1]} ${l}`);
});
function code(s) { return s.replace(/\/\/.*$/gm, ""); }

// ───────────────────────────── the play server ─────────────────────────────
const MINE = () => coverage().entries.filter((e) => e.family === "yantra" && e.mode === "roshni");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("roshni coverage: three entries on ch11-t01, one per skill, mapped to the topic's own kit misconceptions", () => {
  assert.deepEqual(MINE().map((e) => `${e.goal}|${e.skillIds.join(",")}`), [`parda|${T}-s2`, `roshan|${T}-s3`, `dhak|${T}-s1`]);
  assert.deepEqual(MINE().map((e) => e.misMap), [{ "blur-clear": `${T}-m3` }, { "moon-alone": `${T}-m1`, "look-hard": `${T}-m2` }, { "moon-cover": `${T}-m1` }]);
  for (const e of MINE()) for (const kit of Object.values(e.misMap)) assert.ok(TOPIC.misconceptions.some((x) => x.id === kit), kit);
  for (const s of ["s1", "s2", "s3"]) { assert.ok(hasPlay(`${T}-${s}`)); assert.equal(entryFor({ skillId: `${T}-${s}` }).mode, "roshni"); }
  assert.deepEqual(backlogged(T), [], `${T} is still in the law backlog`);
  // the beam's own topics stay the beam's
  for (const t of ["c7-science-ch11-t03", "c7-science-ch11-t04"]) assert.ok(coverage().entries.some((e) => e.topicId === t && e.mode === "beam"));
});

for (const fade of [1, 2, 3]) {
  test(`roshni server fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const e of MINE()) for (const child of ["c1", "c2", "c3", "c4", "c5"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e, "Zoya");
      assert.ok(cur && cur.family === "yantra" && cur.mode === "roshni" && cur.params.goal === e.goal);
      assert.ok(L.validate(cur));
      const level = levelsFor(s, e).garam;
      assert.equal(level.params.look, fade);
      const g = gradeActs(level, env(L.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.ok(e.skillIds.includes(rows[0].skillId));
      const forged = gradeActs(level, [{ seq: 1, t: 0, act: { kind: "run", solved: true, correct: true, verdict: "solved" } }], { final: true });
      assert.notEqual(forged.grade.verdict, "solved");
      assert.ok(level.proof.discriminates.length > 0, "a level that can show a belief is served");
      for (const kitId of level.proof.discriminates) {
        const mal = Object.keys(level.mal).find((m) => level.mal[m] === kitId && L.malActs(level, m));
        const mg = gradeActs(level, env(L.malActs(level, mal)), { final: true });
        assert.equal(mg.grade.evidence[0].misconceptionId, kitId);
      }
      assert.ok(hiddenOf(level).length > 0, "hidden values");
    }
  });
}

test("roshni: the first level served differs across children (seeded difficulty jitter), and benches vary across seeds", () => {
  for (const e of MINE()) for (const fade of [1, 3]) {
    const sigs = new Set(), benches = new Set();
    for (let c = 0; c < 20; c++) {
      const child = `var-${c}`, lv = currentLevel(sessionOf(e, { childId: child, fade, seed: seedOf(child, entryKey(e), 0) }), e);
      sigs.add(lv.sig); benches.add(lv.params.things.join(","));
    }
    assert.ok(sigs.size >= 3, `${e.goal} fade ${fade}: ${sigs.size} distinct first levels over 20 children`);
    assert.ok(benches.size >= 3, `${e.goal} fade ${fade}: ${benches.size} distinct benches over 20 children`);
  }
  // the generator's own seeds give different difficulties for the same bench shape (the nudge)
  const d = new Set(L.generate(req("parda", 1)).map((c) => c.difficulty.toFixed(3)));
  assert.ok(d.size >= 4);
});

test("roshni: the generator's and the picker's work is bounded (counted, not timed)", () => {
  // measured 2026-11-10 over every case below: at most 12 candidates and 234 calls into the family logic per pick; bounds are 3x above that. A count is the same on every machine; a
  // 50 ms p95 read 5 ms idle and 110 ms under the gate's load (tests/_work.mjs).
  const gen = [], calls = [], considered = [], counter = counted(L);
  for (const goal of ROSHNI_GOALS) for (const fade of [1, 2, 3]) for (let seed = 1; seed <= 6; seed++) {
    gen.push(L.generate(req(goal, seed * 31, { fade })).length);
    counter.reset(); const picked = pickLevels(counter.logic, req(goal, seed * 31, { fade })); assert.ok(picked); calls.push(counter.calls()); considered.push(picked.considered);
  }
  assert.ok(Math.max(...gen) <= 36, `generate made ${Math.max(...gen)} candidates`);
  assert.ok(Math.max(...considered) <= 36, `pick considered ${Math.max(...considered)}`);
  assert.ok(Math.max(...calls) <= 800, `pick made ${Math.max(...calls)} calls into the family logic`);
});
