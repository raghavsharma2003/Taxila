// Applies scripts/kits/w5-decisions.json (W5's per-string decisions) to data/kits: each "rewrite" is an exact substring that
// must occur exactly once in its kit file, else the script stops without writing (a moved string is a human's call).
//   node scripts/kits/w5-decide.mjs [--write]
import { readFileSync, writeFileSync } from "node:fs";
const D = JSON.parse(readFileSync(new URL("./w5-decisions.json", import.meta.url), "utf8"));
const write = process.argv.includes("--write");
const files = new Map();
for (const r of D.rewrite) {
  const path = new URL(`../../data/kits/${r.file}.json`, import.meta.url);
  const s = files.get(r.file) ?? readFileSync(path, "utf8");
  const n = s.split(r.from).length - 1;
  if (n !== 1) { console.error(`STOP ${r.file}: "${r.from}" occurs ${n} times (want 1)`); process.exit(1); }
  files.set(r.file, s.replace(r.from, r.to));
  console.log(`${r.file}: "${r.from}" → "${r.to}"`);
}
if (write) for (const [f, s] of files) writeFileSync(new URL(`../../data/kits/${f}.json`, import.meta.url), s);
console.log(`${write ? "wrote" : "dry run"}: ${D.rewrite.length} rewrites in ${files.size} files; kept ${D.keep.length} groups; ambiguous ${D.ambiguous.length}`);
