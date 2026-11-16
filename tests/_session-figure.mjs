// Gate 2, law 3 read per session (RULINGS-2026-11-15, "To Games, 2026-11-16"): the chance that a child who does not hold
// a mix-up is named it over one session. Each level of the session lands on the mix-up's act independently with its own
// chance p_i (a blind guess, or one ordinary slip on every level: the worse of the two); `named` decides, from which levels
// landed, whether the rule names it. Exact: every one of the 2^n outcomes is summed. Surface conditions (levels that must
// differ) are left out, so the figure is an upper bound for every order the levels can come in.
export function sessionChance(ps, named) {
  let total = 0;
  for (let mask = 0; mask < 1 << ps.length; mask++) {
    const hit = ps.map((_, i) => !!(mask & (1 << i)));
    if (!named(hit)) continue;
    total += ps.reduce((a, p, i) => a * (hit[i] ? p : 1 - p), 1);
  }
  return total;
}
/** named on the k-th sighting, every level at chance p: P(at least k of n) */
export const atLeast = (n, p, k) => sessionChance(Array(n).fill(p), (h) => h.filter(Boolean).length >= k);
/** a from-one-level rule over n levels: 1 - (1 - p)^n */
export const fromOne = (n, p) => 1 - (1 - p) ** n;
/** "1 in x" for the packet */
export const oneIn = (x) => (x > 0 ? `1 in ${+(1 / x).toFixed(1)}` : "0");
