/**
 * The expected-answer grammar (ARCHITECTURE.md v2 §2.5.1): "is this a complete answer of the asked FORM?", from the
 * transcript alone, with zero silence. "62" after "27 + 35?" is complete the moment words covering the audio say "62".
 *
 * Verdict-blind by construction: the input is `ExpectedAnswer` (form, slots, units, options), never the key, so a right
 * and a wrong value of the same shape read identically (law 5; `duplex-verdict-blind-timing`).
 *
 * Also reads the self-repair state on values (law 3, fast mouth late verdict): a repair marker after the last value means
 * the correction is still coming (`repairOpen`); a later, different value means it came (`repaired`).
 * Pure, synchronous, erasable TypeScript.
 */
import type { ExpectedAnswer, FormState } from "./engine.ts";
import { tokens, valuesOf, FRACTION_JOIN, DECIMAL_JOIN, type ValueSpan } from "./numerals.ts";

/** Words that may close a value without opening anything: copula / verb-final closes, address tails, the tag "na". */
const CLOSERS = new Set([
  "है", "हैं", "होता", "होती", "होते", "होगा", "होगी", "होंगे", "आता", "आती", "आएगा", "बनता", "बनती", "बनेगा", "बचता", "बचेगा",
  "hai", "hain", "hota", "hoti", "hote", "hoga", "aata", "banta", "bachta",
  "दीदी", "didi", "मैम", "मैडम", "maam", "madam", "mam", "sir", "सर", "जी", "ji", "ना", "na", "naa", "बस", "bas",
  "is", "are", "only", "exactly", "हुआ", "हुए", "hua", "मिलता", "मिलेगा", "आया",
]);
/** Words that keep the answer open when they come after the last value. */
const OPENERS = new Set([
  "और", "aur", "and", "plus", "प्लस", "minus", "माइनस", "गुणा", "guna", "into", "times", "भाग", "divided", "से", "se",
  "या", "ya", "or", "मतलब", "matlab", "यानी", "yaani", "means", "फिर", "phir", "then", "लेकिन", "lekin", "but", "पर", "par",
  "क्योंकि", "kyunki", "because", "तो", "toh", "to", "so", "की", "का", "के", "ki", "ka", "ke", "of", "in", "में", "mein",
  "कि", "वो", "woh", "wo", "उम्म", "um", "umm", "hmm", "हम्म", "अं",
]);
const YES = new Set(["हां", "हा", "हाँ", "haan", "han", "haa", "haanji", "yes", "yeah", "yup", "ji", "जी", "बिल्कुल", "bilkul", "sahi"]);
const NO = new Set(["नहीं", "नही", "nahi", "nahin", "no", "nope", "ना", "न", "galat", "गलत"]);
const ORDINAL: Record<string, number> = {
  "पहला": 1, "पहले": 1, "पहली": 1, "pehla": 1, "pehli": 1, "first": 1, "a": 1, "ए": 1,
  "दूसरा": 2, "दूसरे": 2, "दूसरी": 2, "dusra": 2, "doosra": 2, "dusri": 2, "second": 2, "b": 2, "बी": 2,
  "तीसरा": 3, "तीसरे": 3, "तीसरी": 3, "teesra": 3, "tisra": 3, "third": 3, "c": 3, "सी": 3,
  "चौथा": 4, "चौथे": 4, "चौथी": 4, "chautha": 4, "fourth": 4, "d": 4, "डी": 4,
};
/** Self-repair markers (Study B §7.3, Study C P9). Multi-word ones are matched on the joined tail. */
const REPAIR_MULTI = /(?:^| )(?:नहीं नहीं|नही नही|nahi nahi|nahin nahin|no no|no wait|i mean|मतलब नहीं|matlab nahi|oh no|ओह नहीं|wait wait|एक सेकंड नहीं|sorry sorry)(?= |$)/u;
const REPAIR_SINGLE = new Set(["sorry", "सॉरी", "सारी", "galti", "गलती", "wait", "वेट", "actually", "एक्चुअली", "oops"]);

export interface FormRead {
  state: FormState;
  values: string[];
  lastValue: string | null;
  /** Token index of the last value's last token (-1 when none). */
  lastValueEnd: number;
  /** Tokens after the last value. */
  tailTokens: number;
  repairOpen: boolean;
  repaired: boolean;
  /** Short machine reason ("integer", "fraction_needs_denominator", "trailing_opener"...). */
  reason: string;
}

const isUnit = (w: string, units: string[] | undefined): boolean =>
  !!units?.some((u) => { const n = tokens(u); return n.length > 0 && n[n.length - 1] === w; });

/** Token indices of self-repair markers. For yes/no items "नहीं" is a value, not a marker. */
function repairMarkers(toks: string[], yesNo: boolean): number[] {
  const at: number[] = [];
  toks.forEach((w, i) => { if (REPAIR_SINGLE.has(w) || (!yesNo && NO.has(w))) at.push(i); });
  if (!yesNo) {
    const joined = toks.join(" ");
    for (const m of joined.matchAll(new RegExp(REPAIR_MULTI.source, "gu"))) {
      const before = joined.slice(0, (m.index ?? 0) + m[0].length).trim();
      if (before) at.push(before.split(" ").length - 1);
    }
  }
  return at.sort((a, b) => a - b);
}

function repairState(toks: string[], vals: ValueSpan[], yesNo: boolean, slots: number): { repairOpen: boolean; repaired: boolean } {
  if (!vals.length) return { repairOpen: false, repaired: false };
  const marks = repairMarkers(toks, yesNo);
  const last = vals[vals.length - 1];
  // a marker after the last value ("तीन बटा आठ… नहीं नहीं"): the correction is still coming
  if (marks.some((m) => m > last.end)) return { repairOpen: true, repaired: false };
  // a value after a marker that itself follows an earlier value ("चौबीस… नहीं, बीस"): the correction came
  const came = marks.some((m) => vals.some((a) => a.end < m) && last.start > m);
  const distinct = vals.length > slots && vals[vals.length - 1].v !== vals[vals.length - 2].v;
  // yes/no: a different answer later ("हाँ… नहीं नहीं, नहीं होता")
  return { repairOpen: false, repaired: came || distinct };
}

function yesNoValues(toks: string[]): ValueSpan[] {
  const out: ValueSpan[] = [];
  toks.forEach((w, i) => {
    if (YES.has(w)) out.push({ v: "yes", kind: "integer", start: i, end: i, open: false });
    else if (NO.has(w)) out.push({ v: "no", kind: "integer", start: i, end: i, open: false });
  });
  // "नहीं नहीं" / "हाँ हाँ" repeated is one value
  return out.filter((v, k) => k === 0 || v.v !== out[k - 1].v || v.start !== out[k - 1].end + 1);
}

function choiceValues(toks: string[], options: string[] | undefined): ValueSpan[] {
  const out: ValueSpan[] = [];
  const optToks = (options ?? []).map((o) => tokens(o)).filter((o) => o.length);
  toks.forEach((w, i) => {
    if (ORDINAL[w] !== undefined && (w.length > 1 || toks.length <= 2)) out.push({ v: `opt${ORDINAL[w]}`, kind: "integer", start: i, end: i, open: false });
    optToks.forEach((o, k) => { if (o[o.length - 1] === w && (o.length === 1 || toks.slice(Math.max(0, i - o.length + 1), i + 1).join(" ") === o.join(" "))) out.push({ v: `opt${k + 1}`, kind: "integer", start: i - o.length + 1, end: i, open: false }); });
  });
  // "दूसरा वाला" is ONE pick: the ordinal and the option label covering it are the same value (M-D7 a09 read it as two
  // values, form "overfull", and waited for the backstop)
  out.sort((a, b) => a.start - b.start || b.end - a.end);
  return out.filter((v, k) => !out.slice(0, k).some((u) => u.v === v.v && v.start <= u.end && v.end >= u.start));
}

/** The tail after the last value: closed (only closers/units), open (an opener last), or other words. */
function tailKind(toks: string[], from: number, units: string[] | undefined): "none" | "closed" | "open" | "other" {
  const tail = toks.slice(from);
  if (!tail.length) return "none";
  const last = tail[tail.length - 1];
  if (OPENERS.has(last) || FRACTION_JOIN.has(last) || DECIMAL_JOIN.has(last)) return "open";
  if (tail.every((w) => CLOSERS.has(w) || isUnit(w, units) || /^(?:cm|m|km|kg|g|l|ml|rs|₹|°)$/.test(w))) return "closed";
  return "other";
}

/**
 * Read the transcript against the expected form. `expected` null → "not_applicable" (open contexts).
 * The hold lexicon runs BEFORE this in the host (M-D6 h01: "एक मिनट" first visible as "एक" was read as the value 1).
 */
export function readForm(text: string, expected: ExpectedAnswer | null): FormRead {
  const toks = tokens(text);
  const base = { values: [] as string[], lastValue: null as string | null, lastValueEnd: -1, tailTokens: toks.length, repairOpen: false, repaired: false };
  if (!expected || expected.form === "open") return { ...base, state: "not_applicable", reason: "no_form" };
  if (!toks.length) return { ...base, state: "none", reason: "empty" };
  const form = expected.form;
  const slots = Math.max(1, expected.slots || 1);
  let vals: ValueSpan[];
  if (form === "yes_no") vals = yesNoValues(toks);
  else if (form === "choice") vals = choiceValues(toks, expected.options);
  else if (form === "word" || form === "phrase") vals = [];
  else vals = valuesOf(toks);
  const rep = repairState(toks, vals, form === "yes_no", slots);
  const values = vals.map((v) => v.v);
  const last = vals[vals.length - 1];
  const out = { ...base, values, lastValue: last ? last.v : null, lastValueEnd: last ? last.end : -1, tailTokens: last ? toks.length - 1 - last.end : toks.length, ...rep };

  if (form === "word" || form === "phrase") {
    const t = tailKind(toks, toks.length - 1, expected.units);
    if (t === "open") return { ...out, state: "pending", reason: "trailing_opener" };
    // a content word with no open tail is complete AS IS, but a longer phrase is always possible (no key to check)
    return { ...out, state: "prefix_ambiguous", reason: "content_no_key" };
  }
  if (!last) return { ...out, state: "none", reason: "no_value" };
  if (rep.repairOpen) return { ...out, state: "pending", reason: "repair_open" };
  const tk = tailKind(toks, last.end + 1, expected.units);
  if (tk === "open") return { ...out, state: "pending", reason: "trailing_opener" };
  // distinct values beyond the slots: a list, a recitation ("सात आठ छप्पन") or a repair; the last value restarts stability
  const distinct = new Set(values).size;
  if (form === "fraction") {
    if (last.kind !== "fraction") return { ...out, state: "pending", reason: "fraction_needs_denominator" };
    if (last.open) return { ...out, state: "prefix_ambiguous", reason: "denominator_may_grow" };
  } else if (form === "decimal") {
    if (last.kind === "integer") return { ...out, state: last.open ? "pending" : "prefix_ambiguous", reason: "decimal_part_may_follow" };
  } else if (form === "number_unit") {
    if (last.open) return { ...out, state: "prefix_ambiguous", reason: "value_may_grow" };
    if (tk === "none") return { ...out, state: "prefix_ambiguous", reason: "unit_may_follow" };
  } else if (form === "integer") {
    if (last.open) return { ...out, state: last.end > last.start && FRACTION_JOIN.has(toks[last.end]) ? "pending" : "prefix_ambiguous", reason: "value_may_grow" };
  }
  // words after the value: a short tail that ends verb-final ("आठ corners होते हैं") closes the answer (Hindi is
  // verb-final); a bare noun after it ("छह faces") may still continue ("…और बारह edges") unless the Director named it a unit
  if (tk === "other" && form !== "yes_no" && form !== "choice") {
    const tail = toks.slice(last.end + 1);
    const verbFinal = CLOSERS.has(tail[tail.length - 1]) && tail.length <= 4 && !tail.some((w) => OPENERS.has(w));
    if (!verbFinal) return { ...out, state: "prefix_ambiguous", reason: "words_after_value" };
  }
  if (vals.length < slots) return { ...out, state: "pending", reason: "slots_unfilled" };
  if (distinct > slots && !rep.repaired) return { ...out, state: "overfull", reason: "more_values_than_slots" };
  return { ...out, state: "complete", reason: form };
}
