// duplex-real E3: score the duplex engine's SHADOW summaries from prod (or a local server) against the switch criteria.
//
// Input: the server's stdout lines (kind "duplex_shadow", written by server/duplex/shadowLog.js), from any of
//   az containerapp logs show -n taxila-web -g <rg> --tail 10000 --format text > shadow.log
//   a Log Analytics export (ContainerAppConsoleLogs_CL | where Log_s has "duplex_shadow"), one Log_s per line
//   a local server's stdout
// Lines that are not duplex_shadow JSON are skipped. Content-blind: the lines carry numbers and closed codes only.
//
//   node evals/duplex-real/shadow-report.mjs <log file> [--mode shadow|on] [--json out.json]
import fs from "node:fs";
import { q, rate } from "./lib.mjs";

/** Parse every duplex_shadow line in a text (tolerates prefixes such as timestamps or Log Analytics wrappers). */
export function parseShadowLines(text) {
  const out = [];
  for (const line of String(text).split("\n")) {
    const i = line.indexOf('{"kind":"duplex_shadow"');
    if (i < 0) continue;
    try { out.push(JSON.parse(line.slice(i))); } catch { /* a cut line */ }
  }
  return out;
}

/** Aggregate summaries into the CRITERIA.md §3 shadow numbers. */
export function shadowReport(lines, { mode = "shadow" } = {}) {
  const L = lines.filter((l) => l.mode === mode);
  const turns = L.flatMap((l) => l.turns ?? []);
  const ov = L.flatMap((l) => l.overlaps ?? []);
  const decided = turns.filter((t) => t.eg !== null);
  const eg = decided.map((t) => t.eg), sg = turns.map((t) => t.sg).filter((x) => x !== null);
  const both = turns.filter((t) => t.eg !== null && t.sg !== null);
  const engineYield = ov.filter((o) => o.ey !== null), shippedStop = ov.filter((o) => o.ss !== null);
  return {
    lessons: L.length,
    distinctLessons: new Set(L.map((l) => l.lesson).filter(Boolean)).size,
    minutes: Math.round(L.reduce((a, l) => a + (l.durMs ?? 0), 0) / 60000),
    turns: turns.length,
    engine_cutoff: rate(turns.filter((t) => t.ec === 1).length, turns.length),
    engine_cutoff_pauseMs: { p50: q(turns.filter((t) => t.ep !== null).map((t) => t.ep), 0.5) },
    shipped_cutoff: rate(turns.filter((t) => t.sc === 1).length, turns.length),
    engine_gap: { n: eg.length, p50: q(eg, 0.5), p90: q(eg, 0.9) },
    shipped_gap: { n: sg.length, p50: q(sg, 0.5), p90: q(sg, 0.9) },
    engine_faster: rate(both.filter((t) => t.eg < t.sg).length, both.length),
    engine_undecided: rate(turns.filter((t) => t.eg === null).length, turns.length),
    reasons: Object.entries(decided.reduce((a, t) => { a[t.r ?? "null"] = (a[t.r ?? "null"] ?? 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]),
    overlaps: ov.length,
    yield_disagree: rate(ov.filter((o) => (o.ey === null) !== (o.ss === null)).length, ov.length),
    engine_yield_ms: { n: engineYield.length, p50: q(engineYield.map((o) => o.ey), 0.5) },
    shipped_stop_ms: { n: shippedStop.length, p50: q(shippedStop.map((o) => o.ss), 0.5) },
    engine_safety_rows: L.reduce((a, l) => a + (l.safetyRows ?? 0), 0),
    fallbacks: L.flatMap((l) => l.fallbacks ?? []).reduce((a, f) => { a[f] = (a[f] ?? 0) + 1; return a; }, {}),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
  const lines = parseShadowLines(fs.readFileSync(argv[0], "utf8"));
  const r = { label: "PROD SHADOW (real lessons; children unless the account is a @taxila.test adult): engine vs shipped path, content-blind", ...shadowReport(lines, { mode: opt("--mode", "shadow") }) };
  if (opt("--json", null)) fs.writeFileSync(opt("--json"), JSON.stringify(r, null, 1));
  console.log(JSON.stringify(r, null, 1));
}
