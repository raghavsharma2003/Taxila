// The child's own requests, read from their WORDS (OWNER TEST 2026-10-04 items 3, 4 and 5; evals/owner-truth/ROOT-CAUSES.md
// F6, F8, F9, F11-F16). Before this a child's words became either an answer label or one of five flags, so "explain it
// differently", "Hindi mein samjhao", "example do", "slowly please", "show me a diagram" and "can we talk about something
// else" were all `unclear` (a re-ask of the same question), and "lesson khatam" / "I'm done" were whatever the classifier
// model's one-line `wants_to_stop` rule made of them (an immediate end, or nothing at all).
//
// A closed taxonomy, detected lexically FIRST (deterministic, replayable, no model call), with the classifier as the
// backstop for what the lexicon misses. Pure. Never evidence: a request is not an answer, so a turn carrying one is
// graded only when the words also hold an attempt (digits, or more than a request's worth of words) — then the answer
// path runs as before and the request is ignored.
//
//   goodbye        a real goodbye ("bye", "mujhe jaana hai", "I have to go now"): the lesson ends THAT turn, no question
//                  (NEVER MANIPULATE; RELATIONAL-OS RELEASE). Never held by a check-in.
//   stop           "lesson khatam", "I'm done", "end the lesson", "bas", "I want to stop": ONE warm check-in (keep going
//                  / short break / stop for today); stop words again on the next turn, or the stop chip, end it.
//   continue       "keep going", "chalo continue karte hain" (an answer to the check-in)
//   break          "thoda break chahiye", "can I take a short break" (and a toilet / water break)
//   change_topic   "can we talk about something else", "kuch aur baat karte hain" — never a stop (F8)
//   topic          "cricket ke baare mein baat karo", "tell me about dinosaurs": { subject }
//   language       "Hindi mein samjhao", "English mein batao": { lang: "hindi" | "english" | "hinglish" }
//   another        "explain it differently", "dusre tareeke se samjhao", "samajh nahi aaya, aur aasan karo"
//   example        "example do", "give me an example"
//   story          "story ki tarah batao", "kahani se samjhao"
//   slower         "slowly please", "dheere bolo", "thoda slow" — about HER pace, never "say it again slowly" (F14)
//   visual         "show me a diagram", "picture dikhao", "draw it", "whiteboard pe bana ke samjhao", "game khelna hai",
//                  "animation dikhao": { kind: "diagram" | "game" | "animation" }
//
// Each pattern is anchored to a request's own shape, so a phrase inside an answer ("the bar is bigger, so stop") is
// not a request. The words a child uses for these come from the owner's session (evals/owner-truth/results/
// 2026-10-04T18-30-08) and the owner tests (tests/prod/owner-3/4/5-*.mjs); the unit test is tests/requests.test.mjs.

import { stopKind } from "../relational/signals.js";
import { sexualAsk } from "../conversation/lexicon.js";
import { devaToRoman } from "../safety/normalize.js";

const T = (s) => String(s ?? "").toLowerCase().normalize("NFKC").replace(/[’`]/g, "'").replace(/\s+/g, " ").trim();
/** Strip the leading politeness and fillers a child wraps a request in ("ok", "please", "didi", "ma'am"). */
const core = (t) => t.replace(/^(?:(?:ok(?:ay)?|achha|accha|acha|hmm+|haan|ha|ji|please|plz|pls|arre|arey|yaar|didi|bhaiya|ma'?am|sir|teacher|miss|umm+|uh+|so|and|aur|but|par|lekin|nahi|no|wait|ruko)[\s,!.]+)+/i, "")
  .replace(/[\s,!.]*(?:please|plz|pls|na|naa|yaar|ji|didi|bhaiya|ma'?am|sir)?[\s.!?]*$/i, "").trim();

/** A real goodbye: the child is leaving now. Mirrors safety.js wantsToStop's leave-now forms (kept in step by the test). */
const GOODBYE = /\b(?:bye|bye[\s-]*bye|good\s*night|tata|alvida|see\s+you|mujhe\s+ja(?:a)?na\s+(?:hai|padega|h)|main\s+ja\s+(?:raha|rahi)\s+(?:hoon|hu)|i\s+(?:have|need|gotta|got)\s+to\s+(?:go|leave)|i\s+(?:want|wanna)\s+to\s+leave|i'?m\s+leaving|i\s+am\s+leaving|mummy\s+bula\s+rahi\s+(?:hai|h)\s*,?\s*(?:bye|jaana))\b|अलविदा|मुझे\s*जाना\s*है|(?<![\p{L}\p{M}])बाय(?:\s*बाय)?(?![\p{L}\p{M}])/iu;
/** A short break (toilet, water): never a goodbye and never a stop (safety.js SHORT_BREAK). */
const SHORT_BREAK = /\b(?:toilet|bathroom|washroom|loo|pee|potty|susu|paani|pani|water|drink)\b/i;
const STOP = new RegExp([
  String.raw`\b(?:lesson|class|padhai|session)\s+(?:khatam|khatm|khtm|band|over|done|finish(?:ed)?|end)\b`,
  String.raw`\b(?:khatam|khatm|band|end|finish|stop)\s+(?:karo|kar\s+do|karte\s+hain|kijiye|karna\s+hai|the\s+(?:lesson|class)|this\s+(?:lesson|class)|it|now|here|for\s+(?:today|now))\b`,
  String.raw`\b(?:lesson|class)\s+is\s+(?:over|done|finished)\b`,
  String.raw`\bi'?m\s+done\b|\bi\s+am\s+done\b|\bi'?m\s+finished\b|\bdone\s+for\s+today\b|\benough\s+for\s+today\b|\bno\s+more\b`,
  String.raw`\bi\s+(?:want|wanna|would\s+like)\s+to\s+stop\b|\bcan\s+we\s+stop\b|\blet'?s\s+stop\b|\bstop\s+for\s+today\b`,
  String.raw`\b(?:aur|ab)\s+nahi\s+padh(?:na|ni|unga|ungi|enge)\b|\bpadhna\s+nahi\s+hai\b|\bab\s+(?:band|bas)\s+karo\b|\baaj\s+ke\s+liye\s+bas\b|\bbaad\s+mein\s+karenge\b`,
  String.raw`\bmujhe\s+(?:lesson|class|padhai)?\s*(?:khatam|band|stop)\s+karna\s+hai\b`,
  String.raw`^(?:(?:yes|haan|ha|ok|okay|theek\s+hai)[\s,]+)?(?:stop|bas|band\s+karo|bas\s+karo|khatam|enough|done|bas\s+ho\s+gaya)$`,
  "बस\\s*करो|बंद\\s*करो|ख़?त्म\\s*करो",
].join("|"), "i");
const CONTINUE = /^(?:(?:no|nahi|nahin)[\s,]+)*(?:(?:let'?s|lets|chalo|ok(?:ay)?)\s+)?(?:keep\s+going|continue(?:\s+karte\s+hain|\s+karo|\s+please)?|carry\s+on|go\s+on|aage\s+(?:chalo|badho|karo|bado)|chalo\s+(?:padhte|aage|continue|shuru)\b.*|padhte\s+hain|nahi\s+rukna|don'?t\s+stop|continue\s+karte\s+hain|wapas\s+lesson|back\s+to\s+(?:the\s+)?lesson)\b/i;
const BREAK = /\b(?:(?:short|small|quick|chhota|thoda|ek)\s+break|break\s+(?:chahiye|lena|le\s+sakte|le\s+lu|le\s+loon|please|lete\s+hain)|take\s+a\s+(?:short\s+)?break|need\s+a\s+break|can\s+i\s+(?:take\s+a\s+)?(?:short\s+)?break|i'?m\s+tired|thak\s+(?:gaya|gayi|gyi|gya)|thoda\s+aaram|rest\s+(?:karna|chahiye|please))\b/i;
const CHANGE_TOPIC = /\b(?:something\s+else|kuch\s+aur\s+(?:baat|padh\w*|karte|batao|karo|sikha\w*|seekh\w*|sikh\w*)|kuch\s+(?:alag|dusra|doosra)|dusri\s+baat|doosri\s+baat|(?:change|badlo|badal\s+do)\s+(?:the\s+)?topic|topic\s+(?:change|badlo|badal\s+do)|(?:dusra|doosra|another|different|new)\s+topic|talk\s+about\s+(?:something|anything)|is\s+(?:ke|ki)\s+(?:alawa|alava|siva))\b/i;
const TOPIC = /\b(?:([\p{L}\p{N} ]{2,30}?)\s+(?:ke|ki)\s+(?:baare|bare)\s+(?:mein|me|main)\s+(?:baat\s+(?:karo|karte\s+hain|karein|kare)|batao|bataiye|sikhao)|(?:let'?s\s+)?(?:talk|tell\s+me)\s+about\s+([\p{L}\p{N} ]{2,30}))/iu;
const LANG = { hindi: /\b(?:hindi|हिंदी|हिन्दी)\b/i, english: /\b(?:english|angrezi|अंग्रेज़ी|इंग्लिश)\b/i, hinglish: /\bhinglish\b/i };
const LANG_REQ = /\b(?:hindi|english|angrezi|hinglish)\s+(?:me|mein|main|mai|में)\b|\b(?:in|speak|talk|explain\s+in|say\s+it\s+in)\s+(?:hindi|english|hinglish)\b|\b(?:hindi|english|hinglish)\s+(?:please|plz)\b|^(?:hindi|english|hinglish)$|(?:हिंदी|हिन्दी|अंग्रेज़ी|इंग्लिश)\s*में/i;
const ANOTHER = /\b(?:explain|samjhao|samjhaiye|batao|bataiye|sikhao)\s+(?:it\s+|this\s+|isko\s+|ise\s+|ye\s+|yeh\s+)?(?:differently|another\s+way|in\s+a\s+different\s+way|in\s+another\s+way|again\s+differently|simply|more\s+simply|easily)\b|\b(?:dusre|doosre|alag|aur|kisi\s+aur)\s+(?:tareeke|tarike|tarah|way)\s+(?:se)?\b|\b(?:aasan|asaan|simple|easy)\s+(?:karo|kar\s+do|bhasha|shabdon|words|mein\s+samjhao)\b|\bdifferent(?:ly)?\s+(?:way|explanation)\b|\bexplain\s+(?:it\s+)?again\b|\bphir\s+se\s+samjhao\b|\bek\s+baar\s+aur\s+samjhao\b/i;
const EXAMPLE = /\b(?:example|udaharan|udahran|misal)\s*(?:do|dijiye|de\s+do|dikhao|batao|bataiye|please|chahiye|give|with)?\b|\bgive\s+(?:me\s+)?an?\s+example\b|\bfor\s+example\??$|\bjaise\s+kya\b/i;
const STORY = /\b(?:story|kahani|kahaani)\s*(?:ki\s+tarah|jaisa|jaise|se|mein|me|sunao|batao|bana\s*ke|banake|form|wala|wali|please)?\b|\btell\s+(?:it\s+)?(?:as|like)\s+a\s+story\b/i;
// r5 QA D41: the Hindi ways-in chip "कहानी में बताओ" said aloud; the Devanagari form needs its "in a story" word (कहानी alone
// is a Hindi lesson's own subject, so the telling verb is required: "इस कहानी में राजा कौन है" is a question about it)
const STORY_HI = /(?<![\p{L}\p{M}])कहा(?:नी|नि)\s+(?:(?:की\s+तरह|जैसे|से|में|मे|बनाकर|बनाके)\s+)?(?:सुनाओ|बताओ|समझाओ|सुनाइए|बताइए|समझाइए)(?![\p{L}\p{M}])/u;
// 14.4 (main): a question word about THIS story ("is kahani mein raja kaun hai", "who is the king in this story") is a
// question about its content, not a request to be taught as a story
const STORY_Q_WORD = "(?:kaun|kon|kya|kahan|kahaan|kyun|kyon|kyu|kab|kaise|kitne|kitna|kitni|who|what|where|why|when|how|कौन|क्या|कहाँ|कहां|क्यों|कब|कैसे|कितने|कितना|कितनी)";
const STORY_THIS = "(?:is|iss|yeh|ye|yah|this|इस|यह|ये)\\s+(?:kahani|kahaani|story|कहानी)";
const STORY_QUESTION = new RegExp(`(?<![\\p{L}\\p{M}])${STORY_THIS}(?![\\p{L}\\p{M}]).*(?<![\\p{L}\\p{M}])${STORY_Q_WORD}(?![\\p{L}\\p{M}])|(?<![\\p{L}\\p{M}])${STORY_Q_WORD}(?![\\p{L}\\p{M}]).*(?<![\\p{L}\\p{M}])${STORY_THIS}(?![\\p{L}\\p{M}])`, "u");
const SLOWER = /\b(?:slow(?:ly)?(?:\s+please)?|slower|dheere(?:\s+(?:bolo|boliye|se|please|batao|bataiye))?|dhire(?:\s+(?:bolo|boliye|se))?|aaram\s+se\s+(?:bolo|batao|samjhao)|too\s+fast|bahut\s+(?:tez|fast|jaldi)|itna\s+(?:tez|fast|jaldi)|jaldi\s+mat|ruk\s+ruk\s+ke|step\s+by\s+step)\b/i;
const VISUAL = /\b(?:(?:show|draw|make)\s+(?:me\s+)?(?:a\s+|the\s+|it\s+|this\s+)?(?:diagram|picture|drawing|image|figure|graph|chart|model|it|this)|(?:diagram|picture|photo|image|drawing|chitra|tasveer|figure)\s+(?:dikhao|dikhaiye|banao|banaiye|bana\s+do|draw|show|please|chahiye|se\s+samjhao)|(?:draw|bana(?:\s+ke|kar)?)\s+(?:karke\s+)?(?:samjhao|dikhao|batao)|draw\s+(?:it|this|karo|kijiye)|whiteboard\s+(?:pe|par|per|mein|me|on)|(?:on|use)\s+the\s+(?:whiteboard|board)|board\s+(?:pe|par|per)\s+(?:bana|likh|dikha)\w*|can\s+you\s+(?:show|draw)|dikha\s+(?:ke|kar)\s+samjhao|dikhao\s+na)\b/i;
// round 5 (QA D07, "मुझे एक गेम खेलना है" read as nothing): the Devanagari forms too (\b does not bound Devanagari)
// census 14.5 (F1c): a game is ASKED for ("game khelein?", "khelna hai", "play a game"); "khel" / "खेल" inside an answer
// ("bacche khel rahe the", "खेल का मैदान") is not a request. A bare "game" / "गेम" as the whole turn still is.
const GAME = /\b(?:game|games|khel|activity)\s+(?:khelna|khelni|khelte|khelo|khelen|khelein|khele|khelenge|khel\s+sakte|chahiye|dikhao|karo|karna|karein|karen|karte|please)\b|\b(?:khelna|khelni)\s+(?:hai|h|chahta|chahti|chahiye)\b|\bkhel(?:en|ein|e|enge)\s*\?|\blet'?s\s+play\b|\bplay\s+a\s+game\b|\bcan\s+we\s+play\b|^(?:ek\s+|koi\s+)?(?:game|games|activity)\s*(?:please|plz)?\s*\??$|(?<![\p{L}\p{M}])(?:गेम|खेल)\s+(?:खेलें|खेले|खेलना|खेलते|खेलो|खेलेंगे|चाहिए|करें)(?![\p{L}\p{M}])|(?<![\p{L}\p{M}])खेल(?:ें|े|ेंगे)\s*\?|^(?:कोई\s+|एक\s+)?गेम\s*\??$/iu;
// round 4 (stream 4A, session-first (f)): the "go deeper" family beside "simpler": "aur batao", "tell me more", "go deeper",
// "detail mein samjhao", "isme aur kya hota hai". The same idea one layer further (the why behind it, where it shows up, how it
// links to what comes next), never a new skill and never "say it again". A harder QUESTION ("mushkil wala do", "too easy")
// stays conversation/lexicon.js HARDER.
const DEEPER = /\b(?:aur\s+(?:batao|bataiye|bataao|samjhao|samjhaiye|sunao|jaanna\s+hai|janna\s+hai|detail|details|gehra[ie]?|andar\s+tak)|(?:aur\s+)?detail\s+(?:mein|me|main|se)(?:\s+(?:batao|bataiye|samjhao|samjhaiye|explain))?|(?:tell|teach|show)\s+me\s+more|more\s+(?:about\s+(?:it|this|that)|details?|on\s+(?:this|that|it))|(?:go|dig|let'?s\s+go)\s+deeper|deeper|in\s+depth|explain\s+(?:it\s+|this\s+)?(?:more|further|in\s+detail)|(?:isme|ismein|is\s+mein|iske\s+baare\s+mein)\s+aur\s+(?:kya|kuch)|gehrai\s+(?:se|mein)|aage\s+ka\s+(?:batao|samjhao)|next\s+level)\b|और\s+(?:बताओ|बताइए|समझाओ)|विस्तार\s+से/i;
// round 3 forge (patch 08): "simulation dikhao" / "simulate karo" is an interactive ask too; before, no pattern matched it and
// only the model classifier's flag sometimes made it one (2 of 5 forge acceptance runs read it as a plain worked example)
const ANIMATION = /\b(?:animation|animate|video(?!\s*games?\b)|cartoon|simulation|simulate|simulator)\s*(?:dikhao|dikhaiye|chahiye|please|banao|show|karo|kijiye)?\b|\bshow\s+(?:me\s+)?(?:an?\s+)?(?:animation|video|simulation)\b/i;

// round 3 fix (experience B8): "sir mujhe ab yeh nahi padhna, photosynthesis padhna hai" (I don't want this, I want to study
// photosynthesis) got the STOP check-in (keep going / break / stop), with no way to the thing they asked for. A named
// subject to study instead is a SWITCH request, read before the stop words: the Director offers that topic (when the
// child's class has it) or says where to find it, never a stop question. No subject named ("yeh nahi padhna") stays a stop.
const SW_NOT = String.raw`(?:(?:mujhe|muje|hume|humein|main|mai)\s+)?(?:ab\s+)?(?:yeh|ye|is(?:e|ko)?|this|aaj\s+yeh)\s+(?:wala\s+)?(?:nahi|nahin|nhi|not|na)\s+(?:padhna|padhni|seekhna|sikhna|karna|krna|do|study|learn)(?:\s+(?:hai|h|chahta|chahti|want))?`;
const SW_WANT = String.raw`(?:(?:mujhe|muje|hume|humein|main|mai)\s+)?([\p{L}][\p{L} ]{2,30}?)\s+(?:padhna|padhni|seekhna|sikhna|samajhna)\s+(?:hai|h|chahta\s+(?:hoon|hu|hun)|chahti\s+(?:hoon|hu|hun)|chahiye)`;
const SWITCH_HL = new RegExp(String.raw`^(?:${SW_NOT}[\s,;.]+(?:balki\s+|bas\s+)?)?${SW_WANT}[\s.!?]*$`, "iu");
const SWITCH_EN = /^(?:(?:no|nah|not this)[\s,]+)?(?:can\s+we|could\s+we|let'?s|i\s+want\s+to|i'?d\s+like\s+to|i\s+wanna)\s+(?:do|learn|study|start)\s+([\p{L}][\p{L} ]{2,30}?)(?:\s+instead|\s+now|\s+please)*[\s.!?]*$/iu;
const SW_STOPWORDS = /^(?:yeh|ye|is|isko|ise|this|it|that|aur|more|kuch|abhi|aage|nahi|lesson|class|padhai|maths|math|science|homework|game|games|ek|do|mujhe|muje|hume|humein|main|mai|ab|aaj|bhi|wala|wali|dusra|doosra)$/i;
/** PURE. The subject a child asks to study INSTEAD, or null. */
export function switchSubjectOf(text) {
  const r = switchSubjectOfLine(text);
  return r || !DEVA.test(String(text ?? "")) ? r : switchSubjectOfLine(romanLine(text));
}
function switchSubjectOfLine(text) {
  const t = core(T(text)) || T(text);
  const m = t.match(SWITCH_HL) ?? t.match(SWITCH_EN);
  const subject = (m?.[1] ?? "").replace(/^(?:the|a|an|ab|aaj)\s+/i, "").trim();
  if (!subject || SW_STOPWORDS.test(subject) || subject.split(/\s+/).every((w) => SW_STOPWORDS.test(w))) return null;
  // a way of doing today's work is not another subject ("can we do a simulation", "let's do a quiz", "game karna hai")
  if (/(?<![\p{L}])(?:simulation|simulations|animation|animations|video|videos|game|games|khel|picture|pictures|diagram|drawing|activity|quiz|test|break|story|kahani|example|examples|practice|revision|homework|question|questions|sawaal|sawal|something|anything|kuch)(?![\p{L}])/iu.test(subject)) return null;
  return subject.slice(0, 30);
}

/** Words of an attempt: a number, or more words than a request carries. An attempt is graded; its request is ignored. */
const attemptLike = (t) => /\d/.test(t) || /\b\d+\s*\/\s*\d+\b/.test(t);
const wordCount = (t) => t.split(/\s+/).filter(Boolean).length;

/**
 * PURE. The request a child's turn makes, or null.
 * @param {string} text  the child's words (typed, or an ASR transcript)
 * @returns {null | { type: "goodbye"|"stop"|"continue"|"break"|"change_topic"|"topic"|"language"|"another"|"example"|"story"|"slower"|"deeper"|"visual",
 *   subject?: string, lang?: "hindi"|"english"|"hinglish", kind?: "diagram"|"game"|"animation", whole: boolean }}
 *   whole: the turn is ONLY the request (no attempt alongside it), so it may be acted on with no classifier call.
 */
// r12 RCA failure 4 (owner lesson a95d2ff1 turn 12: "थोड़ा बैकग्राउंड क्लियर करो … recursive rules जो कचरा आ रहा है, हटाओ
// उसको", answered "background noise main control nahi kar sakti"): clearing the board is a request of its own. The surface
// word (board / screen / background / whiteboard / what is written on it) near a clear verb, either order, both scripts.
const SURFACE = "(?:board|whiteboard|white\\s+board|screen|background|backgound|bekgraund|बोर्ड|व्हाइटबोर्ड|स्क्रीन|बैकग्राउंड|बैकग्राऊंड)";
// release 13 integration (ms-r13-clear-board-adjective): "saaf" / "clear" / "khali" are also ADJECTIVES ("screen saaf nahi
// dikh raha" = I can't see it clearly, "board khali hai", "the screen is not clear"), and the first cut read 12 of 13 such
// lines as "clear the board". They are a command only with a do-verb after them (karo, kar do, kijiye, kar sakti ho);
// hatao / mitao / erase / wipe are commands on their own. A negation before the verb ("board mat hatao") and a gap about
// sound ("background noise hatao": the microphone, not the board) are never a clear.
const DO = "(?:karo|kardo|kariye|karein|kijiye|kijie|kar\\s+(?:do|dijiye|dijie|dena|doge|dogi|denge|lo|lijiye|sakti|sakte|sakta)|करो|कर\\s+दो|कर\\s+दीजिए|करिए|कीजिए|कर\\s+सकती|कर\\s+सकते)";
const CLEAR_VERB = `(?:(?:clear|saaf|saf|khali|khaali|क्लियर|साफ़|साफ|खाली)\\s+${DO}|hatao|hata\\s+do|hatado|hata\\s+dijiye|hataiye|mitao|mita\\s+do|mitado|mita\\s+dijiye|mitaiye|erase|wipe|हटाओ|हटा\\s+दो|हटाइए|हटा\\s+दीजिए|मिटाओ|मिटा\\s+दो|मिटाइए|मिटा\\s+दीजिए)`;
const CLEAR_NEG = /(?:^|\s)(?:mat|nahi|nahin|nhi|na|naa|don'?t|dont|not|never|मत|नहीं|ना)(?=\s|[,.!?।]|$)/iu;
const CLEAR_NOISE = /noise|awaa?z|aawaa?z|shor|sound|\bmic\b|आवाज़?|शोर/iu;
const CLEAR_SURFACE_FIRST = new RegExp(`${SURFACE}((?:\\s+\\S+){0,5}?)\\s+${CLEAR_VERB}`, "giu");
const CLEAR_VERB_FIRST = new RegExp(`${CLEAR_VERB}((?:\\s+\\S+){0,3}?)\\s+${SURFACE}`, "giu");
const CLEAR_KACHRA = new RegExp(`(?:kachra|कचरा)((?:\\s+\\S+){0,6}?)\\s+${CLEAR_VERB}`, "giu");
const CLEAR_EN = new RegExp(`(?:^|[,.!?।]\\s*|\\b(?:please|plz|pls|can\\s+you|could\\s+you|will\\s+you|ma'?am|didi|sir|bhaiya|now|just|ok|okay)\\s+)(?:clear|erase|wipe|clean)\\s+(?:up\\s+|off\\s+)?(?:the\\s+|this\\s+|that\\s+|my\\s+|your\\s+)?(?:whole\\s+)?${SURFACE}`, "iu");
/** "board clear karo", "ye board hatao", "थोड़ा बैकग्राउंड क्लियर करो", "jo kachra aa raha hai hatao", "clear the board": the
 * child asks for the board to be cleared. Never "screen saaf nahi dikh raha", "board khali hai", "board mat hatao". PURE. */
export function clearBoardAsk(text) {
  const t = String(text ?? "");
  const before = (i) => t.slice(0, i).trim().split(/\s+/).pop() ?? "";
  for (const re of [CLEAR_SURFACE_FIRST, CLEAR_KACHRA]) {
    for (const m of t.matchAll(re)) if (!CLEAR_NEG.test(m[1] ?? "") && !CLEAR_NOISE.test(m[1] ?? "")) return true;
  }
  for (const m of t.matchAll(CLEAR_VERB_FIRST)) if (!CLEAR_NEG.test(` ${before(m.index)} `) && !CLEAR_NOISE.test(m[1] ?? "")) return true;
  // round 5 (QA D09: "बोर्ड साफ करो" heard as "साफ करो।" drew a NEW board): a bare clear command as the whole turn ("saaf
  // karo", "clear karo", "sab mita do", "इसे हटाओ") is about the board, the one thing on the stage it can mean
  if (BARE_CLEAR.test(t.trim())) return true;
  return CLEAR_EN.test(t);
}
const BARE_CLEAR = new RegExp(`^(?:(?:please|plz|ab|abhi|jaldi|isko|ise|ye|yeh|woh|sab|sara|saara|poora|pura|इसे|इसको|ये|यह|सब|सारा|पूरा)\\s+){0,2}(?:${CLEAR_VERB})(?:\\s+(?:please|plz|na|na\\s+please))?[\\s.!।]*$`, "iu");

// r12 RCA failure 3 / release 13 (A) (owner lesson a95d2ff1 turns 18-24: "मेरे को आलू के बारे में पढ़ना है", "आलू दिखाओ"): the
// subject a child names, in either script, so the lesson can answer honestly about it. Generic words are not subjects.
// release 13 integration (ms-r13-meta-subjects): the meta and pointing words a child uses for TODAY's work ('is cheez', 'pichle
// wale', 'aaj ke topic') are never a subject named outside it
const GENERIC = /^(?:ek|एक|zara|jara|ज़रा|जरा|thoda|thodi|थोड़ा|थोड़ी|diagram|picture|photo|image|images|drawing|game|games|video|kuch|koi|kuchh|ye|yeh|is|isko|use|usko|woh|wo|iss|us|uss|iske|uske|inke|unke|isme|usme|ismein|usmein|cheez|chiz|cheej|chij|pichle|pichla|pichli|pichhle|agle|agla|agli|wale|wala|wali|waala|waale|topic|chapter|lesson|sawal|sawaal|question|questions|answer|jawab|concept|aaj|abhi|mujhe|mere|mera|aap|tum|visualization|visualisation|chitra|tasveer|board|screen|whiteboard|blackboard|smartboard|slate|व्हाइटबोर्ड|ब्लैकबोर्ड|बोर्ड|स्क्रीन|chart|graph|model|animation|figure|sketch|map|table|ko|ka|ki|ke|ne|se|mein|me|par|pe|डायग्राम|डायग्रम|ड्रॉइंग|ड्राइंग|चित्र|ग्राफ|चार्ट|मॉडल|एनिमेशन|टेबल|को|का|की|के|ने|से|में|पर|इमेज|फोटो|पिक्चर|तस्वीर|गेम|वीडियो|कुछ|कोई|ये|यह|इसको|उसको|उसके|इसके|इसकी|उसकी|चीज़|चीज|पिछले|पिछला|अगले|अगला|वाले|वाला|वाली|सवाल|जवाब|टॉपिक|चैप्टर|आज|अभी|मुझे|मेरे|मेरा|आप|तुम)$/iu;
/** A subject made only of generic, meta or pointing words ("is cheez", "aaj ke topic"): not a subject. PURE. */
export const genericSubject = (sub) => { const w = String(sub ?? "").trim().split(/\s+/).filter(Boolean); return !w.length || w.every((x) => GENERIC.test(x)); };
const LEAD_WORDS = /^(?:(?:mere|mujhe|hume|humein|hamein|ko|ka|ki|ek|mera|meri|please|plz|bhai|bhaiya|yaar|didi|मेरे|मुझे|हमें|को|का|की|एक|मेरा|मेरी|भई|यार)\s+)+/iu;
const STUDY_SUBJECT = /([\p{L}\p{M}\p{N} ]{2,40}?)\s+(?:ke|ki|के|की)\s+(?:baare|bare|बारे)\s+(?:mein|me|main|में)\s+(?:padh|पढ़|baat|बात|bata|बता|sikh|सीख|jaan|जान|dekh|देख)/u;
const SHOW_SUBJECT = /(?:^|[\s,.!?।])([\p{L}\p{M}]{2,20})\s+(?:(?:ki|ka|ke|की|का|के)\s+)?(?:(?:photo|picture|image|tasveer|फोटो|पिक्चर|इमेज|तस्वीर)\s+)?(?:dikhao|dikhaiye|dikha\s+do|दिखाओ|दिखाइए|दिखा\s+दो)/u;
const lastWords = (x, n = 2) => x.trim().split(/\s+/).slice(-n).join(" ");
/** The free subject a child's turn names ("aloo ke baare mein padhna hai", "आलू दिखाओ"), or null. PURE. */
export function freeSubjectOf(text) {
  const t = String(text ?? "").normalize("NFKC");
  for (const re of [STUDY_SUBJECT, SHOW_SUBJECT]) {
    const m = t.match(re);
    if (!m) continue;
    const sub = lastWords(m[1].replace(LEAD_WORDS, "").trim(), re === STUDY_SUBJECT ? 2 : 1).replace(LEAD_WORDS, "").trim();
    if (sub && !GENERIC.test(sub) && !sub.split(/\s+/).every((w) => GENERIC.test(w))) return sub.slice(0, 30);
  }
  return null;
}

// round 5 (stream 2, the board): WHAT the child asked to see rides on the ask, so the board can draw it (r12 RCA failure 1:
// 7 of 10 pages of the owner's lesson a95d2ff1 were one cached table whatever was asked). The asks heard there and in the
// round-5 brief: "aloo dikhao", "photo dikhao", "isko draw karo", "number line pe dikhao", "X ka diagram banao",
// "chidiya ki chonch ki photo dikhao". `show` is how (a picture, a number line, a drawing, or a bare "X dikhao"),
// `subject` the thing named (never a pointing or meta word), `said` the numbers named for a number line.
const NUMLINE = /\bnumber\s*-?\s*line\b|\bnumberline\b|\bsankhya\s+rekha\b|संख्या\s*रेखा|नंबर\s*लाइन/iu;
const PIC_WORD = "(?:photo|photos|foto|picture|pictures|pic|image|images|tasveer|tasvir|tasveeren|chitra|फोटो|पिक्चर|तस्वीर|इमेज|चित्र)";
const DRAW_WORD = "(?:diagram|drawing|sketch|डायग्राम|ड्राइंग)";
const SHOW_VERB = "(?:dikhao|dikhaao|dikhaiye|dikhayiye|dikha\\s+do|dikha\\s+dijiye|dikhana|dikha\\s+sakti|dikha\\s+sakte|show(?:\\s+me)?|दिखाओ|दिखाइए|दिखा\\s+दो|दिखा\\s+दीजिए)";
// (census 14.5: a bare "bana" is make / cook — "khana bana sakte hain?" — never a drawing; a draw form only)
const DRAW_VERB = "(?:draw|bana(?:o|iye|ao|\\s+do|\\s+dijiye|\\s+ke|\\s+kar|kar|ke)|sketch|बनाओ|बनाइए|बना\\s+दो|ड्रा)";
const PIC_RE = new RegExp(`(?<![\\p{L}])${PIC_WORD}(?![\\p{L}])`, "iu");
const DRAW_RE = new RegExp(`(?<![\\p{L}])(?:${DRAW_VERB}|${DRAW_WORD})(?![\\p{L}])`, "iu");
const SHOW_RE = new RegExp(`(?<![\\p{L}])${SHOW_VERB}(?![\\p{L}])`, "iu");
// the words before the first show/draw word (or "ka photo"/"ka diagram"), at most 4: the thing asked for
const ASK_HEAD = new RegExp(`^(.*?)\\s+(?:(?:ka|ki|ke|का|की|के)\\s+)?(?:(?:${PIC_WORD}|${DRAW_WORD})\\s+)?(?:(?:${DRAW_VERB})(?:\\s+(?:karke|kar\\s+ke|karo|kijiye|kar\\s+do))?\\s+)?(?:${SHOW_VERB}|${DRAW_VERB}|${PIC_WORD}|${DRAW_WORD})(?![\\p{L}])`, "iu");
const ASK_STOP = /^(?:एक|इसकी|इसका|इसके|इसे|इसको|उसकी|उसका|उसके|यह|ये|वो|वह|मुझे|मेरे|कोई|ज़रा|जरा|थोड़ा|ज़रा|अब|फिर|और|kaise|kaisa|kya|kyun|kyon|kab|kahan|how|what|why|where|which|mujhe|muje|hume|humein|mere|iska|iski|iske|isko|ise|uska|uski|uske|usko|lekin|magar|but|bar|baar|please|plz|zara|jara|thoda|ek|aap|tum|didi|bhaiya|sir|ma'?am|teacher|ab|abhi|phir|fir|dobara|wapas|again|now|na|naa|yaar|bhi|bas|sirf|sab|sabhi|to|toh|so|ok|okay|achha|accha|haan|ji|draw|bana|banao|karke|kar|ke|se|me|mein|pe|par|on|in|of|the|a|an|me)$/iu;
const VERBISH = /^(?:hai|hain|ho|hoon|hun|hu|tha|thi|the|hoga|hogi|aata|aati|aate|jata|jati|jate|raha|rahi|rahe|kar|karo|karna|karte|karta|karti|kiya|kiye|diya|diye|liya|lena|dena|chahiye|chahta|chahti|sakta|sakti|sakte|lagta|lagti|pata|mila|mili|dekha|dekhi|bolo|batao|suna|is|are|was|were|am|want|wanna|like|need|have|has|can|could|show|see|है|हैं|था|थी|हो|आता|आती|जाता|रहा|रही|करो|करना|चाहिए|चाहता|चाहती|सकता|सकती|देखा|बताओ)$/iu;
const SHOW_NOT_SUBJECT = /^(?:answer|jawab|score|result|marks|next|agla|aage|phir|fir|dobara|wapas|again|sab|sabhi|all|more|aur|baaki|baki|naya|new|number|numbers|sawal|sawaal|question|questions|example|examples|udaharan|game|games|khel|video|videos|animation|step|steps|tarika|tareeka|way|method|hint|hints)$/iu;
/** The numbers a child names for a number line ("1 se 9", "23 plus 14", "1/4", "minus 3", "0.5"). PURE. */
const numbersSaid = (t) => {
  const s = String(t ?? "").replace(/\bminus\s+(?=\d)/gi, "-").replace(/\bplus\b/gi, "+");
  return [...s.matchAll(/-?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?/g)].map((m) => m[0].replace(/\s+/g, "")).slice(0, 6);
};
/**
 * PURE. What a child's turn asks to SEE, or null: { show: "number_line" | "picture" | "draw" | "show", subject?, said? }.
 * "aloo dikhao" → { show: "show", subject: "aloo" }; "sikke ki photo dikhao" → { show: "picture", subject: "sikke" };
 * "number line pe 1/4 dikhao" → { show: "number_line", said: ["1/4"] }; "isko draw karo" → { show: "draw" } (no subject:
 * the thing on the table); "ek example do", "game khelna hai", "answer dikhao" → null (not a thing to see).
 */
export function visualAskOf(text) {
  const raw = String(text ?? "").normalize("NFKC");
  const t = T(raw);
  if (!t) return null;
  const numberLine = NUMLINE.test(t);
  const pic = PIC_RE.test(t), draw = DRAW_RE.test(t), show = SHOW_RE.test(t);
  if (!numberLine && !pic && !draw && !show) return null;
  if (numberLine) { const said = numbersSaid(t); return { show: "number_line", ...(said.length ? { said } : {}) }; }
  // English: "a picture of a potato", "draw a triangle", "show me the moon"
  const en = core(t).match(/\b(?:picture|photo|image|drawing|diagram|sketch)\s+of\s+(?:a|an|the|some)?\s*([\p{L} ]{2,40}?)\s*(?:please|plz|na)?[?.!]*$/iu)
    ?? core(t).match(/^(?:can\s+you\s+|please\s+)?(?:draw|show)\s+(?:me\s+)?(?:a|an|the|some)\s+([\p{L} ]{2,40}?)\s*(?:please|plz)?[?.!]*$/iu);
  const m = en ? [null, en[1]] : core(t).match(ASK_HEAD);
  let words = (m?.[1] ?? "").replace(/[?!.,;:"“”'()]/g, " ").split(/\s+/).filter(Boolean);
  // cut at a question word ("shadow kaise banta hai draw karke dikhao" asks for a shadow), then drop lead/filler words; a
  // question word first ("kaise karte hain dikhao") names no thing
  const qi = words.findIndex((w) => /^(?:kaise|kaisa|kyun|kyon|kab|kahan|how|why|when|where)$/i.test(w));
  if (qi >= 0) words = words.slice(0, qi);
  while (words.length && (ASK_STOP.test(words[0]) || GENERIC.test(words[0]))) words.shift();
  while (words.length && (ASK_STOP.test(words.at(-1)) || /^(?:ka|ki|ke|का|की|के|ko|को)$/iu.test(words.at(-1)))) words.pop();
  // sim lab p50 ("… aata hai thoda maggi dikhao" drew the child's own words "aata hai thoda maggi" on the board): the thing
  // is what comes after the last verb / helper word, never the clause before it
  const isVerb = (w) => VERBISH.test(w) || /^(?:dekhna|dekhni|dekhne|janna|jaanna|padhna|samajhna|देखना|जानना)$/iu.test(w);
  const vi = words.map(isVerb).lastIndexOf(true);
  // "… hathi dekhna hai dikhao": nothing after the verbs, the thing is before the first one
  if (vi >= 0) words = vi + 1 < words.length ? words.slice(vi + 1) : words.slice(0, Math.max(0, words.findIndex(isVerb)));
  while (words.length && (ASK_STOP.test(words[0]) || GENERIC.test(words[0]))) words.shift();
  // round 5 merge (main): where it is drawn is never part of what is drawn ("aloo whiteboard pe draw karo" → aloo)
  words = words.filter((w) => !/^(?:whiteboard|blackboard|smartboard|board|screen|slate|व्हाइटबोर्ड|ब्लैकबोर्ड|बोर्ड|स्क्रीन)$/iu.test(w));
  while (words.length && (ASK_STOP.test(words.at(-1)) || /^(?:ka|ki|ke|का|की|के|ko|को|pe|par|पे|पर)$/iu.test(words.at(-1)))) words.pop();
  words = words.slice(-4);
  const subject0 = words.join(" ").trim();
  const subject = subject0 && !genericSubject(subject0) && !words.every((w) => GENERIC.test(w) || ASK_STOP.test(w)) && !(words.length === 1 && SHOW_NOT_SUBJECT.test(words[0])) && !/\d/.test(subject0) ? subject0.slice(0, 40) : null;
  const kind = pic ? "picture" : draw ? "draw" : "show";
  // a bare "X dikhao" is a visual ask only when X is a thing ("aloo dikhao"), never "answer dikhao" / "phir se dikhao"
  if (kind === "show" && !subject) return null;
  return { show: kind, ...(subject ? { subject } : {}) };
}

// census 14.5 (F1a): the request patterns are Roman; a Devanagari ASR line ("कुछ और पढ़ते हैं", "पिक्चर दिखाओ ना") matched
// none of them. A line with Devanagari that reads as nothing is read again in Roman letters (safety/normalize.js
// devaToRoman, the Hindi schwa rule), English loanwords the recogniser writes in Devanagari mapped to their English word.
const DEVA = /[\u0900-\u097F]/;
const LOAN = { "टॉपिक": "topic", "टोपिक": "topic", "पिक्चर": "picture", "पिक्चरें": "pictures", "फोटो": "photo", "फ़ोटो": "photo", "इमेज": "image",
  "ड्रॉइंग": "drawing", "ड्राइंग": "drawing", "डायग्राम": "diagram", "गेम": "game", "गेम्स": "games", "वीडियो": "video", "एनिमेशन": "animation",
  "सिमुलेशन": "simulation", "एक्टिविटी": "activity", "क्विज़": "quiz", "क्विज": "quiz", "स्टोरी": "story", "एग्जांपल": "example", "एग्ज़ाम्पल": "example",
  "एग्जाम्पल": "example", "बोर्ड": "board", "स्क्रीन": "screen", "व्हाइटबोर्ड": "whiteboard", "चार्ट": "chart", "ग्राफ": "graph", "ग्राफ़": "graph",
  "सब्जेक्ट": "subject", "चैप्टर": "chapter", "लेसन": "lesson", "क्लास": "class", "प्लीज": "please", "प्लीज़": "please", "ब्रेक": "break" };
const ROMAN_FIX = { men: "mein", mein: "mein", hain: "hain", nahin: "nahi", vishay: "topic" };
/** A line's Devanagari words in Roman letters (Latin words untouched). PURE. */
export function romanLine(text) {
  return String(text ?? "").normalize("NFC").replace(/[\u0900-\u097F]+/g, (w) => { const r = LOAN[w] ?? devaToRoman(w); return ROMAN_FIX[r] ?? r; }).replace(/[।॥]/g, ".");
}

/** PURE. The request a child's turn makes, or null (a Devanagari line that reads as nothing is read again in Roman). */
export function requestOf(text) {
  const r = requestOfLine(text);
  if (r || !DEVA.test(String(text ?? ""))) return r;
  // (the Roman reading when the whole turn is the request, or an explicit show / draw ask or a topic ask inside a longer
  // line; a line about the board inside an answer is not one)
  const rr = requestOfLine(romanLine(text));
  // (never a story: Devanagari has its own, stricter story form, STORY_HI, that needs the telling verb)
  return rr && rr.type !== "story" && (rr.whole || rr.see || ["switch", "topic", "change_topic"].includes(rr.type)) ? rr : null;
}

function requestOfLine(text) {
  const raw = T(text);
  if (!raw) return null;
  // round 3 fix (adversarial B4): a sexual-content ask is never one of these requests ("nangi video dekhti ho?" was a
  // visual / animation ask, and in round 3 a live-built game); classify.js declines it in code
  if (sexualAsk(raw)) return null;
  const t = core(raw) || raw;
  const n = wordCount(t);
  const whole = !attemptLike(t) && n <= 12;
  // the board is a surface, not an answer: clearing it is honoured at any length, never inside a numeric attempt
  // (never ahead of a goodbye or a stop: leaving always wins)
  if (!attemptLike(t) && clearBoardAsk(t) && !GOODBYE.test(t) && !STOP.test(t) && stopKind(text) !== "end_request") return { type: "clear_board", whole: true };   // a command to the screen, never an answer: acted on at any length
  // release 13 (A): "X ke baare mein padhna hai" names a subject at any length (a long, upset turn is still that ask)
  if (!attemptLike(t) && !GOODBYE.test(t) && !STOP.test(t) && STUDY_SUBJECT.test(String(text ?? "").normalize("NFKC"))) {
    const subject = freeSubjectOf(text);
    if (subject) return { type: "topic", subject, whole };
  }
  // a turn of mostly answer words with a request tacked on is an answer (the request is ignored, the answer graded)
  if (!whole && n > 16) return null;
  // Leaving now beats everything (NEVER MANIPULATE): never read as a stop to check in on, nor a break.
  if (GOODBYE.test(t) && !SHORT_BREAK.test(t)) return { type: "goodbye", whole };
  if (SHORT_BREAK.test(t) && /\b(?:jaana|jana|jau|jaun|go|break|peena|pina|drink|chahiye)\b/.test(t) && !attemptLike(t)) return { type: "break", whole };
  // round 4 (battery multi_intent-08 "thak gaya hoon, kya thoda easy kar sakte ho?" got a break): tired AND an easier ask is
  // the easier ask (conversation/lexicon.js reads it; the tiredness rides along as the second need), never a break
  if (BREAK.test(t) && !/\b(?:easy|aasan|asaan|simple)\s+(?:kar|karo|karke|kijiye|bana|banao)\b|\bmake\s+it\s+(?:easier|simpler)\b/.test(t)) return { type: "break", whole };
  if (CHANGE_TOPIC.test(t)) return { type: "change_topic", whole };
  // round 3 fix (experience B8): a named subject to study instead (before the stop words it may carry: "yeh nahi padhna")
  const switchTo = !attemptLike(t) ? switchSubjectOf(t) : null;
  if (switchTo) return { type: "switch", subject: switchTo, whole };
  // round 2 safety floor: the relational lexicon's anchored end_request reading too (en / hl / Devanagari; safety.js
  // wantsToStop reads the same), so "bas, aaj ke liye itna hi" is a stop in code with no model (stop-drill 4/8 → 8/8)
  if (STOP.test(t) || stopKind(text) === "end_request") return { type: "stop", whole };
  if (CONTINUE.test(t)) return { type: "continue", whole };
  if (LANG_REQ.test(t)) {
    const lang = LANG.hinglish.test(t) ? "hinglish" : LANG.english.test(t) ? "english" : LANG.hindi.test(t) ? "hindi" : null;
    if (lang) return { type: "language", lang, whole };
  }
  // round 5 (stream 2): what the child asked to see (visualAskOf) rides on the request; "aloo dikhao" and "number line pe
  // 1/4 dikhao" were not requests at all before (a bare "X dikhao", a number line with numbers in it)
  const seeAsk = n <= 12 && !GAME.test(t) && !ANIMATION.test(t) && !EXAMPLE.test(t) ? visualAskOf(text) : null;
  if (VISUAL.test(t) || (whole && /^(?:diagram|picture|drawing|draw)\b/.test(t)) || (seeAsk && (seeAsk.show === "number_line" || seeAsk.subject || seeAsk.show !== "show"))) {
    // the ask's own subject when it names one; no fall back to freeSubjectOf for a see-ask ("diagram bana ke dikhao" is not "bana")
    const subject = seeAsk ? seeAsk.subject : freeSubjectOf(text);
    return { type: "visual", kind: "diagram", whole: whole || !!seeAsk, ...(subject ? { subject } : {}), ...(seeAsk ? { see: seeAsk } : {}) };
  }
  if (whole && ANIMATION.test(t)) return { type: "visual", kind: "animation", whole };
  if (whole && GAME.test(t) && !/\b(?:game\s+(?:mein|me)\s+\d)/.test(t)) return { type: "visual", kind: "game", whole };
  if (whole && (STORY.test(t) || STORY_HI.test(t)) && !STORY_QUESTION.test(t)) return { type: "story", whole };
  if (whole && EXAMPLE.test(t)) return { type: "example", whole };
  if (whole && (DEEPER.test(t) || DEEPER.test(raw))) return { type: "deeper", whole };
  if (whole && SLOWER.test(t)) return { type: "slower", whole };
  if (whole && ANOTHER.test(t)) return { type: "another", whole };
  if (whole) {
    const m = t.match(TOPIC);
    const subject = (m?.[1] ?? m?.[2] ?? "").replace(/^(?:the|a|an|is|us|mujhe|humein|hume)\s+/i, "").trim();
    if (subject && !/^(?:this|it|that|yeh|ye|is|isko|lesson|question|sawal|sawaal)$/.test(subject) && !genericSubject(subject)) return { type: "topic", subject: subject.slice(0, 30), whole };
  }
  return null;
}

/** The request types that are about the lesson's flow (never acted on without the classifier's distress read too). */
export const FLOW_REQUESTS = new Set(["goodbye", "stop"]);
/** The request types that map onto the Director's existing help moves (state.js helpMove; until now reachable only by a chip). */
export const HELP_OF_REQUEST = Object.freeze({ another: "another", example: "example", story: "story", slower: "slower", deeper: "deeper" });
