// Adversarial TaxilaFDB runs (critique of duplex v2, 2026-10-04): the frozen test split under world perturbations
// (perturb.mjs) for every compared arm, plus two diagnostics the benchmark does not report:
//   - pause-length strata: cut-off rate by gold pause length, and the rate re-weighted to the runtime's own band prior
//     (BAND_PACE B3 hold pauses p50 600 / p90 1,600 ms, lognormal [E]) instead of TaxilaFDB's designed pause mix;
//   - "silence timer in disguise": which rule ended each respond turn (engine vs G10 silence backstop) and the device
//     silence at the decision.
//
//   node evals/duplex/critic/stress.mjs --conds base,sttReal,slow,quiet,phone,sttReal+slow+phone \
//        --arms stage-a,silence-640,cascade-900,silence-640-gov --lanes D4,FAST [--workers 3] [--name stress] [--limit N]
// Writes evals/duplex/results/critic-<name>-2026-10-04.json. Pure CPU, USD 0.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fork } from "node:child_process";
import { listStreams, loadStream, runStream, sttTimeline, STREAMS } from "../taxilafdb/world.mjs";
import { armSpec, SilenceEngine } from "../taxilafdb/arms.mjs";
import { facts, aggregate, quantile } from "../taxilafdb/metrics.mjs";
import { SttSim, STT, rng } from "../streams.mjs";
import { applyConds } from "./perturb.mjs";

const DATE = "2026-10-04";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, "../../..");
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const h32 = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; };

function arm(name, lane, sttHook) {
  // silence-640-gov: the silence timer behind the FULL governor (holds, horizon, verdict gate, backstops): isolates what the
  // governor alone buys, so the engine's own contribution is stage-a minus this arm
  const spec = name === "silence-640-gov" ? { name, vad: 1500, engine: () => new SilenceEngine(640) } : armSpec(name, {});
  // every arm (control included) gets its STT through this factory, so runs within one report share one random path
  const sttFactory = (d) => {
    const tl = sttTimeline(d);
    if (sttHook) sttHook(tl);
    return new SttSim(tl, rng(h32(`${d.id}|${lane}|stt`)), STT[lane], { serverVadMs: spec.vad ?? 1500 });
  };
  return { ...spec, lane, sttFactory };
}

function extraFacts(r, f) {
  // device silence at the decision that ended a respond turn ≈ gap (decision − last voiced gold frame); end rule from reason
  // duck: her audible back-off (the reflex) after a child onset over her line, for overlap scenarios
  const on = r.g.childOnset, over = f.overlapExpected && on !== null && r.g.where !== "after_her";
  const duck = over ? (r.duckAt || []).find((t) => t >= on - 100) : undefined;
  return { endReason: f.endReason ?? null, gap: f.gap ?? null, endClass: f.endClass ?? null, overlap: f.overlapExpected ?? null,
    duckLatency: over && duck !== undefined ? duck - on : null,
    pauses: (f.pauses || []).map((p) => ({ cls: p.cls, ms: p.ms, thinking: p.thinking, takeover: p.takeover })) };
}

if (process.env.CRITIC_WORKER) {
  process.on("message", async (m) => {
    if (m.kind !== "job") return;
    if (m.verdictMs) { const { VERDICT } = await import("../../../src/duplex/config.ts"); VERDICT.delayMs = m.verdictMs; }
    if (m.paceK !== null && m.paceK !== undefined) { const { TURN_PACE } = await import("../../../src/duplex/config.ts"); TURN_PACE.k = m.paceK; }
    const out = [];
    for (const id of m.ids) for (const cond of m.conds) {
      const parts = cond.split("+");
      for (const lane of m.lanes) for (const a of m.arms) {
        try {
          const { d, sttHook } = applyConds(loadStream(id), parts);
          const r = await runStream(d, arm(a, lane, sttHook));
          const f = facts(r);
          out.push({ cond, f, x: extraFacts(r, f) });
        } catch (e) { out.push({ error: `${id} ${cond} ${a} ${lane}: ${String(e?.stack || e).slice(0, 300)}` }); }
      }
    }
    process.send({ kind: "done", out });
  });
} else {
  const conds = opt("--conds", "base,sttReal").split(",");
  const arms = opt("--arms", "stage-a,silence-640,cascade-900").split(",");
  const lanes = opt("--lanes", "D4,FAST").split(",");
  const workers = Number(opt("--workers", Math.max(1, Math.min(3, os.cpus().length - 1))));
  const name = opt("--name", "stress");
  const fams = opt("--families", null)?.split(",") ?? null;
  const split = opt("--split", "test");
  const verdictMs = Number(opt("--verdict-ms", 0)) || null;
  const paceK = opt("--pace-k", null) === null ? null : Number(opt("--pace-k", null));
  let ids = listStreams().filter((id) => { const m = JSON.parse(fs.readFileSync(path.join(STREAMS, `${id}.json`), "utf8")).meta; return m.split === split && (!fams || fams.includes(m.family)); });
  const limit = Number(opt("--limit", 0));
  if (limit) ids = ids.filter((_, i) => i % Math.ceil(ids.length / limit) === 0);
  console.log(`critic ${name}: ${ids.length} ${split} streams × conds [${conds}] × arms [${arms}] × lanes [${lanes}] on ${workers} workers`);
  const t0 = Date.now();
  const chunks = Array.from({ length: workers }, () => []);
  ids.forEach((id, i) => chunks[i % workers].push(id));
  const res = await Promise.all(chunks.filter((c) => c.length).map((c) => new Promise((resolve, reject) => {
    const w = fork(new URL(import.meta.url).pathname, [], { env: { ...process.env, CRITIC_WORKER: "1" }, execArgv: ["--max-old-space-size=3000"] });
    w.on("message", (m) => { if (m.kind === "done") { resolve(m.out); w.kill(); } });
    w.on("error", reject);
    w.on("exit", (code) => { if (code) reject(new Error(`worker exit ${code}`)); });
    w.send({ kind: "job", ids: c, conds, arms, lanes, verdictMs, paceK });
  })));
  const all = res.flat();
  const errors = all.filter((x) => x.error).map((x) => x.error);
  const rows = all.filter((x) => x.f);
  // band-prior weights for thinking pauses: lognormal p50 600 / p90 1,600 (BAND_PACE B3 [E]) over 250 ms bins
  const mu = Math.log(600), sd = (Math.log(1600) - Math.log(600)) / 1.2816;
  const cdf = (x) => 0.5 * (1 + erf((Math.log(x) - mu) / (sd * Math.SQRT2)));
  function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
  const BINS = [250, 500, 750, 1000, 1500, 2000, 3000, 5000, 1e9];
  const table = {};
  for (const cond of conds) for (const lane of lanes) for (const a of arms) {
    const R = rows.filter((x) => x.cond === cond && x.f.arm === a && x.f.lane === lane);
    const F = R.map((x) => x.f);
    const ag = aggregate(F);
    const thinking = R.flatMap((x) => x.x.pauses.filter((p) => p.thinking));
    const strata = [];
    let wsum = 0, wcut = 0;
    for (let i = 0; i < BINS.length - 1; i++) {
      const inBin = thinking.filter((p) => p.ms >= BINS[i] && p.ms < BINS[i + 1]);
      const w = cdf(BINS[i + 1]) - cdf(BINS[i]);
      const rate = inBin.length ? inBin.filter((p) => p.takeover).length / inBin.length : null;
      strata.push({ bin: `${BINS[i]}-${BINS[i + 1] >= 1e9 ? "inf" : BINS[i + 1]}`, n: inBin.length, cutoff: rate === null ? null : +rate.toFixed(3), priorWeight: +w.toFixed(3) });
      if (rate !== null) { wsum += w; wcut += w * rate; }
    }
    const resp = R.filter((x) => x.x.endClass === "respond" && x.x.gap !== null);
    const byReason = {};
    for (const x of resp) { const k = x.x.endReason ?? "none"; byReason[k] = (byReason[k] || 0) + 1; }
    const gaps = resp.map((x) => x.x.gap);
    table[`${cond}|${a}@${lane}`] = {
      streams: F.length,
      cutoffThinking: ag.M2_thinkingCutoff, turnCutoff: ag.M2_turnCutoff, gap: ag.M3_gapDecision, audible: ag.M3_gapAudible, missed2s: ag.M4_missedRespond,
      holdViolation: ag.M12_holdViolation, verdictOnRepaired: ag.M11_verdictOnRepaired, repairCollision: ag.M11_repairCollision,
      distressDetected: ag.M13_detected, nonSafetyAfterDistress: ag.M13_nonSafetySpeechAfterDistress, falseSafety: ag.M13_falseSafety,
      yield: ag.M7_yieldLatency, keepTalking: ag.M8_keepTalkingStrict, falseYieldTV: ag.M9_falseYield, nodsPerS: ag.M6_nodsPerS,
      pauseStrata: strata, cutoffAtBandPrior: wsum ? +(wcut / wsum).toFixed(3) : null,
      respondEndRule: byReason, respondDecisionsUnder300ms: gaps.length ? +(gaps.filter((g) => g < 300).length / gaps.length).toFixed(3) : null,
      respondGapP10: gaps.length ? Math.round(quantile(gaps, 0.1)) : null,
      duckLatency: (() => { const v = R.map((x) => x.x.duckLatency).filter((z) => z !== null && z !== undefined); return v.length ? { n: v.length, p50: Math.round(quantile(v, 0.5)), p90: Math.round(quantile(v, 0.9)) } : null; })(),
    };
  }
  const h = crypto.createHash("sha1");
  for (const dir of ["src/duplex", "server/duplex"]) for (const f of fs.readdirSync(path.join(ROOT, dir)).sort()) if (/\.(ts|js)$/.test(f)) h.update(f).update(fs.readFileSync(path.join(ROOT, dir, f)));
  const out = { id: `critic-${name}`, date: DATE, runtimeHash: h.digest("hex").slice(0, 12), split, verdictMs: verdictMs ?? "config", paceK: paceK ?? "config", streams: ids.length, conds, arms, lanes,
    method: "evals/duplex/critic/{perturb,stress}.mjs over the TaxilaFDB test split at L1 (world.mjs + the real src/duplex runtime); perturbations are world-side and identical across arms; CIs = 95% bootstrap over scenarios (1,000). Perturbation parameters [E], calibrated where stated on the L2 real-STT run (n=48 streams).",
    seconds: Math.round((Date.now() - t0) / 1000), nErrors: errors.length, errors: errors.slice(0, 10), table };
  const file = path.join(ROOT, "evals/duplex/results", `critic-${name}-${DATE}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 1));
  console.log(`done in ${out.seconds} s, ${errors.length} errors → ${path.relative(ROOT, file)}`);
  if (errors.length) console.log(errors.slice(0, 3).join("\n"));
  for (const [k, v] of Object.entries(table)) {
    console.log(k.padEnd(40), `cut ${v.cutoffThinking.rate} [${v.cutoffThinking.ci95}] prior ${v.cutoffAtBandPrior} | gap ${v.gap.p50}/${v.gap.p90} | miss ${v.missed2s.rate} | hold ${v.holdViolation.k}/${v.holdViolation.n} | vRep ${v.verdictOnRepaired.k}/${v.verdictOnRepaired.n} | det ${v.distressDetected.k}/${v.distressDetected.n} unsafe ${v.nonSafetyAfterDistress?.k}/${v.nonSafetyAfterDistress?.n} | <300 ${v.respondDecisionsUnder300ms} | ${JSON.stringify(v.respondEndRule)}`);
  }
}
