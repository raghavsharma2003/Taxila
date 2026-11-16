// both-arms diff: every kit string (< 400 chars) and every eval / battery / held-out utterance, through scanSafetyDetail
import fs from "fs"; import path from "path";
const [treeA, treeB] = process.argv.slice(2);
const A = (await import(`${treeA}/server/director/safety.js`)).scanSafetyDetail, B = (await import(`${treeB}/server/director/safety.js`)).scanSafetyDetail;
const strings = new Set();
const visit = (o) => { if (typeof o === "string") { if (o.length < 400 && /\p{L}/u.test(o)) strings.add(o); } else if (Array.isArray(o)) o.forEach(visit); else if (o && typeof o === "object") Object.values(o).forEach(visit); };
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((f) => f.endsWith(".json"))) visit(JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f, "utf8")));
const kitN = strings.size;
for (const m of ["evals/conversation-v2/cases.mjs", "evals/conversation-r2/heldout-cases.mjs", "evals/conversation-session/dev-intake.mjs", "evals/conversation-session/heldout-intake.mjs", "evals/conversation-session/heldout2-intake.mjs", "evals/conversation-session/openings.mjs", "evals/conversation-session/heldout2-openings.mjs", "evals/conversation-session/dev-openings.mjs"]) {
  const p = "/home/user/Taxila/" + m; if (!fs.existsSync(p)) continue; const mod = await import(p); visit(Object.values(mod));
}
let a = 0, b = 0; const removed = [], added = [];
for (const t of strings) { const x = A(t), y = B(t); if (x.distress) a++; if (y.distress) b++; if (x.distress && !y.distress) removed.push(`${x.via} | ${t}`); if (!x.distress && y.distress) added.push(`${y.via} | ${t}`); }
console.log(`strings ${strings.size} (kit ${kitN}); firing A ${a}, B ${b}; removed ${removed.length}; NEW ${added.length}`);
for (const r of removed) console.log("  removed:", r.slice(0, 200)); for (const r of added) console.log("  NEW:", r.slice(0, 200));
