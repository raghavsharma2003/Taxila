import fs from "node:fs"; import path from "node:path";
const SP = "/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad";
const OLD = (await import(SP + "/pb/server/director/requests.js")).requestOf, NEW = (await import("/home/user/Taxila/server/director/requests.js")).requestOf;
const SPLIT = /(?<=[.!?।…])\s+|[,;]\s+|\s+(?:par|lekin|magar|but|aur\s+phir)\s+/iu;
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
walk(SP + "/sl3/evals"); walk(SP + "/dg/evals"); walk(SP + "/sl144");
const lines = new Set(); for (const f of files) { let j; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; } for (const t of j.turns ?? []) { const s = t.child?.sent; if (typeof s === "string" && s.trim()) lines.add(s); } }
for (const s of lines) { const a = OLD(s), b = NEW(s); if (a || !b) continue; const parts = s.split(SPLIT).map((x) => x.trim()).filter(Boolean); const c = b.clause === "lead" ? parts[0] : parts.at(-1); console.log(b.type.padEnd(13), b.clause, "|", JSON.stringify(c)); }
