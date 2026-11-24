// READ-ONLY: TEST child turns matching the round-2 drafts; counts and the request read today. No child words printed.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = "";
const { q } = await import("/home/user/Taxila/server/db.js");
const { CHAPTER, EXPLAIN_FIRST } = await import(process.argv[2] + "/r2pat.mjs");
const { requestOf, romanLine } = await import("/home/user/Taxila/server/director/requests.js");
const rows = await q(`select text from turn where speaker = 'child' and length(text) > 0`);
const c = { n: rows.length, chapter: 0, explainFirst: 0, todayCh: {}, todayEf: {}, words: [] };
for (const { text } of rows) { const r = romanLine(text); const t = requestOf(text)?.type ?? "-";
  if (CHAPTER.test(r)) { c.chapter++; c.todayCh[t] = (c.todayCh[t] ?? 0) + 1; c.words.push(r.split(/\s+/).length); }
  if (EXPLAIN_FIRST.test(r)) { c.explainFirst++; c.todayEf[t] = (c.todayEf[t] ?? 0) + 1; } }
console.log(JSON.stringify(c)); process.exit(0);
