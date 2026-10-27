import fs from "node:fs"; import path from "node:path";
const { offerAgreed, requestOf } = await import(process.argv[2] + "/server/director/requests.js");
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
walk(process.argv[3] + "/sl3/evals"); walk(process.argv[3] + "/dg/evals");
let pairs = 0, read = 0; const by = {}; const ex = [];
for (const f of files) { const j = JSON.parse(fs.readFileSync(f, "utf8")); const T = j.turns ?? [];
  for (let i = 1; i < T.length; i++) { const heard = T[i - 1].teacher, s = T[i].child?.sent; if (typeof heard !== "string" || typeof s !== "string") continue; pairs++;
    if (requestOf(s)) continue; const r = offerAgreed(heard, s); if (!r) continue; read++; by[r.type] = (by[r.type] ?? 0) + 1; if (ex.length < 15) ex.push(`${r.type} | ${s} | ${heard.slice(-110)}`); } }
console.log(files.length, "records;", pairs, "(her line, reply) pairs;", read, "newly read as her offer", JSON.stringify(by));
for (const e of ex) console.log("  ", e);
