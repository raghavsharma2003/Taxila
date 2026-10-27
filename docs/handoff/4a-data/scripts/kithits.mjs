import fs from "fs";
const [safetyPath] = process.argv.slice(2);
const { scanSafety } = await import(safetyPath);
let n = 0; const hits = [];
const visit = (o) => { if (typeof o === "string") { if (o.length < 400) { n++; const s = scanSafety(o); if (s.distress) hits.push(`${s.kind}|${o}`); } } else if (Array.isArray(o)) o.forEach(visit); else if (o && typeof o === "object") Object.values(o).forEach(visit); };
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((f) => f.endsWith(".json"))) visit(JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f, "utf8")));
console.log(n, hits.length); fs.writeFileSync(process.argv[3], hits.join("\n"));
