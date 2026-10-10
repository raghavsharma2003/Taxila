// Relational signal predicates over the child's words (RELATIONAL-OS §4.3; BUILD-PLAN W2-I #2). PURE, ≤ 1 ms, no network.
// Bilingual: English, Roman Hinglish and Devanagari (lexicon/**), matched in safety.js normForMatch form (\p{M} kept,
// nukta and chandrabindu folded), letter-bounded, with three exclusions a keyword list cannot make:
//   - NEGATION: "I don't love maths", "main tumhari dost nahi" — a negator right before the hit turns a warmth, romance,
//     permanence or feelings hit off (contact, secret, harm and goodbye are never switched off by a negation: "don't tell
//     mummy" IS the secret ask);
//   - QUOTATION / REPORTED SPEECH: "my friend said I love you", "bhaiya bolte hain photo bhejo" — reported words are not
//     the child's own offer; for contact and secret asks they are the opposite: a THIRD PARTY asking is the F6 grooming
//     branch (thirdParty: true), never a boundary moment;
//   - HYPOTHETICAL / META: "what if I said…", "agar main bolun…" read as reported.
// What a signal never is: an emotion label. The child's voice is never classified (Microsoft AI Code of Conduct;
// ct-no-voice-emotion-inference): every signal here is lexical, from words the child chose to say.
import { normForMatch, scanSafety } from "../director/safety.js";
import { LEXICON } from "./lexicon/index.js";

const LEX = Object.entries(LEXICON);

/** Kinds a negator right before the hit switches off. */
const NEGATABLE = new Set(["warmth_offer", "romance", "permanence_ask", "feelings_q", "loneliness", "self_label", "tired", "share", "share_sad", "night_ask"]);
/** Kinds a reported-speech frame switches off (the child is quoting someone, not offering it). */
const REPORTABLE = new Set(["warmth_offer", "romance", "permanence_ask", "feelings_q", "self_label", "goodbye", "end_request", "identity_q", "joke"]);
/** Kinds where a third party's ask is the danger itself (F4 → F6). */
const THIRD_PARTY_KINDS = new Set(["contact_ask", "secret_ask"]);

const NEG = /(?:^|\s)(?:not|no|never|don'?t|dont|doesn'?t|didn'?t|won'?t|isn'?t|aren'?t|nahi|nahin|nai|nhi|mat|na|नहीं|मत|ना)$/u;
/** A reporting frame: someone else said / asked / wants it ("he said", "bhaiya bolte hain", "woh kehta hai", "usne kaha"). */
const REPORT = /(?:^|\s)(?:said|says|say|told|tells|asked|asks|asking|wants|wanted|messaged|texted|bola|boli|bole|bolta|bolti|bolte|kaha|kehta|kehti|kehte|keh rahe|keh raha|keh rahi|bol rahe|bol raha|bol rahi|maanga|maangta|maangte|maang raha|maang rahe|बोला|बोले|बोलते|कहा|कहते|कहता|मांगा|मांगते)(?:\s+(?:hai|hain|ki|that|me|mujhse|mujhe|to me|ke|है|हैं|कि))*(?:\s|$)/u;
const HYPO = /(?:what if i (?:said|say|told)|if i (?:said|say|told) you|agar (?:main|mai) (?:bolun|kahun|bol doon|bol du|bolu)|suppose)(?:\s|$)/u;
/** Who the third party is: an actor other than the child or the teacher. */
const ACTOR = /(?:^|\s)(?:bhaiya|bhaiyya|uncle|aunty|auntie|stranger|someone|somebody|a man|a boy|a girl|a guy|boy|man|person|player|online|game wale|game wala|game mein|koi|unknown|anjaan|anjan|insta wale|he|she|they|woh|wo|vo|usne|unhone|ek admi|ek aadmi|aadmi|admi|ladka|ladke|ladki|bade bhai|bada bhai|friend|friend ka|भैया|अंकल|कोई|किसी ने|उसने|वो|लडके|लडका|लडकी|आदमी|अजनबी|अनजान|दोस्त|फ्रेंड|प्लेयर)(?:\s|$)/u;
/** A short break is a break, never a goodbye or an end ("I need to go to the toilet", "paani peeke aati hoon"). */
const SHORT_BREAK = /(?<![\p{L}\p{M}])(?:toilet|bathroom|washroom|loo|pee|potty|susu|paani|pani|water|drink|शौचालय|पानी)(?![\p{L}\p{M}])/iu;
/** A 10-digit Indian mobile number in the child's words (offering their own number is a contact ask). */
const PHONE = /(?<!\d)(?:\+?91[\s-]?)?[6-9]\d(?:[\s-]?\d){8}(?!\d)/;
const LAUGH_EMOJI = /[\u{1F602}\u{1F923}\u{1F606}\u{1F605}\u{1F604}\u{1F601}]/u;
/**
 * The third-party (F6 grooming) branch without a lexicon verb form ("ek uncle ne mera number maanga"): an ASK verb, plus
 * personal data that points at the child (a possessive), and the data word not followed by a numeral ("woh bola number 5
 * hai", "usne kaha photo mein 3 birds hain", "they asked for the address of the shop" are word problems). Generic
 * say / want verbs never fire it (fixer review 2026-10-05: "he wants a number bigger than 10" wrote a safeguarding
 * incident; rj-w2i-generic-report-verbs-third-party).
 */
const ASK_VERB = /(?<![\p{L}\p{M}])(?:maanga|manga|mangi|maang(?:a|e|i|ta|ti|te)?|maang (?:raha|rahi|rahe)|pooch(?:a|ha|i|ta|ti|te)?|puch(?:a|ha|i)|pooch (?:raha|rahi|rahe)|asked (?:me )?for|asks (?:me )?for|asking (?:me )?for|asked (?:me )?where|asking (?:me )?where|asked my|asks my|asked me to send|asks me to send|wants me to send|told me to send|bhej(?:o|na|ne|ne ko|do| do|un|oon)|send|de do|dene ko|share karo|batane ko|मांगा|मांगी|मांगे|मांगते|मांगता|पूछा|पूछी|पूछ रहा|पूछ रही|भेजो|भेजने|भेजूं|बताने को)(?![\p{L}\p{M}])/u;
const CHILD_DATA = /(?<![\p{L}\p{M}])(?:(?:mera|meri|mere|my|apna|apni|apne|tumhara|tumhari|मेरा|मेरी|मेरे|अपना|अपनी)\s+(?:\S+\s+)?(?:number|phone|mobile|whatsapp|insta|instagram|snapchat|address|ghar ka pata|pata|photo|photos|pic|picture|selfie|video|नंबर|फोटो|पता)(?![\p{L}\p{M}])(?!\s+(?:is\s+|hai\s+|was\s+|tha\s+|है\s+)?\d)|where (?:my house is|i live|i stay)|(?:main|mai) kahan (?:rehta|rehti|rahta|rahti)|ghar kahan hai|(?:mere )?ghar ka (?:address|pata)|घर का पता|मैं कहां रहता|मैं कहां रहती)/u;
/** An explicit meeting or secrecy ask by a third party (scanSafety's grooming rule also fires on these: the harm signal). */
const MEET_OR_SECRET = /(?<![\p{L}\p{M}])(?:milne (?:aao|aaun|aau|bulaya|bulate|bulata|bula raha|ko kaha)|akel[aei] (?:milne|milo|milun|milu|mil)|meet karne|meet (?:him|her|them|me) (?:alone|outside|after|without)|wants to meet me|kisi ko mat batana|mat batana (?:mummy|papa|parents|ghar)|don'?t tell (?:anyone|your (?:mom|mum|dad|parents|mummy|papa))|secret (?:rakh|from)|अकेले मिल|मिलने (?:के लिए बुलाया|बुलाया|आओ)|किसी को (?:न|मत|नहीं) बता)/u;
/** A surprise or a gift is not the grooming shape (scanSafety's grooming rule has the same exclusion). */
const SURPRISE = /(?<![\p{L}\p{M}])(?:surprise|birthday|gift|present|party|tohfa|janamdin|सरप्राइज|जन्मदिन|तोहफा)(?![\p{L}\p{M}])/u;

// ── goodbye / stop-phrase anchoring (fixer review 2026-10-05; rj-w2i-unanchored-leave-lexicon) ──
// A goodbye or a stop phrase is the child LEAVING only when it closes its clause: after it, filler only (an address term,
// "now", "ok", "for today"); never in a clause that carries a number or an answer word; never right after a copula or a
// modelling verb ("the answer is bye", "say bye"). A stop phrase is also void in a turn that gives an answer ("i'm done,
// it's 24") or steers or skips ("this one, give another", "can we do science", "stop now i got it"): those are the skip
// and steering paths, never a stop.
const ANCHORED = new Set(["goodbye", "end_request"]);
const FILLER_MULTI = /(?<![\p{L}\p{M}])(?:thank you|thank u|for now|for today|aaj ke liye|theek hai|thik hai|ok then|okay then|ठीक है|आज के लिए)(?![\p{L}\p{M}])/gu;
const FILLER = new Set(["now", "then", "ok", "okay", "okk", "k", "so", "guys", "everyone", "everybody", "all", "ji", "na", "yaar", "yar", "please", "plz", "pls",
  "thanks", "thankyou", "ty", "didi", "di", "bhaiya", "bhaiyya", "bhai", "ma'am", "mam", "maam", "madam", "sir", "teacher", "miss", "aunty", "today", "ab", "abhi",
  "to", "toh", "haan", "han", "accha", "acha", "achha", "chalo", "bas", "dear", "friend", "ma", "mummy", "bye", "tata", "hain", "hai", "h",
  "दीदी", "भैया", "मैम", "सर", "जी", "अब", "अभी", "चलो", "हां", "हाँ", "बाय", "मैडम", "टीचर", "प्लीज", "ना", "sorry", "sry"]);
/** A stop phrase may also carry lesson words and the verb's tail ("can we end today's lesson", "class khatam kar sakte
 * hain", "क्लास यहीं खत्म कर दें"): words about the LESSON, never about a sum, a timer or a fan. */
const STOP_OBJ = new Set(["the", "this", "our", "it", "here", "lesson", "class", "session", "today's", "todays", "online", "teaching", "studying", "study", "padhai",
  "aaj", "ka", "ki", "ke", "liye", "yahin", "yahi", "kar", "karo", "do", "dein", "de", "karein", "kijiye", "sakte", "sakti", "hain", "lein", "lo", "please",
  "padhein", "padh", "padhna", "padhte", "padhenge", "आज", "का", "की", "के", "लिए", "यहीं", "कर", "करो", "दो", "दें", "करें", "सकते", "सकती", "हैं", "है", "हो", "लें",
  "क्लास", "लेसन", "पढाई", "हम", "क्या", "पढ", "पढें", "पढना"]);
/** Pure greetings may carry one name after them ("bye Ravi", "good night Asha"): the teacher's name is the child's choice. */
const GREETING = /^(?:bye+|bye bye|goodbye|good night|see (?:you|ya)|ttyl|tata|alvida|phir milte|kal milte|अलविदा|बाय|बाय बाय|गुड नाइट|फिर मिलते)/u;
const NUM_MARK = /\d|(?<![\p{L}\p{M}])(?:answer|ans|jawab|jawaab|javab|uttar|equals?|barabar|baraabar|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|hundred|thousand|half|plus|minus|times|multiplied|divided|उत्तर|जवाब|बराबर)(?![\p{L}\p{M}])/u;
const COPULA_BEFORE = /(?:^|\s)(?:is|was|are|means|mean|called|say|says|said|write|spell|spelling|word|likho|bolo|matlab|hai|tha|हैं|है|था|मतलब|लिखो|बोलो)$/u;
// round 2 safety floor (2026-10-07): the Devanagari steers too, now that a bare "बस" is a stop phrase ("बस, समझ आया, और मत
// समझाइए" is "enough explaining", not a stop: held-out in-lesson negatives v2)
const STEER = /(?<![\p{L}\p{M}])(?:this one|that one|is sawal|ye sawal|yeh sawal|is wala|ye wala|give (?:me )?another|another one|next one|next question|something else|kuch aur|dusra|doosra|agla|agle|explain|samjha|samjhao|samjhaiye|samjhayiye|samajh nahi|got it|i get it|understood|i understand|i know|samajh (?:gaya|gayi|aa gaya)|samjh (?:gaya|gayi|aa gaya)|(?:can|could) we do (?:science|english|hindi|evs|sst|social|maths|math|something|another|a different|some other|the next|next|a game|drawing|a story)|let'?s do (?:science|english|hindi|evs|something|another|a game)|instead|talk about|baat karein|baat karte|change|skip|समझ (?:आया|आ गया|गया|गयी|गई)|समझ नहीं|समझाओ|समझाइए|समझाइये|समझाना|दूसरा|अगला|स्किप)(?![\p{L}\p{M}])/u;

// round 3 fix (experience B8): "yeh nahi padhna, fractions padhna hai" names a subject to study INSTEAD: a steer, never a
// stop phrase (after a stop check-in it was the second stop and the relational policy RELEASED the lesson, with the subject
// never offered). Only a real word before the study verb ("<subject> padhna hai"): a negation, a pronoun or a filler there
// ("nahi padhna hai", "mujhe padhna hai", "padhna hi nahi hai") is not a subject, and the stop reading stands.
const STUDY_VERB = new Set(["padhna", "padhni", "seekhna", "sikhna", "samajhna"]);
const STUDY_AUX = new Set(["hai", "h", "chahta", "chahti", "chahiye"]);
const NOT_A_SUBJECT = new Set(["nahi", "nahin", "nhi", "na", "mat", "mujhe", "muje", "hume", "humein", "main", "mai", "ab", "abhi", "aaj", "kal", "aur", "yeh", "ye", "is", "isko", "ise",
  "bas", "kuch", "aage", "phir", "toh", "to", "hi", "bilkul", "zara", "thoda", "jyada", "zyada", "bhi", "wala", "wali", "lesson", "class", "padhai", "homework",
  // when / where, never what: "baad mein padhna hai", "ghar jaake padhna hai" are a stop for now, not another subject
  "baad", "mein", "me", "later", "ghar", "jaake", "jakar", "akele", "khud", "dheere", "sirf"]);
/** "<subject> padhna hai": the word right before the study verb is a real word (3+ letters, not a negation / pronoun / filler). */
const studyInstead = (whole) => {
  const w = String(whole).split(/[^\p{L}\p{M}]+/u).filter(Boolean);
  for (let i = 1; i < w.length - 1; i++) {
    if (!STUDY_VERB.has(w[i]) || !STUDY_AUX.has(w[i + 1])) continue;
    const before = w[i - 1];
    if (before.length >= 3 && !NOT_A_SUBJECT.has(before) && !STUDY_VERB.has(before)) return true;
  }
  return false;
};

/** Does the hit (match m over the sub-clause norm) close its clause the way a real goodbye or stop phrase does? */
function anchoredLeave(kind, norm, m) {
  if (NUM_MARK.test(norm)) return false;
  if (COPULA_BEFORE.test(norm.slice(0, m.index).trim())) return false;
  // later hits of the same kind are part of the leaving ("bye see you tomorrow")
  const again = new RegExp(LEXICON[kind].source, "gu");
  again.lastIndex = m.index + m[0].length;
  let end = m.index + m[0].length;
  for (let x = again.exec(norm); x; x = again.exec(norm)) { if (x[0] === "") { again.lastIndex++; continue; } end = x.index + x[0].length; }
  const tail = norm.slice(end).replace(FILLER_MULTI, " ").split(/\s+/).filter((w) => w && !FILLER.has(w));
  const rest = kind === "end_request" ? tail.filter((w) => !STOP_OBJ.has(w)) : tail;
  return rest.length <= (kind === "goodbye" && GREETING.test(m[0]) ? 1 : 0);
}

/** Clauses of the raw text, quoted spans split out and marked reported. */
function clausesOf(text) {
  const raw = String(text ?? "");
  const out = [];
  const QUOTED = /["“”‘’]([^"“”‘’\n]{2,})["“”‘’]/gu;
  const unquoted = raw.replace(QUOTED, (_, inner) => { out.push({ text: inner, quoted: true }); return " . "; });
  for (const c of unquoted.split(/[.!?।;\n]+/u)) if (c.trim()) out.push({ text: c, quoted: false });
  return out;
}

/**
 * The relational signals in one child turn.
 * @param {string} text the child's words (typed, a chip label, or the final transcript)
 * @param {{ turn?: number, lane?: "L"|"G"|"typed"|"chip", harm?: boolean }} [ctx] harm: false skips the safety predicate when the
 *   caller already ran it (the turn's safety gate: its verdict arrives as the seam input's `safety`)
 * @returns {import("../../shared/relational").RelSignal[]}
 */
export function signalsOf(text, ctx = {}) {
  const turn = Number(ctx.turn) || 0;
  const lane = ctx.lane ?? "typed";
  const raw = String(text ?? "");
  if (!raw.trim()) return [];
  const found = new Map();
  const add = (kind, extra = {}) => {
    const prev = found.get(kind);
    if (!prev) found.set(kind, { kind, turn, lane, confidence: "lexical", ...extra });
    else if (extra.thirdParty) prev.thirdParty = true;
  };
  const whole = normForMatch(raw.replace(/\?/g, " "));
  const anyActor = ACTOR.test(` ${whole} `);
  // a stop phrase is void in a turn that answers, steers or skips (the whole turn, not only its clause)
  const stopVoid = NUM_MARK.test(whole) || STEER.test(whole) || studyInstead(whole);
  for (const clause of clausesOf(raw)) {
    const norm = normForMatch(clause.text.replace(/\?/g, " "));
    if (!norm) continue;
    // goodbye / end_request are judged per comma sub-clause ("it's 24, bye" is an answer, then a goodbye)
    const subs = clause.text.split(/[,،]+/u).map((t) => normForMatch(t.replace(/\?/g, " "))).filter(Boolean);
    for (const [kind, re] of LEX) {
      if (ANCHORED.has(kind)) {
        if (kind === "end_request" && stopVoid) continue;
        let hit = false;
        for (const sub of subs) {
          re.lastIndex = 0;
          for (let m = re.exec(sub); m; m = re.exec(sub)) {
            if (m[0] === "") { re.lastIndex++; continue; }
            const before = sub.slice(0, m.index).trim();
            if (clause.quoted || REPORT.test(` ${before} `) || HYPO.test(`${before} `)) continue;
            if (anchoredLeave(kind, sub, m)) { hit = true; break; }
          }
          if (hit) break;
        }
        re.lastIndex = 0;
        if (hit) add(kind);
        continue;
      }
      re.lastIndex = 0;
      if (!re.test(norm)) continue;                 // most kinds miss: no allocation for them
      re.lastIndex = 0;
      for (let m = re.exec(norm); m; m = re.exec(norm)) {
        if (m[0] === "") { re.lastIndex++; continue; }
        const before = norm.slice(0, m.index).trim();
        const reported = clause.quoted || REPORT.test(` ${before} `) || HYPO.test(`${before} `);
        if (NEGATABLE.has(kind) && NEG.test(before)) continue;
        if (THIRD_PARTY_KINDS.has(kind)) {
          // the child repeating someone else's ask (or an actor asking for their data) is the third-party branch; the
          // lexicon forms are themselves asks for HER or the CHILD's data, so a reporting frame around one is enough
          const third = reported || (anyActor && (REPORT.test(` ${norm} `) || ASK_VERB.test(norm)));
          add(kind, third ? { thirdParty: true } : {});
          break;
        }
        if (reported && REPORTABLE.has(kind)) continue;
        add(kind);
        break;
      }
    }
  }
  // An actor asking the child for personal data, said without the lexicon's verb forms ("ek uncle ne mera number maanga",
  // "usne mujhse meri photo maangi"), or asking for a meeting or a secret.
  if (!found.has("contact_ask") && anyActor && ((ASK_VERB.test(whole) && CHILD_DATA.test(whole)) || (MEET_OR_SECRET.test(whole) && !SURPRISE.test(whole)))) add("contact_ask", { thirdParty: true });
  if (PHONE.test(raw.replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966)))) add("contact_ask");
  if (LAUGH_EMOJI.test(raw)) add("joke");
  // A break is a break: no goodbye, no end request.
  if (SHORT_BREAK.test(raw)) { found.delete("goodbye"); found.delete("end_request"); }
  // Leaving wins over a bare stop ("bas, mummy bula rahi hai, bye" is a goodbye, released at once).
  if (found.has("goodbye")) found.delete("end_request");
  // Harm words are the safety gate's (F6): the same predicate the turn already runs, mirrored as a signal for the policy's
  // precedence (a goodbye after harm words gets the check-in, I-7).
  if (ctx.harm !== false && scanSafety(raw).distress) add("harm");
  // A share that is sad is a sad share (gentle concern, never a helpline on its own).
  if (found.has("share_sad")) found.delete("share");
  // "you are my best friend" is a warmth offer, not a share about their life
  if (found.has("warmth_offer")) found.delete("share");
  return [...found.values()];
}

/** Words in the child's turn (for the session median and withdrawal), Devanagari and Roman alike. */
export const wordCount = (text) => (normForMatch(text).match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}']*/gu) ?? []).length;

/** True when the signals include any of the kinds. */
export const has = (signals, ...kinds) => (signals ?? []).some((s) => kinds.includes(s.kind));

/**
 * The stop protocol's reading of a child turn (OWNER RESET #7; CONVERSATION-V2 §3.5): "leaving" (a true goodbye: released
 * at once), "end_request" (a stop phrase: one warm check-in with choices first; a second stop releases), or null. A short
 * break ("toilet", "paani") is neither. Consumed by W2-C's state.js stop check (server/relational/seam-patches).
 * @param {string} text
 * @returns {"leaving" | "end_request" | null}
 */
export function stopKind(text) {
  const k = new Set(signalsOf(text).map((s) => s.kind));
  return k.has("goodbye") ? "leaving" : k.has("end_request") ? "end_request" : null;
}
