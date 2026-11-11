import fs from "node:fs"; import path from "node:path";
import { CHAPTER, EXPLAIN_FIRST } from "./r2pat.mjs";
import { requestOf, romanLine } from "/home/user/Taxila/server/director/requests.js";
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
walk("sl3/evals"); walk("dg/evals");
const lines = new Set(); for (const f of files) { const j = JSON.parse(fs.readFileSync(f, "utf8")); for (const t of j.turns ?? []) { const s = t.child?.sent ?? t.child?.asr?.text; if (typeof s === "string" && s.trim()) lines.add(s); } }
let ch = 0, ef = 0;
for (const s of lines) { const r = romanLine(s); const c = CHAPTER.test(r), e = EXPLAIN_FIRST.test(r); if (c) ch++; if (e) ef++; if (c || e) console.log(c ? "CH" : "EF", "|", requestOf(s)?.type ?? "-", "|", s.slice(0, 140)); }
console.log(lines.size, "sim-lab lines; chapter", ch, "explain-first", ef);
