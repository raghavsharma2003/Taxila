import { neon } from "@neondatabase/serverless";
import { readdirSync } from "fs";
const sql = neon(process.env.DATABASE_URL);
const done = new Set((await sql.query("select name from schema_migrations")).map(r=>r.name));
console.log(readdirSync("db/migrations").filter(f=>f.endsWith(".sql")&&!done.has(f)));
