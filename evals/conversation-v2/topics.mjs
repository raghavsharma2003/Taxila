// Topics the conversation-v2 battery runs on (all have verified kits in data/kits). Short keys keep cases.mjs readable.
// Classes 4-7 only (OWNER-RESET R1/R2). Titles are what the curriculum calls them, used by the judge for context.
export const TOPICS = {
  T4F: { id: "c4-maths-ch05-t01", cls: 4, title: "Fractions as equal shares" },
  T4OE: { id: "c4-maths-ch03-t01", cls: 4, title: "Odd and even numbers" },
  T4C: { id: "c4-evs-ch01-t01", cls: 4, title: "Living as a community" },
  T5NL: { id: "c5-maths-ch02-t01", cls: 5, title: "Fractions on the number line" },
  T5N: { id: "c5-maths-ch01-t01", cls: 5, title: "Numbers in thousands and beyond" },
  T5W: { id: "c5-evs-ch01-t01", cls: 5, title: "Water in different forms and places" },
  T5M: { id: "c5-evs-ch03-t01", cls: 5, title: "Why food spoils: microbes" },
  T6F: { id: "c6-maths-ch07-t01", cls: 6, title: "Fractional units and equal shares" },
  T6L: { id: "c6-maths-ch02-t01", cls: 6, title: "Point, line segment, line and ray" },
  T6S: { id: "c6-science-ch01-t01", cls: 6, title: "How scientists find out" },
  T6P: { id: "c6-science-ch02-t01", cls: 6, title: "Grouping plants: herbs, shrubs, trees" },
  T6MG: { id: "c6-science-ch04-t01", cls: 6, title: "Magnetic and non-magnetic materials" },
  T7MF: { id: "c7-maths-ch08-t01", cls: 7, title: "Multiplying fractions" },
  T7E: { id: "c7-maths-ch02-t01", cls: 7, title: "Writing arithmetic expressions" },
  T7I: { id: "c7-science-ch02-t01", cls: 7, title: "Natural indicators" },
  T7C: { id: "c7-science-ch05-t01", cls: 7, title: "Physical and chemical changes" },
};

/**
 * Lesson slots: one fresh child per slot (a lesson the child ended closes the day: F7), so no slot depends on another.
 * lang = the child's languagePref; lane = text (typed) or voice (the cascade lane: typed:false + an ASR confidence).
 * Three slots per topic, mixing language and lane; the scheduler adds overflow slots if cases do not fit.
 */
export const SLOTS = Object.entries(TOPICS).flatMap(([k], i) => [
  { topic: k, lang: "hinglish", lane: i % 2 ? "voice" : "text" },
  { topic: k, lang: "english", lane: i % 2 ? "text" : "voice" },
  { topic: k, lang: i % 3 === 0 ? "hindi" : "hinglish", lane: i % 2 ? "text" : "voice" },
]);
