// Mechanical coverage check for docs/design/reset/RESET-PLAN.md against the defect catalogue and the owner reset.
//
//   node evals/reset-plan/coverage.mjs        → prints the counts, exits 1 on any gap
//
// Checks (2026-10-04, RESET-PLAN §11):
//   1. every owner requirement R1..R16 in OWNER-RESET has a row in RESET-PLAN §6 with a lead stream (RS-n);
//   2. every top-40 id in DEFECTS.md appears in RESET-PLAN §7 exactly once, with one stream, and the per-stream counts
//      printed under the table match the rows;
//   3. every defect id in DEFECTS.md (excluding the "pass" rows) appears in RESET-PLAN §8 exactly once, under one stream,
//      with no id that the catalogue does not contain; the pass rows are listed under "Keep".
// It checks the PLAN's bookkeeping, never the product.
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = new URL("../..", import.meta.url).pathname;
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const defects = read("docs/design/reset/audit/DEFECTS.md");
const plan = read("docs/design/reset/RESET-PLAN.md");
const reset = read("docs/design/OWNER-RESET-2026-10-04.md");
const problems = [];
const section = (text, start, end) => {
  const a = text.indexOf(start);
  const b = end ? text.indexOf(end, a + 1) : text.length;
  if (a < 0) throw new Error(`section not found: ${start}`);
  return text.slice(a, b < 0 ? text.length : b);
};

// --- catalogue ---
const top = section(defects, "## TOP 40", "\n---");
const topIds = [...top.matchAll(/^\| (\d+) \| ([A-Z]+-\d+) \|/gm)].map((m) => m[2]);
const body = defects.slice(defects.indexOf("## P — Public site"));
const rows = [...body.matchAll(/^\| ([A-Z]+-\d+) \|[^|]*\|[^|]*\|([^|]*)\|/gm)];
const passIds = rows.filter((m) => /\(pass\)/.test(m[2])).map((m) => m[1]);
const allIds = rows.map((m) => m[1]).filter((id) => !passIds.includes(id));

// --- 1. requirements ---
const reqNums = [...reset.matchAll(/^(\d+)\. \*\*/gm)].map((m) => Number(m[1]));
const reqTable = section(plan, "## 6. Owner requirements", "## 7.");
const reqRows = new Map([...reqTable.matchAll(/^\| R(\d+) \|[^|]*\| (RS-\d) \|/gm)].map((m) => [Number(m[1]), m[2]]));
for (const n of reqNums) if (!reqRows.has(n)) problems.push(`owner requirement R${n} has no lead stream in §6`);

// --- 2. top 40 ---
const t7 = section(plan, "## 7. Top-40", "## 8.");
const t7rows = [...t7.matchAll(/^\| (\d+) \| ([A-Z]+-\d+) \| (RS-\d)/gm)];
const t7ids = t7rows.map((m) => m[2]);
for (const id of topIds) {
  const c = t7ids.filter((x) => x === id).length;
  if (c !== 1) problems.push(`top-40 ${id} appears ${c}× in §7`);
}
for (const id of t7ids) if (!topIds.includes(id)) problems.push(`§7 lists ${id}, which is not in the catalogue's top 40`);
const perStream = {};
for (const m of t7rows) perStream[m[3]] = (perStream[m[3]] || 0) + 1;
const countLine = t7.match(/Count per stream: (.*)\*\*(\d+)\*\*/);
if (countLine) {
  for (const m of countLine[1].matchAll(/(RS-\d) (\d+)/g)) {
    if ((perStream[m[1]] || 0) !== Number(m[2])) problems.push(`§7 count line says ${m[1]} ${m[2]}, rows say ${perStream[m[1]] || 0}`);
  }
} else problems.push("§7 count line missing");

// --- 3. all defects ---
const s8 = section(plan, "## 8. All 187", "## 9.");
const seen = new Map();
for (const m of s8.matchAll(/^- \*\*(RS-\d|Keep[^*]*):\*\*([\s\S]*?)(?=^- \*\*|\nNotes on split|$(?![\s\S]))/gm)) {
  const who = m[1].startsWith("Keep") ? "keep" : m[1];
  for (const id of m[2].match(/\b[A-Z]{1,2}-\d+\b/g) || []) {
    if (who === "keep" && !passIds.includes(id)) continue; // ids mentioned in the Keep prose (e.g. RS-0) are not entries
    if (!seen.has(id)) seen.set(id, []);
    seen.get(id).push(who);
  }
}
for (const id of allIds) {
  const w = seen.get(id) || [];
  if (w.length !== 1) problems.push(`defect ${id} mapped ${w.length}× in §8 (${w.join(", ")})`);
}
for (const id of passIds) if (!(seen.get(id) || []).includes("keep")) problems.push(`pass row ${id} not under Keep`);
for (const id of seen.keys()) if (!allIds.includes(id) && !passIds.includes(id)) problems.push(`§8 maps ${id}, which the catalogue does not contain`);

const byStream = {};
for (const [id, w] of seen) if (w[0] !== "keep") byStream[w[0]] = (byStream[w[0]] || 0) + 1;
console.log(`requirements: ${[...reqRows.keys()].length}/${reqNums.length} with a lead stream`);
console.log(`top-40: ${new Set(t7ids.filter((x) => topIds.includes(x))).size}/${topIds.length} mapped; per stream ${JSON.stringify(perStream)}`);
console.log(`defects: ${allIds.filter((id) => (seen.get(id) || []).length === 1).length}/${allIds.length} mapped once; pass rows kept ${passIds.filter((id) => (seen.get(id) || []).includes("keep")).length}/${passIds.length}`);
console.log(`defects per stream: ${JSON.stringify(byStream)}`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log("coverage ok");
