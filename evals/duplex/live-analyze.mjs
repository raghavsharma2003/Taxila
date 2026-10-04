// live-analyze.mjs — duplex prototype, M-D2 analysis (no network): reads results/live-validate-*.json and answers
//   1. calibration: the D4 STT stage distributions the simulator should use (written to results/live-calibration-*.json);
//   2. real-STT outcomes: today's floor (BASE: every server-VAD final is a turn) vs the floor manager running live (DUPLEX);
//   3. REPLAY: the recorded real event streams (real partials, real finals, frames from the same PCM) fed through the CURRENT
//      server/duplex FloorManager offline. Faithful while the probe times do not move (they are set by the ear's 500 ms
//      candidate, which policy changes do not touch); a final that a different commit time would have produced is not
//      re-created, so a replay after a probe-timing change is labelled approximate;
//   4. sim vs live: the simulator replaying the SAME audio (real clip durations and frames) with the calibrated STT model,
//      SEEDS draws per scenario; per scenario, is the live gap inside the simulated p10-p90 band, and do the outcome classes
//      (early commit, safety detection) agree?
//   node evals/duplex/live-analyze.mjs [--seeds 40] [--file results/live-validate-2026-10-04.json]
import fs from "node:fs";
import path from "node:path";
import { RESULTS, ROOT, SR, q, mean, r0, pcmFrames, wilson } from "./lib.mjs";
import { SCENARIOS } from "./scenarios.mjs";
import { STT, calibrate } from "./streams.mjs";
import { runScenario } from "./harness.mjs";
import { FloorManager } from "../../server/duplex/floorManager.js";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const SEEDS = Number(arg("--seeds", 40));
const file = arg("--file", null) ? path.resolve(arg("--file")) : path.join(RESULTS, fs.readdirSync(RESULTS).filter((f) => /^live-validate-.*\.json$/.test(f)).sort().at(-1));
const live = JSON.parse(fs.readFileSync(file, "utf8"));
const tag = path.basename(file).replace(/^live-validate-|\.json$/g, "");
const stat = (a) => ({ n: a.length, p10: r0(q(a, 0.1)), p50: r0(q(a, 0.5)), p90: r0(q(a, 0.9)), mean: r0(mean(a)) });

// ── 1. calibration (+ server-VAD overhead past its 900 ms window, single-final BASE runs) ──
const vadOver = live.base.filter((b) => b.nFinals === 1 && b.vadStop !== null).map((b) => b.vadStop - 900);
const calib = { id: live.id, date: live.date, n: live.n, source: path.basename(file), calibration: { ...live.calibration, vadOverheadMs: stat(vadOver) } };
fs.writeFileSync(path.join(RESULTS, `live-calibration-${tag}.json`), JSON.stringify(calib, null, 1));
const applied = calibrate(calib);

// ── 2. real-STT outcomes ──
const scen = new Map(SCENARIOS.map((s) => [s.id, s]));
const realOutcomes = { base: { gap: [], early: 0, n: 0 }, duplex: { gap: [], early: 0, n: 0, revoked: 0 } };
for (const b of live.base) {
  if (b.expect === "safety") continue;
  realOutcomes.base.n++;
  const run = live.runs.find((r) => r.id === b.id && r.arm === "BASE");
  const finals = run.events.filter((e) => e.type === "final" && e.text.trim());
  if (finals.some((f) => f.t < b.trueEnd)) realOutcomes.base.early++;
  const endF = finals.find((f) => f.t >= b.trueEnd);
  if (endF) realOutcomes.base.gap.push(endF.t - b.trueEnd);
}
for (const d of live.duplex) {
  if (d.expect === "safety") continue;
  realOutcomes.duplex.n++;
  if (d.commits.some((c) => c.t < 0)) realOutcomes.duplex.early++;
  const endC = d.commits.find((c) => c.t >= 0);
  if (endC) realOutcomes.duplex.gap.push(endC.t);
}

// ── 3. offline replay of the recorded real streams through the current floor manager ──
const pcmCache = new Map();
async function framesFor(sc, idx) {
  if (pcmCache.has(sc.id)) return pcmCache.get(sc.id);
  const { assemble } = await import("./tts-features.mjs");
  const a = await assemble(sc, idx);
  const v = { frames: await pcmFrames(a.pcm), segDur: a.segs.map((s) => s.end - s.start), trueEnd: a.trueEnd };
  pcmCache.set(sc.id, v);
  return v;
}
const ids = live.duplex.map((d) => d.id);
const order = SCENARIOS.filter((s) => ids.includes(s.id));
const replay = [];
for (const [idx, sc] of order.entries()) {
  const run = live.runs.find((r) => r.id === sc.id && r.arm === "DUPLEX");
  const { frames, trueEnd } = await framesFor(sc, idx);
  const fm = new FloorManager({});
  fm.step({ type: "handover", t: 0, ctx: sc.ctx });
  const evs = run.events.filter((e) => e.type === "partial" || e.type === "final").map((e) => ({ ...e }));
  const acts = [];
  let ei = 0;
  for (const f of frames) {
    const t = f.t + 20;
    while (ei < evs.length && evs[ei].t <= t) { acts.push(...fm.step({ ...evs[ei] })); ei++; }
    acts.push(...fm.step({ type: "frame", t, rms: f.rms, f0: f.f0 }));
  }
  const commits = acts.filter((a) => a.do === "commit").map((c) => ({ t: c.t - trueEnd, why: c.why, text: c.text }));
  const probes = acts.filter((a) => a.do === "stt_commit").map((a) => a.t);
  const liveProbes = run.commitsSent.map((c) => c.t);
  const moved = probes.length !== liveProbes.length || probes.some((p, i) => Math.abs(p - (liveProbes[i] ?? -1e9)) > 120);
  replay.push({ id: sc.id, cat: sc.cat, expect: sc.truth.expect, trueEnd, commits, early: commits.some((c) => c.t < -20), safety: acts.find((a) => a.do === "safety_attend")?.t ?? null,
    revokes: acts.filter((a) => a.do === "revoke").length, nods: acts.filter((a) => a.do === "nod").length, approximate: moved });
}
const rp = replay.filter((r) => r.expect !== "safety");
const replaySummary = { n: rp.length, earlyCommitTurns: rp.filter((r) => r.early).length, gap: stat(rp.map((r) => r.commits.find((c) => c.t >= -20)?.t).filter((x) => x !== undefined)),
  approximate: replay.filter((r) => r.approximate).length, holdViolations: rp.filter((r) => r.expect === "hold" && r.early).length,
  safetyDetected: replay.filter((r) => r.expect === "safety" && r.safety !== null).length + "/" + replay.filter((r) => r.expect === "safety").length };

// ── 4. sim vs live on the same audio ──
const simVsLive = [];
for (const [idx, sc] of order.entries()) {
  const feat = await framesFor(sc, idx);
  const env = { frames: { [sc.id]: feat.frames }, segDur: { [sc.id]: feat.segDur }, lead: { [sc.id]: 600 } };
  const gapsD = [], gapsB = [];
  let earlyD = 0, safeD = 0;
  for (let s = 1; s <= SEEDS; s++) {
    const rd = runScenario(sc, s, { name: "duplex", kind: "duplex", stt: "D4" }, env);
    const sp = rd.commits.filter((c) => c.revokedAt === undefined || c.revokedAt >= c.firstAudio);
    if (rd.commits.some((c) => c.t < rd.trueEnd - 20)) earlyD++;
    const e = rd.commits.find((c) => c.t >= rd.trueEnd - 20);
    if (e) gapsD.push(e.t - rd.trueEnd);
    if (rd.safety) safeD++;
    const rb = runScenario(sc, s, { name: "base900", kind: "base900", stt: "D4" }, env);
    const eb = rb.sttEvents.find((x) => x.type === "final" && x.t >= rb.trueEnd);
    if (eb) gapsB.push(eb.t - rb.trueEnd);
    void sp;
  }
  // the live side of the comparison is the REPLAY (current floor policy on the recorded real stream), so both sides run the same policy
  const rpRow = replay.find((r) => r.id === sc.id);
  const lv = { commits: rpRow.commits };
  const lb = live.base.find((b) => b.id === sc.id);
  const lvGap = lv.commits.find((c) => c.t >= 0)?.t ?? null;
  const lbRun = live.runs.find((r) => r.id === sc.id && r.arm === "BASE");
  const lbGap = lbRun.events.find((e) => e.type === "final" && e.t >= lb.trueEnd)?.t - lb.trueEnd;
  const band = (a) => [r0(q(a, 0.1)), r0(q(a, 0.5)), r0(q(a, 0.9))];
  const bd = band(gapsD), bb = band(gapsB);
  simVsLive.push({ id: sc.id, cat: sc.cat, live: { duplexGap: lvGap, duplexEarly: lv.commits.some((c) => c.t < 0), baseFinalGap: Number.isFinite(lbGap) ? lbGap : null },
    sim: { duplexGap: bd, duplexEarlyShare: +(earlyD / SEEDS).toFixed(2), baseFinalGap: bb, safetyShare: +(safeD / SEEDS).toFixed(2) },
    duplexGapInBand: lvGap !== null && bd[0] !== null ? lvGap >= bd[0] && lvGap <= bd[2] : null,
    baseGapInBand: Number.isFinite(lbGap) && bb[0] !== null ? lbGap >= bb[0] && lbGap <= bb[2] : null,
    earlyAgree: (earlyD / SEEDS >= 0.5) === lv.commits.some((c) => c.t < 0) });
}
const k = (f) => simVsLive.filter(f).length;
const agree = {
  duplexGapInSimBand: `${k((x) => x.duplexGapInBand)}/${k((x) => x.duplexGapInBand !== null)}`, duplexGapInBandCi80: wilson(k((x) => x.duplexGapInBand), k((x) => x.duplexGapInBand !== null)),
  baseGapInSimBand: `${k((x) => x.baseGapInBand)}/${k((x) => x.baseGapInBand !== null)}`,
  earlyCommitClassAgree: `${k((x) => x.earlyAgree)}/${simVsLive.length}`,
  medianAbsErrDuplexGapMs: r0(q(simVsLive.filter((x) => x.live.duplexGap !== null && x.sim.duplexGap[1] !== null).map((x) => Math.abs(x.live.duplexGap - x.sim.duplexGap[1])), 0.5)),
  medianAbsErrBaseGapMs: r0(q(simVsLive.filter((x) => x.live.baseFinalGap !== null && x.sim.baseFinalGap[1] !== null).map((x) => Math.abs(x.live.baseFinalGap - x.sim.baseFinalGap[1])), 0.5)),
};
const out = {
  id: "M-D2-analysis", date: "2026-10-04", source: path.basename(file), sttD4Calibrated: applied,
  realStt: { base: { n: realOutcomes.base.n, earlyFinalTurns: realOutcomes.base.early, endFinalGap: stat(realOutcomes.base.gap) },
    duplexLive: { n: realOutcomes.duplex.n, earlyCommitTurns: realOutcomes.duplex.early, endCommitGap: stat(realOutcomes.duplex.gap) } },
  replayCurrentFloor: { ...replaySummary, rows: replay },
  simVsLive: { seeds: SEEDS, agree, rows: simVsLive },
};
fs.writeFileSync(path.join(RESULTS, `live-analysis-${tag}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ calibrated: applied, realStt: out.realStt, replay: replaySummary, agree }, null, 1));
for (const r of replay) if (r.early || r.expect === "hold") console.log("replay", r.id, r.expect, JSON.stringify(r.commits.map((c) => [c.t, c.why.slice(0, 50)])));
console.log(`→ ${path.relative(ROOT, path.join(RESULTS, `live-analysis-${tag}.json`))}`);
process.exit(0);
