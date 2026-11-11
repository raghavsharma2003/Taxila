/**
 * Progress as dots, never numerals (main 2026-11-10: "WAVE 1/3" — and "1 / 3" — on a maths screen reads as a fraction):
 * filled for the steps reached, open for the rest. dots(1, 3) → "●●○".
 */
export function dots(i: number, n: number): string {
  const total = Math.max(1, Math.min(12, Math.floor(n) || 1)), at = Math.max(0, Math.min(total - 1, Math.floor(i) || 0));
  return "●".repeat(at + 1) + "○".repeat(total - at - 1);
}
