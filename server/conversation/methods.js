// round 7 A8 (PIPELINE §A Brain item 7, brain-steering-persistence): a code-first lexicon of HOW the child asked to be
// taught. A method read here is kept for the rest of the lesson (s.methods), rendered in the LAST section of every later
// compile (never shed), and mapped to move knobs. PURE, deterministic. Like conversation/lexicon.js, a reading is
// request-shaped only: the whole turn is the request (no digits, at most 12 words), so lesson content that happens to hold
// the words is never read as one.
//
//   steps        "step by step", "ek ek karke", "ek ek step"                → one small step a turn
//   short        "chhota bolo", "short mein", "kam bolo", "less talking"     → word cap: short turns
//   picture      "pehle picture", "picture se samjhao", "draw karke batao"   → show first (board / picture), then talk
//   try_first    "khud try karne do", "let me try", "main khud karunga"      → attempt first: the question before the help
//   slow         "dheere bolo", "slowly please", "aaram se samjhao"          → slower: one idea a turn, small words
//
// The rendered text is code's own (never the child's words), so nothing here needs the parked-topic screen.

/** method id → the note her instructions carry (short: it rides in the last section on every turn). */
export const METHOD_NOTE = Object.freeze({
  steps: "step by step: one small step a turn",
  short: "short turns: one or two short sentences",
  picture: "picture first: show it, then talk",
  try_first: "let them try first; help only after their try",
  slow: "slowly: one idea a turn, small words",
});

/** The word cap a method sets on her turn (the `short` knob). */
export const SHORT_TURN_WORDS = 15;

const METHOD_RE = [
  ["steps", /\b(?:step\s*by\s*step|step\s*wise|ek\s+ek\s+(?:karke|step|kadam)|ek\s+ek\s+karke|ek\s+step\s+ek\s+baar)\b/i],
  ["short", /\b(?:chhota|chota|chhote|chote|short)\s+(?:bolo|boliye|batao|bataiye|mein|me|answer|answers|rakho)\b|\b(?:kam|thoda\s+kam)\s+(?:bolo|boliye)\b|\bless\s+talking\b|\bkeep\s+it\s+short\b|\btoo\s+long\b/i],
  ["picture", /\b(?:pehle|pahle|first)\s+(?:picture|photo|diagram|drawing|chitra?)\b|\b(?:picture|diagram|drawing|chitra?)\s+(?:se|bana\s*ke|banake|ke\s+saath)\s+(?:samjhao|samjhaiye|batao|bataiye)\b|\bdraw\s+(?:karke|kar\s+ke|it)\b|\bshow\s+me\s+first\b/i],
  ["try_first", /\b(?:mujhe|muje)?\s*(?:khud|pehle\s+main|main\s+khud)\s+(?:try|kar(?:ne|unga|ungi|ke))\b|\blet\s+me\s+try\b|\bi\s+want\s+to\s+try\b|\bmain\s+khud\s+kar(?:unga|ungi|lunga|lungi)\b|\btry\s+karne\s+do\b/i],
  ["slow", /\b(?:dheere|dhire|dheeray)(?:\s+(?:dheere|dhire))?\s+(?:bolo|boliye|samjhao|samjhaiye|batao|bataiye|please|plz)\b|^(?:please\s+)?(?:dheere|dhire)(?:\s+(?:dheere|dhire))?$|\b(?:speak|talk|go|explain)\s+(?:more\s+)?slow(?:ly|er)?\b|\bslow(?:ly)?\s+(?:please|plz|down)\b|\baaram\s+se\s+(?:samjhao|samjhaiye|batao|bolo)\b/i],
];

/** The method a child's whole turn asks for, or null. */
export function readMethod(text) {
  const t = String(text ?? "").toLowerCase().normalize("NFKC").replace(/\s+/g, " ").trim();
  if (!t || /\d/.test(t) || t.split(" ").length > 12) return null;
  for (const [id, re] of METHOD_RE) if (re.test(t)) return id;
  return null;
}

/** The kept list with `id` added (newest last, at most 3, no duplicates). PURE. */
export const keepMethod = (methods = [], id) => (id ? [...(methods ?? []).filter((m) => m !== id), id].slice(-3) : methods ?? []);

/** The last-section line for the kept methods, or null. */
export const methodsLine = (methods = []) => {
  const notes = (methods ?? []).map((m) => METHOD_NOTE[m]).filter(Boolean);
  return notes.length ? `how they asked you to teach (keep doing it): ${notes.join("; ")}` : null;
};
