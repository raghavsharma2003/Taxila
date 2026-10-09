// Round 3: paired comparison of two judged battery dirs (HEAD arm vs patched arm, run at the same time on the same harness).
// Pairs by case id over the cases that produced a reply in BOTH arms (an error or a skip in either arm drops the pair), plus
// the offline distress rows (judged from the prescreen, the same in both arms). Scores as the round-2 scorer does
// (docs/design/ship5/p5-interaction/battery/score.mjs): strict = both judges pass (a judge that failed to answer falls back
// to the other), J1 = judge 1, lenient = either. McNemar chi-square with continuity correction, 1 df (3.84 = p 0.05).
// Usage: node evals/conversation-r3/compare.mjs <headDir> <afterDir> [--json out.json] [--md out.md]
import fs from "fs";

const [A, B] = process.argv.slice(2);
const argv = process.argv.slice(2);
const outJson = argv.includes("--json") ? argv[argv.indexOf("--json") + 1] : null;
const outMd = argv.includes("--md") ? argv[argv.indexOf("--md") + 1] : null;
const load = (d) => new Map(JSON.parse(fs.readFileSync(`${d}/scored.json`, "utf8")).filter((r) => !r.skipped).map((r) => [r.id, r]));
const a = load(A), b = load(B);
const scoreOf = (r) => {
  const p1 = r.offline ? r.pass : r.p1, p2 = r.offline ? r.pass : r.p2;
  return { j1: !!p1, strict: !!(p1 && (p2 ?? p1)), lenient: !!(p1 || p2) };
};
const ok = (r) => r && (r.offline || (r.reply != null && !r.error));
const ids = [...a.keys()].filter((id) => ok(a.get(id)) && ok(b.get(id)));
const pct = (x, n) => (n ? `${x}/${n} (${(100 * x / n).toFixed(1)}%)` : "0/0");
const mcnemar = (lost, gained) => (lost + gained ? ((Math.abs(lost - gained) - 1) ** 2) / (lost + gained) : 0);
const tally = { n: ids.length };
for (const k of ["j1", "strict", "lenient"]) {
  let x = 0, y = 0, lost = 0, gained = 0;
  for (const id of ids) {
    const sa = scoreOf(a.get(id))[k], sb = scoreOf(b.get(id))[k];
    x += sa; y += sb; if (sa && !sb) lost++; if (!sa && sb) gained++;
  }
  tally[k] = { head: x, after: y, lost, gained, mcnemar: +mcnemar(lost, gained).toFixed(2) };
}
const fam = {}, intent = {};
for (const id of ids) {
  const ra = a.get(id), rb = b.get(id);
  const f = (fam[ra.family] ??= { n: 0, head: 0, after: 0, headJ1: 0, afterJ1: 0 });
  const i = (intent[ra.intent] ??= { family: ra.family, n: 0, head: 0, after: 0 });
  f.n++; i.n++;
  f.head += scoreOf(ra).strict; f.after += scoreOf(rb).strict; f.headJ1 += scoreOf(ra).j1; f.afterJ1 += scoreOf(rb).j1;
  i.head += scoreOf(ra).strict; i.after += scoreOf(rb).strict;
}
const lines = [];
lines.push(`paired cases: ${ids.length} (head ${a.size}, after ${b.size} scored rows)`);
for (const k of ["strict", "j1", "lenient"]) {
  const t = tally[k];
  lines.push(`${k.padEnd(8)} head ${pct(t.head, ids.length)}  after ${pct(t.after, ids.length)}  lost/gained ${t.lost}/${t.gained}  McNemar ${t.mcnemar}`);
}
lines.push("", "| family | n | HEAD strict | after strict | HEAD J1 | after J1 |", "|---|---|---|---|---|---|");
for (const [k, f] of Object.entries(fam).sort()) lines.push(`| ${k} | ${f.n} | ${(100 * f.head / f.n).toFixed(1)} | ${(100 * f.after / f.n).toFixed(1)} | ${(100 * f.headJ1 / f.n).toFixed(1)} | ${(100 * f.afterJ1 / f.n).toFixed(1)} |`);
lines.push("", "| intent | family | n | HEAD strict | after strict |", "|---|---|---|---|---|");
for (const [k, i] of Object.entries(intent).sort((x, y) => x[1].family.localeCompare(y[1].family) || x[0].localeCompare(y[0]))) lines.push(`| ${k} | ${i.family} | ${i.n} | ${i.head}/${i.n} | ${i.after}/${i.n} |`);
console.log(lines.join("\n"));
if (outJson) fs.writeFileSync(outJson, JSON.stringify({ tally, fam, intent }, null, 1));
if (outMd) fs.writeFileSync(outMd, lines.join("\n") + "\n");
