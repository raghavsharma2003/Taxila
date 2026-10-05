// Scoring (STAGECRAFT.md §3.3): value table, pNeed decay, pReady from the rung's build-time CDF, the score, and the
// ratio-greedy fill order. Pure functions of numbers; no clock is read here (the caller passes `now`).
import { BUILD_MS, COST_USD, NEED_VALUE, RUNG_VALUE } from "./config.js";

/** Standard normal CDF (Abramowitz-Stegun 7.1.26; |error| < 1.5e-7). */
export function phi(z) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}
const Z90 = 1.2815515655;

/** The rung's build-time distribution for an archetype ({p50, p90} in ms); instant rungs are ~0. */
export function buildDist(rung, archetype, override = null) {
  const o = override?.[rung];
  if (o) return o[archetype] ?? o._default ?? o;
  const d = BUILD_MS[rung];
  if (!d) return { p50: 1, p90: 2 };
  if (d.p50) return d;
  return d[archetype] ?? d._default;
}
/** P(build time ≤ t) for a lognormal with the given p50 and p90. */
export function pReadyBy(tMs, dist) {
  if (tMs <= 0) return 0;
  const sigma = Math.max(0.05, Math.log(dist.p90 / dist.p50) / Z90);
  return phi((Math.log(tMs) - Math.log(dist.p50)) / sigma);
}
/** A draw from the lognormal (the simulator's build times); `u` is a uniform in (0, 1). */
export function sampleBuild(dist, u) {
  const sigma = Math.max(0.05, Math.log(dist.p90 / dist.p50) / Z90);
  return Math.round(dist.p50 * Math.exp(sigma * probit(u)));
}
/** Inverse normal CDF (Acklam). */
export function probit(p) {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const q = Math.min(Math.max(p, 1e-9), 1 - 1e-9);
  if (q < 0.02425) { const r = Math.sqrt(-2 * Math.log(q)); return (((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1); }
  if (q > 1 - 0.02425) { const r = Math.sqrt(-2 * Math.log(1 - q)); return -(((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1); }
  const r = q - 0.5, s = r * r;
  return (((((a[0] * s + a[1]) * s + a[2]) * s + a[3]) * s + a[4]) * s + a[5]) * r / (((((b[0] * s + b[1]) * s + b[2]) * s + b[3]) * s + b[4]) * s + 1);
}

/** Signed learning value of a candidate: the need's value times the rung's personalisation margin. */
export const valueOf = (need, rung) => (NEED_VALUE[need] ?? 0.3) * (RUNG_VALUE[rung] ?? 0.5);
export const costOf = (rung) => COST_USD[rung] ?? 0;

/** A family's pNeed now: the max over its nominations, each decayed with the half-life; a pending child request pins 1. */
export function familyPNeed(fam, now, halfLifeMs) {
  if (fam.childRequested && !fam.answered) return 1;
  let p = 0;
  for (const n of fam.noms) {
    const age = Math.max(0, now - n.at);
    // a plan nomination holds until its family has been served; then it decays like any other
    const decay = n.strength === "planned" && !fam.answered ? 1 : Math.pow(0.5, age / halfLifeMs);
    p = Math.max(p, n.pNeed * decay);
  }
  return Math.min(1, p + (fam.boost ?? 0));
}

/**
 * score = (pNeed × valueGain × pReady × freshness − λ·cost) × urgency   (§3.3)
 * urgency = 1 + 2·[childRequested] + 1/max(1, slackSec), slack = deadline − now − p90(rung)
 * @returns {import("../../shared/stagecraft").ScoreTerms}
 */
export function scoreCandidate(c, fam, { now, bestReadyValue = 0, lambdaPerUsd = 50, halfLifeMs = 20_000, cdf = null }) {
  const pNeed = familyPNeed(fam, now, halfLifeMs);
  const dist = buildDist(c.rung, c.archetype, cdf);
  const lead = c.deadlineAt - now;
  // a child request is answered at her naming clause, and a late personal piece still swaps in at a later point
  const pReady = fam.childRequested ? Math.max(0.35, pReadyBy(lead + 2500, dist)) : pReadyBy(lead, dist);
  const valueGain = Math.max(0, c.value - bestReadyValue);
  const flipsPerBuild = (fam.flips ?? 0) * (dist.p50 / 60_000);
  const freshness = Math.max(0.2, 1 - Math.min(0.8, flipsPerBuild));
  const slackSec = (lead - dist.p90) / 1000;
  const urgency = 1 + 2 * (fam.childRequested && !fam.answered ? 1 : 0) + 1 / Math.max(1, slackSec);
  const costUsd = c.estCostUsd;
  const score = (pNeed * valueGain * pReady * freshness - lambdaPerUsd * costUsd) * urgency;
  return { pNeed, valueGain, pReady, freshness, costUsd, urgency, score };
}
