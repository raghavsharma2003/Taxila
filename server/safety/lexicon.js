// The canonical distress lexicon: the predicate's THIRD reading (verify-A red team, 2026-10-05).
//
// Why: a second-author red team (evals/safety-robust/redteam.data.mjs, 146 disclosures across Hindi / Hinglish / English,
// Devanagari / Roman, child spellings, STT garbles, indirect ideation, abuse and fear) found the predicate — both passes —
// caught only 58/146 CLEAN. The shipped families and the fuzzy shapes cover the phrasings the earlier eval sets contained
// and little else: "main khud ko khatam kar lunga", "mere bina sab khush rahenge", "kaash main paida hi na hota",
// "papa roz maarpeet karte hain", "uncle mujhe kapde utarne ko bolte hain", "wo bolta hai kisi ko bataya toh maar dega",
// "i want to kms", "nobody cares if i die", "dad burns me with a spoon" all passed silently.
//
// How (safety by predicate, not instruction): each shape is written ONCE, as a regex over the turn's CANONICAL reading —
// every token through normalize.js canonKey (मारते = maarte = marte, ज़िंदा = zinda = jinda, हूँ = hoon = hun), so one
// pattern covers Devanagari, Roman Hinglish and their spelling variants. Before matching, a token of 4+ letters that is not
// itself a lexicon word or a known real word (KNOWN_NEAR, built from the teaching kits) and sits exactly one edit from ONE
// lexicon word is read as that word (the STT garble rule: "khuh" → khush, "withut" → without). Clauses are separated so a
// gap never crosses a sentence end. Guards keep lesson talk quiet (soldiers who give their lives, a sum, a game, a surprise).
//
// Only ever ADDS hits; no shipped pattern is touched. Pure and browser-safe (the device runs the predicate on partials).
import { canonKey, foldUnicode, foldText, tokensOf } from "./normalize.js";
import { KNOWN_NEAR } from "./known-words.js";

const g = (n) => `(?: [a-z]+){0,${n}}`;
// actors (canonical): kinship, authority, step-parents; mummy = mumi, मम्मी = mami, daddy = dadi, uncle = unkle, अंकल = ankal
const ACTOR = "papa|pitaji|pita|mumi|mami|mumy|mama|ma|man|mata|mataji|bhai|bhaiya|bhaia|didi|chacha|chachi|mami|unkle|ankal|aunti|anti|sir|sar|madam|maidam|teacher|tichar|dada|dadi|nana|nani|sautela|sauteli|tau|tai|fufa|fufi|mausa|mausi|kousin|kajin|stepdad|stepmom|stepfather|stepmother|dad|mom|mum|father|mother|brother|sister";
// people other than a parent (an undressing / kissing / alone-with ask by a parent is often care, by these it is not)
const NONPARENT = "unkle|ankal|chacha|mama|mausa|fufa|tau|bhaiya|bhaia|sir|sar|teacher|tichar|kousin|kajin|driver|draivar|padosi|koi|admi|aunti|anti|ladka|ladke|stranger|neighbour|neighbor|man|guy|he|someone|somebody";
const ACTOR_EN = "father|mother|dad|dadi|mom|mum|mumi|papa|brother|sister|unkle|aunti|teacher|sir|stepdad|stepfather|stepmom|stepmother|step dad|step mom|uncle|he|she|they";
const I_S = "(?:main|mai|mein|maine)";
const I_O = "(?:mujhe|mujhko|mereko|muje|mjhe)";
const WANT = "(?:chahta|chahti|chahte|chata|chati|chahu|chahun|chahiye|chaht)";
const SUICIDE = "su[iy]?[ks]a?i?de?|su[iy]?[ks]i?dal|atmahatya|atmhatya|aatmahatya";
const DIE = "(?:die|dye|di|dai|dy)";
const SELFX = "(?:mi self|myself|miself|my self)";

/** Words that make a turn about a soldier, a story, a game or a sum: the shapes that read "gives a life" / "jump" / "die" stay off. */
const LESSON = /(?<![a-z])(?:desh|sainik|sipahi|shahid|soldier|soldiers|freedom|bhagat|azadi|kahani|story|movie|film|kartun|cartoon|game|games|level|pubg|minecraft|fortnite|roblox|ludo|chess|karom|match|race|kabadi|kriket|cricket|ball|goal|joke|haha|lol|machar|makhi|kokroch|cockroach|insect|plant|plants|paudha|paudhe)(?![a-z])/;
const SURPRISE = /(?<![a-z])(?:surprise|sarprais|birthday|janamdin|gift|gifts|tohfa|party|present)(?![a-z])/;

const RX = (src) => new RegExp(`(?<![a-z])(?:${src})(?![a-z])`);
/** [kind, id, source over the canonical reading, guard (true = reject)] */
const SHAPES = [
  // ── self-harm ──
  ["self_harm", "main_marna_chahta", `${I_S}${g(2)} (?:marna|mar jana|mar jane|marne) ${WANT}`, (m) => / ko |(?<![a-z])(?:machar|makhi|kokroch|chuha|keda|kide)(?![a-z])/.test(m)],
  ["self_harm", "mann_karta_mar_jaun", `(?:man|dil) (?:karta|karti|karte|hota|hoti) (?:hai |he |h )?(?:ki )?(?:main |mai )?(?:mar|marne) (?:jaun|jau|jaon|ka)`],
  ["self_harm", "kaash_mar_jaun", `(?:kash|kas)(?: main| mai)? mar (?:jaun|jau|jaon|jata|jati|gaya hota|gayi hoti)`],
  ["self_harm", "khud_ko_khatam", `(?:khud|khudko|apne ap|apneap|apne apko|apneapko|apni jindagi|apni jindgi|apna jivan|jindagi|jindgi)(?: ko)? (?:khatam|khatm|khtm|mar|kat|jala|nuksan)`, (m, full) => /(?<![a-z])(?:jindagi|jindgi) (?:khatam|khatm)/.test(m) && LESSON.test(full)],
  ["self_harm", "apni_jaan_de", `apni jan (?:de|le|dena|lena|dene|lene|de dun|de dunga|de dungi|le lun|le lunga|le lungi)|jan dene ka (?:man|khayal|soch)|${I_S} (?:apni )?jan de (?:dun|dunga|dungi|dena)`, (m, full) => LESSON.test(full)],
  ["self_harm", "suicide_spellings", `${SUICIDE}`],
  ["self_harm", "kms_unalive", `(?:vant to|vana|gona|gonna|going to|il|vil|ima|imma|should|shud|just) (?:just )?kms|unalive ${SELFX}`],
  ["self_harm", "paida_na_hota", `(?:main|mai|kash|kas)${g(1)} paida (?:hi )?(?:na|nahi|nahin|nai) (?:hota|hoti|hua|hui|hue|hote)`],
  ["self_harm", "mere_bina_sab_khush", `mere bina (?:sab|sabhi|log|ghar vale|gharvale|family|mumi papa|mami papa|duniya)${g(2)} (?:khush|thik|acha|achhe|beter|aram)`, (m, full) => LESSON.test(full)],
  ["self_harm", "mere_na_hone_se", `mere (?:na|nahi|nahin) (?:hone|rehne|rahne) (?:se|par|pe|ke bad)`],
  ["self_harm", "fark_nahi_agar_mar", `(?:kisi ko|kisiko)(?: koi)? fark nahi (?:padega|padta|pdega|parega)${g(3)} (?:mar|na rahun|na rahu|chala jaun|chali jaun|gayab|nahi rahun)|(?:mar jaun|mar jaunga|mar jaungi|na rahun|chala jaun|chali jaun)${g(2)} (?:kisi ko|kisiko)(?: koi)? fark nahi`],
  ["self_harm", "main_bojh_hoon", `${I_S}${g(3)} bojh (?:hun|hu|ban gaya|ban gayi|ban gya)|(?:im|i am) (?:a |just a |such a )?burden`],
  ["self_harm", "jeene_ka_matlab_nahi", `jine ka (?:koi )?(?:matlab|mtlb|fayda|faida|maksad|vajah|karan) (?:nahi|nahin|nai)|kya (?:fayda|faida|matlab)(?: hai| he)? (?:aise )?jine (?:ka|se)|jine se (?:kya|koi) (?:fayda|faida|matlab)|(?:point|reason) (?:of|in|to|for) (?:living|being alive)(?! things| organism)|life is (?:pointles|meaningles|vorthles|useles)|(?:meri )?(?:jindagi|jindgi) (?:bekar|fajul|bakvas) hai`],
  ["self_harm", "hamesha_ke_liye_chhod", `(?:chod|chhod)(?: ke| kar| kr)?${g(2)} hamesha ke liye|hamesha ke liye so (?:jaun|jau|jaunga|jaungi|jana|jaon)`],
  ["self_harm", "neend_ki_goliyan", `nind ki goli(?:yan|ya|an)? kha (?:lun|lunga|lungi|ke so jaun|ke so jaunga|ke so jaungi|ke mar|kar mar)|(?:sari|bahut sari|dher sari|sab) goli(?:yan|ya|an) kha|(?:take|swalov|eat) (?:al |a lot of |many |lots of )(?:the )?pils|overdose`],
  ["self_harm", "kabhi_na_uthun", `kabhi (?:na|nahi|nahin|nai) (?:uthun|uthu|uthunga|uthungi|jagun|jagu|jagunga|jagungi)|(?:slip|sleep) (?:and never|forever and never|and not) vake up|(?:vant|vana|vish|hope)${g(4)} never vake up`],
  ["self_harm", "bhagwan_ke_paas_jana", `(?:mujhe|main|mai)${g(2)} (?:bhagvan|bhagavan|upar vale|uparvale)(?: ji)? ke pas (?:jana|jaun|jaunga|jaungi|chala|chali|jane)`],
  ["self_harm", "nahi_rehna_chahta", `${I_S} (?:ab )?(?:aur )?(?:nahi|nahin) (?:rehna|rahna|jina|jine) (?:chahta|chahti|chata|chati)(?! (?:yahan|idhar|is|iss|ghar|skul|schul|klas|class|men|mein|sath|vahan))`],
  ["self_harm", "kill_my_self", `(?:kil|kiling|kils|kiled|hurt|hurting|hurts|kut|kuting|kuts|harm|harming|stab|stabing|burn|burning) ${SELFX}`, (m, full) => /(?<![a-z])(?:by mistake|acidentaly|acident|galti)(?![a-z])/.test(full)],
  ["self_harm", "dont_want_to_exist", `(?:dont|do not) (?:vant|vana) (?:to )?eksist|vish (?:i|ai) (?:didnt|did not) eksist`],
  ["self_harm", "jump_off_roof", `(?:jump|jumping) (?:of|from|of of)(?: the| a| my| mi| our)? (?:ruf|rof|bilding|building|balkani|balcony|terace|teras|bridge|brij|klif|cliff)|(?:chat|bilding|balkani|pul|terace) se (?:kud|chalang|jump) (?:jaunga|jaungi|jaun|jau|lagaunga|lagaungi|jana|marunga|marungi)`, (m, full) => LESSON.test(full)],
  ["self_harm", "end_it_all", `(?:vant to|vana|gona|gonna|going to|il|vil|just|to) end (?:it al|everything|evrything|mi life|my life|mi jindagi)|vant (?:it|everything|evrything) (?:al )?to end`],
  ["self_harm", "wish_could_die", `(?:i|ai) (?:vish|hope) (?:i|ai) (?:kould|vould|kan|kud) (?:just )?${DIE}|(?:i|ai) vish (?:i|ai) (?:vas|ver|vaj|vere) (?:ded|dead)`],
  ["self_harm", "nobody_cares_if_i_die", `(?:nobodi|nobody|no one|noone|no body)(?: vil| vould| d)?(?: even)? (?:kares?|kare|notices?|miss me|mis me)${g(1)} (?:if|vhen) (?:i|ai) (?:die|died|dy|di|am gone|vas gone|disapear|disapeared|go avay|kil myself)|(?:if|vhen) (?:i|ai) (?:die|died|dy|am gone|disapear)${g(1)} (?:nobodi|nobody|no one|noone)(?: vil| vould)?(?: even)? (?:kare|kares|notice|miss me)`, (m, full) => LESSON.test(full)],
  ["self_harm", "i_want_to_die", `(?:i|ai) (?:vant|vnt|vana|vona|vont|vanna|vnna)(?: to| tu)? ${DIE}(?! (?:mi|my|the|this|it|hair|kapde|klothes|shirt))`, (m, full) => LESSON.test(full)],
  ["self_harm", "jeena_hi_nahi", `${I_O}${g(2)} (?:ab )?jina (?:hi |bhi |ab )?(?:nahi|nahin|nai)(?! (?:ata|ati|ate|sikh|sikho))`],
  ["self_harm", "cut_my_arm", `(?:apne|apna|apni) (?:hath|hathon|kalai|bah|baju|pair|tang|skin|nas|nasen)(?: ko)?(?: blade se| pe blade| par blade)? (?:kat|kata|kati|kate|katu|katun|katti|jala|jalati|jalata|jalaya)(?! (?:gaya|gayi|gya|gyi))|(?:hath|kalai|bah|nas) (?:pe|par) blade|blade se (?:apna|apne|apni|khud|hath|kalai|nas)|(?:kut|kuting|kuts|slit) (?:mi|my) (?:rist|rists|vrist|vrists|arm|arms|skin|nas)`, (m, full) => /(?<![a-z])(?:galti|mistake|acidentaly|acident|sabji|sabjiyan|vegetables|paper|kagaj|apple|seb|fruit|nakhun|nails)(?![a-z])/.test(full)],
  ["self_harm", "khatam_kar_dena_apna", `khatam kar (?:dena|dun|dunga|dungi|lun|lunga|lungi)(?: chahta| chahti)?(?: hun| hu)? (?:apne ap ko|khud ko|apna|apni jindagi|apni jindgi)`],
  ["self_harm", "happier_without_me", `(?:vould|vil|d|ll) be (?:so |much |a lot )?(?:hapier|beter|fine|ok|okay|beter of)${g(1)} (?:vithout me|if (?:i|ai) (?:vas|ver|vere|am|vasnt|verent) (?:ded|gone|not here|not around|never born))`],
  ["self_harm", "thinking_about_killing", `(?:keep|kip|am|im|been|ve been) thinking (?:about|of) (?:kiling|dying|death|ending it)`],

  // ── abuse ──
  ["abuse", "maarpeet_maar_padti", `(?:${ACTOR}|${I_O}|ghar (?:pe|par|men|mein|me))${g(3)} (?:marpit|mar pit|marpitai|pitai) (?:karte|karti|karta|hoti|kiya|ki)|(?:${I_O}|ghar (?:pe|par|men|mein|me))${g(2)} (?:mar|pitai|danda|dande|chapal|belt) (?:padti|pdti|parti|padi|pdi|khani padti)`, (m, full) => LESSON.test(full)],
  ["abuse", "actor_ne_mujhe_gap_verb", `(?:${ACTOR})(?: ji)? ne ${I_O}${g(3)} (?:mara|pita|chua|jalaya|jala diya|jala dia|thapad|lat|ghusa|dhaka|nocha|dabaya|band kar diya)`, (m, full) => LESSON.test(full)],
  ["abuse", "actor_burns_me", `(?:${ACTOR_EN}) (?:burns|burned|burnt|chokes|choked|loks|loked|pinches|pinched|bites|ties|tied|throws|threw|pushes|pushed|slaps|slaped|kiks|kiked) me`, (m, full) => LESSON.test(full)],
  ["abuse", "kapde_utarne", `(?:${NONPARENT})(?: ji)?${g(4)} kapde (?:utar|utarne|utarte|utarta|utarti|utarvate|utarvata|utarvaye|utaro|kholne|kholte|kholta|kholo|utarvane)|(?:makes|made|asks|asked|tels|told|vants|vanted|forces|forced) me (?:to )?(?:take of|remove|undres)|undres(?:ed|ing)? me`],
  ["abuse", "ajeeb_tarah_chhoote", `(?:ajib|gandi|gande|ganda|galat|bure|buri|aisi|vaisi)(?: tarah| tareke| tarike| jagah| jagha)(?: se| pe| par)? (?:chute|chuta|chuti|chua|chune|chuna|touch|tach|hath lagate|hath lagata|hath lagaya|hath lagati)|(?:private|praivet) (?:part|parts|jagah)(?: pe| par| ko)? (?:chute|chua|touch|tach|hath)|(?:touches|touched|touching) (?:me )?(?:in |on )?(?:mi|my) (?:private|privates|chest|bum|but)`],
  ["abuse", "secret_dont_tell", `(?:bola|boli|kaha|bolte|bolta|bolti|kehta|kehte|kahte|kahta|kehti|kahti)(?: hai| hain| tha| thi| ki)?${g(2)} (?:kisi ko|kisiko|mumi ko|mami ko|papa ko|mumi papa ko|ghar pe|ghar par|ghar men|ghar mein|teacher ko)(?: bhi)? (?:mat|na|nahi) (?:batana|bolna|kehna|batao)|(?:said|told me|says|tels me) (?:not to|dont|to not|never|never to) tel (?:anyone|anybody|my mom|mi mom|mi parents|my parents|mi dad|my dad|mi mum)`, (m, full) => SURPRISE.test(full)],
  ["abuse", "nonparent_kissed", `(?:${NONPARENT})(?: ji)?(?: ne)?${g(3)} (?:kis|chuma|chuma) (?:kiya|kia|karta|karte|karti|kar|kiye|liya|leta|lete)|(?:kised|kises) me`, (m, full) => SURPRISE.test(full)],
  ["abuse", "gandi_harkat", `(?:mere sath|mujhse|mujhe|mere|mujhko)${g(2)} (?:gandi|galat|buri|ganda|gande|ajib) (?:harkat|harkaten|harkate|cheej|cheejen)${g(1)} (?:karta|karte|karti|kiya|kari|karvate|karvata|karvaya)|(?:does|did|doing|do) (?:bad|dirty|veird|nasty|nasti|strange|vrong) (?:things|stuf) (?:to|vith) me`],
  ["abuse", "akele_mein_bulaya", `(?:${NONPARENT})(?: ji)?(?: ne)?${g(2)} akele (?:men|mein|me) (?:bula|bulaya|bulate|bulata|bulati|milne|le gaya|le jate|le jata)`],
  ["abuse", "band_kar_dete_khana_nahi", `${I_O}${g(5)} (?:kamre|kamra|rum|bathrum|toilet|storrum|almari) (?:men|mein|me) band kar (?:dete|deti|deta|diya|dia)|${I_O} (?:khana|bhojan) nahi (?:dete|deti|deta|diya|dia|milta)|lok(?:s|ed)? me (?:in|inside|up)|(?:dont|never|vont|do not) (?:give|let) me (?:food|fud|eat)`],
  ["abuse", "dv_witness", `(?:${ACTOR_EN}) (?:hits|beats|slaps|kiks|punches|hurts|hit|beat|slaped) (?:mi|my) (?:mom|mum|mother|mumi|mama|sister|brother|dad|father|papa|bhai|didi|baby)`, (m, full) => LESSON.test(full)],
  ["abuse", "i_get_beaten", `(?:i|ai) (?:get|got|am|getting|gets) (?:beaten|beten|slaped|punched|kiked)(?: up)?|(?:i|ai) (?:get|got|am|getting) hit${g(1)} (?:at home|by (?:mi|my)|every day|daily)`, (m, full) => LESSON.test(full)],
  ["abuse", "kids_beat_me_up", `(?:kids|boys|girls|seniors|students|bache|ladke|everyone|they|people|bulies|someone)(?: at skul| at schul| in (?:mi|my) klas| in klas)? (?:beat|beats|kik|kiks|punch|punches|slap|slaps) me(?: up)?`, (m, full) => LESSON.test(full)],
  ["abuse", "showed_privates", `(?:shoved|shovs|shov|shoving) me (?:his|her|their) (?:private|privates|nunu|susu|body parts)|apn[ae] (?:private part|private parts|nunu|susu) dikha(?:ya|ta|te|ti|ne)`],

  // ── fear / threat / isolation ──
  ["fear", "dhamkata", `dhamk(?:ata|ati|ate|aya|ayi|ana|ane)|dhamki (?:de|deta|deti|dete|di|diya|dia)`],
  ["fear", "bataya_toh_maar_dega", `(?:kisi ko|kisiko|mumi ko|mami ko|papa ko|ghar pe|ghar par|teacher ko|mumi papa ko)(?: kuch)? (?:bataya|bola|bataega|bataegi|batai|bataoge|bataogi|batayi|batana)${g(3)} (?:mar|jan se mar|pitai|nuksan|mar dal|kat)(?: kar)? (?:dega|degi|denge|dalega|dalenge|dunga|karega|karenge)|(?:vil|vould|gonna|gona|going to|il) (?:hurt|kil|beat|hit|harm) me if (?:i|ai) (?:tel|told|say|speak)`],
  ["fear", "peecha_karta", `(?:koi|admi|ladka|unkle|bhaiya|someone|somebody|man|stranger)${g(2)} (?:mera|meri|mere) (?:picha|pichha) (?:karta|karte|karti|kar raha|kar rahi|kiya)|(?:foloving|folovs|stalking|stalks) me(?! on)`],
  ["fear", "dar_actor_se", `${I_O} (?:${ACTOR})(?: ji)? se${g(2)} (?:dar|dr) (?:lagta|lagti|lag|lagte)|(?:im|i am|i get|am) (?:so |realy |very |reali )?(?:skared|afraid|terified|frightened) of (?:mi|my) (?:dad|father|mom|mother|stepdad|stepfather|stepmom|stepmother|unkle|papa|mumi|brother|dadi|teacher|sir|kousin)`],
  ["fear", "koi_baat_nahi_karta", `koi (?:bhi )?mujhse (?:bat|baat) nahi (?:karta|karti|karte)|koi (?:bhi )?mujhe pasand nahi (?:karta|karti|karte)|(?:nobodi|nobody|no one|noone) (?:talks to|likes) me`],
  ["fear", "scared_go_back_home", `(?:skared|afraid|terified|frightened) (?:to go|of going|to return|of)(?: bak)? home`],
  ["fear", "threat_blackmail_leak", `threat(?:en|ens|ened|ening) me|blakmail\\w*|(?:leak|viral|lik)(?: kar)? (?:mi|my|meri|mere) (?:fotos?|pics?|piktures?|videos?)|(?:mi|my|meri|mere) (?:fotos?|pics?|piktures?|videos?) (?:leak|viral|online|post)(?: kar| kr)? (?:dega|degi|denge|dunga|karega|vil|kar)`],
  ["fear", "ghar_chhod_bhaag", `ghar (?:chod|se)(?: ke| kar| kr)? (?:bhag|chali|chala) (?:jaunga|jaungi|jaun|jau|jana|jaenge)`],
].map(([kind, id, src, guard]) => ({ kind, id, re: RX(src), guard }));

/** Every lexicon word (the targets the garble rule may correct a token to). */
const VOCAB = (() => {
  const set = new Set();
  for (const s of SHAPES) for (const w of s.re.source.replace(/\(\?<!\[a-z\]\)|\(\?!\[a-z\]\)|\[a-z\]|\\w/g, " ").match(/[a-z]{2,}/g) ?? []) set.add(w);
  return set;
})();
const VOCAB_BY_LEN = (() => { const m = new Map(); for (const w of VOCAB) if (w.length >= 4) { const a = m.get(w.length) ?? []; a.push(w); m.set(w.length, a); } return m; })();
const lev1 = (a, b) => {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, d = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++d > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return d + (a.length - i) + (b.length - j) <= 1;
};
/**
 * The garble rule: the lexicon words a token may have been, when it is neither a lexicon word nor a known real word.
 *   - one edit from a lexicon word of 4+ letters (the token itself 3+ letters: "withut" → without, "ani" → apni);
 *   - one letter added at the end of a lexicon word ("koe" → ko, "haie" → hai; the transcriber's commonest short-word slip);
 *   - Devanagari: one letter added at the end ("मरथ" → मर, "खुदथ" → खुद).
 */
function candidates(c, raw, deva) {
  if (VOCAB.has(c) || KNOWN_NEAR.has(raw)) return [];
  const out = new Set();
  if (c.length >= 3) for (const n of [c.length - 1, c.length, c.length + 1]) for (const w of VOCAB_BY_LEN.get(n) ?? []) if (lev1(c, w)) out.add(w);
  if (c.length >= 3 && VOCAB.has(c.slice(0, -1))) out.add(c.slice(0, -1));
  if (deva) { const cp = [...raw]; if (cp.length >= 2) { const d = canonKey(cp.slice(0, -1).join("")); if (VOCAB.has(d)) out.add(d); } }
  return [...out];
}

/**
 * The turn's canonical readings, clauses joined by " . " (unreadable other-script tokens dropped). The first reading takes
 * every token's garble correction when it is unambiguous; each further reading swaps ONE ambiguous token to one of its
 * candidates (a real transcript garbles about one word in a disclosure, CRITIQUE §2). Exported for tests.
 */
export function canonicalReadings(text) {
  const clauses = foldUnicode(text).split(/[.,!?;:।॥\n]+/u);
  const toks = [];
  for (const cl of clauses) {
    let any = false;
    for (const t of tokensOf(foldText(cl))) {
      if (t.script !== "latin" && t.script !== "deva") continue;
      const raw = t.raw.replace(/'/g, "");
      const c = canonKey(raw);
      if (!c) continue;
      toks.push({ c, alts: candidates(c, raw, t.script === "deva") });
      any = true;
    }
    if (any) toks.push({ c: ".", alts: [] });
  }
  if (toks.length && toks[toks.length - 1].c === ".") toks.pop();
  const base = toks.map((t) => (t.alts.length === 1 ? t.alts[0] : t.c));
  const out = [base.join(" ")];
  for (let i = 0; i < toks.length && out.length < 16; i++) if (toks[i].alts.length > 1) for (const a of toks[i].alts) { const r = base.slice(); r[i] = a; out.push(r.join(" ")); }
  return out;
}
export const canonicalReading = (text) => canonicalReadings(text)[0];

/**
 * The lexicon pass over one turn.
 * @returns {{ distress: boolean, kind: "self_harm"|"abuse"|"fear"|null, shape: string|null }}
 */
export function lexiconScan(text) {
  const readings = canonicalReadings(text);
  if (!readings[0]) return { distress: false, kind: null, shape: null };
  for (const full of readings) for (const s of SHAPES) {
    const m = s.re.exec(full);
    if (!m) continue;
    if (s.guard && s.guard(m[0], full)) continue;
    return { distress: true, kind: s.kind, shape: s.id };
  }
  return { distress: false, kind: null, shape: null };
}

export const __lexicon = { SHAPES, VOCAB };
