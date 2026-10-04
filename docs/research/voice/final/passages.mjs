// passages.mjs — the final voice pick (owner directive 2026-10-04): three LONG listening passages, one per mini-lesson
// moment, each with emotion changes inside it, and the exact input each of the three candidate engines receives.
//
// THESE PASSAGES ARE LISTENING STIMULI. They are sentence-shaped on purpose (they are what the two raters hear) and they
// must NEVER be pasted into a prompt, a persona sheet, a move shape, a few-shot block or a kit (repo law `recited-prompt`).
// The gpt-4o-mini-tts `instructions` below describe an emotion ARC and never quote a line, for the same reason.
//
// Writing rules applied (TALKING-RULES §1, minus its SSML delivery-plan half, rejected by ear in round 3):
//   - Hindi in Devanagari, English words in Latin, the way an Indian teacher mixes them (round-3 script defect: Roman
//     Hinglish breaks Diya's numbers).
//   - Every number is a Hindi or English WORD, never a digit (round 1). No "..." anywhere (MAI read punctuation aloud).
//   - Full breaths: each sentence runs on; no comma-chopped fragments (round 3: "choppy" on the fragmented L3 line).
//   - Reactions start from the child's own words (echo), and the feeling runs to the end of the sentence, not just word 1.
//   - Praise names what the child DID; the child is never compared with other children.
//   - No laugh/breath tags or onomatopoeia: DragonHD and MAI speak tags as words, gpt-4o-mini-tts made 0/18 requested
//     non-verbals audible (server/voice/expressive/caps.js). Laughter and surprise are written into the words.
//
// Engine inputs (one request per passage per engine: whole passage, never spliced; round 1 rejected splicing):
//   diya  en-IN-Diya:DragonHDLatestNeural (production voice, server/voice/voices.js row `asha`). PLAIN: the exact
//         document form of round-3 arm B (v4/lines.mjs plainDragonHD: Devanagari runs wrapped in <lang hi-IN>, no
//         <break>, no <prosody>). No style try: en-IN DragonHD has no StyleList, and express-as had no measurable
//         effect on Diya in the v4 capability probe (TALKING-RULES §2.2, n=3-4 takes), so there is no documented field.
//   mai   hi-IN-Priya:MAI-Voice-2.1 (HD; highest MAI hi-IN persona in v2, 4.85 styled, VOICE-CHOICE.md). Its documented
//         control is <mstts:express-as style> from the voice's own StyleList (caps.js `mai`; bracket markers return no
//         audio; tags are spoken). Each beat names a style PREFERENCE list; the renderer MUST fetch voices/list once and
//         keep only styles in Priya's live StyleList (a style not on the list returned HTTP 502 for Arjun, 2026-10-02).
//         Only `excited` and `softvoice` are measured present for Priya; the rest are candidates. No style left -> plain.
//         No <break>, no <prosody> (same no-plan rule as Diya, so the arms differ by voice, not by markup).
//   oai   gpt-4o-mini-tts (eastus2 Foundry deployment, 2025-12-15), voice `marin` (Asha's character voice, today's
//         cascade fallback), input = the passage text unchanged, instructions = one acting string per passage.
//
// Length: target 60-90 s each. Calibration from the 20 round-3 clips (v4/blind, ffprobe duration / whitespace words,
// measured 2026-10-04): 1.86-3.29 words/s, median ~2.7. Run `node passages.mjs` to print words, chars and the
// estimated duration band per passage, and the self-checks. The real duration is measured on the renders, not here.
import { plainDragonHD } from "../v4/lines.mjs";
import { escapeXml } from "../../../../server/voice/expressive/compile/dhd.js";

export const VERSION = "taxila-voice-final-passages/v1";

export const ENGINES = Object.freeze({
  diya: { voice: "en-IN-Diya:DragonHDLatestNeural", region: "eastus2", input: "plain SSML, round-3 arm B form (plainDragonHD)", style: null },
  mai: { voice: "hi-IN-Priya:MAI-Voice-2.1", region: "eastus2", input: "SSML, express-as per beat filtered by the live StyleList", measuredStyles: ["excited", "softvoice"] },
  oai: { model: "gpt-4o-mini-tts", deployment_version: "2025-12-15", region: "eastus2", voice: "marin", input: "text + instructions" },
});

// The shared voice description every oai instructions string starts with (accent, listener, register). It describes a
// way of speaking, never a line.
const OAI_BASE =
  "Voice: a warm Indian woman in her late twenties, a school teacher talking one-to-one with a single child of about eleven. " +
  "Accent: one natural North Indian accent for the Hindi and the English words alike; English words inside Hindi are said the way an Indian teacher says them, never with an American or British accent. " +
  "Register: talking, not reading. Unhurried, conversational pace, sentences flow in full breaths, no gaps between phrases, the feeling carries to the end of every sentence. " +
  "Do not add any sound effects, laughs or words; say the text exactly as written.";

// beat: what the moment is doing; mai: express-as preference list (first one present in Priya's StyleList wins).
export const PASSAGES = [
  {
    id: "P1-maths",
    title: "Maths, class 5-6: twelve samosas",
    arc: "warm greeting -> thinking aloud through a sum -> the child's joke, she laughs along -> back to the point -> genuine surprise at the child's right answer",
    beats: [
      { beat: "greet", mai: ["friendly", "cheerful"],
        text: "अरे, आ गए तुम! कैसे हो? आज मेरे पास तुम्हारे लिए एक बड़ा मज़ेदार सवाल है।" },
      { beat: "think-aloud", mai: ["calm", "friendly"],
        text: "सुनो, एक samosa पच्चीस रुपये का है और हमें बारह samosa चाहिए, तो कुल कितने रुपये लगेंगे? चलो, मैं ज़ोर से सोचती हूँ और तुम मेरे साथ चलना। सीधे बारह से गुणा करने के बजाय मैं बारह को दस और दो में तोड़ देती हूँ। पच्चीस दस बार हुआ ढाई सौ, फिर पच्चीस दो बार हुआ पचास, और ढाई सौ में पचास जोड़ो तो पूरे तीन सौ रुपये बन गए।" },
      { beat: "joke-laugh", mai: ["cheerful", "excited"],
        text: "क्या कहा? बारह के बारह samosa तुम अकेले ही खा जाओगे, तो हिसाब करने की ज़रूरत ही नहीं पड़ेगी? अरे बाबा रे, ये तो बड़ा शानदार तरीका निकाला! फिर तो सवाल ये होगा कि इतने samosa के लिए पेट में जगह कहाँ से आई!" },
      { beat: "back-to-point", mai: ["friendly", "calm"],
        text: "अच्छा अच्छा, samosa बाद में खाएँगे, पहले एक छोटा सा सवाल। अगर बारह की जगह चौबीस samosa हों, तो कितने रुपये लगेंगे? आराम से सोचो, कोई जल्दी नहीं है।" },
      { beat: "surprise", mai: ["excited", "cheerful"],
        text: "छह सौ? अरे वाह, एकदम सही! और इतनी जल्दी कैसे? तुमने तो पूरा गुणा दोबारा किया ही नहीं, तुमने देखा कि चौबीस तो बारह का double है, तो तीन सौ को भी double कर दिया। मुझे लगा था तुम फिर से शुरू से करोगे, पर तुमने तो सीधा shortcut पकड़ लिया!" },
    ],
    oai_instructions: OAI_BASE + " " +
      "Emotion arc, in order: open bright and genuinely glad to see the child, a smile you can hear. " +
      "When she sets up the sum and works through it, slow a little and think aloud for real, as if finding each step while saying it, calm and companionable, landing each small result with quiet satisfaction. " +
      "When she repeats the child's joke back, she is truly amused: laugh along through the words, voice lifting and a little breathless with fun, playful, enjoying it, never mocking. " +
      "Then settle back, still smiling, gently steering to the next question, patient and inviting, no pressure at all. " +
      "At the child's answer, real surprise first, a quick delighted lift, then warm admiration as she explains what the child did, ending proud and happy.",
  },
  {
    id: "P2-science",
    title: "Science, class 6-7: eight-minute-old sunlight",
    arc: "quiet wonder that builds to excitement -> explaining clearly -> the child is wrong, calm curious kind correction -> encouragement",
    beats: [
      { beat: "wonder-quiet", mai: ["softvoice", "calm"],
        text: "एक बात बताऊँ? अभी जो धूप तुम्हारी खिड़की से अंदर आ रही है ना, वो सूरज से करीब आठ मिनट पहले निकली थी। सोचो ज़रा, जब तुम अपना बस्ता खोल रहे थे, तब ये रोशनी अंतरिक्ष के अंधेरे में बिना रुके हमारी तरफ़ चली आ रही थी।" },
      { beat: "wonder-builds", mai: ["excited", "cheerful"],
        text: "और इसका मतलब पता है क्या है? जब तुम आसमान में सूरज देखते हो, तो तुम असल में आठ मिनट पुराना सूरज देख रहे होते हो! है ना कमाल की बात?" },
      { beat: "explain", mai: ["friendly", "calm"],
        text: "अब ये होता कैसे है? रोशनी बहुत तेज़ चलती है, एक second में लगभग तीन लाख किलोमीटर। पर सूरज हमसे इतना दूर है, करीब पंद्रह करोड़ किलोमीटर, कि इतनी तेज़ रोशनी को भी यहाँ तक पहुँचने में आठ मिनट लग जाते हैं। तो दूरी जितनी ज़्यादा, रोशनी को उतना ज़्यादा time लगता है।" },
      { beat: "kind-correction", mai: ["softvoice", "empathetic", "calm"],
        text: "अच्छा, तो तुम कह रहे हो कि चाँद भी सूरज की तरह अपनी खुद की रोशनी से चमकता है? ऐसा सोचना समझ में आता है, क्योंकि रात को वो कितना चमकीला दिखता है। पर चाँद के पास अपनी कोई रोशनी होती ही नहीं। उस पर सूरज की रोशनी पड़ती है और वो उसे हमारी तरफ़ लौटा देता है, बिल्कुल वैसे जैसे mirror पर torch मारो तो सामने की दीवार चमक उठती है।" },
      { beat: "encourage", mai: ["friendly", "cheerful"],
        text: "और तुमने जो सवाल उठाया ना, वही तो science की असली शुरुआत है। आज रात चाँद देखना, और कल मुझे ज़रूर बताना कि तुम्हें कैसा लगा।" },
    ],
    oai_instructions: OAI_BASE + " " +
      "Emotion arc, in order: begin softly and slowly, almost confiding, full of quiet wonder, as if sharing a secret about the sky; let the wonder grow sentence by sentence. " +
      "It builds into open excitement: brighter, a little faster, genuinely thrilled by the idea, the excitement still alive at the end of each sentence. " +
      "Then shift to clear, warm explaining: steady, even, giving the big numbers room so they are easy to follow, never lecturing. " +
      "When she repeats the child's wrong idea, stay calm and curious, no disappointment and no 'wrong' in the voice; she finds the idea reasonable, then gently and kindly shows how it really works, with a small spark when the mirror picture lands. " +
      "End with sincere, quiet encouragement, warm and hopeful, inviting the child to come back and tell her.",
  },
  {
    id: "P3-mixed",
    title: "Mixed register: end-of-day revision",
    arc: "English-heavy opener -> Hindi frame with English terms (fraction, denominator) -> numbers (cold drink) -> Hindi-heavy (photosynthesis) -> a question to the child -> a playful tease -> English-heavy wrap-up",
    beats: [
      { beat: "english-open", mai: ["cheerful", "friendly"],
        text: "Okay, so before we close, let's do a quick revision of everything we did today, just two minutes, I promise." },
      { beat: "fraction-terms", mai: ["friendly", "calm"],
        text: "पहले fractions। जब हम तीन बटा चार लिखते हैं, तो नीचे वाला चार denominator है, यानी पूरी चीज़ के कितने बराबर हिस्से हुए, और ऊपर वाला तीन बताता है कि हमने कितने लिए।" },
      { beat: "numbers", mai: ["friendly", "cheerful"],
        text: "अब मान लो एक litre cold drink चार दोस्त बराबर बाँटते हैं, तो हर एक के हिस्से में एक बटा चार litre आएगा, यानी ढाई सौ millilitre। और दो बटा आठ भी उतना ही है, क्योंकि दो बटा आठ और एक बटा चार बराबर होते हैं।" },
      { beat: "hindi-heavy", mai: ["calm", "friendly"],
        text: "फिर हमने पौधों के बारे में पढ़ा था। पौधे अपना खाना खुद बनाते हैं, सूरज की धूप, जड़ों से खींचे पानी और हवा की carbon dioxide से, और इसी पूरे काम को photosynthesis कहते हैं।" },
      { beat: "question", mai: ["friendly", "calm"],
        text: "तो अब एक सवाल तुम्हारे लिए। अगर किसी पौधे को एक हफ़्ते तक अंधेरे कमरे में रख दें, तो उसके खाना बनाने का क्या होगा?" },
      { beat: "tease", mai: ["cheerful", "excited"],
        text: "और हाँ, मुझे पता है तुम क्या सोच रहे हो, कि पौधे को भी cold drink पिला दें तो वो खुश हो जाएगा। बिल्कुल नहीं जनाब, पौधे को cold drink नहीं, पानी चाहिए, cold drink वाला idea आप अपने पास ही रखिए!" },
      { beat: "english-wrap", mai: ["friendly", "cheerful"],
        text: "Alright, that's it for today. You worked really hard, and honestly, I had a lot of fun. Think about that plant question tonight and tell me your answer tomorrow, okay? Bye bye!" },
    ],
    oai_instructions: OAI_BASE + " " +
      "Emotion arc, in order: open relaxed and cheerful, wrapping up a good lesson, easy Indian English. " +
      "Move into clear, friendly recap in the Hindi parts, the English terms said naturally inside the Hindi in the same accent, the numbers spoken clearly and unhurried. " +
      "The plant part is calmer and a little fond, as if remembering something you both liked. " +
      "Ask the question with real curiosity, a gentle rise, and leave the child room to think. " +
      "Then turn playful: a light, affectionate tease with a grin in the voice, mock-stern for a moment, clearly joking, never scolding. " +
      "Close warm and upbeat in English, genuinely pleased with the child's effort, a cheerful goodbye.",
  },
];

/** The whole passage text exactly as every engine receives it (beats joined by one space). */
export const textOf = (p) => p.beats.map((b) => b.text).join(" ");

/** Diya: the plain round-3-arm-B document (imported, not re-implemented, so the form cannot drift). */
export const diyaSsml = (p) => plainDragonHD({ clauses: [{ t: textOf(p) }] }, { voice: ENGINES.diya.voice });

/**
 * MAI-Voice-2.1: one document, one express-as run per beat, style = first preference present in `styleList`
 * (Priya's live StyleList from voices/list). A beat with no allowed style is spoken plain. No <break>, no <prosody>.
 */
export function maiSsml(p, styleList) {
  if (!Array.isArray(styleList)) throw new Error("maiSsml: pass Priya's live StyleList from voices/list (never guess styles)");
  const allowed = new Set(styleList);
  const body = p.beats.map((b) => {
    const style = b.mai.find((s) => allowed.has(s));
    const run = escapeXml(b.text);
    return style ? `<mstts:express-as style="${style}">${run}</mstts:express-as>` : run;
  }).join(" ");
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="hi-IN"><voice name="${ENGINES.mai.voice}">${body}</voice></speak>`;
}

/** gpt-4o-mini-tts /audio/speech body (the caller adds the deployment URL, key and response_format). */
export const oaiBody = (p) => ({ model: ENGINES.oai.model, voice: ENGINES.oai.voice, input: textOf(p), instructions: p.oai_instructions });

// Round-3 calibration (see header): words per second over the 20 clips.
export const RATE_WPS = Object.freeze({ min: 1.86, median: 2.7, max: 3.29, n: 20, source: "v4/blind round-3 clips, ffprobe, 2026-10-04" });

/** Self-checks: fail closed on anything the writing rules forbid. */
export function check(p) {
  const t = textOf(p), errs = [];
  if (/[0-9०-९]/.test(t)) errs.push("digit in text (numbers must be words)");
  if (/\.\.\.|…/.test(t)) errs.push("ellipsis in text");
  if (/[<>\[\]]/.test(t)) errs.push("markup/tag character in text");
  if (!/[ऀ-ॿ]/.test(t)) errs.push("no Devanagari");
  if (/(हा\s*){2,}|हाहा|haha/i.test(t)) errs.push("written laugh token");
  if (/\b(other (kids|children)|बाकी बच्चे|दूसरे बच्चे|सब बच्चे|बहुत लोग)\b/.test(t)) errs.push("comparison with other children");
  for (const b of p.beats) if (!b.mai?.length) errs.push(`${b.beat}: no MAI style preference`);
  const words = t.split(/\s+/).filter(Boolean).length;
  const est = { lo: words / RATE_WPS.max, mid: words / RATE_WPS.median };
  if (est.mid < 60 || est.mid > 90) errs.push(`estimated ${est.mid.toFixed(0)} s at the median rate, outside 60-90 s`);
  if (p.oai_instructions.length > 4000) errs.push("instructions too long");
  return { words, chars: t.length, est, errs };
}

if (process.argv[1] && process.argv[1].endsWith("passages.mjs")) {
  let bad = 0;
  for (const p of PASSAGES) {
    const r = check(p);
    bad += r.errs.length;
    console.log(`${p.id}: ${r.words} words, ${r.chars} chars, est ${r.est.lo.toFixed(0)}-${r.est.mid.toFixed(0)} s (fast-median), ` +
      `instructions ${p.oai_instructions.length} chars, beats ${p.beats.map((b) => b.beat).join(" > ")} ${r.errs.length ? "FAIL " + r.errs.join("; ") : "ok"}`);
  }
  process.exit(bad ? 1 : 0);
}
