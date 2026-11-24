/**
 * The beat card's progress dots (StudioStage): at most 8 drawn, every one done but the last, which is "now". STUDIO-05
 * (audit 2026-11-10): from the 9th board on, the old rule (`i < n - 1`) marked all eight done and none now.
 */
export const BEAT_DOTS_MAX = 8;
export function beatDots(n: number): ("is-done" | "is-now")[] {
  const k = Math.min(Math.max(1, Math.floor(n) || 1), BEAT_DOTS_MAX);
  return Array.from({ length: k }, (_, i) => (i < k - 1 ? "is-done" : "is-now"));
}
