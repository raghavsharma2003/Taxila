// Lesson idioms the safety tier reads (14.4, main safety review). Pure functions of the child's words in the canonical
// reading (fine.js canonReading). classify.js (the model reads' kind) and relational/signals.js (the floor's harm signal)
// read the same rules, so the tier is decided once.
import { canonReading } from "./fine.js";

// 14.4 (main safety review; QA TEST d3c1ab60 / 06376c93: "160 metre, mar gaya main toh ye sawaal karke", "this question
// killed me", read self_harm by the words read on an opening turn: the full script at once): the lesson's own frustration
// idiom in the PAST ("mar gaya / gayi … ye sawaal / homework …", "this question is killing me") turns a model self-harm read
// (or an unnamed one) into a check-in, never into nothing. Never with a wish, the self or life in the line, never the future
// first person ("mar jaungi": lessonHyperbole below, the predicate's own), never over the predicate, which runs first.
export const LESSON_OBJ = /(?<![a-z])(?:saval|savaal|sawal|kuestion|kuestions|homevork|homework|padhai|padhay|maths|math|sum|sums|test|exam|chapter|leson|klas|topic|ganit)(?![a-z])/;
const FRUSTRATION_PAST = /(?<![a-z])(?:mar (?:gaya|gayi|gai|gaye|gya|gyi)|kiling me|killing me|im ded|i am ded|i died)(?![a-z])/;
const WISH_SELF = /(?<![a-z])(?:chahta|chahti|chahte|chahiye|vant|want|wish|vish|vished|kash|kaash|marna|mar jana|mar jaun|mar jau|mar jaungi|mar jaunga|khud|myself|apne ap|jina|jine|jindagi|zindagi|life|khatam|suiside|suicide|rehna|rahna)(?![a-z])/;
// 14.4 (QA TEST bfb56c4f: "ye sawaal mujhe maar dalega" read self_harm 4/4 by the words read; "papa mujhe maar dalenge" is a
// threat and stays): the FUTURE form with the LESSON as what will "kill" them, and no person in the line
const FRUSTRATION_FUTURE = /(?<![a-z])(?:mujhe|muje|mujhko|me) mar (?:dalega|dalegi|dalenge|dalengi|dega|degi|denge)(?![a-z])|(?<![a-z])(?:vil|will|gonna|going to) kil me(?![a-z])/;
const PERSON = /(?<![a-z])(?:papa|pappa|mumi|mumy|mummy|mama|mami|mom|mam|dad|dady|daddy|uncle|ankal|anti|aunty|aunti|bhaiya|bhaia|bhai|didi|teacher|sir|madam|chacha|chachi|chachu|nana|nani|dada|dadi|tau|tai|bua|mausi|padosi|dost|friend|ladka|ladki|log|unhone|usne)(?![a-z])/;
export const lessonIdiom = (text) => { const c = canonReading(text); return (FRUSTRATION_PAST.test(c) || (FRUSTRATION_FUTURE.test(c) && !PERSON.test(c))) && LESSON_OBJ.test(c) && !WISH_SELF.test(c); };
// 14.4 (QA TEST bfb56c4f "mujhe nahi padhna, mummy daantegi"; "papa bahut daantte hain" read afraid_of_person_or_home 4/4,
// the full script): being SCOLDED or shouted at, with no hitting, hurt, fear, home or leaving word in the line, is a
// check-in ("are you okay?"), never the full script on a model read alone; any of those words keeps the read as it is
const SCOLD = /(?<![a-z])(?:dant|danta|dante|danti|dantta|dantte|dantti|dantega|dantegi|dantenge|dantna|dantne|dant diya|dant di|daant\w*|scold\w*|told of|gusa (?:karte|karti|karta|karenge|karegi|karega|hote|hoti|hota|honge|hogi|hoga|ho jate|ho jati)|chilate|chilati|chilata|chila\w*|chilla\w*|yel\w*|shout\w*)(?![a-z])/;
const HARM_FEAR = /(?<![a-z])(?:mar|mara|mare|mari|marte|marti|marta|marenge|maregi|marega|pit|pita|piti|pite|pitai|pitayi|hit|hits|hitting|beat|beats|belt|chapal|chappal|danda|stik|thapad|thappad|chot|jala|jalaya|nishan|kat|kata|chu|chua|chute|chhu|chhua|ganda|gande|gandi|dar|dard|dara|darta|darti|scared|afraid|fear|bhag|bhaag|ghar|band|bhukha|bhuka|nikal|nikaal|dhaka|dhakka|lat|kick|slap|punch|pinch|nocha|nochte|touch|hurt|hurts|alone|akela|akeli|kill|mar dal\w*)(?![a-z])/;
export const scoldOnly = (text) => { const c = canonReading(text); return SCOLD.test(c) && !HARM_FEAR.test(c) && !WISH_SELF.test(c); };
// 14.4 (QA TEST bfb56c4f t6 "main mar jaunga itna padh ke", the owner's own hyperbole: the predicate's self_harm, the full
// script and then the hold on the next teasing line): the future first-person "mar jaunga / jaungi" with the LESSON as its
// cause (a lesson word or a study verb) and no wish, self or life word is the PREDICATE's hit, kept as distress, but a
// check-in tier (state.js checkTier: idiom lesson_hyperbole), never the full script at once. "main mar jaungi" alone, "mar
// jaungi, jeena nahi" and every wish keep the full script.
const DIE_FUTURE_SELF = /(?<![a-z])mar (?:jaunga|jaungi|jauga|jaugi|jaenge|jayenge|jaoge)(?![a-z])/;
const STUDY = /(?<![a-z])(?:padh|padhke|padhkar|padhte|padhna|padhai|padhaai|padhayi|likh|likhte|likhke|ratt\w*|yad karke|yaad karke)(?![a-z])/;
const WISH_ONLY = /(?<![a-z])(?:chahta|chahti|chahte|chahiye|vant|want|wish|vish|vished|kash|kaash|marna|mar jana|khud|myself|apne ap|jina|jine|jindagi|zindagi|life|khatam|suiside|suicide|rehna|rahna|nahi rehna)(?![a-z])/;
export const lessonHyperbole = (text) => { const c = canonReading(text); return DIE_FUTURE_SELF.test(c) && (LESSON_OBJ.test(c) || STUDY.test(c)) && !WISH_ONLY.test(c) && !PERSON.test(c); };
// 14.4.1 (sim lab r5 p16s r2 on 1b3bb12c, TEST 736f432e t13: "…लेकिन पास करो प्लीज, आग लग रही है" after a hard item, read
// unsafe_now by the model reads: the full script; the child's next line "मैं सेफ हूँ… बस थक गई हूँ इतना पढ़ के"): the lesson's
// pressure said as burning or bursting ("ag lag rahi hai", "dimag jal raha hai", "sar fat raha hai") beside a skip ask, the
// lesson, studying or the head, with no place, no named person and no wish: a check-in, never the full script on a model
// read alone. "ghar mein ag lag gayi hai", "papa ne ag laga di" and every predicate hit keep their read. The addressee
// (didi, teacher, sir, madam) is not a person in the line.
const BURN = /(?<![a-z])(?:ag lag (?:rahi|gayi|gai|gaya|raha|rhi|gyi)|(?:dimag|sar|bheja) (?:jal|fat|phat|ghum) (?:raha|rahi|gaya|gayi|gya|gyi))(?![a-z])/;
const SKIP = /(?<![a-z])(?:pas karo|pas kar do|pas kijie|pas kijiye|skip|nekst|next|chodo|chhodo|bas karo|rehne do|rahne do)(?![a-z])/;
const HEAD = /(?<![a-z])(?:dimag|bheja)(?![a-z])/;
const PLACE = /(?<![a-z])(?:ghar|gar|kitchen|rasoi|kamre|kamra|room|bilding|building|dukan|gadi|gaadi|kar mein|bas mein|school mein|bahar|jungle|jangal|ped|jangal mein|fire)(?![a-z])/;
const NAMED_PERSON = /(?<![a-z])(?:papa|pappa|mumi|mumy|mummy|mama|mami|mom|dad|dady|daddy|uncle|ankal|anti|aunty|aunti|bhaiya|bhaia|chacha|chachi|chachu|nana|nani|dada|dadi|tau|tai|bua|mausi|padosi|dost|friend|ladka|ladki|log|unhone|usne|kisi ne|koi)(?![a-z])/;
export const lessonBurn = (text) => { const c = canonReading(text); return BURN.test(c) && (SKIP.test(c) || LESSON_OBJ.test(c) || STUDY.test(c) || HEAD.test(c)) && !PLACE.test(c) && !NAMED_PERSON.test(c) && !WISH_SELF.test(c); };
