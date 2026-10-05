// Roman Hinglish → Devanagari, the last text step before a Hindi-capable TTS voice (RS-7, RESET-PLAN §4 RS-7 step 1).
//
// Why: the Director writes Hinglish in Roman script (compile.js LANGUAGE, brain/say.js SCRIPT_OK), and DragonHD Diya reads
// Roman Hindi number words with an English front end: पैंतीस came out as "पेंटीज" in 4/4 renders, तीस as "टीज" under a hi-IN
// wrap (TALKING-RULES §5.3). Rounds 1-2 of the voice pick were rendered from Devanagari the live Director never writes.
//
// What it does, per word: Hindi words (and every Hindi number word) → Devanagari; English words, names and acronyms stay
// Latin, so the SSML compiler's langRuns() wraps only the Hindi runs in <lang hi-IN> and English lesson words keep the en-IN
// front end. Pure, deterministic, synchronous, no I/O; ~µs per reply (evals/translit/run.mjs measures it).
//
// What it never does:
//   - touch a safety reply: when the written text is in the safety register (helpline number, identity answer, a safety
//     moment) or names a helpline, the text is returned byte-identical (safety by predicate, not instruction);
//   - convert a sentence with no unambiguous Hindi word in it (an English sentence inside a Hinglish reply stays English);
//   - run in the English lane, or when the flag is off.
// Flag: TAXILA_VOICE_DEVANAGARI=1 (the plan's `voice.devanagari`). OFF by default: production speaks exactly as before.
// Fallback for unknown words (TAXILA_TRANSLIT_FALLBACK): "rules" (default; evals/translit/run.mjs measured it) | "none".
import { CORE, AMBIGUOUS, AMBIG_STRONG, KEEP, IRREGULAR, NAMES, verbForms } from "./lexicon.js";
import { NUMBER_WORDS } from "./numbers.js";
import { LEARNED_HI, LEARNED_KEEP, LEARNED_AMBIG } from "./lexicon-learned.js";
import { romanToDeva } from "./rules.js";
import { looksHindi, looksHindiModel } from "./classify.js";
import { safetyRegister } from "../expressive/safety.js";
import { HELPLINES } from "../../compiler/floor.js";

export const TRANSLIT_VERSION = "tl1-2026-10-05";

const clean = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !k.includes("_")));
/** High-confidence Hindi: hand tables (numbers, core, irregular verbs). These win over everything except AMBIGUOUS. */
const HAND = new Map(Object.entries({ ...verbForms(), ...clean(CORE), ...clean(IRREGULAR), ...NUMBER_WORDS }));
const AMBIG = new Map(Object.entries({ ...Object.fromEntries(Object.entries(LEARNED_AMBIG).map(([k, v]) => [k, v.deva])), ...clean(AMBIGUOUS) }));
const LEARNED = new Map(Object.entries(LEARNED_HI));
const VERB_FORMS = new Set([...Object.keys(verbForms()), ...Object.keys(clean(IRREGULAR))]);
/** "ki" after these (or after any verb form) is the conjunction कि ("pata chala ki...", "jaana ki..."), else की. */
const KI_CONJ_PREV = new Set(["hai", "hain", "tha", "thi", "pata", "jaana", "jaanna", "socho", "sochiye", "maano", "maaniye", "yaad", "lagta", "lagti", "lagaiye"]);
/** English words the verb generator can produce or the learned table may hold: never converted. */
const NEVER = new Set(["mile", "mode", "bach", "pile", "tale", "bane", "dine", "line", "time", "kite", "note", "bite", "gate", "rate", "late", "mate", "date", "hate", "pane", "tone", "bone", "cone"]);
/** Ambiguous spellings that are number words in a number context. */
const NUMBER_AMBIG = { saath: "साठ", sath: "साठ", bees: "बीस", do: "दो", sat: "सात", tera: "तेरह", bara: "बारह", das: "दस" };
const NUMBER_DEVA = new Set([...Object.values(NUMBER_WORDS), ...Object.values(NUMBER_AMBIG)]);
const HELPLINE_NAMES = HELPLINES.map((h) => h.name.toLowerCase());

const WORD = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;
/** A sentence about what the teacher is (AI / robot / insaan): never converted (safety floor: never deny being an AI). */
const IDENTITY_SENTENCE = /\b(AI|robot|insaan|insan)\b/i;

/** Is the step on for this process? */
export function devanagariOn(env = process.env) {
  return /^(1|on|true|yes)$/i.test(String(env.TAXILA_VOICE_DEVANAGARI ?? ""));
}
const FALLBACKS = new Set(["none", "rules", "model"]);
const fallbackMode = (env = process.env) => { const f = String(env.TAXILA_TRANSLIT_FALLBACK || "rules").toLowerCase(); return FALLBACKS.has(f) ? f : "rules"; };

/**
 * Per-word decision for one word in context (exported for the eval and the tests).
 * kind: "hand" | "learned" | "ambig-hi" | "ambig-en" | "rule" | "keep" | "name" | "oov"
 */
function lookup(lw) {
  if (NEVER.has(lw)) return { kind: "keep" };
  if (AMBIG.has(lw)) return { kind: "ambig", deva: AMBIG.get(lw) };
  if (HAND.has(lw)) return { kind: "hand", deva: HAND.get(lw) };
  if (KEEP.has(lw) || LEARNED_KEEP.has(lw)) return { kind: "keep" };
  if (LEARNED.has(lw)) return { kind: "learned", deva: LEARNED.get(lw) };
  return { kind: "oov" };
}

/**
 * Split into sentences (on . ! ? ; and danda) keeping the separators, so each sentence is judged on its own.
 * @returns {Array<{ s: string, start: number }>}
 */
function sentences(text) {
  const out = [];
  const re = /[^.!?;।\n]+[.!?;।\n]*/g;
  for (const m of text.matchAll(re)) out.push({ s: m[0], start: m.index });
  if (!out.length) out.push({ s: text, start: 0 });
  return out;
}

/**
 * Analyse a text: every word with its decision. Used by toDevanagari and by the eval (so the eval scores exactly the
 * decisions the voice gets).
 * @param {string} text
 * @param {{ fallback?: "rules"|"model"|"none" }} [o]
 * @returns {Array<{ w: string, i: number, out: string, kind: string }>}
 */
export function analyze(text, { fallback = fallbackMode() } = {}) {
  const res = [];
  for (const { s, start } of sentences(String(text))) {
    const toks = [];
    for (const m of s.matchAll(WORD)) toks.push({ w: m[0], i: start + m.index, first: toks.length === 0 });
    // pass 1: lexicon
    for (const t of toks) {
      const lw = t.w.toLowerCase().replace(/’/g, "'");
      const cap = /^[A-Z]/.test(t.w) && !t.first;
      const allCaps = t.w.length > 1 && t.w === t.w.toUpperCase();
      const L = lookup(lw);
      if (allCaps) { t.kind = "keep"; continue; }
      // a capitalised mid-sentence word is a name (Zoya, Bittu) unless it is a known Hindi word that is not also a name
      if (cap && (L.kind === "oov" || L.kind === "keep" || NAMES.has(lw))) { t.kind = "name"; continue; }
      Object.assign(t, L, { lw });
      if (L.kind === "oov") {
        if ((fallback === "rules" && looksHindi(lw)) || (fallback === "model" && looksHindiModel(lw))) { t.kind = "rule"; t.deva = romanToDeva(lw); }
        else t.kind = "keep";
      }
    }
    const isHi = (t) => t.kind === "hand" || t.kind === "learned" || t.kind === "rule";
    const isEn = (t) => t.kind === "keep" || t.kind === "name";
    const hiN = toks.filter((t) => t.kind === "hand" || t.kind === "learned").length;
    // pass 2: ambiguous words by context; a sentence with no unambiguous Hindi word stays Latin
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      if (t.kind !== "ambig") continue;
      if (!hiN) { t.kind = "ambig-en"; continue; }
      let h = 0, e = 0;
      for (let d = 1; d <= 2; d++) for (const n of [toks[k - d], toks[k + d]]) { if (!n) continue; if (isHi(n)) h++; else if (isEn(n)) e++; }
      if (AMBIG_STRONG.has(t.lw)) t.kind = h === 0 && e >= 3 ? "ambig-en" : "ambig-hi";
      else t.kind = h > 0 && h >= e ? "ambig-hi" : h === 0 && e === 0 && hiN * 2 >= toks.length ? "ambig-hi" : "ambig-en";
    }
    // number context: an ambiguous number spelling next to a number word is the number ("teen sau saath" = 360 → साठ,
    // "bees hazaar" → बीस, "do sau" → दो), whatever its everyday reading
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k];
      const num = NUMBER_AMBIG[t.lw];
      if (!num || !hiN) continue;
      // "ek saath" / "do saath" is the idiom "together", never 1×60 or 2×60 ("sab ek saath bolo" → एक साथ, not एक साठ:
      // review rs7 2026-10-05 found the step turning "together" into "one sixty"). For saath/sath, ek/do do not count as
      // number context; a scale word (sau, hazaar, lakh) or any other number word still does ("teen sau saath" → साठ).
      const idiom = t.lw === "saath" || t.lw === "sath";
      const near = [toks[k - 1], toks[k + 1]].some((n) => n && n.deva && NUMBER_DEVA.has(n.deva) && !(idiom && /^(ek|do|dono)$/.test(n.lw ?? n.w.toLowerCase())));
      if (near) { t.kind = "ambig-hi"; t.deva = num; }
    }
    // "ki": the conjunction कि after a verb form, the possessive की otherwise
    for (let k = 1; k < toks.length; k++) {
      const t = toks[k];
      if (t.lw !== "ki" || t.kind !== "hand") continue;
      const p = toks[k - 1].lw;
      if (p && (KI_CONJ_PREV.has(p) || (VERB_FORMS.has(p) && /(a|e|i|ga|ge|gi|na)$/.test(p) && !/^(ka|ke|ki|ko)$/.test(p)))) t.deva = "कि";
    }
    for (const t of toks) {
      const conv = hiN > 0 && (t.kind === "hand" || t.kind === "learned" || t.kind === "rule" || t.kind === "ambig-hi");
      res.push({ w: t.w, i: t.i, out: conv ? t.deva : t.w, kind: hiN > 0 ? t.kind : t.kind === "ambig" ? "ambig-en" : `${t.kind}:en-sentence` });
    }
  }
  return res;
}

/** Does this written text belong to the safety floor (never transliterated)? */
export function safetyText(written, { register, moment } = {}) {
  if (register === "safety") return true;
  const t = String(written ?? "");
  if (safetyRegister(moment ?? null, t)) return true;
  const low = t.toLowerCase();
  return HELPLINE_NAMES.some((n) => low.includes(n));
}

/**
 * The step itself. `text` is what the voice will be given (speakable() output); `written` is the teacher's written text
 * the safety predicate runs on (defaults to `text`).
 * @param {string} text
 * @param {{ mode?: string, written?: string, register?: string, moment?: object|null, force?: boolean, fallback?: "rules"|"model"|"none", env?: NodeJS.ProcessEnv }} [o]
 * @returns {string}
 */
export function toDevanagari(text, o = {}) {
  const s = String(text ?? "");
  const env = o.env ?? process.env;
  if (!o.force && !devanagariOn(env)) return s;
  if (o.mode && !/^(hinglish|hindi|hl|hi)$/.test(String(o.mode))) return s;
  if (!/[A-Za-z]/.test(s)) return s;
  if (safetyText(o.written ?? s, o) || safetyText(s, o)) return s;
  const toks = analyze(s, { fallback: o.fallback ?? fallbackMode(env) });
  // An identity sentence the shared IDENTITY regex misses ("Nahi, main AI teacher hoon" was converted in review rs7,
  // 2026-10-05) stays byte-identical. Per SENTENCE, not per reply: 176/1863 corpus replies name "AI teacher" in a greeting,
  // and skipping the whole reply would leave their number words on the English front end.
  const held = sentences(s).filter(({ s: x }) => IDENTITY_SENTENCE.test(x)).map(({ s: x, start }) => [start, start + x.length]);
  let out = "", at = 0;
  for (const t of toks) {
    if (t.out === t.w) continue;
    if (held.some(([a, b]) => t.i >= a && t.i < b)) continue;
    out += s.slice(at, t.i) + t.out;
    at = t.i + t.w.length;
  }
  return out + s.slice(at);
}
