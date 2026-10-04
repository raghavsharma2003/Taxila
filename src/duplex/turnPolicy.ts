// Study C candidate floor policy (docs/research/duplex/TURN-TAKING-CHILDREN.md §6, §8). NOT WIRED: a pure, drop-in
// alternative to src/lesson/turnModel.ts `textCompleteness/endThreshold/holdMsFor`, measured against it by
// evals/duplex/turn-markers.mjs (M-C1). It encodes what the turn-taking literature says about HOLD vs YIELD cues in
// Hindi/Hinglish child speech, as code (shapes and closed lexicons, never sentences):
//   - fillers are turn-initial/medial, never turn-final (Jabeen et al. 2022, Urdu/Hindi; Bona 2023, 9-year-olds 92% within-turn),
//     and the ASR spells them a dozen ways in two scripts (M-C1 F set) — so a filler-final fragment is HOLD by shape;
//   - an explicit request for time ("ek minute", "soch raha hoon", "wait") is HOLD and buys a long, visible wait;
//   - Hindi is verb-final: a clause ending in a finite verb/auxiliary is a completion cue (unlike English);
//   - clause-final "na" is an agreement-seeking tag (O'Reilly-Brown) = YIELD; IDK / trouble / repair requests = YIELD now;
//   - in a number answer, hesitation precedes the value (M-B1: hesitant first-value wrong 21/21), so a fragment with no
//     value yet is held briefly instead of committed at 500 ms.
// The beat thresholds are the shipped ones; only the scorer and the number/hold-request hold windows differ.

export interface TurnContext {
  beat?: string;
  answerForm?: string;
  handover?: string;
}

export type CueClass = "hold_request" | "filler" | "open" | "yield" | "value" | "verb_final" | "plain";
export interface PolicyScore {
  p: number;
  cue: CueClass;
}

const EXPLAINING_BEATS = new Set(["teachback", "explain", "worked_example", "contrast", "explore_question", "reflect"]);

const norm = (t: string): string =>
  String(t ?? "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[?？]+/g, " ")
    .replace(/[।॥.,!;:…"'“”‘’()\-–—]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Filler shapes in both scripts (and the Arabic-script slip M-C1 saw once). Matched against single tokens. */
const FILLER_TOKEN = /^(?:u+m+|u+h+|h+m+|m{2,}|a+m+|e+r*m+|er+|उ+म्?म*ा?|अ+म्?म*ा?|अं+|आम|ओम|ह+म्?म*ा?|हूँ+|ام+)$/u;

/** Explicit requests for time (the child is asking for the floor to stay hers). */
const HOLD_REQUEST =
  /(?:^|\s)(?:ek|one|1|एक)\s*(?:minute|min|second|sec|मिनट|सेकंड)(?=\s|$)|(?:^|\s)(?:ruko|rukiye|रुको|रुकिए|wait|hold on)$|(?:soch|सोच)\s*(?:raha|rahi|रहा|रही)\s*(?:hoon|hu|हूँ|हूं)|(?:sochne|सोचने)\s*(?:do|दो|dijiye|दीजिए)|let me think|i am thinking|i'?m thinking/u;

/** Words that, last, project more talk: connectives, prefaces, word-search, a complementiser, a copula with no complement. */
const OPEN_TAIL =
  /(?:^|\s)(?:aur|toh|to|kyunki|kyonki|kyuki|matlab|yaani|yani|jaise|ki|ya|phir|fir|lekin|par|magar|woh|wo|vo|voh|jo|wala|wali|and|so|because|but|or|like|the|a|an|is|are|of|से|और|तो|क्योंकि|मतलब|यानी|जैसे|कि|या|फिर|लेकिन|पर|मगर|वो|वह|जो|वाला|वाली|का|की|के|में)$|(?:kya|क्या)\s*(?:bolte|kehte|कहते|बोलते)\s*(?:hain|हैं)?$|(?:lagta|लगता|i)\s*(?:hai|है|think)$|(?:answer|उत्तर|जवाब|jawab)\s*(?:hai|है|is)$/u;

/** Turn-final yield markers: the tag "na", closure, I-don't-know, trouble, repair requests. */
const YIELD_TAIL =
  /(?:^|\s)(?:na|naa|ना|hai na|है ना|right|bas|बस|itna hi|इतना ही|that'?s it|that'?s all)$|(?:pata|पता)\s*(?:nahi|nahin|नहीं)|(?:nahi|nahin|नहीं)\s*(?:pata|पता|aata|आता|maloom|मालूम)|(?:i\s*)?(?:don'?t|do not)\s*know|(?:samajh|समझ)\s*(?:nahi|नहीं)\s*(?:aaya|आया|aa raha|आ रहा)|(?:phir se|dobara|फिर से|दोबारा)\s*(?:bolo|boliye|बोलो|बोलिए)?$|say it again|didn'?t understand|did not understand/u;

/** Hindi is verb-final: a finite verb or auxiliary last is a completion cue. */
const VERB_FINAL =
  /(?:^|\s)(?:hai|hain|tha|thi|the|hoon|hu|ho|है|हैं|था|थी|थे|हूँ|हूं|हो|गया|गई|गए|किया|दिया|लिया|आया|आई|बचते|बचता|बचती|होता|होती|होते|करते|करती|करता|देती|देता|देते|छोड़ते|घूमती)$/u;

const NUMBER_WORDS = new Set(
  ("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen " +
    "eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand half quarter " +
    "शून्य एक दो तीन चार पाँच पांच छह छः सात आठ नौ दस ग्यारह बारह तेरह चौदह पंद्रह सोलह सत्रह अठारह उन्नीस बीस " +
    "पच्चीस तीस चालीस पचास साठ सत्तर अस्सी नब्बे सौ हज़ार हजार आधा बावन छप्पन अड़तालीस बत्तीस इक्कीस चौबीस " +
    "ek do teen char chaar paanch panch chhe saat aath nau das gyarah barah pandrah bees tees chalis pachas saath sau").split(" "),
);
const isNumTok = (w: string): boolean => /^[-−]?\d+(?:[./]\d+)?$/.test(w) || NUMBER_WORDS.has(w);
/** The fragment ends in a value: a digit string, a number word, or "a बटा b". */
const valueFinal = (toks: string[]): boolean => {
  const last = toks[toks.length - 1] ?? "";
  return isNumTok(last) || (toks.length >= 3 && /^(?:बटा|बटे|by|upon|over)$/.test(toks[toks.length - 2]) && isNumTok(last));
};

export const hasValue = (t: string): boolean => /\d/.test(t) || norm(t).split(" ").some((w) => NUMBER_WORDS.has(w));

/** P(the child is done) from the words alone, with the cue that decided it. */
export function policyScore(text: string, ctx: TurnContext): PolicyScore {
  const raw = String(text ?? "").trim();
  if (!raw) return { p: 1, cue: "plain" };
  const t = norm(raw);
  if (!t) return { p: 1, cue: "plain" };
  const toks = t.split(" ");
  const last = toks[toks.length - 1];
  if (HOLD_REQUEST.test(t)) return { p: 0.02, cue: "hold_request" };
  if (FILLER_TOKEN.test(last)) return { p: 0.1, cue: "filler" };
  // an ASR comma is a heard continuation contour; it also turns a clause-final "na" into the medial discourse marker
  // (O'Reilly-Brown), so it is read before the yield lexicon
  if (/[,،]\s*$/.test(raw)) return { p: 0.2, cue: "open" };
  if (OPEN_TAIL.test(t)) return { p: 0.12, cue: "open" };
  if (YIELD_TAIL.test(t)) return { p: 0.95, cue: "yield" };
  const explaining = !!ctx.beat && EXPLAINING_BEATS.has(ctx.beat);
  // a value closes a number answer; in an explanation it is usually a step, and a self-repair often follows
  // ("twenty-one. No, wait, twenty-four": M-B1 hesitant first-value wrong 21/21)
  if (valueFinal(toks)) return { p: explaining ? 0.6 : ctx.beat === "probe" ? 0.8 : 0.95, cue: "value" };
  if (VERB_FINAL.test(t)) return { p: toks.length >= 3 ? 0.9 : 0.8, cue: "verb_final" };
  // an ASR "?" is weak evidence (M-C1: 12/152 internal prefixes ended in "?"); plain fragments keep the shipped length rule
  const q = /[?？]\s*$/.test(raw) ? 0.05 : 0;
  if (explaining && toks.length <= 3) return { p: 0.4 + q, cue: "plain" };
  if (ctx.beat === "probe" && toks.length <= 2) return { p: 0.45 + q, cue: "plain" };
  return { p: (toks.length >= 6 ? 0.85 : 0.75) + q, cue: "plain" };
}

/** Shipped thresholds (turnModel.ts endThreshold), unchanged. */
export function policyThreshold(ctx: TurnContext): number {
  if (ctx.answerForm === "number" || ctx.answerForm === "choice" || ctx.handover === "choice") return 0.3;
  if (ctx.beat && EXPLAINING_BEATS.has(ctx.beat)) return 0.8;
  if (ctx.beat === "probe") return 0.75;
  return 0.55;
}

/** Hold windows (ms). Differences from the shipped holdMsFor: a number answer with no value yet is held 700 ms (was 0);
 *  an explicit hold request is held HOLD_REQUEST_MS whatever the context (the floor shows "take your time"). */
export const HOLD_REQUEST_MS = 8000;
export function policyHoldMs(text: string, ctx: TurnContext, cue: CueClass): number {
  if (cue === "hold_request") return HOLD_REQUEST_MS;
  if (ctx.answerForm === "number") return hasValue(text) ? 0 : 700;
  if (ctx.answerForm === "choice" || ctx.handover === "choice") return 0;
  if (ctx.beat && EXPLAINING_BEATS.has(ctx.beat)) return 1500;
  if (ctx.beat === "probe") return 1200;
  return 800;
}

/** One decision: commit now, or hold for `holdMs` waiting for more. */
export function policyDecide(text: string, ctx: TurnContext): { send: boolean; holdMs: number; p: number; cue: CueClass } {
  const { p, cue } = policyScore(text, ctx);
  const holdMs = policyHoldMs(text, ctx, cue);
  const send = holdMs === 0 || p >= policyThreshold(ctx);
  return { send, holdMs: send ? 0 : holdMs, p, cue };
}

/**
 * Barge-in: what a short utterance over her speech means (candidate for cascadeLink.ts isBackchannel). Text cannot carry
 * the Bali 2009 contour, so a "?" the ASR printed is the only rise we can see; a repair request or a stop request must stop
 * her, a lone continuer resumes her, and a lone "haan"/"nahi" after she asked a yes/no question is an ANSWER (the caller
 * passes `askedYesNo`).
 */
export type OverlapKind = "continuer" | "answer" | "repair" | "stop" | "turn";
const CONTINUERS = new Set(["hmm", "hm", "hmmm", "mm", "mhm", "achha", "acha", "accha", "ok", "okay", "theek", "ji", "हम्म", "अच्छा", "ओके", "जी", "ठीक"]);
const YES = new Set(["haan", "han", "haa", "haanji", "yes", "हाँ", "हां"]);
const NO = new Set(["nahi", "nahin", "na", "no", "नहीं", "ना"]);
export function overlapKind(text: string, opts: { askedYesNo?: boolean } = {}): OverlapKind {
  const raw = String(text ?? "").trim();
  const t = norm(raw);
  const toks = t ? t.split(" ") : [];
  if (!toks.length) return "continuer";
  if (/(?:^|\s)(?:ruko|रुको|wait|stop|ek minute|एक मिनट)$/u.test(t)) return "stop";
  if (/[?？]\s*$/.test(raw) && toks.length <= 2) return "repair"; // "haan?", "kya?", "क्या?"
  if (/^(?:kya|क्या|kya bola|phir se|dobara|फिर से|what|sorry)$/u.test(t)) return "repair";
  // a lone "haan" is an answer if she asked yes/no, else a continuer; a lone "nahi" is an answer or a disagreement (stop)
  if (toks.length <= 2 && toks.every((w) => YES.has(w))) return opts.askedYesNo ? "answer" : "continuer";
  if (toks.length <= 2 && toks.every((w) => NO.has(w))) return opts.askedYesNo ? "answer" : "turn";
  if (toks.length <= 2 && toks.every((w) => CONTINUERS.has(w) || w === "hai")) return "continuer";
  return "turn";
}
