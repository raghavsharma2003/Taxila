import fs from "node:fs"; import path from "node:path";
const A = await import("/home/user/Taxila/server/director/zz-a.js"), B = await import("/home/user/Taxila/server/director/zz-b.js"), C = await import("/home/user/Taxila/server/director/requests.js");
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
const lines = new Set(); for (const f of walk(root)) for (const t of JSON.parse(fs.readFileSync(f, "utf8")).turns ?? []) { const s = t.child?.sent; if (typeof s === "string" && s.trim()) lines.add(s); }
const diff = (X, Y, label) => { const out = []; for (const s of lines) { const a = JSON.stringify([X.visualAskOf(s), X.requestOf(s), X.freeSubjectOf(s)]), b = JSON.stringify([Y.visualAskOf(s), Y.requestOf(s), Y.freeSubjectOf(s)]); if (a !== b) out.push(`${X.visualAskOf(s)?.subject ?? "-"} -> ${Y.visualAskOf(s)?.subject ?? "-"}`); } console.log(label, out.length, JSON.stringify(out)); };
console.log("lines", lines.size); diff(A, B, "दी:"); diff(B, C, "seen-in:");
