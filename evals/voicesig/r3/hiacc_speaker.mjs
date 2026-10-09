// HiACC (EVALUATION ONLY; licence recorded in evals/voicesig/CORPORA.md): one speaker's utterances, concatenated as one
// session with 0.8 s quiet gaps (so the front-end's running references carry across turns as in a lesson), through the
// product front-end, the detector graph (onnxruntime-web WASM) and the thinking-pause cue (src/voicesig/holdCue.ts).
// Numbers out (one JSON line per model); the caller deletes the wav. Called by hiacc_eval.py.
//   node evals/voicesig/r3/hiacc_speaker.mjs <speaker.wav> <segments.json> <model.onnx>:<thr> [<model2>:<thr2> ...]
import fs from "node:fs";
import { features, pack, loadDetector, f32 } from "./lib.mjs";
import { HoldCueCore, HOLD_CUE_DEFAULTS } from "../../../src/voicesig/holdCue.ts";
import { FILLER_MIN_MS } from "../../../src/voicesig/frontend/gruInput.ts";

const [wav, segPath, ...models] = process.argv.slice(2);
const segs = JSON.parse(fs.readFileSync(segPath, "utf8")); // [{ id, startMs, endMs, kind }]
const x = f32(fs.readFileSync(wav).subarray(44));
const { frames, xs } = features(x);
const need = Math.ceil(FILLER_MIN_MS / 20);
for (const spec of models) {
  const [model, thrS] = spec.split(":");
  const thr = Number(thrS);
  const det = await loadDetector(model);
  // the detector over each utterance window (+-300 ms), as the head reads a committed turn
  const per = [];
  for (const s of segs) {
    const i0 = frames.findIndex((f) => f.t >= s.startMs - 300);
    let i1 = frames.findIndex((f) => f.t > s.endMs + 300);
    if (i1 < 0) i1 = frames.length;
    if (i0 < 0 || i1 - i0 < 10) continue;
    const { x: X, T } = pack(xs, i0, i1);
    const p = await det.detect(X, T);
    let runs = 0, run = 0, speech = 0, runMs = [];
    for (let i = 0; i <= T; i++) {
      const on = i < T && frames[i0 + i].speech && p[i] >= thr;
      if (i < T && frames[i0 + i].speech) speech++;
      if (on) run++;
      else { if (run >= need) { runs++; runMs.push(run * 20); } run = 0; }
    }
    const f0 = frames.slice(i0, i1).map((f) => f.f0).filter((v) => v);
    f0.sort((a, b) => a - b);
    per.push({ id: s.id, kind: s.kind, speechMs: speech * 20, runs, runMs, f0Median: f0.length ? f0[Math.floor(f0.length / 2)] : null });
  }
  // the thinking-pause cue over the whole session: every utterance end is a pause (the next utterance is another prompt)
  const core = new HoldCueCore({ ...HOLD_CUE_DEFAULTS, thr });
  let reads = 0, fired = 0;
  for (let i = 0; i < frames.length; i++) {
    const a = core.frame(frames[i], xs[i]);
    if (a.kind === "read") { reads++; const r = core.result(a.pauseId, await det.detect(a.x, a.frames), a.offsetIdx); if (r?.fired) fired++; }
  }
  console.log(JSON.stringify({ model, thr, per, cue: { reads, fired } }));
}
