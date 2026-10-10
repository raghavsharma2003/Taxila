// duplex r4 diagnostics: which AMI overlap failures are ARTEFACTS OF THE OPEN-LOOP RIG. The rig plays her line (another
// participant's real speech) to its end whatever the engine does; on a device, once the engine has yielded or committed a
// new turn, her line is no longer sounding. A failed continuer (or an unstopped barge-in) whose onset falls while the
// governor's phase is NOT her floor (her_turn / overlap) happened, on a device, with her audio already stopped. Same pairs,
// events and scoring as evals/duplex-r3/ami-overlap.mjs; this only LABELS failures, it never changes the official score.
//   node evals/duplex-r4/ami-artefact.mjs <frames_dir> --meetings ES2004b [--rec ami-raw-D4] --out <file.json>
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { loadEnv, ROOT, runSession } from "../duplex-real/lib.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
loadEnv();
const { DuplexLive } = await import(ROOT + "src/duplex/live.ts");
const LISTEN = new Set(["yeah", "yes", "yep", "yup", "mm-hmm", "mm", "hmm", "mhm", "uh-huh", "okay", "ok", "right", "sure", "alright", "oh", "uh", "huh", "ah", "mmm", "hm"]);
const dec = (w) => w.replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
const floorOf = (db) => [...db].sort((a, b) => a - b)[Math.floor(db.length * 0.1)];
function spurts(words, maxGap) { const out = []; for (const [s, e, w] of words) { const l = out.at(-1); if (l && s - l.end < maxGap) { l.end = Math.max(l.end, e); l.words.push([s, e, w]); } else out.push({ start: s, end: e, words: [[s, e, w]] }); } return out; }
const anyTalk = (words, a, b) => words.some(([s, e]) => s < b && e > a);
const herLines = (M, Y) => spurts(M.chans[Y].words.map(([s, e, w]) => [s, e, dec(w)]), 700).filter((s) => s.end - s.start >= 600).map((s) => ({ start: s.start, end: s.end, text: s.words.map((w) => w[2]).join(" "), outDb: M.chans[Y].db }));
const HER = new Set(["her_turn", "overlap"]);
const out = { cont: { n: 0, fail: 0, failOffFloor: 0 }, barge: { n: 0, late: 0, lateOffFloor: 0, lateOffFloorStopped200: 0 } };
const dir = argv[0];
for (const m of opt("--meetings", "ES2004b").split(",")) {
  const M = JSON.parse(fs.readFileSync(path.join(dir, `${m}.json`), "utf8"));
  for (const X of Object.keys(M.chans).sort()) {
    const R = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ROOT, "evals/duplex-real/results", `${opt("--rec", "ami-raw-D4")}.${m}.${X}.json.gz`))));
    for (const Y of Object.keys(M.chans).sort().filter((a) => a !== X)) {
      const cx = M.chans[X];
      const r = await runSession({ id: `${m}-${X}${Y}`, x: new Float32Array(0), frames: { db: cx.db, f0: cx.f0 }, floorDb: floorOf(cx.db), her: herLines(M, Y), stt: { replay: R.sttLog }, band: "B4", DuplexLive });
      const phaseAt = (t) => { let p = "idle"; for (const [tt, ph] of r.phases) { if (tt > t) break; p = ph; } return p; };
      const xw = cx.words.map(([s, e, w]) => [s, e, dec(w)]);
      const others = Object.keys(M.chans).filter((a) => a !== X && a !== Y).flatMap((z) => M.chans[z].words);
      const yieldsIn = (a, b) => r.acts.filter(([t, k]) => t >= a && t <= b && (k === "pause" || k === "stop"));
      const duckOf = (a, b) => r.acts.find(([t, k, x]) => t >= a && t <= b && k === "duck" && x <= 0.06);
      for (const y of spurts(M.chans[Y].words.map(([s, e, w]) => [s, e, dec(w)]), 700).filter((s) => s.end - s.start >= 600)) {
        for (const b of spurts(xw, 300)) {
          if (b.start < y.start + 300 || b.start > y.end - 200 || anyTalk(others, b.start - 1000, b.end + 1000)) continue;
          const toks = b.words.map((w) => w[2].toLowerCase());
          const listening = toks.every((w) => LISTEN.has(w));
          const offFloor = !HER.has(phaseAt(b.start - 20));
          if (listening && b.end - b.start <= 1200 && y.end - b.end >= 1000) {
            out.cont.n++;
            if (yieldsIn(b.start - 20, b.end + 1000).length) { out.cont.fail++; if (offFloor) out.cont.failOffFloor++; }
          } else if (!listening && toks.filter((w) => !LISTEN.has(w)).length >= 2 && y.end - b.start <= 2000 && y.end > b.start) {
            const xEnd = spurts(xw.filter(([s]) => s >= b.start), 500)[0]?.end ?? b.end;
            if (xEnd - y.end < 1000) continue;
            out.barge.n++;
            const h = duckOf(b.start - 1000, b.start + 2000), yl = yieldsIn(b.start - 1000, b.start + 2500)[0];
            const stop = Math.min(h ? Math.max(0, h[0] + 20 - b.start) : Infinity, yl ? Math.max(0, yl[0] + 50 - b.start) : Infinity);
            if (stop > 200) { out.barge.late++; if (offFloor) out.barge.lateOffFloor++; }
          }
        }
      }
    }
  }
}
fs.writeFileSync(opt("--out"), JSON.stringify(out));
console.log(JSON.stringify(out));
