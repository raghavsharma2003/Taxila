// /api/parent/* — the guardian gate (PIN) and the Parent corner's read endpoints (PRODUCT-DESIGN §6).
//
// Gate model. On a shared family phone the child runs inside the guardian's session cookie (server/auth.js),
// so "signed in" is NOT "a grown-up is holding the phone". The Parent corner is therefore behind a second,
// per-session unlock: POST /api/parent/unlock with the guardian PIN stamps auth_session.parent_unlocked_until
// for THIS session only. Every read below goes through requireParent / requireParentChild, which checks the
// child belongs to the guardian (requireChild) AND that this session is unlocked. The PIN itself is stored
// only as a scrypt hash; wrong tries are counted server-side, atomically (5 → a 15 min wait, §6.2). The client
// locks the corner on every exit (ParentCorner unmount, pagehide, the P8 handover, the child shell mounting),
// and the onboarding P7 PIN set never opens it, so a phone handed to the child is never left unlocked.
//
// Routes are exact-match (server/router.js), so ids travel in the query string: ?childId=…&skill=….
import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { q, one } from "../db.js";
import { bad, need, send, parseCookies, HttpError } from "../http.js";
import { requireGuardian, requireChild } from "../auth.js";
import { getTopic, topicSequence, SUBJECT_ORDER } from "../content/curriculum.js";
import { kitFromFile } from "../content/kits.js";
import { topicOf, skillById, misconceptionById } from "../content/index.js";
import { topicStatus } from "../content/next-topic.js";
import { AzureError, tts } from "../azure.js";
import { allowSpeech, DEFAULT_VOICE, MAX_TTS_CHARS } from "./tts.js";
import { MIN_DELAY_MS } from "../learner/bkt.js";

export const PIN_RE = /^\d{4,6}$/;
export const PIN_MAX_TRIES = 5;
export const PIN_LOCK_MIN = 15;
/** How long one unlock lasts [I]: long enough for a Parent-corner visit, short enough that a phone handed back stays locked. */
export const UNLOCK_MIN = 10;
/** Child quotes on parent surfaces are capped (§6.4, R23). */
export const QUOTE_WORDS = 25;
/** Account-password tries on the shared device (first PIN outside onboarding, PIN change, forgotten PIN) per 24 h. */
export const PW_MAX_TRIES = 5;
/** A forgotten-PIN reset takes effect this long after it is asked for (§6.2 interim: no off-device factor yet). */
export const RESET_DELAY_H = 24;
/** A first PIN may be set without the account password only on a session signed in this recently (onboarding P7). */
export const FIRST_PIN_FRESH_MIN = 60;
/** Per-session (or per-IP) burst limit on every secret-checking endpoint, on top of the DB counters [I]. */
export const ATTEMPTS_PER_MIN = 8;

const sha = (s) => createHash("sha256").update(s).digest("hex");
const sessionHash = (req) => {
  const t = parseCookies(req).tx_session;
  return t ? sha(t) : null;
};
const locked = (gate, extra = {}) => new HttpError(403, gate === "set" ? "set a guardian PIN first" : "parent corner is locked", { gate, ...extra });
const audit = (guardianId, action, detail = {}) => q("insert into audit(guardian_id, action, detail) values ($1, $2, $3)", [guardianId, action, detail]);

// Async scrypt in the same `scrypt$N$r$p$salt$hash` format as server/auth.js, so a burst of guesses does not
// block the event loop for every other family (scryptSync is ~50 ms of CPU each).
const scryptP = (pw, salt, len, opts) => new Promise((res, rej) => scrypt(pw, salt, len, opts, (e, k) => (e ? rej(e) : res(k))));
export async function hashSecret(pw) {
  const salt = randomBytes(16);
  const h = await scryptP(String(pw), salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64")}$${h.toString("base64")}`;
}
export async function verifySecret(pw, stored) {
  const [alg, n, r, p, salt, hash] = String(stored || "").split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const want = Buffer.from(hash, "base64");
  const got = await scryptP(String(pw), Buffer.from(salt, "base64"), want.length, { N: +n, r: +r, p: +p });
  return want.length === got.length && timingSafeEqual(want, got);
}

// In-process burst limiter. The DB counters below are the real bound (they hold across replicas); this only
// stops one session from queueing hundreds of scrypt calls in a second.
const bursts = new Map();
export function rateLimit(req, route, now = Date.now()) {
  const who = sessionHash(req) || req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "anon";
  const key = `${route}:${who}`;
  const list = (bursts.get(key) || []).filter((t) => now - t < 60_000);
  if (list.length >= ATTEMPTS_PER_MIN) {
    bursts.set(key, list);
    throw new HttpError(429, "too many tries; wait a minute", { gate: "wait", lockedUntil: new Date(list[0] + 60_000).toISOString() });
  }
  list.push(now);
  bursts.set(key, list);
  if (bursts.size > 5000) for (const [k, v] of bursts) if (!v.length || now - v.at(-1) > 60_000) bursts.delete(k);
}

/** Trivially guessable PINs a child would try first. */
export function weakPin(pin) {
  if (/^(\d)\1+$/.test(pin)) return true;                           // 0000, 1111
  const asc = "0123456789012345", desc = "9876543210987654";
  if (asc.includes(pin) || desc.includes(pin)) return true;        // 1234, 4321
  return false;
}
const checkPinShape = (p) => {
  if (!PIN_RE.test(p)) throw bad("PIN must be 4 to 6 digits");
  if (weakPin(p)) throw bad("choose a PIN that is not a simple run like 1234 or 1111");
};

/**
 * A pending forgotten-PIN reset lives on guardian_pin (pending_hash, pending_effective_at; migration 007), not
 * in audit: the audit trail will be exportable (§6.9) and a 4-6 digit PIN hash is brute-forceable offline.
 * Audit keeps only the request metadata.
 */
async function pendingReset(guardianId) {
  const r = await one(`select pending_effective_at, pending_requested_at from guardian_pin where guardian_id = $1 and pending_hash is not null`, [guardianId]);
  return r ? { requestedAt: r.pending_requested_at, effectiveAt: new Date(r.pending_effective_at).toISOString() } : null;
}
/** Apply a pending reset whose delay has passed. Idempotent (the update clears the pending columns). */
async function applyDueReset(guardianId) {
  const r = await one(`update guardian_pin set pin_hash = pending_hash, pending_hash = null, pending_effective_at = null, pending_requested_at = null,
      failed = 0, locked_until = null, updated_at = now()
    where guardian_id = $1 and pending_hash is not null and pending_effective_at <= now() returning guardian_id`, [guardianId]);
  if (r) await audit(guardianId, "pin_reset_applied");
}
const CLEAR_PENDING = "pending_hash = null, pending_effective_at = null, pending_requested_at = null";

async function gateState(req, guardianId) {
  const pin = await one("select failed, locked_until, locked_until > now() as is_locked from guardian_pin where guardian_id = $1", [guardianId]);
  const h = sessionHash(req);
  const s = h ? await one(`select parent_unlocked_until, parent_unlocked_until > now() as unlocked,
      created_at > now() - ($2 || ' minutes')::interval as fresh from auth_session where token_hash = $1`, [h, String(FIRST_PIN_FRESH_MIN)]) : null;
  const pend = pin ? await pendingReset(guardianId) : null;
  return {
    hasPin: !!pin,
    unlocked: !!pin && !!s?.unlocked,
    unlockedUntil: pin && s?.unlocked ? s.parent_unlocked_until : null,
    lockedUntil: pin?.is_locked ? pin.locked_until : null,
    // A first PIN outside onboarding asks for the account password, so a child who reaches the gate first
    // cannot claim the corner (onboarding P7 runs on a session signed in minutes ago).
    firstSetNeedsPassword: !pin && !s?.fresh,
    pendingResetAt: pend ? pend.effectiveAt : null,
  };
}
const stampUnlock = async (req) => {
  const h = sessionHash(req);
  if (h) await q(`update auth_session set parent_unlocked_until = now() + ($2 || ' minutes')::interval where token_hash = $1`, [h, String(UNLOCK_MIN)]);
};

/**
 * One account-password try on the shared device, counted before it is checked. Insert-then-count bounds a
 * burst: of any set of concurrent tries, the one that counts last sees every insert of the set, so at most
 * PW_MAX_TRIES of them can see a count within the limit. A correct password resets the window, and so does a
 * correct current PIN (unlock): proof of the parent, so a child who burns the tries at "Forgot the PIN?" cannot
 * keep the guardian out of PIN change for 24 h.
 */
export async function checkAccountPassword(guardianId, password, purpose) {
  await audit(guardianId, "pw_attempt", { purpose });
  const c = await one(`select count(*)::int as n, min(at) as first from audit where guardian_id = $1 and action = 'pw_attempt'
      and at > now() - ($2 || ' hours')::interval
      and id > coalesce((select max(id) from audit where guardian_id = $1 and action = 'pw_attempt_ok'), 0)`, [guardianId, String(RESET_DELAY_H)]);
  if (c.n > PW_MAX_TRIES) {
    const until = new Date(new Date(c.first).getTime() + RESET_DELAY_H * 3600_000).toISOString();
    throw new HttpError(403, "too many password tries; try again later", { gate: "wait", lockedUntil: until });
  }
  const row = await one("select pw_hash from guardian where id = $1", [guardianId]);
  if (!password || !(await verifySecret(String(password), row?.pw_hash))) {
    await audit(guardianId, `${purpose}_denied`, { triesLeft: PW_MAX_TRIES - c.n });
    throw bad("account password is incorrect", { triesLeft: PW_MAX_TRIES - c.n });
  }
  await audit(guardianId, "pw_attempt_ok", { purpose });
}

/** → guardian, or 403 { gate: "set" | "locked" }. */
export async function requireParent(req) {
  const g = await requireGuardian(req);
  const st = await gateState(req, g.id);
  if (!st.hasPin) throw locked("set");
  if (!st.unlocked) throw locked("locked");
  return g;
}
/**
 * Consent-grade account actions (consent, add/edit/delete a child): open while no PIN exists (first-run
 * setup, before P7), otherwise only inside an unlocked Parent corner. The child shares the guardian cookie,
 * so the cookie alone is not "a grown-up is here" (§6.2, §2.3).
 */
export async function requireParentIfPinSet(req) {
  const g = await requireGuardian(req);
  const st = await gateState(req, g.id);
  if (st.hasPin && !st.unlocked) throw locked("locked");
  return g;
}
/** → { guardian, child } for a child of this guardian, inside an unlocked Parent corner. */
export async function requireParentChild(req, childId) {
  if (!childId || !/^[0-9a-f-]{36}$/i.test(childId)) throw bad("invalid childId");
  await requireParent(req);
  return requireChild(req, childId);
}
const query = (req) => new URL(req.url || "/", "http://x").searchParams;

// ───────────────────────────── gate ─────────────────────────────

async function getPin(req, res) {
  const g = await requireGuardian(req);
  await applyDueReset(g.id);
  send(res, 200, await gateState(req, g.id));
}

/**
 * Set or change the PIN. body: { pin, password? }
 * - First set during onboarding P7 (session signed in < FIRST_PIN_FRESH_MIN ago): no password, and the corner
 *   is NOT opened: the phone is about to be handed to the child (P8).
 * - First set anywhere else: the account password is required (counted), and this session's corner opens.
 * - Change: the corner must be unlocked AND the account password re-entered (stand-in for §6.2 OTP re-auth).
 */
async function setPin(req, res, body) {
  const g = await requireGuardian(req);
  rateLimit(req, "pin");
  const { pin } = need(body, "pin");
  const p = String(pin);
  checkPinShape(p);
  const st = await gateState(req, g.id);
  if (st.hasPin) {
    if (!st.unlocked) throw locked("locked");
    await checkAccountPassword(g.id, body.password, "pin_change");
  } else if (body.password || st.firstSetNeedsPassword) {
    if (!body.password) throw new HttpError(403, "enter the account password to set the first PIN", { gate: "password" });
    await checkAccountPassword(g.id, body.password, "pin_first");
  }
  const hash = await hashSecret(p);
  await q(`insert into guardian_pin(guardian_id, pin_hash) values ($1,$2)
    on conflict (guardian_id) do update set pin_hash = excluded.pin_hash, failed = 0, locked_until = null, ${CLEAR_PENDING}, updated_at = now()`, [g.id, hash]);
  // Only a password-verified first set opens the corner; the onboarding set hands the phone on locked.
  if (!st.hasPin && body.password) await stampUnlock(req);
  await audit(g.id, st.hasPin ? "pin_change" : "pin_set");
  send(res, 200, await gateState(req, g.id));
}

/**
 * Forgotten PIN: re-authenticate with the account password (counted: PW_MAX_TRIES per 24 h), then the new PIN
 * takes effect RESET_DELAY_H later, and only if nobody unlocks with the current PIN first (which cancels it).
 * The gate screen shows the pending reset, which is the notice on the device. INTERIM for §6.2 (an off-device
 * factor such as OTP replaces this); the WhatsApp/email notice is not wired, so the audit row is the record.
 * The corner is never opened by a reset. body: { pin, password }
 */
async function resetPin(req, res, body) {
  const g = await requireGuardian(req);
  rateLimit(req, "reset");
  const { pin, password } = need(body, "pin", "password");
  const p = String(pin);
  checkPinShape(p);
  const has = await one("select 1 from guardian_pin where guardian_id = $1", [g.id]);
  if (!has) throw locked("set");
  await checkAccountPassword(g.id, password, "pin_reset");
  const effectiveAt = new Date(Date.now() + RESET_DELAY_H * 3600_000).toISOString();
  await q(`update guardian_pin set pending_hash = $2, pending_effective_at = $3, pending_requested_at = now() where guardian_id = $1`,
    [g.id, await hashSecret(p), effectiveAt]);
  await audit(g.id, "pin_reset_pending", { effectiveAt });
  send(res, 200, await gateState(req, g.id));
}

/** body: { pin } → gate state, or 403 with { gate: "locked", triesLeft } / { gate: "wait", lockedUntil }. */
async function unlock(req, res, body) {
  const g = await requireGuardian(req);
  rateLimit(req, "unlock");
  const { pin } = need(body, "pin");
  await applyDueReset(g.id);
  // Count the try BEFORE checking it, atomically: concurrent guesses each take their own number, so a burst
  // cannot share one "failed" read (the 5-tries bound holds under parallel requests).
  const row = await one(`update guardian_pin set failed = failed + 1
      where guardian_id = $1 and (locked_until is null or locked_until <= now()) returning pin_hash, failed`, [g.id]);
  if (!row) {
    const cur = await one("select locked_until from guardian_pin where guardian_id = $1", [g.id]);
    if (!cur) throw locked("set");
    throw new HttpError(403, "too many tries; wait", { gate: "wait", lockedUntil: cur.locked_until });
  }
  if (row.failed > PIN_MAX_TRIES) {
    // Beyond the limit inside one burst: never checked.
    const cur = await one("select locked_until from guardian_pin where guardian_id = $1", [g.id]);
    throw new HttpError(403, "too many tries; wait", { gate: "wait", lockedUntil: cur?.locked_until ?? null });
  }
  if (!(await verifySecret(String(pin), row.pin_hash))) {
    if (row.failed >= PIN_MAX_TRIES) {
      const r = await one(`update guardian_pin set failed = 0, locked_until = now() + ($2 || ' minutes')::interval where guardian_id = $1 returning locked_until`,
        [g.id, String(PIN_LOCK_MIN)]);
      // §6.2 says the guardian is notified; WhatsApp is not wired yet, so the audit row is the record.
      await audit(g.id, "pin_lockout", { minutes: PIN_LOCK_MIN });
      throw new HttpError(403, "too many tries; wait", { gate: "wait", lockedUntil: r.locked_until });
    }
    throw new HttpError(403, "wrong PIN", { gate: "locked", triesLeft: PIN_MAX_TRIES - row.failed });
  }
  // Whoever knows the current PIN is the parent: a pending forgotten-PIN reset (maybe not theirs) is cancelled,
  // and the account-password try window restarts (see checkAccountPassword).
  const pend = await pendingReset(g.id);
  await q(`update guardian_pin set failed = 0, locked_until = null, ${CLEAR_PENDING} where guardian_id = $1`, [g.id]);
  if (pend) await audit(g.id, "pin_reset_cancelled", { requestedAt: pend.requestedAt });
  await audit(g.id, "pw_attempt_ok", { purpose: "pin_unlock" });
  await stampUnlock(req);
  send(res, 200, await gateState(req, g.id));
}

async function lock(req, res) {
  await requireGuardian(req);
  const h = sessionHash(req);
  if (h) await q("update auth_session set parent_unlocked_until = null where token_hash = $1", [h]);
  send(res, 200, { ok: true });
}

// ───────────────────────────── ledger words ─────────────────────────────

/**
 * Delayed checks of one skill, folded from its evidence rows (ascending, `no_evidence` excluded). A P10 row is a
 * delayed check under the same rule as server/learner/bkt.js applyEvidence: the previous contact with the skill
 * was in a different lesson and at least MIN_DELAY_MS (20 h) earlier. Returns whether a delayed check has ever
 * passed and how many delayed checks have been missed in a row since the latest pass (§6.4.1, R25).
 * @param {{ at: any, probe: string, outcome: string, hints_used?: number, lesson_id?: string|null }[]} rows
 * @returns {{ passed: boolean, misses: number }}
 */
export function foldDelayedChecks(rows) {
  let passed = false, misses = 0, prev = null;
  for (const r of rows) {
    if (r.outcome === "no_evidence") continue;
    if (r.probe === "P10" && prev && prev.lesson_id !== r.lesson_id && new Date(r.at).getTime() - new Date(prev.at).getTime() >= MIN_DELAY_MS) {
      if (r.outcome === "correct" && !(r.hints_used > 0)) { passed = true; misses = 0; } else if (passed) misses += 1;
    }
    prev = r;
  }
  return { passed, misses };
}

/** skill_id → foldDelayedChecks for a child (one query; only skills with a P10 row can have a delayed check). */
async function delayedCheckMap(childId, skillIds = null) {
  const rows = await q(`select skill_id, at, probe, outcome, hints_used, lesson_id from evidence
      where child_id = $1 and outcome <> 'no_evidence' and ($2::text[] is null or skill_id = any($2::text[]))
        and skill_id in (select skill_id from evidence where child_id = $1 and probe = 'P10')
      order by skill_id, at, id`, [childId, skillIds]);
  const by = new Map();
  for (const r of rows) { if (!by.has(r.skill_id)) by.set(r.skill_id, []); by.get(r.skill_id).push(r); }
  return new Map([...by].map(([k, v]) => [k, foldDelayedChecks(v)]));
}

const LEARNED = new Set(["learned_today", "mastered", "due"]);

/**
 * skill_state row (+ its delayed checks) → the parent's state (§6.4 table; R11 words).
 * - `due` (server/learner/bkt.js) only means the scheduled re-check time has passed; it is read as its
 *   underlying level (Pakka if a delayed pass exists, else Aa gaya with its date) and NEVER as "re-check due":
 *   elapsed time alone must not change what the parent sees (absence invariance, PD-G19, R13).
 * - "Pakka · dobara jaanch" needs evidence: a learned skill whose latest delayed check, after a delayed pass,
 *   was missed once (§6.4.1, R25). Two consecutive misses read Aa gaya. The bkt fold clears delayed_pass on a
 *   miss, so the evidence (not the row's flag) is what decides here.
 * @param {any} row skill_state row or null
 * @param {{ passed: boolean, misses: number } | null} [dc] foldDelayedChecks for the skill
 * @returns {{ level: 0|1|2|3, key: "unseen"|"practising"|"learned_today"|"mastered", recheck: boolean }}
 */
export function parentState(row, dc = null) {
  const s = row?.status ?? "unseen";
  if (LEARNED.has(s) && dc?.passed && dc.misses === 1) return { level: 3, key: "mastered", recheck: true };
  if (LEARNED.has(s) && dc?.passed && dc.misses >= 2) return { level: 2, key: "learned_today", recheck: false };
  if (s === "mastered") return { level: 3, key: "mastered", recheck: false };
  if (s === "learned_today") return { level: 2, key: "learned_today", recheck: false };
  if (s === "due") return row.delayed_pass ? { level: 3, key: "mastered", recheck: false } : { level: 2, key: "learned_today", recheck: false };
  if (s === "introduced" || s === "practising") return { level: 1, key: "practising", recheck: false };
  return { level: 0, key: "unseen", recheck: false };
}

/** topicStatus (content/next-topic.js) → parent state. "weak" is never shown as a word (PX4): it reads as practising. */
export function topicParentState(status) {
  return ({ mastered: { level: 3, key: "mastered" }, learned: { level: 2, key: "learned_today" }, in_progress: { level: 1, key: "practising" },
    weak: { level: 1, key: "practising" } })[status] ?? { level: 0, key: "unseen" };
}

/** What kind of check a probe was, in plain words (§6.4 "what kind of check"). Shapes for the client to word. */
export const PROBE_KIND = {
  P1: "teachback", P2: "why", P3: "near_transfer", P4: "far_transfer", P5: "predict", P6: "error_spot", P7: "mixup_check",
  P8: "contrast", P10: "retrieval", P14: "other_representation", P15: "practice",
};

/** First `n` words of a child's turn (R23: ≤ 25-word quotes on parent surfaces). */
export function quote(text, n = QUOTE_WORDS) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  return words.length > n ? words.slice(0, n).join(" ") + " …" : words.join(" ");
}

const skillTitle = async (id) => {
  try { return (await skillById(id))?.title ?? null; } catch { return null; }
};
const childOut = (c) => ({ id: c.id, firstName: c.first_name, classLevel: c.class_level, board: c.board, schoolMedium: c.school_medium,
  languagePref: c.language_pref, avatar: c.avatar });

// ───────────────────────────── controls ─────────────────────────────

/** §6.9 defaults by class [I]: Class 1-2 20 min (two B1 micro-sessions), 3-5 30, 6-9 45; hours 07:00-20:30. */
export function defaultControls(classLevel) {
  const cl = Number(classLevel);
  return { dailyMinutes: cl <= 2 ? 20 : cl <= 5 ? 30 : 45, hoursStart: "07:00", hoursEnd: "20:30", captionsAlways: false, comfortMode: false,
    address: cl >= 5 ? "aap" : null, reportChannel: "whatsapp" };
}
const controlsOut = (row, child) => row ? {
  dailyMinutes: row.daily_minutes, hoursStart: row.hours_start, hoursEnd: row.hours_end, captionsAlways: row.captions_always,
  comfortMode: row.comfort_mode, address: row.address, reportChannel: row.report_channel, saved: true,
} : { ...defaultControls(child.class_level), saved: false };

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Validate a partial controls body against the current values → the full row to store. */
export function mergeControls(current, body) {
  const out = { ...current };
  if (body.dailyMinutes !== undefined) {
    const m = Number(body.dailyMinutes);
    if (!Number.isInteger(m) || m < 10 || m > 120) throw bad("daily minutes must be 10-120");
    out.dailyMinutes = m;
  }
  for (const k of ["hoursStart", "hoursEnd"]) {
    if (body[k] !== undefined) {
      if (!HHMM.test(String(body[k]))) throw bad(`${k} must be HH:MM`);
      out[k] = String(body[k]);
    }
  }
  if (out.hoursStart >= out.hoursEnd) throw bad("allowed hours must end after they start");
  for (const k of ["captionsAlways", "comfortMode"]) if (body[k] !== undefined) out[k] = !!body[k];
  if (body.address !== undefined) {
    if (body.address !== null && !["tum", "aap"].includes(body.address)) throw bad("address must be tum or aap");
    out.address = body.address;
  }
  if (body.reportChannel !== undefined) {
    if (!["whatsapp", "app"].includes(body.reportChannel)) throw bad("report channel must be whatsapp or app");
    out.reportChannel = body.reportChannel;
  }
  return out;
}

async function getControls(req, res) {
  const { child } = await requireParentChild(req, query(req).get("childId"));
  const row = await one("select * from child_controls where child_id = $1", [child.id]);
  send(res, 200, { controls: controlsOut(row, child) });
}

/**
 * body: { childId, ...partial controls }. Gate: an unlocked Parent corner, EXCEPT during setup (onboarding P7,
 * before any PIN exists, on a freshly signed-in session), when the signed-in guardian may write the first row.
 */
async function setControls(req, res, body) {
  const childId = need(body, "childId").childId;
  const g = await requireGuardian(req);
  const st = await gateState(req, g.id);
  if (st.hasPin && !st.unlocked) throw locked("locked");
  // No PIN yet: only the onboarding session (signed in minutes ago) may write the first row.
  if (!st.hasPin && st.firstSetNeedsPassword) throw locked("set");
  const { child } = await requireChild(req, childId);
  const row = await one("select * from child_controls where child_id = $1", [child.id]);
  const c = mergeControls(controlsOut(row, child), body);
  const saved = await one(`insert into child_controls(child_id, daily_minutes, hours_start, hours_end, captions_always, comfort_mode, address, report_channel)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (child_id) do update set daily_minutes = excluded.daily_minutes, hours_start = excluded.hours_start, hours_end = excluded.hours_end,
       captions_always = excluded.captions_always, comfort_mode = excluded.comfort_mode, address = excluded.address,
       report_channel = excluded.report_channel, updated_at = now()
     returning *`, [child.id, c.dailyMinutes, c.hoursStart, c.hoursEnd, c.captionsAlways, c.comfortMode, c.address, c.reportChannel]);
  await q("insert into audit(guardian_id, action, detail) values ($1, 'controls', $2)", [g.id, { childId: child.id }]);
  send(res, 200, { controls: controlsOut(saved, child) });
}

// ───────────────────────────── reads ─────────────────────────────

/** GET /api/parent/overview?childId= → Home's three things (§6.3) + the skill list one level down. */
async function overview(req, res) {
  const { child } = await requireParentChild(req, query(req).get("childId"));
  send(res, 200, await homeData(child));
}

/** Everything Parent Home shows for one child (overview, and the IS HAFTE read-aloud). */
async function homeData(child) {
  const [skills, mis, lessons, week, controls] = await Promise.all([
    q("select * from skill_state where child_id = $1 order by last_seen desc limit 60", [child.id]),
    q(`select misconception_id, evidence_count, last_seen from misconception_state
         where child_id = $1 and not resolved and last_seen > now() - interval '7 days' order by last_seen desc limit 3`, [child.id]),
    q("select id, topic_id, started_at, ended_at, parent_note from lesson where child_id = $1 order by started_at desc limit 1", [child.id]),
    one(`select count(*)::int as lessons,
           coalesce(round(sum(extract(epoch from (coalesce(ended_at, started_at) - started_at))) / 60), 0)::int as minutes
         from lesson where child_id = $1 and started_at > now() - interval '7 days'`, [child.id]),
    one("select * from child_controls where child_id = $1", [child.id]),
  ]);
  const dcs = skills.length ? await delayedCheckMap(child.id, skills.map((r) => r.skill_id)) : new Map();
  const titled = await Promise.all(skills.map(async (r) => ({
    skillId: r.skill_id, title: (await skillTitle(r.skill_id)) ?? r.skill_id, ...parentState(r, dcs.get(r.skill_id)),
    nextReview: r.next_review, lastSeen: r.last_seen,
  })));
  const weekAgo = Date.now() - 7 * 86400_000;
  // IS HAFTE: one capability + one tricky bit, each with a ledger row behind it (PX1), or nothing.
  const canNow = titled.find((s) => s.level >= 2 && new Date(s.lastSeen).getTime() > weekAgo) ?? null;
  let tricky = null;
  if (mis[0]) {
    const ev = await one("select skill_id from evidence where child_id = $1 and misconception_id = $2 order by at desc limit 1", [child.id, mis[0].misconception_id]);
    let belief = null;
    try { belief = (await misconceptionById(mis[0].misconception_id))?.belief ?? null; } catch { /* kit not loadable: no belief text */ }
    const sk = ev ? titled.find((s) => s.skillId === ev.skill_id) : null;
    if (sk) tricky = { ...sk, misconception: belief };
  }
  if (!tricky) tricky = titled.find((s) => s.level === 1 && new Date(s.lastSeen).getTime() > weekAgo && s.skillId !== canNow?.skillId) ?? null;
  const last = lessons[0];
  const homeTask = last?.parent_note ? { lessonId: last.id, text: last.parent_note, at: last.started_at } : null;
  return {
    child: childOut(child),
    isHafte: { canNow, tricky },
    homeTask,
    week: { lessons: week?.lessons ?? 0, minutes: week?.minutes ?? 0 },
    skills: titled,
    controls: controlsOut(controls, child),
    updatedAt: new Date().toISOString(),
  };
}

/** GET /api/parent/evidence?childId=&skill= → the Kaise pata? sheet (§6.4). */
async function evidence(req, res) {
  const sp = query(req);
  const { child } = await requireParentChild(req, sp.get("childId"));
  const skill = sp.get("skill");
  if (!skill || skill.length > 120) throw bad("invalid skill");
  const [state, rows, dcs] = await Promise.all([
    one("select * from skill_state where child_id = $1 and skill_id = $2", [child.id, skill]),
    q(`select e.id, e.at, e.probe, e.outcome, e.misconception_id, e.hints_used, e.lesson_id, t.text as child_text, t.speaker
         from evidence e left join turn t on t.id = e.turn_id
        where e.child_id = $1 and e.skill_id = $2 order by e.at desc limit 40`, [child.id, skill]),
    delayedCheckMap(child.id, [skill]),
  ]);
  const beliefs = new Map();
  for (const r of rows) {
    if (r.misconception_id && !beliefs.has(r.misconception_id)) {
      try { beliefs.set(r.misconception_id, (await misconceptionById(r.misconception_id))?.belief ?? null); } catch { beliefs.set(r.misconception_id, null); }
    }
  }
  const topicId = topicOf(skill);
  const topic = topicId ? getTopic(topicId) : null;
  send(res, 200, {
    skill: { id: skill, title: (await skillTitle(skill)) ?? skill, outcomes: topic?.outcomes ?? [], topic: topic ? { id: topic.id, title: topic.title, chapter: topic.chapter.title } : null },
    state: state ? { ...parentState(state, dcs.get(skill)), nextReview: state.next_review, attempts: state.attempts, correctUnaided: state.correct_unaided,
      generativePass: state.generative_pass, delayedPass: state.delayed_pass } : { ...parentState(null), nextReview: null },
    rows: rows.map((r) => ({
      id: String(r.id), at: r.at, kind: PROBE_KIND[r.probe] ?? "practice", probe: r.probe, outcome: r.outcome, hintsUsed: r.hints_used,
      lessonId: r.lesson_id, words: r.speaker === "child" ? quote(r.child_text) : null,
      misconception: r.misconception_id ? beliefs.get(r.misconception_id) ?? null : null,
    })),
  });
}

/** GET /api/parent/lessons?childId= → reverse-chronological lesson list (§6.6). */
async function lessons(req, res) {
  const { child } = await requireParentChild(req, query(req).get("childId"));
  const rows = await q(`select l.id, l.topic_id, l.kind, l.started_at, l.ended_at, l.parent_note,
       (select count(*)::int from evidence e where e.lesson_id = l.id) as evidence_count
     from lesson l where l.child_id = $1 order by l.started_at desc limit 50`, [child.id]);
  send(res, 200, {
    lessons: rows.map((r) => {
      const t = getTopic(r.topic_id);
      return { id: r.id, topic: t ? { id: t.id, title: t.title, chapter: t.chapter.title, subject: t.subject } : { id: r.topic_id, title: r.topic_id },
        kind: r.kind, startedAt: r.started_at, endedAt: r.ended_at, minutes: r.ended_at ? Math.max(1, Math.round((new Date(r.ended_at) - new Date(r.started_at)) / 60000)) : null,
        note: r.parent_note, evidenceCount: r.evidence_count };
    }),
  });
}

/** GET /api/parent/lesson?childId=&lessonId= → the per-lesson card (§6.6): note, skills touched, one quote. */
async function lessonCard(req, res) {
  const sp = query(req);
  const { child } = await requireParentChild(req, sp.get("childId"));
  const lid = sp.get("lessonId");
  if (!lid || !/^[0-9a-f-]{36}$/i.test(lid)) throw bad("invalid lessonId");
  const l = await one("select * from lesson where id = $1 and child_id = $2", [lid, child.id]);
  if (!l) throw new HttpError(404, "lesson not found");
  const [ev, turns] = await Promise.all([
    q(`select skill_id, count(*)::int as n, sum(case when outcome = 'correct' and hints_used = 0 then 1 else 0 end)::int as unaided
         from evidence where lesson_id = $1 group by skill_id order by n desc`, [l.id]),
    q("select seq, speaker, text from turn where lesson_id = $1 and speaker in ('child','teacher') order by seq", [l.id]),
  ]);
  const states = ev.length ? await q("select * from skill_state where child_id = $1 and skill_id = any($2::text[])", [child.id, ev.map((r) => r.skill_id)]) : [];
  const byId = new Map(states.map((s) => [s.skill_id, s]));
  const dcs = ev.length ? await delayedCheckMap(child.id, ev.map((r) => r.skill_id)) : new Map();
  const t = getTopic(l.topic_id);
  // One child quote: the longest child turn (a sentence the child actually built), capped at 25 words.
  const childTurns = turns.filter((x) => x.speaker === "child" && x.text?.trim());
  const best = childTurns.sort((a, b) => b.text.split(/\s+/).length - a.text.split(/\s+/).length)[0];
  // Full verbatim transcripts: Class 1-4 visible; Class 5-9 on request (§6.11). The request path is not built
  // yet, so Class 5-9 transcripts are withheld here and the client says how to ask.
  const transcriptVisible = child.class_level <= 4;
  send(res, 200, {
    lesson: { id: l.id, topic: t ? { id: t.id, title: t.title, chapter: t.chapter.title, subject: t.subject } : { id: l.topic_id, title: l.topic_id },
      startedAt: l.started_at, endedAt: l.ended_at, note: l.parent_note, summary: l.summary },
    skills: await Promise.all(ev.map(async (r) => ({ skillId: r.skill_id, title: (await skillTitle(r.skill_id)) ?? r.skill_id, attempts: r.n, unaided: r.unaided,
      ...parentState(byId.get(r.skill_id), dcs.get(r.skill_id)), nextReview: byId.get(r.skill_id)?.next_review ?? null }))),
    quote: best ? quote(best.text) : null,
    transcript: transcriptVisible ? turns.map((x) => ({ seq: x.seq, speaker: x.speaker, text: x.text })) : null,
    transcriptPolicy: transcriptVisible ? "visible" : "on_request",
  });
}

/** GET /api/parent/syllabus?childId= → the class's chapters with a chip per topic (§6.5). */
async function syllabus(req, res) {
  const { child } = await requireParentChild(req, query(req).get("childId"));
  const rows = await q("select skill_id, status, p_known, attempts from skill_state where child_id = $1", [child.id]);
  const byTopic = new Map();
  for (const r of rows) {
    const tid = topicOf(r.skill_id);
    if (!tid) continue;
    if (!byTopic.has(tid)) byTopic.set(tid, []);
    byTopic.get(tid).push({ status: r.status, pKnown: r.p_known, attempts: r.attempts });
  }
  const subjects = [];
  for (const subject of SUBJECT_ORDER) {
    const ids = topicSequence(child.class_level, subject);
    if (!ids.length) continue;
    const chapters = [];
    for (const id of ids) {
      const t = getTopic(id);
      let ch = chapters.at(-1);
      if (!ch || ch.id !== t.chapter.id) chapters.push(ch = { id: t.chapter.id, number: t.chapter.number, title: t.chapter.title, topics: [] });
      let skillCount = 0;
      try { skillCount = kitFromFile(t)?.skills.length ?? 0; } catch { /* no kit file */ }
      ch.topics.push({ id: t.id, title: t.title, ...topicParentState(topicStatus(byTopic.get(t.id) ?? [], skillCount)) });
    }
    subjects.push({ subject, book: getTopic(ids[0]).book, chapters });
  }
  const all = subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics));
  send(res, 200, {
    classLevel: child.class_level, board: child.board, subjects,
    header: { chaptersTouched: subjects.reduce((n, s) => n + s.chapters.filter((c) => c.topics.some((t) => t.level > 0)).length, 0),
      topicsPakka: all.filter((t) => t.level === 3).length, topics: all.length },
  });
}

/** POST /api/parent/hometask { childId, lessonId, done } — "Ho gaya" / "Is hafte nahi". Logged only; never a KPI (§6.7). */
async function homeTask(req, res, body) {
  const { childId, lessonId } = need(body, "childId", "lessonId");
  if (!/^[0-9a-f-]{36}$/i.test(String(lessonId))) throw bad("invalid lessonId");
  const { guardian, child } = await requireParentChild(req, childId);
  if (!(await one("select 1 from lesson where id = $1 and child_id = $2", [lessonId, child.id]))) throw new HttpError(404, "lesson not found");
  await q("insert into audit(guardian_id, action, detail) values ($1, 'home_task', $2)", [guardian.id, { childId: child.id, lessonId, done: !!body.done }]);
  send(res, 200, { ok: true });
}

// ───────────────────────────── read-aloud (PX10) ─────────────────────────────

/**
 * Spoken versions of the P5 consent rows. KEEP IN STEP with src/onboarding/Consent.tsx (same sentences):
 * the speech route speaks only server-held or server-composed text, never text from the client, so it is
 * not a speech proxy on the Azure grant.
 */
export const CONSENT_SPEECH = {
  core_tutoring: "Lessons. She teaches your child live and keeps their answers, so you can see what they learned. Needed to use Taxila.",
  learning_profile: "Remember learning across days. So the next lesson starts from where your child is, and she checks again on a later day. Choose: yes, remember. Or: only this session.",
  memory: "Remember what your child says they like. Cricket, cooking, a pet's name. She uses it in examples. You can see and delete each one. Choose no, or yes.",
  research: "Research. We do not use your child's data for research now. If that changes, we will ask you here first.",
  reports: "Where reports go. One short weekly report with what your child can now do and one thing to try at home. Choose WhatsApp, or only in the app.",
};
const SPOKEN_STATE = { unseen: "not yet", practising: "practising", learned_today: "got it today", mastered: "secure" };

/** IS HAFTE as one short paragraph (§6.3), from the same rows the card shows. */
export function hafteSpeech(name, d) {
  const { canNow, tricky } = d.isHafte;
  if (!canNow && !tricky) return d.week.lessons ? "This week: nothing new to report yet from this week's lessons." : "This week: no lessons. Nothing to fix.";
  const parts = ["This week."];
  if (canNow) parts.push(`${name} can now do: ${canNow.title}. ${SPOKEN_STATE[canNow.key] ?? ""}.`);
  if (tricky) parts.push(`Still tricky: ${tricky.title}.${tricky.misconception ? ` The mix-up: ${tricky.misconception}.` : ""}`);
  return parts.join(" ").replace(/\s+\./g, ".");
}

const clipCache = new Map(); // fixed consent text → mp3 (the same for every family)

/**
 * GET /api/parent/speak?what=consent&row=… | what=hafte&childId=… | what=lesson&childId=…&lessonId=… → audio/mpeg.
 * Consent rows: any signed-in guardian (onboarding P5, before a PIN). Child data: inside an unlocked corner.
 */
async function speakCard(req, res) {
  const sp = query(req);
  const what = sp.get("what");
  let guardianId, text, cache = false;
  if (what === "consent") {
    guardianId = (await requireGuardian(req)).id;
    text = CONSENT_SPEECH[sp.get("row")];
    if (!text) throw bad("unknown consent row");
    cache = true;
  } else if (what === "hafte") {
    const { guardian, child } = await requireParentChild(req, sp.get("childId"));
    guardianId = guardian.id;
    text = hafteSpeech(child.first_name, await homeData(child));
  } else if (what === "lesson") {
    const { guardian, child } = await requireParentChild(req, sp.get("childId"));
    guardianId = guardian.id;
    const lid = sp.get("lessonId");
    if (!lid || !/^[0-9a-f-]{36}$/i.test(lid)) throw bad("invalid lessonId");
    const l = await one("select topic_id, parent_note, ended_at from lesson where id = $1 and child_id = $2", [lid, child.id]);
    if (!l) throw new HttpError(404, "lesson not found");
    const t = getTopic(l.topic_id);
    text = `${t?.title ?? "Lesson"}. ${l.parent_note || (l.ended_at ? "The summary for this lesson is not ready." : "This lesson did not finish, so there is no summary.")}`;
  } else throw bad("unknown what");
  if (!allowSpeech(guardianId)) throw new HttpError(429, "too many speech requests");
  let audio = cache ? clipCache.get(text) : null;
  if (!audio) {
    try {
      audio = await tts(text.slice(0, MAX_TTS_CHARS), DEFAULT_VOICE);
    } catch (e) {
      if (e instanceof AzureError) throw new HttpError(502, "speech service unavailable");
      throw e;
    }
    if (cache) clipCache.set(text, audio);
  }
  res.statusCode = 200;
  res.setHeader("content-type", "audio/mpeg");
  res.setHeader("content-length", String(audio.length));
  res.setHeader("cache-control", cache ? "private, max-age=86400" : "no-store");
  res.end(audio);
}

export const routes = {
  "GET /api/parent/speak": speakCard,
  "GET /api/parent/pin": getPin,
  "POST /api/parent/pin": setPin,
  "POST /api/parent/pin/reset": resetPin,
  "POST /api/parent/unlock": unlock,
  "POST /api/parent/lock": lock,
  "GET /api/parent/overview": overview,
  "GET /api/parent/evidence": evidence,
  "GET /api/parent/lessons": lessons,
  "GET /api/parent/lesson": lessonCard,
  "GET /api/parent/syllabus": syllabus,
  "GET /api/parent/controls": getControls,
  "POST /api/parent/controls": setControls,
  "POST /api/parent/hometask": homeTask,
};
