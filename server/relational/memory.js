// Round 3, stream relational-human: the memory she USES — callbacks (RELATIONAL-OS §8; ROS-8), built and gated in code.
// docs/design/round3/relational-human/RESEARCH.md §4.
//
// What a good teacher remembers and brings back (and the research behind each: RESEARCH.md §4.1): what the child found
// hard last time and whether it came good (teacher noticing, Jacobs et al. 2010; "last time this needed a hint, today it
// did not"), the method they explained in their own words (revoicing, O'Connor & Michaels 1993), and what they care about,
// used as the CONTEXT of an example (interest-based personalisation: Walkington 2013, n = 145, effects that outlasted the
// personalisation; memory-based personalisation kept 8-10-year-olds engaged and closer over five sessions: Ligthart et al.
// HRI 2022, n = 46). What a companion does and this never does (the floor): memory as a hook — "I missed you", "you
// promised", absence, gap length, a streak, a personal life story pulled up to hold a child (De Freitas et al. 2025:
// 37% of companion farewells used such tactics; Common Sense Media 2025: companions "unacceptable" under 18).
//
// The legal shape is RELATIONAL-OS §8.1 and learner/mode.js, unchanged: the LEARNING record is M1 (the academic record,
// the `learning_profile` consent); interests the PARENT chose and the child's own "win" memories ride the `memory`
// consent; what the child said they like (tier B) is M2+ and P3 — not written at the launch default M1, so not read here
// either; tier C (life events, jokes, people) is never built.
//
// Everything here is PURE (no clock, no I/O): the seam (seam.js) loads the rows once per lesson at start.
import { unsafeChildPhrase } from "../conversation/screen.js";
//   callbackCandidates(rec)            → CallbackCandidate[]  (closed fragments: notes, never lines she could say)
//   pickCallback(cands, ctx)           → the ONE callback this turn may carry, or null (≤ 1 per lesson, gated)
//   memoryClaims(reply) / claimProblem → the post-hoc claim check (F9): a past-reference she has no record for
//   keepsOf(consent)                   → what she truthfully keeps (the shape a "do you remember me?" turn gets)

/** Moves on which a callback may ride (an explanation, an example, an opener, a practice question). Never a correction,
 *  a hint, a re-teach, a safeguard, a wrap or a repair: the kernel's own rules refuse a notice in a correction too. */
const CALLBACK_MOVES = new Set(["hook", "greet", "warmup", "retrieval", "explain", "worked_example", "practice", "probe"]);
/** The opener window: a callback to last time belongs at the start of a lesson (the OPEN ritual, RO §8.3). */
export const OPEN_TURNS = 3;
/** A fragment is a note, telegraphic, ≤ 16 words, no quote, no first or second person, no address term. */
const SAYABLE = /["“”'‘’]|\b(?:i|me|my|you|your|tum|tumhe|tumhara|aap|aapka|main|mera|mujhe)\b/i;

const clip = (s, n = 60) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
// round 3 fix (adversarial N2): a memory row is model-written text from the child's words, and a callback renders it LAST in
// her instructions ("OPEN THIS TURN WITH what you remember of them"). Round 2's law applies (model-lifted child words never
// enter her instructions unscreened: conversation/screen.js unsafeChildPhrase), plus what a cheerful opener must never
// carry: fear, hurt, sadness, illness, a person in their life ("is scared of an uncle at home" passed before this).
const NOT_AN_OPENER = /(?<![\p{L}])(?:scared|afraid|fear|frighten\w*|darr?|darta|darti|darte|dar lagta|hurt\w*|hit|hits|beat\w*|maar\w*|pita\w*|cry\w*|cried|ro(?:ta|ti|te|ya|yi)|sad|dukhi|udaas|udas|lonely|alone|akel[ai]|bully|bullied|teased|mazaak|mocked|sick|ill|illness|hospital|beemar|bimar|died|dead|death|mar gaya|mar gayi|fight\w*|ladai|jhagda|secret|raaz|uncle|aunty|auntie|stranger|neighbou?r|padosi|marry|shaadi|love|pyaar|crush|best friend|forever)(?![\p{L}])/iu;
const openerSafe = (t) => !unsafeChildPhrase(t) && !NOT_AN_OPENER.test(String(t ?? ""));
const words = (s) => String(s ?? "").toLowerCase().normalize("NFC").split(/[^\p{L}\p{M}\p{N}]+/u).filter((w) => w.length >= 3);

/**
 * @typedef {{ skillId: string, title: string, wrong: number, unaided: number, unaidedAfterWrong: boolean, explained: boolean }} LastSkill
 * @typedef {{ lessonId: string, topicId: string, topicTitle: string, skills: LastSkill[] }} LastLesson
 * @param {{ last?: LastLesson | null, memories?: { id: string|number, kind: string, text: string, lessonId?: string|null }[],
 *   interests?: string[], allow: { learning: boolean, memory: boolean } }} rec
 * @returns {import("../../shared/relational").CallbackCandidate[]}
 */
export function callbackCandidates(rec) {
  const out = [];
  const add = (c) => { if (c.fragment && !SAYABLE.test(c.fragment) && c.fragment.split(/\s+/).length <= 16) out.push(c); };
  const last = rec?.last;
  const cite = (lessonId) => ({ lessonId: String(lessonId ?? ""), turnIdx: [0] });
  if (rec?.allow?.learning && last?.lessonId) {
    for (const s of last.skills ?? []) {
      const title = clip(s.title, 48);
      if (!title) continue;
      if (s.unaidedAfterWrong) add({ id: `L:retry:${s.skillId}`, kind: "L", tags: ["open", `skill:${s.skillId}`], fragment: `last lesson · ${title} · a few tries, then right unaided`, cite: cite(last.lessonId) });
      else if (s.explained) add({ id: `L:explained:${s.skillId}`, kind: "L", tags: ["open", `skill:${s.skillId}`], fragment: `last lesson · explained ${title} in their own words`, cite: cite(last.lessonId) });
      else if (s.wrong >= 2 && s.unaided === 0) add({ id: `L:again:${s.skillId}`, kind: "L", tags: [`skill:${s.skillId}`], fragment: `last lesson · ${title} · still being learnt · worth one more go today`, cite: cite(last.lessonId) });
    }
    if (last.topicTitle) add({ id: `L:topic:${last.topicId}`, kind: "L", tags: ["open"], fragment: `last lesson · ${clip(last.topicTitle, 56)}`, cite: cite(last.lessonId) });
  }
  if (rec?.allow?.memory) {
    for (const m of rec.memories ?? []) {
      const t = clip(m.text, 90);
      if (t && openerSafe(m.text)) add({ id: `W:mem:${m.id}`, kind: "W", tags: ["open"], fragment: `from an earlier lesson · ${t}`, cite: cite(m.lessonId) });
    }
    for (const i of (rec.interests ?? []).slice(0, 3)) {
      const t = clip(i, 30);
      if (t) add({ id: `P:int:${t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-")}`, kind: "P", tags: ["example"], fragment: `an interest their parent chose · ${t} · as the context of one example`, cite: { lessonId: "", turnIdx: [0] } });
    }
  }
  return out;
}

/** Order inside the opener window: a growth crossing first, then a method they explained, a win, then the topic. */
const OPEN_ORDER = ["L:retry:", "L:explained:", "W:mem:", "L:topic:"];

/**
 * PURE. The ONE callback this turn may carry, or null.
 * @param {import("../../shared/relational").CallbackCandidate[]} cands
 * @param {{ turn: number, move?: string, skillId?: string | null, sessions: number, used: string | null, blocked: boolean,
 *   callbacksOff?: boolean, withdrawn?: boolean }} ctx
 */
export function pickCallback(cands, ctx) {
  if (!cands?.length || ctx.used || ctx.blocked || ctx.callbacksOff || ctx.withdrawn) return null;
  // never in the first meeting: a callback needs a last time (sessions counts ended lessons)
  if (!(Number(ctx.sessions) >= 1)) return null;
  if (!CALLBACK_MOVES.has(String(ctx.move ?? ""))) return null;
  const skillTag = ctx.skillId ? `skill:${ctx.skillId}` : null;
  // deixis: the item on the table is the skill a learning callback is about
  const deictic = skillTag ? cands.find((c) => c.kind === "L" && c.tags.includes(skillTag)) : null;
  if (deictic) return deictic;
  if (ctx.turn <= OPEN_TURNS) {
    for (const p of OPEN_ORDER) { const c = cands.find((x) => x.id.startsWith(p) && x.tags.includes("open")); if (c) return c; }
  }
  // an interest as the context of an example, on an explanation or a worked example
  if (ctx.move === "explain" || ctx.move === "worked_example") return cands.find((c) => c.kind === "P") ?? null;
  return null;
}

// ───────────── the claim check (F9; RELATIONAL-OS §8.5) ─────────────
// A past-reference about the CHILD: "last time / pichhli baar / yesterday (kal ... tha)" or "you told me / tumne bataya
// tha / aapne kaha tha / you said". Teaching recall cues ("yaad hai, face kya hota hai?") and the item's own words are
// not claims about the child's past.
const PAST_REF = /(?<![\p{L}\p{M}])(?:last time|last lesson|last class|the other day|earlier lesson|previous lesson|pichhli baar|pichli baar|pichhle (?:lesson|class|baar|hafte)|pichle (?:lesson|class|baar)|पिछली बार|पिछले (?:लेसन|क्लास|पाठ|बार))(?![\p{L}\p{M}])/iu;
// "tumne apne kutte ke baare mein bataya tha" (memory-2day 2026-10-09, before arm: a made-up yes to a trap question) has
// words between "tumne" and "bataya tha": up to 6 are allowed
const TOLD = /(?<![\p{L}\p{M}])(?:you (?:told|said|mentioned)|you'?d (?:told|said)|tumne(?: \S+){0,6} (?:bataya|kaha|bola) tha|tumne mujhe bataya|aapne(?: \S+){0,6} (?:bataya|kaha|bola) tha|tum(?:ne)? bata rahe the|तुमने(?: \S+){0,6} (?:बताया|कहा|बोला) था|आपने(?: \S+){0,6} (?:बताया|कहा|बोला) था)(?![\p{L}\p{M}])/iu;
/** A sentence that says she does NOT have it ("pichhli baar ka topic mujhe dikh nahi raha", "I don't remember") is the
 *  honest answer, not a claim. */
const NOT_HELD = /(?:yaad|dikh|pata)(?: \S+){0,2} (?:nahi|nahin|nhi)|(?:nahi|nahin) (?:yaad|pata)|(?:don'?t|do not|can'?t|cannot) (?:remember|recall|see)|याद नहीं|नहीं पता/iu;

/** The memory claims in her reply (sentences with a past-reference about the child), [] when none. */
export function memoryClaims(reply) {
  return String(reply ?? "").split(/(?<=[.!?।;—])\s+/u).filter((s) => (PAST_REF.test(s) || TOLD.test(s)) && !NOT_HELD.test(s));
}

/**
 * A claim she has no record for: a past-reference sentence whose content words are found neither in the callback she was
 * given this turn nor in this lesson's own child turns (in-session facts). The kit content on the table is deliberately
 * NOT support: "pichhli baar humne cube ke faces gine the" in a first lesson on cubes is made of kit words and is still a
 * fabrication. In a first meeting (hasPast === false) any "last time" sentence is one. null = clean.
 * Content words: ≥ 3 letters, minus the function words of English and Hinglish (CLAIM_STOP) — the callback fragment is an
 * English note and she says it in Hinglish ("faces gine mein kuch tries lage"), so only content words can be compared.
 * @param {string} reply
 * @param {{ callback?: { fragment: string } | null, sessionText?: string, hasPast?: boolean }} ctx
 * @returns {{ claim: string } | null}
 */
export function claimProblem(reply, ctx = {}) {
  const pool = new Set([...words(ctx.callback?.fragment), ...words(ctx.sessionText)]);
  for (const claim of memoryClaims(reply)) {
    if (ctx.hasPast === false && PAST_REF.test(claim)) return { claim: claim.slice(0, 160) };
    const content = words(claim).filter((w) => !CLAIM_STOP.has(w));
    if (!content.length) continue;
    const known = content.filter((w) => pool.has(w)).length;
    if (known / content.length < 0.34) return { claim: claim.slice(0, 160) };
  }
  return null;
}
const CLAIM_STOP = new Set(["last", "time", "lesson", "class", "you", "told", "said", "mentioned", "tumne", "aapne", "bataya", "kaha", "bola", "tha", "thi", "the",
  "pichhli", "pichli", "pichhle", "pichle", "baar", "that", "this", "and", "aur", "hai", "hain", "was", "were", "mujhe", "humne", "hamne", "kiya", "kiye", "kia", "did", "about",
  "पिछली", "पिछले", "बार", "तुमने", "आपने", "बताया", "कहा", "था", "थी", "और", "है", "हमने", "किया", "with", "kaise", "how", "what", "kya", "yaad", "remember",
  // Hinglish function words and evaluatives (a Hinglish sentence against an English note compares on content words only)
  "mein", "main", "kuch", "thoda", "thode", "thodi", "lage", "laga", "lagi", "lagta", "phir", "fir", "khud", "sahi", "kiya", "kiye", "the", "ki", "ke", "ka",
  "toh", "bhi", "nahi", "nahin", "jab", "tab", "tumhe", "tumko", "tumhara", "tumhari", "tumhare", "aapko", "aapka", "aapki", "aapke", "hum", "humne", "abhi",
  "aaj", "wala", "wali", "wale", "raha", "rahe", "rahi", "karna", "karte", "karke", "kar", "liye", "saath", "par", "bahut", "accha", "achha", "acha", "achhe",
  "chalo", "dekho", "bas", "baad", "pehle", "ekdum", "bilkul", "wahi", "vahi", "woh", "yeh", "isme", "usme", "unhe", "apne", "apna", "apni", "gaye", "gayi", "gaya",
  "then", "few", "some", "got", "right", "again", "after", "before", "own", "your", "their", "they", "them", "had", "has", "very", "well", "really", "just",
  "हम", "में", "कुछ", "फिर", "खुद", "सही", "बहुत", "अच्छा", "तुम्हें", "आपको", "लगे", "लगा"]);

/**
 * What she truthfully keeps, for the turn that asks ("do you remember me?", "will you remember?"): the shape id the
 * policy overlays. Learning across days needs `learning_profile` (and a mode above M0); the parent's interest picks and the
 * child's wins need `memory`.
 * @param {{ learning: boolean, memory: boolean }} allow
 */
export function keepsOf(allow) {
  if (allow?.learning && allow?.memory) return "memory_keeps_learning_and_likes";
  if (allow?.learning) return "memory_keeps_learning";
  return "memory_keeps_nothing";
}
