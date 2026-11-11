// r7 Games, Aakash · the Earth's motions, seasons and eclipses (class 7 science, c7-science-ch12-t01..t03). A model the child
// spins and moves round. Nothing ever runs on a clock: the Earth spins an eighth of a turn, moves a quarter of the way round
// the Sun, the Moon moves on a place, or months pass, only when the child taps (or drags) it.
// Pure law checks: every generated level validates, solves and no idea-free play wins; an INDEPENDENT checker (its own reading
// of the kit's sentences: the half facing the Sun has day, a place turns west to east into the light, the eastern place
// first; a day is one spin and a year once round; the axis keeps its way, the half leaning towards the Sun has its light
// straight; an eclipse needs the three in line at new or full moon) agrees with every step the law takes over random play;
// each mal-rule's acts land on its OWN misconception moment and fold the topic's kit id; every property the law uses is a
// kit sentence and every number on screen is the kit's; tampered params are refused; a claim never decides; first levels
// differ across children; the generator and picker are fast (CPU time); and every coverage entry serves a proven level
// through the play server.
import { backlogged } from "./_backlog.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aakashLogic as L, AAKASH_MAL, AAKASH_MODES, GOALS_OF, KIT_OF, SPIN, PATH, MOON, EAST, NEAR, toolsOf, cardOf, dinRow, saalRow, jhukRow, dhoopRow, grahanRow } from "../src/play/families/aakash/aakash.logic.ts";
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
const KIT = JSON.parse(readFileSync(`${ROOT}data/kits/c7-science.json`, "utf8"));
const KITS = Object.fromEntries(KIT.topics.map((t) => [t.topicId, t]));
const TOPIC = { chakkar: "c7-science-ch12-t01", ritu: "c7-science-ch12-t02", grahan: "c7-science-ch12-t03" };
const ALL = Object.fromEntries(AAKASH_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "aakash", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = Object.entries(GOALS_OF).flatMap(([mode, goals]) => goals.map((g) => [mode, g]));
const levelsOf = (mode, goal, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of L.generate(req(mode, goal, seed, { fade }))) out.push(c);
  return out;
};
const U = (m) => ({ kind: "use", m });
const D = { kind: "done" };
const WANT = { din: ["sun-goes"], saal: ["spin-year", "trip-day"], jhuk: ["near-summer", "axis-turns"], dhoop: ["slant-same"], chaaya: ["phase-shadow"], kab: ["every-month", "phase-shadow"] };

test("aakash: the family is registered (FAMILIES, MODES, arts, logic, views, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("aakash"));
  assert.deepEqual([...MODES.aakash], ["chakkar", "ritu", "grahan"]);
  assert.deepEqual([...AAKASH_MODES], [...MODES.aakash]);
  assert.equal(FAMILY_ARTS.aakash.length, 4);
  const views = readFileSync(`${ROOT}src/play/families/views.ts`, "utf8"), data = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).aakash;
  for (const m of AAKASH_MODES) {
    assert.equal(LOGIC[`aakash/${m}`], L);
    assert.match(views, new RegExp(`"aakash/${m}": makeAakashView`));
    const v = playActOf("aakash", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
    assert.doesNotMatch(`${v.hi} ${v.en}`, /chun|choose|pick/i);
    assert.ok(data?.[m]?.act && data[m].hi && data[m].en, `verbs.json aakash/${m}`);
  }
});

test("aakash: every property the law uses is a kit sentence; every number on screen is the kit's; the rest are scene values", () => {
  for (const [topic, sents] of Object.entries(KIT_OF)) {
    const T = JSON.stringify(KITS[topic]);
    assert.ok(T, topic);
    for (const [what, text] of Object.entries(sents)) assert.ok(T.includes(text), `${topic} ${what}: "${text}" is not in the kit`);
  }
  // the only digits on screen: the kit's "about 24 hours" and "about 365¼ days" (the year's done line)
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words;
  const E1 = KITS["c7-science-ch12-t01"].expectations.join(" ");
  for (const [k, v] of Object.entries(words)) if (k.startsWith("aakash.")) for (const l of ["hinglish", "en", "hi"]) {
    const nums = v[l].replace(/\{\w+\}/g, "").match(/[0-9०-९][0-9०-९¼½¾.]*/g) ?? [];
    if (k === "aakash.done.saal") assert.deepEqual(nums, ["24", "365¼"], `${k} ${l}`);
    else assert.deepEqual(nums, [], `${k} ${l} states a number`);
    for (const n of nums) assert.ok(E1.includes(`about ${n}`), `${n} is the kit's`);
  }
  assert.match(E1, /once in about 24 hours/); assert.match(E1, /about 365¼ days, which is one year/);
  // no angle, distance or date is claimed (the kit's tilt numbers are not drawn: a picture, never a geometry quiz)
  for (const [k, v] of Object.entries(words)) if (k.startsWith("aakash.")) for (const l of ["hinglish", "en", "hi"]) assert.doesNotMatch(v[l], /°|degree|km|January|June|December/i, `${k} ${l}`);
  // every top-level numeric constant is a declared scene value, a moment's step or the picker's nudge
  const logic = readFileSync(`${ROOT}src/play/families/aakash/aakash.logic.ts`, "utf8"), lines = logic.split("\n");
  const consts = [...logic.matchAll(/^(?:export )?const ([A-Z_]+) = ([0-9.]+);/gm)].map((m) => m[1]).sort();
  assert.deepEqual(consts, ["EAST", "FULL_AT", "JITTER", "MOON", "NEAR", "NEW_AT", "PATH", "SPIN"]);
  for (const c of ["SPIN", "PATH", "MOON", "EAST", "NEAR"]) { const i = lines.findIndex((l) => new RegExp(`const ${c} = `).test(l)); assert.match(lines[i - 1], /scene value/, c); }
  assert.ok(SPIN === 8 && PATH === 4 && MOON === 8 && EAST === 1 && NEAR === 2);
  const view = readFileSync(`${ROOT}src/play/families/aakash/aakash.view.ts`, "utf8");
  assert.match(view, /star places are the level's own/);
  // a goal / why / done line fits two lines of the 320 px Studio box (forge3 Q2.whole clips a longer one)
  for (const [k, v] of Object.entries(words)) if (/^aakash\.(goal|why|done)\./.test(k)) for (const l of ["hinglish", "en", "hi"]) assert.ok(v[l].replace(/\{\w+\}/g, "xxxxxxxxxx").length <= 64, `${k} ${l} is long`);
});

for (const [mode, goal] of CASES) {
  test(`aakash ${mode}/${goal}: every level validates, solves, is shortcut-free; mal-rules land on their own misconception`, () => {
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
      for (const mal of AAKASH_MAL) {
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
// t01: the Earth turns only west to east, an eighth at a time; the Sun never moves; a place's moment is where it faces: facing
// the Sun noon, turned away midnight, coming into the light (the east side of the day half) sunrise, leaving it sunset; the
// eastern place is ahead. A day is one whole spin at one place on the path; a year once all the way round. t02: the axis
// leans the same way everywhere; a half leaning towards the Sun has its light straight (summer), leaning away slanting
// (winter), and the two halves are always opposite; the closest point is in the northern winter. t03: an eclipse only with
// the Moon between (solar) or behind the Earth (lunar) AND on the line; the line is crossed at two opposite places that move
// on as the months pass.
const ORDER = ["noon", "", "set", "", "mid", "", "rise", ""];
function checkStep(p, a, w0, w1, refused, moments) {
  if (refused) { assert.deepEqual(w1, w0, "a refused act changes nothing"); return; }
  const g = p.goal;
  if (a.kind === "use" && a.m === "spin") assert.equal((w1.r - w0.r + 8) % 8, 1, "the Earth turns one way, an eighth at a time");
  if (a.kind === "use" && a.m === "sun") assert.fail("the Sun never moves");
  if (g === "din" && a.kind === "done") {
    const r = dinRow(p), it = r.card[w0.next], step = (w0.r + (r.places.length === 2 && it.at === 0 ? 1 : 0)) % 8;
    assert.equal(ORDER[step], it.when, "the place is at the card's moment");
    assert.equal(w1.next, w0.next + 1);
  }
  if (g === "saal") {
    if (a.kind === "use" && a.m === "round") { assert.equal(saalRow(p).card[w0.next], "year", "going round is the year's"); assert.equal((w1.pos - w0.pos + 4) % 4, 1); }
    if (a.kind === "done") { const it = saalRow(p).card[w0.next]; assert.ok(it === "day" ? w0.sp === 8 && w0.mv === 0 : w0.mv === 4, `${it} closed only when made`); }
  }
  if (g === "jhuk" || g === "dhoop") {
    // the half that leans towards the Sun: the north at the place opposite the closest point, the south at the closest point
    const towards = (half, pos) => (half === "N" ? pos % 4 === 0 : pos % 4 === 2);
    const away = (half, pos) => towards(half === "N" ? "S" : "N", pos);
    if (a.kind === "use" && a.m === "tilt") assert.fail("the axis is never turned");
    if (g === "jhuk" && a.kind === "done") {
      const it = jhukRow(p).card[w0.next];
      assert.ok(it.season === "summer" ? towards(it.half, w0.pos) : away(it.half, w0.pos), "summer where the half leans towards the Sun");
    }
    if (g === "dhoop" && a.kind === "use" && a.m === "shine") assert.ok(towards(dhoopRow(p).card[w0.next], w0.pos), "the ice melts only under straight light");
  }
  if (g === "chaaya" || g === "kab") {
    if (a.kind === "use" && a.m === "months") assert.ok(g === "kab", "months pass only in kab");
    if (a.kind === "done") {
      const it = grahanRow(p).card[w0.next], crossing = [(2 * w0.pos) % 8, (2 * w0.pos + 4) % 8];
      assert.equal(w0.k, it === "solar" ? 0 : 4, "the Moon between (solar) or behind the Earth (lunar)");
      assert.ok(crossing.includes(w0.k), "the Moon on the line");
    }
  }
  if (moments.some((m) => m.kind === "solved")) assert.equal(w1.next, cardOf(p).length);
}

test("aakash: random play — the checker agrees with every step the law takes", () => {
  const rnd = mulberry32(2026);
  let accepted = 0;
  for (const [mode, goal] of CASES) for (const c of levelsOf(mode, goal, [5, 11])) {
    const level = L.validate(c.level), p = level.params, moves = [...toolsOf(p), ...(goal === "din" || goal === "saal" ? ["sun"] : [])].map(U);
    let s = L.init(level);
    for (let k = 0; k < 50 && !s.done; k++) {
      const a = rnd() < 0.05 ? { kind: "undo" } : rnd() < 0.25 ? D : moves[Math.floor(rnd() * moves.length)];
      const r = L.apply(level, s, a, k + 1);
      if (a.kind !== "undo") { checkStep(p, a, s.w, r.state.w, r.refused, r.moments); if (!r.refused) accepted++; }
      s = r.state;
    }
  }
  assert.ok(accepted > 500, `accepted acts ${accepted}`);
});

test("aakash: the law's answers (the moments, the east first, the day and the year, the axis, the patches, the line)", () => {
  const lv = (mode, goal, row, fade) => { for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) { const c = L.generate(req(mode, goal, seed, { fade })).find((x) => x.level.params.row === row); if (c) return L.validate(c.level); } throw new Error(`no ${goal} row ${row}`); };
  // din row 0: home at midnight; two spins bring sunrise (not one); the Sun refuses to move
  const home = lv("chakkar", "din", 0, 1);
  assert.deepEqual(run(home, [U("spin"), D]).refused, ["not_now"]);
  assert.equal(run(home, [U("spin"), U("spin"), D]).s.w.next, 1);
  assert.deepEqual(run(home, [U("sun")]).refused, ["sun_still"]);
  // din look 3 row 8: Arunachal's sunrise comes one spin step before Gujarat's
  const india = lv("chakkar", "din", 8, 3);
  const a = run(india, [U("spin"), U("spin"), D]);
  assert.equal(a.s.w.next, 1, "Arunachal at sunrise"); assert.deepEqual(run(india, [U("spin"), U("spin"), D, D]).refused, ["not_now"], "Gujarat not yet");
  assert.equal(run(india, [U("spin"), U("spin"), D, U("spin"), D]).s.w.next, 2);
  // saal row 0 (a day, then a year): seven spins are not a day; eight are; going round for a day is refused
  const yr = lv("chakkar", "saal", 0, 1);
  assert.deepEqual(run(yr, [...Array(7).fill(U("spin")), D]).refused, ["short_day"]);
  assert.deepEqual(run(yr, [U("round")]).refused, ["not_day_move"]);
  const day = [...Array(8).fill(U("spin")), D];
  assert.equal(run(yr, day).s.w.next, 1);
  assert.deepEqual(run(yr, [...day, ...Array(8).fill(U("spin")), D]).refused, ["spun_not_round"]);
  assert.ok(run(yr, [...day, ...Array(4).fill(U("round")), D]).s.done);
  assert.deepEqual(run(yr, [...day, ...Array(5).fill(U("round"))]).refused, ["round_done"]);
  // jhuk row 0 (north summer, from the side place): the closest point is the northern winter; the axis is not turned
  const tilt = lv("ritu", "jhuk", 0, 1);
  assert.deepEqual(run(tilt, [U("round"), D]).refused, ["near_winter"]);
  assert.deepEqual(run(tilt, [U("tilt")]).refused, ["axis_same"]);
  assert.ok(run(tilt, [U("round"), U("round"), U("round"), D]).s.done);
  // dhoop row 0 (India's ice, from the side place): the slanting light leaves it; the straight light melts it
  const ice = lv("ritu", "dhoop", 0, 1);
  assert.deepEqual(run(ice, [U("shine")]).refused, ["spread_some"]);
  assert.deepEqual(run(ice, [U("round"), U("shine")]).refused, ["spread"]);
  assert.ok(run(ice, [U("round"), U("round"), U("round"), U("shine")]).s.done);
  // kab row 0 (a solar eclipse, a month off the line): the new moon passes by; a month later it lines up
  const when = lv("grahan", "kab", 0, 1);
  assert.deepEqual(run(when, [U("moon"), U("moon"), D]).refused, ["off_line"]);
  assert.ok(run(when, [U("months"), U("moon"), U("moon"), D]).s.done);
  // chaaya row 1 (a lunar eclipse): a half moon is not the Earth's shadow
  const lun = lv("grahan", "chaaya", 1, 1);
  assert.deepEqual(run(lun, [U("moon"), D]).refused, ["phase"]);
  assert.ok(run(lun, [U("moon"), U("moon"), U("moon"), D]).s.done);
  // undo steps back
  assert.equal(run(home, [U("spin"), { kind: "undo" }]).s.w.r, dinRow(home.params).r0);
});

test("aakash: tampered params are refused; a claim in an act never decides; nothing is timed", () => {
  const level = L.generate(req("chakkar", "din", 5, { fade: 2 }))[0].level;
  const p = level.params, bad = (patch, o = {}) => L.validate({ ...level, ...o, params: { ...p, ...patch } });
  assert.ok(L.validate(level));
  assert.equal(bad({ row: 99 }), null);
  assert.equal(bad({ row: 0 }), null, "a row of another look");
  assert.equal(bad({ scene: "nowhere" }), null);
  assert.equal(bad({ goal: "kab" }), null);
  assert.equal(bad({ look: 4 }), null);
  assert.equal(bad({ lay: -1 }), null);
  assert.equal(bad({}, { mode: "ritu" }), null);
  const forged = sanitizeActs([{ seq: 1, act: { kind: "done", correct: true, solved: true } }]);
  assert.ok(!("correct" in forged[0].act) && !("solved" in forged[0].act));
  assert.notEqual(L.grade(L.validate(level), forged).verdict, "solved");
  // a tool from another goal is refused (the Sun is only on screen in chakkar)
  const r = L.validate(L.generate(req("ritu", "jhuk", 5))[0].level);
  assert.deepEqual(run(r, [U("sun"), U("moon"), U("spin")]).refused, ["no_tool", "no_tool", "no_tool"]);
  const logic = readFileSync(`${ROOT}src/play/families/aakash/aakash.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  const view = readFileSync(`${ROOT}src/play/families/aakash/aakash.view.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// ───────────────────────────── the play server ─────────────────────────────
const AK = () => coverage().entries.filter((e) => e.family === "aakash");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("aakash coverage: six entries on the three topics, mapped to their kit misconceptions; m3 of eclipses not admitted", () => {
  assert.deepEqual(AK().map((e) => `${e.topicId}|${e.mode}|${e.goal}|${e.skillIds.join(",")}`), [
    "c7-science-ch12-t01|chakkar|din|c7-science-ch12-t01-s1,c7-science-ch12-t01-s2", "c7-science-ch12-t01|chakkar|saal|c7-science-ch12-t01-s3,c7-science-ch12-t01-s1",
    "c7-science-ch12-t02|ritu|jhuk|c7-science-ch12-t02-s1,c7-science-ch12-t02-s3", "c7-science-ch12-t02|ritu|dhoop|c7-science-ch12-t02-s2",
    "c7-science-ch12-t03|grahan|chaaya|c7-science-ch12-t03-s1,c7-science-ch12-t03-s2", "c7-science-ch12-t03|grahan|kab|c7-science-ch12-t03-s3"]);
  const m = (t, n) => `${t}-m${n}`, [A, B, C] = Object.values(TOPIC);
  assert.deepEqual(AK().map((e) => e.misMap), [
    { "sun-goes": m(A, 1) }, { "spin-year": m(A, 2), "trip-day": m(A, 2) }, { "near-summer": m(B, 1), "axis-turns": m(B, 2) }, { "slant-same": m(B, 3) },
    { "phase-shadow": m(C, 2) }, { "every-month": m(C, 1), "phase-shadow": m(C, 2) }]);
  for (const e of AK()) for (const kit of Object.values(e.misMap)) assert.ok(KITS[e.topicId].misconceptions.some((x) => x.id === kit), kit);
  // the safety belief (sunglasses) has no mechanic
  assert.ok(!AK().some((e) => Object.values(e.misMap).includes(m(C, 3))));
  for (const [topic, skills] of [[A, ["s1", "s2", "s3"]], [B, ["s1", "s2", "s3"]], [C, ["s1", "s2", "s3"]]]) {
    for (const s of skills) assert.ok(hasPlay(`${topic}-${s}`), `${topic}-${s}`);
    assert.equal(entryFor({ skillId: `${topic}-${skills[0]}` }).family, "aakash");
  }
  for (const t of Object.values(TOPIC)) assert.deepEqual(backlogged(t), [], `${t} is still in the law backlog`);
});

for (const e of AK()) for (const fade of [1, 2, 3]) {
  test(`aakash server ${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3", "c4", "c5", "c6"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e, "Zoya");
      assert.ok(cur && cur.family === "aakash" && cur.mode === e.mode && cur.params.goal === e.goal);
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
test("aakash: the first level served differs across children", () => {
  for (const e of AK()) for (const fade of [1, 3]) {
    const sigs = new Set();
    for (let c = 0; c < 20; c++) {
      const child = `var-${c}`, lv = currentLevel(sessionOf(e, { childId: child, fade, seed: seedOf(child, entryKey(e), 0) }), e);
      sigs.add(lv.sig);
    }
    assert.ok(sigs.size >= 3, `${e.goal} fade ${fade}: ${sigs.size} distinct first levels over 20 children`);
  }
});

test("aakash: the generator's and the picker's work is bounded (counted, not timed)", () => {
  // measured 2026-11-10 over every case below: at most 9 candidates and 466 calls into the family logic per pick; bounds are 3x above that. A count is the same on every machine; a
  // 50 ms p95 read 5 ms idle and 110 ms under the gate's load (tests/_work.mjs).
  const gen = [], calls = [], considered = [], counter = counted(L);
  for (const [mode, goal] of CASES) for (const fade of [1, 2, 3]) for (let seed = 1; seed <= 6; seed++) {
    gen.push(L.generate(req(mode, goal, seed * 31, { fade })).length);
    counter.reset(); const picked = pickLevels(counter.logic, req(mode, goal, seed * 31, { fade })); assert.ok(picked); calls.push(counter.calls()); considered.push(picked.considered);
  }
  assert.ok(Math.max(...gen) <= 27, `generate made ${Math.max(...gen)} candidates`);
  assert.ok(Math.max(...considered) <= 27, `pick considered ${Math.max(...considered)}`);
  assert.ok(Math.max(...calls) <= 1400, `pick made ${Math.max(...calls)} calls into the family logic`);
});

test("aakash: every word the view shows exists in all three languages; vakya's words stay last; no economy word", () => {
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/aakash/aakash.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(aakash\.[a-zA-Z0-9._-]+)"/g)].map((m) => m[1]);
  const prefixes = [...view.matchAll(/W\(`(aakash\.[a-zA-Z0-9._-]+)\$\{/g)].map((m) => m[1]);
  assert.ok(prefixes.length >= 10, `template keys ${prefixes.length}`);
  const logic = readFileSync(`${ROOT}src/play/families/aakash/aakash.logic.ts`, "utf8");
  const whys = new Set([...logic.matchAll(/no\("([a-z_]+)"/g)].map((m) => m[1]));
  const tools = new Set(CASES.flatMap(([mode, goal]) => levelsOf(mode, goal, [1]).flatMap((c) => toolsOf(c.level.params))));
  const goals = CASES.map(([, g]) => g);
  const dyn = [
    ...["rise", "noon", "set", "mid"].map((x) => `when.${x}`), ...["arunachal", "gujarat", "ghar"].map((x) => `place.${x}`),
    "span.day", "span.year", ...["N", "S"].flatMap((h) => [`chip.${h}.summer`, `chip.${h}.winter`, `ice.${h}`, `half.${h}`, `goal.dhoop.${h}`, `goal.jhuk.${h}.summer`, `goal.jhuk.${h}.winter`]),
    "eclipse.solar", "eclipse.lunar", ...["straight", "middle", "slant"].map((x) => `fall.${x}`),
    ...[...tools].map((t) => `tool.${t}`), ...[...whys].map((x) => `why.${x}`), ...goals.map((g) => `done.${g}`), ...goals.map((g) => `claim.${g}`),
    "goal.saal.day", "goal.saal.year", "goal.chaaya.solar", "goal.chaaya.lunar", "goal.kab.solar", "goal.kab.lunar",
  ].map((k) => `aakash.${k}`);
  assert.ok(used.length >= 12, `literal keys ${used.length}`);
  for (const pre of prefixes) assert.ok(dyn.some((k) => k.startsWith(pre)), `no word under ${pre}`);
  for (const k of [...used, ...dyn]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  const ECON = /\b(points?|coins?|gems?|streaks?|lives|life left|rewards?|leaderboard|rank(ing)?|xp|level up|bonus|jackpot|loot|unlock(ed)?|hurry|jaldi|time'?s up|game over)\b/i;
  for (const [k, v] of Object.entries(words)) if (k.startsWith("aakash.")) for (const l of ["hinglish", "en", "hi"]) assert.doesNotMatch(v[l], ECON, `${k} ${l}`);
});

// ───────────────────────────── the view, drawn headless (a recording context; the law's own state) ─────────────────────────────
// r7 aakash2 (lead, 2026-11-09): from above, a Moon off the Sun-Earth line that month still LOOKED lined up (only the side
// strip showed it off). Now the view from above draws it lifted off its path (up when it passes above the line, down when
// below, as in the strip) with a stalk and an arrow from its place on the path; on the line it sits on its path. And every
// drag (the Earth spun or moved round, the Moon moved on) makes the law's own acts, one per step the finger sweeps.
function fakeCtx() {
  const t = { font: "10px x", drawn: [], fillStyle: "", strokeStyle: "", globalAlpha: 1, lineWidth: 1, textAlign: "center", textBaseline: "middle", lineCap: "", lineJoin: "" };
  return new Proxy(t, {
    get(o, k) {
      if (k in o) return o[k];
      if (k === "measureText") return (s) => ({ width: [...String(s)].length * Number(/(\d+)px/.exec(o.font)?.[1] ?? 16) * 0.56 });
      if (k === "fillText") return (s) => { o.drawn.push({ s, font: o.font }); };
      return () => ({ addColorStop() {} });
    },
    set(o, k, v) { o[k] = v; return true; },
  });
}
let hooked = false;
/** the view imports the words as JSON (a load hook adds the import attribute), once per process */
async function hook() {
  const { register } = await import("node:module");
  if (!hooked) hooked = true, register("data:text/javascript," + encodeURIComponent(`export async function load(url, ctx, next) { if (url.endsWith(".json")) return next(url, { ...ctx, importAttributes: { ...ctx.importAttributes, type: "json" } }); return next(url, ctx); }`));
}
async function viewOf(level, W = 360, H = 430) {
  await hook();
  const { ART, Painter, newAudit } = await import("../src/play/core/styles.ts");
  const V = await import("../src/play/families/aakash/aakash.view.ts");
  const audit = newAudit("kagaz", false); audit.box = { w: W, h: H };
  const box = { state: L.init(level), acts: [] };
  let view = null;
  const ctl = { get state() { return box.state; }, dispatch(a) { const r = L.apply(level, box.state, a, box.acts.length + 1); box.state = r.state; box.acts.push(a); view.react(r.moments, r.refused); return r; }, finger() {} };
  const api = { w: W, h: H, dpr: 1, t: 50, P: new Painter(ART.kagaz, audit, false), art: ART.kagaz, tw: {}, fx: { burst() {}, shake() {}, flash() {} }, reduced: true, young: false,
    sfx() {}, target(id, x, y, w, h) { audit.targets.push({ id, x, y, w, h }); }, invalidate() {}, layer() { return null; },
    hit(x, y) { const t = [...audit.targets].reverse().find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); return t ? t.id : null; } };
  view = V.makeAakashView(api, { level, ctl, lang: "en", changed() {} });
  view.layout(W, H);
  const draw = () => { api.t += 5; audit.targets.length = 0; audit.texts.length = 0; audit.clipped = 0; const c = fakeCtx(); view.draw(c); return { targets: [...audit.targets], texts: [...audit.texts], clipped: audit.clipped }; };
  return { view, ctl, box, api, draw };
}
const centre = (t) => [t.x + t.w / 2, t.y + t.h / 2];
const tgt = (d, id) => d.targets.find((t) => t.id === id);

test("aakash grahan view: from above, an off-line Moon is drawn lifted off its path (up above, down below); on the line it sits on it; the side strip is in every state", async () => {
  await hook();
  const { heightOf, onLine } = await import("../src/play/families/aakash/aakash.logic.ts");
  const { moonCue } = await import("../src/play/families/aakash/aakash.view.ts");
  // the cue: none exactly when the Moon is on the line; above / below as the side strip draws it
  for (let k = 0; k < MOON; k++) for (let e = 0; e < PATH; e++) {
    const c = moonCue(heightOf(k, e));
    assert.equal(c.way === "", onLine(k, e), `k ${k} e ${e}`);
    if (c.way) assert.equal(c.way, heightOf(k, e) > 0 ? "above" : "below");
  }
  const levels = [...levelsOf("grahan", "chaaya", [1]), ...levelsOf("grahan", "kab", [1])].map((c) => L.validate(c.level));
  let states = 0;
  for (const level of [levels[0], levels.at(-1)]) for (const [W, H] of [[360, 430], [390, 520], [900, 520]]) {
    const v = await viewOf(level, W, H), w0 = L.init(level).w;
    const at = (k, e) => { v.box.state = { ...L.init(level), w: { ...w0, k, pos: e } }; const d = v.draw(); return { d, moon: tgt(d, "moon") }; };
    for (let k = 0; k < MOON; k++) for (let e = 0; e < PATH; e++) {
      // the same place on its path (k) in a month with the opposite height (e + 2): only the lift differs
      const a = at(k, e), b = at(k, (e + 2) % PATH), h = heightOf(k, e), dy = centre(a.moon)[1] - centre(b.moon)[1];
      assert.equal(centre(a.moon)[0], centre(b.moon)[0], "the Moon's place on its path is the same");
      if (h === 0) assert.ok(Math.abs(dy) < 0.5, `on the line it sits on its path (k ${k} e ${e}: ${dy})`);
      else if (h > 0) assert.ok(dy <= -8, `above the line it is drawn up (k ${k} e ${e}: ${dy})`);
      else assert.ok(dy >= 8, `below the line it is drawn down (k ${k} e ${e}: ${dy})`);
      // at new and full moon off the line it is lifted clear (of the Earth's shadow; its own shadow passes the Earth by)
      if ((k === 0 || k === 4) && h !== 0) assert.ok(Math.abs(dy) >= 36, `new / full moon off the line, lifted clear (${dy})`);
      // the side strip is drawn in every state; the Moon stays touchable, inside the box; no label is clipped
      assert.ok(a.d.texts.some((t) => t.s.startsWith("From the side")), "the side strip");
      assert.ok(a.moon.w >= 44 && a.moon.h >= 44 && a.moon.y >= 0 && a.moon.y + a.moon.h <= H, `moon target ${a.moon.y}`);
      assert.equal(a.d.clipped, 0, "no label clipped");
      states++;
    }
  }
  assert.equal(states, 2 * 3 * MOON * PATH);
  // every-month stays reachable and honest: at the off-line new / full moon the claim is still offered and still refused
  let shown = 0;
  for (const level of levels.filter((l) => l.params.goal === "kab")) {
    const acts = L.malActs(level, "every-month");
    if (!acts) continue;
    const v = await viewOf(level);
    for (const a of acts.slice(0, -1)) v.ctl.dispatch(a);
    assert.ok(!onLine(v.box.state.w.k, v.box.state.w.pos));
    assert.ok(moonCue(heightOf(v.box.state.w.k, v.box.state.w.pos)).way, "drawn off its path");
    assert.ok(v.view.controls().some((c) => c.id === "done"), "the claim is offered");
    const r = v.ctl.dispatch(acts.at(-1));
    assert.equal(r.refused, "off_line"); assert.ok(r.moments.some((m) => m.misconceptionId === "every-month"));
    shown++;
  }
  assert.ok(shown > 0);
});

test("aakash view: a finger drag makes the law's own acts, one per step swept (the Moon round the Earth, the Earth round its path, the Earth spun)", async () => {
  /** a drag round (cx, cy) from (x0, y0), forward by `sweep` radians (sx, sy: an ellipse) */
  const drag = (view, x0, y0, cx, cy, sweep, sx = 1, sy = 1) => {
    const a0 = Math.atan2(-(y0 - cy) / sy, (x0 - cx) / sx), r = Math.hypot((x0 - cx) / sx, (y0 - cy) / sy), n = Math.ceil(Math.abs(sweep) / 0.1);
    view.pointer("down", x0, y0);
    let x = x0, y = y0;
    for (let i = 1; i <= n; i++) { const a = a0 + (sweep * i) / n; x = cx + sx * r * Math.cos(a); y = cy - sy * r * Math.sin(a); view.pointer("move", x, y); }
    view.pointer("up", x, y);
  };
  /** where the target `id` is drawn with the world's value `key` set to q (the state is put back) */
  const place = (v, id, key, q) => { const s0 = v.box.state; v.box.state = { ...s0, w: { ...s0.w, [key]: q } }; const c = centre(tgt(v.draw(), id)); v.box.state = s0; v.draw(); return c; };
  // grahan: the Moon dragged three places round the Earth (the Earth's centre lies between the Moon's place and the opposite one,
  // in a month when both are on the line); backwards moves nothing
  {
    const level = L.validate(levelsOf("grahan", "chaaya", [1]).find((c) => c.level.params.look === 1).level), v = await viewOf(level), k0 = v.box.state.w.k;
    const e = v.box.state.w.pos, onK = 2 * e;   // on the line at k = 2e and 2e + 4 this month
    const [ax, ay] = place(v, "moon", "k", onK % MOON), [bx, by] = place(v, "moon", "k", (onK + 4) % MOON), cx = (ax + bx) / 2, cy = (ay + by) / 2;
    const [mx, my] = centre(tgt(v.draw(), "moon"));
    drag(v.view, mx, my, cx, cy, 3 * (Math.PI / 4));
    assert.deepEqual(v.box.acts, [U("moon"), U("moon"), U("moon")]); assert.equal(v.box.state.w.k, (k0 + 3) % MOON);
    const [nx, ny] = centre(tgt(v.draw(), "moon"));
    drag(v.view, nx, ny, cx, cy, -1.2);
    assert.equal(v.box.acts.length, 3, "a drag backwards moves nothing");
  }
  // saal: twirled on the spot (the finger never leaves the Earth) spins it; dragged off round the Sun it goes round
  {
    const lv = L.validate(levelsOf("chakkar", "saal", [1, 7]).find((c) => saalRow(c.level.params).card.join() === "day,year").level);
    const v = await viewOf(lv), d = v.draw(), [ex, ey] = centre(tgt(d, "earth")), [sx, sy] = centre(tgt(d, "sun-0"));
    drag(v.view, ex + 12, ey, ex, ey, 2 * Math.PI);
    assert.deepEqual(v.box.acts, Array(SPIN).fill(U("spin")), "one whole twirl: a whole spin");
    v.ctl.dispatch(D); assert.equal(v.box.state.w.next, 1, "a day");
    const [e2x, e2y] = centre(tgt(v.draw(), "earth"));
    drag(v.view, e2x, e2y, sx, sy, 2 * Math.PI);
    assert.deepEqual(v.box.acts.slice(SPIN + 1), Array(PATH).fill(U("round")), "dragged once all the way round the Sun");
    v.ctl.dispatch(D); assert.ok(v.box.state.done, "a year");
  }
  // ritu: the Earth dragged half way round its path (an ellipse seen from the side)
  {
    const v = await viewOf(L.validate(levelsOf("ritu", "jhuk", [1])[0].level)), pos0 = v.box.state.w.pos;
    const [ax, ay] = place(v, "earth", "pos", 0), [, by] = place(v, "earth", "pos", 1), [cx2] = place(v, "earth", "pos", 2), [, dy2] = place(v, "earth", "pos", 3);
    const cx = (ax + cx2) / 2, cy = (by + dy2) / 2, [ex, ey] = centre(tgt(v.draw(), "earth"));
    void ay;
    drag(v.view, ex, ey, cx, cy, Math.PI, ax - cx, cy - by);
    assert.deepEqual(v.box.acts, [U("round"), U("round")]); assert.equal(v.box.state.w.pos, (pos0 + 2) % PATH);
  }
});
