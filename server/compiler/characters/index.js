// Teacher character registry. Voices are configurable per deployment (TAXILA_VOICE_ASHA / _ARJUN) because a
// voice is chosen by blind ear test, not by code review (inherited rejection: voice by metrics).
import asha from "./asha.js";
import arjun from "./arjun.js";
import { tutorById } from "../../../shared/tutors.js";

export const CHARACTERS = { asha, arjun };

/** Offer ranges: the persona sheets' own (default), or AVATAR §5.1 widened once the band layer carries register. */
export const offerMode = () => (process.env.TAXILA_TUTOR_OFFER === "wide" ? "wide" : "sheet");

/**
 * The classes a character may TEACH right now: its persona sheet's own `classes` (the register it was written
 * for), or, only under TAXILA_TUTOR_OFFER=wide, the AVATAR §5.1 wide range. This is the hard bound for a saved
 * teacher_id, whoever saved it (child pick, parent, onboarding), and it is evaluated on every call, so switching
 * `wide` off or a class change takes effect at the next lesson with no data migration.
 */
export function servesClass(id, classLevel, mode = offerMode()) {
  const c = CHARACTERS[id];
  if (!c) return false;
  const cls = Number(classLevel) || 1;
  const wide = mode === "wide" ? tutorById(id)?.fit?.wideOfferClasses : null;
  const [lo, hi] = wide ?? c.classes;
  return cls >= lo && cls <= hi;
}

const classDefault = (child) => (child.class_level <= 4 ? asha : arjun);
const warned = new Set();

/**
 * The character for a child: their saved teacher_id when that character serves the child's class (servesClass),
 * else the class default (Asha for classes 1-4, Arjun for 5-9). An out-of-range saved pick is logged once per
 * child per process and NOT rewritten: the row keeps the child's choice so a later class or mode can honour it.
 */
export function teacherFor(child) {
  const saved = CHARACTERS[child.teacher_id];
  let c = saved ?? classDefault(child);
  if (saved && !servesClass(saved.id, child.class_level)) {
    c = classDefault(child);
    const key = `${child.id}:${saved.id}:${child.class_level}`;
    if (!warned.has(key) && warned.size < 10_000) {
      warned.add(key);
      console.warn(`[teacher] saved ${saved.id} does not serve class ${child.class_level} (${offerMode()}); using ${c.id}`);
    }
  }
  return { ...c, voice: process.env[`TAXILA_VOICE_${c.id.toUpperCase()}`] || c.voice };
}

/**
 * The character PINNED to a lesson: the one compile() was built with at lesson start (state.ctx.teacherId), so a
 * teacher switch between turns of an open lesson can never give the lesson a second voice. A character, its voice
 * and its face are one unit for the life of the lesson (AVATAR §7.4). Falls back to teacherFor(child) for lessons
 * that predate the pin.
 * @param {any} child  child row
 * @param {string | null | undefined} pinnedId  lesson.state.ctx.teacherId
 */
export function teacherForLesson(child, pinnedId) {
  const c = pinnedId && CHARACTERS[pinnedId];
  if (!c) return teacherFor(child);
  return { ...c, voice: process.env[`TAXILA_VOICE_${c.id.toUpperCase()}`] || c.voice };
}
