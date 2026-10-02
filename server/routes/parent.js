// /api/parent/* — the guardian gate (PIN) and the Parent corner's read endpoints (PRODUCT-DESIGN §6).
//
// Gate model. On a shared family phone the child runs inside the guardian's session cookie (server/auth.js),
// so "signed in" is NOT "a grown-up is holding the phone". The Parent corner is therefore behind a second,
// per-session unlock: POST /api/parent/unlock with the guardian PIN stamps auth_session.parent_unlocked_until
// for THIS session only. Every read below goes through requireParent / requireParentChild, which checks the
// child belongs to the guardian (requireChild) AND that this session is unlocked. The PIN itself is stored
// only as a scrypt hash; wrong tries are counted server-side (5 → a 15 min wait, §6.2).
//
// Routes are exact-match (server/router.js), so ids travel in the query string: ?childId=…&skill=….
import { createHash } from "crypto";
import { q, one } from "../db.js";
import { bad, need, send, parseCookies, HttpError } from "../http.js";
import { hashPassword, verifyPassword, requireGuardian, requireChild } from "../auth.js";
import { getTopic, topicSequence, SUBJECT_ORDER } from "../content/curriculum.js";
import { kitFromFile } from "../content/kits.js";
import { topicOf, skillById, misconceptionById } from "../content/index.js";
import { topicStatus } from "../content/next-topic.js";

export const PIN_RE = /^\d{4,6}$/;
export const PIN_MAX_TRIES = 5;
export const PIN_LOCK_MIN = 15;
/** How long one unlock lasts [I]: long enough for a Parent-corner visit, short enough that a phone handed back stays locked. */
export const UNLOCK_MIN = 10;
/** Child quotes on parent surfaces are capped (§6.4, R23). */
export const QUOTE_WORDS = 25;

const sha = (s) => createHash("sha256").update(s).digest("hex");
const sessionHash = (req) => {
  const t = parseCookies(req).tx_session;
  return t ? sha(t) : null;
};
const locked = (gate, extra = {}) => new HttpError(403, gate === "set" ? "set a guardian PIN first" : "parent corner is locked", { gate, ...extra });

/** Trivially guessable PINs a child would try first. */
export function weakPin(pin) {
  if (/^(\d)\1+$/.test(pin)) return true;                           // 0000, 1111
  const asc = "0123456789012345", desc = "9876543210987654";
  if (asc.includes(pin) || desc.includes(pin)) return true;        // 1234, 4321
  return false;
}

async function gateState(req, guardianId) {
  const pin = await one("select failed, locked_until, locked_until > now() as is_locked from guardian_pin where guardian_id = $1", [guardianId]);
  const h = sessionHash(req);
  const s = h ? await one("select parent_unlocked_until, parent_unlocked_until > now() as unlocked from auth_session where token_hash = $1", [h]) : null;
  return {
    hasPin: !!pin,
    unlocked: !!pin && !!s?.unlocked,
    unlockedUntil: s?.unlocked ? s.parent_unlocked_until : null,
    lockedUntil: pin?.is_locked ? pin.locked_until : null,
  };
}

/** → guardian, or 403 { gate: "set" | "locked" }. */
export async function requireParent(req) {
  const g = await requireGuardian(req);
  const st = await gateState(req, g.id);
  if (!st.hasPin) throw locked("set");
  if (!st.unlocked) throw locked("locked");
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
  send(res, 200, await gateState(req, g.id));
}

/**
 * Set or change the PIN. First set (onboarding P7): the signed-in guardian. Change: the Parent corner must be
 * unlocked AND the account password re-entered (stand-in for the §6.2 OTP re-auth until OTP ships).
 * body: { pin, password? }
 */
async function setPin(req, res, body) {
  const g = await requireGuardian(req);
  const { pin } = need(body, "pin");
  const p = String(pin);
  if (!PIN_RE.test(p)) throw bad("PIN must be 4 to 6 digits");
  if (weakPin(p)) throw bad("choose a PIN that is not a simple run like 1234 or 1111");
  const existing = await one("select 1 from guardian_pin where guardian_id = $1", [g.id]);
  if (existing) {
    const st = await gateState(req, g.id);
    if (!st.unlocked) throw locked("locked");
    const row = await one("select pw_hash from guardian where id = $1", [g.id]);
    if (!body.password || !verifyPassword(String(body.password), row.pw_hash)) throw bad("account password is incorrect");
  }
  await q(`insert into guardian_pin(guardian_id, pin_hash) values ($1,$2)
    on conflict (guardian_id) do update set pin_hash = excluded.pin_hash, failed = 0, locked_until = null, updated_at = now()`, [g.id, hashPassword(p)]);
  // Setting the PIN is a grown-up act on this session: leave the corner open for this visit.
  const h = sessionHash(req);
  if (h) await q(`update auth_session set parent_unlocked_until = now() + ($2 || ' minutes')::interval where token_hash = $1`, [h, String(UNLOCK_MIN)]);
  await q("insert into audit(guardian_id, action, detail) values ($1, $2, '{}')", [g.id, existing ? "pin_change" : "pin_set"]);
  send(res, 200, await gateState(req, g.id));
}

/**
 * Forgotten PIN: re-authenticate with the account password, then set a new PIN. INTERIM stand-in for §6.2
 * (recovery must use a factor off the shared device, or a 24 h delay with a WhatsApp notice): a browser that
 * autofills the password weakens this, which is why it is audited and why OTP recovery replaces it.
 * body: { pin, password }
 */
async function resetPin(req, res, body) {
  const g = await requireGuardian(req);
  const { pin, password } = need(body, "pin", "password");
  const p = String(pin);
  if (!PIN_RE.test(p)) throw bad("PIN must be 4 to 6 digits");
  if (weakPin(p)) throw bad("choose a PIN that is not a simple run like 1234 or 1111");
  const row = await one("select pw_hash from guardian where id = $1", [g.id]);
  if (!verifyPassword(String(password), row.pw_hash)) {
    await q("insert into audit(guardian_id, action, detail) values ($1, 'pin_reset_denied', '{}')", [g.id]);
    throw bad("account password is incorrect");
  }
  await q(`insert into guardian_pin(guardian_id, pin_hash) values ($1,$2)
    on conflict (guardian_id) do update set pin_hash = excluded.pin_hash, failed = 0, locked_until = null, updated_at = now()`, [g.id, hashPassword(p)]);
  const h = sessionHash(req);
  if (h) await q(`update auth_session set parent_unlocked_until = now() + ($2 || ' minutes')::interval where token_hash = $1`, [h, String(UNLOCK_MIN)]);
  await q("insert into audit(guardian_id, action, detail) values ($1, 'pin_reset', '{}')", [g.id]);
  send(res, 200, await gateState(req, g.id));
}

/** body: { pin } → gate state, or 403 with { gate: "locked", triesLeft } / { gate: "wait", lockedUntil }. */
async function unlock(req, res, body) {
  const g = await requireGuardian(req);
  const { pin } = need(body, "pin");
  const row = await one("select pin_hash, failed, locked_until, locked_until > now() as is_locked from guardian_pin where guardian_id = $1", [g.id]);
  if (!row) throw locked("set");
  if (row.is_locked) throw new HttpError(403, "too many tries; wait", { gate: "wait", lockedUntil: row.locked_until });
  if (!verifyPassword(String(pin), row.pin_hash)) {
    const failed = row.failed + 1;
    if (failed >= PIN_MAX_TRIES) {
      const r = await one(`update guardian_pin set failed = 0, locked_until = now() + ($2 || ' minutes')::interval where guardian_id = $1 returning locked_until`,
        [g.id, String(PIN_LOCK_MIN)]);
      // §6.2 says the guardian is notified; WhatsApp is not wired yet, so the audit row is the record.
      await q("insert into audit(guardian_id, action, detail) values ($1, 'pin_lockout', $2)", [g.id, { minutes: PIN_LOCK_MIN }]);
      throw new HttpError(403, "too many tries; wait", { gate: "wait", lockedUntil: r.locked_until });
    }
    await q("update guardian_pin set failed = $2 where guardian_id = $1", [g.id, failed]);
    throw new HttpError(403, "wrong PIN", { gate: "locked", triesLeft: PIN_MAX_TRIES - failed });
  }
  await q("update guardian_pin set failed = 0, locked_until = null where guardian_id = $1", [g.id]);
  const h = sessionHash(req);
  if (h) await q(`update auth_session set parent_unlocked_until = now() + ($2 || ' minutes')::interval where token_hash = $1`, [h, String(UNLOCK_MIN)]);
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
 * skill_state row → the parent's state (§6.4 table; R11 words). `due` in server/learner/bkt.js means the
 * scheduled re-check date has passed, not that a check was missed, so it never reads as a demotion: a skill
 * with a delayed pass stays Pakka with the re-check tag, otherwise it stays Aa gaya.
 * @returns {{ level: 0|1|2|3, key: "unseen"|"practising"|"learned_today"|"mastered", recheck: boolean }}
 */
export function parentState(row) {
  const s = row?.status ?? "unseen";
  if (s === "mastered") return { level: 3, key: "mastered", recheck: false };
  if (s === "learned_today") return { level: 2, key: "learned_today", recheck: false };
  if (s === "due") return row.delayed_pass ? { level: 3, key: "mastered", recheck: true } : { level: 2, key: "learned_today", recheck: true };
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
 * body: { childId, ...partial controls }. Gate: an unlocked Parent corner, EXCEPT during setup (onboarding P6-P7,
 * before any PIN exists), when the signed-in guardian may write the first row.
 */
async function setControls(req, res, body) {
  const childId = need(body, "childId").childId;
  const g = await requireGuardian(req);
  const st = await gateState(req, g.id);
  if (st.hasPin && !st.unlocked) throw locked("locked");
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
  const titled = await Promise.all(skills.map(async (r) => ({
    skillId: r.skill_id, title: (await skillTitle(r.skill_id)) ?? r.skill_id, ...parentState(r),
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
  send(res, 200, {
    child: childOut(child),
    isHafte: { canNow, tricky },
    homeTask,
    week: { lessons: week?.lessons ?? 0, minutes: week?.minutes ?? 0 },
    skills: titled,
    controls: controlsOut(controls, child),
    updatedAt: new Date().toISOString(),
  });
}

/** GET /api/parent/evidence?childId=&skill= → the Kaise pata? sheet (§6.4). */
async function evidence(req, res) {
  const sp = query(req);
  const { child } = await requireParentChild(req, sp.get("childId"));
  const skill = sp.get("skill");
  if (!skill || skill.length > 120) throw bad("invalid skill");
  const [state, rows] = await Promise.all([
    one("select * from skill_state where child_id = $1 and skill_id = $2", [child.id, skill]),
    q(`select e.id, e.at, e.probe, e.outcome, e.misconception_id, e.hints_used, e.lesson_id, t.text as child_text, t.speaker
         from evidence e left join turn t on t.id = e.turn_id
        where e.child_id = $1 and e.skill_id = $2 order by e.at desc limit 40`, [child.id, skill]),
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
    state: state ? { ...parentState(state), nextReview: state.next_review, attempts: state.attempts, correctUnaided: state.correct_unaided,
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
      ...parentState(byId.get(r.skill_id)), nextReview: byId.get(r.skill_id)?.next_review ?? null }))),
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
  const { guardian, child } = await requireParentChild(req, childId);
  await q("insert into audit(guardian_id, action, detail) values ($1, 'home_task', $2)", [guardian.id, { childId: child.id, lessonId, done: !!body.done }]);
  send(res, 200, { ok: true });
}

export const routes = {
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
