// Round 5 gate (docs/design/round5/BRIEF.md, the duplex bar) over the bake-off set (66) + the continuer probe (36) = 102 of
// her lines, per arm/variant, from score.mjs outputs:
//   her lines (n=102):  phantom child transcripts of her voice (ASR finals that began while only her voice was in the mic),
//                       phantom child turns, echo yields (pause/stop), echo hushes (her gain cut to <= 0.05)
//   barge-in (F7, n=12): noticed (her voice silenced: hush or pause/stop, within 1.5 s) and her stop <= 500 ms
//   continuers (F8 + probe, n=46): false yields (pause/stop within 1.5 s)
//   end of turn (after-her turns, n=34): p50 / p90, cut-offs inside a thinking pause, missed
//   node evals/duplex-2026-10/r5-gate.mjs <score-bake.json> <score-cont.json> [arm/variant ...]
import fs from "node:fs";

const [bakeF, contF, ...want] = process.argv.slice(2);
const bake = JSON.parse(fs.readFileSync(bakeF, "utf8")).rows, cont = JSON.parse(fs.readFileSync(contF, "utf8")).rows;
const q = (a, p) => { if (!a.length) return null; const z = [...a].sort((x, y) => x - y); return Math.round(z[Math.min(z.length - 1, Math.floor((z.length - 1) * p))]); };
const f = (k, n) => `${k}/${n}`;
const out = {};
for (const key of want.length ? want : Object.keys(bake)) {
  const b = bake[key] ?? [], c = cont[key] ?? [];
  const lines = [...b, ...c];
  const f7 = b.filter((r) => r.family === "F7");
  const f8 = [...b.filter((r) => r.family === "F8"), ...c];
  const eot = b.filter((r) => r.eotMs !== undefined);
  const sil = f7.map((r) => r.silencedMs).filter((x) => x !== null && x !== undefined);
  out[key] = {
    herLines: lines.length,
    phantomTranscripts: f(lines.filter((r) => r.phantomAsr?.length).length, lines.length),
    phantomTurns: f(lines.filter((r) => r.phantomTurn).length, lines.length),
    echoYields: f(lines.filter((r) => r.echoFalseYield).length, lines.length),
    echoHushes: f(lines.filter((r) => r.echoFalseHush).length, lines.length),
    bargeNoticed: f(sil.length, f7.length),
    stopLe500: f(sil.filter((x) => x <= 500).length, f7.length),
    stopP50: q(sil, 0.5), stopP90: q(sil, 0.9),
    fullYield: f(f7.filter((r) => r.bargeOk).length, f7.length),
    continuerFalseYields: f(f8.filter((r) => r.contFalseYield).length, f8.length),
    eotP50: q(eot.map((r) => r.eotMs).filter((x) => x !== null), 0.5), eotP90: q(eot.map((r) => r.eotMs).filter((x) => x !== null), 0.9),
    eotMissed: f(eot.filter((r) => r.eotMs === null).length, eot.length), cutoffs: f(eot.filter((r) => r.cut).length, eot.length),
    loneNoticed: f(b.filter((r) => r.lone?.noticed).length, b.filter((r) => r.lone).length),
    phantomExamples: lines.flatMap((r) => r.phantomAsr ?? []).slice(0, 4),
  };
}
console.log(JSON.stringify(out, null, 1));
