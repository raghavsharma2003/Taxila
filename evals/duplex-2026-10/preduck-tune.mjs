// Round 5: the D5 pre-duck offline. The pre-duck reads only the device's own frames (mic level + pitch, her output level +
// pitch, the learned echo coupling), so it can be measured without Voice Live: the shipped DuplexLive (vadGate "server",
// preDuck on) over the assembled audio with NO transcription events (the gate never opens, so every pre-duck is the
// pre-duck's own call). False = a pre-duck before the child's onset (her echo only); true = the first pre-duck within
// 500 ms of a child's onset over her line (F7 barge-ins), and the same for continuers (F8, a pre-duck there is a hush the
// engine releases when the words say continuer).
//   node evals/duplex-2026-10/preduck-tune.mjs <bake dir> [<cont dir>] --variant owner [--margin 6,8] [--ms 40,60] [--pitch 1.5,2]
import fs from "node:fs";
import path from "node:path";
import { framesOf } from "../duplex-real/lib.mjs";
import { DuplexLive } from "../../src/duplex/live.ts";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const dirs = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && argv[i - 1].startsWith("--")));
const VAR = opt("--variant", "owner");
const list = (s, d) => String(opt(s, d)).split(",").map(Number);
const SR = 16000, HOP = 320;
const rd = (f) => { const b = fs.readFileSync(f); const x = new Float32Array(b.length / 2); for (let i = 0; i < x.length; i++) x[i] = b.readInt16LE(i * 2) / 32768; return x; };

const scen = [];
for (const dir of dirs) for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "index.json")) {
  const m = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const x = rd(path.join(dir, `${m.id}.${VAR}.s16`)), her = rd(path.join(dir, `${m.id}.her.s16`));
  const off = Math.round((m.herAtMs * SR) / 1000), ha = new Float32Array(x.length);
  for (let i = 0; i < her.length; i++) { const j = i + off; if (j >= 0 && j < x.length) ha[j] = her[i]; }
  scen.push({ m, fm: framesOf(x), fh: framesOf(ha) });
}

function runOne({ m, fm, fh }, tune) {
  let clock = 0, tick = null;
  const ducks = [];
  const port = { duck: (lv) => { if (lv < 1) ducks.push(clock); }, pause: () => true, resume() {}, stop() {}, commit() {}, sttCommit() {}, dropReply() {}, fallback() {}, state() {} };
  const live = new DuplexLive({ lessonId: "t", port, now: () => clock, setInterval: (fn) => { tick = fn; return 1; }, clearInterval() {}, source: "voicelive", vadGate: "server", preDuck: true, supportsCommit: false, preDuckTune: tune });
  live.start();
  const hs = m.gold.herSpan;
  live.herStart(m.herText);
  let ended = false;
  for (let i = 0; i < fm.db.length; i++) {
    clock = i * 20;
    if (!ended && clock >= hs.end) { live.herEnd(); ended = true; }
    const herOn = clock >= hs.start && clock < hs.end && fh.db[i] > -60;
    live.frame(clock, Math.pow(10, fm.db[i] / 20), fm.f0[i], herOn ? fh.db[i] : null, herOn ? fh.f0[i] : null);
    if (i % 5 === 4) tick?.();
  }
  const on = m.gold.childSegs?.[0]?.start ?? Infinity;
  const during = m.child?.start?.mode === "during_her";
  return { falsePre: ducks.some((t) => t >= hs.start + 100 && t < Math.min(on, hs.end + 300)), hit: during ? ducks.find((t) => t >= on - 50 && t <= on + 500) : undefined, fam: m.family };
}

for (const marginDb of list("--margin", "6")) for (const ms of list("--ms", "40")) for (const pitchSt of list("--pitch", "1.5")) {
  const rs = scen.map((s) => runOne(s, { marginDb, ms, pitchSt }));
  const f7 = rs.filter((r) => r.fam === "F7"), f8 = rs.filter((r) => r.fam === "F8");
  const lat = f7.map((r) => r.hit).filter((x) => x !== undefined);
  console.log(JSON.stringify({ marginDb, ms, pitchSt, falseOnEcho: `${rs.filter((r) => r.falsePre).length}/${rs.length}`, bargePreduckLe500: `${lat.length}/${f7.length}`, contPreduck: `${f8.filter((r) => r.hit !== undefined).length}/${f8.length}` }));
}
