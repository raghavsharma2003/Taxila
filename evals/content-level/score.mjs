// Scores the bank sample: per-class mismatch rates for both raters, Cohen's kappa, and the served sample by queue position.
// Run: node evals/content-level/score.mjs
import { readFileSync } from "node:fs";
const R = (f) => JSON.parse(readFileSync(new URL("./out/" + f, import.meta.url), "utf8"));
const S = R("samples.json"), J = R("judge-gpt5.json"), C = R("rater-claude.json");
const cl = (i) => C.too_easy.includes(i) ? "too_easy" : C.too_hard.includes(i) ? "too_hard" : "right";
const out = { bank: {}, served: {} };
const kappa = (pairs) => {
  const cats = ["too_easy", "right", "too_hard"]; const n = pairs.length;
  const po = pairs.filter(([a, b]) => a === b).length / n;
  const pe = cats.reduce((s, c) => s + (pairs.filter(([a]) => a === c).length / n) * (pairs.filter(([, b]) => b === c).length / n), 0);
  return (po - pe) / (1 - pe);
};
const allPairs = [];
for (const c of [4, 5, 6, 7]) {
  const rows = S.bank.map((r, i) => ({ r, i })).filter(({ r }) => r.class === c);
  const pairs = rows.map(({ r, i }) => [cl(i), J[r.id]?.verdict ?? "missing"]);
  allPairs.push(...pairs);
  const cnt = (k, v) => pairs.filter((p) => p[k] === v).length;
  const either = pairs.filter(([a, b]) => a !== "right" || b !== "right").length;
  const both = pairs.filter(([a, b]) => a === "too_easy" && b === "too_easy").length;
  const bySub = {};
  for (const [j, { r }] of rows.entries()) { bySub[r.subject] ??= [0, 0, 0]; bySub[r.subject][0]++; if (pairs[j][0] === "too_easy") bySub[r.subject][1]++; if (pairs[j][1] === "too_easy") bySub[r.subject][2]++; }
  const d1 = rows.filter(({ r }) => r.kitDifficulty <= 1); const d1e = d1.filter(({ r, i }) => cl(i) === "too_easy" || J[r.id]?.verdict === "too_easy").length;
  const meanGrade = rows.reduce((s, { r }) => s + (J[r.id]?.grade ?? 0), 0) / rows.length;
  out.bank[c] = { n: pairs.length, claude: { too_easy: cnt(0, "too_easy"), too_hard: cnt(0, "too_hard") }, gpt5: { too_easy: cnt(1, "too_easy"), too_hard: cnt(1, "too_hard") },
    eitherMismatch: either, bothTooEasy: both, agree: pairs.filter(([a, b]) => a === b).length, kappa: +kappa(pairs).toFixed(2),
    gpt5MeanGrade: +meanGrade.toFixed(2), gpt5GradeLeCm2: rows.filter(({ r }) => (J[r.id]?.grade ?? 99) <= c - 2).length,
    gpt5GradeLeCm1: rows.filter(({ r }) => (J[r.id]?.grade ?? 99) <= c - 1).length, gpt5GradeGeCp2: rows.filter(({ r }) => (J[r.id]?.grade ?? 0) >= c + 2).length, bySubject_n_claudeEasy_gpt5Easy: bySub, kitDiff1: `${d1e}/${d1.length} judged too_easy by either` };
}
out.bank.all = { n: allPairs.length, agree: allPairs.filter(([a, b]) => a === b).length, kappa: +kappa(allPairs).toFixed(2) };
for (const c of [4, 5, 6, 7]) {
  const rows = S.served.filter((r) => r.class === c && J[r.id]);
  const by = {};
  for (const p of [1, 2, 3]) { const x = rows.filter((r) => r.queuePos === p); by["pos" + p] = { n: x.length, too_easy: x.filter((r) => J[r.id].verdict === "too_easy").length, too_hard: x.filter((r) => J[r.id].verdict === "too_hard").length, gradeLeCm2: x.filter((r) => J[r.id].grade <= c - 2).length, meanGrade: +(x.reduce((s, r) => s + J[r.id].grade, 0) / (x.length || 1)).toFixed(2) }; }
  const subj = {};
  for (const r of rows.filter((r) => r.queuePos === 1)) { subj[r.subject] ??= [0, 0]; subj[r.subject][0]++; if (J[r.id].verdict === "too_easy") subj[r.subject][1]++; }
  const allPos = rows; out.served["_" + c] = { n: allPos.length, tooEasy: allPos.filter((r) => J[r.id].verdict === "too_easy").length, gradeLeCm2: allPos.filter((r) => J[r.id].grade <= c - 2).length,
    mathsPos1: (() => { const m = rows.filter((r) => r.queuePos === 1 && r.subject === "maths"); return { n: m.length, tooEasy: m.filter((r) => J[r.id].verdict === "too_easy").length, gradeLeCm2: m.filter((r) => J[r.id].grade <= c - 2).length }; })(),
    byKitDiff: Object.fromEntries([1, 2, 3, 4].map((d) => { const x = S.bank.filter((r) => r.class === c && r.kitDifficulty === d && J[r.id]); return [d, `${x.filter((r) => J[r.id].verdict === "too_easy").length}/${x.length}`]; })) };
  const first = rows.filter((r) => r.queuePos === 1 && r.topicOrder === 0 && r.subject === "maths")[0];
  out.served[c] = { ...by, pos1BySubject_n_tooEasy: subj, firstEverQuestion: first ? { id: first.id, q: first.prompt, judge: J[first.id] } : null };
}
console.log(JSON.stringify(out, null, 1));
