// Validates the E1 envelope-lag estimator (lipsync-offset.mjs) on a track whose timing came from the AUDIO, not from
// Azure: the polish-r8 judged clip's wav2vec2 CTC forced alignment (art/character/puppet2d/polish-r8/audio/voice.align.json)
// against its own voice.mp3. If E1 is unbiased it reports ~0 ms here; then a non-zero lag on Diya's Azure events is the
// events' own offset, not the estimator's. Also checks recovery of synthetic shifts (+-100 ms) on that track.
//   node evals/face-puppet/estimator-check.mjs
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { OPENNESS } from "../../src/face-puppet/visemes.ts";

const A = "art/character/puppet2d/polish-r8/audio/";
const align = JSON.parse(fs.readFileSync(A + "voice.align.json", "utf8"));
const pcm = execFileSync("ffmpeg", ["-v", "quiet", "-i", A + "voice.mp3", "-f", "s16le", "-ac", "1", "-ar", "24000", "-"], { maxBuffer: 64 << 20 });
const OC2AZ = { viseme_sil: 0, viseme_aa: 2, viseme_E: 4, viseme_I: 6, viseme_O: 8, viseme_U: 7, viseme_PP: 21, viseme_FF: 18, viseme_TH: 17, viseme_DD: 19, viseme_kk: 20, viseme_CH: 16, viseme_SS: 15, viseme_nn: 14, viseme_RR: 13 };
// segments as the r8 demo built them (unit until the next unit of its word; last unit to word end + 40 ms), silence between
const ev = [];
for (const w of align.words) {
  const us = align.visemes.filter((v) => v.word === w.word && v.t0 >= w.t0 - 0.35 && v.t0 <= w.t1 + 0.05);
  us.forEach((u, i) => { ev.push({ ms: u.t0 * 1000, id: OC2AZ[u.viseme] ?? 0 }); if (i === us.length - 1) ev.push({ ms: (Math.max(u.t1, w.t1) + 0.04) * 1000, id: 0 }); });
}
ev.sort((a, b) => a.ms - b.ms);
const HOP = 5, SR = 24000;
const s = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length >> 1);
const env = [];
for (let i = 0; i + 240 <= s.length; i += 120) { let e = 0; for (let j = i; j < i + 240; j++) e += (s[j] / 32768) ** 2; env.push(10 * Math.log10(e / 240 + 1e-9)); }
const track = (shift) => { const o = new Float64Array(env.length); ev.forEach((v, k) => { const a = Math.round((v.ms + shift) / HOP), b = k + 1 < ev.length ? Math.round((ev[k + 1].ms + shift) / HOP) : env.length; for (let i = Math.max(0, a); i < Math.min(b, env.length); i++) o[i] = OPENNESS[v.id]; }); return o; };
function pearson(a, b, lag) { let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0; for (let i = 0; i < a.length; i++) { const j = i + lag; if (j < 0 || j >= b.length) continue; const x = a[i], y = b[j]; n++; sa += x; sb += y; saa += x * x; sbb += y * y; sab += x * y; } const c = sab / n - (sa / n) * (sb / n); return c / Math.sqrt((saa / n - (sa / n) ** 2) * (sbb / n - (sb / n) ** 2) + 1e-12); }
const out = {};
for (const shift of [0, 100, -100]) {
  const tr = track(shift);
  let best = -2, lag = 0;
  for (let L = -60; L <= 60; L++) { const r = pearson(env, tr, L); if (r > best) { best = r; lag = L; } }
  out[`shift${shift}`] = { e1LagMs: lag * HOP, r: +best.toFixed(3) };
}
const res = { date: new Date().toISOString().slice(0, 10), source: "polish-r8 voice.mp3 + wav2vec2 CTC forced alignment", n_events: ev.length, seconds: +(s.length / SR).toFixed(2), ...out };
fs.mkdirSync("evals/face-puppet/out", { recursive: true });
fs.writeFileSync("evals/face-puppet/out/estimator-check.json", JSON.stringify(res, null, 1));
console.log(res);
