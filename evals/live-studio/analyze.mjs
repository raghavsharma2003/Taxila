// Summarise evals/live-studio/out-*/results.json into the LIVE-STUDIO §14 tables (strict pass rates, never means).
import fs from "node:fs";
import path from "node:path";
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), process.argv[2] || "out-2026-10-04");
const R = JSON.parse(fs.readFileSync(path.join(OUT, "results.json"), "utf8"));
const q = (a, p) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const s = (ms) => (ms == null ? "-" : (ms / 1000).toFixed(1));
const kinds = [...new Set(R.map((r) => r.kind))], arms = [...new Set(R.map((r) => r.arm))];
const lines = ["| kind | arm | n | pass 1st | pass ≤2 repairs | TTFT p50 s | stream paint p50 s (hit/n) | gen p50 s | gate p50 s | time-to-playable p50 / max s (passed) | $/build mean | $/passed build |", "|---|---|---|---|---|---|---|---|---|---|---|---|"];
const failCount = {};
for (const k of kinds) for (const a of arms) {
  const rs = R.filter((r) => r.kind === k && r.arm === a); if (!rs.length) continue;
  const r0 = rs.map((r) => r.rounds[0]).filter(Boolean);
  const pf = rs.filter((r) => r.passFirst).length, pp = rs.filter((r) => r.passFinal).length;
  const paints = r0.map((x) => x.streamPaintMs);
  const ttp = rs.filter((r) => r.passFinal).map((r) => r.timeToPlayableMs);
  const cost = rs.reduce((x, r) => x + r.usd, 0);
  lines.push(`| ${k} | ${a} | ${rs.length} | ${pf}/${rs.length} | ${pp}/${rs.length} | ${s(q(r0.map((x) => x.ttftMs), 0.5))} | ${s(q(paints, 0.5))} (${paints.filter((x) => x != null).length}/${r0.length}) | ${s(q(r0.map((x) => x.genMs), 0.5))} | ${s(q(r0.map((x) => x.qa?.ms), 0.5))} | ${s(q(ttp, 0.5))} / ${s(ttp.length ? Math.max(...ttp) : null)} | ${(cost / rs.length).toFixed(4)} | ${pp ? (cost / pp).toFixed(4) : "-"} |`);
  for (const r of rs) for (const x of r.rounds) for (const f of x.qa?.failed || []) { const key = `${k}:${f.id}`; failCount[key] = (failCount[key] || 0) + 1; }
  for (const r of rs) for (const x of r.rounds) if (x.error) { const key = `${k}:ERROR:${String(x.error).slice(0, 20)}`; failCount[key] = (failCount[key] || 0) + 1; }
}
// race of two: for each kind and arm pair, P(at least one passFinal) using seed-aligned pairs, and time = min ttp
lines.push("", "Race of two (seed-aligned pairs s = 0..n-1; pass if either arm passes; time = the faster passer):", "| kind | pair | pass | ttp p50 s |", "|---|---|---|---|");
for (const k of kinds) {
  const pairs = [];
  for (let i = 0; i < arms.length; i++) for (let j = i + 1; j < arms.length; j++) {
    const A = R.filter((r) => r.kind === k && r.arm === arms[i]), B = R.filter((r) => r.kind === k && r.arm === arms[j]);
    const n = Math.min(A.length, B.length); if (!n) continue; let pass = 0; const t = [];
    for (let s0 = 0; s0 < n; s0++) { const a = A.find((r) => r.s === s0), b = B.find((r) => r.s === s0); if (!a || !b) continue;
      const ts = [a, b].filter((r) => r.passFinal).map((r) => r.timeToPlayableMs); if (ts.length) { pass++; t.push(Math.min(...ts)); } }
    pairs.push({ p: `${arms[i]} + ${arms[j]}`, pass, n, t50: q(t, 0.5) });
  }
  pairs.sort((x, y) => y.pass / y.n - x.pass / x.n || (x.t50 ?? 1e9) - (y.t50 ?? 1e9));
  for (const p of pairs.slice(0, 4)) lines.push(`| ${k} | ${p.p} | ${p.pass}/${p.n} | ${s(p.t50)} |`);
}
lines.push("", "Failing checks (count over all rounds):", ...Object.entries(failCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`));
const all = R.length, pf = R.filter((r) => r.passFirst).length, pp = R.filter((r) => r.passFinal).length;
lines.push("", `Overall: n=${all}, pass first ${pf}, pass after ≤2 repairs ${pp}; total spend $${R.reduce((x, r) => x + r.usd, 0).toFixed(2)}`);
const rep = R.filter((r) => !r.passFirst && r.rounds[0]?.qa); lines.push(`Repair recovered ${rep.filter((r) => r.passFinal).length}/${rep.length} first-try gate failures (excludes stream errors).`);
console.log(lines.join("\n"));
