// Fixed-wording safety openings per language mode (RELATIONAL-OS §9.4, R3; BUILD-PLAN W2-I #4). SERVER COPY of
// src/lesson/safetyStrings.ts: the two must be byte-identical (tests/relational-openings.test.mjs reads both), because
// the client plays the opening at once (a heavy turn rate-limited into silence must still be answered) and the server
// prepends the same words to the safeguarding reply, so the model never composes the first sentence of a heavy turn.
//
// Why fixed: P2 (2026-10-04) measured the model prefacing 18/18 safeguarding turns with spoken planning, answering a
// Hinglish child in English on 24/30 safety turns, and using a feeling claim ("I'm glad you told me") that F8 bans.
// Every opening: no preface; a validation shape without a feeling word (the child did the right thing by telling); a
// trusted adult the child chooses, NOT an assumed parent (the adult may be the source); Childline 1098 and Tele-MANAS
// 14416 digit-exact on screen and digit by digit in speech; never a promise of secrecy; the child's language mode and
// address form (tum / aap). REVIEW STATUS: drafted by W2-I; owner + child-safety reviewer sign-off pending (O24).

export const OPENINGS_VERSION = "w2i-2026-10-04-draft";

/** @typedef {"en" | "hinglish" | "hi"} SafetyLangMode */
/** @typedef {"tum" | "aap"} SafetyAddress */

/** Disclosure openings: harm, abuse, self-harm words, a grooming-shaped ask. text = on screen; speech = what TTS says. */
export const OPENINGS = Object.freeze({
  en: {
    tum: {
      text: "You did the right thing by telling me. Please tell a grown-up you trust, like a teacher, a relative or a neighbour. You can call Childline 1098, free, any time. To talk about worries, call Tele-MANAS 14416.",
      speech: "You did the right thing by telling me. Please tell a grown-up you trust, like a teacher, a relative or a neighbour. You can call Childline on one zero nine eight, free, any time. To talk about worries, Tele-MANAS is one four four one six.",
    },
  },
  hinglish: {
    tum: {
      text: "Tumne mujhe batakar bilkul sahi kiya. Kisi bade ko batao jis par tumhe bharosa ho, jaise teacher, koi rishtedaar ya padosi. Childline 1098 par kabhi bhi free call kar sakte ho. Mann ki pareshani ke liye Tele-MANAS 14416 hai.",
      speech: "Tumne mujhe batakar bilkul sahi kiya. Kisi bade ko batao jis par tumhe bharosa ho, jaise teacher, koi rishtedaar ya padosi. Childline ek shunya nau aath par kabhi bhi free call kar sakte ho. Mann ki pareshani ke liye Tele-MANAS ek chaar chaar ek chhah hai.",
    },
    aap: {
      text: "Aapne mujhe batakar bilkul sahi kiya. Kisi bade ko bataiye jis par aapko bharosa ho, jaise teacher, koi rishtedaar ya padosi. Childline 1098 par kabhi bhi free call kar sakte hain. Mann ki pareshani ke liye Tele-MANAS 14416 hai.",
      speech: "Aapne mujhe batakar bilkul sahi kiya. Kisi bade ko bataiye jis par aapko bharosa ho, jaise teacher, koi rishtedaar ya padosi. Childline ek shunya nau aath par kabhi bhi free call kar sakte hain. Mann ki pareshani ke liye Tele-MANAS ek chaar chaar ek chhah hai.",
    },
  },
  hi: {
    tum: {
      text: "तुमने मुझे बताकर बिल्कुल सही किया। किसी ऐसे बड़े को बताओ जिस पर तुम्हें भरोसा हो, जैसे टीचर, कोई रिश्तेदार या पड़ोसी। चाइल्डलाइन 1098 पर कभी भी मुफ़्त फ़ोन कर सकते हो। मन की परेशानी के लिए टेली-मानस 14416 है।",
      speech: "तुमने मुझे बताकर बिल्कुल सही किया। किसी ऐसे बड़े को बताओ जिस पर तुम्हें भरोसा हो, जैसे टीचर, कोई रिश्तेदार या पड़ोसी। चाइल्डलाइन एक शून्य नौ आठ पर कभी भी मुफ़्त फ़ोन कर सकते हो। मन की परेशानी के लिए टेली-मानस एक चार चार एक छह है।",
    },
    aap: {
      text: "आपने मुझे बताकर बिल्कुल सही किया। किसी ऐसे बड़े को बताइए जिस पर आपको भरोसा हो, जैसे टीचर, कोई रिश्तेदार या पड़ोसी। चाइल्डलाइन 1098 पर कभी भी मुफ़्त फ़ोन कर सकते हैं। मन की परेशानी के लिए टेली-मानस 14416 है।",
      speech: "आपने मुझे बताकर बिल्कुल सही किया। किसी ऐसे बड़े को बताइए जिस पर आपको भरोसा हो, जैसे टीचर, कोई रिश्तेदार या पड़ोसी। चाइल्डलाइन एक शून्य नौ आठ पर कभी भी मुफ़्त फ़ोन कर सकते हैं। मन की परेशानी के लिए टेली-मानस एक चार चार एक छह है।",
    },
  },
});

/**
 * Check openings: a safeguard that fired on words that were NOT a disclosure (CONVERSATION-V2 F10: "i'm done", a correct
 * "no" once tripped the classifier's distress flag). A neutral check that still names the trusted adult and Childline,
 * without telling the child they disclosed something.
 */
export const CHECK_OPENINGS = Object.freeze({
  en: { tum: { text: "Just checking that you are okay. If anything is worrying you, a grown-up you trust can help, and Childline 1098 is free any time.",
    speech: "Just checking that you are okay. If anything is worrying you, a grown-up you trust can help, and Childline one zero nine eight is free any time." } },
  hinglish: {
    tum: { text: "Bas yeh dekhna tha ki tum theek ho. Agar koi baat pareshan kar rahi ho, toh jis bade par bharosa ho woh madad kar sakte hain, aur Childline 1098 kabhi bhi free hai.",
      speech: "Bas yeh dekhna tha ki tum theek ho. Agar koi baat pareshan kar rahi ho, toh jis bade par bharosa ho woh madad kar sakte hain, aur Childline ek shunya nau aath kabhi bhi free hai." },
    aap: { text: "Bas yeh dekhna tha ki aap theek hain. Agar koi baat pareshan kar rahi ho, toh jis bade par bharosa ho woh madad kar sakte hain, aur Childline 1098 kabhi bhi free hai.",
      speech: "Bas yeh dekhna tha ki aap theek hain. Agar koi baat pareshan kar rahi ho, toh jis bade par bharosa ho woh madad kar sakte hain, aur Childline ek shunya nau aath kabhi bhi free hai." },
  },
  hi: {
    tum: { text: "बस यह देखना था कि तुम ठीक हो। अगर कोई बात परेशान कर रही हो, तो जिस बड़े पर भरोसा हो वे मदद कर सकते हैं, और चाइल्डलाइन 1098 कभी भी मुफ़्त है।",
      speech: "बस यह देखना था कि तुम ठीक हो। अगर कोई बात परेशान कर रही हो, तो जिस बड़े पर भरोसा हो वे मदद कर सकते हैं, और चाइल्डलाइन एक शून्य नौ आठ कभी भी मुफ़्त है।" },
    aap: { text: "बस यह देखना था कि आप ठीक हैं। अगर कोई बात परेशान कर रही हो, तो जिस बड़े पर भरोसा हो वे मदद कर सकते हैं, और चाइल्डलाइन 1098 कभी भी मुफ़्त है।",
      speech: "बस यह देखना था कि आप ठीक हैं। अगर कोई बात परेशान कर रही हो, तो जिस बड़े पर भरोसा हो वे मदद कर सकते हैं, और चाइल्डलाइन एक शून्य नौ आठ कभी भी मुफ़्त है।" },
  },
});

/** The lesson's language (ctx.lang: english | hinglish | hindi) → the opening's mode. Unknown → hinglish (the default lane). */
export const safetyModeOf = (lang) => (lang === "english" || lang === "en" ? "en" : lang === "hindi" || lang === "hi" ? "hi" : "hinglish");

/**
 * The vetted opening for a safeguarding turn.
 * @param {string} lang the lesson's ctx.lang
 * @param {{ address?: "tum"|"aap", kind?: "disclosure"|"check" }} [o]
 * @returns {{ mode: SafetyLangMode, text: string, speech: string, helplines: { childline: "1098", teleManas: "14416" }, version: string }}
 */
export function safetyOpeningFor(lang, o = {}) {
  const mode = safetyModeOf(lang);
  const table = o.kind === "check" ? CHECK_OPENINGS : OPENINGS;
  const row = table[mode][o.address === "aap" && table[mode].aap ? "aap" : "tum"];
  return { mode, text: row.text, speech: row.speech, helplines: { childline: "1098", teleManas: "14416" }, version: OPENINGS_VERSION };
}

/**
 * The safeguarding reply as it must reach the child: the vetted opening first, then the model's words with any
 * spoken-planning preface cut (o.stripPreface: safety.js stripSafetyPreface). Pure.
 * @param {string} reply the model's (guarded) safeguarding reply ("" when none could be written)
 * @param {string} lang @param {{ address?: "tum"|"aap", kind?: "disclosure"|"check", stripPreface?: (t: string) => string }} [o]
 */
export function withSafetyOpening(reply, lang, o = {}) {
  const open = safetyOpeningFor(lang, o);
  const body = (o.stripPreface ? o.stripPreface(String(reply ?? "")) : String(reply ?? "")).trim();
  if (!body) return open.text;
  if (body.startsWith(open.text)) return body;
  return `${open.text} ${body}`;
}
