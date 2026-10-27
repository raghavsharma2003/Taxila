// READ-ONLY: QA lessons 12fbd625 / a769071e on TEST, turns 1-4: speaker, seq, meta, evidence. The url is never printed.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = "";
const { q } = await import("/home/user/Taxila/server/db.js");
for (const pre of ["12fbd625", "a769071e"]) {
  const L = await q(`select id, topic_id from lesson where id::text like $1`, [pre + "%"]);
  if (!L.length) { console.log(pre, "not on TEST"); continue; }
  console.log(pre, L[0].topic_id);
  const T = await q(`select t.id, t.seq, t.speaker, t.text, t.meta from turn t where t.lesson_id = $1 order by t.seq limit 7`, [L[0].id]);
  for (const t of T) {
    const ev = await q(`select item_id, outcome, probe from evidence where turn_id = $1`, [t.id]);
    console.log(" ", t.seq, t.speaker, t.speaker === "child" ? t.text : String(t.text).slice(0, 140), JSON.stringify(t.meta ?? {}).slice(0, 300), JSON.stringify(ev));
  }
}
process.exit(0);
