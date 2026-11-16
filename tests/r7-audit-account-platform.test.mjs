// r7 audit, platform findings routed to learner: PLAT-07 (a paired device may not change parent fields), PLAT-08 (a
// password is read as typed), PLAT-09 (deleting a child signs out its paired devices), PLAT-10 (the burst limiter is not
// keyed on an unchecked cookie), PLAT-52 (PATCH shapes fields as POST does; account delete clears both cookies). No DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { childEraseStmts, childPatchOf } from "../server/routes/account.js";
import { rateLimit, passwordMatches, hashSecret, verifySecret, ATTEMPTS_PER_MIN } from "../server/routes/parent.js";

test("PLAT-09: deleting a child ends its paired devices' sessions, before the child row goes", () => {
  const st = childEraseStmts("g1", "c1", "R");
  const end = st.findIndex((s) => /delete from auth_session/.test(s.text) && /device_session where child_id = \$1/.test(s.text));
  const del = st.findIndex((s) => /^delete from child where id/.test(s.text));
  assert.ok(end >= 0, "a statement ends the device sessions");
  assert.ok(end < del, "it runs while device_session still names the child");
  assert.deepEqual(st[end].params, ["c1"]);
});

test("PLAT-52: PATCH fields are checked and shaped as POST shapes them", () => {
  assert.throws(() => childPatchOf({ firstName: "   " }), (e) => e.status === 400);
  assert.equal(childPatchOf({ firstName: "  Aarav " + "x".repeat(60) }).first_name.length, 40);
  assert.throws(() => childPatchOf({ languagePref: "klingon" }), (e) => e.status === 400);
  assert.throws(() => childPatchOf({ interests: "cricket" }), (e) => e.status === 400);
  assert.deepEqual(childPatchOf({ interests: Array.from({ length: 12 }, (_, i) => `i${i}`.padEnd(50, "z")) }).interests.length, 8);
  assert.throws(() => childPatchOf({ classLevel: 4.5 }), (e) => e.status === 400);
  assert.deepEqual(childPatchOf({ avatar: "a3" }), { avatar: "a3" });
  assert.deepEqual(childPatchOf({}), {});
});

test("PLAT-52: account delete clears the session cookie and its tx_in marker", () => {
  const src = readFileSync(new URL("../server/routes/account.js", import.meta.url), "utf8");
  const m = /const COOKIE_CLEAR = (\[[^\]]*\])/.exec(src);
  assert.ok(m && /tx_session=;/.test(m[1]) && /\$\{HINT\}=;/.test(m[1]));
});

test("PLAT-07: updateChild refuses parent fields from a paired device; onboarding drops its parentView", () => {
  const src = readFileSync(new URL("../server/routes/account.js", import.meta.url), "utf8");
  assert.match(src, /if \(parentOnly && guardian\.deviceChildId\) throw new HttpError\(403/);
  const pl = readFileSync(new URL("../server/routes/placement.js", import.meta.url), "utf8");
  assert.match(pl, /guardian\.deviceChildId \? \{ childPicks: body\?\.childPicks \} : body/);
});

test("PLAT-08: a password with spaces at its ends matches as typed; a pre-fix trimmed hash still matches", async () => {
  const typed = "  pass word 1 ";
  assert.equal(await passwordMatches(typed, await hashSecret(typed)), true);
  assert.equal(await passwordMatches(typed, await hashSecret(typed.trim())), true, "account made before the fix");
  assert.equal(await passwordMatches("wrong-pass", await hashSecret(typed)), false);
  assert.equal(await verifySecret(typed.trim(), await hashSecret(typed)), false, "as typed is what is stored");
  const src = readFileSync(new URL("../server/routes/account.js", import.meta.url), "utf8");
  assert.match(src, /const password = String\(b\.password\);/);
  assert.match(src, /const password = String\(body\.password\);/);
});

test("PLAT-10: a fresh made-up cookie per request does not buy a fresh burst bucket", () => {
  const now = 5_000_000;
  const req = (i) => ({ headers: { cookie: `tx_session=forged${i}`, "x-forwarded-for": "1.2.3.4, 9.9.9.9" }, socket: {} });
  for (let i = 0; i < ATTEMPTS_PER_MIN; i++) rateLimit(req(i), "login-plat10", now);
  assert.throws(() => rateLimit(req(99), "login-plat10", now), (e) => e.status === 429);
  // keyed on the rightmost hop (the ingress's), not the leftmost the client wrote
  const spoof = { headers: { "x-forwarded-for": "7.7.7.7, 9.9.9.9" }, socket: {} };
  assert.throws(() => rateLimit(spoof, "login-plat10", now), (e) => e.status === 429);
  // a checked session keeps its own bucket
  assert.doesNotThrow(() => rateLimit(req(100), "login-plat10", now, { session: true }));
});
