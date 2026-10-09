// duplex r3: the EAGER END OF TURN on real speech (eot-bench Hindi, the real STT events recorded in round 2, replayed through
// the current engine). Per turn end: did an eager start fire on EXACTLY the words the engine then committed (so the server's
// prefetch would be adopted), and how long before the commit (the head start the turn's model work gets)? Per turn: how many
// eager starts were cancelled because the child went on (wasted speculative work). REAL-ADULT; from the US sandbox.
//   node evals/duplex-r3/eager.mjs <eot_dir> --rec eot-D4-after [--cache dir] [--name x]
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { loadEnv, ROOT, framesOf, runSession, pool, q } from "../duplex-real/lib.mjs";
import { buildSession } from "../duplex-real/eot.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };

if (import.meta.url === `file://${process.argv[1]}`) {
  loadEnv();
  const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
  const dir = argv[0], rec = opt("--rec", "eot-D4-after"), cacheDir = opt("--cache", null), shards = 8;
  const recorded = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ROOT, "evals/duplex-real/results", `${rec}.stt.json.gz`))).toString());
  const idx = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
  const rows = idx.rows.slice(0, 400), per = Math.ceil(rows.length / shards);
  const out = await pool(Array.from({ length: shards }, (_, s) => async () => {
    const S = buildSession(dir, rows.slice(s * per, (s + 1) * per));
    const cf = cacheDir ? path.join(cacheDir, `frames-${shards}-${s}.json`) : null;
    const frames = cf && fs.existsSync(cf) ? JSON.parse(fs.readFileSync(cf, "utf8")) : framesOf(S.x);
    const eager = [];
    let clockRef = null;
    class Tapped extends DuplexLive {
      constructor(o) { const port = { ...o.port, eager: (e) => eager.push([e.t, e.op, e.text]) }; super({ ...o, port }); clockRef = o.now; }
    }
    const r = await runSession({ id: `eager-${s}`, x: S.x, frames, her: S.her, stt: { replay: recorded.find((x) => x.shard === s).sttLog }, band: "B4", DuplexLive: Tapped });
    const commits = r.acts.filter((a) => a[1] === "commit").map(([t, , text]) => ({ t, text }));
    return S.turns.map((tr) => {
      const c = commits.find((x) => x.t >= tr.end - 200 && x.t < tr.windowEnd);
      const inTurn = eager.filter(([t]) => t >= tr.start && t < (c ? c.t + 1 : tr.windowEnd));
      const starts = inTurn.filter((e) => e[1] === "start"), cancels = inTurn.filter((e) => e[1] === "cancel");
      const match = c ? [...starts].reverse().find((e) => e[0] <= c.t && e[2].trim() === String(c.text).trim()) : null;
      return { id: tr.id, committed: !!c, eagerMatched: !!match, leadMs: match ? c.t - match[0] : null, eagerAfterEndMs: match ? match[0] - tr.end : null, starts: starts.length, cancels: cancels.length };
    });
  }), 4);
  const all = out.flat();
  const m = all.filter((x) => x.eagerMatched);
  const res = {
    id: `duplex-r3-eager-${rec}`, date: new Date().toISOString().slice(0, 10), rec,
    label: "REAL RECORDED ADULT SPEECH (LiveKit eot-bench Hindi, CC BY 4.0; evaluation only) + REAL STT events recorded in round 2, replayed through the current engine. Not children. US sandbox.",
    turns: all.length, committed: all.filter((x) => x.committed).length,
    eagerOnCommittedWords: m.length, leadMs: { p10: q(m.map((x) => x.leadMs), 0.1), p50: q(m.map((x) => x.leadMs), 0.5), p90: q(m.map((x) => x.leadMs), 0.9) },
    eagerAfterTurnEndMs: { p50: q(m.map((x) => x.eagerAfterEndMs), 0.5), p90: q(m.map((x) => x.eagerAfterEndMs), 0.9) },
    startsPerTurn: +(all.reduce((a, x) => a + x.starts, 0) / all.length).toFixed(2), cancelledPerTurn: +(all.reduce((a, x) => a + x.cancels, 0) / all.length).toFixed(2),
  };
  fs.writeFileSync(path.join(ROOT, "evals/duplex-real/results", `${opt("--name", `r3-eager-${rec}`)}.json`), JSON.stringify({ ...res, perTurn: all }, null, 1));
  console.log(JSON.stringify(res));
}
