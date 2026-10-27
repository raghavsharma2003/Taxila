import fs from "node:fs"; import path from "node:path";
import { readability } from "/home/user/Taxila/server/safety/normalize.js";
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
for (const d of process.argv.slice(2)) walk(d);
const lines = new Map();
for (const f of files) { let j; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; } for (const t of j.turns ?? []) for (const s of [t.child?.asr?.text, t.child?.sent]) if (typeof s === "string" && s.trim()) lines.set(s, (lines.get(s) ?? 0) + 1); }
let unread = 0; const byShare = [];
for (const [s] of lines) { const r = readability(s); if (!r.unreadable) continue; unread++; const letters = s.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length; byShare.push({ share: r.share, letters, bad: r.tokens.join(" "), s: s.slice(0, 110) }); }
console.log(files.length, "records,", lines.size, "unique lines,", unread, "unreadable");
for (const th of [0.15, 0.2, 0.25, 0.34, 0.5]) console.log(`share < ${th} and >= 3 readable words: ${byShare.filter((x) => x.share < th && x.letters * (1 - x.share) >= 3).length}`);
for (const x of byShare.sort((a, b) => a.share - b.share)) console.log(x.share.toFixed(2), x.letters, "|", x.bad, "|", x.s);
