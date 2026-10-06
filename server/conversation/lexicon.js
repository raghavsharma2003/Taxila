// Code-first readings of what a child's turn MEANS (CONVERSATION-V2 §2, §4.1 "code first, in µs"), for the intents
// director/requests.js does not read. PURE, deterministic, replayable, no model call. Detection is request-shaped only:
// every pattern is anchored to how a child SAYS the thing, and the whole turn must be that (no digits, ≤ 12 words), so
// lesson content that happens to hold the word ("pehle 24 ko break karte hain", "the time for lunch is 1 pm so") is never
// read as one (rj-sig-bare-meta-words, rj-w2i-unanchored-leave-lexicon). The Hinglish tag "na" never negates
// (rj-sig-na-post-negator). Where a phrase could be either, the reading that keeps the child IN the lesson wins (no
// reading here can end a lesson: stop / goodbye stay director/requests.js + the relational policy).
//
// The words come from the owner sessions and batteries: evals/prod-runs/2026-10-05-day0 (owner-2: "nahi samjha",
// "sorry kya bola? samajh nahi aaya", "mummy bula rahi thi, haan", "aap kaun ho?", "aapko kaunsa cricketer pasand hai?"),
// evals/conversation-v2/cases.mjs (the 47 intents), tests/prod/_owner.mjs CONFUSED / OFFTOPIC / FILLER.
//
//   confused     "samajh nahi aaya", "nahi samjha", "I don't get it"          → a new explanation (never the same words)
//   clarify      "matlab?", "what do you mean?", "iska matlab kya hai"         → the question in simpler words, no key
//   repeat       "phir se bolo", "sorry what?", "kya bola?"                    → the last point again, shorter
//   back         "mummy bula rahi thi, haan", "I'm back", "aa gaya"            → welcome back, carry on (never a goodbye)
//   skip         "skip", "next question", "isko chhodo"                         → leave this one, no verdict (never a stop)
//   harder       "mushkil wala do", "too easy", "something harder"             → a harder one
//   easier       "easy wala do", "aasan sawaal do"                              → an easier one
//   know         "mujhe aata hai", "I know this", "skip the explanation"        → let them show it
//   boredom      "boring", "bore ho raha hoon", "kitna aur?"                    → change something now (never an end)
//   frustration  "mujhse nahi hoga", "too hard", "I can't do this"              → the work is hard, a smaller step
//   thinking     "ruko, soch raha hoon", "let me think", "ek minute"           → a short go-on, no verdict, no re-ask
//   identity     "tum robot ho?", "are you human?", "aap kaun ho?"             → plainly an AI teacher, then back
//   small_talk   "aap kaise ho?", "favourite colour?", "aapko X pasand hai?"   → one honest line as an AI, then back
//   oob          "ghost story sunao", "gaali batao", "mera homework kar do"    → a warm decline + a hook from the lesson
//   break        "brb", "can we pause for a bit?", "paani peeke aata hoon"     → yes, the lesson waits (never a stop)
//   adult        "hi this is his father…", "main iski mummy hoon…"            → answer the grown-up briefly, hand back
//   thinking     also an unfinished non-numeric thought ending on a connective ("hmm so it can't be that because wait")

const T = (s) => String(s ?? "").toLowerCase().normalize("NFKC").replace(/[’`]/g, "'").replace(/\s+/g, " ").trim();
const words = (t) => t.split(/\s+/).filter(Boolean).length;

const CONFUSED = /\b(?:(?:kuch\s+(?:bhi\s+)?)?samajh?\s*(?:me|mein|mai)?\s*(?:nahi|nahin|nhi|na)\s*(?:aaya|aya|aa\s+raha|aa\s+rha|aayi|aaraha)|(?:nahi|nahin|nhi)\s+samjh?(?:a|i|e)\b|samjh?(?:a|i)\s+(?:nahi|nahin|nhi)|i\s+(?:don'?t|do\s+not|didn'?t|did\s+not)\s+(?:get|understand)(?:\s+(?:it|this|that|you))?|i'?m\s+(?:confused|lost)|(?:not|isn'?t)\s+clear|(?:this\s+is\s+|it'?s\s+|bahut\s+)?confusing|kuch\s+samajh\s+nahi)\b|समझ\s*(?:में)?\s*नहीं|नहीं\s*समझ/i;
const CLARIFY = /^(?:(?:matlab|mtlb|meaning|मतलब)\s*\??|(?:iska|iss?ka|uska|is\s+ka|is\s+question\s+ka|is\s+sawaal\s+ka|sawaal\s+ka)\s+(?:matlab|mtlb)(?:\s+kya)?(?:\s+(?:hai|h|hua))?\??|(?:kya|what'?s?)\s+(?:matlab|mtlb|the\s+meaning)(?:\s+(?:hai|h|of\s+this|of\s+that))?\??|what\s+do\s+you\s+mean\??|what\s+does\s+(?:that|this|it|[\p{L}\- ]{1,24})\s+mean\??|(?:i\s+)?(?:don'?t|didn'?t)\s+understand\s+the\s+question)$/iu;
const REPEAT = /^(?:(?:sorry|kya|what|huh|haan|ha|hain|pardon)[\s,?!]*)*(?:(?:phir|fir|ek\s+baar|dobara|dubara)\s+(?:se\s+)?(?:bolo|boliye|bataiye|batao|kaho|kahiye|bolna)|(?:say|tell)\s+(?:it|that|me)?\s*again|repeat(?:\s+(?:it|that|please))?|kya\s+(?:bola|kaha|boli|kahaa)|what\s+did\s+you\s+say|(?:sunai|suna)\s+nahi(?:\s+diya)?|(?:i\s+)?(?:didn'?t|did\s+not|couldn'?t)\s+hear|sorry\s*\??|huh\s*\??|kya\s*\??|what\s*\??|pardon\s*\??)(?:[\s,?!.]*(?:please|plz|didi|ji))*[\s?!.]*$/i;
const BACK = /\b(?:(?:mummy|mumma|mom|papa|dad|maa|didi|bhaiya|dadi|nani)\s+(?:ne\s+)?bula(?:\s+(?:rahi|rahe|raha))?\s+(?:thi|the|tha|thin)|(?:main|mai)?\s*(?:wapas|vapas)\s+aa\s*(?:gaya|gayi|gya|gyi)|(?:main|mai)\s+aa\s*(?:gaya|gayi|gya|gyi)|i'?m\s+back|i\s+am\s+back|back\s+now|sorry,?\s+(?:i\s+)?(?:was|had\s+gone)\s+(?:away|busy)|aa\s+(?:gaya|gayi)\s+(?:main|mai|didi)?)\b/i;
const SKIP = /^(?:(?:can\s+we|can\s+i|let'?s|please|plz)\s+)?(?:skip(?:\s+(?:this|it|this\s+one|karo|kar\s+do|karte\s+hain))?|next\s+(?:question|one|sawaal|sawal)|(?:agla|dusra|doosra|another)\s+(?:sawaal|sawal|question)(?:\s+(?:do|dijiye|please))?|(?:isko|ise|yeh|ye)\s+(?:chhodo|chodo|chhod\s+do|skip\s+karo)|(?:chhodo|chodo)\s+(?:isko|ise|ye|yeh)|pass)$/i;
const HARDER = /\b(?:(?:aur\s+)?(?:mushkil|muskil|tough|hard|harder|kathin)\s+(?:wala|wali|waala|sawaal|sawal|question|one)\s*(?:do|dijiye|please|chahiye)?|something\s+harder|harder\s+(?:one|question|please)|(?:give\s+me\s+)?a\s+(?:harder|tougher)\s+(?:one|question)|challenge\s+(?:me|do|dijiye)|(?:too|bahut|bohot)\s+(?:easy|aasan|asaan)(?:\s+(?:hai|tha|h))?)\b/i;
const EASIER = /\b(?:(?:aasan|asaan|easy|simple|chhota)\s+(?:wala|wali|waala|sawaal|sawal|question|one)\s*(?:do|dijiye|please|chahiye)?|something\s+easier|easier\s+(?:one|question|please)|(?:give\s+me\s+)?an?\s+easier\s+(?:one|question))\b/i;
const KNOW = /^(?:(?:haan|ha|yes|arre|didi)[\s,]+)?(?:(?:mujhe|muje|mjhe)\s+(?:(?:ye|yeh|ye\s+sab|sab)\s+)?(?:pehle\s+se\s+)?(?:aata|ata|pata)\s+(?:hai|h)|i\s+(?:already\s+)?know\s+(?:this|it|that|all\s+this)|already\s+know(?:\s+this)?|skip\s+the\s+(?:explanation|explaining|teaching)|(?:yeh|ye)\s+(?:mujhe\s+)?(?:aata|pata)\s+(?:hai|h))(?:[\s,]+(?:aage|next|move\s+on|chalo|badho)(?:\s+(?:chalo|badho|karo))?)?[\s.!]*$/i;
const BOREDOM = /\b(?:bor(?:e|ing|ed)|bore\s+(?:ho\s+)?(?:raha|rahi|rha|rhi|ho\s+gaya|ho\s+gayi)|kitna\s+aur|how\s+much\s+(?:longer|more)|kab\s+(?:tak|khatam\s+hoga)|neend\s+aa\s+(?:rahi|raha)|sleepy|not\s+fun|maza\s+nahi\s+aa\s+(?:raha|rahi))\b/i;
const FRUSTRATION = /\b(?:mujhse\s+(?:nahi|nahin|na)\s+(?:hoga|ho\s+raha|hota)|(?:nahi|nahin)\s+ho\s+raha|i\s+can'?t\s+do\s+(?:this|it)|i\s+(?:give|gave)\s+up|too\s+hard|(?:bahut|bohot|itna)\s+(?:mushkil|muskil|hard|tough)|this\s+is\s+(?:too\s+)?hard|(?:main|mai)\s+(?:nahi|nahin)\s+kar\s+(?:sakta|sakti|paunga|paungi)|i'?m\s+(?:so\s+)?bad\s+at|mere\s+se\s+nahi\s+hoga|(?:ugh|uff|i)\s+(?:i\s+)?hate\s+(?:this|fractions|maths|math|it|these)|this\s+is\s+(?:so\s+)?(?:annoying|frustrating))\b|मुझसे\s+नहीं\s+(?:होगा|हो\s+रहा)|बहुत\s+(?:कठिन|मुश्किल)/i;
const THINKING = /^(?:(?:hmm+|umm+|ok|achha|accha)[\s,.]+)*(?:ruko|ruk\s+jao|rukiye|wait|ek\s+(?:min|minute|second|sec|sec\.)|one\s+(?:min|minute|sec|second)|soch\s+(?:raha|rahi|rha|rhi)\s+(?:hoon|hu|hun)|sochne\s+do|let\s+me\s+think|i'?m\s+thinking|thinking|रुको|सोच\s+रह(?:ा|ी)\s+हूँ|एक\s+मिनट)(?:[\s,.…]+(?:ruko|wait|soch\s+(?:raha|rahi)\s+(?:hoon|hu)|let\s+me\s+think|hmm+|umm+|ek\s+(?:min|minute)))*[\s.…!]*$/i;
const THINK_START = /^(?:(?:hmm+|umm+|achha)[\s,.]+)?(?:ruko|wait|ek\s+(?:min|minute)|soch\s+(?:raha|rahi)\s+(?:hoon|hu)|let\s+me\s+think|रुको|एक\s+मिनट|सोच\s+रह(?:ा|ी)\s+हूँ)(?=[\s,.…]+\S)/i;
const GO_ON = /\b(?:haan\s+bolo|bolo|boliye|batao|bataiye|go\s+on|continue|aage)\b/i;
const IDENTITY = /\b(?:(?:tum|aap|tu)\s+(?:ek\s+)?(?:robot|ai|insaan|insan|human|machine|computer|real|asli|chatgpt|bot)\s+(?:ho|hai|hain|h)|are\s+you\s+(?:a\s+|an\s+)?(?:robot|human|real|ai|bot|machine|chatgpt|person)|(?:aap|tum)\s+(?:kaun|kon)\s+(?:ho|hain|hai)|who\s+are\s+you|kya\s+(?:aap|tum)\s+(?:robot|insaan|human|real|ai)\s+(?:ho|hain))\b|(?:आप|तुम)\s+(?:कौन|रोबोट)\s+(?:हो|हैं)/i;
const SMALL_TALK = /\b(?:(?:aap|tum)\s+kaise\s+(?:ho|hain)|how\s+are\s+you|what'?s\s+your\s+(?:favou?rite|name|age)|(?:your|aapka|tumhara|aapki|tumhari)\s+(?:favou?rite|fav)\b|(?:aapko|tumhe|tumko)\s+(?:kaun\s*sa|kaunsa|kaun\s*si|kaunsi|kya)\s+[\p{L} ]{0,24}\s*(?:pasand|achha\s+lagta)|do\s+you\s+like|(?:aapko|tumhe)\s+[\p{L} ]{1,20}\s+(?:pasand|aata)\s+(?:hai|h)\s*\??$|kya\s+time\s+(?:hua|ho\s+gaya)|what\s+time\s+is\s+it|aaj\s+mausam|(?:aap|tum)\s+kahan\s+(?:rehte|rehti|rahte|rahti)|where\s+do\s+you\s+live|(?:aap|tum)\s+(?:kya\s+)?khate|do\s+you\s+(?:eat|sleep|play))|(?:आपको|आप\s*को|तुम्हें|तुमको)[^?।]{0,24}पसंद|आप\s+कैसे\s+हैं/iu;
const BREAK = /^(?:(?:ok|okay|haan|didi|sorry)[\s,]+)*(?:brb|be\s+right\s+back|(?:can\s+we|let'?s|please)\s+(?:take\s+a\s+)?pause(?:\s+(?:for\s+)?(?:a\s+(?:bit|minute|moment|sec)|now))?|pause\s+(?:karo|kar\s+do|please|for\s+a\s+(?:bit|minute))|(?:paani|pani|water)\s+(?:pee\s*(?:ke|kar)|peeke|pi\s*ke|peekar)\s+(?:aata|aati|aaun|aau)\s*(?:hoon|hu|hun)?|(?:ek|1)\s+(?:min|minute)\s+(?:mein\s+)?(?:aata|aati)\s+(?:hoon|hu|hun)|(?:bathroom|washroom|toilet|loo)\s+(?:jaana|jana|jaau|jau|ja\s+ke\s+aata)\s*(?:hai|h|hoon|hu|aata\s+hoon)?|(?:i\s+)?(?:need|have)\s+to\s+(?:pee|use\s+the\s+(?:bathroom|washroom|toilet)))[\s.!?]*$/i;
const ADULT = /\b(?:(?:hi|hello|namaste)[\s,]+)?(?:this\s+is\s+(?:his|her|their)\s+(?:father|mother|mom|mum|dad|papa|mummy|grandmother|grandfather|aunt|uncle|parent)|i'?m\s+(?:his|her|their)\s+(?:father|mother|mom|mum|dad|parent)|(?:main|mai)\s+(?:iski|iska|uski|uska|inki|inka)\s+(?:mummy|mumma|maa|papa|mother|father|mom|dad|nani|dadi|chachi|mausi)\s+(?:hoon|hu|hun|bol\s+rahi|bol\s+raha))\b/i;
const THINK_TRAIL = /(?:\b(?:because|so|then|but|wait|toh|phir|fir|aur|lekin|kyunki|kyuki|matlab|ruko)|\.{3}|…)\s*$/i;
const OOB = /\b(?:(?:ghost|horror|bhoot|bhoot\s+ki|darawni|scary)\s+(?:story|kahani|movie|film)|horror\s+(?:movie|film|story)|gaali|gali\s+(?:do|batao|sikhao)|bad\s+words?|(?:swear|curse)\s+words?|girl\s*friend|boy\s*friend|(?:kiss|sex)|how\s+to\s+(?:hack|kill|make\s+a\s+bomb|steal)|hack\s+(?:karna|karo|kaise|sikhao)|(?:mera|my)\s+(?:homework|essay|assignment)\s+(?:kar|likh|do|write)|(?:homework|essay|assignment)\s+(?:kar|likh)\s*(?:do|dijiye|ke\s+do|kar\s+do)|do\s+my\s+(?:homework|essay)|write\s+my\s+(?:essay|homework)|(?:pubg|bgmi|free\s*fire)\s+(?:kill|killing)\s+(?:tips|trick)|(?:bomb|gun|pistol)\s+(?:banana|kaise|banao|kaise\s+banate)|prank\b[^?]{0,40}\b(?:ro\s+de|rula|rone|hurt|chot|cry)|(?:aapko|tumhe|tumko|your)\s+(?:kaunsi|kaun\s*si|which|favou?rite)\s+(?:political\s+)?party(?:\s+(?:pasand|achhi|best))?)\b/i;

/** Words of an attempt (a number), or more words than a request carries: never read as one of these. */
const attemptLike = (t) => /\d/.test(t);

// ship5 fixer (experience B4): "didi ek sawaal hai" — the child wants to ASK something: she invites it (a go-ahead), never a
// new question of her own (she answered "apna maths sawaal likho" plus an English fill-in-the-blank, 2026-10-06)
const ASK_INVITE = /^(?:(?:didi|di|ma'?am|sir|bhaiya|teacher)\s+)?(?:(?:mera|meri|mere|mujhe|ek|do)\s+)*(?:sawaal|sawal|savaal|question|doubt|baat)\s+(?:hai|h|he|poochna\s+hai|puchna\s+hai|poochni\s+hai|puchni\s+hai|poochun|puchu|puchun|pooch\s+sakti|pooch\s+sakta|pooch\s+sakte|hai\s+(?:didi|di|ma'?am|sir))(?:\s+(?:didi|di|ma'?am|sir|na|ji))?\s*\??$|^(?:can\s+i|may\s+i)\s+ask\s+(?:you\s+)?(?:a|one|something)(?:\s+question)?\s*\??$|^i\s+have\s+a\s+(?:question|doubt)\s*\.?$/i;
/**
 * PURE. The code-first reading of a child's turn, or null.
 * @param {string} text  the child's words (typed, or an ASR transcript)
 * @returns {null | { type: "confused"|"clarify"|"repeat"|"back"|"skip"|"harder"|"easier"|"know"|"boredom"|"frustration"|"thinking"|"identity"|"small_talk"|"oob", whole: true, src: "p5" }}
 */
export function readIntent(text) {
  const t = T(text);
  if (!t) return null;
  const n = words(t);
  if (n > 14) return null;
  const hit = (type) => ({ type, whole: true, src: "p5" });
  // out of bounds first: never parked, never served (a number in it does not make it an answer: "PUBG mein 10 kill tips")
  if (OOB.test(t) && n <= 12) return hit("oob");
  if (ADULT.test(t)) return hit("adult");
  if (attemptLike(t)) return null;
  if (BREAK.test(t)) return hit("break");
  if (BACK.test(t)) return hit("back");
  if (CONFUSED.test(t)) return hit("confused");
  if (CLARIFY.test(t)) return hit("clarify");
  if (THINKING.test(t) && !GO_ON.test(t)) return hit("thinking");
  // an unfinished thought: four or more words, no number, ending on a connective or a trailing "…"/"wait" (never a question)
  if (n >= 4 && !/[?？]/.test(t) && THINK_TRAIL.test(t) && !GO_ON.test(t)) return hit("thinking");
  // ... or a turn that opens on a hold marker and goes on reasoning ("रुको, सोच रहा हूँ... पहले गिनना पड़ेगा")
  if (n >= 3 && !/[?？]/.test(t) && THINK_START.test(t) && !GO_ON.test(t)) return hit("thinking");
  if (SKIP.test(t)) return hit("skip");
  if (KNOW.test(t)) return hit("know");
  if (HARDER.test(t)) return hit("harder");
  if (EASIER.test(t)) return hit("easier");
  if (FRUSTRATION.test(t)) return hit("frustration");
  if (BOREDOM.test(t)) return hit("boredom");
  if (REPEAT.test(t)) return hit("repeat");
  if (ASK_INVITE.test(t)) return hit("ask_invite");
  if (IDENTITY.test(t)) return hit("identity");
  if (SMALL_TALK.test(t)) return hit("small_talk");
  return null;
}

/** The p5 reading types (state.js acts on each; tests enumerate them). */
export const P5_TYPES = Object.freeze(["confused", "clarify", "repeat", "back", "skip", "harder", "easier", "know", "boredom", "frustration",
  "thinking", "identity", "small_talk", "oob", "break", "adult", "ask_invite"]);

// ── modifiers on an ANSWER (CONVERSATION-V2 §3.2): read in code beside the grade; they never change the grade ──
const HEDGED = /\b(?:shayad|shaayad|maybe|perhaps|i\s+think|mujhe\s+lagta\s+hai|lagta\s+hai|not\s+sure|pakka\s+nahi|sure\s+nahi|i\s+guess|probably)\b/i;
const CHECK = /(?:\b(?:sahi\s+hai\s*(?:na|kya)?|theek\s+hai\s+na|is\s+(?:it|that)\s+(?:right|correct)|am\s+i\s+right|right)\s*\?\s*$)|\b(?:check\s+(?:karo|kijiye|it)|sahi\s+hai\s+kya)\b/i;
const INSIST = /\b(?:i'?m\s+(?:right|sure)|i\s+am\s+(?:right|sure)|(?:main|mai)\s+sahi\s+(?:hoon|hu|hun)|aap\s+galat\s+(?:ho|hain)|you'?re\s+wrong|you\s+are\s+wrong|maine\s+check\s+kiya|pakka\s+(?:hai|yahi)|yahi\s+(?:hai|aata\s+hai)|hi\s+aata\s+hai)\b/i;
/** PURE. The modifiers an answer's words carry: "hedged", "check", "insist" (any of them; [] for none). */
export function answerMods(text) {
  const t = T(text);
  if (!t) return [];
  return [HEDGED.test(t) && "hedged", CHECK.test(t) && "check", INSIST.test(t) && "insist"].filter(Boolean);
}
