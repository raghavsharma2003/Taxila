// End-to-end checks of the guardian gate (server/routes/parent.js + the consent-grade account routes). Not part
// of `npm test`: it needs Neon (no Azure call is made).
//
//   NODE_USE_ENV_PROXY=1 node tests/parent-gate-e2e.mjs
//
// Serves the real API in-process, then checks the review findings on ui-a: the onboarding PIN set leaves the
// corner LOCKED (the P8 handover), consent / add / edit / delete need an unlock once a PIN exists (avatar and
// interests stay child-writable), a parallel burst of wrong PINs is counted per try (at most PIN_MAX_TRIES are
// ever checked), password tries are bounded the same way, a forgotten-PIN reset waits RESET_DELAY_H and an
// unlock with the current PIN cancels it, a first PIN outside onboarding needs the password, and hometask
// validates its lesson. Deletes its guardians at the end, pass or fail.
import http from "http";
import { readFileSync } from "fs";
const ROOT = new URL("..", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const { handle } = await import("../server/index.js");
const { q, one } = await import("../server/db.js");
const { PIN_MAX_TRIES, PW_MAX_TRIES } = await import("../server/routes/parent.js");
const server = http.createServer(handle); await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const client = () => {
  let cookie = "";
  const call = async (method, path, body) => {
    const res = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const set = res.headers.get("set-cookie"); if (set) cookie = set.split(";")[0];
    const j = await res.json().catch(() => ({}));
    return { status: res.status, ...j };
  };
  call.cookie = () => cookie;
  return call;
};
function ok(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) process.exitCode = 1;
}
const st = Date.now();
const emails = [];
const signup = async (c, tag, pw) => {
  const email = `gate-${tag}+${st}@taxila.test`; emails.push(email);
  const r = await c("POST", "/api/auth/signup", { email, password: pw, name: "Gate", isGuardianAdult: true });
  if (r.status !== 201) throw new Error(`signup ${r.status} ${r.error}`);
  return r.guardian;
};

try {
  // ── onboarding: P6 child, P7 controls then PIN, P8 handover ──
  const A = client();
  const gA = await signup(A, "a", "gate-pw-aaaa1");
  const c1 = await A("POST", "/api/children", { firstName: "Asha", classLevel: 3 });
  ok(c1.status === 201, "first child is created with no PIN (first run)");
  ok((await A("POST", "/api/consent", { childId: null, grants: { core_tutoring: true } })).status === 200, "consent is open before any PIN (P5)");
  ok((await A("POST", "/api/parent/controls", { childId: c1.child.id, dailyMinutes: 30 })).status === 200, "P7 controls write is open before the PIN (fresh session)");
  const set = await A("POST", "/api/parent/pin", { pin: "2580" });
  ok(set.status === 200 && set.hasPin && !set.unlocked, "the onboarding PIN set does NOT open the corner");
  const ov = await A("GET", `/api/parent/overview?childId=${c1.child.id}`);
  ok(ov.status === 403 && ov.gate === "locked", "after the handover, the parent overview is 403 { gate: 'locked' }");

  // ── consent-grade actions need the unlock once a PIN exists ──
  ok((await A("POST", "/api/children", { firstName: "Kabir", classLevel: 6 })).gate === "locked", "adding a second child needs the unlock");
  ok((await A("POST", "/api/consent", { childId: null, grants: { memory: true } })).gate === "locked", "a consent change needs the unlock");
  ok((await A("PATCH", "/api/children", { childId: c1.child.id, classLevel: 5 })).gate === "locked", "editing class needs the unlock");
  ok((await A("PATCH", "/api/children", { childId: c1.child.id, avatar: "kite" })).status === 200, "the child's own pick (avatar) stays writable");
  ok((await A("DELETE", "/api/children", { childId: c1.child.id })).gate === "locked", "deleting a child needs the unlock");
  ok((await A("POST", "/api/parent/controls", { childId: c1.child.id, dailyMinutes: 60 })).gate === "locked", "controls need the unlock once a PIN exists");

  // ── unlock, edit, lock ──
  const un = await A("POST", "/api/parent/unlock", { pin: "2580" });
  ok(un.status === 200 && un.unlocked, "the right PIN unlocks");
  const ed = await A("PATCH", "/api/children", { childId: c1.child.id, board: "rbse", schoolMedium: "hindi" });
  ok(ed.status === 200 && ed.child.board === "rbse" && ed.child.school_medium === "hindi", "board and school medium are saved on edit");
  ok((await A("PATCH", "/api/children", { childId: c1.child.id, board: "mars" })).status === 400, "an unknown board is refused");
  ok((await A("POST", "/api/parent/hometask", { childId: c1.child.id, lessonId: "not-a-uuid", done: true })).status === 400, "hometask: a non-UUID lessonId is 400");
  ok((await A("POST", "/api/parent/hometask", { childId: c1.child.id, lessonId: "00000000-0000-0000-0000-000000000000", done: true })).status === 404,
    "hometask: a lesson that is not this child's is 404");
  ok((await A("POST", "/api/parent/pin", { pin: "3690" })).status === 400, "changing the PIN without the password is refused");
  await A("POST", "/api/parent/lock", {});
  ok((await A("GET", `/api/parent/overview?childId=${c1.child.id}`)).gate === "locked", "lock shuts the corner");

  // ── a parallel burst of wrong PINs is counted per try ──
  const burst = await Promise.all(Array.from({ length: 8 }, (_, i) => A("POST", "/api/parent/unlock", { pin: String(1000 + i * 7) })));
  const checked = burst.filter((r) => r.error === "wrong PIN").length + burst.filter((r) => r.gate === "wait" && r.error === "too many tries; wait").length;
  const wrong = burst.filter((r) => r.error === "wrong PIN").length;
  ok(wrong <= PIN_MAX_TRIES - 1 && burst.every((r) => r.status === 403 || r.status === 429), `burst of 8 wrong PINs: ${wrong} reported wrong (≤ ${PIN_MAX_TRIES - 1}), the rest wait`);
  const pinRow = await one("select locked_until > now() as locked from guardian_pin where guardian_id = $1", [gA.id]);
  ok(pinRow.locked && checked >= PIN_MAX_TRIES, "the burst ends in the 15 min lockout");
  const afterLock = await A("POST", "/api/parent/unlock", { pin: "2580" });
  ok(afterLock.gate === "wait", "during the lockout even the right PIN waits");
  await q("update guardian_pin set locked_until = null, failed = 0 where guardian_id = $1", [gA.id]);

  // ── forgotten PIN: bounded password tries, a 24 h delay, cancelled by the current PIN ──
  const R = client(); // a second session of the same guardian (own burst-limit key)
  ok((await R("POST", "/api/auth/login", { email: emails[0], password: "gate-pw-aaaa1" })).status === 200, "second session signs in");
  const pend = await R("POST", "/api/parent/pin/reset", { pin: "4826", password: "gate-pw-aaaa1" });
  ok(pend.status === 200 && !!pend.pendingResetAt && !pend.unlocked, "a reset is pending, not applied, and does not open the corner");
  ok((await R("POST", "/api/parent/unlock", { pin: "4826" })).error === "wrong PIN", "the new PIN does not work before the delay");
  const cancel = await R("POST", "/api/parent/unlock", { pin: "2580" });
  ok(cancel.unlocked && !cancel.pendingResetAt, "unlocking with the current PIN cancels the pending reset");
  await R("POST", "/api/parent/lock", {});
  const pend2 = await R("POST", "/api/parent/pin/reset", { pin: "4826", password: "gate-pw-aaaa1" });
  await q(`update audit set detail = jsonb_set(detail, '{effectiveAt}', to_jsonb((now() - interval '1 minute')::text)) where guardian_id = $1 and action = 'pin_reset_pending'`, [gA.id]);
  const applied = await R("GET", "/api/parent/pin");
  ok(!!pend2.pendingResetAt && !applied.pendingResetAt, "after the delay the reset is applied");
  ok((await R("POST", "/api/parent/unlock", { pin: "4826" })).unlocked === true, "the reset PIN works after the delay");
  await R("POST", "/api/parent/lock", {});
  const pwBurst = await Promise.all(Array.from({ length: 7 }, () => R("POST", "/api/parent/pin/reset", { pin: "4826", password: "wrong-password" })));
  const pwChecked = pwBurst.filter((r) => r.error === "account password is incorrect").length;
  ok(pwChecked <= PW_MAX_TRIES, `burst of 7 wrong passwords: ${pwChecked} checked (≤ ${PW_MAX_TRIES}), the rest wait`);
  ok((await R("POST", "/api/parent/pin/reset", { pin: "4826", password: "gate-pw-aaaa1" })).gate === "wait", "after the password limit even the right password waits");

  // ── first PIN outside onboarding needs the password ──
  const B = client();
  const gB = await signup(B, "b", "gate-pw-bbbb2");
  const cb = await B("POST", "/api/children", { firstName: "Mira", classLevel: 7 });
  await q("update auth_session set created_at = now() - interval '3 hours' where guardian_id = $1", [gB.id]);
  const st0 = await B("GET", "/api/parent/pin");
  ok(st0.firstSetNeedsPassword === true, "a stale session is told the first PIN needs the password");
  ok((await B("POST", "/api/parent/pin", { pin: "7319" })).gate === "password", "first PIN without the password is refused off the onboarding session");
  ok((await B("POST", "/api/parent/controls", { childId: cb.child.id, dailyMinutes: 40 })).gate === "set", "controls with no PIN are refused off the onboarding session");
  ok((await B("POST", "/api/parent/pin", { pin: "7319", password: "nope-nope" })).status === 400, "a wrong password is refused");
  const okB = await B("POST", "/api/parent/pin", { pin: "7319", password: "gate-pw-bbbb2" });
  ok(okB.status === 200 && okB.unlocked, "first PIN with the password is set and opens this session");
  ok((await B("GET", "/api/parent/speak?what=nonsense")).status === 400, "speak refuses an unknown card");
} catch (e) {
  ok(false, `run aborted: ${e.stack || e.message}`);
} finally {
  for (const e of emails) {
    const g = await one("select id from guardian where email = lower($1)", [e]).catch(() => null);
    if (!g) continue;
    await q("delete from child where guardian_id = $1", [g.id]).catch((x) => console.log(`cleanup child: ${x.message}`));
    await q("delete from guardian where id = $1", [g.id]).catch((x) => console.log(`cleanup guardian: ${x.message}`));
    await q("delete from audit where guardian_id = $1", [g.id]).catch(() => {});
  }
  server.close();
}
