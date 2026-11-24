// READ-ONLY: TEST lesson 38aad918 (QA account, main's repro), turns 1-12.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = "";
const { q } = await import("/home/user/Taxila/server/db.js");
const { requestOf } = await import("/home/user/Taxila/server/director/requests.js");
const T = await q(`select seq, speaker, text, meta from turn where lesson_id::text like '38aad918%' order by seq limit 30`);
for (const t of T) console.log(t.seq, t.speaker, t.speaker === "child" ? `${JSON.stringify(t.text)} → requestOf ${JSON.stringify(requestOf(t.text))}` : `[${typeof t.meta?.move === "string" ? t.meta.move : t.meta?.move?.kind}] ${String(t.text).slice(0, 110)}`);
process.exit(0);
