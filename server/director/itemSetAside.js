// Round 4 (stream 4A, patch request 13; main safety review 2026-10-10: direction approved, SHADOW FIRST): the item-context
// set-aside. A predicate hit on a child's answer is set aside ONLY when the words that fired are the current item's own
// verified words and the child added almost nothing of their own ("the strong bully the weak" to the c9-sst "police and
// courts stop working" item fired the safeguard and the helplines on a right answer).
//
// SHADOW ONLY in this build: the floor fires exactly as before. classify.js attaches what WOULD have been set aside to the
// predicate result (`setAsideWould`), and brain/trace.js turns it into closed codes on the brain_trace row (never the
// child's words: the item id is the row's own column, the masked span is recomputable offline from the stored turn).
// Turning it on needs every consumer of the turn's safety to read ONE decision (brain/turn.js and the seams it feeds):
// a separate patch, after >= 1 week or >= 200 shadow decisions from production, whichever is later (the review's rule).
//
// The rule (docs/design/round4/build/conversation/patches/13-item-context-set-aside.md), every condition must hold:
//   0. never a self_harm hit;
//   1. a current, posed, verified item;
//   2. the hit rests on the item's words (mask the child's tokens that are in the item's content: the rest must not fire);
//   3. at most MAX_NOVEL content words of the child's own;
//   4. absolute vetoes: first person (raw and garble-corrected), an adult actor, a harm / fear / weapon word, GUARD_VETO;
//   5. (on, later) the model distress read always runs on a set-aside turn.
// PURE apart from reading TAXILA_ITEM_SETASIDE.
import { scanSafetyDetail, guardFrameOf } from "./safety.js";
import { canonKey } from "../safety/normalize.js";
import { canonicalReadings } from "../safety/lexicon.js";

/** off | shadow | on (default shadow). "on" acts as shadow until the one-decision patch lands in brain/turn.js. */
export function itemSetAsideMode(env = process.env) {
  const v = String(env.TAXILA_ITEM_SETASIDE ?? "shadow").trim().toLowerCase();
  return v === "off" || v === "0" || v === "false" ? "off" : v === "on" ? "on" : "shadow";
}

export const MAX_NOVEL = 2;
const L = (s) => new RegExp(`(?<![\\p{L}\\p{M}])(?:${s})(?![\\p{L}\\p{M}])`, "iu");
// 4a: the child in the turn, singular or plural, Roman, Devanagari and transliterated English
const FIRST = L("i|i'm|im|me|my|mine|myself|we|us|our|ours|main|mai|maine|mujhe|mujhko|mujhse|mereko|mera|meri|mere|hum|humein|hume|hamein|hamara|hamari|hamare|humara|humari|humare|आई|आइ|मी|माई|माय|माइसेल्फ|मायसेल्फ|वी|अस|अवर|हम|हमें|हमारा|हमारी|हमारे|मैं|मैंने|मुझे|मुझको|मुझसे|मेरा|मेरी|मेरे");
const FIRST_CANON = /^(?:mujhe|mujhko|muje|mjhe|mereko|mera|meri|mere|main|mai|maine|mene|hum|hume|humein|hamein|hamara|hamari|hamare|humara|i|me|mi|my|mine|myself|miself|we|us|our)$/;
// 4b: an adult actor, anywhere in the turn (absolute: an item word does not excuse it)
const ACTOR = L("papa|pappa|pita|pitaji|dad|daddy|father|mummy|mumma|mom|mum|mother|maa|mama|mami|mamu|chacha|chachu|chachi|uncle|aunty|auntie|aunti|tau|tai|fufa|bua|mausi|mausa|bhaiya|bhaiyya|bhai|didi|brother|sister|cousin|sir|madam|teacher|coach|tutor|driver|guard|padosi|neighbour|neighbor|stranger|nana|nani|dada|dadi|baba|stepdad|stepmom|अंकल|आंटी|चाचा|चाची|मामा|मामी|पापा|मम्मी|भैया|भाई|दीदी|सर|मैडम|टीचर|पड़ोसी|बाबा");
// 4c: a harm / fear / weapon word, anywhere in the turn (absolute)
const HARM = L("knife|knives|chaku|chaaku|chhuri|blade|gun|weapon\\w*|rod|chain|hang|hangs|hanged|hanging|fansi|faansi|latak\\w*|hit|hits|hitting|beat|beats|beating|beaten|hurt|hurts|hurting|kill|kills|killed|die|dies|died|dead|slap\\w*|kick\\w*|punch\\w*|push\\w*|touch\\w*|threat\\w*|abuse\\w*|scare\\w*|afraid|fear|cry|cries|crying|blood|bleed\\w*|maar\\w*|mar(?:ta|te|ti|na|ne|a|i|o)|peet\\w*|pit(?:ta|te|ti|ai|na)|pitai|chhu\\w*|chu(?:a|e|i|ta|te|ti)|dhamk\\w*|dar|darr|darta|darti|darte|ro(?:ta|ti|te|na|ya|yi)|khoon|chot|thappad|gaali|dhakka|maarpeet|marpeet|मार\\S*|पीट\\S*|छू\\S*|धमक\\S*|डर\\S*|रो(?:ता|ती|ते|ना)|खून|चोट|थप्पड़|गाली|धक्का|मारपीट");
// function words that carry no content (never counted as the child's own): English, Hinglish
const STOP = new Set(("a an the and or but if so to of in on at for with by from as is are was were be been being am do does did has have had "
  + "doesn don didn isn wasn just will would could should might may can it its this that these those there here then than not no yes very also only "
  + "too who what which when where why how all any some each other others one two people log logon ko ki ka ke se mein me main par pe aur ya bhi hi "
  + "to toh hai hain tha the thi ho hota hoti hote kar karte karenge karega kya kaun koi kuch nahi na jo jab tab ab bas wo woh ye yeh is us un ek do")
  .split(" ").map((w) => canonKey(w) || w));
const toks = (t) => String(t ?? "").normalize("NFC").split(/[\s,.;:!?।"'“”‘’()—–-]+/u).filter(Boolean);
const key = (w) => canonKey(w.toLowerCase()) || w.toLowerCase();
const SKIP_FIELDS = new Set(["id", "skillId", "kind", "targetsMisconception", "verified", "difficulty"]);
const WORDS = new WeakMap();
/** The canonical words of an item's verified content: every string field (prompts, answer, acceptable, hints, options …). */
export function itemWords(item) {
  if (!item || typeof item !== "object") return new Set();
  const hit = WORDS.get(item);
  if (hit) return hit;
  const out = new Set();
  const visit = (o, k) => {
    if (k && SKIP_FIELDS.has(k)) return;
    if (typeof o === "string") for (const w of toks(o)) out.add(key(w));
    else if (Array.isArray(o)) o.forEach((x) => visit(x));
    else if (o && typeof o === "object") for (const [kk, v] of Object.entries(o)) visit(v, kk);
  };
  visit(item);
  WORDS.set(item, out);
  return out;
}
/** GUARD_VETO (server/director/safety.js, not exported): guardFrameOf returns no frame for a sport clause exactly when it holds. */
const guardVeto = (text) => guardFrameOf("abuse", String(text), "_", "cricket mein") === null;

/**
 * Would this predicate hit be set aside as an echo of the current item? PURE.
 * @param {{ text: string, item: any, posed: boolean, hit?: { distress: boolean, kind: string|null, via?: string|null } }} a
 * @returns {{ aside: boolean, why: string, via: string|null, novel: number, masked: number }}
 */
export function itemSetAside({ text, item, posed, hit }) {
  const h = hit ?? scanSafetyDetail(text);
  const out = (aside, why, extra = {}) => ({ aside, why, via: h.via ?? null, novel: 0, masked: 0, ...extra });
  if (!h.distress) return out(false, "no_hit");
  if (h.kind === "self_harm") return out(false, "self_harm");
  if (!item || !posed) return out(false, "no_item");
  if (item.verified?.agrees !== true) return out(false, "unverified");
  const tk = toks(text);
  if (tk.some((w) => FIRST.test(w)) || canonicalReadings(text).some((r) => r.split(" ").some((w) => FIRST_CANON.test(w)))) return out(false, "first_person");
  if (guardVeto(text)) return out(false, "guard");
  if (tk.some((w) => ACTOR.test(w))) return out(false, "actor");
  if (tk.some((w) => HARM.test(w))) return out(false, "harm");
  const words = itemWords(item);
  const novel = tk.filter((w) => { const k = key(w); return k.length >= 3 && !words.has(k) && !STOP.has(k) && !/^\d+$/.test(k); }).length;
  const masked = tk.filter((w) => words.has(key(w))).length;
  if (novel > MAX_NOVEL) return out(false, "novel", { novel, masked });
  if (scanSafetyDetail(tk.map((w) => (words.has(key(w)) ? "_" : w)).join(" ")).distress) return out(false, "rest_fires", { novel, masked });
  return out(true, "item_context", { novel, masked });
}
