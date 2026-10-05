// Telemetry fold (STAGECRAFT.md §7.1): StagecraftEvent rows → a per-lesson StagecraftScorecard. Rows carry ids, rungs,
// reasons, times and costs only; never child words, never prompt text. The simulator adds what only it can know (truth
// at the reveal point: stale/wrong/safety/child-speaking/visible failures, the first-frame clock) as `extras`.
const RUNG_TIER = { steer: "instant", library: "instant", engine_default: "instant", board: "instant", generated_spec: "spec", image: "image", live_codegen: "live" };
const q = (xs, p) => { const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
export const quantile = q;

/** @param {object[]} rows @param {{ lessonMs: number, extras?: object }} o */
export function foldLesson(rows, { lessonMs, extras = {} }) {
  // a hot-swap (a better rung of the idea already on stage) is not a new want: it is reported, never counted as readiness,
  // a stage moment or a generated piece (conservative)
  const served = rows.filter((r) => r.kind === "point" && r.servedRung && !r.swap);
  const swaps = rows.filter((r) => r.kind === "point" && r.servedRung && r.swap).length;
  const cost = new Map(), rung = new Map(), revealed = new Set();
  const ttr = { instant: [], spec: [], image: [], live: [] };
  const launched = { instant: 0, spec: 0, image: 0, live: 0 };
  for (const r of rows) {
    if (r.kind === "launched") { rung.set(r.candidateId, r.rung); launched[RUNG_TIER[r.rung]]++; }
    if ((r.kind === "ready" || r.kind === "invalidated" || r.kind === "discarded" || r.kind === "library_return") && r.costUsd != null && r.candidateId) cost.set(r.candidateId, Math.max(cost.get(r.candidateId) ?? 0, r.costUsd));
    if (r.kind === "ready" && Number.isFinite(r.timeToReadyMs)) ttr[RUNG_TIER[r.rung]].push(r.timeToReadyMs);
    if (r.kind === "point" && r.candidateId && r.servedRung && r.servedRung !== "board" && r.servedRung !== "steer") revealed.add(r.candidateId);
  }
  const wastedN = { instant: 0, spec: 0, image: 0, live: 0 };
  let usdSpec = 0, usdImage = 0, usdLive = 0, wasted = 0;
  for (const [id, rg] of rung) {
    const t = RUNG_TIER[rg], c = cost.get(id) ?? 0;
    if (t === "spec") usdSpec += c; else if (t === "image") usdImage += c; else if (t === "live") usdLive += c;
    if (!revealed.has(id)) { wastedN[t]++; if (t === "spec" || t === "image") wasted += c; }
  }
  const byTrigger = {};
  for (const r of served) { const k = r.origin ?? r.source ?? "unknown"; (byTrigger[k] ??= []).push(r.readyWhenNeeded ? 1 : 0); }
  const hours = Math.max(1e-9, lessonMs / 3_600_000);
  return {
    n: served.length,
    readyWhenNeeded: served.map((r) => (r.readyWhenNeeded ? 1 : 0)),
    readyByTrigger: byTrigger,
    timeToReadyMs: ttr,
    launched, wastedBuilds: wastedN,
    usd: { spec: usdSpec, image: usdImage, live: usdLive, speculative: usdSpec + usdImage, wasted },
    perHour: { speculative: (usdSpec + usdImage) / hours, wasted: wasted / hours, wastedSpecN: wastedN.spec / hours, wastedImageN: wastedN.image / hours, wastedLiveN: wastedN.live / hours },
    generatedReveals: served.filter((r) => r.servedRung === "generated_spec" || r.servedRung === "live_codegen").length,
    stageMoments: served.length,
    childInitiated: served.filter((r) => r.childRequested).length,
    specsLaunched: launched.spec,
    held: rows.filter((r) => r.kind === "point" && !r.servedRung).reduce((m, r) => ((m[r.reason] = (m[r.reason] ?? 0) + 1), m), {}),
    swaps,
    quota429: rows.filter((r) => r.kind === "quota_429").length,
    failovers: rows.filter((r) => r.kind === "failover").length,
    ...extras,
  };
}

/** Many lessons → the §6 scorecard (rates over points, per-25-minute counts, quantiles over pooled samples). */
export function foldArm(lessons) {
  const all = (k) => lessons.flatMap((l) => l[k] ?? []);
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const trig = {};
  for (const l of lessons) for (const [k, v] of Object.entries(l.readyByTrigger)) (trig[k] ??= []).push(...v);
  const per25 = (k) => mean(lessons.map((l) => (l[k] * 25 * 60_000) / l.lessonMs));
  const ttr = {};
  for (const t of ["spec", "image", "live"]) { const xs = lessons.flatMap((l) => l.timeToReadyMs[t]); ttr[t] = { n: xs.length, p50: q(xs, 0.5), p90: q(xs, 0.9) }; }
  const sum = (k) => lessons.reduce((a, l) => a + (l[k] ?? 0), 0);
  return {
    lessons: lessons.length,
    points: all("readyWhenNeeded").length,
    readyWhenNeededRate: mean(all("readyWhenNeeded")),
    readyWhenNeededByTrigger: Object.fromEntries(Object.entries(trig).map(([k, v]) => [k, { n: v.length, rate: mean(v) }])),
    timeToReadyMs: ttr,
    requestToFirstFrameMs: { n: all("requestFirstFrameMs").length, p50: q(all("requestFirstFrameMs"), 0.5), p95: q(all("requestFirstFrameMs"), 0.95) },
    wastedBuildsPerLessonHour: { spec: mean(lessons.map((l) => l.perHour.wastedSpecN)), image: mean(lessons.map((l) => l.perHour.wastedImageN)), live: mean(lessons.map((l) => l.perHour.wastedLiveN)) },
    usdPerLessonHour: { total: mean(lessons.map((l) => l.perHour.speculative)), wasted: mean(lessons.map((l) => l.perHour.wasted)), liveTotalUsd: lessons.reduce((a, l) => a + l.usd.live, 0) },
    wrongReveals: sum("wrongReveals"), staleReveals: sum("staleReveals"), safetyTurnReveals: sum("safetyTurnReveals"),
    revealsWhileChildSpeaks: sum("revealsWhileChildSpeaks"), offTopicReveals: sum("offTopicReveals"), visibleFailures: sum("visibleFailures"),
    generatedRevealsPer25: per25("generatedReveals"), stageMomentsPer25: per25("stageMoments"), specsLaunchedPer25: per25("specsLaunched"),
    stageActiveShare: mean(lessons.map((l) => l.stageActiveShare)), medianGapBetweenPiecesMs: q(all("gapsMs"), 0.5),
    childInitiatedShare: sum("childInitiated") / Math.max(1, sum("stageMoments")),
    quota429: sum("quota429"), failovers: sum("failovers"), mountFailures: sum("mountFailures"), staleStageTurns: sum("staleStageTurns"),
    held: lessons.reduce((m, l) => { for (const [k, v] of Object.entries(l.held)) m[k] = (m[k] ?? 0) + v; return m; }, {}),
  };
}
