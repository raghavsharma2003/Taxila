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
import { requireGuardian, requireChild, hasConsent } from "../auth.js";
import { getTopic, topicSequence, SUBJECT_ORDER } from "../content/curriculum.js";
import { kitFromFile } from "../content/kits.js";
import { topicOf, skillById, misconceptionById } from "../content/index.js";
import { topicStatus, nextTopicFor } from "../content/next-topic.js";
import { AzureError, tts } from "../azure.js";
import { allowSpeech, DEFAULT_VOICE, MAX_TTS_CHARS } from "./tts.js";
import { MIN_DELAY_MS } from "../learner/bkt.js";
import { loadLive } from "../learner/live.js";
import { beliefFor, conceptCard } from "../comprehension/index.js";
import { CADENCES, LANGS, LANG_OF_PREF } from "../reports/config.js";
import { learningDay, isoWeek, addDays, zonedToUtc } from "../conductor/clock.js";
import { madeForOf } from "../reports/madeFor.js";
import { listReports, previewReport, reportById, windowOf } from "../reports/index.js";
import { HOW, renderFixed } from "../reports/templates.js";
import { outcomeName } from "../learner/kt/outcomes.js";
import { shortTitleOf } from "../director/state.js";
import { COUNTED_LESSON_SQL, loadTruth, loadLessonTally, claimRows, topicTruth, lessonFactsSummary, renderSummaryLine, summaryClaimsHold,
  supersede, engineRow, lessonEndMs, GRADER_WORDS } from "../reports/truth.js";

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
  if (!PIN_RE.test(p)) throw bad("PIN must be 4 to 6 digits", { code: "pin_shape" });
  if (weakPin(p)) throw bad("choose a PIN that is not a simple run like 1234 or 1111", { code: "pin_weak" });
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
    throw new HttpError(403, "too many password tries; try again later", { gate: "wait", lockedUntil: until, code: "too_many_tries" });
  }
  const row = await one("select pw_hash from guardian where id = $1", [guardianId]);
  if (!password || !(await verifySecret(String(password), row?.pw_hash))) {
    await audit(guardianId, `${purpose}_denied`, { triesLeft: PW_MAX_TRIES - c.n });
    throw bad("account password is incorrect", { triesLeft: PW_MAX_TRIES - c.n, code: "password_wrong", field: "password" });
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
    if (!body.password) throw new HttpError(403, "enter the account password to set the first PIN", { gate: "password", code: "password_needed" });
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
    throw new HttpError(403, "wrong PIN", { gate: "locked", triesLeft: PIN_MAX_TRIES - row.failed, code: "pin_wrong" });
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
  // taught but never tried is not a sprout (flows G7): "introduced" with no attempt reads Not started
  if (s === "introduced" && !(Number(row?.attempts) > 0)) return { level: 0, key: "unseen", recheck: false };
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

// ───────────────────────────── the claim gate (G-PARENT-1) ─────────────────────────────
//
// PRODUCT-DESIGN-V2 §6.5.1, audit #20: after one 5-minute lesson the home said "Still tricky: …" while the only row
// behind it, one tap below, read "Right · On their own". The headline now names a skill only when that skill's own
// evidence rows say the same thing as the words, and the state chip it shows IS the evidence sheet's state (same
// skill_state row, same parentState fold). src/parent/claims.ts re-checks every headline the client is sent with the
// same rule; tests/ui-v2-claims.test.mjs runs both over 3,000 simulated ledgers.

/** "Still practising" looks back this far (V2 §6.5.1: "≥ 2 attempts in 14 days that were not unaided-correct"). */
export const CLAIM_WINDOW_DAYS = 14;
/** Fewer counted evidence rows than this, in total, and the block says "Too early to say" (parent.too_early). */
export const TOO_EARLY_ROWS = 3;
/** Attempts in the window that were not right-on-their-own before "Still practising" may be said. */
export const PRACTISING_MIN = 2;
/** "This week" on the home: a skill must have come up this recently to be named in the headline. */
export const HEADLINE_RECENT_DAYS = 7;

const hintsOf = (r) => Number(r.hints_used ?? r.hintsUsed ?? 0);
/** Right, with no hint: the only row that can stand behind "can now". */
export const unaidedRight = (r) => r.outcome === "correct" && !(hintsOf(r) > 0);

/**
 * PURE. A skill's evidence rows (any order, `no_evidence` ignored) → the counts the claim words rest on.
 * @param {{ at: any, outcome: string, hints_used?: number, hintsUsed?: number }[]} rows
 */
export function evidenceTally(rows, now = new Date()) {
  const since = now.getTime() - CLAIM_WINDOW_DAYS * 86400_000;
  const counted = rows.filter((r) => r.outcome !== "no_evidence");
  const ordered = [...counted].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return {
    counted: counted.length,
    unaided: counted.filter(unaidedRight).length,
    notUnaidedRecent: counted.filter((r) => !unaidedRight(r) && new Date(r.at).getTime() >= since).length,
    latestUnaided: ordered[0] ? unaidedRight(ordered[0]) : false,
  };
}

/**
 * PURE. The gate itself: may this headline word stand on this state and these rows?
 * - "can_now" needs the ledger at Got it or Secure AND the newest counted row right-on-their-own (so it never stands
 *   over a sheet whose latest rows say "Not yet": a learned skill since missed reads as nothing, not as "can now").
 * - "practising" needs the ledger at Practising AND ≥ PRACTISING_MIN attempts in CLAIM_WINDOW_DAYS that were not
 *   right-on-their-own. A lone "Right · On their own" can never produce it (the audit case).
 * @param {"can_now"|"practising"} kind  @param {{ level: number }} state
 */
export function claimHolds(kind, state, rows, now = new Date()) {
  const t = evidenceTally(rows, now);
  if (kind === "can_now") return state.level >= 2 && t.unaided >= 1 && t.latestUnaided;
  if (kind === "practising") return state.level === 1 && t.notUnaidedRecent >= PRACTISING_MIN;
  return false;
}

/**
 * PURE. Home's "This week" block (V2 §6.5.1 states) from the ledger.
 * @param {{ skills: { skillId: string, level: number, lastSeen?: any }[], rowsBySkill: Map<string, any[]>,
 *   totalRows: number, lessonsEver: number, lessonsThisWeek: number, preferPractising?: string | null, now?: Date }} a
 * @returns {{ kind: "none"|"first"|"too_early"|"claims"|"quiet"|"no_week", canNow: string|null, practising: string|null }}
 *   skill ids; "claims" when at least one of canNow / practising is set.
 */
export function homeHeadline({ skills, rowsBySkill, totalRows, lessonsEver, lessonsThisWeek, preferPractising = null, now = new Date() }) {
  if (!lessonsEver) return { kind: "none", canNow: null, practising: null };
  const recent = now.getTime() - HEADLINE_RECENT_DAYS * 86400_000;
  const seen = skills.filter((s) => s.lastSeen && new Date(s.lastSeen).getTime() >= recent);
  const rowsOf = (id) => rowsBySkill.get(id) ?? [];
  const tooEarly = totalRows < TOO_EARLY_ROWS;
  const canNow = tooEarly ? null : seen.find((s) => claimHolds("can_now", s, rowsOf(s.skillId), now))?.skillId ?? null;
  // One lesson ever: "{child} had a first lesson" and never a still-practising claim (§6.5.1 "one lesson").
  let practising = null;
  if (!tooEarly && lessonsEver > 1) {
    const ok = (s) => s.skillId !== canNow && claimHolds("practising", s, rowsOf(s.skillId), now);
    const pref = preferPractising ? seen.find((s) => s.skillId === preferPractising) : null;
    practising = (pref && ok(pref) ? pref : seen.find(ok))?.skillId ?? null;
  }
  if (lessonsEver === 1) return { kind: "first", canNow, practising: null };
  if (tooEarly) return { kind: "too_early", canNow: null, practising: null };
  if (canNow || practising) return { kind: "claims", canNow, practising };
  return { kind: lessonsThisWeek ? "quiet" : "no_week", canNow: null, practising: null };
}

/** A skill's name in parent words: an authored `parentLabel` when the kit has one, else the skill title with its
 *  first letter lowered so it reads inside "{child} can now …" (never the NCERT objective string). */
export async function parentLabelOf(id) {
  let s = null;
  try { s = await skillById(id); } catch { s = null; }
  const label = s?.parentLabel || s?.title || null;
  if (!label) return null;
  return /^[A-Z][a-z]/.test(label) ? label[0].toLowerCase() + label.slice(1) : label;
}

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
  textOnly: !!row.text_only, homeworkToday: !!row.homework_until && new Date(row.homework_until) > new Date(),
} : { ...defaultControls(child.class_level), saved: false, textOnly: false, homeworkToday: false };

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
  for (const k of ["captionsAlways", "comfortMode", "textOnly", "homeworkToday"]) if (body[k] !== undefined) out[k] = !!body[k];
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
  // 019 columns (W2-A): "Tap and type only" per child, and "Homework help today" (until the end of today's learning day)
  let saved2 = saved;
  if (body.textOnly !== undefined || body.homeworkToday !== undefined) {
    const tz = await tzOf(child.id);
    const until = c.homeworkToday ? zonedToUtc(addDays(learningDay(new Date(), tz), 1), "04:00", tz).toISOString() : null;
    saved2 = await one(`update child_controls set text_only = $2,
        homework_until = case when $4::boolean then coalesce(case when homework_until > now() then homework_until end, $3::timestamptz) else null end
        where child_id = $1 returning *`, [child.id, !!c.textOnly, until, !!c.homeworkToday]).catch((e) => {
      if (e?.code === "42703") throw new HttpError(503, "this setting is not available yet");
      throw e;
    }) ?? saved;
  }
  await q("insert into audit(guardian_id, action, detail) values ($1, 'controls', $2)", [g.id, { childId: child.id }]);
  send(res, 200, { controls: controlsOut(saved2, child) });
}

// ───────────────────────────── school test window (W2-A SF1, STUDENT-FLOW §4.2 test_window) ─────────────────────────────

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TEST_SUBJECTS = new Set(["maths", "science", "evs", "english", "hindi", "sst"]);
/** GET /api/parent/test-window?childId= → { window } (null when none, or it ended before yesterday). */
async function getTestWindows(req, res) {
  const { child } = await requireParentChild(req, query(req).get("childId"));
  const r = await one("select test_window from child_controls where child_id = $1", [child.id]).catch(() => null);
  const w = r?.test_window ?? null;
  const today = learningDay(new Date(), await tzOf(child.id));
  send(res, 200, { window: w && w.to >= addDays(today, -1) ? w : null });
}
/** POST /api/parent/test-window { childId, subject, from, to } (≤ 21 days; one window per child). Unlocked corner. */
async function setTestWindow(req, res, body) {
  const { guardian, child } = await requireParentChild(req, need(body, "childId").childId);
  const subject = String(body.subject ?? "");
  if (!TEST_SUBJECTS.has(subject) || !topicSequence(child.class_level, subject).length) throw bad("subject must be one of the class's subjects");
  if (!DAY.test(String(body.from ?? "")) || !DAY.test(String(body.to ?? ""))) throw bad("from and to must be dates (YYYY-MM-DD)");
  if (body.to < body.from) throw bad("the test window must end after it starts");
  if ((Date.parse(body.to) - Date.parse(body.from)) / 86_400_000 > 21) throw bad("a test window is at most 3 weeks");
  const w = { subject, from: body.from, to: body.to };
  await one(`insert into child_controls(child_id, daily_minutes, test_window) values ($1, $2, $3)
      on conflict (child_id) do update set test_window = excluded.test_window, updated_at = now() returning child_id`,
  [child.id, defaultControls(child.class_level).dailyMinutes, w]);
  await q("insert into audit(guardian_id, action, detail) values ($1, 'test_window', $2)", [guardian.id, { childId: child.id, subject }]);
  send(res, 200, { window: w });
}
/** DELETE /api/parent/test-window { childId } */
async function deleteTestWindow(req, res, body) {
  const { child } = await requireParentChild(req, need(body, "childId").childId);
  await q("update child_controls set test_window = null where child_id = $1", [child.id]);
  send(res, 200, { window: null });
}

// ───────────────────────────── reads ─────────────────────────────

/** GET /api/parent/overview?childId= → Home's three things (§6.3) + the skill list one level down. */
async function overview(req, res) {
  const { guardian, child } = await requireParentChild(req, query(req).get("childId"));
  send(res, 200, await homeData(child, guardian));
}

/**
 * A lesson row that counts as a lesson on parent surfaces: it ran ≥ 5 minutes or something in it was graded, and it
 * was not an abandoned zero-turn start (the same rule as the child home's "Done for today", child.js countsAsDone).
 * A one-minute question visit is not "a lesson" (audit #20: "2 lessons" was one lesson and a 1-minute doubt).
 */
const COUNTED_SQL = COUNTED_LESSON_SQL("l");

/** Subject of a weekly home activity → the home/* pictures that show exactly the things its sentence names. */
const HOME_PICTURES = { maths: ["home/roti"] };

/**
 * The weekly letter's home activity (server/reports: reviewed template, gate-passed, tap-through to its rows), as
 * "Try at home" on the home. Lane A preview of this week, never stored, no model call; null during a safety hold,
 * when the report tables are not migrated, or when the week has nothing yet.
 */
async function tryAtHomeOf(child, hold) {
  if (hold) return null;
  try {
    const today = learningDay(new Date(), await tzOf(child.id));
    const period = isoWeek(today);
    const out = await previewReport(child.id, { cadence: "weekly", period }, { db: { q } });
    const r = out.report;
    if (!r) return null;
    const line = r.renders.en.lines.find((l) => l.section === "home" && !l.voiceOnly);
    if (!line) return null;
    const c = line.claimId ? r.claims.find((x) => x.id === line.claimId) : null;
    return { text: line.text, claimId: line.claimId ?? null, skillId: c?.skillId ?? null, cadence: "weekly", period, pictures: HOME_PICTURES[c?.slots?.object] ?? [] };
  } catch (e) {
    if (!missingTable(e)) console.warn(`[parent] try-at-home withheld: ${e.message}`);
    return null;
  }
}

/**
 * Safety alert card (§6.5.1) — shown ONLY once the safeguarding protocol has released a parent notice for an incident
 * (decision safety-parent-notice-settle; CONDUCTOR.md §7.6 safetyParentNotice). A raw `incident` row or a Conductor
 * safety_hold is never enough: at M0 every S notice goes to the human queue, and when a family member may be
 * implicated (familyImplicated yes/unknown, or abuse / neglect / violence at home) it is never auto-sent, so a card
 * read straight from `incident` could tell the very adult the child disclosed about. "Released" = a notification row
 * of class safety for this child that the Notifier has sent (status sent | delivered) in the last 7 days. Until the
 * Notifier exists (M1) nothing is ever released, so the card never shows; while held the home says only
 * "No new note right now." (the headline hold). Time only, never the topic.
 */
export const ALERT_RELEASED_SQL = `select coalesce(n.sent_at, n.created_at) as at from notification n
   where n.child_id = $1 and n.cls = 'safety' and n.status in ('sent', 'delivered')
     and coalesce(n.sent_at, n.created_at) > now() - interval '7 days'
   order by coalesce(n.sent_at, n.created_at) desc limit 1`;
async function alertOf(child) {
  try {
    const r = await one(ALERT_RELEASED_SQL, [child.id]);
    return r ? { at: r.at } : null;
  } catch (e) {
    if (missingTable(e) || e?.code === "42703") return null;   // outbox not migrated (004_conductor_notification)
    throw e;
  }
}

/** The next lesson, from the same plan the child home reads (child.js planFor; imported late: child.js imports this file). */
async function nextOf(child, guardian) {
  try {
    const { planFor } = await import("./child.js");
    const p = await planFor(child, guardian);
    const topic = p.resume ? { title: p.resume.topicTitle, shortTitle: null } : p.topic ? { title: p.topic.title, shortTitle: p.topic.shortTitle } : null;
    return { state: p.state, topic, window: p.plan.window, minutes: p.topic?.minutes ?? null };
  } catch (e) {
    console.warn(`[parent] next lesson withheld: ${e.message}`);
    return null;
  }
}

/** How the weekly letter's home activity (reports "home.skill": "{child} has been practising {skill}") names its skill. */
export const TRY_AT_HOME_STATE = "practising";
/**
 * PURE. One page, one state per skill (G-PARENT-1 across blocks, not only inside the headline). The headline comes
 * from the legacy evidence/skill_state ledger and Try at home from the weekly letter (kt_* ledger), so the same skill
 * could read "{child} can now X" above "{child} has been practising X". When the headline names the activity's skill
 * with a state other than practising, the skill-specific activity is replaced by the letter's own reviewed generic
 * home line (reports templates home.generic: names no skill, makes no claim, so it has no "How do we know?").
 * @param {any} t tryAtHomeOf result or null  @param {{ canNow: any, practising: any }} head  @param {string} name
 */
export function reconcileTryAtHome(t, head, name) {
  if (!t?.skillId) return t;
  const named = [head.canNow && { id: head.canNow.skillId, state: "can_now" }, head.practising && { id: head.practising.skillId, state: "practising" }]
    .filter(Boolean).find((x) => x.id === t.skillId);
  if (!named || named.state === TRY_AT_HOME_STATE) return t;
  return { ...t, text: renderFixed("home.generic", "en", { name }), claimId: null, skillId: null, pictures: [], generic: true };
}

/**
 * The parent's "This week": the ISO week in the child's time zone, the SAME window and the SAME lessons-and-minutes
 * rule as the weekly note (reports/truth.js lessonTally), so the two can never disagree (flows G7).
 */
export async function weekTally(child, now = new Date()) {
  const tz = await tzOf(child.id);
  const w = windowOf("weekly", isoWeek(learningDay(now, tz)), tz);
  return loadLessonTally(child.id, w, { openUntil: now.toISOString() });
}

/** Everything Parent Home shows for one child (overview, and the "Listen to this page" read-aloud). */
async function homeData(child, guardian) {
  const now = new Date();
  const [skills, mis, counts, week, recent, controls, firstLesson, hold, profile, truth] = await Promise.all([
    q("select * from skill_state where child_id = $1 order by last_seen desc nulls last limit 60", [child.id]),
    q(`select misconception_id, evidence_count, last_seen from misconception_state
         where child_id = $1 and not resolved and last_seen > now() - interval '7 days' order by last_seen desc limit 3`, [child.id]),
    one(`select (select count(*)::int from lesson l where l.child_id = $1 and ${COUNTED_SQL}) as lessons`, [child.id]),
    weekTally(child, now),
    q(`select l.id, l.topic_id, l.started_at, l.ended_at from lesson l where l.child_id = $1 and ${COUNTED_SQL} order by l.started_at desc limit 3`, [child.id]),
    one("select * from child_controls where child_id = $1", [child.id]),
    one(`select l.topic_id from lesson l where l.child_id = $1 and ${COUNTED_SQL} order by l.started_at limit 1`, [child.id]),
    reportHold(child.id),
    guardian ? hasConsent(guardian.id, child.id, "learning_profile") : Promise.resolve(true),
    loadTruth(child),
  ]);
  // ONE claim source (reports/truth.js): the engine's graded rows behind every word, never the Director's legacy rows
  const rowsBySkill = new Map(skills.map((r) => [r.skill_id, claimRows(truth.rowsOf(r.skill_id))]));
  const totalRows = truth.rows.filter((r) => r.scored).length;
  const titled = await Promise.all(skills.map(async (r) => ({
    skillId: r.skill_id, title: (await skillTitle(r.skill_id)) ?? r.skill_id, label: (await parentLabelOf(r.skill_id)) ?? r.skill_id,
    ...stateOut(truth.state(r.skill_id)), nextReview: r.next_review, lastSeen: r.last_seen,
  })));
  // A misconception seen this week may only steer WHICH practising skill is named, never whether one is (the gate decides).
  let misSkill = null, belief = null;
  if (mis[0]) {
    misSkill = truth.rows.filter((x) => x.misconceptionId === mis[0].misconception_id).at(-1)?.skillIds[0] ?? null;
    try { belief = (await misconceptionById(mis[0].misconception_id))?.belief ?? null; } catch { belief = null; }
  }
  // During a safety hold the headline holds too (the protocol decides what reaches the family; reports-safety-hold-read-side).
  const head = hold ? { kind: "held", canNow: null, practising: null } : homeHeadline({ skills: titled, rowsBySkill, totalRows, lessonsEver: counts?.lessons ?? 0,
    lessonsThisWeek: week.lessons, preferPractising: misSkill, now });
  const claimOut = (id, kind) => {
    const s = titled.find((x) => x.skillId === id);
    if (!s) return null;
    return { ...s, kind, misconception: kind === "practising" && id === misSkill ? belief : null, rows: (rowsBySkill.get(id) ?? []).slice(0, 40) };
  };
  const canNow = head.canNow ? claimOut(head.canNow, "can_now") : null;
  const practising = head.practising ? claimOut(head.practising, "practising") : null;
  const [tryAtHome0, alert, next] = await Promise.all([tryAtHomeOf(child, hold), alertOf(child), guardian ? nextOf(child, guardian) : null]);
  const tryAtHome = reconcileTryAtHome(tryAtHome0, { canNow, practising }, child.first_name);
  const topicOut = (tid) => { const t = getTopic(tid); return t ? { id: t.id, title: t.title, chapter: t.chapter.title, subject: t.subject } : { id: tid, title: tid }; };
  const minutesById = new Map(week.all.map((l) => [l.id, l.minutes]));
  return {
    child: childOut(child),
    headline: { kind: head.kind, canNow, practising, firstTopic: firstLesson ? topicOut(firstLesson.topic_id) : null, profileKept: !!profile },
    // legacy shape (the read-aloud and older clients): the same gated claims
    isHafte: { canNow, tricky: practising },
    tryAtHome,
    next,
    alert,
    held: !!hold,
    week: { lessons: week.lessons, minutes: week.minutes },
    recent: recent.map((l) => ({ id: l.id, topic: topicOut(l.topic_id), startedAt: l.started_at,
      minutes: minutesById.get(String(l.id)) ?? (l.ended_at ? Math.max(0, Math.round((new Date(l.ended_at) - new Date(l.started_at)) / 60000)) : null) })),
    // the skill list one level down names only skills the engine has a scored row on (never a taught-only "Practising")
    skills: titled.filter((x) => x.level > 0),
    controls: controlsOut(controls, child),
    updatedAt: now.toISOString(),
  };
}

/** skillTruth → the LedgerState the client renders (level, key, recheck). */
const stateOut = (t) => ({ level: t.level, key: t.key, recheck: t.recheck });

/** Words for a kit item's prompt (the question as the kit poses it), by the engine row's item key. */
async function itemPrompt(itemKey, skillId) {
  if (!itemKey || String(itemKey).startsWith("teach:")) return null;
  try {
    const tid = topicOf(skillId);
    const kit = tid ? kitFromFile(getTopic(tid)) : null;
    const it = kit?.items?.find((i) => i.id === itemKey) ?? kit?.misconceptions?.find((m) => m.diagnostic && `diag:${m.id}` === itemKey)?.diagnostic;
    return it ? quote(it.prompt_en || it.prompt_hi, 30) : null;
  } catch { return null; }
}

/**
 * GET /api/parent/evidence?childId=&skill= → the "How do we know?" sheet (§6.4; W2-A #1). One row per ENGINE-graded check
 * (kt_evidence, a late correction replacing the row it corrects): the real question (the kit item, else her line just
 * before), the child's own words (≤ 25), the closed-label result, and who graded it ("exact answer" / "checked against
 * the book's key idea"). The state is the same skillTruth every other surface shows.
 */
async function evidence(req, res) {
  const sp = query(req);
  const { child } = await requireParentChild(req, sp.get("childId"));
  const skill = sp.get("skill");
  if (!skill || skill.length > 120) throw bad("invalid skill");
  const [state, truth, live] = await Promise.all([
    one("select * from skill_state where child_id = $1 and skill_id = $2", [child.id, skill]),
    loadTruth(child, { skillIds: [skill] }),
    loadLive(child).catch(() => null),
  ]);
  const shown = truth.rowsOf(skill).filter((r) => r.scored).sort((a, b) => b.seq - a.seq).slice(0, 40);
  // the child's turn each row came from, and her line just before it (one read for every row)
  const keys = shown.filter((r) => r.turnSeq != null).map((r) => [r.lessonId, r.turnSeq]);
  const turns = keys.length ? await q(`select t.lesson_id::text as lesson_id, t.seq, t.speaker, t.text from turn t
      join lesson l on l.id = t.lesson_id and l.child_id = $1
     where (t.lesson_id::text, t.seq) in (select * from unnest($2::text[], $3::int[]))
        or (t.lesson_id::text, t.seq + 1) in (select * from unnest($2::text[], $3::int[]))`,
  [child.id, keys.map((k) => k[0]), keys.map((k) => k[1])]).catch(() => []) : [];
  const turnAt = new Map(turns.map((t) => [`${t.lesson_id}:${t.seq}`, t]));
  const beliefs = new Map();
  for (const r of shown) {
    if (r.misconceptionId && !beliefs.has(r.misconceptionId)) {
      try { beliefs.set(r.misconceptionId, (await misconceptionById(r.misconceptionId))?.belief ?? null); } catch { beliefs.set(r.misconceptionId, null); }
    }
  }
  const rows = await Promise.all(shown.map(async (r) => {
    const own = r.turnSeq != null ? turnAt.get(`${r.lessonId}:${r.turnSeq}`) : null;
    const before = r.turnSeq != null ? turnAt.get(`${r.lessonId}:${r.turnSeq - 1}`) : null;
    const prompt = (await itemPrompt(r.itemKey, skill)) ?? (before?.speaker === "teacher" ? quote(before.text, 30) : null);
    return {
      id: r.id, at: r.at, kind: r.kind, probe: r.cls, outcome: r.outcome, result: r.result, hintsUsed: r.hintsUsed, lessonId: r.lessonId,
      prompt, words: own?.speaker === "child" && !String(own.text).startsWith("[") ? quote(own.text) : null,
      grader: r.grader, graderWords: r.graderWords, misconception: r.misconceptionId ? beliefs.get(r.misconceptionId) ?? null : null,
    };
  }));
  const topicId = topicOf(skill);
  const topic = topicId ? getTopic(topicId) : null;
  send(res, 200, {
    skill: { id: skill, title: (await skillTitle(skill)) ?? skill, label: (await parentLabelOf(skill)) ?? skill, outcomes: topic?.outcomes ?? [], topic: topic ? { id: topic.id, title: topic.title, chapter: topic.chapter.title } : null },
    state: { ...stateOut(truth.state(skill)), nextReview: state?.next_review ?? null, attempts: truth.state(skill).counted,
      correctUnaided: shown.filter((r) => r.firstTryUnaided).length },
    // "How we know" from the comprehension engine (COMPREHENSION-ENGINE.md §7): evidence rows and chips, never a
    // verdict or a state name; conceptCard throws on a banned word, and a card that throws is not shown.
    comprehension: await comprehensionCard(child, live, skill),
    rows,
  });
}

const CARD_LANG = { english: "en", hinglish: "hinglish", hindi: "hi" };
/** The concept card for one skill, or null (no evidence yet, or a row the lexicon gate refused). k7 stays false. */
async function comprehensionCard(child, live, skill) {
  if (!live) return null;
  const b = beliefFor(skill, { ...live.state, now: new Date().toISOString() });
  if (!b) return null;
  let mis = null;
  if (b.misconception?.mId) { try { mis = (await misconceptionById(b.misconception.mId))?.belief ?? null; } catch { mis = null; } }
  try {
    return conceptCard(b, { concept: (await skillTitle(skill)) ?? skill, belief: mis ?? undefined, lang: CARD_LANG[child.language_pref] ?? "en", k7: false });
  } catch (e) {
    console.warn(`[parent] concept card withheld for ${skill}: ${e.message}`);
    return null;
  }
}

const topicOf_ = (tid) => {
  const t = getTopic(tid);
  return t ? { id: t.id, title: t.title, shortTitle: shortTitleOf(t.title), chapter: t.chapter.title, subject: t.subject } : { id: tid, title: tid, shortTitle: null };
};

/**
 * GET /api/parent/lessons?childId= → reverse-chronological lesson list (§6.5.3). `counted` = it counts as a lesson
 * (reports/truth.js countsAsLesson: something graded, or ≥ 5 min); a short visit is listed but never counted.
 * Minutes use the ONE rule (truth.js lessonEndMs: an open lesson runs to its last graded row).
 */
async function lessons(req, res) {
  const { child } = await requireParentChild(req, query(req).get("childId"));
  const rows = await q(`select l.id, l.topic_id, l.kind, l.started_at, l.ended_at, ${COUNTED_SQL} as counted,
       (select count(*)::int from kt_evidence e where e.child_id = l.child_id and e.session_id = l.id::text and not e.teach and right(e.id, 5) <> ':late') as evidence_count,
       (select max(e.occurred_at) from kt_evidence e where e.child_id = l.child_id and e.session_id = l.id::text) as last_ev
     from lesson l where l.child_id = $1 order by l.started_at desc limit 50`, [child.id]);
  send(res, 200, {
    lessons: rows.map((r) => ({ id: r.id, topic: topicOf_(r.topic_id), kind: r.kind, startedAt: r.started_at, endedAt: r.ended_at,
      minutes: minutesOfRow(r), evidenceCount: r.evidence_count, counted: !!r.counted })),
  });
}

/** A lesson row's minutes by the ONE rule (null for an open lesson with nothing graded yet). */
function minutesOfRow(r) {
  const l = { id: String(r.id), startedAt: new Date(r.started_at).toISOString(), endedAt: r.ended_at ? new Date(r.ended_at).toISOString() : null };
  if (!l.endedAt && !r.last_ev) return null;
  const ev = r.last_ev ? [{ sessionId: l.id, at: new Date(r.last_ev).toISOString() }] : [];
  return Math.max(0, Math.round((lessonEndMs(l, ev) - Date.parse(l.startedAt)) / 60_000));
}

/**
 * GET /api/parent/lesson?childId=&lessonId= → the Lesson card (§6.5.3): what the child did (the same DidCards the
 * child's Summary shows: their own answers, a tick only where the key verified it), one quote, the skills with their
 * ENGINE evidence from this lesson and the one state word, the summary built from facts (and checked), the next re-check.
 */
async function lessonCard(req, res) {
  const sp = query(req);
  const { child } = await requireParentChild(req, sp.get("childId"));
  const lid = sp.get("lessonId");
  if (!lid || !/^[0-9a-f-]{36}$/i.test(lid)) throw bad("invalid lessonId");
  const l = await one(`select l.*, ${COUNTED_SQL} as counted,
      (select max(e.occurred_at) from kt_evidence e where e.child_id = l.child_id and e.session_id = l.id::text) as last_ev
    from lesson l where l.id = $1 and l.child_id = $2`, [lid, child.id]);
  if (!l) throw new HttpError(404, "lesson not found");
  const [raw, turns] = await Promise.all([
    q(`select id, seq, session_id, occurred_at, skill_ids, cls, outcome, grader, item_key, teach, pre_attempt_help, entry_rung, misconception_id,
         via, contaminated, assisted from kt_evidence where child_id = $1 and session_id = $2 order by seq`, [child.id, l.id]).catch(() => []),
    q("select seq, speaker, text from turn where lesson_id = $1 and speaker in ('child','teacher') order by seq", [l.id]),
  ]);
  const here = supersede(raw).map(engineRow).filter((r) => r.scored);
  const skillIds = [...new Set(here.flatMap((r) => r.skillIds))];
  const [truth, states] = skillIds.length ? await Promise.all([loadTruth(child, { skillIds }),
    q("select skill_id, next_review from skill_state where child_id = $1 and skill_id = any($2::text[])", [child.id, skillIds])]) : [null, []];
  const nextBy = new Map(states.map((s) => [s.skill_id, s.next_review]));
  const t = getTopic(l.topic_id);
  // One child quote: the longest child turn (a sentence the child actually built), capped at 25 words.
  const childTurns = turns.filter((x) => x.speaker === "child" && x.text?.trim() && !x.text.startsWith("["));
  const best = [...childTurns].sort((a, b) => b.text.split(/\s+/).length - a.text.split(/\s+/).length)[0];
  // Full verbatim transcripts: Class 1-4 visible; Class 5-9 on request (§6.11). The request path is not built
  // yet, so Class 5-9 transcripts are withheld here and the client says so.
  const transcriptVisible = child.class_level <= 4;
  let did = null;
  try { did = (await import("./lesson.js")).lessonSummary(l.state, { topic: t, teacher: null }); } catch { did = null; }
  const skillsOut = await Promise.all(skillIds.map(async (id) => {
    const mine = here.filter((r) => r.skillIds.includes(id));
    return { skillId: id, title: (await skillTitle(id)) ?? id, label: (await parentLabelOf(id)) ?? id, attempts: mine.length,
      unaided: mine.filter((r) => r.firstTryUnaided).length, ...stateOut(truth.state(id)), nextReview: nextBy.get(id) ?? null };
  }));
  skillsOut.sort((a, b) => b.attempts - a.attempts);
  const ahead = skillsOut.map((s) => s.nextReview).filter((x) => x && new Date(x) > new Date()).sort((a, b) => new Date(a) - new Date(b));
  // The summary, built from the engine's rows of this lesson and claim-checked against the raw rows (W2-A #1). A
  // summary that fails its check is withheld, never shown (the card's DidCards and skills still stand on their own).
  const facts = lessonFactsSummary({ topicTitle: t?.title ?? null, rows: here });
  const failed = summaryClaimsHold(facts, raw);
  if (failed.length) console.warn(`[parent] lesson summary withheld for ${l.id}: ${failed.join("; ")}`);
  send(res, 200, {
    // lesson.parent_note / summary are model-written text (audit #20 read them as the system voice, and they can be in
    // another language): never shown on the card. The card is built from rows: DidCards, one quote, the checks.
    lesson: { id: l.id, topic: topicOf_(l.topic_id), startedAt: l.started_at, endedAt: l.ended_at, minutes: minutesOfRow(l), counted: !!l.counted },
    did: did ? { cards: did.cards.map((c) => ({ kind: c.kind, ask: c.ask, answer: c.answer, tick: !!c.tick, withHelp: !!c.withHelp })), tried: did.tried ?? null } : null,
    summary: failed.length ? null : { lines: facts.lines.map((x) => renderSummaryLine(x, { name: child.first_name, topicTitle: t?.title ?? "" })), counts: facts.counts },
    skills: skillsOut,
    nextCheck: ahead[0] ?? null,
    quote: best ? quote(best.text) : null,
    transcript: transcriptVisible ? turns.map((x) => ({ seq: x.seq, speaker: x.speaker, text: x.text })) : null,
    transcriptPolicy: transcriptVisible ? "visible" : "on_request",
  });
}

/**
 * GET /api/parent/syllabus?childId= → Progress (§6.5.3): the class's chapters with a state per topic, "Chapters
 * started: n · Secure: k of N" (never a percentage, never "behind"), the chapter the next lesson is in, and the
 * foundation bridge when the next lesson comes from an earlier class.
 */
async function syllabus(req, res) {
  const { guardian, child } = await requireParentChild(req, query(req).get("childId"));
  const [truth, next, profile] = await Promise.all([loadTruth(child), nextTopicFor(child).catch(() => null), hasConsent(guardian.id, child.id, "learning_profile")]);
  // ONE state per skill (truth.state) and the topic's state derived from its skills (topicTruth): Progress, the map,
  // the lesson card and the evidence sheet read the same words (G-PARENT-1 across surfaces).
  const skillsOf = new Map();
  for (const id of truth.triedSkills()) {
    const tid = topicOf(id);
    if (!tid) continue;
    if (!skillsOf.has(tid)) skillsOf.set(tid, []);
    skillsOf.get(tid).push({ skillId: id, label: (await parentLabelOf(id)) ?? id, ...stateOut(truth.state(id)) });
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
      const sk = skillsOf.get(t.id) ?? [];
      ch.topics.push({ id: t.id, title: t.title, ...topicTruth(sk, skillCount), skills: sk });
    }
    subjects.push({ subject, book: getTopic(ids[0]).book, chapters });
  }
  const all = subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics));
  const nextTopic = next ? getTopic(next.id) : null;
  const here = nextTopic ? subjects.flatMap((s) => s.chapters).find((c) => c.topics.some((t) => t.id === nextTopic.id)) : null;
  const nextClass = Number(/^c(\d+)-/.exec(next?.id ?? "")?.[1] ?? 0);
  const firstOfClass = nextTopic ? topicSequence(child.class_level, nextTopic.subject)[0] : null;
  const bridge = nextTopic && nextClass && nextClass < child.class_level && firstOfClass
    ? { steps: [nextTopic.title, getTopic(firstOfClass)?.chapter.title].filter(Boolean) } : null;
  const chaptersStarted = subjects.reduce((n, s) => n + s.chapters.filter((c) => c.topics.some((t) => t.level > 0)).length, 0);
  const secure = all.filter((t) => t.level === 3).length;
  send(res, 200, {
    classLevel: child.class_level, board: child.board, subjects, profileKept: !!profile,
    here: here ? { chapterId: here.id, topicId: nextTopic.id } : null, bridge, next: nextTopic ? { id: nextTopic.id, title: nextTopic.title } : null,
    header: { chaptersStarted, secure, topics: all.length, chaptersTouched: chaptersStarted, topicsPakka: secure },
  });
}

/**
 * POST /api/parent/hometask { childId, done, lessonId? | period? } — "Done" / "Not this week" on Try at home. Logged
 * only; never a KPI (§6.7). The home activity is the weekly letter's (`period` = ISO week), or a lesson's.
 */
async function homeTask(req, res, body) {
  const { childId } = need(body, "childId");
  const { guardian, child } = await requireParentChild(req, childId);
  const detail = { childId: child.id, done: !!body.done };
  if (body.lessonId !== undefined) {
    if (!/^[0-9a-f-]{36}$/i.test(String(body.lessonId))) throw bad("invalid lessonId");
    if (!(await one("select 1 from lesson where id = $1 and child_id = $2", [body.lessonId, child.id]))) throw new HttpError(404, "lesson not found");
    detail.lessonId = body.lessonId;
  } else if (/^\d{4}-W\d{2}$/.test(String(body.period ?? ""))) {
    detail.period = body.period;
  } else throw bad("lessonId or period is required");
  await q("insert into audit(guardian_id, action, detail) values ($1, 'home_task', $2)", [guardian.id, detail]);
  send(res, 200, { ok: true });
}

/** GET /api/parent/made-for?childId= → the parent corner's "Made for {child}" list (STUDENT-FLOW §12.1; full daily card W4-F). */
async function madeForList(req, res) {
  const { child } = await requireParentChild(req, query(req).get("childId"));
  send(res, 200, { items: await madeForOf(child.id, { limit: 12 }) });
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
/**
 * The parent home's headline sentences (V2 §5.4, §6.5.1). KEEP IN STEP with src/parent/copy.ts HOME (the screen):
 * "Listen to this page" must say what the page says. tests/ui-v2-claims.test.mjs compares the two.
 */
const noStop = (s) => String(s).replace(/[.\s]+$/, "");
export const HOME_COPY = {
  none: (n) => `${n}'s first lesson will appear here.`,
  first: (n, topic) => `${n} had a first lesson: ${noStop(topic)}.`,
  too_early: "Too early to say. After a few more lessons you'll see what's going well and what's still tricky.",
  can_now: (n, label) => `${n} can now ${noStop(label)}.`,
  practising: (label) => `Still practising: ${noStop(label)}.`,
  quiet: "Nothing new to report from this week's lessons yet.",
  no_week: "No lessons this week.",
  held: "No new note right now.",
  not_kept: "Progress isn't kept between days (your choice).",
  alert: (n) => `Please check in with ${n}.`,
};

/** The "This week" block as sentences, from the same gated headline the card shows. */
export function headlineLines(name, h) {
  if (!h) return [];
  if (h.kind === "held") return [HOME_COPY.held];
  if (h.profileKept === false) return [HOME_COPY.not_kept];
  if (h.kind === "none") return [HOME_COPY.none(name)];
  if (h.kind === "too_early") return [HOME_COPY.too_early];
  if (h.kind === "quiet") return [HOME_COPY.quiet];
  if (h.kind === "no_week") return [HOME_COPY.no_week];
  const out = [];
  if (h.kind === "first") out.push(HOME_COPY.first(name, h.firstTopic?.title ?? "a first topic"));
  if (h.canNow) out.push(HOME_COPY.can_now(name, h.canNow.label));
  if (h.practising) out.push(HOME_COPY.practising(h.practising.label));
  return out;
}

/** "Listen to this page" (§6.5.1): the alert, This week, Try at home and the next lesson, in the page's own words. */
export function homeSpeech(name, d) {
  const parts = [];
  if (d.alert) parts.push(HOME_COPY.alert(name));
  parts.push("This week.", ...headlineLines(name, d.headline ?? { kind: "quiet" }));
  if (d.tryAtHome?.text) parts.push("Try at home.", d.tryAtHome.text);
  if (d.next?.topic?.title && ["start", "first", "done", "capped", "resting"].includes(d.next.state)) {
    parts.push(`Next lesson: ${d.next.state === "done" || d.next.state === "capped" ? "tomorrow" : "today"}, ${noStop(d.next.topic.shortTitle || d.next.topic.title)}.`);
  }
  return parts.join(" ");
}
/** A lesson's "Listen" (§6.5.3): the Lesson card's own facts as sentences (never the model-written parent_note). */
export function lessonSpeech(name, { topic, ended, checked, unaided }) {
  if (!ended) return `${noStop(topic)}. This lesson didn't finish.`;
  if (!checked) return `${noStop(topic)}. No answers were checked in this lesson.`;
  return `${noStop(topic)}. ${checked === 1 ? "1 answer was" : `${checked} answers were`} checked. ${name} got ${unaided} right on their own.`;
}
/** @deprecated the old IS HAFTE read-aloud name; the page read-aloud is homeSpeech. */
export const hafteSpeech = homeSpeech;

// ───────────────────────────── reports (server/reports/**) ─────────────────────────────

const REPORT_ID = /^\d{1,18}$/;
const missingTable = (e) => e?.code === "42P01";          // parent_report not migrated yet (db/migrations/010_parent_report.sql)
/** The stored report as the client reads it: lines per language, never factIds (the drawer resolves those server-side). */
const reportOut = (r) => ({
  id: String(r.id), cadence: r.cadence, period: r.period, window: { from: r.window_from ?? r.window?.from, to: r.window_to ?? r.window?.to },
  // calendar learning days covered (tz-free strings): what the header shows, not the window instants
  days: (({ firstDay, lastDay }) => ({ first: firstDay, last: lastDay }))(windowOf(r.cadence, r.period, "Asia/Kolkata")),
  k7: !!r.k7, preview: !r.id, createdAt: r.created_at ?? null,
  claims: r.claims.map((c) => ({ id: c.id, section: c.section, shapeId: c.shapeId, facts: c.factIds.length })),
  renders: Object.fromEntries(Object.entries(r.renders).map(([lang, R]) => [lang, { title: R.title.text,
    lines: R.lines.filter((l) => !l.voiceOnly).map((l) => ({ key: l.key, kind: l.kind, claimId: l.claimId ?? null, section: l.section, text: l.text })),
    voice: R.voice?.text ?? null }])),
});
const tzOf = async (childId) => (await one("select tz from child_routine where child_id = $1", [childId]))?.tz || "Asia/Kolkata";

/**
 * The Conductor's safety hold (decide.js safety.incident → mode safety_hold; guards.js drops the report jobs: "the
 * protocol decides what reaches the family"). The read side holds too (decision reports-safety-hold-read-side):
 * while it lasts there is no live preview, no Listen, and no note stored after the hold began; notes stored BEFORE
 * it stay readable as text (the family already had them; pulling them is the protocol's call, not this route's).
 * → null, or { since } (ISO). No conductor_state row / table = no hold.
 */
export async function reportHold(childId, one_ = one) {
  try {
    const r = await one_("select mode, state->>'modeSince' as since from conductor_state where child_id = $1", [childId]);
    return r?.mode === "safety_hold" ? { since: r.since || new Date(0).toISOString() } : null;
  } catch (e) { if (missingTable(e)) return null; throw e; }
}
/** Evidence-drawer claim: the reviewed "how this line is counted" copy per language, never the internal rule string. */
export const evidenceClaimOut = (c) => ({ id: c.id, section: c.section, shapeId: c.shapeId, how: HOW[c.shapeId] ?? null });

/** GET /api/parent/reports?childId= → the stored daily notes and weekly letters, newest first. */
async function reports(req, res) {
  const { child } = await requireParentChild(req, query(req).get("childId"));
  const hold = await reportHold(child.id);
  let rows = [];
  try { rows = await listReports({ q }, child.id, 30, { since: hold?.since ?? null }); } catch (e) { if (!missingTable(e)) throw e; }
  const tz = await tzOf(child.id);
  const today = learningDay(new Date(), tz);
  send(res, 200, { reports: rows.map((r) => ({ id: String(r.id), cadence: r.cadence, period: r.period, createdAt: r.created_at })),
    today, thisWeek: isoWeek(today), lang: LANG_OF_PREF[child.language_pref] ?? "en", langs: LANGS, held: !!hold });
}

/**
 * GET /api/parent/report?childId=&id=  → one stored report.
 * GET /api/parent/report?childId=&cadence=daily|weekly&period=today|thisweek|YYYY-MM-DD|YYYY-Www&preview=1 → today's /
 * this week's notes so far: Lane A only, never stored, no model call (the night job writes the stored one).
 */
async function report(req, res) {
  const sp = query(req);
  const { child } = await requireParentChild(req, sp.get("childId"));
  const id = sp.get("id");
  const hold = await reportHold(child.id);
  if (id) {
    if (!REPORT_ID.test(id)) throw bad("invalid report id");
    let r = null;
    try { r = await reportById({ q }, child.id, id, { before: hold?.since ?? null }); } catch (e) { if (!missingTable(e)) throw e; }
    if (!r) throw new HttpError(404, "report not found");
    return send(res, 200, { report: { ...reportOut(r), ...(hold ? { held: true, renders: noVoice(reportOut(r).renders) } : {}) } });
  }
  const cadence = sp.get("cadence");
  if (!CADENCES.includes(cadence)) throw bad("cadence must be daily or weekly");
  if (hold) return send(res, 200, { report: null, skipped: "held", held: true });
  const tz = await tzOf(child.id);
  const today = learningDay(new Date(), tz);
  let period = sp.get("period") || (cadence === "daily" ? "today" : "thisweek");
  if (period === "today") period = today;
  if (period === "thisweek") period = isoWeek(today);
  try { windowOf(cadence, period, tz); } catch { throw bad("invalid period"); }
  const out = await previewReport(child.id, { cadence, period }, { db: { q } });
  if (out.skipped) return send(res, 200, { report: null, skipped: out.skipped, period });
  send(res, 200, { report: reportOut(out.report) });
}

const noVoice = (renders) => Object.fromEntries(Object.entries(renders).map(([l, R]) => [l, { ...R, voice: null }]));

/** What kind of evidence row a kt_evidence class is, for the drawer (client words it; PROBE_KIND's family). */
const EV_KIND = { "item.open": "practice", "item.mcq2": "practice", "item.mcq3": "practice", "item.mcq4": "practice", solo: "practice", teach: "taught",
  "probe.why": "why", "probe.teachback": "teachback", "probe.transfer.near": "near_transfer", "probe.transfer.far": "far_transfer",
  "probe.errorspot": "error_spot", "probe.predict": "predict", para: "practice" };
const RIGHT = new Set(["C0", "first_correct", "full", "high", "pass", "caught_fixed", "right"]);
const PART = new Set(["C1", "C2", "partial", "mid", "caught"]);

/**
 * GET /api/parent/report/evidence?childId=&id=&claimId=  ("Kaise pata?") → the rows behind ONE line, re-read from the
 * ledger for this child (a factId of another child resolves to nothing). Preview lines: pass cadence+period instead of id.
 */
async function reportEvidence(req, res) {
  const sp = query(req);
  const { child } = await requireParentChild(req, sp.get("childId"));
  const claimId = sp.get("claimId") || "";
  if (!/^[a-z]+:[a-z._]+:[0-9a-f]{10}$/.test(claimId)) throw bad("invalid claimId");
  let r;
  const hold = await reportHold(child.id);
  if (sp.get("id")) {
    if (!REPORT_ID.test(sp.get("id"))) throw bad("invalid report id");
    try { r = await reportById({ q }, child.id, sp.get("id"), { before: hold?.since ?? null }); } catch (e) { if (!missingTable(e)) throw e; }
  } else if (hold) {
    throw new HttpError(404, "line not found");
  } else {
    const cadence = sp.get("cadence"), period = sp.get("period");
    if (!CADENCES.includes(cadence)) throw bad("cadence must be daily or weekly");
    try { windowOf(cadence, String(period), await tzOf(child.id)); } catch { throw bad("invalid period"); }
    r = (await previewReport(child.id, { cadence, period }, { db: { q } })).report;
  }
  const c = r?.claims.find((x) => x.id === claimId);
  if (!c) throw new HttpError(404, "line not found");
  const pick = (kind) => c.factIds.filter((f) => f.startsWith(kind + ":")).map((f) => f.slice(kind.length + 1));
  const [ev, lessons, skills] = await Promise.all([
    pick("kt_evidence").length ? q(`select id, occurred_at, skill_ids, cls, outcome, grader, pre_attempt_help, entry_rung, misconception_id, via, session_id
        from kt_evidence where child_id = $1 and id = any($2::text[]) order by seq`, [child.id, pick("kt_evidence")]) : [],
    pick("lesson").length ? q("select id, topic_id, started_at, ended_at from lesson where child_id = $1 and id::text = any($2::text[]) order by started_at", [child.id, pick("lesson")]) : [],
    pick("kt_skill_state").length ? q("select skill_id, next_review_at from kt_skill_state where child_id = $1 and skill_id = any($2::text[])", [child.id, pick("kt_skill_state")]) : [],
  ]);
  const titles = new Map();
  for (const e of ev) for (const sk of e.skill_ids) if (!titles.has(sk)) titles.set(sk, (await skillTitle(sk)) ?? sk);
  send(res, 200, {
    claim: evidenceClaimOut(c),
    window: { from: r.window_from ?? r.window?.from, to: r.window_to ?? r.window?.to },
    evidence: ev.map((e) => {
      const name = e.cls === "teach" ? "taught" : outcomeName(e.cls, Number(e.outcome)) ?? "?";
      return { id: e.id, at: e.occurred_at, skill: titles.get(e.skill_ids[0]) ?? e.skill_ids[0], kind: EV_KIND[e.cls] ?? "practice",
        result: e.cls === "teach" ? "taught" : RIGHT.has(name) ? "right" : PART.has(name) ? "partly" : name === "IDK" ? "not_sure" : "not_yet",
        help: e.pre_attempt_help ? "asked_first" : Number(e.entry_rung) > 0 ? "hint" : "none", checkedBy: e.grader, game: e.via === "game", session: e.session_id,
        matchesMixup: !!c.ref?.misconceptionId && e.misconception_id === c.ref.misconceptionId };
    }),
    lessons: lessons.map((l) => { const t = getTopic(l.topic_id); return { id: l.id, topic: t?.title ?? l.topic_id, startedAt: l.started_at,
      minutes: l.ended_at ? Math.round((new Date(l.ended_at) - new Date(l.started_at)) / 60000) : null }; }),
    // only a re-check still ahead is shown as "comes back on" (a past date is not a plan)
    schedule: skills.filter((x) => x.next_review_at && new Date(x.next_review_at) > new Date()).map((x) => ({ skill: x.skill_id, nextReview: x.next_review_at })),
  });
}

/**
 * POST /api/parent/export { password } → everything the account holds, as one JSON file (V2 §6.5.5 "Download
 * everything"). Consent-grade, so the account password too. Verbatim lesson turns follow the transcript policy
 * (§6.11): included for Class 1-4, withheld for Class 5-9 (requesting them is not built), and the file says so.
 */
async function exportAll(req, res, body) {
  const g = await requireParent(req);
  rateLimit(req, "export");
  await checkAccountPassword(g.id, body.password, "export");
  const guardian = await one("select email, name, phone, locale, created_at from guardian where id = $1", [g.id]);
  const kids = await q("select * from child where guardian_id = $1 order by created_at", [g.id]);
  const consents = await q("select child_id, purpose, granted, version, method, created_at from consent where guardian_id = $1 order by created_at", [g.id]);
  const children = [];
  for (const c of kids) {
    const [controls, lessonsRows, ev, mem] = await Promise.all([
      one("select * from child_controls where child_id = $1", [c.id]),
      q("select id, topic_id, started_at, ended_at, summary, parent_note from lesson where child_id = $1 order by started_at", [c.id]),
      q("select at, skill_id, probe, outcome, hints_used, lesson_id from evidence where child_id = $1 order by at", [c.id]),
      q("select kind, text, created_at from memory where child_id = $1 and superseded_by is null order by created_at", [c.id]).catch(() => []),
    ]);
    const turns = c.class_level <= 4 && lessonsRows.length
      ? await q("select lesson_id, seq, speaker, text, at from turn where lesson_id = any($1::uuid[]) and speaker in ('child','teacher') order by lesson_id, seq", [lessonsRows.map((l) => l.id)])
      : [];
    children.push({
      profile: { firstName: c.first_name, classLevel: c.class_level, board: c.board, schoolMedium: c.school_medium, language: c.language_pref,
        teacher: c.teacher_id, avatar: c.avatar, interests: c.interests, createdAt: c.created_at },
      controls: controls ? controlsOut(controls, c) : null,
      lessons: lessonsRows.map((l) => ({ id: l.id, topic: getTopic(l.topic_id)?.title ?? l.topic_id, startedAt: l.started_at, endedAt: l.ended_at,
        summary: l.summary, note: l.parent_note,
        conversation: c.class_level <= 4 ? turns.filter((t) => t.lesson_id === l.id).map((t) => ({ seq: t.seq, speaker: t.speaker, text: t.text, at: t.at })) : undefined })),
      conversations: c.class_level <= 4 ? "included" : "withheld: for Class 5 to 9 the word-for-word conversation is shown only on request",
      evidence: ev.map((e) => ({ at: e.at, skill: e.skill_id, check: PROBE_KIND[e.probe] ?? "practice", outcome: e.outcome, hints: e.hints_used, lessonId: e.lesson_id })),
      remembered: mem,
    });
  }
  await audit(g.id, "export");
  const name = `taxila-export-${new Date().toISOString().slice(0, 10)}.json`;
  res.statusCode = 200;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("content-disposition", `attachment; filename="${name}"`);
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify({ exportedAt: new Date().toISOString(), account: guardian, consents, children }, null, 2));
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
  } else if (what === "hafte" || what === "home") {
    const { guardian, child } = await requireParentChild(req, sp.get("childId"));
    guardianId = guardian.id;
    text = homeSpeech(child.first_name, await homeData(child, guardian));
  } else if (what === "lesson") {
    const { guardian, child } = await requireParentChild(req, sp.get("childId"));
    guardianId = guardian.id;
    const lid = sp.get("lessonId");
    if (!lid || !/^[0-9a-f-]{36}$/i.test(lid)) throw bad("invalid lessonId");
    const l = await one("select topic_id, ended_at from lesson where id = $1 and child_id = $2", [lid, child.id]);
    if (!l) throw new HttpError(404, "lesson not found");
    const ev = await one(`select count(*)::int as n, coalesce(sum(case when outcome = 'correct' and hints_used = 0 then 1 else 0 end), 0)::int as unaided
        from evidence where lesson_id = $1 and outcome <> 'no_evidence'`, [lid]);
    text = lessonSpeech(child.first_name, { topic: getTopic(l.topic_id)?.title ?? "Lesson", ended: !!l.ended_at, checked: ev?.n ?? 0, unaided: ev?.unaided ?? 0 });
  } else if (what === "report") {
    // the stored, gate-passed spoken script of one report, in one language (server-held text only)
    const { guardian, child } = await requireParentChild(req, sp.get("childId"));
    guardianId = guardian.id;
    const id = sp.get("id"), lang = sp.get("lang") || LANG_OF_PREF[child.language_pref] || "en";
    if (!id || !REPORT_ID.test(id) || !LANGS.includes(lang)) throw bad("invalid report or lang");
    // no Listen during a safety hold (reportHold): nothing is spoken to the family while the protocol decides
    if (await reportHold(child.id)) throw new HttpError(409, "report audio is not available right now", { held: true });
    let r = null;
    try { r = await reportById({ q }, child.id, id); } catch (e) { if (!missingTable(e)) throw e; }
    if (!r?.renders?.[lang]?.voice?.text) throw new HttpError(404, "report not found");
    text = r.renders[lang].voice.text;
    // the report gate holds scripts to VOICE_CHARS ≤ MAX_TTS_CHARS; a longer one is refused, never cut mid-sentence
    if (text.length > MAX_TTS_CHARS) throw new HttpError(500, "report script over the speech limit");
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
  "GET /api/parent/test-window": getTestWindows,
  "POST /api/parent/test-window": setTestWindow,
  "DELETE /api/parent/test-window": deleteTestWindow,
  "GET /api/parent/made-for": madeForList,
  "POST /api/auth/forgot": async (req, res, body) => (await import("./account.js")).forgotPassword(req, res, body),
  "POST /api/auth/reset": async (req, res, body) => (await import("./account.js")).resetPassword(req, res, body),
  "GET /api/parent/reports": reports,
  "GET /api/parent/report": report,
  "GET /api/parent/report/evidence": reportEvidence,
  "POST /api/parent/export": exportAll,
  // account.js has no route table of its own (server/router.js holds its older routes); deletion is registered here.
  // (imported late: account.js imports this file, and evaluating it first would run its top-level hashSecret too early)
  "DELETE /api/account": async (req, res, body) => (await import("./account.js")).deleteAccount(req, res, body),
};
