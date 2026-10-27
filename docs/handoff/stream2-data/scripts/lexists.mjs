import { neon } from "/home/user/Taxila/node_modules/@neondatabase/serverless/index.mjs";
for (const k of ["TEST_DATABASE_URL", "CONDUCTOR_TEST_DATABASE_URL"]) {
  const sql = neon(process.env[k]);
  const r = await sql.query("select count(*)::int n, max(t.seq) mx from lesson l left join turn t on t.lesson_id=l.id where l.id=$1", ["38aad918-8130-44b3-a1a8-87e60303deab"]);
  const h = new URL(process.env[k]).hostname.split(".")[0];
  console.log(k, h.slice(0, 18), r[0]);
}
