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
/** Her reply to the child's answer about their aside: { line, form: "word" | "plain" | "sad" }. The sad set when the aside or the
 *  answer is sad; a plain form when they ask her back (rule 4) or no word of theirs fits; else a form with their word. */
export function asideReplyLine({ said = "", topic = "", lang = "hinglish", n = 0, words = [] } = {}) {
  if (isSadAside(said) || isSadAside(topic)) return { line: asideSadLine({ lang, n }), form: "sad" };
  const k = KINDS[asideKindOf(`${topic} ${said}`)] ?? KINDS.other;
  const word = ASKS_HER.test(String(said)) ? null : replyWordOf(words, said);
  if (word) { const f = pickN(k?.replies, n); if (f) return { line: cap(fill(formOf(f, lang), { word })), form: "word" }; }
  const p = pickN(k?.plain, n);
  return { line: p ? formOf(p, lang) : null, form: "plain" };
}

/** Every form a reply may take, for the dry predicate: { word: [RegExp with a (word) group], plain: [string], sad: [string] }. */
export function asideReplyForms() {
  const all = Object.values(KINDS);
  const re = (f) => new RegExp(`^${esc(f).replace(/\\\{word\\\}|\{word\}/g, "(.{1,40}?)")}$`, "iu");
  return {
    word: all.flatMap((k) => (k.replies ?? []).flatMap((f) => [f.hi, f.en])).filter(Boolean).map(re),
    plain: all.flatMap((k) => (k.plain ?? []).flatMap((f) => [f.hi, f.en])).filter(Boolean),
    sad: (DATA.sad?.replies ?? []).flatMap((f) => [f.hi, f.en]).filter(Boolean),
  };
}
