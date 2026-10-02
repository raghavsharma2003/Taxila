// θ ability per strand on the grade-equivalent scale (GE 0 = start of Class 1), LEARNER-MODEL §6.3 and
// §6.3.1 (gap-fill G1-theta-lesson-update). Rulings implemented here:
//   TH1 only cold, first-attempt, unaided, code-graded, single-strand item/solo events enter θ (thetaObs).
//   TH2 KT priors read θ only from the epoch BASE (frozen at session open); see priors.js.
//   TH3 θ never reads pL.
//   TH4 within an epoch each strand accumulates an exact 281-point log-likelihood grid (commutative);
//       cross-strand borrowing lives only in the base covariance; inflation + drift run only at epoch open.
import { OUTCOMES, isMcq } from "./outcomes.js";
import { ASR_MIN } from "./bktr.js";

export const GRID_MIN = -2, GRID_MAX = 12, GRID_STEP = 0.05;
export const GRID = Object.freeze(Array.from({ length: Math.round((GRID_MAX - GRID_MIN) / GRID_STEP) + 1 }, (_, i) => Math.round((GRID_MIN + i * GRID_STEP) * 100) / 100));
export const N_GRID = GRID.length; // 281
export const S_SLIP = 0.08, A_GE = 1.7, C_OPEN = 0.02, THETA_STRAND_CAP = 6;
/** Glicko inflation per day (KT §3.2) and term-time drift (+0.08 GE / month on term days) [U]. */
export const C_GLICKO = 0.077, DRIFT_GE_PER_DAY = 0.08 / 30, TERM_FRACTION = 0.75;
export const BORROW_CAP = 0.5;
export const ENGINE_VERSION = "theta-grid-1";
const DAY = 86_400_000;

export const sigmoid = (x) => 1 / (1 + Math.exp(-x));
/** Glicko g(σ_b) slope attenuation. */
export const gAtten = (sb) => 1 / Math.sqrt(1 + (3 * A_GE ** 2 * sb ** 2) / Math.PI ** 2);
/** 4PL: P = c + (1 − c − s)·σ(a(θ − b)). */
export const p4pl = (t, b, a = A_GE, c = C_OPEN, s = S_SLIP) => c + (1 - c - s) * sigmoid(a * (t - b));

// ───────────── strands, subjects, skill GE ─────────────
const SKILL_RE = /^c(\d)-([a-z]+)-ch(\d+)/;
export const subjectOfSkill = (skillId) => SKILL_RE.exec(String(skillId))?.[2] ?? "other";
export const subjectOfStrand = (strand) => String(strand).split(":")[0];
/** Default strand: one per subject until the curriculum carries strand tags. */
export const strandOfSkill = (skillId) => `${subjectOfSkill(skillId)}:core`;
/** Curricular GE of a skill: NCERT class + chapter position / 10 (§6.3.1 b.4), origin start of Class 1. */
export function skillGE(skillId) {
  const m = SKILL_RE.exec(String(skillId));
  if (!m) return null;
  return Number(m[1]) - 1 + Math.min(0.9, (Number(m[3]) - 1) / 10);
}
export const SKILL_B_SD = 0.75;
/** Skill b recalibrated so an on-grade child (θ = skill GE) has P ≈ 0.7 at the attenuated slope. */
export function bSkill(skillId) {
  const ge = skillGE(skillId);
  if (ge == null) return null;
  const a = A_GE * gAtten(SKILL_B_SD);
  return ge - Math.log((0.7 - C_OPEN) / (1 - C_OPEN - S_SLIP) / (1 - (0.7 - C_OPEN) / (1 - C_OPEN - S_SLIP))) / a;
}
/** ItemMeta for an item with no calibration: b from the skill (source 'skill'). */
export function defaultItemMeta(ev) {
  const strands = [...new Set(ev.skillIds.map(strandOfSkill))];
  const b = bSkill(ev.skillIds[0]);
  return {
    itemKey: ev.itemKey, strand: strands.length === 1 && b != null ? strands[0] : null, skillIds: ev.skillIds,
    b: { source: "skill", mu: b ?? 0, sd: SKILL_B_SD }, ...(isMcq(ev.cls) ? { K: Number(ev.cls.slice(-1)) } : {}),
    entryRung: ev.entryRung ?? 0, contaminated: !!ev.contaminated,
  };
}

// ───────────── TH1: which events enter θ ─────────────
/** Value of the FIRST unaided attempt; null = censored (IDK, NA, help before any attempt) or not an item. */
export function firstTry(ev) {
  const o = OUTCOMES[ev.cls]?.[ev.outcome];
  switch (ev.cls) {
    case "item.open": return o === "C0" ? 1 : (o === "IDK" || o === "NA" || ev.preAttemptHelp || o === undefined) ? null : 0;
    case "item.mcq2": case "item.mcq3": case "item.mcq4": return o === "first_correct" ? 1 : o === "wrong" ? 0 : null;
    case "solo": return o === "C0" ? 1 : o === undefined ? null : 0;
    default: return null;
  }
}

/**
 * @param {import("../../../shared/learner").EvidenceEvent} ev
 * @param {import("../../../shared/learner").ItemMeta} item
 * @param {{ firstOfEpisode: boolean, taughtBefore: (k: string) => boolean, thetaCount: (ks: string[]) => number, thetaWeight: (s: string) => number, cohort?: string }} sess
 * @returns {{ obs: import("../../../shared/learner").ThetaObs } | { drop: string }}
 */
export function thetaObs(ev, item, sess) {
  if (ev.safetyFired || (ev.asrConf ?? 1) < (ASR_MIN[sess.cohort ?? "default"] ?? ASR_MIN.default)) return { drop: "gate" };
  if (ev.grader !== "code") return { drop: "not_code" };
  if (ev.assisted != null || ev.gamingWindowKt || ev.controllerEasy) return { drop: "modified" };
  if (item.strand == null || item.contaminated || item.entryRung > 0) return { drop: "item" };
  if (ev.teach || item.skillIds.some((k) => sess.taughtBefore(k))) return { drop: "post_teach" };
  if (!sess.firstOfEpisode) return { drop: "not_first" };
  const y = firstTry(ev);
  if (y == null) return { drop: "censored" };
  const j = sess.thetaCount(item.skillIds) + 1;
  const w = Math.min(1 / j, THETA_STRAND_CAP - sess.thetaWeight(item.strand));
  if (!(w > 0)) return { drop: "strand_cap" };
  const { mu: b, sd: sb } = item.b;
  return { obs: { evId: ev.id, strand: item.strand, y, b, a: A_GE * gAtten(sb), c: item.K ? 1 / item.K : C_OPEN, s: S_SLIP, w } };
}

// ───────────── grid algebra ─────────────
const normalLogPdf = (t, mu, v) => -0.5 * (t - mu) ** 2 / v;
/** Moment-match a grid density given as log weights. */
export function momentMatch(logw) {
  let mx = -Infinity;
  for (const x of logw) if (x > mx) mx = x;
  let z = 0, m1 = 0, m2 = 0;
  for (let i = 0; i < N_GRID; i++) { const w = Math.exp(logw[i] - mx); z += w; m1 += w * GRID[i]; }
  const mu = m1 / z;
  for (let i = 0; i < N_GRID; i++) { const w = Math.exp(logw[i] - mx); m2 += w * (GRID[i] - mu) ** 2; }
  return { mu, v: Math.max(1e-6, m2 / z) };
}
/** Grid summary of a density (StrandPosterior fields). */
export function summarise(logw) {
  let mx = -Infinity;
  for (const x of logw) if (x > mx) mx = x;
  const w = logw.map((x) => Math.exp(x - mx));
  const z = w.reduce((a, b) => a + b, 0);
  const p = w.map((x) => x / z);
  const { mu, v } = momentMatch(logw);
  const q = (t) => { let c = 0; for (let i = 0; i < N_GRID; i++) { c += p[i]; if (c >= t) return GRID[i]; } return GRID[N_GRID - 1]; };
  const modes = [];
  for (let i = 1; i < N_GRID - 1; i++) if (p[i] > p[i - 1] && p[i] >= p[i + 1] && p[i] > 0.2 * Math.max(...p)) modes.push(GRID[i]);
  return { mean: mu, sd: Math.sqrt(v), q25: q(0.25), q30: q(0.3), q40: q(0.4), modes,
    ambiguous: modes.length > 1 && Math.max(...modes) - Math.min(...modes) > 1.5 };
}
export const obsLik = (t, o) => { const P = o.c + (1 - o.c - o.s) * sigmoid(o.a * (t - o.b)); return o.y === 1 ? P : 1 - P; };
/** Grid expectation of f(θ) under N(mu, sd²) (exact on the grid; used for pL0). */
export function gridExpectNormal(mu, sd, f) {
  const v = sd * sd;
  const lw = GRID.map((t) => normalLogPdf(t, mu, v));
  const mx = Math.max(...lw);
  let z = 0, s = 0;
  for (let i = 0; i < N_GRID; i++) { const w = Math.exp(lw[i] - mx); z += w; s += w * f(GRID[i]); }
  return s / z;
}

// ───────────── small dense linear algebra (n ≤ 4) ─────────────
export function inv(A, n) {
  const M = Array.from({ length: n }, (_, i) => [...A.slice(i * n, i * n + n), ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    const d = M[c][c];
    for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j]; }
  }
  return M.flatMap((row) => row.slice(n));
}
const matVec = (A, x, n) => Array.from({ length: n }, (_, i) => x.reduce((s, xj, j) => s + A[i * n + j] * xj, 0));

// ───────────── priors (§6.3 mixture; borrowing ρ) ─────────────
/** sd0 and the mixture prior's Normal fit for a strand at a class (no placement yet). */
export function classPrior(strand, classLevel) {
  const subject = subjectOfStrand(strand);
  const sd0 = classLevel <= 2 ? 1.0 : 1.5;
  const enrolled = classLevel - 1 + 0.5;  // mid-year default [U]
  const gapFar = subject === "maths" ? Math.max(0.5, 0.6 * (classLevel - 1.8))
    : Math.min(2.5, Math.max(0.3, 0.67 * classLevel - 3.5));
  const comps = [[0.6, enrolled - 0.5], [0.4, enrolled - gapFar]];
  const mu = comps.reduce((s, [w, m]) => s + w * m, 0);
  const v = comps.reduce((s, [w, m]) => s + w * (sd0 ** 2 + (m - mu) ** 2), 0);
  return { mu, sd: Math.sqrt(v), sd0: Math.sqrt(v) };
}
/** ρ between two strands [U]: same-subject maths 0.6, same-subject other 0.4, else 0. */
export const rho = (a, b) => (a === b ? 1 : subjectOfStrand(a) !== subjectOfStrand(b) ? 0 : subjectOfStrand(a) === "maths" ? 0.6 : 0.4);

/**
 * A fresh epoch base for a subject from class-level priors (or placement posteriors, when given as
 * { [strand]: { mu, sd } } own-evidence summaries).
 */
export function initialBase({ strands, classLevel, openedAt, epochId, placement = {} }) {
  const ss = [...strands].sort();
  const n = ss.length;
  const pri = ss.map((s) => classPrior(s, classLevel));
  const m = pri.map((p) => p.mu);
  const S = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) S.push(rho(ss[i], ss[j]) * pri[i].sd * pri[j].sd);
  let base = { epochId, openedAt: new Date(openedAt).toISOString(), strands: ss, m, S, sd0: pri.map((p) => p.sd0) };
  // Placement as Gaussian sites against the class prior (own evidence only; borrowing via S).
  if (Object.keys(placement).length) {
    base = { ...base, ...combineSites(base, ss.map((s, i) => {
      const p = placement[s];
      if (!p) return { tau: 0, h: 0 };
      const pv = pri[i].sd ** 2, v = Math.min(p.sd ** 2, pv * 0.999);
      const tau = Math.max(0, 1 / v - 1 / pv);
      return { tau, h: tau === 0 ? 0 : p.mu / v - m[i] / pv };
    })) };
  }
  return base;
}

// ───────────── epochs ─────────────
export function newEpoch(base) {
  return { base, ll: Object.fromEntries(base.strands.map((s) => [s, new Array(N_GRID).fill(0)])), seen: [], nObs: Object.fromEntries(base.strands.map((s) => [s, 0])) };
}
/** ADD: exact, commutative (log-likelihood sums); idempotent per evId. Mutates and returns e. */
export function addObs(e, o) {
  if (e.seen.includes(o.evId) || !e.ll[o.strand]) return e;
  const ll = e.ll[o.strand];
  for (let i = 0; i < N_GRID; i++) ll[i] += o.w * Math.log(obsLik(GRID[i], o));
  e.seen.push(o.evId);
  e.nObs[o.strand] += 1;
  return e;
}

/** Gaussian product of the base with diagonal sites { tau, h } per strand, then the borrow cap. */
function combineSites(base, sites) {
  const n = base.strands.length;
  const Pi = inv(base.S, n);
  const P = Pi.slice();
  for (let i = 0; i < n; i++) P[i * n + i] += sites[i].tau;
  const S = inv(P, n);
  const rhs = matVec(Pi, base.m, n).map((x, i) => x + sites[i].h);
  let m = matVec(S, rhs, n);
  // OD R5 cap: |E[θ_i | all] − E[θ_i | base_i, site_i only]| ≤ 0.5 GE
  m = m.map((mi, i) => {
    const v0 = base.S[i * n + i];
    const own = sites[i].tau === 0 ? base.m[i] : (base.m[i] / v0 + sites[i].h) / (1 / v0 + sites[i].tau);
    return Math.max(own - BORROW_CAP, Math.min(own + BORROW_CAP, mi));
  });
  return { m, S };
}

/** COMBINE: per-strand site from its own LL against the base marginal, then the exact Gaussian product. */
export function combine(e) {
  const { base } = e;
  const n = base.strands.length;
  if (base.strands.every((s) => e.nObs[s] === 0)) return { m: base.m.slice(), S: base.S.slice() };
  const sites = base.strands.map((s, i) => {
    if (e.nObs[s] === 0) return { tau: 0, h: 0 };
    const mu0 = base.m[i], v0 = base.S[i * n + i];
    const post = momentMatch(GRID.map((t, k) => normalLogPdf(t, mu0, v0) + e.ll[s][k]));
    const tau = Math.max(0, 1 / post.v - 1 / v0);
    return { tau, h: tau === 0 ? 0 : post.mu / post.v - mu0 / v0 };
  });
  return combineSites(base, sites);
}

/** Read the current per-strand posterior (marginals of combine). */
export function currentTheta(e) {
  const { m, S } = combine(e);
  const n = e.base.strands.length;
  return Object.fromEntries(e.base.strands.map((s, i) => [s, { mu: m[i], sd: Math.sqrt(S[i * n + i]), nObs: e.nObs[s] }]));
}

/** Term days in a gap [U]: a fixed fraction of calendar days until the school calendar is wired. */
export const termDaysOf = (days) => days * TERM_FRACTION;

/**
 * OPEN at the first turn of a session: absorb the previous epoch, Glicko-inflate (per strand, capped at
 * sd0) and drift by elapsed days. Idempotent per sessionId (the caller keys it).
 */
export function openEpoch(prev, now, epochId) {
  const post = combine(prev);
  const n = prev.base.strands.length;
  const days = Math.max(0, (new Date(now).getTime() - new Date(prev.base.openedAt).getTime()) / DAY);
  const S = post.S.slice();
  for (let i = 0; i < n; i++) S[i * n + i] = Math.min(S[i * n + i] + C_GLICKO ** 2 * days, prev.base.sd0[i] ** 2);
  const m = post.m.map((mu) => mu + DRIFT_GE_PER_DAY * termDaysOf(days));
  return newEpoch({ epochId, openedAt: new Date(now).toISOString(), strands: prev.base.strands, m, S, sd0: prev.base.sd0 });
}

/** Grid posterior for placement items on one strand (onboarding CAT primitive, OD §3.6). */
export function gridPosterior({ mu, sd }, obs) {
  const v = sd * sd;
  const lw = GRID.map((t) => normalLogPdf(t, mu, v) + obs.reduce((s, o) => s + (o.w ?? 1) * Math.log(obsLik(t, o)), 0));
  return summarise(lw);
}
