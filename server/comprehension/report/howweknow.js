// Parent-facing "how we know" (COMPREHENSION-ENGINE.md §7, CE11): evidence rows, never verdicts, state names or
// labels. Rows are slot shapes rendered by code in EN / Hinglish / HI. Until the K7 calibration gate passes no row says
// mastered / learned / understood / can do, and `durable` wording stays locked. A lexicon gate guards every string.
import { shapeById } from "../probes/shapes.js";
import { outcomeName } from "../../learner/kt/outcomes.js";

const ROWS = {
  started: { en: "Started {concept} this week.", hinglish: "{concept} is hafte shuru kiya.", hi: "{concept} इस हफ़्ते शुरू किया।" },
  mixup: { en: "Working on a common mix-up: {belief}. Being checked.", hinglish: "Ek aam confusion par kaam: {belief}. Check ho raha hai.", hi: "एक आम उलझन पर काम: {belief}। देखा जा रहा है।" },
  shallow: { en: "Gets the answers on their own. Next we will look at whether the reason is clear to them too.", hinglish: "Answers khud se sahi. Ab dekhenge ki idea bhi clear hai.", hi: "जवाब ख़ुद से सही। अब देखेंगे कि बात भी साफ़ है।" },
  fragile: { en: "Explained it in their own words on {date}. We will look again in a few days.", hinglish: "{date} ko apne shabdon mein samjhaya. Kuch din baad phir dekhenge.", hi: "{date} को अपने शब्दों में बताया। कुछ दिन बाद फिर देखेंगे।" },
  refresh: { en: "Due for a quick refresh.", hinglish: "Ek chhota refresh baaki hai.", hi: "एक छोटा दोहराव बाक़ी है।" },
  kept: { en: "Still had it {n} {days} later, and used it in a new kind of problem.", hinglish: "{n} din baad bhi yaad tha, aur naye tarah ke sawaal mein lagaya.", hi: "{n} दिन बाद भी याद था, और नए तरह के सवाल में लगाया।" },
  durable: { en: "Kept it for a month.", hinglish: "Ek mahine baad bhi pakka.", hi: "एक महीने बाद भी पक्का।" },
};
const WHAT = {
  A: { en: "explained it to a pretend character", hinglish: "ek pretend character ko samjhaya", hi: "एक काल्पनिक पात्र को बताया" },
  B: { en: "spotted what was wrong in a pretend friend's idea", hinglish: "ek pretend dost ki galti pakdi", hi: "एक काल्पनिक दोस्त की ग़लती पकड़ी" },
  C: { en: "compared two ways and said which works", hinglish: "do tareeke compare kiye", hi: "दो तरीक़े मिलाकर देखे" },
  D: { en: "predicted what would happen before we showed it", hinglish: "dikhane se pehle bataya kya hoga", hi: "दिखाने से पहले बताया कि क्या होगा" },
  E: { en: "used it inside a story", hinglish: "kahani ke andar use kiya", hi: "कहानी के अंदर इस्तेमाल किया" },
  F: { en: "found it in their own world", hinglish: "apni duniya mein dhoondha", hi: "अपनी दुनिया में ढूँढा" },
  G: { en: "showed it on a picture or object", hinglish: "picture ya cheez par dikhaya", hi: "तस्वीर या चीज़ पर दिखाया" },
  H: { en: "used it again days later", hinglish: "kuch din baad phir use kiya", hi: "कुछ दिन बाद फिर इस्तेमाल किया" },
  I: { en: "used it in a game", hinglish: "game mein use kiya", hi: "खेल में इस्तेमाल किया" },
  item: { en: "worked a problem", hinglish: "ek sawaal kiya", hi: "एक सवाल किया" },
};
const HELP = { 0: { en: "on their own", hinglish: "khud se", hi: "ख़ुद से" }, 1: { en: "after one hint", hinglish: "ek hint ke baad", hi: "एक संकेत के बाद" },
  2: { en: "after two hints", hinglish: "do hint ke baad", hi: "दो संकेत के बाद" },
  3: { en: "with a worked step", hinglish: "ek step dikhane ke baad", hi: "एक क़दम दिखाने के बाद" }, 4: { en: "after being shown", hinglish: "dikhane ke baad", hi: "दिखाने के बाद" } };
const CHECKED = { code: { en: "exact answer", hinglish: "exact answer", hi: "सटीक जवाब" },
  llm: { en: "AI-checked against the book's key idea", hinglish: "AI ne book ke main idea se milaya", hi: "AI ने किताब के मुख्य विचार से मिलाया" },
  human: { en: "a teacher", hinglish: "teacher ne dekha", hi: "शिक्षक ने देखा" } };
const STILL = { en: " (still working on it)", hinglish: " (abhi practice chal rahi hai)", hi: " (अभी अभ्यास चल रहा है)" };
/** "1 day" / "3 days" (en); the Hindi and Hinglish words do not change with the number. */
const DAYS = (n) => ({ en: n === 1 ? "day" : "days", hinglish: "", hi: "" });

/** Banned in parent text (LM §11 lexicon gate, EN + HI + Roman HI). */
export const PARENT_BANNED = Object.freeze(["weak", "kamzor", "kamjor", "slow", "lazy", "rank", "percentile", "topper", "behind", "below average", "marks",
  "score", "mastered", "learned", "understood", "can do", "mood", "anxious", "effort", "personality", "confidence", "engagement", "hesitat", "voice", "pause",
  "test", "exam", "quiz", "कमज़ोर", "कमजोर", "धीमा", "समझ गया", "सीख लिया"]);
const BANNED_RE = new RegExp(`(^|[^\\p{L}])(${PARENT_BANNED.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "iu");
/** The matched banned word, or null. */
export const parentLexiconHit = (s) => { const m = BANNED_RE.exec(String(s)); return m ? m[2] : null; };

const fill = (tpl, slots) => tpl.replace(/\{(\w+)\}/g, (_, k) => String(slots[k] ?? ""));
const day = (iso) => String(iso ?? "").slice(0, 10);

/**
 * One concept card: the row for the belief's state plus evidence chips. Throws if any string trips the gate.
 * @param {any} b belief (state.js beliefFor) @param {{ concept: string, belief?: string, lang?: 'en'|'hinglish'|'hi', k7?: boolean, now?: string }} o
 */
export function conceptCard(b, { concept, belief: misBelief, lang = "en", k7 = false, now } = {}) {
  const L = (row) => row[lang] ?? row.en;
  const rows = [];
  const pos = b.reasons.filter((r) => r.moved.includes("U") || r.moved.includes("T"));
  if (b.state === "not_yet") rows.push(b.reason === "wrong_idea_confirmed" && misBelief ? fill(L(ROWS.mixup), { belief: misBelief }) : fill(L(ROWS.started), { concept }));
  else if (b.state === "shallow") rows.push(L(ROWS.shallow));
  else if (b.state === "fragile") rows.push(fill(L(ROWS.fragile), { date: day(pos.at(-1)?.at ?? now) }));
  else if (b.state === "understood" || (b.state === "durable" && !k7)) {
    const n = Math.max(1, Math.round(Math.max(...b.reasons.map((r) => r.delayDays ?? 0), 1)));
    rows.push(fill(L(ROWS.kept), { n, days: L(DAYS(n)) }).replace(/\s{2,}/g, " "));
  }
  else rows.push(L(ROWS.durable));
  if (b.refresh) rows.push(L(ROWS.refresh));
  const chips = b.reasons.slice(-4).map((r) => {
    const fam = shapeById(r.shapeId)?.family ?? (r.via === "weave" || r.via === "callback" ? "H" : "item");
    const ok = !["none", "low", "missed", "fail", "C4", "wrong", "other", "misconception", "mapped_wrong"].includes(outcomeName(r.cls, r.outcome));
    return [day(r.at), L(WHAT[fam] ?? WHAT.item) + (ok ? "" : L(STILL)),
      L(HELP[r.help] ?? HELP[0]), L(CHECKED[r.grader] ?? CHECKED.code)].join(" · ");
  });
  for (const s of [...rows, ...chips]) { const hit = parentLexiconHit(s); if (hit) throw new Error(`howweknow: banned word "${hit}" in parent text`); }
  return { skillId: b.skillId, rows, chips };
}
