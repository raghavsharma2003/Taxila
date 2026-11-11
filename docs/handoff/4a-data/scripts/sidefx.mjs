import fs from "node:fs"; import path from "node:path";
const O = await import(process.argv[2] + "/oldsn/spoken-number.js"), N = await import("/home/user/Taxila/server/grading/spoken-number.js");
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
for (const d of process.argv.slice(3)) walk(d);
const lines = new Set();
for (const f of files) { let j; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; } for (const t of j.turns ?? []) for (const s of [t.child?.sent, t.child?.asr?.text, t.child?.say]) if (typeof s === "string" && s.trim()) lines.add(s); }
const fns = { phrases: (m, s) => m.numberPhrases(s), split: (m, s) => m.numberPhrases(s, { split: true }), one: (m, s) => m.spokenNumber(s), units: (m, s) => m.unitsAfterNumbers(s), stated: (m, s) => m.statedResults(s), corr: (m, s) => m.selfCorrected(s) };
const moved = {}; let deva = 0;
for (const s of lines) { if (/[ऀ-ॿ]/.test(s)) deva++; for (const [k, f] of Object.entries(fns)) { const a = JSON.stringify(f(O, s)), b = JSON.stringify(f(N, s)); if (a !== b) (moved[k] ??= []).push(`${s} :: ${a} -> ${b}`); } }
console.log(files.length, "records,", lines.size, "child lines,", deva, "Devanagari");
for (const [k, v] of Object.entries(fns)) console.log(k, (moved[k] ?? []).length);
for (const v of Object.values(moved)) for (const x of v.slice(0, 15)) console.log("  ", x);
