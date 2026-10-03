// The report's snapshot of the ledger (PARENT-REPORT.md §10.1 stage 1): everything a report may cite, read once
// for a window, as plain data. Sources (and only these): lesson, kt_evidence, kt_skill_state, kt_misconception,
// consent. memory is NOT read (its text is model paraphrase; no interest line, config.js). comp_facet_state is read for the evidence drawer only, and
// voice_feature is NEVER read: no parent line may rest on voice features (COMPREHENSION-ENGINE §7.3, PARENT-REPORT §3).
import { createHash } from "crypto";
import { addDays, isoWeek, localParts, zonedToUtc } from "../conductor/clock.js";
import { HISTORY_DAYS } from "./config.js";

export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
export const WEEK_RE = /^(\d{4})-W(\d{2})$/;
const iso = (x) => (x == null ? null : new Date(x).toISOString());

/** Monday ('YYYY-MM-DD') of an ISO week id 'YYYY-Www'. */
export function mondayOf(week) {
  const m = WEEK_RE.exec(week);
  if (!m) throw new Error(`reports: bad ISO week ${week}`);
  const y = Number(m[1]), w = Number(m[2]);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const mon1 = new Date(jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * 86_400_000);
  const d = new Date(mon1.getTime() + (w - 1) * 7 * 86_400_000).toISOString().slice(0, 10);
  if (isoWeek(d) !== week) throw new Error(`reports: ISO week ${week} does not exist`);
  return d;
}

/**
 * The learning-day window(s) of a period in the child's tz: a learning day runs 04:00 → 04:00 local (clock.js).
 * @returns {{ cadence: string, period: string, from: string, to: string, firstDay: string, lastDay: string }}
 */
export function windowOf(cadence, period, tz) {
  if (cadence === "daily") {
    if (!DAY_RE.test(period)) throw new Error(`reports: bad day ${period}`);
    return { cadence, period, firstDay: period, lastDay: period, from: zonedToUtc(period, "04:00", tz).toISOString(), to: zonedToUtc(addDays(period, 1), "04:00", tz).toISOString() };
  }
  if (cadence === "weekly") {
    const mon = mondayOf(period);
    return { cadence, period, firstDay: mon, lastDay: addDays(mon, 6), from: zonedToUtc(mon, "04:00", tz).toISOString(), to: zonedToUtc(addDays(mon, 7), "04:00", tz).toISOString() };
  }
  throw new Error(`reports: unknown cadence ${cadence}`);
}

/** Local calendar parts of an instant, for date slots. */
export const dateParts = (at, tz) => { const p = localParts(new Date(at), tz); return { y: p.y, m: p.m, d: p.d }; };

const LATEST_CONSENT = `select distinct on (purpose) purpose, granted from consent
  where guardian_id = $1 and (child_id = $2 or child_id is null) and purpose = any($3) order by purpose, created_at desc, id desc`;

/**
 * @param {{ q: (text: string, params?: any[]) => Promise<any[]> }} db
 * @param {string} childId
 * @param {{ cadence: 'daily'|'weekly', period: string }} p
 * @param {{ skillTitle?: (id: string) => Promise<string|null>, belief?: (id: string) => Promise<string|null> }} [lookup]
 */
export async function loadFacts(db, childId, { cadence, period }, lookup = {}) {
  const c = (await db.q(`select c.id, c.first_name, c.class_level, c.language_pref, c.guardian_id, coalesce(cr.tz, 'Asia/Kolkata') as tz
      from child c left join child_routine cr on cr.child_id = c.id where c.id = $1`, [childId]))[0];
  if (!c) return null;
  const w = windowOf(cadence, period, c.tz);
  const histFrom = new Date(Date.parse(w.from) - HISTORY_DAYS * 86_400_000).toISOString();
  const [consentRows, lessons, events, skills, mis] = await Promise.all([
    db.q(LATEST_CONSENT, [c.guardian_id, childId, ["core_tutoring"]]),
    db.q(`select id, topic_id, started_at, ended_at from lesson where child_id = $1 and started_at >= $2 and started_at < $3 order by started_at, id`, [childId, w.from, w.to]),
    db.q(`select id, seq, session_id, occurred_at, skill_ids, cls, outcome, grader, item_key, teach, pre_attempt_help, entry_rung, misconception_id,
        discriminates, via, contaminated, assisted
      from kt_evidence where child_id = $1 and occurred_at >= $2 and occurred_at < $3 order by seq`, [childId, histFrom, w.to]),
    db.q(`select skill_id, display, next_review_at, refresh from kt_skill_state where child_id = $1`, [childId]),
    db.q(`select misconception_id, hits, resolved_at from kt_misconception where child_id = $1`, [childId]),
  ]);
  const consent = Object.fromEntries(consentRows.map((r) => [r.purpose, !!r.granted]));
  const facts = {
    child: { id: c.id, firstName: c.first_name, classLevel: c.class_level, languagePref: c.language_pref, tz: c.tz },
    window: w,
    consent,
    lessons: lessons.map((l) => ({ id: String(l.id), topicId: l.topic_id, startedAt: iso(l.started_at), endedAt: iso(l.ended_at) })),
    events: events.map((e) => ({ id: e.id, seq: Number(e.seq), sessionId: e.session_id, at: iso(e.occurred_at), skillIds: e.skill_ids, cls: e.cls,
      outcome: Number(e.outcome), grader: e.grader, itemKey: e.item_key, teach: !!e.teach, preAttemptHelp: !!e.pre_attempt_help, entryRung: Number(e.entry_rung) || 0,
      misconceptionId: e.misconception_id, discriminates: e.discriminates, via: e.via, contaminated: !!e.contaminated, assisted: e.assisted })),
    skills: Object.fromEntries(skills.map((s) => [s.skill_id, { display: s.display, nextReviewAt: iso(s.next_review_at), refresh: !!s.refresh }])),
    misconceptions: Object.fromEntries(mis.map((m) => [m.misconception_id, { hits: Number(m.hits), resolvedAt: iso(m.resolved_at) }])),
    titles: {}, beliefs: {},
  };
  const skillIds = new Set(facts.events.flatMap((e) => e.skillIds));
  const misIds = new Set(facts.events.flatMap((e) => [e.misconceptionId, e.discriminates]).filter(Boolean));
  for (const s of skillIds) facts.titles[s] = (await lookup.skillTitle?.(s).catch(() => null)) ?? null;
  for (const m of misIds) facts.beliefs[m] = (await lookup.belief?.(m).catch(() => null)) ?? null;
  return facts;
}

/** Digest of the snapshot (audit and replay: the same facts render the same Lane A text, E-R9). */
export const factsDigest = (f) => createHash("sha256").update(JSON.stringify({ c: f.child, w: f.window, l: f.lessons, e: f.events.map((e) => [e.id, e.seq]),
  s: f.skills, m: f.misconceptions, t: f.titles, b: f.beliefs })).digest("hex").slice(0, 32);
