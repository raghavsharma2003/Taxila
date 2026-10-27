// READ-ONLY: graded child answers on the TEST branch (text, item, recorded outcome). The url is never printed.
import fs from "node:fs";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = "";
const { q } = await import("/home/user/Taxila/server/db.js");
const rows = await q(`select t.text, e.item_id, e.outcome, e.probe from evidence e join turn t on t.id = e.turn_id
  where t.speaker = 'child' and e.item_id is not null and length(t.text) > 0`);
const seen = new Set(); const out = [];
for (const r of rows) { const k = `${r.text}\u0000${r.item_id}`; if (seen.has(k)) continue; seen.add(k); out.push(r); }
fs.writeFileSync(process.argv[2], JSON.stringify(out));
const c = {}; for (const r of out) c[r.outcome] = (c[r.outcome] ?? 0) + 1;
console.log(rows.length, "evidence rows;", out.length, "unique (text, item) pairs;", JSON.stringify(c));
process.exit(0);
