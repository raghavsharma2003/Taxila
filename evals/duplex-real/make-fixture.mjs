// duplex-real: cut a small REAL-SPEECH regression fixture out of a recorded E1 run: the device frames (dB, f0) of a few
// consecutive eot-bench Hindi turns, her lines, and the real STT events the socket sent, re-based to 0. The words are from
// LiveKit eot-bench (CC BY 4.0, adult speakers); no audio is stored. Used by tests/duplex-real-replay.test.mjs.
//   node evals/duplex-real/make-fixture.mjs <eot_dir> <stt.json.gz> --shards 8 --ids hi__4015,hi__4016 --out tests/fixtures/x.json
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { framesOf, HOP_MS } from "./lib.mjs";
import { buildSession } from "./eot.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const dir = argv[0];
const rec = JSON.parse(zlib.gunzipSync(fs.readFileSync(argv[1])).toString());
const shards = Number(opt("--shards", 8));
const ids = opt("--ids", "").split(",").filter(Boolean);
const idx = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
const rows = idx.rows.slice(0, Number(opt("--limit", 400)));
const per = Math.ceil(rows.length / shards);
const s = Math.floor(rows.findIndex((r) => r.id === ids[0]) / per);
const S = buildSession(dir, rows.slice(s * per, (s + 1) * per));
const fr = framesOf(S.x);
const ti = S.turns.map((t, i) => [t, i]).filter(([t]) => ids.includes(t.id)).map(([, i]) => i);
const from = S.her[ti[0]].start, to = S.turns[ti.at(-1)].windowEnd;
const k0 = Math.floor(from / HOP_MS), k1 = Math.ceil(to / HOP_MS);
const shift = k0 * HOP_MS;
const out = {
  source: "LiveKit eot-bench Hindi (CC BY 4.0, adult human turns), real gpt-live-transcribe events recorded by evals/duplex-real/eot.mjs",
  run: path.basename(argv[1]),
  db: fr.db.slice(k0, k1), f0: fr.f0.slice(k0, k1),
  her: ti.map((i) => ({ start: S.her[i].start - shift, end: S.her[i].end - shift, text: S.her[i].text })),
  turns: ti.map((i) => ({ id: S.turns[i].id, start: S.turns[i].start - shift, end: S.turns[i].end - shift, spans: S.turns[i].spans.map(([a, b]) => [a - shift, b - shift]), windowEnd: S.turns[i].windowEnd - shift })),
  stt: rec.find((x) => x.shard === s).sttLog.filter((e) => e.t >= from && e.t < to).map((e) => ({ t: e.t - shift, raw: e.raw })),
};
fs.writeFileSync(opt("--out"), JSON.stringify(out));
console.log(opt("--out"), out.db.length, "frames", out.stt.length, "events");
