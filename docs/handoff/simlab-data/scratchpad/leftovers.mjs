import "/home/user/Taxila/evals/simlab/lib.mjs";
const url = process.env.DATABASE_URL ?? "";
if (!url.includes(process.env.SIMLAB_DB_HOST || "ep-winter-tooth")) throw new Error("not the TEST database: refusing");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(url);
const cols = await sql.query("select column_name from information_schema.columns where table_name='guardian'");
console.log(cols.map(c=>c.column_name).join(","));
const rows = await sql.query("select email, created_at from guardian where email like 'simlab+%' and created_at > now() - interval '30 minutes' order by created_at");
for (const r of rows) console.log(r.email.replace(/-\d+[a-z0-9]*@/, "-…@"), r.created_at);
