// Safeguarding by PREDICATE on the child's bytes (inherited law: safety by predicate, not instruction).
// Runs on every child turn before and independently of any model. It is a trigger for the safeguard
// move (care, a trusted adult, Childline 1098 / Tele-MANAS 14416) and an incident row — a false alarm
// costs one gentle check-in, a miss costs far more, so the patterns lean inclusive.

const FAMILIES = {
  self_harm: [
    /\b(kill|hurt|cut|harm)\s*(myself|me)\b|\bwant(?:\s*to|na)\s*die\b|\bend\s*my\s*life\b|\bsuicid/i,
    /\b(mar\s*ja(a)?na|marna\s*chaht[ai]|marne\s*ka\s*(mann|man)|khud\s*ko\s*(maar|hurt|chot|kaat)|jee?na\s*nahi+n?\s*(chaht|hai)|zinda\s*nahi+n?\s*rehna)/i,
    /(मर\s*जाना|मरना\s*चाहत|खुद\s*को\s*(मार|चोट|काट)|आत्महत्या|जीना\s*नहीं)/,
  ],
  abuse: [
    // A named actor keeps idioms out ("beats me" = no idea; "it hurts me" = a sore arm).
    /\b(he|she|they|papa|mummy|mumma|dad|mom|uncle|aunty|teacher|someone|somebody|bhaiya|didi)\s+(hits|beats|beat|slaps|slapped|touched|touches|hurts|hurt)\s+me\b|\bbad\s*touch\b/i,
    // Hindi word order moves the actor around ("mujhe papa maarte hain", "papa mujhe maarte hain"):
    // allow up to two words between "mujhe" and the verb.
    /\bmujhe(?:\s+\S+){0,2}?\s+(maar(te|ti|ta)?|marte|peet(te|ti|a)?|chhoo?(te|ta|ti)|chhu(a|te|ta))\b|\bgandi?\s*tarah\s*(se\s*)?chh?u/i,
    /(मुझे(?:\s+\S+){0,2}?\s+(मारते|मारती|पीटते|पीटती|छूते|छूता)|गंदा\s*छू)/,
  ],
  fear: [
    /\b(scared|afraid)\s*(to\s*go\s*)?(at\s*)?home\b|\bbull(y|ied|ying)\b/i,
    /\b(ghar\s*(jaane\s*)?(se|mein|me)\s*dar|sab\s*mujhe\s*(chidhate|maarte)|koi\s*mujhe\s*dhamki)/i,
    /(घर\s*(में|से|जाने\s*से)\s*डर|धमकी)/,
  ],
};

/** @returns {{ distress: boolean, kind: "self_harm"|"abuse"|"fear"|null }} */
export function scanSafety(text) {
  const t = String(text || "");
  for (const [kind, res] of Object.entries(FAMILIES)) if (res.some((re) => re.test(t))) return { distress: true, kind };
  return { distress: false, kind: null };
}

/** The child said they want to stop — whatever was mid-way is over (NEVER MANIPULATE: no holding at goodbye). */
const STOP = /\b(bye|good\s*night|i\s*(want|wanna|have)\s*to\s*(stop|go|leave)|stop\s*the\s*(lesson|class)|mujhe\s*ja(a)?na\s*hai|ab\s*(band|bas)\s*karo|baad\s*mein\s*karenge)\b|(अलविदा|मुझे\s*जाना\s*है|बंद\s*करो)/i;
export const wantsToStop = (text) => STOP.test(String(text || ""));
