// Sentence splitting for TTS pipelining: the first sentence goes to the speech model at once, the rest
// follow while it plays. Pure (no I/O), shared by the stream route and its tests.

/** Pieces shorter than this ride with the next one: "Achha!" alone is a choppy clip and a wasted request. */
export const MIN_CHARS = 18;
/** A single "sentence" longer than this is split at a clause boundary so the first audio is not held up. */
export const MAX_CHARS = 220;

// Sentence end: . ! ? । ॥ … (one or more), optionally followed by a closing quote/bracket, then space or end.
// A dot between digits (3.5) or after a single capital letter initial is not an end.
const END = /([.!?।॥…]+["'”’)\]]*)(\s+|$)/g;
const ABBREV = new Set(["rs", "dr", "mr", "mrs", "ms", "no", "st", "vs", "etc", "e.g", "i.e"]);

/** Split teacher text into speakable chunks, in order; joining them with spaces gives the text back. */
export function splitSentences(text) {
  const t = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!t) return [];
  const raw = [];
  let last = 0;
  for (const m of t.matchAll(END)) {
    const end = m.index + m[1].length;
    // END needs a space or the end after the mark, so "3.5" never matches; an abbreviation or an initial
    // before a lone dot ("Rs. 5", "Dr. Rao", "A. P. J.") is not a sentence end either.
    const word = t.slice(last, m.index).split(" ").pop() ?? "";
    if (m[1] === "." && m[2] && (ABBREV.has(word.toLowerCase()) || /^[A-Z]$/.test(word))) continue;
    raw.push(t.slice(last, end).trim());
    last = end + m[2].length;
  }
  if (last < t.length) raw.push(t.slice(last).trim());
  const out = [];
  for (const piece of raw.flatMap(splitLong)) {
    if (!piece) continue;
    if (out.length && out[out.length - 1].length < MIN_CHARS) out[out.length - 1] += " " + piece;
    else out.push(piece);
  }
  // A short tail is merged back too.
  if (out.length > 1 && out[out.length - 1].length < MIN_CHARS) out[out.length - 2] += " " + out.pop();
  return out;
}

function splitLong(s) {
  if (s.length <= MAX_CHARS) return [s];
  const out = [];
  let rest = s;
  while (rest.length > MAX_CHARS) {
    // Last clause boundary (comma, semicolon, colon, dash) before MAX_CHARS, else the last space.
    const window = rest.slice(0, MAX_CHARS);
    let cut = Math.max(window.lastIndexOf(", "), window.lastIndexOf("; "), window.lastIndexOf(": "), window.lastIndexOf(" - "));
    if (cut < MAX_CHARS / 3) cut = window.lastIndexOf(" ");
    if (cut <= 0) cut = MAX_CHARS;
    out.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) out.push(rest);
  return out;
}
