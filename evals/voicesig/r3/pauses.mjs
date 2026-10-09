// Round 3 voicesig: does "the child stopped on a filled pause" mark a THINKING PAUSE (the speaker goes on) rather than the
// end of a turn, on REAL speech, through the product front-end and the real detector graph (onnxruntime-web WASM)?
//
// Data: LiveKit EOT-Bench public sample, Hindi config (livekit/eot-bench-data, CC BY 4.0; unpacked by
// evals/duplex-real/prep-eot.py into the shared scratch set, read only): 400 real ADULT turns, Hindi with some English,
// every silence >= 100 ms annotated; every span but the last is a HOLD, the last is the turn END. Same gain as the duplex
// harness (evals/duplex-real/lib.mjs activeGain: active speech at -20 dBFS, the device AGC's job). NOT children.
//
// Per labelled span [a, b]: the cue reads the detector over the 3 s before the span plus readAfterMs of silence, exactly as
// src/voicesig/holdCue.ts does on the device (trailingFiller(), imported), and fires when a filled-pause run >= 200 ms
// ends within tailGapMs of the last speech frame. Reported: P(hold | fired) (the precision of a "thinking pause" call),
// the share of holds it catches, how often it fires at a real turn end (what it would cost: a longer wait there), by
// span length, with Wilson and turn-clustered CIs; and the empirical P(end | fired) that HoldCueCore publishes as
// pComplete.
//
//   node evals/voicesig/r3/pauses.mjs <eot_dir> --model <onnx> --thr <p> [--name x] [--limit 400] [--tail 120] [--read 120]
import fs from "node:fs";
import path from "node:path";
import { activeGain } from "../../duplex-real/lib.mjs";
import { features, pack, loadDetector, f32, rate, clusterCi, ROOT } from "./lib.mjs";
import { trailingFiller, HOLD_CUE_DEFAULTS } from "../../../src/voicesig/holdCue.ts";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const dir = argv[0];
const model = opt("--model", ROOT + "models/voicesig/filler-gru.onnx");
const thr = Number(opt("--thr", 0.44));
const name = opt("--name", `pauses-eot-hi-${path.basename(model, ".onnx")}`);
const limit = Number(opt("--limit", 400));
const cfg = { ...HOLD_CUE_DEFAULTS, thr, tailGapMs: Number(opt("--tail", 120)), readAfterMs: Number(opt("--read", 120)) };
const thrs = (opt("--sweep", "") || "").split(",").filter(Boolean).map(Number);

const idx = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
const det = await loadDetector(model);
const rows = [];
const t0 = performance.now();
for (const r of idx.rows.slice(0, limit)) {
  const raw = f32(fs.readFileSync(path.join(dir, `${r.id}.s16`)));
  const g = activeGain(raw);
  const x = raw.map((v) => Math.max(-1, Math.min(1, v * g)));
  const { frames, xs } = features(x);
  const ts = frames.map((f) => f.t);
  for (let si = 0; si < r.spans.length; si++) {
    const [a, b] = r.spans[si];
    if (a < 300) continue; // a span at the very start is not a pause after speech
    const from = Math.max(0, ts.findIndex((t) => t >= a - 3000));
    let to = ts.findIndex((t) => t > a + cfg.readAfterMs);
    if (to < 0) to = ts.length;
    if (to - from < 15) continue;
    const { x: X, T } = pack(xs, from, to);
    const p = await det.detect(X, T);
    const speech = frames.slice(from, to).map((f) => f.speech);
    let off = -1;
    for (let i = speech.length - 1; i >= 0; i--) if (speech[i] && ts[from + i] <= a + 60) { off = i; break; }
    if (off < 0) continue;
    const end = si === r.spans.length - 1;
    const res = trailingFiller(speech, p, off, cfg);
    const sweep = Object.fromEntries(thrs.map((th) => [th, trailingFiller(speech, p, off, { ...cfg, thr: th }).fired]));
    rows.push({ id: r.id, end, ms: b - a, fired: res.fired, runMs: res.runMs, gapMs: res.gapMs, sweep });
  }
}
const sec = Math.round((performance.now() - t0) / 1000);

function summary(rs) {
  const fired = rs.filter((r) => r.fired);
  const holds = rs.filter((r) => !r.end), ends = rs.filter((r) => r.end);
  const holdFired = fired.filter((r) => !r.end).length;
  return {
    pauses: rs.length, holds: holds.length, ends: ends.length, baseHoldRate: rate(holds.length, rs.length),
    fired: fired.length,
    precisionHold: { ...rate(holdFired, fired.length), ci95TurnClustered: clusterCi(fired.map((r) => ({ c: r.id, k: r.end ? 0 : 1, n: 1 }))) },
    holdRecall: rate(holdFired, holds.length),
    holdRecall500: rate(holds.filter((r) => r.ms >= 500 && r.fired).length, holds.filter((r) => r.ms >= 500).length),
    firedAtEnds: rate(fired.filter((r) => r.end).length, ends.length),
    pEndGivenFired: fired.length ? +(fired.filter((r) => r.end).length / fired.length).toFixed(3) : null,
  };
}
const res = {
  id: `voicesig-r3-${name}`, date: new Date().toISOString().slice(0, 10),
  label: "REAL RECORDED ADULT SPEECH (LiveKit EOT-Bench Hindi public sample, CC BY 4.0: human-to-agent task calls, Hindi with some English, annotated holds / turn ends). Product front-end + detector graph in onnxruntime-web WASM. NOT children; no STT involved (acoustic cue only).",
  model: path.relative(ROOT, model), thr, cfg: { tailGapMs: cfg.tailGapMs, readAfterMs: cfg.readAfterMs, minFillerMs: cfg.minFillerMs, windowMs: cfg.windowMs },
  seconds: sec, turns: Math.min(limit, idx.rows.length),
  all: summary(rows),
  span500: summary(rows.filter((r) => r.ms >= 500 || r.end)),
  sweep: Object.fromEntries(thrs.map((th) => [th, summary(rows.map((r) => ({ ...r, fired: r.sweep[th] })))])),
};
fs.mkdirSync(path.join(ROOT, "evals/voicesig/results/2026-10-09"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "evals/voicesig/results/2026-10-09", `${name}.json`), JSON.stringify({ ...res, perPause: rows }, null, 1));
console.log(JSON.stringify(res, null, 1));
