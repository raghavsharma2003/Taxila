import fs from "node:fs"; import path from "node:path";
const B = await import("/home/user/Taxila/server/director/requests.js");
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
const lines = new Set(); for (const f of walk(root)) for (const t of JSON.parse(fs.readFileSync(f, "utf8")).turns ?? []) { const s = t.child?.sent; if (typeof s === "string" && s.trim()) lines.add(s); }
const c = new Map();
for (const s of lines) { const a = B.freeSubjectOf(s), v = B.visualAskOf(s)?.subject ?? null; const b = v ?? a; if (a !== b) c.set(`${a}->${b}`, (c.get(`${a}->${b}`) ?? 0) + 1); }
console.log(c.size, [...c].map(([k, v]) => `${k}${v > 1 ? "×" + v : ""}`).join(", "));
