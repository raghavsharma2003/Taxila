// duplex r3 diagnostics: WHY her audio did not stop within 200 ms on real AMI barge-ins, and why continuers yielded.
// Replays the recorded real-STT events (evals/duplex-real/results/ami-raw-D4.*) per (X, her = Y) pair, exactly as
// ami-real.mjs score does, with the host's hush gate instrumented (no behaviour change): for every overlap onset it
// records which gate blocked the hush (give-up, echo, attribution, phase, too short).
//   node evals/duplex-r3/ami-diag.mjs <frames_dir> [--meetings ES2004b,...] [--rec ami-raw-D4]
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { loadEnv, ROOT, runSession } from "../duplex-real/lib.mjs";
import { scoreOverlap } from "../duplex-real/ami-real.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
loadEnv();
const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
const { EngineHost } = await import(ROOT + "src/duplex/host.ts");
const { OVERLAP } = await import(ROOT + "src/duplex/config.ts");
// instrument the hush gate: per call, the first gate that blocked it
let trace = [];
const orig = EngineHost.prototype.maybeHush;
EngineHost.prototype.maybeHush = function (t) {
  const before = this.hushAt;
  let why = null;
  if (this.hushAt !== null) why = null;
  else if (this.hushOff) why = "give_up";
  else if (this.overlapOnset === null) why = "no_onset";
  else if (t - this.overlapOnset < OVERLAP.hushMs) why = null;
  else {
    const ph = this.governor.phase;
    if (ph !== "overlap" && ph !== "her_turn") why = `phase_${ph}`;
    else {
      const o = this.overlapFeatures(t, true, this.fanin.view(t, (from) => this.audio.voicedAfter(from)));
      if (!o) why = "no_features";
      else if (o.echoLikelihood >= 0.5) why = `echo_${o.echoLikelihood}_lvl${o.levelOverEchoDb === null ? "null" : Math.round(o.levelOverEchoDb)}`;
      else if (o.targetSpeaker !== null && o.targetSpeaker < 0.5) why = `target_${o.targetSpeaker}`;
    }
  }
  orig.call(this, t);
  if (why && before === null) trace.push([t, this.overlapOnset, why]);
};
const dir = argv[0];
const meetings = opt("--meetings", "ES2004b,ES2005b,IS1004b,IS1008b").split(",");
const rec = opt("--rec", "ami-raw-D4");
const RES = path.join(ROOT, "evals/duplex-real/results");
const floorOf = (db) => [...db].sort((a, b) => a - b)[Math.floor(db.length * 0.1)];
const dec = (w) => w.replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
function spurts(words, maxGap) { const out = []; for (const [s, e, w] of words) { const l = out.at(-1); if (l && s - l.end < maxGap) { l.end = Math.max(l.end, e); l.words.push([s, e, w]); } else out.push({ start: s, end: e, words: [[s, e, w]] }); } return out; }
const herLines = (M, Y) => spurts(M.chans[Y].words.map(([s, e, w]) => [s, e, dec(w)]), 700).filter((s) => s.end - s.start >= 600).map((s) => ({ start: s.start, end: s.end, text: s.words.map((w) => w[2]).join(" "), outDb: M.chans[Y].db }));
const agg = { barge: {}, cont: {}, bargeN: 0, contN: 0 };
for (const m of meetings) {
  const M = JSON.parse(fs.readFileSync(path.join(dir, `${m}.json`), "utf8"));
  for (const X of Object.keys(M.chans).sort()) {
    const R = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(RES, `${rec}.${m}.${X}.json.gz`))));
    for (const Y of Object.keys(M.chans).sort().filter((a) => a !== X)) {
      trace = [];
      const cx = M.chans[X];
      const r = await runSession({ id: `${m}-${X}${Y}`, x: new Float32Array(0), frames: { db: cx.db, f0: cx.f0 }, floorDb: floorOf(cx.db), her: herLines(M, Y), stt: { replay: R.sttLog }, band: "B4", DuplexLive });
      const s = scoreOverlap(M, X, Y, r.acts, r.logs);
      // attribute each barge-in / failed continuer to the hush trace near its onset
      const near = (t0) => { const w = trace.filter(([t]) => t >= t0 - 100 && t <= t0 + 600).map((x) => x[2]); return w.length ? w[w.length - 1] : "none"; };
      const xb = spurts(cx.words.map(([a, b, w]) => [a, b, dec(w)]), 300);
      for (const b of s.barge) {
        agg.bargeN++;
        const sp = xb.find((z) => z.words.slice(0, 6).map((w) => w[2].toLowerCase()).join(" ") === b.words);
        const why = b.hush !== null && b.hush <= 200 ? "hushed_200" : near(sp?.start ?? -1e9);
        agg.barge[why] = (agg.barge[why] ?? 0) + 1;
      }
      for (const c of s.cont) { agg.contN++; const k = c.ok ? "ok" : (c.why.split(",")[0] || "none").split("|")[0]; agg.cont[k] = (agg.cont[k] ?? 0) + 1; }
      // continuers: why the hush did or did not meet each listening burst, and how it ended
      const yw = M.chans[Y].words.map(([a, b, w]) => [a, b, dec(w)]);
      const others = Object.keys(M.chans).filter((z) => z !== X && z !== Y).flatMap((z) => M.chans[z].words);
      const talk = (words, a, b) => words.some(([s0, e0]) => s0 < b && e0 > a);
      const LISTEN = new Set(["yeah", "yes", "yep", "yup", "mm-hmm", "mm", "hmm", "mhm", "uh-huh", "okay", "ok", "right", "sure", "alright", "oh", "uh", "huh", "ah", "mmm", "hm"]);
      for (const y of spurts(yw, 700).filter((q) => q.end - q.start >= 600)) for (const b of xb) {
        if (b.start < y.start + 300 || b.start > y.end - 200 || talk(others, b.start - 1000, b.end + 1000)) continue;
        const toks = b.words.map((w) => w[2].toLowerCase());
        if (!toks.every((w) => LISTEN.has(w)) || b.end - b.start > 1200 || y.end - b.end < 1000) continue;
        const yl = r.logs.find(([t, a]) => a === "YIELD" && t >= b.start - 20 && t <= b.end + 1000);
        const hz = r.logs.find(([t, a]) => a === "HUSH" && t >= b.start - 20 && t <= b.end + 300);
        const why = hz ? "hushed" : near(b.start);
        const key = `${yl ? "YIELD" : "kept"}:${why}`;
        agg.contWhy = agg.contWhy ?? {}; agg.contWhy[key] = (agg.contWhy[key] ?? 0) + 1;
      }
    }
    console.log(m, X, JSON.stringify(agg.barge), JSON.stringify(agg.contWhy ?? {}));
  }
}
console.log(JSON.stringify(agg, null, 1));
