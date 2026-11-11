#!/usr/bin/env node
// dc-r7-script-walk-v6-11 C1 step 1: the hole and double report of server/director/compile.js over every lesson script (the live ones
// in data/lesson-scripts, the staged ones in data/lesson-scripts-staged). Writes docs/design/round7/brain/COMPILE-HOLES.md, or prints
// it with --print. A hole is a field a rule names that the script does not have; code never fills one.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { compileScript, TYPE_TABLE } from "../../server/director/compile.js";

const ROOT = new URL("../../", import.meta.url);
const dirs = [["live", "data/lesson-scripts"], ["staged", "data/lesson-scripts-staged"]];
const rows = [];
for (const [where, d] of dirs) for (const f of readdirSync(new URL(d, ROOT)).filter((x) => x.endsWith(".json")).sort()) {
  const s = JSON.parse(readFileSync(new URL(`${d}/${f}`, ROOT), "utf8"));
  rows.push({ where, s, c: compileScript(s) });
}
const fieldKey = (h) => `${h.kind} ${h.field}`;
const KEYS = [...new Set(rows.flatMap((r) => r.c.missing.map(fieldKey)))].sort();
const byRule = {};
for (const r of rows) for (const h of r.c.holes) byRule[h.rule] = (byRule[h.rule] ?? 0) + 1;
const total = (k) => rows.reduce((n, r) => n + r.c.missing.filter((h) => fieldKey(h) === k).length, 0);

const out = [];
out.push("# C1 step 1: holes and doubles per script (generated)", "",
  "**Source:** `node scripts/lesson-scripts/compile-report.mjs` over server/director/compile.js. Do not edit by hand.", "",
  `**Type table:** ${TYPE_TABLE.length} cells (9 part kinds × 12 columns × 3 help states), ${TYPE_TABLE.filter((x) => x.rule).length} of them apply (the answer columns are for cards only).`, "",
  "**Missing fields** are counted once per field of the script, however many rules name it. **Rule holes** count every (part, column, help) cell that names a missing field.", "",
  `**Scripts:** ${rows.length} (${rows.filter((r) => r.where === "live").length} live, ${rows.filter((r) => r.where === "staged").length} staged). Missing fields: ${rows.reduce((n, r) => n + r.c.missing.length, 0)}. Rule holes: ${rows.reduce((n, r) => n + r.c.holes.length, 0)}. Doubles: ${rows.reduce((n, r) => n + r.c.doubles.length, 0)}.`, "",
  `**Second clarify** (dc-r8-second-clarify-shows-not-rewords): it shows the part's board and says the same authored line once more (alts[0] when the script has one). Second clarifies with no board to show (repetition alone): ${rows.reduce((n, r) => n + r.c.secondClarifyNoBoard.length, 0)}. A third clarify is clarify/spent: on a card its key and why; on a point or check-in, the card; on a worked step, the next step; on a remediation, its then-card.`, "",
  `**Fallback cells:** every missing field's cells compile to a named fallback (today's behaviour) until Learning authors it: ${Object.entries(rows.flatMap((r) => r.c.fallbacks).reduce((m, x) => ({ ...m, [x.fallback]: (m[x.fallback] ?? 0) + 1 }), {})).map(([k, n]) => `${k} ${n}`).join(", ")}. Cells left as holes with no fallback: ${rows.reduce((n, r) => n + Object.values(r.c.cells).flatMap((cs) => Object.values(cs).flatMap((hs) => Object.values(hs))).filter((c) => c.hole).length, 0)}.`, "",
  "## Missing fields, all scripts", "", "| Part kind, field | Missing | What it is |", "|---|---|---|");
const WHAT = {
  "worked_step simpler": "the worked problem's own simpler (its steps have one), for a clarify on the problem. Fallback: resay_show",
  "bridge simpler": "a simpler of the bridge into the next skill, for a clarify on it. Fallback: next",
  "card remediation": "a remediation for the mix-up an explain card targets (the misconception column's default). Fallback: as_wrong",
  "your_step remediation": "a remediation for the mix-up the worked example's own card targets. Fallback: as_wrong",
  "your_step why": "the why of the worked example's own card. Fallback: worked_answer (right), key_only (key cells)",
};
for (const k of KEYS) out.push(`| ${k} | ${total(k)} | ${WHAT[k] ?? ""} |`);
out.push("", "## Per script", "", `| Script | Where | Parts | Cells | Missing | ${KEYS.join(" | ")} | Doubles |`, `|---|---|---|---|---|${KEYS.map(() => "---").join("|")}|---|`);
for (const r of rows) out.push(`| ${r.s.topicId} | ${r.where} | ${r.c.parts.length} | ${r.c.cellCount} | ${r.c.missing.length} | ${KEYS.map((k) => r.c.missing.filter((h) => fieldKey(h) === k).length).join(" | ")} | ${r.c.doubles.length} |`);
out.push("", "## Rule holes per rule", "", "| Rule (kind/column/help) | Cells naming a missing field |", "|---|---|");
for (const [k, n] of Object.entries(byRule).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) out.push(`| ${k} | ${n} |`);
const dbl = rows.flatMap((r) => r.c.doubles.map((d) => `${r.s.topicId}: ${d.part} (${d.why})`));
out.push("", "## Doubles", "", ...(dbl.length ? dbl.map((x) => `- ${x}`) : ["None."]), "");
const text = out.join("\n");
if (process.argv.includes("--print")) process.stdout.write(text);
else { writeFileSync(new URL("docs/design/round7/brain/COMPILE-HOLES.md", ROOT), text); console.log(`COMPILE-HOLES.md: ${rows.length} scripts`); }
