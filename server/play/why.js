// Round 8 Play H: the child's "why this game" line. DISPLAY TEXT ONLY: it never changes a level, a grade or a weight; it is
// built by code from the level's `because` records (server/play/choose.js), never by a model. PURE.
//
//   when    a level starts with a because of kind mix-up focus (play.pick_mixup, play.mixup_focus), step up (play.step_up),
//           step down (play.step_down) or family switch (play.switch). Never for a history fade, a Director fade or a
//           novelty / band-fit choice (those are the parent's, not hers).
//   what    one short line (≤ WHY_MAX chars filled), a shape picked by seed, in the level's language. `{look}` is a neutral
//           noun phrase for WHERE to look (data/play/engine-words.json look.<family>.<malRule>, else look.<family>): the
//           topic, never the belief, never the kit's misconception text.
//   time    "Pichhli baar" / "last time" / "पिछली बार" only when the because comes from an EARLIER session (its `when` is
//           "earlier": an open mix-up from kt_misconception); from this session (the level just played, the lesson she is
//           in) a form with no time word.
//   voice   `speak` is true the first time a reason is shown in a session (`said` holds the reasons already spoken); the
//           client still shows and does not speak it while the lesson's teacher is speaking (no two voices).
//
// Grammar (hard rules, tests/r8-play-why.test.mjs): in hi and hinglish `{look}` is always followed at once by a postposition
// (par / ko / ke · पर / को / के), so a look phrase is a bare noun phrase in the oblique and nothing agrees with it; in en
// `{look}` always follows a preposition (at / about) and is never the subject, so a look phrase carries its own article
// ("the ...") and no verb agrees with it. No praise words, no exclamation marks, no numbers, no "you" as the doer of a miss.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const WHY_MAX = 64;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** because kind → why reason (absent = no line) */
export const WHY_REASON = Object.freeze({
  "play.pick_mixup": "mixup", "play.mixup_focus": "mixup", "play.step_up": "up", "play.step_down": "down", "play.switch": "switch",
});
/** when a level carries several, the line says the most telling one */
const ORDER = ["switch", "mixup", "down", "up"];

/** The shapes: [id, { hinglish, en, hi }]. 1a is the only form with a time word (earlier sessions only). */
export const WHY_SHAPES = Object.freeze({
  mixupEarlier: [
    ["1a", { hinglish: "Pichhli baar {look} par ruke the, isliye aaj yeh wala.", en: "Last time we stopped at {look}, so this one today.", hi: "पिछली बार {look} पर रुके थे, इसलिए आज यह वाला।" }],
  ],
  mixupNow: [
    ["1b", { hinglish: "Aaj {look} ko dhyaan se dekhenge.", en: "Today we look closely at {look}.", hi: "आज {look} को ध्यान से देखेंगे।" }],
    ["1c", { hinglish: "Yeh khel {look} ke baare mein hai. Aaram se dekhna.", en: "This game is about {look}. Take it slowly.", hi: "यह खेल {look} के बारे में है। आराम से देखना।" }],
  ],
  up: [
    ["2a", { hinglish: "Pehli baar mein ho gaya. Ab ek kadam aage.", en: "Done on the first try. Now one step further.", hi: "पहली बार में हो गया। अब एक कदम आगे।" }],
    ["2b", { hinglish: "Ekdum saaf. Ab thoda bada wala.", en: "Very clean. Now a slightly bigger one.", hi: "एकदम साफ़। अब थोड़ा बड़ा वाला।" }],
  ],
  down: [
    ["3a", { hinglish: "Chalo, is baar thoda chhota wala.", en: "This time, a slightly smaller one.", hi: "चलो, इस बार थोड़ा छोटा वाला।" }],
    ["3b", { hinglish: "Ek aur, is baar halka sa.", en: "One more, a lighter one this time.", hi: "एक और, इस बार हल्का सा।" }],
  ],
  switch: [
    ["4a", { hinglish: "Wahi cheez, ab naye khel mein.", en: "The same thing, now in a new game.", hi: "वही चीज़, अब नए खेल में।" }],
    ["4b", { hinglish: "Chalo, isko ek alag tareeke se dekhte hain.", en: "Let us look at this another way.", hi: "चलो, इसे एक अलग तरीके से देखते हैं।" }],
  ],
});

let WORDS = null;
/** data/play/engine-words.json words (loaded once). Test seam: setWhyWords. */
function words() {
  if (!WORDS) { try { WORDS = JSON.parse(readFileSync(join(ROOT, "data/play/engine-words.json"), "utf8")).words ?? {}; } catch { WORDS = {}; } }
  return WORDS;
}
export function setWhyWords(w) { WORDS = w; }

const langOf = (l) => (l === "en" || l === "hi" ? l : "hinglish");

/** The look phrase for a family's mal-rule (else the family's), in a language; null when none is authored. */
export function lookFor(family, malRule, lang) {
  const w = words(), L = langOf(lang);
  const hit = (malRule ? w[`look.${family}.${malRule}`] : null) ?? w[`look.${family}`] ?? null;
  return hit ? hit[L] ?? hit.hinglish ?? null : null;
}

/** The mal-rule of a level that maps to a kit misconception id (level.mal: rule → kit id), or null. */
export const malRuleOf = (level, mis) => (mis ? Object.entries(level?.mal ?? {}).find(([, k]) => k === mis)?.[0] ?? null : null);

/** The reason a because record gives the child a line for, or null. */
export const reasonOf = (rec) => WHY_REASON[rec?.kind] ?? null;

const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/**
 * → { text, speak, reason, shape } | null.
 * @param {{ kind?: string, when?: "earlier"|"now", mis?: string }[] | null | undefined} because  the level's because records
 * @param {{ lang?: string, seed?: number|string, level?: { family?: string, mal?: Record<string,string> }, family?: string,
 *   said?: string[] }} ctx  said: the reasons already spoken this session
 */
export function whyLine(because, ctx = {}) {
  const recs = (Array.isArray(because) ? because : []).filter((r) => reasonOf(r));
  if (!recs.length) return null;
  const rec = recs.slice().sort((a, b) => ORDER.indexOf(reasonOf(a)) - ORDER.indexOf(reasonOf(b)))[0];
  const reason = reasonOf(rec);
  const L = langOf(ctx.lang);
  const family = ctx.level?.family ?? ctx.family ?? null;
  let shapes = WHY_SHAPES[reason];
  let look = null;
  if (reason === "mixup") {
    // the mal-rule her focus maps to, on THIS level (else the family's own phrase)
    const mis = rec.mis ?? recs.find((r) => r.mis)?.mis ?? null;
    look = family ? lookFor(family, malRuleOf(ctx.level, mis), L) : null;
    if (!look) return null;   // no neutral phrase: no line (never the belief text)
    shapes = rec.when === "earlier" ? [...WHY_SHAPES.mixupEarlier, ...WHY_SHAPES.mixupNow] : WHY_SHAPES.mixupNow;
  }
  const [id, forms] = shapes[hash(`${ctx.seed ?? 0}|${reason}`) % shapes.length];
  const text = forms[L].replace("{look}", look ?? "");
  if (text.length > WHY_MAX || /[!0-9]/.test(text)) return null;
  const said = Array.isArray(ctx.said) ? ctx.said : [];
  return { text, speak: !said.includes(reason), reason, shape: id };
}

/** The session's spoken reasons after a line (bounded: one per reason). */
export const nextSaid = (said, why) => (why?.speak ? [...new Set([...(said ?? []), why.reason])] : said ?? []);
