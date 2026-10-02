// Child voice features, server side (decision voice-features-longitudinal):
//   POST /api/voice/features  { lessonId, utterances: [UtteranceFeatures] } → stored + per-child z-scores
//   GET  /api/voice/trends?childId=&weeks=  → weekly speech rate, onset latency, disfluency rate, WCPM
// The client (src/voice/) computes the features on the device; only numbers arrive here — never audio and
// never transcript text (the allowlist below rejects anything else). Every feature is normalised against
// the child's OWN running baseline (Welford, per child × context × feature), and the only thing decisions
// may read is signalsFrom(z): capped tie-breakers, never an emotion or ability label (learning-science §1.10,
// rules 7-8; Azure Code of Conduct on emotion inference).
//
// Director call site (server/director/** is not this module's to edit): in server/routes/lesson.js `turn`,
// after classify() and before step(), read the newest reliable row for the lesson —
//   const v = await latestSignals(lesson.id, { withinMs: 15_000 });
// — and pass `v.signals` into step() as a tie-breaker input: followUpProbe may turn a bare "correct" into a
// "why?" probe, gentlerHint may choose the lower hint rung, slowerPace may lengthen the next pause/turn
// budget. None of them may move pKnown by more than MASTERY_NUDGE_CAP. Better still (no race with the turn
// POST): accept TurnRequest.voiceFeatures and call recordUtterances() in-process, then signalsFrom(z).
import { q, one, tx } from "../db.js";
import { requireChild } from "../auth.js";
import { bad, need, notFound, send, HttpError } from "../http.js";

// ───────────── feature schema ─────────────

/** Every feature the client may send, with its physical range. Anything else is rejected. */
export const FEATURE_RANGES = {
  durationMs: [0, 120_000], voicedFrac: [0, 1], f0MedianHz: [50, 800], f0IqrSt: [0, 36],
  f0SlopeStPerS: [-100, 100], f0EndSlopeStPerS: [-200, 200], rmsMeanDb: [-130, 0], rmsStdDb: [0, 80],
  rmsP90Db: [-130, 0], pauseCount: [0, 500], pauseTotalMs: [0, 120_000], longestPauseMs: [0, 120_000],
  pauseFrac: [0, 1], flatVoicedRuns: [0, 500], onsetMs: [0, 20_000], words: [0, 2000], speechRateWps: [0, 15],
  articulationWps: [0, 20], fillerCount: [0, 2000], repetitionCount: [0, 2000], selfCorrectionCount: [0, 2000],
  disfluencyPer100Words: [0, 10_000], targetWords: [0, 2000], wcpm: [0, 600], readAccuracy: [0, 1],
};
const REQUIRED = ["durationMs", "voicedFrac", "words"];
export const CONTEXTS = ["answer", "read_aloud"];
export const MAX_UTTERANCES = 20;

/**
 * Features that get a per-child baseline and a z-score, with the transform applied first (latencies and
 * pause lengths are right-skewed: z on log(1 + ms/100)) and the SD floor in transformed units (stops a
 * near-constant early baseline turning noise into z = 10).
 */
export const BASELINED = {
  onsetMs: { log: true, sdFloor: 0.15 },
  speechRateWps: { sdFloor: 0.2 },
  articulationWps: { sdFloor: 0.25 },
  pauseFrac: { sdFloor: 0.03 },
  longestPauseMs: { log: true, sdFloor: 0.15 },
  disfluencyPer100Words: { sdFloor: 2 },
  f0MedianHz: { sdFloor: 8 },
  f0IqrSt: { sdFloor: 0.5 },
  f0EndSlopeStPerS: { sdFloor: 2 },
  rmsMeanDb: { sdFloor: 1.5 },
  voicedFrac: { sdFloor: 0.03 },
  wcpm: { sdFloor: 5 },
  readAccuracy: { sdFloor: 0.03 },
};
/** No z-score until the child has this many reliable utterances of the context for that feature. */
export const MIN_BASELINE_N = 8;
/** Beyond this the baseline becomes an exponential window (α = 1/N_MAX): children change, it must follow. */
export const N_MAX = 300;
export const Z_CLIP = 4;
/** Below this ASR confidence the turn is stored but excluded from baselines, z and signals (rule 7). */
export const MIN_ASR_CONF = 0.5;
/** Shorter than this, rate and pause statistics are noise. */
export const MIN_RELIABLE_MS = 300;

const transform = (feature, x) => (BASELINED[feature]?.log ? Math.log(1 + x / 100) : x);

/** Validate one client utterance → normalised record, or throw 400. */
export function validateUtterance(u) {
  if (!u || typeof u !== "object" || Array.isArray(u)) throw bad("utterance must be an object");
  const context = u.context ?? "answer";
  if (!CONTEXTS.includes(context)) throw bad("invalid context");
  if (u.itemId != null && (typeof u.itemId !== "string" || !/^[\w:.\-]{1,80}$/.test(u.itemId))) throw bad("invalid itemId");
  if (u.asrConf != null && !(typeof u.asrConf === "number" && u.asrConf >= 0 && u.asrConf <= 1)) throw bad("invalid asrConf");
  if (u.bargeIn != null && typeof u.bargeIn !== "boolean") throw bad("invalid bargeIn");
  const f = u.features;
  if (!f || typeof f !== "object" || Array.isArray(f)) throw bad("missing features");
  const features = {};
  for (const [k, v] of Object.entries(f)) {
    const range = FEATURE_RANGES[k];
    if (!range) throw bad(`unknown feature: ${k}`);
    if (v == null) continue;
    if (typeof v !== "number" || !Number.isFinite(v) || v < range[0] || v > range[1]) throw bad(`feature out of range: ${k}`);
    features[k] = v;
  }
  for (const k of REQUIRED) if (features[k] == null) throw bad(`missing feature: ${k}`);
  const bargeIn = u.bargeIn === true;
  const asrConf = u.asrConf ?? null;
  const reliable = !bargeIn && (asrConf == null || asrConf >= MIN_ASR_CONF) && features.durationMs >= MIN_RELIABLE_MS;
  return { context, itemId: u.itemId ?? null, asrConf, bargeIn, reliable, features };
}

// ───────────── running baseline (Welford, capped) ─────────────

/** @typedef {{ n: number, nTotal: number, mean: number, m2: number }} Baseline */
export const emptyBaseline = () => ({ n: 0, nTotal: 0, mean: 0, m2: 0 });

/**
 * One Welford step. Exact up to N_MAX samples; after that n stays at nMax and the update is the
 * exponentially-weighted mean/variance with α = 1/nMax (var' = (1-α)(var + α·δ²)), stored as m2 = var·(n-1)
 * so variance() reads the same way in both regimes. nTotal counts every sample ever (optimistic-lock token).
 * @param {Baseline} b @param {number} x @returns {Baseline}
 */
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
/** Sample variance (0 below two samples). */
export const variance = (b) => (b.n > 1 ? b.m2 / (b.n - 1) : 0);

/** z of x against a baseline, or null while the baseline is too young. Clipped to ±Z_CLIP. */
export function zOf(feature, x, b) {
  const spec = BASELINED[feature];
  if (!spec || !b || b.n < MIN_BASELINE_N || x == null) return null;
  const sd = Math.max(Math.sqrt(variance(b)), spec.sdFloor);
  const z = (transform(feature, x) - b.mean) / sd;
  return Math.max(-Z_CLIP, Math.min(Z_CLIP, Math.round(z * 100) / 100));
}

/**
 * Score a batch in order against the child's baselines: each utterance's z uses the baseline BEFORE it
 * (an utterance never dilutes its own surprise), then reliable utterances update the baseline.
 * Pure: returns { scored: [{ z, signals }], next: Map(key → Baseline), touched: Set(key) }.
 * @param {Array<ReturnType<typeof validateUtterance>>} utterances
 * @param {Map<string, Baseline>} baselines key `${context}|${feature}`
 */
export function scoreBatch(utterances, baselines) {
  const next = new Map(baselines);
  const touched = new Set();
  const scored = utterances.map((u) => {
    const z = {};
    for (const feature of Object.keys(BASELINED)) {
      const x = u.features[feature];
      if (x == null) continue;
      const key = `${u.context}|${feature}`;
      z[feature] = u.reliable ? zOf(feature, x, next.get(key)) : null;
      if (u.reliable) {
        next.set(key, welfordStep(next.get(key) ?? emptyBaseline(), transform(feature, x)));
        touched.add(key);
      }
    }
    return { z, signals: u.reliable ? signalsFrom(z) : {} };
  });
  return { scored, next, touched };
}

// ───────────── tie-breaker signals ─────────────

/** Any use of these signals in the learner model may move pKnown by at most this much (rule 7). */
export const MASTERY_NUDGE_CAP = 0.03;
/** A cue counts when the child is this many of their OWN standard deviations from their usual. */
export const CUE_Z = 1.5;
/** Fewer baselined cues than this → no signal at all (not enough to compare against). */
export const MIN_CUES_AVAILABLE = 3;

/**
 * zFeatures → { slowerPace?, gentlerHint?, followUpProbe? }. Capped tie-breakers: booleans only, each needs
 * at least two independent cues to agree (a single noisy feature never fires anything), and the output
 * never names a state of the child. Hesitation cues follow West et al. 2025 (fillers, longer onset on
 * incorrect/low-confidence trials in 5-8-year-olds) and Brennan & Williams 1995 (rising terminal pitch).
 *   followUpProbe — ≥2 hesitation cues: worth a "why?" / transfer probe even if the answer was right.
 *   gentlerHint   — ≥3 hesitation cues: on a wrong answer, prefer the gentler hint rung.
 *   slowerPace    — slow speech AND long pauses together: the teacher slows down and waits longer.
 * @param {Record<string, number | null | undefined>} z
 * @returns {{ slowerPace?: true, gentlerHint?: true, followUpProbe?: true }}
 */
export function signalsFrom(z) {
  const v = (k) => (typeof z?.[k] === "number" && Number.isFinite(z[k]) ? z[k] : null);
  const onset = v("onsetMs");
  const pause = [v("pauseFrac"), v("longestPauseMs")].filter((x) => x != null);
  const pauseHigh = pause.length ? Math.max(...pause) : null;
  const disfl = v("disfluencyPer100Words");
  const rising = v("f0EndSlopeStPerS");
  const rate = [v("speechRateWps"), v("articulationWps")].filter((x) => x != null);
  const rateLow = rate.length ? Math.min(...rate) : null;
  const cues = [onset, pauseHigh, disfl, rising, rateLow == null ? null : -rateLow];
  const available = cues.filter((c) => c != null).length;
  if (available < MIN_CUES_AVAILABLE) return {};
  const hesitation = cues.filter((c) => c != null && c >= CUE_Z).length;
  const out = {};
  if (hesitation >= 2) out.followUpProbe = true;
  if (hesitation >= 3) out.gentlerHint = true;
  if (rateLow != null && rateLow <= -CUE_Z && pauseHigh != null && pauseHigh >= CUE_Z) out.slowerPace = true;
  return out;
}

// ───────────── persistence ─────────────

const UUID = /^[0-9a-f-]{36}$/i;
const PER_MINUTE = 120;
const recent = new Map();
/** Per guardian per process: a child produces a few utterances a minute; this bounds a misbehaving client. */
export function allowFeatures(guardianId, count, now = Date.now()) {
  if (recent.size > 5000) for (const [id, ts] of recent) if (ts.at(-1) <= now - 60_000) recent.delete(id);
  const ts = (recent.get(guardianId) ?? []).filter((t) => t > now - 60_000);
  const ok = ts.length + count <= PER_MINUTE;
  if (ok) for (let i = 0; i < count; i++) ts.push(now);
  recent.set(guardianId, ts);
  return ok;
}

/** Load the child's baselines for the contexts in play → Map(`${context}|${feature}` → Baseline). */
async function loadBaselines(d, childId, contexts) {
  const rows = await d.q(
    "select context, feature, n, n_total, mean, m2 from voice_baseline where child_id = $1 and context = any($2::text[])",
    [childId, contexts]);
  return new Map(rows.map((r) => [`${r.context}|${r.feature}`,
    { n: Number(r.n), nTotal: Number(r.n_total), mean: Number(r.mean), m2: Number(r.m2) }]));
}

/**
 * Store a validated batch for a lesson's child and update baselines in one transaction. The baseline upsert
 * is guarded by n_total (optimistic lock): a concurrent batch that already moved the row wins, and this
 * batch's contribution to that one row is dropped rather than double-counted.
 * → [{ id, reliable, z, signals }]
 */
export async function recordUtterances(d, { lessonId, childId, utterances }) {
  const contexts = [...new Set(utterances.map((u) => u.context))];
  const before = await loadBaselines(d, childId, contexts);
  const { scored, next, touched } = scoreBatch(utterances, before);
  const stmts = utterances.map((u, i) => ({
    text: `insert into voice_feature (child_id, lesson_id, item_id, context, asr_conf, barge_in, reliable, f, z, signals)
           values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb) returning id`,
    params: [childId, lessonId, u.itemId, u.context, u.asrConf, u.bargeIn, u.reliable,
      JSON.stringify(u.features), JSON.stringify(scored[i].z), JSON.stringify(scored[i].signals)],
  }));
  for (const key of touched) {
    const [context, feature] = key.split("|");
    const b = next.get(key);
    const prevTotal = before.get(key)?.nTotal ?? 0;
    stmts.push({
      text: `insert into voice_baseline (child_id, context, feature, n, n_total, mean, m2, updated_at)
             values ($1, $2, $3, $4, $5, $6, $7, now())
             on conflict (child_id, context, feature) do update
               set n = excluded.n, n_total = excluded.n_total, mean = excluded.mean, m2 = excluded.m2, updated_at = now()
               where voice_baseline.n_total = $8`,
      params: [childId, context, feature, b.n, b.nTotal, b.mean, b.m2, prevTotal],
    });
  }
  const rows = await d.tx(stmts);
  return utterances.map((u, i) => ({ id: Number(rows[i]?.[0]?.id), reliable: u.reliable, ...scored[i] }));
}

/** Newest reliable utterance's signals for a lesson (the Director's read path). */
export async function latestSignals(lessonId, { withinMs = 15_000 } = {}, d = defaultDeps) {
  const row = await d.one(
    `select z, signals, at from voice_feature where lesson_id = $1 and reliable and at > now() - ($2 || ' milliseconds')::interval
     order by at desc limit 1`, [lessonId, String(withinMs)]);
  return row ? { z: row.z, signals: row.signals, at: row.at } : { z: {}, signals: {} };
}

// ───────────── routes ─────────────

const defaultDeps = { q, one, tx, requireChild };

/** Route factory: deps injectable so authorization is tested without a database. */
export function makeRoutes(d = defaultDeps) {
  /** @type {(req: any, res: any, body: { lessonId: string, utterances: unknown[] }) => Promise<void>} */
  async function postFeatures(req, res, body) {
    const { lessonId } = need(body, "lessonId");
    if (!UUID.test(String(lessonId))) throw bad("invalid lessonId");
    const list = Array.isArray(body.utterances) ? body.utterances : body.utterance ? [body.utterance] : null;
    if (!list || !list.length) throw bad("missing utterances");
    if (list.length > MAX_UTTERANCES) throw bad(`at most ${MAX_UTTERANCES} utterances per request`);
    const lesson = await d.one("select id, child_id from lesson where id = $1", [lessonId]);
    if (!lesson) throw notFound("lesson not found");
    // The child is the LESSON's child, never a body field: a guardian can only write their own child's rows.
    const { guardian, child } = await d.requireChild(req, lesson.child_id);
    const utterances = list.map(validateUtterance);
    if (!allowFeatures(guardian.id, utterances.length)) throw new HttpError(429, "too many feature uploads");
    const out = await recordUtterances(d, { lessonId: lesson.id, childId: child.id, utterances });
    send(res, 200, { utterances: out });
  }

  /** @type {(req: any, res: any) => Promise<void>} */
  async function trends(req, res) {
    const params = new URL(req.url || "/", "http://x").searchParams;
    const childId = params.get("childId") || "";
    if (!UUID.test(childId)) throw bad("invalid childId");
    const weeks = Math.min(52, Math.max(1, Number.parseInt(params.get("weeks") || "12", 10) || 12));
    const { child } = await d.requireChild(req, childId);
    const rows = await d.q(TRENDS_SQL, [child.id, String(weeks)]);
    send(res, 200, { childId: child.id, weeks: rows.map(trendRow) }, { "cache-control": "no-store" });
  }

  return {
    "POST /api/voice/features": postFeatures,
    "GET /api/voice/trends": trends,
  };
}

/**
 * Weekly series (weeks start Monday, IST). Medians, not means: one wandering-off onset must not move a week.
 * Disfluency is pooled (sum of events / sum of words) so long and short turns weigh by their words.
 * Only reliable utterances count; WCPM only from read-aloud turns, the rest only from answers.
 */
export const TRENDS_SQL = `
  select (date_trunc('week', at at time zone 'Asia/Kolkata'))::date as week,
         count(*)::int as n,
         percentile_cont(0.5) within group (order by (f->>'speechRateWps')::float8)
           filter (where context = 'answer' and f ? 'speechRateWps') as speech_rate,
         count(*) filter (where context = 'answer' and f ? 'speechRateWps')::int as speech_rate_n,
         percentile_cont(0.5) within group (order by (f->>'onsetMs')::float8)
           filter (where context = 'answer' and f ? 'onsetMs') as onset_ms,
         count(*) filter (where context = 'answer' and f ? 'onsetMs')::int as onset_n,
         sum(coalesce((f->>'fillerCount')::float8, 0) + coalesce((f->>'repetitionCount')::float8, 0)
             + coalesce((f->>'selfCorrectionCount')::float8, 0)) filter (where context = 'answer') as disfl_events,
         sum((f->>'words')::float8) filter (where context = 'answer') as answer_words,
         percentile_cont(0.5) within group (order by (f->>'wcpm')::float8)
           filter (where context = 'read_aloud' and f ? 'wcpm') as wcpm,
         count(*) filter (where context = 'read_aloud' and f ? 'wcpm')::int as wcpm_n
    from voice_feature
   where child_id = $1 and reliable and at > now() - ($2 || ' weeks')::interval
   group by 1
   order by 1`;

const r2 = (x) => (x == null ? null : Math.round(Number(x) * 100) / 100);
/** DB row → API shape (also unit-tested). */
export function trendRow(r) {
  const words = Number(r.answer_words) || 0;
  const week = r.week instanceof Date ? r.week.toISOString().slice(0, 10) : String(r.week).slice(0, 10);
  return {
    weekStart: week,
    n: Number(r.n),
    speechRateWps: r2(r.speech_rate), speechRateN: Number(r.speech_rate_n) || 0,
    onsetMs: r.onset_ms == null ? null : Math.round(Number(r.onset_ms)), onsetN: Number(r.onset_n) || 0,
    disfluencyPer100Words: words > 0 ? r2((100 * Number(r.disfl_events || 0)) / words) : null, answerWords: words,
    wcpm: r2(r.wcpm), wcpmN: Number(r.wcpm_n) || 0,
  };
}

export const routes = makeRoutes();
