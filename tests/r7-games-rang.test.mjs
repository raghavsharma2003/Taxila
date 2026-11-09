// r7 Games, Rang · acids, bases, indicators and neutralisation (class 7 science, c7-science-ch02-t01, -t02). A dropper the
// child works a drop at a time. Nothing ever runs on a clock: a drop lands on an indicator, a cup is sorted, or a base goes
// into the glass only when the child taps.
// Pure law checks: every generated level validates, solves and no idea-free play wins; an INDEPENDENT checker (its own reading
// of the kit's sentences, read out of data/kits/c7-science.json: which liquid is acidic, basic or neutral, the colour each
// indicator gives, the pink that goes as a base is added and the green past it, water that only dilutes) agrees with every
// step the law takes over random play; each mal-rule's acts land on its OWN misconception moment and fold the topic's kit id;
// every colour, every liquid and every property the law uses is a kit sentence; no rang word holds a number or a word for
// tasting, touching or drinking; tampered params are refused; a claim never decides; first levels differ across children;
// the generator and picker are fast (CPU time); and every coverage entry serves a proven level through the play server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  rangLogic as L, RANG_MAL, RANG_MODES, GOALS_OF, KIT_OF, LIQUIDS, INDS, KINDS, CASE_BASE, OVER, WATER_MAX, LEMON_MAX,
  colourOf, cupsOf, indsOf, gudOf, toolsOf, cardOf, glassOf, boondRow, ilaajRow,
} from "../src/play/families/rang/rang.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { NOT_ADMITTED } from "../server/play/tools/rules/rang.mjs";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { pickLevels } from "../src/play/core/pick.ts";
import { mulberry32 } from "../src/play/core/rng.ts";
import { cpuNow } from "./_cpu-ms.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const KIT = JSON.parse(readFileSync(`${ROOT}data/kits/c7-science.json`, "utf8"));
const KITS = Object.fromEntries(KIT.topics.map((t) => [t.topicId, t]));
const T1 = "c7-science-ch02-t01", T2 = "c7-science-ch02-t02";
const TEXT1 = JSON.stringify(KITS[T1]), TEXT2 = JSON.stringify(KITS[T2]);
const EXP1 = KITS[T1].expectations, EXP2 = KITS[T2].expectations;
const WORDS = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words;
const RANG_WORDS = Object.entries(WORDS).filter(([k]) => k.startsWith("rang."));
const LANGS = ["hinglish", "en", "hi"];
const ALL = Object.fromEntries(RANG_MAL.map((m) => [m, `k-${m}`]));
const req = (mode, goal, seed, o = {}) => ({ family: "rang", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
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
const DROP = (at, ind) => ({ kind: "drop", at, ind });
const SORT = (at, bin) => ({ kind: "sort", at, bin });
const WANT = { litmus: ["own-red"], desi: ["made-red"], boond: ["water-only", "too-much", "harm-mix"], ilaaj: ["water-only", "too-much", "harm-mix"] };

test("rang: the family is registered (FAMILIES, MODES, arts, logic, views, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("rang"));
  assert.deepEqual([...MODES.rang], ["pehchaan", "milao"]);
  assert.deepEqual([...RANG_MODES], [...MODES.rang]);
  assert.equal(FAMILY_ARTS.rang.length, 4);
  const views = readFileSync(`${ROOT}src/play/families/views.ts`, "utf8"), data = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).rang;
  for (const m of RANG_MODES) {
    assert.equal(LOGIC[`rang/${m}`], L);
    assert.match(views, new RegExp(`"rang/${m}": makeRangView`));
    const v = playActOf("rang", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
    assert.doesNotMatch(`${v.hi} ${v.en}`, /chun|choose|pick/i);
    assert.ok(data?.[m]?.act && data[m].hi && data[m].en, `verbs.json rang/${m}`);
  }
});

// ───────────────────────────── the kit: every fact, colour and liquid is its own ─────────────────────────────
test("rang: every property the law uses is a kit sentence", () => {
  for (const [topic, sents] of Object.entries(KIT_OF)) {
    const T = JSON.stringify(KITS[topic]);
    assert.ok(T, topic);
    for (const [what, text] of Object.entries(sents)) assert.ok(T.includes(text), `${topic} ${what}: "${text}" is not in the kit`);
  }
});

test("rang: every colour an indicator shows is the kit's, read out of the kit's own sentences", () => {
  // the kit's sentences, found by what they say (not copied from the law)
  const litmus = EXP1.find((e) => /^Litmus/.test(e)), turmeric = EXP1.find((e) => /^Turmeric/.test(e)), hibiscus = EXP1.find((e) => /^Hibiscus/.test(e));
  assert.ok(litmus && turmeric && hibiscus);
  assert.match(litmus, /acids turn blue litmus red/); assert.match(litmus, /bases turn red litmus blue/); assert.match(litmus, /neutral solutions change neither/);
  assert.match(turmeric, /turns red in a base/); assert.match(turmeric, /stays yellow in acidic and neutral solutions/);
  assert.match(hibiscus, /dark pink or magenta in acids/); assert.match(hibiscus, /green in bases/);
  assert.ok(TEXT1.includes("no change from its own colour means neutral"), "hibiscus keeps its own colour in a neutral liquid (the kit's item)");
  // the kit's colour for each (indicator, kind), as its sentences give them
  const KIT_COLOUR = {
    blue: { acid: "red", base: "blue", neutral: "blue" },        // blue litmus turns red in acid; neutral changes neither; a base leaves it
    red: { acid: "red", base: "blue", neutral: "red" },          // red litmus turns blue in base; neutral changes neither; an acid leaves it
    haldi: { acid: "yellow", base: "red", neutral: "yellow" },   // turmeric red in a base, stays yellow in acidic and neutral
    gudhal: { acid: "pink", base: "green", neutral: "own" },     // hibiscus dark pink in acids, green in bases, its own colour in neutral
  };
  // a base leaves blue litmus blue and an acid leaves red litmus red: each turns only one way (the kit's own diagnostics)
  assert.ok(TEXT1.includes("Liquid A turns blue litmus red") && TEXT1.includes("Turning red litmus blue shows a base, not an acid"));
  for (const ind of INDS) for (const k of KINDS) assert.equal(colourOf(ind, k), KIT_COLOUR[ind][k], `${ind} in ${k}`);
  // the neutralisation glass: pink in an acid, the pink lost, green past it (the kit's sentence)
  assert.ok(EXP2.some((e) => e.includes("hibiscus water that is pink in an acid loses its pink as a base is added, and turns green once there is extra base")));
  // the view paints each colour in a material named for it (no colour literal anywhere: tests/play-style-lint)
  const view = readFileSync(`${ROOT}src/play/families/rang/rang.view.ts`, "utf8");
  assert.match(view, /const MAT: Record<Colour, Material> = \{ red: "red", blue: "blue", yellow: "turmeric", pink: "pink", green: "leaf", own: "hibiscus" \}/);
});

test("rang: every liquid on screen is kit-named, and what each one is comes from the kit", () => {
  // the household liquids and what they are, read out of the kit's sorted-table answer and its neutral sentence
  const table = KITS[T1].items.map((i) => i.answer).find((a) => /^Acidic: .* Basic: .* Neutral: /.test(a));
  assert.ok(table, "the kit's three-column answer");
  const part = (label) => table.match(new RegExp(`${label}: ([^(]+)\\(`))[1].replace(/ and /g, ",").split(",").map((x) => x.trim()).filter(Boolean);
  const neutralSent = EXP1.find((e) => /are neutral\.$/.test(e));
  const neutral = neutralSent.match(/like (.*), are neutral/)[1].replace(/ and /g, ",").split(",").map((x) => x.trim()).filter(Boolean);
  const kitKind = { ...Object.fromEntries(part("Acidic").map((x) => [x, "acid"])), ...Object.fromEntries(part("Basic").map((x) => [x, "base"])), ...Object.fromEntries(neutral.map((x) => [x, "neutral"])) };
  assert.deepEqual(Object.keys(kitKind).sort(), ["baking soda solution", "common salt solution", "lemon juice", "pure water", "soap solution", "sugar solution", "vinegar"]);
  for (const [id, kind] of Object.entries(LIQUIDS)) {
    const name = WORDS[`rang.liq.${id}`].en.toLowerCase();
    assert.equal(kitKind[name], kind, `${id} (${name}) is ${kind} in the kit`);
  }
  // every liquid, dropper and use the view names is named in the kit (t01 for the bench, t02 for the glass and the uses)
  const named = (k, T) => assert.ok(T.toLowerCase().includes(WORDS[k].en.toLowerCase().replace(/^(an?|the) /, "")), `${k} "${WORDS[k].en}" is not kit-named`);
  for (const id of Object.keys(LIQUIDS)) named(`rang.liq.${id}`, TEXT1);
  for (const id of ["soda", "lemon", "water"]) named(`rang.tool.${id}`, TEXT2);
  assert.ok(TEXT2.includes("milk of magnesia") && TEXT2.includes("antacid") && TEXT2.includes("lime (chuna)"));
  for (const c of ["ant bite", "formic acid", "too much stomach acid", "acidic soil"]) assert.ok(TEXT2.toLowerCase().includes(c), c);
  assert.deepEqual(CASE_BASE, { ant: "soda", stomach: "antacid", soil: "lime" }, "each use's own base, as the kit pairs them");
  // the acids in the glass are the kit's own (lemon juice and vinegar, each given a base in a t02 sentence)
  for (const c of [...cardsOf("boond")]) assert.ok(["lemon", "vinegar"].includes(c.acid));
  assert.ok(TEXT2.includes("adds a base to vinegar") && TEXT2.includes("some lemon juice: it turns pink"));
  // the indicators the bench holds are the kit's (litmus strips, haldi paper, gudhal water)
  for (const k of ["blue", "red"]) assert.ok(TEXT1.includes(`${WORDS[`rang.ind.${k}`].en.toLowerCase()}`));
  assert.ok(TEXT1.includes("haldi paper") && TEXT1.includes("gudhal water"));
});
function cardsOf(goal) { return levelsOf(GOALS_OF.milao.includes(goal) ? "milao" : "pehchaan", goal, [1]).flatMap((c) => cardOf(c.level.params)); }

test("rang: no word holds a number, an economy word, or a word for tasting, touching or drinking; lines fit the Studio box", () => {
  const strings = [...RANG_WORDS.flatMap(([k, v]) => LANGS.map((l) => [`${k} ${l}`, v[l]]))];
  const verbs = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).rang;
  for (const m of RANG_MODES) { strings.push([`verbs.json ${m}`, `${verbs[m].hi} ${verbs[m].en}`]); const v = playActOf("rang", m); strings.push([`play-verbs ${m}`, `${v.hi} ${v.en}`]); }
  // the string literals in the view (its keys and any text) too
  const view = readFileSync(`${ROOT}src/play/families/rang/rang.view.ts`, "utf8").replace(/\/\/.*$/gm, "");
  for (const m of view.matchAll(/"([^"\n]*)"/g)) strings.push([`view "${m[1]}"`, m[1]]);
  const BODY = /\b(tast\w*|touch\w*|drink\w*|sip|sips|lick\w*|tongue|fingers?|mouth|swallow\w*|eat|eats|eating|chakh\w*|chhoo\w*|chhu\w*|piyo|peena|pee lo|piyein|munh|jeebh|ungli|khao|khana|chaat\w*)\b/i;
  const BODY_HI = /चख|चाख|छू|छुओ|पियो|पीना|पीओ|पिएँ|मुँह|मुंह|जीभ|उँगली|उंगली|खाओ|खाना|चाट/;
  const SAFE = /\b(safe\w*|harmless|unharmful|no harm|surakshit|bezarar|nuksaan nahi\w*|koi nuksaan nahi)\b/i;
  const SAFE_HI = /सुरक्षित|हानिरहित|हानिकारक नहीं|नुकसान नहीं|बेज़रर|बेजरर/;
  const ECON = /\b(points?|coins?|gems?|streaks?|lives|life left|rewards?|leaderboard|rank(ing)?|xp|level up|bonus|jackpot|loot|unlock(ed)?|hurry|jaldi|time'?s up|game over)\b/i;
  for (const [where, s] of strings) {
    assert.doesNotMatch(s, BODY, `${where}: "${s}"`);
    assert.doesNotMatch(s, BODY_HI, `${where}: "${s}"`);
    assert.doesNotMatch(s, ECON, `${where}: "${s}"`);
    // the lead's ruling on t02 m1: the answer is the kit's "a salt and water form, heat is given out", never "safe"
    assert.doesNotMatch(s, SAFE, `${where}: "${s}"`);
    assert.doesNotMatch(s, SAFE_HI, `${where}: "${s}"`);
  }
  // no number on screen: drop counts are scene values, never shown as digits
  for (const [k, v] of RANG_WORDS) for (const l of LANGS) assert.doesNotMatch(v[l].replace(/\{\w+\}/g, ""), /[0-9०-९]/, `${k} ${l} states a number`);
  // a goal / why / done / note line fits two lines of the 320 px Studio box (forge3 Q2.whole clips a longer one)
  for (const [k, v] of RANG_WORDS) if (/^rang\.(goal|why|done|note)\./.test(k)) for (const l of LANGS) assert.ok(v[l].replace(/\{\w+\}/g, "xxxxxxxxxx").length <= 64, `${k} ${l} is long`);
  // the longest real fill (a case's name, a liquid's name) still fits
  const longest = (ks, l) => Math.max(...ks.map((k) => WORDS[k][l].length));
  for (const l of LANGS) {
    const liq = longest(Object.keys(LIQUIDS).map((x) => `rang.liq.${x}`), l), cse = longest(["ant", "stomach", "soil"].map((x) => `rang.case.${x}`), l);
    for (const k of ["rang.goal.litmus", "rang.goal.desi", "rang.why.wrong_bin", "rang.why.made_red"]) assert.ok(WORDS[k][l].replace(/\{\w+\}/g, "").length + liq <= 72, `${k} ${l} with the longest liquid`);
    assert.ok(WORDS["rang.goal.ilaaj"][l].replace(/\{\w+\}/g, "").length + cse <= 72, `rang.goal.ilaaj ${l} with the longest case`);
  }
});

test("rang: the not-admitted beliefs are listed and have no mechanic; every number in the law is a declared scene value", () => {
  assert.deepEqual(Object.keys(NOT_ADMITTED).sort(), [`${T1}-m1`, `${T1}-m2`, `${T1}-m4`]);
  for (const id of Object.keys(NOT_ADMITTED)) assert.ok(KITS[T1].misconceptions.some((m) => m.id === id), id);
  const RG = coverage().entries.filter((e) => e.family === "rang");
  for (const id of Object.keys(NOT_ADMITTED)) assert.ok(!RG.some((e) => Object.values(e.misMap).includes(id)), `${id} has a mechanic`);
  const logic = readFileSync(`${ROOT}src/play/families/rang/rang.logic.ts`, "utf8"), lines = logic.split("\n");
  const consts = [...logic.matchAll(/^(?:export )?const ([A-Z_]+) = ([0-9.]+);/gm)].map((m) => m[1]).sort();
  assert.deepEqual(consts, ["JITTER", "LEMON_MAX", "OVER", "WATER_MAX"]);
  for (const c of ["OVER", "WATER_MAX", "LEMON_MAX"]) { const i = lines.findIndex((l) => new RegExp(`const ${c} = `).test(l)); assert.match(lines[i - 1], /scene value, no fact claimed/, c); }
  assert.ok(OVER === 3 && WATER_MAX === 3 && LEMON_MAX === 2);
  // the drops a glass takes are scene values on the rows (declared so on their type)
  assert.match(logic, /the drops of base it takes \(a scene value, no fact claimed\)/);
  assert.match(logic, /the drops of its base the sample takes \(a scene value, no fact claimed\)/);
  assert.match(logic, /one for each cup that is not a base; a scene value/);
});

for (const [mode, goal] of CASES) {
  test(`rang ${mode}/${goal}: every level validates, solves, is shortcut-free; mal-rules land on their own misconception`, () => {
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
      for (const mal of RANG_MAL) {
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
// t01: a liquid's kind is the kit's (the sorted-table answer and the neutral sentence); an indicator's colour is its kit
// sentence; a cup may be sorted only into its own kind, and only once the colours seen leave no other kind. t02: hibiscus
// water in the acid is pink until the base drops added reach what the glass takes (plus a drop for each drop of lemon juice,
// an acid itself), its own colour at exactly that, green past it; plain water never changes the colour (it only dilutes);
// "Done" is taken only at the colour the card asks for; "Harmful!" (the child's claim) never changes anything.
const KIND = { lemon: "acid", vinegar: "acid", soap: "base", soda: "base", water: "neutral", sugar: "neutral", salt: "neutral" };
const SAYS = { blue: { acid: "red", base: "blue", neutral: "blue" }, red: { acid: "red", base: "blue", neutral: "red" }, haldi: { acid: "yellow", base: "red", neutral: "yellow" }, gudhal: { acid: "pink", base: "green", neutral: "own" } };
function checkCups(p, hist, a, s0, s1, refused) {
  if (refused) { assert.deepEqual(s1.w, s0.w, "a refused act changes nothing"); return; }
  const cups = cupsOf(p);
  if (a.kind === "drop") { assert.ok(!hist[a.at].includes(a.ind), "one drop per indicator"); hist[a.at].push(a.ind); }
  if (a.kind === "sort") {
    const kind = KIND[cups[a.at]];
    assert.equal(a.bin, kind, "sorted only into its own kind");
    const allowed = ["acid", "base", "neutral"].filter((k) => hist[a.at].every((ind) => SAYS[ind][k] === SAYS[ind][kind]));
    assert.deepEqual(allowed, [kind], "the colours seen leave one kind");
  }
}
function checkGlass(p, g, a, s0, s1, refused) {
  if (a.kind === "use" && a.m === "danger") assert.ok(refused, "the Harmful! claim never changes anything");
  if (refused) { assert.deepEqual(s1.w, s0.w, "a refused act changes nothing"); return; }
  const row = p.goal === "boond" ? boondRow(p).card : ilaajRow(p).card, it = row[g.next];
  const base = p.goal === "boond" ? "soda" : { ant: "soda", stomach: "antacid", soil: "lime" }[it.cse];
  if (a.kind === "use") {
    assert.ok([base, "water", "lemon"].includes(a.m), "only the bench's droppers");
    if (a.m === base) g.k++; else if (a.m === "water") g.w++; else g.a++;
    assert.ok(p.goal === "ilaaj" || a.m !== "lemon", "lemon juice is on the uses' bench only");
  }
  const want = p.goal === "boond" ? it.want : "neutral", need = it.n + g.a;
  const colour = g.k < need ? "pink" : g.k === need ? "own" : "green";
  if (a.kind === "done") {
    assert.equal(colour, want === "neutral" ? "own" : "green", "Done only at the card's colour");
    g.next++; g.k = 0; g.w = 0; g.a = 0;
  }
}

test("rang: random play — the checker agrees with every step the law takes", () => {
  const rnd = mulberry32(2026);
  let accepted = 0, sorts = 0, dones = 0;
  for (const [mode, goal] of CASES) for (const c of levelsOf(mode, goal, [5, 11])) {
    const level = L.validate(c.level), p = level.params;
    let s = L.init(level);
    const hist = mode === "pehchaan" ? cupsOf(p).map(() => []) : null, g = { next: 0, k: 0, w: 0, a: 0 };
    for (let k = 0; k < 70 && !s.done; k++) {
      let a;
      if (mode === "pehchaan") {
        const at = Math.floor(rnd() * cupsOf(p).length);
        a = rnd() < 0.55 ? DROP(at, indsOf(p)[Math.floor(rnd() * 2)]) : SORT(at, KINDS[Math.floor(rnd() * 3)]);
      } else {
        const tools = toolsOf(p, s.w), x = rnd();
        a = x < 0.2 ? D : x < 0.25 ? U("danger") : U(tools[Math.floor(rnd() * tools.length)]);
      }
      const r = L.apply(level, s, a, k + 1);
      if (mode === "pehchaan") checkCups(p, hist, a, s, r.state, r.refused); else checkGlass(p, g, a, s, r.state, r.refused);
      if (!r.refused) { accepted++; if (a.kind === "sort") sorts++; if (a.kind === "done") dones++; }
      s = r.state;
    }
  }
  assert.ok(accepted > 400 && sorts > 40 && dones > 10, `accepted ${accepted}, sorts ${sorts}, dones ${dones}`);
});

test("rang: the law's answers (litmus, haldi first, a short gudhal, the pink that goes, water, green, the Harmful! claim)", () => {
  const lv = (mode, goal, fade, pred) => { for (let seed = 1; seed < 60; seed++) { const c = L.generate(req(mode, goal, seed, { fade })).find((x) => pred(x.level.params)); if (c) return L.validate(c.level); } throw new Error(`no ${goal}`); };
  // litmus: an acid is decided by blue litmus alone; a neutral liquid needs both strips; red litmus alone leaves it open
  const lit = lv("pehchaan", "litmus", 1, () => true), cups = cupsOf(lit.params);
  const A = cups.findIndex((c) => KIND[c] === "acid"), B = cups.findIndex((c) => KIND[c] === "base"), N = cups.findIndex((c) => KIND[c] === "neutral");
  assert.ok(run(lit, [DROP(A, "blue"), SORT(A, "acid")]).s.w.bins[A] === "acid");
  assert.deepEqual(run(lit, [DROP(A, "red"), SORT(A, "acid")]).refused, ["not_sure"], "red litmus stays red for an acid and a neutral liquid alike");
  assert.deepEqual(run(lit, [DROP(N, "blue"), SORT(N, "neutral")]).refused, ["not_sure"]);
  assert.equal(run(lit, [DROP(N, "blue"), DROP(N, "red"), SORT(N, "neutral")]).s.w.bins[N], "neutral");
  assert.deepEqual(run(lit, [SORT(B, "base")]).refused, ["untested"]);
  assert.deepEqual(run(lit, [DROP(B, "red"), SORT(B, "acid")]).refused, ["wrong_bin"]);
  assert.deepEqual(run(lit, [DROP(B, "red"), DROP(B, "red")]).refused, ["again"]);
  // desi look 2: the gudhal water is one drop for each cup that is not a base; spent on a base, a cup is left without
  const desi = lv("pehchaan", "desi", 2, () => true), dc = cupsOf(desi.params), dB = dc.findIndex((c) => KIND[c] === "base");
  assert.equal(gudOf(desi.params), dc.filter((c) => KIND[c] !== "base").length);
  const wasted = [DROP(dB, "gudhal"), ...dc.map((c, i) => (KIND[c] !== "base" ? DROP(i, "gudhal") : null)).filter(Boolean)];
  assert.ok(run(desi, wasted).refused.includes("no_gud"));
  assert.equal(run(desi, [DROP(dB, "haldi"), SORT(dB, "base")]).s.w.bins[dB], "base", "turmeric red decides a base");
  // boond: drops of base until the pink goes; water only dilutes; past it, green
  const bd = lv("milao", "boond", 1, () => true), n = boondRow(bd.params).card[0].n;
  assert.deepEqual(run(bd, [...Array(n - 1).fill(U("soda")), D]).refused, ["still_pink"]);
  assert.ok(run(bd, [...Array(n).fill(U("soda")), D]).s.done);
  assert.deepEqual(run(bd, [U("water"), U("water"), D]).refused, ["diluted"]);
  assert.deepEqual(run(bd, [...Array(n + 1).fill(U("soda")), D]).refused, ["too_much"]);
  assert.deepEqual(run(bd, [...Array(n + OVER + 1).fill(U("soda"))]).refused, ["full"]);
  assert.deepEqual(run(bd, [U("danger")]).refused, ["nothing_mixed"]);
  assert.deepEqual(run(bd, [U("soda"), U("danger")]).refused, ["salt_water"]);
  // boond look 3: a card item asking for green is met only past the right amount
  const g3 = lv("milao", "boond", 3, (q) => boondRow(q).card[0].want === "green"), n3 = boondRow(g3.params).card[0].n;
  assert.deepEqual(run(g3, [...Array(n3).fill(U("soda")), D]).refused, ["no_green"]);
  assert.equal(run(g3, [...Array(n3 + 1).fill(U("soda")), D]).s.w.next, 1);
  // ilaaj: the use's own base; lemon juice (an acid itself) needs a drop more; another use's base is not on the bench
  const il = lv("milao", "ilaaj", 1, (q) => ilaajRow(q).card[0].cse === "ant"), ni = ilaajRow(il.params).card[0].n;
  assert.ok(toolsOf(il.params).includes("soda") && !toolsOf(il.params).includes("lime"));
  assert.deepEqual(run(il, [U("lime")]).refused, ["no_tool"]);
  assert.deepEqual(run(il, [U("lemon"), ...Array(ni).fill(U("soda")), D]).refused, ["still_pink"]);
  assert.ok(run(il, [U("lemon"), ...Array(ni + 1).fill(U("soda")), D]).s.done);
  // undo steps back
  assert.equal(run(bd, [U("soda"), { kind: "undo" }]).s.w.k, 0);
  assert.equal(glassOf(bd.params, L.init(bd).w).want, "neutral");
});

test("rang: tampered params are refused; a claim in an act never decides; nothing is timed", () => {
  const level = L.generate(req("pehchaan", "litmus", 5, { fade: 2 }))[0].level;
  const p = level.params, bad = (patch, o = {}) => L.validate({ ...level, ...o, params: { ...p, ...patch } });
  assert.ok(L.validate(level));
  assert.equal(bad({ row: 99 }), null);
  assert.equal(bad({ row: 0 }), null, "a row of another look");
  assert.equal(bad({ scene: "nowhere" }), null);
  assert.equal(bad({ goal: "boond" }), null);
  assert.equal(bad({ look: 4 }), null);
  assert.equal(bad({ lay: -1 }), null);
  assert.equal(bad({}, { mode: "milao" }), null);
  const forged = sanitizeActs([{ seq: 1, act: { kind: "sort", at: 0, bin: "acid", correct: true, solved: true } }]);
  assert.ok(!("correct" in forged[0].act) && !("solved" in forged[0].act));
  assert.notEqual(L.grade(L.validate(level), forged).verdict, "solved");
  // a tool from the other mode is refused; a cup that is not there is refused
  const lv = L.validate(level);
  assert.deepEqual(run(lv, [DROP(0, "haldi"), DROP(9, "blue"), U("soda"), D]).refused, ["no_tool", "no_cup", "no_claim", "no_claim"]);
  const m = L.validate(L.generate(req("milao", "boond", 5))[0].level);
  assert.deepEqual(run(m, [DROP(0, "blue"), U("lime"), U("antacid")]).refused, ["unknown_act", "no_tool", "no_tool"]);
  const logic = readFileSync(`${ROOT}src/play/families/rang/rang.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  const view = readFileSync(`${ROOT}src/play/families/rang/rang.view.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(logic, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});

// ───────────────────────────── the play server ─────────────────────────────
const RG = () => coverage().entries.filter((e) => e.family === "rang");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("rang coverage: four entries on the two topics, mapped to their kit misconceptions; the safety and taste beliefs not admitted", () => {
  assert.deepEqual(RG().map((e) => `${e.topicId}|${e.mode}|${e.goal}|${e.skillIds.join(",")}`), [
    `${T1}|pehchaan|litmus|${T1}-s2`, `${T1}|pehchaan|desi|${T1}-s3`,
    `${T2}|milao|boond|${T2}-s2,${T2}-s1`, `${T2}|milao|ilaaj|${T2}-s3,${T2}-s1`]);
  assert.deepEqual(RG().map((e) => e.misMap), [
    { "own-red": `${T1}-m3` }, { "made-red": `${T1}-m3` },
    { "water-only": `${T2}-m2`, "too-much": `${T2}-m3`, "harm-mix": `${T2}-m1` }, { "water-only": `${T2}-m2`, "too-much": `${T2}-m3`, "harm-mix": `${T2}-m1` }]);
  for (const e of RG()) for (const kit of Object.values(e.misMap)) assert.ok(KITS[e.topicId].misconceptions.some((x) => x.id === kit), kit);
  for (const s of ["s2", "s3"]) assert.ok(hasPlay(`${T1}-${s}`), `${T1}-${s}`);
  for (const s of ["s1", "s2", "s3"]) assert.ok(hasPlay(`${T2}-${s}`), `${T2}-${s}`);
  assert.equal(entryFor({ skillId: `${T1}-s2` }).family, "rang");
  assert.equal(entryFor({ skillId: `${T2}-s1` }).family, "rang");
  const backlog = readFileSync(`${ROOT}docs/design/round7/games/law-backlog.md`, "utf8");
  for (const t of [T1, T2]) assert.doesNotMatch(backlog, new RegExp(t));
});

for (const e of RG()) for (const fade of [1, 2, 3]) {
  test(`rang server ${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3", "c4", "c5", "c6"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e, "Zoya");
      assert.ok(cur && cur.family === "rang" && cur.mode === e.mode && cur.params.goal === e.goal);
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
test("rang: the first level served differs across children", () => {
  for (const e of RG()) for (const fade of [1, 3]) {
    const sigs = new Set(), lays = new Set();
    for (let c = 0; c < 20; c++) {
      const child = `var-${c}`, lv = currentLevel(sessionOf(e, { childId: child, fade, seed: seedOf(child, entryKey(e), 0) }), e);
      sigs.add(lv.sig); lays.add(JSON.stringify(cardOf(lv.params)));
    }
    assert.ok(sigs.size >= 3, `${e.goal} fade ${fade}: ${sigs.size} distinct first levels over 20 children`);
    assert.ok(lays.size >= 3, `${e.goal} fade ${fade}: ${lays.size} distinct benches over 20 children`);
  }
});

test("rang: the generator and the picker are fast (CPU time, p95 ≤ 50 ms)", () => {
  const gen = [], pick = [];
  for (const [mode, goal] of CASES) for (const fade of [1, 2, 3]) for (let seed = 1; seed <= 6; seed++) {
    let t0 = cpuNow(); L.generate(req(mode, goal, seed * 31, { fade })); gen.push(cpuNow() - t0);
    t0 = cpuNow(); pickLevels(L, req(mode, goal, seed * 31, { fade })); pick.push(cpuNow() - t0);
  }
  for (const [name, xs] of [["generate", gen], ["pick", pick]]) { xs.sort((a, b) => a - b); const p95 = xs[Math.floor(xs.length * 0.95)]; assert.ok(p95 <= 50, `${name} p95 ${p95.toFixed(1)} ms`); }
});

test("rang: every word the view shows exists in all three languages; vakya's words stay last", () => {
  const keys = Object.keys(WORDS);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/rang/rang.view.ts`, "utf8");
  const used = [...view.matchAll(/W\("(rang\.[a-zA-Z0-9._-]+)"/g)].map((m) => m[1]);
  const prefixes = [...view.matchAll(/W\(`(rang\.[a-zA-Z0-9._-]+)\$\{/g)].map((m) => m[1]);
  assert.ok(prefixes.length >= 10, `template keys ${prefixes.length}`);
  const logic = readFileSync(`${ROOT}src/play/families/rang/rang.logic.ts`, "utf8");
  const whys = new Set([...logic.matchAll(/no\("([a-z_]+)"/g)].map((m) => m[1]));
  const tools = new Set(CASES.flatMap(([mode, goal]) => levelsOf(mode, goal, [1]).flatMap((c) => (c.level.mode === "milao" ? cardOf(c.level.params).flatMap((_, i) => toolsOf(c.level.params, { ...L.init(c.level).w, next: i })) : []))));
  const goals = CASES.map(([, g]) => g);
  const dyn = [
    ...Object.keys(LIQUIDS).map((x) => `liq.${x}`), ...INDS.map((x) => `ind.${x}`), ...KINDS.map((x) => `bin.${x}`), ...["ant", "stomach", "soil"].map((x) => `case.${x}`),
    "chip.neutral", "chip.green", "goal.litmus", "goal.desi", "goal.boond.neutral", "goal.boond.green",
    ...[...tools].map((t) => `tool.${t}`), ...[...whys].map((x) => `why.${x}`), ...goals.map((g) => `done.${g}`),
  ].map((k) => `rang.${k}`);
  assert.ok(used.length >= 10, `literal keys ${used.length}`);
  for (const pre of prefixes) assert.ok(dyn.some((k) => k.startsWith(pre)), `no word under ${pre}`);
  for (const k of [...used, ...dyn]) for (const l of LANGS) assert.ok(WORDS[k]?.[l], `${k} ${l}`);
});
