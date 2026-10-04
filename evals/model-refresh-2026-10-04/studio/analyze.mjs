// Summarise studio/out/results.json: strict pass rates with Wilson 80% intervals, time-to-playable p50/p90
// (nearest rank; with n<=5 p90 is the max), cost per passed build, seed-aligned races, P(pass by deadline).
// Usage: node analyze.mjs [outDir] > summary.md ; also writes summary.json
import fs from "node:fs";
import path from "node:path";
const DIR = path.join(path.dirname(new URL(import.meta.url).pathname), process.argv[2] || "out");
const R = JSON.parse(fs.readFileSync(path.join(DIR, "results.json"), "utf8"));
const dropped = fs.existsSync(path.join(DIR, "dropped.json")) ? JSON.parse(fs.readFileSync(path.join(DIR, "dropped.json"), "utf8")) : {};
const Z = 1.2816; // two-sided 80%
export function wilson(k, n) {
  if (!n) return [0, 0];
  const p = k / n, d = 1 + Z * Z / n, c = (p + Z * Z / (2 * n)) / d, h = (Z * Math.sqrt(p * (1 - p) / n + Z * Z / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}
const wi = (k, n) => { const [a, b] = wilson(k, n); return `${k}/${n} [${a.toFixed(2)}-${b.toFixed(2)}]`; };
const q = (a, p) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)] : null; };
const s = (ms) => (ms == null ? "-" : (ms / 1000).toFixed(1));
const KORDER = ["fraction_game", "photosynthesis_anim", "bar_chart_viz"];
const kinds = KORDER.filter((k) => R.some((r) => r.kind === k));
const arms = [...new Set(R.map((r) => r.arm))];
const out = { cells: [], races: [], perArm: [], failCount: {} };
const L = [];
L.push("| kind | arm | n | pass 1st | pass ≤2 repairs [Wilson 80%] | old gate (no anchor) final | TTFT p50 s | first-any-token p50 s | gen r0 p50 s | gate p50 s | time-to-playable p50 / p90 s | P(≤75 s) | $/build | $/passed build |",
  "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const k of kinds) for (const a of arms) {
  const rs = R.filter((r) => r.kind === k && r.arm === a); if (!rs.length) continue;
  const r0 = rs.map((r) => r.rounds[0]).filter(Boolean);
  const pf = rs.filter((r) => r.passFirst).length, pp = rs.filter((r) => r.passFinal).length;
  // old-gate final: the first round whose gate passed WITHOUT the anchor check
  const oldFinal = rs.filter((r) => r.rounds.some((x) => x.qa?.passNoAnchor)).length;
  const ttp = rs.filter((r) => r.passFinal).map((r) => r.timeToPlayableMs);
  const by75 = rs.filter((r) => r.passFinal && r.timeToPlayableMs <= 75_000).length;
  const cost = rs.reduce((x, r) => x + r.usd, 0);
  const allQa = rs.flatMap((r) => r.rounds.map((x) => x.qa?.ms));
  const cell = { kind: k, arm: a, dep: rs[0].dep, n: rs.length, passFirst: pf, passFinal: pp, wilson80: wilson(pp, rs.length), oldGateFinal: oldFinal,
    ttftP50: q(r0.map((x) => x.ttftMs), 0.5), firstAnyP50: q(r0.map((x) => x.firstAnyMs), 0.5), genP50: q(r0.map((x) => x.genMs), 0.5), gateP50: q(allQa, 0.5),
    ttpP50: q(ttp, 0.5), ttpP90: q(ttp, 0.9), by75, usdPerBuild: cost / rs.length, usdPerPassed: pp ? cost / pp : null, usd: cost,
    errors: rs.flatMap((r) => r.rounds.filter((x) => x.error).map((x) => String(x.error).slice(0, 40))) };
  out.cells.push(cell);
  L.push(`| ${k} | ${a} | ${rs.length} | ${pf}/${rs.length} | ${wi(pp, rs.length)} | ${k === "photosynthesis_anim" ? oldFinal + "/" + rs.length : "="} | ${s(cell.ttftP50)} | ${s(cell.firstAnyP50)} | ${s(cell.genP50)} | ${s(cell.gateP50)} | ${s(cell.ttpP50)} / ${s(cell.ttpP90)} | ${by75}/${rs.length} | ${cell.usdPerBuild.toFixed(4)} | ${pp ? cell.usdPerPassed.toFixed(4) : "-"} |`);
  for (const r of rs) for (const x of r.rounds) for (const f of x.qa?.failed || []) { const key = `${k}:${f.id}`; out.failCount[key] = (out.failCount[key] || 0) + 1; }
  for (const r of rs) for (const x of r.rounds) if (x.error) { const key = `${k}:ERROR:${String(x.error).slice(0, 24)}`; out.failCount[key] = (out.failCount[key] || 0) + 1; }
}
// per arm across the three kinds
L.push("", "Per arm, all three kinds pooled:", "| arm | n | pass 1st | pass ≤2 repairs [Wilson 80%] | ttp p50 s | $/passed build | dropped |", "|---|---|---|---|---|---|---|");
for (const a of arms) {
  const rs = R.filter((r) => r.arm === a); const pp = rs.filter((r) => r.passFinal).length; const cost = rs.reduce((x, r) => x + r.usd, 0);
  const row = { arm: a, n: rs.length, passFirst: rs.filter((r) => r.passFirst).length, passFinal: pp, wilson80: wilson(pp, rs.length), ttpP50: q(rs.filter((r) => r.passFinal).map((r) => r.timeToPlayableMs), 0.5), usdPerPassed: pp ? cost / pp : null, dropped: dropped[a] || null };
  out.perArm.push(row);
  L.push(`| ${a} | ${rs.length} | ${row.passFirst}/${rs.length} | ${wi(pp, rs.length)} | ${s(row.ttpP50)} | ${pp ? row.usdPerPassed.toFixed(4) : "-"} | ${dropped[a] ? dropped[a].reason : ""} |`);
}
// races
L.push("", "Race of two (seed-aligned pairs; pass if either passes; time = faster passer; P(≤75 s) / P(≤90 s) = a passed build by that deadline):",
  "| kind | pair | pass [Wilson 80%] | P(≤75 s) | P(≤90 s) | ttp p50 / p90 s | $/race (both arms) |", "|---|---|---|---|---|---|---|");
const races = {};
for (const k of kinds) {
  const pairs = [];
  for (let i = 0; i < arms.length; i++) for (let j = i + 1; j < arms.length; j++) {
    const A = R.filter((r) => r.kind === k && r.arm === arms[i]), B = R.filter((r) => r.kind === k && r.arm === arms[j]);
    let n = 0, pass = 0, b75 = 0, b90 = 0, cost = 0; const t = [];
    for (const a of A) { const b = B.find((r) => r.s === a.s); if (!b) continue; n++; cost += a.usd + b.usd;
      const ts = [a, b].filter((r) => r.passFinal).map((r) => r.timeToPlayableMs); if (ts.length) { pass++; const m = Math.min(...ts); t.push(m); if (m <= 75_000) b75++; if (m <= 90_000) b90++; } }
    if (n) pairs.push({ kind: k, pair: `${arms[i]} + ${arms[j]}`, a: arms[i], b: arms[j], n, pass, b75, b90, wilson80: wilson(pass, n), t50: q(t, 0.5), t90: q(t, 0.9), usdPerRace: cost / n });
  }
  pairs.sort((x, y) => y.b75 / y.n - x.b75 / x.n || y.pass / y.n - x.pass / x.n || (x.t50 ?? 1e9) - (y.t50 ?? 1e9));
  races[k] = pairs; out.races.push(...pairs);
  const want = new Set(pairs.slice(0, 6).map((p) => p.pair)); want.add("terra-low + sol-low");
  for (const p of pairs.filter((p) => want.has(p.pair))) L.push(`| ${k} | ${p.pair} | ${wi(p.pass, p.n)} | ${p.b75}/${p.n} | ${p.b90}/${p.n} | ${s(p.t50)} / ${s(p.t90)} | ${p.usdPerRace.toFixed(3)} |`);
}
// pooled race over the three kinds for each pair
L.push("", "Race pooled over the three kinds (n = 15 per pair when complete), top 10 by P(≤75 s):", "| pair | pass [Wilson 80%] | P(≤75 s) [Wilson 80%] | P(≤90 s) | ttp p50 / p90 s | $/race |", "|---|---|---|---|---|---|");
const pooled = {};
for (const p of out.races) { const x = (pooled[p.pair] ||= { pair: p.pair, n: 0, pass: 0, b75: 0, b90: 0, cost: 0, t: [] }); x.n += p.n; x.pass += p.pass; x.b75 += p.b75; x.b90 += p.b90; x.cost += p.usdPerRace * p.n; }
for (const k of kinds) for (const a of arms) for (const b of arms) { /* times for pooled p50 */ }
for (const p of Object.values(pooled)) {
  const [a, b] = p.pair.split(" + ");
  for (const k of kinds) for (const ra of R.filter((r) => r.kind === k && r.arm === a)) { const rb = R.find((r) => r.kind === k && r.arm === b && r.s === ra.s); if (!rb) continue; const ts = [ra, rb].filter((r) => r.passFinal).map((r) => r.timeToPlayableMs); if (ts.length) p.t.push(Math.min(...ts)); }
}
const pl = Object.values(pooled).sort((x, y) => y.b75 / y.n - x.b75 / x.n || y.pass / y.n - x.pass / x.n || q(x.t, 0.5) - q(y.t, 0.5));
out.pooledRaces = pl.map((p) => ({ pair: p.pair, n: p.n, pass: p.pass, b75: p.b75, b90: p.b90, wilsonPass: wilson(p.pass, p.n), wilson75: wilson(p.b75, p.n), t50: q(p.t, 0.5), t90: q(p.t, 0.9), usdPerRace: p.cost / p.n }));
const show = new Set(pl.slice(0, 10).map((p) => p.pair)); show.add("terra-low + sol-low");
for (const p of pl.filter((p) => show.has(p.pair))) L.push(`| ${p.pair} | ${wi(p.pass, p.n)} | ${wi(p.b75, p.n)} | ${p.b90}/${p.n} | ${s(q(p.t, 0.5))} / ${s(q(p.t, 0.9))} | ${(p.cost / p.n).toFixed(3)} |`);
// anchoring effect
const ph = R.filter((r) => r.kind === "photosynthesis_anim");
const anchorRounds = ph.flatMap((r) => r.rounds.filter((x) => x.qa)).filter((x) => x.qa.passNoAnchor && !x.qa.pass).length;
const oldPassRounds = ph.flatMap((r) => r.rounds.filter((x) => x.qa?.passNoAnchor)).length;
L.push("", `Label anchoring (hard, photosynthesis): ${anchorRounds}/${oldPassRounds} gate rounds that passed every OLD check failed only on anchoring.`);
out.anchor = { failedOnlyOnAnchor: anchorRounds, oldGatePassRounds: oldPassRounds };
L.push("", "Failing checks (count over all rounds):", ...Object.entries(out.failCount).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, v]) => `- ${k}: ${v}`));
const all = R.length, pf = R.filter((r) => r.passFirst).length, pp = R.filter((r) => r.passFinal).length;
const rep = R.filter((r) => !r.passFirst && r.rounds[0]?.qa);
out.totals = { n: all, passFirst: pf, passFinal: pp, repairRecovered: rep.filter((r) => r.passFinal).length, repairEligible: rep.length, usd: R.reduce((x, r) => x + r.usd, 0), dropped };
L.push("", `Overall: n=${all}, pass first ${pf}, pass after ≤2 repairs ${pp}; repair recovered ${out.totals.repairRecovered}/${rep.length} first-try gate failures; total model spend $${out.totals.usd.toFixed(2)} (list price × reported usage).`);
L.push(`Dropped arms: ${Object.keys(dropped).length ? JSON.stringify(dropped) : "none"}`);
fs.writeFileSync(path.join(DIR, "summary.json"), JSON.stringify(out, null, 1));
console.log(L.join("\n"));
