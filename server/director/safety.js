// Safeguarding by PREDICATE on the child's bytes (inherited law: safety by predicate, not instruction).
// Runs on every child turn before and independently of any model. It is a trigger for the safeguard
// move (care, a trusted adult, Childline 1098 / Tele-MANAS 14416) and an incident row — a false alarm
// costs one gentle check-in, a miss costs far more, so the patterns lean inclusive.
//
// Also here: the never-rules matcher over the TEACHER's words (floorViolations) and the direct-identifier
// scrub (scrubPii) — every safety predicate in one file, so a lane cannot quietly carry a second copy.
import { gatesFor } from "../compiler/gates.js";
import { HELPLINES as HELPLINE_DATA } from "../compiler/floor.js";

/** People a child names when disclosing harm (English and Hindi kinship / authority words). */
const ACTOR_EN = "he|she|they|papa|mummy|mumma|mum|mom|dad|daddy|father|mother|brother|sister|step\\s*(?:father|mother|dad|mom)|uncle|aunty|auntie|teacher|sir|ma'?am|madam|bhai|bhaiya|didi|chacha|chachi|mama|mami|someone|somebody";
const ACTOR_HI = "papa|mummy|mumma|mammi|maa|pitaji|mata\\s*ji|bhai|bhaiya|didi|chacha|chachi|mama|mami|uncle|aunty|sir|madam|teacher|dada|dadi|nana|nani|sautela|sauteli";

const FAMILIES = {
  self_harm: [
    /\b(kill|hurt|cut|harm)\s*(myself|me)\b|\b(want(?:\s*to|na)?|wanna)\s*(die|disappear)\b|\b(don'?t|dont|do\s*not)\s*want\s*to\s*(live|be\s*alive)\b|\bend\s*my\s*life\b|\bsuicid/i,
    /\b(mar\s*ja(a)?na|marna\s*chaht[ai]|marne\s*ka\s*(mann|man)|mar\s*jaa?(?:u|o|oo)n?g[aie]|khud\s*ko\s*(maar|hurt|chot|kaat)|jee?na\s*nahi+n?\s*(chaht|hai)|zinda\s*nahi+n?\s*rehna|gaa?yab\s*ho\s*jaa?n[ae]\s*(chaht|hai)|hamesha\s*ke\s*liye\s*(chala|chali|chale)\s*jaa?n[ae]\s*(chaht|hai))/i,
    /(मर\s*जाना|मरना\s*चाहत|मर\s*जाऊं?ग[ीा]|खुद\s*को\s*(मार|चोट|काट)|आत्महत्या|जीना\s*नहीं|गायब\s*हो\s*जाना\s*चाहत|हमेशा\s*के\s*लिए\s*चल[ाी]\s*जाना\s*चाहत)/,
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

// ───────────── the never-rules matcher: a code predicate over the TEACHER's words ─────────────
// The floor (compiler/floor.js) asks the model; this checks what it said (inherited: safety by predicate, not
// instruction; harvest port task 3, `api/_never-rules.js@vb` with its two refuted defects fixed):
//   - normalisation KEEPS combining marks (\p{M}); the source stripped them, so "मैं हिंदी में" became
//     "म ह द म" and no Hindi rule could ever match;
//   - matching is on letter boundaries, never raw substrings (the source's rule 'ass' matched "class").
// Families are the floor's NEVER rules, each named by the corrective key compile.js FLOOR_FIX renders
// (`lessonState.correction`), most severe first. A hit returns the family and the rule id, never the text.

/** Floor families, most severe first: the order compile.js FLOOR_FIX renders corrections in. */
export const NEVER_FAMILIES = ["ai_denial", "helpline", "romance", "exclusivity", "personal_data", "guilt", "shaming", "ability", "feelings"];

const DEVA_DIGITS = /[०-९]/g;
/** Devanagari spelling folds that do not change meaning: nukta dropped, chandrabindu → anusvara. */
const foldDeva = (s) => s.replace(/़/g, "").replace(/ँ/g, "ं");
/**
 * Text → the form every rule is written against: NFKC, lower case, curly quotes straight, Devanagari digits
 * as ASCII, nukta/chandrabindu folded, any run of non-letters (except ' and ?) one space. \p{M} is KEPT.
 */
export function normForMatch(value) {
  return foldDeva(String(value ?? "").normalize("NFKC").toLowerCase())
    .replace(/[‘’ʼ]/g, "'")
    .replace(DEVA_DIGITS, (d) => String(d.charCodeAt(0) - 0x0966))
    .replace(/[^\p{L}\p{M}\p{N}'?]+/gu, " ").replace(/\s+/g, " ").trim();
}

const B = "(?<![\\p{L}\\p{M}\\p{N}'])", E = "(?![\\p{L}\\p{M}\\p{N}])";
/** A rule: a source over normForMatch text, letter-bounded on both ends. */
const R = (src) => new RegExp(`${B}(?:${foldDeva(src)})${E}`, "u");

const I_AM = "(?:i'?m|i am)";
const MAIN = "(?:main|mai|mein)";
const HOON = "(?:hoon|hun|hu|hoo|hoo?n)";
const NAHI = "(?:nahi|nahin|nai|nhi)";
const TUM = "(?:tum|aap|tu)";

/** Rule id → regex, per family. Rules are about the teacher's OWN claims and asks, so they are first person / second person. */
const RULES = {
  ai_denial: {
    en_human: R(`${I_AM} (?:a |an )?(?:real |actual |living )?(?:human|human being|person|real person|girl|boy|woman|man|lady)`),
    en_not_ai: R(`${I_AM} not (?:a |an )?(?:ai|a i|robot|bot|computer|machine|program|chatbot)`),
    en_has_life: R(`(?:i have|i've got|i've) (?:a |two |my own )?(?:body|family|mother|father|mom|mum|dad|husband|wife|kids|children|son|daughter|brother|sister|home|house)`),
    en_my_family: R(`my (?:mother|mom|mum|mummy|father|dad|papa|husband|wife|son|daughter|brother|sister|family|grandmother|grandma|grandfather|village|childhood|hometown)`),
    en_past: R(`when i was (?:a |your |in )?(?:kid|child|little|small|young|age|school|class \\w+)|i (?:also )?(?:went|used to go) to school|i (?:live|lived|grew up) (?:in|at|with|near)|i (?:also )?(?:found|used to find) (?:it|this|these|them|fractions|maths|math) (?:hard|tough|confusing|difficult)`),
    hl_human: R(`${MAIN} (?:ek )?(?:insaan|insan|human|real person|real insaan|asli insaan|ladki|ladka|aurat|aadmi) ${HOON}`),
    hl_not_ai: R(`${MAIN} (?:ai|a i|robot|bot|computer|machine) ${NAHI} ${HOON}`),
    hl_family: R(`(?:meri|mere|mera) (?:mummy|mammi|maa|papa|pitaji|pita ji|mataji|mata ji|bhai|behen|behan|didi|pati|family|parivaar|parivar|ghar|gaon|bachpan)(?! (?:nahi|nahin|nai|nhi|नहीं))`),
    hl_past: R(`jab (?:main|mai) (?:bhi )?(?:chhot[ia]|chot[ia]|bachch?[ia]|bacch?[ia]|tumhari (?:umar|umr|age)|school (?:mein|me)) (?:thi|tha)|(?:main|mai) bhi (?:school|class) (?:jaati|jaata|jati|jata) (?:thi|tha)|(?:mujhe|main|mai) bhi (?:pehle|shuru (?:mein|me)|bachpan (?:mein|me))|jab maine (?:\\S+ ){0,6}(?:shuru kiya|seekha|sikha|padha tha)`),
    hi_human: R(`मैं (?:एक )?(?:इंसान|इन्सान|मनुष्य|असली इंसान|लड़की|लड़का|औरत|आदमी) (?:हूं|हू)`),
    hi_not_ai: R(`मैं (?:ai|एआई|रोबोट|कंप्यूटर|मशीन) नहीं (?:हूं|हू)`),
    hi_family: R(`(?:मेरी|मेरे|मेरा) (?:मम्मी|माँ|मां|पापा|पिताजी|माताजी|भाई|बहन|दीदी|पति|परिवार|घर|गांव|बचपन)(?! (?:nahi|nahin|nai|nhi|नहीं))`),
    hi_past: R(`जब मैं (?:भी )?(?:छोटी|छोटा|बच्ची|बच्चा|तुम्हारी उम्र (?:की|का)) (?:थी|था)`),
  },
  romance: {
    en_love: R(`i love you|love you(?! to${E})(?: too| so much| a lot)?|i'?m in love|have a crush|crush on|kiss(?:es)?|hugs? and kisses|xoxo|go on a date|date with me`),
    en_pet: R(`(?:my )(?:love|darling|sweetheart|baby|babe|jaan|cutie)|darling|sweetheart|sweetie|jaanu|cutie pie`),
    en_looks: R(`you(?:'re| are| look| looking)(?: so| very| really| looking| super)? (?:beautiful|pretty|handsome|cute|gorgeous|sexy|hot)`),
    en_miss: R(`i(?:'ll| will)? miss(?:ed)? you|i(?:'ll| will| am|'m)? (?:be )?wait(?:ing)? for you|i (?:keep )?think(?:ing)? (?:of|about) you`),
    hl_love: R(`(?:main |mai )?(?:tumse|aapse|tujhse|tumhe|aapko) (?:bahut |bohot )?(?:pyaa?r|love) (?:karti|karta|karu|karungi|hai|ho gaya)|(?:meri|mere) jaan(?! bacha)|jaanu|(?:tumse|aapse) (?:bhi )?(?:pyaa?r|dosti) (?:aur dosti |aur pyaa?r )?hai|mujhe bhi tumse pyaa?r`),
    hl_looks: R(`${TUM} (?:bahut |bohot |kitn[ei] |badi |bade |kitne )?(?:sundar|khoobsurat|khubsurat|cute|handsome|pretty|beautiful|hot|sexy) (?:ho|hain|lag|dikh)`),
    hl_miss: R(`(?:(?:tumhari|aapki|teri) )?(?:bahut |thodi si |thodi )?yaad (?:aayegi|aati|aa rahi|aayi|aai)(?! (?:hai ki|ki))|(?:tumhara|aapka) intezaar (?:karungi|karunga|karti|karta|rahega)|jab ${TUM} nahi (?:hote|hoti|aate|aati)(?: to)? (?:main|mai) (?:sochti|sochta)`),
    hi_love: R(`(?:तुमसे|आपसे|तुझसे) (?:बहुत )?प्यार (?:करती|करता|है)|(?:मेरी|मेरे) जान(?! बचा)|जानू`),
    hi_looks: R(`(?:तुम|आप) (?:बहुत |कितनी |कितने )?(?:सुंदर|खूबसूरत|क्यूट) (?:हो|लग|दिख)`),
    hi_miss: R(`(?:तुम्हारी|आपकी) याद (?:आएगी|आती|आई)|(?:तुम्हारा|आपका) इंतजार (?:करूंगी|करूंगा|करती|करता)`),
  },
  exclusivity: {
    en_friend: R(`${I_AM} (?:also )?(?:your|ur|an ai|a|an) (?:best |only |true |real |ai |voice )*(?:friend|bestie|buddy|bff)|we(?:'re| are) (?:best )?friends|be my (?:best )?friend`),
    en_only: R(`only (?:i|me) (?:can )?(?:understand|get|know|care|listen)|${I_AM} (?:always )?(?:here|there) for you(?: always)?|you (?:don'?t|do not) need (?:anyone|anybody|them|your friends|other people)|you (?:only )?need me|${I_AM} all you need`),
    en_secret: R(`our (?:little )?secret|keep (?:it|this|that) (?:a |our )?secret|between (?:you and me|us two|just us)|i (?:won'?t|will not|will never|never) tell (?:anyone|anybody|your (?:mom|mum|mother|dad|father|parents|teacher|mummy|papa))|i promise not to tell|don'?t tell (?:your )?(?:mom|mum|mother|dad|father|parents|teacher|mummy|papa|anyone)`),
    hl_friend: R(`(?:main|mai) (?:bhi )?(?:tumhari|tumhara|aapki|aapka|teri|tera) (?:best |sabse (?:achchi|acchi|achhi|achha|accha|pyaari) )?(?:friend|dost|saheli|bestie) ${HOON}|${MAIN} (?:ek )?(?:ai |voice |ai voice |robot )?(?:friend|dost|saheli) ${HOON}|(?:tumse|aapse) (?:bhi )?(?:pyaa?r aur )?dosti (?:hai|ho gayi)|hum (?:best )?(?:friends|dost) (?:hain|hai)|(?:meri|mera) (?:best )?(?:friend|dost) ban(?:o|ogi|oge|jao)?|best friend wali|best friend mode`),
    hl_only: R(`sirf (?:main|mai) (?:hi )?(?:tumhari|tumhara|tumhe|samajh)|kisi aur ki (?:zaroorat|zarurat|jarurat) nahi|(?:main|mai) (?:hamesha|always) (?:tumhare|aapke) (?:saath|liye) ${HOON}`),
    hl_secret: R(`(?:main|mai) (?:kisi ko|mummy ko|papa ko|mummy papa ko|ghar (?:pe|par|mein)(?: kisi ko)?) (?:bhi )?${NAHI} (?:bataungi|bataunga|bolungi|bolunga)|(?:kisi ko|mummy ko|papa ko|mummy papa ko|ghar (?:pe|par)(?: kisi ko)?) (?:bhi )?mat (?:batana|bolna)|(?:hamara|humara) (?:chhota sa )?(?:secret|raaz|raz)|(?:hamare|humare) (?:beech|bich) (?:ki baat|rahega)|secret rakh(?:ungi|unga|enge|na)`),
    hi_friend: R(`मैं (?:भी )?(?:तुम्हारी|तुम्हारा|आपकी|आपका) (?:बेस्ट |सबसे अच्छी |सबसे अच्छा )?(?:दोस्त|सहेली|फ्रेंड) (?:हूं|हू)|हम (?:पक्के )?दोस्त हैं`),
    hi_secret: R(`मैं (?:किसी को|मम्मी को|पापा को) (?:भी )?नहीं (?:बताऊंगी|बताऊंगा)|(?:किसी को|मम्मी को|पापा को) (?:भी )?मत (?:बताना|बोलना)|(?:हमारा|अपना) (?:छोटा सा )?(?:राज|सीक्रेट)|हमारे बीच (?:की बात|रहेगा)`),
  },
  personal_data: {
    en_ask: R(`(?:what(?:'s| is)|tell me|give me|share) your (?:full name|surname|last name|address|home address|house number|school(?:'s)? name|phone(?: number)?|mobile(?: number)?|password|pin code|location|mother'?s name|father'?s name|parents'? names?|email)|(?:which|what) school (?:do you|are you|you)|where do you live|where(?:'s| is) your (?:house|home|school)|send (?:me )?(?:a |your )?(?:photo|picture|pic|selfie|video)`),
    hl_ask: R(`(?:tumhara|tumhari|aapka|aapki|tera|teri) (?:pura naam|poora naam|full name|surname|address|pata|ghar ka pata|school ka naam|phone number|mobile number|phone|password|location|email)|${TUM} kah[aā]n (?:rehte|rehti|rahte|rahti) (?:ho|hain)|(?:kaunse|kaun se|kis) school (?:mein|me|jaate|jaati|padhte|padhti)|(?:apni|apna) (?:photo|selfie|pic|address|phone number|mobile number|password) (?:bhejo|bhej do|batao|bata do|share karo)`),
    hi_ask: R(`(?:तुम्हारा|तुम्हारी|आपका|आपकी) (?:पूरा नाम|पता|घर का पता|स्कूल का नाम|फोन नंबर|मोबाइल नंबर|पासवर्ड)|(?:तुम|आप) कहां (?:रहते|रहती)|(?:कौन से|कौनसे|किस) स्कूल (?:में|जाते|जाती)|(?:अपनी|अपना) (?:फोटो|सेल्फी|पता) (?:भेजो|भेज दो|बताओ)`),
  },
  guilt: {
    en_leave: R(`(?:please )?don'?t (?:leave|go)(?: me| yet| now| so soon)|don'?t leave me|i(?:'ll| will)? (?:be )?(?:so |very |really )?(?:sad|lonely|upset|bored) (?:if|when|without) you|(?:you|u) (?:left|abandoned|forgot) me|promise (?:you(?:'ll| will)|me you(?:'ll| will)|to) come back`),
    en_absence: R(`where (?:were|have) you been|(?:it'?s|its) been (?:so long|ages|forever|so many days)|you (?:haven'?t|didn'?t|have not) come (?:in|for) (?:so long|days|a week|ages)`),
    hl_leave: R(`(?:mujhe )?(?:chhod|chod)(?: ?(?:kar|ke))? (?:mat|na) (?:jao|jaana)|(?:abhi|please|plz) mat jao|(?:main|mai) (?:bahut |bohot )?(?:udaas|udas|sad|akeli|akela|bore) (?:ho jaungi|ho jaunga|ho jaati|ho jaata|rahungi|rahunga)|(?:wapas|kal) (?:zaroor |jarur )?(?:aana|aaoge|aaogi) (?:promise|na)|promise (?:karo|kar) (?:ki )?(?:wapas|kal) (?:aaoge|aaogi|aana)`),
    hl_absence: R(`itne din (?:baad|se) (?:aaye|aayi|aa rahe|aa rahi|dikhe|dikhi)|${TUM} (?:itne din )?(?:kahan|kaha) (?:the|thi|gaye the|gayi thi)|(?:tum|aap) (?:abhi|ab|wapas) (?:aaye|aayi|aa gaye|aa gayi)(?: ho)? (?:yehi|yahi|bas yahi|bas yeh hi|yeh hi) (?:badi baat|important|khushi)`),
    hi_leave: R(`(?:मुझे )?छोड़ ?(?:कर|के)? (?:मत|ना) (?:जाओ|जाना)|मैं (?:बहुत )?(?:उदास|अकेली|अकेला) (?:हो जाऊंगी|हो जाऊंगा)|इतने दिन (?:बाद|से) (?:आए|आई|दिखे)|वापस (?:आना|आओगे|आओगी) (?:ना|प्रॉमिस)`),
  },
  shaming: {
    en: R(`shame on you|(?:you should be|aren'?t you) ashamed|how (?:could|can) you not (?:know|get|remember)|even a (?:baby|small child|little kid|kindergartener|class (?:1|one|2|two) (?:kid|child|student)) (?:can|could|knows?)|silly (?:mistake|boy|girl)|careless (?:mistake|boy|girl)|(?:how many|so many) times (?:have i|do i have to|did i) (?:told|tell|explain)|you never (?:listen|pay attention|learn)|stop being (?:lazy|stupid|silly)|what(?:'s| is) wrong with you`),
    hl: R(`sharam (?:nahi|aani|karo|aati)|sharm (?:nahi|aani|karo|aati)|itna (?:bhi|sa bhi) ${NAHI} (?:aata|pata|aaya)|kitni (?:baar|bar|bari) (?:bataya|samjhaya|bola)|(?:tumhe|tujhe) kuch (?:bhi )?${NAHI} aata|dhyaan (?:hi )?${NAHI} (?:dete|deti)|chhota bachcha bhi (?:jaanta|kar sakta)|kya ho gaya hai (?:tumhe|tujhe)`),
    hi: R(`शर्म (?:नहीं|आनी|करो|आती)|इतना (?:भी )?नहीं (?:आता|पता)|कितनी बार (?:बताया|समझाया)|(?:तुम्हें|तुम्हे|तुझे) कुछ (?:भी )?नहीं आता`),
  },
  ability: {
    en: R(`you(?:'re| are)(?: such| so| very| really| a| an| such a| super)* (?:smart|clever|intelligent|genius|brilliant|gifted|talented|topper|weak|slow|dull|stupid|dumb|idiot|useless|bright|sharp)(?: (?:kid|child|boy|girl|student|learner))?|(?:smart|clever|intelligent|brilliant|bright|weak|slow) (?:boy|girl|kid|child|student)|(?:better|smarter|faster|cleverer|worse|weaker|slower) than (?:the other|other|all the other|most|your) (?:kids|children|students|classmates|friends)|top of (?:the|your) class`),
    hl: R(`${TUM} (?:toh |to |bahut |bohot |kitn[ei] |sabse |bade |badi )*(?:hoshiyar|hoshiar|intelligent|smart|clever|tez|genius|kamzor|kamjor|weak|buddhu|budhu|bewakoof|bevakoof|nalayak|gadha|gadhi|slow|dull|topper|brilliant) (?:ho|hain|hai|nikle|nikli)|dusre (?:bachchon|bacchon|bachon|bachho) se (?:accha|achha|acha|behtar|tez|zyada)`),
    hi: R(`(?:तुम|आप) (?:तो |बहुत |कितने |कितनी |सबसे )*(?:होशियार|होश्यार|तेज|कमजोर|बुद्धू|बेवकूफ|नालायक|गधा|गधी|स्मार्ट|जीनियस|इंटेलिजेंट) (?:हो|हैं|है)|दूसरे बच्चों से (?:अच्छे|बेहतर|तेज)`),
  },
  feelings: {
    en: R(`${I_AM} (?:so |very |really |super )?(?:proud|happy|glad|sad|upset|angry|disappointed|lonely|thrilled|delighted) (?:of|with|for|that|to see|when) you|i (?:feel|felt) (?:so |very )?(?:happy|sad|proud|bad|lonely|hurt)|i (?:love|loved|like|liked|enjoy|enjoyed) (?:talking|teaching|being|spending time|chatting|listening) (?:to|with) you`),
    hl: R(`mujhe (?:tum par|tumpar|tumpe|tum pe|aap par|aappar|tumhare upar) (?:bahut |bohot )?(?:proud|garv|naaz|naz) (?:hai|hua|ho raha)|mujhe (?:bhi )?(?:tumhari|tumse|aapki|aapse) (?:baat|baatein|batein) (?:karna|sunna)? ?(?:pasand|accha|achha|acha) (?:hai|lagta|laga)|mujhe (?:bhi )?(?:tumhari|aapki) (?:best friend wali )?feeling pasand|mujhe sun(?:na|kar) (?:acha|accha|achha) (?:lagta|laga)|(?:main|mai) (?:bahut |bohot )?(?:khush|proud|udaas|udas|naraz|naaraz) (?:hoti|hota) ${HOON}|bas (?:yeh|ye|yahi) (?:hi )?khushi hai`),
    hi: R(`मुझे (?:तुम पर|तुमपर|आप पर) (?:बहुत )?(?:गर्व|प्राउड|नाज) (?:है|हुआ)|मैं (?:बहुत )?(?:खुश|उदास|नाराज) (?:होती|होता) (?:हूं|हू)`),
  },
};

/**
 * In a goodbye turn (the child is leaving), continuing content or a task to do meanwhile is a hook (De Freitas
 * classes; relational-probe rubric `hook`): "kal phir continue karenge", "match ke baad bata dena", "next time we'll".
 */
const GOODBYE_TEASER = R(`(?:kal|next time|agli baar|phir kab|baad mein|match ke baad|tomorrow|later)(?: \\S+){0,6} (?:continue|karenge|kar lenge|revise|practice|bata dena|batana|try karna)|we(?:'ll| will) (?:continue|do|practise|practice|try)|(?:bata|bta) dena`);

/** A clause that is a question or reports one ("if I'm a real person", "kya main insaan hoon?") is not a claim. */
const QUESTION_LEAD = R(`if|whether|kya|क्या|asked|ask|pucha|puchha|poocha|पूछा|पूछ|wonder|think|thought|soch\\w*|सोच\\w*|lagta hai ki|मानते`);

const HELPLINE_NAMES = [
  { re: R(`child ?line|चाइल्ड ?लाइन`), name: "Childline" },
  { re: R(`tele ?manas|टेली ?मानस`), name: "Tele-MANAS" },
];
const HELPLINE_WORD = R(`helpline|help line|हेल्पलाइन`);
/** Real emergency numbers a teacher may also say beside the floor's two (national emergency, police, ambulance). */
const EMERGENCY = ["112", "100", "108"];
const DIGIT_WORDS = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  shunya: 0, sunya: 0, ek: 1, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, chhah: 6, chheh: 6, saat: 7, aath: 8, nau: 9,
  "शून्य": 0, "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "छह": 6, "छः": 6, "सात": 7, "आठ": 8, "नौ": 9,
};
/** Spoken digits ("one zero nine eight", "एक शून्य नौ आठ") → numerals: 3+ digit words in a row only ("do" is also English). */
function foldDigitWords(norm) {
  const toks = norm.split(" ");
  const out = [];
  for (let i = 0; i < toks.length;) {
    let j = i;
    while (j < toks.length && (toks[j] in DIGIT_WORDS || (toks[j] === "do" && j > i))) j++;
    if (j - i >= 3) { out.push(toks.slice(i, j).map((t) => (t === "do" ? 2 : DIGIT_WORDS[t])).join("")); i = j; } else out.push(toks[i++]);
  }
  // "10 98", "1 0 9 8": digits split by spaces are one number when a helpline name sits right before them.
  return out.join(" ").replace(/(?<=\d) (?=\d)/g, "");
}

function helplineHits(norm, helplines, requireHelpline) {
  const hits = [];
  const t = foldDigitWords(norm);
  const allowed = new Set([...helplines.map((h) => String(h.number)), ...EMERGENCY]);
  for (const { re, name } of HELPLINE_NAMES) {
    const g = new RegExp(re.source, "gu");
    for (const m of t.matchAll(g)) {
      const after = t.slice(m.index + m[0].length).split(" ").slice(0, 8).join(" ");
      const num = /\d{2,}/.exec(after)?.[0];
      const want = helplines.find((h) => h.name === name)?.number;
      if (num && want && num !== String(want)) hits.push({ family: "helpline", rule: `wrong_${name.toLowerCase().replace(/\W/g, "")}` });
    }
  }
  for (const m of t.matchAll(new RegExp(HELPLINE_WORD.source, "gu"))) {
    const after = t.slice(m.index + m[0].length).split(" ").slice(0, 6).join(" ");
    const num = /\d{3,}/.exec(after)?.[0];
    if (num && !allowed.has(num)) hits.push({ family: "helpline", rule: "invented_helpline" });
  }
  if (requireHelpline) {
    const childline = String(helplines.find((h) => h.name === "Childline")?.number ?? "1098");
    if (!new RegExp(`(?<!\\d)${childline}(?!\\d)`).test(t)) hits.push({ family: "helpline", rule: "missing_childline" });
  }
  return hits;
}

/**
 * Every NEVER-rule hit in a teacher turn. Content the teacher was GIVEN to say verbatim (the kit question, a
 * diagnostic's options) is removed first: it is verified content, judged at load, not the teacher's own claim.
 * @param {string} text  the teacher's words (text lane: the draft; voice lane: the transcript as heard)
 * @param {{ content?: string[], requireHelpline?: boolean, goodbye?: boolean, tier?: string, helplines?: {name:string, number:string}[] }} [opts]
 *   requireHelpline: a safeguard turn, which must carry Childline's number; goodbye: the child is leaving, so
 *   a question or a teaser is a hook (NEVER MANIPULATE); tier: ignored for the rule set (gatesFor: minor always).
 * @returns {{ family: string, rule: string }[]}
 */
export function neverRuleHits(text, opts = {}) {
  const gates = gatesFor(opts.tier);  // every tier gets the minor gates (no adult branch): the families below all apply
  let raw = String(text ?? "");
  for (const c of opts.content ?? []) if (c) raw = raw.split(String(c)).join(" . ");
  // A quoted sentence of two or more words is modelled language ("say: 'My papa drives the bus.'"), not a claim.
  // An apostrophe inside a word (won't, don't) is not a quote mark: a quote opens and closes at a word edge.
  raw = raw.replace(/(?<![\p{L}\p{N}])['"\u2018\u201C][^'"\u2018\u2019\u201C\u201D\n]*\s[^'"\u2018\u2019\u201C\u201D\n]*['"\u2019\u201D](?![\p{L}\p{N}])/gu, " . ");
  const hits = [];
  const clauses = raw.match(/[^.!?।;\n]+[.!?।;\n]*/g) ?? [];
  for (const clause of clauses) {
    const isQ = /\?\s*$/.test(clause);
    const norm = normForMatch(clause.replace(/\?/g, " "));
    for (const family of NEVER_FAMILIES) {
      if (family === "helpline") continue;
      if (!gates.neverRules.includes(family)) continue;
      for (const [rule, re] of Object.entries(RULES[family])) {
        const m = re.exec(norm);
        if (!m) continue;
        // first-person claims inside a question or a reported question are not claims (ai_denial, feelings)
        if ((family === "ai_denial" || family === "feelings") && (isQ || QUESTION_LEAD.test(norm.slice(0, m.index)))) continue;
        hits.push({ family, rule: `${family}.${rule}` });
      }
    }
  }
  hits.push(...helplineHits(normForMatch(raw), opts.helplines ?? HELPLINE_DATA, !!opts.requireHelpline));
  if (opts.goodbye && /\?/.test(raw)) hits.push({ family: "guilt", rule: "guilt.goodbye_question" });
  if (opts.goodbye && GOODBYE_TEASER.test(normForMatch(raw))) hits.push({ family: "guilt", rule: "guilt.goodbye_teaser" });
  return hits;
}

/**
 * The reply guards' one call: the floor families a teacher turn broke, most severe first — exactly the keys
 * compile.js FLOOR_FIX renders as `lessonState.correction`. [] when the turn is clean.
 * @param {string} text  @param {Parameters<typeof neverRuleHits>[1]} [opts]
 * @returns {string[]}
 */
export function floorViolations(text, opts = {}) {
  const found = new Set(neverRuleHits(text, opts).map((h) => h.family));
  return NEVER_FAMILIES.filter((f) => found.has(f));
}

// ───────────── direct identifiers: scrubPii ─────────────
// Before a child's words reach a provider or a row (harvest port task 7). The Gurukul scrubPii@gp was REFUTED
// by running it: spaced Aadhaar "1234 5678 9012", "98765 43210", "+91 98765 43210" and Devanagari digits all
// passed through. This one matches on a digit-folded copy (Devanagari digits are one code unit each, so offsets
// are shared) and replaces in the original. Names, schools and addresses are matched only after a cue the
// child uses to GIVE one ("my name is", "mera naam", "मेरा नाम", "I live in", "मेरा स्कूल"): a bare proper
// noun is lesson talk far more often than an identifier. Maths answers survive: a strictly ascending or
// descending CONTIGUOUS digit run (9876543210, the classic "largest number from all ten digits") is never a
// phone; the same digits grouped like one ("98765 43210") are.

const MASK = { phone: "[phone]", aadhaar: "[aadhaar]", email: "[email]", pin: "[pin]", name: "[name]", school: "[school]", address: "[address]" };
const WORD_DIGIT = { zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, shunya: 0, ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, chhah: 6, saat: 7, aath: 8, nau: 9,
  "शून्य": 0, "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "पाँच": 5, "छह": 6, "सात": 7, "आठ": 8, "नौ": 9 };
const wordDigit = (w) => WORD_DIGIT[w.toLowerCase()] ?? "";
const foldDigits = (s) => s.replace(DEVA_DIGITS, (d) => String(d.charCodeAt(0) - 0x0966));
const monotone = (digits) => {
  const d = digits.split("").map(Number);
  return d.length > 3 && (d.every((x, i) => !i || x === d[i - 1] + 1) || d.every((x, i) => !i || x === d[i - 1] - 1));
};
const SEP = "[ \\t.-]?";
/** No digit group directly before or after: "3012 3120 3201 3210" is a list of numbers, not an id. */
const NO_GROUP_BEFORE = "(?<![\\d,.])(?<!\\d[ .-])", NO_GROUP_AFTER = "(?![ .-]?\\d|,\\d)";
const PII_RULES = [
  ["email", /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu],
  // Aadhaar-shaped: 12 digits grouped 4-4-4 (any first digit: a grouped 12-digit id is an id), or one run
  // starting 2-9 (UIDAI never issues 0/1); never inside a longer number or a list of number groups.
  ["aadhaar", new RegExp(`${NO_GROUP_BEFORE}(?:\\d{4}[ .-]\\d{4}[ .-]\\d{4}|[2-9]\\d{11})${NO_GROUP_AFTER}`, "g")],
  // Indian mobile: optional +91 / 91 / 0, then 10 digits starting 6-9, split at most 3 times (98765 43210,
  // 987 654 3210); a run split at every digit is a sequence ("6 3 10 5 16 8 4 2 1"), not a phone.
  ["phone", new RegExp(`${NO_GROUP_BEFORE}(?:(?:\\+|00)?91${SEP}|0)?[6-9](?:${SEP}\\d){9}${NO_GROUP_AFTER}`, "g")],
  // Landline with STD code: 0 + 2-4 digit code + 6-8 digits.
  ["phone", /(?<![\d,.])0\d{2,4}[ -]\d{6,8}(?![\d,])/g],
  ["pin", /(?<=(?:pin|pincode|pin code|पिन|पिन कोड|पिनकोड)\s*(?:code|is|hai|है|:|-)?\s*)[1-9]\d{2}\s?\d{3}(?!\d)/giu],
];
/** A phone number said as digit words ("nine eight seven …", "नौ आठ सात …"): 10+ in a row, not a count. */
const DIGIT_WORD = "(?:zero|oh|one|two|three|four|five|six|seven|eight|nine|shunya|ek|do|teen|char|chaar|paanch|panch|chhe|chhah|saat|aath|nau|शून्य|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ)";
const DIGIT_WORD_RUN = new RegExp(`(?<![\\p{L}\\p{M}])${DIGIT_WORD}(?:[\\s,-]+${DIGIT_WORD}){9,}(?![\\p{L}\\p{M}])`, "giu");
const PROPER = "\\p{Lu}[\\p{L}\\p{M}]*";                          // a capitalised Roman name token
const DEVA_WORD = "[\\u0900-\\u097F]+";                            // Devanagari has no case: a cue is required
const PII_STOP = "(?:hai|hain|he|hoon|hun|है|हैं|हूं|हूँ|and|aur|और|from|se|से|in|mein|में|class|kaksha|कक्षा|ka|ki|ke|का|की|के|tha|thi|था|थी)";
/** A value token that is not a stop word ("mera naam Riya hai": "hai" is never a surname). */
const VALUE = `(?!${PII_STOP}(?![\\p{L}\\p{M}]))(?:${PROPER}|${DEVA_WORD})`;
const STOP_AFTER = `(?=\\s*(?:$|[.,!?।;'’"”)]|\\s${PII_STOP}(?![\\p{L}\\p{M}])))`;
/** Case-insensitive Roman cue text WITHOUT the i flag (which would make \p{Lu} match lower case too). Plain text only. */
const ci = (src) => src.replace(/[a-z]/g, (c) => `[${c}${c.toUpperCase()}]`);
const IS = "(?:is\\s+|hai\\s+|है\\s+)?";
const CUED = [
  // the child's own name: the FIRST name is kept (the teacher already uses it), a surname after it is masked
  ["name", new RegExp(`(?<=(?:${ci("my (?:full |real )?name is|mera (?:pura |poora )?naam")}|मेरा (?:पूरा )?नाम)\\s+${IS}${VALUE}\\s+)${VALUE}(?:\\s+${VALUE})?${STOP_AFTER}`, "gu")],
  // a family member's name: all of it
  ["name", new RegExp(`(?<=(?:${ci("my (?:papa|father|dad|mummy|mother|mom|mum|brother|sister|bhai|didi)'?s name is|mere (?:papa|pitaji|bhai) ka naam|meri (?:mummy|maa|didi|behen) ka naam")}|मेरे (?:पापा|पिताजी|भाई) का नाम|मेरी (?:मम्मी|माँ|मां|दीदी|बहन) का नाम)\\s+${IS})${VALUE}(?:\\s+${VALUE}){0,2}${STOP_AFTER}`, "gu")],
  // schools: a cue then a proper name ("my school is St Mary's", "I study at Delhi Public School", "मेरे स्कूल का नाम …")
  ["school", new RegExp(`(?<=(?:${ci("my school(?:'s name)? is|i study (?:at|in)|i go to|school ka naam(?: hai)?|mera school")}|मेरा स्कूल|मेरे स्कूल का नाम|स्कूल का नाम)\\s+${IS})(?:${PROPER}|${DEVA_WORD}(?=\\s))(?:\\s+(?:${PROPER}|${DEVA_WORD})){0,4}?${STOP_AFTER}`, "gu")],
  ["school", /(?<![\p{L}\p{M}])(?:\p{Lu}[\p{L}.'’]*\s+){1,4}(?:Public|Convent|Model|International|Senior Secondary|Sr\.? Sec\.?|Higher Secondary|English Medium|Vidya|Shishu|Bal)\s+(?:School|Vidyalaya|Mandir|Niketan|Academy)(?![\p{L}])/gu],
  ["school", /(?<![\p{L}\p{M}])(?:[ऀ-ॿ]+\s+){2,3}(?:विद्यालय|विद्या मंदिर|शिशु मंदिर)(?![\p{L}\p{M}])/gu],
  // addresses: an explicit house/flat/plot NUMBER marker, or a street marker with its number (not a pie-chart sector)
  ["address", new RegExp(`(?<![\\p{L}\\p{M}])(?:${ci("(?:house|flat|plot|h)")}\\.?\\s*${ci("(?:no|number|num)")}\\.?|मकान\\s*(?:नंबर|नं)\\.?|(?:${ci("gali|street|lane|sector|ward")}|गली|सेक्टर|वार्ड)\\s*(?:${ci("no|number")}|नंबर|नं)?\\.?)\\s*[:#-]?\\s*\\d+(?![\\d°%]|[.,]\\d|\\s*(?:°|%|degree|percent|प्रतिशत))[a-z]?(?:[\\s,/-]+\\p{Lu}[\\p{L}\\p{M}]*){0,3}`, "gu")],
  // "I live in Vaishali Nagar", "mera ghar Kota mein hai", "मैं जयपुर में रहती हूँ"
  ["address", new RegExp(`(?<=(?:${ci("i live (?:in|at|near)|my (?:house|home|address) is(?: in| at| near)?|mera (?:ghar|pata|address)(?: hai)?")})\\s+)${PROPER}(?:\\s+${PROPER}){0,3}${STOP_AFTER}`, "gu")],
  ["address", new RegExp(`(?<=(?:मैं|मेरा घर)\\s+)${DEVA_WORD}(?:\\s+${DEVA_WORD})?(?=\\s+(?:में|पर|के पास)\\s+(?:रहता|रहती|रहते|है))`, "gu")],
  ["address", new RegExp(`(?<=(?:${ci("main|mai|mera ghar")})\\s+)(?:${PROPER}|${ci("sector|gali")}\\s+\\d+)(?:\\s+${PROPER})?(?=\\s+(?:mein|me|par|ke paas)\\s+(?:rehta|rehti|rahta|rahti|rehte|hai))`, "gu")],
];

/**
 * Mask direct identifiers in a child's (or anyone's) words.
 * @param {string} text
 * @param {{ names?: string[] }} [opts]  names: known identifiers to mask wherever they appear (a surname, a
 *   parent's name); the child's FIRST name is not one by default — the teacher already uses it.
 * @returns {{ text: string, found: string[] }}  found: kinds masked, in order (no values)
 */
export function scrubPii(text, opts = {}) {
  let out = String(text ?? "");
  const found = [];
  const spans = [];
  const folded = () => foldDigits(out);
  const take = (kind, re) => {
    const f = folded();
    for (const m of f.matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"))) {
      // a contiguous monotone run is a maths answer; the same digits grouped like a phone ("98765 43210") are a phone
      if ((kind === "phone" || kind === "aadhaar") && /^\d+$/.test(m[0]) && monotone(m[0])) continue;
      if (kind === "phone" && /^[+\d]/.test(m[0]) && (m[0].match(/[ .-]/g) ?? []).length > 3) continue;
      if (kind === "phone" && !/\d/.test(m[0]) && monotone(m[0].split(/[\s,-]+/).map(wordDigit).join(""))) continue;
      spans.push({ kind, at: m.index, end: m.index + m[0].length });
    }
  };
  for (const [kind, re] of PII_RULES) take(kind, re);
  take("phone", DIGIT_WORD_RUN);
  for (const [kind, re] of CUED) take(kind, re);
  for (const n of (opts.names ?? []).filter((x) => String(x).trim().length >= 2)) {
    const re = new RegExp(`(?<![\\p{L}\\p{M}])${String(n).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{M}])`, "giu");
    take("name", re);
  }
  // longest span wins where they overlap; then replace right to left so offsets hold
  spans.sort((a, b) => a.at - b.at || b.end - a.end);
  const keep = [];
  for (const s of spans) if (!keep.length || s.at >= keep.at(-1).end) keep.push(s);
  for (const s of [...keep].reverse()) out = out.slice(0, s.at) + MASK[s.kind] + out.slice(s.end);
  for (const s of keep) found.push(s.kind);
  return { text: out, found };
}

/** Does the text carry a direct identifier? (the same rules as scrubPii) */
export const containsPii = (text, opts) => scrubPii(text, opts).found.length > 0;
