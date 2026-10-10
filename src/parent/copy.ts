// The Parent corner's English chrome (PRODUCT-DESIGN-V2 §5.3, §5.4, §6.5). UI copy only, never prompt text. Rules:
// sentence case, no exclamation marks, no dashes in strings, digits for numbers, local time as "5:42 pm", copy about
// the child uses their name or "they", the teacher's name and pronoun come from the character record (useTeacher).
// The parent never sees turn language ("Your turn") or the lamp colour (§5.3, G-LAMP-1).
import { ApiError } from "../app/api.ts";
import type { EvidenceRow } from "./api.ts";

const noStop = (s: string) => String(s).replace(/[.\s]+$/, "");
/** A skill's parent label (lower-cased to sit inside "{child} can now …") as a stand-alone title: one name per skill
 *  on every surface (headline, How do we know?, Lesson card, Progress), first letter raised back up. */
export const labelTitle = (label: string) => (label ? label[0].toUpperCase() + label.slice(1) : label);

/** The home headline. KEEP IN STEP with server/routes/parent.js HOME_COPY ("Listen to this page" says these). */
export const HOME = {
  none: (n: string) => `${n}'s first lesson will appear here.`,
  first: (n: string, topic: string) => `${n} had a first lesson: ${noStop(topic)}.`,
  too_early: "Too early to say. After a few more lessons you'll see what's going well and what's still tricky.",
  can_now: (n: string, label: string) => `${n} can now ${noStop(label)}.`,
  practising: (label: string) => `Still practising: ${noStop(label)}.`,
  quiet: "Nothing new to report from this week's lessons yet.",
  no_week: "No lessons this week.",
  held: "No new note right now.",
  not_kept: "Progress isn't kept between days (your choice).",
  alert: (n: string) => `Please check in with ${n}.`,
} as const;

/** The kind of check, in plain words (§6.5.2). Behaviour only, never ability or affect. */
export const KIND_WORDS: Record<string, string> = {
  teachback: "Explained it in their own words",
  why: "Said why the answer is right",
  near_transfer: "Solved a new kind of question on the same idea",
  far_transfer: "Used it in a different situation",
  predict: "Said what would happen before seeing it",
  error_spot: "Found the teacher's deliberate mistake",
  mixup_check: "A quick check for a common mix-up",
  contrast: "Told two similar things apart",
  retrieval: "Still right on a later day",
  other_representation: "Showed it another way: picture, number or words",
  practice: "A practice question",
  taught: "Taught in the lesson",
};

/** The verdict as words next to its shape (tick, half tick, magnifier). Never red, never "wrong". */
export const OUTCOME_WORDS: Record<EvidenceRow["outcome"], string> = {
  correct: "Right",
  incorrect: "Not yet",
  partial: "Partly right",
  misconception: "A common mix-up showed up",
  no_evidence: "Not counted: we could not hear clearly",
};
export const outcomeGlyph = (o: EvidenceRow["outcome"]): "tick" | "half_tick" | "magnifier" | null =>
  o === "correct" ? "tick" : o === "partial" ? "half_tick" : o === "no_evidence" ? null : "magnifier";
export const helpWords = (n: number) => (n <= 0 ? "On their own" : "With a hint");

// ── time and dates: the device's local time, never UTC (audit #20 "Last updated 5:00 am") ──
const d = (iso: string | Date) => (iso instanceof Date ? iso : new Date(iso));
/** "5:42 pm" */
export const fmtTime = (iso: string | Date) => d(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?([ap])\.?m\.?/i, (_m, x: string) => ` ${x.toLowerCase()}m`);
/** "3 Oct" */
export const fmtDay = (iso: string | Date) => d(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
/** "Fri, 3 Oct" */
export const fmtDayLong = (iso: string | Date) => d(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
/** A "HH:MM" lesson-hours value as "7:00 am". */
export const fmtClock = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h)) return hhmm;
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};
/** "Today" / "Yesterday" / "Fri, 3 Oct" for a date. */
export function dayWord(iso: string | Date, now = new Date()) {
  const a = d(iso), b = new Date(now);
  const same = (x: Date, y: Date) => x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
  if (same(a, b)) return "Today";
  b.setDate(b.getDate() - 1);
  if (same(a, b)) return "Yesterday";
  return fmtDayLong(a);
}

export const SUBJECT_NAME: Record<string, string> = { maths: "Maths", science: "Science", evs: "EVS", english: "English", hindi: "Hindi", sst: "Social Science" };
/** The art id for a subject (public/assets/gen/subjects/*). */
export const SUBJECT_ART: Record<string, string> = { maths: "subjects/maths", science: "subjects/science", evs: "subjects/evs", english: "subjects/english", hindi: "subjects/hindi", sst: "subjects/social-science" };
export const BOARD_NAME: Record<string, string> = { cbse: "CBSE", ncert: "NCERT", rbse: "RBSE", icse: "ICSE", "other-state": "State board" };
export const LANG_NAME: Record<string, string> = { english: "English", hindi: "Hindi", hinglish: "Hindi and English mix" };

/**
 * Any failure → one plain sentence for a parent (§4.7: "Raw API strings are never shown"). Known server codes map to
 * their sentence; everything else is "Something went wrong. Try again." The caller attaches a field error to its field.
 */
export function parentError(e: unknown): string {
  if (e instanceof ApiError) {
    const b = (e.body ?? {}) as { code?: string; gate?: string; lockedUntil?: string };
    if (b.code === "password_wrong") return "That password isn't right.";
    if (b.code === "password_needed") return "Enter your account password first.";
    if (b.code === "pin_wrong") return "That PIN isn't right.";
    if (b.code === "pin_shape") return "The PIN needs 4 to 6 digits.";
    if (b.code === "pin_weak") return "Choose a PIN that's harder to guess than 1234 or 1111.";
    if (b.code === "erase_review") return "This deletion needs a check by our team first. Nothing has been deleted. Please try again in a few days.";
    if (b.code === "too_many_tries" || b.gate === "wait") return b.lockedUntil ? `Too many tries. Try again at ${fmtTime(b.lockedUntil)}.` : "Too many tries. Try again later.";
    if (e.status === 401) return "You've been signed out. Sign in again.";
    if (e.status === 404) return "This isn't here any more.";
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "No internet. Try again when you're online.";
  if (e instanceof TypeError) return "No internet. Try again when you're online.";
  return "Something went wrong. Try again.";
}
/** True when the failure is about the password field (attach it there, not at the bottom of the form). */
export const isPasswordError = (e: unknown) => e instanceof ApiError && ((e.body ?? {}) as { code?: string; field?: string }).code === "password_wrong";

/** A home tip without its "At home:" lead (the card is titled "Try at home"), starting with a capital: round 4 journey
 *  audit #15 ("ask Riya …" read as a fragment). */
export const atHomeText = (t: string): string => { const s = t.replace(/^At home:\s*/, ""); return s.charAt(0).toUpperCase() + s.slice(1); };
