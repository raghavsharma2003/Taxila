// READ-ONLY: TEST teacher turns whose reply was the fixed fallback ("unavailable"); the url is never printed.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = "";
const { q } = await import("/home/user/Taxila/server/db.js");
const all = await q(`select count(*)::int n from turn where speaker <> 'child'`);
const rows = await q(`select t.lesson_id, t.seq, t.meta from turn t where t.speaker <> 'child' and t.meta::text ~ '(unavailable|fallback_reply)'`);
console.log(all[0].n, "teacher turns;", rows.length, "fallback");
const prev = async (r) => (await q(`select meta from turn where lesson_id = $1 and seq < $2 and speaker = 'child' order by seq desc limit 1`, [r.lesson_id, r.seq]))[0]?.meta ?? {};
console.log(JSON.stringify(rows[0].meta).slice(0, 600));
const c = {};
for (const r of rows) { const m = r.meta ?? {}; const req = m.move?.request ?? m.request ?? null; const mv = typeof m.move === "string" ? m.move : m.move?.kind; const k = `${mv} req=${m.request ?? m.move?.request ?? "-"}`; c[k] = (c[k] ?? 0) + 1; }
console.log(JSON.stringify(c, null, 1));
console.log("meta keys sample:", rows[0] ? Object.keys(rows[0].meta ?? {}).join(",") : "-");
process.exit(0);
