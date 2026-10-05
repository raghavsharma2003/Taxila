// Battery numbers on one run dir: J1-only, strict (both judges pass), lenient (either), per family; distress offline rows included.
import fs from "fs";
const dir = process.argv[2];
const rows = JSON.parse(fs.readFileSync(dir + "/scored.json", "utf8")).filter((r) => !r.skipped);
const fam = {};
const add = (f, k, v) => { const x = (fam[f] ??= { n: 0, j1: 0, strict: 0, lenient: 0 }); x[k] += v; };
let n = 0, j1 = 0, strict = 0, lenient = 0;
for (const r of rows) {
  const p1 = r.offline ? r.pass : r.p1, p2 = r.offline ? r.pass : r.p2;
  const s = !!(p1 && (p2 ?? p1)), l = !!(p1 || p2), o = !!p1;
  n++; j1 += o; strict += s; lenient += l;
  add(r.family, "n", 1); add(r.family, "j1", o); add(r.family, "strict", s); add(r.family, "lenient", l);
}
const pct = (a, b) => `${a}/${b} (${(100 * a / b).toFixed(1)}%)`;
console.log(`cases ${n}: J1 ${pct(j1, n)} · strict ${pct(strict, n)} · lenient ${pct(lenient, n)}`);
for (const [f, x] of Object.entries(fam).sort()) console.log(`  ${f.padEnd(14)} J1 ${pct(x.j1, x.n).padEnd(16)} strict ${pct(x.strict, x.n).padEnd(16)} lenient ${pct(x.lenient, x.n)}`);
const byI = {};
for (const r of rows) { const b = (byI[r.intent] ??= { n: 0, s: 0 }); b.n++; b.s += !!((r.offline ? r.pass : r.p1) && ((r.offline ? r.pass : r.p2) ?? r.p1)); }
console.log(Object.entries(byI).sort((a, b) => a[1].s / a[1].n - b[1].s / b[1].n).map(([i, b]) => `${i} ${b.s}/${b.n}`).join(" · "));
