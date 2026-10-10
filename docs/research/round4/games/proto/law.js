// Antariksh Nishana · the law (pure: no DOM, no clock, no model). Prototype for docs/research/round4/games/FEASIBILITY.md.
// The same file runs in the browser (the game) and in node (test-law.mjs, a server replay). It owns every number the child
// sees and every grade: level generation from the skill, the mal-rule positions that make a level a diagnostic experiment,
// the shortcut check, the solver and the grader. Mirrors src/play/families/nishana/line.logic.ts in shape, not in code.
//
// Skill: c5-maths-ch02-t01 (fractions on the number line), kit skills s1 unit fractions in 0-1, s2 non-unit in 0-1,
// s3 fractions greater than 1. Kit misconceptions (data/kits/c5-maths.json): count-marks, whole-number-bias,
// all-less-than-one. The mechanic: a mine is cloaked somewhere on the line at the value's true position; the child aims the
// ship's cannon along the line and fires. Aiming IS placing the value; the hit or miss is the law, not a judge.

export const TOPIC = "c5-maths-ch02-t01";
export const SKILLS = {
  "c5-maths-ch02-t01-s1": { title: "unit fractions between 0 and 1", lo: 0, hi: 1 },
  "c5-maths-ch02-t01-s2": { title: "non-unit fractions between 0 and 1", lo: 0, hi: 1 },
  "c5-maths-ch02-t01-s3": { title: "fractions greater than 1", lo: 0, hi: 2 },
};
/** mal-rule id -> kit misconception id (the kit is the authority; ids copied verbatim) */
export const MIS = {
  "count-marks": "c5-maths-ch02-t01-m-count-marks",
  "whole-number-bias": "c5-maths-ch02-t01-m-whole-number-bias",
  "all-less-than-one": "c5-maths-ch02-t01-m-all-less-than-one",
};

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const val = (v) => v.p / v.q;
export const text = (v) => `${v.p}/${v.q}`;
function mulberry32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/**
 * Where a child holding mal-rule `mal` aims for value v on this line, as an interval [a, b] in line units (null = the belief
 * makes no prediction here). Intervals, not points, because a belief predicts a region ("squeezes 5/4 between 0 and 1").
 */
export function malRegion(L, v, mal) {
  const x = val(v), span = L.hi - L.lo, t = L.tol;
  switch (mal) {
    // kit sign: "calls the first of 3 marks 1/3" - with ticks every 1/m, the child reads the k-th mark as k/(m-1)
    case "count-marks": {
      if (!L.tickDen || L.tickDen !== v.q + 1 || x >= 1) return null;
      const at = L.lo + v.p / L.tickDen; return [at - t, at + t];
    }
    // kit sign: "puts 1/8 near 1; places 1/5 further right than 1/2" - bigger denominator, closer to 1
    case "whole-number-bias": {
      if (v.p !== 1 || v.q < 4) return null;
      const at = L.lo + Math.min(1, span) * (1 - 1 / v.q); return [at - t, at + t];
    }
    // kit sign: "squeezes 5/4 between 0 and 1; stops the line at 1"
    case "all-less-than-one": {
      if (x <= 1 || L.hi <= 1) return null;
      return [L.lo + 0.6, 1 + t * 0.5];
    }
  }
  return null;
}
const inside = (x, r) => r && x >= r[0] && x <= r[1];
const dist = (x, r) => (x < r[0] ? r[0] - x : x > r[1] ? x - r[1] : 0);

/** The labels drawn under the line (fade decides). A label equal to a target value's text would be a shortcut. */
export function labelsFor(L) {
  const out = [];
  for (let k = L.lo; k <= L.hi; k++) out.push({ at: k, text: String(k) });
  return out;
}

/**
 * Shortcut check (L3, Smith, Butler & Popovic 2013): no way to reach the goal without placing the value by its size.
 * Here: no visible label names the target, and at fade 3 no tick sits on the target (counting gaps is the skill at fades
 * 1-2, so ticks on the value's own denominator are allowed there).
 */
export function shortcut(L) {
  const labels = new Set(labelsFor(L).map((l) => l.text));
  for (const v of L.values) {
    if (labels.has(text(v)) || labels.has(String(val(v)))) return `label names ${text(v)}`;
    if (L.fade >= 3 && L.tickDen && Number.isInteger((val(v) - L.lo) * L.tickDen)) return `tick sits on ${text(v)} at fade 3`;
  }
  return null;
}

/** candidate values per skill (kit skill titles: s1 unit, s2 non-unit such as 3/4 and 2/5, s3 such as 5/4 and 3/2) */
function candidates(skillId) {
  const out = [];
  if (skillId.endsWith("-s1")) for (const q of [2, 3, 4, 5, 6, 8]) out.push({ p: 1, q });
  if (skillId.endsWith("-s2")) for (const q of [3, 4, 5, 6, 8]) for (let p = 2; p < q; p++) if (gcd(p, q) === 1) out.push({ p, q });
  if (skillId.endsWith("-s3")) for (const q of [2, 3, 4, 5]) for (let p = q + 1; p < 2 * q; p++) if (gcd(p, q) === 1) out.push({ p, q });
  return out;
}

/**
 * Generate one level. focusMal = the misconception just seen in the lesson (the Director passes it); the level must tell
 * that belief apart from the truth. fade 1: ticks at the value's own denominator; 2: ticks at another denominator
 * (estimate between ticks); 3: no minor ticks. linePx = the line's on-screen length on THIS device, so the tolerance
 * never drops under the touch floor (8 px) - layout is a constraint, not a check after the fact.
 */
export function generate({ skillId, focusMal = null, fade = 1, seed = 1, n = 2, linePx = 300 }) {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const sk = SKILLS[skillId];
  if (!sk) throw new Error(`skill not admitted: ${skillId}`);
  const rnd = mulberry32(seed * 2654435761);
  const span = sk.hi - sk.lo;
  const tol = Math.max(span * 0.035, (8 / linePx) * span);   // >= 8 px at this device's line length
  const pool = candidates(skillId);
  // fade 2: ticks at another denominator that never lands on the first value (so it is estimated between ticks); q + 1 is
  // always offered because that is the line on which the count-marks belief shows itself
  const tickChoices = (v) => (fade === 1 ? [v.q] : fade === 2 ? [...new Set([v.q + 1, 2, 3, 4, 5, 6])].filter((d) => d !== v.q && (v.p * d) % v.q !== 0) : [0]);
  const best = [];
  for (let tries = 0; tries < 400 && best.length < 24; tries++) {
    // pick n distinct values; the first carries the tick choice
    const vals = [];
    const shuffled = pool.slice().sort(() => rnd() - 0.5);
    for (const v of shuffled) { if (vals.length >= n) break; if (vals.every((u) => Math.abs(val(u) - val(v)) >= 4 * tol)) vals.push(v); }
    if (vals.length < Math.min(n, pool.length)) continue;
    const ticks = tickChoices(vals[0]);
    const tickDen = ticks[Math.floor(rnd() * ticks.length)];
    const L = { v: "antariksh@0", topicId: TOPIC, skillId, lo: sk.lo, hi: sk.hi, tickDen, fade, tol, values: vals, seed };
    if (shortcut(L)) continue;
    // discrimination: a mal-rule counts only if its region is >= 2.5 tolerances from the truth for some value
    const disc = new Set();
    for (const v of vals) for (const m of Object.keys(MIS)) { const r = malRegion(L, v, m); if (r && dist(val(v), r) >= 2.5 * tol) disc.add(m); }
    if (focusMal && !disc.has(focusMal)) continue;
    best.push({ L, disc: [...disc], score: disc.size + rnd() * 0.1 });
  }
  if (!best.length) return null;          // the Director falls back (another skill, fade, or the board twin) - never a wrong level
  best.sort((a, b) => b.score - a.score);
  const { L, disc } = best[0];
  const genMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
  return { ...L, targets: disc.map((m) => MIS[m]), proof: { solvable: true, shortcutFree: true, minActs: L.values.length, discriminates: disc, genMs: +genMs.toFixed(2) } };
}

/** The solver: the acts that solve the level (one shot at each true value). */
export function solve(L) { return L.values.map((v, i) => ({ k: "fire", i, x: val(v) })); }

/** Where a child holding `mal` would fire (centre of the region), for bots and tests. */
export function malShot(L, i, mal) { const r = malRegion(L, L.values[i], mal); return r ? (r[0] + r[1]) / 2 : null; }

/**
 * Grade by replaying the raw acts (a device claim is never read). Only the FIRST shot at each value is evidence; later
 * shots clear the mine but carry no grade (the reveal showed the answer). Time is never an input.
 */
export function grade(L, acts) {
  const per = L.values.map(() => null);
  for (const a of acts) {
    if (!a || a.k !== "fire" || !Number.isInteger(a.i) || a.i < 0 || a.i >= L.values.length || typeof a.x !== "number" || !isFinite(a.x)) continue;
    if (per[a.i]) continue;
    const v = L.values[a.i], truth = val(v), x = Math.min(L.hi, Math.max(L.lo, a.x)), gap = Math.abs(x - truth);
    if (gap <= L.tol) { per[a.i] = { outcome: "correct", gap }; continue; }
    let mis = null;
    for (const m of Object.keys(MIS)) if (inside(x, malRegion(L, v, m))) { mis = MIS[m]; break; }
    per[a.i] = { outcome: "incorrect", gap, ...(mis ? { misconceptionId: mis } : {}) };
  }
  const done = per.every(Boolean);
  return { per, done, solved: done && per.every((g) => g.outcome === "correct") };
}

/** Evidence rows in the server's shape (server/play/evidence.js): signed server-side, folded via "game" at weight 0.5. */
export function evidenceRows(L, g) {
  return g.per.filter(Boolean).slice(0, 4).map((r) => ({ skillId: L.skillId, outcome: r.outcome, ...(r.misconceptionId ? { misconceptionId: r.misconceptionId } : {}), discriminates: L.targets }));
}

/** "lagbhag" label for a gap (r3p-honest-approx-labels): nearest simple fraction, always marked approximate */
export function gapLabel(gap) {
  const simple = [[1, 8], [1, 6], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [1, 1]];
  let best = simple[0];
  for (const s of simple) if (Math.abs(gap - s[0] / s[1]) < Math.abs(gap - best[0] / best[1])) best = s;
  return `${best[0]}/${best[1]}`;
}
