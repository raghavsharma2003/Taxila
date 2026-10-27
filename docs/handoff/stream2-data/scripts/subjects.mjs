import fs from "node:fs"; import path from "node:path";
const mod = await import(process.argv[2] ?? "/home/user/Taxila/server/director/requests.js");
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
const seen = new Map();
for (const f of walk(root)) for (const t of JSON.parse(fs.readFileSync(f, "utf8")).turns ?? []) {
  const s = t.child?.sent; if (typeof s !== "string" || !s.trim()) continue;
  if (seen.has(s)) continue;
  const v = mod.visualAskOf(s);
  seen.set(s, v ? (v.subject ?? `<${v.show}>`) : null);
}
const out = [...seen.entries()].filter(([, v]) => v !== null);
fs.writeFileSync(process.argv[3], JSON.stringify(Object.fromEntries(out), null, 1));
console.log(JSON.stringify({ childLines: seen.size, visualAsks: out.length, withSubject: out.filter(([, v]) => !v.startsWith("<")).length }));
