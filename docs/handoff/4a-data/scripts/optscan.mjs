import fs from "node:fs"; import path from "node:path";
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
for (const d of ["simlab-774", "simlab-cc4", "simlab-1a346"]) walk(d);
let turns = 0, diag = 0, hits = [];
for (const f of files) { let r; try { r = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; }
  for (const t of r.turns ?? []) { turns++;
    const chips = (t.screen?.chips ?? t.ui?.chips ?? []).filter((c) => String(c.id ?? "").startsWith("opt:"));
    if (chips.length < 2) continue; diag++;
    const txt = String(t.teacher ?? "");
    const n = chips.filter((c) => txt.includes(String(c.label).slice(0, 25))).length;
    if (n >= 2) hits.push({ f: path.basename(f), n: t.n, move: t.move, guard: t.guard ?? t.trace?.guard ?? null, lane: r.lane, txt: txt.slice(0, 300) });
  } }
console.log({ files: files.length, turns, diagTurns: diag, hits: hits.length });
for (const h of hits.slice(0, 8)) console.log(JSON.stringify(h));
