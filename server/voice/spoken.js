// toSpoken(): written teacher text → the text a TTS voice is given (docs/research/voice/spoken-notation.md).
// Pure and deterministic; the conventions are data in ./spoken-lexicon.js (NCERT readings per mode × school
// medium × age band), this file only walks them. Used ONLY on the way into a speech model: captions, stored
// transcripts, answer-leak and safety guards all keep the written text.
//
// Why (SN §3, measured 2026-10-02): written notation sent to gpt-4o-mini-tts misread Indian-comma numbers 11/15,
// voiced ₹ as dollars/cents in English mode, and voiced Childline 1098 / Tele-MANAS 14416 digit-exact 0/4 in
// Hindi mode; pre-rendered forms were ~1% misread and helplines 11/12 exact (12th undeterminable).
//
// Order of work:
//   1. safety numbers (floor.js HELPLINES): matched EXACTLY first, always digit by digit, in every mode. A
//      predicate, not a heuristic: 1098 is never a cardinal, even inside a maths sentence.
//   2. phone-like numbers (mobile, +91, 1800 toll-free, a number right after call/dial): digit by digit.
//   3. chemical formulae (every part must be a periodic-table symbol, so In/He/As/AI/IIT stay words).
//   4. a token walk for everything else: ₹ amounts, signs, operators, fractions, mixed numbers, decimals,
//      powers, roots, units, %, °, ratios, clock times, years, ranges, ordinals, Indian/international grouping.
// Text with no digit and no notation character is returned byte-identical.
import * as LX from "./spoken-lexicon.js";
import { HELPLINES } from "../compiler/floor.js";

export const RENDERER_VERSION = LX.RENDERER_VERSION;

const MODES = { english: "english", en: "english", hinglish: "hinglish", hl: "hinglish", hindi: "hindi", hi: "hindi" };
const NOTATION = /[0-9०-९₹%×÷=<>≤≥≈≠°√∛π∠△⁰¹²³⁴⁵⁶⁷⁸⁹⁻₀-₉½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞−^]/;
const LETTER = /[\p{L}\p{M}\p{N}]/u;
const ALPHA = /[\p{L}\p{M}]/u;

// ───────────── cell resolution ─────────────

const cellCache = new Map();
/**
 * The convention cell for a mode × school medium × age band.
 * @param {{ mode?: string, schoolMedium?: string, ageBand?: string }} opts
 */
export function cellFor({ mode, schoolMedium, ageBand } = {}) {
  const m = MODES[mode] ?? "hinglish";
  const medium = schoolMedium === "hindi" ? "hindi"
    : schoolMedium === "english" || schoolMedium === "other" ? "english" : LX.DEFAULT_MEDIUM[m];
  const band = ageBand === "6-9" ? "6-9" : "10-15";
  const key = `${m}.${medium}.${band}`;
  let c = cellCache.get(key);
  if (!c) {
    const def = LX.CELLS[`${m}.${medium}`];
    const base = LX.WORDS[def.words];
    const fr = base.frames?.[def.frame] ?? {};
    const W = { ...base, ...fr, ops: { ...base.ops, ...(fr.ops ?? {}) }, root: { ...base.root, ...(fr.root ?? {}) } };
    c = { key, mode: m, medium, band, words: def.words, frame: def.frame, W };
    cellCache.set(key, c);
  }
  return c;
}

// ───────────── number words ─────────────

const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "").replace(/\s{2,}/g, " ").trim();

/** Each digit as its own word: "one zero nine eight" / "एक शून्य नौ आठ". */
export function digitsWords(digits, W) {
  return String(digits).replace(/\D/g, "").split("").map((d) => W.below100[+d]).join(" ");
}

function below1000(n, W) {
  const h = Math.floor(n / 100), r = n % 100, out = [];
  if (h) out.push(`${W.below100[h]} ${W.scale.hundred}`);
  if (r || !h) out.push(W.below100[r]);
  return out.join(" ");
}

/** Indian system: crore, lakh, thousand, hundred (NCERT default in both media). No "and": that joins mixed numbers. */
function indian(n, W) {
  if (n === 0) return W.below100[0];
  const out = [];
  const crore = Math.floor(n / 1e7); n %= 1e7;
  if (crore) out.push(`${indian(crore, W)} ${W.scale.crore}`);
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  if (lakh) out.push(`${W.below100[lakh]} ${W.scale.lakh}`);
  const th = Math.floor(n / 1000); n %= 1000;
  if (th) out.push(`${W.below100[th]} ${W.scale.thousand}`);
  if (n) out.push(below1000(n, W));
  return out.join(" ");
}

/** International system, used only when the number was WRITTEN with international grouping and is ≥ 1,000,000. */
function international(n, W) {
  const out = [];
  const groups = [[1e9, "billion"], [1e6, "million"], [1e3, "thousand"]];
  for (const [v, name] of groups) {
    const g = Math.floor(n / v); n %= v;
    if (g) out.push(`${g < 1000 ? below1000(g, W) : indian(g, W)} ${W.scale[name]}`);
  }
  if (n) out.push(below1000(n, W));
  return out.join(" ");
}

/** Validates comma grouping: "indian" (1,00,000), "intl" (100,000), "both" (1,250), or null (a list like 1,234,56). */
function grouping(raw) {
  if (!raw.includes(",")) return "none";
  const g = raw.split(",");
  const tail = g.slice(1);
  const intl = g[0].length <= 3 && tail.every((x) => x.length === 3);
  const ind = g[0].length <= 2 && tail.at(-1).length === 3 && tail.slice(0, -1).every((x) => x.length === 2);
  if (intl && ind) return "both";
  return intl ? "intl" : ind ? "indian" : null;
}

/** An integer string (commas allowed) as words. */
function intWords(raw, W) {
  const kind = grouping(raw);
  if (kind === null) return raw.split(",").map((p) => intWords(p, W)).join(", ");
  const digits = raw.replace(/,/g, "");
  if (digits.length > 15 || (digits.length > 1 && digits[0] === "0")) return digitsWords(digits, W);
  const n = Number(digits);
  return kind === "intl" && n >= 1e6 ? international(n, W) : indian(n, W);
}

/** A numeral token (integer or decimal) as words; digits after the point are read singly (NCERT, both media). */
function numWords(raw, W) {
  const [i, f] = raw.split(".");
  const whole = intWords(i, W);
  return f === undefined ? whole : `${whole} ${W.point} ${digitsWords(f, W)}`;
}

const isInt = (raw) => /^\d+$/.test(raw);
const isOne = (raw) => raw === "1";

// ───────────── pre-passes on the string ─────────────

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

/** The safety set: every helpline number in the floor data. */
export const SAFETY_NUMBERS = HELPLINES.map((h) => String(h.number));
function safetyRe(numbers) {
  return new RegExp(`(?<![\\d.,])(?:${numbers.map(escapeRe).sort((a, b) => b.length - a.length).join("|")})(?![\\d]|[.,]\\d)`, "g");
}
const SAFETY_RE = safetyRe(SAFETY_NUMBERS);

/** Only the safety numbers, digit by digit (for prompt text that must keep everything else as written). */
export function spokenSafetyNumbers(text, opts = {}) {
  const { W } = cellFor(opts);
  const re = opts.safety ? safetyRe(opts.safety) : SAFETY_RE;
  return String(text).replace(re, (m) => digitsWords(m, W));
}

const MOBILE_RE = /(?<![\d+])(\+91[\s-]?|0)?([6-9]\d{4})[\s-]?(\d{5})(?!\d)/g;
const TOLLFREE_RE = /(?<!\d)18(?:00|60)(?:[\s-]?\d){6,8}(?!\d)/g;
const DIAL_RE = new RegExp(`(?<=(?:^|[^\\p{L}\\p{M}])(?:${LX.DIAL_CUES.map(escapeRe).join("|")})\\s+(?:(?:${LX.DIAL_LINKS.map(escapeRe).join("|")})\\s+)?)(\\d{3,8})(?!\\d|[.,]\\d)`, "giu");

function phones(text, W) {
  return text
    .replace(MOBILE_RE, (m, pre) => `${pre?.startsWith("+") ? W.ops.plus + " " : ""}${digitsWords(m.replace(/^\+91/, "91"), W)}`)
    .replace(TOLLFREE_RE, (m) => digitsWords(m, W))
    .replace(DIAL_RE, (m) => digitsWords(m, W));
}

const FORMULA_RE = /(?<![\p{L}\p{M}\p{N}])((?:[A-Z][a-z]?(?:\d+|[₀-₉]+)?){1,10})(?![\p{L}\p{M}\p{N}]|\.\d)/gu;
function formulae(text, W) {
  return text.replace(FORMULA_RE, (m) => {
    if (!/[\d₀-₉]/.test(m)) return m;
    const parts = [...m.matchAll(/([A-Z][a-z]?)(\d+|[₀-₉]+)?/g)];
    if (!parts.every((p) => LX.ELEMENTS.has(p[1]))) return m;
    const say = [];
    for (const [, sym, cnt] of parts) {
      say.push(sym.toUpperCase().split("").map((ch) => W.letters?.[ch] ?? ch).join(" "));
      if (cnt) {
        const n = cnt.replace(/[₀-₉]/g, (c) => LX.SUBSCRIPT[c]);
        say.push(W.formulaNumber ? (W.formulaNumber[+n] ?? n.split("").map((d) => W.formulaNumber[+d]).join(" ")) : intWords(n, W));
      }
    }
    return say.join(" ");
  });
}

// ───────────── the token walk ─────────────

const LEX = /(\d{1,3}(?:,\d{2,3}(?!\d))+(?:\.\d+)?|\d+(?:\.\d+)?)|([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)|([₀-₉]+)|([\p{L}\p{M}]+)|(\s+)|([\s\S])/gu;
function lex(text) {
  const out = [];
  for (const m of text.matchAll(LEX)) {
    const k = m[1] ? "num" : m[2] ? "sup" : m[3] ? "sub" : m[4] ? "word" : m[5] ? "sp" : "ch";
    out.push({ k, s: m[0], at: m.index });
  }
  return out;
}

const OPS = { "+": "plus", "−": "minus", "-": "minus", "×": "times", "*": "times", "÷": "divide", "=": "equals",
  "<": "lt", ">": "gt", "≤": "le", "≥": "ge", "≈": "approx", "≠": "ne" };
const isVarTok = (t) => t?.k === "word" && /^[a-zA-Z]$/.test(t.s);
const supDigits = (s) => s.split("").map((c) => LX.SUPERSCRIPT[c]).join("");
const ORD_SUFFIX = new Set(["st", "nd", "rd", "th"]);
const HI_ATTACH = /^(वाँ|वां|वें|वीं|वी|वा|वे)/;

function render(text, cell) {
  const { W, band } = cell;
  const t = lex(text);
  const out = [];
  let pad = false;        // the last thing emitted was rendered words (a following letter needs a space)
  let operand = false;    // the last non-space thing emitted was an operand (number, variable, closing bracket)
  const mathy = /[=+×÷*^]|\d[a-zA-Z](?![a-zA-Z])/.test(text);

  const emitRaw = (s) => {
    if (pad && LETTER.test(s[0]) && !(cell.words === "hi" && HI_ATTACH.test(s))) out.push(" ");
    out.push(s);
    pad = false;
  };
  const emitWords = (w, cap = true) => {
    const prev = out.length ? out[out.length - 1] : "";
    if (prev && LETTER.test(prev.at(-1))) out.push(" ");
    // A Latin word that now starts a sentence is capitalised, as the sentence was.
    const before = out.join("").trimEnd();
    if (cap && (!before || /[.!?]$/.test(before)) && /^[a-z]/.test(w)) w = w[0].toUpperCase() + w.slice(1);
    out.push(w);
    pad = true;
  };
  const at = (j) => t[j];
  /** Index of the next token, skipping one space token. */
  const skip = (j) => (t[j]?.k === "sp" ? j + 1 : j);
  const isUnit = (j, spaced) => t[j]?.k === "word" && LX.UNITS[t[j].s] && !(LX.UNITS_NEED_SPACE.has(t[j].s) && !spaced)
    && !(t[j + 1] && ALPHA.test(t[j + 1].s[0]));
  const unitName = (key, plural) => {
    const u = LX.UNITS[key][cell.words];
    return Array.isArray(u) ? u[plural ? 1 : 0] : u;
  };

  /** Fraction words n/d (band 6-9: unit words for halves and quarters). */
  const fracWords = (n, d) => (band === "6-9" && W.unitFractions[`${n}/${d}`]) || fill(W.fraction, { n: intWords(String(n), W), d: intWords(String(d), W) });
  const mixedWords = (w, n, d) => (band === "6-9" && `${n}/${d}` === "1/2")
    ? fill(W.mixedHalf, { w: intWords(w, W) }) : fill(W.mixed, { w: intWords(w, W), f: fracWords(n, d) });

  /** Right operand for a relational template with {r}: a lone (signed) number or variable, nothing attached. */
  function simpleRight(j) {
    let k = skip(j), neg = false;
    if (["−", "-"].includes(t[k]?.s) && t[k + 1]?.k === "num") { neg = true; k++; }
    const tok = t[k];
    if (!tok || !(tok.k === "num" || isVarTok(tok))) return null;
    const after = t[skip(k + 1)];
    if (after && (after.k === "sup" || ["/", "%", "^", "°", ":"].includes(after.s) || (after.k === "word" && LX.UNITS[after.s]))) return null;
    if (t[k + 1]?.k === "sup" || t[k + 1]?.k === "word") return null;
    const words = tok.k === "num" ? numWords(tok.s, W) : tok.s;
    return { words: neg ? `${W.minus} ${words}` : words, end: k + 1 };
  }
  const rightIsOperand = (j) => {
    const k = skip(j), tok = t[k];
    if (!tok) return false;
    if (tok.k === "num" || isVarTok(tok) || ["(", "√", "∛", "π", "₹"].includes(tok.s) || LX.VULGAR[tok.s]) return true;
    return ["−", "-"].includes(tok.s) && t[k + 1]?.k === "num";
  };

  /** After a number's words: powers, units, degrees, percent. Returns [words, nextIndex]. */
  function suffixes(words, raw, j) {
    // power: 10⁵, 2³, 5^4, 10^-2
    if (t[j]?.k === "sup") return [power(words, supDigits(t[j].s)), j + 1];
    if (t[j]?.s === "^") {
      let k = j + 1, neg = "";
      if (["−", "-"].includes(t[k]?.s)) { neg = "-"; k++; }
      if (t[k]?.k === "num" && isInt(t[k].s)) return [power(words, neg + t[k].s), k + 1];
      if (isVarTok(t[k])) return [fill(W.power.n, { b: words, e: (neg ? W.minus + " " : "") + t[k].s }), k + 1];
    }
    // units: 25 cm², 9.8 m/s², 60 km/h, 2.5 kg, 3 m³; "sq cm"
    const k = skip(j), spaced = k > j;
    if (t[k]?.k === "word" && t[k].s === "sq" && t[k + 1]?.k === "sp" && isUnit(k + 2, true)) {
      return [`${words} ${fill(W.squareUnit, { u: unitName(t[k + 2].s, plural(raw)) })}`, k + 3];
    }
    if (isUnit(k, spaced)) {
      let u = unitName(t[k].s, plural(raw)), e = k + 1;
      if (t[e]?.k === "sup") {
        const p = supDigits(t[e].s);
        if (p === "2") u = fill(W.squareUnit, { u }); else if (p === "3") u = fill(W.cubicUnit, { u });
        e++;
      }
      if (t[e]?.s === "/" && isUnit(e + 1, true)) {
        let u2 = unitName(t[e + 1].s, false);
        e += 2;
        if (t[e]?.k === "sup" && supDigits(t[e].s) === "2") { u2 = fill(W.perSquare, { u: u2 }); e++; }
        u = `${u} ${W.perUnit} ${u2}`;
      }
      return [`${words} ${u}`, e];
    }
    // degrees: −3 °C, 37°C, 90°
    if (t[k]?.s === "°") {
      const c = skip(k + 1);
      const scale = t[c]?.k === "word" && (t[c].s === "C" ? W.celsius : t[c].s === "F" ? W.fahrenheit : null);
      if (scale) return [`${words} ${scale[plural(raw) ? "many" : "one"]}`, c + 1];
      return [`${words} ${W.degreeAngle[plural(raw) ? "many" : "one"]}`, k + 1];
    }
    if (t[k]?.s === "%") return [fill(W.percent, { x: words }), k + 1];
    return [words, j];
  }
  const plural = (raw) => (W.unitPlural === false ? false : !isOne(raw));
  function power(b, e) {
    if (e === "2") return fill(W.power[2], { b });
    if (e === "3") return fill(W.power[3], { b });
    const ew = e.startsWith("-") ? `${W.minus} ${intWords(e.slice(1), W)}` : intWords(e, W);
    return fill(W.power.n, { b, e: ew });
  }

  /** A number token at i (and what it governs). Returns the next index. */
  function number(i) {
    const raw = t[i].s;
    // ordinal: 1st, 22nd, 10th
    if (isInt(raw) && t[i + 1]?.k === "word" && ORD_SUFFIX.has(t[i + 1].s) && !(t[i + 2] && LETTER.test(t[i + 2].s[0]))) {
      emitWords(ordinal(raw));
      return i + 2;
    }
    // times-table chant (band 6-9): 7 × 8 = 56
    if (band === "6-9" && isInt(raw)) {
      const o = skip(i + 1), b = skip(o + 1), eq = skip(b + 1), c = skip(eq + 1);
      if (["×", "x", "X", "*"].includes(t[o]?.s) && t[b]?.k === "num" && t[eq]?.s === "=" && t[c]?.k === "num"
        && isInt(t[b].s) && isInt(t[c].s) && +raw * +t[b].s === +t[c].s && W.chantForm[+t[b].s]) {
        emitWords(fill(W.chant, { a: intWords(raw, W), bForm: W.chantForm[+t[b].s], c: intWords(t[c].s, W) }));
        return c + 1;
      }
    }
    // mixed number: 2 1/3 (not a date), 2½
    if (isInt(raw) && t[i + 1]?.k === "sp" && t[i + 2]?.k === "num" && t[i + 3]?.s === "/" && t[i + 4]?.k === "num"
      && isInt(t[i + 2].s) && isInt(t[i + 4].s) && +t[i + 2].s < +t[i + 4].s && +t[i + 4].s > 0 && t[i + 5]?.s !== "/") {
      emitWords(mixedWords(raw, +t[i + 2].s, +t[i + 4].s));
      return i + 5;
    }
    if (isInt(raw) && t[i + 1]?.k === "ch" && LX.VULGAR[t[i + 1].s]) {
      const [n, d] = LX.VULGAR[t[i + 1].s];
      emitWords(mixedWords(raw, n, d));
      return i + 2;
    }
    // fraction: 3/4, 22/7 (a/b/c is a date: left alone below)
    if (isInt(raw) && t[i + 1]?.s === "/" && t[i + 2]?.k === "num" && isInt(t[i + 2].s) && +t[i + 2].s > 0 && t[i + 3]?.s !== "/" && t[i - 1]?.s !== "/") {
      emitWords(fracWords(+raw, +t[i + 2].s));
      return i + 3;
    }
    // clock time h:mm (two-digit minutes, no ratio cue before it), else ratio a:b(:c)
    if (isInt(raw) && t[i + 1]?.s === ":" && t[i + 2]?.k === "num" && isInt(t[i + 2].s)) {
      const before = text.slice(Math.max(0, t[i].at - 30), t[i].at).toLowerCase();
      const ratioCue = LX.RATIO_CUES.some((c) => before.includes(c));
      if (!ratioCue && +raw <= 23 && /^[0-5]\d$/.test(t[i + 2].s) && t[i + 3]?.s !== ":") {
        let words = clock(+raw, +t[i + 2].s);
        // the text already says the clock word after it (7:30 baje): do not say it twice
        const nw = t[skip(i + 3)];
        if (nw?.k === "word" && W.time.clockWords?.includes(nw.s.toLowerCase()) && W.time.clockWord) {
          words = words.replace(new RegExp(`\\s*${W.time.clockWord}$`), "");
        }
        emitWords(words);
        return i + 3;
      }
      let words = intWords(raw, W), k = i;
      while (t[k + 1]?.s === ":" && t[k + 2]?.k === "num" && isInt(t[k + 2].s)) {
        words = fill(W.ratio, { a: words, c: intWords(t[k + 2].s, W) });
        k += 2;
      }
      emitWords(words);
      return k + 1;
    }
    // decade: the 1990s
    if (/^1[1-9]\d0$|^20\d0$/.test(raw) && t[i + 1]?.k === "word" && t[i + 1].s === "s" && !(t[i + 2] && ALPHA.test(t[i + 2].s[0]))) {
      emitWords(fill(W.decade, { x: +raw < 2000 ? year(+raw) : intWords(raw, W) }).replace(/(?<=[a-z])ys$/, "ies"));
      return i + 2;
    }
    // year: in 1947, सन् 1857, 1526 AD
    if (/^1[1-9]\d\d$/.test(raw)) {
      const p = t[i - 1]?.k === "sp" ? t[i - 2] : t[i - 1];
      const n = t[skip(i + 1)];
      if ((p?.k === "word" && LX.YEAR_CUES.includes(p.s.toLowerCase())) || (n?.k === "word" && LX.YEAR_SUFFIXES.some((s) => s.replace(".", "") === n.s))) {
        emitWords(year(+raw));
        return i + 1;
      }
    }
    // range: 3-5, 10–15 (an unspaced hyphen in a maths sentence is a minus, handled by the operator walk)
    {
      const dashAt = t[i + 1]?.s === "–" ? i + 1 : (t[i + 1]?.k === "sp" && t[i + 2]?.s === "–") ? i + 2 : -1;
      const hy = t[i + 1]?.s === "-" && t[i + 2]?.k === "num" && !mathy;
      if (hy || (dashAt > 0 && t[skip(dashAt + 1)]?.k === "num")) {
        const [pre] = W.range.split("{c}");
        emitWords(fill(pre, { a: numWords(raw, W) }));
        operand = false;
        return hy ? i + 2 : skip(dashAt + 1);
      }
    }
    const [words, next] = suffixes(numWords(raw, W), raw, i + 1);
    emitWords(words);
    return next;
  }

  function ordinal(raw) {
    const n = +raw;
    if (cell.words === "hi") return W.ordinal.irregular[n] ?? fill(W.ordinal.regular, { x: intWords(raw, W) });
    const words = intWords(raw, W);
    const m = words.match(/^(.*?)([a-z]+)$/);
    const [, head, last] = m;
    const irr = W.ordinal.irregular[last];
    return head + (irr ?? (last.endsWith("y") ? last.slice(0, -1) + "ieth" : last + "th"));
  }
  function clock(h, m) {
    const tm = W.time, hw = (x) => W.below100[cell.words === "hi" && x % 12 === 0 ? 12 : x];
    if (cell.words === "hi") {
      const h12 = h % 12 === 0 ? 12 : h % 12;
      if (m === 0) return fill(tm.oclock, { h: hw(h) });
      if (m === 15) return fill(tm.quarterPast, { h: hw(h12) });
      if (m === 30) return tm.halfSpecial[h12] ?? fill(tm.half, { h: hw(h12) });
      if (m === 45) return fill(tm.quarterTo, { next: hw((h12 % 12) + 1) });
      return fill(tm.plain, { h: hw(h), m: W.below100[m] });
    }
    if (m === 0) return fill(tm.oclock, { h: hw(h) });
    if (m < 10) return fill(tm.oh, { h: hw(h), m: W.below100[m] });
    return fill(tm.plain, { h: hw(h), m: W.below100[m] });
  }
  function year(n) {
    const hi = W.below100[Math.floor(n / 100)], lo = n % 100;
    if (lo === 0) return fill(W.year.hundred, { hi });
    return fill(lo < 10 ? W.year.oh : W.year.plain, { hi, lo: W.below100[lo] });
  }

  for (let i = 0; i < t.length;) {
    const tok = t[i];

    // ₹ amounts (and Rs / INR): ₹12.50, ₹1,250, ₹2 lakh, ₹5/kg, ₹45/-
    if (tok.s === "₹" || (tok.k === "word" && LX.RUPEE_PREFIXES.has(tok.s))) {
      let j = i + 1;
      if (tok.k === "word" && t[j]?.s === ".") j++;
      j = skip(j);
      if (t[j]?.k === "num") {
        const raw = t[j].s;
        j++;
        let scale = null;
        const s = skip(j);
        if (t[s]?.k === "word" && LX.AMOUNT_SCALES[t[s].s.toLowerCase()] ) { scale = LX.AMOUNT_SCALES[t[s].s.toLowerCase()]; j = s + 1; }
        let words;
        const [ip, fp] = raw.split(".");
        if (scale) words = fill(W.currency, { r: `${numWords(raw, W)} ${W.scale[scale]}`, ru: W.rupee.many });
        else if (fp !== undefined && fp.length <= 2 && /[1-9]/.test(fp)) {
          const p = fp.length === 1 ? +fp * 10 : +fp;
          const pa = W.paise[p === 1 ? "one" : "many"];
          words = +ip.replace(/,/g, "") === 0 ? `${intWords(String(p), W)} ${pa}`
            : fill(W.currencyPaise, { r: intWords(ip, W), ru: W.rupee[isOne(ip) ? "one" : "many"], p: intWords(String(p), W), pa });
        } else if (fp !== undefined && /^0+$/.test(fp)) words = fill(W.currency, { r: intWords(ip, W), ru: W.rupee[isOne(ip) ? "one" : "many"] });
        else words = fill(W.currency, { r: numWords(raw, W), ru: W.rupee[isOne(raw) ? "one" : "many"] });
        if (t[j]?.s === "/" && t[j + 1]?.s === "-") j += 2;                     // ₹45/-
        else if (t[j]?.s === "/" && isUnit(j + 1, true)) { words += ` ${W.perUnit} ${unitName(t[j + 1].s, false)}`; j += 2; }
        emitWords(words);
        operand = true;
        i = j;
        continue;
      }
    }

    // a bracketed lone (signed) number: (−2) → minus two
    if (tok.s === "(") {
      let j = skip(i + 1), neg = false;
      if (["−", "-"].includes(t[j]?.s) && t[j + 1]?.k === "num") { neg = true; j++; }
      const close = skip(j + 1);
      if (t[j]?.k === "num" && t[close]?.s === ")") {
        emitWords((neg ? `${W.minus} ` : "") + numWords(t[j].s, W));
        operand = true;
        i = close + 1;
        continue;
      }
    }

    // unary minus: −7, -3 °C (a hyphen glued to a word on its left is a compound, not a sign)
    if ((tok.s === "−" || tok.s === "-") && !operand && (t[i + 1]?.k === "num" || (tok.s === "−" && isVarTok(t[i + 1])))
      && !(tok.s === "-" && t[i - 1] && t[i - 1].k !== "sp" && t[i - 1].k !== "ch")) {
      emitWords(W.minus);
      i++;
      continue;
    }

    if (tok.k === "num") {
      i = number(i);
      operand = true;
      continue;
    }

    // variables with powers: a²b³, x^2, n^n
    if (isVarTok(tok) && (t[i + 1]?.k === "sup" || (t[i + 1]?.s === "^" && (t[i + 2]?.k === "num" || isVarTok(t[i + 2]) || ["−", "-"].includes(t[i + 2]?.s))))) {
      const [w, next] = suffixes(tok.s, "2", i + 1);
      emitWords(w, false);
      operand = true;
      i = next;
      continue;
    }

    // roots: √49, ∛27, √x
    if ((tok.s === "√" || tok.s === "∛") && (t[skip(i + 1)]?.k === "num" || isVarTok(t[skip(i + 1)]))) {
      const j = skip(i + 1);
      const [x, next] = t[j].k === "num" ? suffixes(numWords(t[j].s, W), t[j].s, j + 1) : [t[j].s, j + 1];
      emitWords(fill(W.root[tok.s === "√" ? 2 : 3], { x }), t[j].k === "num");
      operand = true;
      i = next;
      continue;
    }

    // ½ ¼ ¾ …
    if (tok.k === "ch" && LX.VULGAR[tok.s]) {
      const [n, d] = LX.VULGAR[tok.s];
      emitWords(fracWords(n, d));
      operand = true;
      i++;
      continue;
    }

    if (tok.s === "π") { emitWords(W.pi); operand = true; i++; continue; }

    // ∠ABC, △PQR
    if ((tok.s === "∠" || tok.s === "△") && t[skip(i + 1)]?.k === "word" && /^[A-Z]{1,4}$/.test(t[skip(i + 1)].s)) {
      const j = skip(i + 1);
      const letters = t[j].s.split("").map((ch) => W.letters?.[ch] ?? ch).join(" ");
      emitWords(`${tok.s === "∠" ? W.angle : W.triangle} ${letters}`);
      operand = true;
      i = j + 1;
      continue;
    }

    // a fraction with a variable on top: x/4
    if (isVarTok(tok) && t[i + 1]?.s === "/" && t[i + 2]?.k === "num" && isInt(t[i + 2].s)) {
      emitWords(fill(W.fraction, { n: tok.s, d: intWords(t[i + 2].s, W) }), false);
      operand = true;
      i += 3;
      continue;
    }

    // binary operators between operands; "x" as times between two numbers
    const opName = OPS[tok.s] ?? ((tok.s === "x" || tok.s === "X") && t[i - 1]?.k === "sp" && t[i + 1]?.k === "sp" && t[i - 2]?.k === "num" && t[i + 2]?.k === "num" ? "times" : null);
    if (opName && operand && rightIsOperand(i + 1) && !(tok.s === "-" && t[i - 1]?.k !== "sp" && !mathy)) {
      const tpl = W.ops[opName];
      if (tpl.includes("{r}")) {
        const r = simpleRight(i + 1);
        if (r) { emitWords(fill(tpl, { r: r.words }).replace(/^,\s*/, ", ")); if (out.at(-2) === " " && out.at(-1).startsWith(",")) out.splice(-2, 1); operand = true; i = r.end; continue; }
        emitWords(W.opsInfix[opName]);
      } else emitWords(tpl);
      operand = false;
      i++;
      continue;
    }

    // anything else is passed through untouched
    emitRaw(tok.s);
    if (tok.k !== "sp") operand = isVarTok(tok) || tok.s === ")" || (tok.k === "word" && /^[A-Z]$/.test(tok.s));
    i++;
  }
  return out.join("");
}

// ───────────── entry points ─────────────

/**
 * Written teacher text → the spoken form for one mode × school medium × age band.
 * @param {string} text
 * @param {{ mode?: "english"|"hinglish"|"hindi", schoolMedium?: "english"|"hindi"|"other", ageBand?: "6-9"|"10-15", safety?: string[] }} [opts]
 * @returns {string}
 */
export function toSpoken(text, opts = {}) {
  const s = String(text ?? "");
  if (!NOTATION.test(s)) return s;
  const cell = cellFor(opts);
  const { W } = cell;
  let x = s.replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x966));
  x = x.replace(opts.safety ? safetyRe(opts.safety) : SAFETY_RE, (m) => digitsWords(m, W));
  x = phones(x, W);
  x = formulae(x, W);
  return render(x, cell);
}

/** The options for a child row (+ the lesson's ageBand when known). */
export function spokenOptsForChild(child, ageBand) {
  const band = ageBand === "6-9" || ageBand === "10-15" ? ageBand : (child?.class_level ?? 9) <= 4 ? "6-9" : "10-15";
  return { mode: MODES[child?.language_pref] ?? "hinglish", schoolMedium: child?.school_medium ?? undefined, ageBand: band };
}
