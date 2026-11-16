import { readFileSync } from "node:fs"; import { totalPad } from "/home/user/taxila-int/src/play/core/typedtotal.ts"; const ROOT="/home/user/taxila-int/";
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
const S = [];
const ta = (c) => !c.some((x) => x >= 5 && x % 5 === Math.floor(x / 5)) && c.filter((x) => x >= 5).length >= 2 && c.some((x) => Math.floor(x / 5) >= 2);
const seen = new Set();
for (const [k, lo, hi] of [[2, 15, 18], [3, 17, 23], [3, 20, 28]]) {
  const rec = (pre) => { if (pre.length === k) { const t = pre.reduce((a, b) => a + b, 0); if (t >= lo && t <= hi && ta(pre) && !seen.has(pre.join())) { seen.add(pre.join()); S.push(pre); } return; } for (let x = 2; x <= 14; x++) rec([...pre, x]); };
  rec([]);
}
let bad = [], dist = {}, maxPer = 0;
for (const c of S) { const r = keepRow(c, c.reduce((a, b) => a + b, 0)); dist[r.fewest] = (dist[r.fewest] || 0) + 1; maxPer = Math.max(maxPer, r.perRow); if (r.fewest < 3 || r.perRow > 0.1) bad.push([c.join(), r.fewest, r.perRow, r.perRowWay]); }
console.log(S.length, JSON.stringify(dist), maxPer, bad.length, JSON.stringify(bad.slice(0, 10)));
