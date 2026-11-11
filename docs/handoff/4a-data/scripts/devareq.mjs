import fs from "node:fs"; import path from "node:path";
import { requestOf } from "/home/user/Taxila/server/director/requests.js";
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
for (const d of process.argv.slice(2)) walk(d);
const lines = new Set();
for (const f of files) { let j; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; } for (const t of j.turns ?? []) for (const s of [t.child?.sent, t.child?.asr?.text]) if (typeof s === "string" && /[ऀ-ॿ]/.test(s)) lines.add(s); }
const RX = /पढ़न|पढ़ते|पढ़ें|सीखन|कुछ और|कुछ अलग|दूसरा|बारे में|दिखाओ|दिखाइए|तस्वीर|चित्र|बनाओ|समझाओ|खेल|गेम|टॉपिक|बदल/;
let n = 0; const hits = [];
for (const s of lines) { if (!RX.test(s)) continue; n++; hits.push(`${requestOf(s)?.type ?? "-"} | ${s.slice(0, 130)}`); }
console.log(files.length, "records,", lines.size, "Devanagari lines,", n, "with a request-like word");
for (const h of hits) console.log("  ", h);
