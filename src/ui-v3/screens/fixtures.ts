// Illustrative fixtures for the gallery, the shot battery and the screen tests. NOT product data and NOT prompt text:
// the teacher lines here are UI illustrations and must never be pasted into a persona or Director prompt (recitation law,
// DESIGN-V3 §7). Class 6 maths chapters follow data/curriculum (NCERT Ganita Prakash); states are illustrative.
// Teachers are the in-house cast from shared/tutors.js (Asha, Arjun), never the mockup portraits.
import type { EndData, HomeData, LessonData, ParentData, ProgressData } from "./types.ts";

export const ASHA = { id: "asha", name: "Asha", band: "b3" };
export const ARJUN = { id: "arjun", name: "Arjun", band: "b3" };

export const HOME: HomeData = {
  childName: "Aarav",
  dateLine: "Thursday · 5:24 PM",
  greeting: "Evening, Aarav.",
  teacher: ARJUN,
  next: {
    subject: "maths", classLevel: 6, title: "Why the triangle formula has a half",
    why: "You asked this on Tuesday. 4-minute proof, then you try to break it.",
    inside: ["board", "explorable", "game"], minutes: 18,
  },
  note: "Your 6/8 vs 3/4 instinct on Tuesday was right before you could explain it. Today you explain it.",
  made: [
    { id: "m1", title: "Fraction Pilot", kind: "game", when: "Tuesday", thumb: "fractions" },
    { id: "m2", title: "Why leaves look green", kind: "animation", when: "Monday", thumb: "leaf" },
    { id: "m3", title: "Half a rectangle", kind: "board", when: "Last week", thumb: "triangle" },
  ],
  later: [
    { id: "l1", text: "Why do some leaves have parallel veins?", when: "Coming up in Science · Saturday" },
    { id: "l2", text: "Is 0.999… really equal to 1?", when: "Saved for decimals" },
  ],
  week: [
    { label: "Mon", planned: true, done: true, today: false },
    { label: "Tue", planned: false, done: false, today: false },
    { label: "Wed", planned: true, done: true, today: false },
    { label: "Thu", planned: true, done: false, today: true, time: "5:30" },
    { label: "Fri", planned: false, done: false, today: false },
    { label: "Sat", planned: true, done: false, today: false, time: "11:00" },
    { label: "Sun", planned: false, done: false, today: false },
  ],
  subjects: [
    { subject: "maths", title: "Perimeter and area", detail: "Ch 6 · 2 of 3 skills secure" },
    { subject: "science", title: "Diversity in the living world", detail: "Ch 2 · in progress" },
    { subject: "english", title: "A Bottle of Dew", detail: "Reading · next" },
    { subject: "social", title: "Locating places on the Earth", detail: "Geography · Ch 1" },
  ],
};

const STEER_BOARD: LessonData["steer"] = [
  { label: "Show again", icon: "replay", intent: "replay" },
  { label: "Slower", icon: "slow", intent: "slower" },
  { label: "Another way", icon: "shuffle", intent: "explain_differently" },
  { label: "Hindi mein", icon: "globe", intent: "language_hindi" },
  { label: "Show me a diagram", icon: "pencil", intent: "visual_request" },
];

export const LESSON_BOARD: LessonData = {
  teacher: ARJUN, subject: "maths", classLevel: 6, topic: "Perimeter and area", phase: "learn",
  floor: "handover",
  lines: [
    { who: "her", text: "Last time you found the area of a rectangle in one line. Today, triangles.", old: true },
    { who: "me", text: "isn't it just base into height?", old: true },
    { who: "me", text: "why is there a half in the formula?" },
    { who: "her", text: "So the triangle is exactly half the rectangle. Now try to break it: slide the top point anywhere." },
  ],
  steer: STEER_BOARD,
  later: [],
  artifact: { kind: "board", key: "tri-board", label: "A rectangle 8 by 5 centimetres with a triangle inside whose top point touches the top edge" },
  yourMove: { text: "Your move", hint: "· drag the top point" },
  readout: { label: "AREA", value: "20 cm²" },
};

export const LESSON_SPEAKING: LessonData = { ...LESSON_BOARD, floor: "her_turn", yourMove: undefined,
  lines: [...LESSON_BOARD.lines.slice(0, 3), { who: "her", text: "Drop a straight line from the top: that's the height, h." }] };

export const LESSON_GAME: LessonData = {
  ...LESSON_BOARD, topic: "Fractions", floor: "idle", watching: true,
  lines: [
    { who: "her", text: "Fly through the gate that equals the target. Same value, different numbers.", old: true },
    { who: "me", text: "ok wait 6 by 8 is the same as 3 by 4 right" },
    { who: "her", text: "Go find out. I'm watching." },
  ],
  steer: [
    { label: "Restart", icon: "replay", intent: "game_restart" },
    { label: "Slower", icon: "slow", intent: "slower" },
    { label: "Harder", icon: "bolt", intent: "harder" },
    { label: "Explain it", icon: "question", intent: "explain" },
  ],
  artifact: { kind: "game", key: "fraction-pilot", label: "Fraction Pilot: steer through the gate equal to three quarters" },
  yourMove: undefined, readout: undefined,
};

const DIVERSION_BASE: LessonData = {
  teacher: ARJUN, subject: "science", classLevel: 7, topic: "Life processes in plants", phase: "learn",
  floor: "her_turn",
  lines: [
    { who: "her", text: "Chlorophyll is picky: it grabs some colours and ignores one.", old: true },
    { who: "me", text: "btw did you see the new BGMI update? the map is insane" },
    { who: "her", text: "That's a whole different map. Parking it: leaf first, then it's yours for two minutes at the end." },
  ],
  steer: [
    { label: "Later list", icon: "pin", intent: "later_list" },
    { label: "Show again", icon: "replay", intent: "replay" },
    { label: "Another way", icon: "shuffle", intent: "explain_differently" },
    { label: "I have a question", icon: "question", intent: "question" },
  ],
  later: [{ id: "p1", text: "the new BGMI update", when: "At wrap-up · 2 min" }],
  artifact: { kind: "animation", key: "leaf-light", label: "Animation: white light hits a leaf; red and blue are absorbed, green bounces back" },
};

export const DIVERSION: Record<"park" | "brief" | "decline" | "stop", LessonData> = {
  park: { ...DIVERSION_BASE, moment: { kind: "park", quote: "“the new BGMI update”", note: "She'll bring it back at wrap-up." } },
  brief: {
    ...DIVERSION_BASE, later: [],
    lines: [DIVERSION_BASE.lines[0], { who: "me", text: "no but seriously, why do plants in my room grow towards the window?" },
      { who: "her", text: "That one's actually ours: plants chase light. Quick version now, full version on Thursday." }],
    moment: { kind: "brief", quote: "“why plants grow towards the window”", note: "Short answer now, then back to the leaf." },
  },
  decline: {
    ...DIVERSION_BASE, later: [],
    lines: [DIVERSION_BASE.lines[0], { who: "me", text: "tell me a scary story about a ghost instead" },
      { who: "her", text: "Not my department. But here's something stranger: this leaf is eating light right now." }],
    moment: { kind: "decline", quote: "“a ghost story”", note: "Declined kindly · lesson continues." },
  },
  stop: {
    ...DIVERSION_BASE, floor: "handover",
    lines: [DIVERSION_BASE.lines[0], { who: "me", text: "can we just end the lesson? I'm so tired" },
      { who: "her", text: "Fair, long day. A three-minute break, or we wrap up in two and I save exactly where we are." }],
    moment: { kind: "stop", quote: "“end the lesson”", note: "Saved at: green bounces back." },
  },
};

export const END: EndData = {
  teacher: ARJUN, subject: "maths", classLevel: 6, topic: "Perimeter and area", minutes: 17,
  canDo: { before: "You can now ", em: "prove", after: " why a triangle is half its rectangle." },
  facts: [{ value: "3", label: "things shown" }, { value: "2/2", label: "new problems" }, { value: "0", label: "hints used" }],
  quote: { at: "4:12", text: "The outside bits fold in, so it's always half." },
  evidence: [
    { verdict: "got", title: "Explained the half without help", detail: "Asked “why?” after a right answer, and you had the reason", at: "4:12" },
    { verdict: "got", title: "Predicted the area wouldn't change", detail: "Before sliding the top point, not after", at: "6:40" },
    { verdict: "got", title: "Two new triangles, first try", detail: "Different numbers, different shapes", at: "11:05" },
    { verdict: "look", title: "Leaning triangles: worth another look", detail: "When the height falls outside the shape. Saturday.", at: "14:30" },
  ],
  parked: { id: "p1", text: "the new BGMI update", when: "She promised two minutes. Your call." },
  made: [
    { id: "m3", title: "Half a rectangle", kind: "board", when: "Today", thumb: "triangle" },
    { id: "m4", title: "Break-it explorable", kind: "explorable", when: "Today", thumb: "explorable" },
  ],
  next: { when: "Saturday 11:00", title: "Leaning triangles: when the height goes outside" },
};

const ch = (n: number, title: string, skills: Array<[string, "secure" | "working" | "met" | "ahead", boolean?]>, current = false) => ({
  n, title, current,
  skills: skills.map(([label, state, due]) => ({
    label, state, due,
    evidence: state === "secure" ? "Right on first try, then right again on a surprise check 3+ days later."
      : state === "working" ? "Some right, one mix-up she's watching for."
        : state === "met" ? "Seen in a lesson; no evidence yet either way." : "Not taught yet. She'll get there in order.",
  })),
});

export const PROGRESS: ProgressData = {
  subjects: ["maths", "science", "english", "social"],
  subject: "maths",
  book: "Class 6 Maths · Ganita Prakash",
  chapters: [
    ch(1, "Patterns in Mathematics", [["Number sequences", "secure"], ["Visualising sequences", "secure"], ["Relations among sequences", "secure"], ["Patterns in shapes", "secure"]]),
    ch(2, "Lines and Angles", [["Point, segment, line, ray", "secure"], ["Comparing angles", "secure"], ["Measuring angles", "secure", true], ["Types of angles", "working"]]),
    ch(3, "Number Play", [["Numbers that tell us things", "secure"], ["Digits and palindromes", "secure"], ["Collatz patterns", "working"], ["Estimation", "met"]]),
    ch(4, "Data Handling and Presentation", [["Organising data", "secure"], ["Pictographs", "met"], ["Bar graphs", "ahead"]]),
    ch(5, "Prime Time", [["Common factors and multiples", "working"], ["Prime and composite", "met"], ["Co-prime numbers", "ahead"], ["Prime factorisation", "ahead"], ["Divisibility tests", "ahead"]]),
    ch(6, "Perimeter and Area", [["Perimeter", "secure"], ["Area of rectangles", "secure"], ["Area of a triangle", "working"]], true),
    ch(7, "Fractions", [["Equal shares", "secure", true], ["Number line and mixed", "working"], ["Equivalent fractions", "working"], ["Comparing fractions", "met"], ["Adding and subtracting", "ahead"]]),
    ch(8, "Playing with Constructions", [["Circles with a compass", "ahead"], ["Squares and rectangles", "ahead"], ["Diagonals", "ahead"]]),
    ch(9, "Symmetry", [["Line symmetry", "ahead"], ["Rotational symmetry", "ahead"]]),
    ch(10, "The Other Side of Zero", [["Integers in everyday life", "ahead"], ["Integers on the number line", "ahead"], ["Adding and subtracting integers", "ahead"]]),
  ],
  cracked: { title: "Equivalent fractions at speed", detail: "18 clean gates in Fraction Pilot, then explained 9/12 = 3/4 out loud." },
  counts: [{ value: 23, label: "questions you asked" }, { value: 3, label: "parked, coming up" }, { value: 14, label: "lessons this month" }, { value: 9, label: "things made for you" }],
  thenNow: { then: { at: "Aug 28", text: "Needed three hints to find the area of a rectangle." }, now: { at: "Oct 4", text: "Proved why a triangle's area is half, in your own words." } },
};

export const PARENT: ParentData = {
  childName: "Aarav", pronoun: "he", classLine: "Class 6 · CBSE", teacher: ARJUN,
  weekOf: "Week of 28 Sep – 4 Oct",
  headline: {
    en: { before: "Aarav can now ", em: "explain why", after: " a triangle's area is half its rectangle." },
    hi: { before: "आरव अब ", em: "समझा सकता है", after: " कि त्रिभुज का क्षेत्रफल आयत का आधा क्यों होता है।" },
  },
  facts: [{ value: "4 of 4", label: "lessons done" }, { value: "76 min", label: "inside your limits" }, { value: "11", label: "questions he asked" }],
  claims: [
    { verdict: "got", title: "Area of a triangle: secure", detail: "Right again on Saturday, two days later, without a hint.",
      evidence: [{ at: "Thu 1 Oct", text: "Explained the half on his own, after being asked “why?”" }, { at: "Sat 3 Oct", text: "2 of 2 new triangles, on his own, first try" }],
      words: "The outside bits fold in, so it's always half." },
    { verdict: "look", title: "Still practising: leaning triangles", detail: "When the height falls outside the shape. Planned for Saturday.",
      evidence: [{ at: "Sat 3 Oct", text: "Measured the slanted side instead of the height, once with a hint" }],
      note: "This is normal at this stage. Arjun brings it back in a new form; nothing for you to do." },
  ],
  homeTask: { title: "Ask him to prove it with a sheet of paper.", body: "Fold a rectangle corner-to-top and ask: “Why does the triangle get exactly half?” If he explains with the folds, he owns it. You don't need to know the answer." },
  made: [
    { id: "m1", title: "Fraction Pilot · a game", kind: "game", when: "Tue", thumb: "fractions", why: "Because he said 6/8 and 3/4 “feel the same” but couldn't say why. 18 clean gates, then he explained it." },
    { id: "m2", title: "Why leaves look green · an animation", kind: "animation", when: "Mon", thumb: "leaf", why: "He asked mid-lesson; it was made for his next science lesson." },
    { id: "m3", title: "Half a rectangle · whiteboard", kind: "board", when: "Thu", thumb: "triangle", why: "Drawn live while Arjun explained. Replayable from his library." },
  ],
  today: "2026-10-04",
  nowMin: 19 * 60 + 15,
  lessons: [
    { id: "a", date: "2026-10-05", start: 17 * 60 + 30, length: 20, subject: "Maths", topic: "Leaning triangles" },
    { id: "b", date: "2026-10-07", start: 17 * 60 + 30, length: 20, subject: "Science", topic: "Why leaves look green" },
    { id: "c", date: "2026-10-10", start: 11 * 60, length: 30, subject: "Maths", topic: "Fractions on a line" },
  ],
  limits: { dailyMin: 45, hoursStart: 7 * 60, hoursEnd: 21 * 60, openMic: true, reminder: false },
  curious: [
    { text: "Is 0.999… really equal to 1?", when: "Parked · decimals" },
    { text: "Why do some leaves have parallel veins?", when: "Saturday" },
    { text: "How do rockets steer with nothing to push on?", when: "Parked · science" },
  ],
};
