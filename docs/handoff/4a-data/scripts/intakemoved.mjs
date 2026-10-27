import fs from "node:fs"; import path from "node:path";
const S = process.argv[2];
const OI = await import(S + "/oldsrc/server/director/session/intake.js"), OC = await import(S + "/oldsrc/server/director/session/candidates.js");
const NI = await import("/home/user/Taxila/server/director/session/intake.js"), NC = await import("/home/user/Taxila/server/director/session/candidates.js");
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : p.endsWith(".json") && p.includes("records") && files.push(p); } };
for (const d of process.argv.slice(3)) walk(d);
const lines = new Map();
for (const f of files) { const cl = Number(path.basename(f).match(/-c(\d)-/)?.[1] ?? 5); let j; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch { continue; }
  for (const t of j.turns ?? []) { const s = t.child?.sent ?? t.child?.asr?.text; if (typeof s === "string" && s.trim()) lines.set(`${cl}\u0000${s}`, { s, cl }); } }
const read = (I, C, s, cl) => { const f = I.intakeParse(s); const c = C.intakeCandidates(f, s, { classLevel: cl }); return `${f.kind}${c.top && c.p >= 0.6 ? " -> " + c.top.topicId : ""}`; };
const moved = []; let deva = 0;
for (const { s, cl } of lines.values()) { if (/[ऀ-ॿ]/.test(s)) deva++; const a = read(OI, OC, s, cl), b = read(NI, NC, s, cl); if (a !== b) moved.push(`c${cl} ${a}  =>  ${b} | ${s.slice(0, 110)}`); }
console.log(lines.size, "(class, line) pairs,", deva, "Devanagari; moved", moved.length);
const kinds = {}; for (const m of moved) { const k = m.replace(/ \| .*/, "").replace(/c\d /, "").replace(/ -> c\S+/g, " -> topic"); kinds[k] = (kinds[k] ?? 0) + 1; } console.log(kinds);
for (const m of moved.slice(0, 60)) console.log("  ", m);
