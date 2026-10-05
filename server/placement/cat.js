// Adaptive placement (CAT) on the grade-equivalent scale — RS-6 / CONTENT-LEVEL F2 / onboarding-diagnostic OD1-OD12,
// re-cut for the 2026-10-04 reset (ages 9-15, start mid-class, move up AND down, skip ahead).
//
// The posterior is server/learner/kt/ability.js gridPosterior (the exact 281-point grid), imported as a library only.
// Item model: the ability.js 4PL with slope A_GE and slip S_SLIP; guessing c = 1/K for a K-option choice, C_OPEN for open
// numeric answers. Item b is set from the item's GE anchor so that a child AT the anchor answers right 70% of the time
// (the generator's and raters' anchor definition), the same convention as ability.js bSkill.
//
// Pure functions only; server/placement/session.js holds the serialisable state machine.
import { gridPosterior, A_GE, S_SLIP, C_OPEN, sigmoid, GRID_MIN, GRID_STEP, N_GRID } from "../learner/kt/ability.js";

export const ANCHOR_P = 0.7;
export const LIMITS = Object.freeze({ maxTotal: 12, maxBelow: 8, maxOnGrade: 4, maxAbove: 4, minItems: 5, stopSd: 0.45 });
/** Prior: centred mid-class (reset: start at q50 for on-track children), wide enough to move two classes either way. */
export const PRIOR_SD = 1.25;
export const priorFor = (classLevel) => ({ mu: classLevel - 0.5, sd: PRIOR_SD });
/** An "I don't know" is weak evidence of not knowing (half an observation), not silence. Reversal: see REPORT.md. */
export const IDK_WEIGHT = 0.5;
/** Item-selection rule after the first item: "blend" | "info" | "target" (chosen by evals/content-level-v2/placement/simulate.mjs). */
export const SELECT = "target";

const logit = (p) => Math.log(p / (1 - p));
/** IRT parameters for a placement item. */
export function itemParams(item) {
  const K = item.format === "mcq" ? item.options?.length || 4 : 0;
  const c = K ? 1 / K : C_OPEN;
  const s = S_SLIP;
  const b = item.ge - logit((ANCHOR_P - c) / (1 - c - s)) / A_GE;
  return { a: A_GE, b, c, s };
}
export const pCorrect = (theta, p) => p.c + (1 - p.c - p.s) * sigmoid(p.a * (theta - p.b));
/** Fisher information of a 4PL item at θ. */
export function information(theta, p) {
  const P = pCorrect(theta, p), d = 1 - p.s;
  return (p.a ** 2 * (P - p.c) ** 2 * (d - P) ** 2) / ((d - p.c) ** 2 * P * (1 - P));
}

/** Posterior over θ from the prior and the answered items (asked: { item, y, w? }[]; y null = censored, skipped). */
export function posterior(prior, asked) {
  const obs = asked.filter((x) => x.y === 0 || x.y === 1).map((x) => ({ ...itemParams(x.item), y: x.y, w: x.w ?? 1 }));
  const post = gridPosterior(prior, obs);
  return { ...post, median: medianOf(prior, obs), n: obs.length };
}
/** Own-evidence summary (flat prior), the Gaussian site ability.js initialBase({ placement }) expects. */
export function ownEvidence(asked) {
  const obs = asked.filter((x) => x.y === 0 || x.y === 1).map((x) => ({ ...itemParams(x.item), y: x.y, w: x.w ?? 1 }));
  if (!obs.length) return null;
  const s = gridPosterior({ mu: 5, sd: 50 }, obs);
  return { mu: s.mean, sd: s.sd };
}
const medianOf = (prior, obs) => quantile(prior, obs, 0.5);
function quantile(prior, obs, t) {
  // gridPosterior exposes q25/q30/q40; the median needs one more cut, recomputed on the same grid.
  const lo = GRID_MIN, step = GRID_STEP, n = N_GRID, v = prior.sd ** 2;
  const lw = Array.from({ length: n }, (_, i) => {
    const th = lo + i * step;
    let l = -((th - prior.mu) ** 2) / (2 * v);
    for (const o of obs) { const P = o.c + (1 - o.c - o.s) * sigmoid(o.a * (th - o.b)); l += (o.w ?? 1) * Math.log(o.y === 1 ? P : 1 - P); }
    return l;
  });
  const mx = Math.max(...lw); const w = lw.map((x) => Math.exp(x - mx)); const z = w.reduce((a, b) => a + b, 0);
  let c = 0; for (let i = 0; i < n; i++) { c += w[i] / z; if (c >= t) return Math.round((lo + i * step) * 100) / 100; }
  return lo + (n - 1) * step;
}

/** Deterministic [0,1) stream (mulberry32), so a placement run is replayable from its seed. */
export function prng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const countBelow = (asked, C) => asked.filter((x) => x.item.ge < C - 1).length;
const countOnGrade = (asked, C) => asked.filter((x) => x.item.ge >= C - 1 && x.item.ge < C).length;
const countAbove = (asked, C) => asked.filter((x) => x.item.ge >= C).length;

/**
 * Next item, or null when the round should stop.
 * - First item: the one nearest GE C-0.7 (a gentle mid-class start: P ≈ 0.8 for a mid-class child).
 * - Then: among items a child at the posterior mean answers right 45-90% of the time (never a wall of failures, never a
 *   run of trivia) and never on a topic already used, the most informative, steered to P 0.8 after a miss, 0.65 after a hit.
 * - Caps: <= 8 below grade (back-chain), <= 4 on grade, <= 4 above grade (skip-ahead probes), <= 12 in all.
 * - Stops early when no remaining item is informative (every one would be > 90% or < 45% likely right at the mean).
 * @param {{ classLevel: number, pool: object[], asked: { item: object, y: 0|1|null }[], prior?: {mu:number, sd:number}, rnd?: () => number }} a
 */
export function nextItem({ classLevel: C, pool, asked, prior = priorFor(C), rnd = Math.random, select = SELECT }) {
  if (shouldStop({ classLevel: C, asked, prior })) return null;
  const used = new Set(asked.map((x) => x.item.id));
  const usedTopics = new Set(asked.map((x) => x.item.topicRef).filter(Boolean));
  let cands = pool.filter((it) => !used.has(it.id));
  if (countBelow(asked, C) >= LIMITS.maxBelow) cands = cands.filter((it) => it.ge >= C - 1);
  if (countOnGrade(asked, C) >= LIMITS.maxOnGrade) cands = cands.filter((it) => it.ge < C - 1 || it.ge >= C);
  if (countAbove(asked, C) >= LIMITS.maxAbove) cands = cands.filter((it) => it.ge < C);
  if (!cands.length) return null;
  const fresh = cands.filter((it) => !usedTopics.has(it.topicRef));
  if (fresh.length) cands = fresh;
  if (!asked.length) {
    const target = C - 0.7;
    const best = [...cands].sort((a, b) => Math.abs(a.ge - target) - Math.abs(b.ge - target)).slice(0, 3);
    return best[Math.floor(rnd() * best.length)];
  }
  const post = posterior(prior, asked);
  const m = post.mean;
  const scored = cands.map((it) => { const p = itemParams(it); return { it, P: pCorrect(m, p), I: information(m, p) }; });
  let band = scored.filter((x) => x.P >= 0.45 && x.P <= 0.9);
  if (!band.length) {
    if (asked.length >= LIMITS.minItems) return null;
    band = scored;
  }
  // OD5 for the reset: after a miss aim at P ≈ 0.8 (win the child back), after a right answer at P ≈ 0.65 (stretch);
  // within the 6 most informative items, the 3 closest to that target, one at random (exposure control).
  const target = asked[asked.length - 1].y === 1 ? 0.65 : 0.8;
  let top;
  if (select === "info") top = band.sort((a, b) => b.I - a.I).slice(0, 3);
  else if (select === "target") top = band.sort((a, b) => Math.abs(a.P - target) - Math.abs(b.P - target)).slice(0, 3);
  else top = band.sort((a, b) => b.I - a.I).slice(0, 6).sort((a, b) => Math.abs(a.P - target) - Math.abs(b.P - target)).slice(0, 3);
  return top[Math.floor(rnd() * top.length)].it;
}

/** Stop when the posterior is tight enough after the minimum, or a cap is hit. */
export function shouldStop({ classLevel: C, asked, prior = priorFor(C) }) {
  if (asked.length >= LIMITS.maxTotal) return true;
  if (countBelow(asked, C) >= LIMITS.maxBelow && countOnGrade(asked, C) >= LIMITS.maxOnGrade && countAbove(asked, C) >= LIMITS.maxAbove) return true;
  if (asked.length < LIMITS.minItems) return false;
  const post = posterior(prior, asked);
  if (post.sd <= LIMITS.stopSd) return true;
  // Skip-ahead exit: four on-grade-or-above items right in a row and the posterior clearly past mid-class.
  const last4 = asked.slice(-4);
  if (last4.length === 4 && last4.every((x) => x.y === 1 && x.item.ge >= C - 0.5) && post.q30 >= C - 0.5) return true;
  return false;
}

/** Where the class-C school year is on a date (CBSE: April start, ~10 teaching months). 0 = start, 1 = end. */
export function schoolYearFraction(date = new Date()) {
  const d = new Date(date);
  const months = (d.getUTCMonth() - 3 + 12) % 12 + d.getUTCDate() / 31;
  return Math.max(0, Math.min(1, months / 10));
}

/**
 * The placement result for a strand.
 * - level: relative to where an on-track class-C child is today (GE C-1 + year fraction): behind (> 1 class below),
 *   ahead (> 0.5 above), else on_track.
 * - startGE: q50 (the median) when the posterior is unimodal and within a class of today's expected level; q30 otherwise
 *   (OD4 revisited for the reset: q30 only when the far-behind mode dominates or the evidence is ambiguous).
 * - skipAhead: the child is at or past the end of class C; topic choice may start later in the book.
 * - placement: { [strand]: { mu, sd } } own-evidence site for ability.js initialBase({ placement }).
 */
export function result({ classLevel: C, strand, asked, prior = priorFor(C), date = new Date() }) {
  const post = posterior(prior, asked);
  const expected = C - 1 + schoolYearFraction(date);
  const unimodal = !post.ambiguous && post.modes.length <= 1;
  const nearGrade = Math.abs(post.median - expected) <= 1;
  const startGE = unimodal && nearGrade ? post.median : post.q30;
  const level = post.mean < expected - 1 ? "behind" : post.mean > expected + 0.5 ? "ahead" : "on_track";
  const skipAhead = post.q30 >= C - 0.3;
  const own = ownEvidence(asked);
  return {
    strand, classLevel: C, n: asked.length, nGraded: post.n,
    mean: round(post.mean), sd: round(post.sd), median: post.median, q30: post.q30, modes: post.modes, ambiguous: post.ambiguous,
    expected: round(expected), level, startGE: round(startGE), startRule: unimodal && nearGrade ? "q50" : "q30", skipAhead,
    movedDown: asked.some((x) => x.item.ge < C - 1.5), movedUp: asked.some((x) => x.item.ge >= C),
    placement: own ? { [strand]: { mu: round(own.mu), sd: round(Math.max(own.sd, 0.3)) } } : {},
  };
}
const round = (x) => Math.round(x * 100) / 100;

/**
 * Where to start topic choice in the child's own class book for a start GE, using ability.js skillGE's convention
 * (GE = C-1 + (chapter-1)/10): a chapter number, 1 when the start is below the class (back-chaining handles the rest).
 */
export function startChapter(startGE, classLevel, nChapters) {
  const ch = Math.floor((startGE - (classLevel - 1)) * 10) + 1;
  return Math.max(1, Math.min(nChapters, ch));
}
