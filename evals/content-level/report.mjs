// Full-bank level report: per-kit mismatch from judge-gpt5 over every class 4-7 item, and the regenerate list.
// REGEN = judge grade <= C-2 (strict, numeric). LIFT = judge verdict too_easy but grade C-1 (shallow, keep only as a
// warm-up rung, never as the first item of a lesson). HARD = verdict too_hard. Writes out/regenerate.json.
// Run: node evals/content-level/report.mjs
import { readFileSync, writeFileSync } from "node:fs";
const R = (f) => JSON.parse(readFileSync(new URL("./out/" + f, import.meta.url), "utf8"));
const F = R("full.json"), J = R("judge-gpt5.json");
const kits = {}, regen = {}, hard = [];
let judged = 0;
for (const r of F) {
  const j = J[r.id]; if (!j) continue; judged++;
  const k = `c${r.class}-${r.subject}`;
  kits[k] ??= { n: 0, regen: 0, lift: 0, hard: 0, grade: 0, topics: {} };
  const K = kits[k]; K.n++; K.grade += j.grade;
  const t = (K.topics[r.topic] ??= { n: 0, regen: 0, id: r.id.replace(/-i\d+$/, "") }); t.n++;
  if (j.grade <= r.class - 2) { K.regen++; t.regen++; (regen[k] ??= []).push({ id: r.id, grade: j.grade, kitDifficulty: r.kitDifficulty, q: r.prompt.slice(0, 100), why: j.why }); }
  else if (j.verdict === "too_easy") K.lift++;
  if (j.verdict === "too_hard") { K.hard++; hard.push({ id: r.id, grade: j.grade, q: r.prompt.slice(0, 100), why: j.why }); }
}
const table = Object.entries(kits).sort().map(([k, v]) => {
  const worstTopics = Object.entries(v.topics).filter(([, t]) => t.n >= 6 && t.regen / t.n >= 0.5).map(([name, t]) => `${t.id} (${t.regen}/${t.n})`);
  return { kit: k, n: v.n, regenPct: +(100 * v.regen / v.n).toFixed(1), regen: v.regen, liftPct: +(100 * v.lift / v.n).toFixed(1), hard: v.hard, meanGrade: +(v.grade / v.n).toFixed(2), topicsHalfRegen: worstTopics };
});
writeFileSync(new URL("./out/regenerate.json", import.meta.url), JSON.stringify({ judged, criterion: "judge-gpt5 grade <= class-2", table, regen, hard }, null, 1));
console.log(`judged ${judged}/${F.length}`);
for (const t of table) console.log(`${t.kit.padEnd(14)} n=${String(t.n).padStart(4)} regen ${String(t.regenPct).padStart(5)}% lift ${String(t.liftPct).padStart(5)}% hard ${t.hard} meanGE ${t.meanGrade}  ${t.topicsHalfRegen.join(", ")}`);
