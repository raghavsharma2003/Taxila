// sim.mjs — duplex prototype, measurement M-D3 (2026-10-04): the floor manager against today's cascade on replayed child turns.
//
// Question: on scripted child turns replayed as timed partial-transcript + audio-feature streams (long mid-thought pauses,
// self-corrections, Hinglish fillers, questions, early answers, interruptions of the teacher, distress), how does the
// server/duplex controller compare with today's 0.9 s-silence cascade on: gap after the true turn end, false take-overs,
// missed turn ends, backchannel timing, speculative-draft hit rate and wasted tokens, and time to first audio?
//
// Method: evals/duplex/scenarios.mjs (96 turns, 10 categories) x SEEDS seeds x arms (harness.mjs). Per seed the child's
// word timing, pause lengths (±20%), pitch/energy frames and the STT model's partial/final delays are re-drawn.
// Audio features: --audio synth (default) = generated contour frames; --audio tts = frames computed from REAL child-voice
// TTS clips (gpt-4o-mini-tts child-instructed, x1.2 pitch, the shipped YIN) with the measured clip durations, built by
// live-validate.mjs's recipe and cached outside the repo (needs Azure the first time; ~USD 0.1).
// STT model: streams.mjs STT.D4 (calibrated from M-D2 live-validate when its result file exists) or STT.MAI.
// Post-commit stages (Director, TTS first byte) are bootstrapped from the 48 measured cascade turns (M-D1's method).
// Draft timings: results/draft-live-*.json when present (measured), else [E] defaults (TTFT 712/889 = MODEL-ROUTER §0).
// Model arm: results/model-cache-*.json (model-arm.mjs) when present.
//
// LIMITS: synthetic speech, one author's scripts, no real children (E1). The category mix is chosen, not sampled from
// lessons, so pooled rates are per-scenario-weighted, not per-lesson. Gap/false-take-over rates are properties of
// this corpus + this STT model; they rank arms, they do not predict a classroom.
//
//   node evals/duplex/sim.mjs [--seeds 20] [--audio synth|tts] [--arms base900,duplex] [--out name]
import fs from "node:fs";
import path from "node:path";
import { SCENARIOS } from "./scenarios.mjs";
import { runScenario, draftModel } from "./harness.mjs";
import { scoreArm } from "./score.mjs";
import { RESULTS, ROOT } from "./lib.mjs";
import { STT, calibrate } from "./streams.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const SEEDS = Number(arg("--seeds", 20));
const AUDIO = arg("--audio", "synth");
const DATE = "2026-10-04";

export const ARMS = {
  base900: { name: "base900", kind: "base900", stt: "D4", note: "today: server VAD 900 ms, every final is a turn" },
  pred500: { name: "pred500", kind: "pred500", stt: "D4", note: "shipped turn.predictive: VAD 500 ms + FragmentMerger" },
  duplex: { name: "duplex", kind: "duplex", stt: "D4", drafts: true, note: "floor manager, code only, W+C drafts" },
  "duplex-cached": { name: "duplex-cached", kind: "duplex", stt: "D4", drafts: true, cachedAudio: true, note: "+ W draft audio pre-synthesised (M-D1 E)" },
  "duplex-noprobe": { name: "duplex-noprobe", kind: "duplex", stt: "D4", drafts: true, opts: { sttProbe: false }, note: "ablation: decide on the lagging partial" },
  "duplex-noprosody": { name: "duplex-noprosody", kind: "duplex", stt: "D4", drafts: true, opts: { prosody: false }, note: "ablation: no prosody tie-breaker" },
  "duplex-norepair": { name: "duplex-norepair", kind: "duplex", stt: "D4", drafts: true, opts: { repair: false }, note: "ablation: no self-repair hold" },
  "duplex-noopencap": { name: "duplex-noopencap", kind: "duplex", stt: "D4", drafts: true, opts: { openToCap: false, explainMinSilence: false }, note: "ablation: no open-tail cap, no G5 1.5 s floor (the pre-replay policy)" },
  "duplex-norevoke": { name: "duplex-norevoke", kind: "duplex", stt: "D4", drafts: true, opts: { revocableMs: 0 }, note: "ablation: commit not revocable" },
  "duplex-levelnods": { name: "duplex-levelnods", kind: "duplex", stt: "D4", drafts: true, opts: { nods: "level" }, note: "reference: level-driven nods" },
  "base900-mai": { name: "base900-mai", kind: "base900", stt: "MAI", note: "today's floor on the India STT" },
  "duplex-mai": { name: "duplex-mai", kind: "duplex", stt: "MAI", drafts: true, note: "floor manager on the India STT" },
  "duplex-mai-cached": { name: "duplex-mai-cached", kind: "duplex", stt: "MAI", drafts: true, cachedAudio: true, note: "India STT + cached W audio" },
};

function latest(prefix) {
  const fs_ = fs.readdirSync(RESULTS).filter((f) => f.startsWith(prefix) && f.endsWith(".json")).sort();
  return fs_.length ? path.join(RESULTS, fs_.at(-1)) : null;
}

export async function loadEnvData({ audio = AUDIO } = {}) {
  const env = { draftModel: draftModel() };
  const live = latest("live-calibration-");
  env.sttCalibration = live ? calibrate(JSON.parse(fs.readFileSync(live, "utf8"))) : null;
  env.modelCaches = {};
  for (const f of fs.readdirSync(RESULTS).filter((x) => x.startsWith("model-cache-") && x.endsWith(".json"))) {
    const d = JSON.parse(fs.readFileSync(path.join(RESULTS, f), "utf8"));
    env.modelCaches[d.deployment] = d.cache;
    // the shorten arm (law 4) and the reference arm where the model decides every candidate
    ARMS[`duplex-shorten:${d.deployment}`] = { name: `duplex-shorten:${d.deployment}`, kind: "duplex", stt: "D4", drafts: true, opts: { model: true }, modelDep: d.deployment, note: `+ ${d.deployment} may shorten holds (p >= 0.9)` };
    ARMS[`duplex-modeldecides:${d.deployment}`] = { name: `duplex-modeldecides:${d.deployment}`, kind: "duplex", stt: "D4", drafts: true, opts: { model: "decide" }, modelDep: d.deployment, note: `REFERENCE: ${d.deployment} decides every candidate (p >= 0.5)` };
  }
  env.modelSource = Object.keys(env.modelCaches).join(",") || null;
  if (audio === "tts") {
    const { ttsFeatures } = await import("./tts-features.mjs");
    Object.assign(env, await ttsFeatures(SCENARIOS));
  }
  return env;
}

export function runArm(arm, env, seeds = SEEDS, scenarios = SCENARIOS) {
  const recs = [];
  const e = arm.modelDep ? { ...env, modelCache: env.modelCaches?.[arm.modelDep] } : env;
  for (const sc of scenarios) for (let s = 1; s <= seeds; s++) recs.push(runScenario(sc, s, arm, e));
  return recs;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const env = await loadEnvData();
  const names = arg("--arms", Object.keys(ARMS).join(",")).split(",").filter((n) => ARMS[n]);
  const scen = new Map(SCENARIOS.map((s) => [s.id, s]));
  const out = { id: "M-D3", date: DATE, seeds: SEEDS, audio: AUDIO, scenarios: SCENARIOS.length, sttD4: STT.D4, sttMAI: STT.MAI,
    sttCalibratedFrom: env.sttCalibration?.source ?? "none (streams.mjs priors)", draftModel: env.draftModel.source, modelCache: env.modelSource, arms: {} };
  for (const n of names) {
    const t0 = Date.now();
    const recs = runArm(ARMS[n], env);
    out.arms[n] = { note: ARMS[n].note, ...scoreArm(recs, scen) };
    console.log(`${n.padEnd(18)} turns ${recs.length}  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  fs.mkdirSync(RESULTS, { recursive: true });
  const file = path.join(RESULTS, `${arg("--out", `sim-${AUDIO}`)}-${DATE}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 1));
  // the headline table
  const row = (n, a) => [n, a.gapAfterTrueEnd.p50, a.gapAfterTrueEnd.p90, a.ttfa.p50, a.ttfa.p90, pct(a.falseTakeover), pct(a.holdViolation), pct(a.missedTurnEnd),
    a.safety.unsafeLineTurns, a.safety.detectAfterDistressSegEnd.p50, pct(a.overlap.accuracy), a.overlap.resolveMs.p50, a.nods.secondsPerNod ?? "-", pct(a.nods.midWord),
    a.drafts ? pct(a.drafts.waitHitRate) : "-", a.drafts ? pct(a.drafts.candidateHitRate) : "-", a.drafts ? a.drafts.wastedTokensPerTurn : "-"].join(" | ");
  console.log("\narm | gap p50 | gap p90 | ttfa p50 | ttfa p90 | false take-over | hold viol | missed end | unsafe lines | safety detect p50 | overlap acc | overlap resolve p50 | s/nod | nod mid-word | W hit | C hit | wasted tok/turn");
  for (const [n, a] of Object.entries(out.arms)) console.log(row(n, a));
  console.log(`→ ${path.relative(ROOT, file)}`);
}

function pct(r) { return r && r.rate !== null ? `${(r.rate * 100).toFixed(1)}%` : "-"; }
