// both-arms diff over every string in data/kits, data/curriculum (JSON) and string literals in evals/** and tests/** sources
import fs from "fs"; import path from "path";
const [treeA, treeB, root = "/home/user/Taxila"] = process.argv.slice(2);
const A = (await import(`${treeA}/server/director/safety.js`)).scanSafetyDetail, B = (await import(`${treeB}/server/director/safety.js`)).scanSafetyDetail;
const strings = new Map(); // text -> source
const add = (t, src) => { t = String(t); if (t.length >= 3 && t.length < 400 && /\p{L}/u.test(t) && !strings.has(t)) strings.set(t, src); };
const visit = (o, src) => { if (typeof o === "string") add(o, src); else if (Array.isArray(o)) o.forEach((x) => visit(x, src)); else if (o && typeof o === "object") Object.values(o).forEach((x) => visit(x, src)); };
const walk = (d, f) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/node_modules|results\/.*\/lessons/.test(p)) walk(p, f); } else f(p); } };
let kit = 0;
for (const dir of ["data/kits", "data/curriculum"]) walk(path.join(root, dir), (p) => { if (p.endsWith(".json")) { try { visit(JSON.parse(fs.readFileSync(p, "utf8")), path.relative(root, p)); } catch {} } });
kit = strings.size;
const LIT = /"((?:[^"\\\n]|\\.){3,399})"|'((?:[^'\\\n]|\\.){3,399})'|`([^`$\\]{3,399})`/g;
for (const dir of ["evals", "tests"]) walk(path.join(root, dir), (p) => {
  if (/\.(mjs|js|ts)$/.test(p)) { const src = fs.readFileSync(p, "utf8"); for (const m of src.matchAll(LIT)) { let t = m[1] ?? m[2] ?? m[3]; try { if (m[1] != null) t = JSON.parse(`"${m[1]}"`); } catch {} add(t, path.relative(root, p)); } }
  else if (p.endsWith(".json") && fs.statSync(p).size < 30e6) { try { visit(JSON.parse(fs.readFileSync(p, "utf8")), path.relative(root, p)); } catch {} }
});
let a = 0, b = 0; const removed = [], added = [];
for (const [t, src] of strings) { const x = A(t), y = B(t); if (x.distress) a++; if (y.distress) b++; if (x.distress && !y.distress) removed.push(`${x.via} | ${src} | ${t}`); if (!x.distress && y.distress) added.push(`${y.via} | ${src} | ${t}`); }
console.log(`strings ${strings.size} (data/kits + data/curriculum ${kit}); firing A ${a}, B ${b}; removed ${removed.length}; NEW ${added.length}`);
for (const r of removed) console.log("  removed:", r.slice(0, 260)); for (const r of added) console.log("  NEW:", r.slice(0, 260));
