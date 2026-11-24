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

/**
 * How much more CPU the work takes on a bigger input, as a ratio of MEDIANS taken in the same run. A millisecond limit measures
 * the machine as much as the code; a growth ratio does not (both sides slow down together) and still catches the regression
 * such a limit guards against (a loop that went quadratic, a table scanned per call). Linear work on k times the input gives
 * about k; assert a bound a few times above that.
 */
export function growth(runSmall, runBig, { reps = 40, warm = 5, batch = 1 } = {}) {
  const cpu = () => { const u = process.cpuUsage(); return (u.user + u.system) / 1000; };
  const many = (run) => () => { for (let i = 0; i < batch; i++) run(); };
  const med = (r) => { const run = many(r); for (let i = 0; i < warm; i++) run(); const xs = []; for (let i = 0; i < reps; i++) { const t0 = cpu(); run(); xs.push(cpu() - t0); } xs.sort((a, b) => a - b); return xs[Math.floor(xs.length / 2)] || 1e-3; };
  const small = med(runSmall), big = med(runBig);
  return { small, big, ratio: big / small };
}
