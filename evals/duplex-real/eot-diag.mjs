// duplex-real E1 diagnostics: replay one shard's recorded real-STT events through the live bridge and print the timeline of
// chosen turns (holds, STT events, engine decisions), to find WHY a cut-off or a slow decision happened.
//   node evals/duplex-real/eot-diag.mjs <eot_dir> <stt.json.gz> --shards 8 --ids hi__4016,hi__4033 [--limit 400]
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { loadEnv, ROOT, framesOf, runSession } from "./lib.mjs";
import { buildSession } from "./eot.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
loadEnv();
const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
const dir = argv[0];
const rec = JSON.parse(zlib.gunzipSync(fs.readFileSync(argv[1])).toString());
const shards = Number(opt("--shards", 8)), limit = Number(opt("--limit", 400));
const ids = new Set(opt("--ids", "").split(",").filter(Boolean));
const idx = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
const rows = idx.rows.slice(0, limit);
const per = Math.ceil(rows.length / shards);
for (let s = 0; s < shards; s++) {
  const chunk = rows.slice(s * per, (s + 1) * per);
  if (!chunk.some((r) => ids.has(r.id))) continue;
  const S = buildSession(dir, chunk);
  const r = await runSession({ id: `diag-${s}`, x: S.x, frames: framesOf(S.x), her: S.her, stt: { replay: rec.find((x) => x.shard === s).sttLog }, band: "B4", DuplexLive, log: true });
  for (const tr of S.turns.filter((t) => ids.has(t.id))) {
    console.log(`\n=== ${tr.id} start ${tr.start} end ${tr.end} holds ${tr.spans.slice(0, -1).map(([a, b]) => `${a - tr.start}-${b - tr.start}`).join(" ")}`);
    const ev = [];
    for (const e of r.sttLog) if (e.t >= tr.start - 500 && e.t < tr.windowEnd) {
      const k = e.raw.type.replace("conversation.item.input_audio_transcription.", "tx.").replace("input_audio_buffer.", "buf.");
      if (k === "tx.delta") continue;
      ev.push([e.t, `STT ${k}${e.raw.transcript !== undefined ? ` "${e.raw.transcript}"` : ""}${e.raw.audio_end_ms !== undefined ? ` end@${e.raw.audio_end_ms}` : ""}`]);
    }
    for (const a of r.acts) if (a[0] >= tr.start - 500 && a[0] < tr.windowEnd && a[1] !== "duck") ev.push([a[0], `ACT ${a[1]} ${a[2] ?? ""} ${a[3] ?? ""}`]);
    for (const l of r.logs) if (l[0] >= tr.start - 500 && l[0] < tr.windowEnd && (l[1] === "SPEAK" || l[1] === "CUT_IN")) ev.push([l[0], `ROW ${l[1]} ${l[2]} [${l[3]}]`]);
    ev.sort((a, b) => a[0] - b[0]);
    for (const [t, x] of ev) console.log(String(t - tr.start).padStart(7), x.slice(0, 260));
  }
}
