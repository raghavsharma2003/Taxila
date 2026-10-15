// Fold <dir>/results.jsonl into <dir>/per-item.json + <dir>/summary.json, and (with --audit <path>) the committed audit
// record: per item { topicId, itemId, kind, a, b, agreed, verdict, apply, human? }. `verdict` is "shallow" only when BOTH
// models said shallow; a failed call is never a verdict. `apply` = shallow and not overruled by the human read (human-*.json).
//   node evals/kit-deep-kinds/summarize.mjs --dir <work> [--audit docs/research/kits/deep-kind-audit-2026-10-15.json]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { arg, workDir } from "./lib.mjs";
import { RUBRIC_VERSION, SYSTEM } from "./rubric.mjs";
const DIR = workDir();
const A = "taxila-brain", B = "DeepSeek-V4-Pro";
const items = JSON.parse(readFileSync(`${DIR}/items.json`, "utf8"));
const rows = readFileSync(`${DIR}/results.jsonl`, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const HUMAN = new URL("./human-2026-10-15.json", import.meta.url);
const human = existsSync(HUMAN) ? JSON.parse(readFileSync(HUMAN, "utf8")) : { reads: [] };
const humanOf = new Map(human.reads.map((r) => [r.itemId, r]));
const best = new Map(); // (item, model) -> the ok row if any, else the last failure
for (const r of rows) { const k = `${r.itemId}|${r.model}`; const p = best.get(k); if (!p || !p.ok) best.set(k, r); }
const v = (r) => (!r ? { fail: "not_run" } : r.ok ? { demand: r.demand, why: r.why } : { fail: r.error });
const per = items.map((x) => {
  const a = v(best.get(`${x.itemId}|${A}`)), b = v(best.get(`${x.itemId}|${B}`));
  const both = !!a.demand && !!b.demand;
  const verdict = !both ? "failed" : a.demand === b.demand ? a.demand : "split";
  const h = humanOf.get(x.itemId);
  return { topicId: x.topicId, itemId: x.itemId, kind: x.kind, class: x.class, subject: x.subject, skillId: x.skillId, a, b, agreed: both && a.demand === b.demand, verdict,
    apply: verdict === "shallow" && h?.mine !== "disagree", ...(h ? { human: h.mine === "disagree" ? `disagree: ${h.note}` : h.mine } : {}) };
});
const tab = (key) => {
  const g = {};
  for (const p of per) {
    const k = String(p[key]); const t = (g[k] ??= { n: 0, aShallow: 0, bShallow: 0, bothShallow: 0, bothDeep: 0, split: 0, failed: 0 });
    t.n++; if (p.a.demand === "shallow") t.aShallow++; if (p.b.demand === "shallow") t.bShallow++;
    if (p.verdict === "shallow") t.bothShallow++; else if (p.verdict === "deep") t.bothDeep++; else if (p.verdict === "split") t.split++; else t.failed++;
  }
  for (const t of Object.values(g)) { const m = t.n - t.failed; t.disagreeRate = m ? +(t.split / m).toFixed(3) : null; t.shallowRate = m ? +(t.bothShallow / m).toFixed(3) : null; }
  return g;
};
const done = per.filter((p) => p.verdict !== "failed");
const po = done.filter((p) => p.agreed).length / done.length;
const pa = done.filter((p) => p.a.demand === "shallow").length / done.length, pb = done.filter((p) => p.b.demand === "shallow").length / done.length;
const pe = pa * pb + (1 - pa) * (1 - pb);
const kappa = (po - pe) / (1 - pe);
const codes = (side) => { const c = {}; for (const p of per.filter((p) => p.verdict === "shallow")) c[p[side].why] = (c[p[side].why] ?? 0) + 1; return c; };
const failsBy = { [A]: 0, [B]: 0 }; for (const r of best.values()) if (!r.ok) failsBy[r.model]++;
const summary = { rubric: RUBRIC_VERSION, calls: rows.length, retried: rows.filter((r) => r.attempt).length, items: per.length, failuresUnresolved: failsBy,
  overall: { n: done.length, bothShallow: done.filter((p) => p.verdict === "shallow").length, bothDeep: done.filter((p) => p.verdict === "deep").length,
    split: done.filter((p) => p.verdict === "split").length, aShallow: done.filter((p) => p.a.demand === "shallow").length, bShallow: done.filter((p) => p.b.demand === "shallow").length,
    agreement: +po.toFixed(3), kappa: +kappa.toFixed(3), apply: per.filter((p) => p.apply).length },
  byKind: tab("kind"), byClass: tab("class"), bySubject: tab("subject"), shallowCodesA: codes("a"), shallowCodesB: codes("b") };
writeFileSync(`${DIR}/per-item.json`, JSON.stringify(per));
writeFileSync(`${DIR}/summary.json`, JSON.stringify(summary, null, 1));
const audit = arg("audit");
if (audit) {
  const meta = { date: "2026-10-15", rubric: RUBRIC_VERSION, system: SYSTEM, models: { a: `${A} (gpt-5.6-sol, reasoning_effort medium)`, b: `${B} (DeepSeek family)` },
    account: "southindia (SIN) test account; DATABASE_URL empty, trace off", input: "KIND, SKILL, PROMPT_EN, PROMPT_HI, KEY",
    scope: "every item of kind error_spot, predict, why, contrast, near_transfer, far_transfer, translate_rep in data/kits (teachback excluded)",
    rule: "verdict shallow only when both models say shallow; split and failed stay deep; apply = shallow and not overruled by the human read (evals/kit-deep-kinds/human-2026-10-15.json)",
    harness: "evals/kit-deep-kinds/", summary };
  writeFileSync(audit, JSON.stringify({ meta, items: per.map(({ class: _c, subject: _s, skillId: _k, ...p }) => p) }).replace(/\},\{"topicId"/g, '},\n{"topicId"') + "\n");
}
console.log(JSON.stringify(summary.overall), JSON.stringify(failsBy));
