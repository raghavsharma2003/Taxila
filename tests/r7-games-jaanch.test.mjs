// r7 Games, Jaanch · testing food for starch and fat (class 6 science, c6-science-ch03-t02). The child runs the iodine test
// a drop at a time and the paper test (rub, Wait till dry, hold to the light), and says a result only once she has seen it.
// Nothing ever runs on a clock: a drop falls, a food is rubbed on the paper, the paper dries a step or is held to the light
// only when the child taps.
// Pure law checks: every generated level validates, solves and no idea-free play wins; an INDEPENDENT checker (its own reading
// of the kit's sentences, read out of data/kits/c6-science.json: which food turns blue-black, which leaves a patch that stays
// on dry paper) agrees with every step the law takes over random play; no result is ever taken before its evidence is on the
// bench; each mal-rule's acts land on its OWN misconception moment and fold the topic's kit id; every food's result is cited
// to a kit sentence (an item's only from a verified item); the protein test is nowhere; no jaanch word holds a number, an
// economy word or a word for eating, tasting or touching; tampered params are refused; a claim never decides; first levels
// differ across children; the generator and picker are fast (CPU time); every coverage entry serves a proven level.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  jaanchLogic as L, JAANCH_MAL, JAANCH_MODES, GOALS_OF, KIT_OF, FOODS, TESTS, FEW, DROPMAX, DRY, cardOf, testsOf,
} from "../src/play/families/jaanch/jaanch.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { NOT_ADMITTED, NOT_COVERED } from "../server/play/tools/rules/jaanch.mjs";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { pickLevels } from "../src/play/core/pick.ts";
import { mulberry32 } from "../src/play/core/rng.ts";
import { cpuNow } from "./_cpu-ms.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const KIT = JSON.parse(readFileSync(`${ROOT}data/kits/c6-science.json`, "utf8"));
const T = "c6-science-ch03-t02";
const K = KIT.topics.find((t) => t.topicId === T);
const TEXT = JSON.stringify(K);
const has = (s) => TEXT.includes(JSON.stringify(s).slice(1, -1));
const item = (id) => K.items.find((i) => i.id === `${T}-${id}`);
const mis = (id) => K.misconceptions.find((m) => m.id === `${T}-${id}`);
const WORDS = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words;
const J_WORDS = Object.entries(WORDS).filter(([k]) => k.startsWith("jaanch."));
const LANGS = ["hinglish", "en", "hi"];
const ALL = Object.fromEntries(JAANCH_MAL.map((m) => [m, `k-${m}`]));
const VIEW = readFileSync(`${ROOT}src/play/families/jaanch/jaanch.view.ts`, "utf8");
const LOGIC_SRC = readFileSync(`${ROOT}src/play/families/jaanch/jaanch.logic.ts`, "utf8");
const RULES_SRC = readFileSync(`${ROOT}server/play/tools/rules/jaanch.mjs`, "utf8");
const noComments = (s) => s.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
const req = (mode, goal, seed, o = {}) => ({ family: "jaanch", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 6, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = Object.entries(GOALS_OF).flatMap(([mode, goals]) => goals.map((g) => [mode, g]));
const levelsOf = (mode, goal, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of L.generate(req(mode, goal, seed, { fade }))) out.push(c);
  return out;
};
const DROP = { kind: "drop" };
const U = (m) => ({ kind: "use", m });
const MARK = (t, v) => ({ kind: "mark", t, v });
const NEXT = { kind: "next" };
const D = { kind: "done" };
const WANT = { iodine: ["sugar-starch"], kaagaz: ["wet-fat"], dono: ["one-only"] };
const lv = (mode, goal, fade, pred = () => true) => { for (let seed = 1; seed < 120; seed++) { const c = L.generate(req(mode, goal, seed, { fade })).find((x) => pred(x.level.params)); if (c) return L.validate(c.level); } throw new Error(`no ${goal}`); };

test("jaanch: the family is registered (FAMILIES, MODES, arts, logic, views, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("jaanch"));
  assert.deepEqual([...MODES.jaanch], ["neela", "daag", "thali"]);
  assert.deepEqual([...JAANCH_MODES], [...MODES.jaanch]);
  assert.equal(FAMILY_ARTS.jaanch.length, 4);
  const views = readFileSync(`${ROOT}src/play/families/views.ts`, "utf8"), data = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).jaanch;
  for (const m of JAANCH_MODES) {
    assert.equal(LOGIC[`jaanch/${m}`], L);
    assert.match(views, new RegExp(`"jaanch/${m}": makeJaanchView`));
    const v = playActOf("jaanch", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
    assert.doesNotMatch(`${v.hi} ${v.en}`, /chun|choose|pick/i);
    assert.ok(data?.[m]?.act && data[m].hi && data[m].en, `verbs.json jaanch/${m}`);
  }
});

// ───────────────────────────── the kit: every fact is its own ─────────────────────────────
test("jaanch: every sentence the law rests on is the kit's (an item's only from a verified item)", () => {
  for (const [topic, sents] of Object.entries(KIT_OF)) {
    assert.equal(topic, T);
    for (const [what, text] of Object.entries(sents)) {
      assert.ok(has(text), `${what}: "${text}" is not in the kit`);
      const inCore = [...K.expectations, JSON.stringify(K.misconceptions), JSON.stringify(K.workedExample)].some((x) => x.includes(text));
      if (!inCore) {
        const it = K.items.find((i) => JSON.stringify(i).includes(JSON.stringify(text).slice(1, -1)));
        assert.ok(it && it.verified?.agrees === true, `${what}: from an unverified item`);
      }
      assert.doesNotMatch(text, /protein|violet|copper|sodium hydroxide/i, `${what} names the protein test`);
    }
  }
});

test("jaanch: every food's result is cited to a kit sentence (read here from the kit file, not from the law)", () => {
  // food → test → [the kit says yes / no, where (an item id or the core), the sentence]
  const CITE = {
    potato: { starch: [true, "i03", "The potato turns blue-black"], fat: [false, "workedExample", "no oily translucent patch remains, so there is little or no fat"] },
    rice: { starch: [true, "expectations", "turn blue-black where starch is present (potato, rice, roti)"] },
    roti: { starch: [true, "expectations", "turn blue-black where starch is present (potato, rice, roti)"] },
    ricewater: { starch: [true, "i04", "Only the rice water. Iodine shows starch"] },
    idli: { starch: [true, "rl-o1", "Dilute iodine turns blue-black when starch is present"] },
    cucumber: { starch: [false, "i03", "the cucumber shows little or no blue-black"] },
    sugar: { starch: [false, "expectations", "sugar does not turn blue-black"] },
    milk: { starch: [false, "i07", "Milk does not turn blue-black with iodine"] },
    paneer: { starch: [false, "i08", "iodine shows no blue-black"], fat: [true, "i08", "the paper shows an oily patch"] },
    groundnut: { starch: [false, "i10", "Groundnut: starch ✗"], fat: [true, "expectations", "does not dry away if fat is present (groundnut, coconut)"] },
    coconut: { fat: [true, "i05", "the crushed coconut (both contain fat)"] },
    oil: { fat: [true, "i05", "The coconut oil and the crushed coconut (both contain fat)"] },
    cashew: { fat: [true, "rl-o2", "A translucent oily patch remains"] },
    chips: { fat: [true, "i09", "an oily translucent patch that stays means the chips contain fat"] },
    water: { fat: [false, "expectations", "a water patch dries and disappears"] },
    tomato: { fat: [false, "m3", "Let it dry; if the patch goes, it was only water"] },
    snack: { starch: [true, "rl-h3", "A new snack gives blue-black with iodine"], fat: [true, "rl-h3", "leaves a patch on dry paper"] },
  };
  assert.deepEqual(Object.keys(FOODS).sort(), Object.keys(CITE).sort());
  for (const [id, food] of Object.entries(FOODS)) for (const t of TESTS) {
    const c = CITE[id][t];
    if (!c) { assert.equal(food[t], undefined, `${id} ${t}: the kit gives no result, so the food is never on that test`); continue; }
    const [yes, where, text] = c;
    assert.equal(!!food[t], yes, `${id} ${t}`);
    const src = where === "expectations" ? K.expectations.join(" ") : where === "workedExample" ? JSON.stringify(K.workedExample) : /^m\d$/.test(where) ? JSON.stringify(mis(where)) : JSON.stringify(item(where));
    assert.ok(src && src.includes(text), `${id} ${t}: "${text}" not in ${where}`);
    if (/^(i\d|rl-)/.test(where)) assert.equal(item(where).verified?.agrees, true, `${id} ${t}: ${where} is verified`);
  }
  // a food is on a test's card only if the kit gives its result for that test
  for (const [mode, goal] of CASES) for (const c of levelsOf(mode, goal, [1, 5])) for (const id of cardOf(c.level.params)) for (const t of testsOf(goal)) assert.notEqual(FOODS[id][t], undefined, `${goal}: ${id} has no kit ${t} result`);
  // the scene follows the kit: iodine's own brown is the "no", a patch that stays on dry paper is fat, the teacher's lab
  assert.ok(has("Point to iodine's own brown colour as the 'no' result") && has("sample B stays brown"));
  assert.ok(has("hold it to the light") && has("Record both results in a table") && has("chemicals are handled only with a teacher"));
});

test("jaanch: the protein test is nowhere (no word, label, column, colour, act or claim); its s2 half is listed as not covered", () => {
  const PROTEIN = /protein|violet|purple|baingani|copper|sulphate|sodium hydroxide|caustic|प्रोटीन|बैंगनी|कॉपर/i;
  for (const [k, v] of J_WORDS) for (const l of LANGS) assert.doesNotMatch(v[l], PROTEIN, `${k} ${l}`);
  const verbs = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).jaanch;
  for (const m of JAANCH_MODES) { assert.doesNotMatch(JSON.stringify(verbs[m]), PROTEIN); assert.doesNotMatch(JSON.stringify(playActOf("jaanch", m)), PROTEIN); }
  assert.doesNotMatch(noComments(VIEW), PROTEIN);
  assert.doesNotMatch(noComments(LOGIC_SRC), PROTEIN);
  assert.deepEqual([...TESTS], ["starch", "fat"]);
  assert.ok(Object.values(FOODS).every((f) => Object.keys(f).every((k) => ["starch", "fat", "liquid"].includes(k))));
  assert.deepEqual(Object.keys(NOT_COVERED), [`${T}-s2`]);
  assert.match(NOT_COVERED[`${T}-s2`], /protein/);
  assert.match(RULES_SRC, /protein half/);
});

test("jaanch: no word holds a number, an economy word, or a word for eating, tasting or touching; lines fit the Studio box", () => {
  const strings = [...J_WORDS.flatMap(([k, v]) => LANGS.map((l) => [`${k} ${l}`, v[l]]))];
  const verbs = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).jaanch;
  for (const m of JAANCH_MODES) { strings.push([`verbs.json ${m}`, `${verbs[m].hi} ${verbs[m].en}`]); const v = playActOf("jaanch", m); strings.push([`play-verbs ${m}`, `${v.hi} ${v.en}`]); }
  for (const m of noComments(VIEW).matchAll(/"([^"\n]*)"/g)) strings.push([`view "${m[1]}"`, m[1]]);
  const EAT = /\b(eat|eats|eating|eaten|taste|tasting|tastes|lick|swallow|chew|khao|khaao|kha lo|chakho|chakhkar|chakh|touch|touching|chhoo|chhuo|chhoona)\b/i;
  const EAT_HI = /खाओ|खा लो|चखो|चखकर|छूओ|छुओ|छूना/;
  const ECON = /\b(points?|coins?|gems?|streaks?|lives|life left|rewards?|leaderboard|rank(ing)?|xp|level up|bonus|jackpot|loot|unlock(ed)?|hurry|jaldi|time'?s up|game over)\b/i;
  for (const [where, s] of strings) {
    assert.doesNotMatch(s, EAT, `${where}: "${s}"`);
    assert.doesNotMatch(s, EAT_HI, `${where}: "${s}"`);
    assert.doesNotMatch(s, ECON, `${where}: "${s}"`);
  }
  // no number on screen: drops and drying steps are scene values, shown only as pips
  for (const [k, v] of J_WORDS) for (const l of LANGS) assert.doesNotMatch(v[l].replace(/\{\w+\}/g, ""), /[0-9०-९]/, `${k} ${l} states a number`);
  // a goal / why / done line fits two lines of the 320 px Studio box (forge3 Q2.whole clips a longer one)
  for (const [k, v] of J_WORDS) if (/^jaanch\.(goal|why|done)\./.test(k)) for (const l of LANGS) assert.ok(v[l].replace(/\{\w+\}/g, "xxxxxxxxxx").length <= 64, `${k} ${l} is long`);
  const longest = (l) => Math.max(...Object.keys(FOODS).map((x) => WORDS[`jaanch.food.${x}`][l].length));
  for (const l of LANGS) for (const g of ["drop", "rub", "rubdrop", "dono"]) assert.ok(WORDS[`jaanch.goal.${g}`][l].replace(/\{\w+\}/g, "").length + longest(l) <= 72, `goal.${g} ${l} with the longest food`);
});

test("jaanch: no act eats, tastes or touches; the only acts are a drop, rub, wait, light, a result said and Next food", () => {
  const kinds = new Set(), tools = new Set();
  for (const [mode, goal] of CASES) for (const c of levelsOf(mode, goal, [1, 5])) {
    const lvl = L.validate(c.level);
    for (const a of [...L.solve(lvl), ...JAANCH_MAL.flatMap((m) => L.malActs(lvl, m) ?? [])]) { kinds.add(a.kind); if (a.kind === "use") tools.add(a.m); }
  }
  assert.deepEqual([...kinds].sort(), ["drop", "mark", "next", "use"]);
  assert.deepEqual([...tools].sort(), ["light", "rub", "wait"]);
  const tk = lv("neela", "iodine", 1);
  assert.deepEqual(run(tk, [U("eat"), U("taste"), U("touch")]).refused, ["no_tool", "no_tool", "no_tool"]);
  // the view draws no hand: the dropper, the bottle and the paper are drawn alone
  assert.doesNotMatch(noComments(VIEW), /hand\(|finger|palm|\.hand\b/i);
  // the iodine is a labelled bottle on the bench
  assert.match(VIEW, /function bottle\(/); assert.equal(WORDS["jaanch.bottle"].en, "Dilute iodine");
});

test("jaanch: the kit's misconceptions are each mapped or listed not admitted; every number in the law is a declared scene value", () => {
  const ids = K.misconceptions.map((m) => m.id).sort();
  assert.deepEqual(ids, [`${T}-m1`, `${T}-m2`, `${T}-m3`]);
  const mapped = new Set(coverage().entries.filter((e) => e.family === "jaanch").flatMap((e) => Object.values(e.misMap)));
  for (const id of ids) assert.ok(mapped.has(id) || id in NOT_ADMITTED, `${id} neither mapped nor listed`);
  assert.deepEqual(NOT_ADMITTED, {});
  const lines = LOGIC_SRC.split("\n");
  const consts = [...LOGIC_SRC.matchAll(/^(?:export )?const ([A-Z_0-9]+) = ([0-9.]+);/gm)].map((m) => m[1]).sort();
  assert.deepEqual(consts, ["DROPMAX", "DRY", "FEW", "JITTER"]);
  for (const c of ["FEW", "DROPMAX", "DRY"]) { const i = lines.findIndex((l) => new RegExp(`const ${c} = `).test(l)); assert.match(lines[i - 1], /scene value, no fact claimed/, c); }
  // "a few drops" (the kit's 2-3) is met by FEW
  assert.ok(has("put 2-3 drops of dilute iodine solution on a potato slice") && FEW >= 2 && FEW <= 3 && DROPMAX > FEW);
});

for (const [mode, goal] of CASES) {
  test(`jaanch ${mode}/${goal}: every level validates, solves, is shortcut-free; mal-rules land on their own misconception`, () => {
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
      for (const mal of JAANCH_MAL) {
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
      // every level can show its belief (sugar on every iodine card, water or tomato on every paper card, a positive in dono)
      assert.ok(WANT[goal].every((m) => L.malActs(level, m)), `${c.signature} cannot show ${WANT[goal]}`);
    }
    assert.deepEqual([...seen].sort(), [...WANT[goal]].sort(), `${goal}: mal-rules shown`);
  });
}

test("jaanch: a result is never taken before its evidence is on the bench (the skill is the test, not the answer)", () => {
  for (const [mode, goal] of CASES) for (const c of levelsOf(mode, goal, [3, 8])) {
    const level = L.validate(c.level), p = level.params, card = cardOf(p);
    for (let i = 0; i < card.length; i++) {
      // walk to food i with the law's own acts
      let s = L.init(level);
      const sol = L.solve(level);
      let k = 0;
      while (s.w.next < i) s = L.apply(level, s, sol[k++], k).state;
      for (const t of testsOf(goal)) for (const v of ["yes", "no"]) {
        // no evidence at all
        assert.ok(L.apply(level, s, MARK(t, v), 1).refused, `${goal} ${card[i]} ${t} ${v} said before the test`);
        if (t === "starch") {
          // one drop is not yet a few
          const s1 = L.apply(level, s, DROP, 1).state;
          assert.equal(L.apply(level, s1, MARK(t, v), 2).refused, FEW > 1 ? "few_drops" : undefined);
        } else {
          // rubbed but wet; dry but not held to the light
          const s1 = L.apply(level, s, U("rub"), 1).state, r1 = L.apply(level, s1, MARK(t, v), 2).refused;
          assert.ok(r1 === "not_dry" || r1 === "wet_patch", `${card[i]} wet ${v}: ${r1}`);
          let s2 = s1; for (let d = 0; d < DRY; d++) s2 = L.apply(level, s2, U("wait"), 3 + d).state;
          assert.equal(L.apply(level, s2, MARK(t, v), 9).refused, "hold_light");
        }
      }
    }
  }
});

// ───────────────────────────── THE INDEPENDENT CHECKER (its own reading of the kit; none of the law's helpers) ─────────────────────────────
// Iodine turns blue-black where starch is (potato, rice, roti, rice water, idli, the new snack) and stays its own brown on
// cucumber, sugar solution, milk, paneer and groundnut; a food's patch on paper stays after drying if it has fat (groundnut,
// coconut, coconut oil, cashew, chips, paneer, the new snack) and dries away if not (water, tomato, potato). A result is said
// only after a few drops, or after the paper is dry and held to the light; dono moves on only with both said.
const BLUE = new Set(["potato", "rice", "roti", "ricewater", "idli", "snack"]);
const BROWN = new Set(["cucumber", "sugar", "milk", "paneer", "groundnut"]);
const STAYS = new Set(["groundnut", "coconut", "oil", "cashew", "chips", "paneer", "snack"]);
const GOES = new Set(["water", "tomato", "potato"]);
function checker(p) {
  const card = cardOf(p), k = { i: 0, drops: 0, rubbed: false, dry: 0, lit: false, said: {} };
  const reset = () => Object.assign(k, { drops: 0, rubbed: false, dry: 0, lit: false, said: {} });
  return function step(a) {
    const it = card[k.i];
    switch (a.kind) {
      case "drop": assert.ok(p.goal !== "kaagaz" && !k.said.starch && k.drops < DROPMAX); k.drops++; return;
      case "use":
        assert.ok(p.goal !== "iodine" && !k.said.fat);
        if (a.m === "rub") { assert.ok(!k.rubbed); k.rubbed = true; }
        else if (a.m === "wait") { assert.ok(k.rubbed && k.dry < DRY, "drying advances only after a rub, a Wait at a time"); k.dry++; }
        else { assert.equal(a.m, "light"); assert.ok(k.rubbed && k.dry === DRY && !k.lit, "held to the light only once dry"); k.lit = true; }
        return;
      case "mark":
        if (a.t === "starch") {
          assert.ok(k.drops >= FEW, "said only after a few drops");
          assert.equal(a.v, BLUE.has(it) ? "yes" : (assert.ok(BROWN.has(it), it), "no"), `${it} starch`);
        } else {
          assert.ok(k.rubbed && k.dry === DRY && k.lit, "said only once dry and held to the light");
          assert.equal(a.v, STAYS.has(it) ? "yes" : (assert.ok(GOES.has(it), it), "no"), `${it} fat`);
        }
        k.said[a.t] = a.v;
        if (p.goal !== "dono") { k.i++; reset(); }
        return;
      case "next": assert.ok(p.goal === "dono" && k.said.starch && k.said.fat, "Next food only with both said"); k.i++; reset(); return;
    }
    assert.fail(`accepted ${JSON.stringify(a)}`);
  };
}

test("jaanch: random play — the checker agrees with every step the law takes", () => {
  const rnd = mulberry32(2026);
  const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
  let accepted = 0;
  const per = {};
  for (const [mode, goal] of CASES) for (const c of levelsOf(mode, goal, [5, 11])) {
    const level = L.validate(c.level);
    let s = L.init(level);
    const check = checker(level.params);
    for (let k = 0; k < 120 && !s.done; k++) {
      const x = rnd();
      const a = x < 0.25 ? DROP : x < 0.6 ? U(pick(["rub", "wait", "wait", "light"])) : x < 0.93 ? MARK(pick(["starch", "fat"]), pick(["yes", "no"])) : rnd() < 0.8 ? NEXT : D;
      const r = L.apply(level, s, a, k + 1);
      if (r.refused) assert.deepEqual(r.state.w, s.w, `${goal}: a refused act changes nothing`);
      else { check(a); accepted++; per[goal] = (per[goal] ?? 0) + 1; }
      s = r.state;
    }
  }
  assert.ok(accepted > 600, `accepted ${accepted}`);
  for (const [, goal] of CASES) assert.ok((per[goal] ?? 0) > 150, `${goal}: ${per[goal]} accepted`);
});

test("jaanch: the law's answers (blue-black or brown, a patch that stays or goes, both tests on one food)", () => {
  // iodine: sugar said to show starch is m2; another brown food said so is a plain look-again; a blue-black food said not
  const io = lv("neela", "iodine", 2, (q) => cardOf(q)[0] === "sugar");
  assert.equal(run(io, [DROP, DROP, MARK("starch", "yes")]).ms.find((m) => m.kind === "misconception_consequence")?.misconceptionId, "sugar-starch");
  assert.equal(run(io, [DROP, DROP, MARK("starch", "no")]).s.w.next, 1);
  const ic = lv("neela", "iodine", 2, (q) => cardOf(q)[0] === "cucumber");
  assert.deepEqual(run(ic, [DROP, DROP, MARK("starch", "yes")]).refused, ["stayed_brown"]);
  const ip = lv("neela", "iodine", 1, (q) => cardOf(q)[0] === "potato");
  assert.deepEqual(run(ip, [DROP, DROP, MARK("starch", "no")]).refused, ["blue_black"]);
  assert.deepEqual(run(ip, [DROP, DROP, DROP, DROP, DROP]).refused, ["enough"]);
  assert.deepEqual(run(ip, [U("rub"), MARK("fat", "no")]).refused, ["no_paper", "no_mark"]);
  // kaagaz: a tomato's wet patch said to be fat is m3; once dry it is a plain look-again; groundnut wet is "not dry yet"
  const kt = lv("daag", "kaagaz", 1, (q) => cardOf(q)[0] === "tomato");
  assert.equal(run(kt, [U("rub"), MARK("fat", "yes")]).ms.find((m) => m.kind === "misconception_consequence")?.misconceptionId, "wet-fat");
  assert.deepEqual(run(kt, [U("rub"), U("wait"), U("wait"), U("light"), MARK("fat", "yes")]).refused, ["patch_gone"]);
  assert.deepEqual(run(kt, [U("light"), U("wait"), U("rub"), U("light")]).refused, ["rub_first", "rub_first", "dry_first"]);
  assert.deepEqual(run(kt, [U("rub"), U("wait"), U("wait"), U("wait")]).refused, ["dry_already"]);
  const kg = lv("daag", "kaagaz", 1, (q) => cardOf(q)[0] === "groundnut");
  assert.deepEqual(run(kg, [U("rub"), MARK("fat", "yes")]).refused, ["not_dry"]);
  assert.deepEqual(run(kg, [U("rub"), U("wait"), U("wait"), U("light"), MARK("fat", "no")]).refused, ["patch_stays"]);
  assert.deepEqual(run(kg, [DROP, NEXT]).refused, ["no_iodine", "no_next"]);
  // dono: Next after one positive is m1; after one negative only, a plain "test both"; with both, the next food
  const ds = lv("thali", "dono", 1, (q) => cardOf(q)[0] === "snack");
  assert.equal(run(ds, [DROP, DROP, MARK("starch", "yes"), NEXT]).ms.find((m) => m.kind === "misconception_consequence")?.misconceptionId, "one-only");
  assert.deepEqual(run(ds, [NEXT]).refused, ["test_both"]);
  const both = run(ds, [DROP, DROP, MARK("starch", "yes"), U("rub"), U("wait"), U("wait"), U("light"), MARK("fat", "yes"), NEXT]);
  assert.equal(both.s.w.next, 1); assert.equal(both.s.w.res[0], "yes,yes");
  const dp = lv("thali", "dono", 2, (q) => cardOf(q)[0] === "potato");
  assert.deepEqual(run(dp, [U("rub"), U("wait"), U("wait"), U("light"), MARK("fat", "no"), NEXT]).refused, ["test_both"]);
  assert.deepEqual(run(dp, [DROP, DROP, MARK("starch", "yes"), DROP, MARK("starch", "no")]).refused, ["said_already", "said_already"]);
  // undo steps back
  assert.equal(run(kt, [U("rub"), { kind: "undo" }]).s.w.rubbed, false);
});

test("jaanch: tampered params are refused; a claim in an act never decides; nothing is timed", () => {
  const level = L.generate(req("neela", "iodine", 5, { fade: 2 }))[0].level;
  const p = level.params, bad = (patch, o = {}) => L.validate({ ...level, ...o, params: { ...p, ...patch } });
  assert.ok(L.validate(level));
  assert.equal(bad({ row: 99 }), null);
  assert.equal(bad({ row: 0 }), null, "a row of another look");
  assert.equal(bad({ scene: "nowhere" }), null);
  assert.equal(bad({ goal: "kaagaz" }), null);
  assert.equal(bad({ look: 4 }), null);
  assert.equal(bad({ lay: -1 }), null);
  assert.equal(bad({}, { mode: "daag" }), null);
  const forged = sanitizeActs([{ seq: 1, act: { kind: "mark", t: "starch", v: "yes", correct: true, solved: true } }]);
  assert.ok(!("correct" in forged[0].act) && !("solved" in forged[0].act));
  assert.notEqual(L.grade(L.validate(level), forged).verdict, "solved");
  assert.deepEqual(run(L.validate(level), [D, NEXT, MARK("protein", "yes")]).refused, ["no_claim", "no_next", "no_mark"]);
  for (const src of [LOGIC_SRC, VIEW]) assert.doesNotMatch(noComments(src), /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(noComments(VIEW), /#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  // every timed beat is keyed to the act and drawn inside busy() (tests/r7-games-redraw-window.test.mjs reads this view too)
  assert.match(VIEW, /const busy = \(\) => api\.t - actAt < HOLD/);
});

// ───────────────────────────── the play server ─────────────────────────────
const JG = () => coverage().entries.filter((e) => e.family === "jaanch");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("jaanch coverage: three entries on the topic, mapped to its kit misconceptions", () => {
  assert.deepEqual(JG().map((e) => `${e.topicId}|${e.mode}|${e.goal}|${e.skillIds.join(",")}`), [
    `${T}|neela|iodine|${T}-s1`, `${T}|daag|kaagaz|${T}-s2`, `${T}|thali|dono|${T}-s3,${T}-s1,${T}-s2`]);
  assert.deepEqual(JG().map((e) => e.misMap), [{ "sugar-starch": `${T}-m2` }, { "wet-fat": `${T}-m3` }, { "one-only": `${T}-m1` }]);
  for (const s of ["s1", "s2", "s3"]) assert.ok(hasPlay(`${T}-${s}`), `${T}-${s}`);
  assert.equal(entryFor({ skillId: `${T}-s1` }).goal, "iodine");
  assert.equal(entryFor({ skillId: `${T}-s2` }).goal, "kaagaz");
  assert.equal(entryFor({ skillId: `${T}-s3` }).goal, "dono");
  const backlog = readFileSync(`${ROOT}docs/design/round7/games/law-backlog.md`, "utf8");
  assert.doesNotMatch(backlog, new RegExp(T));
});

for (const e of JG()) for (const fade of [1, 2, 3]) {
  test(`jaanch server ${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3", "c4", "c5", "c6"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e, "Zoya");
      assert.ok(cur && cur.family === "jaanch" && cur.mode === e.mode && cur.params.goal === e.goal);
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
test("jaanch: the first level served differs across children", () => {
  for (const e of JG()) for (const fade of [1, 3]) {
    const sigs = new Set(), lays = new Set();
    for (let c = 0; c < 20; c++) {
      const child = `var-${c}`, lvl = currentLevel(sessionOf(e, { childId: child, fade, seed: seedOf(child, entryKey(e), 0) }), e);
      sigs.add(lvl.sig); lays.add(JSON.stringify(cardOf(lvl.params)));
    }
    assert.ok(sigs.size >= 3, `${e.goal} fade ${fade}: ${sigs.size} distinct first levels over 20 children`);
    assert.ok(lays.size >= 3, `${e.goal} fade ${fade}: ${lays.size} distinct cards over 20 children`);
  }
});

test("jaanch: the generator and the picker are fast (CPU time, p95 ≤ 50 ms)", () => {
  const gen = [], pick = [];
  for (const [mode, goal] of CASES) for (const fade of [1, 2, 3]) for (let seed = 1; seed <= 8; seed++) {
    let t0 = cpuNow(); L.generate(req(mode, goal, seed * 31, { fade })); gen.push(cpuNow() - t0);
    t0 = cpuNow(); pickLevels(L, req(mode, goal, seed * 31, { fade })); pick.push(cpuNow() - t0);
  }
  for (const [name, xs] of [["generate", gen], ["pick", pick]]) { xs.sort((a, b) => a - b); const p95 = xs[Math.floor(xs.length * 0.95)]; assert.ok(p95 <= 50, `${name} p95 ${p95.toFixed(1)} ms`); }
});

test("jaanch: every word the view shows exists in all three languages; vakya's words stay last", () => {
  const keys = Object.keys(WORDS);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const used = [...VIEW.matchAll(/W\("(jaanch\.[a-zA-Z0-9._-]+)"/g)].map((m) => m[1]);
  const prefixes = [...VIEW.matchAll(/W\(`(jaanch\.[a-zA-Z0-9._-]+)\$\{/g)].map((m) => m[1]);
  assert.ok(prefixes.length >= 6, `template keys ${prefixes.length}`);
  const whys = new Set([...LOGIC_SRC.matchAll(/no\("([a-z_]+)"/g)].map((m) => m[1]));
  for (const m of LOGIC_SRC.matchAll(/no\([^)]*\? "([a-z_]+)" : "([a-z_]+)"/g)) { whys.add(m[1]); whys.add(m[2]); }
  whys.delete("level_over");
  const dyn = [
    ...Object.keys(FOODS).flatMap((x) => [`food.${x}`, `short.${x}`]), ...["lab", "kaksha"].map((x) => `bench.${x}`),
    ...TESTS.flatMap((t) => [`col.${t}`, `mark.${t}.yes`, `mark.${t}.no`, `res.${t}.yes`, `res.${t}.no`]), "yn.yes", "yn.no",
    ...[...whys].map((x) => `why.${x}`), ...CASES.map(([, g]) => `done.${g}`),
  ].map((k) => `jaanch.${k}`);
  assert.ok(used.length >= 12, `literal keys ${used.length}`);
  for (const pre of prefixes) assert.ok(dyn.some((k) => k.startsWith(pre)), `no word under ${pre}`);
  for (const k of [...used, ...dyn]) for (const l of LANGS) assert.ok(WORDS[k]?.[l], `${k} ${l}`);
  for (const w of ["not_sugar", "wet_patch", "test_other", "stayed_brown", "patch_gone", "few_drops", "hold_light"]) assert.ok(whys.has(w), w);
});
