// ClauseAligner (HUMAN-VOICE §5.2, B2): fits a MomentPlan to the guarded reply's clauses, in code.
//
// THE CONTENT LAW (HV-2): the plan's clause texts, joined with single spaces, minus inserted fillers (and minus the
// stripped uptake echo, which the prelude has already said), equal the guarded reply byte for byte apart from
// whitespace. It is asserted on every plan (preserved()); a mismatch returns null and the plain reply is spoken.
// The only wording change allowed is ONE filler at the start of clause 0, from the row's closed inventory, never on a
// turn that opens with praise or a correction and never when the reply already opens with a discourse word.
// Self-corrections ("पहले… पहले tens") are NOT generated: a restart is a wording change a child can copy, and the owner's
// rule sends no "..." to the voice (w2g-no-self-correction).
//
// Clauses never cut a TTS part: the reply is first split with the SAME splitSentences() the speech pipeline uses, then
// each part at `, ; : — …` followed by a space (so 1,50,000 and 3.5 stay whole). Each clause carries `part` (its TTS
// part index), which is how the pause realiser and the clause events line up with the audio.
import { splitSentences } from "../sentences.js";
import { momentPlan, fillersFor } from "./moment.js";

/** @typedef {import("../../../shared/contracts").DeliveryPlan} DeliveryPlan */
/** @typedef {import("../../../shared/contracts").DeliveryClause} DeliveryClause */

const ws = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
// a clause boundary: , ; : — – … "..." or a sentence end (. ! ? ।, a part may hold two short sentences), followed by
// whitespace; an em/en dash may also stand alone. "3.5" and "1,50,000" never match (no space after the mark).
const CUT = /(\.{3,}|…|[,;:]|[.!?।॥]+["'”’)\]]*|\s[—–]|—)(?=\s|$)/g;
const ABBREV = new Set(["rs", "dr", "mr", "mrs", "ms", "no", "st", "vs", "etc", "e.g", "i.e", "approx", "w.r.t"]);
const SENT_END = /[.!?।॥]["'”’)\]]*$/;
const OPENS_WITH_DISCOURSE = /^(?:achha|accha|acha|achcha|hmm+|haan|han|ha|toh|to|so|okay|ok|arre|are|dekho|chalo|well|oh|umm+|अच्छा|हम्म|हाँ|हां|तो|अरे|देखो|चलो)\b/iu;
const OPENS_WITH_PRAISE_OR_CORRECTION = /^(?:shabash|shaabaash|wah|waah|wow|great|well done|bahut badhiya|badhiya|sahi|bilkul|perfect|excellent|correct|right|yes|nahi|nahin|not quite|almost|galat|oops|शाबाश|वाह|बिल्कुल|सही|नहीं)\b/iu;

/** Split one TTS part into clauses (texts only), keeping the boundary mark on the left clause. */
export function clausesOf(part) {
  const t = ws(part);
  const out = [];
  let last = 0;
  for (const m of t.matchAll(CUT)) {
    const end = m.index + m[0].length;
    if (m[0] === ".") {
      const word = t.slice(last, m.index).split(" ").pop() ?? "";
      if (ABBREV.has(word.toLowerCase()) || /^[A-Z]$/.test(word)) continue;
    }
    // never cut inside a number group ("1, 2 and 3" is a list: cutting there is fine; "1,50,000" never matches: no space)
    const piece = t.slice(last, end).trim();
    if (piece && /[\p{L}\p{N}]/u.test(piece)) { out.push(piece); last = end; }
  }
  const tail = t.slice(last).trim();
  if (tail) {
    if (out.length && !/[\p{L}\p{N}]/u.test(tail)) out[out.length - 1] += " " + tail;
    else out.push(tail);
  }
  return out.length ? out : [t];
}

/** Deterministic variety in [lo, hi] from the reply text and the clause index (reproducible across replicas). */
export function vary(lo, hi, seed) {
  if (hi <= lo) return lo;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.round(lo + ((h >>> 0) % 1000) / 999 * (hi - lo));
}

/** The arc value for clause i of n. */
const arcAt = (arc, i, n) => (n <= 1 ? arc[0] : i === 0 ? arc[0] : i === n - 1 ? arc[2] ?? arc[arc.length - 1] : arc[1]);

/**
 * align(reply, moment) → DeliveryPlan | null. Pure; null = speak the plain reply.
 * @param {string} reply the guarded reply
 * @param {import("../../../shared/brain").Moment} moment
 * @returns {(DeliveryPlan & { row: string, licence: string[], fillerCandidates: string[], prelude?: { text: string } }) | null}
 */
export function align(reply, moment) {
  const text = ws(reply);
  if (!text) return null;
  const mp = momentPlan(moment);
  const parts = splitSentences(text);
  /** @type {(DeliveryClause & { part: number, sentenceStart: boolean, stripped?: string })[]} */
  const clauses = [];
  parts.forEach((p, pi) => {
    let sentenceStart = true;
    for (const c of clausesOf(p)) {
      clauses.push({ text: c, part: pi, sentenceStart, emotion: "neutral", intensity: mp.intensity, pace: "normal", pauseBeforeMs: 0, nonverbalBefore: "none" });
      sentenceStart = SENT_END.test(c);
    }
  });
  const n = clauses.length;
  clauses.forEach((c, i) => {
    c.emotion = arcAt(mp.arc, i, n);
    c.pace = i === 0 ? mp.pace[0] : i === n - 1 && mp.lastPace ? mp.lastPace : mp.pace[1];
    if (i === 0) return;
    const prev = clauses[i - 1];
    const seed = `${text}#${i}`;
    let pause = SENT_END.test(prev.text) || prev.part !== c.part ? vary(mp.sentencePause[0], mp.sentencePause[1], seed)
      : /(?:\.{3,}|…)$/.test(prev.text) ? vary(250, 380, seed) : vary(mp.commaPause[0], mp.commaPause[1], seed);
    if (i === n - 1 && mp.lastPause) pause = Math.max(pause, vary(mp.lastPause[0], mp.lastPause[1], seed + "L"));
    if (mp.askPause && /\?["'”’)]*$/.test(c.text)) pause = Math.max(pause, mp.askPause);
    c.pauseBeforeMs = mp.register === "safety" ? (prev.part !== c.part || SENT_END.test(prev.text) ? 300 : 0) : pause;
  });
  // licensed non-verbal: before clause 0 (hum / breath opening a think-aloud or a hook, a chuckle after the child's
  // laugh), or a breath before the reveal / a long clause. Kept for telemetry and the face; engines without a native
  // rendering emit nothing (caps.js, owner: no clips).
  if (mp.licence.length && n) {
    const first = mp.licence.find((k) => k === "chuckle" || k === "laugh" || k === "hum");
    if (first) clauses[0].nonverbalBefore = first;
    else if (mp.licence.includes("breath")) {
      const long = clauses.findIndex((c, i) => i > 0 && c.text.split(/\s+/).length >= 12);
      const at = long > 0 ? long : mp.row === "hook" && n > 1 ? n - 1 : clauses[0].text.split(/\s+/).length >= 12 ? 0 : -1;
      if (at >= 0) clauses[at].nonverbalBefore = "breath";
    } else if (mp.licence.includes("sigh_relief")) clauses[0].nonverbalBefore = "sigh_relief";
  }
  // uptake prelude (TEACHER-BRAIN §5.4 L3): the child's own token is spoken first by the prelude; a leading echo of it
  // is stripped from clause 0 so she does not say it twice.
  let prelude;
  const tok = moment?.uptakePrelude?.text && mp.register !== "safety" ? String(moment.uptakePrelude.text).trim() : "";
  if (tok && n) {
    prelude = { text: tok };
    const re = new RegExp(`^${tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[\\s,!.?।-]+|$)`, "iu");
    const m = re.exec(clauses[0].text);
    if (m && clauses[0].text.length > m[0].length) {
      clauses[0].stripped = m[0];
      clauses[0].text = clauses[0].text.slice(m[0].length);
    }
  }
  // the filler candidate (the governor confirms or drops it)
  const candidates = fillersFor(mp);
  if (candidates.length && n && !OPENS_WITH_DISCOURSE.test(clauses[0].text) && !OPENS_WITH_PRAISE_OR_CORRECTION.test(text)) {
    const f = candidates[0];
    clauses[0].filler = f;
    clauses[0].text = `${f}, ${clauses[0].text}`;
  }
  const plan = { v: /** @type {1} */ (1), lang: mp.lang, register: mp.register, clauses, source: /** @type {"moment"} */ ("moment"),
    row: mp.row, licence: mp.licence, fillerCandidates: candidates, pitch: mp.pitch, ...(prelude ? { prelude } : {}) };
  return preserved(plan, text) ? plan : null;
}

/** Remove the inserted filler from a clause text (exact prefix the aligner wrote). */
export const withoutFiller = (c) => (c.filler && c.text.startsWith(`${c.filler}, `) ? c.text.slice(c.filler.length + 2) : c.text);

/** HV-2: the clause texts minus fillers (plus any stripped uptake echo) equal the reply, modulo whitespace. */
export function preserved(plan, reply) {
  if (!plan?.clauses?.length) return false;
  const joined = plan.clauses.map((c, i) => (i === 0 && c.stripped ? c.stripped : "") + withoutFiller(c)).join(" ");
  return ws(joined) === ws(reply);
}
