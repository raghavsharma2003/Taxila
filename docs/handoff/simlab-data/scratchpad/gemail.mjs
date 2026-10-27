import { readFileSync } from "fs";
for (const l of readFileSync("/home/user/Taxila/.env.local","utf8").split("\n")) { const m=l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]]=m[2].replace(/^"|"$/g,""); }
const { neon } = await import("/home/user/Taxila/node_modules/@neondatabase/serverless/index.mjs");
const url = process.env.DATABASE_URL; if (!/ep-winter-tooth/.test(url)) throw new Error("not TEST");
const sql = neon(url);
const rows = await sql`select email, length(email) n from guardian where email like '%rel141v%' limit 5`;
console.log(rows);
