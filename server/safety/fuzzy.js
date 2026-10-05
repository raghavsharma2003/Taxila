// The fuzzy / phonetic distress matcher: the predicate's SECOND pass (safety-robust, 2026-10-05).
//
// Why: under realistic transcription errors (6% token garble, 5% hallucinated other-script segments, "दीदी"→"दीजिए",
// English-in-Hindi written in Devanagari, a danda on every final) the byte predicate missed 16/84 TaxilaFDB distress lines
// on every arm, today's cascade included (docs/research/duplex/CRITIQUE.md §4-§5): "पाप मारते हैं", "Nobody would evn
// notice", "मुझे मरथ जाना है", "I wish Ie wasn't here".
//
// How (safety by predicate, not instruction): each distress SHAPE is a short sequence of word SLOTS (groups below). A
// child's token fills a slot when its script-agnostic canonical key equals one of the slot's words (normalize.js canonKey:
// मारते = maarte = marte), or — at a cost — when it is a plausible mis-hearing of one:
//   - Devanagari: same consonant skeleton and one vowel sign added / dropped / changed ("मारत", "क" for "को", "ह" for "है"),
//     or one extra letter at the end ("मरथ");
//   - Roman / English: edit distance 1 on a slot word of 4+ letters ("evn"→"even" is the short-word rule below, "nobdy",
//     "wih", "hre"); a word of 1-3 letters only by one letter added or dropped at its end ("Ie", "ife", "upe");
//   - English said inside Hindi and written in Devanagari: the English consonant skeleton ("नोबडी", "विश", "हियर");
//   - a curated table of real STT confusions (CONFUSION: "पाप"→"पापा", "दीजिए"→"दीदी", "evn"→"even").
// Each shape has a fuzz BUDGET (0 for 1-2 required slots, 1 for 3, 2 for 4+): one garbled word in a five-word disclosure still
// fires; two single-word coincidences never make a shape. A token that is itself a real word near a slot word (KNOWN, built
// from the teaching kits by evals/safety-robust/build-known.mjs) costs double, and a SOLO slot (a word that is a shape on its
// own: bully, suicide, धमकी) takes no real word at all. Family guards keep maths, science, games and reported speech quiet
// ("24 ko maaro", "mar gaya answer", "papa ne six maara", "plants marte hain").
//
// Pure and browser-safe (no I/O): the device runs it on partials through server/duplex/partialSafety.js.
import { canonKey, devaSkeleton, englishSkeleton, foldText, foldUnicode, tokensOf } from "./normalize.js";
import { KNOWN_NEAR } from "./known-words.js";

const DEVA = /[ऀ-ॿ]/u;

/** Real STT confusions (folded token → the word it was). Cost 0 in a slot that holds the target. */
export const CONFUSION = {
  "पाप": "पापा", "पप": "पापा", "pap": "papa", "paap": "papa", "दीजिए": "दीदी", "दीजिये": "दीदी", "dijiye": "didi", "deejiye": "didi",
  "evn": "even", "nobdy": "nobody", "nobady": "nobody", "nobodi": "nobody", "mummi": "mummy", "मम्मीजी": "मम्मी", "पापाजी": "पापा",
  "maarthe": "maarte", "marthe": "marte", "मारथे": "मारते", "सुसाइड": "suicide",
};

// ── slot groups (Roman Hinglish, English and Devanagari spellings; compared by canonical key) ──
const G = {
  I_OBJ: "mujhe mujhko mereko muje mjhe mujhe मुझे मुझको मेरेको",
  I_SUBJ: "main mai मैं मै",
  I_EN: "i आई आइ आय",
  ME_EN: "me मी",
  SELF_EN: "myself माइसेल्फ मायसेल्फ",
  MY_EN: "my माई माय",
  AUX: "hai hain h he hoon hun hu ho है हैं हूं हू हो",
  NEG_HI: "nahi nahin nhi nai na naa नहीं नही ना न",
  NA: "na naa न ना",
  MARNA: "marna marne मरना मरने",
  MAR: "mar maar मर मार",
  JANA: "jana jaana jaane jane जाना जाने",
  JAU: "jaun jau jaaun jaaunga jaunga jaungi jaaungi jaoon जाऊं जाऊंगा जाऊंगी जाऊ",
  CHAH: "chahta chahti chahte chahiye chahu chahun चाहता चाहती चाहते चाहिए चाहूं",
  JEENA: "jeena jina जीना",
  JEENE: "jeene jine जीने",
  ZINDA: "zinda jinda ज़िंदा जिंदा",
  REHNA: "rehna rahna rehne रहना",
  KHUD: "khud खुद",
  KO: "ko को",
  HARMV: "maar mar hurt chot kaat kat harm cut maarna marna chot मार चोट काट काटना",
  GAYAB: "gayab gaayab गायब",
  HO: "ho हो",
  HAMESHA: "hamesha हमेशा",
  KE: "ke के",
  LIYE: "liye liae लिए लिये",
  CHALA: "chala chali chale चला चली चले",
  RAHUN: "rahun rahu rahoon रहूं रहू",
  YA: "ya या",
  HOON: "hoon hun hu हूं हू",
  MANN: "mann man मन",
  KA: "ka का",
  ACTOR: "papa mummy mumma mammi maa pitaji bhai bhaiya bhaiyya didi chacha chachi mama mami uncle aunty auntie sir madam teacher dada dadi nana nani sautela sauteli " +
    "पापा मम्मी माँ मां पिताजी भाई भैया दीदी चाचा चाची मामा मामी अंकल आंटी सर मैडम टीचर दादा दादी नाना नानी सौतेला सौतेली",
  ACTOR_EN: "father mother dad daddy mom mum mummy papa brother sister uncle aunty auntie teacher sir stepfather stepmother",
  BEAT_HI: "maarte maarti maarta marte marti marta peette peetti peetta pitte pitti peet pitai मारते मारती मारता पीटते पीटती पीटता",
  BEAT_PAST: "maara mara peeta pita chhua chhuaa chua मारा पीटा छुआ",
  TOUCH_HI: "chhoote chhute chhuta chhuti chhua chhuaa chua chhoo touch छूते छूता छूती छुआ छू टच",
  BEAT_EN: "hits hit beats beat slaps slapped kicks kicked punches punched hurts hurt touched touches",
  GANDI: "gandi gande ganda galat गंदी गंदा गंदे गलत",
  TARAH: "tarah jagah jagha तरह जगह",
  GHAR: "ghar घर",
  SE: "se से",
  IN_HI: "mein me में",
  DAR: "dar darr डर",
  LAG: "lagta lagti lag lagte laga लगता लगती लग लगा",
  SAB: "sab sabhi सब",
  CHIDHA: "chidhate chidhaate chidate chhedte चिढ़ाते चिढाते छेड़ते",
  NAFRAT: "nafrat नफरत",
  MUJHSE: "mujhse मुझसे",
  BHAAG: "bhaag bhag भाग",
  JAUNGA: "jaunga jaungi jaaunga jaaungi jaana जाऊंगा जाऊंगी जाना",
  KOI: "koi कोई",
  DHAMKI: "dhamki धमकी",
  PYAAR: "pyaar pyar प्यार",
  WISH: "wish विश",
  WASNT: "wasnt werent वाज़न्ट वॉज़न्ट वाजन्ट",
  WAS: "was were वाज़ वॉज़ वाज",
  NOT: "not नॉट",
  HERE: "here around alive हियर अराउंड अलाइव",
  NOBODY: "nobody noone नोबडी नोबॉडी",
  WOULD: "would will wud woud d वुड विल",
  EVEN: "even ईवन इवन",
  NOTICE: "notice care miss नोटिस केयर मिस",
  IF: "if इफ",
  GONE: "gone dead died disappeared गॉन डेड डाइड",
  DONT: "dont डोंट डोन्ट",
  WANT: "want wanna wana वांट वॉन्ट वाना",
  TO: "to टू",
  DIE: "die disappear डाई डिसअपीयर",
  LIVE: "live लिव",
  WAKE: "wake वेक",
  UP: "up अप",
  KILL: "kill hurt cut harm किल हर्ट कट",
  HATE: "hate हेट",
  LIFE: "life लाइफ",
  BETTER: "better बेटर",
  OFF: "off ऑफ",
  WITHOUT: "without विदाउट",
  NEVER: "never नेवर",
  BORN: "born बॉर्न",
  END: "end एंड",
  SCARED: "scared afraid स्केयर्ड",
  HOME: "home होम",
  LOVES: "loves लव्स",
  EVERYONE: "everyone everybody एवरीवन",
  HATES: "hates हेट्स",
  RUN: "run रन",
  AWAY: "away अवे",
  FROM: "from फ्रॉम",
  BAD: "bad बैड",
  TOUCH: "touch टच",
};
/** A slot that is a shape on its own: no real word may be read as it, and a garble only from 5+ letters. */
const SOLO = { BULLY: "bully bullied bullying bullies बुली", SUICIDE: "suicide suicidal सुसाइड", DHAMKI_SOLO: "dhamki धमकी" };
/** English groups: a Devanagari token may fill them by its English consonant skeleton (English said inside Hindi speech). */
const EN = new Set(["I_EN", "ME_EN", "SELF_EN", "MY_EN", "ACTOR_EN", "BEAT_EN", "WISH", "WASNT", "WAS", "NOT", "HERE", "NOBODY", "WOULD", "EVEN", "NOTICE", "IF", "GONE",
  "DONT", "WANT", "TO", "DIE", "LIVE", "WAKE", "UP", "KILL", "HATE", "LIFE", "BETTER", "OFF", "WITHOUT", "NEVER", "BORN", "END", "SCARED", "HOME", "LOVES", "EVERYONE",
  "HATES", "RUN", "AWAY", "FROM", "BAD", "TOUCH", "BULLY", "SUICIDE"]);

const lev1 = (a, b) => {
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0, j = 0, diff = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++diff > 1) return false;
    if (la > lb) i++; else if (lb > la) j++; else { i++; j++; }
  }
  return diff + (la - i) + (lb - j) <= 1;
};
const cps = (s) => [...s];
const lev1cp = (a, b) => {
  const A = cps(a), B = cps(b);
  if (Math.abs(A.length - B.length) > 1) return false;
  let i = 0, j = 0, d = 0;
  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) { i++; j++; continue; }
    if (++d > 1) return false;
    if (A.length > B.length) i++; else if (B.length > A.length) j++; else { i++; j++; }
  }
  return d + (A.length - i) + (B.length - j) <= 1;
};

function compileGroup(name, words, solo = false) {
  const list = String(words).split(/\s+/).filter(Boolean);
  const canon = new Set(), canonList = [], devaWords = [], enSkel = new Set();
  const rawList = [];
  for (const w of list) {
    const f = foldText(w).replace(/'/g, "");
    const deva = DEVA.test(f);
    // an English group's Devanagari spellings are matched by English skeleton and exactly, never by canonical key ("रन" is
    // "ran" in Roman letters: the English past tense must not fill RUN)
    if (EN.has(name) && deva) { const k = englishSkeleton(f); if (k.length >= 2) enSkel.add(k); continue; }
    const c = canonKey(f);
    if (c && !canon.has(c)) { canon.add(c); canonList.push(c); }
    if (deva) devaWords.push(f);
    else { rawList.push(f); if (EN.has(name)) { const k = englishSkeleton(f); if (k.length >= 2) enSkel.add(k); } }
  }
  // precomputed per Devanagari word: its skeleton, its code-point length, and the form with its final vowel sign dropped
  const devaInfo = devaWords.map((w) => ({ w, skel: devaSkeleton(w), n: cps(w).length, dropFinal: /[\u093E-\u094C]$/u.test(w) ? w.slice(0, -1) : null }));
  return { name, solo, en: EN.has(name), canon, canonList, rawList, devaWords, devaInfo, enSkel, folded: new Set(list.map((w) => foldText(w).replace(/'/g, ""))) };
}
const GROUPS = Object.fromEntries([...Object.entries(G).map(([k, v]) => [k, compileGroup(k, v)]), ...Object.entries(SOLO).map(([k, v]) => [k, compileGroup(k, v, true)])]);
const LIT = new Map();
const groupFor = (name) => GROUPS[name] ?? (LIT.get(name) ?? (LIT.set(name, compileGroup(name, name.replace(/\//g, " "))), LIT.get(name)));

/**
 * The cost of reading token `t` as a word of group `g`: 0 = the same word (any script / spelling), 1 = a plausible
 * mis-hearing, Infinity = no. A KNOWN real word costs one more; a solo slot takes no real word. Exported for the KNOWN
 * builder and tests.
 */
export function slotCost(t, g, { known = KNOWN_NEAR } = {}) {
  if (g.folded.has(t.raw) || (t.canon && g.canon.has(t.canon))) return 0;
  const conf = CONFUSION[t.raw];
  if (conf && (g.folded.has(conf) || g.canon.has(canonKey(conf)))) return 0;
  if (!t.canon || t.script === "num" || t.script === "other") return Infinity;
  let isKnown = known.has(t.raw);
  if (g.solo && isKnown) return Infinity;
  let near = false;
  if (t.script === "deva" && !g.solo) {
    const tn = t.n ?? (t.n = cps(t.raw).length);
    for (const d of g.devaInfo) {
      // a dropped FINAL vowel sign is the commonest Devanagari garble ("जाना"→"जान", "पापा"→"पाप", "मारते"→"मारत"): read at
      // cost 1 even when the shortened form is itself a word. Any other vowel edit between two real words stays double
      // ("में" is never "मैं").
      if (d.dropFinal === t.raw) { near = true; isKnown = false; break; }
      if (d.skel === t.skel && Math.abs(d.n - tn) <= 1 && lev1cp(t.raw, d.w)) { near = true; break; }
      // one extra letter at the end ("मरथ", "मैंथ", "नथ" for "न"): never a vowel sign alone (that is the skeleton rule)
      if (tn === d.n + 1 && t.raw.startsWith(d.w)) { near = true; break; }
    }
  }
  // Roman / English: edit distance 1 on the canonical key and on the spelling itself ("hee" is "hi" canonically but one
  // letter from "here"); a slot word of 1-3 letters only by one letter added or dropped at its end ("Ie", "upe", "mye")
  const editNear = (a, c) => (Math.abs(a.length - c.length) > 1 ? false : c.length >= (g.solo ? 5 : 4)
    ? a.length >= 3 && lev1(a, c)
    : !g.solo && t.script === "latin" && ((a.length === c.length + 1 && a.startsWith(c)) || (c.length === a.length + 1 && c.startsWith(a) && a.length >= 1)));
  if (!near) for (const c of g.canonList) if (editNear(t.canon, c)) { near = true; break; }
  if (!near && t.script === "latin") for (const w of g.rawList) if (editNear(t.raw, w)) { near = true; break; }
  if (!near && g.en && !g.solo && t.script === "deva" && t.enSkel.length >= 2 && g.enSkel.has(t.enSkel)) near = true;
  if (!near) return Infinity;
  return isKnown ? 2 : 1;
}

// ── shapes ──
// Pattern steps, space-separated: GROUP (a slot), ?GROUP (optional slot), ~n (skip up to n tokens), lowercase/वर्ड words
// joined by "/" (an inline slot). A guard returns true to REJECT a match.
const NUMWORD = /^(?:\d+(?:[./]\d+)?|ek|do|teen|char|chaar|paanch|panch|chhe|saat|aath|nau|das|gyarah|barah|bees|pachees|pachchees|sau|hazaar|one|two|three|four|five|six|seven|eight|nine|ten|twenty|hundred|zero|shunya|aadha|half|एक|दो|तीन|चार|पांच|छह|सात|आठ|नौ|दस|बीस|सौ|आधा|शून्य)$/u;
/** Lesson objects of a hit / kill / cut verb: maths, games, insects (the first pass's own exclusions, plus maths words). */
const LESSON_WORDS = ("answer jawab जवाब sawal savaal सवाल sum question number numbers digit zero carry cross tick plus minus sign bracket fraction decimal point " +
  "line ball gend गेंद six chhakka छक्का chauka चौका shot goal kite patang game games pubg level zombie creeper character match wicket run machhar machchar " +
  "मच्छर makkhi mosquito fly flies cockroach chuha chuhe keeda keede कीडे insect insects plant plants paudha paudhe पौधे पौधा ped pedon पेड cell cells log " +
  "logon janwar jaanwar animal animals dinosaur dinosaurs saanp sanp सांप snake snakes bacteria germ germs virus machhli मछली fish bird birds chidiya sher " +
  "शेर hiran हिरण raja राजा ravan रावण villain story kahani कहानी").split(" ");
const REPORT_WORDS = "bataya batayi batati batate bola boli bole kaha kehte kehti kehta bolte bolti bolta padhaya padhate padhati samjhaya samjhate samjhati बताया बोला कहा कहते पढाया समझाया".split(" ");
/**
 * A guard word, read with the same tolerance as a slot (a garbled guard word must not switch its guard off: "early" heard as
 * "ealy" fired the wake shape on the dev run, 2026-10-05): exact, or one edit away for words of 5+ letters.
 */
const guardSet = (words) => {
  const set = new Set(words), long = words.filter((w) => [...w].length >= 5);
  return { test: (raw) => set.has(raw) || ([...raw].length >= 4 && long.some((w) => (DEVA.test(w) ? lev1cp(raw, w) : lev1(raw, w)))) };
};
const LESSON_OBJ = guardSet(LESSON_WORDS);
const REPORT = guardSet(REPORT_WORDS);
const NEG_AFTER = /^(?:nahi|nahin|nhi|nai|mat|नहीं|नही|मत)$/u;

const anyIn = (toks, a, b, re) => toks.slice(Math.max(0, a), Math.max(0, b)).some((t) => re.test(t.raw));
/** maths / game / science / story talk around a hit verb: a number or a lesson object in the span or right after it. */
const lessonTalk = (c) => anyIn(c.toks, c.start - 1, c.end + 2, LESSON_OBJ) || anyIn(c.toks, c.start - 1, c.end + 1, NUMWORD);
/** reported speech or a lesson subject in the actor shape's gap (the first pass's rj-w2i-abuse-gap-without-frame guard). */
const reported = (c) => anyIn(c.toks, c.start, c.end, REPORT) || anyIn(c.toks, c.start, c.end, LESSON_OBJ) || c.toks.slice(c.start, c.end).some((t) => t.raw === "ne" || t.raw === "ने") && anyIn(c.toks, c.start, c.end + 1, REPORT);
/** "papa marte nahi" / "mujhe mat maaro" style negation right after the verb or before it. */
const negated = (c) => NEG_AFTER.test(c.toks[c.end]?.raw ?? "") || NEG_AFTER.test(c.toks[c.end + 1]?.raw ?? "") && /^(?:hai|hain|है|हैं)$/u.test(c.toks[c.end]?.raw ?? "") || NEG_AFTER.test(c.toks[c.end - 2]?.raw ?? "");
/** "I wish I wasn't here in class" (a place after "here"): the first pass's own exclusion. */
const herePlace = (c) => /^(?:in|at)$/.test(c.toks[c.end]?.raw ?? "") && /^(?:this|the|my|class|lesson|school|tuition|coaching|exam|test)$/.test(c.toks[c.end + 1]?.raw ?? "");
// Verify B (2026-10-05): a word talked ABOUT, not said ("'jeena nahi' wala vakya kaise banega", "jeena nahi ka matlab"): a
// metalinguistic word right after the shape turns it off. "mujhe jeena nahi" with nothing after still fires.
const jeenaGuard = (c) => /^(?:aata|aati|aate|sikh|sikho|seekho|isi|आता|आती|wala|wali|wale|vala|vali|matlab|meaning|word|words|shabd|vakya|vaakya|sentence|spelling|वाला|वाली|मतलब|शब्द|वाक्य)$/u.test(c.toks[c.end]?.raw ?? "") || /^(?:poem|kavita|kahani|story)$/u.test(c.toks[c.start - 1]?.raw ?? "");
/**
 * Verify B (2026-10-05): a threat INSIDE a story / lesson ("Ravan ne Sita ko dhamki di thi kahani mein", "villain ne hero ko
 * dhamki di"). Story words only (never "show" / "book": "photo sabko show karega" is the grooming threat), read anywhere in the turn with the guard tolerance: NOT the lesson-object list, whose "log"
 * (people) would switch off "log mujhe dhamki dete hain". (Devanagari "धमकी" still fires on pass 1 regardless.)
 */
const STORY = guardSet(("kahani kahaani story stories villain hero heroine ravan raavan kans raja rani rajkumar rakshas rakshasa movie film cartoon serial episode " +
  "chapter kavita poem natak drama novel कहानी रावण कंस राजा रानी राक्षस फिल्म कविता नाटक").split(" "));
const storyTalk = (c) => c.toks.some((t) => STORY.test(t.raw));
/** a game or a story around a kill / die word ("i died three times in level 2"). */
const gameTalk = (c) => anyIn(c.toks, 0, c.toks.length, /^(?:game|games|pubg|fortnite|minecraft|level|zombie|ninja|magic|magician|trick|story|kahani|movie|cartoon|joke|haha|lol)$/u);

/**
 * KEY slots (Verify B, 2026-10-05): the slot that carries the distress meaning of a shape (live, life, die, gone, the hit /
 * touch verb, dar, dhamki ...). A token that is itself a different REAL word (KNOWN) never fills one: in "I don't want to
 * give up", "I hate my line", "nobody will notice if I was done", "teacher mujhe maante hain" every other slot was exact
 * and the budget-2 shapes let the one real word through. Function-word slots (I, want, to, mujhe, hai) still take one.
 * Exception: a real word that is the slot word with ONE letter dropped ("lie" for "live", "hut" for "hurt", "maare" for
 * "maarte", Devanagari by code point) still fills it at cost 2: a dropped sound is the transcriber's commonest
 * garble (the critic's sttReal model), and without it 6 report-seed distress draws were lost (es3 "I hate my lie", held-out
 * "i don't want to lie anymore"). The price is "I don't want to lie" in lesson talk (Verify B residual, logged).
 */
const KEY = new Set(["MARNA", "MAR", "JEENA", "JEENE", "ZINDA", "HARMV", "GAYAB", "BEAT_HI", "BEAT_PAST", "TOUCH_HI", "BEAT_EN", "DAR", "CHIDHA", "NAFRAT",
  "BHAAG", "PYAAR", "HERE", "NOTICE", "GONE", "DIE", "LIVE", "WAKE", "KILL", "HATE", "LIFE", "BORN", "SCARED", "LOVES", "HATES", "TOUCH"]);
const SHAPES = [
  // self-harm (FAMILIES.self_harm's shapes as slots; a longer variant of a shape exists so a garble has budget to land in)
  ["self_harm", "mujhe_marna_hai", "I_OBJ ?bas MARNA AUX"],
  ["self_harm", "mujhe_mar_jana_hai", "I_OBJ ?bas MAR JANA AUX"],
  ["self_harm", "mar_jana_chahta", "MAR JANA CHAH"],
  ["self_harm", "main_mar_jana_chahta", "I_SUBJ ?bas MAR JANA CHAH"],
  ["self_harm", "main_mar_jaun", "I_SUBJ MAR JAU"],
  ["self_harm", "jeena_nahi", "JEENA NEG_HI", { guard: jeenaGuard }],
  ["self_harm", "mujhe_jeena_nahi", "I_OBJ JEENA NEG_HI", { guard: jeenaGuard }],
  ["self_harm", "mujhe_jeena_nahi_hai", "I_OBJ JEENA NEG_HI AUX", { guard: (c) => /^(?:wala|wali|vala|matlab|meaning|word|shabd|vakya|sentence|spelling)$/u.test(c.toks[c.end]?.raw ?? "") }],
  ["self_harm", "jeene_ka_mann_nahi", "JEENE KA MANN NEG_HI"],
  ["self_harm", "zinda_nahi_rehna", "ZINDA NEG_HI REHNA"],
  ["self_harm", "mujhe_zinda_nahi_rehna", "I_OBJ ZINDA NEG_HI REHNA"],
  ["self_harm", "khud_ko_harm", "KHUD KO HARMV"],
  ["self_harm", "mujhe_khud_ko_harm", "I_OBJ KHUD KO HARMV"],
  ["self_harm", "main_khud_ko_harm", "I_SUBJ KHUD KO HARMV"],
  ["self_harm", "gayab_ho_jana_chahta", "GAYAB HO JANA CHAH"],
  ["self_harm", "hamesha_ke_liye_jana", "HAMESHA KE LIYE CHALA JANA CHAH"],
  ["self_harm", "main_na_rahun", "I_SUBJ NA RAHUN"],
  ["self_harm", "lagta_hai_main_na_rahun", "LAG AUX I_SUBJ NA RAHUN"],
  ["self_harm", "rahun_ya_na_rahun", "RAHUN YA NA RAHUN"],
  ["self_harm", "main_hoon_ya_nahi", "I_SUBJ HOON YA NEG_HI"],
  ["self_harm", "wish_i_wasnt_here", "WISH I_EN WASNT HERE", { guard: herePlace }],
  ["self_harm", "wish_i_was_not_here", "WISH I_EN WAS NOT HERE", { guard: herePlace }],
  ["self_harm", "wish_never_born", "WISH I_EN ~3 NEVER ~1 BORN"],
  ["self_harm", "better_without_me", "BETTER WITHOUT ME_EN"],
  ["self_harm", "better_off_without_me", "BETTER OFF WITHOUT ME_EN"],
  ["self_harm", "better_if_i_wasnt", "BETTER ?OFF IF I_EN WASNT HERE"],
  ["self_harm", "nobody_would_notice", "NOBODY ?WOULD ?EVEN NOTICE ~2 IF I_EN ?WAS GONE"],
  ["self_harm", "kill_myself", "KILL SELF_EN"],
  ["self_harm", "i_kill_myself", "I_EN KILL SELF_EN"],
  ["self_harm", "want_to_kill_myself", "WANT TO KILL SELF_EN"],
  ["self_harm", "wanna_die", "WANT DIE", { guard: gameTalk }],
  ["self_harm", "want_to_die", "WANT TO DIE", { guard: gameTalk }],
  ["self_harm", "i_want_to_die", "I_EN WANT TO DIE", { guard: gameTalk }],
  ["self_harm", "dont_want_to_live", "DONT WANT TO LIVE", { guard: (c) => /^(?:in|at|with|near|here|there|on)$/.test(c.toks[c.end]?.raw ?? "") }],
  ["self_harm", "end_my_life", "END MY_EN LIFE"],
  ["self_harm", "hate_my_life", "HATE MY_EN LIFE"],
  ["self_harm", "i_hate_my_life", "I_EN HATE MY_EN LIFE"],
  ["self_harm", "hate_myself", "I_EN HATE SELF_EN"],
  ["self_harm", "dont_want_to_wake_up", "DONT WANT TO WAKE UP", { wake: true }],
  ["self_harm", "dont_wanna_wake_up", "DONT WANT WAKE UP", { wake: true }],
  ["self_harm", "suicide", "SUICIDE"],
  // abuse (FAMILIES.abuse's actor / verb shapes; the first pass's reported-speech and lesson-object guards)
  ["abuse", "actor_mujhe_maarte", "ACTOR ~2 I_OBJ ?roz/रोज BEAT_HI", { guard: (c) => lessonTalk(c) || negated(c) }],
  ["abuse", "actor_mujhe_maarte_hain", "ACTOR ~2 I_OBJ ?roz/रोज BEAT_HI AUX", { guard: (c) => lessonTalk(c) || negated(c) }],
  ["abuse", "mujhe_maarte", "I_OBJ ~2 BEAT_HI AUX", { guard: (c) => lessonTalk(c) || negated(c) }],
  ["abuse", "actor_maarte_hain", "ACTOR ~3 BEAT_HI AUX", { guard: (c) => reported(c) || lessonTalk(c) || negated(c) }],
  ["abuse", "actor_ne_chhua", "ACTOR ne/ने ~2 BEAT_PAST", { guard: (c) => reported(c) || lessonTalk(c) }],
  ["abuse", "gandi_tarah_chhua", "GANDI TARAH ?se/से ?pe/par/पर ~1 TOUCH_HI"],
  ["abuse", "actor_beats_me", "ACTOR_EN BEAT_EN ME_EN", { guard: gameTalk }],
  ["abuse", "my_actor_beats_me", "MY_EN ACTOR_EN BEAT_EN ME_EN", { guard: gameTalk }],
  ["abuse", "bad_touch", "BAD TOUCH"],
  // fear (FAMILIES.fear's shapes)
  ["fear", "ghar_se_dar", "GHAR ?JANA SE DAR"],
  ["fear", "ghar_se_dar_lagta", "GHAR ?JANA SE DAR LAG"],
  ["fear", "ghar_mein_dar", "GHAR IN_HI DAR LAG"],
  ["fear", "dar_ghar_pe_koi_nahi", "DAR LAG raha/rha AUX ~1 GHAR pe/par/mein/में/पर KOI NEG_HI"],
  ["fear", "sab_mujhe_chidhate", "SAB I_OBJ CHIDHA"],
  ["fear", "sab_mujhse_nafrat", "SAB MUJHSE NAFRAT"],
  ["fear", "sab_mujhse_nafrat_karte", "SAB MUJHSE NAFRAT karte/करते"],
  ["fear", "koi_dhamki", "KOI I_OBJ ~1 DHAMKI"],
  ["fear", "dhamki", "DHAMKI_SOLO", { guard: storyTalk }],
  ["fear", "koi_pyaar_nahi", "KOI MUJHSE PYAAR NEG_HI"],
  ["fear", "ghar_se_bhaag", "GHAR SE BHAAG JAUNGA"],
  ["fear", "scared_home", "SCARED ?TO ?go ?at HOME"],
  ["fear", "scared_to_go_home", "SCARED TO go HOME"],
  ["fear", "bully", "BULLY", { guard: (c) => /^(?:dog|cat|ka|ki|ke)$/.test(c.toks[c.end]?.raw ?? "") }],
  ["fear", "nobody_loves_me", "NOBODY LOVES ME_EN"],
  ["fear", "everyone_hates_me", "EVERYONE HATES ME_EN"],
  ["fear", "run_away_from_home", "going/gonna/want/wanna/will/plan ?TO RUN AWAY FROM HOME"],
].map(([kind, id, pat, o = {}]) => {
  const steps = pat.split(" ").map((s) => {
    if (s.startsWith("~")) return { gap: Number(s.slice(1)) };
    const opt = s.startsWith("?");
    const name = opt ? s.slice(1) : s;
    return { opt, g: groupFor(name), key: KEY.has(name) };
  });
  const reqGroups = steps.filter((s) => s.g && !s.opt).map((s) => s.g);
  const req = reqGroups.length;
  return { kind, id, steps, req: reqGroups, budget: req <= 2 ? 0 : req === 3 ? 1 : 2, ...o };
});

// ── the indexed fast path ──
// slotCost above is the reference (and the KNOWN builder's); fuzzyScan reads every group's cost for a token at once from these
// indexes (exact keys, single-deletion keys, Devanagari skeleton / final-sign / prefix keys, English skeletons), so a long
// partial costs O(tokens x word length) lookups instead of tokens x groups x words. tests/safety.test.mjs pins that both
// paths agree on every (token, group) pair of the eval corpora.
const ALL_GROUPS = () => [...Object.values(GROUPS), ...LIT.values()];
const dels = (w) => { const out = []; for (let i = 0; i < w.length; i++) out.push(w.slice(0, i) + w.slice(i + 1)); return out; };
const push = (m, k, v) => { const a = m.get(k); if (a) a.push(v); else m.set(k, [v]); };
function buildIndex() {
  const ix = { folded: new Map(), canon: new Map(), longCanon: new Map(), longRaw: new Map(), shortPlus: new Map(), shortMinus: new Map(),
    devaSkel: new Map(), devaDrop: new Map(), devaPrefix: new Map(), enSkel: new Map() };
  for (const g of ALL_GROUPS()) {
    for (const f of g.folded) push(ix.folded, f, g);
    for (const c of g.canon) push(ix.canon, c, g);
    const min = g.solo ? 5 : 4;
    const addLong = (m, w, kind) => { if (w.length < min) return; for (const k of new Set([w, ...dels(w)])) push(m, k, { g, w, kind }); };
    for (const c of g.canonList) {
      addLong(ix.longCanon, c, "canon");
      if (!g.solo && c.length < min) { push(ix.shortPlus, c, { g, kind: "canon" }); if (c.length >= 2) push(ix.shortMinus, c.slice(0, -1), { g, kind: "canon" }); }
    }
    for (const w of g.rawList) {
      addLong(ix.longRaw, w, "raw");
      if (!g.solo && w.length < min) { push(ix.shortPlus, w, { g, kind: "raw" }); if (w.length >= 2) push(ix.shortMinus, w.slice(0, -1), { g, kind: "raw" }); }
    }
    if (!g.solo) for (const d of g.devaInfo) {
      push(ix.devaSkel, d.skel, { g, d });
      if (d.dropFinal) push(ix.devaDrop, d.dropFinal, g);
      push(ix.devaPrefix, d.w, g);
    }
    if (g.en && !g.solo) for (const k of g.enSkel) push(ix.enSkel, k, g);
  }
  return ix;
}
let IX = null;

/** Every group's cost for token t (Map group name → 0 | 1 | 2; absent = no). Same rules as slotCost. */
function costsOf(t, known = KNOWN_NEAR) {
  if (t.costs) return t.costs;
  IX ??= buildIndex();
  const out = new Map();
  const set0 = (g) => out.set(g.name, 0);
  for (const g of IX.folded.get(t.raw) ?? []) set0(g);
  if (t.canon) for (const g of IX.canon.get(t.canon) ?? []) set0(g);
  const conf = CONFUSION[t.raw];
  if (conf) { for (const g of IX.folded.get(conf) ?? []) set0(g); for (const g of IX.canon.get(canonKey(conf)) ?? []) set0(g); }
  if (t.canon && t.script !== "num" && t.script !== "other") {
    const isKnown = known.has(t.raw);
    const near = new Map();   // group name → { g, noPenalty }
    const mark = (g, noPenalty = false) => { if (out.get(g.name) === 0) return; const p = near.get(g.name); if (!p || (noPenalty && !p.noPenalty)) near.set(g.name, { g, noPenalty: noPenalty || !!p?.noPenalty }); };
    if (t.script === "deva") {
      const tn = t.n ?? (t.n = cps(t.raw).length);
      for (const g of IX.devaDrop.get(t.raw) ?? []) mark(g, true);
      for (const { g, d } of IX.devaSkel.get(t.skel) ?? []) if (Math.abs(d.n - tn) <= 1 && lev1cp(t.raw, d.w)) mark(g);
      const cp = cps(t.raw);
      if (cp.length >= 2) for (const g of IX.devaPrefix.get(cp.slice(0, -1).join("")) ?? []) mark(g);
      if (t.enSkel && t.enSkel.length >= 2) for (const g of IX.enSkel.get(t.enSkel) ?? []) mark(g);
    }
    const longNear = (m, a, kind) => {
      if (a.length < 3) return;
      for (const k of new Set([a, ...dels(a)])) for (const e of m.get(k) ?? []) if (e.kind === kind && Math.abs(e.w.length - a.length) <= 1 && lev1(a, e.w)) mark(e.g);
    };
    longNear(IX.longCanon, t.canon, "canon");
    if (t.script === "latin") {
      longNear(IX.longRaw, t.raw, "raw");
      for (const [a, kind] of [[t.canon, "canon"], [t.raw, "raw"]]) {
        if (a.length >= 2) for (const e of IX.shortPlus.get(a.slice(0, -1)) ?? []) if (e.kind === kind) mark(e.g);   // one letter added at the end
        if (a.length >= 1) for (const e of IX.shortMinus.get(a) ?? []) if (e.kind === kind) mark(e.g);               // one letter dropped at the end
      }
    }
    for (const { g, noPenalty } of near.values()) {
      if (g.solo && isKnown) continue;
      out.set(g.name, isKnown && !noPenalty ? 2 : 1);
    }
  }
  t.costs = out;
  return out;
}

/** Joins a fuzzy-matchable token list needs ("no one" → "noone", "do not" → "dont", "was not" → "wasnt"). */
function joinPairs(toks) {
  const out = [];
  for (let i = 0; i < toks.length; i++) {
    const a = toks[i].raw, b = toks[i + 1]?.raw;
    const pair = b && ({ "no one": "noone", "do not": "dont", "don t": "dont", "was not": "wasnt", "were not": "werent", "wasn t": "wasnt" })[`${a} ${b}`];
    if (pair) { out.push({ raw: pair, script: "latin", clause: toks[i].clause }); i++; } else out.push(toks[i]);
  }
  return out;
}

function prep(text) {
  // clause index per token (a mark in the ORIGINAL text ends a clause): guards read "the rest of the clause", as the first
  // pass does ("I don't want to wake up tomorrow, the answer is 5": the 5 is not about waking)
  const clauses = foldUnicode(text).split(/[.,!?;:।॥\n]+/u);
  const toks = joinPairs(clauses.flatMap((cl, ci) => tokensOf(foldText(cl, { runs: false })).map((t) => ({ ...t, raw: t.raw.replace(/'/g, ""), clause: ci }))));
  for (const t of toks) {
    t.canon = canonKey(t.raw);
    t.skel = t.script === "deva" ? devaSkeleton(t.raw) : "";
    t.enSkel = t.script === "deva" ? englishSkeleton(t.raw) : "";
  }
  return toks;
}
const costOf = (t, g) => costsOf(t).get(g.name) ?? Infinity;

/** Is token t a slot word of g with exactly one letter (code point) dropped — on the spelling or the canonical key? */
function droppedLetterOf(t, g) {
  const memo = (t.drop ??= new Map());
  if (memo.has(g.name)) return memo.get(g.name);
  const one = (a, w) => { const A = cps(a), W = cps(w); if (W.length !== A.length + 1) return false; for (let k = 0; k < W.length; k++) if (W.slice(0, k).concat(W.slice(k + 1)).join("") === a) return true; return false; };
  const r = [...g.folded].some((w) => one(t.raw, w)) || (!!t.canon && g.canonList.some((w) => one(t.canon, w)));
  memo.set(g.name, r);
  return r;
}

/** All matches of one shape starting at token i: yields { end, fuzz }. */
function* walk(toks, steps, si, i, fuzz, budget) {
  if (si === steps.length) { yield { end: i, fuzz }; return; }
  const s = steps[si];
  if (s.gap !== undefined) { for (let k = 0; k <= s.gap && i + k <= toks.length; k++) yield* walk(toks, steps, si + 1, i + k, fuzz, budget); return; }
  if (i < toks.length) {
    let c = costOf(toks[i], s.g);
    if (c === 2 && s.key && !droppedLetterOf(toks[i], s.g)) c = Infinity;   // a different real word in the meaning slot (KEY above)
    if (fuzz + c <= budget) yield* walk(toks, steps, si + 1, i + 1, fuzz + c, budget);
  }
  if (s.opt) yield* walk(toks, steps, si + 1, i, fuzz, budget);
}

/**
 * The fuzzy pass over one turn's text.
 * @param {string} text
 * @param {{ wakeOk?: (rest: string) => boolean }} [hooks]  wakeOk: the first pass's "after wake up" clause rule (safety.js)
 * @returns {{ distress: boolean, kind: "self_harm"|"abuse"|"fear"|null, shape: string|null, fuzz: number }}
 */
export function fuzzyScan(text, hooks = {}) {
  const toks = prep(text);
  if (!toks.length) return { distress: false, kind: null, shape: null, fuzz: 0 };
  for (const sh of SHAPES) {
    // every required slot must be fillable by SOME token within budget, or the shape cannot match anywhere
    if (!sh.req.every((g) => toks.some((t) => costOf(t, g) <= sh.budget))) continue;
    for (let i = 0; i < toks.length; i++) {
      for (const m of walk(toks, sh.steps, 0, i, 0, sh.budget)) {
        if (m.end <= i) continue;
        const c = { toks, start: i, end: m.end };
        if (sh.guard && sh.guard(c)) continue;
        if (sh.wake && hooks.wakeOk) {
          const cl = toks[m.end - 1].clause;
          const rest = toks.slice(m.end).filter((t) => t.clause === cl).map((t) => t.raw).join(" ");
          if (!hooks.wakeOk(rest)) continue;
        }
        return { distress: true, kind: sh.kind, shape: sh.id, fuzz: m.fuzz };
      }
    }
  }
  return { distress: false, kind: null, shape: null, fuzz: 0 };
}

/** For the KNOWN builder and tests: the slot groups (name → compiled) and the shape list. */
export const __internals = { GROUPS, SHAPES, prep, slotCost, costsOf, ALL_GROUPS };
