// Item bookkeeping for the director: probe mapping, the practice queue, isomorphic items, the spoken
// diagnostic (P7) built from a kit misconception, and the code-level answer-leak predicate.
import { toAap } from "./register.js";

/** Item kind → probe id from the catalogue (learning-science §7). Plain practice is P15, hint-ladder consumption. */
export const PROBE_FOR_KIND = {
  practice: "P15", near_transfer: "P3", far_transfer: "P4", predict: "P5", contrast: "P8", why: "P2",
  teachback: "P1", retrieval: "P10", error_spot: "P6", translate_rep: "P14",
};
/** Likelihood weights per probe (catalogue reliability bands; design starting points, not fitted). */
export const PROBE_WEIGHT = { P1: 1.2, P2: 1.0, P3: 1.2, P4: 1.2, P5: 0.8, P6: 1.0, P7: 0.7, P8: 1.0, P10: 1.5, P14: 1.0, P15: 1.0 };

const KIND_ORDER = { practice: 0, predict: 1, contrast: 2, translate_rep: 3, near_transfer: 4, why: 5, error_spot: 6, far_transfer: 7, retrieval: 8 };
export const QUEUE_MAX = 12;
/** Error-spotting only after basic mastery (rule 6: never for novices). */
const ERROR_SPOT_P = 0.7;

const DIAG_PREFIX = "diag:";
export const probeFor = (item) => (item.diagnostic ? "P7" : PROBE_FOR_KIND[item.kind] ?? "P15");

/** The prompt to pose, in the child's language (Hinglish/Hindi kits carry prompt_hi). */
export const promptFor = (item, lang) => (lang === "english" ? item.prompt_en : item.prompt_hi) || item.prompt_en;

/** Deterministic [0,1) stream from a seed (mulberry32), so option order is replayable from the lesson seed. */
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hashStr = (s) => [...String(s)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

/**
 * A misconception's diagnostic as a pseudo-item, so it runs through the same ladder and evidence path.
 * The prompt is the bare stem: the options are content of their own (read out naturally, shown as chips)
 * and are NOT appended to the pinned question — appended, they overflowed the appended-last budget and
 * were read out as "1/2 slash 1/3". Kits list the correct option first in most diagnostics, so the order
 * is shuffled per lesson (seed) and per misconception; chips and the read-out share that order.
 * @returns {import("../../shared/contracts").KitItem & { diagnostic: true, options: any[] } | null}
 */
export function diagnosticItem(kit, m, seed = 0) {
  const d = m?.diagnostic;
  const correct = d?.options.find((o) => o.correct);
  if (!correct) return null;
  const rnd = prng(seed ^ hashStr(m.id));
  const options = d.options.map((o) => ({ o, k: rnd() })).sort((a, b) => a.k - b.k).map(({ o }) => o);
  const anchor = kit.items.find((i) => i.targetsMisconception === m.id) ?? kit.items[0];
  return {
    id: DIAG_PREFIX + m.id, skillId: anchor.skillId, kind: "contrast", difficulty: 2,
    prompt_en: d.prompt_en, prompt_hi: d.prompt_hi,
    answer: correct.text, acceptable: [],
    hints: [
      "pump: ask them to picture both choices as real things",
      `hint: use ${m.remediation.representation}`,
      "prompt: a fill-in-the-blank that compares the two choices",
      "assertion: say which option is right, with a one-line reason",
    ],
    targetsMisconception: m.id, diagnostic: true, options,
  };
}

/** A diagnostic's options as they are said aloud: "1/2 ya 1/3" (Hinglish/Hindi) or "1/2 or 1/3". */
export const optionsSpoken = (item, lang) => item.options.map((o) => o.text).join(lang === "english" ? " or " : " ya ");

/**
 * The item as THIS child is asked it: an "aap" child (state.ctx.address, director/register.js) gets the Hinglish /
 * Hindi question in aap forms. Only the question changes (prompt_hi); keys, acceptable answers, hints and option
 * texts are the kit's. Every reader of the posed question (compile, the reply guards, the classifier, the Question
 * card) gets its item from findItem, so what is said, shown, guarded and graded is one text.
 */
const AAP = new WeakMap();
export function addressed(item, address) {
  if (!item || address !== "aap" || !item.prompt_hi) return item;
  if (AAP.has(item)) return AAP.get(item);
  const out = { ...item, prompt_hi: toAap(item.prompt_hi) };
  AAP.set(item, out);
  return out;
}

/** Resolve an item id against the kit, its diagnostics, and the warm-up snapshot in the lesson state. */
export function findItem(s, kit, id) {
  if (!id) return null;
  const address = s?.ctx?.address;
  if (id.startsWith(DIAG_PREFIX)) return addressed(diagnosticItem(kit, kit.misconceptions.find((m) => m.id === id.slice(DIAG_PREFIX.length)), s.seed), address);
  return addressed(kit.items.find((i) => i.id === id) ?? s.warmup?.find((w) => w.id === id) ?? null, address);
}

/**
 * Practice order: skills in kit order (prerequisites first), items by difficulty then kind, teach-back
 * held for the teach-back phase, and one spoken diagnostic second in line — the child's known
 * misconception if this kit has it, else the kit's first.
 */
export function buildPracticeQueue(kit, { activeMisconceptionIds = [] } = {}) {
  const ids = [];
  for (const sk of kit.skills) {
    ids.push(...kit.items.filter((i) => i.skillId === sk.id && i.kind !== "teachback")
      .sort((a, b) => a.difficulty - b.difficulty || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]).map((i) => i.id));
  }
  const m = kit.misconceptions.find((x) => x.diagnostic && activeMisconceptionIds.includes(x.id)) ?? kit.misconceptions.find((x) => x.diagnostic);
  if (m) ids.splice(Math.min(1, ids.length), 0, DIAG_PREFIX + m.id);
  return ids.slice(0, QUEUE_MAX);
}

/** Next item to pose, or null when the queue is spent. `easier` picks the gentlest remaining one. */
export function selectNext(s, kit, { easier = false } = {}) {
  const done = new Set([...s.itemsDone, ...s.skipped]);
  const ok = s.queue.map((id) => findItem(s, kit, id)).filter((it) => {
    if (!it || done.has(it.id) || it.id === s.activeItemId) return false;
    if (it.kind !== "error_spot") return true;
    const sk = s.skills[it.skillId];
    return !!sk && sk.pKnown >= ERROR_SPOT_P && sk.correctUnaided >= 1;
  });
  if (!easier) return ok[0] ?? null;
  return [...ok].sort((a, b) => a.difficulty - b.difficulty)[0] ?? null;
}

/** After an assertion the child must solve an isomorphic item: same skill, closest difficulty. */
export function isomorphicFor(s, kit, item) {
  const done = new Set(s.itemsDone);
  const KINDS = ["practice", "near_transfer", "contrast", "retrieval", "predict"];
  return kit.items
    .filter((i) => i.skillId === item.skillId && i.id !== item.id && !done.has(i.id) && KINDS.includes(i.kind))
    .sort((a, b) => Math.abs(a.difficulty - item.difficulty) - Math.abs(b.difficulty - item.difficulty)
      || (a.kind === item.kind ? -1 : 0) - (b.kind === item.kind ? -1 : 0))[0] ?? null;
}

/** The key idea a "why?" after a correct answer is classified against. */
export function whyKey(kit, skillId) {
  const why = kit.items.find((i) => i.kind === "why" && i.skillId === skillId) ?? kit.items.find((i) => i.kind === "why");
  return why?.answer || kit.expectations.slice(0, 2).join("; ") || null;
}

/** Fractions and plain numbers in a text, for module params and the whiteboard anchor. */
export function extractValues(text) {
  const t = String(text || "");
  const fractions = [...t.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map((m) => [+m[1], +m[2]]);
  const numbers = [...t.replace(/\d+\s*\/\s*\d+/g, " ").matchAll(/\d+(?:\.\d+)?/g)].map((m) => +m[0]);
  return { fractions, numbers };
}

/** Whiteboard anchor for an item: its fractions or numbers, else the shortened prompt. */
export function anchorOf(item, lang) {
  const p = promptFor(item, lang);
  const { fractions, numbers } = extractValues(p);
  if (fractions.length) return { kind: "math", value: fractions.map(([n, d]) => `${n}/${d}`).join("  ·  ") };
  if (numbers.length && numbers.length <= 4) return { kind: "math", value: numbers.join("  ·  ") };
  return { kind: "text", value: p.length > 60 ? p.slice(0, 57) + "…" : p };
}

// Spoken fraction forms → "n/d", so "one-half", "aadha" and "ek bata do" all compare equal to 1/2.
const NUM = { one: 1, ek: 1, two: 2, do: 2, three: 3, teen: 3, four: 4, char: 4, chaar: 4, five: 5, paanch: 5, panch: 5,
  six: 6, chhe: 6, chhah: 6, seven: 7, saat: 7, eight: 8, aath: 8, nine: 9, nau: 9, ten: 10, das: 10 };
const DEN = { half: 2, halves: 2, third: 3, thirds: 3, tihai: 3, fourth: 4, fourths: 4, quarter: 4, quarters: 4, chauthai: 4,
  fifth: 5, fifths: 5, sixth: 6, sixths: 6, eighth: 8, eighths: 8, tenth: 10, tenths: 10 };
const NUM_RE = `(\\d+|${Object.keys(NUM).join("|")})`;
const toN = (w) => (/^\d+$/.test(w) ? w : String(NUM[w]));
/** Canonicalize spoken fractions in already-lowercased text. */
export function canonicalFractions(t) {
  return t
    .replace(new RegExp(`\\b${NUM_RE}\\s*(?:by|bata|upon|out of)\\s*${NUM_RE}\\b`, "g"), (_, a, b) => `${toN(a)}/${toN(b)}`)
    // "char mein se teen" = three out of four
    .replace(new RegExp(`\\b${NUM_RE}\\s*(?:mein|me|main)\\s*se\\s*${NUM_RE}\\b`, "g"), (_, a, b) => `${toN(b)}/${toN(a)}`)
    .replace(new RegExp(`\\b${NUM_RE}[\\s-]+(${Object.keys(DEN).join("|")})\\b`, "g"), (_, a, d) => `${toN(a)}/${DEN[d]}`)
    .replace(/\b(half|aadha|aadhi|adha|adhi)\b/g, "1/2")
    .replace(/\btihai\b/g, "1/3")
    .replace(/\b(quarter|chauthai|paav|pav)\b/g, "1/4")
    .replace(/\bpaune\b/g, "3/4");
}
export const norm = (s) => canonicalFractions(String(s || "").toLowerCase().replace(/[“”"'’`]/g, "").replace(/[^\p{L}\p{N}/.\s-]/gu, " ").replace(/\s+/g, " ").trim());
const VERDICT = new Set(["bada", "badi", "bade", "zyada", "jyada", "bigger", "larger", "greater", "more", "chhota", "chhoti", "smaller",
  "less", "kam", "sahi", "correct", "right", "answer", "jawab", "uttar", "hota", "hoti", "equals", "is"]);
function containsTerm(text, term) {
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}/])${esc}($|[^\\p{L}\\p{N}/])`, "u").test(text);
}

const FILLER = new Set(["the", "and", "what", "which", "how", "this", "that", "with", "kya", "hai", "hain", "mein", "aur", "kaun", "kaunsa", "kitna", "kitne", "ek", "ko", "ka", "ki", "ke", "se", "ya", "is", "are", "you", "your", "tum", "tumhe"]);
const contentWords = (t) => new Set(norm(t).split(" ").filter((w) => (w.length >= 3 || /\d/.test(w)) && !FILLER.has(w)));

/**
 * Did a teacher turn actually pose this item? At least half of the question's content words must be in it
 * (the turn may add a short lead-in). Guards text-mode fidelity: the director's evidence is only valid for
 * the question the child was really asked.
 */
export function posesItem(text, item, lang) {
  const want = contentWords(promptFor(item, lang));
  if (!want.size) return true;
  const got = contentWords(text);
  return [...want].filter((w) => got.has(w)).length / want.size >= 0.5;
}

/**
 * Does a turn hand the floor back (turn-shape rule)? A question, a blank to fill, or a try-this verb.
 * A turn that only states things leaves a child — especially a shy one — with nothing to do but "haan".
 */
export const handsBack = (text) => /[?？]|_{2,}|\b(batao|bataao|bolo|socho|try|karke dekho|dikhao|tell me|show me|your turn)\b/i.test(String(text));

/** Does a why-probe turn actually ask for the reason (how / why, in Hindi or English)? */
export const asksWhy = (text) => /\b(kaise|kaisay|kyun|kyon|kyu|kyoon|why|how|reason|wajah|vajah)\b|कैसे|क्यों/i.test(String(text));

// ── answer-leak predicate ──
const CUT = "\u0000";
/** Normalized words; a full stop is a word boundary unless it is a decimal point. */
const wordsOf = (t) => norm(t).replace(/(?<!\d)\.|\.(?!\d)/g, " ").split(" ").filter(Boolean);
/** The head of a diagnostic option ("1/2, because …" → "1/2"; "Yes. She takes …" → "yes"). */
const headOf = (t) => norm(String(t).split(/[,;.]\s|\s(?:because|kyunki|kyonki)\s/i)[0]);
/** Index of `form` (a word array) inside `ws`, or -1. */
function indexOfRun(ws, form) {
  for (let i = 0; i + form.length <= ws.length; i++) if (form.every((w, k) => ws[i + k] === w)) return i;
  return -1;
}
/** QUOTE_RUN or more consecutive words copied from the item's own prompt are the question, not a verdict. */
const QUOTE_RUN = 4;
function cutQuoted(ws, sources) {
  const out = [];
  for (let i = 0; i < ws.length;) {
    let best = 0;
    for (const src of sources) {
      const need = Math.min(QUOTE_RUN, src.length);
      for (let j = 0; j < src.length; j++) {
        let n = 0;
        while (i + n < ws.length && j + n < src.length && ws[i + n] === src[j + n]) n++;
        if (n >= need && n > best) best = n;
      }
    }
    if (best) { out.push(CUT); i += best; } else out.push(ws[i++]);
  }
  return out;
}
/** Options read out as a sequence ("1/2 ya 1/3", "option A is 1/2, option B is 1/3") are the question too. */
const OPTION_GAP = 4;
function cutOptionSpan(ws, item) {
  const forms = item.options.flatMap((o, opt) => [...new Set([norm(o.text), headOf(o.text)])].map((f) => ({ opt, f: f.split(" ").filter(Boolean) })));
  const occ = [];
  for (const { opt, f } of forms) {
    if (!f.length) continue;
    for (let i = 0; i + f.length <= ws.length; i++) if (f.every((w, k) => ws[i + k] === w)) occ.push({ opt, start: i, end: i + f.length });
  }
  occ.sort((a, b) => a.start - b.start || b.end - a.end);
  for (let i = 0; i < occ.length; i++) {
    let end = occ[i].end;
    const opts = new Set([occ[i].opt]);
    for (const o of occ.slice(i + 1)) {
      if (o.start < end) continue;
      if (o.start - end > OPTION_GAP) break;
      if (!opts.has(o.opt)) { opts.add(o.opt); end = o.end; }
    }
    if (opts.size >= 2) return [...ws.slice(0, occ[i].start), CUT, ...cutOptionSpan(ws.slice(end), item)];
  }
  return ws;
}

/**
 * Comparison words: what turns "2 tukdon wala tukda ... bada" into the answer said in other words. Only
 * comparisons — "sahi, 3 groups mein…" affirms a reply and was a false leak (evals/director-sim.mjs) — and
 * not as a size of something else ("ek chhoti galti", "chhoti si baat").
 */
const COMPARE = new Set(["bada", "badi", "bade", "zyada", "jyada", "bigger", "biggest", "larger", "greater", "more", "chhota", "chhoti", "chhote",
  "smaller", "smallest", "less", "kam", "lamba", "lambi", "lambe", "longer"]);
const NOT_COMPARING = new Set(["galti", "gadbad", "si", "sa", "se", "baat", "mistake", "deal", "time", "baar"]);
const compares = (ws) => ws.some((w, i) => COMPARE.has(w) && !NOT_COMPARING.has(ws[i + 1]));
// Number words for the paraphrase check. "do" (2) is left out: it is also "give" ("bata do").
const SPOKEN_NUM = { ...NUM, do: undefined };
const numbersIn = (w) => (/^\d+\/\d+$/.test(w) ? w.split("/") : /^\d+$/.test(w) ? [w] : SPOKEN_NUM[w] ? [String(SPOKEN_NUM[w])] : []);
/**
 * For an item that asks the child to choose between named values (a diagnostic, or "which is bigger: 1/2 or
 * 1/3?"), each choice's numbers that no other choice has: 2 for 1/2 and 3 for 1/3. [] for other items.
 */
function distinguishingNumbers(item) {
  const valuesOf = (t) => {
    const { fractions, numbers } = extractValues(norm(t));
    return fractions.length ? fractions.map(([n, d]) => `${n}/${d}`) : numbers.map(String);
  };
  let choices;
  if (item.diagnostic) choices = item.options.map((o) => valuesOf(headOf(o.text)));
  else {
    const named = [...new Set(valuesOf(item.prompt_en))];
    if (named.length < 2 || !named.includes(norm(item.answer))) return [];
    choices = named.map((v) => [v]);
  }
  const nums = choices.map((vs) => new Set(vs.flatMap(numbersIn)));
  return nums.flatMap((own, i) => [...own].filter((n) => nums.every((other, j) => j === i || !other.has(n))));
}

/**
 * Code-level answer-leak check (rule 15: guard leakage on the bytes, not only by instruction).
 * First the question itself is cut out of the text — runs quoted from the item's own prompt (both
 * languages), and for a diagnostic the options read out as a sequence — because posing an item whose
 * statement names the answer ("Billi almari ke upar baithi hai…", an error-spot claim) is not a leak.
 * Then: a key form the question does not name is a leak wherever it appears; a form the question names
 * (one of two fractions compared, a diagnostic's correct option) is a leak only in a statement — not a
 * question — that puts a verdict word next to it. For a choice between named values, a statement that
 * pairs a comparison verdict with a number only one choice has ("2 tukdon wali bar ka har tukda bada hai")
 * says the answer in other words, and is a leak too (measured in evals/director-sim.mjs at hint rung 2).
 */
export function revealsAnswer(text, item) {
  if (!item) return false;
  const forms = (item.diagnostic ? [headOf(item.answer)] : [item.answer, ...(item.acceptable || [])].map(norm))
    .filter(Boolean).map((f) => f.split(" ")).filter((f) => f.length);
  const sources = [item.prompt_en, item.prompt_hi].filter(Boolean).map(wordsOf);
  const named = norm([item.prompt_en, item.prompt_hi, ...(item.diagnostic ? item.options.map((o) => o.text) : [])].join(" "));
  const strip = (t) => {
    const ws = cutQuoted(wordsOf(t), sources);
    return item.diagnostic ? cutOptionSpan(ws, item) : ws;
  };
  const all = strip(text);
  const sentences = String(text).split(/(?<=[.!?।])\s+/).filter((x) => !/[?？]\s*$/.test(x)).map(strip);
  for (const form of forms) {
    if (indexOfRun(all, form) < 0) continue;
    if (!containsTerm(named, form.join(" "))) return true;
    for (const ws of sentences) {
      const at = indexOfRun(ws, form);
      if (at >= 0 && ws.slice(Math.max(0, at - 3), at + form.length + 4).some((w) => VERDICT.has(w))) return true;
    }
  }
  const marks = new Set(distinguishingNumbers(item));
  return marks.size > 0 && sentences.some((ws) => compares(ws) && ws.some((w) => numbersIn(w).some((n) => marks.has(n))));
}
