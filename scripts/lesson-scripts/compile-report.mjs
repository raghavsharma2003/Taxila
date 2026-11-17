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
  `**Help** (dc-r8-director25 H4): a clarify, a give-up, a request for Hindi and a wrong answer's hint compile to one cell, server/director/help.js pickHelp: the first rung of the part's ladder none of whose sentences she has said, else (a card) its key and why over its answer board; a Hindi request never a key. Each rung a script lacks is listed below as a missing field; help skips it, so the key comes one rung sooner.`, "",
  `**Fallback cells:** every missing field's cells compile to a named fallback (today's behaviour) until Learning authors it: ${Object.entries(rows.flatMap((r) => r.c.fallbacks).reduce((m, x) => ({ ...m, [x.fallback]: (m[x.fallback] ?? 0) + 1 }), {})).map(([k, n]) => `${k} ${n}`).join(", ")}. Cells left as holes with no fallback: ${rows.reduce((n, r) => n + Object.values(r.c.cells).flatMap((cs) => Object.values(cs).flatMap((hs) => Object.values(hs))).filter((c) => c.hole).length, 0)}.`, "",
  `**Not applicable:** ${rows.reduce((n, r) => n + r.c.notApplicable.length, 0)} misconception cells on cards with no \`targets\` (cards that test no kit mix-up: a wrong answer takes the \`wrong\` column). Not holes, not fallbacks.`, "",
  "## Missing fields, all scripts", "", "| Part kind, field | Missing | What it is |", "|---|---|---|");
const WHAT = {
  "worked_step simpler": "the worked problem's own simpler (its steps have one), for a clarify on the problem. Fallback: resay_show",
  "bridge simpler": "a simpler of the bridge into the next skill, for a clarify on it. Fallback: next",
  "card remediation": "a remediation for the mix-up an explain card targets (the misconception column's default). Fallback: as_wrong",
  "your_step remediation": "a remediation for the mix-up the worked example's own card targets. Fallback: as_wrong",
  "your_step why": "the why of the worked example's own card. Fallback: worked_answer (right)",
  // (dc-r8-director25 H4: a help ladder's rung the script lacks — help skips it, so the key comes one rung sooner)
  "card ask.simpler": "an explain card's own hint (Learning 014): the first rung of a card's help ladder, before its point's pointAlt and simpler",
  "point pointAlt": "a point's second wording: the first rung of a point's help ladder", "checkin pointAlt": "a point's second wording, at its check-in",
  "point simpler": "a point's plainer line: the second rung of a point's help ladder", "checkin simpler": "a point's plainer line, at its check-in",
  "check simpler": "a check card's hint: its whole help ladder", "then_card simpler": "a then-card's hint: its whole help ladder", "your_step simpler": "the worked example's own card's hint",
  "worked_step problemAlt": "the worked problem's second telling: the first rung of its help ladder", "worked_step simpler": "a worked problem's or step's plainer line",
  "remediation sayAlt": "a remediation's second wording: the first rung of its help ladder", "remediation simpler": "a remediation's plainer line",
  "card whyAlt": "the why's second wording, said after a key's check-in", "check whyAlt": "the why's second wording, said after a key's check-in",
  "then_card whyAlt": "the why's second wording, said after a key's check-in", "your_step whyAlt": "the why's second wording, said after a key's check-in",
};
for (const k of KEYS) out.push(`| ${k} | ${total(k)} | ${WHAT[k] ?? ""} |`);
out.push("", "## Per script", "", `| Script | Where | Parts | Cells | Missing | ${KEYS.join(" | ")} | Doubles |`, `|---|---|---|---|---|${KEYS.map(() => "---").join("|")}|---|`);
for (const r of rows) out.push(`| ${r.s.topicId} | ${r.where} | ${r.c.parts.length} | ${r.c.cellCount} | ${r.c.missing.length} | ${KEYS.map((k) => r.c.missing.filter((h) => fieldKey(h) === k).length).join(" | ")} | ${r.c.doubles.length} |`);
out.push("", "## Rule holes per rule", "", "| Rule (kind/column/help) | Cells naming a missing field |", "|---|---|");
for (const [k, n] of Object.entries(byRule).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) out.push(`| ${k} | ${n} |`);
// (dc-r8-director25 H4: the joints help says, Learning 014 — helpSpent, afterKeyGoOn — and the Hindi switch rewritten to promise easier words)
out.push("", "## Help's joints (dc-r8-director25 H4, Learning 014)", "", "A script without them is said with code's fallback forms (server/director/help.js FALLBACK_JOINTS).", "", "| Script | Where | Joint | Hole |", "|---|---|---|---|");
for (const r of rows) for (const j of r.c.helpJoints ?? []) out.push(`| ${r.s.topicId} | ${r.where} | ${j.joint} | ${j.why} |`);
const dbl = rows.flatMap((r) => r.c.doubles.map((d) => `${r.s.topicId}: ${d.part} (${d.why})`));
out.push("", "## Doubles", "", ...(dbl.length ? dbl.map((x) => `- ${x}`) : ["None."]), "");
const text = out.join("\n");
if (process.argv.includes("--print")) process.stdout.write(text);
else { writeFileSync(new URL("docs/design/round7/brain/COMPILE-HOLES.md", ROOT), text); console.log(`COMPILE-HOLES.md: ${rows.length} scripts`); }
