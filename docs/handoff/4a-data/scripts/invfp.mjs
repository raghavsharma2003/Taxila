// READ-ONLY on TEST: worked_example teacher lines whose numbers are not in their kit's worked example (or the child line
// before). Counts plus a few teacher lines (never child words). Url never printed.
if (!process.env.TEST_DATABASE_URL) throw new Error("no TEST url");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = ""; process.env.TAXILA_DB = ""; delete process.env.CONDUCTOR_TEST_DATABASE_URL;
const { q } = await import("/home/user/Taxila/server/db.js");
const { foreignNumbers } = await import("/home/user/Taxila/server/brain/say.js");
const { kitFromFile } = await import("/home/user/Taxila/server/content/kits.js");
const { getTopic } = await import("/home/user/Taxila/server/content/curriculum.js");
const cols = (await q(`select column_name from information_schema.columns where table_name = 'lesson'`)).map((r) => r.column_name);
const tcol = cols.includes("topic_id") ? "topic_id" : cols.find((c) => /topic/.test(c));
const rows = await q(`select t.lesson_id, t.seq, t.speaker, t.text, t.meta->>'move' as move, l.${tcol} as topic from turn t join lesson l on l.id = t.lesson_id where t.speaker in ('child','teacher') order by t.lesson_id, t.seq`);
const kits = new Map(); const kitOf = (id) => { if (!kits.has(id)) { let k = null; try { const tp = getTopic(id); k = tp ? kitFromFile(tp) : null; } catch {} kits.set(id, k); } return kits.get(id); };
let prev = null; const c = { worked: 0, withKitExample: 0, foreign: 0 }; const ex = [];
for (const r of rows) {
  if (r.speaker === "child") { prev = r; continue; }
  if (r.move !== "worked_example") continue;
  c.worked++; const kit = kitOf(r.topic); if (!kit?.workedExample) continue; c.withKitExample++;
  const f = foreignNumbers(r.text, { kit, childText: prev?.lesson_id === r.lesson_id ? prev.text : "" });
  if (f.length) { c.foreign++; if (ex.length < 25) ex.push(`[${f.join(",")}] ${r.text.slice(0, 150)}`); }
}
console.log(c); for (const e of ex) console.log("-", e); process.exit(0);
