// READ-ONLY on TEST: teacher lines that claimsMistake() reads, split by the child turn before it (graded wrong or not).
// Prints counts only, plus teacher lines (never child words). The url is never printed.
if (!process.env.TEST_DATABASE_URL) throw new Error("no TEST url");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = ""; process.env.TAXILA_DB = ""; delete process.env.CONDUCTOR_TEST_DATABASE_URL;
const { q } = await import("/home/user/Taxila/server/db.js");
const { claimsMistake } = await import("/home/user/Taxila/server/director/say.js");
const rows = await q(`select t.lesson_id, t.seq, t.speaker, t.text, t.meta->>'move' as move, t.meta->'guard' as guard, (select string_agg(e.outcome||'/'||coalesce(e.item_id,''), ',') from evidence e where e.turn_id = t.id) as ev, (select string_agg(e.outcome, ',') from evidence e where e.turn_id = t.id) as outs
  from turn t where t.speaker in ('child','teacher') order by t.lesson_id, t.seq`);
let teacher = 0, hits = { graded_wrong: 0, other: 0 }; const ex = [];
let prev = null;
for (const r of rows) {
  if (r.speaker === "child") { prev = r; continue; }
  teacher++;
  if (!claimsMistake(r.text)) continue;
  const wrong = prev && prev.lesson_id === r.lesson_id && /incorrect|misconception|partial/.test(prev.outs ?? "");
  hits[wrong ? "graded_wrong" : "other"]++;
  if (!wrong) ex.push(`[move ${r.move} guard ${JSON.stringify(r.guard)} | prev child: evidence ${prev?.ev ?? 'none'} words ${String(prev?.text ?? '').split(/\s+/).length}] ${r.text.slice(0, 90)}`);
}
console.log({ teacherLines: teacher, hits });
for (const t of ex.slice(0, 40)) console.log("-", t);
process.exit(0);
