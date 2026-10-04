// The voice-identity drift alarm (HUMAN-VOICE §5.7 / §8.2.4; a port of html-portfolio's prosody-baseline idea): render a
// fixed reference line per production voice through the PRODUCTION compiler, measure f0 median (autocorrelation on
// voiced 40 ms frames) and speech rate, and compare with the stored baseline. Alarm when f0 moves more than ±8% or the
// rate more than ±12% (a vendor model update changed the voice the children know). The clip bank it was also meant to
// watch does not exist (owner 2026-10-04: clips off), so only the live voices are checked.
//   node scripts/prosody-baseline.mjs           compare (exit 1 on drift)
//   node scripts/prosody-baseline.mjs --write   (re)write the baseline (only after an ear check)
// Env: AZURE_SPEECH_REGION / AZURE_SPEECH_KEY (the production Speech resource).
import fs from "node:fs";
import { dhdStream } from "../server/voice/azureTts.js";
import { plainSsml } from "../server/voice/expressive/compile/dhd.js";
import { speakable } from "../server/voice/spoken.js";
import { VOICE_TABLE } from "../server/voice/voices.js";

const FILE = new URL("../docs/design/superhuman/voice-bank/prosody-baseline.json", import.meta.url);
const LINE = "Chalo, aaj hum ek nayi cheez seekhte hain. Ek pizza ko 4 barabar hisson mein kaatte hain, aur har hissa ek chauthai hai.";
const TAKES = 3, F0_TOL = 0.08, RATE_TOL = 0.12;

/** f0 median (Hz) of voiced frames, by normalised autocorrelation in 75-400 Hz. */
export function f0Median(pcm, rate = 24000) {
  const n = pcm.length >> 1, x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = pcm.readInt16LE(i * 2) / 32768;
  const W = Math.round(rate * 0.04), H = Math.round(rate * 0.02), lo = Math.floor(rate / 400), hi = Math.ceil(rate / 75);
  const f0s = [];
  for (let s = 0; s + W + hi < n; s += H) {
    let e = 0;
    for (let i = s; i < s + W; i++) e += x[i] * x[i];
    if (Math.sqrt(e / W) < 0.02) continue;
    let best = 0, lag = 0;
    for (let L = lo; L <= hi; L++) {
      let c = 0, e2 = 0;
      for (let i = s; i < s + W; i++) { c += x[i] * x[i + L]; e2 += x[i + L] * x[i + L]; }
      const r = c / Math.sqrt(e * e2 + 1e-12);
      if (r > best) { best = r; lag = L; }
    }
    if (best > 0.6 && lag) f0s.push(rate / lag);
  }
  f0s.sort((a, b) => a - b);
  return f0s.length ? f0s[f0s.length >> 1] : 0;
}
function speechSeconds(pcm) {
  const n = pcm.length >> 1, F = 240, th = 32768 * 10 ** (-45 / 20);
  let first = -1, last = -1;
  for (let f = 0; f + F <= n; f += F) { let s = 0; for (let i = f; i < f + F; i++) { const v = pcm.readInt16LE(i * 2); s += v * v; } if (Math.sqrt(s / F) >= th) { if (first < 0) first = f; last = f + F; } }
  return first < 0 ? 0 : (last - first) / 24000;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const write = process.argv.includes("--write");
  const base = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : { voices: {} };
  const now = { at: new Date().toISOString(), region: process.env.AZURE_SPEECH_REGION, line: LINE, voices: {} };
  let drift = 0;
  for (const [id, row] of Object.entries(VOICE_TABLE).filter(([, r]) => r.measured)) {
    const f0 = [], cps = [];
    for (let t = 0; t < TAKES; t++) {
      const { chunks } = await dhdStream(plainSsml(LINE, { voice: row.dhd, baseRate: row.baseRate }, { mode: "hinglish" }), { headerTimeoutMs: 20_000, timeoutMs: 30_000 });
      const all = []; for await (const c of chunks) all.push(Buffer.from(c));
      const pcm = Buffer.concat(all);
      f0.push(f0Median(pcm)); cps.push(speakable(LINE, { mode: "hinglish" }).length / speechSeconds(pcm));
    }
    const med = (a) => a.sort((x, y) => x - y)[a.length >> 1];
    now.voices[id] = { voice: row.dhd, baseRate: row.baseRate, f0: Math.round(med(f0) * 10) / 10, cps: Math.round(med(cps) * 100) / 100, takes: TAKES };
    const b = base.voices?.[id];
    const df = b ? now.voices[id].f0 / b.f0 - 1 : 0, dr = b ? now.voices[id].cps / b.cps - 1 : 0;
    const bad = b && (b.voice !== row.dhd || b.baseRate !== row.baseRate ? false : Math.abs(df) > F0_TOL || Math.abs(dr) > RATE_TOL);
    if (bad) drift++;
    console.log(`${id} ${row.dhd}: f0 ${now.voices[id].f0} Hz${b ? ` (${(df * 100).toFixed(1)}%)` : ""}, ${now.voices[id].cps} chars/s${b ? ` (${(dr * 100).toFixed(1)}%)` : ""}${bad ? "  DRIFT" : ""}`);
  }
  if (write) { fs.writeFileSync(FILE, JSON.stringify(now, null, 1)); console.log("baseline written"); }
  process.exitCode = drift && !write ? 1 : 0;
}
