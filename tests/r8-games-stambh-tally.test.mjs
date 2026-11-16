// Round 8 · stambh/tally (c4-maths-ch14-t01 s1, tallies drawn in fives). The proof suite the other families have:
//   - every generated level (both goals, every fade, many seeds) validates, is solved by its solver with no refusal, and is
//     shortcut-free (none of the idea-free ways through passes: the standing lines alone, the groups, every stroke
//     standing with a true table, every stroke across, the bundles read as four);
//   - goal met ⇔ an independent oracle (the tally written as text, read with a regular expression, never the law's
//     helpers), over ≥ 2000 random acts per goal; the law never throws;
//   - tally-four lands on its own misconception with its own signature (read: 4 × bundles + singles, gap = bundles;
//     keep "counted": lines across drawn and every total short by exactly its row's bundles; keep "five": no line across
//     anywhere, whatever the totals: judges round 2, ruling 4) and no other wrong answer is named tally-four: no one-bundle slip, and over random
//     acts a check is named ⇔ the signature written from the kit's signs;
//   - gate 2, the evidence rule (night rulings 2026-11-11): keep names from one level, its totals three ordinary slips or
//     more from the mix-up's on every generated level, a blind guess under 1 in 10; read names nothing from one level and
//     is named on a repeat whose bundles and loose lines both differ, two slips landing ≤ 1 in 10 over every servable
//     pair (the tables computed here, printed in the packet); the server's repeat rule with naming on;
//   - keep it again ("again") once the scene has passed; undo brings the old tally back;
//   - tampered params are refused; a verdict field in an act never decides; the first check decides the evidence;
//   - the server serves a proven level for every coverage entry at every fade, the solver's acts grade solved, the mal
//     acts fold the kit id, and the PLAY facts row carries bundles=n; the picto entry of the topic still serves;
//   - ten bundles fit a 360 px row; the largest keep row lies on one line, the largest read row splits no group; the
//     generator and the picker are fast in CPU time (tests/_cpu-ms.mjs);
//   - every word the view shows exists in all three languages; no clock, randomness or colour literal in the law or view.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { tallyLogic as L, TALLY_MAL, TALLY_CONTEXTS, tallyFlow, tallyOf, groupsOf, idleWays, tallyFourActs, READ_MAX, KEEP_ROW_MAX, READ_RANGE, numberLineEnd, numberLineAt } from "../src/play/families/stambh/tally.logic.ts";
import { stambhLogic } from "../src/play/families/stambh/stambh.logic.ts";
import { coverage, entryKey, levelsFor, currentLevel, seedOf, hasPlay, entryFor } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { playActOf } from "../server/director/play-verbs.js";
import { CHANCE_WEIGHT, GAME_WEIGHT, MODES, namingOn, playFactsRow, sanitizeActs } from "../shared/play.ts";
import { totalPad } from "../src/play/core/typedtotal.ts";
import { LOGIC } from "../src/play/families/index.ts";
import { pickLevels } from "../src/play/core/pick.ts";
import { cpuNow } from "./_cpu-ms.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const MIS = { "tally-four": "k-tally-four" };
const req = (goal, seed, o = {}) => ({ family: "stambh", mode: "tally", goal, topicId: "t", skillId: "t-s1", classLevel: 4, fade: 1, mis: {}, misMap: MIS, grammar: {}, recent: [], seed, ...o });
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const run = (level, acts) => { let s = L.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = L.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };
const levels = (goal, seeds = [1, 7, 42, 99, 123, 512]) => {
  const out = [];
  for (const seed of seeds) for (const fade of [1, 2, 3]) for (const c of L.generate(req(goal, seed, { fade }))) out.push(L.validate(c.level));
  return out;
};
/** the oracle: a row as text ("|" standing, "/" across) is a tally of k when it is k strokes in bundles "||||/" then up to
 *  four "|"; the level is met when every row is that tally of its count (keep) and every total is the count */
const text = (marks) => marks.map((m) => (m ? "/" : "|")).join("");
const isTallyOf = (t, k) => /^(\|\|\|\|\/)*\|{0,4}$/.test(t) && t.length === k;
const oracle = (level, s) => level.params.counts.every((c, r) => s.totals[r] === c && (level.params.goal === "read" || isTallyOf(text(s.marks[r]), c)));
/** tally-four's signature, written here from the kit's signs (not from the law): read, the total is 4 per bundle plus
 *  the singles; keep, one stroke per thing in every row and EITHER there is no "/" anywhere, whatever the totals (five as
 *  five standing lines; judges round 2, ruling 4) OR a "/" is drawn and every total is the row's count less its bundles */
const signature = (level, s) => {
  const { counts, goal } = level.params, short = counts.map((c) => c - Math.floor(c / 5));
  if (goal === "read") return s.totals[0] === short[0];
  if (!counts.every((c, r) => s.marks[r].length === c)) return false;
  const crossed = s.marks.some((m) => text(m).includes("/"));
  // evening ruling 1: "five" only on a level of at least three groups of five
  if (!crossed) return counts.reduce((a, c) => a + Math.floor(c / 5), 0) >= 3;
  return counts.every((c, r) => s.totals[r] === short[r]);
};

for (const goal of ["keep", "read"]) {
  test(`stambh/tally/${goal}: every level validates, solves cleanly, is shortcut-free; tally-four lands on its own misconception`, () => {
    const all = levels(goal);
    assert.ok(all.length >= 60, `${all.length} levels`);
    for (const level of all) {
      assert.ok(level, "validates");
      assert.equal(level.mode, "tally"); assert.equal(level.params.goal, goal);
      assert.equal(L.shortcut(level), null, `${level.levelId} shortcut`);
      const sol = run(level, L.solve(level));
      assert.ok(sol.s.done && sol.ms.some((m) => m.kind === "solved"), `${level.levelId} solves`);
      assert.deepEqual(sol.refused, [], `${level.levelId} solver refused`);
      assert.ok(oracle(level, sol.s), "the oracle agrees with the solve");
      for (const way of idleWays(level.params)) assert.ok(!run(level, way).s.done, `${level.levelId}: an idea-free way passed`);
      for (const mal of TALLY_MAL) {
        const acts = L.malActs(level, mal);
        assert.ok(acts, `${level.levelId}: every served level shows ${mal}`);
        const r = run(level, acts);
        assert.deepEqual(r.refused, ["missed"]);
        assert.ok(!r.s.done);
        const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
        assert.equal(mc.length, 1); assert.equal(mc[0].misconceptionId, mal);
        const g = L.grade(level, env(acts));
        assert.equal(g.evidence[0].outcome, "incorrect");
        if (goal === "keep") { assert.equal(g.evidence[0].misconceptionId, "k-tally-four"); assert.equal(g.facts.mal, "tally-four"); }
        else {
          // gate 2: read's one typed number is a pick at chance weight, named only on a repeat (server); nothing in her facts
          assert.equal(g.evidence[0].misconceptionId, undefined); assert.equal(g.evidence[0].chanceMis, "k-tally-four");
          assert.equal(g.evidence[0].weight, CHANCE_WEIGHT); assert.equal(g.facts.mal, undefined);
        }
      }
    }
  });
}

test("stambh/tally: tally-four's signature is the belief, and no other wrong answer is named tally-four", () => {
  for (const level of levels("read")) {
    const n = level.params.counts[0], b = Math.floor(n / 5), s = n % 5;
    const r = run(level, L.malActs(level, "tally-four"));
    assert.equal(r.s.totals[0], 4 * b + s, "read: each bundle read as its four standing lines");
    const mc = r.ms.find((m) => m.kind === "misconception_consequence");
    assert.equal(mc.facts.gap, b, "the gap on the number line is the number of bundles");
    assert.equal(mc.facts.bundles, b);
    assert.equal(n - Number(mc.facts.answer), b);
    // every other answer 0..60: never tally-four
    for (let a = 0; a <= 60; a++) {
      if (a === 4 * b + s || a === n) continue;
      const o = run(level, [{ kind: "total", row: 0, n: a }, { kind: "check" }]);
      assert.ok(!o.ms.some((m) => m.kind === "misconception_consequence"), `${n}: ${a} named a mix-up`);
      assert.equal(o.ms.at(-1).kind, Math.abs(a - n) === 1 ? "near_miss" : "law_refused");
    }
  }
  for (const level of levels("keep")) {
    const p = level.params, B = p.counts.reduce((a, c) => a + Math.floor(c / 5), 0);
    const named = (acts) => run(level, acts).ms.find((m) => m.kind === "misconception_consequence");
    // the main form (judges, round 1): the bundles drawn right, each total counted off its standing lines → named
    const r = run(level, L.malActs(level, "tally-four"));
    p.counts.forEach((c, k) => {
      assert.ok(isTallyOf(text(r.s.marks[k]), c), "keep (counted): the strokes are a true tally");
      assert.equal(r.s.totals[k], c - Math.floor(c / 5), "each total short by exactly its row's bundles");
    });
    const mc = r.ms.find((m) => m.kind === "misconception_consequence");
    assert.equal(mc.facts.sign, "counted"); assert.equal(mc.facts.bundles, B); assert.equal(mc.facts.gap, B);
    assert.equal(r.s.sign, "counted"); assert.equal(L.facts(level, r.s).sign, "counted");
    // the same totals with no line across drawn → named "five" (ruling 4: no line across anywhere is the second sign,
    // whatever the totals); so is a tally with no line across and any other totals
    assert.equal(named(tallyFourActs(p, "plain"))?.facts.sign, "five");
    const odd = tallyFourActs(p, "five").map((a) => (a.kind === "total" ? { ...a, n: a.n + 3 } : a));
    assert.equal(named(odd)?.facts.sign, "five", "no line across, totals off by 3: still five");
    // the kit's second sign: five written as five standing lines, the totals right → named, "five"
    const five = run(level, tallyFourActs(p, "five")), m5 = five.ms.find((m) => m.kind === "misconception_consequence");
    assert.equal(m5?.facts.sign, "five"); assert.equal(m5.facts.crossesMissing, B); assert.equal(m5.facts.bundles, 0); assert.equal(m5.facts.gap, B);
    p.counts.forEach((c, k) => assert.equal(groupsOf(five.s.marks[k]).filter((g) => g.kind === "five").length, Math.floor(c / 5)));
    // every one-bundle slip (one total 5 short, 5 over, 1 off; the strokes right, or with one line across missing): never named
    const right = L.solve(level).filter((a) => a.kind === "mark");
    let firstCross = right.findIndex((a) => a.across);
    const oneMissing = right.map((a, i) => (i === firstCross ? { ...a, across: false } : a));
    for (const marks of [right, oneMissing]) for (let k = 0; k < p.counts.length; k++) for (const d of [-5, 5, -1, 1]) {
      const totals = p.counts.map((c, j) => (j === k ? c + d : c));
      if (totals.some((t) => t < 0 || t > 99)) continue;
      const acts = [...marks, ...totals.map((n, j) => ({ kind: "total", row: j, n })), { kind: "check" }];
      assert.ok(!named(acts), `${level.levelId}: a slip of ${d} on row ${k} was named tally-four`);
    }
    // one line across missing with the totals right (a slip of the hand, not the belief): an ordinary miss, not bundled
    const slip = [...oneMissing, ...p.counts.map((n, j) => ({ kind: "total", row: j, n })), { kind: "check" }];
    assert.ok(!named(slip)); assert.equal(run(level, slip).ms.at(-1).facts.why, "not_bundled");
  }
});

// ───────────────────────────── gate 2: the evidence rule, proved (night rulings 2026-11-11) ─────────────────────────────
// Law 3's number: an act that a blind guess or one ordinary slip produces more than 1 time in 10 names nothing by itself.
// keep names tally-four from one level; read only when its number is typed on two levels whose bundles AND loose lines
// both differ. Everything below is worked out here, from the tally, the pad as the view lays it out, and the ways of
// reading a tally; not from the law's code. The packet's "Gate 2: evidence" tables are printed from these functions
// (gate2Tables; with TALLY_GATE2_PRINT=<file> the read test writes them to that file as JSON).
//
// The pad: its keys in the order the view gives them (typedtotal.ts totalPad), in the grid play.css lays them out in.
const PAD_KEYS = totalPad(null, () => {}).map((c) => c.label);
const PAD_COLS = Number(/\.pl-row--pad\s*\{[^}]*repeat\((\d+)/.exec(readFileSync(`${ROOT}src/play/play.css`, "utf8"))[1]);
const padAt = (k) => { const i = PAD_KEYS.indexOf(k); return [Math.floor(i / PAD_COLS), i % PAD_COLS]; };
/** the digit keys touching a key (side or corner): a finger that lands one key off */
const padNear = (d) => PAD_KEYS.filter((k) => /^\d$/.test(k) && k !== d && Math.max(Math.abs(padAt(k)[0] - padAt(d)[0]), Math.abs(padAt(k)[1] - padAt(d)[1])) === 1);
/** one typing slip on the number she means to type (0..99): one key one off, the two digits swapped, one key not
 *  registered, one key pressed twice. Each listed way, the ones that change nothing left out. */
const typos = (v) => {
  const t = String(v), out = [];
  for (let i = 0; i < t.length; i++) for (const k of padNear(t[i])) out.push(Number(t.slice(0, i) + k + t.slice(i + 1)));
  if (t.length === 2) { if (t[0] !== t[1]) out.push(Number(t[1] + t[0])); out.push(Number(t[0]), Number(t[1])); }
  else out.push(Number(t + t));
  return out.filter((x) => x !== v && x <= 99);
};
/** the ways of reading a whole tally of b bundles and s loose lines: the right one and seven others. A way of reading is
 *  how she reads, the same on every level and every row. `strokes`: it counts the strokes of a bundle one by one */
const WAYS = {
  right: { of: (b, s) => 5 * b + s, strokes: true }, "loose lines dropped": { of: (b) => 5 * b, strokes: true },
  "loose lines doubled": { of: (b, s) => 5 * b + 2 * s, strokes: true }, "line across as a sixth": { of: (b, s) => 6 * b + s, strokes: true },
  "lines across alone": { of: (b) => b }, "each group as one": { of: (b, s) => b + s }, "each bundle as ten": { of: (b, s) => 10 * b + s }, "loose lines alone": { of: (_b, s) => s },
};
/** one counting slip, read her way: a bundle skipped or counted twice, a loose line missed or counted twice, a stroke of
 *  a bundle missed or counted again (when her way counts them). Each listed way, the ones that change nothing left out. */
const countSlips = (w, b, s) => {
  const v = w.of(b, s), out = [w.of(b + 1, s)];
  if (b >= 1) out.push(w.of(b - 1, s));
  if (s >= 1) out.push(w.of(b, s - 1), w.of(b, s + 1));
  if (w.strokes && b >= 1) out.push(v - 1, v + 1);
  return out.filter((x) => x !== v && x >= 0);
};
const share = (xs, t) => (xs.length ? xs.filter((x) => x === t).length / xs.length : 0);
/** the chance that ONE ordinary slip, read her way, gives `target` on a row of n: 1 if her way gives it with no slip;
 *  else the larger of the share of counting slips and the share of typing slips that land on it */
const slipChance = (w, n, target) => {
  const b = Math.floor(n / 5), s = n % 5, v = w.of(b, s);
  return v === target ? 1 : Math.max(share(countSlips(w, b, s), target), share(typos(v), target));
};
const mixup = (n) => n - Math.floor(n / 5);
const BLIND = 1 / 100;   // a blind guess on the pad: any of 0..99, the box takes two digits
/** the fewest ordinary slips that make her row of n come out as `target`, read her way (3 = three or more) */
const typeSteps = (v, t) => (v === t ? 0 : typos(v).includes(t) ? 1 : typos(v).some((x) => typos(x).includes(t)) ? 2 : 3);
const slipsTo = (w, n, target) => {
  const b = Math.floor(n / 5), s = n % 5;
  let best = 3;
  for (let db = -2; db <= 2; db++) for (let ds = -4; ds <= 4; ds++) for (let e = -3; e <= 3; e++) {
    const cost = Math.abs(db) + Math.abs(ds) + Math.abs(e);
    if (cost >= best || b + db < 0 || s + ds < 0 ||(e !== 0 && (!w.strokes || b === 0))) continue;
    best = Math.min(best, cost + typeSteps(w.of(b + db, s + ds) + e, target));
  }
  return best;
};
/** read: one level's row and every pair of servable levels whose bundles and loose lines both differ */
function readTable(ns) {
  const one = ns.map((n) => {
    const by = Object.fromEntries(Object.entries(WAYS).map(([k, w]) => [k, slipChance(w, n, mixup(n))]));
    const [way, p] = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
    return { n, b: Math.floor(n / 5), s: n % 5, mixup: mixup(n), by, way, p };
  });
  let worst = { p: 0 }, pairs = 0;
  for (const x of one) for (const y of one) {
    if (x.n >= y.n || x.b === y.b || x.s === y.s) continue;
    pairs++;
    // the same way of reading on both levels, a slip on each, independently
    for (const k of Object.keys(WAYS)) { const p = x.by[k] * y.by[k]; if (p > worst.p) worst = { p, a: x.n, b: y.n, way: k, pa: x.by[k], pb: y.by[k] }; }
  }
  return { one, pairs, worst, blindPair: BLIND * BLIND };
}
/** keep: on a level, every way her totals can all come out as the mix-up's: the fewest slips (a way of reading other
 *  than the right one counts as one step, once for the level), a blind guess, and one slip in every row */
function keepRow(counts, things) {
  const want = counts.map(mixup);
  let fewest = Infinity, fewestWay = null, perRow = 0, perRowWay = null;
  for (const [k, w] of Object.entries(WAYS)) {
    const steps = (k === "right" ? 0 : 1) + counts.reduce((a, c, r) => a + slipsTo(w, c, want[r]), 0);
    if (steps < fewest) { fewest = steps; fewestWay = k; }
    // one slip in each row (a row that is already the mix-up's needs none)
    const p = counts.reduce((a, c, r) => a * (w.of(Math.floor(c / 5), c % 5) === want[r] ? 1 : slipChance(w, c, want[r])), 1);
    if (p > perRow) { perRow = p; perRowWay = k; }
  }
  const groups = counts.reduce((a, c) => a + Math.floor(c / 5), 0);
  return { counts, mixup: want, fewest, fewestWay, perRow, perRowWay, rowSlips: counts.map((c, r) => slipsTo(WAYS.right, c, want[r])),
    // "counted": every total the mix-up's, typed blind; "five": no line across in the whole scene, each stroke one of
    // the two buttons at random (the rows' lengths right is a further chance, left out: the bound only grows)
    blindCounted: BLIND ** counts.length, fiveSlips: groups, blindFive: 0.5 ** things };
}
function gate2Tables() {
  const servedRead = new Set(), keep = new Map();
  for (const lv of levels("read", [1, 2, 3, 5, 7, 11, 42, 99, 123, 512, 777, 2024])) servedRead.add(lv.params.counts[0]);
  for (const lv of levels("keep", [1, 2, 3, 5, 7, 11, 42, 99, 123, 512, 777, 2024])) keep.set(lv.params.counts.join(","), keepRow(lv.params.counts, lv.params.seq.length));
  // every row the law can serve in read: each n in the fades' ranges that the level law takes
  const lo = Math.min(...Object.values(READ_RANGE).map((r) => r[0])), hi = Math.max(...Object.values(READ_RANGE).map((r) => r[1]));
  const read = levels("read", [3])[0], servable = [];
  for (let n = lo; n <= hi; n++) if (L.validate({ ...read, params: { ...read.params, counts: [n] } })) servable.push(n);
  return { servedRead: [...servedRead].sort((a, b) => a - b), servable, read: readTable(servable), keep: [...keep.values()] };
}

test("gate 2, keep: on EVERY generated level her totals need three ordinary slips or more to come out as the mix-up's, and a blind guess gives them under 1 in 10 (law 3)", () => {
  const { keep } = gate2Tables();
  assert.ok(keep.length >= 60, `${keep.length} keep levels`);
  for (const k of keep) {
    const id = k.counts.join(",");
    assert.ok(k.fewest >= 3, `${id}: the mix-up's totals ${k.mixup} are ${k.fewest} slips away (${k.fewestWay})`);
    assert.ok(k.blindCounted < 0.1 && k.blindCounted <= 1e-4, `${id}: blind ${k.blindCounted}`);
    assert.ok(k.fiveSlips >= 3 && k.blindFive < 0.1, `${id}: "five" from ${k.fiveSlips} missing lines across, blind ${k.blindFive}`);
    assert.ok(k.perRow <= 0.1, `${id}: one slip in every row gives the mix-up's totals ${k.perRow} (${k.perRowWay})`);
  }
  // the proof's own pieces, on cases worked by hand: the pad's 9 and 0 touch (49 → 40 is one slip, round 4, judge 2);
  // 14 → 12 is two slips; a row of 7 is one slip from 6
  assert.ok(typos(49).includes(40)); assert.ok(!typos(14).includes(12));
  assert.equal(slipsTo(WAYS.right, 14, 12), 2); assert.equal(slipsTo(WAYS.right, 7, 6), 1); assert.equal(slipsTo(WAYS.right, 49, 40), 1);
  assert.deepEqual(PAD_KEYS.slice(0, 10), ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]); assert.equal(PAD_COLS, 6);
  // the keep law that makes it three: bundles in one row only, a row of 12 (2 + 2), rows of one bundle only are refused
  const k3 = levels("keep", [3]).find((lv) => lv.params.cats.length === 3);
  const kv = (counts) => L.validate({ ...k3, params: { ...k3.params, cats: k3.params.cats.slice(0, counts.length), counts, seq: counts.flatMap((c, r) => Array(c).fill(r)) } });
  for (const counts of [[13, 4], [12, 5], [7, 8], [5, 3, 9], [5, 7, 9]]) assert.equal(kv(counts), null, String(counts));
  assert.ok(kv([10, 5]) && kv([5, 13, 2]), "a row of two bundles beside a row of one is served");
  // and those it refuses are the ones under three: one bundle a row is two slips; bundles in one row only, two
  assert.equal(keepRow([7, 8], 15).fewest, 2); assert.equal(keepRow([13, 4], 17).fewest, 2);
});

test("gate 2, read: one level names nothing (its one-slip chance can pass 1 in 10); two levels whose bundles and loose lines both differ: ≤ 1 in 10 over every servable pair", () => {
  const t = gate2Tables(), { one, worst, pairs, blindPair } = t.read;
  // every level the generator serves is one the proof covers
  for (const n of t.servedRead) assert.ok(t.servable.includes(n), `${n} served but not in the proof`);
  assert.ok(pairs >= 100, `${pairs} pairs`);
  // a way of reading alone never gives the mix-up's number on a servable level (the one the law keeps refusing:
  // the loose lines dropped when they equal the bundles, as on 18 and 24)
  for (const r of one) for (const [k, w] of Object.entries(WAYS)) assert.notEqual(w.of(r.b, r.s), r.mixup, `${r.n}: ${k} gives the mix-up's number`);
  // why one level is not enough: on some served levels one slip lands on the mix-up's number more than 1 time in 10
  assert.ok(one.some((r) => r.p > 0.1), "some level is over law 3's line alone");
  assert.ok(worst.p <= 0.1, `pair ${worst.a} & ${worst.b} (${worst.way}): ${worst.p}`);
  assert.ok(blindPair <= 0.1 && BLIND <= 0.1);
  // the law still refuses a level where a way of reading gives it: 18 and 24 (loose lines dropped)
  const read = levels("read", [3])[0];
  for (const c of [18, 24, 6, 12, 4]) assert.equal(L.validate({ ...read, params: { ...read.params, counts: [c] } }), null, String(c));
  // gate 2 serves again what the slip list refused: five bundles, bundles only
  for (const c of [25, 26, 27, 20, 40]) assert.ok(L.validate({ ...read, params: { ...read.params, counts: [c] } }), String(c));
  if (process.env.TALLY_GATE2_PRINT) writeFileSync(process.env.TALLY_GATE2_PRINT, JSON.stringify({ servable: t.servable, servedRead: t.servedRead, one, worst, pairs, keep: t.keep }));
});

test("gate 2: the read surface has two parts (bundles, loose lines); a repeat counts only when both differ", async () => {
  const { surfaceOf, surfacesDiffer } = await import("../server/play/levels.js");
  const read = levels("read", [3])[0], at = (n) => ({ ...read, params: { ...read.params, counts: [n] } });
  const S = (n) => surfaceOf(at(n));
  assert.ok(Array.isArray(S(17)) && S(17).length === 2);
  assert.ok(surfacesDiffer(S(17), S(23)), "3+2 then 4+3: both differ");
  assert.ok(!surfacesDiffer(S(17), S(19)), "the same bundles");
  assert.ok(!surfacesDiffer(S(17), S(22)), "the same loose lines");
  assert.ok(!surfacesDiffer(S(17), S(17)));
  // another family's one-key surface never counts against parts; one-key surfaces compare as before
  assert.ok(!surfacesDiffer(S(17), "abc")); assert.ok(surfacesDiffer("a", "b")); assert.ok(!surfacesDiffer("a", "a"));
  // the same params give the same parts (not tied to the scene's words or the row's kind)
  assert.deepEqual(surfaceOf({ ...at(17), params: { ...at(17).params, ctx: "traffic", cats: ["bus"] } }), S(17));
});

test("gate 2, the server's repeat rule with naming on: one read level names nothing; a second whose bundles and loose lines both differ names it; keep names from one level", async () => {
  const { nameOnRepeat, afterLevelBody } = await import("../server/play/levels.js");
  const { withNaming } = await import("../server/play/grade.js");
  const { signSession, verifySession } = await import("../server/play/session.js");
  const [eKeep, eRead] = TE(), KIT = "c4-maths-ch14-t01-m-tally-four";
  // served read levels (the server's own generator, the kit's ids), one per row count
  const byN = new Map();
  for (const fade of [1, 2, 3]) for (const child of ["a", "b", "c", "d", "e", "f", "g", "h"]) for (let k = 0; k < 4; k++) {
    const lv = levelsFor(sessionOf(eRead, { fade, childId: child, seed: seedOf(child, entryKey(eRead), k) }), eRead)?.garam;
    if (lv && !byN.has(lv.params.counts[0])) byN.set(lv.params.counts[0], lv);
  }
  const bsOf = (lv) => [Math.floor(lv.params.counts[0] / 5), lv.params.counts[0] % 5];
  const A = [...byN.values()][0], [ab, as] = bsOf(A);
  const both = [...byN.values()].find((lv) => bsOf(lv)[0] !== ab && bsOf(lv)[1] !== as);
  const sameB = [...byN.values()].find((lv) => lv !== A && bsOf(lv)[0] === ab);
  const sameS = [...byN.values()].find((lv) => lv !== A && bsOf(lv)[1] === as);
  assert.ok(both && (sameB || sameS), `levels served: ${[...byN.keys()]}`);
  // the server path with naming ON for stambh/tally: gradeActs → lessonEvidence → nameOnRepeat, and afterLevelBody
  // remembers the pick (routes.js; withNaming is the flag's only reader, and with naming on it returns the grade unchanged)
  const mal = (lv) => gradeActs(lv, env(L.malActs(lv, "tally-four")), { final: true });
  const s0 = sessionOf(eRead);
  const gA = mal(A), rowsA = nameOnRepeat(lessonEvidence(gA.grade, A), s0, A);
  assert.equal(rowsA[0].outcome, "incorrect");
  assert.equal(rowsA[0].misconceptionId, undefined, "one read level names nothing"); assert.equal(rowsA[0].chanceMis, undefined, "nor carries the pick");
  assert.equal(gA.trail.mal.length, 0, "nor is it in the trail"); assert.equal(gA.grade.facts.mal, undefined);
  const s1 = afterLevelBody(s0, { grade: gA.grade, level: A });
  assert.equal(s1.chance.at(-1).mis, KIT); assert.ok(Array.isArray(s1.chance.at(-1).surface));
  // the session token carries the remembered parts
  const key = Buffer.alloc(32, 7), s1b = verifySession(signSession(s1, { key }), { key });
  assert.deepEqual(s1b.chance, s1.chance);
  const named = nameOnRepeat(lessonEvidence(mal(both).grade, both), s1b, both);
  assert.equal(named[0].misconceptionId, KIT, `${A.params.counts[0]} then ${both.params.counts[0]}: named on the repeat`);
  assert.equal(named[0].named, "repeat"); assert.equal(named[0].weight, GAME_WEIGHT);
  for (const lv of [sameB, sameS, A].filter(Boolean)) {
    const r = nameOnRepeat(lessonEvidence(mal(lv).grade, lv), s1b, lv);
    assert.equal(r[0].misconceptionId, undefined, `${A.params.counts[0]} then ${lv.params.counts[0]}: one part the same, not named`);
  }
  // a different wrong number on the second level is an ordinary miss, never named
  const other = gradeActs(both, env([{ kind: "total", row: 0, n: both.params.counts[0] + 2 }, { kind: "check" }]), { final: true });
  assert.equal(nameOnRepeat(lessonEvidence(other.grade, both), s1b, both)[0].misconceptionId, undefined);
  // keep: named from one level, with no repeat
  const K = levelsFor(sessionOf(eKeep), eKeep)?.garam;
  const kRows = nameOnRepeat(lessonEvidence(mal(K).grade, K), sessionOf(eKeep), K);
  assert.equal(kRows[0].misconceptionId, KIT); assert.equal(kRows[0].weight, GAME_WEIGHT);
  // as served today: the flag main switches (shared/play.ts NAMING_OFF). Off: nothing is remembered or named, keep or
  // read; on: the path above
  const served = (lv, s) => { const g = withNaming(lv, mal(lv)); return { rows: nameOnRepeat(lessonEvidence(g.grade, lv), s, lv), s2: afterLevelBody(s, { grade: g.grade, level: lv }) }; };
  const a = served(A, s0), b = served(both, a.s2), k = served(K, sessionOf(eKeep));
  if (namingOn("stambh", "tally")) {
    assert.equal(a.rows[0].misconceptionId, undefined); assert.equal(b.rows[0].misconceptionId, KIT); assert.equal(k.rows[0].misconceptionId, KIT);
  } else {
    assert.equal(a.s2.chance, undefined, "naming off: nothing remembered");
    for (const r of [a.rows[0], b.rows[0], k.rows[0]]) { assert.equal(r.misconceptionId, undefined); assert.equal(r.chanceMis, undefined); }
  }
});

test("stambh/tally: the law's rules (every stroke legal; groups by five at the check; the scene first; the totals; undo)", () => {
  const level = levels("keep", [3])[0], p = level.params;
  let s = L.init(level);
  const ap = (a) => { const r = L.apply(level, s, a, 1); if (!r.refused) s = r.state; return r.refused; };
  assert.equal(ap({ kind: "check" }), "scene_first");
  assert.equal(ap({ kind: "total", row: 0, n: 3 }), "scene_first");
  assert.equal(ap({ kind: "mark", row: 9 }), "bad_row");
  assert.equal(ap({ kind: "mark", row: 0, across: true }), undefined, "a line across with nothing under it is a legal mark");
  assert.equal(s.marks[0].length, 1); assert.equal(s.at, 1);
  assert.equal(ap({ kind: "undo" }), undefined); assert.equal(s.marks[0].length, 0); assert.equal(s.at, 0);
  for (let i = 0; i < p.seq.length; i++) assert.equal(ap({ kind: "mark", row: 0 }), undefined);
  assert.equal(ap({ kind: "mark", row: 0 }), "none_left");
  assert.equal(ap({ kind: "check" }), "fill_first");
  assert.equal(ap({ kind: "total", row: 0, n: 100 }), "bad_number");
  assert.equal(ap({ kind: "total", row: 0, n: 2.5 }), "bad_number");
  assert.equal(ap({ kind: "total", row: 0, n: 7 }), undefined);
  assert.equal(ap({ kind: "total", row: 0, n: null }), undefined); assert.equal(s.totals[0], null);
  // the server's sanitiser drops a null: a cleared cell arrives with n absent and still clears
  const [sanitized] = sanitizeActs([{ seq: 1, t: 0, act: { kind: "total", row: 0, n: null } }]);
  assert.equal(ap({ kind: "total", row: 0, n: 7 }), undefined);
  assert.equal(ap(sanitized.act), undefined); assert.equal(s.totals[0], null);
  // the groups: four standing and one across = a bundle; five standing = no bundle; a line across after two = no bundle
  assert.deepEqual(groupsOf([false, false, false, false, true, false, false]).map((g) => g.kind), ["bundle", "open"]);
  assert.deepEqual(groupsOf(Array(7).fill(false)).map((g) => g.kind), ["five", "open"]);
  assert.deepEqual(groupsOf([false, false, true, false]).map((g) => g.kind), ["short", "open"]);
  assert.deepEqual(groupsOf(tallyOf(12)).map((g) => g.kind), ["bundle", "bundle", "open"]);
  // keep it again: only once the scene has passed; strokes and totals clear, the scene starts over; undo brings them back
  const k2 = levels("keep", [5])[0];
  let s2 = L.init(k2);
  assert.equal(L.apply(k2, s2, { kind: "again" }, 1).refused, "scene_first");
  for (const a of L.solve(k2).filter((x) => x.kind !== "check")) s2 = L.apply(k2, s2, a, 1).state;
  const kept = s2;
  s2 = L.apply(k2, s2, { kind: "again" }, 1).state;
  assert.equal(s2.at, 0); assert.ok(s2.marks.every((m) => m.length === 0)); assert.ok(s2.totals.every((t) => t === null));
  s2 = L.apply(k2, s2, { kind: "undo" }, 1).state;
  assert.deepEqual(s2.marks, kept.marks); assert.deepEqual(s2.totals, kept.totals); assert.equal(s2.at, kept.at);
  const read = levels("read", [3])[0];
  assert.equal(L.apply(read, L.init(read), { kind: "mark", row: 0 }, 1).refused, "given");
  assert.equal(L.apply(read, L.init(read), { kind: "again" }, 1).refused, "given");
  assert.deepEqual(hiddenOf(read), [read.params.counts[0]], "the teacher never says the count first");
  assert.deepEqual(hiddenOf(level), [...new Set(p.counts)]);
});

test("stambh/tally: tampered params are refused", () => {
  const k = levels("keep", [6])[0], r = levels("read", [6])[0];
  const bad = (lv, patch) => ({ ...lv, params: { ...lv.params, ...patch } });
  for (const [lv, patch] of [
    [k, { counts: k.params.counts.map((c) => c + 1) }], [k, { seq: [...k.params.seq, 0] }], [k, { seq: k.params.seq.map(() => 9) }], [k, { ctx: "casino" }],
    [k, { cats: k.params.cats.map(() => "car") }], [k, { goal: "win" }], [k, { counts: k.params.counts.map(() => 2), seq: k.params.cats.flatMap((_, i) => [i, i]) }],
    [k, { cats: [k.params.cats[0]], counts: [k.params.counts[0]], seq: k.params.seq.filter((x) => x === 0) }],
    [r, { counts: [3] }], [r, { counts: [99] }], [r, { counts: [7.5] }], [r, { seq: [0] }], [r, { cats: ["car", "bus"], counts: [6, 6] }],
  ]) assert.equal(L.validate(bad(lv, patch)), null, JSON.stringify(patch).slice(0, 80));
  assert.equal(L.validate({ ...k, mode: "bars" }), null);
  assert.equal(L.validate({ ...k, params: null }), null);
});

test("stambh/tally: a verdict field in an act never decides; the first check decides the evidence; grade replays", () => {
  for (const level of [levels("read", [4])[0], levels("keep", [4])[0]]) {
    const forged = L.grade(level, env([{ kind: "check", solved: true, verdict: "solved" }, { kind: "total", row: 0, n: 1, correct: true }]));
    assert.notEqual(forged.verdict, "solved");
    const ok = L.grade(level, env(L.solve(level)));
    assert.equal(ok.verdict, "solved"); assert.equal(ok.evidence[0].outcome, "correct"); assert.ok(ok.clean);
    const wrong = [...L.malActs(level, "tally-four"), { kind: "undo" }, ...L.solve(level).filter((a) => a.kind === "total" || a.kind === "check")];
    const g = L.grade(level, env(wrong));
    assert.equal(g.evidence[0].outcome, "incorrect");
    assert.equal(g.evidence[0].misconceptionId ?? g.evidence[0].chanceMis, "k-tally-four");
    assert.equal(g.evidence[0].misconceptionId === undefined, level.params.goal === "read", "read: a pick (gate 2); keep: named");
    assert.deepEqual(L.grade(level, env(wrong)), g);
  }
});

for (const goal of ["keep", "read"]) {
  test(`stambh/tally/${goal}: ≥ 2000 random acts; a check is solved ⇔ the oracle, named tally-four ⇔ its signature; never throws; generator work bounded (counted)`, () => {
    let seed = 11, acts = 0, solved = 0, named = 0, ordinary = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const counts = [];
    for (let g = 0; g < 30; g++) {
      const cands = L.generate(req(goal, 300 + g, { fade: 1 + (g % 3) }));
      counts.push(cands.length);
      for (const c of cands.slice(0, 3)) {
        const level = L.validate(c.level), rows = level.params.cats.length;
        // a third of the walks pursue the solve, a third one of tally-four's forms, a third wander; each with noise
        const mode = rnd(), forms = goal === "keep" ? ["counted", "five", "plain"] : ["counted"];
        const sol = mode < 0.34 ? L.solve(level) : mode < 0.67 ? tallyFourActs(level.params, forms[Math.floor(rnd() * forms.length)]) : null;
        let s = L.init(level), k = 0;
        for (let i = 0; i < 120 && !s.done; i++) {
          const r = rnd(), row = Math.floor(rnd() * (rows + 1));
          const a = sol ? (r < 0.8 && k < sol.length ? sol[k++] : r < 0.86 ? { kind: "mark", row, across: rnd() < 0.3 } : r < 0.92 ? { kind: "total", row, n: Math.floor(rnd() * 20) } : r < 0.96 ? { kind: "undo" } : { kind: "check", solved: true })
            : r < 0.45 ? { kind: "mark", row, across: rnd() < 0.25 } : r < 0.7 ? { kind: "total", row, n: rnd() < 0.1 ? null : Math.floor(rnd() * 30) } : r < 0.83 ? { kind: "check" } : r < 0.97 ? { kind: "undo" } : { kind: "again" };
          const before = s, out = L.apply(level, s, a, i + 1);
          acts++;
          if (a.kind === "check" && !["scene_first", "fill_first", "level_over"].includes(out.refused)) {
            assert.equal(out.state.done, oracle(level, before), `${level.levelId}: law and oracle disagree`);
            const isNamed = out.moments.some((m) => m.kind === "misconception_consequence" && m.misconceptionId === "tally-four");
            assert.equal(isNamed, !out.state.done && signature(level, before), `${level.levelId}: named ${isNamed} for ${JSON.stringify(before.totals)} ${before.marks.map(text).join(" ")}`);
            if (isNamed) named++; else if (!out.state.done) ordinary++;
          }
          s = out.state;
        }
        if (L.goalMet(level, s)) { solved++; assert.ok(oracle(level, s)); }
      }
    }
    assert.ok(acts >= 2000, `only ${acts} acts`);
    assert.ok(solved > 0 && named > 0 && ordinary > 0, `solved ${solved}, named ${named}, ordinary misses ${ordinary}`);
    assert.ok(Math.max(...counts) <= 48, `${Math.max(...counts)} candidates per call (measured 2026-11-11: 16; bound is 3x)`);
  });
}

test("stambh/tally: ten bundles (and four) fit a 360 px row; the flow never leaves its box", () => {
  // the height the lines take: one line, the box; two or more, the strokes and the pitch between them
  const span = (f) => (f.lines > 1 ? f.sh + f.lineH * (f.lines - 1) : f.lineH);
  // the read row at the 360 phone's play box (324 px world, 16 px margins) and the keep row's tally box at 360
  for (const [width, height] of [[292, 96], [168, 40], [140, 52], [700, 220]]) {
    for (const n of [1, 5, 9, 23, 50, 54]) for (const grouped of [false, true]) {
      const marks = tallyOf(n), f = tallyFlow(marks, width, height, grouped);
      assert.equal(f.stand.length + f.across.length, n);
      assert.ok(f.right <= width + 0.01, `${n} at ${width}: right ${f.right}`);
      assert.ok(span(f) <= height + 0.01, `${n} at ${width}x${height}: ${f.lines} lines of ${f.lineH}`);
      for (const a of f.across) assert.ok(a.x0 >= 0 && a.x1 <= width);
    }
  }
  const ten = tallyFlow(tallyOf(50), 292, 96, false);
  assert.ok(ten.sp >= 5 && ten.sh >= 16, `ten bundles at 360: spacing ${ten.sp}, height ${ten.sh}`);
  // the largest served rows at 360 (judges, round 1: Auto 7 had wrapped): a keep row of KEEP_ROW_MAX strokes in the keep
  // tally box (126 px wide, 70-150 px tall) lies on ONE line, as she drew it and as the law groups it; the largest read
  // row (READ_MAX) fits the read box with no group split across lines
  for (const height of [70, 100, 150]) for (const n of [5, 7, 9, 10, KEEP_ROW_MAX]) for (const grouped of [false, true]) {
    const f = tallyFlow(tallyOf(n), 126, height, grouped, 56);
    assert.equal(f.lines, 1, `keep ${n} at 126x${height} (${grouped ? "grouped" : "hers"}): ${f.lines} lines`);
    assert.ok(f.sp >= 8 && f.sh >= 22, `keep ${n}: spacing ${f.sp}, height ${f.sh}`);
  }
  for (const height of [96, 140, 220]) {
    const marks = tallyOf(READ_MAX), f = tallyFlow(marks, 292, height, false, 56);
    assert.ok(f.right <= 292.01 && span(f) <= height + 0.01);
    for (const g of groupsOf(marks)) {
      const lines = new Set([...f.stand, ...f.across.map((a) => ({ i: a.i, line: a.line }))].filter((q) => q.i >= g.from && q.i < g.from + g.len).map((q) => q.line));
      assert.equal(lines.size, 1, `read ${READ_MAX} at 292x${height}: a group split across lines`);
    }
  }
  // evening ruling 4: on two lines or more, half a stroke's height between the lines, and no loose line under a bundle
  for (const n of [21, 34, 41, 47, READ_MAX]) for (const height of [61, 96, 140, 220]) for (const width of [292, 260]) for (const band of [0, 21]) {
    const marks = tallyOf(n), f = tallyFlow(marks, width, height, false, 56, band);
    if (f.lines < 2) continue;
    assert.ok(span(f) <= height + 0.01 && f.lineH - f.sh >= band - 0.01, `read ${n}: the band between lines`);
    assert.ok(f.lineH - f.sh >= f.sh / 2 - 0.01, `read ${n} at ${width}x${height}: gap ${(f.lineH - f.sh).toFixed(1)} under half of ${f.sh.toFixed(1)}`);
    const looseFrom = n - (n % 5), xs = (line) => [...f.stand.filter((q) => q.line === line && q.i < looseFrom).map((q) => q.x), ...f.across.filter((a) => a.line === line).flatMap((a) => [a.x0, a.x1])];
    for (const q of f.stand.filter((q) => q.i >= looseFrom)) for (let l = 0; l < q.line; l++) {
      const above = xs(l);
      if (above.length) assert.ok(q.x > Math.max(...above) + f.sp * 0.5, `read ${n} at ${width}x${height}: a loose line at ${q.x.toFixed(0)} under a bundle on line ${l}`);
    }
  }
  // five standing lines without a cross, as she drew them, still fit
  const five = tallyFlow(Array(14).fill(false), 168, 40, true);
  assert.equal(five.stand.length, 14);
});

test("stambh/tally: the generator and the picker are fast (CPU time, p95 ≤ 50 ms)", () => {
  const gen = [], pick = [];
  for (const goal of ["keep", "read"]) for (const fade of [1, 2, 3]) for (let seed = 1; seed <= 8; seed++) {
    let t0 = cpuNow(); L.generate(req(goal, seed * 31, { fade })); gen.push(cpuNow() - t0);
    t0 = cpuNow(); pickLevels(L, req(goal, seed * 31, { fade })); pick.push(cpuNow() - t0);
  }
  for (const [name, xs] of [["generate", gen], ["pick", pick]]) { xs.sort((a, b) => a - b); const p95 = xs[Math.floor(xs.length * 0.95)]; assert.ok(p95 <= 50, `${name} p95 ${p95.toFixed(1)} ms`); }
});

test("stambh/tally: registered (MODES, logic, view, a verb that never chooses); the words in three languages; no clock, randomness or colour literal", () => {
  assert.deepEqual([...MODES.stambh], ["bars", "picto", "tally"]);
  assert.equal(LOGIC["stambh/tally"], L);
  assert.equal(LOGIC["stambh/picto"], stambhLogic);
  const v = playActOf("stambh", "tally");
  assert.ok(v && v.hi && v.en && v.act !== "choose");
  const views = readFileSync(`${ROOT}src/play/families/views.ts`, "utf8");
  assert.match(views, /"stambh\/tally": makeTallyView/);
  const words = JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words, keys = Object.keys(words);
  const first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
  const view = readFileSync(`${ROOT}src/play/families/stambh/tally.view.ts`, "utf8");
  const used = [...view.matchAll(/"(stambh\.[a-zA-Z0-9.]+)"/g)].map((m) => m[1]);
  const extra = Object.keys(TALLY_CONTEXTS).map((c) => `stambh.ctx.${c}`).concat(Object.values(TALLY_CONTEXTS).flat().map((c) => `stambh.cat.${c}`));
  assert.ok(used.length >= 4);
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) assert.ok(words[k]?.[l], `${k} ${l}`);
  // the words never state the rule, the answer or where a stroke goes (no five, no "across" / "standing" instruction)
  for (const k of [...used, ...extra]) for (const l of ["hinglish", "en", "hi"]) assert.doesNotMatch(words[k][l], /\d|\bfive\b|paanch|पाँच|\bacross\b|\bcross\b|khadi|tirchi|bundle/i, `${k} ${l}`);
  const src = readFileSync(`${ROOT}src/play/families/stambh/tally.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(src, /Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
  assert.doesNotMatch(view.replace(/\/\/.*$/gm, ""), /Math\.random|Date\.now|setTimeout|setInterval|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  // the view draws no string but words, her own numbers and the "0" of the number line
  const literals = [...view.replace(/\/\/.*$/gm, "").matchAll(/P\.(?:text|textFit|chip)\(c, ("[^"]*")/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(literals)].sort(), ['"0"', '"="'].sort());
});

// the play server: both tally entries serve a proven level at every fade, through the same picker a lesson uses
const TE = () => coverage().entries.filter((e) => e.family === "stambh" && e.mode === "tally");
const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("stambh/tally coverage: keep and read on c4-maths-ch14-t01 s1, mapped to the kit's tally-four; picto keeps s2 / s3", () => {
  const es = TE();
  assert.deepEqual(es.map((e) => `${e.topicId}|${e.goal}|${e.skillIds.join(",")}`), ["c4-maths-ch14-t01|keep|c4-maths-ch14-t01-s1", "c4-maths-ch14-t01|read|c4-maths-ch14-t01-s1"]);
  for (const e of es) assert.deepEqual(e.misMap, { "tally-four": "c4-maths-ch14-t01-m-tally-four" });
  assert.ok(hasPlay("c4-maths-ch14-t01-s1"));
  assert.equal(entryFor({ skillId: "c4-maths-ch14-t01-s1" }).mode, "tally");
  for (const sk of ["s2", "s3"]) assert.equal(entryFor({ skillId: `c4-maths-ch14-t01-${sk}` }).mode, "picto");
  assert.equal(entryFor({ topicId: "c4-maths-ch14-t01" }).mode, "picto", "the topic's first entry is still the pictograph");
  const picto = coverage().entries.find((e) => e.topicId === "c4-maths-ch14-t01" && e.mode === "picto");
  const lv = currentLevel(sessionOf(picto), picto);
  assert.ok(lv && stambhLogic.validate(lv), "the picto entry still serves");
});

for (const e of TE()) for (const fade of [1, 2, 3]) {
  test(`stambh/tally server ${e.goal} fade ${fade}: a proven level; solve grades solved; tally-four folds its kit id; the facts row says bundles`, () => {
    const seen = new Set();
    for (const child of ["c1", "c2", "c3", "c4"]) {
      const s = sessionOf(e, { fade, childId: child, seed: seedOf(child, entryKey(e), 0) });
      const level = levelsFor(s, e)?.garam;
      assert.ok(level, "no level");
      seen.add(level.levelId);
      assert.equal(level.mode, "tally"); assert.equal(level.goal, e.goal); assert.equal(level.params.labels, fade);
      assert.ok(level.proof.solvable && level.proof.shortcutFree);
      assert.deepEqual(level.proof.discriminates, ["c4-maths-ch14-t01-m-tally-four"]);
      const g = gradeActs(level, env(L.solve(level)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      const rows = lessonEvidence(g.grade, level);
      assert.equal(rows[0].outcome, "correct"); assert.equal(rows[0].weight, GAME_WEIGHT); assert.equal(rows[0].skillId, "c4-maths-ch14-t01-s1");
      const row = playFactsRow({ game: "stambh/tally", verdict: g.grade.verdict, first_try: 1, misses: 0, chose: "pick_fit", next: "fade_up", ...g.grade.facts });
      const want = e.goal === "read" ? Math.floor(level.params.counts[0] / 5) : level.params.counts.reduce((a, c) => a + Math.floor(c / 5), 0);
      assert.match(row, new RegExp(`(^| )bundles=${want}( |$)`), row);
      const mg = gradeActs(level, env(L.malActs(level, "tally-four")), { final: true });
      const mrow = playFactsRow({ game: "stambh/tally", verdict: mg.grade.verdict, first_try: 0, misses: 1, chose: "pick_fit", next: "fade_up", ...mg.grade.facts });
      if (e.goal === "keep") {
        assert.equal(mg.grade.evidence[0].misconceptionId, "c4-maths-ch14-t01-m-tally-four");
        assert.match(mrow, / mal=tally-four/, mrow); assert.match(mrow, / sign=counted/, mrow);
      } else {
        // gate 2: one read level is a pick (chanceMis at chance weight); its facts row says nothing about the mix-up
        assert.equal(mg.grade.evidence[0].misconceptionId, undefined); assert.equal(mg.grade.evidence[0].chanceMis, "c4-maths-ch14-t01-m-tally-four");
        assert.doesNotMatch(mrow, /mal=|sign=/, mrow);
      }
      assert.match(mrow, / answer=[\d,]+/, mrow);
    }
    assert.ok(seen.size >= 2, `${seen.size} distinct levels over 4 children`);
  });
}

// ───────────────────────────── round 2 rulings on the real view (headless; server/forge3/qa/laws.mjs mounts it) ─────────────────────────────
test("stambh/tally view (round 2): the five state points only at Phir se rakho, Jaancho waits, no tick on wrong marks; a row's tick needs marks AND total", async () => {
  const { _mount } = await import("../server/forge3/qa/laws.mjs");
  const { word } = await import("../src/play/engines/words.ts");
  for (const level of levels("keep", [1, 7, 42])) {
    const p = level.params;
    // the five state: no line across anywhere, every total right
    const m = await _mount(level);
    for (const a of tallyFourActs(p, "five")) m.ctl.dispatch(a);
    let f = m.look();
    const ticks = (x) => x.uses.filter((u) => u.op === "tick").length;
    // (look draws five frames) a tick only on the rows under five, whose marks and totals are both right
    assert.equal(ticks(f), 5 * p.counts.filter((c) => c < 5).length, `${level.levelId}: no tick on a row whose marks are wrong`);
    assert.equal(f.last.goal, word("hinglish", "stambh.goal.again"), "the line points only at keeping the tally again");
    let ctl = m.view.controls();
    assert.ok(ctl.find((c) => c.id === "done").disabled, "Jaancho waits until something changes");
    assert.ok(ctl.find((c) => c.id === "again").you, "Phir se rakho is her move");
    assert.ok(!ctl.find((c) => c.id === "done").you);
    assert.ok(!f.uses.some((u) => u.role === "good" && u.op !== "tick"), "no green but ticks");
    // a change wakes Jaancho: a total edited
    m.ctl.dispatch({ kind: "total", row: 0, n: p.counts[0] + 1 });
    ctl = m.view.controls();
    assert.ok(!ctl.find((c) => c.id === "done").disabled, "Jaancho is back once something changed");
    // the counted state: the rows under five (no bundle) are right, marks and total: ticked; the rest dashed, no tick
    const k = await _mount(level);
    for (const a of L.malActs(level, "tally-four")) k.ctl.dispatch(a);
    f = k.look();
    assert.equal(ticks(f) > 0, p.counts.some((c) => c < 5), "a right row is ticked");
    assert.equal(f.last.goal, word("hinglish", "stambh.goal.totals"), "marks right, totals off: change a total");
    assert.ok(f.uses.filter((u) => u.op === "body:selected").every((u) => u.role === "focus"), "selection is the focus colour");
    // evening ruling 2: the count plays over each bundle and fades; nothing stays over the tally while a try remains
    assert.ok(f.uses.some((u) => u.op === "text" && u.role === "look" && u.s === "5"), "the count reaches 5 over a bundle while it plays");
    const later = k.look();
    assert.deepEqual(later.uses.filter((u) => u.op === "text" && u.role === "look"), [], "no digit stays over the tally");
  }
});

test("stambh/tally view (round 2): read's miss counts over each bundle on the tally; the line has no unit ticks, no place, no hops", async () => {
  const { _mount } = await import("../server/forge3/qa/laws.mjs");
  for (const level of levels("read", [1, 7, 42])) {
    const n = level.params.counts[0], b = Math.floor(n / 5);
    const m = await _mount(level);
    for (const a of L.malActs(level, "tally-four")) m.ctl.dispatch(a);
    const f = m.look(), last = m.look();
    const strokes = (x, role) => x.uses.filter((u) => u.op === "stroke" && u.role === role).length / 5;   // look() draws five frames
    // the count over each bundle: its digits in the mix-up colour, a 5 over each bundle while it plays (look's frames at
    // 0.05, 0.45, 1.55, 3.95 and 9.95 s), then it fades: nothing stays over the tally (evening ruling 2)
    const fives = f.uses.filter((u) => u.op === "text" && u.role === "look" && u.s === "5").length;
    assert.ok(fives >= b, `${level.levelId}: a 5 over each of the ${b} bundles while it plays (${fives})`);
    const after = last.uses.filter((u) => u.op === "text" && u.role === "look").map((u) => u.s);
    assert.deepEqual([...new Set(after)], [String(4 * b + (n % 5))], `${level.levelId}: after the play-out only her own number (on the line) is in the mix-up colour (${after})`);
    // a later miss: her dot on the line and nothing else, no arrow (evening ruling 3: the arrow after the first miss only)
    assert.equal(strokes(last, "ink2"), 3, "the first miss: the line and the arrow's two strokes");
    m.ctl.dispatch({ kind: "total", row: 0, n: n - 2 }); m.ctl.dispatch({ kind: "check" });
    const later = m.look();
    assert.equal(later.uses.filter((u) => u.op === "circle" && u.role === "look").length, 5, "her dot after a later miss (one a frame)");
    assert.equal(strokes(later, "ink2"), 1, "the line only: no arrow after a later miss");
    // the line: one stroke for the line, one for 0, two for the arrow (ink2 / ink3); every ink stroke is the tally's own
    assert.ok(strokes(last, "ink3") <= 1, "no unit ticks");
    assert.ok(strokes(last, "ink2") <= 3, `no hops (${strokes(last, "ink2")})`);
    assert.equal(strokes(last, "ink"), n, "no place drawn for the answer: every ink stroke is a tally stroke");
    assert.ok(!f.texts.includes(String(n)), "the answer is never written");
  }
});

test("stambh/tally view (round 2): a kind has one colour in both goals; a digit into a full box replaces it; one thing in the strip", async () => {
  const { _mount } = await import("../server/forge3/qa/laws.mjs");
  const roleOfKind = (uses) => uses.filter((u) => u.op === "color" && /^q\d$/.test(u.role)).map((u) => u.role);
  // read a kada tally and keep a bangles scene: Kada is q2 in both (its place in the scene)
  const read = levels("read", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).find((lv) => lv.params.cats[0] === "kada");
  assert.ok(read, "a kada read level");
  const r = (await _mount(read)).look();
  assert.deepEqual([...new Set(roleOfKind(r.uses))], ["q2"], "read: Kada drawn in q2");
  // keep: each row's kind in its scene colour (a two-row scene starting at Kada tells the scene colour from the row number)
  const keep = levels("keep", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).find((lv) => lv.params.ctx === "bangles" && lv.params.cats[0] === "kada");
  assert.ok(keep, "a bangles keep level starting at Kada");
  const want = keep.params.cats.map((c) => ["q1", "q2", "q3"][TALLY_CONTEXTS.bangles.indexOf(c)]);
  assert.deepEqual([...new Set(roleOfKind((await _mount(keep)).look().uses))].sort(), [...new Set(want)].sort(), "keep: each kind in its scene colour");
  // a digit into a full box starts it again
  const m = await _mount(read);
  m.ctl.dispatch({ kind: "total", row: 0, n: 23 });
  const k7 = m.view.controls().find((c) => c.id === "k7");
  assert.ok(k7 && !k7.disabled, "the keys stay on when the box is full");
  k7.onPress();
  assert.equal(m.ctl.state.totals[0], 7, "a digit typed into a full box replaces it");
  m.view.controls().find((c) => c.id === "k3").onPress();
  assert.equal(m.ctl.state.totals[0], 73);
});

// ───────────────────────────── gate 1 (night rulings, 2026-11-11) ─────────────────────────────
/** every read level the generator serves over many seeds and all three fades, and the largest (READ_MAX) */
const allRead = () => {
  const out = levels("read", Array.from({ length: 40 }, (_, i) => i * 13 + 1));
  const big = out.find((lv) => lv.params.labels === 3);
  out.push(L.validate({ ...big, levelId: `${big.levelId}-largest`, params: { ...big.params, counts: [READ_MAX] } }));
  return out;
};
/** her chip on the number line after a check of `hers`: its x (the chip is the lowest text of her number) */
const chipX = (m, hers) => {
  m.ctl.dispatch({ kind: "total", row: 0, n: hers }); m.ctl.dispatch({ kind: "check" });
  m.api.t += 3; m.frame();
  const t = m.api.P.audit.texts.filter((x) => x.s === String(hers)).sort((a, b) => b.y - a.y)[0];
  assert.ok(t, `her ${hers} on the line`);
  return t.x;
};

test("stambh/tally gate 1, ruling 1: the number line has one scale for the whole level, from the level's fade alone (a bigger number never moves left)", async () => {
  const { _mount } = await import("../server/forge3/qa/laws.mjs");
  // the scale: from the fade only, and every row that fade serves sits in the line's first half
  for (const f of [1, 2, 3]) {
    const end = numberLineEnd({ labels: f });
    assert.ok(end % 10 === 0 && end >= 2 * READ_RANGE[f][1], `fade ${f}: end ${end}`);
  }
  const levelsRead = allRead(), byFade = new Map();
  assert.ok(levelsRead.length >= 30, `${levelsRead.length} read levels`);
  const tries = [0, 3, 9, 12, 13, 14, 15, 20, 27, 34, 40, 41, 48, 55, 70, 85, 99];
  for (const level of levelsRead) {
    const p = level.params;
    assert.equal(numberLineEnd(p), numberLineEnd({ labels: p.labels }), "the end is the fade's");
    // in the view: her chip after each check, over a rising run of numbers, never stands left of the one before; inside
    // the line it moves right with every unit
    // (the key itself solves the level: it is left out)
    const m = await _mount(level), vs = tries.filter((v) => v !== p.counts[0]);
    const xs = [];
    for (const v of vs) xs.push(chipX(m, v));
    for (let i = 1; i < xs.length; i++) {
      assert.ok(xs[i] >= xs[i - 1] - 0.01, `${level.levelId}: ${vs[i]} at ${xs[i].toFixed(1)} left of ${vs[i - 1]} at ${xs[i - 1].toFixed(1)}`);
      if (numberLineAt(p, vs[i]) < 1) assert.ok(xs[i] > xs[i - 1], `${level.levelId}: ${vs[i]} not right of ${vs[i - 1]}`);
    }
    // one scale per fade: the same number stands at the same place whatever the level's key
    const k = `${p.labels}`, at13 = vs.includes(13) ? xs[vs.indexOf(13)] : null;
    if (at13 === null) continue;
    if (!byFade.has(k)) byFade.set(k, { at13, keys: new Set() });
    assert.ok(Math.abs(byFade.get(k).at13 - at13) < 0.01, `${level.levelId}: 13 at ${at13} on this level, ${byFade.get(k).at13} on another of fade ${k}`);
    byFade.get(k).keys.add(p.counts[0]);
  }
  assert.equal(byFade.size, 3);
  for (const [f, v] of byFade) assert.ok(v.keys.size >= 2, `fade ${f}: levels with different keys compared (${[...v.keys]})`);
});

/** a 2D context that records each stroked path's points, width and colour (the tally's strokes), for the geometry checks */
function recCtx() {
  const paths = [];
  let cur = [];
  const t = { font: "10px x", fillStyle: "", strokeStyle: "", globalAlpha: 1, lineWidth: 1, textAlign: "center", textBaseline: "middle", lineCap: "", lineJoin: "", globalCompositeOperation: "source-over", shadowBlur: 0, shadowColor: "", lineDashOffset: 0, filter: "none", imageSmoothingEnabled: true };
  const ctx = new Proxy(t, {
    get(o, k) {
      if (k in o) return o[k];
      if (k === "beginPath") return () => { cur = []; };
      if (k === "moveTo" || k === "lineTo") return (x, y) => { cur.push([x, y]); };
      if (k === "stroke") return () => { if (cur.length >= 2) paths.push({ pts: cur.slice(), width: o.lineWidth, color: o.strokeStyle }); };
      if (k === "measureText") return (s) => ({ width: [...String(s)].length * Number(/(\d+)px/.exec(o.font)?.[1] ?? 16) * 0.56, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 });
      if (k === "getLineDash") return () => [];
      if (k === "isPointInPath" || k === "isPointInStroke") return () => false;
      if (k === "getTransform") return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
      return () => ({ addColorStop() {} });
    },
    set(o, k, v) { o[k] = v; return true; },
  });
  return { ctx, paths };
}

test("stambh/tally gate 1, ruling 2: in read, the count's digits over a second line stand clear of the first line's strokes (every level, the largest, phone and desktop)", async () => {
  const { _mount } = await import("../server/forge3/qa/laws.mjs");
  let twoLine = 0;
  // world boxes from the 360 x 640 phone (short: the pad takes the bottom) to the 1366 x 768 desktop
  for (const [W, H] of [[328, 330], [328, 400], [328, 470], [360, 520], [1000, 560]]) for (const level of allRead()) {
    const m = await _mount(level, { W, H });
    for (const a of L.malActs(level, "tally-four")) m.ctl.dispatch(a);
    // the count runs from 0.25 s: look while each digit is up and once every group is counted (before the fade)
    const t0 = m.api.t;
    for (const age of [0.3, 0.8, 1.3, 1.8, 2.3]) {
      m.api.t = t0 + age;
      const audit = m.api.P.audit;
      audit.texts.length = 0;
      const { ctx, paths } = recCtx();
      m.view.draw(ctx);
      // the tally's strokes, in ink (the number line is ink2, the thing's picture its kind's hue, the tip the mix-up's)
      const inkCol = m.api.P.color("ink");
      const strokes = paths.filter((q) => q.color === inkCol && q.pts.length === 2);
      const ys = [...new Set(strokes.map((q) => Math.round((q.pts[0][1] + q.pts[1][1]) / 2)))].sort((a, b) => a - b);
      const lines = ys.filter((y, i) => i === 0 || y - ys[i - 1] > 6);
      const digits = audit.texts.filter((x) => /^[1-5]$/.test(x.s) && x.px <= 20);
      if (lines.length < 2 || !digits.length) continue;
      twoLine++;
      for (const d of digits) {
        const top = d.y - d.px / 2, bot = d.y + d.px / 2, l = d.x - d.w / 2, r = d.x + d.w / 2;
        let nearestOwn = Infinity, nearestOther = Infinity;
        for (const q of strokes) {
          const qy0 = Math.min(q.pts[0][1], q.pts[1][1]) - q.width / 2, qy1 = Math.max(q.pts[0][1], q.pts[1][1]) + q.width / 2;
          const qx0 = Math.min(q.pts[0][0], q.pts[1][0]) - q.width / 2, qx1 = Math.max(q.pts[0][0], q.pts[1][0]) + q.width / 2;
          // the digit's own line lies below it; a line above is another's
          if (qy0 > d.y) { nearestOwn = Math.min(nearestOwn, qy0 - bot); continue; }
          nearestOther = Math.min(nearestOther, top - qy1);
          // no stroke of the line above enters the digit's box (its own half-width and 2 px more)
          if (qx1 > l && qx0 < r) assert.ok(qy1 + 2 <= top, `${level.levelId} at ${W}x${H}: "${d.s}" (${l.toFixed(0)}-${r.toFixed(0)}, ${top.toFixed(0)}-${bot.toFixed(0)}) on a stroke of the line above (${qx0.toFixed(0)}-${qx1.toFixed(0)}, ${qy0.toFixed(0)}-${qy1.toFixed(0)})`);
        }
        // and the digit stands nearer its own line than the one above
        if (Number.isFinite(nearestOther)) assert.ok(nearestOther > nearestOwn, `${level.levelId} at ${W}x${H}: "${d.s}" ${nearestOther.toFixed(1)} px under the line above, ${nearestOwn.toFixed(1)} px over its own`);
      }
    }
  }
  assert.ok(twoLine > 0, "some read tally on two lines was checked");
});
