// The VAKYA bank (round 7, English and Hindi grammar): sentence trains built from VERIFIED kit items (verified.agrees ===
// true). A level is ONE item: the child couples word wagons into the item's verified key, in order, turning form wagons
// where a word has forms. Nothing here is written by a model; every word on every wagon comes from the item itself or from
// a closed grammar set. The rules:
//   - the item belongs to a GRAMMAR skill of a class 4-7 English / Hindi kit (grammarOf: the skill's title names the grammar
//     it practises, and with it its closed set); vocabulary skills (पर्यायवाची, अनेकार्थी, विलोम, spelling) are not trains;
//   - it is a production task (practice, error_spot, contrast, near_transfer, translate_rep), not an open one: an answer
//     that is "any …", "for example …", "two correct …", "जैसे …" has many right sentences and the yard would hold one;
//   - its key is a full sentence or phrase of 3-12 words: the item's answer or one of its acceptable forms (the longest
//     that covers the sentence the prompt quotes, so a fragment like "used to think" never stands for "The bird used to
//     think …"), else the prompt's own quoted template with its blanks filled by the answer's words in order (keyFrom
//     "answer" / "acceptable" / "blanks"); explanations, "should be …", "remove …", option letters and bare word lists
//     ("were and would") are never keys;
//   - every other acceptable form that is a sentence (and at most one word shorter than the key) is accepted too: the law
//     compares exactly, ignoring case and punctuation; a form needing a word no wagon carries simply cannot be built;
//   - every word of the key is a wagon. Distractors: at most 2 loose wagons and a few extra FORMS on turntables, taken only
//     from the item itself (the wrong sentence an error-spot item quotes, the source sentence a practice item transforms,
//     the choices it offers "(लगा / लगी)", "'is' or 'are'", the verb in its brackets "___ (float)") or from the skill's
//     closed set (helper verbs, articles, relative pronouns, said / told, much / many, at / on / in …). A substitution is a
//     form only when the two words are forms of one word or partners in a closed set; a loose wagon only a function word;
//   - an item whose key is printed in its own prompt ("Which is correct: X or Y?") is a choice in disguise and is left out,
//     and so is one whose prompt prints the key's order with nothing left to decide ("copy"); one whose only decision is a
//     single two-way turntable on a printed order is kept but marked decides "one-choice" (reported, never hidden);
//   - a topic is admitted with at least MIN_ITEMS items.
// A mal-rule train (the wrong sentence a child holding the item's misconception builds) is kept only when the item names
// its misconception AND the wrong sentence can be built from the yard. Its id is the TYPE of its first wrong wagon (a turned
// form: wrong-form; a distractor: extra-wagon; a key word left out: missing-wagon; a key word from elsewhere: word-order),
// mapped to the kit misconception in data/play/coverage.json.
//
//   node server/play/tools/build-vakya.mjs [--check]   → data/play/vakya/<class-subject>.json + data/play/vakya/index.json
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tokens, sealOf, matchTrain, sparkOf } from "../../../src/play/families/vakya/vakya.logic.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const KITS = join(ROOT, "data/kits"), OUT = join(ROOT, "data/play/vakya");
/** a topic is admitted with at least this many items (main 2026-11-04, as for the arena) */
export const MIN_ITEMS = 6;
export const CLASSES = [4, 5, 6, 7];
export const SUBJECTS = ["english", "hindi"];
const MAX_DISTRACTORS = 2, MAX_EXTRA_FORMS = 3;

// ── the grammar skills: a skill is grammar when its title names a grammar point; the point names its closed set
export const EN_SETS = {
  helper: ["do", "does", "did", "is", "are", "am", "was", "were", "will", "would", "have", "has", "had"],
  article: ["a", "an", "the"],
  relative: ["who", "which", "that"],
  report: ["said", "told"],
  pronoun: ["he", "she", "they", "i", "we", "you", "his", "her", "their", "my", "our", "your"],
  quantity: ["much", "many"],
  preposition: ["at", "on", "in"],
  joiner: ["because", "so"],
  modal: ["must", "can", "cannot", "could"],
};
/** closed-set partners (the one form a child holding the set's confusion reaches for) */
const PARTNER = {
  do: ["does"], does: ["do"], did: ["do"], is: ["are"], are: ["is"], am: ["is"], was: ["were"], were: ["was"], will: ["would"], would: ["will"],
  has: ["have"], have: ["has"], had: ["has"], a: ["an"], an: ["a"], the: ["a"], who: ["which"], which: ["who"], that: ["which"],
  said: ["told"], told: ["said"], much: ["many"], many: ["much"], at: ["in"], on: ["in"], in: ["on"], because: ["so"], so: ["because"],
};
const EN_GRAMMAR = [
  [/wh-question|question word|helping verb first|questions with do\/does|suggestions and questions|helper verb/i, ["helper"]],
  [/\barticles?\b|with 'a' or 'an'/i, ["article"]],
  [/relative pronoun|'who' clauses?|who \/ which/i, ["relative"]],
  [/'said' and 'told'/i, ["report"]],
  [/indirect speech|reported speech|pronoun shift|his\/her for the owner/i, ["pronoun", "helper"]],
  [/quantity words/i, ["quantity"]],
  [/prepositions of/i, ["preposition"]],
  [/'because' or 'so'/i, ["joiner"]],
  [/'must', 'can'|\bmodals\b/i, ["modal"]],
  [/conditional|simple past|simple-past|past perfect|past continuous|past progressive|present progressive|simple present|'used to'|'may' \+|'let me'|'let's'|is\/are \+ the past|pair-nouns|plurals after numbers|adverbs of manner|contrast connectors|collective nouns|i wish i (were|could)/i, []],
];
/** Hindi grammar: number (वचन), gender (लिंग) and its agreement, tense (काल), pronouns (सर्वनाम), question words. Vocabulary
 *  skills (पर्यायवाची, अनेकार्थी, विलोम, muhavare, spelling) have one-word keys and are not built as trains. */
const HI_GRAMMAR = /वचन|लिंग|भूतकाल|(^|[\s(])काल|सर्वनाम|singular-plural|plural forms|plurals of|gender|पुल्लिंग|first-person verbs|question words|feminine of/i;
const HI_NOT = /पर्यायवाची|अनेकार्थी|विलोम|muhavare|spells?\b/i;
export function grammarOf(subject, title) {
  if (subject === "hindi") return HI_GRAMMAR.test(title) && !HI_NOT.test(title) ? { sets: [] } : null;
  const hit = EN_GRAMMAR.filter(([re]) => re.test(title));
  return hit.length ? { sets: [...new Set(hit.flatMap(([, s]) => s))] } : null;
}

// ── which items: production tasks with one right sentence
const KINDS = new Set(["practice", "error_spot", "contrast", "near_transfer", "translate_rep"]);
const OPEN_ANSWER = /\b(any|for example|e\.g\.|such as|two correct|a correct|a sentence using|four lines|two respectful|a question about)\b|जैसे|कोई भी|दो सही|वाली|पंक्ति/i;
const OPEN_PROMPT = /\byour own\b|\bmake (one|two|a rule)\b|\btwo (lines|questions|things|past-tense|english words)\b|four-line|match each|\bwhy\?|how do you know|what is the difference|what does .* (mean|describe)|\bcompare\b|spelling|whom does|stand for|tell me/i;
/** a list of words asked for ("Give the past tense of: fall, become, begin", "Make plurals: …") is not a sentence */
const LIST_PROMPT = /\bgive the (past tense|plural|feminine|opposite)s?\b|\bmake plurals\b|\bfeminine of\b/i;

// ── keys
const META = /\b(should be|remove|option|first one|second one|the first|the second|wala|is missing|comes before|needs|e\.g\.|for example|any correct|two correct|a sentence using|answer)\b|→|=|…|\.\.\.|\(|\)|;|\/| — | – |चाहिए|आएगा|मात्रा|ग़लत|गलत|सही शब्द|सही वाक्य|नहीं,/i;
const DEVA = /[ऀ-ॿ]/, LATIN = /[A-Za-z]/;
const stripQuotes = (s) => String(s ?? "").trim().replace(/^[‘'“"]+/, "").replace(/[’'”"]+$/, "").trim();
const LIST_JOIN = new Set(["and", "और", "or", "या"]);
export function sentenceOk(text, subject) {
  const s = stripQuotes(text);
  if (!s || META.test(s)) return false;
  if (subject === "hindi" ? LATIN.test(s) || !DEVA.test(s) : DEVA.test(s)) return false;
  const t = tokens(s);
  if (t.length === 3 && LIST_JOIN.has(t[1])) return false;      // a bare word list: "were and would", "मोरनी और ऊँटनी"
  return t.length >= 3 && t.length <= 12;
}
/** the prompt's quoted segments (the template with blanks, the wrong sentence, the source sentence) */
export function quotes(prompt) {
  const out = [];
  for (const m of String(prompt ?? "").matchAll(/(?:^|[\s:(,—])['‘"“]((?:[^'‘’"“”]|'(?=[a-z]))+?)['’"”](?=[\s.,;:)!?।]|$)/g)) if (m[1].trim().split(/\s+/).length >= 3) out.push(m[1].trim());
  return out;
}
/** the template's blanks filled with the answer's words in order (only when the counts agree), brackets dropped */
export function fillBlanks(template, answer) {
  const blanks = template.match(/_{2,}/g);
  if (!blanks) return null;
  const parts = String(answer).split(/\s*[,;]\s*|\s+and\s+/).map((x) => x.trim()).filter(Boolean);
  if (parts.length !== blanks.length || parts.some((x) => META.test(x) || x.split(/\s+/).length > 3)) return null;
  let i = 0;
  return template.replace(/_{2,}\s*(\([^)]*\))?/g, () => `${parts[i++]} `).replace(/\s+([,.!?।])/g, "$1").replace(/\s+/g, " ").trim();
}
/** the single-word choices an item offers: "(लगा / लगी)", "'is' or 'are'", "Choose from गई and गया", "खेलता or खेलती?" */
export function offeredChoices(prompt) {
  const p = String(prompt ?? "").normalize("NFC").replace(/[’‘]/g, "'"), sets = [];
  const W = "[\\p{L}\\p{M}'-]+";
  const q = (s) => s.replace(/^['"“]+|['"”]+$/g, "");
  for (const m of p.matchAll(new RegExp(`(?:^|[\\s(‘'"“])(${W})['"”]?\\s*\\/\\s*['"“]?(${W})(?=['"”)\\s,.;:?।]|$)`, "gu"))) sets.push([q(m[1]), q(m[2])]);
  for (const m of p.matchAll(new RegExp(`\\b(?:fill in|choose|options?:?|choose:)\\s+['"“]?(${W})['"”]?\\s+or\\s+['"“]?(${W})['"”]?`, "giu"))) sets.push([q(m[1]), q(m[2])]);
  for (const m of p.matchAll(new RegExp(`\\bchoose from\\s+['"“]?(${W})['"”]?\\s+(?:and|or)\\s+['"“]?(${W})['"”]?`, "giu"))) sets.push([q(m[1]), q(m[2])]);
  for (const m of p.matchAll(new RegExp(`(?:^|[\\s:;.।])['"“]?(${W})['"”]?\\s+or\\s+['"“]?(${W})['"”]?\\s*[?.]`, "gu"))) sets.push([q(m[1]), q(m[2])]);
  return sets.map((s) => s.map((x) => x.trim()).filter(Boolean)).filter((s) => s.length === 2 && s[0].toLowerCase() !== s[1].toLowerCase());
}

/**
 * An LCS alignment of key `a` with another sentence `b`. Between two runs of shared words, the key's words and the other
 * sentence's words pair up in order (substitutions); what is left over is a miss (a key word `b` lacks) or an extra
 * (a word `b` has and the key does not). → { common, ops: ["=", k, w] | ["~", k, w] | ["-", k] | ["+", w] }
 */
export function align(a, b) {
  const n = a.length, m = b.length, L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const ops = [];
  let i = 0, j = 0, D = [], I = [];
  const flush = () => { const k = Math.min(D.length, I.length); for (let x = 0; x < k; x++) ops.push(["~", D[x], I[x]]); for (const d of D.slice(k)) ops.push(["-", d]); for (const w of I.slice(k)) ops.push(["+", w]); D = []; I = []; };
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { flush(); ops.push(["=", a[i], b[j]]); i++; j++; }
    else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) { I.push(b[j]); j++; }
    else { D.push(a[i]); i++; }
  }
  flush();
  return { common: L[0][0], ops };
}
/** is `w` a form of `k` (one word turned: flow/flows, fly/flew, run/ran, पत्ता/पत्ते), not another word? */
const HI_END = /(ियाँ|ियों|ियां|ाएँ|ाएं|या|यी|ये|ई|ए|ें|ों|ाँ|ां|ीं|ा|ी|े|ो|ि|ु|ू)$/u;
export function sameWord(k, w, subject) {
  if (!k || !w || k === w) return false;
  if (subject === "hindi") { const s = (x) => x.replace(HI_END, ""); return s(k).length >= 1 && s(k) === s(w); }
  if (/^[a-z]+$/.test(k) !== /^[a-z]+$/.test(w)) return false;
  const p = Math.min(3, k.length - 1, w.length - 1);
  if (p >= 2 && k.slice(0, p) === w.slice(0, p)) return true;
  if (k.length >= 3 && w.length >= 3 && k.slice(0, 2) === w.slice(0, 2)) return true;
  // an irregular form keeps its first and last letters and about its length: run/ran, come/came, fight/fought
  return k[0] === w[0] && k.at(-1) === w.at(-1) && Math.abs(k.length - w.length) <= 2 && Math.min(k.length, w.length) >= 3;
}
/** two words standing in the SAME slot of the key and of the item's own wrong / source sentence (an alignment
 *  substitution) are one word's forms when they share their first letter and neither is a function word: took/taked, see/saw */
const slotForms = (k, w, subject) => sameWord(k, w, subject) || (subject === "english" && k[0] === w[0] && !FUNCTION.has(k) && !FUNCTION.has(w) && k.length >= 3 && w.length >= 3);
/**
 * The key's words that fill a template's blanks: the template's words anchor the key; each blank's fill is the run of key
 * words standing where the blank stands. → [{ at: key indices, base: the bracketed word or null }] or null.
 */
export function blankFills(template, keyTok) {
  const bases = [];
  const t = tokens(template.replace(/_{2,}\s*(?:\(([^)]*)\))?/g, (_m, b) => { bases.push(b && !b.includes("/") ? b.trim() : null); return ` qqblank${bases.length - 1} `; }));
  if (!bases.length) return null;
  const n = keyTok.length, m = t.length, L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = keyTok[i] === t[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0, D = [], B = [];
  const flush = () => { if (B.length === 1 && D.length >= 1 && D.length <= 3) out.push({ at: D, base: bases[B[0]] }); D = []; B = []; };
  while (i < n || j < m) {
    if (i < n && j < m && keyTok[i] === t[j]) { flush(); i++; j++; }
    else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) { const b = /^qqblank(\d+)$/.exec(t[j]); if (b) B.push(Number(b[1])); j++; }
    else { D.push(i); i++; }
  }
  flush();
  return out.length ? out : null;
}
const closedPair = (k, w, g) => g.sets.some((s) => EN_SETS[s].includes(k) && EN_SETS[s].includes(w));
/** the words a loose distractor wagon may carry: function words a misconception adds ("Let's to", "didn't", "so") */
const FUNCTION = new Set(["to", "not", "didn't", "don't", "doesn't", "do", "does", "did", "so", "because", "am", "is", "are", "was", "were", "the", "a", "an",
  "at", "on", "in", "of", "will", "would", "has", "have", "had", "that", "ने", "को", "का", "की", "के", "है", "हैं", "था", "थी", "थे"]);

/** one kit item → a bank item, or { why } */
export function vakyaOf(it, t, subject, g) {
  if (it?.verified?.agrees !== true) return { why: "not verified" };
  if (!KINDS.has(it.kind)) return { why: `not a production task (${it.kind})` };
  const pe = String(it.prompt_en ?? "").normalize("NFC"), ph = String(it.prompt_hi ?? "").normalize("NFC");
  if (OPEN_ANSWER.test(String(it.answer)) || OPEN_PROMPT.test(pe)) return { why: "an open task (many right sentences)" };
  if (LIST_PROMPT.test(pe)) return { why: "a list of words, not a sentence" };
  const Q = quotes(pe), sources = Q.filter((q) => !/_{2,}/.test(q)), templates = Q.filter((q) => /_{2,}/.test(q));
  // the key covers the sentence the prompt quotes (a template's words, the wrong / source sentence), never a fragment of it
  const covers = (k) => !Q.length || Q.some((q) => { const qt = tokens(q.replace(/_{2,}\s*(\([^)]*\))?/g, " ")); return qt.filter((x) => k.includes(x)).length >= Math.ceil(qt.length * 0.5); });
  let cands = [];
  if (sentenceOk(it.answer, subject)) cands.push({ text: stripQuotes(it.answer), from: "answer" });
  for (const a of it.acceptable ?? []) if (sentenceOk(a, subject)) cands.push({ text: stripQuotes(a), from: "acceptable" });
  cands = cands.filter((c) => covers(tokens(c.text)));
  if (!cands.length) for (const q of templates) { const f = fillBlanks(q, it.answer); if (f && sentenceOk(f, subject)) { cands.push({ text: f, from: "blanks" }); break; } }
  if (!cands.length) return { why: "the key is not a sentence of 3-12 words" };
  // the verified key: the answer when it is a sentence covering the quoted one, else the first such acceptable form; the
  // others are accepted when nearly as long
  const primary = cands[0];
  const keyTok = tokens(primary.text);
  const keys = [keyTok];
  for (const c of cands) { const k = tokens(c.text); if (k.length >= keyTok.length - 1 && !keys.some((x) => x.join(" ") === k.join(" "))) keys.push(k); }
  // a choice in disguise: the key is printed in the prompt
  const promptTok = ` ${tokens(pe).join(" ")} `;
  if (keys.some((k) => promptTok.includes(` ${k.join(" ")} `))) return { why: "the key is printed in the prompt (a choice in disguise)" };

  // the wagons: one per key word (display case kept from the key text; an English sentence starts with a capital)
  const display = tokens(primary.text, { keepCase: true });
  if (subject === "english" && display[0]) display[0] = display[0][0].toUpperCase() + display[0].slice(1);
  const forms = display.map((d) => [d]);
  const extras = [];
  const addForm = (i, w) => { if (i >= 0 && !forms[i].some((f) => f.toLowerCase() === w.toLowerCase())) forms[i].push(i === 0 && subject === "english" ? w[0].toUpperCase() + w.slice(1) : w); };
  const mis = typeof it.targetsMisconception === "string" ? it.targetsMisconception : null;
  const wrongs = [];
  // (1) the sentences the prompt quotes: the wrong sentence (error spot) or the source a practice item transforms
  for (const q of sources) {
    const src = tokens(q), disp = tokens(q, { keepCase: true });
    const al = align(keyTok, src);
    if (al.common < Math.ceil(keyTok.length * 0.5)) continue;
    // the wrong train this source stands for: an error spot's own quoted sentence; else the key with only the source's
    // turned forms (and, for the item's misconception, its added function word) applied
    // (words of the source outside the key's span, "Everyone said that …" around "Prabhat had played …", are context, not a slip)
    const firstEq = al.ops.findIndex((o) => o[0] === "="), lastEq = al.ops.map((o) => o[0]).lastIndexOf("=");
    const wrong = [];
    let changed = false, explained = true, ki = 0;
    al.ops.forEach((op, oi) => {
      const inside = oi > firstEq && oi < lastEq;
      if (op[0] === "=") { wrong.push(op[1]); ki++; return; }
      if (op[0] === "~") {
        const [, k, w] = op;
        if (slotForms(k, w, subject) || closedPair(k, w, g)) { addForm(ki, disp[src.indexOf(w)] ?? w); wrong.push(w); changed = true; }
        else { wrong.push(k); explained = false; }
        ki++; return;
      }
      if (op[0] === "-") {
        // an error spot that lacks a key word lacks it on purpose only when it is a function word ("Ravi saw leopard")
        if (it.kind === "error_spot" && FUNCTION.has(op[1])) changed = true; else { wrong.push(op[1]); if (it.kind === "error_spot") explained = false; }
        ki++; return;
      }
      const w = op[1];
      if (!inside) return;
      if (mis && FUNCTION.has(w) && !keyTok.includes(w) && (extras.includes(w) || extras.length < MAX_DISTRACTORS)) { if (!extras.includes(w)) extras.push(w); wrong.push(w); changed = true; }
      else if (keyTok.includes(w)) { wrong.push(w); changed = true; }
      else explained = false;
    });
    if (mis && it.kind === "error_spot") wrongs.push(src);
    if (mis && changed && explained) wrongs.push(wrong);
  }
  // (2) the choices the item offers, and the verb named in a blank's brackets (it turns the word that fills that blank)
  for (const set of offeredChoices(pe)) for (let i = 0; i < keyTok.length; i++) if (set.some((x) => x.toLowerCase() === keyTok[i])) for (const x of set) addForm(i, x);
  for (const q of templates) for (const f of blankFills(q, keyTok) ?? []) {
    const b = f.base ? tokens(f.base, { keepCase: true }) : [];
    if (b.length !== 1) continue;
    const best = [...f.at].sort((x, y) => common(keyTok[y], b[0].toLowerCase()) - common(keyTok[x], b[0].toLowerCase()) || y - x)[0];
    if (keyTok[best] !== b[0].toLowerCase()) addForm(best, b[0]);
  }
  // (3) the skill's closed set: a key word in the set gets its partner on a turntable
  let extraForms = forms.reduce((s, f) => s + f.length - 1, 0);
  for (const s of g.sets) for (let i = 0; i < keyTok.length && extraForms < MAX_EXTRA_FORMS; i++) {
    if (!EN_SETS[s].includes(keyTok[i]) || forms[i].length > 1) continue;
    for (const p of PARTNER[keyTok[i]] ?? []) if (EN_SETS[s].includes(p) && extraForms < MAX_EXTRA_FORMS) { addForm(i, caseLike(display[i], p)); extraForms++; }
  }
  // the engine: the key's first word, when every key starts with it and nothing is decided there
  const engine = keys.every((k) => k[0] === keyTok[0]) && forms[0].length === 1 && !wrongs.some((m) => m[0] !== keyTok[0]) ? display[0] : null;
  const body = forms.map((f, i) => ({ i, forms: f })).filter((x) => !(engine && x.i === 0));
  // shuffled into the yard (seeded by the item id; never standing in the key's order), each face seeded too
  let wagons = null;
  for (let tries = 0; tries < 8 && !wagons; tries++) {
    const r = rng(`yard:${it.id}:${tries}`);
    const yard = [...body.map((x) => ({ forms: x.forms, key: true })), ...extras.map((e) => ({ forms: [e], key: false }))];
    for (let i = yard.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [yard[i], yard[j]] = [yard[j], yard[i]]; }
    let wi = 0, xi = 0;
    const ws = yard.map((y) => {
      const fs = [...y.forms];
      for (let i = fs.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [fs[i], fs[j]] = [fs[j], fs[i]]; }
      return { id: y.key ? `w${++wi}` : `x${++xi}`, forms: fs.map((f) => f.normalize("NFC")), init: fs.length > 1 ? Math.floor(r() * fs.length) : 0 };
    });
    if (!inKeyOrder(ws, keyTok, engine)) wagons = ws;
  }
  if (!wagons) return { why: "the yard always stands in the key's order (too few wagons)" };
  const level = { engine: engine?.normalize("NFC") ?? null, wagons };
  const okKeys = keys.filter((k) => matchTrain(level, k));
  if (!okKeys.length || okKeys[0] !== keys[0]) return { why: "the yard cannot build its own key" };
  // the mal trains: buildable, not a key; typed by the first wrong wagon; one per type and per spark
  const mals = [];
  if (mis) for (const m of wrongs) {
    if (!matchTrain(level, m) || sparkOf(okKeys, m).solved) continue;
    const id = malTypeOf(level, okKeys, m, subject, g);
    const sp = sparkOf(okKeys, m);
    if (!id || mals.some((x) => x.id === id || (sparkOf(okKeys, x.train).at === sp.at && sparkOf(okKeys, x.train).word === sp.word))) continue;
    mals.push({ id, train: m });
  }
  const decides = decisionOf(pe, keyTok, wagons);
  if (decides === "copy") return { why: "the prompt prints the key's order and nothing is left to decide (copy)" };
  const item = {
    id: it.id, topicId: t.topicId, skillId: it.skillId, kind: it.kind, difficulty: it.difficulty ?? 2, lang: subject === "hindi" ? "hi" : "en",
    prompt: { en: pe, hi: ph || pe }, keyFrom: primary.from, engine: level.engine, wagons, keys: okKeys,
    mals, ...(mis ? { mis } : {}), ...(mals.length ? { malKit: mis } : {}), decides,
    verified: { by: "kit blind solver", agrees: true },
  };
  item.seal = sealOf(item);
  return { ok: item };
}
const common = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };
const caseLike = (d, w) => (d[0] && d[0] !== d[0].toLowerCase() ? w[0].toUpperCase() + w.slice(1) : w);
function rng(seedStr) { let h = 2166136261; for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 2 ** 32; }
function inKeyOrder(wagons, keyTok, engine) {
  const body = engine ? keyTok.slice(1) : keyTok;
  const ws = wagons.filter((w) => w.id.startsWith("w"));
  return ws.length === body.length && ws.every((w, i) => w.forms.some((f) => f.toLowerCase() === body[i]));
}
/** the type of a wrong train's FIRST wrong wagon (what the child sees spark): a form turned, a distractor, a key word left out, a key word out of place */
function malTypeOf(level, keys, m, subject, g) {
  const sp = sparkOf(keys, m), k = keys[0], w = sp.word, kw = k[sp.at];
  if (!w) return null;
  const forms = (x) => level.wagons.filter((wg) => wg.forms.some((f) => f.toLowerCase() === x));
  if (kw && forms(w).some((wg) => wg.forms.some((f) => f.toLowerCase() === kw))) return "wrong-form";
  if (forms(w).every((wg) => wg.id.startsWith("x"))) return "extra-wagon";
  const count = (a, x) => a.filter((y) => y === x).length;
  if (kw && w === k[sp.at + 1] && count(m, kw) < count(k, kw)) return "missing-wagon";
  if (k.includes(w)) return "word-order";
  if (kw && (sameWord(kw, w, subject) || closedPair(kw, w, g))) return "wrong-form";
  return null;
}
/** what the child decides: the order (no quoted sentence shows it), the forms, or both; "one-choice" = one two-way turntable on a printed order */
function decisionOf(prompt, keyTok, wagons) {
  const turns = wagons.filter((w) => w.forms.length > 1), loose = wagons.some((w) => w.id.startsWith("x"));
  const shown = quotes(prompt).some((q) => orderSame(keyTok, tokens(q.replace(/_{2,}\s*(\([^)]*\))?/g, " "))));
  if (!shown) return turns.length || loose ? "order+form" : "order";
  if (!turns.length && !loose) return "copy";
  return turns.length === 1 && turns[0].forms.length === 2 && !loose ? "one-choice" : "form";
}
/** the key's words that the quoted sentence also has stand in the same order there, and they are most of the key */
function orderSame(keyTok, src) {
  const shared = keyTok.filter((x) => src.includes(x));
  let j = -1;
  for (const x of shared) { const at = src.indexOf(x, j + 1); if (at < 0) return false; j = at; }
  return shared.length >= Math.max(2, keyTok.length - 3);
}

export function build() {
  const files = {}, index = { v: 1, note: "built by server/play/tools/build-vakya.mjs from verified kit items of class 4-7 English / Hindi grammar skills; do not edit by hand", minItems: MIN_ITEMS, topics: {}, skills: {} };
  const why = {};
  for (const c of CLASSES) for (const subject of SUBJECTS) {
    const cs = `c${c}-${subject}`, list = [];
    const kit = JSON.parse(readFileSync(join(KITS, `${cs}.json`), "utf8"));
    for (const t of kit.topics ?? []) {
      const got = [];
      for (const sk of t.skills ?? []) {
        const g = grammarOf(subject, sk.title);
        if (!g) continue;
        const items = (t.items ?? []).filter((i) => i.skillId === sk.id);
        const ok = [];
        for (const it of items) { const r = vakyaOf(it, t, subject, g); if (r.ok) ok.push(r.ok); else why[r.why] = (why[r.why] ?? 0) + 1; }
        index.skills[sk.id] = { title: sk.title.slice(0, 120), items: items.length, verified: items.filter((i) => i.verified?.agrees === true).length, built: ok.length,
          oneChoice: ok.filter((i) => i.decides === "one-choice").length };
        got.push(...ok);
      }
      if (!got.length) continue;
      list.push(...got);
      const skills = {};
      for (const it of got) skills[it.skillId] = (skills[it.skillId] ?? 0) + 1;
      const misMap = {};
      for (const it of got) for (const m of it.mals) if (!misMap[m.id]) misMap[m.id] = it.malKit;
      index.topics[t.topicId] = { file: cs, items: got.length, eligible: got.length >= MIN_ITEMS, skills, misMap };
    }
    files[cs] = { v: 1, source: `data/kits/${cs}.json`, items: list };
  }
  const T = Object.values(index.topics), I = Object.values(files).flatMap((f) => f.items);
  const tally = (f) => I.reduce((a, i) => { for (const k of [].concat(f(i))) a[k] = (a[k] ?? 0) + 1; return a; }, {});
  index.counts = { topics: T.length, eligible: T.filter((t) => t.eligible).length, items: I.length,
    bySubject: Object.fromEntries(SUBJECTS.map((s) => [s, { items: I.filter((i) => i.lang === (s === "hindi" ? "hi" : "en")).length, topics: T.filter((t) => t.file.endsWith(s)).length, eligible: T.filter((t) => t.file.endsWith(s) && t.eligible).length }])),
    decides: tally((i) => i.decides), keyFrom: tally((i) => i.keyFrom), malTrains: tally((i) => i.mals.map((m) => m.id)), leftOut: why };
  return { files, index };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { files, index } = build();
  const out = { ...Object.fromEntries(Object.entries(files).map(([k, v]) => [`${k}.json`, JSON.stringify(v, null, 1) + "\n"])), "index.json": JSON.stringify(index, null, 1) + "\n" };
  if (process.argv.includes("--check")) {
    const stale = Object.entries(out).filter(([f, text]) => { try { return readFileSync(join(OUT, f), "utf8") !== text; } catch { return true; } }).map(([f]) => f);
    if (stale.length) { console.error(`data/play/vakya is stale (${stale.slice(0, 5).join(", ")}): run node server/play/tools/build-vakya.mjs`); process.exit(1); }
    console.log("vakya ok", JSON.stringify(index.counts));
  } else {
    if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
    for (const [f, text] of Object.entries(out)) writeFileSync(join(OUT, f), text);
    console.log("wrote data/play/vakya", JSON.stringify(index.counts));
  }
}
