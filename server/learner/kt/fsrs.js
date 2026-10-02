// FSRS-6 memory model (default parameters, ts-fsrs / fsrs-rs v6 [V via kt-algorithms]). Forgetting lives
// HERE (retrievability R), never in pL: BKT-R keeps F = 0 and the tutor reads retention = pL × R.
// Grades come from evidence (outcomes.js fsrsGrade), never from a child's self-rating.

export const W = Object.freeze([0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796,
  1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542]);
const W20 = W[20];
export const FACTOR = 0.9 ** (-1 / W20) - 1;
const DAY = 86_400_000;
const S_MIN = 0.001;

const clampD = (d) => Math.min(10, Math.max(1, d));
export const daysBetween = (a, b) => Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / DAY);

/** R(t) = (1 + f·t/S)^(−w20); 1 with no memory state (rule 1). */
export function retrievability(mem, at) {
  if (!mem) return 1;
  const t = daysBetween(mem.lastReviewAt, at);
  return (1 + FACTOR * t / Math.max(S_MIN, mem.S)) ** -W20;
}

const initD = (g) => clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1);

/**
 * One review. `at` is the session's start (KT reads no intra-session wall clock: §13.1 VK6).
 * @param {{S:number,D:number,lastReviewAt:string,reps:number,lapses:number}|null} mem
 * @param {1|2|3|4} g
 */
export function review(mem, g, at) {
  const iso = new Date(at).toISOString();
  if (!mem) return { S: W[g - 1], D: initD(g), lastReviewAt: iso, reps: 1, lapses: g === 1 ? 1 : 0 };
  const t = daysBetween(mem.lastReviewAt, at);
  const R = retrievability(mem, at);
  const dDelta = -W[6] * (g - 3);
  const dLin = mem.D + dDelta * (10 - mem.D) / 9;
  const D = clampD(W[7] * initD(4) + (1 - W[7]) * dLin);
  let S;
  if (t < 1) {
    // FSRS-6 short-term (same-day) stability
    const inc = Math.exp(W[17] * (g - 3 + W[18])) * mem.S ** -W[19];
    S = mem.S * (g >= 3 ? Math.max(1, inc) : inc);
  } else if (g === 1) {
    S = Math.min(mem.S, W[11] * mem.D ** -W[12] * ((mem.S + 1) ** W[13] - 1) * Math.exp(W[14] * (1 - R)));
  } else {
    const hard = g === 2 ? W[15] : 1, easy = g === 4 ? W[16] : 1;
    S = mem.S * (Math.exp(W[8]) * (11 - mem.D) * mem.S ** -W[9] * (Math.exp(W[10] * (1 - R)) - 1) * hard * easy + 1);
  }
  return { S: Math.max(S_MIN, S), D, lastReviewAt: iso, reps: mem.reps + 1, lapses: mem.lapses + (g === 1 ? 1 : 0) };
}

/** Days until R falls to `target` (the review scheduler). */
export const intervalDays = (S, target = 0.9) => (S / FACTOR) * (target ** (-1 / W20) - 1);
export const nextReviewAt = (mem, target = 0.9) =>
  (mem ? new Date(new Date(mem.lastReviewAt).getTime() + Math.max(1, intervalDays(mem.S, target)) * DAY).toISOString() : null);
