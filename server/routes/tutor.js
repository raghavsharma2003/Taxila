// /api/tutors — who may teach this child, and the child's own pick (AVATAR.md §7, tutor-selection-ux §5).
//
//   GET  /api/tutors?childId=…   → { current, chosen, mode, band, tutors: [id…] (shuffled per child, no default), live }
//   POST /api/tutors/choose      body { childId, tutorId, source: "child" | "child_random", shown?: [id…], msToChoose? }
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
import { one as dbOne } from "../db.js";
import { bad, need, send, HttpError } from "../http.js";
import { requireChild as authRequireChild } from "../auth.js";
import { requireParentIfPinSet as parentGate } from "./parent.js";
import { CHARACTERS, offerMode as charactersOfferMode } from "../compiler/characters/index.js";
import { CATALOGUE_REV, bandOfClass, defaultTutorFor, eligibleTutors, tutorById } from "../../shared/tutors.js";

const SOURCES = ["child", "child_random"];
const ID_RE = /^[0-9a-f-]{36}$/i;
/** An open lesson with activity this recent blocks a switch. The client keeps no lesson across a page load, so an
 *  older open row is an abandoned tab; the lesson's own teacher is pinned either way (teacherForLesson). */
export const LIVE_HOURS = 6;

/** Injectable for the in-process route test (tests/avatar-tutor-routes.test.mjs); production uses the real ones. */
export const deps = { one: dbOne, requireChild: authRequireChild, requireParentIfPinSet: parentGate };

export const offerMode = charactersOfferMode;
export const hasSheet = (id) => Object.hasOwn(CHARACTERS, id);

export function eligibilityFor(child) {
  return eligibleTutors(child, { hasSheet, offer: offerMode() });
}

/** A first pick counts as a switch when a parent already set a non-default teacher (onboarding or PATCH). */
export const effectivelyChosen = (child) => !!child.tutor_chosen_at || (!!child.teacher_id && child.teacher_id !== defaultTutorFor(child));

/**
 * The pure decision for a pick. → { ok: true, needsParent, switching } or { ok: false, status, error }.
 * `live` = a lesson for this child is open and active; `chosenBefore` = effectivelyChosen(child).
 */
export function decideChoice({ child, tutorId, source, live, eligibility, chosenBefore }) {
  if (!SOURCES.includes(source)) return { ok: false, status: 400, error: "unknown source" };
  if (!tutorById(tutorId)) return { ok: false, status: 400, error: "unknown tutor" };
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
  old as (select id, teacher_id from child where id = $1),
  upd as (update child c set teacher_id = $2::text, tutor_chosen_at = now() from old
            where c.id = old.id and not exists (select 1 from live)
            returning c.id, c.teacher_id, c.tutor_chosen_at, old.teacher_id as from_id),
  ins as (insert into tutor_switch(child_id, from_id, to_id, to_rev, source, shown, ms_to_choose)
            select id, from_id, $2::text, $3::int, $4::text, $5::text[], $6::int from upd returning id)
  select upd.id, upd.teacher_id, upd.tutor_chosen_at, upd.from_id from upd`;

async function getTutors(req, res) {
  const childId = new URL(req.url || "/", "http://x").searchParams.get("childId") || "";
  if (!ID_RE.test(childId)) throw bad("invalid childId");
  const { child } = await deps.requireChild(req, childId);
  const el = eligibilityFor(child);
  send(res, 200, {
    current: child.teacher_id ?? null, chosen: !!child.tutor_chosen_at, mode: el.mode, band: el.band,
    tutors: el.tutors.map((t) => t.id), rev: CATALOGUE_REV, live: await lessonLive(child.id),
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
  send(res, 200, { current: c.teacher_id, chosen: true, chosenAt: c.tutor_chosen_at });
}

export const routes = {
  "GET /api/tutors": getTutors,
  "POST /api/tutors/choose": choose,
};
