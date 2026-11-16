// Gate 2, the default for every family's picks (RULINGS-2026-11-15, "To Games, 2026-11-16: the per-session reading" 2).
// A pick whose blind chance on a level is p is named on the k-th sighting, k the smallest for which the chance of k or more
// in NAMING_LEVELS (4) levels is under 1 in 10: 4 for one in two or three, 3 for one in four to one in seven, 2 from one in
// eight down. A family with its own proved gate-2 table (FamilyLogic.chanceRepeat: stambh/tally, kon/place, kon/name)
// overrides it. The server's rule: server/play/levels.js namingSpec (blindChance, pickOptions, defaultSightings).
//
// Asserted centrally over every family's declared picks (FamilyLogic.oneDecision goals and chancePicks) on every generated
// level (every coverage entry × fades 1-3 × two seeds × no focus and each mapped mix-up as the focus, every candidate the
// generator makes): p is read from the level through the family's own grade, k equals the computed default unless a family
// spec overrides it, and the per-day figure (four levels; levels of one pair can differ in p, and the server then asks for
// the most sightings any of the sighted levels calls for) is under 1 in 10 for every mix of the pair's levels.
// With PICKS_DEFAULT_PRINT=<file> the per-pair table is written there as JSON.
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { coverage, entryKey, genRequest, seedOf, blindChance, defaultK, defaultSightings, atLeastOf, namingSpec, pickOptions, repeatSpec, nameOnRepeat, afterLevelBody,
  surfaceOf, NAMING_LEVELS, LAW3_LINE, UNREAD_PICK } from "../server/play/levels.js";
import { logicFor } from "../src/play/families/index.ts";
import { atLeast } from "./_session-figure.mjs";
import { CHANCE_WEIGHT, GAME_WEIGHT } from "../shared/play.ts";

/** the families whose gate-2 tables a judge reads (their chanceRepeat overrides the default) */
const PROVED = new Set(["stambh/tally", "kon/place", "kon/name"]);
const SEEDS = 2;

test("the computed default: k from p over four levels, under 1 in 10", () => {
  assert.equal(NAMING_LEVELS, 4); assert.equal(LAW3_LINE, 0.1);
  const want = [[1 / 2, 4], [1 / 3, 4], [1 / 4, 3], [1 / 5, 3], [1 / 6, 3], [1 / 7, 3], [1 / 8, 2], [1 / 20, 2], [0.6, Infinity]];
  for (const [p, k] of want) assert.equal(defaultSightings(p), k, `p = ${p}`);
  // (one in seven: 2 of 4 land 241 times in 2401, just over the line, so 3 there; 2 starts at 1/8: main's answer "computed default" 1,
  // RULINGS-2026-11-16-gate2-answers.md)
  assert.ok(atLeastOf(4, 1 / 7, 2) > 0.1 && atLeastOf(4, 1 / 8, 2) < 0.1);
  for (const p of [0.5, 1 / 3, 0.25, 0.2, 0.1]) for (let k = 1; k <= 4; k++) assert.ok(Math.abs(atLeastOf(4, p, k) - atLeast(4, p, k)) < 1e-12);
  assert.equal(UNREAD_PICK, 1 / 2, "a pick whose options cannot be read is taken at one in two");
});

/** every declared pick on every generated level → Map(pair → { ps, unread, k, own }) */
function scan() {
  const pairs = new Map();
  let levels = 0, checked = 0;
  for (const e of coverage().entries) {
    const lg = logicFor(e.family, e.mode);
    if (!lg || (!lg.oneDecision?.length && !lg.chancePicks?.length)) continue;
    const picky = (g, m) => !!g && (!!lg.oneDecision?.includes(g) || !!lg.chancePicks?.includes(g) || !!lg.chancePicks?.includes(`${g}:${m}`));
    const seen = new Set();
    for (const fade of [1, 2, 3]) for (let sd = 0; sd < SEEDS; sd++) for (const focus of [null, ...Object.values(e.misMap ?? {})]) {
      const body = { skillId: e.skillId, classLevel: e.classLevel, fade, mis: focus ? { [focus]: 0.7 } : {}, seed: seedOf(`qa-${sd}`, entryKey(e), 0), recent: [], ...(focus ? { focus } : {}) };
      let cands = [];
      try { cands = lg.generate(genRequest(body, e)); } catch { cands = []; }
      for (const c of cands) {
        const v = lg.validate(c.level);
        if (!v) continue;
        const sig = `${JSON.stringify(v.params)}|${v.fade}|${v.goal}`;
        if (seen.has(sig)) continue;
        seen.add(sig); levels++;
        for (const [rule, kit] of Object.entries(v.mal ?? {})) {
          if (!picky(v.goal, rule)) continue;
          const key = `${e.family}/${e.mode} ${v.goal}:${rule}`, own = repeatSpec(v, kit);
          const P = pairs.get(key) ?? { key, fm: `${e.family}/${e.mode}`, ps: new Set(), unread: 0, n: 0, ks: new Set(), options: new Set(), own: own ? own.sightings : null };
          P.n++; checked++;
          if (own) {
            assert.ok(PROVED.has(P.fm), `${key}: a chanceRepeat outside the three proved tables`);
            assert.equal(own.sightings, P.own, `${key}: one spec per pair`);
            assert.equal(namingSpec(v, kit), own, `${key}: the family's spec overrides the default`);
            assert.equal(defaultK(v, kit), null);
          } else {
            const b = blindChance(v, kit), p = b ? b.p : UNREAD_PICK, k = defaultK(v, kit);
            assert.equal(k, defaultSightings(p), `${key} ${v.levelId}: k is the computed default for p = ${p}`);
            assert.equal(namingSpec(v, kit).sightings, k);
            // the per-day figure on this level's own p: k or more of four
            if (Number.isFinite(k)) assert.ok(atLeastOf(NAMING_LEVELS, p, k) < LAW3_LINE, `${key} ${v.levelId}: ${atLeastOf(NAMING_LEVELS, p, k)}`);
            if (b) { assert.ok(b.p > 0 && b.p < 1 && b.options >= 2, `${key}: a read pick is among two or more`); P.ps.add(b.p); P.options.add(b.options); } else P.unread++;
            P.ks.add(k);
          }
          pairs.set(key, P);
        }
      }
    }
  }
  return { pairs, levels, checked };
}
let memo = null;
const scanned = () => (memo ??= scan());

/**
 * The worst per-day figure of a pair whose levels can differ in p: four levels, each any of the pair's p values (an unread
 * level at UNREAD_PICK), every one of the 2^4 outcomes summed; she is named when the levels that landed are at least the
 * most sightings any of them calls for (namingSpec over the remembered k).
 */
function worstDay(ps) {
  const vals = [...ps], n = NAMING_LEVELS;
  let worst = 0;
  const tuple = (t) => {
    if (t.length === n) {
      let total = 0;
      for (let mask = 1; mask < 1 << n; mask++) {
        const hit = t.map((_, i) => !!(mask & (1 << i))), hits = hit.filter(Boolean).length;
        const need = Math.max(...t.filter((_, i) => hit[i]).map((p) => defaultSightings(p)));
        if (hits >= need) total += t.reduce((a, p, i) => a * (hit[i] ? p : 1 - p), 1);
      }
      worst = Math.max(worst, total);
      return;
    }
    for (const p of vals) tuple([...t, p]);
  };
  tuple([]);
  return worst;
}

test("every family's declared picks on every generated level: p read, k the default unless proved, the day under 1 in 10", () => {
  const { pairs, levels, checked } = scanned();
  assert.ok(levels > 5000, `levels generated: ${levels}`);
  assert.ok(pairs.size >= 60, `pairs: ${pairs.size}`);
  assert.ok(checked > 10000, `(level, pick) checks: ${checked}`);
  const rows = [];
  for (const P of [...pairs.values()].sort((a, b) => a.key.localeCompare(b.key))) {
    if (P.own) { rows.push({ pair: P.key, before: P.own, after: P.own, own: true, n: P.n }); continue; }
    const ps = new Set(P.ps);
    if (P.unread) ps.add(UNREAD_PICK);
    const day = worstDay(ps);
    assert.ok(day < LAW3_LINE, `${P.key}: the day's figure ${day} over p ${[...ps].join(", ")}`);
    const ks = [...P.ks].sort((a, b) => a - b);
    rows.push({ pair: P.key, before: 2, after: ks.length === 1 ? ks[0] : `${ks[0]}-${ks[ks.length - 1]}`, kMax: ks[ks.length - 1], p: [...P.ps].sort((a, b) => b - a).map((x) => +x.toFixed(4)), options: [...P.options].sort(), unread: P.unread, n: P.n, day: +day.toFixed(4) });
  }
  // every default pair asked for two sightings before; none asks for fewer now
  for (const r of rows) if (!r.own) assert.ok(r.kMax >= 2);
  if (process.env.PICKS_DEFAULT_PRINT) writeFileSync(process.env.PICKS_DEFAULT_PRINT, JSON.stringify({ levels, checked, rows }, null, 1));
});

test("pickOptions: a family's own list (strips' three buttons, the lab's three predictions); else read from its acts", () => {
  const { pairs } = scanned();
  const opts = (key) => [...pairs.get(key).options];
  assert.deepEqual(opts("todo-jodo/strips compare:more-pieces-more"), [3]);
  assert.deepEqual(opts("kyun-lab/fair-test predict:heavy-sinks"), [3]);
  // a pick read from the family's own acts: the mix-up's act, the solve's and every other rule's at that point (a floor)
  const lg = logicFor("rang", "pehchaan");
  const e = coverage().entries.find((x) => x.family === "rang" && x.mode === "pehchaan" && x.goal === "desi");
  const v = lg.generate(genRequest({ skillId: e.skillId, classLevel: e.classLevel, fade: 1, mis: {}, seed: 7, recent: [] }, e)).map((c) => lg.validate(c.level)).find((l) => l && "made-red" in l.mal && lg.malActs(l, "made-red"));
  const o = pickOptions(v, "made-red");
  assert.ok(o.length >= 2 && o.some((acts) => JSON.stringify(acts) === JSON.stringify(lg.malActs(v, "made-red"))));
  assert.equal(blindChance(v, v.mal["made-red"]).options, o.length);
});

test("the server's rule: named on the k-th sighting within the first four levels; the most any sighted level calls for", () => {
  const lg = logicFor("todo-jodo", "strips");
  const RULE = "bigger-denominator";
  const e = coverage().entries.find((x) => x.family === "todo-jodo" && x.mode === "strips" && x.goal === "compare" && x.misMap[RULE]);
  const focus = e.misMap[RULE], levels = [];
  for (let sd = 0; sd < 200 && levels.length < 5; sd++) for (const fade of [1, 2, 3]) for (const c of lg.generate(genRequest({ skillId: e.skillId, classLevel: e.classLevel, fade, mis: { [focus]: 0.7 }, focus, seed: sd, recent: [] }, e))) {
    const v = lg.validate(c.level);
    if (v && v.goal === "compare" && lg.malActs(v, RULE) && levels.length < 5 && !levels.some((l) => surfaceOf(l) === surfaceOf(v))) levels.push(v);
  }
  assert.equal(levels.length, 5);
  const kit = levels[0].mal[RULE];
  assert.equal(blindChance(levels[0], kit).p, 1 / 3); assert.equal(defaultK(levels[0], kit), 4);
  const row = { skillId: e.skillId, outcome: "incorrect", chanceMis: kit, weight: CHANCE_WEIGHT };
  let s = { n: 0 };
  for (let i = 0; i < 4; i++) {
    const out = nameOnRepeat([row], s, levels[i])[0];
    if (i < 3) assert.equal(out.misconceptionId, undefined, `sighting ${i + 1} of 4: not named`);
    else { assert.equal(out.misconceptionId, kit, "the fourth, four surfaces, within four levels: named"); assert.equal(out.weight, GAME_WEIGHT); }
    s = { ...afterLevelBody(s, { grade: { evidence: [row] }, level: levels[i] }), n: i + 1 };
  }
  assert.ok(s.chance.every((x) => x.k === 4));
  // past the session's first four levels: named on none
  assert.equal(nameOnRepeat([row], { ...s, n: 4 }, levels[4])[0].misconceptionId, undefined);
  // a remembered sighting from a level that needs more (k 4) holds a level that needs fewer (k 3) to the four
  const three = { mis: kit, surface: "x", k: 3 };
  assert.equal(namingSpec(levels[0], kit, [three]).sightings, 4);
  assert.equal(namingSpec(levels[0], kit, [{ ...three, k: 0 }]).sightings, Infinity, "0 remembered is never");
});
