import { neon } from "/home/user/Taxila/node_modules/@neondatabase/serverless/index.mjs";
const sql = neon(process.env.CONDUCTOR_TEST_DATABASE_URL || process.env.TEST_DATABASE_URL);
const L = "38aad918-8130-44b3-a1a8-87e60303deab";
const r = await sql.query("select count(*)::int n, min(t) a, max(t) b from trace_event where sid=$1 or pid=$1 or data::text like $2", [L, "%38aad918%"]);
console.log(r[0]);
const last = await sql.query("select max(at) from lesson"); console.log("latest lesson on this branch", last[0]);
