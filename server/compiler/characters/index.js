// Teacher character registry. Voices are configurable per deployment (TAXILA_VOICE_ASHA / _ARJUN) because a
// voice is chosen by blind ear test, not by code review (inherited rejection: voice by metrics).
import asha from "./asha.js";
import arjun from "./arjun.js";

export const CHARACTERS = { asha, arjun };

/** The character for a child: their saved teacher_id if known, else Asha for classes 1-4 and Arjun for 5-9. */
export function teacherFor(child) {
  const c = CHARACTERS[child.teacher_id] ?? (child.class_level <= 4 ? asha : arjun);
  return { ...c, voice: process.env[`TAXILA_VOICE_${c.id.toUpperCase()}`] || c.voice };
}
