// Antariksh Nishana · the teacher's in-play lines. An AUTHORED bank, filled by code with on-screen facts only
// (dec-r3-child-facing-words-from-bank, r3p-reaction-shape-conditions): a line true in one context carries that condition
// and is never said elsewhere; silence is the fallback. No verdict or praise words (sahi/galat/correct/wrong/shabash);
// lines notice the world. In production these are pre-synthesised by Azure Speech (DragonHD) and spoken by Asha.
// {t} target symbol, {g} gap (always "lagbhag"), {d} parts the line is cut into, {p}/{q} the fraction's parts.
export const BANK = {
  "intro.mine-sweep": { hinglish: "Is line pe mine chhupi hain. Pehli {t} pe hai.", en: "Mines are hiding on this line. The first one is at {t}.", hi: "इस रेखा पर माइन छिपी हैं। पहली {t} पर है।" },
  "intro.beacon-rescue": { hinglish: "Beacon {t} pe phansa hai. Wahin nishana lagao.", en: "A beacon is stuck at {t}. Aim right there.", hi: "बीकन {t} पर फँसा है। वहीं निशाना लगाओ।" },
  "intro.comet-catch": { hinglish: "Comet {t} pe girega. Wahan pahuncho.", en: "A comet will fall at {t}. Get there.", hi: "धूमकेतु {t} पर गिरेगा। वहाँ पहुँचो।" },
  "next": { hinglish: "Agli {t} pe.", en: "Next one at {t}.", hi: "अगली {t} पर।" },
  "hit": { hinglish: "{t} — wahin thi.", en: "{t}, it was right there.", hi: "{t} — वहीं थी।" },
  "near": { hinglish: "Bas lagbhag {g} ka farak.", en: "Only about {g} away.", hi: "बस लगभग {g} का फ़र्क।" },
  "mal.count-marks": { hinglish: "Line {d} hisson mein kati hai. Nishaan nahi, hisse gino.", en: "The line is cut into {d} parts. Count the parts, not the marks.", hi: "रेखा {d} हिस्सों में कटी है। निशान नहीं, हिस्से गिनो।" },
  "mal.whole-number-bias": { hinglish: "{t}: 0 se 1 ke {q} hisse, aur sirf ek lena hai.", en: "{t}: 0 to 1 cut into {q} parts, and you take just one.", hi: "{t}: 0 से 1 के {q} हिस्से, और सिर्फ़ एक लेना है।" },
  "mal.all-less-than-one": { hinglish: "{t} mein {p} hisse, ek poore mein sirf {q}. 1 ke aage dekho.", en: "{t} has {p} parts; one whole has only {q}. Look past 1.", hi: "{t} में {p} हिस्से, एक पूरे में सिर्फ़ {q}। 1 के आगे देखो।" },
  "far": { hinglish: "Mine {t} pe thi — yahan.", en: "The mine was at {t}, here.", hi: "माइन {t} पर थी — यहाँ।" },
  "retry": { hinglish: "Ab dikh rahi hai. Saaf kar do.", en: "Now you can see it. Clear it.", hi: "अब दिख रही है। साफ़ कर दो।" },
  "doors": { hinglish: "Garam: isi tarah ki. Teekha: zara mushkil. Tum chuno.", en: "Garam: more like this. Teekha: a bit harder. You choose.", hi: "गरम: इसी तरह की। तीखा: ज़रा मुश्किल। तुम चुनो।" },
};
export const UI = {
  fire: { hinglish: "Daago", en: "Fire", hi: "दागो" },
  go: { hinglish: "Chalo", en: "Go", hi: "चलो" },
  garam: { hinglish: "garam", en: "garam", hi: "गरम" },
  teekha: { hinglish: "teekha", en: "teekha", hi: "तीखा" },
  drag: { hinglish: "kahin bhi kheencho", en: "drag anywhere", hi: "कहीं भी खींचो" },
  twin: { hinglish: "Yeh phone 3D nahi chala paya. Wahi sawaal board pe:", en: "This phone could not run the 3D view. The same question on the board:", hi: "यह फ़ोन 3D नहीं चला पाया। वही सवाल बोर्ड पर:" },
};
const BANNED = /\b(sahi|galat|correct|wrong|shabash|great|well done|excellent|wah)\b|सही|ग़लत|गलत|शाबाश/i;
/** fill a line; returns null (silence) when a slot is missing - never a half-filled sentence */
export function say(id, lang, facts) {
  const row = BANK[id]; if (!row) return null;
  const tpl = row[lang] ?? row.hinglish; let missing = false;
  const s = tpl.replace(/\{(\w+)\}/g, (_, k) => (facts[k] === undefined ? ((missing = true), "") : String(facts[k])));
  if (missing || BANNED.test(s)) return null;
  return s;
}
export const ui = (id, lang) => UI[id]?.[lang] ?? UI[id]?.hinglish ?? id;
