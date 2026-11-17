// dc-r8-director20 R1 (main: 3 of 7 of her model-written replies after an aside were odd, flat or wrong): what she says around a child's
// aside is authored, by Learning, in data/lesson-aside-replies.json (validated by scripts/lesson-scripts/check.mjs asideReplyErrors).
// Brain selects: the aside's kind from its words (a kind's match list, else "other"), a return question of that kind with {aside} in
// her voice, and after the child's answer one reply form with one {word} of theirs (the word picker, brain/say.js j2WordsOf) — a plain
// form when no word of theirs fits, the sad set when the aside or the answer is sad. The data's four rules are applied here. Pure.
import { readFileSync } from "node:fs";

const DATA = JSON.parse(readFileSync(new URL("../../data/lesson-aside-replies.json", import.meta.url), "utf8"));
const KINDS = DATA.kinds ?? {};

const esc = (w) => String(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
/** A whole word or phrase of a list in a text (never inside another word: "ro" is not in "Roblox"). */
const hasWord = (text, words) => (words ?? []).some((w) => new RegExp(`(?<![\\p{L}])${esc(w)}(?![\\p{L}])`, "iu").test(String(text ?? "")));
const formOf = (f, lang) => String((lang === "english" ? f?.en : f?.hi) ?? f?.hi ?? f?.en ?? "").trim();
const pickN = (xs, n = 0) => (xs?.length ? xs[((n % xs.length) + xs.length) % xs.length] : null);

/** The kind of an aside (sport, show, food, people, game, other): the first kind one of whose match words is in it; else "other". */
export function asideKindOf(text) {
  for (const [kind, k] of Object.entries(KINDS)) if (kind !== "other" && hasWord(text, k.match)) return kind;
  return "other";
}

// (sad.rule: not sad when "nahi" negates it — "chot nahi lagi" — or when the loss is the other side's — "dusri team haar gayi")
const NEGATED = (w) => new RegExp(`(?<![\\p{L}])${esc(w)}\\s+(?:\\p{L}+\\s+)?(?:nahi|nahin|na)(?![\\p{L}])|(?<![\\p{L}])(?:nahi|nahin)\\s+${esc(w)}(?![\\p{L}])`, "iu");
const OTHER_SIDE = /(?<![\p{L}])(?:dusri|doosri|saamne\s+wali|other)\s+team(?![\p{L}])/iu;
/** Whether an aside or a reply is sad (Learning's sad list, whole words, by its rule). */
export function isSadAside(text) {
  const t = String(text ?? "");
  const hits = (DATA.sad?.match ?? []).filter((w) => hasWord(t, [w]));
  if (!hits.length) return false;
  if (OTHER_SIDE.test(t) && hits.every((w) => /^(?:haar|haar gaya|haar gayi|lost)$/i.test(w))) return false;
  return hits.some((w) => !NEGATED(w).test(t));
}

// (rule 2: {aside} in her voice and agreeing — "mera bhai" → "tumhara bhai"; before mein / ke saath / ki / ka the oblique form)
const VOICE = [[/(?<![\p{L}])mera(?![\p{L}])/giu, "tumhara"], [/(?<![\p{L}])meri(?![\p{L}])/giu, "tumhari"], [/(?<![\p{L}])mere(?![\p{L}])/giu, "tumhare"],
  [/(?<![\p{L}])my(?![\p{L}])/giu, "your"], [/(?<![\p{L}])main(?![\p{L}])/giu, "tum"], [/(?<![\p{L}])mujhe(?![\p{L}])/giu, "tumhe"]];
const OBLIQUE = /^\s*(?:mein|me|ke\s+saath|ki|ka|ke|se|par)(?![\p{L}])/iu;
/** The aside's words in her voice; `after` is what follows the slot in the form (an oblique postposition turns "tumhara" into "tumhare"). */
export function asideInHerVoice(topic, after = "") {
  let t = String(topic ?? "").replace(/\s+/g, " ").trim();
  for (const [re, to] of VOICE) t = t.replace(re, (m) => (/^[A-Z]/.test(m) ? to[0].toUpperCase() + to.slice(1) : to));
  if (OBLIQUE.test(after)) t = t.replace(/(?<![\p{L}])tumhara(?![\p{L}])/giu, "tumhare").replace(/(?<![\p{L}])(khana|kutta|ladka|beta|gaana|khilona|cycle\s+wala)$/iu, (m) => `${m.slice(0, -1)}e`);
  return t;
}
const fill = (form, slots) => form.replace(/\{(\w+)\}([^{]*)/g, (m, k, rest) => (k === "aside" ? asideInHerVoice(slots.aside, rest) : String(slots[k] ?? `{${k}}`)) + rest);
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/** Her return question on a parked aside: one of its kind's returns, the n-th in rotation; null for a sad aside (rule 3: no question
 *  that assumes liking or fun). */
export function asideReturnLine(topic, { said = null, lang = "hinglish", n = 0 } = {}) {
  if (!String(topic ?? "").trim()) return null;
  if (isSadAside(said) || isSadAside(topic)) return null;
  const k = KINDS[asideKindOf(`${topic} ${said ?? ""}`)] ?? KINDS.other;
  const f = pickN(k?.returns, n);
  return f ? cap(fill(formOf(f, lang), { aside: topic })) : null;
}

/** Her sad reply (rule 3), the n-th in rotation. */
export function asideSadLine({ lang = "hinglish", n = 0 } = {}) {
  const f = pickN(DATA.sad?.replies, n);
  return f ? formOf(f, lang) : null;
}

// (rule 1: {word} is only a noun the child said — never haan, nahi, pata nahi, kuch nahi, sab, a time word or an outcome)
const NOT_A_WORD = /^(?:haan|han|ha|nahi|nahin|na|pata|kuch|sab|sabse|kal|aaj|parso|abhi|kabhi|roz|jeet|jeeta|jeeti|jeet\s+gaya|haar|hara|haari|gaya|gayi|yes|no|nothing|everything|today|yesterday|won|lost)$/i;
/** A {word} for the reply from the picker's candidates, or null (then a plain form). */
export function replyWordOf(cands = [], said = "") {
  const w = (cands ?? []).map((x) => String(x ?? "").trim()).find((x) => x && !NOT_A_WORD.test(x) && new RegExp(`(?<![\\p{L}])${esc(x)}(?![\\p{L}])`, "iu").test(String(said ?? "")));
  return w ?? null;
}

const ASKS_HER = /(?:aapko|aap|tumhe|tum)\b.*\b(?:pasand|favourite|favorite|kaun)|do you like|your favou?rite|what about you|aur aap/i;
// (director21 R3, Learning's phraseReplies: {phrase} is the child's own answer to her return question, up to three words, said back as
// something about the child — first person turned to second, a postposition at its end dropped; never a bare yes/no, a don't-know,
// "sab", or a question back to her)
const FILLER_HEAD = /^(?:(?:hmm+|umm*|achha|acha|accha|haan|han|ha|toh|to|woh|wo|vo|mujhe|mere\s+ko|mujhko|sabse\s+(?:achha|accha|acha|zyada)|mera\s+favou?rite|favou?rite)\s+)+/iu;
const FILLER_TAIL = /(?:\s+(?:lagta|lagti|lage|laga|lagi|hai|hain|tha|thi|the|pasand|hota|hoti|wala|wali|wale|sabse|achha|achhi|achhe|accha|acha|zyada|bahut))+$/iu;
const POSTPOSITION = /\s+(?:ke\s+saath|ke\s+sath|ke\s+baare\s+mein|mein|me|se|par|pe|ko|ka|ki|ke|tak)$/iu;
const PERSON = [[/(?<![\p{L}])mera(?![\p{L}])/giu, "tumhara"], [/(?<![\p{L}])meri(?![\p{L}])/giu, "tumhari"], [/(?<![\p{L}])mere(?![\p{L}])/giu, "tumhare"],
  [/(?<![\p{L}])(?:humara|hamara)(?![\p{L}])/giu, "tumhara"], [/(?<![\p{L}])(?:humari|hamari)(?![\p{L}])/giu, "tumhari"], [/(?<![\p{L}])(?:humare|hamare)(?![\p{L}])/giu, "tumhare"],
  [/(?<![\p{L}])maine(?![\p{L}])/giu, "tumne"], [/(?<![\p{L}])(?:my)(?![\p{L}])/giu, "your"], [/(?<![\p{L}])(?:our)(?![\p{L}])/giu, "your"]];
const NEVER_PHRASE = /^(?:haan|han|ha|nahi|nahin|na|pata\s+nahi|kuch\s+nahi|kuch\s+bhi\s+nahi|sab|sab\s+kuch|yes|no|nothing|everything|i\s+don'?t\s+know|ok|okay|theek|thik)$/iu;
/** The child's answer as a {phrase} (≤ 3 words, in her voice), or null. */
export function phraseOf(said = "") {
  const raw = String(said ?? "");
  if (/\?/.test(raw) || ASKS_HER.test(raw)) return null;
  // (her words keep their case — a name stays a name — save a capital the transcript put on the first word)
  let t = raw.replace(/[^\p{L}\p{N}' ]+/gu, " ").replace(/\s+/g, " ").trim().replace(/^(\p{Lu})(\p{Ll}*)(?=\s|$)/u, (m, a, b) => (FILLER_HEAD.test(`${m} `) || PERSON.some(([re]) => { re.lastIndex = 0; return re.test(m); }) ? (a + b).toLowerCase() : m));
  for (let i = 0; i < 3; i++) t = t.replace(FILLER_HEAD, "").replace(FILLER_TAIL, "").replace(POSTPOSITION, "").trim();
  for (const [re, to] of PERSON) t = t.replace(re, to);
  if (!t || NEVER_PHRASE.test(t)) return null;
  const w = t.split(" ");
  if (w.length > 3 || w.every((x) => NOT_A_WORD.test(x))) return null;
  return t;
}
/** Which of the kind's return questions her line asked (its index), or -1. */
function returnIndexOf(k, topic, asked, lang) {
  const norm = (x) => String(x ?? "").toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();
  const a = norm(asked);
  if (!a) return -1;
  return (k?.returns ?? []).findIndex((f) => { const q = norm(fill(formOf(f, lang), { aside: topic })); return q && a.includes(q); });
}

/** Her reply to the child's answer about their aside: { line, form: "phrase" | "word" | "plain" | "sad" }. The sad set when the aside or the
 *  answer is sad; a plain form when they ask her back (rule 4) or no word of theirs fits; else a form with their word. */
export function asideReplyLine({ said = "", topic = "", lang = "hinglish", n = 0, words = [], asked = "" } = {}) {
  if (isSadAside(said) || isSadAside(topic)) return { line: asideSadLine({ lang, n }), form: "sad" };
  const k = KINDS[asideKindOf(`${topic} ${said}`)] ?? KINDS.other;
  // (phraseReplies[i] answers returns[i]: the return her line asked, the child's own phrase back)
  let i = k?.phraseReplies?.length ? returnIndexOf(k, topic, asked, lang) : -1;
  // (dc-r8-director22 A: her question after the "Main AI teacher hoon" line is no return of the kind — its reply is the phrase form of the
  // same shape: a favourite asked gets the favourite form, a liking asked the "achha lagta" form)
  let kp = k;
  if (i < 0) {
    const q = String(asked ?? "").split(/(?<=[.!?।])\s+/).at(-1) ?? "";
    // (dc-r8-director26 A4: since director25 the return is the script's own form — "usmein sabse mazedaar kya hai?", "uske baare mein thoda aur
    // batao na?" — which is no kind's return: a "best" question is a liking one, and a question of no shape reads its shape from the child's
    // answer ("batting sabse achhi lagti hai"). c6 stuck 54, c4 offtopic 12: "Oh, chauka. Achha." where "Achha, toh tumhe chauka sabse achha
    // lagta hai." was meant)
    const LIKING_Q = /achha\s+(?:kya\s+)?lagta|like\s+(?:most|about|best)|pasand|sabse\s+(?:achh|mazedaar|mazedar|badhiya|maza)|achhi\s+baat|best\s+(?:part|thing)|most\s+fun/i;
    const LIKING_A = /achh[aie]\s+lag|pasand|mazedaar|maza\s+aata|(?<![\p{L}])like/iu;
    // (and something that happened — "sixer maara" — gets the kind's "last time" form)
    const PAST_A = /(?:aara|ela|kiya|dekha|gaya|gayi|liya|khaya|jeeta|haara)(?![\p{L}])/iu;
    const want = /favou?rite|kaun\s+pasand/i.test(q) ? /favou?rite/ : LIKING_Q.test(q) ? /achha\s+lagta|like/
      : /favou?rite/i.test(String(said)) ? /favou?rite/ : LIKING_A.test(String(said)) ? /achha\s+lagta|like/ : PAST_A.test(String(said)) ? /pichhli\s+baar|last\s+time|aisa\s+hua/ : null;
    // (dc-r8-director23 A2, c4 offtopic 20: "Dhoni" to "Tumhara favourite kaun hai?" after a question about Virat — an aside of no kind —
    // got the plain line; the favourite and liking forms name nothing of a kind, so another kind's form of that shape is used)
    const pool = [k, ...Object.values(KINDS).filter((x) => x !== k)].filter((x) => x?.phraseReplies?.length);
    for (const x of want ? pool : []) { const j = x.phraseReplies.findIndex((f) => want.test(formOf(f, lang).toLowerCase())); if (j >= 0) { kp = x; i = j; break; } }
  }
  const phrase = i >= 0 && kp?.phraseReplies?.[i] ? phraseOf(said) : null;
  if (phrase) return { line: cap(fill(formOf(kp.phraseReplies[i], lang), { phrase })), form: "phrase" };
  const word = ASKS_HER.test(String(said)) ? null : replyWordOf(words, said);
  if (word) { const f = pickN(k?.replies, n); if (f) return { line: cap(fill(formOf(f, lang), { word })), form: "word" }; }
  const p = pickN(k?.plain, n);
  return { line: p ? formOf(p, lang) : null, form: "plain" };
}

/** Every return question form, both languages, slots as written ("{aside}"): authored text code's word passes leave alone. */
export function asideReturnForms() {
  return Object.values(KINDS).flatMap((k) => (k.returns ?? []).flatMap((f) => [f?.hi, f?.en])).filter((x) => typeof x === "string" && x.trim());
}

/** Every form a reply may take, for the dry predicate: { word: [RegExp with a (word) group], plain: [string], sad: [string] }. */
export function asideReplyForms() {
  const all = Object.values(KINDS);
  const re = (f) => new RegExp(`^${esc(f).replace(/\\\{word\\\}|\{word\}/g, "(.{1,40}?)")}$`, "iu");
  return {
    word: all.flatMap((k) => (k.replies ?? []).flatMap((f) => [f.hi, f.en])).filter(Boolean).map(re),
    // (a {phrase} form is checked as a {word} form: one slot of the child's own words)
    phrase: all.flatMap((k) => (k.phraseReplies ?? []).flatMap((f) => [f.hi, f.en])).filter(Boolean).map((f) => re(f.replace(/\{phrase\}/g, "{word}"))),
    plain: all.flatMap((k) => (k.plain ?? []).flatMap((f) => [f.hi, f.en])).filter(Boolean),
    sad: (DATA.sad?.replies ?? []).flatMap((f) => [f.hi, f.en]).filter(Boolean),
  };
}
