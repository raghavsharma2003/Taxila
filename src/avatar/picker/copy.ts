// Picker UI strings [hinglish, hindi, english]: interface labels only, never teacher lines (nothing here reaches
// compile()). Shapes from tutor-selection-ux §5.2: the frame question is a picture plus a verb-final question,
// gender-neutral in Hindi ("tumhe kaun padhaye" rather than a gendered "chahoge"); no friendship claim, no
// streak/reward words, no "come back".
export type PickLang = "hinglish" | "hindi" | "english";

const S = {
  question: ["Tumhe kaun padhaye?", "तुम्हें कौन पढ़ाए?", "Who would you like to learn with?"],
  sub: ["Ek teacher chuno.", "एक टीचर चुनो।", "Pick one teacher."],
  choose: ["Yeh wale", "यही", "Choose"],
  meet: ["Dekho", "देखो", "See"],
  dice: ["Tum hi chun do", "तुम ही चुन दो", "Pick for me"],
  aiTeacher: ["AI teacher", "AI टीचर", "AI teacher"],
  chosen: ["Ab yeh tumhare teacher hain", "अब यह तुम्हारे टीचर हैं", "Your teacher now"],
  changeLater: ["Baad mein 'Mere teacher' mein badal sakte ho.", "बाद में 'मेरे टीचर' में बदल सकते हो।", "You can change later in My teacher."],
  start: ["Chalo shuru karein", "चलो शुरू करें", "Let's start"],
  only: ["Tumhare teacher", "तुम्हारे टीचर", "Your teacher"],
  live: ["Paath ke baad badalna", "पाठ के बाद बदलना", "Change teacher after the lesson"],
  askGrownup: ["Ghar ke bade se poochho", "घर के बड़े से पूछो", "Ask a grown-up"],
  weak: ["Net dheema hai. Phir se try karo.", "नेट धीमा है। फिर से कोशिश करो।", "Connection is slow. Try again."],
  current: ["Tumhare teacher", "तुम्हारे टीचर", "Your teacher"],
} as const;

export type PickKey = keyof typeof S;
/** English chrome on every surface (PRODUCT-DESIGN-V2 §5.3, G-EN-1): the family's language changes only what the
 *  teacher says, never a label. The other columns stay as data until the B2 picker rewrite deletes them. */
export const p = (k: PickKey, _lang: string): string => S[k][2];

export const ROLE: Record<string, [string, string, string]> = {
  didi: ["didi", "दीदी", "didi"],
  bhaiya: ["bhaiya", "भैया", "bhaiya"],
  maam: ["ma'am", "मैम", "ma'am"],
  sir: ["sir", "सर", "sir"],
};
export const role = (r: string, _lang: string) => ROLE[r]?.[2] ?? r;
