// /api/tutors — who may teach this child, and the child's own pick (AVATAR.md §7, tutor-selection-ux §5).
//
//   GET  /api/tutors?childId=…   → { current, chosen, mode, band, tutors: [id…] (shuffled per child, no default), live }
//   POST /api/tutors/choose      body { childId, tutorId, source: "child" | "child_random", shown?: [id…], msToChoose? }
//
// Rules (each enforced here, not in the client):
// - The offer comes from shared/tutors.js eligibleTutors(): the child's CLASS (never content level, never device
//   tier), the tutor's status, and a persona sheet + voice existing on this server (CHARACTERS). A character,
//   its voice and its face are one unit, so a tutor without a sheet (uma, today) is never offered.
// - The first pick is the child's own act (C1b), so it needs no parent unlock. A later SWITCH in B1 (classes 1-2)
//   defaults to "ask parent" (AVATAR §7.1), which here means the Parent-corner unlock once a PIN exists.
// - 409 while a lesson is live: voice and session are bound for the call (§7.4).
// - No reason field anywhere. tutor_switch is analytics only (never read by brief/affect/Director code).
import { q, one } from "../db.js";
import { bad, need, send, HttpError } from "../http.js";
import { requireChild } from "../auth.js";
import { requireParentIfPinSet } from "./parent.js";
import { CHARACTERS } from "../compiler/characters/index.js";
import { CATALOGUE_REV, bandOfClass, eligibleTutors, tutorById } from "../../shared/tutors.js";

const SOURCES = ["child", "child_random"];
const ID_RE = /^[0-9a-f-]{36}$/i;

/** Offer ranges: the persona sheets' own (default), or AVATAR §5.1 widened once the band layer carries register. */
export const offerMode = () => (process.env.TAXILA_TUTOR_OFFER === "wide" ? "wide" : "sheet");
export const hasSheet = (id) => Object.hasOwn(CHARACTERS, id);

export function eligibilityFor(child) {
  return eligibleTutors(child, { hasSheet, offer: offerMode() });
}

/**
 * The pure decision for a pick. → { ok: true, needsParent } or { ok: false, status, error }.
 * `live` = a lesson for this child is open and active; `chosenBefore` = tutor_chosen_at is set.
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

/** A lesson that is open and saw activity in the last 15 minutes is live (abandoned tabs never close a row). */
async function lessonLive(childId) {
  const row = await one(
    `select 1 from lesson l where l.child_id = $1 and l.ended_at is null
       and greatest(l.started_at, coalesce((select max(t.at) from turn t where t.lesson_id = l.id), l.started_at)) > now() - interval '15 minutes'
     limit 1`, [childId]);
  return !!row;
}

async function getTutors(req, res) {
  const childId = new URL(req.url || "/", "http://x").searchParams.get("childId") || "";
  if (!ID_RE.test(childId)) throw bad("invalid childId");
  const { child } = await requireChild(req, childId);
  const el = eligibilityFor(child);
  send(res, 200, {
    current: child.teacher_id, chosen: !!child.tutor_chosen_at, mode: el.mode, band: el.band,
    tutors: el.tutors.map((t) => t.id), rev: CATALOGUE_REV, live: await lessonLive(child.id),
  });
}

async function choose(req, res, body) {
  const { childId, tutorId } = need(body, "childId", "tutorId");
  if (!ID_RE.test(childId)) throw bad("invalid childId");
  const { child } = await requireChild(req, childId);
  const source = body.source ?? "child";
  const d = decideChoice({ child, tutorId, source, live: await lessonLive(child.id), eligibility: eligibilityFor(child), chosenBefore: !!child.tutor_chosen_at });
  if (!d.ok) throw new HttpError(d.status, d.error);
  if (d.needsParent) await requireParentIfPinSet(req);
  const shown = Array.isArray(body.shown) ? body.shown.filter((s) => typeof s === "string" && tutorById(s)).slice(0, 6) : [];
  const ms = Number.isFinite(Number(body.msToChoose)) ? Math.max(0, Math.min(3_600_000, Math.round(Number(body.msToChoose)))) : null;
  const c = await one("update child set teacher_id = $2, tutor_chosen_at = now() where id = $1 returning id, teacher_id, tutor_chosen_at", [child.id, tutorId]);
  await q(
    "insert into tutor_switch(child_id, from_id, to_id, to_rev, source, shown, ms_to_choose) values ($1,$2,$3,$4,$5,$6,$7)",
    [child.id, child.tutor_chosen_at ? child.teacher_id : null, tutorId, tutorById(tutorId).look.rev, source, shown, ms]);
  send(res, 200, { current: c.teacher_id, chosen: true, chosenAt: c.tutor_chosen_at });
}

export const routes = {
  "GET /api/tutors": getTutors,
  "POST /api/tutors/choose": choose,
};
