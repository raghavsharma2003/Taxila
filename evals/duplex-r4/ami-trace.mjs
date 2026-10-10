// duplex r4 diagnostics: the engine's timeline around every FAILED continuer and every barge-in not stopped within 200 ms,
// on the AMI real-speech replay (CC BY 4.0, evaluation only; the same pairs, events and scoring as evals/duplex-r3/ami-overlap.mjs).
// Prints phases, ducks, pauses and the governed actions (with reasons and overlap features) from 1.5 s before to 1 s after.
//   node evals/duplex-r4/ami-trace.mjs <frames_dir> --meetings ES2004b [--rec ami-raw-D4] [--kind cont|barge|both]
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { loadEnv, ROOT, runSession } from "../duplex-real/lib.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
loadEnv();
const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
const { EngineHost } = await import(ROOT + "src/duplex/host.ts");
// tap the overlap features the host computes (no behaviour change)
let feats = [];
const origOF = EngineHost.prototype.overlapFeatures;
EngineHost.prototype.overlapFeatures = function (t, voicing, tr) {
  const o = origOF.call(this, t, voicing, tr);
  if (o) feats.push([t, Math.round(o.durMs), o.echoLikelihood, o.levelOverEchoDb === null ? null : Math.round(o.levelOverEchoDb), o.lexicalKind, o.words.slice(0, 24), o.hushed ? "H" : "-", this.hushOff ? "OFF" : ""]);
  return o;
};
const LISTEN = new Set(["yeah", "yes", "yep", "yup", "mm-hmm", "mm", "hmm", "mhm", "uh-huh", "okay", "ok", "right", "sure", "alright", "oh", "uh", "huh", "ah", "mmm", "hm"]);
const dec = (w) => w.replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
const floorOf = (db) => [...db].sort((a, b) => a - b)[Math.floor(db.length * 0.1)];
function spurts(words, maxGap) { const out = []; for (const [s, e, w] of words) { const l = out.at(-1); if (l && s - l.end < maxGap) { l.end = Math.max(l.end, e); l.words.push([s, e, w]); } else out.push({ start: s, end: e, words: [[s, e, w]] }); } return out; }
const anyTalk = (words, a, b) => words.some(([s, e]) => s < b && e > a);
const herLines = (M, Y) => spurts(M.chans[Y].words.map(([s, e, w]) => [s, e, dec(w)]), 700).filter((s) => s.end - s.start >= 600).map((s) => ({ start: s.start, end: s.end, text: s.words.map((w) => w[2]).join(" "), outDb: M.chans[Y].db }));
const dir = argv[0], kind = opt("--kind", "both");
const RES = path.join(ROOT, "evals/duplex-real/results");
for (const m of opt("--meetings", "ES2004b").split(",")) {
  const M = JSON.parse(fs.readFileSync(path.join(dir, `${m}.json`), "utf8"));
  for (const X of Object.keys(M.chans).sort()) {
    const R = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(RES, `${opt("--rec", "ami-raw-D4")}.${m}.${X}.json.gz`))));
    for (const Y of Object.keys(M.chans).sort().filter((a) => a !== X)) {
      feats = [];
      const cx = M.chans[X];
      const r = await runSession({ id: `${m}-${X}${Y}`, x: new Float32Array(0), frames: { db: cx.db, f0: cx.f0 }, floorDb: floorOf(cx.db), her: herLines(M, Y), stt: { replay: R.sttLog }, band: "B4", DuplexLive, log: true });
      const xw = cx.words.map(([s, e, w]) => [s, e, dec(w)]);
      const others = Object.keys(M.chans).filter((a) => a !== X && a !== Y).flatMap((z) => M.chans[z].words);
      const yieldsIn = (a, b) => r.acts.filter(([t, k]) => t >= a && t <= b && (k === "pause" || k === "stop"));
      const duckOf = (a, b) => r.acts.find(([t, k, x]) => t >= a && t <= b && k === "duck" && x <= 0.06);
      const show = (label, a, b, b0) => {
        console.log(`\n### ${m} X=${X} her=${Y} ${label}`);
        const ev = [
          ...r.phases.filter(([t]) => t >= a && t <= b).map(([t, p]) => [t, `phase ${p}`]),
          ...r.acts.filter(([t, k]) => t >= a && t <= b && k !== "probe").map(([t, k, x]) => [t, `act ${k} ${x ?? ""}`]),
          ...r.logs.filter(([t, act]) => t >= a && t <= b && act !== "HOLD").map(([t, act, why, ph, det]) => [t, `log ${act} ${det ?? ""} [${why}] ${ph}`]),
          ...feats.filter(([t]) => t >= a && t <= b).filter((f, i, A) => i === 0 || JSON.stringify(f.slice(2)) !== JSON.stringify(A[i - 1].slice(2)) || f[0] - A[i - 1][0] > 200).map((f) => [f[0], `ovl dur ${f[1]} echo ${f[2]} lvl ${f[3]} kind ${f[4]} "${f[5]}" ${f[6]} ${f[7]}`]),
        ].sort((p, q) => p[0] - q[0]);
        for (const [t, s] of ev) console.log(`  ${String(Math.round(t - b0)).padStart(6)}  ${s}`);
      };
      for (const y of spurts(M.chans[Y].words.map(([s, e, w]) => [s, e, dec(w)]), 700).filter((s) => s.end - s.start >= 600)) {
        for (const b of spurts(xw, 300)) {
          if (b.start < y.start + 300 || b.start > y.end - 200 || anyTalk(others, b.start - 1000, b.end + 1000)) continue;
          const toks = b.words.map((w) => w[2].toLowerCase());
          const listening = toks.every((w) => LISTEN.has(w));
          if (listening && b.end - b.start <= 1200 && y.end - b.end >= 1000) {
            if (kind !== "barge" && yieldsIn(b.start - 20, b.end + 1000).length) show(`CONT FAIL "${toks.join(" ")}" ${b.end - b.start} ms (her line ${b.start - y.start} ms in)`, b.start - 1500, b.end + 1000, b.start);
          } else if (!listening && toks.filter((w) => !LISTEN.has(w)).length >= 2 && y.end - b.start <= 2000 && y.end > b.start) {
            const xEnd = spurts(xw.filter(([s]) => s >= b.start), 500)[0]?.end ?? b.end;
            if (xEnd - y.end < 1000) continue;
            const h = duckOf(b.start - 1000, b.start + 2000), yl = yieldsIn(b.start - 1000, b.start + 2500)[0];
            const stop = Math.min(h ? Math.max(0, h[0] + 20 - b.start) : Infinity, yl ? Math.max(0, yl[0] + 50 - b.start) : Infinity);
            if (kind !== "cont" && stop > 200) show(`BARGE not<=200 (stop ${stop}) "${toks.slice(0, 6).join(" ")}"`, b.start - 1500, b.start + 1500, b.start);
          }
        }
      }
    }
  }
}
