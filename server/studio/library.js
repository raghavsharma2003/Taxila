// The Studio library (LIVE-STUDIO §3.11, §9, D11; BUILD-PLAN W2-H #2): the effect that makes Studio scale.
//
// Identity (the lookup key) = sha256(kind, archetype, skill, Band4, lang family {hi, en-hinglish}, kit hash, studio-kit
// version). The builder model is a VARIANT attribute (the build row's record), never part of the key, so a router change
// never empties the library. Params and strings are per mount, never in the identity.
//
// States: live_passed (passed the gate once, for one child) → transfer_passed (G-transfer with a held-out param set;
// reusable for ≤ 20 mounts, each after G-mount) → promoted (≥ 3 passes on distinct param sets AND a sampled human review,
// scripts/studio-review.mjs) → retired (incident, review reject, "failed after reveal"). ≤ 3 promoted variants per identity.
//
// The gate-result cache (§9): when the gate is down, a library build mounts ONLY on an exact (build sha, params hash,
// strings hash) that already passed G-mount / G-transfer. G-mount is never skipped on mount count alone.
//
// Everything here is child-free except the mount reads (exclusions, spend), which join lesson.child_id.
import { createHash } from "node:crypto";
import { STUDIO_KIT } from "./archetypes/index.js";
import { forgetBuild } from "./store.js";

export const LIBRARY_VERSION = "studio-library@1";
export const LIMITS = Object.freeze({ unreviewedMounts: 20, promotePasses: 3, promotedVariants: 3, excludeDays: 7 });

const h = (s) => createHash("sha256").update(String(s), "utf8").digest("hex");
/** JSON with sorted keys (a params / strings hash must not depend on key order). */
export function stableJson(v) {
  if (Array.isArray(v)) return `[${v.map(stableJson).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stableJson(v[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
}
export const hashOf = (v) => h(stableJson(v));
/** The language family a build's strings belong to (a Hindi build is not an English one; Hinglish rides with English). */
export const langFamily = (lang) => (lang === "hi" ? "hi" : "en-hinglish");

/** The kit's content hash: what the build's truth came from (a kit change retires nothing silently: a new identity). */
export function kitHashOf(kit) {
  if (!kit) return "nokit";
  return hashOf({ topicId: kit.topicId ?? kit.topic_id ?? null, items: (kit.items ?? []).map((i) => [i.id, i.answer ?? null, i.prompt_en ?? null]),
    mis: (kit.misconceptions ?? []).map((m) => m.id), worked: kit.workedExample?.problem ?? null }).slice(0, 24);
}

/** @param {{ kind: string, archetype: string, skillId: string, band: string, lang: string, kitHash: string, kitVersion?: string }} x */
export function identityOf(x) {
  return h(["studio-id@1", x.kind, x.archetype, x.skillId, x.band, langFamily(x.lang), x.kitHash, x.kitVersion ?? STUDIO_KIT].join("|"));
}

let qFn = null;
async function q(text, params) {
  if (!qFn) qFn = (await import("../db.js")).q;
  return qFn(text, params);
}
/** Test seam. */
export const _setQuery = (fn) => { qFn = fn; cache.clear(); };

const TTL_MS = 60_000;
const cache = new Map();

/**
 * The best build for an identity, as the router reads it, or null. Promoted first (the least-mounted variant), else the
 * reusable unreviewed build with the most distinct passes. Never a retired build.
 * @returns {Promise<{ buildSha: string, status: string, distinctPasses: number, mounts: number, incidents: number, archetype: string, kind: string } | null>}
 */
export async function lookup(identity, { fresh = false } = {}) {
  const c = cache.get(identity);
  if (!fresh && c && Date.now() - c.at < TTL_MS) return c.row;
  const rows = await q(
    `select build_sha, status, distinct_passes, mounts, incidents, archetype, kind from studio_build
      where identity = $1 and status <> 'retired'
      order by (status = 'promoted') desc, case when status = 'promoted' then mounts else -distinct_passes end asc, created_at asc limit 1`, [identity]);
  const r = rows[0];
  const row = r ? { buildSha: r.build_sha, status: r.status, distinctPasses: Number(r.distinct_passes), mounts: Number(r.mounts), incidents: Number(r.incidents), archetype: r.archetype, kind: r.kind } : null;
  cache.set(identity, { at: Date.now(), row });
  return row;
}

/** The library row for an identity (created on first pass). */
export async function ensureIdentity(identity, x) {
  await q(`insert into studio_library(identity, kind, archetype, skill_id, band, lang_family, kit_hash, kit_version)
           values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (identity) do nothing`,
    [identity, x.kind, x.archetype, x.skillId, x.band, langFamily(x.lang), x.kitHash, x.kitVersion ?? STUDIO_KIT]);
}

/**
 * Record that (build, params, strings) passed a gate ("live" at build time, "mount" for G-mount, "transfer" for
 * G-transfer). Updates the build's distinct-pass count, and moves live_passed → transfer_passed on a pass with params
 * other than the first. Idempotent.
 * @returns {Promise<{ distinctPasses: number }>}
 */
export async function recordGatePass(buildSha, params, strings, gate = "mount") {
  const ph = hashOf(params), sh = hashOf(strings);
  await q(`insert into studio_gate_pass(build_sha, params_hash, strings_hash, gate) values ($1,$2,$3,$4) on conflict do nothing`, [buildSha, ph, sh, gate]);
  const [r] = await q(
    `update studio_build b set distinct_passes = (select count(distinct params_hash) from studio_gate_pass g where g.build_sha = b.build_sha),
        status = case when b.status = 'live_passed' and (select count(distinct params_hash) from studio_gate_pass g where g.build_sha = b.build_sha) >= 2
                      then 'transfer_passed' else b.status end,
        updated_at = now()
      where build_sha = $1 returning distinct_passes, identity`, [buildSha]);
  if (r?.identity) cache.delete(r.identity);
  return { distinctPasses: Number(r?.distinct_passes ?? 0) };
}

/** The gate-result cache: did exactly this (build, params, strings) pass before? */
export async function gatePassed(buildSha, params, strings) {
  const rows = await q("select 1 as ok from studio_gate_pass where build_sha = $1 and params_hash = $2 and strings_hash = $3 limit 1", [buildSha, hashOf(params), hashOf(strings)]);
  return rows.length === 1;
}

/** A mount happened (the unreviewed-reuse cap counts these). */
export async function noteMount(buildSha) {
  const [r] = await q("update studio_build set mounts = mounts + 1, updated_at = now() where build_sha = $1 returning identity", [buildSha]);
  if (r?.identity) cache.delete(r.identity);
}

/**
 * Retire a build: an incident (failed after reveal), a review reject, a kit change. It is never mounted again.
 * @param {"incident" | "review_reject" | "kit_change" | "manual"} reason
 */
export async function retire(buildSha, reason = "manual") {
  const [r] = await q(`update studio_build set status = 'retired', incidents = incidents + $2, record = record || jsonb_build_object('retired', $3::text), updated_at = now()
                        where build_sha = $1 returning identity`, [buildSha, reason === "incident" ? 1 : 0, reason]);
  if (r?.identity) {
    cache.delete(r.identity);
    await q("update studio_library set promoted_shas = array_remove(promoted_shas, $2), updated_at = now() where identity = $1", [r.identity, buildSha]);
  }
  forgetBuild(buildSha);
  return !!r;
}

/**
 * Promote a build after human review (scripts/studio-review.mjs): needs ≥ 3 distinct param passes, no incident, and room
 * among the identity's ≤ 3 promoted variants. → { ok, why? }
 */
export async function promote(buildSha, reviewer) {
  const [b] = await q("select identity, status, distinct_passes, incidents from studio_build where build_sha = $1", [buildSha]);
  if (!b) return { ok: false, why: "unknown build" };
  if (b.status === "retired") return { ok: false, why: "retired" };
  if (b.status === "promoted") return { ok: true, why: "already promoted" };
  if (Number(b.distinct_passes) < LIMITS.promotePasses) return { ok: false, why: `needs ${LIMITS.promotePasses} distinct param passes (has ${b.distinct_passes})` };
  if (Number(b.incidents) > 0) return { ok: false, why: "has incidents" };
  const [{ n }] = await q("select count(*)::int as n from studio_build where identity = $1 and status = 'promoted'", [b.identity]);
  if (n >= LIMITS.promotedVariants) return { ok: false, why: `identity already has ${n} promoted variants` };
  await q("update studio_build set status = 'promoted', reviewed_by = $2, reviewed_at = now(), updated_at = now() where build_sha = $1", [buildSha, String(reviewer).slice(0, 80)]);
  await q("update studio_library set promoted_shas = array_append(promoted_shas, $2), updated_at = now() where identity = $1 and not ($2 = any(promoted_shas))", [b.identity, buildSha]);
  cache.delete(b.identity);
  return { ok: true };
}

/** Archetypes this child said "Not this one" to within the last week (STUDENT-FLOW §5.3). */
export async function excludedArchetypes(childId) {
  const rows = await q(`select distinct m.archetype from studio_mount m join lesson l on l.id = m.lesson_id
                         where l.child_id = $1 and m.not_this_at > now() - interval '${LIMITS.excludeDays} days'`, [childId]);
  return rows.map((r) => r.archetype);
}

/** This child's live-build spend today and this month (the router's per-child caps). */
export async function spendOf(childId) {
  const [r] = await q(`select coalesce(sum(m.usd) filter (where m.created_at > date_trunc('day', now())), 0)::float8 as day,
                              coalesce(sum(m.usd) filter (where m.created_at > date_trunc('month', now())), 0)::float8 as month
                         from studio_mount m join lesson l on l.id = m.lesson_id where l.child_id = $1 and m.source = 'live'`, [childId]);
  return { day: Number(r?.day ?? 0), month: Number(r?.month ?? 0) };
}

/** Review queue for the CLI: unreviewed reusable builds, most passes first. */
export async function reviewQueue(limit = 20) {
  return q(`select build_sha, identity, archetype, kind, status, distinct_passes, mounts, incidents, created_at from studio_build
             where status in ('live_passed','transfer_passed') order by distinct_passes desc, mounts desc, created_at asc limit $1`, [limit]);
}
