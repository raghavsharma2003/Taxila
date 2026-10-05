// In-app lip-sync offset (V4 measure 1, pipeline half): the production stage played 24 Diya lines on a real AudioContext
// in Chromium (run.mjs lipsync), recording per rendered frame: the ms of the line sounding at the output clock
// (getOutputTimestamp), the ms the viseme scheduler used (now - playAt), and the lip gap the rig actually drew.
//   node evals/face-puppet/lipsync-inapp.mjs
// Reports:
//   S  scheduling error = scheduler ms - sounding ms (the client clock mapping: playAt + output latency vs the real output)
//   G  rendered-gap lag: the drawn lip gap (resampled to 5 ms) cross-correlated with the audio log-energy envelope, per line
//      (+ = mouth later), and paired against the forced-alignment reference track's lag on the same audio (lipsync-offset
//      E3 rows): "in-app mouth vs the judged timing".
import fs from "node:fs";

const OUT = "evals/face-puppet/out/";
const raw = JSON.parse(fs.readFileSync(OUT + "lipsync-inapp-raw.json", "utf8"));
const ref = JSON.parse(fs.readFileSync(OUT + "lipsync-offset.json", "utf8"));
const refRow = Object.fromEntries(ref.rows.map((r) => [r.line, r]));
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const HOP = 5;
function envelope(id) {
  const b = fs.readFileSync(`${OUT}diya/${id}.pcm`);
  const s = new Int16Array(b.buffer, b.byteOffset, b.length >> 1);
  const out = [];
  for (let i = 0; i + 240 <= s.length; i += 120) { let e = 0; for (let j = i; j < i + 240; j++) e += (s[j] / 32768) ** 2; out.push(10 * Math.log10(e / 240 + 1e-9)); }
  return out;
}
function pearson(a, b, lag) { let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0; for (let i = 0; i < a.length; i++) { const j = i + lag; if (j < 0 || j >= b.length || Number.isNaN(b[j])) continue; const x = a[i], y = b[j]; n++; sa += x; sb += y; saa += x * x; sbb += y * y; sab += x * y; } const c = sab / n - (sa / n) * (sb / n); return c / Math.sqrt((saa / n - (sa / n) ** 2) * (sbb / n - (sb / n) ** 2) + 1e-12); }

const sched = [], rows = [], paired = [];
let frames = 0, intervals = [];
for (const L of raw) {
  const fr = L.frames.filter((f) => f[0] >= 0);
  frames += fr.length;
  for (let i = 1; i < fr.length; i++) intervals.push(fr[i][0] - fr[i - 1][0]);
  for (const f of fr) if (f[0] < L.frames.at(-1)[0] - 300) sched.push(f[1] - f[0]);
  const env = envelope(L.line);
  // the drawn gap on the 5 ms grid (linear between rendered frames; a frame is on screen until the next)
  const g = new Float64Array(env.length).fill(NaN);
  let k = 0;
  for (let i = 0; i < env.length; i++) {
    const t = i * HOP;
    while (k + 1 < fr.length && fr[k + 1][0] <= t) k++;
    if (k + 1 < fr.length && fr[k][0] <= t) g[i] = fr[k][2];
  }
  let best = -2, lag = 0;
  for (let l = -60; l <= 60; l++) { const r = pearson(env, g, l); if (r > best) { best = r; lag = l; } }
  const rr = refRow[L.line];
  const p = rr && rr.ctcLagMs != null ? lag * HOP - rr.ctcLagMs : null;
  if (p !== null) paired.push(p);
  rows.push({ line: L.line, frames: fr.length, gapLagMs: lag * HOP, r: +best.toFixed(3), ctcRefLagMs: rr?.ctcLagMs ?? null, inappMinusRefMs: p, azureRawLagMs: rr?.e1LagMs });
}
const res = {
  date: new Date().toISOString().slice(0, 10),
  method: "production src/face-puppet stage in Playwright Chromium (SwiftShader), real AudioContext + AnalyserNode tap, Diya PCM + her websocket viseme events on the puppet bus (playAt = player clock + output latency), EVENT_LEAD_MS applied; per rendered frame: output-clock audio ms (getOutputTimestamp), scheduler ms, drawn lip gap",
  lines: raw.length, frames, frameIntervalMedianMs: q(intervals, 0.5),
  schedulingErrorMs: { n: sched.length, median: +q(sched, 0.5).toFixed(1), p05: +q(sched, 0.05).toFixed(1), p95: +q(sched, 0.95).toFixed(1) },
  renderedGapLag: { medianMs: q(rows.map((r) => r.gapLagMs), 0.5), p10: q(rows.map((r) => r.gapLagMs), 0.1), p90: q(rows.map((r) => r.gapLagMs), 0.9) },
  inappMinusJudgedTiming: { n: paired.length, medianMs: q(paired, 0.5), q25: q(paired, 0.25), q75: q(paired, 0.75), min: Math.min(...paired), max: Math.max(...paired) },
  rows,
};
fs.writeFileSync(OUT + "lipsync-inapp.json", JSON.stringify(res, null, 1));
console.log(JSON.stringify({ ...res, rows: undefined }, null, 1));
console.table(rows);
