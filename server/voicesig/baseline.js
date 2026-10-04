// Per-child voice baselines for voicesig (SPEC §3.1, §5). Two halves:
//   PURE: an in-memory Baseline keyed (context, langMode, form, feature) with the same Welford / exponential-window rule
//         as server/voice/features.js (asserted equal in tests), z-scores with SD floors, maturity m = n/(n+20).
//   I/O:  load at lesson start, save at lesson end, against the PROPOSED voicesig.* schema
//         (docs/design/voice-signals/migration-proposal.sql). The query function is INJECTED (server/db.js `q` in
//         production), so this module never imports the database and is testable without one.
// Consent: rows persist ONLY under the parent's V2 opt-in ("remember your child's usual answering pace"), off by default.
// Without V2 the same baseline runs for the session only (seeded empty; band priors apply until n ≥ 8).
// No per-turn history, text, embedding, audio or state is ever stored (G-VS-SCHEMA).
import { createHmac } from "node:crypto";

export const MIN_N = 8;
export const N_MAX = 300;
export const MATURITY_K = 20;
export const Z_CLIP = 4;

/** Baselined features: transform + SD floor in transformed units (latencies/pauses are right-skewed → log(1 + ms/100)). */
export const FEATURES = Object.freeze({
  onsetMs: { log: true, sdFloor: 0.15 },
  contentOnsetMs: { log: true, sdFloor: 0.15 },
  pauseFrac: { sdFloor: 0.03 },
  longestPauseMs: { log: true, sdFloor: 0.15 },
  articulationWps: { sdFloor: 0.25 },
  voicedFrac: { sdFloor: 0.03 },
  fillerLeadMs: { log: true, sdFloor: 0.15 },
  durRatio: { log: false, sdFloor: 0.1 },
  finalRelDb: { sdFloor: 1 },
  durationMs: { log: true, sdFloor: 0.15 },
});
export const CONTEXTS = ["answer", "read_aloud"];
export const LANG_MODES = ["hi", "hinglish", "en", "unk"];
export const FORMS = ["number", "word", "choice_spoken", "explain", "read_aloud"];

const transform = (feature, x) => (FEATURES[feature]?.log ? Math.log(1 + Math.max(0, x) / 100) : x);
const key = (context, langMode, form, feature) => `${context}|${langMode}|${form}|${feature}`;

/** Same rule as server/voice/features.js welfordStep (exact to nMax, then EW with α = 1/nMax; m2 = var·(n−1)). */
export function welfordStep(b, x, nMax = N_MAX) {
  const nTotal = b.nTotal + 1;
  if (b.n < nMax) {
    const n = b.n + 1;
    const delta = x - b.mean;
    const mean = b.mean + delta / n;
    return { n, nTotal, mean, m2: b.m2 + delta * (x - mean) };
  }
  const a = 1 / nMax;
  const delta = x - b.mean;
  const v = (1 - a) * (variance(b) + a * delta * delta);
  return { n: b.n, nTotal, mean: b.mean + a * delta, m2: v * (b.n - 1) };
}
export const variance = (b) => (b.n > 1 ? b.m2 / (b.n - 1) : 0);
export const emptyStat = () => ({ n: 0, nTotal: 0, mean: 0, m2: 0 });

export class VsBaseline {
  /** @param {Record<string, {n:number,nTotal:number,mean:number,m2:number}>} [rows] */
  constructor(rows = {}) {
    this.rows = { ...rows };
    this.dirty = new Set();
  }

  stat(context, langMode, form, feature) {
    return this.rows[key(context, langMode, form, feature)] ?? emptyStat();
  }

  /** Reliable turns only (the caller gates on q ≥ 0.5, not barge-in, not read-aloud for answer features). */
  update(context, langMode, form, f) {
    for (const [feature, x] of Object.entries(f)) {
      if (!FEATURES[feature] || typeof x !== "number" || !Number.isFinite(x)) continue;
      const k = key(context, langMode, form, feature);
      this.rows[k] = welfordStep(this.rows[k] ?? emptyStat(), transform(feature, x));
      this.dirty.add(k);
    }
  }

  /** z per feature (null while n < MIN_N), plus n for maturity. */
  z(context, langMode, form, f) {
    const z = {};
    let nMin = Infinity;
    for (const [feature, x] of Object.entries(f)) {
      const spec = FEATURES[feature];
      if (!spec || typeof x !== "number" || !Number.isFinite(x)) continue;
      const b = this.stat(context, langMode, form, feature);
      nMin = Math.min(nMin, b.n);
      if (b.n < MIN_N) { z[feature] = null; continue; }
      const sd = Math.max(Math.sqrt(variance(b)), spec.sdFloor);
      const v = (transform(feature, x) - b.mean) / sd;
      z[feature] = Math.max(-Z_CLIP, Math.min(Z_CLIP, Math.round(v * 1000) / 1000));
    }
    return { z, n: Number.isFinite(nMin) ? nMin : 0 };
  }

  /** Maturity m = n/(n+K) for E-only terms; 0 below MIN_N (SPEC §4.2). */
  static maturity(n) {
    return n < MIN_N ? 0 : n / (n + MATURITY_K);
  }
}

// ───────────── I/O (proposed schema; injected query function) ─────────────

/** HMAC-SHA256(child_id, key) → Buffer. The key is VOICESIG_SUBJECT_KEY from the secret store; never logged. */
export function subjectOf(childId, keyBytes) {
  if (!keyBytes || String(keyBytes).length < 16) throw new Error("voicesig: subject key missing or too short");
  return createHmac("sha256", keyBytes).update(String(childId)).digest();
}

/**
 * Load a child's persisted baseline (V2 granted) or an empty session baseline (V2 absent). One query.
 * @param {(sql: string, params: unknown[]) => Promise<any[]>} q  @param {{ childId: string, key: string, v2: boolean }} o
 */
export async function loadBaseline(q, o) {
  if (!o.v2) return { baseline: new VsBaseline(), persisted: false };
  const subject = subjectOf(o.childId, o.key);
  const rows = await q(
    "select context, lang_mode, form, feature, n, n_total, mean, m2 from voicesig.baseline where subject = $1",
    [subject],
  );
  const map = {};
  for (const r of rows) map[key(r.context, r.lang_mode, r.form, r.feature)] = { n: r.n, nTotal: r.n_total, mean: r.mean, m2: r.m2 };
  return { baseline: new VsBaseline(map), persisted: true };
}

/**
 * Write back the dirty rows at lesson end (one batch, optimistic lock on n_total). No-op without V2.
 * Returns the number of rows written. A concurrent lesson that advanced n_total wins; this write is dropped for that row.
 * @param {(sql: string, params: unknown[]) => Promise<any[]>} q
 * @param {{ childId: string, key: string, v2: boolean, band: string, consentVer: string }} o @param {VsBaseline} b
 */
export async function saveBaseline(q, o, b) {
  if (!o.v2 || !b.dirty.size) return 0;
  const subject = subjectOf(o.childId, o.key);
  await q(
    "insert into voicesig.subject (subject, child_id, consent_ver, granted_at, band) values ($1, $2, $3, now(), $4) " +
      "on conflict (subject) do update set last_seen = now(), band = excluded.band",
    [subject, o.childId, o.consentVer, o.band],
  );
  let n = 0;
  for (const k of b.dirty) {
    const [context, langMode, form, feature] = k.split("|");
    const s = b.rows[k];
    const r = await q(
      "insert into voicesig.baseline (subject, context, lang_mode, form, feature, n, n_total, mean, m2) " +
        "values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (subject, context, lang_mode, form, feature) do update set " +
        "n = excluded.n, n_total = excluded.n_total, mean = excluded.mean, m2 = excluded.m2, updated_at = now() " +
        "where voicesig.baseline.n_total < excluded.n_total returning 1",
      [subject, context, langMode, form, feature, s.n, s.nTotal, s.mean, s.m2],
    );
    n += r.length;
  }
  b.dirty.clear();
  return n;
}

/** V2 withdrawal: delete the subject (cascades to baseline + calibration). Synchronous on the Controls action. */
export async function withdraw(q, o) {
  const subject = subjectOf(o.childId, o.key);
  await q("delete from voicesig.subject where subject = $1", [subject]);
}
