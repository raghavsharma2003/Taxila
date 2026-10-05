// Paired score of the PRODUCT-PATH mouth against the forced-alignment timing of the same product audio (ship5 p2-face).
//   node evals/p2-face/score-product.mjs            (after lipsync-product.mjs runs and ctc-product.py)
// Per reply segment (out/product/<tag>-<k>): the envelope of the audio the real player scheduled (10 ms windows, 5 ms
// hop), the lip gap the real stage drew on the same 5 ms grid, and the wav2vec2 forced-alignment viseme track of that
// audio mapped to openness (src/face-puppet/visemes.ts OPENNESS), all scored with the estimator of
// evals/face-puppet/lipsync-offset.mjs E3 (best Pearson lag, -300..+300 ms, + = later than the sound):
//   gapLag   the drawn mouth vs the sound;
//   ctcLag   the forced-alignment mouth (the judged clips' timing) vs the same sound;
//   paired   gapLag - ctcLag: the product mouth against the judged timing, on the same audio (the harness figure this
//            replaces: -35 ms median, n = 21, evals/face-puppet/out/lipsync-inapp.json, which used a re-implemented player).
import fs from "node:fs";
import { OPENNESS } from "../../src/face-puppet/visemes.ts";

const DIR = new URL("./out/product/", import.meta.url).pathname;
const HOP = 5, SR = 24000, WIN = 10;
const q = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
function envelope(buf) {
  const s = new Int16Array(buf.buffer, buf.byteOffset, buf.length >> 1);
  const hop = (SR * HOP) / 1000, win = (SR * WIN) / 1000, out = [];
  for (let i = 0; i + win <= s.length; i += hop) { let e = 0; for (let j = i; j < i + win; j++) e += (s[j] / 32768) ** 2; out.push(10 * Math.log10(e / win + 1e-9)); }
  return out;
}
function track(visemes, n) {
  const out = new Array(n).fill(0);
  for (let k = 0; k < visemes.length; k++) {
    const a = Math.round(visemes[k].ms / HOP), b = k + 1 < visemes.length ? Math.round(visemes[k + 1].ms / HOP) : n;
    for (let i = Math.max(0, a); i < Math.min(b, n); i++) out[i] = OPENNESS[visemes[k].id] ?? 0;
  }
  return out;
}
function pearson(a, b, lag) {
  let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let i = 0; i < a.length; i++) { const j = i + lag; if (j < 0 || j >= b.length || b[j] == null || Number.isNaN(b[j])) continue; const x = a[i], y = b[j]; n++; sa += x; sb += y; saa += x * x; sbb += y * y; sab += x * y; }
  if (n < 40) return -2;
  const cov = sab / n - (sa / n) * (sb / n), va = saa / n - (sa / n) ** 2, vb = sbb / n - (sb / n) ** 2;
  return cov / Math.sqrt(va * vb + 1e-12);
}
const bestLag = (a, b) => { let best = -2, lag = 0; for (let l = -60; l <= 60; l++) { const r = pearson(a, b, l); if (r > best) { best = r; lag = l; } } return { lagMs: lag * HOP, r: +best.toFixed(3) }; };

const rows = [];
for (const f of fs.readdirSync(DIR).filter((x) => /-\d+\.json$/.test(x) && !x.endsWith(".ctc.json")).sort()) {
  const meta = JSON.parse(fs.readFileSync(DIR + f, "utf8"));
  const ctcF = DIR + f.replace(".json", ".ctc.json");
  if (!fs.existsSync(ctcF)) continue;
  const ctc = JSON.parse(fs.readFileSync(ctcF, "utf8"));
  if (ctc.skipped) { rows.push({ seg: f.replace(".json", ""), skipped: ctc.skipped }); continue; }
  const env = envelope(fs.readFileSync(DIR + f.replace(".json", ".pcm")));
  const gap = meta.gap.slice(0, env.length);
  const tr = track(ctc.visemes, env.length);
  const g = bestLag(env, gap), c = bestLag(env, tr), d = bestLag(tr, gap);
  rows.push({ seg: f.replace(".json", ""), secs: +(env.length * HOP / 1000).toFixed(2), gapLagMs: g.lagMs, gapR: g.r, ctcLagMs: c.lagMs, ctcR: c.r, pairedMs: g.lagMs - c.lagMs, directLagMs: d.lagMs, directR: d.r });
}
const ok = rows.filter((r) => !r.skipped);
const paired = ok.map((r) => r.pairedMs), direct = ok.map((r) => r.directLagMs);
const res = {
  date: new Date().toISOString().slice(0, 10),
  method: "product path (real server + Azure websocket + real ttsStream player + real stage, Chromium headless SwiftShader); reference = wav2vec2-base-960h CTC forced alignment of the same scheduled audio; estimator = lipsync-offset E3 (best-Pearson lag on 5 ms grid)",
  segments: rows.length, scored: ok.length, skipped: rows.filter((r) => r.skipped).length,
  productMinusJudgedMs: { n: paired.length, median: q(paired, 0.5), q25: q(paired, 0.25), q75: q(paired, 0.75), min: paired.length ? Math.min(...paired) : null, max: paired.length ? Math.max(...paired) : null, within50: paired.length ? +(paired.filter((x) => Math.abs(x) <= 50).length / paired.length).toFixed(2) : null },
  mouthVsAlignmentDirectMs: { n: direct.length, median: q(direct, 0.5), q25: q(direct, 0.25), q75: q(direct, 0.75) },
  gapVsSoundMs: { median: q(ok.map((r) => r.gapLagMs), 0.5), rMedian: q(ok.map((r) => r.gapR), 0.5) },
  rows,
};
fs.writeFileSync(new URL("./out/lipsync-product-score.json", import.meta.url), JSON.stringify(res, null, 1));
console.log(JSON.stringify({ ...res, rows: undefined }, null, 1));
console.table(rows);
