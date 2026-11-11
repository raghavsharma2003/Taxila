// r7 Games, Badlaav · physical and chemical changes, rusting and combustion (class 7 science, c7-science-ch05-t01, -t02).
// Changes the child runs, undoes and tends a step at a time. Nothing ever runs on a clock: a change runs, a solid goes in, a
// side of the fire triangle changes, a piece of fuel burns or a day passes only when the child taps.
// Pure law checks: every generated level validates, solves and no idea-free play wins; an INDEPENDENT checker (its own reading
// of the kit's sentences, read out of data/kits/c7-science.json: which change is physical or chemical, the signs each shows,
// which come back and how, what melts and what dissolves, the fire triangle, what burning turns fuel into, what rusting needs)
// agrees with every step the law takes over random play; each mal-rule's acts land on its OWN misconception moment and fold
// the topic's kit id; every fact the law uses is a kit sentence; no badlaav word holds a number, an economy word or a word for
// lighting a fire; no act lights a fire; the not-admitted belief has no mechanic; tampered params are refused; a claim never
// decides; first levels differ across children; the generator and picker are fast (CPU time); every coverage entry serves a
// proven level through the play server.
import { backlogged } from "./_backlog.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  badlaavLogic as L, BADLAAV_MAL, BADLAAV_MODES, GOALS_OF, KIT_OF, CHANGES, SIGNS, SOLIDS, PRODUCTS, GOES, SEEN, WATER, FUELS,
  STEPS, GLOW0, DAYS, RUSTED, DAYMAX, cardOf, fireTools,
} from "../src/play/families/badlaav/badlaav.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { NOT_ADMITTED } from "../server/play/tools/rules/badlaav.mjs";
import { GAME_WEIGHT, FAMILIES, MODES, FAMILY_ARTS, sanitizeActs } from "../shared/play.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { pickLevels } from "../src/play/core/pick.ts";
import { mulberry32 } from "../src/play/core/rng.ts";
import { counted } from "./_work.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const KIT = JSON.parse(readFileSync(`${ROOT}data/kits/c7-science.json`, "utf8"));
const KITS = Object.fromEntries(KIT.topics.map((t) => [t.topicId, t]));
const T1 = "c7-science-ch05-t01", T2 = "c7-science-ch05-t02";
const TEXT1 = JSON.stringify(KITS[T1]), TEXT2 = JSON.stringify(KITS[T2]);
const EXP1 = KITS[T1].expectations, EXP2 = KITS[T2].expectations;
const WORDS = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words;
const B_WORDS = Object.entries(WORDS).filter(([k]) => k.startsWith("badlaav."));
const LANGS = ["hinglish", "en", "hi"];
const ALL = Object.fromEntries(BADLAAV_MAL.map((m) => [m, `k-${m}`]));
const VIEW = readFileSync(`${ROOT}src/play/families/badlaav/badlaav.view.ts`, "utf8");
const LOGIC_SRC = readFileSync(`${ROOT}src/play/families/badlaav/badlaav.logic.ts`, "utf8");
const req = (mode, goal, seed, o = {}) => ({ family: "badlaav", mode, goal, topicId: "t", skillId: "t-s1", classLevel: 7, fade: 1, mis: {}, misMap: ALL, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const CASES = Object.entries(GOALS_OF).flatMap(([mode, goals]) => goals.map((g) => [mode, g]));
const levelsOf = (mode, goal, seeds = [1, 7, 42, 99]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of L.generate(req(mode, goal, seed, { fade }))) out.push(c);
  return out;
};
const U = (m, at) => (at === undefined ? { kind: "use", m } : { kind: "use", m, at });
const D = { kind: "done" };
const RUN = { kind: "run" };
const MARK = (s) => ({ kind: "mark", s });
const FILE = (bin) => ({ kind: "file", bin });
const PUT = (at, to) => ({ kind: "put", at, to });
const PLACE = (p, to) => ({ kind: "place", p, to });
const WANT = { nishaan: ["looks-new"], ulta: ["undo-all", "looks-new"], ghol: ["sugar-melts", "gone"], trikon: ["fan-heat"], raakh: ["vanished"], jang: ["just-dirt"] };
const lv = (mode, goal, fade, pred = () => true) => { for (let seed = 1; seed < 80; seed++) { const c = L.generate(req(mode, goal, seed, { fade })).find((x) => pred(x.level.params)); if (c) return L.validate(c.level); } throw new Error(`no ${goal}`); };

test("badlaav: the family is registered (FAMILIES, MODES, arts, logic, views, a verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("badlaav"));
  assert.deepEqual([...MODES.badlaav], ["palat", "aag"]);
  assert.deepEqual([...BADLAAV_MODES], [...MODES.badlaav]);
  assert.equal(FAMILY_ARTS.badlaav.length, 4);
  const views = readFileSync(`${ROOT}src/play/families/views.ts`, "utf8"), data = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).badlaav;
  for (const m of BADLAAV_MODES) {
    assert.equal(LOGIC[`badlaav/${m}`], L);
    assert.match(views, new RegExp(`"badlaav/${m}": makeBadlaavView`));
    const v = playActOf("badlaav", m);
    assert.ok(v && v.hi && v.en && v.act !== "choose", m);
    assert.doesNotMatch(`${v.hi} ${v.en}`, /chun|choose|pick/i);
    assert.ok(data?.[m]?.act && data[m].hi && data[m].en, `verbs.json badlaav/${m}`);
  }
});

// ───────────────────────────── the kit: every fact is its own ─────────────────────────────
test("badlaav: every fact the law uses is a kit sentence (an item's only from a verified item)", () => {
  for (const [topic, sents] of Object.entries(KIT_OF)) {
    const T = JSON.stringify(KITS[topic]);
    for (const [what, text] of Object.entries(sents)) {
      assert.ok(T.includes(JSON.stringify(text).slice(1, -1)), `${topic} ${what}: "${text}" is not in the kit`);
      // a sentence not in the expectations, the misconceptions or the worked example is from an item the kit verified
      const k = KITS[topic], inCore = [...k.expectations, JSON.stringify(k.misconceptions), JSON.stringify(k.workedExample)].some((x) => x.includes(text));
      if (!inCore) {
        const item = k.items.find((i) => JSON.stringify(i).includes(JSON.stringify(text).slice(1, -1)));
        assert.ok(item && item.verified?.agrees === true, `${topic} ${what}: from an unverified item`);
      }
    }
  }
});

test("badlaav: every change is kit-named, and physical or chemical as the kit says; its signs are the kit's", () => {
  // the kit's own lists (t01 expectations 1 and 2) and its other named changes
  const phys = EXP1.find((e) => e.startsWith("In a physical change")), chem = EXP1.find((e) => e.startsWith("In a chemical change"));
  for (const x of ["melting ghee", "freezing water", "tearing paper"]) assert.ok(phys.includes(x), x);
  for (const x of ["burning a wick", "curdling milk", "cooking an egg", "rusting"]) assert.ok(chem.includes(x), x);
  assert.ok(TEXT1.includes("Melting ice is a chemical change because it looks different") && TEXT1.includes("Melting wax is physical"));
  assert.ok(TEXT1.includes("Roasting is a ___ change") || TEXT1.includes("Roasting the chapati is a chemical change"));
  assert.ok(TEXT1.includes("baking soda") && TEXT1.includes("it is a chemical change"));
  // each change's kind, read from the kit (not from the law)
  const KIT_KIND = { ghee: "physical", freeze: "physical", ice: "physical", wax: "physical", paper: "physical", wick: "chemical", curd: "chemical", soda: "chemical", chapati: "chemical", rust: "chemical", egg: "chemical" };
  for (const [id, c] of Object.entries(CHANGES)) assert.equal(c.kind, KIT_KIND[id], id);
  // each name on screen is a kit phrase
  const named = (en) => en.toLowerCase().split(" in ").every((part) => TEXT1.toLowerCase().includes(part.replace(/^(an?|the) /, "")));
  for (const id of Object.keys(CHANGES)) assert.ok(named(WORDS[`badlaav.chg.${id}`].en), `badlaav.chg.${id} "${WORDS[`badlaav.chg.${id}`].en}" is not kit-named`);
  // the five signs are the kit's sentence, in its order
  const signs = EXP1.find((e) => e.startsWith("Signs of a chemical change"));
  assert.match(signs, /gas bubbles, a change of colour, heat or light given out, a new smell, or a new solid forming/);
  const SIGN_WORD = { gas: "gas bubbles", colour: "colour", heat: "heat or light", smell: "new smell", solid: "new solid" };
  for (const s of SIGNS) assert.ok(signs.includes(SIGN_WORD[s]) && WORDS[`badlaav.sign.${s}`].en.toLowerCase().includes(SIGN_WORD[s].replace("colour", "colour")), s);
  // what each chemical change shows, read out of the kit's verified items and worked example
  const item = (id) => KITS[T1].items.find((i) => i.id === `${T1}-${id}`);
  const KIT_SIGNS = {
    wick: /heat and light are given out/.test(item("i07").answer) ? ["heat"] : [],
    curd: [...(/new sour smell/.test(item("i08").answer) ? ["smell"] : []), ...(/lumps form/.test(item("i08").answer) ? ["solid"] : [])],
    soda: /bubbles/.test(item("i03").answer) ? ["gas"] : [],
    chapati: KITS[T1].workedExample.steps.some((s) => /a colour change and a new smell/.test(s)) ? ["colour", "smell"] : [],
    rust: /reddish-brown coating/.test(item("rl-o2").prompt_en) ? ["colour"] : [],
    egg: [],
  };
  for (const [id, want] of Object.entries(KIT_SIGNS)) assert.deepEqual([...CHANGES[id].signs], want, `${id}'s signs`);
  // what undoes each physical change: melting by cooling (ghee, ice, wax), freezing by melting (warming); paper does not go back
  assert.ok(/becomes solid again when it cools/.test(item("i01").answer) && /cools back into solid wax/.test(item("i07").answer));
  assert.ok(EXP1.some((e) => e.includes("Many physical changes are easy to reverse (melting, freezing), but some are not (tearing paper")));
  assert.deepEqual(Object.fromEntries(Object.entries(CHANGES).filter(([, c]) => c.kind === "physical").map(([id, c]) => [id, c.undo])), { ghee: "cool", freeze: "warm", ice: "cool", wax: "cool", paper: "" });
});

test("badlaav: melting and dissolving, the fire triangle, burning's products and rusting are the kit's", () => {
  // ghol: heat melts (ghee, wax), a liquid dissolves (sugar, salt)
  assert.ok(EXP1.some((e) => e.includes("Melting is a solid turning into a liquid when heated; dissolving is a substance spreading into a liquid")));
  assert.ok(TEXT1.includes("ghee melting in a warm pan with no water, sugar dissolving in cold water") && TEXT1.includes("Dissolving is the salt spreading into the water"));
  assert.deepEqual({ ...SOLIDS }, { ghee: "melt", wax: "melt", sugar: "dissolve", salt: "dissolve" });
  // raakh: wood (and straw) become carbon dioxide, water vapour, smoke and ash; the gases and smoke into the air, ash behind
  assert.ok(EXP2.some((e) => e.includes("wood, wax or oil turn into carbon dioxide, water vapour, smoke and ash, which go into the air or stay behind")));
  assert.ok(TEXT2.includes("Burning turns the straw into carbon dioxide, water vapour, smoke particles and ash"));
  assert.ok(TEXT2.includes("gases (carbon dioxide and water vapour) and smoke that went into the air. Only a small part was left as ash"));
  assert.deepEqual(GOES, { co2: "air", vapour: "air", smoke: "air", ash: "left" });
  assert.deepEqual([...FUELS], ["wood", "straw"]);
  for (const p of PRODUCTS) assert.ok(TEXT2.toLowerCase().includes(WORDS[`badlaav.prod.${p}`].en.toLowerCase()), p);
  // trikon: fuel, oxygen (air), heat; fanning gives oxygen-rich air; covering cuts it off and it (slowly) goes out
  assert.ok(EXP2.some((e) => e.includes("fuel, oxygen (air) and enough heat to reach the ignition temperature; removing any one of them puts the fire out")));
  assert.ok(EXP2.some((e) => e.includes("Fanning a sigri pushes more oxygen-rich air to the fuel so it burns more strongly; covering a flame cuts off oxygen")));
  assert.ok(TEXT2.includes("it would slowly go out"));
  for (const s of ["fuel", "air", "heat"]) assert.ok(TEXT2.toLowerCase().includes(WORDS[`badlaav.side.${s}`].en.toLowerCase().replace(/ \(air\)$/, "")), s);
  // jang: rusting needs oxygen and water, slow, no flame
  assert.ok(EXP2.some((e) => e.includes("Rusting is also a chemical change that needs oxygen, and water too, but it is slow and gives no flame")));
  assert.deepEqual(WATER, { damp: true, dry: false });
});

test("badlaav: no word holds a number, an economy word, or a word for lighting a fire; lines fit the Studio box", () => {
  const strings = [...B_WORDS.flatMap(([k, v]) => LANGS.map((l) => [`${k} ${l}`, v[l]]))];
  const verbs = JSON.parse(readFileSync(`${ROOT}data/play/verbs.json`, "utf8")).badlaav;
  for (const m of BADLAAV_MODES) { strings.push([`verbs.json ${m}`, `${verbs[m].hi} ${verbs[m].en}`]); const v = playActOf("badlaav", m); strings.push([`play-verbs ${m}`, `${v.hi} ${v.en}`]); }
  for (const m of VIEW.replace(/\/\/.*$/gm, "").matchAll(/"([^"\n]*)"/g)) strings.push([`view "${m[1]}"`, m[1]]);
  const LIGHT = /\b(light (it|the|a)|lights? up|lighter|lighting|match|matches|matchsticks?|ignite\w*|kindle\w*|jalao|jala do|jalaao|aag lagao|maachis|machis|tilli|teeli)\b/i;
  const LIGHT_HI = /जलाओ|जला दो|आग लगाओ|माचिस|तीली|तिल्ली/;
  const ECON = /\b(points?|coins?|gems?|streaks?|lives|life left|rewards?|leaderboard|rank(ing)?|xp|level up|bonus|jackpot|loot|unlock(ed)?|hurry|jaldi|time'?s up|game over)\b/i;
  for (const [where, s] of strings) {
    assert.doesNotMatch(s, LIGHT, `${where}: "${s}"`);
    assert.doesNotMatch(s, LIGHT_HI, `${where}: "${s}"`);
    assert.doesNotMatch(s, ECON, `${where}: "${s}"`);
  }
  // no number on screen: steps, glows, pieces and days are scene values, never shown as digits
  for (const [k, v] of B_WORDS) for (const l of LANGS) assert.doesNotMatch(v[l].replace(/\{\w+\}/g, ""), /[0-9०-९]/, `${k} ${l} states a number`);
  // a goal / why / done line fits two lines of the 320 px Studio box (forge3 Q2.whole clips a longer one)
  for (const [k, v] of B_WORDS) if (/^badlaav\.(goal|why|done)\./.test(k)) for (const l of LANGS) assert.ok(v[l].replace(/\{\w+\}/g, "xxxxxxxxxx").length <= 64, `${k} ${l} is long`);
  const longest = (ks, l) => Math.max(...ks.map((k) => WORDS[k][l].length));
  for (const l of LANGS) {
    const chg = longest(Object.keys(CHANGES).map((x) => `badlaav.chg.${x}`), l), sol = longest(Object.keys(SOLIDS).map((x) => `badlaav.solid.${x}`), l), fu = longest(FUELS.map((x) => `badlaav.fuel.${x}`), l);
    assert.ok(WORDS["badlaav.goal.run"][l].replace(/\{\w+\}/g, "").length + chg <= 72, `goal.run ${l} with the longest change`);
    assert.ok(WORDS["badlaav.goal.put"][l].replace(/\{\w+\}/g, "").length + sol <= 72, `goal.put ${l}`);
    assert.ok(WORDS["badlaav.goal.burn"][l].replace(/\{\w+\}/g, "").length + fu <= 72, `goal.burn ${l}`);
  }
});

test("badlaav: no act lights a fire; the fire is only a picture that responds to a side taken away or given more", () => {
  // the aag acts: take the wood out, a lid on or off, fan, wait (trikon); wait, look, place, done (raakh); put, another day, wipe (jang)
  const aagTools = new Set();
  for (const goal of GOALS_OF.aag) for (const c of levelsOf("aag", goal, [1, 5])) {
    const lvl = L.validate(c.level);
    for (const a of L.solve(lvl)) if (a.kind === "use") aagTools.add(a.m);
    for (const m of BADLAAV_MAL) for (const a of L.malActs(lvl, m) ?? []) if (a.kind === "use") aagTools.add(a.m);
    if (goal === "trikon") for (const f of cardOf(lvl.params)) for (const t of fireTools(f)) aagTools.add(t);
  }
  assert.deepEqual([...aagTools].sort(), ["day", "fan", "fuel", "lid", "look", "unlid", "wait", "wipe"].filter((t) => aagTools.has(t)).sort());
  for (const t of aagTools) assert.doesNotMatch(t, /light|ignite|match|strike|kindle|jala/i);
  // a fire that is out never comes back: fanning or waiting cannot relight it
  const tk = lv("aag", "trikon", 1, (q) => cardOf(q)[0].want === "strong");
  const out = run(tk, [U("fuel"), U("fan"), U("wait"), U("fan")]);
  assert.equal(out.s.w.glow, 0); assert.deepEqual(out.refused, ["out", "nothing_changes", "out"]);
  // no water act on a fire anywhere (t02 m3 is the teacher's): the only water is the ghol glass and the jang damp place
  assert.doesNotMatch(LOGIC_SRC.replace(/\/\/.*$/gm, ""), /"(water|pour|douse|extinguish)"\s*:\s*\{/);
  // the view draws no hand: the fan, the lid and the wood are drawn alone
  assert.doesNotMatch(VIEW.replace(/\/\/.*$/gm, ""), /hand\(|finger|palm/i);
});

test("badlaav: the not-admitted belief is listed and has no mechanic; every number in the law is a declared scene value", () => {
  assert.deepEqual(Object.keys(NOT_ADMITTED), [`${T2}-m3`]);
  assert.ok(KITS[T2].misconceptions.some((m) => m.id === `${T2}-m3` && /every kind of fire/.test(m.belief)));
  const BG = coverage().entries.filter((e) => e.family === "badlaav");
  for (const id of Object.keys(NOT_ADMITTED)) assert.ok(!BG.some((e) => Object.values(e.misMap).includes(id)), `${id} has a mechanic`);
  assert.ok(!BADLAAV_MAL.some((m) => /water|fire/.test(m)), "no mal-rule about water on a fire");
  const lines = LOGIC_SRC.split("\n");
  const consts = [...LOGIC_SRC.matchAll(/^(?:export )?const ([A-Z_0-9]+) = ([0-9.]+);/gm)].map((m) => m[1]).sort();
  assert.deepEqual(consts, ["DAYMAX", "DAYS", "GLOW0", "JITTER", "RUSTED", "STEPS"]);
  for (const c of ["STEPS", "GLOW0", "DAYS", "RUSTED", "DAYMAX"]) { const i = lines.findIndex((l) => new RegExp(`const ${c} = `).test(l)); assert.match(lines[i - 1], /scene value, no fact claimed/, c); }
  assert.match(LOGIC_SRC, /the pieces it has \(a scene value, no fact claimed\)/);
});

for (const [mode, goal] of CASES) {
  test(`badlaav ${mode}/${goal}: every level validates, solves, is shortcut-free; mal-rules land on their own misconception`, () => {
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
      for (const mal of BADLAAV_MAL) {
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
// t01: a change is physical or chemical as the kit lists it; it shows only its kit signs; melting comes back by cooling,
// freezing by warming, torn paper does not come back but is still paper, a chemical change does not come back; heat melts
// ghee and wax, a liquid dissolves sugar and salt. t02: a fire burns with fuel, air and heat; the wood out or the air used up
// under a lid puts it out; fanning with air reaching it makes it burn strongly; burning makes carbon dioxide, water vapour and
// smoke (into the air) and ash (left behind); iron rusts only where there is water as well as air, a little a day.
const KIND = { ghee: "p", freeze: "p", ice: "p", wax: "p", paper: "p", wick: "c", curd: "c", soda: "c", chapati: "c", rust: "c", egg: "c" };
const SHOWS = { wick: ["heat"], curd: ["smell", "solid"], soda: ["gas"], chapati: ["colour", "smell"], rust: ["colour"], egg: [] };
const UNDO = { ghee: "cool", ice: "cool", wax: "cool", freeze: "warm" };
const NEEDS = { ghee: "tawa", wax: "tawa", sugar: "water", salt: "water" };
const INTO = { co2: "air", vapour: "air", smoke: "air", ash: "left" };
function checker(p) {
  const card = cardOf(p), k = { i: 0, ran: false, tries: [], back: false, at: "", step: 0, fuel: true, lid: false, glow: 2, burnt: 0, looked: false, placed: {}, where: card.map(() => ""), rust: card.map(() => 0), day: 0 };
  const reset = () => { Object.assign(k, { ran: false, tries: [], back: false, at: "", step: 0, burnt: 0, looked: false, placed: {} }); if (p.goal === "trikon" && card[k.i]) Object.assign(k, { fuel: true, lid: card[k.i].lid, glow: 2 }); };
  reset();
  return function step(a, refused) {
    if (a.kind === "undo") return "skip";
    const it = card[k.i];
    if (refused) return "ok";
    switch (p.goal) {
      case "nishaan":
        if (a.kind === "run") { assert.ok(!k.ran); k.ran = true; return "ok"; }
        assert.ok(k.ran, "marked only once it has run");
        assert.ok(a.s === "same" ? KIND[it] === "p" : KIND[it] === "c" && SHOWS[it].includes(a.s), `${it} marked ${a.s}`);
        k.i++; reset(); return "ok";
      case "ulta":
        if (a.kind === "run") { k.ran = true; return "ok"; }
        if (a.kind === "use") { assert.ok(k.ran && !k.back); k.tries.push(a.m); k.back = UNDO[it] === a.m; return "ok"; }
        assert.ok(k.ran && k.tries.length, "said only after a try");
        assert.equal(a.bin, k.back ? "back" : KIND[it] === "c" ? "new" : "same", `${it} said ${a.bin}`);
        assert.ok(a.bin !== "back" || UNDO[it] === k.tries[k.tries.length - 1], "it came back the way that undoes it");
        k.i++; reset(); return "ok";
      case "ghol":
        if (a.kind === "put") { assert.equal(a.to, NEEDS[it], `${it} to ${a.to}`); k.at = a.to; return "ok"; }
        if (a.kind === "use") { assert.equal(a.m, k.at === "tawa" ? "wait" : "stir"); k.step++; assert.ok(k.step <= STEPS); return "ok"; }
        assert.ok(a.kind === "done" && k.step === STEPS); k.i++; reset(); return "ok";
      case "trikon": {
        assert.equal(a.kind, "use");
        if (a.m === "fuel") { assert.ok(k.fuel && it.want !== "keep"); k.fuel = false; k.glow = 0; }
        else if (a.m === "lid") { assert.ok(!k.lid && it.want !== "nolid"); k.lid = true; }
        else if (a.m === "unlid") { assert.ok(k.lid); k.lid = false; }
        else if (a.m === "fan") { assert.ok(!k.lid && k.fuel && k.glow > 0, "fanning works only with air reaching a burning fire"); k.glow = 3; }
        else if (a.m === "wait") { assert.ok(k.lid && k.glow > 0, "a wait matters only under the lid"); k.glow--; }
        const met = it.want === "strong" ? k.glow === 3 : k.glow === 0 && (it.want !== "keep" || k.fuel);
        if (met) { k.i++; reset(); }
        return "ok";
      }
      case "raakh":
        if (a.kind === "use" && a.m === "wait") { k.burnt++; assert.ok(k.burnt <= it.k); return "ok"; }
        if (a.kind === "use") { assert.ok(k.burnt > 0 && !k.looked); k.looked = true; return "ok"; }
        if (a.kind === "place") { assert.equal(a.to, INTO[a.p]); assert.ok(k.burnt > 0 && (k.looked || a.p === "smoke" || a.p === "ash")); k.placed[a.p] = a.to; return "ok"; }
        assert.ok(k.burnt === it.k && k.looked && Object.keys(k.placed).length === 4, "Done only with all of it found"); k.i++; reset(); return "ok";
      case "jang":
        if (a.kind === "put") { k.where[a.at] = a.to; return "ok"; }
        assert.equal(a.m, "day", "a wipe never changes anything");
        assert.ok(k.where.every((x) => x));
        k.day++; k.rust = k.rust.map((r, i) => (k.where[i] === "damp" ? r + 1 : r));
        return "ok";
    }
    return "ok";
  };
}

test("badlaav: random play — the checker agrees with every step the law takes", () => {
  const rnd = mulberry32(2026);
  const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
  let accepted = 0;
  const per = {};
  for (const [mode, goal] of CASES) for (const c of levelsOf(mode, goal, [5, 11])) {
    const level = L.validate(c.level), p = level.params, n = cardOf(p).length;
    let s = L.init(level);
    const check = checker(p);
    for (let k = 0; k < 90 && !s.done; k++) {
      let a;
      switch (goal) {
        case "nishaan": a = rnd() < 0.3 ? RUN : MARK(pick([...SIGNS, "same"])); break;
        case "ulta": a = rnd() < 0.25 ? RUN : rnd() < 0.5 ? U(pick(["cool", "warm"])) : FILE(pick(["back", "same", "new"])); break;
        case "ghol": a = rnd() < 0.3 ? PUT(0, pick(["tawa", "water"])) : rnd() < 0.7 ? U(pick(["wait", "stir", "gone"])) : D; break;
        case "trikon": a = U(pick(["fuel", "lid", "unlid", "fan", "wait"])); break;
        case "raakh": a = rnd() < 0.35 ? U("wait") : rnd() < 0.45 ? U("look") : rnd() < 0.9 ? PLACE(pick(PRODUCTS), pick(["air", "left"])) : D; break;
        case "jang": a = rnd() < 0.4 ? PUT(Math.floor(rnd() * n), pick(["damp", "dry"])) : rnd() < 0.85 ? U("day") : U("wipe", Math.floor(rnd() * n)); break;
      }
      const r = L.apply(level, s, a, k + 1);
      if (r.refused) assert.deepEqual(r.state.w, s.w, `${goal}: a refused act changes nothing`);
      else { check(a, r.refused); accepted++; per[goal] = (per[goal] ?? 0) + 1; }
      // jang: rust only where there is water as well as air, and done only as the card asks
      if (goal === "jang" && !r.refused && a.kind === "use") {
        r.state.w.rust.forEach((x, i) => assert.ok(r.state.w.where[i] === "damp" || x === s.w.rust[i], "no rust without water"));
        if (r.state.done) assert.ok(r.state.w.day >= DAYS && cardOf(p).every((it, i) => (it.want === "rust" ? r.state.w.rust[i] >= RUSTED : r.state.w.rust[i] === 0)));
      }
      s = r.state;
    }
  }
  assert.ok(accepted > 600, `accepted ${accepted}`);
  for (const [, goal] of CASES) assert.ok((per[goal] ?? 0) > 40, `${goal}: ${per[goal]} accepted`);
});

test("badlaav: the law's answers (signs, undoing, heat or a liquid, the triangle, what burning makes, rust)", () => {
  // nishaan: nothing before it runs; a sign it does not show is refused; a change of state marked new is m2
  const ni = lv("palat", "nishaan", 1, (q) => KIND[cardOf(q)[0]] === "c");
  const c0 = cardOf(ni.params)[0], other = SIGNS.find((x) => !SHOWS[c0].includes(x));
  assert.deepEqual(run(ni, [MARK(SHOWS[c0][0])]).refused, ["not_run"]);
  assert.deepEqual(run(ni, [RUN, MARK(other)]).refused, ["not_seen"]);
  assert.deepEqual(run(ni, [RUN, MARK("same")]).refused, ["look_new"]);
  assert.equal(run(ni, [RUN, MARK(SHOWS[c0][0])]).s.w.next, 1);
  // ulta: melted ghee cooled comes back; warmed it does not; torn paper is the same stuff; a cooked egg said back is m1
  const ul = lv("palat", "ulta", 1, (q) => ["ghee", "ice", "wax"].includes(cardOf(q)[0]));
  assert.deepEqual(run(ul, [RUN, FILE("back")]).refused, ["not_tried"]);
  assert.deepEqual(run(ul, [RUN, U("warm"), FILE("back")]).refused, ["not_back"]);
  assert.deepEqual(run(ul, [RUN, U("warm"), FILE("same")]).refused, ["can_back"]);
  assert.equal(run(ul, [RUN, U("cool"), FILE("back")]).s.w.next, 1);
  assert.deepEqual(run(ul, [RUN, U("cool"), FILE("new")]).refused, ["is_back"]);
  const up = lv("palat", "ulta", 1, (q) => cardOf(q)[0] === "paper");
  assert.deepEqual(run(up, [RUN, U("cool"), FILE("new")]).refused, ["still_paper"]);
  assert.equal(run(up, [RUN, U("warm"), FILE("same")]).s.w.next, 1);
  const ue = lv("palat", "ulta", 1, (q) => cardOf(q)[0] === "egg");
  assert.equal(run(ue, [RUN, U("cool")]).s.w.back, false, "a cooked egg cooled stays cooked");
  assert.equal(run(ue, [RUN, U("cool"), FILE("back")]).ms.find((m) => m.kind === "misconception_consequence")?.misconceptionId, "undo-all");
  // ghol: wax into the water is refused (melting needs heat); sugar on the tawa is m3; Done only once it has gone over
  const gw = lv("palat", "ghol", 1, (q) => cardOf(q)[0] === "wax"), gs = lv("palat", "ghol", 1, (q) => cardOf(q)[0] === "sugar");
  assert.deepEqual(run(gw, [PUT(0, "water")]).refused, ["needs_heat"]);
  assert.deepEqual(run(gw, [PUT(0, "tawa"), U("stir")]).refused, ["no_water"]);
  assert.deepEqual(run(gw, [PUT(0, "tawa"), U("wait"), D]).refused, ["not_yet"]);
  assert.equal(run(gw, [PUT(0, "tawa"), ...Array(STEPS).fill(U("wait")), D]).s.w.next, 1);
  assert.deepEqual(run(gs, [PUT(0, "tawa")]).refused, ["needs_liquid"]);
  assert.deepEqual(run(gs, [PUT(0, "water"), U("gone")]).refused, ["not_stirred"]);
  assert.deepEqual(run(gs, [PUT(0, "water"), U("stir"), U("gone")]).refused, ["still_there"]);
  // trikon: the wood out puts it out at once; a lid puts it out a wait at a time; fanning makes it burn strongly; a fan on a lid is m2
  const ts = lv("aag", "trikon", 2, (q) => cardOf(q)[0].want === "strong" && cardOf(q)[0].lid);
  assert.deepEqual(run(ts, [U("fan")]).refused, ["lid_air"]);
  assert.equal(run(ts, [U("unlid"), U("fan")]).s.w.next, 1);
  const tkk = lv("aag", "trikon", 1, (q) => cardOf(q)[0].want === "keep");
  assert.deepEqual(run(tkk, [U("fuel")]).refused, ["keep_wood"]);
  assert.equal(run(tkk, [U("lid"), ...Array(GLOW0 - 1).fill(U("wait"))]).s.w.next, 0, "not out yet");
  assert.equal(run(tkk, [U("lid"), ...Array(GLOW0).fill(U("wait"))]).s.w.next, 1, "out under the lid, the wood still in");
  const tn = lv("aag", "trikon", 1, (q) => cardOf(q)[0].want === "nolid");
  assert.deepEqual(run(tn, [U("lid")]).refused, ["no_lid"]);
  assert.equal(run(tn, [U("fuel")]).s.w.next, 1);
  // raakh: the gases are found only by a closer look; Done without it is m1; ash is left behind
  const rk = lv("aag", "raakh", 1), k = cardOf(rk.params)[0].k;
  assert.deepEqual(run(rk, [U("wait"), PLACE("co2", "air")]).refused, ["not_found"]);
  assert.deepEqual(run(rk, [U("wait"), PLACE("ash", "air")]).refused, ["wrong_place"]);
  assert.deepEqual(run(rk, [U("wait"), D]).refused, ["still_fuel"]);
  assert.deepEqual(run(rk, [...Array(k).fill(U("wait")), D]).refused, ["into_air"]);
  assert.deepEqual(run(rk, [...Array(k).fill(U("wait")), U("look"), PLACE("ash", "left"), D]).refused, ["not_all"]);
  assert.ok(Object.values(SEEN).filter((x) => !x).length === 2, "the two gases need a closer look");
  // jang: rust only in the damp place; a wiped rusty nail is m4; days are counted by taps
  const jg = lv("aag", "jang", 1), irons = cardOf(jg.params), r = irons.findIndex((x) => x.want === "rust");
  assert.deepEqual(run(jg, [U("day")]).refused, ["place_all"]);
  const allDry = run(jg, [...irons.map((_, i) => PUT(i, "dry")), ...Array(DAYS).fill(U("day"))]);
  assert.ok(allDry.s.w.rust.every((x) => x === 0) && !allDry.s.done, "nothing rusts without water");
  const wet = run(jg, [...irons.map((x, i) => PUT(i, x.want === "rust" ? "damp" : "dry")), U("day"), U("wipe", r)]);
  assert.equal(wet.ms.find((m) => m.kind === "misconception_consequence")?.misconceptionId, "just-dirt");
  assert.deepEqual(run(jg, [...irons.map((x, i) => PUT(i, x.want === "rust" ? "damp" : "dry")), U("wipe", irons.findIndex((x) => x.want === "keep"))]).refused, ["clean"]);
  assert.deepEqual(run(jg, [...irons.map((_, i) => PUT(i, "damp")), ...Array(DAYMAX + 1).fill(U("day"))]).refused, ["enough"]);
  // undo steps back
  assert.equal(run(gw, [PUT(0, "tawa"), { kind: "undo" }]).s.w.at, "");
});

test("badlaav: tampered params are refused; a claim in an act never decides; nothing is timed", () => {
  const level = L.generate(req("palat", "nishaan", 5, { fade: 2 }))[0].level;
  const p = level.params, bad = (patch, o = {}) => L.validate({ ...level, ...o, params: { ...p, ...patch } });
  assert.ok(L.validate(level));
  assert.equal(bad({ row: 99 }), null);
  assert.equal(bad({ row: 0 }), null, "a row of another look");
  assert.equal(bad({ scene: "nowhere" }), null);
  assert.equal(bad({ goal: "trikon" }), null);
  assert.equal(bad({ look: 4 }), null);
  assert.equal(bad({ lay: -1 }), null);
  assert.equal(bad({}, { mode: "aag" }), null);
  const forged = sanitizeActs([{ seq: 1, act: { kind: "mark", s: "gas", correct: true, solved: true } }]);
  assert.ok(!("correct" in forged[0].act) && !("solved" in forged[0].act));
  assert.notEqual(L.grade(L.validate(level), forged).verdict, "solved");
  // acts of another goal are refused
  const lvl = L.validate(level);
  assert.deepEqual(run(lvl, [D, U("fan"), PUT(0, "tawa")]).refused, ["no_claim", "unknown_act", "unknown_act"]);
  const tk = L.validate(L.generate(req("aag", "trikon", 5))[0].level);
  assert.deepEqual(run(tk, [RUN, U("light"), D]).refused, ["unknown_act", "no_tool", "no_claim"]);
  for (const src of [LOGIC_SRC, VIEW]) assert.doesNotMatch(src.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(VIEW.replace(/\/\/.*$/gm, ""), /#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  // every timed beat is keyed to the act and drawn inside busy() (tests/r7-games-redraw-window.test.mjs reads this view too)
  assert.match(VIEW, /const busy = \(\) => api\.t - actAt < HOLD/);
});

// ───────────────────────────── the play server ─────────────────────────────
const BG = () => coverage().entries.filter((e) => e.family === "badlaav");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("badlaav coverage: six entries on the two topics, mapped to their kit misconceptions; water on a fire not admitted", () => {
  assert.deepEqual(BG().map((e) => `${e.topicId}|${e.mode}|${e.goal}|${e.skillIds.join(",")}`), [
    `${T1}|palat|nishaan|${T1}-s2,${T1}-s1`, `${T1}|palat|ulta|${T1}-s3,${T1}-s1`, `${T1}|palat|ghol|${T1}-s4`,
    `${T2}|aag|trikon|${T2}-s2,${T2}-s1`, `${T2}|aag|raakh|${T2}-s4,${T2}-s1`, `${T2}|aag|jang|${T2}-s3`]);
  assert.deepEqual(BG().map((e) => e.misMap), [
    { "looks-new": `${T1}-m2` }, { "undo-all": `${T1}-m1`, "looks-new": `${T1}-m2` }, { "sugar-melts": `${T1}-m3`, "gone": `${T1}-m4` },
    { "fan-heat": `${T2}-m2` }, { "vanished": `${T2}-m1` }, { "just-dirt": `${T2}-m4` }]);
  for (const e of BG()) for (const kit of Object.values(e.misMap)) assert.ok(KITS[e.topicId].misconceptions.some((x) => x.id === kit), kit);
  for (const s of ["s1", "s2", "s3", "s4"]) { assert.ok(hasPlay(`${T1}-${s}`), `${T1}-${s}`); assert.ok(hasPlay(`${T2}-${s}`), `${T2}-${s}`); }
  assert.equal(entryFor({ skillId: `${T1}-s4` }).family, "badlaav");
  assert.equal(entryFor({ skillId: `${T2}-s3` }).family, "badlaav");
  for (const t of [T1, T2]) assert.deepEqual(backlogged(t), [], `${t} is still in the law backlog`);
});

for (const e of BG()) for (const fade of [1, 2, 3]) {
  test(`badlaav server ${e.goal} fade ${fade}: serves a proven level; solve grades solved; claims never solve; mal-rules fold their kit id`, () => {
    for (const child of ["c1", "c2", "c3", "c4", "c5", "c6"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const cur = currentLevel(s, e, "Zoya");
      assert.ok(cur && cur.family === "badlaav" && cur.mode === e.mode && cur.params.goal === e.goal);
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
test("badlaav: the first level served differs across children", () => {
  for (const e of BG()) for (const fade of [1, 3]) {
    const sigs = new Set(), lays = new Set();
    for (let c = 0; c < 20; c++) {
      const child = `var-${c}`, lvl = currentLevel(sessionOf(e, { childId: child, fade, seed: seedOf(child, entryKey(e), 0) }), e);
      sigs.add(lvl.sig); lays.add(JSON.stringify(cardOf(lvl.params)));
    }
    assert.ok(sigs.size >= 3, `${e.goal} fade ${fade}: ${sigs.size} distinct first levels over 20 children`);
    assert.ok(lays.size >= 3, `${e.goal} fade ${fade}: ${lays.size} distinct cards over 20 children`);
  }
});

test("badlaav: the generator's and the picker's work is bounded (counted, not timed)", () => {
  // measured 2026-11-10 over every case below: at most 10 candidates and 385 calls into the family logic per pick; bounds are 3x above that. A count is the same on every machine; a
  // 50 ms p95 read 5 ms idle and 110 ms under the gate's load (tests/_work.mjs).
  const gen = [], calls = [], considered = [], counter = counted(L);
  for (const [mode, goal] of CASES) for (const fade of [1, 2, 3]) for (let seed = 1; seed <= 6; seed++) {
    gen.push(L.generate(req(mode, goal, seed * 31, { fade })).length);
    counter.reset(); const picked = pickLevels(counter.logic, req(mode, goal, seed * 31, { fade })); assert.ok(picked); calls.push(counter.calls()); considered.push(picked.considered);
  }
  assert.ok(Math.max(...gen) <= 30, `generate made ${Math.max(...gen)} candidates`);
  assert.ok(Math.max(...considered) <= 30, `pick considered ${Math.max(...considered)}`);
  assert.ok(Math.max(...calls) <= 1200, `pick made ${Math.max(...calls)} calls into the family logic`);
});

test("badlaav: every word the view shows exists in all three languages; vakya's words stay last", () => {
  const keys = Object.keys(WORDS);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const used = [...VIEW.matchAll(/W\("(badlaav\.[a-zA-Z0-9._-]+)"/g)].map((m) => m[1]);
  const prefixes = [...VIEW.matchAll(/W\(`(badlaav\.[a-zA-Z0-9._-]+)\$\{/g)].map((m) => m[1]);
  assert.ok(prefixes.length >= 12, `template keys ${prefixes.length}`);
  const whys = new Set([...LOGIC_SRC.matchAll(/no\("([a-z_]+)"/g)].map((m) => m[1]));
  for (const m of LOGIC_SRC.matchAll(/no\(w\.at === "water" \? "([a-z_]+)" : "([a-z_]+)"\)/g)) { whys.add(m[1]); whys.add(m[2]); }
  const goals = CASES.map(([, g]) => g);
  const dyn = [
    ...Object.keys(CHANGES).flatMap((x) => [`chg.${x}`, `short.${x}`]), ...[...SIGNS, "same"].map((x) => `sign.${x}`), "res.physical", "res.chemical",
    ...["cool", "warm", "wait", "stir", "fuel", "lid", "unlid", "fan", "look", "day", "wipe"].map((x) => `tool.${x}`),
    ...["back", "same", "new"].map((x) => `bin.${x}`), ...Object.keys(SOLIDS).map((x) => `solid.${x}`), ...["tawa", "water", "damp", "dry"].map((x) => `place.${x}`),
    "short.damp", "short.dry", ...["strong", "out", "keep", "nolid"].flatMap((x) => [`wantS.${x}`, `goal.trikon.${x}`]), ...["fuel", "air", "heat"].map((x) => `side.${x}`),
    ...FUELS.map((x) => `fuel.${x}`), ...PRODUCTS.map((x) => `prod.${x}`), "to.air", "to.left", "want.rust", "want.keep", "goal.tawa", "goal.water",
    ...[...whys].map((x) => `why.${x}`), ...goals.map((g) => `done.${g}`),
  ].map((k) => `badlaav.${k}`);
  assert.ok(used.length >= 12, `literal keys ${used.length}`);
  for (const pre of prefixes) assert.ok(dyn.some((k) => k.startsWith(pre)), `no word under ${pre}`);
  for (const k of [...used, ...dyn]) for (const l of LANGS) assert.ok(WORDS[k]?.[l], `${k} ${l}`);
});
