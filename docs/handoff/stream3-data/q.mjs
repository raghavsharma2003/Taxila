const { q } = await import("/home/user/Taxila/server/db.js");
const u = new URL(process.env.DATABASE_URL), t = new URL(process.env.TEST_DATABASE_URL);
if (u.host !== t.host) throw new Error("not test");
const r = await q(`select kind, src, data->>'_truncated' tr, left(data::text, 200) d, t from trace_event where kind='srv.res' and data->>'route' is null order by t desc limit 10`);
console.log(r);
const k = await q(`select kind, src, count(*)::int from trace_event where kind like 'srv.%' group by 1,2`); console.log(k);
process.exit(0);
