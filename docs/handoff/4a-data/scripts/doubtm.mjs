// READ-ONLY on TEST: teacher lines right after a child turn graded correct that praiseProblem(…, "correct") calls
// "contradicts" (a deny, a claimed mistake or, after this change, doubt). Counts and teacher lines only. Url never printed.
if (!process.env.TEST_DATABASE_URL) throw new Error("no TEST url");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = ""; process.env.TAXILA_DB = ""; delete process.env.CONDUCTOR_TEST_DATABASE_URL;
const { q } = await import("/home/user/Taxila/server/db.js");
const { praiseProblem } = await import("/home/user/Taxila/server/director/say.js");
const rows = await q(`select t.lesson_id, t.seq, t.speaker, t.text, (select string_agg(e.outcome, ',') from evidence e where e.turn_id = t.id) as outs from turn t where t.speaker in ('child','teacher') order by t.lesson_id, t.seq`);
let prev = null, after = 0, hit = 0; const ex = [];
for (const r of rows) { if (r.speaker === "child") { prev = r; continue; }
  if (!(prev && prev.lesson_id === r.lesson_id && /(^|,)correct(,|$)/.test(prev.outs ?? ""))) continue; after++;
  if (praiseProblem(r.text, "correct") === "contradicts") { hit++; if (ex.length < 10) ex.push(r.text.slice(0, 140)); } }
console.log({ teacherLinesAfterCorrect: after, contradicts: hit }); for (const e of ex) console.log("-", e); process.exit(0);
