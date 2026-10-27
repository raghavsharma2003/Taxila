// Delete the TEST accounts left by the stopped 8b492c75 run, through the normal DELETE /api/account route.
import "./evals/simlab/lib.mjs";
import { randomBytes } from "crypto";
const url = process.env.DATABASE_URL ?? "";
if (!url.includes(process.env.SIMLAB_DB_HOST || "ep-winter-tooth")) throw new Error("not the TEST database: refusing");
const { neon } = await import("@neondatabase/serverless");
const { hashSecret } = await import(process.env.W + "/server/routes/parent.js");
const sql = neon(url);
const B = "http://127.0.0.1:8845";
const rows = await sql.query("select id, email from guardian where email like 'simlab+%' and created_at between '2026-10-21T17:32:00Z' and '2026-10-21T17:34:00Z'");
for (const g of rows) {
  const pw = "cleanup-" + randomBytes(9).toString("hex");
  await sql.query("update guardian set pw_hash = $2 where id = $1", [g.id, await hashSecret(pw)]);
  const li = await fetch(B + "/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: g.email, password: pw }) });
  const cookie = (li.headers.get("set-cookie") || "").split(";")[0];
  const del = await fetch(B + "/api/account", { method: "DELETE", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ password: pw, confirm: true }) });
  const body = await del.text();
  console.log(g.email.replace(/-\d+[a-z0-9]*@/, "-…@"), "login", li.status, "delete", del.status, /erase_review/.test(body) ? "erase_review" : "");
}
