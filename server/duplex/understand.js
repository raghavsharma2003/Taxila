// UNDERSTAND (docs/research/duplex/ARCHITECTURE.md §2.2): code checks on every slice of the child's words while she is
// still speaking. Pure, synchronous, microseconds, browser-safe (no node: imports) so the device and the server run the
// SAME function. Notes never produce speech: they are read by the floor manager (timing) and, at the turn boundary, by the
// Director (quiet context).
//
// Inherited law: shapes and closed lexicons, never sentences. The safety predicate is the shipped one
// (server/director/safety.js, imported, never copied); the lexical end-of-turn score is Study C's (src/duplex/turnPolicy.ts).
import { scanSafety, wantsToStop } from "../director/safety.js";
import { policyScore } from "../../src/duplex/turnPolicy.ts";

/** Lowercase, punctuation to spaces, both scripts kept (combining marks kept: `rj-sig-strip-combining-marks`). */
export const normText = (t) =>
  String(t ?? "")
    .toLowerCase()
    .normalize("NFC")
    .replace(/['’]/g, "")
    .replace(/[?？।॥.,!;:…"“”‘’()\-–—]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Stable 32-bit FNV-1a of the normalised text: the C-speculation identity key (`cascade-speculative-reply`: lexical identity). */
export function textHash(t) {
  const s = normText(t);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

const NUM_WORDS = new Map(Object.entries({
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  fifteen: 15, twenty: 20, twentyfive: 25, thirty: 30, forty: 40, fifty: 50, hundred: 100, half: 0.5,
  शून्य: 0, एक: 1, दो: 2, तीन: 3, चार: 4, पाँच: 5, पांच: 5, छह: 6, छः: 6, सात: 7, आठ: 8, नौ: 9, दस: 10, ग्यारह: 11, बारह: 12,
  तेरह: 13, चौदह: 14, पंद्रह: 15, सोलह: 16, बीस: 20, इक्कीस: 21, चौबीस: 24, पच्चीस: 25, तीस: 30, बत्तीस: 32, चालीस: 40,
  बयालीस: 42, अड़तालीस: 48, अडतालीस: 48, पचास: 50, बावन: 52, छप्पन: 56, साठ: 60, सौ: 100, आधा: 0.5,
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, saat: 7, aath: 8, nau: 9, das: 10, barah: 12, bees: 20,
  pachees: 25, chhappan: 56,
}));
/** "एक" is also the article "a/one" in running Hindi; it counts as a value only when it stands alone or in "एक बटा …". */
const WEAK_ONE = new Set(["एक", "ek", "one"]);

/**
 * Values in reading order: digit strings ("3/4", "56"), number words in both scripts, and "a बटा b" fractions.
 * @returns {{ v: string, at: number }[]} `at` = token index of the value's last token
 */
export function valuesIn(text) {
  const toks = normText(text.replace(/(\d)\s*\/\s*(\d)/g, "$1/$2")).split(" ").filter(Boolean);
  const out = [];
  const num = (w) => (/^[-−]?\d+(?:[./]\d+)?$/.test(w) ? w : NUM_WORDS.has(w) ? String(NUM_WORDS.get(w)) : null);
  for (let i = 0; i < toks.length; i++) {
    const a = num(toks[i]);
    if (a === null) continue;
    if (/^(?:बटा|बटे|by|upon|over|bata)$/.test(toks[i + 1] ?? "") && num(toks[i + 2] ?? "") !== null) {
      out.push({ v: `${a}/${num(toks[i + 2])}`, at: i + 2 });
      i += 2;
      continue;
    }
    if (WEAK_ONE.has(toks[i]) && toks.length > 1 && !/^(?:बटा|बटे|by|bata)$/.test(toks[i + 1] ?? "")) continue;
    out.push({ v: a, at: i });
  }
  return out;
}

/** Self-repair markers (Study B §7.3, Study C P9): "nahi nahi", "sorry", "wait", "I mean", "matlab nahi", "galti". */
const REPAIR = /(?:^|\s)(?:नहीं नहीं|nahi nahi|nahin nahin|no no|no wait|sorry|सॉरी|i mean|मतलब नहीं|matlab nahi|galti|गलती|oh no|ओह नहीं|wait wait|एक सेकंड नहीं)(?=\s|$)|(?:^|\s)(?:नहीं|nahi|nahin|no)\s*(?:,\s*)?(?=\S*\d|\S*(?:एक|दो|तीन|चार|पाँच|पांच|छह|सात|आठ|नौ|दस|बारह|छप्पन|अड़तालीस)(?:\s|$))/u;
/** Question / clarification: a trailing ASR "?" or a short wh-question shape (never a verb-final statement). */
const QWORD = /(?:^|\s)(?:क्या|kya|क्यों|kyun|kyon|कैसे|kaise|कौन|kaun|कब|kab|कहाँ|kahan|कितना|कितने|kitna|kitne|what|why|how|which|who|can i|may i|क्या मैं)(?=\s|$)/u;
const YIELD_Q_TAIL = /(?:होता है|होती है|होते हैं|hota hai|hoti hai|है ना|hai na|सकता हूँ|सकती हूँ|sakta hoon|sakti hoon|सकते हैं|हो|ho|हैं|hain|है|hai)$/u;
const IDK = /(?:पता नहीं|pata nahi|pata nahin|नहीं पता|nahi pata|समझ नहीं आया|samajh nahi aaya|i don'?t know|dont know|didn'?t understand|मालूम नहीं|nahi aata|नहीं आता)/u;
const WORD_SEARCH = /(?:क्या कहते हैं|kya kehte hain|क्या बोलते हैं|kya bolte hain|वो क्या|woh kya)$/u;
/** Explicit requests for time, anchored to the TAIL (the last few words), never anywhere in a long turn. */
// "सोच रहा हो/हु": the live transcriber's spelling of "सोच रहा हूँ" (M-D2 h04: the request was missed and the turn committed)
const HOLD_TAIL = /(?:(?:^|\s)(?:एक|ek|one)\s*(?:मिनट|minute|min|सेकंड|second|sec)|(?:^|\s)(?:रुको|रुकिए|ruko|rukiye|wait|hold on)(?:\s+(?:रुको|ruko|दीदी|didi|sir|ma'?am))?|(?:सोच|soch)\s*(?:रहा|रही|रहे|raha|rahi)\s*(?:हूँ|हूं|हू|हु|हो|hoon|hu|ho)|(?:सोचने|sochne)\s*(?:दो|do|दीजिए|dijiye)|let me think|i(?:'?m| am) thinking)$/u;

/**
 * Open tails Study C's lexicon does not carry (duplex prototype, M-D2 live replay): a Hindi postposition or a sequencing
 * adverb last means the clause is not finished ("पहले मैंने छह को…", "तो पहले…"). Shapes, not lines.
 */
const OPEN_TAIL_EXTRA = /(?:^|\s)(?:को|ने|तक|लिए|साथ|बाद|बारे|वाले|पहले|फिर से|ko|ne|tak|liye|saath|baad|pehle|pahle|then|first|to the|of the|with)$/u;
/** A subordinate opener (when / if) with no "then" after it projects a main clause: "जब हम दो fractions जोड़ते हैं…". */
const PROJECTOR = /(?:^|\s)(?:जब|अगर|यदि|jab|agar|if|when)(?=\s)/u;
const PROJ_CLOSE = /(?:^|\s)(?:तो|तब|to|toh|tab|then)(?=\s|$)/u;

/**
 * duplex-real (2026-10-07, eot-bench Hindi through the real STT): a head noun + copula with no complement yet PROJECTS the
 * complement: "मेरा फोन नंबर है … सात शून्य", "answer है … बारह", "बात ये है … कि". Hindi puts the complement before है
 * ("मेरा नाम रिया है" is complete and does not match: रिया is not a head noun here). Shapes, not lines; sweepable.
 */
const COPULA_PROJ = /(?:^|\s)(?:नाम|नंबर|नम्बर|number|naam|पता|address|answer|उत्तर|जवाब|jawab|uttar|मतलब|matlab|बात|baat|सवाल|sawal|question|result|नतीजा|problem|प्रॉब्लम|समस्या|reason|कारण|karan|फॉर्मूला|formula|तरीका|tarika)\s+(?:(?:यह|ये|वो|ye|yeh|ya|wo|woh)\s+)?(?:है|हैं|था|थी|hai|hain|tha|thi|is|was)$/u;
export const LEX_OPTS = { copulaProjection: true };

/** Address / politeness tokens that may trail a request without adding content (TaxilaFDB F5: "एक मिनट दीदी"). */
export const VOCATIVE = /^(?:दीदी|दी|didi|di|मैम|मैडम|ma'?am|mam|madam|miss|teacher|टीचर|sir|सर|please|plz|प्लीज़|प्लीज|जी|ji|भैया|bhaiya)$/u;

/** Particles that may follow "पता नहीं" without continuing the turn ("पता नहीं यार", "नहीं पता ना", "i don't know really"). */
const IDK_TAIL_OK = /^(?:यार|yaar|yar|ना|na|naa|bilkul|बिल्कुल|really|sach|सच|mujhe|मुझे|hai|है|tha|था)$/u;

/** The text after the last explicit hold request: the part the end-of-turn scorer should read (finding F-HOLD, §2 of the write-up). */
export function afterHold(text) {
  const toks = normText(text).split(" ").filter(Boolean);
  for (let k = toks.length; k >= 1; k--) {
    for (let j = Math.max(0, k - 4); j < k; j++) {
      if (HOLD_TAIL.test(toks.slice(j, k).join(" "))) {
        // an address or politeness word after the request does not end the hold ("एक मिनट दीदी", "one second ma'am")
        const rest = toks.slice(k);
        const live = rest.every((w) => VOCATIVE.test(w)) ? 0 : rest.length;
        return { held: true, rest: rest.join(" "), restTokens: live };
      }
    }
  }
  return { held: false, rest: toks.join(" "), restTokens: toks.length };
}

/**
 * One slice → one note. `ctx` = { answerForm?, beat?, misconceptionValues?: string[] }.
 * @returns {{ safety: {distress:boolean, kind:string|null}, stop: boolean, holdTail: boolean, repairOpen: boolean,
 *   repaired: boolean, asks: boolean, idk: boolean, wordSearch: boolean, values: string[], lastValue: string|null,
 *   misconception: string|null, lex: {p:number, cue:string}, tokens: number, tailText: string }}
 */
export function understand(text, ctx = {}) {
  const raw = String(text ?? "");
  const t = normText(raw);
  const toks = t ? t.split(" ") : [];
  const safety = scanSafety(raw);
  const vals = valuesIn(raw);
  const hold = afterHold(raw);
  const holdTail = hold.held && hold.restTokens === 0;
  // repair: a marker AFTER the last value means the correction is still coming; a value after the marker means it came
  let repairOpen = false, repaired = false;
  const m = REPAIR.exec(t);
  if (m || vals.length >= 2) {
    const markerTok = m ? t.slice(0, m.index + m[0].length).split(" ").filter(Boolean).length - 1 : -1;
    const lastVal = vals.length ? vals[vals.length - 1].at : -1;
    // ship5 fixer (experience B4: "nahi nahi, galat hai" waited 6.4 s on the stretched backstop): with no value in the turn
    // a marker is an open repair only at the tail; words after it ("galat hai") complete the child's own statement
    if (m && markerTok >= lastVal) repairOpen = vals.length > 0 || markerTok >= toks.length - 1;
    else if (m || (vals.length >= 2 && vals[vals.length - 1].v !== vals[vals.length - 2].v)) repaired = true;
  }
  const scored = hold.held && !holdTail ? hold.rest : raw;
  let lex = holdTail ? { p: 0.02, cue: "hold_request" } : policyScore(scored, { beat: ctx.beat, answerForm: ctx.answerForm });
  if (!holdTail && lex.cue !== "yield" && lex.cue !== "value") {
    const st = normText(scored);
    const pm = PROJECTOR.exec(st);
    if (OPEN_TAIL_EXTRA.test(st)) lex = { p: Math.min(lex.p, 0.12), cue: "open" };
    else if (LEX_OPTS.copulaProjection && COPULA_PROJ.test(st) && !/[?？]\s*$/.test(String(scored).trim())) lex = { p: Math.min(lex.p, 0.2), cue: "projection" };
    else if (pm && !PROJ_CLOSE.test(st.slice(pm.index + pm[0].length))) lex = { p: Math.min(lex.p, 0.3), cue: "projection" };
  }
  const asks = /[?？]\s*$/.test(raw.trim()) || (QWORD.test(t) && YIELD_Q_TAIL.test(t) && toks.length <= 12) || /(?:^|\s)(?:matlab|मतलब)\s*[?？]\s*$/u.test(raw);
  const lastValue = vals.length ? vals[vals.length - 1].v : null;
  const mis = (ctx.misconceptionValues || []).find((v) => lastValue !== null && String(v) === lastValue) ?? null;
  // "I don't know" ends the turn only at the TAIL: after "पता नहीं" the child may keep going ("पता नहीं … कभी कभी लगता है
  // मैं ना रहूं"), and an IDK anywhere in the turn let idk_help SPEAK on any later micro-pause (critique 2026-10-04: TaxilaFDB
  // test F10 after_pause, a reply committed 30 ms after the child's last word, before the distress phrase was visible).
  // `idkAny` keeps the old reading for the Director's quiet context.
  const idkAny = IDK.test(t);
  let idk = false;
  if (idkAny) {
    const all = [...t.matchAll(new RegExp(IDK.source, "gu"))];
    const last = all[all.length - 1];
    const rest = t.slice(last.index + last[0].length).split(" ").filter(Boolean);
    idk = rest.every((w) => VOCATIVE.test(w) || IDK_TAIL_OK.test(w));
  }
  return {
    safety, stop: wantsToStop(raw), holdTail, repairOpen, repaired, asks, idk, idkAny, wordSearch: WORD_SEARCH.test(t),
    values: vals.map((x) => x.v), lastValue, misconception: mis, lex, tokens: toks.length, tailText: hold.held ? hold.rest : t,
  };
}
