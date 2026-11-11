// Seams sweep 7: every foreign key to child / guardian / lesson in db/migrations, and its ON DELETE rule. A child or
// account erase (server/routes/account.js) deletes `consent`, then `child` (or `guardian`) and relies on cascades: a
// reference with no ON DELETE CASCADE / SET NULL makes that delete fail once a row exists. Also lists tables that carry a
// bare child_id / lesson_id column with no foreign key (rows an erase leaves behind). Run: node …/fk.mjs
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
const ROOT = new URL("../../../../../", import.meta.url).pathname;
const dir = join(ROOT, "db/migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const strip = (s) => s.replace(/--[^\n]*/g, "");
const refs = [], bare = [];
for (const f of files) {
  const t = strip(readFileSync(join(dir, f), "utf8"));
  for (const m of t.matchAll(/create table(?: if not exists)?\s+([\w.]+)\s*\(([\s\S]*?)\n\);/gi)) {
    const [_, table, body] = m;
    for (const col of body.split(/,\s*\n/)) {
      const c = col.trim();
      const r = c.match(/^(\w+)\s+[^,]*?references\s+([\w.]+)\s*(?:\(\s*\w+\s*\))?([^,]*)/i);
      if (r && /^(child|guardian|lesson)$/i.test(r[2])) refs.push({ f, table, col: r[1], to: r[2], rule: (r[3].match(/on delete (cascade|set null|restrict|no action|set default)/i)?.[1] ?? "NONE").toLowerCase() });
      else { const b = c.match(/^(child_id|lesson_id|guardian_id)\s+(uuid|text)\b/i); if (b && !/references/i.test(c)) bare.push({ f, table, col: b[1] }); }
    }
  }
  for (const m of t.matchAll(/alter table\s+(?:if exists\s+)?([\w.]+)\s+add column(?: if not exists)?\s+(\w+)\s+[^;]*?references\s+(child|guardian|lesson)\b[^;]*?(on delete (cascade|set null|restrict))?[;,]/gi))
    refs.push({ f, table: m[1], col: m[2], to: m[3], rule: (m[5] ?? "NONE").toLowerCase() });
}
console.log("== references to child/guardian/lesson without ON DELETE CASCADE or SET NULL");
for (const r of refs) if (!/cascade|set null/.test(r.rule)) console.log(`  ${r.f}  ${r.table}.${r.col} -> ${r.to}  (${r.rule})`);
console.log(`\n== child_id / lesson_id / guardian_id columns with no foreign key (${bare.length})`);
for (const b of bare) console.log(`  ${b.f}  ${b.table}.${b.col}`);
console.log(`\n${refs.length} references read`);
