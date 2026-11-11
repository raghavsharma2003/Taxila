const REPO = "/home/user/Taxila/";
import fs from "node:fs"; import http from "node:http"; import { createHash, randomUUID } from "node:crypto";
for (const line of fs.readFileSync(REPO + ".env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1"); }
for (const line of fs.readFileSync(REPO + "tests/prod/prod-routing.env", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) process.env[m[1]] = m[2]; }
process.env.TAXILA_DB = "test"; process.env.TAXILA_DEBUG = "1";
const { handle } = await import(REPO + "server/index.js");
const { q, one } = await import(REPO + "server/db.js"); const { hashPassword } = await import(REPO + "server/auth.js");
const T = {};
const s = http.createServer((req, res) => { const t0 = performance.now(); T.in = t0; res.on("finish", () => { T.finish = performance.now(); }); const w = res.end.bind(res); res.end = (...a) => { T.end = performance.now(); return w(...a); }; return handle(req, res); });
await new Promise((r) => s.listen(0, "127.0.0.1", r)); const B = `http://127.0.0.1:${s.address().port}`;
const g = (await one("insert into guardian (email, pw_hash, name) values ($1, $2, 'r5') returning id", [`r5-cold+${randomUUID().slice(0,8)}@test.invalid`, hashPassword("x")])).id;
const tok = randomUUID() + randomUUID();
await q("insert into auth_session (token_hash, guardian_id, expires_at) values ($1, $2, now() + interval '1 day')", [createHash("sha256").update(tok).digest("hex"), g]);
for (const p of ["core_tutoring", "memory", "learning_profile"]) await q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, $2, 't', true, 't')", [g, p]);
for (let i = 0; i < 2; i++) {
  const kid = (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1, 'Riya', 4, 'hinglish', 'asha') returning id", [g])).id;
  await q("insert into child_controls (child_id, daily_minutes, hours_start, hours_end) values ($1, 45, '00:00', '23:59')", [kid]);
  const c0 = performance.now();
  const r = await fetch(B + "/api/lesson/start", { method: "POST", headers: { cookie: `tx_session=${tok}`, "content-type": "application/json" }, body: JSON.stringify({ childId: kid, mode: "cascade" }) });
  const hdr = performance.now(); const j = await r.json(); const c1 = performance.now();
  const resp = j.debug.timings.find((t) => t.kind === "@respond").ms;
  console.log(`client ${Math.round(c1 - c0)} | in@${Math.round(T.in - c0)} handler respond@${Math.round(T.in - c0 + resp)} end()@${Math.round(T.end - c0)} finish@${Math.round(T.finish - c0)} headers@${Math.round(hdr - c0)} body@${Math.round(c1 - c0)}`);
}
await q("delete from guardian where id = $1", [g]); process.exit(0);
