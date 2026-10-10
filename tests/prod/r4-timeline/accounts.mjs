// r3-review: make (or delete) the review's TEST accounts on the LOCAL server (Neon TEST). Cookies stay in run/accounts.json
// (scratch, a TEST session), never printed.
//   node accounts.mjs make | node accounts.mjs delete | node accounts.mjs clock <account> <days> | node accounts.mjs child <account> <json>
import { writeFileSync, readFileSync, existsSync } from "node:fs";
const BASE = process.env.TAXILA_BASE || "http://127.0.0.1:5190";
const F = new URL("./run/accounts.json", import.meta.url);
function client(cookie = "") {
  async function api(method, path, body, expect = [200, 201, 204]) {
    const res = await fetch(BASE + path, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const set = res.headers.get("set-cookie"); if (set) cookie = set.split(";")[0];
    const j = await res.json().catch(() => ({}));
    if (!expect.includes(res.status)) { const e = new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(j).slice(0, 300)}`); e.status = res.status; e.body = j; throw e; }
    return j;
  }
  api.cookie = () => cookie;
  return api;
}
const cmd = process.argv[2];
const all = existsSync(F) ? JSON.parse(readFileSync(F, "utf8")) : {};
const save = () => writeFileSync(F, JSON.stringify(all, null, 1), { mode: 0o600 });
async function addChild(api, acct, c) {
  const { child } = await api("POST", "/api/children", c);
  await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
  await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
  acct.children[c.key ?? c.firstName] = child.id;
  return child;
}
if (cmd === "make") {
  const st = Date.now();
  const defs = {
    owner: { email: "r3review-owner2@taxila.test", kids: [
      { key: "golu", firstName: "Golu", classLevel: 4, languagePref: "hinglish", interests: ["cartoons", "cricket"] },
      { key: "meher", firstName: "Meher", classLevel: 6, languagePref: "english", interests: ["painting"] },
    ] },
    plain: { email: `r3review-plain+${st}@taxila.test`, kids: [
      { key: "kabir", firstName: "Kabir", classLevel: 7, languagePref: "hinglish", interests: ["cricket", "video games"] },
      { key: "ishaan", firstName: "Ishaan", classLevel: 6, languagePref: "hindi", interests: ["football"] },
    ] },
  };
  for (const [k, d] of Object.entries(defs)) {
    if (all[k]) { console.log(k, "exists"); continue; }
    const api = client();
    const password = `r3rv-pw-${st}-${Math.random().toString(36).slice(2, 8)}`;
    try { await api("POST", "/api/auth/signup", { email: d.email, password, name: "Review Parent", isGuardianAdult: true }); }
    catch (e) { console.log(k, "signup failed", e.status); continue; }
    const acct = { email: d.email, password, children: {} };
    all[k] = acct;
    acct.cookie = api.cookie();
    save();
    for (const c of d.kids) { await addChild(api, acct, c); save(); }
    acct.cookie = api.cookie();
    save();
    const cfg = await fetch(BASE + "/api/duplex/config", { headers: { cookie: acct.cookie } }).then((r) => r.json()).catch(() => null);
    console.log(k, d.email, Object.keys(acct.children).join(","), "duplex config:", JSON.stringify(cfg));
  }
} else if (cmd === "login") {
  for (const [k, a] of Object.entries(all)) { const api = client(); await api("POST", "/api/auth/login", { email: a.email, password: a.password }); a.cookie = api.cookie(); console.log(k, "logged in"); }
  save();
} else if (cmd === "clock") {
  const a = all[process.argv[3]]; const api = client(a.cookie);
  console.log(JSON.stringify(await api("POST", "/api/test/clock", { advanceDays: Number(process.argv[4]) })));
} else if (cmd === "get") {
  const a = all[process.argv[3]]; const api = client(a.cookie);
  console.log(JSON.stringify(await api("GET", process.argv[4]), null, 1).slice(0, Number(process.argv[5] || 4000)));
} else if (cmd === "delete") {
  for (const [k, a] of Object.entries(all)) {
    const api = client(a.cookie);
    try { await api("DELETE", "/api/account", { password: a.password, confirm: true }); console.log(k, "deleted"); delete all[k]; }
    catch (e) {
      if (e.body?.code === "erase_review") {
        const left = [];
        for (const id of Object.values(a.children)) { try { await api("DELETE", "/api/children", { childId: id, password: a.password }); } catch { left.push(id); } }
        try { await api("DELETE", "/api/account", { password: a.password, confirm: true }); console.log(k, "deleted after children"); delete all[k]; }
        catch { console.log(k, "HELD for safeguarding review:", a.email, "children left", left.length); a.held = true; }
      } else console.log(k, "delete failed", e.status, e.message.slice(0, 200));
    }
  }
  save();
}
