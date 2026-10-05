// Guardian signup/login, consent, child profiles.
import { randomBytes, createHash, createHmac } from "crypto";
import { q, one, tx, GUARD_FAILED } from "../db.js";
import { need, bad, send, HttpError } from "../http.js";
import { createSession, destroySession, requireGuardian, requireChild } from "../auth.js";
import { requireParentIfPinSet, checkAccountPassword, verifySecret, hashSecret, rateLimit } from "./parent.js";
import { teacherFor } from "../compiler/characters/index.js";
import { onConsentChange } from "../conductor/hooks.js";

export const CONSENT_VERSION = "2026-10-02.v1";
// core_tutoring is required to use the product; the others are separately optional and revocable.
export const PURPOSES = ["core_tutoring", "learning_profile", "memory", "transcripts_retention"];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A 400 that names the field and a stable code, so the client words it on the field (flows G12: never a raw API string). */
const fieldError = (field, code, message) => new HttpError(400, message, { field, code });

export async function signup(req, res, body) {
  const b = body ?? {};
  if (!String(b.name ?? "").trim()) throw fieldError("name", "name.missing", "missing field: name");
  if (!String(b.email ?? "").trim()) throw fieldError("email", "email.missing", "missing field: email");
  if (!String(b.password ?? "")) throw fieldError("password", "password.missing", "missing field: password");
  const { email, password, name } = need(b, "email", "password", "name");
  if (!EMAIL.test(email)) throw fieldError("email", "email.bad", "invalid email");
  if (password.length < 8) throw fieldError("password", "password.short", "password must be at least 8 characters");
  if (!body.isGuardianAdult) throw bad("a parent or guardian aged 18+ must create the account");
  const exists = await one("select 1 from guardian where lower(email) = lower($1)", [email]);
  if (exists) throw fieldError("email", "email.taken", "an account with this email already exists");
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

// ───────────────────────────── forgot password (W2-A #4; flows G12) ─────────────────────────────
//
// POST /api/auth/forgot { email } → always 200 { ok: true } (never says whether the email has an account). When it
// does, a one-time token (32 random bytes; only its sha256 is stored) good for RESET_MIN minutes is mailed through
// Azure Communication Services Email (ACS_CONNECTION_STRING + ACS_SENDER, an Azure-managed domain). A test account
// (@taxila.test) presenting the operator key (x-taxila-ops = TAXILA_OPS_KEY) also gets the token back as `testToken`,
// so the production acceptance test can finish the reset without a real mailbox; no other account ever does.
// POST /api/auth/reset { token, password } → the password is changed, every session of the account is ended, the
// token is spent, and this browser is signed in. A used, expired or unknown token is one 400 { code: "reset.bad" }.
export const RESET_MIN = 30;
const sha256 = (s) => createHash("sha256").update(String(s)).digest("hex");
/**
 * The app origin a reset link points at: TAXILA_URL (else PUBLIC_BASE_URL), and NO fallback. A guessed domain would mail
 * live reset tokens inside links to a host the owner may not control (account takeover), so with neither set the email
 * is not sent at all (logged; the answer is still 200).
 */
export const appBase = (env = process.env) => {
  const b = String(env.TAXILA_URL || env.PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");
  return /^https?:\/\/[^/\s]+$/i.test(b) ? b : null;
};

/** PURE. The reset email for one account, or null when no app origin is configured (then nothing is mailed). */
export function resetMail({ g, token }, env = process.env) {
  const base = appBase(env);
  if (!base) return null;
  const link = `${base}/start/reset?token=${encodeURIComponent(token)}`;
  return { to: g.email, subject: "Reset your Taxila password",
    text: `Hello${g.name ? ` ${g.name}` : ""},\n\nSomeone asked to reset the password of your Taxila parent account. To set a new password, open this link within ${RESET_MIN} minutes:\n\n${link}\n\nIf you did not ask for this, you can ignore this email. Your password stays the same.\n\nTaxila` };
}

/** Azure Communication Services Email, REST with HMAC-SHA256 (no SDK). Returns the operation id, or throws. */
export async function sendAcsEmail({ to, subject, text, html }, env = process.env, fetchImpl = fetch) {
  const cs = env.ACS_CONNECTION_STRING, sender = env.ACS_SENDER;
  if (!cs || !sender) throw Object.assign(new Error("ACS email is not configured"), { code: "ACS_UNCONFIGURED" });
  const parts = Object.fromEntries(cs.split(";").filter(Boolean).map((kv) => { const i = kv.indexOf("="); return [kv.slice(0, i).toLowerCase(), kv.slice(i + 1)]; }));
  const url = new URL(`${parts.endpoint.replace(/\/+$/, "")}/emails:send?api-version=2023-03-31`);
  const payload = JSON.stringify({ senderAddress: sender, recipients: { to: [{ address: to }] }, content: { subject, plainText: text, ...(html ? { html } : {}) } });
  const date = new Date().toUTCString();
  const hash = createHash("sha256").update(payload).digest("base64");
  const toSign = `POST\n${url.pathname}${url.search}\n${date};${url.host};${hash}`;
  const sig = createHmac("sha256", Buffer.from(parts.accesskey, "base64")).update(toSign).digest("base64");
  const r = await fetchImpl(url, { method: "POST", body: payload, headers: { "content-type": "application/json", "x-ms-date": date, "x-ms-content-sha256": hash,
    authorization: `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${sig}` } });
  if (r.status !== 202 && !r.ok) throw Object.assign(new Error(`ACS email ${r.status}`), { code: `ACS_${r.status}` });
  return r.headers.get("operation-location") ?? r.headers.get("x-ms-request-id") ?? "sent";
}

export async function forgotPassword(req, res, body) {
  rateLimit(req, "forgot");
  const email = String(body?.email ?? "").trim();
  if (!email) throw fieldError("email", "email.missing", "missing field: email");
  if (!EMAIL.test(email)) throw fieldError("email", "email.bad", "invalid email");
  const g = await one("select id, email, name from guardian where lower(email) = lower($1)", [email]);
  const out = { ok: true };
  if (!g) return send(res, 200, out);
  const token = randomBytes(32).toString("base64url");
  // The account's own reads and writes run AFTER the answer: a real email must not answer measurably slower than an
  // unknown one (that would tell which emails have an account). The one exception is the operator-keyed test account,
  // which needs its token in the answer and whose timing tells nothing.
  const ops = process.env.TAXILA_OPS_KEY;
  const testAccount = /@taxila\.test$/i.test(g.email) && !!ops && req.headers?.["x-taxila-ops"] === ops;
  const work = async () => {
    // at most 5 links an hour per account (a mailbox is not a spam target)
    const n = await one("select count(*)::int as n from password_reset where guardian_id = $1 and created_at > now() - interval '1 hour'", [g.id]);
    if ((n?.n ?? 0) >= 5) return false;
    await q("insert into password_reset(token_hash, guardian_id, expires_at) values ($1, $2, now() + ($3 || ' minutes')::interval)", [sha256(token), g.id, String(RESET_MIN)]);
    await q("insert into audit(guardian_id, action) values ($1, 'password_reset_requested')", [g.id]);
    const mail = resetMail({ g, token });
    if (!mail) console.warn("[account] reset email not sent: TAXILA_URL unset");
    else sendAcsEmail(mail).catch((e) => console.warn(`[account] reset email not sent: ${e.code ?? e.message}`));
    return true;
  };
  if (testAccount) {
    if (await work()) out.testToken = token;
    return send(res, 200, out);
  }
  send(res, 200, out);
  work().catch((e) => console.warn(`[account] reset request not stored: ${e?.code ?? e?.message ?? e}`));
}

export async function resetPassword(req, res, body) {
  rateLimit(req, "reset");
  const token = String(body?.token ?? "");
  const password = String(body?.password ?? "");
  if (!password) throw fieldError("password", "password.missing", "missing field: password");
  if (password.length < 8) throw fieldError("password", "password.short", "password must be at least 8 characters");
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) throw new HttpError(400, "reset link is not valid", { code: "reset.bad" });
  // spend the token atomically: only one request can win it
  const r = await one(`update password_reset set used_at = now() where token_hash = $1 and used_at is null and expires_at > now() returning guardian_id`, [sha256(token)]);
  if (!r) throw new HttpError(400, "reset link is not valid", { code: "reset.bad" });
  await tx([
    { text: "update guardian set pw_hash = $2 where id = $1 returning id", params: [r.guardian_id, await hashSecret(password)] },
    { text: "delete from auth_session where guardian_id = $1", params: [r.guardian_id] },
    // every other outstanding link of this account dies with the reset (no 30-minute second key)
    { text: "update password_reset set used_at = now() where guardian_id = $1 and used_at is null returning guardian_id", params: [r.guardian_id] },
    { text: "insert into audit(guardian_id, action) values ($1, 'password_reset') returning id", params: [r.guardian_id] },
  ]);
  await createSession(res, r.guardian_id, req.headers["user-agent"]);
  const g = await one("select id, email, name from guardian where id = $1", [r.guardian_id]);
  send(res, 200, { guardian: g });
}

export async function logout(req, res) {
  await destroySession(req, res);
  send(res, 200, { ok: true });
}

/** A child row as the client sees it: teacher_name is the EFFECTIVE custom name (null when the look's own is in use). */
export function clientChild(c) {
  if (!c || !c.teacher_name) return c;
  const t = teacherFor(c);
  return { ...c, teacher_name: t.name !== t.characterName ? t.name : null };
}

export async function me(req, res) {
  send(res, 200, await meData(await requireGuardian(req)));
}

/** GET /api/me's body for a signed-in guardian (also folded into GET /api/child/boot: one hop on child home). */
export async function meData(g) {
  const cols = "id, first_name, class_level, board, school_medium, language_pref, teacher_id, teacher_name, avatar, interests";
  // Tolerant of a database without 011_teacher_name (deploy order): /api/me gates sign-in and the whole parent corner,
  // so an undefined column (42703) reads as "no custom name" instead of failing every request.
  const rows = await q(`select ${cols} from child where guardian_id = $1 order by created_at`, [g.id]).catch((e) => {
    if (e?.code !== "42703") throw e;
    return q(`select ${cols.replace("teacher_name, ", "null::text as teacher_name, ")} from child where guardian_id = $1 order by created_at`, [g.id]);
  });
  // One teacher everywhere (V2 §0.8): the name the client shows is the one lessons use — a stored name that no longer
  // passes (a later denylist entry, the child renamed to it) is sent as null, so every surface falls back to the look's.
  const children = rows.map(clientChild);
  const consents = await q(
    "select distinct on (child_id, purpose) child_id, purpose, granted, version, created_at from consent where guardian_id = $1 order by child_id, purpose, created_at desc", [g.id]);
  return { guardian: g, children, consents };
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
  // Parent corner "Your choices" → Change (V2 §6.5.5) sends the account password with every change; when one is
  // sent it is checked (counted), so a wrong password never changes a consent row.
  else if (body.password !== undefined) await checkAccountPassword(g.id, body.password, "consent_change");
  for (const [purpose, granted] of Object.entries(grants)) {
    if (!PURPOSES.includes(purpose)) throw bad(`unknown purpose ${purpose}`);
    await q("insert into consent(guardian_id, child_id, purpose, version, granted, method) values ($1,$2,$3,$4,$5,'checkbox_v1')",
      [g.id, childId, purpose, CONSENT_VERSION, !!granted]);
  }
  await q("insert into audit(guardian_id, action, detail) values ($1, 'consent', $2)", [g.id, { childId, grants, version: CONSENT_VERSION }]);
  // Seam (W1-D): the Conductor's consent event(s), in one transaction right after the consent rows (none until filled).
  const hookStmts = onConsentChange({ guardianId: g.id, childId, grants: Object.fromEntries(Object.entries(grants).map(([k, v]) => [k, !!v])), version: CONSENT_VERSION, now: Date.now() });
  if (hookStmts.length) await tx(hookStmts);
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
  // A parent moving the child to another look resets the name, as the picker's switch does (tutor.js CHOOSE_SQL): the
  // name the child gave one look belongs to that look. One statement: the reset and its 'switch' history row together.
  const switching = fields.teacher_id !== undefined && fields.teacher_id !== child.teacher_id;
  const resetSql = switching ? ", teacher_name = null, teacher_name_at = case when teacher_name is not null then now() else teacher_name_at end" : "";
  const c = switching
    ? await one(`with old as (select id, teacher_name from child where id = $${vals.length}),
        upd as (update child set ${sets.join(", ")}${resetSql} where id = $${vals.length} returning *),
        hist as (insert into teacher_name_history(child_id, name, character_id, source)
          select upd.id, null, upd.teacher_id, 'switch' from upd join old on old.id = upd.id where old.teacher_name is not null returning id)
        select * from upd`, vals)
    : await one(`update child set ${sets.join(", ")} where id = $${vals.length} returning *`, vals);
  send(res, 200, { child: clientChild(c) });
}

/**
 * Safeguarding comes before erasure (decision safety-parent-notice-settle; mode.js KEPT_TABLES: incident is a
 * "safeguarding record", notification holds the safety intents headed for the human queue). Erasure is DEFERRED while,
 * for any child in scope: the Conductor holds the child in safety_hold, a safeguarding incident is not yet handled by
 * the human, or a safety notification is still pending/held in the outbox. An implicated adult deleting the account
 * right after a disclosure would otherwise wipe the record and the hand-off. The refusal names nothing (the parent
 * sees "needs a check by our team first"), and an `erase_deferred` audit row with no content is the human's cue.
 * `$1` = the guardian; `$2` = one child id, or null for every child of the guardian.
 */
export const SAFETY_OPEN_SQL = `(
  exists (select 1 from incident i join child c on c.id = i.child_id
           where c.guardian_id = $1 and ($2::uuid is null or c.id = $2::uuid) and i.kind = 'safeguarding' and not i.handled)
  or exists (select 1 from conductor_state cs join child c on c.id = cs.child_id
           where c.guardian_id = $1 and ($2::uuid is null or c.id = $2::uuid) and cs.mode = 'safety_hold')
  or exists (select 1 from notification n
           where n.guardian_id = $1 and ($2::uuid is null or n.child_id = $2::uuid) and n.cls = 'safety'
             and n.status in ('pending', 'sending', 'blocked')))`;

/**
 * The statements that make an erasure safe for the safeguarding record, run INSIDE the erasure's transaction, first:
 *  1. lock the children in scope (FOR UPDATE): a concurrent incident insert takes a key-share lock on its child row,
 *     so no new incident can land between the check and the delete;
 *  2. the guard: division by zero (GUARD_FAILED) aborts the whole transaction when SAFETY_OPEN_SQL holds;
 *  3. every incident row of those children is DETACHED (child_id → null; lesson_id goes null with the lesson) and
 *     stamped with the erasure receipt, so it outlives the child's cascade de-identified: kind, severity, family and
 *     time only (incident.detail holds turn ids and predicate families, never the child's words).
 */
function safetyFirst(guardianId, childId, receipt) {
  return [
    { text: "select id from child where guardian_id = $1 and ($2::uuid is null or id = $2::uuid) for update", params: [guardianId, childId] },
    { text: `select 1 / (case when ${SAFETY_OPEN_SQL} then 0 else 1 end) as ok`, params: [guardianId, childId] },
    { text: `update incident set child_id = null, detail = detail || jsonb_build_object('erased', $3::text)
              where child_id in (select id from child where guardian_id = $1 and ($2::uuid is null or id = $2::uuid))`,
      params: [guardianId, childId, receipt] },
  ];
}
const erasureCode = () => `TX-${randomBytes(4).toString("hex").toUpperCase()}`;
/** Run an erasure transaction; a tripped safety guard → 409 { code: "erase_review" } + one content-free audit row. */
async function erase(guardianId, stmts, what) {
  try {
    return await tx(stmts);
  } catch (e) {
    if (e?.code !== GUARD_FAILED) throw e;
    await q("insert into audit(guardian_id, action, detail) values ($1, 'erase_deferred', $2)", [guardianId, { what }]);
    throw new HttpError(409, "this deletion needs a safeguarding review first", { code: "erase_review" });
  }
}

/**
 * Erasure: deletes the child and every row that cascades from it. The most destructive act, so beyond the
 * unlocked corner it re-asks for the account password (counted; stand-in for the §6.2/§6.9 OTP), as PIN change does.
 * Safeguarding first (safetyFirst): deferred while a safety matter is open; incident rows are kept, detached.
 */
export async function deleteChild(req, res, body) {
  const { guardian, child } = await requireChild(req, need(body, "childId").childId);
  await requireParentIfPinSet(req);
  await checkAccountPassword(guardian.id, body.password, "child_erase");
  const receipt = erasureCode();
  await erase(guardian.id, [
    ...safetyFirst(guardian.id, child.id, receipt),
    { text: "delete from consent where child_id = $1", params: [child.id] },
    { text: "delete from child where id = $1", params: [child.id] },
    { text: "insert into audit(guardian_id, action, detail) values ($1, 'child_erase', $2)", params: [guardian.id, { childId: child.id, receipt }] },
  ], "child");
  send(res, 200, { ok: true });
}

/** Backups (Neon history, Blob soft-delete) expire this long after an erasure (decision dek-in-pitr-database). */
export const BACKUP_DAYS = 7;
const COOKIE_CLEAR = "tx_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";

/**
 * DELETE /api/account { password, confirm: true } — a guardian deletes the account and every child (V2 §6.5.5, B3-A5).
 * Gate: an unlocked Parent corner once a PIN exists (the child shares the cookie), the account password re-entered
 * (counted, like every consent-grade act), and an explicit confirm (the page's hold step). One transaction:
 *  - safetyFirst: refused (409 erase_review) while any child is in safety_hold, has an unhandled safeguarding
 *    incident or a pending safety notification; otherwise every incident row is detached and kept de-identified;
 *  - `delete from guardian` cascades every child (and through child every child-keyed table: lessons, turns,
 *    evidence, the learner model, reports, Conductor rows, …), consent, PIN, sessions on every device, notifications;
 *  - the guardian's own audit trail goes too;
 *  - ONE receipt row is written in its place: action 'account_erase', the account's (now meaningless) id and a
 *    random receipt code. No email, name, child id or count: an audit row with no content.
 * Kept by design: learner_mode_audit (mode-change audit, KEPT in server/learner/mode.js, no learner content) and the
 * detached incident rows (safeguarding record). The receipt copy says exactly this.
 * N4 ("deletion started", §6.5.5) is NOT sent — an explicit deviation (context/inbox/b3-parent.json): there is no
 * Notifier (M1), and the outbox row would cascade away with the guardian it is keyed to. The path: the Notifier
 * migration lets an account-class row outlive its guardian (guardian_id set null + an address snapshot that the
 * Notifier clears on send), and this handler inserts it inside the same transaction, before the delete.
 */
export async function deleteAccount(req, res, body) {
  const g = await requireParentIfPinSet(req);
  rateLimit(req, "account_erase");
  if (body.confirm !== true) throw bad("confirm the deletion first", { code: "confirm_needed" });
  await checkAccountPassword(g.id, body.password, "account_erase");
  const kids = await q("select id from child where guardian_id = $1", [g.id]);
  const receipt = erasureCode();
  const at = new Date();
  await erase(g.id, [
    ...safetyFirst(g.id, null, receipt),
    { text: "delete from guardian where id = $1", params: [g.id] },
    { text: "delete from audit where guardian_id = $1", params: [g.id] },
    { text: "insert into audit(guardian_id, action, detail) values ($1, 'account_erase', $2)", params: [g.id, { receipt }] },
  ], "account");
  res.setHeader("set-cookie", COOKIE_CLEAR);
  send(res, 200, { ok: true, receipt: { code: receipt, at: at.toISOString(), children: kids.length,
    backupsGoneBy: new Date(at.getTime() + BACKUP_DAYS * 86400_000).toISOString() } });
}
