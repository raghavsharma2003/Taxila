// Scores results/run-2026-10-04.json against the frozen labels and hard-rule predicate in scenarios.mjs.
//   node analyze.mjs   -> results/summary.json + results/tables.md
import { readFileSync, writeFileSync } from "fs";
import { SCENARIOS, ORIGINAL_LABELS, hardBreaks, isOk } from "./scenarios.mjs";
const R = JSON.parse(readFileSync(new URL("./results/run-2026-10-04.json", import.meta.url)));
const PRICE = { "taxila-gpt6": [2, 10], "taxila-gpt61-sol": [2, 10], "taxila-gpt6-luna": [0.1, 0.5], "taxila-fast": [0.2, 1.2], "grok-4-20-non-reasoning": [1.25, 2.5], "taxila-ds41": [0.375, 1.5] };
const NAME = { "taxila-gpt6": "gpt-6-sol", "taxila-gpt61-sol": "gpt-6.1-sol", "taxila-gpt6-luna": "gpt-6-luna", "taxila-fast": "gpt-5.6-luna (taxila-fast)", "grok-4-20-non-reasoning": "grok-4-20-non-reasoning", "taxila-ds41": "DeepSeek-V4.1-Flash (ds41)" };
const z = 1.2816; // 80%
const wilson = (k, n) => { if (!n) return [0, 0]; const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [(c - h) / d, (c + h) / d].map((x) => Math.round(x * 100)); };
const pct = (a, q) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.floor(q * s.length))]); };
const sets = { all: SCENARIOS, orig: SCENARIOS.filter((s) => s.set === "orig"), new: SCENARIOS.filter((s) => s.set === "new") };

function score(runsBy, subset, { labels = "new" } = {}) {
  let ok = 0, n = 0, err = 0, brk = 0, stable = 0, okOrig = 0; const lat = [], usd = [], breaks = {}, misses = [];
  for (const sc of subset) {
    const runs = runsBy[sc.id] || []; const keys = [];
    for (const x of runs) {
      if (x.err) { err++; n++; misses.push(`${sc.id}: ERR ${x.err}`); continue; }
      n++; keys.push(`${x.move}/${x.kind}`);
      if (!x.nocall && x.ms != null) lat.push(x.ms);
      usd.push(x.usd ?? 0);
      const good = isOk(sc, x); ok += good; if (!good) misses.push(`${sc.id}: ${x.move}/${x.kind}`);
      if (ORIGINAL_LABELS[sc.id]) okOrig += isOk(sc, x, ORIGINAL_LABELS[sc.id]);
      const b = hardBreaks(sc.st, x); if (b.length) { brk++; for (const k of b) (breaks[k] ??= []).push(sc.id); }
    }
    if (keys.length === runs.length && runs.length && new Set(keys).size === 1) stable++;
  }
  const meanUsd = usd.length ? usd.reduce((a, b) => a + b, 0) / usd.length : 0;
  return { ok, n, okCI80: wilson(ok, n), err, hardBreakRuns: brk, brkCI80: wilson(brk, n), breaks, stable: `${stable}/${subset.length}`,
    okOrigLabels: subset.some((s) => ORIGINAL_LABELS[s.id]) ? okOrig : undefined, p50: pct(lat, 0.5), p90: pct(lat, 0.9), max: lat.length ? Math.max(...lat) : null,
    usdPer1k: +(meanUsd * 1000).toFixed(3), misses };
}

const out = { date: "2026-10-04", reps: R.reps, method: "evals/model-refresh-2026-10-04/orchestration/run.mjs; labels frozen in scenarios.mjs (sha256 in results/labels-frozen.sha256) before any arm ran", arms: {} };
const codeRuns = Object.fromEntries(Object.entries(R.code).map(([k, v]) => [k, [{ move: v.move, kind: v.kind, ms: v.us / 1000, usd: 0 }]]));
for (const [set, sub] of Object.entries(sets)) {
  out.arms[`code kernel`] ??= {}; out.arms["code kernel"][set] = score(codeRuns, sub);
  for (const m of R.models) {
    (out.arms[`full: ${NAME[m]}`] ??= {})[set] = score(R.full[m], sub);
    (out.arms[`hybrid: ${NAME[m]}`] ??= {})[set] = score(R.hybrid[m], sub);
  }
}
// original labels vs the hard-rule predicate (does any original label permit a break?)
out.originalLabelBreaks = [];
for (const sc of sets.orig) for (const [move, kind] of ORIGINAL_LABELS[sc.id]) { const b = hardBreaks(sc.st, { move, kind }); if (b.length) out.originalLabelBreaks.push(`${sc.id} ${move}/${kind}: ${b.join(",")}`); }
// hybrid: how often did the model call happen (vs code-forced single action)?
out.hybridForcedScenarios = SCENARIOS.filter((s) => (R.hybrid[R.models[0]][s.id] || [])[0]?.nocall).map((s) => s.id);
// hybrid-only agreement: did the hybrid model pick the code kernel's action?
out.hybridAgreesWithCode = {};
for (const m of R.models) { let a = 0, n = 0; for (const sc of SCENARIOS) for (const x of R.hybrid[m][sc.id]) { if (x.err) continue; n++; a += x.move === R.code[sc.id].move && x.kind === R.code[sc.id].kind; } out.hybridAgreesWithCode[NAME[m]] = `${a}/${n}`; }
writeFileSync(new URL("./results/summary.json", import.meta.url), JSON.stringify(out, null, 1));

const row = (arm, s) => `| ${arm} | ${s.ok}/${s.n} [${s.okCI80.join("-")}%] | ${s.okOrigLabels ?? "-"} | ${s.hardBreakRuns}/${s.n} [${s.brkCI80.join("-")}%] | ${s.err} | ${s.stable} | ${s.p50 ?? "-"} | ${s.p90 ?? "-"} | ${s.usdPer1k} |`;
let md = `# Orchestration probe tables (2026-10-04, n = ${R.reps} reps per scenario per arm; code arm deterministic, 1 run)\n\n`;
for (const [set, title] of [["all", "All 24 scenarios"], ["orig", "Original 12 (re-labelled)"], ["new", "12 new conflict scenarios"]]) {
  md += `## ${title}\n\n| arm | acceptable [80% Wilson] | acceptable vs ORIGINAL labels | runs with a hard-rule break [80%] | errors | same answer x3 | p50 ms | p90 ms | $ per 1k decisions |\n|---|---|---|---|---|---|---|---|---|\n`;
  for (const [arm, s] of Object.entries(out.arms)) md += row(arm, s[set]) + "\n";
  md += "\n";
}
md += `## Hard-rule breaks by rule (all 24)\n\n`;
for (const [arm, s] of Object.entries(out.arms)) if (s.all.hardBreakRuns) md += `- **${arm}**: ${Object.entries(s.all.breaks).map(([k, v]) => `${k} x${v.length} (${[...new Set(v)].join(", ")})`).join("; ")}\n`;
md += `\n## Misses (all 24)\n\n`;
for (const [arm, s] of Object.entries(out.arms)) md += `- **${arm}**: ${s.all.misses.join("; ") || "none"}\n`;
md += `\nOriginal labels that permit a hard-rule break: ${out.originalLabelBreaks.join("; ") || "none"}\n\nHybrid: code-forced (no model call) scenarios: ${out.hybridForcedScenarios.join(", ")}\n\nHybrid agreement with the code kernel's action: ${JSON.stringify(out.hybridAgreesWithCode)}\n`;
writeFileSync(new URL("./results/tables.md", import.meta.url), md);
console.log(md);
