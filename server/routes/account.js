// Guardian signup/login, consent, child profiles.
import { q, one } from "../db.js";
import { need, bad, send, HttpError } from "../http.js";
import { createSession, destroySession, requireGuardian, requireChild } from "../auth.js";
import { requireParentIfPinSet, checkAccountPassword, verifySecret, hashSecret, rateLimit } from "./parent.js";

export const CONSENT_VERSION = "2026-10-02.v1";
// core_tutoring is required to use the product; the others are separately optional and revocable.
export const PURPOSES = ["core_tutoring", "learning_profile", "memory", "transcripts_retention"];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signup(req, res, body) {
  const { email, password, name } = need(body, "email", "password", "name");
  if (!EMAIL.test(email)) throw bad("invalid email");
  if (password.length < 8) throw bad("password must be at least 8 characters");
  if (!body.isGuardianAdult) throw bad("a parent or guardian aged 18+ must create the account");
  const exists = await one("select 1 from guardian where lower(email) = lower($1)", [email]);
  if (exists) throw bad("an account with this email already exists");
  const g = await one("insert into guardian(email, pw_hash, name, phone) values (lower($1), $2, $3, $4) returning id, email, name",
    [email, await hashSecret(password), name, body.phone || null]);
  await q("insert into audit(guardian_id, action, detail) values ($1, 'signup', $2)", [g.id, { adultAttested: true }]);
  await createSession(res, g.id, req.headers["user-agent"]);
  send(res, 201, { guardian: g });
}

/** Wrong logins per guardian before each further try must wait LOGIN_SLOW_MIN after the previous checked one. */
export const LOGIN_FREE_TRIES = 5;
export const LOGIN_SLOW_MIN = 15;
// Unknown emails still pay one scrypt, so response time does not reveal which emails have accounts.
const DUMMY_HASH = hashSecret("taxila-no-such-account");

/**
 * Login is bounded like the other password checks (review: an unlimited login let a child on the shared phone
 * guess the password and then reset the PIN). Per guardian, insert-then-count: after LOGIN_FREE_TRIES wrong
 * tries in 24 h, one checked try per LOGIN_SLOW_MIN. A refused try is not kept, so hammering cannot hold the
 * real guardian out for longer than LOGIN_SLOW_MIN. Plus the per-session/IP burst limit. Async scrypt.
 * INTERIM: this bounds a guesser to about 100 tries a day; an off-device factor (OTP) is the real fix.
 */
export async function login(req, res, body) {
  const { email, password } = need(body, "email", "password");
  rateLimit(req, "login");
  const g = await one("select id, email, name, pw_hash from guardian where lower(email) = lower($1)", [email]);
  if (!g) {
    await verifySecret(String(password), await DUMMY_HASH);
    throw bad("email or password is incorrect");
  }
  const att = await one("insert into audit(guardian_id, action) values ($1, 'login_attempt') returning id", [g.id]);
  const c = await one(`select count(*)::int as n,
        (select max(at) from audit where guardian_id = $1 and action = 'login_attempt' and id < $2) as prev
      from audit where guardian_id = $1 and action = 'login_attempt' and at > now() - interval '24 hours'
        and id > coalesce((select max(id) from audit where guardian_id = $1 and action = 'login_ok'), 0)`, [g.id, att.id]);
  if (c.n > LOGIN_FREE_TRIES && c.prev && Date.now() - new Date(c.prev).getTime() < LOGIN_SLOW_MIN * 60_000) {
    await q("delete from audit where id = $1", [att.id]);
    throw new HttpError(429, "too many tries; wait a few minutes",
      { gate: "wait", lockedUntil: new Date(new Date(c.prev).getTime() + LOGIN_SLOW_MIN * 60_000).toISOString() });
  }
  if (!(await verifySecret(String(password), g.pw_hash))) throw bad("email or password is incorrect");
  await q("insert into audit(guardian_id, action) values ($1, 'login_ok')", [g.id]);
  await createSession(res, g.id, req.headers["user-agent"]);
  send(res, 200, { guardian: { id: g.id, email: g.email, name: g.name } });
}

export async function logout(req, res) {
  await destroySession(req, res);
  send(res, 200, { ok: true });
}

export async function me(req, res) {
  const g = await requireGuardian(req);
  const children = await q("select id, first_name, class_level, board, school_medium, language_pref, teacher_id, avatar, interests from child where guardian_id = $1 order by created_at", [g.id]);
  const consents = await q(
    "select distinct on (child_id, purpose) child_id, purpose, granted, version, created_at from consent where guardian_id = $1 order by child_id, purpose, created_at desc", [g.id]);
  send(res, 200, { guardian: g, children, consents });
}

/** body: { childId?: uuid|null, grants: { [purpose]: boolean } } */
// Consent changes, adding a second child, editing the profile and erasure are grown-up acts: once a guardian
// PIN exists they need an unlocked Parent corner (requireParentIfPinSet), because the child shares the cookie.
export async function setConsent(req, res, body) {
  const g = await requireParentIfPinSet(req);
  const childId = body.childId || null;
  if (childId) await requireChild(req, childId);
  const grants = body.grants || {};
  // Withdrawing core tutoring ends lessons for the child: consent-grade, so the account password too (stand-in
  // for the §6.2/§6.9 OTP), like erasure.
  if (grants.core_tutoring === false) await checkAccountPassword(g.id, body.password, "consent_withdraw");
  for (const [purpose, granted] of Object.entries(grants)) {
    if (!PURPOSES.includes(purpose)) throw bad(`unknown purpose ${purpose}`);
    await q("insert into consent(guardian_id, child_id, purpose, version, granted, method) values ($1,$2,$3,$4,$5,'checkbox_v1')",
      [g.id, childId, purpose, CONSENT_VERSION, !!granted]);
  }
  await q("insert into audit(guardian_id, action, detail) values ($1, 'consent', $2)", [g.id, { childId, grants, version: CONSENT_VERSION }]);
  send(res, 200, { ok: true, version: CONSENT_VERSION });
}

const BOARDS = ["cbse", "ncert", "rbse", "icse", "other-state"];
const MEDIUMS = ["english", "hindi", "other"];
export async function createChild(req, res, body) {
  // Gate on "a PIN exists" (not "a child exists"): after the last child is deleted the PIN still guards adding one.
  const g = await requireParentIfPinSet(req);
  const { firstName, classLevel } = need(body, "firstName", "classLevel");
  const cl = Number(classLevel);
  if (!(cl >= 1 && cl <= 9)) throw bad("class must be 1-9");
  const board = BOARDS.includes(body.board) ? body.board : "cbse";
  const medium = MEDIUMS.includes(body.schoolMedium) ? body.schoolMedium : "english";
  const lang = ["hinglish", "hindi", "english"].includes(body.languagePref) ? body.languagePref : "hinglish";
  const interests = Array.isArray(body.interests) ? body.interests.slice(0, 8).map((s) => String(s).slice(0, 30)) : [];
  const teacher = cl <= 4 ? "asha" : "arjun";
  const c = await one(
    `insert into child(guardian_id, first_name, class_level, board, school_medium, language_pref, birth_year, avatar, teacher_id, interests)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
    [g.id, firstName.slice(0, 40), cl, board, medium, lang, body.birthYear || null, body.avatar || null, body.teacherId || teacher, interests]);
  await q("insert into rel_state(child_id) values ($1) on conflict do nothing", [c.id]);
  await q("insert into audit(guardian_id, action, detail) values ($1, 'child_create', $2)", [g.id, { childId: c.id }]);
  send(res, 201, { child: c });
}

export async function updateChild(req, res, body) {
  const { child } = await requireChild(req, need(body, "childId").childId);
  if (body.board !== undefined && !BOARDS.includes(body.board)) throw bad("unknown board");
  if (body.schoolMedium !== undefined && !MEDIUMS.includes(body.schoolMedium)) throw bad("unknown school medium");
  if (body.classLevel !== undefined && !(Number(body.classLevel) >= 1 && Number(body.classLevel) <= 9)) throw bad("class must be 1-9");
  const fields = { first_name: body.firstName, class_level: body.classLevel, board: body.board, school_medium: body.schoolMedium,
    language_pref: body.languagePref, interests: body.interests, teacher_id: body.teacherId, avatar: body.avatar };
  // The child's own picks (avatar, interests: C1-C3) stay child-writable; the profile facts are the parent's.
  if (["first_name", "class_level", "board", "school_medium", "language_pref", "teacher_id"].some((k) => fields[k] !== undefined)) await requireParentIfPinSet(req);
  const sets = [], vals = [];
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) { vals.push(v); sets.push(`${k} = $${vals.length}`); }
  if (!sets.length) return send(res, 200, { child });
  vals.push(child.id);
  const c = await one(`update child set ${sets.join(", ")} where id = $${vals.length} returning *`, vals);
  send(res, 200, { child: c });
}

/**
 * Erasure: deletes the child and every row that cascades from it. The most destructive act, so beyond the
 * unlocked corner it re-asks for the account password (counted; stand-in for the §6.2/§6.9 OTP), as PIN change does.
 */
export async function deleteChild(req, res, body) {
  const { guardian, child } = await requireChild(req, need(body, "childId").childId);
  await requireParentIfPinSet(req);
  await checkAccountPassword(guardian.id, body.password, "child_erase");
  await q("delete from consent where child_id = $1", [child.id]);
  await q("delete from child where id = $1", [child.id]);
  await q("insert into audit(guardian_id, action, detail) values ($1, 'child_erase', $2)", [guardian.id, { childId: child.id }]);
  send(res, 200, { ok: true });
}
