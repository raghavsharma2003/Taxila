process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = "";
const { q } = await import("/home/user/Taxila/server/db.js");
console.log(JSON.stringify(await q(`select id, topic_id, started_at from lesson where id::text like '38aad918%'`)));
console.log(JSON.stringify(await q(`select max(started_at) as latest, count(*)::int as n from lesson`)));
process.exit(0);
