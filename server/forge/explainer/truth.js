// The explainer's truth check (W2-B): a template call's labels must be the kit's own words, and the call must expand,
// lay out and lint. Pure (no model import), so the Director's synchronous path (lesson.js) and the tests can use it.
import { expand, LABEL_MAX } from "./templates.js";

const STOP = new Set(("a an the of to in on at by for from with and or but is are was were be been it its this that these those as into onto " +
  "their his her our your my we you they he she them us not no than then so very more most less least each every one two three " +
  "ka ki ke hai hain aur ko se me mein par " +
  "है हैं का की के में से को और ने भी तो पर एक यह वह").split(" "));
/** The kit's own words, stemmed loosely (plural / -ing / -ed), as the truth vocabulary for labels. */
export function kitVocabulary(kit) {
  const parts = [];
  const add = (x) => { if (typeof x === "string") parts.push(x); };
  for (const e of kit?.expectations ?? []) add(e);
  for (const s of kit?.skills ?? []) add(s.title);
  for (const i of kit?.items ?? []) { add(i.prompt_en); add(String(i.answer ?? "")); for (const a of i.acceptable ?? []) add(String(a)); for (const h of i.hints ?? []) add(typeof h === "string" ? h : h?.en); }
  const we = kit?.workedExample;
  if (we) { add(we.problem); for (const s of we.steps ?? []) add(s); }
  for (const m of kit?.misconceptions ?? []) {
    add(m.belief); add(m.remediation?.representation); add(m.remediation?.moveShape);
    for (const o of m.diagnostic?.options ?? []) add(o.text);
    add(m.diagnostic?.prompt_en);
  }
  for (const c of kit?.interestContexts ?? []) add(typeof c === "string" ? c : c?.en ?? c?.context);
  const vocab = new Set();
  for (const w of parts.join(" ").toLowerCase().match(WORD_RE) ?? []) vocab.add(stem(w));
  return vocab;
}
export const stem = (w) => w.replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "").replace(/'s$/, "");
/** The words of a label that the kit never says (empty = the label is the kit's own words). */
export function unknownWords(label, vocab) {
  // numbers are checked too (a board number the kit never says is an invented fact); words of how-to-do-it (find, add,
  // check, count…) are the board's own and carry no claim
  return (String(label).toLowerCase().match(WORD_RE) ?? [])
    .filter((w) => !STOP.has(w) && !HOW.has(w) && (graphemes(w) > 2 || /^\d+$/.test(w) || DEVANAGARI.test(w)) && !vocab.has(stem(w)) && !vocab.has(w));
}
/**
 * A word: letters WITH their combining marks (W2-B fixer, blocker 2). Without \p{M} a Devanagari word splits at every
 * matra and virama into 1-2 letter pieces ("बिल्कुल" → "बिल", "क", "ल"), the length filter then dropped them all, and the
 * Hindi truth check passed anything.
 */
export const WORD_RE = /[\p{L}\p{M}\p{N}]+/gu;
const DEVANAGARI = /[\u0900-\u097F]/;
/** User-perceived characters (a Devanagari consonant + its matra is one). */
const graphemes = (w) => (typeof Intl !== "undefined" && Intl.Segmenter ? [...new Intl.Segmenter("hi", { granularity: "grapheme" }).segment(w)].length : [...w].length);
/**
 * A label a child may see is written in Latin or Devanagari only (plus digits, spaces and plain punctuation), and is
 * never a cloze stub ("They found and freed G__"). Returns the problem, or null.
 */
export function labelScriptProblem(label) {
  const s = String(label ?? "");
  if (/_/.test(s)) return "label_blank";
  // Latin (basic + Latin-1 letters + combining marks used with them), Devanagari, digits, spaces, plain punctuation
  const joiners = /[\u0900-\u097F]/.test(s) ? "\u200C\u200D" : "";   // ZWJ / ZWNJ belong to Devanagari spelling only
  if (new RegExp(`[^\\p{Script=Latin}\\p{Script=Devanagari}\\p{N}\\p{M}\\s.,'’!?()\\-–−/&%+×÷=°${joiners}]`, "u").test(s)) return "label_script";
  return null;
}
/** Procedural words a board may use whatever the kit's wording (verbs of doing the work, never facts). */
const HOW = new Set(("find add check count read write draw make get use put take turn split join mark list choose compare match sort " +
  "start end first next then last step steps answer total remaining left result calculate estimate round multiply divide subtract " +
  "look see ask say meet test tests example examples kind kinds type types part parts rule rules sum difference product").split(" "));

/**
 * A label shaped like a clause someone would say (W2-B fixer, minor: "Gauri did not come home", "चोर डरकर माफी मांगते
 * हैं"): the recitation law says the board carries nouns and short terms, never narration. Flags a Hindi sentence-final
 * auxiliary, an English subject + finite verb, a negated verb, or four or more words.
 */
export function sentenceShaped(label) {
  const s = String(label ?? "").trim();
  // words with letters only: "12 = 2 × 2 × 3" and "35 °C to 42 °C" are number work, not narration
  const words = s.split(/\s+/).filter((w) => /\p{L}/u.test(w));
  if (words.length >= 5) return true;
  // Hindi: a finite clause (sentence-final auxiliary or past form, or the ergative ने that only a clause carries)
  if (/(?:^|\s)(?:है|हैं|था|थी|थे|हुआ|हुई|हुए|गया|गई|गए|दिया|लिया|समझा|सोचा|कहा)[।.!]?$/u.test(s) || /\sने\s/u.test(s)) return true;
  // English: negation, a pronoun subject, or narration in the past ("Gauri came home", "They found the key")
  if (/\b(?:did|does|do|is|are|was|were|has|have|had|will|can|could)\s+not\b|\b(?:didn't|doesn't|don't|isn't|wasn't|won't|can't)\b/i.test(s)) return true;
  if (words.length >= 2 && /^(?:he|she|they|we|i|you)$/i.test(words[0])) return true;
  if (words.length >= 3 && words.slice(1).some((w) => PAST.has(w.toLowerCase()))) return true;
  return false;
}
const PAST = new Set(("came went ran saw found took gave told said fell got thought felt left met became began brought bought caught ate drank knew " +
  "flew sat stood heard kept lost won wrote sang swam threw woke wanted decided asked tried walked jumped looked laughed cried shouted " +
  "returned reached started stopped helped freed").split(" "));

/** Every label a call writes on the board. */
export function labelsOf(call) {
  switch (call.template) {
    case "flow@1": return call.steps ?? [];
    case "cycle@1": return [...(call.stages ?? []), ...(call.centre ? [call.centre] : [])];
    case "compare@1": return [call.left?.title, ...(call.left?.items ?? []), call.right?.title, ...(call.right?.items ?? [])].filter(Boolean);
    case "parts@1": return [call.whole, ...(call.parts ?? [])];
    case "label@1": return (call.labels ?? []).map((l) => l.text);
    default: return [];
  }
}

/**
 * Check a call against the kit and the templates: the labels are the kit's words, and it expands, lays out and lints.
 * @returns {{ ok: boolean, why?: string, script?: any }}
 */
export function checkCall(call, kit, { band = "B3", vocab = kitVocabulary(kit) } = {}) {
  if (!call) return { ok: false, why: "no_call" };
  for (const l of labelsOf(call)) {
    if (/[→←;[\]{}]|->|:\s*$|[\u0000-\u001f]/.test(String(l))) return { ok: false, why: "label_punctuation" };
    // a label cut off mid-phrase to fit ("Less mustard oil and") is not a label
    if (/\b(and|of|the|to|with|for|a|an|need|needs|from|by|at|into|than)$/.test(String(l).trim())) return { ok: false, why: "label_truncated" };
    if ([...String(l)].length > LABEL_MAX) return { ok: false, why: `label_too_long:${String(l).slice(0, 30)}` };
    const sp = labelScriptProblem(l);
    if (sp) return { ok: false, why: `${sp}:${String(l).slice(0, 30)}` };
    if (sentenceShaped(l)) return { ok: false, why: `label_sentence:${String(l).slice(0, 30)}` };
    const unk = unknownWords(l, vocab);
    if (unk.length) return { ok: false, why: `not_in_kit:${unk.slice(0, 3).join(",")}` };
  }
  const x = expand(call, { band });
  return x.ok ? { ok: true, script: x.script } : { ok: false, why: `layout:${x.errors.join(",")}` };
}

