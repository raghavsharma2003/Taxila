// The 14.4 sim-lab records: on diagnostic turns (opt: chips) of the text lane, how many lines the new guard catches, and
// what withoutOptions leaves (teacher words only; these are sim-lab lines).
import fs from "node:fs"; import path from "node:path";
const { optionsNamed, withoutOptions } = await import("/home/user/Taxila/server/brain/say.js");
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
for (const d of ["simlab-774", "simlab-cc4", "simlab-1a346"]) walk(d);
let diag = 0, caught = 0, one = 0; const ex = [];
for (const f of files) { let r; try { r = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; }
  if (r.lane !== "text") continue;
  for (const t of r.turns ?? []) {
    const chips = (t.screen?.chips ?? t.ui?.chips ?? []).filter((c) => String(c.id ?? "").startsWith("opt:"));
    if (chips.length < 2) continue; diag++;
    // chip labels are the first 40 characters of each option: enough for the 25-character head the guard reads
    const item = { diagnostic: true, options: chips.map((c) => ({ text: c.label })) };
    const n = optionsNamed(t.teacher ?? "", item);
    if (n >= 2) { caught++; if (ex.length < 6) ex.push(withoutOptions(t.teacher, item).slice(0, 160)); } else if (n === 1) one++;
  } }
console.log({ textDiagTurns: diag, caught, namesOne: one }); for (const e of ex) console.log("-", e);
