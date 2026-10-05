// Agreement statistics for two raters on a binary label.
export function kappa(a, b) {
  const n = a.length; if (!n) return { n: 0, agree: 0, kappa: null };
  let agree = 0, pa = 0, pb = 0;
  for (let i = 0; i < n; i++) { if (a[i] === b[i]) agree++; if (a[i]) pa++; if (b[i]) pb++; }
  const po = agree / n, pe = (pa / n) * (pb / n) + (1 - pa / n) * (1 - pb / n);
  return { n, agree, po, kappa: pe === 1 ? 1 : (po - pe) / (1 - pe) };
}
/** Wilson interval (z=1.96 by default). */
export function wilson(k, n, z = 1.96) {
  if (!n) return [0, 1];
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Math.max(0, (c - h) / d), Math.min(1, (c + h) / d)];
}
export const pct = (k, n) => (n ? `${k}/${n} (${Math.round((100 * k) / n)}%)` : "0/0");
