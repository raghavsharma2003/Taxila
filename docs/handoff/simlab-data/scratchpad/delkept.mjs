import { readFileSync } from "fs";
const [file, base, keepLesson] = process.argv.slice(2);
const rows = readFileSync(file, "utf8").trim().split("\n").map((l) => JSON.parse(l));
for (const r of rows) {
  if (r.lessonId === keepLesson) { console.log(r.lessonId.slice(0, 8), "KEPT (main)"); continue; }
  let cookie = "";
  const login = await fetch(base + "/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: r.email, password: r.password }) });
  cookie = (login.headers.get("set-cookie") ?? "").split(";")[0];
  if (login.status !== 200) { console.log(r.lessonId.slice(0, 8), "login", login.status); continue; }
  const del = await fetch(base + "/api/account", { method: "DELETE", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ password: r.password, confirm: true }) });
  const j = await del.json().catch(() => ({}));
  console.log(r.lessonId.slice(0, 8), "delete", del.status, j.error ?? j.code ?? "");
}
