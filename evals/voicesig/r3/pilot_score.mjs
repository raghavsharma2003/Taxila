// The consented pilot's PRE-REGISTERED scorer (docs/design/round3/voicesig/PILOT-PROTOCOL.md §6). Written before any child
// data exists, so the bars cannot be fitted to the data. Input: the study folder the coordinator assembles in the private
// Azure container (India) and downloads to a study machine:
//   <dir>/participants.json   { "P07": { "ageBand": "9-10"|"11-14", "langMode": "hi"|"hinglish"|"en", "mic": "builtin"|... } }
//   <dir>/sessions/<code>.wav + <code>.json   the device's PilotRecorder files (16 kHz P track + numbers-only sidecar)
//   <dir>/coding/<code>.<coder>.json          blind coder marks, ms from the WAV start:
//        { "fillers": [[startMs, endMs]], "pauses": [[atMs, "continued"|"ended"]] }   (two coders: A is primary)
//   <dir>/states.json (optional)  [{ child, state, outcome: true|false }]   one row per fired knowledge state with its
//        outcome joined (fragileCorrect: delayed / transfer FAILED; searching: recognition probe SUCCEEDED; heldBelief:
//        the same wrong answer CAME BACK; rapidGuess: the re-ask DISAGREED; fluentRecall: delayed SUCCEEDED; absent:
//        recognition FAILED). States are read from brain_trace vs.* codes; outcomes from the scheduler / probe rows.
// The detector and the thinking-pause cue are re-run here on the recorded P track with the SAME code the device runs
// (product front-end, src/voicesig/holdCue.ts, onnxruntime-web), so a pilot number is a product number.
//   node evals/voicesig/r3/pilot_score.mjs <dir> [--model models/voicesig/filler-gru-r3.onnx] [--thr p] [--out results.json]
import fs from "node:fs";
import path from "node:path";
import { features, pack, loadDetector, f32, ROOT } from "./lib.mjs";
import { HoldCueCore, HOLD_CUE_DEFAULTS } from "../../../src/voicesig/holdCue.ts";
import { FILLER_MIN_MS } from "../../../src/voicesig/frontend/gruInput.ts";

/** The bars, frozen 2026-10-09 (PILOT-PROTOCOL.md §6). Changing one is a reviewed diff with a new date. */
export const BARS = Object.freeze({
  coding: Object.freeze({ fillerF1Min: 0.8 }),
  detector: Object.freeze({ precision: 0.8, lo95: 0.72, minRuns: 300, minChildren: 20, perGroupPrecision: 0.75, perGroupMinRuns: 50 }),
  cue: Object.freeze({ precision: 0.85, lo95: 0.75, minFired: 100, minChildren: 15, maxFiredAtEnds: 0.05 }),
  state: Object.freeze({ precision: 0.8, lo95: 0.7, minFired: 100, minChildren: 20, maxChildShare: 0.1 }),
});

/** Child-clustered percentile bootstrap of sum(k)/sum(n). rows: [{ c, k, n }]. Deterministic. */
export function clusterBoot(rows, B = 2000, seed = 11) {
  const by = new Map();
  for (const r of rows) { const a = by.get(r.c) ?? [0, 0]; a[0] += r.k; a[1] += r.n; by.set(r.c, a); }
  const keys = [...by.keys()];
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const reps = [];
  for (let b = 0; b < B; b++) {
    let k = 0, n = 0;
    for (let i = 0; i < keys.length; i++) { const v = by.get(keys[Math.floor(rnd() * keys.length)]); k += v[0]; n += v[1]; }
    if (n) reps.push(k / n);
  }
  reps.sort((a, b) => a - b);
  const K = rows.reduce((a, r) => a + r.k, 0), N = rows.reduce((a, r) => a + r.n, 0);
  return { est: N ? K / N : null, lo95: reps.length ? reps[Math.floor(0.025 * reps.length)] : null, hi95: reps.length ? reps[Math.floor(0.975 * reps.length)] : null, n: N, clusters: keys.length };
}

const overlaps = (a0, a1, b0, b1) => a0 < b1 && b0 < a1;

/** Coder-coder filler agreement: event F1 by overlap (each mark matched at most once). */
export function fillerF1(A, B) {
  const used = new Set();
  let tp = 0;
  for (const [a0, a1] of A) {
    const j = B.findIndex(([b0, b1], i) => !used.has(i) && overlaps(a0, a1, b0, b1));
    if (j >= 0) { used.add(j); tp++; }
  }
  const p = B.length ? tp / B.length : null, r = A.length ? tp / A.length : null;
  return p !== null && r !== null && p + r > 0 ? 2 * p * r / (p + r) : null;
}

/** Detector runs (ms from the WAV start) on speech frames, outside her spans. */
export function runsOf(frames, p, thr, herMs = [], minMs = FILLER_MIN_MS) {
  const need = Math.ceil(minMs / 20);
  const out = [];
  let s = -1;
  const inHer = (t) => herMs.some(([a, b]) => t >= a - 200 && t <= b + 300);
  for (let i = 0; i <= frames.length; i++) {
    const on = i < frames.length && frames[i].speech && p[i] >= thr && !inHer(frames[i].t);
    if (on && s < 0) s = i;
    if (!on && s >= 0) { if (i - s >= need) out.push([frames[s].t, frames[i - 1].t + 20]); s = -1; }
  }
  return out;
}

/** Score one session (pure given the detector output). */
export function scoreSession({ frames, p, cueReads, thr, coding, herMs }) {
  const runs = runsOf(frames, p, thr, herMs);
  const fills = (coding.fillers ?? []).filter(([a, b]) => b - a >= 100);
  const tp = runs.filter(([a, b]) => fills.some(([c, d]) => overlaps(a, b, c, d))).length;
  const hit = fills.filter(([c, d]) => runs.some(([a, b]) => overlaps(a, b, c, d))).length;
  // the cue: each fired read is matched to the coder's pause label nearest its offset (within 400 ms)
  let cueK = 0, cueN = 0, endsFired = 0;
  const ends = (coding.pauses ?? []).filter(([, l]) => l === "ended");
  for (const r of cueReads.filter((x) => x.fired)) {
    const lab = (coding.pauses ?? []).map(([t, l]) => [Math.abs(t - r.offsetMs), l]).filter(([d]) => d <= 400).sort((a, b) => a[0] - b[0])[0];
    if (!lab) continue;
    cueN++;
    if (lab[1] === "continued") cueK++; else endsFired++;
  }
  return { runs: runs.length, tp, fillers: fills.length, hit, cueK, cueN, endsFired, ends: ends.length };
}

/** Apply the frozen bars to per-child rows. */
export function judge(rows, participants, stateRows = []) {
  const res = { bars: BARS };
  const det = clusterBoot(rows.map((r) => ({ c: r.child, k: r.tp, n: r.runs })));
  const children = new Set(rows.filter((r) => r.runs > 0).map((r) => r.child)).size;
  const groups = {};
  for (const key of ["ageBand", "langMode"]) for (const r of rows) {
    const g = `${key}:${participants[r.child]?.[key] ?? "unknown"}`;
    (groups[g] ??= []).push({ c: r.child, k: r.tp, n: r.runs });
  }
  const groupP = Object.fromEntries(Object.entries(groups).map(([g, rs]) => [g, clusterBoot(rs)]));
  const B = BARS.detector;
  const groupFail = Object.entries(groupP).filter(([, v]) => v.n >= B.perGroupMinRuns && v.est < B.perGroupPrecision).map(([g]) => g);
  const recallK = rows.reduce((a, r) => a + r.hit, 0), recallN = rows.reduce((a, r) => a + r.fillers, 0);
  res.detector = { ...det, children, recall: recallN ? recallK / recallN : null, groups: groupP,
    pass: det.n >= B.minRuns && children >= B.minChildren && det.est >= B.precision && det.lo95 >= B.lo95 && !groupFail.length, groupFail };
  const cue = clusterBoot(rows.map((r) => ({ c: r.child, k: r.cueK, n: r.cueN })));
  const C = BARS.cue;
  const endsN = rows.reduce((a, r) => a + r.ends, 0), endsF = rows.reduce((a, r) => a + r.endsFired, 0);
  const cueChildren = new Set(rows.filter((r) => r.cueN > 0).map((r) => r.child)).size;
  res.cue = { ...cue, children: cueChildren, firedAtEnds: endsN ? endsF / endsN : null,
    pass: cue.n >= C.minFired && cueChildren >= C.minChildren && cue.est >= C.precision && cue.lo95 >= C.lo95 && (endsN ? endsF / endsN : 1) <= C.maxFiredAtEnds };
  const S = BARS.state;
  res.states = {};
  for (const st of [...new Set(stateRows.map((r) => r.state))]) {
    const rs = stateRows.filter((r) => r.state === st);
    const b = clusterBoot(rs.map((r) => ({ c: r.child, k: r.outcome ? 1 : 0, n: 1 })));
    const per = new Map();
    for (const r of rs) per.set(r.child, (per.get(r.child) ?? 0) + 1);
    const maxShare = rs.length ? Math.max(...per.values()) / rs.length : 0;
    res.states[st] = { ...b, children: per.size, maxChildShare: maxShare,
      pass: b.n >= S.minFired && per.size >= S.minChildren && maxShare <= S.maxChildShare && b.est >= S.precision && b.lo95 >= S.lo95 };
  }
  return res;
}

async function main() {
  const argv = process.argv.slice(2);
  const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
  const dir = argv[0];
  const model = opt("--model", ROOT + "models/voicesig/filler-gru-r3.onnx");
  const card = JSON.parse(fs.readFileSync(model.replace(/\.onnx$/, ".json"), "utf8"));
  const thr = Number(opt("--thr", card.threshold));
  const participants = JSON.parse(fs.readFileSync(path.join(dir, "participants.json"), "utf8"));
  const det = await loadDetector(model);
  const rows = [];
  const agreement = [];
  for (const wav of fs.readdirSync(path.join(dir, "sessions")).filter((f) => f.endsWith(".wav")).sort()) {
    const code = wav.replace(/\.wav$/, "").replace(/^taxila-pilot-/, "").split("-").slice(0, 2).join("-");
    const child = code.split("-")[0];
    const side = JSON.parse(fs.readFileSync(path.join(dir, "sessions", wav.replace(/\.wav$/, ".json")), "utf8"));
    const buf = fs.readFileSync(path.join(dir, "sessions", wav));
    const x = f32(buf.subarray(44));
    const { frames, xs } = features(x);
    const { x: X, T } = pack(xs);
    const p = await det.detect(X, T);
    // the cue, exactly as the device runs it (reads answered at once)
    const core = new HoldCueCore({ ...HOLD_CUE_DEFAULTS, thr, ...(card.holdCue ?? {}) });
    const cueReads = [];
    for (let i = 0; i < frames.length; i++) {
      const a = core.frame(frames[i], xs[i]);
      if (a.kind === "read") {
        const pr = await det.detect(a.x, a.frames);
        const r = core.result(a.pauseId, pr, a.offsetIdx);
        cueReads.push({ fired: !!r?.fired, offsetMs: frames[Math.max(0, i - (a.frames - 1 - a.offsetIdx))].t });
      }
    }
    const t0 = side.segments?.[0]?.t ?? side.startedAt;
    const herMs = (side.herSpans ?? []).map(([a, b]) => [a - t0, b - t0]);
    const codings = fs.readdirSync(path.join(dir, "coding")).filter((f) => f.startsWith(code + "."));
    const A = codings.find((f) => f.endsWith(".A.json")) ?? codings[0];
    if (!A) { console.warn(`${code}: no coding, skipped`); continue; }
    const coding = JSON.parse(fs.readFileSync(path.join(dir, "coding", A), "utf8"));
    const Bf = codings.find((f) => f !== A);
    if (Bf) agreement.push(fillerF1(coding.fillers ?? [], JSON.parse(fs.readFileSync(path.join(dir, "coding", Bf), "utf8")).fillers ?? []));
    rows.push({ child, code, ...scoreSession({ frames, p, cueReads, thr, coding, herMs }) });
  }
  const stateRows = fs.existsSync(path.join(dir, "states.json")) ? JSON.parse(fs.readFileSync(path.join(dir, "states.json"), "utf8")) : [];
  const res = judge(rows, participants, stateRows);
  const f1s = agreement.filter((v) => v !== null);
  res.coding = { sessionsDoubleCoded: f1s.length, fillerF1Mean: f1s.length ? f1s.reduce((a, b) => a + b, 0) / f1s.length : null };
  res.coding.pass = res.coding.fillerF1Mean !== null && res.coding.fillerF1Mean >= BARS.coding.fillerF1Min;
  if (!res.coding.pass) res.note = "coder agreement below the bar: detector and cue results are NOT JUDGEABLE (the truth is the bottleneck), not failed";
  res.label = "CONSENTED PILOT CHILDREN (PILOT-PROTOCOL.md); population: children; method: product front-end + detector re-run on the device's recorded P track, against blind coder marks";
  res.model = path.relative(ROOT, model);
  res.thr = thr;
  res.date = new Date().toISOString().slice(0, 10);
  res.perSession = rows;
  const out = opt("--out", path.join(dir, "pilot-score.json"));
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  const { perSession, ...head } = res;
  console.log(JSON.stringify(head, null, 1));
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
