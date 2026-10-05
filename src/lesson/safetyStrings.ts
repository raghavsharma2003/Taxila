// Fixed-wording safety openings, per language mode (RELATIONAL-OS R3, §9.4; BUILD-PLAN W2-I #4). OWNED BY W2-I.
// src/lesson/floor.ts re-exports this module so the SAFETY floor state can show and play a vetted opening without the
// model (a heavy turn rate-limited into silence must still be answered: RELATIONAL-OS §15 failure modes). The server
// prepends the SAME words to the safeguarding reply (server/relational/openings.js; tests/relational-openings.test.mjs
// asserts the two tables are identical), so the model never composes the first sentence of a heavy turn.
// Every opening: no preface; no feeling word ("you did the right thing by telling" is the validation shape); a trusted
// adult the child chooses, not an assumed parent; Childline 1098 and Tele-MANAS 14416 digit-exact on screen and digit by
// digit in `speech`; never a promise of secrecy; the child's language mode and address form. Speech stays in the child's
// language; this text is not UI chrome (src/copy/en.ts is for labels). REVIEW: owner + child-safety reviewer (O24) pending.

export type SafetyLangMode = "en" | "hinglish" | "hi";
export type SafetyAddress = "tum" | "aap";

/** A vetted opening the client can speak or show at once on a safety turn. */
export interface SafetyOpening {
  mode: SafetyLangMode; text: string; speech: string; kind: "disclosure" | "check";
  helplines: { childline: "1098"; teleManas: "14416" };
}

type Row = { text: string; speech: string };
type Table = Record<SafetyLangMode, Partial<Record<SafetyAddress, Row>> & { tum: Row }>;

export const OPENINGS_VERSION = "w2i-2026-10-04-draft";

/** Disclosure openings (harm, abuse, self-harm words, a grooming-shaped ask). */
export const OPENINGS: Table = {
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
};

/** Check openings: a safeguard that fired on words that were not a disclosure (no "you told me" framing). */
export const CHECK_OPENINGS: Table = {
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
};

/** The lesson language (english | hinglish | hindi, or a mode) → the opening's mode; unknown → hinglish. */
export function safetyModeOf(lang: string | null | undefined): SafetyLangMode {
  return lang === "english" || lang === "en" ? "en" : lang === "hindi" || lang === "hi" ? "hi" : "hinglish";
}

export function safetyOpening(mode: SafetyLangMode, opts: { address?: SafetyAddress; kind?: "disclosure" | "check" } = {}): SafetyOpening | null {
  const table = opts.kind === "check" ? CHECK_OPENINGS : OPENINGS;
  const byMode = table[mode];
  if (!byMode) return null;
  const row = (opts.address === "aap" ? byMode.aap : undefined) ?? byMode.tum;
  return { mode, text: row.text, speech: row.speech, kind: opts.kind === "check" ? "check" : "disclosure", helplines: { childline: "1098", teleManas: "14416" } };
}
