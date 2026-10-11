// Release 12 flight recorder: the client's two endpoints (TRACKING-BRIEF.md §Transport).
//   POST /api/trace/batch  { v, pid, skewMs?, events }  ≤ 256 KB. Session cookie when there is one; anonymous public pages
//                          send pid only. The server fills cid / gid (a lesson sid is resolved to its child only when the
//                          lesson is this guardian's); the client is never trusted for them. Tier-2 events are refused
//                          unless the account is on TAXILA_TRACE_FULL_FOR. Rate limited per pid and address.
//   POST /api/trace/blob?sid=&src=&seq=&ext=&type=  raw bytes (tier-2 accounts only): stored in the "trace" container,
//                          returns { ref, bytes, type } for the client event's data.blob.
// Neither route records srv.* events of its own (the router skips /api/trace/*).
import { HttpError, bad, forbidden, send } from "../http.js";
import { TRACE_MAX_BATCH_BYTES } from "../../shared/trace.ts";
import { fit } from "./mask.js";
import { isUuid } from "./context.js";
import { tierForEmail } from "./tier.js";
import { insertTraceRows } from "./writer.js";
import { putTraceBlob, traceBlobPath, traceBlobConfigured } from "./blob.js";

/** Largest client blob (a tier-2 rrweb chunk or an audio clip). */
export const MAX_TRACE_BLOB_BYTES = 12 * 1024 * 1024;
const RATE = { windowMs: 60_000, batches: 90, blobs: 60 };
const buckets = new Map();
export function traceRateOk(key, max, now = Date.now()) {
  let b = buckets.get(key);
  if (!b || now - b.start >= RATE.windowMs) { b = { start: now, n: 0 }; buckets.set(key, b); }
  if (buckets.size > 20_000) buckets.delete(buckets.keys().next().value);
  return ++b.n <= max;
}
const ipOf = (req) => String(req.headers?.["x-forwarded-for"] || "").split(",").map((h) => h.trim()).filter(Boolean).at(-1) || req.socket?.remoteAddress || "?";

/** The signed-in guardian, or null (anonymous pages are allowed). */
async function guardianOrNull(req) {
  try { const { requireGuardian } = await import("../auth.js"); return await requireGuardian(req); } catch { return null; }
}

/** The child of each lesson sid, for this guardian only (one query for all the batch's lesson sids). */
async function childrenOfLessons(guardianId, sids) {
  const ids = [...new Set(sids.filter(isUuid))];
  if (!guardianId || !ids.length) return new Map();
  const { q } = await import("../db.js");
  const rows = await q("select l.id, l.child_id from lesson l join child c on c.id = l.child_id where l.id = any($1::uuid[]) and c.guardian_id = $2", [ids, guardianId]);
  return new Map(rows.map((r) => [r.id, r.child_id]));
}

/** PURE: one client event → a row, or null when refused. `childOf` maps a lesson sid to its child (this guardian's only). */
export function clientRow(e, { pid, skewMs = 0, gid = null, tier = 1, childOf = new Map() }) {
  if (!e || typeof e !== "object" || typeof e.kind !== "string" || !e.kind) return null;
  if (e.src !== undefined && e.src !== "client") return null;
  const evTier = e.tier === 2 ? 2 : 1;
  if (evTier === 2 && tier < 2) return null;
  const t = Number(e.t);
  if (!Number.isFinite(t)) return null;
  const sid = String(e.sid || pid || "").slice(0, 80);
  if (!sid) return null;
  const skew = Number.isFinite(Number(skewMs)) && Math.abs(Number(skewMs)) < 86_400_000 ? Number(skewMs) : 0;
  const data = { ...fit(e.data ?? {}).data, ...(Number.isFinite(Number(e.mono)) ? { _mono: Math.round(Number(e.mono)) } : {}) };
  return { sid, pid: String(e.pid || pid || "").slice(0, 80) || null, cid: childOf.get(sid) ?? null, gid, src: "client",
    seq: Number.isInteger(e.seq) ? e.seq : 0, t: t - skew, kind: e.kind.slice(0, 80), turn: Number.isInteger(e.turn) ? e.turn : null,
    rid: typeof e.rid === "string" ? e.rid.slice(0, 64) : null, tier: evTier, data };
}

export async function traceBatch(req, res, body) {
  if (!body || typeof body !== "object" || !Array.isArray(body.events)) throw bad("events must be an array");
  const bytes = Buffer.byteLength(JSON.stringify(body));
  if (bytes > TRACE_MAX_BATCH_BYTES) throw new HttpError(413, `a trace batch is at most ${TRACE_MAX_BATCH_BYTES} bytes`);
  const pid = String(body.pid ?? "").slice(0, 80);
  if (!/^[\w-]{6,80}$/.test(pid)) throw bad("pid required");
  if (!traceRateOk(`b:${pid}`, RATE.batches) || !traceRateOk(`bi:${ipOf(req)}`, RATE.batches * 4)) throw new HttpError(429, "trace rate limit");
  const g = await guardianOrNull(req);
  const tier = g ? tierForEmail(g.email) : 1;
  const childOf = await childrenOfLessons(g?.id, body.events.map((e) => e?.sid)).catch(() => new Map());
  const rows = [];
  let rejected = 0;
  for (const e of body.events.slice(0, 2000)) {
    const r = clientRow(e, { pid, skewMs: body.skewMs, gid: g?.id ?? null, tier, childOf });
    if (r) rows.push(r); else rejected++;
  }
  rejected += Math.max(0, body.events.length - 2000);
  if (rows.length) await insertTraceRows(rows);
  send(res, 200, { accepted: rows.length, rejected, tier });
}

/** Read the raw body (the router does not parse this route). */
async function readRaw(req, max) {
  const declared = Number(req.headers?.["content-length"]);
  if (Number.isFinite(declared) && declared > max) throw new HttpError(413, "blob too large");
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > max) throw new HttpError(413, "blob too large"); chunks.push(c); }
  return Buffer.concat(chunks);
}

export async function traceBlob(req, res) {
  const g = await guardianOrNull(req);
  if (!g) throw forbidden("sign in first");
  if (tierForEmail(g.email) < 2) throw forbidden("tier 2 only");
  if (!traceRateOk(`blob:${g.id}`, RATE.blobs)) throw new HttpError(429, "trace rate limit");
  if (!traceBlobConfigured()) throw new HttpError(503, "trace storage not configured");
  const u = new URL(req.url || "/", "http://x");
  const sid = u.searchParams.get("sid"), src = u.searchParams.get("src") || "client", seq = Number(u.searchParams.get("seq"));
  const ext = u.searchParams.get("ext") || "bin", type = (u.searchParams.get("type") || "application/octet-stream").slice(0, 80);
  if (!sid || !/^[\w-]{6,80}$/.test(sid) || !Number.isInteger(seq) || !/^[a-z0-9]{1,12}$/i.test(ext) || src !== "client") throw bad("sid, src=client, seq and ext required");
  const buf = await readRaw(req, MAX_TRACE_BLOB_BYTES);
  const ref = await putTraceBlob(traceBlobPath({ sid, src, seq, ext }), buf, type);
  send(res, 200, ref);
}

export const routes = {
  "POST /api/trace/batch": traceBatch,
  "POST /api/trace/blob": traceBlob,
};
