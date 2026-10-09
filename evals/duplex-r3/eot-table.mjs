// duplex r3: the PAUSE TABLE. Replays eot-bench Hindi (real adult speech + the real STT events recorded live in round 2)
// through the live bridge with the governor's floor take-overs SUPPRESSED (the engine listens through every pause, so every
// pause of every turn is observed with the same history), and records, at every engine tick inside a child silence, what the
// engine could see then: the silence so far, the covered words and their lexical markers, the prosody of the last voiced
// stretch, the turn so far, and what stage A + the governor would have done. Policies are then simulated offline on the table
// (eot-policy.mjs) and the chosen one is confirmed on the real engine with eot-replay.mjs.
//   node evals/duplex-r3/eot-table.mjs <eot_dir> --rec eot-MAI-after --out <file.json.gz> [--shards 8] [--cache dir]
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { loadEnv, ROOT, framesOf, runSession, pool } from "../duplex-real/lib.mjs";
import { buildSession } from "../duplex-real/eot.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };

export async function buildTable({ dir, recFile, shards = 8, cacheDir = null, limit = 400, conc = 4, ctxUi = {} }) {
  const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
  const { Governor } = await import(ROOT + "src/duplex/governor.ts");
  const { RulesEngine, estimate } = await import(ROOT + "src/duplex/engineRules.ts");
  // one global sink per running session (sessions run concurrently in one process: keyed by the engine instance)
  const sinkOf = new WeakMap();
  const origTick = RulesEngine.prototype.tick;
  RulesEngine.prototype.tick = function (input) {
    const d = origTick.call(this, input);
    const sink = sinkOf.get(this);
    const c = input.child;
    if (sink && !c.voicing && c.silenceRunMs !== null && (input.phase === "child_turn" || input.phase === "idle" || input.phase === "handover")) {
      const m = input.markers, tr = input.transcript, pr = c.prosody;
      const est = estimate(input);
      let ti = sink.texts.get(tr.text);
      if (ti === undefined) { ti = sink.textList.length; sink.texts.set(tr.text, ti); sink.textList.push(tr.text); }
      sink.rows.push([
        input.t, c.silenceRunMs, c.lastOffsetAt, ti, tr.unseenVoicedMs, input.phase,
        m.cue, +m.lexP.toFixed(3), m.form, m.values.length, m.questionComplete ? 1 : 0, m.asks ? 1 : 0, m.idk ? 1 : 0, m.yieldTag ? 1 : 0,
        m.openTail ? 1 : 0, m.fillerTail ? 1 : 0, m.projection ? 1 : 0, m.holdRequest ? 1 : 0, m.repairOpen ? 1 : 0, m.unreadable ? 1 : 0,
        pr.f0SlopeStPerS === null ? null : +pr.f0SlopeStPerS.toFixed(1), pr.f0RelRange === null ? null : +pr.f0RelRange.toFixed(2),
        pr.energySlopeDbPerS === null ? null : +pr.energySlopeDbPerS.toFixed(1), pr.finalLengthening === null ? null : +pr.finalLengthening.toFixed(2),
        c.turnVoicedMs, c.pausesThisTurn, c.voicedRunMs, est.exchange, +est.pComplete.toFixed(3), +est.pHoldWanted.toFixed(3), +est.pProjected.toFixed(3),
        d.action, d.detail && d.detail.action === "SPEAK" ? d.detail.reason : d.detail && d.detail.action === "HOLD" ? d.detail.reason : null,
      ]);
    }
    return d;
  };
  // suppress the floor take-over so the engine listens through every pause (recorded as `would`)
  const origFinish = Governor.prototype.finish;
  Governor.prototype.finish = function (tick, d) {
    const sink = this.__sink;
    if ((d.action === "SPEAK" || d.action === "CUT_IN") && !tick.safety.distress && (this.phase === "child_turn" || this.phase === "idle" || this.phase === "handover")) {
      if (sink) sink.would.push([tick.t, d.action, d.detail?.reason ?? null, tick.child.silenceRunMs]);
      d = { ...d, action: "HOLD", detail: { action: "HOLD", reason: "uncertain" } };
    }
    return origFinish.call(this, tick, d);
  };
  const idx = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
  const rows = idx.rows.slice(0, limit);
  const per = Math.ceil(rows.length / shards);
  const recorded = JSON.parse(zlib.gunzipSync(fs.readFileSync(recFile)).toString());
  const out = await pool(Array.from({ length: shards }, (_, s) => async () => {
    const chunk = rows.slice(s * per, (s + 1) * per);
    const S = buildSession(dir, chunk);
    let frames;
    const cf = cacheDir ? path.join(cacheDir, `frames-${shards}-${s}.json`) : null;
    if (cf && fs.existsSync(cf)) frames = JSON.parse(fs.readFileSync(cf, "utf8"));
    else { frames = framesOf(S.x); if (cf) { fs.mkdirSync(cacheDir, { recursive: true }); fs.writeFileSync(cf, JSON.stringify(frames)); } }
    const sink = { rows: [], would: [], texts: new Map(), textList: [] };
    // attach the sink to the session's engine/governor at construction: wrap the DuplexLive constructor's host
    class Tapped extends DuplexLive {
      constructor(o) {
        super(o);
        const host = this.host;
        sinkOf.set(host.engine, sink);
        host.governor.__sink = sink;
      }
    }
    const her = S.her.map((h) => ({ ...h, ui: ctxUi }));
    const log = recorded.find((x) => x.shard === s).sttLog;
    const r = await runSession({ id: `table-${s}`, x: S.x, frames, her, stt: { replay: log }, band: "B4", DuplexLive: Tapped });
    // device voicing edges (for episode durations): onsets/offsets are recoverable from rows' lastOffsetAt + the frames
    return { shard: s, turns: S.turns.map((t, i) => ({ ...t, herPrev: chunk[i].herPrev ?? null, words: chunk[i].words })), her: S.her, rows: sink.rows, would: sink.would, texts: sink.textList, acts: r.acts.filter((a) => a[1] === "probe"), dbLen: frames.db.length, db: frames.db, f0: frames.f0 };
  }), conc);
  RulesEngine.prototype.tick = origTick;
  Governor.prototype.finish = origFinish;
  return out;
}

export const COLS = ["t", "sil", "offAt", "ti", "unseen", "phase", "cue", "lexP", "form", "nVals", "qComplete", "asks", "idk", "yieldTag",
  "openTail", "fillerTail", "projection", "holdReq", "repairOpen", "unreadable", "f0Slope", "f0Rel", "eSlope", "finalLen",
  "turnVoiced", "pauses", "runMs", "exchange", "pC", "pH", "pProj", "action", "reason"];

if (import.meta.url === `file://${process.argv[1]}`) {
  loadEnv();
  const dir = argv[0];
  const rec = opt("--rec", "eot-MAI-after");
  const recFile = path.join(ROOT, "evals/duplex-real/results", `${rec}.stt.json.gz`);
  const t0 = Date.now();
  const table = await buildTable({ dir, recFile, shards: Number(opt("--shards", 8)), cacheDir: opt("--cache", null) });
  const file = opt("--out", `/tmp/eot-table-${rec}.json.gz`);
  fs.writeFileSync(file, zlib.gzipSync(JSON.stringify({ rec, cols: COLS, shards: table })));
  console.log(JSON.stringify({ rec, file, seconds: Math.round((Date.now() - t0) / 1000), rows: table.reduce((a, s) => a + s.rows.length, 0), would: table.reduce((a, s) => a + s.would.length, 0) }));
}
