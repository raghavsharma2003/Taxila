// Run the hand goldens (evals/live-studio/goldens/) through the production gate (server/studio/qa/gate.js): each
// golden with its params AND its held-out alt params (G-transfer: a correct build works for other truth). Every one
// must pass every hard check (the "0 false alarms on goldens" half of the mutant acceptance).
// Usage: node evals/live-studio/gate-goldens.mjs [archetype ...] [--all] [--shots]
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { runGate } from "../../server/studio/qa/gate.js";

const DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "goldens");
const G = JSON.parse(fs.readFileSync(path.join(DIR, "goldens.json"), "utf8"));
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const ids = args.length ? args : Object.keys(G);
const browser = await chromium.launch();
let fails = 0;
const rows = [];
for (const id of ids) {
  const g = G[id];
  const html = fs.readFileSync(path.join(DIR, `${g.file ?? id}.html`), "utf8");
  for (const which of ["params", "alt"]) {
    if (!g[which]) continue;
    const r = await runGate(browser, { archetypeId: g.archetype ?? id, fragment: html, params: g[which], strings: g[`${which}Strings`] ?? g.strings, band: g.band,
      shot: process.argv.includes("--shots") ? path.join(DIR, `../out-goldens/${id}-${which}`) : undefined });
    rows.push({ id, which, pass: r.pass, ms: r.ms, failed: r.checks.filter((c) => !c.pass).map((c) => c.id) });
    console.log(`${r.pass ? "PASS" : "FAIL"} ${id} (${which}) ${r.ms} ms ready ${r.readyMs} perf ${JSON.stringify(r.perf)} fixes ${r.fixes.join(",") || "-"}`);
    for (const c of r.checks) if (!c.pass || process.argv.includes("--all")) console.log(`   ${c.pass ? "ok" : "XX"} ${c.id} ${JSON.stringify(c.detail).slice(0, 220)}`);
    if (!r.pass) fails++;
  }
}
await browser.close();
console.log(`\n${rows.length - fails}/${rows.length} golden gate runs passed`);
if (process.argv.includes("--json")) console.log(JSON.stringify(rows));
process.exitCode = fails ? 1 : 0;
