import fs from "fs";
for (const t of ["m4", "t7", "d6"]) {
  const a = JSON.parse(fs.readFileSync(`out/acct-${t}.json`, "utf8"));
  const r = await fetch("https://taxila.dev/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: a.email, password: a.pw }) });
  const ck = (r.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  const u = await fetch("https://taxila.dev/api/parent/unlock", { method: "POST", headers: { cookie: ck, "content-type": "application/json" }, body: JSON.stringify({ pin: "1357" }) });
  const ck2 = [ck, ...(u.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0])].join("; ");
  const d = await fetch("https://taxila.dev/api/account", { method: "DELETE", headers: { cookie: ck2, "content-type": "application/json" }, body: JSON.stringify({ confirm: true, password: a.pw }) });
  const l2 = await fetch("https://taxila.dev/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: a.email, password: a.pw }) });
  console.log(t, "login", r.status, "delete", d.status, (await d.text()).slice(0, 120), "relogin", l2.status);
}
