import fs from "node:fs"; import path from "node:path";
const SP = "/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad";
const root = process.argv[2] ?? "/home/user/Taxila";
const { requestOf } = await import(root + "/server/director/requests.js");
const { findTopic } = await import(root + "/server/content/curriculum.js");
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
walk(SP + "/sl3/evals"); walk(SP + "/dg/evals"); walk(SP + "/sl144");
const seen = new Map();
for (const f of files) { let j; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; } const cl = Number(String(j.persona?.id ?? j.persona ?? path.basename(f)).match(/-c(\d)-/)?.[1] ?? 0); if (!cl) continue;
  for (const t of j.turns ?? []) { const s = t.child?.sent; if (!s) continue; const r = requestOf(s); if (!r || !["switch", "topic"].includes(r.type) || !r.subject) continue; const k = `${cl}|${r.subject.toLowerCase()}`; if (!seen.has(k)) seen.set(k, { cl, subject: r.subject, type: r.type }); } }
let hit = 0, miss = 0; const misses = [];
for (const { cl, subject, type } of seen.values()) { const t = findTopic(subject, cl); if (t) hit++; else { miss++; misses.push(`c${cl} ${type} "${subject}"`); } }
console.log(seen.size, "distinct (class, named subject) asks;", hit, "find a chapter;", miss, "do not");
for (const m of misses) console.log("   ", m);
