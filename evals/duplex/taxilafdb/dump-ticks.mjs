// Stage B training rows (ARCHITECTURE.md v2 §5.3 step 4, labels by construction): run stage A over the rendered streams and
// record, on every 100 ms timer tick of the child's floor, the engine's feature vector (features.ts, spec cce-features/1 —
// the exact vector the shipped TrainedEngine packs), stage A's own estimate, and the GOLD labels from the render:
//   yEnd   1 once the child has finished the contribution (t >= the last voiced frame of the turn), else 0
//   yHold  1 while the child is voicing before the end or inside a thinking / hold pause; 0 at the end and in
//          non-thinking pauses (a value then a repair, a question pause, a pre-disclosure pause)
// Excluded: her-floor families (F7, F8, F12, F9 without a child turn), safety (F10: code, never learned), ticks before
// the child's first onset (WT1 is a code timer), and ticks more than 3 s after the end.
// Causal: every feature at t comes from the runtime at t; labels are never inputs.
//   node evals/duplex/taxilafdb/dump-ticks.mjs [--splits train,dev,test] [--lanes D4,FAST] [--workers 3]
import fs from "node:fs";
import path from "node:path";
import { fork } from "node:child_process";
import { listStreams, loadStream, runStream } from "./world.mjs";
import { armSpec } from "./arms.mjs";
import { THINKING } from "./generate.mjs";
import { packFeatures, FEATURE_NAMES, FEATURE_SPEC } from "../../../src/duplex/features.ts";

const OUT = process.env.TAXILA_FDB_TICKS || "/tmp/taxila-fdb/ticks";
const FLOOR = new Set(["child_turn", "idle", "handover", "hold_requested"]);
const HER_FAMILIES = new Set(["F7", "F8", "F12", "F10"]);

export function labelTick(r, t) {
  const g = r.g, sg = r.sg || {};
  if (g.childOnset === null || t < g.childOnset || g.trueEnd === null) return null;
  if (!sg.endClass) return null;
  if (t > g.trueEnd + 3000) return null;
  if (t >= g.trueEnd) return { yEnd: 1, yHold: 0, inWord: false, pauseCls: "end" };
  const inWord = g.words.some(([a, b]) => t >= a && t <= b + 100);
  if (inWord) return { yEnd: 0, yHold: 1, inWord: true, pauseCls: "voice" };
  const p = (g.pauses || []).find((pp) => t >= pp.start && t < pp.end);
  const cls = p ? p.cls : "gap";
  return { yEnd: 0, yHold: p && (THINKING.has(p.cls) || p.cls === "word_search_long" || p.cls === "hold_long") ? 1 : 0, inWord: false, pauseCls: cls };
}

async function dump(ids, lanes) {
  const rows = [];
  for (const id of ids) {
    const d = loadStream(id);
    if (HER_FAMILIES.has(d.sc.family) || (d.sc.family === "F9" && !d.sc.child)) continue;
    for (const lane of lanes) {
      const r = await runStream(d, { ...armSpec("stage-a"), lane, recordTicks: (tick, dd) => ({ t: tick.t, phase: tick.phase, voicing: tick.child.voicing, f: Array.from(packFeatures(tick), (x) => Math.round(x * 1e4) / 1e4), pc: dd.pComplete, ph: dd.pHoldWanted }) });
      for (const e of r.est) {
        if (!FLOOR.has(e.phase)) continue;
        const y = labelTick(r, e.t);
        if (!y) continue;
        rows.push({ id, sc: r.scenario, tfam: r.tfam, family: r.family, split: r.split, voice: r.voice, cond: r.cond, lane, exchange: r.ctxExchange, t: e.t, ...y, pc: +e.pc.toFixed(4), ph: +e.ph.toFixed(4), f: e.f });
      }
    }
  }
  return rows;
}

if (process.env.DUMP_WORKER) {
  process.on("message", async (m) => { process.send({ rows: await dump(m.ids, m.lanes) }); });
} else if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
  const splits = opt("--splits", "train,dev,test").split(",");
  const lanes = opt("--lanes", "D4,FAST").split(",");
  const W = Number(opt("--workers", 3));
  fs.mkdirSync(OUT, { recursive: true });
  for (const split of splits) {
    const ids = listStreams().filter((id) => JSON.parse(fs.readFileSync(path.join(process.env.TAXILA_FDB_STREAMS || "/tmp/taxila-fdb/streams", `${id}.json`), "utf8")).meta.split === split);
    const chunks = Array.from({ length: W }, (_, k) => ids.filter((_, i) => i % W === k));
    const parts = await Promise.all(chunks.map((c) => new Promise((res, rej) => {
      const w = fork(new URL(import.meta.url).pathname, [], { env: { ...process.env, DUMP_WORKER: "1" }, execArgv: ["--max-old-space-size=4000"] });
      w.on("message", (m) => { res(m.rows); w.kill(); }); w.on("error", rej);
      w.send({ ids: c, lanes });
    })));
    const rows = parts.flat();
    fs.writeFileSync(path.join(OUT, `${split}.jsonl`), rows.map((r) => JSON.stringify(r)).join("\n"));
    console.log(`${split}: ${rows.length} ticks (${rows.filter((r) => r.yEnd).length} end) from ${new Set(rows.map((r) => r.id)).size} streams`);
  }
  fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify({ featureSpec: FEATURE_SPEC, names: FEATURE_NAMES, date: "2026-10-04" }, null, 1));
}
