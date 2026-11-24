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
// (dc-r8-director27 P6.3: a reply she has already said in this lesson — `avoid`, her said set's sentences — is not said again: c4 offtopic 20
// and 32 said "Achha, pichhli baar sixer maara." word for word to the same aside. The next form of that shape is said, else a word or plain
// form she has not said)
const avoidKey = (t) => String(t ?? "").toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
// (Brain 049 B6, a reply in the child's gender: "Achha, toh tumhe batting sabse achha lagta hai." after "batting achhi lagti hai" — a form's
// "achha lagta" takes the ending the child's own words gave the liking: achhi lagti (a feminine thing), achhe lagte (plural); dry c6-ch07
// stuck 52, steering 44)
const LIKE_ENDING = [[/(?<![\p{L}])(?:achhi|acchi|achi)\s+lagt[ia](?![\p{L}])/iu, "achhi lagti"], [/(?<![\p{L}])(?:achhe|acche|ache)\s+lagt[ea](?![\p{L}])/iu, "achhe lagte"]];
export function likeInChildsEnding(line, said) {
  const hit = LIKE_ENDING.find(([re]) => re.test(String(said ?? "")));
  return hit && line ? String(line).replace(/(?<![\p{L}])achha\s+lagta(?![\p{L}])/giu, hit[1]) : line;
}
export function asideReplyLine(args = {}) {
  const r = asideReplyLine2(args);
  // (to-brain 053 C2: the kind of thing said rides on the pick, for the record)
  const rk = r?.line && r.form !== "sad" && String(args.asked ?? "").trim() ? replyKindOf(args.asked, args.said) : null;
  return r?.line ? { ...r, line: likeInChildsEnding(r.line, args.said), ...(rk ? { kind: rk } : {}) } : r;
}
function asideReplyLine1(args = {}) {
  const avoid = new Set((args.avoid ?? []).map((x) => avoidKey(typeof x === "string" ? x : x?.k)).filter(Boolean));
  const fresh = (line) => !!line && !String(line).split(/(?<=[.!?\u0964])\s+/).map(avoidKey).filter(Boolean).every((k) => avoid.has(k));
  // (Learning 016: the kind's againReplies — "Haan, {phrase}, yeh tumne bataya tha." — for an aside or a reply said a second time; `again`:
  // the caller knows it is said again, so they come first)
  const againLine = () => {
    const k = KINDS[asideKindOf(`${args.topic ?? ""} ${args.said ?? ""}`)] ?? KINDS.other;
    // (the last clause that says something — "…, woh" names nothing)
    const phrase = String(args.said ?? "").split(/[,;]/).map((x) => phraseOf(x.trim())).filter((x) => x && /\p{L}{4,}/u.test(x)).at(-1) ?? phraseOf(args.said ?? "")
      // (no phrase of theirs: the word of theirs the word forms would say — "Haan, chauka, yeh tumne bataya tha.")
      ?? (ASKS_HER.test(String(args.said ?? "")) ? null : replyWordOf(args.words ?? [], args.said ?? ""));
    const forms = phrase ? (k?.againReplies ?? []) : [];
    for (let t = 0; t < forms.length; t++) { const f = pickN(forms, (args.n ?? 0) + t); if (f && args.avoidFrame && [f.hi, f.en].includes(args.avoidFrame)) continue; const line = f ? cap(fill(formOf(f, args.lang ?? "hinglish"), { phrase })) : null; if (line && fresh(line)) return { line, form: "again", phrase }; }
    return null;
  };
  if (args.again && !isSadAside(args.said) && !isSadAside(args.topic)) { const a = againLine(); if (a) return a; }
  if (!avoid.size) return asideReplyLine0(args);
  const first = asideReplyLine0(args);
  if (!first?.line || fresh(first.line) || first.form === "sad") return first;
  { const a = againLine(); if (a) return a; }
  for (let t = 1; t <= 12; t++) { const r = asideReplyLine0({ ...args, skip: t }); if (r?.line && fresh(r.line)) return r; }
  return first;
}
function asideReplyLine2(args = {}) {
  const last = lastFrameIn(args.recent ?? []);
  const r = asideReplyLine1(args);
  if (!last || !r?.line || r.form === "sad" || frameOfLine(r.line) !== last) return r;
  // (the same frame as her last aside reply: the next form of that shape in another frame, else the next form she has not said in it)
  const alt = asideReplyLine1({ ...args, avoidFrame: last });
  return alt?.line && frameOfLine(alt.line) !== last ? alt : r;
}
// (to-brain 052 B5: aside replies of one frame are rotated across a lesson — the frame her last aside reply was said in is not said again next:
// dry offtopic c4-ch05-t01 48 and 56 "Wah, batting! … achhi lagti hai." then "Wah, chauka! … achha lagta hai."; c5-t02 44, 50; c6 30, 40)
const normK = (t) => String(t ?? "").toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const FRAME_RES = [...Object.values(KINDS), DATA.replyKinds ?? {}].flatMap((k) => [...(k.phraseReplies ?? []), ...(k.againReplies ?? []), ...(k.replies ?? []), ...["person", "done", "liking", "whenWhere"].flatMap((x) => (Array.isArray(k[x]) ? k[x] : []))]).flatMap((f) => [f?.hi, f?.en])
  .filter((x) => typeof x === "string" && /\{(?:phrase|word)\}/.test(x))
  .map((f) => ({ f, re: new RegExp(`(?:^| )${normK(f.replace(/\{(?:phrase|word)\}/g, " SLOTX ")).split("slotx").map((x) => esc(x.trim())).join(" ?(?:.{1,40}?) ?").replace(/achha\\s\+lagta/g, "(?:achha|achhi|achhe)\\s+(?:lagta|lagti|lagte)")}(?: |$)`, "u") }));
/** The frame (the form as written, with its slot) a turn of hers says an aside reply in, or null. */
export const replyFrameOf = (text) => { const k = normK(text); return k ? FRAME_RES.find((x) => x.re.test(k))?.f ?? null : null; };
/** The frame of her last aside reply among her turns (their texts, oldest first), or null. */
const lastFrameIn = (texts) => { for (let j = (texts ?? []).length - 1; j >= 0; j--) { const f = replyFrameOf(texts[j]); if (f) return f; } return null; };
const frameOfLine = (line) => replyFrameOf(line);
/** The shape of a phrase form: what it asks of the slot (a "last time", a liking, a favourite), else its own text. */
const formShape = (f) => (/pichhli\s+baar|last\s+time|aisa\s+hua/i.test(f) ? "past" : /favou?rite/i.test(f) ? "fav" : /achha\s+lagta|like/i.test(f) ? "like" : f);
/** The child's phrase from the last clause that names something ("fielding karna, catch pakadna" → "catch pakadna"), or null. */
export const saidPhrase = (said) => String(said ?? "").split(/[,;]/).map((x) => phraseOf(x.trim())).filter((x) => x && /\p{L}{4,}/u.test(x)).at(-1) ?? null;
// (to-brain 053 C2, Learning 023 rule 7: a reply fits what the child said. The kind of thing said — `person` (who was there, a favourite),
// `done` (a thing done), `liking`, `whenWhere` (a time or place) — is read from the return question she asked, and from the child's words
// where the question does not settle it. director34 c5-t03 steady 48, steering 42: "Virat" to "tab tumhare saath kaun tha?" was told
// "Wah, Virat! Toh yeh tumhe achha lagta hai.")
export const REPLY_KINDS = Object.freeze(["person", "done", "liking", "whenWhere"]);
const Q_PERSON = /(?<![\p{L}])(?:kaun|kiske|kisko|kisne|kisse|who|whom)(?![\p{L}])/iu;
const Q_WHEN_WHERE = /(?<![\p{L}])(?:kab|kahan|kahaan|kidhar|when|where)(?![\p{L}])/iu;
const Q_DONE = /(?<![\p{L}])kya\s+(?:kiya|kari|kara|karte|karti|khela|khele|dekha|dekhe|khaya|khaye|banaya|hua)(?![\p{L}])|what\s+(?:did|happened|do\s+you\s+do)/iu;
// (d35 follow-up 5: "uski sabse achhi baat kya hai?" asks for a liking too)
const Q_LIKING = /achh[aie]\s+(?:kya\s+)?lag|achh[aie]\s+baat|like|pasand|mazedaa?r|maza|favou?rite|best|badhiya/iu;
// (the child's words: a person — the people kind's words, "ke saath", "with"; a time or a place; something done; a liking)
const PEOPLE_WORDS = KINDS.people?.match ?? [];
const A_PERSON = (t) => hasWord(t, PEOPLE_WORDS) || /(?<![\p{L}])(?:ke\s+saath|ke\s+sath|with)(?![\p{L}])/iu.test(t);
const A_WHEN_WHERE = /(?<![\p{L}])(?:kal|aaj|parso|parson|subah|shaam|sham|raat|dopahar|chhutti|chhuttiyon|sunday|saturday|monday|tuesday|wednesday|thursday|friday|ravivaar|itvaar|weekend|yesterday|today|tonight|morning|evening|ghar|school|park|ground|maidan|maidaan|stadium|gaon|gaanv|nani\s+ke\s+ghar|bazaar|market)(?![\p{L}])/iu;
const A_DONE = /(?:aara|ela|kiya|kiye|dekha|dekhi|gaya|gayi|gaye|liya|liye|khaya|khaye|jeeta|jeeti|haara|haari|banaya|banayi|khela|khele|maara|mara)(?![\p{L}])/iu;
const A_LIKING = /achh[aie]\s+lag|pasand|mazedaar|maza\s+aata|(?<![\p{L}])like/iu;
/** A bare name: one or two words, each with a capital, no verb — "Virat", "Rohit Sharma". */
const A_NAME = (t) => /^\p{Lu}\p{Ll}+(?:\s+\p{Lu}\p{Ll}+)?[.!]?$/u.test(String(t ?? "").trim());
/** The kind of thing the child's answer to her return question is: "person" | "done" | "liking" | "whenWhere" | null (nothing settles it).
 *  The question she asked decides first (its last sentence: who → person, when / where → whenWhere, what did you do → done, what do you
 *  like → liking); a child who names a person or a time where a liking was asked is answering with that, and the reply follows them.
 *  A question of no shape ("uske baare mein thoda aur batao na?") reads the kind from the child's words alone. */
export function replyKindOf(asked = "", said = "") {
  const q = String(asked ?? "").split(/(?<=[.!?\u0964])\s+/).filter((x) => /[?？]\s*$/.test(x)).at(-1) ?? "";
  const a = String(said ?? "");
  const byWords = () => (A_PERSON(a) ? "person" : A_WHEN_WHERE.test(a) ? "whenWhere" : A_DONE.test(a) ? "done" : A_LIKING.test(a) ? "liking" : null);
  if (Q_PERSON.test(q)) return "person";
  if (Q_WHEN_WHERE.test(q)) return "whenWhere";
  if (Q_DONE.test(q)) return A_PERSON(a) ? "person" : "done";
  if (Q_LIKING.test(q)) return A_PERSON(a) ? "person" : A_WHEN_WHERE.test(a) && !A_LIKING.test(a) ? "whenWhere" : "liking";
  return byWords() ?? (q && A_NAME(a) ? "person" : null);
}
/** The library's forms for a reply kind (Learning 023 rule 7, main's schema): the top-level `replyKinds: { person, done, liking, whenWhere }`,
 *  each a list of `{ hi, en }` forms with one {phrase} slot. [] while the key is absent: what is said today is used then. */
let KIND_FORMS_TEST = null;
/** Tests only: a library's `replyKinds` in place of the file's ({ replyKinds: {…} }); null restores the file. */
export function setReplyKindFormsForTest(o = null) { KIND_FORMS_TEST = o; }
const replyKindsData = () => (KIND_FORMS_TEST ?? DATA).replyKinds ?? null;
export function replyKindForms(kind) {
  if (!REPLY_KINDS.includes(kind)) return [];
  const f = replyKindsData()?.[kind];
  return Array.isArray(f) ? f.filter((x) => x && (x.hi || x.en)) : [];
}
/** The kinds of thing said that each existing phrase-form shape fits, until a kind has forms of its own: a liking asked or said takes the
 *  "achha lagta" and favourite forms, a thing done the "pichhli baar" form, a favourite person the favourite form; a person who was there
 *  and a time or place take none of them — a word form or a plain one. */
const shapeFits = (shape, rk, q) => !rk || (shape === "like" ? rk === "liking" : shape === "fav" ? rk === "liking" || (rk === "person" && /favou?rite/i.test(String(q ?? ""))) : shape === "past" ? rk === "done" : true);
/** The child's own casing of a word the picker lowered ("virat" → "Virat" where they said "Virat"). */
const theirCase = (w, said) => { if (!w) return w; const m = new RegExp(`(?<![\\p{L}])${esc(w)}(?![\\p{L}])`, "iu").exec(String(said ?? "")); return m ? m[0] : w; };
function asideReplyLine0({ said = "", topic = "", lang = "hinglish", n = 0, words = [], asked = "", skip = 0, avoidFrame = null } = {}) {
  const avoided = (f) => !!avoidFrame && !!f && [f.hi, f.en].includes(avoidFrame);
  if (isSadAside(said) || isSadAside(topic)) return { line: asideSadLine({ lang, n }), form: "sad" };
  const k = KINDS[asideKindOf(`${topic} ${said}`)] ?? KINDS.other;
  // (to-brain 053 C2: the kind of thing said, and its own forms where the library has them — a {phrase} or {word} of theirs, or none)
  const rk = String(asked ?? "").trim() ? replyKindOf(asked, said) : null;
  const kf = rk ? replyKindForms(rk) : [];
  if (kf.length) {
    const ph = saidPhrase(said) ?? phraseOf(said);
    const wd = ASKS_HER.test(String(said)) ? null : replyWordOf(words, said);
    const ok = kf.map((f, j) => ({ f, j })).filter(({ f }) => { const t = formOf(f, lang); return !avoided(f) && (!/\{phrase\}/.test(t) || ph) && (!/\{word\}/.test(t) || wd); });
    if (ok.length) {
      const { f } = ok[(((n + skip) % ok.length) + ok.length) % ok.length];
      const t = formOf(f, lang);
      return { line: cap(fill(t, { phrase: ph, word: wd })), form: /\{phrase\}/.test(t) ? "phrase" : /\{word\}/.test(t) ? "word" : "plain", kind: rk };
    }
  }
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
      : /favou?rite/i.test(String(said)) ? /favou?rite/ : LIKING_A.test(String(said)) ? /achha\s+lagta|like/ : PAST_A.test(String(said)) ? /pichhli\s+baar|last\s+time|aisa\s+hua/
        // (Brain 044, dry offtopic c4 on a path T6 reshaped: "fielding karna, catch pakadna" to "uske baare mein thoda aur batao na?" got "Oh,
        // catch. Achha." — an answer of no shape to a question of no shape, with a phrase of theirs, is said back as what they like)
        : String(asked ?? "").trim() && saidPhrase(said) ? /achha\s+lagta|like/ : null;
    // (dc-r8-director23 A2, c4 offtopic 20: "Dhoni" to "Tumhara favourite kaun hai?" after a question about Virat — an aside of no kind —
    // got the plain line; the favourite and liking forms name nothing of a kind, so another kind's form of that shape is used)
    const pool = [k, ...Object.values(KINDS).filter((x) => x !== k)].filter((x) => x?.phraseReplies?.length);
    for (const x of want ? pool : []) { const j = x.phraseReplies.findIndex((f) => want.test(formOf(f, lang).toLowerCase())); if (j >= 0) { kp = x; i = j; break; } }
  }
  // (to-brain 052 B5: the form her last aside reply was said in — another kind's form of the same shape in its place)
  if (i >= 0 && avoided(kp?.phraseReplies?.[i])) {
    // (a liking said as "pasand" or "maza" is a liking too; the people kind's forms name "them" and are said only of people; "other"'s are
    // the plainest, so they come first)
    const shapeR = (f) => { const t = formOf(f, lang); return /achha\s+lagta|like|pasand|maza\s+aata/i.test(t) ? "like" : formShape(t); };
    const shape = shapeR(kp.phraseReplies[i]);
    const pool = [k, KINDS.other, ...Object.values(KINDS).filter((x) => x !== k && x !== KINDS.other && x !== KINDS.people)].filter((x, j, a) => x?.phraseReplies?.length && a.indexOf(x) === j);
    for (const x of pool) { const j = x.phraseReplies.findIndex((f) => !avoided(f) && shapeR(f) === shape); if (j >= 0) { kp = x; i = j; break; } }
  }
  // (to-brain 053 C2: until a kind has forms of its own, a phrase form whose shape does not fit the kind of thing said is not said — a
  // person who was there, a time or a place get a word form or a plain one, never "Toh yeh tumhe achha lagta hai.")
  if (i >= 0 && rk && kp?.phraseReplies?.[i] && !shapeFits(formShape(formOf(kp.phraseReplies[i], lang)), rk, String(asked ?? "").split(/(?<=[.!?\u0964])\s+/).at(-1))) i = -1;
  const phrase = i >= 0 && kp?.phraseReplies?.[i] ? saidPhrase(said) ?? phraseOf(said) : null;
  // (skip: the forms after the first, in order — the phrase form's siblings of the same shape, then the word forms, then the plain ones)
  const sibs = phrase ? kp.phraseReplies.map((f, j) => ({ f, j })).filter(({ f, j }) => j !== i && formShape(formOf(f, lang)) === formShape(formOf(kp.phraseReplies[i], lang))).map(({ f }) => f) : [];
  if (phrase && skip === 0) return { line: cap(fill(formOf(kp.phraseReplies[i], lang), { phrase })), form: "phrase" };
  if (phrase && skip <= sibs.length) return { line: cap(fill(formOf(sibs[skip - 1], lang), { phrase })), form: "phrase" };
  const s1 = phrase ? skip - sibs.length - 1 : skip;
  const word0 = ASKS_HER.test(String(said)) ? null : replyWordOf(words, said);
  // (a time or a place is no {word}: "Wah, shaam!" — the data's rule 1 — the plain form)
  const word = rk === "whenWhere" ? null : rk ? theirCase(word0, said) : word0;
  if (word && s1 < (k?.replies?.length ?? 0)) { let f = pickN(k?.replies, n + Math.max(0, s1)); if (avoided(f)) f = pickN(k?.replies, n + Math.max(0, s1) + 1); if (f) return { line: cap(fill(formOf(f, lang), { word })), form: "word" }; }
  const p = pickN(k?.plain, n + Math.max(0, s1 - (word ? k?.replies?.length ?? 0 : 0)));
  return { line: p ? formOf(p, lang) : null, form: "plain" };
}

/** Every return question form, both languages, slots as written ("{aside}"): authored text code's word passes leave alone. */
export function asideReturnForms() {
  return Object.values(KINDS).flatMap((k) => (k.returns ?? []).flatMap((f) => [f?.hi, f?.en])).filter((x) => typeof x === "string" && x.trim());
}

/** Every form a reply may take, for the dry predicate: { word: [RegExp with a (word) group], plain: [string], sad: [string] }. */
/** Every reply-kind form (to-brain 053 C2), both languages: the file's, or a test's. */
const kindFormTexts = () => REPLY_KINDS.flatMap((k) => replyKindForms(k)).flatMap((f) => [f?.hi, f?.en]).filter((x) => typeof x === "string" && x.trim());
export function asideReplyForms() {
  const all = Object.values(KINDS);
  const kf = kindFormTexts();
  // (Brain 049 B6: a form's "achha lagta" is said in the child's own ending — likeInChildsEnding — and read in any of them)
  const re = (f) => new RegExp(`^${esc(f).replace(/\\\{word\\\}|\{word\}/g, "(.{1,40}?)").replace(/achha(\\s\+|\s+)lagta/gi, "(?:achha$1lagta|achhi$1lagti|achhe$1lagte)")}$`, "iu");
  return {
    word: [...all.flatMap((k) => (k.replies ?? []).flatMap((f) => [f.hi, f.en])), ...kf.filter((f) => /\{word\}/.test(f))].filter(Boolean).map(re),
    // (a {phrase} form is checked as a {word} form: one slot of the child's own words)
    // (Learning 016's againReplies, for an aside or a reply said a second time, are phrase forms too)
    phrase: [...all.flatMap((k) => [...(k.phraseReplies ?? []), ...(k.againReplies ?? [])].flatMap((f) => [f.hi, f.en])), ...kf.filter((f) => /\{phrase\}/.test(f))].filter(Boolean).map((f) => re(f.replace(/\{phrase\}/g, "{word}"))),
    plain: [...all.flatMap((k) => (k.plain ?? []).flatMap((f) => [f.hi, f.en])), ...kf.filter((f) => !/\{(?:word|phrase)\}/.test(f))].filter(Boolean),
    sad: (DATA.sad?.replies ?? []).flatMap((f) => [f.hi, f.en]).filter(Boolean),
  };
}
