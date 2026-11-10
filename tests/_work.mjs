// Work counts instead of clocks. A speed bar ("p95 under 50 ms") measures the machine as much as the code: on the gate's
// 4-at-a-time load the same picker read 5 ms idle and 110 ms busy. The thing those bars guard is that the picker's work stays
// bounded (it proves every candidate level it is given, so a candidate-count blow-up is what would make it slow), and that is
// a COUNT: the same on every machine. counted() wraps a family's logic and counts every call into it.
export const PICK_CANDIDATE_CAP = 400; // src/play/core/pick.ts: generate(req).slice(0, opts.max ?? 400)

/** @returns {{ logic: object, calls: () => number, by: () => Record<string, number>, reset: () => void }} */
export function counted(logic) {
  const by = {};
  const wrapped = new Proxy(logic, {
    get(t, k, r) {
      const v = Reflect.get(t, k, r);
      if (typeof v !== "function") return v;
      return (...a) => { by[k] = (by[k] ?? 0) + 1; return v.apply(t, a); };
    },
  });
  return { logic: wrapped, calls: () => Object.values(by).reduce((s, n) => s + n, 0), by: () => ({ ...by }), reset: () => { for (const k of Object.keys(by)) delete by[k]; } };
}

/**
 * Assert a bound on the work of a list of picks. Picks are seeded, so the counts are identical on every machine: a bound set
 * about 3x above what the code does today fails only when the code's work grows, never because the machine was busy.
 * @param {{considered:number}|null} picked
 */
export function assertPickWork(label, picked, calls, { maxConsidered, maxCalls }) {
  if (!picked) throw new Error(`${label}: nothing was picked`);
  if (picked.considered > maxConsidered) throw new Error(`${label}: considered ${picked.considered} candidates (bound ${maxConsidered}, picker cap ${PICK_CANDIDATE_CAP})`);
  if (calls > maxCalls) throw new Error(`${label}: ${calls} calls into the family logic (bound ${maxCalls})`);
}
