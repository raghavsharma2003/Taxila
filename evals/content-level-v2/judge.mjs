// Rubric v2 judge harness (RS-6). Two raters from different model families rate the same items blind to each other,
// to kit difficulty, queue position, chapter and topic. Output: out/ratings-<set>-<rater>.json { meta, r: { id: rating } }.
//
//   node --env-file=.env.local evals/content-level-v2/judge.mjs <set> <rater> [--limit N]
//   sets:   bank240 (v1's stratified bank sample) | precision40 (v1's NCERT-adjudicated flags) | served-old (old queue,
//           positions 1-2, all 385 class 4-7 topics) | served-new (F0 queue over the re-levelled kits, positions 1-2) |
//           relevel (every new opener/harder item) | placement (data/placement)
//   raters: gpt6 (taxila-gpt6, gpt-6-sol, OpenAI family) | deepseek (DeepSeek-V4-Pro, Direct) | brain (taxila-brain, v1's model)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { chatJSON, pool } from "./lib/azure-lite.mjs";
import { RUBRIC_V2, RUBRIC_V2_SHA } from "./rubric-v2.mjs";
import { scopeBlock } from "./lib/scope.mjs";
import { loadSet } from "./lib/sets.mjs";

const RATERS = { gpt6: "taxila-gpt6", deepseek: "DeepSeek-V4-Pro", brain: "taxila-brain" };
const [set, raterKey] = process.argv.slice(2);
const limit = Number(process.argv[process.argv.indexOf("--limit") + 1]) || Infinity;
const model = RATERS[raterKey];
if (!set || !model) throw new Error("usage: judge.mjs <set> <gpt6|deepseek|brain>");

const outFile = new URL(`./out/ratings-${set}-${raterKey}.json`, import.meta.url);
const prev = existsSync(outFile) ? JSON.parse(readFileSync(outFile, "utf8")) : { r: {} };
if (prev.meta && prev.meta.rubric !== RUBRIC_V2_SHA) throw new Error(`existing ratings were made with rubric ${prev.meta.rubric}, not ${RUBRIC_V2_SHA}`);
const done = prev.r;
// Ratings are per item id and rubric, not per set: reuse what the same rater already gave this item in another set
// (served-new is mostly re-levelled items and old queue heads, both rated already).
import { readdirSync } from "node:fs";
for (const f of readdirSync(new URL("./out/", import.meta.url)).filter((x) => x.startsWith("ratings-") && x.endsWith(`-${raterKey}.json`) && x !== `ratings-${set}-${raterKey}.json`)) {
  const other = JSON.parse(readFileSync(new URL(`./out/${f}`, import.meta.url), "utf8"));
  if (other.meta?.rubric !== RUBRIC_V2_SHA) continue;
  for (const [id, r] of Object.entries(other.r)) if (!done[id]) done[id] = { ...r, reusedFrom: other.meta.set };
}
const items = (await loadSet(set)).filter((x) => !done[x.id]).slice(0, limit);

// Batches of <= 20 items sharing one class x subject, so the scope block is sent once per batch.
const groups = new Map();
for (const it of items) { const k = `${it.class}|${it.subject}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); }
const batches = [];
for (const [k, xs] of groups) for (let i = 0; i < xs.length; i += 20) batches.push({ k, xs: xs.slice(i, i + 20) });

let cost = 0;
await pool(batches, 6, async ({ k, xs }) => {
  const [cls, subject] = k.split("|");
  const user = `Class C = ${cls}. Subject: ${subject}.\nNCERT 2025-26 scope (chapter titles):\n${scopeBlock(Number(cls), subject)}\n\nItems:\n` +
    JSON.stringify(xs.map((x) => ({ id: x.id, question: x.prompt, ...(x.options ? { options: x.options } : {}), key: String(x.answer).slice(0, 160) })));
  const { json, cost: c } = await chatJSON(model, RUBRIC_V2, user, { maxTokens: 8000, effort: "low", tag: `judge:${set}:${raterKey}` });
  cost += c;
  for (const r of json.r || []) if (xs.some((x) => x.id === r.id)) done[r.id] = { grade: Number(r.grade), demand: r.demand, needsC: !!r.needsC, why: r.why };
  writeFileSync(outFile, JSON.stringify({ meta: { set, rater: raterKey, model, rubric: RUBRIC_V2_SHA, date: "2026-10-04" }, r: done }, null, 1));
  process.stdout.write(".");
});
writeFileSync(outFile, JSON.stringify({ meta: { set, rater: raterKey, model, rubric: RUBRIC_V2_SHA, date: "2026-10-04" }, r: done }, null, 1));
console.log(`\n${set}/${raterKey}: ${Object.keys(done).length} rated; this run $${cost.toFixed(3)}`);
