// A deterministic stratified spot-check sample for a human read: N agreed-shallow and M agreed-deep items, round-robin over
// the kinds. node evals/kit-deep-kinds/spot.mjs --dir <work> [--shallow 60] [--deep 30]
import { readFileSync, writeFileSync } from "node:fs";
import { arg, workDir } from "./lib.mjs";
const DIR = workDir();
const per = JSON.parse(readFileSync(`${DIR}/per-item.json`, "utf8"));
const items = Object.fromEntries(JSON.parse(readFileSync(`${DIR}/items.json`, "utf8")).map((x) => [x.itemId, x]));
const h = (s) => [...("spot-2026-10-15" + s)].reduce((a, c) => Math.imul(a ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
const KINDS = ["error_spot", "predict", "why", "contrast", "near_transfer", "far_transfer", "translate_rep"];
function pick(verdict, n) {
  const pool = per.filter((p) => p.verdict === verdict).sort((a, b) => h(a.itemId) - h(b.itemId));
  const byK = Object.fromEntries(KINDS.map((k) => [k, pool.filter((p) => p.kind === k)]));
  const out = []; let i = 0;
  while (out.length < n && KINDS.some((k) => byK[k].length > 0)) { const k = KINDS[i++ % KINDS.length]; const x = byK[k].shift(); if (x) out.push(x); }
  return out;
}
const sample = [...pick("shallow", Number(arg("shallow", "60"))), ...pick("deep", Number(arg("deep", "30")))];
writeFileSync(`${DIR}/spot-sample.json`, JSON.stringify(sample.map((p) => p.itemId)));
let j = 0;
for (const p of sample) { const x = items[p.itemId];
  console.log(`#${++j} [${p.verdict}] ${x.kind} c${x.class} ${x.subject} ${x.itemId}\n  skill: ${x.skill}\n  EN: ${x.prompt_en}\n  HI: ${x.prompt_hi}\n  KEY: ${x.answer}\n  A=${p.a.why} B=${p.b.why}`); }
