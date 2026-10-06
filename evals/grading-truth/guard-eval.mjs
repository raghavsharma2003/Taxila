// Re-score a grading-truth model-leg dump (run.mjs --dump-model) with server/grading/corroborate.js, offline: the SAME
// model labels before and after the code guard (paired), per form kind and per bucket. No network.
//
//   node evals/grading-truth/guard-eval.mjs --dump <dump.json> [--dump <another>] [--root .] [--sweep]
//
// Truth semantics are run.mjs's: a wrong grade is a non-abstain verdict that disagrees with the truth (false_credit,
// false_fail, partial_miss); an abstain on a correct answer is "uncredited" (no wrong grade, a re-ask).
import { readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve, join } from "node:path";

const argv = process.argv.slice(2);
const args = (n) => argv.flatMap((a, i) => (a === n ? [argv[i + 1]] : []));
const ROOT = resolve(args("--root")[0] ?? new URL("../..", import.meta.url).pathname);
const MAIN = resolve(new URL("../..", import.meta.url).pathname);
const imp = (rel) => import(pathToFileURL(join(ROOT, rel)).href);
const CL = await imp("server/director/classify.js");
const G = await imp("server/grading/corroborate.js");
const { getKit } = await imp("server/content/index.js");

const rows = args("--dump").flatMap((f) => JSON.parse(readFileSync(f, "utf8")).map((r) => ({ ...r, dump: f })));
const need = new Set(rows.map((r) => r.itemId));
const targets = new Map();
for (const f of readdirSync(join(MAIN, "data/kits")).filter((x) => /^c\d-.*\.json$/.test(x))) {
  const j = JSON.parse(readFileSync(join(MAIN, "data/kits", f), "utf8"));
  for (const t of j.topics) {
    if (!t.items?.some((i) => need.has(i.id))) continue;
    const kit = await getKit(t.topicId, { generate: false });
    for (const item of kit?.items ?? []) if (need.has(item.id)) targets.set(item.id, CL.targetFor({ phase: "practice", hintLevel: 0 }, kit, { ...item, misconceptions: kit.misconceptions }));
  }
}
const vOf = (o) => (o === "correct" ? "correct" : o === "partial" ? "partial" : o === "incorrect" || o === "misconception" ? "incorrect" : "abstain");
const wrongKind = (truth, v) => {
  if (v === "abstain") return null;
  if (truth === "correct") return v === "correct" ? null : "false_fail";
  if (truth === "partial") return v === "correct" ? "false_credit" : v === "incorrect" ? "partial_miss" : null;
  return v === "correct" ? "false_credit" : null;
};
function score(opts) {
  const out = { n: 0, errors: 0, lostMiss: 0, before: { wrong: 0, uncredited: 0, abstain: 0 }, after: { wrong: 0, uncredited: 0, abstain: 0 }, byKind: {}, wrongAfter: [], newlyUncredited: [] };
  for (const r of rows) {
    if (r.error) { out.errors++; continue; }
    const target = targets.get(r.itemId);
    if (!target) continue;
    out.n++;
    const res = { outcome: r.modelOutcome, source: r.source, confidence: 1, flags: {} };
    const g = opts.guard ? G.corroborate({ target, text: r.input, result: res }) : res;
    const b = vOf(r.modelOutcome), a = vOf(g.outcome);
    const k = (out.byKind[r.kind.replace(/\(.*?\)/g, "")] ??= { n: 0, wb: 0, wa: 0, ub: 0, ua: 0 });
    k.n++;
    for (const [side, v, key] of [["before", b, "b"], ["after", a, "a"]]) {
      const w = wrongKind(r.truth, v);
      if (w) { out[side].wrong++; k[`w${key}`]++; }
      if (v === "abstain") out[side].abstain++;
      if (v === "abstain" && r.truth === "correct") { out[side].uncredited++; k[`u${key}`]++; }
    }
    // a right fail the guard turned into no evidence: negative evidence lost (a re-ask instead of "not yet")
    if (r.truth !== "correct" && b === "incorrect" && a === "abstain") out.lostMiss++;
    if (wrongKind(r.truth, a)) out.wrongAfter.push({ itemId: r.itemId, kind: r.kind, truth: r.truth, input: r.input, model: r.modelOutcome, guard: g.outcome, why: g.corroboration, key: String(target.key).slice(0, 80) });
    if (r.truth === "correct" && a === "abstain" && b !== "abstain") out.newlyUncredited.push({ itemId: r.itemId, kind: r.kind, input: r.input, why: g.corroboration, key: String(target.key).slice(0, 80) });
  }
  return out;
}
const base = score({ guard: false }), guarded = score({ guard: true });
console.log(`rows ${rows.length} (errors ${guarded.errors}), scored ${guarded.n}`);
console.log(`BEFORE (model label as is): wrong ${base.before.wrong}, uncredited ${base.before.uncredited}, abstain ${base.before.abstain}`);
console.log(`AFTER  (corroborated):      wrong ${guarded.after.wrong}, uncredited ${guarded.after.uncredited}, abstain ${guarded.after.abstain}; right fails turned into no evidence ${guarded.lostMiss}`);
console.log("\nper kind: n | wrong before -> after | uncredited before -> after");
for (const [k, v] of Object.entries(guarded.byKind).sort((a, b) => b[1].n - a[1].n)) console.log(`  ${String(v.n).padStart(4)}  ${String(v.wb).padStart(3)} -> ${String(v.wa).padEnd(3)}  ${String(v.ub).padStart(3)} -> ${String(v.ua).padEnd(3)}  ${k}`);
console.log("\nwrong after:");
for (const w of guarded.wrongAfter.slice(0, 40)) console.log(`  [${w.kind}] ${w.itemId} truth ${w.truth} model ${w.model} → ${w.guard} (${w.why}) | in: ${String(w.input).slice(0, 70)} | key: ${w.key}`);
if (argv.includes("--show-uncredited")) { console.log("\nnewly uncredited:"); for (const w of guarded.newlyUncredited.slice(0, 60)) console.log(`  [${w.kind}] ${w.why} | in: ${String(w.input).slice(0, 70)} | key: ${w.key}`); }
if (argv.includes("--json")) console.log(JSON.stringify({ base: base.before, after: guarded.after, n: guarded.n, errors: guarded.errors, byKind: guarded.byKind, wrongAfter: guarded.wrongAfter }));
