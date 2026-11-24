// Seams sweep 5: the Hindi/Hinglish number-word tables. Finds every object literal in server/, src/, shared/ that maps
// "paanch"/"panch" to 5, reads its word → number pairs, and reports (a) words one table maps to a different number than
// another, (b) for words 0-20 plus the tens, which tables lack them. Run: node docs/design/round7/audit/seams-scripts/number-words.mjs
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
const ROOT = new URL("../../../../../", import.meta.url).pathname;
const walk = (d, out = []) => { for (const f of readdirSync(d)) { if (f === "node_modules") continue; const p = join(d, f); const s = statSync(p); if (s.isDirectory()) walk(p, out); else if (/\.(m?js|tsx?)$/.test(f) && !/\.test\./.test(f)) out.push(p); } return out; };
const tables = [];
for (const f of ["server", "src", "shared"].flatMap((d) => walk(join(ROOT, d)))) {
  const t = readFileSync(f, "utf8");
  // a table = a { … } literal (≤ 4000 chars) containing paanch: 5 or panch: 5
  for (const m of t.matchAll(/\{[^{}]{0,4000}\b(?:paanch|panch|"paanch"|"panch")\s*:\s*5\b[^{}]{0,4000}\}/g)) {
    const pairs = {}; for (const p of m[0].matchAll(/["']?([a-zऀ-ॿ]+)["']?\s*:\s*(\d+)\b/g)) pairs[p[1]] = Number(p[2]);
    const line = t.slice(0, m.index).split("\n").length;
    tables.push({ at: `${relative(ROOT, f)}:${line}`, pairs });
  }
}
const all = {}; for (const tb of tables) for (const [w, n] of Object.entries(tb.pairs)) (all[w] ??= {})[n] = [...((all[w] ?? {})[n] ?? []), tb.at];
console.log(`${tables.length} tables`); for (const tb of tables) console.log(`  ${tb.at}  (${Object.keys(tb.pairs).length} words)`);
console.log("\n== words mapped to different numbers");
for (const [w, by] of Object.entries(all)) if (Object.keys(by).length > 1) console.log(`  ${w}: ` + Object.entries(by).map(([n, at]) => `${n} in ${at.join(", ")}`).join(" | "));
const CORE = { ek: 1, do: 2, teen: 3, chaar: 4, paanch: 5, chhah: 6, saat: 7, aath: 8, nau: 9, das: 10, gyarah: 11, barah: 12, terah: 13, chaudah: 14, pandrah: 15, solah: 16, satrah: 17, atharah: 18, unnees: 19, bees: 20 };
console.log("\n== core words (1-20, one spelling each) each table lacks");
for (const tb of tables) { const miss = Object.keys(CORE).filter((w) => !(w in tb.pairs)); if (miss.length) console.log(`  ${tb.at}: ${miss.join(" ")}`); }
