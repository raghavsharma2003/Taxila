import fs from "node:fs"; import path from "node:path";
const B = await import("/home/user/Taxila/server/director/requests.js");
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
const lines = new Set(); for (const f of walk(root)) for (const t of JSON.parse(fs.readFileSync(f, "utf8")).turns ?? []) { const s = t.child?.sent; if (typeof s === "string" && s.trim()) lines.add(s); }
for (const s of lines) { const a = B.freeSubjectOf(s), v = B.visualAskOf(s)?.subject; if (["cake", "laddoo", "दी कोन"].includes(v) && a !== v) console.log(JSON.stringify(v), "free:", JSON.stringify(a), "|", s.slice(0, 200)); }
