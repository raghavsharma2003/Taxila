// Scores rubric v2 against v1 and against the NCERT adjudication. Writes out/score.json and prints the tables.
//   node evals/content-level-v2/score.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { verdictV2, RUBRIC_V2_SHA } from "./rubric-v2.mjs";
import { kappa, wilson, pct } from "./lib/stats.mjs";
import { loadSet } from "./lib/sets.mjs";

const OUT = new URL("./out/", import.meta.url);
const V1 = new URL("../content-level/out/", import.meta.url);
const read = (u) => JSON.parse(readFileSync(u, "utf8"));
const ratings = (set, r) => { const f = new URL(`ratings-${set}-${r}.json`, OUT); return existsSync(f) ? read(f).r : null; };
const res = { rubric: RUBRIC_V2_SHA, date: "2026-10-04" };

// ── 1. bank240: too-easy rate per class, both raters, kappa; v1 numbers alongside ──
{
  const items = await loadSet("bank240");
  const A = ratings("bank240", "gpt6"), B = ratings("bank240", "deepseek");
  const v1 = read(new URL("judge-gpt5.json", V1));
  const claude = new Set(read(new URL("rater-claude.json", V1)).too_easy);
  const rows = [];
  for (const c of [4, 5, 6, 7, "all"]) {
    const xs = items.map((x, i) => ({ x, i })).filter(({ x }) => c === "all" || x.class === c).filter(({ x }) => A?.[x.id] && B?.[x.id]);
    const a = xs.map(({ x }) => verdictV2(x.class, A[x.id]) === "too_easy");
    const b = xs.map(({ x }) => verdictV2(x.class, B[x.id]) === "too_easy");
    const v1j = xs.map(({ x }) => v1[x.id]?.grade <= x.class - 2);
    const v1c = xs.map(({ i }) => claude.has(i));
    const k = kappa(a, b);
    rows.push({ class: c, n: xs.length, gpt6: a.filter(Boolean).length, deepseek: b.filter(Boolean).length,
      both: a.filter((v, i) => v && b[i]).length, either: a.filter((v, i) => v || b[i]).length,
      tooHardEither: xs.filter(({ x }) => verdictV2(x.class, A[x.id]) === "too_hard" || verdictV2(x.class, B[x.id]) === "too_hard").length,
      kappaV2: k.kappa, agreeV2: k.agree, v1JudgeStrict: v1j.filter(Boolean).length, v1Claude: v1c.filter(Boolean).length,
      kappaV1: kappa(v1j, v1c).kappa,
      meanGrade: { gpt6: avg(xs.map(({ x }) => A[x.id].grade)), deepseek: avg(xs.map(({ x }) => B[x.id].grade)) } });
  }
  res.bank240 = rows;
  console.log("\n## bank240 (v1 stratified sample), too easy = grade <= C-2");
  console.log("| class | n | gpt6 | deepseek | both (floor) | either (ceiling) | kappa v2 | v1 judge strict | v1 Claude | kappa v1 (judge strict vs Claude) |");
  for (const r of rows) console.log(`| ${r.class} | ${r.n} | ${r.gpt6} | ${r.deepseek} | ${r.both} | ${r.either} | ${r.kappaV2?.toFixed(2)} | ${r.v1JudgeStrict} | ${r.v1Claude} | ${r.kappaV1?.toFixed(2)} |`);
}

// ── 2. precision40: v2 flags vs the NCERT adjudication (23 true too-easy, 17 false) ──
{
  const items = await loadSet("precision40");
  const adj = read(new URL("precision-adjudication.json", V1));
  const truth = items.map((_, i) => adj.agree_too_easy.includes(i));
  const out = {};
  for (const [name, flag] of Object.entries({
    gpt6: (x) => verdictV2(x.class, ratings("precision40", "gpt6")?.[x.id]) === "too_easy",
    deepseek: (x) => verdictV2(x.class, ratings("precision40", "deepseek")?.[x.id]) === "too_easy",
    both: (x) => verdictV2(x.class, ratings("precision40", "gpt6")?.[x.id]) === "too_easy" && verdictV2(x.class, ratings("precision40", "deepseek")?.[x.id]) === "too_easy",
    either: (x) => verdictV2(x.class, ratings("precision40", "gpt6")?.[x.id]) === "too_easy" || verdictV2(x.class, ratings("precision40", "deepseek")?.[x.id]) === "too_easy",
    ...(ratings("precision40", "brain") ? { brain: (x) => verdictV2(x.class, ratings("precision40", "brain")[x.id]) === "too_easy" } : {}),
  })) {
    const f = items.map(flag);
    const tp = f.filter((v, i) => v && truth[i]).length, fp = f.filter((v, i) => v && !truth[i]).length;
    out[name] = { flagged: tp + fp, tp, fp, precision: tp + fp ? tp / (tp + fp) : null, ci: wilson(tp, tp + fp), recall: tp / truth.filter(Boolean).length };
  }
  res.precision40 = out;
  console.log("\n## precision40 (v1 flags adjudicated against 2025-26 NCERT: 23 true, 17 false; v1 precision 23/40 = 58%)");
  console.log("| rater | flagged | precision | 95% CI | recall of the 23 |");
  for (const [k, v] of Object.entries(out)) console.log(`| ${k} | ${v.flagged} | ${pct(v.tp, v.flagged)} | ${v.ci.map((x) => x.toFixed(2)).join("-")} | ${pct(v.tp, 23)} |`);
}

// ── 3. served old vs new (first two items of every class 4-7 topic queue) ──
for (const set of ["served-old", "served-new"]) {
  if (!existsSync(new URL(`${set}.json`, OUT))) continue;
  const A = ratings(set, "gpt6"), B = ratings(set, "deepseek");
  if (!A || !B) continue;
  const items = await loadSet(set);
  const rows = [];
  for (const c of [4, 5, 6, 7, "all"]) {
    const xs = items.filter((x) => (c === "all" || x.class === c) && A[x.id] && B[x.id]);
    const a = xs.map((x) => verdictV2(x.class, A[x.id]) === "too_easy"), b = xs.map((x) => verdictV2(x.class, B[x.id]) === "too_easy");
    rows.push({ class: c, n: xs.length, gpt6: a.filter(Boolean).length, deepseek: b.filter(Boolean).length,
      both: a.filter((v, i) => v && b[i]).length, either: a.filter((v, i) => v || b[i]).length, kappa: kappa(a, b).kappa,
      tooHardEither: xs.filter((x) => verdictV2(x.class, A[x.id]) === "too_hard" || verdictV2(x.class, B[x.id]) === "too_hard").length });
  }
  res[set] = rows;
  console.log(`\n## ${set}: items at queue positions 1-2, too easy = grade <= C-2`);
  console.log("| class | n | gpt6 | deepseek | both | either | kappa | too hard (either) |");
  for (const r of rows) console.log(`| ${r.class} | ${r.n} | ${pct(r.gpt6, r.n)} | ${pct(r.deepseek, r.n)} | ${pct(r.both, r.n)} | ${pct(r.either, r.n)} | ${r.kappa?.toFixed(2)} | ${r.tooHardEither} |`);
}

// ── 4. relevel + placement: the new items' calibration ──
for (const set of ["relevel", "placement"]) {
  const A = ratings(set, "gpt6"), B = ratings(set, "deepseek");
  if (!A || !B) continue;
  const items = await loadSet(set);
  const xs = items.filter((x) => A[x.id] && B[x.id]);
  const a = xs.map((x) => verdictV2(x.class, A[x.id]) === "too_easy"), b = xs.map((x) => verdictV2(x.class, B[x.id]) === "too_easy");
  res[set] = { n: xs.length, gpt6TooEasy: a.filter(Boolean).length, deepseekTooEasy: b.filter(Boolean).length,
    both: a.filter((v, i) => v && b[i]).length, either: a.filter((v, i) => v || b[i]).length, kappa: kappa(a, b).kappa,
    tooHardEither: xs.filter((x) => verdictV2(x.class, A[x.id]) === "too_hard" || verdictV2(x.class, B[x.id]) === "too_hard").length };
  console.log(`\n## ${set}: n ${xs.length}, too easy gpt6 ${a.filter(Boolean).length}, deepseek ${b.filter(Boolean).length}, either ${res[set].either}, kappa ${res[set].kappa?.toFixed(2)}`);
}

function avg(xs) { return xs.length ? +(xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(2) : null; }
writeFileSync(new URL("score.json", OUT), JSON.stringify(res, null, 1));

// ── 5. threshold curve on precision40 + agreement with v1's Claude rater on bank240 (diagnostic, not a gate) ──
{
  const items = await loadSet("precision40");
  const adj = read(new URL("precision-adjudication.json", V1));
  const truth = items.map((_, i) => adj.agree_too_easy.includes(i));
  const A = ratings("precision40", "gpt6"), B = ratings("precision40", "deepseek");
  const curve = [];
  for (const d of [2, 1.5, 1]) {
    for (const [name, f] of [["gpt6", (x) => A[x.id].grade <= x.class - d], ["deepseek", (x) => B[x.id].grade <= x.class - d],
      ["mean", (x) => (A[x.id].grade + B[x.id].grade) / 2 <= x.class - d]]) {
      const fl = items.map(f); const tp = fl.filter((v, i) => v && truth[i]).length, fp = fl.filter((v, i) => v && !truth[i]).length;
      curve.push({ threshold: `grade <= C-${d}`, rater: name, flagged: tp + fp, precision: tp + fp ? +(tp / (tp + fp)).toFixed(2) : null, recall: +(tp / 23).toFixed(2) });
    }
  }
  res.precisionCurve = curve;
  console.log("\n## precision40 threshold curve");
  for (const r of curve) console.log(`| ${r.threshold} | ${r.rater} | flagged ${r.flagged} | precision ${r.precision} | recall ${r.recall} |`);
  const bank = await loadSet("bank240");
  const claude = new Set(read(new URL("rater-claude.json", V1)).too_easy);
  const BA = ratings("bank240", "gpt6"), BB = ratings("bank240", "deepseek");
  const c = bank.map((_, i) => claude.has(i));
  res.vsClaude240 = { gpt6: kappa(bank.map((x) => verdictV2(x.class, BA[x.id]) === "too_easy"), c), deepseek: kappa(bank.map((x) => verdictV2(x.class, BB[x.id]) === "too_easy"), c) };
  console.log(`\nbank240 v2 vs v1-Claude flags: gpt6 kappa ${res.vsClaude240.gpt6.kappa.toFixed(2)}, deepseek kappa ${res.vsClaude240.deepseek.kappa.toFixed(2)}`);
  writeFileSync(new URL("score.json", OUT), JSON.stringify(res, null, 1));
}
