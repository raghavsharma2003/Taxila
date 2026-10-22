import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const l = await sql.query("select l.id, l.ended_at, l.state->>'pendingEndAt' as pending, (select count(*) from turn t where t.lesson_id=l.id and t.speaker='child') as child_turns, l.child_id from lesson l where l.child_id = (select child_id from lesson where id = $1) order by started_at desc limit 3", [process.argv[2]]);
console.log(JSON.stringify(l));
const c = await sql.query("select purpose, granted from consent where child_id = $1 or (child_id is null and guardian_id = (select guardian_id from child where id = $1)) order by created_at", [l[0].child_id]);
console.log(JSON.stringify(c));
