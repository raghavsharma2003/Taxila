// Guardian sign-in by a one-time code (r7 app-auth-email-otp). A guardian who has an account asks for a code by email,
// types it back, and is signed in with the same session cookie password sign-in gives (server/auth.js createSession).
//
// Providers: one interface, one entry per channel. `email` goes through Azure Communication Services Email (the
// existing sendAcsEmail: ACS_CONNECTION_STRING + ACS_SENDER, the Azure-managed domain of taxila-acs / taxila-email).
// `phone` keeps the same shape and refuses: ACS SMS does not reach Indian numbers, and no other provider is allowed
// (Azure-only directive). When an Indian SMS or WhatsApp route exists on Azure, it fills `phone.send` and nothing else.
//
// Storage, no migration: a code is a row of password_reset (migration 019), keyed `code:` + sha256(guardian id, code).
// So the one table holds every one-time secret a guardian is mailed, and:
//   - the 5-an-hour limit on mail to one account counts reset links and codes together (a mailbox is not a spam target);
//   - a password reset spends every open code (reset() marks all unused rows of the guardian used).
// A reset token's hash (64 hex) can never equal a `code:` key, so neither flow can redeem the other's row.
// Tries are audit rows (`code_attempt`), written before they are counted, since the newest code: CODE_TRIES tries
// spend the code. A new code spends every older one, so only one code is ever live.
//
// Never says whether an email has an account: an unknown email gets the same 200 on send (and nothing is mailed) and
// the same `code.bad` on verify. The account's own reads and writes on send run after the answer (as forgotPassword).
import { createHash, randomInt } from "crypto";
import { q as dbQ, one as dbOne, tx as dbTx } from "../db.js";
import { HttpError, send } from "../http.js";
import { createSession } from "../auth.js";
import { rateLimit } from "../routes/parent.js";
import { sendAcsEmail } from "../routes/account.js";

export const CODE_LEN = 6;
export const CODE_MIN = 10;
export const CODE_TRIES = 5;
export const MAILS_PER_HOUR = 5;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** The database seam (tests swap these to replay parallel requests without a database). */
export const deps = { q: dbQ, one: dbOne, tx: dbTx };
const q = (...a) => deps.q(...a);
const one = (...a) => deps.one(...a);
const tx = (...a) => deps.tx(...a);

/** PURE. The stored key of one code: scoped to the guardian, so the same six digits mean nothing for another account. */
export const codeKey = (guardianId, code) => `code:${createHash("sha256").update(`${guardianId}:${code}`).digest("hex")}`;

/** A fresh code: CODE_LEN digits, uniform, leading zeros kept. */
export const newCode = () => String(randomInt(0, 10 ** CODE_LEN)).padStart(CODE_LEN, "0");

/** PURE. The code email (plain text: a code, its life, and what to do if it was not you). */
export function codeMail({ to, name, code }) {
  return {
    to,
    subject: `${code} is your Taxila sign-in code`,
    text: `Hello${name ? ` ${name}` : ""},\n\nYour code to sign in to Taxila is:\n\n${code}\n\nIt works once, for ${CODE_MIN} minutes. Type it on the sign-in screen.\n\nIf you did not ask for it, you can ignore this email. Nobody can sign in without the code.\n\nTaxila`,
  };
}

/**
 * The provider interface. `ready(env)` says whether the channel can send at all (no account is read for it, so its
 * answer tells nothing about any email); `send(msg, env, fetchImpl)` delivers one code or throws.
 */
export const PROVIDERS = {
  email: {
    channel: "email",
    ready: (env = process.env) => !!(env.ACS_CONNECTION_STRING && env.ACS_SENDER),
    send: (msg, env = process.env, fetchImpl = fetch) => sendAcsEmail(codeMail(msg), env, fetchImpl),
  },
  phone: {
    channel: "phone",
    ready: () => false,
    send: async () => { throw Object.assign(new Error("phone codes are not built"), { code: "PHONE_UNIMPLEMENTED" }); },
  },
};

/** PURE. The channel a request asks for, or a refusal that names why (the client words it; never a raw string). */
export function channelOf(body, env = process.env) {
  const ch = String(body?.channel ?? "email");
  const p = PROVIDERS[ch];
  if (!p) throw new HttpError(400, "unknown channel", { code: "code.channel" });
  if (!p.ready(env)) throw new HttpError(ch === "phone" ? 501 : 503, `${ch} codes are not available`, { code: `${ch}.unavailable` });
  return p;
}

const emailOf = (body) => {
  const email = String(body?.email ?? "").trim();
  if (!email) throw new HttpError(400, "missing field: email", { field: "email", code: "email.missing" });
  if (!EMAIL.test(email)) throw new HttpError(400, "invalid email", { field: "email", code: "email.bad" });
  return email;
};

/** POST /api/auth/code { channel?: "email" | "phone", email } → 200 { ok, channel, minutes } (the same for any email). */
export async function sendCode(req, res, body) {
  const p = channelOf(body);
  rateLimit(req, "code-send");
  const email = emailOf(body);
  const out = { ok: true, channel: p.channel, minutes: CODE_MIN };
  const g = await one("select id, email, name from guardian where lower(email) = lower($1)", [email]);
  if (!g) return send(res, 200, out);
  const code = newCode();
  // the operator-keyed test account gets its code in the answer (the prod acceptance test has no mailbox); no other does
  const ops = process.env.TAXILA_OPS_KEY;
  const testAccount = /@taxila\.test$/i.test(g.email) && !!ops && req.headers?.["x-taxila-ops"] === ops;
  const work = async () => {
    const n = await one("select count(*)::int as n from password_reset where guardian_id = $1 and created_at > now() - interval '1 hour'", [g.id]);
    if ((n?.n ?? 0) >= MAILS_PER_HOUR) return false;
    // one live code per account (PLAT-11): the new code's tries start at zero, so every older code is spent first
    await q("update password_reset set used_at = now() where guardian_id = $1 and token_hash like 'code:%' and used_at is null", [g.id]);
    await q("insert into password_reset(token_hash, guardian_id, expires_at) values ($1, $2, now() + ($3 || ' minutes')::interval) on conflict (token_hash) do nothing",
      [codeKey(g.id, code), g.id, String(CODE_MIN)]);
    await q("insert into audit(guardian_id, action, detail) values ($1, 'code_sent', $2)", [g.id, { channel: p.channel }]);
    if (!testAccount) await p.send({ to: g.email, name: g.name, code });
    return true;
  };
  if (testAccount) return send(res, 200, (await work()) ? { ...out, testCode: code } : out);
  send(res, 200, out);
  work().catch((e) => console.warn(`[signin] code not sent: ${e?.code ?? e?.message}`));
}

const badCode = () => new HttpError(400, "that code is not right", { field: "code", code: "code.bad" });

/** POST /api/auth/code/verify { email, code } → 200 { guardian } and the session cookie; code.bad / code.tries otherwise. */
export async function verifyCode(req, res, body) {
  rateLimit(req, "code-verify");
  const email = emailOf(body);
  const code = String(body?.code ?? "").replace(/\s/g, "");
  if (!new RegExp(`^\\d{${CODE_LEN}}$`).test(code)) throw badCode();
  const g = await one("select id, email, name from guardian where lower(email) = lower($1)", [email]);
  if (!g) throw badCode();
  // the newest open code's age bounds the wrong tries that count against it
  const open = await one(`select max(created_at) as at from password_reset
      where guardian_id = $1 and token_hash like 'code:%' and used_at is null and expires_at > now()`, [g.id]);
  if (!open?.at) throw badCode();
  // Record the try BEFORE counting (PLAT-05): every request's row is committed before it counts, so of N parallel
  // requests the k-th to commit sees at least k rows, and at most CODE_TRIES ever reach the code compare. (Counting
  // first let N parallel requests all read "under 5".) A right code also leaves a row; it spends every code anyway.
  await q("insert into audit(guardian_id, action) values ($1, 'code_attempt')", [g.id]);
  const tries = await one("select count(*)::int as n from audit where guardian_id = $1 and action = 'code_attempt' and at >= $2", [g.id, open.at]);
  if ((tries?.n ?? 0) > CODE_TRIES) {
    await q("update password_reset set used_at = now() where guardian_id = $1 and token_hash like 'code:%' and used_at is null", [g.id]);
    throw new HttpError(429, "too many tries; ask for a new code", { field: "code", code: "code.tries" });
  }
  const hit = await one(`update password_reset set used_at = now()
      where token_hash = $1 and guardian_id = $2 and used_at is null and expires_at > now() returning guardian_id`, [codeKey(g.id, code), g.id]);
  if (!hit) throw badCode();
  await tx([
    { text: "update password_reset set used_at = now() where guardian_id = $1 and token_hash like 'code:%' and used_at is null returning guardian_id", params: [g.id] },
    { text: "insert into audit(guardian_id, action, detail) values ($1, 'login_ok', $2) returning id", params: [g.id, { via: "code" }] },
  ]);
  await createSession(res, g.id, req.headers?.["user-agent"]);
  send(res, 200, { guardian: { id: g.id, email: g.email, name: g.name } });
}

export const routes = {
  "POST /api/auth/code": sendCode,
  "POST /api/auth/code/verify": verifyCode,
};
