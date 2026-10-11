// Release 12 flight recorder: who is recorded at tier 2 (the owner cohort). Tier 1 is every account, always.
//   TAXILA_TRACE_FULL_FOR = comma-separated guardian accounts, each a lower-case email OR the sha256 hex of one (prefer the
//   hash: the env then carries no address). The same shape as TAXILA_UI_KAKSHA (server/ui/kaksha-cohort.js).
// Tier 2 adds: the full model prompts and raw responses (server blobs), and on the client the DOM replay and audio (T-client,
// T-voice) behind a visible REC chip. Unset or empty: nobody. The answer never reveals the list.
import { createHash } from "node:crypto";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

let cached = { raw: null, set: new Set() };
/** The cohort from the env: a Set of sha256(lower-case email). */
export function traceCohort(env = process.env) {
  const raw = String(env.TAXILA_TRACE_FULL_FOR ?? "");
  if (env === process.env && cached.raw === raw) return cached.set;
  const out = new Set();
  for (const part of raw.split(",")) {
    const v = part.trim().toLowerCase();
    if (v) out.add(/^[0-9a-f]{64}$/.test(v) ? v : sha256(v));
  }
  if (env === process.env) cached = { raw, set: out };
  return out;
}
/** 2 for a guardian on TAXILA_TRACE_FULL_FOR, else 1. */
export function tierForEmail(email, env = process.env) {
  const e = String(email ?? "").trim().toLowerCase();
  if (!e) return 1;
  const c = traceCohort(env);
  return c.size && c.has(sha256(e)) ? 2 : 1;
}
/** GET /api/me's `trace` block. */
export const traceMeFor = (guardian, env = process.env) => ({ tier: tierForEmail(guardian?.email, env) });
