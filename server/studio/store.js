// The Studio build store (LIVE-STUDIO §3.0 "Store / library", §5.1; BUILD-PLAN W2-H #1). Content-addressed and
// immutable: a build is the exact fragment bytes the gate passed, keyed by their sha256 (server/studio/telemetry.js
// sha256, the same hash build.js gives the winner). The client fetches a build by sha and re-hashes it before it mounts
// (src/studio/StudioFrame.tsx), so what a child sees is byte-for-byte what passed.
//
// Persistence: Neon `studio_build` (017_studio.sql) with an in-process LRU in front (a library hit mounts in ≤ 1 s:
// the fragment is ≤ 60 KB and usually already in memory). The store holds no child data: fragment, plan digest
// (archetype, craft, check list; never strings with a child's name: names enter only through the host's `{child}` slot),
// and the BuildRecord.
import { sha256 } from "./telemetry.js";

const LRU_MAX = 200;
const lru = new Map();
function remember(sha, row) {
  lru.delete(sha);
  lru.set(sha, row);
  if (lru.size > LRU_MAX) lru.delete(lru.keys().next().value);
}

let qFn = null;
async function q(text, params) {
  if (!qFn) qFn = (await import("../db.js")).q;
  return qFn(text, params);
}
/** Test seam: a fake query function (or null to restore the real one). */
export const _setQuery = (fn) => { qFn = fn; lru.clear(); };

/** The plan digest a build row keeps (child-free; never the strings table). */
export function planDigest(plan) {
  if (!plan) return {};
  return { planId: plan.planId, archetype: plan.archetype, kind: plan.kind, skeleton: plan.skeleton, craft: plan.craft, checks: plan.checks, budgets: plan.budgets };
}

/**
 * Store a gate-passed build (idempotent by sha). The sha is recomputed here: a caller cannot store bytes under another
 * build's name.
 * @returns {Promise<{ buildSha: string, inserted: boolean }>}
 */
export async function putBuild({ identity, archetype, kind, fragment, plan, record, status = "live_passed" }) {
  const buildSha = sha256(fragment);
  if (record?.buildSha && record.buildSha !== buildSha) throw new Error("studio store: record sha does not match the fragment");
  const rows = await q(
    `insert into studio_build(build_sha, identity, archetype, kind, fragment, plan, record, status)
     values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (build_sha) do nothing returning build_sha`,
    [buildSha, identity, archetype, kind, fragment, planDigest(plan), record ?? {}, status]);
  remember(buildSha, { buildSha, identity, archetype, kind, fragment, status });
  return { buildSha, inserted: rows.length === 1 };
}

/**
 * A build by sha, or null. The fragment is verified against its sha on the way out (a corrupted row is never served).
 * @returns {Promise<{ buildSha: string, identity: string, archetype: string, kind: string, fragment: string, status: string } | null>}
 */
export async function getBuild(buildSha) {
  if (!/^[0-9a-f]{64}$/.test(String(buildSha ?? ""))) return null;
  const hit = lru.get(buildSha);
  if (hit) return hit;
  const [row] = await q("select build_sha, identity, archetype, kind, fragment, status from studio_build where build_sha = $1", [buildSha]);
  if (!row || sha256(row.fragment) !== row.build_sha) return null;
  const out = { buildSha: row.build_sha, identity: row.identity, archetype: row.archetype, kind: row.kind, fragment: row.fragment, status: row.status };
  remember(buildSha, out);
  return out;
}

/** Drop a build from the in-process cache (retire / status change elsewhere). */
export const forgetBuild = (buildSha) => lru.delete(buildSha);
