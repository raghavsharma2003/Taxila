const REPO = "/home/user/Taxila/";
import fs from "node:fs";
for (const line of fs.readFileSync(REPO + ".env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1"); }
process.env.TAXILA_DB = "test"; process.env.TAXILA_DEBUG = "1";
let t = performance.now(); const lap = (s) => { const n = performance.now(); console.log(s, Math.round(n - t)); t = n; };
const { handle } = await import(REPO + "server/index.js"); lap("import index");
const { q } = await import(REPO + "server/db.js"); await q("select 1"); lap("db first");
await q("select 1"); lap("db second");
const http = await import("node:http"); const s = http.createServer(handle); await new Promise((r) => s.listen(0, "127.0.0.1", r));
const B = `http://127.0.0.1:${s.address().port}`;
await fetch(B + "/api/health"); lap("health");
await fetch(B + "/api/lesson/start", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }); lap("start unauth");
await fetch(B + "/api/lesson/start", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }); lap("start unauth 2");
const { chat, DEPLOY } = await import(REPO + "server/azure.js").then(async (m) => ({ chat: m.chat, DEPLOY: (await import(REPO + "server/azure.js")).DEPLOY ?? m.DEPLOY }));
lap("azure import");
process.exit(0);
