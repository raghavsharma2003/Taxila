// Round 3 voicesig → duplex: the THINKING-PAUSE cue (src/voicesig/holdCue.ts) fed into the REAL duplex bridge on the duplex
// stream's own E1 replay (evals/duplex-real: LiveKit EOT-Bench Hindi, CC BY 4.0, real adult speech, the REAL STT events
// recorded live from the production socket, replayed at their recorded times; deterministic). Arms, same recording:
//   off    the current engine as it is (no acoustic estimate: today's production state)
//   cue    + the cue's AcousticEstimate delivered through the host's PUBLIC estimate() (what patch 03's DuplexLive.estimate
//          passthrough exposes); nothing in src/duplex is edited by this harness
//   cue+zh the cue AND patch 02's engine term (the acoustic hold enters zH and so the governor's backstop stretch), loaded
//          from a scratch copy of src/ with docs/design/round3/voicesig/patches/02-engine-acoustic-hold.diff applied (--patched <dir>)
// Scored with the duplex harness's own scoreTurns / aggregate (pause cut-offs on holds >= 500 ms, decision gap at turn
// ends). The cue runs on the voicesig product front-end over the same session audio; the detector windows are computed
// in a first pass (onnxruntime-web is async; the cue is deterministic, so pass 2 replays the identical reads) and applied
// on the frame the read is issued (the device answers in ~1-5 ms, inside one 20 ms hop).
// The duplex stream edits src/duplex in this tree WHILE this runs, so every arm loads the engine AND the duplex-real
// harness from a frozen root (--src: a `git archive HEAD src shared server evals/duplex-real` copy; patch 02 applied for
// cue+zh) and records the engine files' hashes.
//   node evals/voicesig/r3/duplex_replay.mjs <eot_dir> --rec eot-D4-after --arm off|cue|cue+zh --src <frozen root>
//        [--model <onnx>] [--thr p] [--pcomplete p] [--shards 8] [--name x]
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { features, pack, loadDetector, ROOT } from "./lib.mjs";
import { HoldCueCore, HOLD_CUE_DEFAULTS } from "../../../src/voicesig/holdCue.ts";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const dir = argv[0];
const recName = opt("--rec", "eot-D4-after");
const arm = opt("--arm", "cue");
const shards = Number(opt("--shards", 8));
const model = opt("--model", ROOT + "models/voicesig/filler-gru.onnx");
const cfg = { ...HOLD_CUE_DEFAULTS, thr: Number(opt("--thr", 0.44)), pComplete: Number(opt("--pcomplete", HOLD_CUE_DEFAULTS.pComplete)), minFillerMs: Number(opt("--minms", HOLD_CUE_DEFAULTS.minFillerMs)) };
const name = opt("--name", `duplex-${recName}-${arm}`);
const srcRoot = path.resolve(opt("--src", ROOT)) + "/";
const { DuplexLive } = await import(path.join(srcRoot, "src/duplex/live.ts"));
const { framesOf, runSession, pool, HOP_MS } = await import(path.join(srcRoot, "evals/duplex-real/lib.mjs"));
const { buildSession, scoreTurns, aggregate } = await import(path.join(srcRoot, "evals/duplex-real/eot.mjs"));
const det = arm === "off" ? null : await loadDetector(model);

/** Pass 1: run the cue core alone over the session's voicesig frames; compute every read's detector output. */
async function cueReads(x, her) {
  const { frames, xs } = features(x);
  const herAt = (t) => her.some((h) => t >= h.start && t < h.end + 300);
  const core = new HoldCueCore(cfg);
  const reads = [];
  const fired = [];
  for (let i = 0; i < frames.length; i++) {
    const a = core.frame(frames[i], xs[i], herAt(frames[i].t));
    if (a.kind === "read") {
      const p = await det.detect(a.x, a.frames);
      reads.push({ pauseId: a.pauseId, offsetIdx: a.offsetIdx, p });
      const r = core.result(a.pauseId, p, a.offsetIdx);
      if (r?.fired) fired.push(frames[Math.max(0, i - (a.frames - 1 - a.offsetIdx))].t);
    }
  }
  return { frames, xs, reads, fired, stats: core.stats };
}

/** A DuplexLive whose frame() first steps the cue for the same 20 ms hop and hands any estimate to the host. */
function liveWithCue(pre, her) {
  const herAt = (t) => her.some((h) => t >= h.start && t < h.end + 300);
  const byId = new Map(pre.reads.map((r) => [r.pauseId, r]));
  const core = new HoldCueCore(cfg);
  let k = 0;
  const log = { published: 0 };
  class Live extends DuplexLive {
    frame(t, rms, f0, herOutDb) {
      // advance the cue to this duplex frame time (voicesig frame centres are offset by half a hop)
      while (k < pre.frames.length && pre.frames[k].t <= t + HOP_MS / 2) {
        const a = core.frame(pre.frames[k], pre.xs[k], herAt(pre.frames[k].t));
        if (a.kind === "read") { const r = byId.get(a.pauseId); if (r) core.result(a.pauseId, r.p, a.offsetIdx); }
        else if (a.kind === "publish") { log.published++; this.host.estimate({ acoustic: { ...a.est, atMs: t } }, t); }
        k++;
      }
      super.frame(t, rms, f0, herOutDb);
    }
  }
  return { Live, log, core };
}

const idx = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
const rows = idx.rows;
const per = Math.ceil(rows.length / shards);
const recorded = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ROOT, "evals/duplex-real/results", `${recName}.stt.json.gz`))).toString());
const t0 = Date.now();
const out = await pool(Array.from({ length: shards }, (_, s) => async () => {
  const chunk = rows.slice(s * per, (s + 1) * per);
  const S = buildSession(dir, chunk);
  const frames = framesOf(S.x);
  const log = recorded.find((x) => x.shard === s).sttLog;
  let Live = DuplexLive, cueLog = null, cueStats = null;
  if (arm !== "off") {
    const pre = await cueReads(S.x, S.her);
    const w = liveWithCue(pre, S.her);
    Live = w.Live; cueLog = w.log; cueStats = pre.stats;
    // where each fired read fell: inside a turn before its final silence (a HOLD span or voiced), at the turn's final
    // silence (an END: the cue would delay her), or outside any turn (her line / the tail)
    cueStats = { ...pre.stats, firedAt: pre.fired.map((t) => {
      const tr = S.turns.find((u) => t >= u.start - 200 && t < u.windowEnd);
      if (!tr) return "outside";
      if (t >= tr.end - 300) return "end";
      return tr.spans.slice(0, -1).some(([a, b]) => t >= a - 300 && t <= b) ? "hold" : "voiced";
    }) };
  }
  const r = await runSession({ id: `vsr3-${s}`, x: S.x, frames, her: S.her.map((h) => ({ ...h, ui: {} })), stt: { replay: log }, band: "B4", DuplexLive: Live });
  return { scored: scoreTurns(S.turns, r.acts, r.sttLog), cueLog, cueStats, probes: r.acts.filter((a) => a[1] === "probe").length, recProbes: log.filter((e) => e.raw.type === "input_audio_buffer.committed").length };
}), 4);
const perTurn = out.flatMap((o) => o.scored);
const res = {
  id: `voicesig-r3-${name}`, date: new Date().toISOString().slice(0, 10), arm, rec: recName, srcRoot: srcRoot === ROOT ? "working tree" : srcRoot,
  label: "REAL RECORDED ADULT SPEECH (LiveKit EOT-Bench Hindi, CC BY 4.0) + REAL STT EVENTS recorded live from the production socket (duplex-real E1), REPLAYED through the current duplex bridge; the cue on the voicesig product front-end + detector (onnxruntime-web). Not children.",
  model: path.relative(ROOT, model), cfg: { thr: cfg.thr, pComplete: cfg.pComplete, minFillerMs: cfg.minFillerMs, tailGapMs: cfg.tailGapMs, readAfterMs: cfg.readAfterMs, maxHoldMs: cfg.maxHoldMs },
  seconds: Math.round((Date.now() - t0) / 1000),
  // the duplex stream edits src/duplex in this tree concurrently: every arm records the engine files it ran on
  engineHash: Object.fromEntries(["src/duplex/config.ts", "src/duplex/engineRules.ts", "src/duplex/governor.ts", "src/duplex/host.ts", "src/duplex/live.ts"].map((f) => [f.split("/").pop(), crypto.createHash("sha1").update(fs.readFileSync(path.join(srcRoot, f))).digest("hex").slice(0, 10)])),
  probeMismatch: { engineProbes: out.reduce((a, o) => a + o.probes, 0), recordedCommits: out.reduce((a, o) => a + o.recProbes, 0) },
  cue: arm === "off" ? null : { pauses: out.reduce((a, o) => a + o.cueStats.pauses, 0), reads: out.reduce((a, o) => a + o.cueStats.read, 0), fired: out.reduce((a, o) => a + o.cueStats.fired, 0), publishedFrames: out.reduce((a, o) => a + o.cueLog.published, 0),
    firedAt: out.flatMap((o) => o.cueStats.firedAt).reduce((a, k) => ({ ...a, [k]: (a[k] ?? 0) + 1 }), {}) },
  ...aggregate(perTurn),
};
fs.mkdirSync(path.join(ROOT, "evals/voicesig/results/2026-10-09"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "evals/voicesig/results/2026-10-09", `${name}.json`), JSON.stringify({ ...res, perTurn }, null, 1));
console.log(JSON.stringify(res, null, 1));
