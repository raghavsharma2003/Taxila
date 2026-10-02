// Step-level poison accounting for the worker's dirty-set loop (review conductor-m0). Event poison is handled
// inside decide (fail-safe / quarantine); this is the layer below: a child whose step() itself keeps throwing
// (a statement timeout in loadView, an upgradeState throw, a commit refused by the schema) keeps its old
// pending_since and would otherwise sit at the head of the `order by pending_since` scan forever, so 50 such
// children would starve every healthy one. Per replica, in memory: a restart forgets it, which only costs one
// more failed attempt per poisoned child. Pure apart from the injected clock.
export const STEP_BACKOFF = { baseMs: 5_000, maxMs: 10 * 60_000, pageAfter: 5 };

export function stepBackoff({ baseMs, maxMs, pageAfter } = STEP_BACKOFF, now = () => Date.now()) {
  const fails = new Map();                                   // childId → { n, nextTryAt }
  return {
    /** Children not to scan yet (their backoff has not elapsed). */
    blocked() { const t = now(); return [...fails].filter(([, f]) => f.nextTryAt > t).map(([id]) => id); },
    /** → { n, delayMs, page }: page = true at pageAfter consecutive failures and every pageAfter after it. */
    failed(childId) {
      const n = (fails.get(childId)?.n || 0) + 1;
      const delayMs = Math.min(maxMs, baseMs * 2 ** (n - 1));
      fails.set(childId, { n, nextTryAt: now() + delayMs });
      return { n, delayMs, page: n >= pageAfter && n % pageAfter === 0 };
    },
    ok(childId) { fails.delete(childId); },
    size: () => fails.size,
  };
}
