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

const T = (s) => String(s ?? "").toLowerCase().normalize("NFKC").replace(/[’`]/g, "'").replace(/\s+/g, " ").trim();
/** Strip the leading politeness and fillers a child wraps a request in ("ok", "please", "didi", "ma'am"). */
const core = (t) => t.replace(/^(?:(?:ok(?:ay)?|achha|accha|acha|hmm+|haan|ha|ji|please|plz|pls|arre|arey|yaar|didi|bhaiya|ma'?am|sir|teacher|miss|umm+|uh+|so|and|aur|but|par|lekin|nahi|no|wait|ruko)[\s,!.]+)+/i, "")
  .replace(/[\s,!.]*(?:please|plz|pls|na|naa|yaar|ji|didi|bhaiya|ma'?am|sir)?[\s.!?]*$/i, "").trim();

/** A real goodbye: the child is leaving now. Mirrors safety.js wantsToStop's leave-now forms (kept in step by the test). */
const GOODBYE = /\b(?:bye|bye[\s-]*bye|good\s*night|tata|alvida|see\s+you|mujhe\s+ja(?:a)?na\s+(?:hai|padega|h)|main\s+ja\s+(?:raha|rahi)\s+(?:hoon|hu)|i\s+(?:have|need|gotta|got)\s+to\s+(?:go|leave)|i\s+(?:want|wanna)\s+to\s+leave|i'?m\s+leaving|i\s+am\s+leaving|mummy\s+bula\s+rahi\s+(?:hai|h)\s*,?\s*(?:bye|jaana))\b|अलविदा|मुझे\s*जाना\s*है|बाय/i;
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
const CHANGE_TOPIC = /\b(?:something\s+else|kuch\s+aur\s+(?:baat|padh|karte|batao|karo|sikha)|kuch\s+(?:alag|dusra|doosra)|dusri\s+baat|doosri\s+baat|(?:change|badlo|badal\s+do)\s+(?:the\s+)?topic|topic\s+(?:change|badlo|badal\s+do)|(?:dusra|doosra|another|different|new)\s+topic|talk\s+about\s+(?:something|anything)|is\s+(?:ke|ki)\s+(?:alawa|alava|siva))\b/i;
const TOPIC = /\b(?:([\p{L}\p{N} ]{2,30}?)\s+(?:ke|ki)\s+(?:baare|bare)\s+(?:mein|me|main)\s+(?:baat\s+(?:karo|karte\s+hain|karein|kare)|batao|bataiye|sikhao)|(?:let'?s\s+)?(?:talk|tell\s+me)\s+about\s+([\p{L}\p{N} ]{2,30}))/iu;
const LANG = { hindi: /\b(?:hindi|हिंदी|हिन्दी)\b/i, english: /\b(?:english|angrezi|अंग्रेज़ी|इंग्लिश)\b/i, hinglish: /\bhinglish\b/i };
const LANG_REQ = /\b(?:hindi|english|angrezi|hinglish)\s+(?:me|mein|main|mai|में)\b|\b(?:in|speak|talk|explain\s+in|say\s+it\s+in)\s+(?:hindi|english|hinglish)\b|\b(?:hindi|english|hinglish)\s+(?:please|plz)\b|^(?:hindi|english|hinglish)$|(?:हिंदी|हिन्दी|अंग्रेज़ी|इंग्लिश)\s*में/i;
const ANOTHER = /\b(?:explain|samjhao|samjhaiye|batao|bataiye|sikhao)\s+(?:it\s+|this\s+|isko\s+|ise\s+|ye\s+|yeh\s+)?(?:differently|another\s+way|in\s+a\s+different\s+way|in\s+another\s+way|again\s+differently|simply|more\s+simply|easily)\b|\b(?:dusre|doosre|alag|aur|kisi\s+aur)\s+(?:tareeke|tarike|tarah|way)\s+(?:se)?\b|\b(?:aasan|asaan|simple|easy)\s+(?:karo|kar\s+do|bhasha|shabdon|words|mein\s+samjhao)\b|\bdifferent(?:ly)?\s+(?:way|explanation)\b|\bexplain\s+(?:it\s+)?again\b|\bphir\s+se\s+samjhao\b|\bek\s+baar\s+aur\s+samjhao\b/i;
const EXAMPLE = /\b(?:example|udaharan|udahran|misal)\s*(?:do|dijiye|de\s+do|dikhao|batao|bataiye|please|chahiye|give|with)?\b|\bgive\s+(?:me\s+)?an?\s+example\b|\bfor\s+example\??$|\bjaise\s+kya\b/i;
const STORY = /\b(?:story|kahani|kahaani)\s*(?:ki\s+tarah|jaisa|jaise|se|mein|me|sunao|batao|bana\s*ke|banake|form|wala|wali|please)?\b|\btell\s+(?:it\s+)?(?:as|like)\s+a\s+story\b/i;
const SLOWER = /\b(?:slow(?:ly)?(?:\s+please)?|slower|dheere(?:\s+(?:bolo|boliye|se|please|batao|bataiye))?|dhire(?:\s+(?:bolo|boliye|se))?|aaram\s+se\s+(?:bolo|batao|samjhao)|too\s+fast|bahut\s+(?:tez|fast|jaldi)|itna\s+(?:tez|fast|jaldi)|jaldi\s+mat|ruk\s+ruk\s+ke|step\s+by\s+step)\b/i;
const VISUAL = /\b(?:(?:show|draw|make)\s+(?:me\s+)?(?:a\s+|the\s+|it\s+|this\s+)?(?:diagram|picture|drawing|image|figure|graph|chart|model|it|this)|(?:diagram|picture|photo|image|drawing|chitra|tasveer|figure)\s+(?:dikhao|dikhaiye|banao|banaiye|bana\s+do|draw|show|please|chahiye|se\s+samjhao)|(?:draw|bana(?:\s+ke|kar)?)\s+(?:karke\s+)?(?:samjhao|dikhao|batao)|draw\s+(?:it|this|karo|kijiye)|whiteboard\s+(?:pe|par|per|mein|me|on)|(?:on|use)\s+the\s+(?:whiteboard|board)|board\s+(?:pe|par|per)\s+(?:bana|likh|dikha)\w*|can\s+you\s+(?:show|draw)|dikha\s+(?:ke|kar)\s+samjhao|dikhao\s+na)\b/i;
const GAME = /\b(?:game|khel|activity)\s*(?:khelna|khelte|khelo|khel\s+sakte|chahiye|dikhao|karo|karna|please)?\b|\blet'?s\s+play\b|\bplay\s+a\s+game\b/i;
// round 3 forge (patch 08): "simulation dikhao" / "simulate karo" is an interactive ask too; before, no pattern matched it and
// only the model classifier's flag sometimes made it one (2 of 5 forge acceptance runs read it as a plain worked example)
const ANIMATION = /\b(?:animation|animate|video|cartoon|simulation|simulate|simulator)\s*(?:dikhao|dikhaiye|chahiye|please|banao|show|karo|kijiye)?\b|\bshow\s+(?:me\s+)?(?:an?\s+)?(?:animation|video|simulation)\b/i;

/** Words of an attempt: a number, or more words than a request carries. An attempt is graded; its request is ignored. */
const attemptLike = (t) => /\d/.test(t) || /\b\d+\s*\/\s*\d+\b/.test(t);
const wordCount = (t) => t.split(/\s+/).filter(Boolean).length;

/**
 * PURE. The request a child's turn makes, or null.
 * @param {string} text  the child's words (typed, or an ASR transcript)
 * @returns {null | { type: "goodbye"|"stop"|"continue"|"break"|"change_topic"|"topic"|"language"|"another"|"example"|"story"|"slower"|"visual",
 *   subject?: string, lang?: "hindi"|"english"|"hinglish", kind?: "diagram"|"game"|"animation", whole: boolean }}
 *   whole: the turn is ONLY the request (no attempt alongside it), so it may be acted on with no classifier call.
 */
export function requestOf(text) {
  const raw = T(text);
  if (!raw) return null;
  const t = core(raw) || raw;
  const n = wordCount(t);
  const whole = !attemptLike(t) && n <= 12;
  // a turn of mostly answer words with a request tacked on is an answer (the request is ignored, the answer graded)
  if (!whole && n > 16) return null;
  // Leaving now beats everything (NEVER MANIPULATE): never read as a stop to check in on, nor a break.
  if (GOODBYE.test(t) && !SHORT_BREAK.test(t)) return { type: "goodbye", whole };
  if (SHORT_BREAK.test(t) && /\b(?:jaana|jana|jau|jaun|go|break|peena|pina|drink|chahiye)\b/.test(t) && !attemptLike(t)) return { type: "break", whole };
  if (BREAK.test(t)) return { type: "break", whole };
  if (CHANGE_TOPIC.test(t)) return { type: "change_topic", whole };
  // round 2 safety floor: the relational lexicon's anchored end_request reading too (en / hl / Devanagari; safety.js
  // wantsToStop reads the same), so "bas, aaj ke liye itna hi" is a stop in code with no model (stop-drill 4/8 → 8/8)
  if (STOP.test(t) || stopKind(text) === "end_request") return { type: "stop", whole };
  if (CONTINUE.test(t)) return { type: "continue", whole };
  if (LANG_REQ.test(t)) {
    const lang = LANG.hinglish.test(t) ? "hinglish" : LANG.english.test(t) ? "english" : LANG.hindi.test(t) ? "hindi" : null;
    if (lang) return { type: "language", lang, whole };
  }
  if (VISUAL.test(t) || (whole && /^(?:diagram|picture|drawing|draw)\b/.test(t))) return { type: "visual", kind: "diagram", whole };
  if (whole && ANIMATION.test(t)) return { type: "visual", kind: "animation", whole };
  if (whole && GAME.test(t) && !/\b(?:game\s+(?:mein|me)\s+\d)/.test(t)) return { type: "visual", kind: "game", whole };
  if (whole && STORY.test(t)) return { type: "story", whole };
  if (whole && EXAMPLE.test(t)) return { type: "example", whole };
  if (whole && SLOWER.test(t)) return { type: "slower", whole };
  if (whole && ANOTHER.test(t)) return { type: "another", whole };
  if (whole) {
    const m = t.match(TOPIC);
    const subject = (m?.[1] ?? m?.[2] ?? "").replace(/^(?:the|a|an|is|us|mujhe|humein|hume)\s+/i, "").trim();
    if (subject && !/^(?:this|it|that|yeh|ye|is|isko|lesson|question|sawal|sawaal)$/.test(subject)) return { type: "topic", subject: subject.slice(0, 30), whole };
  }
  return null;
}

/** The request types that are about the lesson's flow (never acted on without the classifier's distress read too). */
export const FLOW_REQUESTS = new Set(["goodbye", "stop"]);
/** The request types that map onto the Director's existing help moves (state.js helpMove; until now reachable only by a chip). */
export const HELP_OF_REQUEST = Object.freeze({ another: "another", example: "example", story: "story", slower: "slower" });
