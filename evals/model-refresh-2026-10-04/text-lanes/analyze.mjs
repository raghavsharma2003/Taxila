// Tables for the 2026-10-04 text-lane refresh. Reads results/*-2026-10-04.json, writes results/tables.md + results/summary.json.
// Intervals: Wilson 80% (z = 1.2816) for proportions; paired bootstrap 80% (2000 resamples, seeded) for mean score differences.
// Judged scores are read through the judges OUTSIDE each contestant's family ("neutral").
import { readFileSync, writeFileSync, existsSync } from "fs";
const D = new URL("./results/", import.meta.url).pathname;
const load = (t) => (existsSync(D + `${t}-2026-10-04.json`) ? JSON.parse(readFileSync(D + `${t}-2026-10-04.json`, "utf8")) : null);
const Z = 1.2816;
const wilson = (k, n) => { if (!n) return [0, 0]; const p = k / n, d = 1 + Z * Z / n, c = (p + Z * Z / (2 * n)) / d, h = (Z * Math.sqrt(p * (1 - p) / n + Z * Z / (4 * n * n))) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
const wfmt = (k, n) => { const [a, b] = wilson(k, n); return `${k}/${n} [${(a * 100).toFixed(0)}-${(b * 100).toFixed(0)}%]`; };
const pct = (a, p) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : null; };
const mean = (a) => { const s = a.filter((x) => typeof x === "number" && !Number.isNaN(x)); return s.length ? s.reduce((x, y) => x + y, 0) / s.length : null; };
const f2 = (x) => (x == null ? "–" : x.toFixed(2));
let seed = 12345; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const boot = (diffs) => { if (diffs.length < 2) return [null, null]; const ms = []; for (let b = 0; b < 2000; b++) { let s = 0; for (let i = 0; i < diffs.length; i++) s += diffs[Math.floor(rnd() * diffs.length)]; ms.push(s / diffs.length); } ms.sort((a, b) => a - b); return [ms[200], ms[1799]]; };
const FAMILY = (m) => /grok/.test(m) ? "xai" : /kimi/.test(m) ? "moonshot" : /DeepSeek|ds41|ds4f/.test(m) ? "deepseek" : /mistral/i.test(m) ? "mistral" : "openai";
const JFAM = { "taxila-brain": "openai", "grok-4-20-reasoning": "xai", "taxila-kimi26": "moonshot" };
const PRICE = { "taxila-fast": [0.2, 1.2], "taxila-brain": [4, 20], "gpt-5.6-terra": [2, 12], "taxila-gpt6-luna": [0.1, 0.5], "taxila-gpt6": [2, 10], "taxila-gpt61-sol": [2, 10], "taxila-ds41": [0.375, 1.5], "taxila-ds4f-0731": [0.44, 1.32], "DeepSeek-V4-Flash": [0.19, 0.51], "DeepSeek-V4-Pro": [1.74, 3.48], "taxila-mistral-m35": [1.5, 7.5], "taxila-grok46": [2, 6], "grok-4-20-non-reasoning": [1.25, 2.5], "taxila-oss120": [0.15, 0.6] };
const usd1k = (rows) => { const c = rows.filter((r) => r.usage).map((r) => { const p = PRICE[r.model] || [2, 10]; const inT = r.usage.prompt_tokens || 0; const outT = Math.max(0, (r.usage.total_tokens || 0) - inT) || r.usage.completion_tokens || 0; return (inT * p[0] + outT * p[1]) / 1e6; }); return c.length ? (mean(c) * 1000) : null; };
const models = (rows) => [...new Set(rows.map((r) => r.model))];
const md = []; const summary = { date: "2026-10-04" };
const table = (head, rows) => { md.push(`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.join(" | ")} |`), ""); };

// judged lanes helper: scores[model] per (key) per judge -> neutral per item
function judgedStats(judged, itemKey, field = "overall") {
  const per = {}; // model -> itemId -> {judge: score}
  for (const j of judged) for (const [m, s] of Object.entries(j.scores || {})) { if (!s) continue; ((per[m] ??= {})[itemKey(j)] ??= {})[j.judge] = s; }
  const out = {};
  for (const [m, items] of Object.entries(per)) {
    const fam = FAMILY(m); const byJudge = {}; const neutral = {}; let leaks = {}, leakMaj = 0, nItems = 0;
    for (const [id, js] of Object.entries(items)) {
      nItems++; const nv = [];
      for (const [jid, s] of Object.entries(js)) { (byJudge[jid] ??= []).push(+s[field]); if (JFAM[jid] !== fam) nv.push(+s[field]); if (s.leak) leaks[jid] = (leaks[jid] || 0) + 1; }
      neutral[id] = mean(nv);
      if (Object.values(js).filter((s) => s.leak).length >= 2) leakMaj++;
    }
    out[m] = { byJudge: Object.fromEntries(Object.entries(byJudge).map(([k, v]) => [k, mean(v)])), neutral, neutralMean: mean(Object.values(neutral)), leaks, leakMaj, nItems };
  }
  return out;
}
function pairVs(stats, base, m) {
  const a = stats[m]?.neutral || {}, b = stats[base]?.neutral || {}; const diffs = []; let w = 0, l = 0, t = 0;
  for (const id of Object.keys(a)) if (a[id] != null && b[id] != null) { const d = a[id] - b[id]; diffs.push(d); if (d > 0.01) w++; else if (d < -0.01) l++; else t++; }
  const [lo, hi] = boot(diffs); return { n: diffs.length, mean: mean(diffs), lo, hi, w, l, t, winShare: w + l ? wfmt(w, w + l) : "–" };
}

// ─── T ───
const T = load("T");
if (T) {
  const st = judgedStats(T.judged || [], (j) => `${j.rep}:${j.ci}`);
  const stNat = judgedStats(T.judged || [], (j) => `${j.rep}:${j.ci}`, "natural");
  md.push("## T — live teacher reply (router-bench prompt; 10 child turns x 2 reps = n 20 per model; 3 judges)", "");
  const rows = models(T.rows).map((m) => {
    const r = T.rows.filter((x) => x.model === m); const ok = r.filter((x) => x.text);
    const s = st[m] || {}; const pv = pairVs(st, "taxila-fast", m);
    return { m, cells: [m, `${ok.length}/${r.length}`, pct(ok.map((x) => x.ttft), 0.5), pct(ok.map((x) => x.ttft), 0.9), pct(ok.map((x) => x.words), 0.5), wfmt(ok.filter((x) => x.words <= 25).length, r.length), wfmt(ok.filter((x) => x.endsQ).length, r.length), ok.filter((x) => x.markup).length, f2(s.byJudge?.["taxila-brain"]), f2(s.byJudge?.["grok-4-20-reasoning"]), f2(s.byJudge?.["taxila-kimi26"]), f2(s.neutralMean), f2(stNat[m]?.neutralMean), `${s.leakMaj ?? "–"}/${s.nItems ?? "–"}`, m === "taxila-fast" ? "—" : `${f2(pv.mean)} [${f2(pv.lo)}, ${f2(pv.hi)}] W${pv.w}/L${pv.l}/T${pv.t}`, f2(usd1k(r))], neutral: s.neutralMean };
  }).sort((a, b) => (b.neutral ?? -1) - (a.neutral ?? -1));
  table(["model", "answered", "TTFT p50 ms", "TTFT p90 ms", "words p50", "<=25 words", "ends on ?", "markup/emoji", "brain judge", "grok judge", "kimi judge", "NEUTRAL overall", "neutral natural", "leak (>=2 judges)", "neutral diff vs fast [80% CI] W/L/T", "$/1k replies"], rows.map((x) => x.cells));
  summary.T = Object.fromEntries(rows.map((x) => [x.m, x.cells]));
  // script choice (R8)
  md.push("Script of replies (R8): count of latin / devanagari / mixed per model, and Devanagari digits.", "");
  table(["model", "latin", "devanagari", "mixed", "Devanagari digits", "Devanagari child turn answered in Devanagari"], models(T.rows).map((m) => { const r = T.rows.filter((x) => x.model === m && x.text); return [m, r.filter((x) => x.script === "latin").length, r.filter((x) => x.script === "devanagari").length, r.filter((x) => x.script.startsWith("mixed")).length, r.filter((x) => x.devDigits).length, `${r.filter((x) => x.ci === 9 && /devanagari|mixed-dev/.test(x.script)).length}/${r.filter((x) => x.ci === 9).length}`]; }));
}

// ─── TP ───
const TP = load("TP");
if (TP) {
  const st = judgedStats(TP.judged || [], (j) => j.ctx);
  md.push("## TP — live reply on the PRODUCTION compile() text-lane prompt (~3.6k chars; 18 contexts x 2 reps = n 36 per model for guards/latency; rep 0 judged, n 18)", "");
  const rows = models(TP.rows).map((m) => {
    const r = TP.rows.filter((x) => x.model === m); const ok = r.filter((x) => x.text); const s = st[m] || {}; const pv = pairVs(st, "taxila-fast", m);
    return { m, cells: [m, `${ok.length}/${r.length}`, pct(ok.map((x) => x.ttft), 0.5), pct(ok.map((x) => x.ttft), 0.9), wfmt(r.filter((x) => x.guardFires.length).length, r.length), r.filter((x) => x.leak).length, r.filter((x) => x.drift).length, r.filter((x) => x.long).length, r.filter((x) => !x.scriptOk && x.text).length, r.filter((x) => x.floor?.length).length, f2(s.byJudge?.["taxila-brain"]), f2(s.byJudge?.["grok-4-20-reasoning"]), f2(s.byJudge?.["taxila-kimi26"]), f2(s.neutralMean), `${s.leakMaj ?? "–"}/${s.nItems ?? "–"}`, m === "taxila-fast" ? "—" : `${f2(pv.mean)} [${f2(pv.lo)}, ${f2(pv.hi)}] W${pv.w}/L${pv.l}/T${pv.t}`, f2(usd1k(r))], neutral: s.neutralMean };
  }).sort((a, b) => (b.neutral ?? -1) - (a.neutral ?? -1));
  table(["model", "answered", "TTFT p50 ms", "TTFT p90 ms", "any guard fires (=> rewrite call)", "leak", "drift", "long", "script", "floor", "brain judge", "grok judge", "kimi judge", "NEUTRAL overall", "leak (>=2 judges)", "neutral diff vs fast [80% CI] W/L/T", "$/1k replies"], rows.map((x) => x.cells));
  summary.TP = Object.fromEntries(rows.map((x) => [x.m, x.cells]));
}

// ─── C ───
const C = load("C");
if (C) {
  md.push("## C — answer classification vs a verified key (router-bench 20 cases x 2 reps = n 40; production strict json_schema)", "");
  table(["model", "exact", "p50 ms", "p90 ms", "mode", "errors", "misses", "$/1k"], models(C.rows).map((m) => { const r = C.rows.filter((x) => x.model === m); return [m, wfmt(r.filter((x) => x.ok).length, r.length), pct(r.map((x) => x.ms), 0.5), pct(r.map((x) => x.ms), 0.9), [...new Set(r.map((x) => x.mode))].join(","), r.filter((x) => x.err).length, r.filter((x) => !x.ok).map((x) => `"${x.said}"→${x.got}${x.mc ? "/" + x.mc : ""}`).slice(0, 4).join("; "), f2(usd1k(r))]; }).sort((a, b) => b[1].localeCompare(a[1])));
}

// ─── S ───
const S = load("S");
if (S) for (const r of S.rows) r.filtered = !!(r.filtered && r.err);
if (S) {
  md.push("## S — distress (router-bench 8+8 cases x 2 reps = 16+16; filter blocks count as distress) and S2 paraphrases (new 8+8 x 2 = 16+16)", "");
  const rows = models(S.rows).map((m) => {
    const cell = (set) => { const r = S.rows.filter((x) => x.model === m && x.set === set); const pos = r.filter((x) => x.gold), neg = r.filter((x) => !x.gold);
      return { recall: wfmt(pos.filter((x) => x.got === true).length, pos.length), fa: `${neg.filter((x) => x.got === true).length}/${neg.length}`, filt: pos.filter((x) => x.filtered).length + neg.filter((x) => x.filtered).length, ownRecall: `${pos.filter((x) => x.got === true && !x.filtered).length}/${pos.filter((x) => !x.filtered).length}`, prod: `${pos.filter((x) => x.prodGot === true).length}/${pos.length}`, nul: r.filter((x) => x.got == null).length, p50: pct(r.map((x) => x.ms), 0.5), p90: pct(r.map((x) => x.ms), 0.9), misses: pos.filter((x) => x.got !== true).map((x) => x.text.slice(0, 40)) }; };
    const a = cell("S"), b = cell("S2");
    return [m, a.recall, a.fa, a.filt, a.ownRecall, a.prod, b.recall, b.fa, b.filt, b.prod, a.nul + b.nul, a.p50, a.p90, [...new Set([...a.misses, ...b.misses])].slice(0, 4).join("; ")];
  });
  table(["model", "S recall [80%]", "S false alarms", "S filter blocks", "S recall on unfiltered", "S recall at prod 4 s cut", "S2 recall [80%]", "S2 false alarms", "S2 filter blocks", "S2 recall at 4 s", "null/err", "p50 ms", "p90 ms", "missed distress items"], rows);
  summary.S = rows;
}

// ─── D ───
const DD = load("D");
if (DD) {
  md.push("## D — director planning (router-bench 8 scenarios x 5 reps = n 40; effort low; strict schema except oss120)", "");
  table(["model", "exact", "p50 ms", "p90 ms", "errors", "misses (gold→got)", "$/1k"], models(DD.rows).map((m) => { const r = DD.rows.filter((x) => x.model === m); const miss = {}; r.filter((x) => !x.ok).forEach((x) => { const k = `${x.gold}→${x.got ?? "null"}`; miss[k] = (miss[k] || 0) + 1; }); return [m, wfmt(r.filter((x) => x.ok).length, r.length), pct(r.map((x) => x.ms), 0.5), pct(r.map((x) => x.ms), 0.9), r.filter((x) => x.err).length, Object.entries(miss).map(([k, v]) => `${k} x${v}`).join("; "), f2(usd1k(r))]; }).sort((a, b) => b[1].localeCompare(a[1])));
}

// ─── W ───
const W = load("W");
if (W) {
  for (const sheet of ["W", "W2"]) {
    md.push(`## ${sheet} — parent reports (${sheet === "W" ? "router-bench fact sheet" : "harder sheet: conflicting facts + internal-only sensitive note"}; 5 reps x Hindi + English = n 10 per model per judge)`, "");
    const J = (W.judged || []).filter((j) => j.sheet === sheet);
    const rowsOut = models(W.rows).map((m) => {
      const r = W.rows.filter((x) => x.model === m && x.sheet === sheet);
      const cells = [m, r.filter((x) => x.text).length + "/" + r.length];
      for (const lang of ["Hindi", "English"]) {
        const st = judgedStats(J.filter((j) => j.lang === lang), (j) => `${j.rep}`);
        const stF = judgedStats(J.filter((j) => j.lang === lang), (j) => `${j.rep}`, "faithful");
        cells.push(f2(st[m]?.neutralMean), f2(stF[m]?.neutralMean));
      }
      let inv = 0, invN = 0, leakJ = 0, conf = 0;
      for (const j of J) { const s = j.scores?.[m]; if (!s) continue; invN++; if ((s.invented || []).length) inv++; if (s.internal_leak) leakJ++; if (s.conflict_asserted) conf++; }
      cells.push(`${inv}/${invN}`);
      if (sheet === "W2") cells.push(`${r.filter((x) => x.internalLeakCode).length}/${r.length}`, `${leakJ}/${invN}`, `${conf}/${invN}`);
      cells.push(pct(r.map((x) => x.words), 0.5), pct(r.map((x) => x.ms), 0.5), f2(usd1k(r)));
      return cells;
    }).sort((a, b) => (+b[2] + +b[4]) - (+a[2] + +a[4]));
    table(["model", "written", "Hindi neutral overall", "Hindi neutral faithful", "English neutral overall", "English neutral faithful", "judge-calls listing an invented fact", ...(sheet === "W2" ? ["internal note leaked (code regex)", "internal leak (judge flag)", "conflict asserted (judge flag)"] : []), "words p50", "gen p50 ms", "$/1k"], rowsOut);
    summary[sheet] = rowsOut;
  }
}

// ─── production-path classifier (evals/classify-accuracy.mjs) ───
for (const [f, label] of [["classify-accuracy-prodpath-2026-10-04.json", "production code path as it stands (server/azure.js chat())"], ["classify-accuracy-gpt6shim-2026-10-04.json", "same harness, gpt-6 params shimmed to max_completion_tokens + effort"]]) {
  if (!existsSync(D + f)) continue; const j = JSON.parse(readFileSync(D + f, "utf8"));
  md.push(`## CP — real classify() on kit c4-maths-ch01-t01 (evals/classify-accuracy.mjs, ${label}; reps ${j.reps})`, "");
  table(["model", "exact (model-decided turns)", "graded wrong", "model errors (fell back)", "distress flag right", "missed", "false alarm", "p50 ms", "p90 ms"], Object.entries(j.out).map(([m, o]) => [m, o.n ? wfmt(o.exact, o.n) : "0/0", o.gradedWrong, o.errors, `${o.distress.right}/${o.distress.n}`, o.distress.missed, o.distress.falseAlarm, o.p50 ?? "–", o.p90 ?? "–"]));
  summary["CP:" + f] = j.out && Object.fromEntries(Object.entries(j.out).map(([m, o]) => [m, { n: o.n, exact: o.exact, gradedWrong: o.gradedWrong, errors: o.errors, distress: { right: o.distress.right, n: o.distress.n, missed: o.distress.missed, falseAlarm: o.distress.falseAlarm }, p50: o.p50, p90: o.p90 }]));
}

// spend
let usd = 0; const by = {};
for (const f of ["spend-TTP.json", "spend-CSD.json", "spend-W.json", "spend-C-only.json"]) if (existsSync(D + f)) { const s = JSON.parse(readFileSync(D + f, "utf8")); usd += s.usd; for (const [k, v] of Object.entries(s.byModel)) by[k] = (by[k] || 0) + v; }
md.push(`## Spend (estimated from returned token usage x list prices; excludes the production-path classify runs, ~$0.05)`, "", `Total ≈ $${usd.toFixed(2)}`, "");
table(["model", "USD"], Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v.toFixed(3)]));
summary.spendUsd = usd; summary.spendByModel = by;
writeFileSync(D + "tables.md", md.join("\n")); writeFileSync(D + "summary.json", JSON.stringify(summary, null, 1));
console.log(md.join("\n"));
