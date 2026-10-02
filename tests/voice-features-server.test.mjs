// Server side of voice features: Welford baselines, per-child z-scores, the capped tie-breaker signals,
// validation (numbers only, allowlisted), and authorization of both routes (no database: deps injected).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  welfordStep, variance, emptyBaseline, zOf, scoreBatch, signalsFrom, validateUtterance, makeRoutes, trendRow,
  MIN_BASELINE_N, N_MAX, Z_CLIP, BASELINED, FEATURE_RANGES, MASTERY_NUDGE_CAP,
} from "../server/voice/features.js";
import { forbidden, HttpError } from "../server/http.js";

const rng = (seed = 3) => () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const gauss = (r) => Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(2 * Math.PI * r());

// ───────────── Welford ─────────────

test("Welford matches the batch mean and sample variance", () => {
  const r = rng();
  const xs = Array.from({ length: 200 }, () => 3 + 2 * gauss(r));
  let b = emptyBaseline();
  for (const x of xs) b = welfordStep(b, x);
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
  const v = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / (xs.length - 1);
  assert.equal(b.n, 200);
  assert.equal(b.nTotal, 200);
  assert.ok(Math.abs(b.mean - mean) < 1e-9);
  assert.ok(Math.abs(variance(b) - v) < 1e-9);
});

test("Welford past N_MAX becomes an exponential window and follows a drifting child", () => {
  let b = emptyBaseline();
  const r = rng(9);
  for (let i = 0; i < N_MAX; i++) b = welfordStep(b, 2 + 0.3 * gauss(r));
  assert.equal(b.n, N_MAX);
  // The child's speech rate grows to 3 w/s; the baseline must catch up instead of freezing at 2.
  for (let i = 0; i < 4 * N_MAX; i++) b = welfordStep(b, 3 + 0.3 * gauss(r));
  assert.equal(b.n, N_MAX, "n is capped");
  assert.equal(b.nTotal, 5 * N_MAX, "nTotal keeps counting");
  assert.ok(Math.abs(b.mean - 3) < 0.1, `mean ${b.mean}`);
  assert.ok(Math.abs(Math.sqrt(variance(b)) - 0.3) < 0.08, `sd ${Math.sqrt(variance(b))}`);
});

test("z: null until MIN_BASELINE_N, SD floor, clip, log transform for latencies", () => {
  let b = emptyBaseline();
  for (let i = 0; i < MIN_BASELINE_N - 1; i++) b = welfordStep(b, 2);
  assert.equal(zOf("speechRateWps", 2.5, b), null, "too young");
  b = welfordStep(b, 2);
  // Constant baseline → SD floor (0.2) instead of z = ∞.
  assert.equal(zOf("speechRateWps", 2.4, b), 2);
  assert.equal(zOf("speechRateWps", 100, b), Z_CLIP);
  assert.equal(zOf("speechRateWps", -100, b), -Z_CLIP);
  assert.equal(zOf("notBaselined", 1, b), null);
  // onsetMs is z-scored in log(1 + ms/100) space.
  let o = emptyBaseline();
  for (const ms of [600, 800, 700, 900, 650, 750, 850, 700, 800, 700]) o = welfordStep(o, Math.log(1 + ms / 100));
  const zSlow = zOf("onsetMs", 3000, o), zFast = zOf("onsetMs", 300, o);
  assert.ok(zSlow > 3, `3 s onset vs ~750 ms baseline: ${zSlow}`);
  assert.ok(zFast < -2, `300 ms onset: ${zFast}`);
});

test("scoreBatch: an utterance is scored against the baseline BEFORE it; unreliable ones never touch it", () => {
  const mk = (rate, reliable = true) => ({ context: "answer", reliable, features: { speechRateWps: rate, durationMs: 1000, voicedFrac: 0.5, words: 3 } });
  const warm = Array.from({ length: MIN_BASELINE_N }, (_, i) => mk(2 + (i % 2 ? 0.1 : -0.1)));
  const { next, scored } = scoreBatch(warm, new Map());
  assert.ok(scored.every((s) => s.z.speechRateWps === null), "young baseline → null z");
  const key = "answer|speechRateWps";
  assert.equal(next.get(key).n, MIN_BASELINE_N);
  const r2 = scoreBatch([mk(1.0), mk(9, false)], next);
  assert.ok(r2.scored[0].z.speechRateWps <= -Z_CLIP + 0.01, "a much slower turn is strongly negative");
  assert.equal(r2.scored[1].z.speechRateWps, null, "unreliable → no z");
  assert.equal(r2.next.get(key).n, MIN_BASELINE_N + 1, "only the reliable one updated the baseline");
  // Contexts have separate baselines: read-aloud never compares against answers.
  const r3 = scoreBatch([{ ...mk(1.0), context: "read_aloud" }], next);
  assert.equal(r3.scored[0].z.speechRateWps, null);
});

// ───────────── signals ─────────────

test("signalsFrom: needs two agreeing cues; one extreme feature fires nothing", () => {
  assert.deepEqual(signalsFrom({}), {});
  assert.deepEqual(signalsFrom({ onsetMs: 4, speechRateWps: 0, pauseFrac: 0, disfluencyPer100Words: 0 }), {}, "one cue alone");
  assert.deepEqual(signalsFrom({ onsetMs: 2, disfluencyPer100Words: 1.6 }), {}, "too few cues available to compare");
  assert.deepEqual(signalsFrom({ onsetMs: 2, disfluencyPer100Words: 1.6, speechRateWps: 0 }), { followUpProbe: true });
  assert.deepEqual(signalsFrom({ onsetMs: 2, disfluencyPer100Words: 1.6, f0EndSlopeStPerS: 1.7, speechRateWps: 0 }),
    { followUpProbe: true, gentlerHint: true });
  assert.deepEqual(signalsFrom({ speechRateWps: -1.8, longestPauseMs: 1.9, onsetMs: 0 }), { followUpProbe: true, slowerPace: true },
    "slow speech + long pauses → slower pace (and they are two hesitation cues)");
  assert.deepEqual(signalsFrom({ speechRateWps: -1.8, longestPauseMs: null, onsetMs: 0, disfluencyPer100Words: 0 }), {});
  // Non-numbers are ignored, not coerced.
  assert.deepEqual(signalsFrom({ onsetMs: "9", disfluencyPer100Words: NaN, speechRateWps: null }), {});
});

test("signalsFrom output is capped tie-breakers: only the three boolean keys, never a label", () => {
  const r = rng(5);
  const allowed = new Set(["slowerPace", "gentlerHint", "followUpProbe"]);
  for (let i = 0; i < 2000; i++) {
    const z = {};
    for (const k of Object.keys(BASELINED)) if (r() < 0.8) z[k] = (r() - 0.5) * 2 * Z_CLIP;
    const s = signalsFrom(z);
    for (const [k, v] of Object.entries(s)) {
      assert.ok(allowed.has(k), `unexpected key ${k}`);
      assert.equal(v, true);
    }
  }
  assert.ok(MASTERY_NUDGE_CAP > 0 && MASTERY_NUDGE_CAP <= 0.05);
});

// ───────────── validation ─────────────

const base = { durationMs: 1200, voicedFrac: 0.6, words: 4, speechRateWps: 3.3 };

test("validation: allowlisted numeric features only, reliability rules", () => {
  const v = validateUtterance({ context: "answer", asrConf: 0.9, features: base });
  assert.equal(v.reliable, true);
  assert.throws(() => validateUtterance({ features: { ...base, transcript: "mera naam" } }), /unknown feature: transcript/);
  assert.throws(() => validateUtterance({ features: { ...base, words: "4" } }), /out of range: words/);
  assert.throws(() => validateUtterance({ features: { ...base, voicedFrac: 2 } }), /out of range/);
  assert.throws(() => validateUtterance({ features: { ...base, f0MedianHz: Infinity } }), /out of range/);
  assert.throws(() => validateUtterance({ features: { voicedFrac: 0.5, words: 1 } }), /missing feature: durationMs/);
  assert.throws(() => validateUtterance({ context: "emotion", features: base }), /invalid context/);
  assert.throws(() => validateUtterance({ itemId: "<script>", features: base }), /invalid itemId/);
  assert.equal(validateUtterance({ asrConf: 0.3, features: base }).reliable, false, "low ASR confidence (rule 7)");
  assert.equal(validateUtterance({ bargeIn: true, features: base }).reliable, false, "barge-in");
  assert.equal(validateUtterance({ features: { ...base, durationMs: 200 } }).reliable, false, "too short");
  assert.equal(validateUtterance({ features: base }).reliable, true, "unknown ASR confidence is not low confidence");
  for (const [k, [lo, hi]] of Object.entries(FEATURE_RANGES)) assert.ok(lo < hi, k);
});

// ───────────── routes + authorization (fake deps) ─────────────

const G1 = "11111111-1111-1111-1111-111111111111", G2 = "22222222-2222-2222-2222-222222222222";
const C1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", C2 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const L1 = "cccccccc-cccc-cccc-cccc-cccccccccccc";

function fakeDeps() {
  const writes = [];
  const children = { [C1]: G1, [C2]: G2 };
  const d = {
    writes,
    requireChildCalls: [],
    one: async (sql, params) => (sql.includes("from lesson") && params[0] === L1 ? { id: L1, child_id: C1 } : null),
    q: async (sql, params) => {
      if (sql.includes("from voice_baseline")) return [];
      if (sql.includes("from voice_feature")) return [{ week: "2026-09-28", n: 5, speech_rate: 2.345, speech_rate_n: 4, onset_ms: 812.4, onset_n: 3, disfl_events: 3, answer_words: 40, wcpm: null, wcpm_n: 0, _params: params }];
      return [];
    },
    tx: async (stmts) => { writes.push(...stmts); return stmts.map((_, i) => [{ id: i + 1 }]); },
    requireChild: async (req, childId) => {
      d.requireChildCalls.push(childId);
      const g = req.headers["x-guardian"];
      if (!g) throw new HttpError(401, "not signed in");
      if (children[childId] !== g) throw forbidden("child not found for this account");
      return { guardian: { id: g }, child: { id: childId } };
    },
  };
  return d;
}
function call(fn, { guardian, url = "/", body } = {}) {
  const res = { statusCode: 0, headers: {}, body: null, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b ? JSON.parse(b) : null; } };
  const req = { url, headers: guardian ? { "x-guardian": guardian } : {} };
  return fn(req, res, body).then(() => res);
}
const utt = { context: "answer", asrConf: 0.9, features: base };

test("POST /api/voice/features: the lesson's guardian may write; another guardian gets 403 and nothing is written", async () => {
  const d = fakeDeps();
  const R = makeRoutes(d);
  const post = R["POST /api/voice/features"];
  const ok = await call(post, { guardian: G1, body: { lessonId: L1, utterances: [utt] } });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.body.utterances.length, 1);
  assert.equal(ok.body.utterances[0].reliable, true);
  assert.ok(d.writes.some((s) => s.text.includes("insert into voice_feature")));
  assert.ok(d.writes.some((s) => s.text.includes("insert into voice_baseline")));
  assert.ok(d.writes.every((s) => !JSON.stringify(s.params).includes("transcript")));

  const d2 = fakeDeps();
  const post2 = makeRoutes(d2)["POST /api/voice/features"];
  await assert.rejects(call(post2, { guardian: G2, body: { lessonId: L1, utterances: [utt] } }), (e) => e.status === 403);
  await assert.rejects(call(post2, { body: { lessonId: L1, utterances: [utt] } }), (e) => e.status === 401);
  assert.equal(d2.writes.length, 0);
});

test("POST /api/voice/features: the child comes from the lesson, never from the body", async () => {
  const d = fakeDeps();
  const post = makeRoutes(d)["POST /api/voice/features"];
  // Guardian 2 names their own child in the body but posts to guardian 1's lesson.
  await assert.rejects(call(post, { guardian: G2, body: { lessonId: L1, childId: C2, utterances: [utt] } }), (e) => e.status === 403);
  assert.deepEqual(d.requireChildCalls, [C1]);
  assert.equal(d.writes.length, 0);
});

test("POST /api/voice/features: input errors", async () => {
  const post = makeRoutes(fakeDeps())["POST /api/voice/features"];
  await assert.rejects(call(post, { guardian: G1, body: { lessonId: "x", utterances: [utt] } }), (e) => e.status === 400);
  await assert.rejects(call(post, { guardian: G1, body: { lessonId: L1, utterances: [] } }), (e) => e.status === 400);
  await assert.rejects(call(post, { guardian: G1, body: { lessonId: L1, utterances: Array(21).fill(utt) } }), (e) => e.status === 400);
  await assert.rejects(call(post, { guardian: G1, body: { lessonId: "dddddddd-dddd-dddd-dddd-dddddddddddd", utterances: [utt] } }), (e) => e.status === 404);
  await assert.rejects(call(post, { guardian: G1, body: { lessonId: L1, utterances: [{ features: { ...base, audio: 1 } }] } }), (e) => e.status === 400);
});

test("GET /api/voice/trends: own child only; weekly rows shaped for the parent report", async () => {
  const d = fakeDeps();
  const get = makeRoutes(d)["GET /api/voice/trends"];
  const res = await call(get, { guardian: G1, url: `/api/voice/trends?childId=${C1}&weeks=8` });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.weeks[0], {
    weekStart: "2026-09-28", n: 5, speechRateWps: 2.35, speechRateN: 4, onsetMs: 812, onsetN: 3,
    disfluencyPer100Words: 7.5, answerWords: 40, wcpm: null, wcpmN: 0,
  });
  await assert.rejects(call(get, { guardian: G1, url: `/api/voice/trends?childId=${C2}` }), (e) => e.status === 403);
  await assert.rejects(call(get, { guardian: G1, url: `/api/voice/trends?childId=nope` }), (e) => e.status === 400);
  await assert.rejects(call(get, { url: `/api/voice/trends?childId=${C1}` }), (e) => e.status === 401);
});

test("trendRow: no words → null disfluency, Date weeks", () => {
  const r = trendRow({ week: new Date("2026-09-21T00:00:00Z"), n: 1, speech_rate: null, onset_ms: null, disfl_events: 0, answer_words: 0, wcpm: 88.123, wcpm_n: 1 });
  assert.equal(r.weekStart, "2026-09-21");
  assert.equal(r.disfluencyPer100Words, null);
  assert.equal(r.wcpm, 88.12);
});

test("the router serves both routes via server/routes/voice.js", async () => {
  const { routes } = await import("../server/routes/voice.js");
  assert.equal(typeof routes["POST /api/voice/features"], "function");
  assert.equal(typeof routes["GET /api/voice/trends"], "function");
});
