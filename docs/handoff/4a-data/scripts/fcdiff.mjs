import fs from "node:fs";
const load = (f) => { const m = new Map(); for (const [fam, ex, ok] of JSON.parse(fs.readFileSync(f, "utf8"))) { const k = fam + "|" + ex; const c = m.get(k) ?? [0, 0]; c[0]++; c[1] += ok; m.set(k, c); } return m; };
const b = load(process.argv[2]), x = load(process.argv[3]); const nw = {}, gone = {};
for (const [k, [n, ok]] of x) { const o = b.get(k); if (!o) continue; const d = ok - o[1]; const fam = k.split("|")[0]; if (d > 0) (nw[fam] ??= []).push([k, d]); if (d < 0) (gone[fam] ??= []).push([k, -d]); }
const sum = (o) => JSON.stringify(Object.fromEntries(Object.entries(o).map(([f, v]) => [f, v.reduce((a, [, d]) => a + d, 0)])));
console.log("NEW:", sum(nw), "\nREMOVED:", sum(gone));
for (const [f, v] of Object.entries(nw)) for (const [k] of v.slice(0, Number(process.argv[4] ?? 5))) console.log("  NEW", k.slice(0, 190));
