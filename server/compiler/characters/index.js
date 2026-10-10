// Teacher character registry. Voices are configurable per deployment (TAXILA_VOICE_ASHA / _ARJUN) because a
// voice is chosen by blind ear test, not by code review (inherited rejection: voice by metrics).
import asha from "./asha.js";
import arjun from "./arjun.js";
import { tutorById } from "../../../shared/tutors.js";
import { effectiveTeacherName } from "./naming.js";

export const CHARACTERS = { asha, arjun };

/**
 * ONE teacher (dc-r4-single-teacher-asha): Asha teaches every class 1-9. On unless TAXILA_SINGLE_TEACHER is off / 0 /
 * false, which is the rollback to the class default of before (Asha 1-4, Arjun 5-9). Read on every call, so flipping
 * it on the running app takes effect at the next lesson with no data migration; open lessons keep their pinned teacher
 * either way (teacherForLesson). Arjun's sheet stays here, parked (shared/tutors.js status "parked").
 */
export const singleTeacher = () => !/^(off|0|false)$/i.test(String(process.env.TAXILA_SINGLE_TEACHER ?? "").trim());
export const SINGLE_TEACHER_ID = "asha";

/**
 * A sheet in the register of the child's class band: a sheet with `bands` (asha.js) takes that band's notes and
 * teach-back protégé; identity, voice, pronouns and the floor never change. A sheet without bands is returned as is.
 * `classLevel` missing → the sheet's top-level (first) band.
 */
export function sheetFor(c, classLevel) {
  if (!c?.bands) return c;
  const cls = Number(classLevel);
  const band = Number.isFinite(cls) ? c.bands.find((b) => cls >= b.classes[0] && cls <= b.classes[1]) : null;
  return band ? { ...c, notes: band.notes, protege: band.protege } : c;
}

/** Every sheet compile() can be given: each band of each registered character (persona invariants, budget gates). */
export const SHEETS = Object.values(CHARACTERS).flatMap((c) =>
  c.bands ? c.bands.map((b) => ({ ...sheetFor(c, b.classes[0]), sheetBand: `${c.id}:${b.classes[0]}-${b.classes[1]}` })) : [{ ...c, sheetBand: c.id }]);

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
  if (singleTeacher() && id !== SINGLE_TEACHER_ID) return false;
  const cls = Number(classLevel) || 1;
  const wide = mode === "wide" ? tutorById(id)?.fit?.wideOfferClasses : null;
  const [lo, hi] = wide ?? c.classes;
  return cls >= lo && cls <= hi;
}

/** The class default before round 4 (Asha 1-4, Arjun 5-9): the rollback rule, and the look an unpinned name was given to. */
const legacyDefault = (child) => (Number(child.class_level) <= 4 ? asha : arjun);
const classDefault = (child) => (singleTeacher() ? CHARACTERS[SINGLE_TEACHER_ID] : legacyDefault(child));

/**
 * The look a stored custom name belongs to: the saved teacher_id, else the class default the child had when they named
 * it. A name the child gave one look never follows them to another (tutor.js CHOOSE_SQL resets it on a switch), so a
 * class 5-9 child who named Arjun does not see Asha under that name; they meet Asha under her own.
 */
const namedLook = (child) => (CHARACTERS[child.teacher_id] ? child.teacher_id : legacyDefault(child).id);

/**
 * A character under the name the child gave it (decision child-names-teacher): name and addressedAs change ("Asha
 * didi" → "Meenu didi"); the look, voice, pronouns, notes and every floor rule stay the character's. `characterName`
 * keeps the sheet's own name (the parent corner's "Reset to Asha"). A name equal to the sheet's is no rename.
 */
export function named(c, name) {
  const n = typeof name === "string" && name.trim() ? name.trim() : c.name;
  if (n === c.name) return { ...c, characterName: c.name };
  // a name that already carries a title ("Miss Meenu", "Rao Sir") is said as given, never "Miss Meenu didi"
  const titled = /(?:^|[\s-])(?:miss|mr|mrs|ms|madam|maam|sir|didi|bhaiya|ji|teacher)(?:$|[\s-])/i.test(n);
  const addressedAs = titled || !c.addressedAs.includes(c.name) ? n : c.addressedAs.split(c.name).join(n);
  return { ...c, name: n, addressedAs, characterName: c.name };
}

/**
 * The character compile() renders for a lesson state: the pinned one (ctx.teacherId) under the pinned name
 * (ctx.teacherName, fixed at lesson start), so a rename between turns never changes an open lesson's persona.
 */
export function characterForState(state) {
  const c = CHARACTERS[state?.ctx?.teacherId];
  if (!c) return c;
  // the band from the lesson's class (pinned at start); an older state with only an age band maps 10-15 → classes 5-9
  const cls = state.ctx.classLevel ?? (state.ctx.ageBand === "10-15" ? 5 : state.ctx.ageBand === "6-9" ? 1 : undefined);
  return named(sheetFor(c, cls), state.ctx.teacherName);
}
const warned = new Set();

/**
 * The character for a child, in the register of the child's class band (sheetFor): their saved teacher_id when that
 * character serves the child's class (servesClass), else the class default: Asha for every class under the single
 * teacher (default), or Asha 1-4 / Arjun 5-9 with TAXILA_SINGLE_TEACHER off. An out-of-range saved pick is logged once per
 * child per process and NOT rewritten: the row keeps the child's choice so a later class or mode can honour it.
 */
export function teacherFor(child) {
  const saved = CHARACTERS[child.teacher_id];
  let c = saved ?? classDefault(child);
  if (saved && !servesClass(saved.id, child.class_level)) {
    c = classDefault(child);
    // Under the single teacher every saved Arjun row is served Asha by design: that is the rule, not a warning.
    const key = `${child.id}:${saved.id}:${child.class_level}`;
    if (!singleTeacher() && !warned.has(key) && warned.size < 10_000) {
      warned.add(key);
      console.warn(`[teacher] saved ${saved.id} does not serve class ${child.class_level} (${offerMode()}); using ${c.id}`);
    }
  }
  const name = namedLook(child) === c.id ? effectiveTeacherName(c, child) : c.name;
  return { ...named(sheetFor(c, child.class_level), name), voice: process.env[`TAXILA_VOICE_${c.id.toUpperCase()}`] || c.voice };
}

/**
 * The character PINNED to a lesson: the one compile() was built with at lesson start (state.ctx.teacherId), so a
 * teacher switch between turns of an open lesson can never give the lesson a second voice. A character, its voice
 * and its face are one unit for the life of the lesson (AVATAR §7.4). Falls back to teacherFor(child) for lessons
 * that predate the pin.
 * The name is pinned the same way (ctx.teacherName, set at start): a rename lands on the NEXT lesson.
 * @param {any} child  child row
 * @param {string | null | undefined} pinnedId  lesson.state.ctx.teacherId
 * @param {string | null | undefined} [pinnedName]  lesson.state.ctx.teacherName
 */
export function teacherForLesson(child, pinnedId, pinnedName) {
  const c = pinnedId && CHARACTERS[pinnedId];
  if (!c) return teacherFor(child);
  return { ...named(sheetFor(c, child?.class_level), pinnedName ?? c.name), voice: process.env[`TAXILA_VOICE_${c.id.toUpperCase()}`] || c.voice };
}

/**
 * The teacher as every surface shows them (PRODUCT-DESIGN-V2 §0.8, P5: one character record): id, name, the role the
 * child calls them by, pronouns, the live voice, and the look revision the client renders. The server is the one
 * source; a client never hard-codes a teacher name or pronoun (audit #4: three faces, two names, two genders).
 * `name` is the name the child gave the character (or its own); `characterName` is the look's own name.
 * @param {{ id: string, name: string, addressedAs: string, characterName?: string, pronouns: { subject: string, object: string, possessive: string }, voice: string }} c
 */
export function teacherCard(c) {
  const t = tutorById(c.id);
  return { id: c.id, name: c.name, characterName: c.characterName ?? CHARACTERS[c.id]?.name ?? c.name, addressedAs: c.addressedAs,
    pronouns: { ...c.pronouns }, voice: c.voice, role: "AI teacher", lookRev: t?.look?.rev ?? null, signatureColor: t?.look?.signatureColor ?? null };
}
