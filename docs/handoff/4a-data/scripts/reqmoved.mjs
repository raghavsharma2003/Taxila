import fs from "node:fs"; import path from "node:path";
const O = await import(process.argv[2] + "/oldreq2/requests.js"), N = await import("/home/user/Taxila/server/director/requests.js");
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
for (const d of process.argv.slice(3)) walk(d);
const lines = new Set();
for (const f of files) { let j; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; } for (const t of j.turns ?? []) for (const s of [t.child?.sent, t.child?.asr?.text, t.child?.say]) if (typeof s === "string" && s.trim()) lines.add(s); }
const key = (r) => r ? `${r.type}${r.kind ? "/" + r.kind : ""}${r.subject ? ":" + r.subject : ""}` : "-";
let deva = 0; const moved = [];
for (const s of lines) { if (/[ऀ-ॿ]/.test(s)) deva++;
  const a = key(O.requestOf(s)), b = key(N.requestOf(s)), c = O.switchSubjectOf(s) ?? "-", d = N.switchSubjectOf(s) ?? "-";
  if (a !== b || c !== d) moved.push(`${a} -> ${b}${c !== d ? ` [switch ${c} -> ${d}]` : ""} | ${s.slice(0, 140)}`); }
console.log(files.length, "records,", lines.size, "child lines,", deva, "Devanagari; moved", moved.length);
for (const m of moved.sort()) console.log("  ", m);
