// Linguistic features, Tier T (SIGNALS-SPEC §2.3 L1-L16). Pure function of the child's transcript, the classify output and
// the item: no clock, no I/O, no model. Consumed features (L6, L12, L14, L17, L18) are read from their owners, never
// recomputed here. Nothing returned is a word about the child: these are counts and flags about the TEXT.
import { readUtterance } from "../learner/affect.js";
import { compile, findAll, negated, norm, numberOf, ownWords, tokens, isDevanagari } from "./text.js";
import { HEDGE, HEDGE_START } from "./lexicon/hedge.js";
import { CANT_RECALL } from "./lexicon/recall.js";
import { ASK_TO_TRY, EXTEND, METHOD_VERBS, PROPOSE_METHOD, RELATED } from "./lexicon/initiative.js";
import { CLARIFY, WHAT, WHAT_IF, WHY_HOW } from "./lexicon/question.js";
import {
  CONNECTIVE_END, HINT_ASK, LAUGH, META_BREAK, META_REPEAT, META_SLOW, PLANNING, PURE_FILLER, REPAIR, SARCASM, STOP, THINK_ALOUD,
} from "./lexicon/discourse.js";
import { EN, ROMAN_HI } from "./lexicon/lang.js";

const anyHit = (toks, lex, { allowNegated = true } = {}) => findAll(toks, lex).some((h) => allowNegated || !negated(toks, h));
const RECOVERED = compile(["yaad aaya", "yaad aa gaya", "yaad aa gayi", "yaad aa gya", "याद आया", "याद आ गया", "remembered", "i remember now", "got it now"]);
const RETRY = compile(["ek aur try", "phir se try", "fir se try", "dobara try", "try again", "let me try again", "ek baar aur", "phir se karti", "phir se karta", "फिर से"]);

/**
 * @param {{ childText: string, cls?: any, item?: any, teacherLast3?: string[], langModeHint?: string, verdict?: string }} input
 */
export function readText(input) {
  const raw = String(input.childText ?? "");
  const own = ownWords(raw);
  const toks = tokens(own);
  const allToks = tokens(raw);
  const words = allToks.filter((t) => t !== "?" && !PURE_FILLER.test(t));
  const act = input.cls?.signals?.act ?? null;
  const kit = kitTokens(input.item);
  const ru = readUtterance(own);

  // L1: idk split. The act (classify) wins when present; the regex + recall lexicon is the fallback, ≤ 8 words.
  let idk = null;
  // "bhool gaya tha par ab yaad aaya" is recovered recall, not a can't-recall (ES-4-informed: post-fix numbers are optimistic).
  const recovered = anyHit(toks, RECOVERED);
  const recallHit = words.length <= 10 && !recovered && anyHit(toks, CANT_RECALL, { allowNegated: false });
  // "not sure, 5?" carries an answer: that is a hedge (L2), not an idk.
  const hasAnswer = toks.some((t) => numberOf(t) != null || kit.has(t));
  const lexIdk = recallHit ? "cant_recall" : ru.dontKnow && !hasAnswer ? "not_known" : null;
  const actIdk = act === "idk_cant_recall" ? "cant_recall" : act === "idk_not_known" ? "not_known" : null;
  if (actIdk) idk = { v: actIdk, conf: lexIdk === actIdk ? "both" : "act" };
  else if (lexIdk) idk = { v: lexIdk, conf: "lexical" };

  // L2: hedge. "lagta hai" only as a bare opening stance; a lone tag question never counts.
  const startsStance = findAll(toks, HEDGE_START).some((h) => h.start === 0 && h.end < toks.length && (numberOf(toks[h.end]) != null || kit.has(toks[h.end])));
  const hedge = anyHit(toks, HEDGE) || startsStance;

  // L4: filler or planning marker before the first answer-content token.
  const lead = fillerLead(toks, kit);

  // L5 (in-turn): two answer candidates separated by a repair marker, graded separately against the key.
  const repairDir = inTurnRepair(toks, input.item, kit);

  // L7 meta requests (act first), L8 help asks.
  let metaRequest = null;
  if (act === "meta_break" || anyHit(toks, META_BREAK, { allowNegated: false })) metaRequest = "break";
  else if (act === "meta_slow" || anyHit(toks, META_SLOW, { allowNegated: false })) metaRequest = "slow";
  else if (anyHit(toks, META_REPEAT)) metaRequest = "repeat";
  const helpAsk = ru.asksForAnswer ? "answer" : anyHit(toks, HINT_ASK, { allowNegated: false }) ? "hint" : null;

  // L9 question × depth. Depth reads hypotheticals (what-if) from the text with them KEPT.
  const qToks = tokens(ownWords(raw, { keepHypothetical: true }));
  // A "?" after a bare answer ("5?") is the STT's punctuation of a rise, not a question (and never a hedge: a Hindi
  // non-final rise reads the same way, R §5.2). A "?" counts only with a question word or without an answer candidate.
  const qMark = qToks.includes("?") && (anyHit(qToks, WHY_HOW) || anyHit(qToks, WHAT_IF) || anyHit(qToks, WHAT) || !hasAnswer);
  const asksQ = act === "question_curious" || act === "question_clarify" || qMark;
  let question = null;
  if (asksQ) {
    const type = act === "question_clarify" || anyHit(qToks, CLARIFY) ? "clarify" : "curious";
    const depth = anyHit(qToks, WHAT_IF) ? "what_if" : anyHit(qToks, WHY_HOW) ? "why_how" : anyHit(qToks, WHAT) ? "what" : null;
    question = { type, depth };
  } else if (anyHit(qToks, CLARIFY)) question = { type: "clarify", depth: null };

  // L10 initiative (negated hits are refusals, not initiative).
  let initiative = null;
  const ini = (lex) => anyHit(toks, lex, { allowNegated: false });
  if (ini(PROPOSE_METHOD)) initiative = "propose_method";
  else if (ini(ASK_TO_TRY)) initiative = "ask_to_try";
  else if (ini(EXTEND)) initiative = "extend";
  else if (ini(RELATED)) initiative = "related_topic";
  const methodLike = anyHit(toks, METHOD_VERBS) && words.length >= 3;

  // L11 alignment with the teacher's recent kit vocabulary; a verbatim echo is excluded (parroting guard).
  const align = alignment(toks, kit, input.teacherLast3 ?? []);

  // L12 share (consumed), L13 laugh token, sarcasm guard.
  const share = !!input.cls?.signals?.personalShare;
  // A laughter tag on a turn the acoustics mark as another speaker (A14: a parent, a sibling, the TV) is not the child's.
  const otherVoice = input.voice?.f?.speakerShift === 1;
  const laugh = !otherVoice && (LAUGH.test(raw) || !!input.cls?.signals?.humour);
  const sarcasm = SARCASM.test(raw);

  // I10 lexical half: think-aloud markers and a connective/filler at the end of the fragment.
  const last = toks.filter((t) => t !== "?").at(-1);
  const thinkAloudLex = anyHit(toks, THINK_ALOUD) || (!!last && (CONNECTIVE_END.has(last) || PURE_FILLER.test(last)));
  const retryLex = anyHit(toks, RETRY);

  return {
    words: words.length, toks, idk, hedge, fillerLead: lead, repairDir, metaRequest, helpAsk, question, initiative, methodLike,
    alignment: align.value, echo: align.echo, share, laugh, sarcasm, langMode: langMode(allToks, input.langModeHint),
    thinkAloudLex, retryLex, minimal: ru.minimal, fragment: initiative === "propose_method" ? fragmentOf(raw) : undefined,
  };
}

/** Kit vocabulary as a token set plus multi-token phrases (kit terms, representation names, the christened method label). */
function kitTokens(item) {
  const set = new Set();
  for (const term of item?.kitTerms ?? []) for (const t of tokens(term)) if (!STOP.has(t)) set.add(t);
  for (const t of tokens(item?.key ?? "")) if (!STOP.has(t)) set.add(t);
  return set;
}

const isContent = (t, kit) => numberOf(t) != null || kit.has(t) || (!PURE_FILLER.test(t) && !PLANNING.has(t) && !STOP.has(t) && t !== "?");

/** → { v: boolean, source: "lexical" } | null (null: no content token at all, so position is undefined). */
export function fillerLead(toks, kit = new Set()) {
  let fillers = 0;
  for (const t of toks) {
    if (PURE_FILLER.test(t) || PLANNING.has(t)) { fillers++; continue; }
    if (STOP.has(t) && !kit.has(t) && numberOf(t) == null) continue;
    if (isContent(t, kit)) return { v: fillers > 0, source: "lexical" };
  }
  return null;
}

/** In-turn repair direction from the first and last answer candidates around a repair marker. */
export function inTurnRepair(toks, item, kit = new Set()) {
  if (!item || (item.key == null && item.keyNum == null)) return null;
  const isCand = (t) => numberOf(t) != null || kit.has(t);
  const cands = [];
  toks.forEach((t, i) => { if (isCand(t)) cands.push(i); });
  if (cands.length < 2) return null;
  const repairs = findAll(toks, REPAIR);
  const a = cands[0], b = cands.at(-1);
  if (!repairs.some((r) => r.start > a && r.start < b)) return null;
  const right = (i) => gradeToken(toks[i], item);
  const ra = right(a), rb = right(b);
  if (ra == null || rb == null) return null;
  if (!ra && rb) return "wrong_to_right";
  if (ra && !rb) return "right_to_wrong";
  return "other";
}

function gradeToken(t, item) {
  if (item.keyNum != null) { const n = numberOf(t); return n == null ? null : Math.abs(n - item.keyNum) < 1e-9; }
  const key = tokens(item.key ?? "");
  return key.length === 1 ? t === key[0] : null;
}

/** L11: |child content ∩ teacher kit tokens (last 3 turns)| / |child content|; echo when the child adds nothing (≥ 80% and ≥ 3 tokens). */
export function alignment(toks, kit, teacherLast3) {
  const teacher = new Set(teacherLast3.flatMap((s) => tokens(s)).filter((t) => kit.size === 0 || kit.has(t)));
  const content = toks.filter((t) => !PURE_FILLER.test(t) && !PLANNING.has(t) && !STOP.has(t) && t !== "?");
  // A one-token answer ("5", "half") is an answer, not uptake of the teacher's words: alignment needs ≥ 2 content tokens.
  if (content.length < 2 || !teacher.size) return { value: null, echo: false };
  const hit = content.filter((t) => teacher.has(t)).length;
  const value = hit / content.length;
  const echo = content.length >= 3 && value >= 0.8;
  return { value: echo ? null : value, echo };
}

/** L16: ≥ 70% Hindi (Devanagari or Roman-Hindi function words) → hi; ≥ 70% English → en; else hinglish. */
export function langMode(toks, hint) {
  let hi = 0, en = 0;
  for (const t of toks) {
    if (t === "?") continue;
    if (isDevanagari(t)) { hi++; continue; }
    const h = ROMAN_HI.has(t), e = EN.has(t);
    if (h && !e) hi++;
    else if (e && !h) en++;
  }
  const n = hi + en;
  if (n < 2) return hint ?? null;
  if (hi / n >= 0.7) return "hi";
  if (en / n >= 0.7) return "en";
  return "hinglish";
}

/** The child's own words for CHRISTEN, ≤ 6 words (frame only, never stored). */
function fragmentOf(raw) {
  return String(raw).normalize("NFC").replace(/\s+/g, " ").trim().split(" ").slice(0, 6).join(" ");
}

export { norm };
