import "/home/user/Taxila/evals/simlab/lib.mjs";
const url = process.env.DATABASE_URL ?? "";
if (!url.includes("ep-winter-tooth")) throw new Error("not TEST");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(url);
const cols = await sql.query("select column_name from information_schema.columns where table_name='guardian'");
console.log(cols.map(c=>c.column_name).join(","));
const rows = await sql.query("select id, created_at from guardian where email like 'simlab+p16-c7-science-chatty-%' and created_at between '2026-10-15 15:45' and '2026-10-15 16:00' order by created_at");
console.log(rows.length, rows.map(r=>`${String(r.id).slice(0,8)}… ${r.created_at.toISOString?.() ?? r.created_at}`));
