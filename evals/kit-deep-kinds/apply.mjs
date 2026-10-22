// PROPOSED, not run on data/kits: write `"deep": false` (right after "kind") on every item the audit marks apply:true.
// Each kit file keeps its own serialisation (indent 1 or 2, trailing newline or not): a file that would not round-trip
// byte-identical is refused. Nothing else in an item changes (kind, key, acceptable, hints, verified stay).
//   node evals/kit-deep-kinds/apply.mjs [--kits <dir>] [--write]      (default: dry run over data/kits)
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { arg, KITS } from "./lib.mjs";
const AUDIT = new URL("../../docs/research/kits/deep-kind-audit-2026-10-15.json", import.meta.url);
const dir = arg("kits") ? arg("kits").replace(/\/?$/, "/") : fileURLToPath(KITS);
const write = process.argv.includes("--write");
const apply = new Set(JSON.parse(readFileSync(AUDIT, "utf8")).items.filter((p) => p.apply).map((p) => p.itemId));
const STYLES = [[1, "\n"], [1, ""], [2, "\n"], [2, ""]];
let marked = 0, files = 0;
for (const f of readdirSync(dir).filter((x) => /^c\d-.+\.json$/.test(x)).sort()) {
  const src = readFileSync(dir + f, "utf8");
  const d = JSON.parse(src);
  const style = STYLES.find(([ind, nl]) => JSON.stringify(d, null, ind) + nl === src);
  if (!style) throw new Error(`${f}: does not round-trip byte-identical; refusing to rewrite it`);
  let n = 0;
  for (const t of d.topics ?? []) t.items = (t.items ?? []).map((it) => {
    if (!apply.has(it.id) || it.deep === false) return it;
    n++;
    const out = {};
    for (const [k, v] of Object.entries(it)) { out[k] = v; if (k === "kind") out.deep = false; }
    return out;
  });
  if (!n) continue;
  files++; marked += n;
  if (write) writeFileSync(dir + f, JSON.stringify(d, null, style[0]) + style[1]);
  console.log(`${f}: ${n} item(s)${write ? " written" : ""}`);
}
console.log(`${marked} items in ${files} files${write ? "" : " (dry run: nothing written)"}; audit apply set ${apply.size}`);
