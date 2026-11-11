import fs from "node:fs"; import path from "node:path";
const SP = "/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad";
const OLD = (await import(SP + "/pb/server/director/requests.js")).requestOf, NEW = (await import("/home/user/Taxila/server/director/requests.js")).requestOf;
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
walk(SP + "/sl3/evals"); walk(SP + "/dg/evals"); walk(SP + "/sl144");
const lines = new Set(); for (const f of files) { let j; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; } for (const t of j.turns ?? []) { const s = t.child?.sent; if (typeof s === "string" && s.trim()) lines.add(s); } }
let moved = 0; const by = {};
for (const s of lines) { const a = OLD(s), b = NEW(s); const ka = a ? a.type + (a.whole ? "" : "~") : "-", kb = b ? b.type + (b.whole ? "" : "~") : "-"; if (ka === kb) continue; moved++; const k = `${ka} → ${kb}`; by[k] = (by[k] ?? 0) + 1; console.log(k.padEnd(22), "|", s.slice(0, 150)); }
console.log(lines.size, "sim-lab lines;", moved, "moved", JSON.stringify(by));
