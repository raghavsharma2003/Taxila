// Subject rotation (round 7 F item 1, learning-subject-rotation; dc-r7 D6). Which subject does today's lesson teach?
// A tuition teacher's answer, in priority order:
//   1. the school timetable for today's weekday (the parent's, else the one the child's intake learned);
//   2. a school test window (inside the timetable's subjects when there is a timetable; on its own when there is none);
//   3. subjects with skills due for review;
//   4. the least-recently-taught subject (never taught first, in the class's subject order).
// A subject already taught today drops to the end, so a second lesson the same day moves on. PURE; the reads live in
// reports/truth.js nextTopicForPlan (the ONE next-topic function: home, lesson start, parent "next lesson") and the
// Conductor planner (slot.subject). Kill switch: TAXILA_ROTATION=off → the old fixed SUBJECT_ORDER.

/** Rotation on unless TAXILA_ROTATION=off (read per call so a test or an incident can switch it). */
export const rotationOn = () => process.env.TAXILA_ROTATION !== "off";

/** Subjects rotation may send a child to (TAXILA_ROTATION_SUBJECTS=maths,science,... narrows it; default: every kit). */
export function rotationSubjects(all) {
  const only = String(process.env.TAXILA_ROTATION_SUBJECTS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return only.length ? all.filter((s) => only.includes(s)) : [...all];
}

/** The subject names a parent or a child may use, mapped onto the curriculum's ids. */
const ALIASES = {
  math: "maths", mathematics: "maths", ganit: "maths", "गणित": "maths",
  sci: "science", vigyan: "science", "विज्ञान": "science",
  evs: "evs", environment: "evs", "paryavaran": "evs", "पर्यावरण": "evs",
  eng: "english", angrezi: "english", "अंग्रेज़ी": "english", "अंग्रेजी": "english",
  hin: "hindi", "हिंदी": "hindi", "हिन्दी": "hindi",
  social: "sst", "social science": "sst", "social studies": "sst", sst: "sst", history: "sst", geography: "sst", civics: "sst", "samajik vigyan": "sst",
};

/**
 * PURE. A subject name onto one of the class's subjects: aliases, and science ↔ evs by class (classes 3-5 learn EVS,
 * 6+ science; a parent who types "science" for class 4 means EVS). null when the class has no such subject.
 * @param {string} name  @param {string[]} classSubjects
 */
export function normaliseSubject(name, classSubjects) {
  const k = String(name ?? "").trim().toLowerCase();
  let s = ALIASES[k] ?? k;
  if (!classSubjects.includes(s)) {
    if (s === "science" && classSubjects.includes("evs")) s = "evs";
    else if (s === "evs" && classSubjects.includes("science")) s = "science";
  }
  return classSubjects.includes(s) ? s : null;
}

/**
 * PURE. Today's school subjects from timetable rows: the parent's row for the weekday wins over the intake's.
 * @param {{ weekday: number, source: "parent"|"intake", subjects: string[] }[]} rows
 * @param {number} weekday  0 = Sunday
 * @param {string[]} classSubjects
 * @returns {{ subjects: string[], source: "parent"|"intake"|null }}
 */
export function timetableToday(rows, weekday, classSubjects) {
  const of = (src) => (rows ?? []).find((r) => Number(r.weekday) === Number(weekday) && r.source === src);
  const row = of("parent") ?? of("intake");
  if (!row) return { subjects: [], source: null };
  const subjects = [...new Set((row.subjects ?? []).map((s) => normaliseSubject(s, classSubjects)).filter(Boolean))];
  return { subjects, source: subjects.length ? row.source : null };
}

/**
 * PURE. The day's subjects in the order today's lessons should take them, and why the first one leads.
 * @param {{ classSubjects: string[], timetable?: string[], timetableSource?: "parent"|"intake"|null,
 *   testWindow?: { subject: string } | null, dueSubjects?: string[], lastTaught?: Record<string, string>,
 *   taughtToday?: string[] }} x
 *   `lastTaught` subject → the last learning day (YYYY-MM-DD) a lesson of it STARTED before today
 * @returns {{ subjects: string[], subject: string|null, why: "timetable"|"intake_timetable"|"test_window"|"due_review"|"rotation"|null }}
 */
export function rankSubjects({ classSubjects, timetable = [], timetableSource = null, testWindow = null, dueSubjects = [], lastTaught = {}, taughtToday = [] }) {
  const all = [...new Set(classSubjects)];
  if (!all.length) return { subjects: [], subject: null, why: null };
  const tt = timetable.filter((s) => all.includes(s));
  const pool = tt.length ? tt : all;
  const order = [];
  const whyOf = new Map();
  const put = (s, why) => { if (pool.includes(s) && !order.includes(s)) { order.push(s); whyOf.set(s, why); } };
  if (testWindow?.subject) put(testWindow.subject, "test_window");
  for (const s of dueSubjects) put(s, "due_review");
  // least recently taught: never taught first (pool order), then the oldest day; ties keep pool order
  const lrt = [...pool].sort((a, b) => {
    const da = lastTaught[a] ?? "", db = lastTaught[b] ?? "";
    return da === db ? pool.indexOf(a) - pool.indexOf(b) : da < db ? -1 : 1;
  });
  for (const s of lrt) put(s, "rotation");
  // A timetable day keeps the timetable's own order for its subjects unless a test window or a due review lifts one;
  // its subjects are what school did today, so the rotation only breaks ties between them.
  let ranked = order;
  if (tt.length) {
    const lifted = order.filter((s) => whyOf.get(s) !== "rotation");
    const rest = tt.filter((s) => !lifted.includes(s));
    const restByLrt = rest.length > 1 ? lrt.filter((s) => rest.includes(s)) : rest;
    ranked = [...lifted, ...restByLrt];
    for (const s of restByLrt) whyOf.set(s, timetableSource === "intake" ? "intake_timetable" : "timetable");
  }
  // already taught today → last (a second lesson moves on), order otherwise kept
  const done = new Set(taughtToday);
  ranked = [...ranked.filter((s) => !done.has(s)), ...ranked.filter((s) => done.has(s))];
  return { subjects: ranked, subject: ranked[0] ?? null, why: ranked[0] ? whyOf.get(ranked[0]) ?? "rotation" : null };
}
