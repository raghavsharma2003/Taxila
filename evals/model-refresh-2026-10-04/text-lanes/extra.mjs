// Extra paired comparisons (neutral = judges outside the contestant's family; a pair uses judges outside BOTH families).
import { readFileSync, writeFileSync } from "fs";
const D = new URL("./results/", import.meta.url).pathname; const Z = 1.2816;
const wilson = (k, n) => { const p = k / n, d = 1 + Z * Z / n, c = (p + Z * Z / (2 * n)) / d, h = (Z * Math.sqrt(p * (1 - p) / n + Z * Z / (4 * n * n))) / d; return `${k}/${n} [${Math.round(100 * Math.max(0, c - h))}-${Math.round(100 * Math.min(1, c + h))}%]`; };
const FAM = (m) => /grok/.test(m) ? "xai" : /kimi/.test(m) ? "moonshot" : /DeepSeek|ds41|ds4f/.test(m) ? "deepseek" : /mistral/i.test(m) ? "mistral" : "openai";
const JF = { "taxila-brain": "openai", "grok-4-20-reasoning": "xai", "taxila-kimi26": "moonshot" };
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function pair(judged, key, a, b) {
  const items = {};
  for (const j of judged) { if (JF[j.judge] === FAM(a) || JF[j.judge] === FAM(b)) continue; const sa = j.scores?.[a], sb = j.scores?.[b]; if (!sa || !sb) continue; (items[key(j)] ??= []).push(+sa.overall - +sb.overall); }
  const d = Object.values(items).map((v) => v.reduce((x, y) => x + y, 0) / v.length);
  const w = d.filter((x) => x > 0.01).length, l = d.filter((x) => x < -0.01).length;
  const ms = []; for (let i = 0; i < 2000; i++) { let s = 0; for (let k = 0; k < d.length; k++) s += d[Math.floor(rnd() * d.length)]; ms.push(s / d.length); } ms.sort((x, y) => x - y);
  return { a, b, judges: Object.keys(JF).filter((j) => JF[j] !== FAM(a) && JF[j] !== FAM(b)), n: d.length, mean: +(d.reduce((x, y) => x + y, 0) / d.length).toFixed(2), ci80: [+ms[200].toFixed(2), +ms[1799].toFixed(2)], W: w, L: l, T: d.length - w - l, winShare: w + l ? wilson(w, w + l) : "-" };
}
const out = {};
const T = JSON.parse(readFileSync(D + "T-2026-10-04.json")), TP = JSON.parse(readFileSync(D + "TP-2026-10-04.json"));
const PAIRS = [["taxila-gpt6-luna", "taxila-fast"], ["taxila-gpt6", "taxila-fast"], ["taxila-gpt6", "taxila-gpt6-luna"], ["taxila-mistral-m35", "taxila-fast"], ["taxila-ds4f-0731", "taxila-fast"], ["DeepSeek-V4-Pro", "taxila-fast"], ["taxila-mistral-m35", "DeepSeek-V4-Pro"], ["taxila-ds4f-0731", "DeepSeek-V4-Pro"], ["taxila-ds41", "taxila-fast"]];
out.T = PAIRS.map(([a, b]) => pair(T.judged, (j) => `${j.rep}:${j.ci}`, a, b));
out.TP = PAIRS.map(([a, b]) => pair(TP.judged, (j) => j.ctx, a, b));
try { const W = JSON.parse(readFileSync(D + "W-2026-10-04.json")); if (W.judged) for (const sh of ["W", "W2"]) out[sh] = [["taxila-gpt6-luna", "taxila-fast"], ["taxila-gpt6-luna", "taxila-brain"], ["taxila-fast", "taxila-brain"], ["taxila-gpt6", "taxila-brain"], ["taxila-gpt61-sol", "taxila-brain"]].map(([a, b]) => pair(W.judged.filter((j) => j.sheet === sh), (j) => `${j.rep}:${j.lang}`, a, b)); } catch {}
// judge agreement: Spearman of model means between each judge pair on T and TP
const sp = (x, y) => { const r = (a) => { const s = [...a].map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const rk = []; s.forEach(([, i], k) => (rk[i] = k)); return rk; }; const rx = r(x), ry = r(y), n = x.length; return 1 - (6 * rx.reduce((s, v, i) => s + (v - ry[i]) ** 2, 0)) / (n * (n * n - 1)); };
for (const [name, L] of [["T", T], ["TP", TP]]) { const means = {}; for (const j of L.judged) for (const [m, s] of Object.entries(j.scores || {})) if (s) ((means[j.judge] ??= {})[m] ??= []).push(+s.overall);
  const ms = Object.keys(means["taxila-brain"]); const mv = (jd) => ms.map((m) => { const v = means[jd][m] || []; return v.reduce((a, b) => a + b, 0) / (v.length || 1); });
  out[`spearman_${name}`] = { "brain-grok": +sp(mv("taxila-brain"), mv("grok-4-20-reasoning")).toFixed(2), "brain-kimi": +sp(mv("taxila-brain"), mv("taxila-kimi26")).toFixed(2), "grok-kimi": +sp(mv("grok-4-20-reasoning"), mv("taxila-kimi26")).toFixed(2), models: ms.length }; }
writeFileSync(D + "pairs.json", JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out)) { console.log("==", k); if (Array.isArray(v)) v.forEach((p) => console.log(`${p.a} vs ${p.b}: ${p.mean} [${p.ci80}] W${p.W}/L${p.L}/T${p.T} winshare ${p.winShare} judges ${p.judges.join("+")}`)); else console.log(JSON.stringify(v)); }
