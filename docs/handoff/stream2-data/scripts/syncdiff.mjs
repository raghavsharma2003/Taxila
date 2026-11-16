import fs from "node:fs"; import path from "node:path";
const A = await import("/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/request-old.mjs");
const B = await import("/home/user/Taxila/server/studio/request.js");
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
let n = 0; const moved = [];
for (const f of walk(root)) {
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  // every teacher line against every page of its lesson: the predicate's full input space on real data
  const pages = (r.boardPages ?? []).map((p) => (String(p.board ?? "").match(/"([^"]*)"/g) ?? []).map((x) => x.slice(1, -1))).filter((t) => t.length);
  for (const t of r.turns ?? []) for (const texts of pages) {
    if (!t.teacher) continue; n++;
    const script = { ops: texts.map((x, i) => ({ id: "t" + i, op: "text", text: x })) };
    const a = A.syncedWithLine(script, t.teacher), b = B.syncedWithLine(script, t.teacher);
    if (a !== b) moved.push({ a, b, texts: texts.join("|").slice(0, 50), line: t.teacher.slice(0, 90) });
  }
}
console.log(JSON.stringify({ pairs: n, moved: moved.length, toSynced: moved.filter((x) => x.b).length, toUnsynced: moved.filter((x) => !x.b).length }));
const seen = new Set(); for (const x of moved) { const k = x.texts; if (seen.has(k + x.line.slice(0, 30))) continue; seen.add(k + x.line.slice(0, 30)); if (seen.size <= 40) console.log(JSON.stringify(x)); }
