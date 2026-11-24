const REPO="/home/user/Taxila/"; import fs from "node:fs"; import http from "node:http"; import { createHash, randomUUID } from "node:crypto";
for (const line of fs.readFileSync(REPO + ".env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1"); }
process.env.TAXILA_DB = "test";
const { handle } = await import(REPO + "server/index.js"); const { q, one } = await import(REPO + "server/db.js"); const { hashPassword } = await import(REPO + "server/auth.js");
const s = http.createServer(handle); await new Promise((r) => s.listen(0, "127.0.0.1", r)); const B = `http://127.0.0.1:${s.address().port}`;
const g = (await one("insert into guardian (email, pw_hash, name) values ($1, $2, 'r5') returning id", [`r5-ov+${randomUUID().slice(0,8)}@test.invalid`, hashPassword("x")])).id;
const tok = randomUUID() + randomUUID();
await q("insert into auth_session (token_hash, guardian_id, expires_at) values ($1, $2, now() + interval '1 day')", [createHash("sha256").update(tok).digest("hex"), g]);
for (const p of ["core_tutoring", "memory", "learning_profile"]) await q("insert into consent (guardian_id, child_id, purpose, version, granted, method) values ($1, null, $2, 't', true, 't')", [g, p]);
const kid = (await one("insert into child (guardian_id, first_name, class_level, language_pref, teacher_id) values ($1, 'Riya', 4, 'hinglish', 'asha') returning id", [g])).id;
const H = { cookie: `tx_session=${tok}` };
const hit = async (lab) => { const t = performance.now(); const r = await fetch(`${B}/api/parent/overview?childId=${kid}`, { headers: H }); await r.text(); console.log(lab, r.status, Math.round(performance.now() - t), "ms"); };
await fetch(`${B}/api/health`);
const post = async (path, body) => { const r = await fetch(B + path, { method: "POST", headers: { ...H, "content-type": "application/json" }, body: JSON.stringify(body) }); const sc = r.headers.get("set-cookie"); if (sc) { const m = sc.match(/^([^=]+=[^;]+)/); if (m && !m[1].startsWith("tx_session")) H.cookie += `; ${m[1]}`; } return r.status; };
console.log("pin", await post("/api/parent/pin", { pin: "2580" }), "unlock", await post("/api/parent/unlock", { pin: "2580" }));
if (process.argv[2] === "kitsfirst") { const { warmSync, warmAsync } = await import(REPO + "server/boot-warm.js"); await warmSync(); await warmAsync(); }
await hit("overview cold"); await hit("overview warm"); await hit("overview warm2");
if (process.argv[2] === "kits") { const { warmKits } = await import(REPO + "server/boot-warm.js"); await warmKits(); await hit("after warmKits"); }
for (const p of ["syllabus"]) { const t = performance.now(); const r = await fetch(`${B}/api/parent/${p}?childId=${kid}`, { headers: H }); await r.text(); console.log(p, r.status, Math.round(performance.now() - t)); }
await q("delete from guardian where id = $1", [g]); process.exit(0);
