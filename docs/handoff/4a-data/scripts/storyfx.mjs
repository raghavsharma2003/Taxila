import fs from "node:fs"; import path from "node:path";
const O = await import(process.argv[2] + "/oldreq/requests.js"), N = await import("/home/user/Taxila/server/director/requests.js");
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
walk(process.argv[3]);
const lines = new Set();
for (const f of files) { let j; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; } for (const t of j.turns ?? []) for (const s of [t.child?.sent, t.child?.asr?.text, t.child?.say]) if (typeof s === "string" && s.trim()) lines.add(s); }
let moved = 0, story = 0;
for (const s of lines) { const a = JSON.stringify(O.requestOf(s)), b = JSON.stringify(N.requestOf(s)); if (O.requestOf(s)?.type === "story") story++; if (a !== b) { moved++; console.log("MOVED", s, "::", a, "->", b); } }
console.log(files.length, "records,", lines.size, "lines,", story, "read as story before,", moved, "moved");
