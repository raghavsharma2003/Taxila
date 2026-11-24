import fs from "node:fs"; import path from "node:path";
const A = await import("/home/user/Taxila/server/director/zz-before.js"), B = await import("/home/user/Taxila/server/director/requests.js");
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
const lines = new Set();
for (const f of walk(root)) for (const t of JSON.parse(fs.readFileSync(f, "utf8")).turns ?? []) { const s = t.child?.sent; if (typeof s === "string" && s.trim()) lines.add(s); }
let n = 0, fs1 = 0; const moved = [];
for (const s of lines) {
  const a = [JSON.stringify(A.visualAskOf(s)), A.freeSubjectOf(s), JSON.stringify(A.requestOf(s))], b = [JSON.stringify(B.visualAskOf(s)), B.freeSubjectOf(s), JSON.stringify(B.requestOf(s))];
  if (a[1]) fs1++;
  if (a.join("|") !== b.join("|")) moved.push({ before: a, after: b });
  n++;
}
console.log(JSON.stringify({ childLines: n, freeSubjectBefore: fs1, moved: moved.length }));
const kept=[];for (const m of moved){ if (m.before[0]!==m.after[0]) console.log("VISUAL", m.before[0], "->", m.after[0]); if (m.before[2]!==m.after[2]) console.log("REQ", m.before[2], "->", m.after[2]); if (m.after[1]) kept.push(m.after[1]); } console.log("free subjects after (moved lines):", JSON.stringify(kept)); const B2=B; let after=0; for (const s of lines) if (B2.freeSubjectOf(s)) after++; console.log("freeSubjectAfter", after);
