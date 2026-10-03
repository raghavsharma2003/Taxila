// G1 fill cache: memory LRU → Neon `asset_cache` (kind 'g1_fill', the GradeTable stays here, private) → Blob
// (`forge/g1/<sha256>.json`, the child-free render payload only). Writes never block a lesson: the caller awaits
// only the in-memory put; Neon and Blob writes run after the response with their errors logged.
// Keys carry identity (inherited law: model + prompt + gate + kit versions in every cache key), so a gate, prompt or
// kit change is a miss, never a stale hit.
import { q, one } from "../db.js";
import { putBlob, blobConfigured, sha256 } from "./blob.js";

const MAX_MEM = 2000;
const mem = new Map();
const memGet = (k) => { const v = mem.get(k); if (v) { mem.delete(k); mem.set(k, v); } return v; };
const memPut = (k, v) => { mem.set(k, v); if (mem.size > MAX_MEM) mem.delete(mem.keys().next().value); };
export const _memClear = () => mem.clear();

/** Pending background writes (tests and evals await them; the live path never does). */
const pending = new Set();
export const flushWrites = () => Promise.allSettled([...pending]);
function background(p) { pending.add(p); p.finally(() => pending.delete(p)).catch(() => {}); return p; }

export const dbConfigured = () => !!process.env.DATABASE_URL;

/**
 * @returns {Promise<{ hit: "memory"|"db"|null, body?: any, ms: number }>}
 */
export async function getFill(key, { timeoutMs = 1500 } = {}) {
  const t0 = performance.now();
  const m = memGet(key);
  if (m) return { hit: "memory", body: m, ms: +(performance.now() - t0).toFixed(2) };
  if (!dbConfigured() || process.env.FORGE_DB_CACHE === "off") return { hit: null, ms: +(performance.now() - t0).toFixed(2) };
  try {
    const row = await Promise.race([one("select body, url from asset_cache where key = $1 and kind = 'g1_fill'", [key]),
      new Promise((_, rej) => setTimeout(() => rej(new Error("cache lookup timeout")), timeoutMs))]);
    if (row?.body) { const body = { ...row.body, blobUrl: row.url ?? row.body.blobUrl }; memPut(key, body); return { hit: "db", body, ms: Math.round(performance.now() - t0) }; }
  } catch (e) { console.warn("[forge] cache lookup failed:", String(e.message).slice(0, 120)); }
  return { hit: null, ms: Math.round(performance.now() - t0) };
}

/** A model flavour pick replaces a code pick for the same key (same truth, same gate; only the title row and decor
 *  differ). Nothing else ever overwrites a stored fill. */
export const upgrades = (cur, next) => !cur || (cur.flavour?.by === "code" && next.flavour?.by === "model");

/** Memory now; Neon + Blob in the background. Only gate-passed fills are ever stored. */
export function putFill(key, body) {
  if (!body?.gate?.ok) throw new Error("refusing to cache a fill that did not pass the G1 gate");
  if (upgrades(mem.get(key), body)) memPut(key, body);
  const write = (async () => {
    let url = null;
    if (blobConfigured() && process.env.FORGE_BLOB !== "off") {
      const bytes = JSON.stringify({ v: 1, renderer: body.renderer, template: body.template ?? null, payload: body.payload });
      try { url = (await putBlob(`g1/${sha256(bytes)}.json`, bytes)).url; } catch (e) { console.warn("[forge] blob put failed:", String(e.message).slice(0, 160)); }
    }
    if (dbConfigured() && process.env.FORGE_DB_CACHE !== "off") {
      // First writer wins, except that a model pick upgrades a code pick (the turn path ships code picks: no_time).
      await q(`insert into asset_cache (key, kind, url, body) values ($1, 'g1_fill', $2, $3)
        on conflict (key) do update set body = excluded.body, url = excluded.url
        where asset_cache.kind = 'g1_fill' and asset_cache.body->'flavour'->>'by' = 'code' and excluded.body->'flavour'->>'by' = 'model'`,
      [key, url, JSON.stringify({ ...body, blobUrl: url })]);
    }
    // Replace, never mutate: a caller may still hold the previous object (result() hands out clones as well).
    if (url) { const m = mem.get(key); if (m && m.fillKey === body.fillKey && m.flavour?.by === body.flavour?.by) mem.set(key, { ...m, blobUrl: url }); }
    return url;
  })().catch((e) => console.warn("[forge] cache write failed:", String(e.message).slice(0, 160)));
  background(write);
  return write;
}

/**
 * A catalogue request for an item no live G1 fill covers (FACTORY.md §2.3 "miss": forge_request(objective gap,
 * demand+1) — never awaited by this lesson). Demand is counted per distinct child (hashed), in asset_cache kind
 * 'forge_gap' until the forge_job queue migration lands (G2 milestone).
 */
/** Distinct children kept per gap row; demand saturates here ("≥ 200 children asked" is all the ranking needs). */
export const GAP_CHILDREN_CAP = 200;
export function recordGap({ topicId, itemId, reason, engineHints, childId }) {
  if (!dbConfigured() || process.env.FORGE_DB_CACHE === "off") return Promise.resolve();
  const key = `forge_gap:v1:${topicId}:${itemId}:${reason}`;
  const child = childId ? sha256(`gap:${childId}`).slice(0, 12) : null;
  const body = { topicId, itemId, reason, engineHints: (engineHints || []).slice(0, 6), demand: child ? 1 : 0, children: child ? [child] : [], firstAt: new Date().toISOString() };
  return background(q(
    `insert into asset_cache (key, kind, body) values ($1, 'forge_gap', $2::jsonb)
     on conflict (key) do update set body = case
       when $3::text is null or (asset_cache.body->'children') ? $3::text
         or jsonb_array_length(asset_cache.body->'children') >= ${GAP_CHILDREN_CAP} then asset_cache.body
       else jsonb_set(jsonb_set(asset_cache.body, '{children}', (asset_cache.body->'children') || to_jsonb($3::text)),
                      '{demand}', to_jsonb(coalesce((asset_cache.body->>'demand')::int, 0) + 1)) end`,
    [key, JSON.stringify(body), child]).catch((e) => console.warn("[forge] gap write failed:", String(e.message).slice(0, 160))));
}
