// voice.expr.* counters (HUMAN-VOICE §8.4, B5): the felt-defects loop. In memory per process, logged one line per
// spoken turn (labels only: row, engine, band, the filler word from the closed inventory; never a child's or the
// teacher's text). snapshot() feeds the prod acceptance test and the nightly gate.
const counts = new Map();

/** Add n to a counter (e.g. "filler", "breath", "plain_fallback", "engine_fallback", "prelude", "prelude_miss"). */
export function count(name, n = 1) {
  const k = `voice.expr.${name}`;
  counts.set(k, (counts.get(k) ?? 0) + n);
}
export function snapshot() { return Object.fromEntries(counts); }
export function resetTelemetry() { counts.clear(); }

/** One log line per governed plan. */
export function logPlan({ lessonId, seq, engine, plan }) {
  if (!plan) return;
  const c0 = plan.clauses?.[0];
  const nv = plan.clauses.map((c) => c.nonverbalBefore).filter((k) => k && k !== "none");
  const pauses = plan.clauses.reduce((a, c) => a + (c.pauseBeforeMs || 0), 0);
  count("plan");
  if (c0?.filler) count("filler");
  for (const k of nv) count(k === "chuckle" ? "laugh" : k);
  if (plan.register === "safety") count("safety");
  console.info(`[voice] expr ${String(lessonId).slice(0, 8)}#${seq} engine=${engine} row=${plan.row ?? "?"} reg=${plan.register} clauses=${plan.clauses.length}` +
    ` filler=${c0?.filler ?? "-"} nv=${nv.join("+") || "-"} pauses=${pauses}ms${plan.governed?.dropped?.length ? ` dropped=${plan.governed.dropped.join(",")}` : ""}${plan.prelude ? " prelude" : ""}`);
}
