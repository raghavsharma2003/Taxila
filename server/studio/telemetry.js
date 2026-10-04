// Studio telemetry (LIVE-STUDIO §12): every build attempt becomes a BuildRecord (shared/studio.ts) with its timings,
// usage, cost and the full check list; every race a summary row. Records go to a sink: by default a JSON line on the
// console (no payloads, no child data: the record holds the plan id, arm, numbers and check ids) and an in-memory ring
// the router bench and the caps read. W2-H's store sets a sink that writes `studio_build` rows (017_studio.sql).
import { createHash } from "node:crypto";

const RING = 500;
const ring = [];
let sink = (row) => console.info(`[studio] ${JSON.stringify(row)}`);
/** Persist records elsewhere (W2-H: studio_build). The function must not throw; errors are swallowed. */
export const setSink = (fn) => { sink = typeof fn === "function" ? fn : sink; };

export const sha256 = (s) => createHash("sha256").update(String(s ?? ""), "utf8").digest("hex");

/**
 * A BuildRecord for one finished attempt (an arm's last round).
 * @returns {import("../../shared/studio").BuildRecord & { arm: string, archetype: string, fixes: string[], hints: number, error?: string }}
 */
export function buildRecord({ plan, identity = "", arm, rounds, passed, gate, startedAt }) {
  const last = rounds.at(-1) ?? {};
  const sum = (k) => rounds.reduce((s, r) => s + (r[k] ?? 0), 0);
  const usage = rounds.reduce((u, r) => ({ in: u.in + (r.usage?.in ?? 0), cached: u.cached + (r.usage?.cached ?? 0), out: u.out + (r.usage?.out ?? 0) }), { in: 0, cached: 0, out: 0 });
  return {
    buildSha: passed && last.html ? sha256(last.html) : "", identity, planId: plan.planId, archetype: plan.archetype, arm: arm.name ?? arm.dep,
    builder: { dep: arm.dep, ...(arm.effort ? { effort: arm.effort } : {}) },
    timings: { ttftMs: rounds[0]?.ttftMs ?? 0, ...(rounds[0]?.firstPaintMs != null ? { firstPaintMs: rounds[0].firstPaintMs } : {}), genMs: sum("ms"), qaMs: sum("qaMs"),
      repairs: Math.max(0, rounds.length - 1), toPlayableMs: passed ? Math.round(performance.now() - startedAt) : 0 },
    usage, usd: +rounds.reduce((s, r) => s + (r.usd ?? 0), 0).toFixed(5),
    gate: { pass: !!passed, checks: (gate?.checks ?? []).map((c) => ({ id: c.id, pass: c.pass, ...(c.pass ? {} : { detail: c.detail }) })) },
    status: passed ? "live_passed" : "failed",
    fixes: [...new Set(rounds.flatMap((r) => r.fixes ?? []))], hints: rounds.reduce((s, r) => s + (r.hints?.length ?? 0), 0),
    ...(last.error ? { error: last.error } : {}),
  };
}

/** Record a row (build record or race summary). Never throws. */
export function record(row) {
  ring.push({ at: Date.now(), ...row });
  if (ring.length > RING) ring.shift();
  try { sink(row); } catch { /* telemetry never breaks a build */ }
}
/** Recent rows (newest last), optionally filtered. */
export const recent = (pred = () => true) => ring.filter(pred);
export const _clear = () => { ring.length = 0; };
