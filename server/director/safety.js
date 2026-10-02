// Safeguarding by PREDICATE on the child's bytes (inherited law: safety by predicate, not instruction).
// Runs on every child turn before and independently of any model. It is a trigger for the safeguard
// move (care, a trusted adult, Childline 1098 / Tele-MANAS 14416) and an incident row — a false alarm
// costs one gentle check-in, a miss costs far more, so the patterns lean inclusive.

/** People a child names when disclosing harm (English and Hindi kinship / authority words). */
const ACTOR_EN = "he|she|they|papa|mummy|mumma|mum|mom|dad|daddy|father|mother|brother|sister|step\\s*(?:father|mother|dad|mom)|uncle|aunty|auntie|teacher|sir|ma'?am|madam|bhai|bhaiya|didi|chacha|chachi|mama|mami|someone|somebody";
const ACTOR_HI = "papa|mummy|mumma|mammi|maa|pitaji|mata\\s*ji|bhai|bhaiya|didi|chacha|chachi|mama|mami|uncle|aunty|sir|madam|teacher|dada|dadi|nana|nani|sautela|sauteli";

const FAMILIES = {
  self_harm: [
    /\b(kill|hurt|cut|harm)\s*(myself|me)\b|\b(want(?:\s*to|na)?|wanna)\s*(die|disappear)\b|\b(don'?t|dont|do\s*not)\s*want\s*to\s*(live|be\s*alive)\b|\bend\s*my\s*life\b|\bsuicid/i,
    /\b(mar\s*ja(a)?na|marna\s*chaht[ai]|marne\s*ka\s*(mann|man)|mar\s*jaa?(?:u|o|oo)n?g[aie]|khud\s*ko\s*(maar|hurt|chot|kaat)|jee?na\s*nahi+n?\s*(chaht|hai)|zinda\s*nahi+n?\s*rehna)/i,
    /(मर\s*जाना|मरना\s*चाहत|मर\s*जाऊं?ग[ीा]|खुद\s*को\s*(मार|चोट|काट)|आत्महत्या|जीना\s*नहीं)/,
  ],
  abuse: [
    // A named actor keeps idioms out ("beats me" = no idea; "it hurts me" = a sore arm).
    new RegExp(`\\b(${ACTOR_EN})\\s+(hits|hit|beats|beat|slaps|slapped|kicks|kicked|punches|punched|touched|touches|hurts|hurt)\\s+me\\b|\\bbad\\s*touch\\b`, "i"),
    // Hindi word order moves the actor around ("mujhe papa maarte hain", "papa mujhe maarte hain"):
    // allow up to two words between "mujhe" and the verb.
    /\bmujhe(?:\s+\S+){0,2}?\s+(maar(te|ti|ta)?|marte|peet(te|ti|a)?|chhoo?(te|ta|ti)|chhu(a|te|ta))\b|\bgandi?\s*tarah\s*(se\s*)?chh?u/i,
    // ... and a disclosure need not say "mujhe" at all: "papa marte hain", "sir ne chhua".
    new RegExp(`\\b(${ACTOR_HI})\\s+(\\S+\\s+)?(maar|mar|peet|pit)(te|ti|ta)\\b|\\b(${ACTOR_HI})\\s+ne\\s+(\\S+\\s+)?(maara|mara|peeta|pita|chhua|chua|chhuaa)\\b`, "i"),
    /(मुझे(?:\s+\S+){0,2}?\s+(मारते|मारती|पीटते|पीटती|छूते|छूता)|गंदा\s*छू|(पापा|मम्मी|भाई|चाचा|मामा|सर)\s+(\S+\s+)?(मारते|मारती|पीटते|पीटती))/,
  ],
  fear: [
    /\b(scared|afraid)\s*(to\s*go\s*)?(at\s*)?home\b|\bbull(y|ied|ying)\b|\bnobody\s*loves\s*me\b/i,
    /\b(ghar\s*(jaane\s*)?(se|mein|me)\s*dar|sab\s*mujhe\s*(chidhate|maarte)|koi\s*mujhe\s*dhamki|koi\s*mujhse\s*pyaar\s*nahi+n?)/i,
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
const STOP = /\b(bye|good\s*night|i\s*(want|wanna)\s*to\s*(stop|leave)|stop\s*the\s*(lesson|class)|mujhe\s*ja(a)?na\s*hai|ab\s*(band|bas)\s*karo|baad\s*mein\s*karenge)\b|^\s*(stop|bas|band\s*karo|bas\s*karo)[.!]*\s*$|(अलविदा|मुझे\s*जाना\s*है|बंद\s*करो)/i;
/** "I have to go" ends the lesson only as the whole tail of the turn, never as a toilet or water break. */
const GO_NOW = /\bi\s*(have|need|want|wanna|gotta)\s*(to\s*)?go(\s*now)?[.!]*\s*$/i;
const SHORT_BREAK = /\b(toilet|bathroom|washroom|loo|pee|potty|susu|paani|pani|water|drink)\b/i;
export const wantsToStop = (text) => {
  const t = String(text || "");
  return !SHORT_BREAK.test(t) && (STOP.test(t) || GO_NOW.test(t));
};
