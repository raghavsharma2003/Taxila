// /api/tutors — who may teach this child, and the child's own pick (AVATAR.md §7, tutor-selection-ux §5).
//
// ONE teacher (dc-r4-single-teacher-asha, TAXILA_SINGLE_TEACHER default on): the offer is [asha] for every class
// (Arjun and Uma are parked in shared/tutors.js), mode "single", and a pick of anyone else is refused (403). No client
// surface offers a choice any more; the route stays so a stale client gets a clean answer, and for the rollback.
//
//   GET  /api/tutors?childId=…   → { current, chosen, mode, band, tutors: [id…] (shuffled per child, no default), live }
//   POST /api/tutors/choose      body { childId, tutorId, source: "child" | "child_random", shown?: [id…], msToChoose? }
//   POST /api/tutors/name        body { childId, name: string | null, source?: "child" | "parent" }   (child-names-teacher)
//   GET  /api/tutors/name?childId=…  → { name, characterName, custom, history } (the parent corner; behind its gate)
//
// Rules (each enforced here, not in the client):
// - The offer comes from shared/tutors.js eligibleTutors(): the child's CLASS (never content level, never device
//   tier), the tutor's status, and a persona sheet + voice existing on this server (CHARACTERS). A character,
//   its voice and its face are one unit, so a tutor without a sheet (uma, today) is never offered.
// - Parent control (a CHANGE from account.js, where every teacher_id write needs the Parent corner once a PIN
//   exists): in B2-B4 the child picks and switches freely (AVATAR §7.1 "free"). In B1 (classes 1-2) a switch
//   needs the Parent-corner unlock; a first pick is free ONLY when the current teacher is the class default, so a
//   teacher the parent set at onboarding or via PATCH counts as already chosen.
// - 409 while a lesson is open (ended_at null, activity in the last LIVE_HOURS): voice and session are bound for
//   the call (§7.4). The check and the write are ONE statement. The lesson also pins its own teacher
//   (state.ctx.teacherId → compile() and /api/tts via teacherForLesson), so a switch that lands next to an open
//   lesson changes the NEXT lesson only.
// - The saved pick is bounded on every read by teacherFor/servesClass (the sheet's classes, or wide), so a class
//   change or switching `wide` off can never keep a register outside the child's class.
// - No reason field anywhere. tutor_switch is analytics only (never read by brief/affect/Director code).
import { one as dbOne, q as dbQ } from "../db.js";
import { bad, need, send, HttpError } from "../http.js";
import { requireChild as authRequireChild } from "../auth.js";
import { requireParentIfPinSet as parentGate } from "./parent.js";
import { CHARACTERS, SINGLE_TEACHER_ID, offerMode as charactersOfferMode, singleTeacher, teacherCard, teacherFor } from "../compiler/characters/index.js";
import { checkTeacherName, effectiveTeacherName } from "../compiler/characters/naming.js";
import { CATALOGUE_REV, bandOfClass, defaultTutorFor, eligibleTutors, teacherNameSuggestions, tutorById } from "../../shared/tutors.js";

const SOURCES = ["child", "child_random"];
const ID_RE = /^[0-9a-f-]{36}$/i;
/** An open lesson with activity this recent blocks a switch. The client keeps no lesson across a page load, so an
 *  older open row is an abandoned tab; the lesson's own teacher is pinned either way (teacherForLesson). */
export const LIVE_HOURS = 6;

/** Injectable for the in-process route test (tests/avatar-tutor-routes.test.mjs); production uses the real ones. */
export const deps = { one: dbOne, q: dbQ, requireChild: authRequireChild, requireParentIfPinSet: parentGate };

export const offerMode = charactersOfferMode;
export const hasSheet = (id) => Object.hasOwn(CHARACTERS, id);

export function eligibilityFor(child) {
  return eligibleTutors(child, { hasSheet, offer: offerMode() });
}

/** A first pick counts as a switch when a parent already set a non-default teacher (onboarding or PATCH). */
export const effectivelyChosen = (child) => !!child.tutor_chosen_at || (!!child.teacher_id && child.teacher_id !== defaultTutorFor(child, { single: singleTeacher() }));

/**
 * The pure decision for a pick. → { ok: true, needsParent, switching } or { ok: false, status, error }.
 * `live` = a lesson for this child is open and active; `chosenBefore` = effectivelyChosen(child).
 */
export function decideChoice({ child, tutorId, source, live, eligibility, chosenBefore }) {
  if (!SOURCES.includes(source)) return { ok: false, status: 400, error: "unknown source" };
  if (!tutorById(tutorId)) return { ok: false, status: 400, error: "unknown tutor" };
  if (singleTeacher() && tutorId !== SINGLE_TEACHER_ID) return { ok: false, status: 403, error: "tutor not offered for this child" };
  if (live) return { ok: false, status: 409, error: "a lesson is live; change teacher between lessons" };
  if (!eligibility.tutors.some((t) => t.id === tutorId)) return { ok: false, status: 403, error: "tutor not offered for this child" };
  const switching = chosenBefore && child.teacher_id !== tutorId;
  const needsParent = switching && bandOfClass(child.class_level) === "b1";
  return { ok: true, needsParent, switching };
}

const LIVE_SQL = `select 1 from lesson l where l.child_id = $1 and l.ended_at is null
       and greatest(l.started_at, coalesce((select max(t.at) from turn t where t.lesson_id = l.id), l.started_at)) > now() - interval '${LIVE_HOURS} hours'`;

async function lessonLive(childId) {
  return !!(await deps.one(`${LIVE_SQL} limit 1`, [childId]));
}

/**
 * The pick as ONE statement: the open-lesson check, the child update and the tutor_switch row commit together or
 * not at all (no teacher change without its log row; no update racing past the live check inside the statement).
 * from_id is the teacher the child moved AWAY from, always (class default or parent pick on a first pick).
 */
export const CHOOSE_SQL = `with live as (${LIVE_SQL} limit 1),
  old as (select id, teacher_id, teacher_name from child where id = $1),
  upd as (update child c set teacher_id = $2::text, tutor_chosen_at = now(),
              teacher_name = case when old.teacher_id is distinct from $2::text then null else c.teacher_name end,
              teacher_name_at = case when old.teacher_id is distinct from $2::text and old.teacher_name is not null then now() else c.teacher_name_at end
            from old
            where c.id = old.id and not exists (select 1 from live)
            returning c.id, c.teacher_id, c.tutor_chosen_at, c.teacher_name, old.teacher_id as from_id, old.teacher_name as from_name),
  ins as (insert into tutor_switch(child_id, from_id, to_id, to_rev, source, shown, ms_to_choose)
            select id, from_id, $2::text, $3::int, $4::text, $5::text[], $6::int from upd returning id),
  -- the name the child gave the old look does not follow them to a new one (it belongs to the look they named)
  renamed as (insert into teacher_name_history(child_id, name, character_id, source)
            select id, null, $2::text, 'switch' from upd where from_id is distinct from $2::text and from_name is not null returning id)
  select upd.id, upd.teacher_id, upd.tutor_chosen_at, upd.teacher_name, upd.from_id from upd`;

async function getTutors(req, res) {
  const childId = new URL(req.url || "/", "http://x").searchParams.get("childId") || "";
  if (!ID_RE.test(childId)) throw bad("invalid childId");
  const { child } = await deps.requireChild(req, childId);
  const el = eligibilityFor(child);
  const teacher = teacherFor(child);
  send(res, 200, {
    current: child.teacher_id ?? null, chosen: !!child.tutor_chosen_at, mode: el.mode, band: el.band,
    tutors: el.tutors.map((t) => t.id), rev: CATALOGUE_REV, live: await lessonLive(child.id),
    // the name the child gave the teacher (null: the character's own), and the picker's suggestions
    name: teacher.name, characterName: teacher.characterName, custom: teacher.name !== teacher.characterName,
    suggestions: teacherNameSuggestions(teacher.id, { childFirstName: child.first_name }),
  });
}

async function choose(req, res, body) {
  const { childId, tutorId } = need(body, "childId", "tutorId");
  if (!ID_RE.test(childId)) throw bad("invalid childId");
  const { child } = await deps.requireChild(req, childId);
  const source = body.source ?? "child";
  const d = decideChoice({ child, tutorId, source, live: await lessonLive(child.id), eligibility: eligibilityFor(child), chosenBefore: effectivelyChosen(child) });
  if (!d.ok) throw new HttpError(d.status, d.error);
  if (d.needsParent) await deps.requireParentIfPinSet(req);
  const shown = Array.isArray(body.shown) ? body.shown.filter((s) => typeof s === "string" && tutorById(s)).slice(0, 6) : [];
  const ms = Number.isFinite(Number(body.msToChoose)) ? Math.max(0, Math.min(3_600_000, Math.round(Number(body.msToChoose)))) : null;
  const c = await deps.one(CHOOSE_SQL, [child.id, tutorId, tutorById(tutorId).look.rev, source, shown, ms]);
  // No row back: a lesson opened between the pre-check and the write (the statement saw it).
  if (!c) throw new HttpError(409, "a lesson is live; change teacher between lessons");
  send(res, 200, { current: c.teacher_id, chosen: true, chosenAt: c.tutor_chosen_at, name: c.teacher_name ?? null });
}

// ───────────── the child names the teacher (decision child-names-teacher) ─────────────

const NAME_SOURCES = ["child", "parent"];
/**
 * The name write as ONE statement: the child row and its history row land together or not at all. A name equal to
 * the character's own is stored as null (no rename). No open-lesson check: the lesson pins its name at start
 * (state.ctx.teacherName), so a rename always lands on the NEXT lesson and never changes an open one.
 */
export const NAME_SQL = `with upd as (update child set teacher_name = $2::text, teacher_name_at = now(), teacher_id = coalesce($4::text, teacher_id) where id = $1 returning id, teacher_id, teacher_name),
  hist as (insert into teacher_name_history(child_id, name, character_id, source) select id, $2::text, teacher_id, $3::text from upd returning id)
  select upd.id, upd.teacher_id, upd.teacher_name from upd`;

/**
 * PURE. What a name request decides: → { ok: true, stored } (stored null = the character's own name) or
 * { ok: false, status, error, reason?, suggestions? }. The child's refusal is gentle by design: a reason code the
 * picker turns into one kind sentence, plus names to tap. The typed name is never echoed back or logged.
 */
export function decideName({ child, name, source }) {
  if (!NAME_SOURCES.includes(source)) return { ok: false, status: 400, error: "unknown source" };
  const character = CHARACTERS[teacherFor(child).id];
  if (name === null || name === undefined || name === "") return { ok: true, stored: null };
  if (typeof name !== "string" || name.length > 64) return { ok: false, status: 400, error: "invalid name" };
  const r = checkTeacherName(name, { childFirstName: child.first_name, characterId: character?.id });
  if (!r.ok) return { ok: false, status: 422, error: "name not allowed", reason: r.reason, suggestions: r.suggestions };
  return { ok: true, stored: r.name === character?.name ? null : r.name };
}

/**
 * Name tries per child per minute. A child trying names is a handful; a script walking the denylist one request at a
 * time (each refusal also returns suggestions) is hundreds. In-process like parent.js rateLimit (a burst bound, per
 * replica); the denylist is data, not a secret, so this only bounds probing, it does not hide anything.
 */
export const NAME_TRIES_PER_MIN = 20;
const nameTries = new Map();
export function nameRateLimit(childId, now = Date.now()) {
  const list = (nameTries.get(childId) ?? []).filter((t) => now - t < 60_000);
  if (list.length >= NAME_TRIES_PER_MIN) {
    nameTries.set(childId, list);
    throw new HttpError(429, "too many tries; wait a minute", { gate: "wait", lockedUntil: new Date(list[0] + 60_000).toISOString() });
  }
  list.push(now);
  nameTries.set(childId, list);
  if (nameTries.size > 5000) for (const [k, v] of nameTries) if (!v.length || now - v.at(-1) > 60_000) nameTries.delete(k);
}

async function setName(req, res, body) {
  const { childId } = need(body, "childId");
  if (!ID_RE.test(childId)) throw bad("invalid childId");
  const { child } = await deps.requireChild(req, childId);
  nameRateLimit(child.id);
  const source = body.source ?? "child";
  // The parent's view and reset live behind the Parent-corner gate (a PIN, when one is set).
  if (source === "parent") await deps.requireParentIfPinSet(req);
  const d = decideName({ child, name: body.name ?? null, source });
  if (!d.ok) throw new HttpError(d.status, d.error, d.reason ? { reason: d.reason, suggestions: d.suggestions } : undefined);
  // Single teacher: the name is given to Asha, so the row says so (a class 5-9 row may still hold the old default
  // "arjun"; teacherFor honours a name only on the look it was given to). Otherwise the saved look is kept.
  const row = await deps.one(NAME_SQL, [child.id, d.stored, source, singleTeacher() ? SINGLE_TEACHER_ID : null]);
  if (!row) throw new HttpError(404, "child not found");
  const teacher = teacherFor({ ...child, teacher_id: row.teacher_id, teacher_name: row.teacher_name });
  send(res, 200, { name: teacher.name, characterName: teacher.characterName, custom: !!row.teacher_name, teacher: teacherCard(teacher) });
}

/** GET /api/tutors/name — the parent corner's "Teacher's name" row: the name in use, the look's own, and the history. */
async function getName(req, res) {
  const childId = new URL(req.url || "/", "http://x").searchParams.get("childId") || "";
  if (!ID_RE.test(childId)) throw bad("invalid childId");
  const { child } = await deps.requireChild(req, childId);
  await deps.requireParentIfPinSet(req);
  const teacher = teacherFor(child);
  const rows = (await deps.q("select name, character_id, source, at from teacher_name_history where child_id = $1 order by at desc limit 20", [child.id])) ?? [];
  send(res, 200, {
    name: teacher.name, characterName: teacher.characterName, custom: teacher.name !== teacher.characterName,
    characterId: teacher.id, band: bandOfClass(child.class_level),
    // a stored name that no longer passes (a denylist entry added later) is shown as retired, never in use
    retired: !!child.teacher_name && effectiveTeacherName(CHARACTERS[teacher.id], child) !== child.teacher_name,
    history: rows.map((r) => ({ name: r.name ?? null, characterId: r.character_id, source: r.source, at: r.at })),
  });
}

export const routes = {
  "GET /api/tutors": getTutors,
  "POST /api/tutors/choose": choose,
  "POST /api/tutors/name": setName,
  "GET /api/tutors/name": getName,
};
