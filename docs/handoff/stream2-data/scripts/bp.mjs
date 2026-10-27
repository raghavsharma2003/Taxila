import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const rows = await sql.query("select b.intent_id, b.seq, b.script from board_page b where b.topic_id = $1 order by b.created_at desc limit 4", [process.argv[2]]);
const { boardAt, contractBox } = await import("/home/user/Taxila/server/forge3/tray-gate.js");
const { textUnits, minPxAt } = await import("/home/user/Taxila/src/studio/boardFit.ts");
for (const r of rows) { const s = r.script; console.log(r.intent_id, s.board, s.ops.length, JSON.stringify(s.ops.filter(o=>["text","label"].includes(o.op)).map(o=>[o.op,o.size,o.text])).slice(0,300), JSON.stringify(boardAt(s, contractBox("p360"))), textUnits(s)); }
