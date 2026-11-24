// READ-ONLY on TEST: does lesson 87b610b3… exist; if so its teacher lines (never child words) with meta. Url never printed.
if (!process.env.TEST_DATABASE_URL) throw new Error("no TEST url");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = ""; process.env.TAXILA_DB = ""; delete process.env.CONDUCTOR_TEST_DATABASE_URL;
const { q } = await import("/home/user/Taxila/server/db.js");
const ls = await q(`select id from lesson where left(id::text,8) = any($1)`, [process.argv.slice(2)]);
console.log("lessons", ls.length);
for (const l of ls) for (const r of await q(`select seq, speaker, meta, case when speaker='teacher' then text else '[child, ' || length(text) || ' chars]' end as t from turn where lesson_id = $1 order by seq`, [l.id])) console.log(r.seq, r.speaker, JSON.stringify(r.meta)?.slice(0, 200), "|", r.t);
process.exit(0);
