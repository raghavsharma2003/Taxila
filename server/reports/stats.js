// Round 7 F batch R2 (S14 Then → now, PARENT-REPORT §4.3 RP-D6): exact P(θ_now > θ_then) for two independent Beta
// posteriors with integer parameters. A shared math primitive (like config.js), not generator logic: claims.js and the
// independent checker both call it, and tests/r7-learning-term-report.test.mjs pins it against a seeded Monte Carlo.

const LF = [0];
/** ln(n!) for integer n ≥ 0 (exact sum, cached). */
const lnFact = (n) => { for (let i = LF.length; i <= n; i++) LF[i] = LF[i - 1] + Math.log(i); return LF[n]; };
/** ln B(a, b) for integers a, b ≥ 1. */
const lnBeta = (a, b) => lnFact(a - 1) + lnFact(b - 1) - lnFact(a + b - 1);

/**
 * P(B > A) for A ~ Beta(aA, bA), B ~ Beta(aB, bB), integer parameters ≥ 1 (closed form, sum over aB terms):
 *   Σ_{i=0}^{aB−1} B(aA+i, bA+bB) / ((bB+i) · B(1+i, bB) · B(aA, bA))
 */
export function betaGreater(aA, bA, aB, bB) {
  let p = 0;
  for (let i = 0; i < aB; i++) p += Math.exp(lnBeta(aA + i, bA + bB) - Math.log(bB + i) - lnBeta(1 + i, bB) - lnBeta(aA, bA));
  return Math.min(1, Math.max(0, p));
}

/** P(rate now > rate then) under uniform priors: then = k1 of n1, now = k2 of n2 (Beta(1+k, 1+n−k) each). */
export const pRose = (k1, n1, k2, n2) => betaGreater(1 + k1, 1 + n1 - k1, 1 + k2, 1 + n2 - k2);

/** Whole calendar months from "YYYY-MM" a to b. */
export const monthsApart = (a, b) => { const [y1, m1] = a.split("-").map(Number), [y2, m2] = b.split("-").map(Number); return (y2 - y1) * 12 + (m2 - m1); };
