/**
 * Progress as dots, never numerals (main 2026-11-10: "WAVE 1/3" — and "1 / 3" — on a maths screen reads as a fraction):
 * filled for the steps reached, open for the rest. dots(1, 3) → "●●○".
 */
export function dots(i: number, n: number): string {
  const total = Math.max(1, Math.min(12, Math.floor(n) || 1)), at = Math.max(0, Math.min(total - 1, Math.floor(i) || 0));
  return "●".repeat(at + 1) + "○".repeat(total - at - 1);
}
/** A HUD "done/total" readout for the round in play. `total` is the round's real number of answers, known before the first
 *  one, so the first frame reads "0/2", never "0/0" (two judges, 2026-11-11: dukaan "SERVE HUE 0/0" in a one-customer
 *  round and geo-forge "BAN GAYA 0/0" with two tasks were read as wrong facts). */
export function tally(done: number, total: number): string {
  const d = Math.max(0, Math.floor(done) || 0), t = Math.max(1, Math.floor(total) || 0, d);
  return `${d}/${t}`;
}
