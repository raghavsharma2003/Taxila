// The turn's WORD and GUARD stages (TEACHER-BRAIN §5.1 stages 5-6): the teacher's reply written from the ONE compiled
// instructions string (one compile() for every lane) and guarded on the bytes by code: answer leaks, drift, floor
// breaks, praise/verdict agreement, the screen, register, script, length and the turn's shape. Moved out of
// server/routes/lesson.js unchanged by W2-E BR1 (BUILD-PLAN W2-E #2); the lesson start and the turn both call it.
import { boardWords } from "./board-words.js";
import { inHindiWords } from "./register.js";
import { safetyOpeningFor, safetyModeOf } from "../relational/openings.js";
import { chat, chatStream, DEPLOY, isContentFilter, nonHarmFilter, notChildSafety } from "../azure.js";
import { floorViolations, scrubPii, filterSafe } from "../director/safety.js";
import { upcomingItem, hintShapeWords } from "../director/state.js";
import { findItem, promptFor, revealsAnswer, posesItem, handsBack, asksWhy, stripRungLabel } from "../director/items.js";
import { TURN_WORDS, FLOOR_FIX } from "../compiler/compile.js";
import { HELPLINES } from "../compiler/floor.js";
import { registerBroken, toAap } from "../director/register.js";
// round 3 fix (experience B6): arithmetic she states, and her own closed sums, checked in code
import { arithmeticSlip, selfPosedVerdict } from "./arith.js";
import { saidMust, joinable } from "../director/script.js";
import { praiseProblem, claimsMistake, stripPraise, stripClaim, screenProblem, stripScreenRefs, emptyStage, leaksStage, stripStage, saysCantShow, stripCantShow, askParity, endOnAsk, joinAsk, lastQuestionOnly, wrapsUp, stripWrap, correctsRight, stripCorrection, childAsks } from "../director/say.js";
import { mixedUnitComparison, withoutMixedUnits } from "../director/units.js";
import { screenContradiction, stripStrayParts } from "../director/modules.js";
import { isBare, repeatsEarlier, tidy, leadWithoutQuestion, sentences } from "../conversation/guards.js";
import { renderWorked } from "../director/worked.js";
import { p5Flag } from "../conversation/flags.js";
import { leadSlotWanted, leadSlotNote, cleanLead, leadOk, composeTurn, requestNote, turnNote, LEAD_MAX_WORDS, LEAD_MIN_FIRST, LEAD_MAX_FIRST } from "../conversation/compose.js";
import { fallbackLead } from "../conversation/fallback-lead.js";
// r4-latency: the TTS part split (part 0 = the first sentence the child hears)
import { splitSentences } from "../voice/sentences.js";
import { bracketSlip, sayBrackets } from "./brackets.js";
import { lessonHyperbole, lessonIdiom } from "../safety/idioms.js";

/** p5-interaction: problems a gutted teaching turn's one retry may still carry, because code repairs them (never truth). */
const HELP_ASKS = new Set(["another", "clarify", "slower", "example", "story", "frustration", "easier"]);
// round 7 S1: the problems a shipped line may never carry (truth and teaching; style problems are repaired, not enforced)
// (director3: "Isko ek baar poora karke dekhte hain" over ONE step) a frame never claims more than the lines that follow it
const WORKED_FRAME = { hinglish: ["Chalo, ek sawaal saath mein hal karte hain.", "Ek udaharan dekho, kadam se kadam.", "Isko shuru se dekhte hain."],
  english: ["Let's solve one together.", "Here is one, step by step.", "Let's start this one."] };
/** v6.1 R11: a worked step's own label ("Pehla kadam" only for step 1). */
const stepLabel = (n, lang) => (lang === "english" ? ["First step.", "Now the second step.", "Now the third step."][n - 1] ?? "Now the next step."
  : ["Pehla kadam dekho.", "Ab doosra kadam.", "Ab teesra kadam."][n - 1] ?? "Ab agla kadam.");
const WORKED_FRAME_PART = { hinglish: ["Pehla kadam dekho.", "Iska shuruaati hissa dekhte hain.", "Pehle yeh hissa."], english: ["First, this part.", "Here is the first step.", "Start with this part."] };
// v6 R5: the end of the first half of a split turn
// (director9: "Chalo, aage badhein?" was asked and then ignored, whatever they said: closures end on a statement, never a question)
const SPLIT_ASK = { hinglish: ["Ab aage chalte hain.", "Chalo, ab aage.", "Ab agla hissa."], english: ["Now let's go on.", "On to the next bit.", "Now the next part."] };
// v6.1 R9: a teaching turn past its beat's one check-in ends on a statement
const SPLIT_CARD = { hinglish: ["Ab isi par ek sawaal.", "Ab is par ek chhota sawaal."], english: ["Now a question on this.", "Now a small question on this."] };
const WORKED_GO = { hinglish: ["Ab agla kadam dekhte hain.", "Chalo, aage dekhte hain.", "Ab isse aage chalte hain."], english: ["Now the next step.", "Let's go on.", "Now we go on from here."] };
/** v6.2: a check-in after teaching that is no worked step. */
const BEAT_ASK = { hinglish: ["Yahan tak theek hai?", "Ab tak samajh aaya?"], english: ["Does that make sense so far?", "Clear so far?"] };
const WORKED_ASK = { hinglish: ["Yahan tak theek hai?", "Ab tak samajh aaya?", "Yeh kadam saaf hai?"], english: ["Does that make sense so far?", "Clear so far?", "Is that step clear?"] };
// v6 R3 (director8 c4: 5 of 7 probe answers ignored): one line that takes up how they thought, before the next beat; it never
// grades their reason (a probe is never right or wrong)
/** v6.2 H3: a child's turn that gives a reason or a way of working (what a "you told me how you thought" ack takes up). */
const REASON_SAID = /(?<![\p{L}])(?:kyunki|kyonki|isliye|maine|mene|humne|socha|sochi|gina|gini|ginke|ginkar|jod\w*|ghata\w*|dekha|dekhkar|dekh\s+ke|pehle|phir|because|so\s+i|i\s+(?:counted|added|thought|saw|did)|first|then)(?![\p{L}])/iu;
const PROBE_ACK = {
  hinglish: ["Achha, tumne apna tareeka bataya.", "Theek, yeh tumhari soch thi.", "Achha, ab samajh aaya tumne kaise socha."],
  english: ["Okay, thanks for telling me how you thought.", "Right, that was your way of thinking.", "Okay, now I see how you thought about it."],
};
/**
 * v6 R3 (director8 c6 stuck T39–T43: "23 m" three times, the same generic hint each time): on an adding card (its key is the
 * sum of every number the card gives) a total that leaves numbers out names exactly the ones left out. null otherwise.
 * Exported for tests.
 */
export function missingPieces(card, said, key) {
  let nums = (String(card ?? "").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  // (a number that counts the pieces, "6 bhujayein", is not one of them)
  const total = nums.reduce((a, x) => a + x, 0);
  const counter = nums.findIndex((n) => n === nums.length - 1 && Math.abs(total - n - Number(String(key ?? "").match(/\d+(?:\.\d+)?/)?.[0])) < 1e-9);
  if (counter >= 0) nums = nums.filter((_, i) => i !== counter);
  const k = Number(String(key ?? "").match(/\d+(?:\.\d+)?/)?.[0]);
  const got = Number(String(said ?? "").match(/\d+(?:\.\d+)?/)?.[0]);
  if (nums.length < 3 || nums.length > 12 || !Number.isFinite(k) || !Number.isFinite(got) || got >= k) return null;
  if (Math.abs(nums.reduce((a, x) => a + x, 0) - k) > 1e-9) return null;
  // the fewest numbers left out; two different ways to leave them out is not known, so nothing is named
  let best = null, other = false;
  for (let m = 1; m < 1 << nums.length; m++) {
    let sum = 0; const out = [];
    for (let i = 0; i < nums.length; i++) if (m & (1 << i)) sum += nums[i]; else out.push(nums[i]);
    if (!out.length || Math.abs(sum - got) > 1e-9) continue;
    if (!best || out.length < best.length) { best = out; other = false; }
    else if (out.length === best.length && [...out].sort().join() !== [...best].sort().join()) other = true;
  }
  return best && !other ? best : null;
}
const GAVE_LINE = {
  hinglish: [(a, w) => `Pichhle sawaal ka jawab ${a} tha${w ? `, kyunki ${w}` : ""}.`, (a, w) => `Woh wala: jawab ${a}${w ? `; ${w}` : ""}.`, (a, w) => `Pichhla sawaal: ${w ? `${w}, ` : ""}yaani jawab ${a}.`],
  english: [(a, w) => `The last one's answer was ${a}${w ? `, because ${w}` : ""}.`, (a, w) => `That one: the answer is ${a}${w ? `; ${w}` : ""}.`, (a, w) => `The last question: ${w ? `${w}, ` : ""}so the answer is ${a}.`],
};
const LANG_ACK = { hindi: ["Theek hai, ab Hindi mein.", "Achha, ab Hindi mein baat karte hain.", "Hindi mein? Zaroor."], english: ["Okay, in English now.", "Sure, in English.", "English it is."] };
// v6.3 R2 (main, director11: "cricket: iski baat …" is the raw template, said lower-case): the topic leads a whole sentence
const capT = (t) => { const x = String(t ?? "").trim(); return x.charAt(0).toUpperCase() + x.slice(1); };
const PARK_ACK = { hinglish: [(t) => `${capT(t)} ki baat hum is sawaal ke baad karenge.`, (t) => `${capT(t)} yaad rahega; yeh sawaal khatam karke uspar aate hain.`, (t) => `${capT(t)} ke baare mein is sawaal ke baad baat karenge, pakka.`],
  english: [(t) => `We'll talk about ${t} after this question.`, (t) => `I'll remember ${t}; we'll come back to it once this question is done.`, (t) => `${capT(t)}: yes, right after this question.`] };
/** v6.4 H2″: the instruction for an aside's return — ONE line answering what they said. */
export function returnNoteOf(said, topic, lang = "hinglish", alone = false) {
  const en = lang === "english";
  return `${alone ? "You are a warm teacher of a child, mid-lesson. " : ""}Earlier the child said: "${String(said).slice(0, 80)}". ${alone ? "Write" : "Start your turn with"} ONE short sentence (at most 20 words, ${en ? "in English" : "in simple Hinglish, Roman script"}) that answers that — reply to what they said or asked about ${topic}, using one of their own words. No numbers, no maths, no promise to talk later, no question back.${alone ? " Only that sentence." : ""}`;
}
const RET_STOP = new Set(["maine", "mujhe", "mera", "meri", "mere", "aapko", "aapka", "tumhe", "hai", "hain", "tha", "thi", "kal", "aaj", "bahut", "kiya", "khela", "aur", "kya", "with", "that", "this", "have"]);
/** v6.4 H2″: an aside's return line: 4-20 words, one content word of theirs, no digits or lesson words, no promise, no template. */
export function returnLineOk(x, said, topic) {
  const t = String(x ?? "").trim();
  if (!t || /\d/.test(t) || /[?？]/.test(t)) return false;
  const n = t.split(/\s+/).filter(Boolean).length;
  if (n < 4 || n > 20) return false;
  if (/sunke bahut achha laga|tumne bataya tha|tumne mujhse .* poocha tha/i.test(t)) return false;
  // (the old code return's "Aur X ki baat: <a fact>" frame is a fixed template too)
  if (/^(?:aur|and about)\s+\p{L}+\s+(?:ki baat\s*)?:/iu.test(t)) return false;
  // (v6 R4 still holds: never an analogy to the lesson, never words put in their mouth)
  if (/(?<![\p{L}])(?:jaisa|jaise|jaisi|ki\s+tarah|socho|like\s+(?:a|the)|just\s+like)(?![\p{L}])/iu.test(t)) return false;
  if (/(?<![\p{L}])(?:tumne|aapne|you)\s+(?:kaha|bataya|bola|said|told)|tumhe\s+\S+(?:\s+\S+)?\s+pasand|you\s+like/iu.test(t)) return false;
  if (/(?<![\p{L}])(?:baad\s+mein|lesson\s+ke\s+baad|phir\s+baat|thodi\s+der|later|after\s+the\s+lesson|wapas\s+aa\w*|laut\w*)(?![\p{L}])/iu.test(t)) return false;
  if (LESSON_SAID.test(t) || RULE_SAID.test(t)) return false;
  const theirs = (String(said ?? "").toLowerCase().match(/\p{L}{4,}/gu) ?? []).filter((w) => !RET_STOP.has(w));
  const all = [...new Set([...theirs, ...(String(topic ?? "").toLowerCase().match(/\p{L}{4,}/gu) ?? [])])];
  return all.some((w) => new RegExp(`(?<![\\p{L}])${w}`, "iu").test(t));
}
/** v6.3 R2: her own promise to come back, with no topic named (said once: code's park already promises). */
const PROMISE_SAID = /(?<![\p{L}])(?:wapas\s+aa\w*|laut\w*|baat\s+kar(?:enge|ungi|unga)|uspar\s+aa\w*|baad\s+mein\s+(?:aa|baat)\w*|come\s+back|talk\s+about\s+it)(?![\p{L}])/iu;
/** v6.3 R7: a sentence that talks about the lesson's own things (parts, fractions, sides, the line), not a framing line. */
const LESSON_SAID = /(?<![\p{L}])(?:fraction\w*|bhinn\w*|tukd\w*|hiss\w*|barabar|equal|parts?|pieces?|line|rekha|gap\w*|mark\w*|nishaan\w*|bhuja\w*|sides?|parimap|perimeter|denominator|numerator|ansh|har|upar|neeche|total|kul|jod\w*|guna\w*|khaya|khaye|khayi)(?![\p{L}])/iu;
/** v6.1 R7: a sentence that states a rule or a reason (a teaching claim), not a framing line. */
export const RULE_SAID = /(?<![\p{L}])(?:kyunki|kyonki|isliye|matlab|yaani|hamesha|because|means|therefore|always)(?![\p{L}])|(?<![\p{L}])(?:hota|hoti|hote|aata|aati|aate|banta|banti|bante|guzarta|guzarti|guzarte|milta|milti|milte)\s+(?:hai|hain)(?![\p{L}])/iu;
export const ENFORCED = new Set(["leak", "praise", "deny", "claim", "corrects", "math", "invented", "screen", "parts", "affirms", "negates", "notheard",
  "gameclaim", "cantshow", "level", "answerinq", "underived", "ignored", "readscard", "units", "ratefrac"]);
// (samecard is not enforced: its repair is a fixed lead before the card, which still has the card in it)
// an English card in a Hindi / Hinglish lesson: asked about without reading it and without sending their eyes to a screen
const ENGLISH_CARD_LINE = { tum: "Is sawaal ka jawab socho aur batao.", aap: "Is sawaal ka jawab sochiye aur bataiye." };
const SOFT_FIX = new Set(["long", "twoq", "wrap", "script", "register", "stage", "cantshow", "uiword", "notheard", "bracket", "negates", "gameclaim", "affirms"]);
// round 3 fix (experience B10 / B2): her words never name a screen part by its internal name. The review heard "Chips mein
// chuno: keep going, short break, ya stop for today" (c4-10) and "bar1 ke 4 parts", "bar2 ko … kijiye" over strips labelled
// A and B (3 times): the child sees buttons and strips A / B, never "chips" or "bar1". PURE.
// Precision (2026-10-10 scan): only a CHOOSING verb makes "chips" the buttons ("chips mein chuno", "chips par tap karo", "tap one
// of the chips"); food chips in a lesson ("chips mein namak aur tel", "a potato chip on a piece of paper") are not. A strip's
// internal name is "bar1" / "bar2" (or "bar 1 / 2" with a case marker after it); a bar graph's "bar 4 squares" is not.
const CHOOSE = String.raw`(?:chuno|chuniye|chun\s+lo|choose|pick|tap|dabao|dabaiye|daba\s+do|select|click)`;
const CHIPS_UI = String.raw`chips?\s+(?:mein|me|par|pe|se|on|in|from)\s+(?:se\s+|ek\s+|one\s+)?(?:\S+\s+){0,2}?${CHOOSE}|chips\s+${CHOOSE}|${CHOOSE}\s+(?:on\s+)?(?:one\s+of\s+)?(?:a\s+|the\s+|ek\s+)?chips?`;
const BAR_UI = String.raw`bar[1-9](?![\p{L}\p{N}])|bar\s[12]\s+(?:ke|ko|mein|me|ka|ki|par|aur|and|is|has)(?![\p{L}])`;
/** A sentence that points at what is on the screen ("Screen par…", "dekho", "look at", "this roti", "yeh board"). */
const SCREEN_SENTENCE = /(?<![\p{L}])(?:screen|board|tray|dekho|dekhiye|dekhein|dekh\s+rahe|look|see\s+(?:the|this|how)|here|yahan|yahaan|is\s+(?:roti|picture|tasveer|board|shape|strip|bar)|yeh\s+(?:roti|picture|tasveer|board|shape|strip|bar)|this\s+(?:roti|picture|board|shape|strip|bar))(?![\p{L}])/iu;
const UI_WORD = new RegExp(String.raw`(?<![\p{L}\p{N}])(?:${CHIPS_UI}|${BAR_UI})`, "iu");
export const namesUiPart = (t) => UI_WORD.test(String(t ?? ""));
/** The code repair: "chips mein chuno / tap the chips" → the screen; "bar1 / bar2" → A / B (the strips' own labels). */
export function plainUiWords(t, lang = "hinglish") {
  const scr = lang === "english" ? "on the screen" : "screen par";
  return String(t ?? "")
    .replace(new RegExp(String.raw`(?<![\p{L}\p{N}])bar\s?([12])(?=\s+(?:ke|ko|mein|me|ka|ki|par|aur|and|is|has)(?![\p{L}]))|(?<![\p{L}\p{N}])bar([1-9])(?![\p{L}\p{N}])`, "giu"), (_, a, b) => "ABCDEFGHI"[Number(a ?? b) - 1] ?? (a ?? b))
    .replace(new RegExp(String.raw`(?<![\p{L}\p{N}])chips?\s+(?:mein|me|par|pe|se|on|in|from)(?=\s+(?:se\s+|ek\s+|one\s+)?(?:\S+\s+){0,2}?${CHOOSE})`, "giu"), scr)
    .replace(new RegExp(String.raw`(?<![\p{L}\p{N}])chips(?=\s+${CHOOSE})`, "giu"), scr)
    .replace(new RegExp(String.raw`(?<=${CHOOSE}\s+)(?:on\s+)?(?:one\s+of\s+)?(?:a\s+|the\s+|ek\s+)?chips?(?![\p{L}])`, "giu"), lang === "english" ? "a button on the screen" : "screen par ek button")
    .replace(/\s{2,}/g, " ").trim();
}
/** Text-mode hard ceiling for the reply guard (the compiled rule asks for TURN_WORDS). */
export const REPLY_MAX_WORDS = { "6-9": 30, "10-15": 40 };

export const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;

/**
 * The call-site recipe for floorViolations (context/inbox/merged/harvest-ports.json; decision never-rules-floor-violations
 * revised): the posed item's verified content — its prompt in each language, the answer, the acceptable answers, the
 * hints and the diagnostic options — is passed as `content`, which safety.js removes only as whole long segments that
 * carry a hit of their own (0/26,576 posed kit questions flagged with it). Exported for the eval.
 */
export function floorContentOf(item) {
  if (!item) return [];
  const s = (x) => (typeof x === "string" && x.trim() ? [x] : []);
  return [...s(item.prompt_en), ...s(item.prompt_hi), ...s(item.answer), ...(item.acceptable ?? []).flatMap(s), ...(item.hints ?? []).flatMap(s),
    ...(item.options ?? []).flatMap((o) => s(o?.text))];
}

/** A child's words on their way to a model: direct identifiers masked (scrubPii; decision scrub-pii-cued). */
export const scrubbed = (t) => scrubPii(t).text;

// round 7 (main's hybrid-pilot judgement #4): "tumhara answer mujhe clearly sunai nahi diya" said to a heard "8"
const NOT_HEARD = /\b(?:(?:clearly|theek\s+se|sahi\s+se|thik\s+se)\s+)?(?:sunai\s+nahi\s+(?:diya|di|de\s+raha|aaya)|nahi\s+sun(?:a|i|\s+paayi|\s+paaya|\s+payi)|awaaz\s+nahi\s+aayi|(?:i\s+)?(?:couldn'?t|could\s+not|didn'?t|did\s+not)\s+(?:hear|catch)\s+(?:you|that|it|your)|(?:couldn'?t|could\s+not)\s+make\s+(?:it|that)\s+out)\b|सुनाई\s+नहीं/i;
/** Does her line claim she did not hear them? */
export const claimsNotHeard = (t) => NOT_HEARD.test(String(t ?? ""));
/** Her line with every sentence that claims she did not hear them dropped (whole sentences, never letters). */
// round 7 (main's hybrid-pilot judgement #6): "Rectangle ki sides kaise jodogi?" (her own how-question, no key) then "4" got
// "4 nahi—": a verdict on an answer nothing graded. Their short answer negated in her line is caught on an ungraded turn.
const escRe = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const negationOf = (said) => new RegExp(`(?<![\\p{L}\\p{N}])${escRe(said)}\\s+(?:nahi|nahin|nhi|not|galat|wrong)(?![\\p{L}])\\s*[—–,.:;-]?\\s*`, "iu");
/** Does her line negate the child's short answer ("4 nahi")? */
export function negatesAnswer(text, childText) {
  const said = String(childText ?? "").replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();
  if (!said || said.split(" ").length > 3) return false;
  return negationOf(said).test(String(text ?? ""));
}
// dc-r7-script-walk-v2 R4: her words match the screen. The shape on the board (Studio's slot artifact.screen, else the script
// beat's board ref) and the numbers it shows; a sentence that names another shape, or points at the screen with a number the
// board does not show, is dropped (director4 c6: "rectangle" over a triangle in 6 of 8; c5 "screen par 2/5" over nothing).
const SHAPES = [["rectangle", /(?<![\p{L}])(?:rectangle|rectangular|aayat\w*)(?![\p{L}])/iu], ["square", /(?<![\p{L}])(?:square|varg)(?![\p{L}])/iu],
  ["triangle", /(?<![\p{L}])(?:triangle|tribhuj)(?![\p{L}])/iu], ["pentagon", /(?<![\p{L}])(?:pentagon|panchbhuj)(?![\p{L}])/iu],
  ["hexagon", /(?<![\p{L}])(?:hexagon|shatbhuj)(?![\p{L}])/iu], ["circle", /(?<![\p{L}])(?:circle|vritt|gola)(?![\p{L}])/iu]];
const SHAPE_ALIAS = { rect: "rectangle", rectangle: "rectangle", square: "square", triangle: "triangle", pentagon: "pentagon", hexagon: "hexagon", circle: "circle" };
/** What the screen shows this turn: { shape, numbers } (null fields unknown). */
export function screenFacts(ui, lastMove) {
  const sc = ui?.studioSlot?.artifact?.screen ?? null;
  const ref = lastMove?.scriptBeat?.board ?? null;
  const params = ref && typeof ref === "object" ? (ref.params && typeof ref.params === "object" ? ref.params : ref) : {};
  const shape = SHAPE_ALIAS[String(sc?.shape ?? params.shape ?? "").toLowerCase()] ?? null;
  const numbers = Array.isArray(sc?.numbers) ? sc.numbers.map(String) : null;
  // SC1 (Studio's counted facts, shared/studio.ts ScreenCounts): what the template counted as it drew; absent → no count check
  const counts = sc?.counts && typeof sc.counts === "object" ? sc.counts : null;
  return { shape, numbers, counts };
}
// SC1: a counted claim about the board ("beech mein 2 nishaan", "3 barabar hisse", "5 bhujayein", "2 rangin") → the counts it
// may match; a claim whose kind the board did not count is never checked
const HI_COUNT = { ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, chhah: 6, saat: 7, aath: 8, nau: 9, das: 10 };
const NUM_W = "(\\d+|ek|do|teen|chaa?r|paa?nch|chhe|chhah|saat|aath|nau|das)";
const countOf = (w) => /^\d+$/.test(w) ? Number(w) : HI_COUNT[w.toLowerCase()] ?? null;
const COUNTED = [
  // (director6: "beech mein 3 chalk ke nishaan": up to two words between the count and the marks)
  ["inner", new RegExp(`beech\\s+mein\\s+${NUM_W}\\s+(?:[\\p{L}]+\\s+){0,2}?(?:marks?|nishaan|nishan|ticks?|lakeer\\w*|nishaanon)`, "giu"), (c) => (c.lines ?? []).map((l) => l.innerTicks)],
  ["gaps", new RegExp(`(?<![\\p{L}\\d/])${NUM_W}\\s+(barabar\\s+|equal\\s+)?(?:gaps?|hisse|hisson|hissa|tukde|tukdon|parts?|bhaag)(?![\\p{L}])`, "giu"), (c) => [...(c.lines ?? []).flatMap((l) => [l.gaps, l.gapsPerWhole]), c.parts, c.groups, c.shaded,
    // (compare@1, Studio 244936c8: each column's stated quantities, "2 tukde")
    ...(c.columns ?? []).flatMap((col) => (col.quantities ?? []).map((q) => q.n))]],
  // ("teen mark hain: 1/2, 1/4 aur 1/8": the labelled marks count too)
  ["ticks", new RegExp(`(?<![\\p{L}\\d/])${NUM_W}\\s+(?:marks?|nishaan|nishan|ticks?)(?![\\p{L}])`, "giu"), (c) => [...(c.lines ?? []).flatMap((l) => [l.innerTicks, l.ticks, l.gaps]), ...(Array.isArray(c.marks) && c.marks.length ? [c.marks.length] : [])]],
  ["sides", new RegExp(`(?<![\\p{L}\\d/])${NUM_W}\\s+(?:sides?|bhuja\\w*|kon[ea]|corners?)(?![\\p{L}])`, "giu"), (c) => [c.sides, c.corners]],
  // (Studio 013: the dot's drawn hops, fraction-line@1 counts.hops; "pehle 4 hop" over 5 drawn is a stretch, as gaps)
  ["hops", new RegExp(`(?<![\\p{L}\\d/])${NUM_W}\\s+(?:hops?|chhalang\\w*|jumps?)(?![\\p{L}])`, "giu"), (c) => [c.hops]],
  ["shaded", new RegExp(`(?<![\\p{L}\\d/])${NUM_W}\\s+(?:hisse\\s+|parts?\\s+|tukde\\s+)?(?:shaded|rangi\\w*|rangee\\w*|colou?red)(?![\\p{L}])`, "giu"), (c) => [c.shaded]],
];
const DEICTIC = /\b(?:screen|board|whiteboard)\b|dekho|dekhiye|\b(?:yahan|is|iss|ye|yeh)\s+(?:line|rekha|shape|aakar|chitra?|figure|rectangle|triangle|square|circle|pentagon|hexagon|patti|strip|kyaari)/i;
/** Every number a board counted (SC1), for the pointed-number check: a count said is never "a number the board lacks". */
const countNumbers = (c) => !c ? [] : [...(c.lines ?? []).flatMap((l) => [l.gaps, l.gapsPerWhole, l.ticks, l.innerTicks]), c.parts, c.shaded, c.rows, c.cols, c.groups, c.each,
  c.sides, c.corners, c.hops, Array.isArray(c.marks) ? c.marks.length : null].filter((v) => typeof v === "number").map(String);
/** SC1: does this sentence state a count the board's counted facts contradict? */
export function countContradicts(x, counts) {
  if (!counts || !DEICTIC.test(x)) return false;
  // "beech mein N" claims are inner marks only; the plain "N marks" rule then skips them
  const t = String(x);
  const lineMax = Math.max(0, ...(counts.lines ?? []).map((l) => l.gaps ?? 0));
  for (const [kind, re, allowed] of COUNTED) {
    for (const m of t.matchAll(re)) {
      if (kind === "ticks" && /beech\s+mein\s*$/i.test(t.slice(0, m.index))) continue;
      if (kind === "gaps" && /^\s*(?:hisse\s+|parts?\s+|tukde\s+)?(?:shaded|rangi|rangee|colou?red)/i.test(t.slice(m.index + m[0].length))) continue;
      const n = countOf(m[1]);
      // ("ek gap ki value", "ek kone se": one of them, never a count of the board)
      if (n === 1 && /^ek$/i.test(m[1])) continue;
      // (on a line, "3 tukde … 3/8 tak" is a stretch of it, as Studio's W10 reads it; only "N barabar …" names the division)
      if (kind === "gaps" && lineMax && !m[2] && n != null && n <= lineMax) continue;
      if (kind === "hops" && typeof counts.hops === "number" && n != null && n <= counts.hops) continue;
      const ok = allowed(counts).filter((v) => typeof v === "number");
      if (!ok.length) continue;                       // not counted by this board: never flagged
      if (n != null && !ok.includes(n)) return true;
    }
  }
  // compare@1: a number said right after a column's title ("Cake A mein 3") is one of THAT column's stated quantities
  for (const col of counts.columns ?? []) {
    const title = String(col?.title ?? "").trim();
    const qs = (col?.quantities ?? []).map((q) => q.n).filter((n) => typeof n === "number");
    if (title.length < 3 || !qs.length) continue;
    const m = new RegExp(`${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s+\\p{L}+){0,3}?\\s+${NUM_W}(?![\\d/])`, "iu").exec(t);
    if (m) { const n = countOf(m[1]); if (n != null && n !== 1 && !qs.includes(n)) return true; }
  }
  // a side value with a unit, said of a side, must be one the board wrote
  if (Array.isArray(counts.sideValues) && counts.sideValues.length && /\b(?:sides?|bhuja\w*)\b/i.test(t) && !/parimap|perimeter|\bkul\b|total|jod/i.test(t)) {
    const vals = counts.sideValues.map((v) => String(v).replace(/\s+/g, " ").trim().toLowerCase());
    for (const m of t.matchAll(/(?<![\d.])(\d+(?:\.\d+)?)\s*(cm|m|km|mm)\b/gi)) if (!vals.includes(`${m[1]} ${m[2].toLowerCase()}`)) return true;
  }
  return false;
}
/** The sentences of her line that contradict the screen (another shape named; a screen-pointing number the board lacks). */
export function screenContradictions(text, facts) {
  if (!facts?.shape && !facts?.numbers && !facts?.counts) return [];
  const POINT = /\b(?:screen|board|whiteboard)\b|dekho|dekhiye/i;
  return (String(text ?? "").match(/[^.!?।]+[.!?।]*\s*/g) ?? []).filter((x) => {
    if (facts.counts && countContradicts(x, facts.counts)) return true;
    if (facts.shape) {
      // ("woh area hai, square cm mein": a square unit is not the shape square)
      const xs = x.replace(/(?<![\p{L}])(?:square|varg)\s+(?:cm|m|km|mm|centimet\w*|met(?:re|er)\w*|unit\w*|ikaai\w*)(?![\p{L}])/giu, " ");
      const named = SHAPES.filter(([, re]) => re.test(xs)).map(([n]) => n);
      if (named.length && !named.includes(facts.shape) && !(facts.shape === "square" && named.includes("rectangle"))) return true;
    }
    if (facts.numbers?.length && POINT.test(x)) {
      // (SC1: a number that is a count — "4 hisse", "beech mein 3 nishaan" — is the counts' business, never this check's:
      // director5's false flags were counts the board drew but never wrote)
      const bare = COUNTED.reduce((acc, [, re]) => acc.replace(re, " "), x);
      const counted = countNumbers(facts.counts);
      // (a fraction that lands on what is drawn, a/b × D whole for the board's parts or gaps D, is the board's own: "1/2" over a
      // roti in 2, "1/4" over a line in eighths; director6's last 2 false flags)
      const units = facts.counts ? [facts.counts.parts, ...(facts.counts.lines ?? []).flatMap((l) => [l.gaps, l.gapsPerWhole])].filter((v) => typeof v === "number" && v > 0) : [];
      const onBoard = (n) => { const m = /^(\d+)\/(\d+)$/.exec(n); return !!m && Number(m[2]) > 0 && units.some((D) => Number.isInteger((Number(m[1]) * D) / Number(m[2]))); };
      const ns = (bare.match(/\d+(?:\/\d+)?/g) ?? []).filter((n) => !counted.includes(n) && !onBoard(n));
      if (ns.some((n) => !facts.numbers.some((m) => m === n || m.startsWith(`${n} `) || m.split(/[^\d/]+/).includes(n)))) return true;
    }
    return false;
  });
}
/** Did her line say the authored point (most of its content words; numbers all)? (dc-r7-script-walk-v3 V2) */
export function pointSaid(text, point) {
  const t = String(text ?? "").toLowerCase();
  const ws = (String(point ?? "").toLowerCase().match(/[\p{L}\p{N}/]+/gu) ?? []).filter((w) => w.length >= 3 || /\d/.test(w));
  if (!ws.length) return true;
  const nums = ws.filter((w) => /\d/.test(w));
  if (nums.some((n) => !new RegExp(`(?<![\\d/])${n.replace(/[/]/g, "\\/")}(?![\\d/])`).test(t))) return false;
  return ws.filter((w) => t.includes(w)).length / ws.length >= 0.7;
}
const REMEDY_FRAME = { hinglish: ["Chalo, ise ek naye tareeke se dekhte hain.", "Ek alag tarah se sochte hain.", "Isse aise samjho."],
  english: ["Let's look at it another way.", "Here is a different way to see it.", "Think of it like this."] };
export const skipRewriteOn = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_R7_SKIP_REWRITE ?? ""));
export const longTrimOn = (env = process.env) => /^(on|1|true)$/i.test(String(env.TAXILA_R7_LONG_TRIM ?? ""));
// round 7 T3 (dc-r7-teaching-scripts, the listening contract; kill switch TAXILA_R7_LISTEN=off)
export const listenOn = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_R7_LISTEN ?? ""));
/** A sentence that tells them their answer is not right (or not yet). */
export const NOT_RIGHT = /(?<![\p{L}])(?:nahi|nahin|nhi|nahiin|galat|not|wrong|almost|lagbhag|close|isn'?t|no|oops|chook|thoda\s+(?:sa\s+)?(?:alag|aur))(?![\p{L}])|नहीं|गलत/iu;
/** The code lead that corrects a wrong answer their line left uncorrected: names their answer when it was short. */
export function notRightLead(said, lang = "hinglish") {
  const x = String(said ?? "").replace(/[?？!.]+$/, "").trim();
  // v6 R5 (director8: "they are equal sahi nahi hai"): their words are said back only when they are a short answer with a
  // number, or one word; an English phrase in a Hinglish lesson is never echoed
  // (director9 c4 ×8: "Yes sahi nahi hai": a word of theirs is never said back, only a short answer with a number)
  const short = x && x.split(/\s+/).length <= 3 && (/\d/.test(x) || lang === "english") ? x : "";
  if (lang === "english") return short ? `Not quite, ${short} isn't it.` : "Not quite.";
  return short ? `${short} sahi nahi hai.` : "Nahi, yeh jawab nahi hai.";
}
/** Her line with the negation of their answer taken out ("Riya, 4 nahi—rectangle mein…" → "Riya, rectangle mein…"). */
export function withoutNegation(text, childText) {
  const said = String(childText ?? "").replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();
  if (!said) return String(text ?? "");
  return String(text ?? "").replace(negationOf(said), "").replace(/^\s*([,—–-]\s*)/, "").trim();
}
// round 7 (main's hybrid-pilot judgement #11): with no game on the screen, a game never acts ("Game ne 3 ko pehli side maana")
const GAME_ACTS = /\b(?:game|khel)\s+ne\b|\b(?:game|khel)\s+(?:mein|me|par|pe)\s+(?:dekho|dekhiye|tap|click|drag)\b|\bthe\s+game\s+(?:shows?|showed|counted|counts|took|says|said|marked|gave)\b|\bin\s+the\s+game\s+on\s+the\s+screen\b/i;
/** Does her line say a game did or showed something? */
export const gameActs = (t) => GAME_ACTS.test(String(t ?? ""));
export const withoutGameActs = (t) => (String(t ?? "").match(/[^.!?।]+[.!?।]*\s*/g) ?? []).filter((x) => !gameActs(x)).join("").trim();
// round 7 (main's full-run judgement #1, CRITICAL: "5?" got "haan, wahi sahi hai"; a game pick "3" got "Sahi, Riya—"): her
// words affirm only what the verified-key classifier graded correct THIS turn. A verdict word on any other answered turn is caught.
const AFFIRM_OPEN = /^\W*(?:[\p{L}]+\s*[,—–-]\s*)?(?:bilkul\s+sahi|ekdam\s+sahi|sahi|bilkul|correct|right|shabash|shaabaash|well\s+done|very\s+good|perfect|exactly|excellent)(?![\p{L}])(?!\s+(?:tarika|tareeka|jagah|jawab\s+kya|answer\s+kya|way|time))/iu;
const AFFIRM_ANY = /(?<![\p{L}])(?:(?:haan|ha|haa)[\s,]+(?:wahi|yahi|bilkul|ekdam)?\s*sahi|(?:wahi|yahi|ye|yeh|woh|tumhara|aapka|your|that'?s|that\s+is|you'?re|you\s+are)\s+(?:bilkul\s+|ekdam\s+|absolutely\s+)?(?:sahi|correct|right)(?:\s+(?:hai|jawab|answer))?|(?:tumne|aapne|you)\s+(?:bilkul\s+|ekdam\s+)?(?:sahi|correct|right)\s+(?:kaha|bola|bataya|socha|got|said)|sahi\s+jawab(?!\s+kya))(?![\p{L}])/iu;
/** Does her line affirm their answer (a verdict word)? */
export const affirmsAnswer = (t) => AFFIRM_OPEN.test(String(t ?? "")) || AFFIRM_ANY.test(String(t ?? ""));
/** Her line without the verdict: the opener goes, a sentence that affirms elsewhere goes whole. */
export function withoutAffirm(t) {
  const m = String(t ?? "").match(AFFIRM_OPEN);
  let out = m ? String(t).slice(m[0].length).replace(/^[\s,.!—–-]+/, "") : String(t ?? "");
  out = (out.match(/[^.!?।]+[.!?।]*\s*/g) ?? []).filter((x) => !AFFIRM_ANY.test(x)).join("").trim();
  return out ? out[0].toUpperCase() + out.slice(1) : "";
}
// round 7 (full-run judgement #2): is a card English (no form in the lesson's language)? English function words outnumber
// Hindi ones, at least three of them ("1/3 means 1 of ___ equal groups", "Check: 2/5 is ___ the middle, because …").
const EN_FN = new Set(["the", "is", "are", "of", "to", "a", "an", "what", "which", "how", "many", "much", "does", "do", "means", "mean", "fill", "gap",
  "check", "because", "than", "less", "more", "equal", "groups", "between", "find", "write", "each", "and", "in", "on", "it", "this", "that", "for",
  "with", "by", "far", "run", "rounds", "she", "he", "they", "you", "your", "next", "step", "answer", "pick", "choose", "true", "false", "into", "share",
  "so", "gets", "get", "make", "makes", "count", "from", "mark", "gaps", "there", "has", "have", "its"]);
const HI_FN = new Set(["hai", "hain", "ka", "ki", "ke", "ko", "mein", "me", "kya", "kitne", "kitna", "kitni", "kaun", "kaunsa", "kaunsi", "se", "aur",
  "karo", "bharo", "batao", "bataiye", "ye", "yeh", "wo", "woh", "hota", "hoti", "hote", "kaise", "kyun", "jagah", "khaali", "liye", "par"]);
export function looksEnglish(t) {
  // (the faded card's own Hinglish prefix is not the line: "Khaali jagah bharo: 1/3 means 1 of ___ equal groups")
  const line = String(t ?? "").replace(/^\s*(?:khaali\s+jagah\s+bharo|ab\s+aage\s+kya\s+karenge\??)\s*:?\s*/i, "");
  const w = line.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  let en = 0, hi = 0;
  for (const x of w) { if (EN_FN.has(x)) en++; if (HI_FN.has(x)) hi++; }
  return en >= 3 && en > 2 * hi;
}
/** Does her line read the card (five or more of its words in a row)? */
export function readsCard(t, card) {
  const norm = (x) => String(x ?? "").toLowerCase().replace(/[^\p{L}\p{N}_ ]+/gu, " ").split(/\s+/).filter(Boolean);
  const c = norm(card), said = ` ${norm(t).join(" ")} `;
  for (let i = 0; i + 5 <= c.length; i++) if (said.includes(` ${c.slice(i, i + 5).join(" ")} `)) return true;
  return false;
}
// round 7 (main's full-run judgement #6: at class 6, "Rectangle mein kitni sides hoti hain?" and "count the sides" four times):
// remediation stays at the class's level. From class 4 up: no counting-on and no bare single-digit sum of her own; from
// class 5 up: no asking how many sides a shape has.
const LEVEL_COUNT_ON = /\b(?:kadam\s+aage|aage\s+(?:teen|do|ek|chaar|paanch|\d+)?\s*gin|ungli(?:yon)?\s+(?:pe|par|se|ke\s+baad)|on\s+your\s+fingers|count\s+(?:on|up)\s+(?:from|by)|ek\s+ek\s+karke\s+gin)/i;
const LEVEL_TINY_SUM = /(?<![\p{N}.])(?<!(?:\+|plus|jama|aur)\s*)[1-9]\s*(?:\+|plus|jama)\s*[1-9](?![\p{N}.])(?!\s*(?:\+|plus|jama)\s*\d)[^.?!।]*\?/iu;
const LEVEL_SIDES = /\b(?:kitni|kitne)\s+(?:sides|bhuja(?:yein|en)?|kinare|kone|corners)\s+(?:hoti|hote|hai|hain)|\bhow\s+many\s+(?:sides|corners)\b|\bcount\s+the\s+(?:sides|corners)\b|\b(?:sides|bhujaayein)\s+gino\b/i;
/** Is her line below the class's level? */
// rate read as a fraction (director3 c5: "5 balls mein 2 runs = 2/5"): a "per" quantity is never a part of a whole
// (also "5 balls mein 2 runs, score hua 2/5": the fraction a few words after the rate)
const RATE_AS_FRACTION = /\b\d+\s+\p{L}+\s+(?:mein|me|in|per)\s+\d+\s+\p{L}+[^.?!।]{0,30}?\d+\s*\/\s*\d+/iu;
/** Does a text read a rate ("N balls mein M runs") as a fraction? (director3 c5) */
export const rateAsFraction = (t) => RATE_AS_FRACTION.test(String(t ?? ""));
// (director3 c6: "chaar bhujayein hoti hain. Ab ginein: ek, do, teen, chaar") counting one by one aloud, or asking to count them
const LEVEL_COUNT_SEQ = /\b(?:ek|one)\W+(?:do|two)\W+(?:teen|three)\b|\b(?:sides|bhuja\p{L}*|kinare|kone)\b[^.?!।]{0,30}\bgin(?:o|ein|en|enge|iye|te\s+hain)\b|\bgin(?:o|ein|en|enge|iye)\b[^.?!।]{0,30}\b(?:sides|bhuja\p{L}*|kinare|kone)\b/iu;
export function belowLevel(t, classLevel, kitText = "") {
  const c = Number(classLevel);
  if (!(c >= 4)) return false;
  if (LEVEL_COUNT_ON.test(t)) return true;
  if (c >= 5 && LEVEL_COUNT_SEQ.test(t)) return true;
  const m = String(t).match(LEVEL_TINY_SUM);
  if (m && !String(kitText).includes(m[0].replace(/\s+/g, " ").slice(0, 5))) return true;
  return c >= 5 && LEVEL_SIDES.test(t);
}
// round 7 (full-run judgement #5: "5 barabar gaps mein baanto. Kitne gaps?"): her closing question never asks for what her line
// just said
export function answerInQuestion(t) {
  const sents = String(t ?? "").match(/[^.!?।]+[.!?।]*/g) ?? [];
  const q = sents.at(-1) ?? "";
  if (!/[?？]/.test(q)) return false;
  const m = q.match(/(?:kitne|kitni|kitna|how\s+many)\s+(?:barabar\s+)?(\p{L}{3,})/iu);
  if (!m) return false;
  const noun = m[1].toLowerCase().replace(/(?:on|en|ein|s)$/, "");
  // (the count must be one her line SET, "5 barabar gaps" / "3 equal parts" / "4 hisson mein baanto": a quantity in a story,
  // "12 mangoes … kitne mangoes milenge?", asks for a result the line never stated)
  return sents.slice(0, -1).some((x) => new RegExp(`(?<![\\p{L}])\\d+\\s+(?:barabar|equal)\\s+${noun}`, "iu").test(x)
    || (new RegExp(`(?<![\\p{L}])\\d+\\s+${noun}`, "iu").test(x) && /\b(?:baant|baanto|baato|divide|kaato|cut\s+into|mein\s+baan)/i.test(x)));
}
// round 7 (full-run judgement #5: "3 × 160 = ___" when 160 was never derived): on a faded or step-check card, a number of the
// card that the problem never gave is one an earlier step made: her line says where it came from before the card
export function underived(t, item, problem) {
  if (!item || !(item.fade || item.stepCheck)) return null;
  const card = String(item.prompt_en ?? "");
  const given = new Set(String(problem ?? "").match(/\d+(?:\.\d+)?/g) ?? []);
  const nums = (card.match(/\d+(?:\.\d+)?/g) ?? []).filter((n) => !given.has(n) && Number(n) >= 10);
  if (!nums.length) return null;
  // (her line without the gap sentence itself: the card carries the number, so it proves nothing)
  const lead = (String(t ?? "").match(/[^.!?।]+[.!?।]*/g) ?? []).filter((x) => !/_{2,}/.test(x)).join(" ");
  return nums.find((n) => !new RegExp(`(?<![\\d.])${n.replace(".", "\\.")}(?![\\d])`).test(lead)) ?? null;
}
/**
 * round 7 (director2: "Tum bharo… 3 × 160" kept 160 underived after the rewrite): the worked example's own step that made the
 * number, as a code lead ("Pehle dekho: 2 × (50 + 30) = 2 × 80 = 160."): the calculation only, never the step's English words.
 * null when no step of the kit states it.
 */
export function derivationLead(n, workedExample, lang) {
  if (!n) return null;
  for (const st of workedExample?.steps ?? []) {
    const m = String(st).match(new RegExp(`([\\d(][\\d\\s×x*+\\-−/().=]*=\\s*${n.replace(".", "\\.")})(?![\\d.])`));
    if (m) return `${lang === "english" ? "First:" : "Pehle dekho:"} ${m[1].replace(/\s+/g, " ").trim()}.`;
  }
  return null;
}
/** round 7 (director2: "7" got only "Tum bharo"): a bare number the line passed over is said back first. Code words only. */
// (main's S6 verdict: one fixed lead said the same way every lesson is a tic) each code lead has a few forms, picked by lesson seed and turn
const IGNORED_LEAD = { english: [(n) => `You said ${n}. Let's check it together.`, (n) => `${n}, you said. Let's see if it fits.`, (n) => `Okay, ${n}. Let's test that.`],
  hinglish: [(n) => `Tumne ${n} kaha. Chalo, ise saath mein check karte hain.`, (n) => `${n}? Achha, dekhte hain yeh baithta hai ya nahi.`, (n) => `${n} bola tumne. Ek baar milake dekhte hain.`] };
export const pickOf = (xs, state) => xs[(((state?.seed ?? 0) >>> 0) + (state?.turn ?? 0)) % xs.length];
export const ignoredLead = (n, lang, state = null) => pickOf(IGNORED_LEAD[lang === "english" ? "english" : "hinglish"], state)(n);
/** round 7 (director2 c6: "tumne 160 ko 3 se multiply karne ke bajay 3 plus 3 kiya" on a plain "6"): HOW they went wrong, said
 * when no misconception was matched, is a guess about the child: those sentences go. */
const DIAGNOSIS = /\b(?:tumne|aapne|you)\b[^.!?।]{0,80}\b(?:ke\s+bajay|ke\s+bajaye|ki\s+jagah|instead\s+of)\b/i;
export const madeUpDiagnosis = (t) => sentences(t).some((x) => DIAGNOSIS.test(x));
export const withoutDiagnosis = (t) => sentences(t).filter((x) => !DIAGNOSIS.test(x)).join(" ").trim();
/** round 7 (director2 c6: "Ab ginें"): a Roman word carrying Devanagari vowel signs is written out in Roman. */
const MATRA = { "\u093E": "a", "\u093F": "i", "\u0940": "i", "\u0941": "u", "\u0942": "u", "\u0947": "e", "\u0948": "ai", "\u094B": "o", "\u094C": "au", "\u0902": "n", "\u0901": "n", "\u0947\u0902": "ein", "\u094B\u0902": "on", "\u093E\u0902": "aan", "\u0940\u0902": "een" };
export const unmixWords = (t) => String(t ?? "").replace(/(\p{Script=Latin}+)([\u0900-\u0903\u093A-\u094F]+)/gu, (_, w, m) => w + (MATRA[m] ?? [...m].map((c) => MATRA[c] ?? "").join("")));
/** round 7 (director2 c6 steering: "picture ko words mein dekho" twice): "see it in words" is never said; she has them imagine it. */
// (main, director2: "kalpana karo" / "imagine" is the same failure: a picture asked, words given) the phrase goes, never a stand-in
const IN_WORDS = /\b(?:(?:picture|tasveer|photo|diagram)\s+ko\s+)?words\s+mein\s+(?:dekho|dekhte\s+hain|samjho|socho)\b\s*[:,—-]?\s*|\b(?:see|picture)\s+it\s+in\s+words\b\s*[:,—-]?\s*|\b(?:kalpana\s+karo|imagine(?:\s+it)?|man\s+mein\s+socho)\b\s*[:,—-]?\s*/gi;
export const withoutInWords = (t) => String(t ?? "").replace(IN_WORDS, "").replace(/,\s*([.!?])/g, "$1").replace(/(^|[.!?]\s+)(\p{Ll})/gu, (_, a, c) => a + c.toUpperCase()).replace(/\s{2,}/g, " ").trim();
const PARK_STOP = new Set(["mujhe", "baare", "mein", "baat", "karni", "karte", "hain", "about", "talk", "want", "pasand", "chahiye", "kuch"]);
/** A fixed line with content for a turn with no card: the move's rendered lines, else the worked example's opening, in code. */
function contentFallback(state, kit, lang) {
  // (dc-r7-script-walk-v3 G2: while a script is walked the kit's worked example never speaks; the beat's own lines or its point)
  if (state.lastMove?.scriptBeat && !state.lastMove?.rendered?.length) return state.lastMove?.point ?? null;
  const lines = state.lastMove?.rendered?.length ? state.lastMove.rendered : renderWorked(kit?.workedExample, { part: 1, parts: 2, lang: lang === "english" ? "english" : "hinglish" });
  if (!lines?.length) return null;
  return [pickOf(WORKED_FRAME_PART[lang === "english" ? "english" : "hinglish"], state), ...lines.slice(0, 2), pickOf(WORKED_ASK[lang === "english" ? "english" : "hinglish"], state)].join(" ");
}
export const withoutNotHeard = (t) => (String(t ?? "").match(/[^.!?।]+[.!?।]*\s*/g) ?? []).filter((x) => !claimsNotHeard(x)).join("").trim();
/** The copy a reply-side model call reads: scrubbed, and the Hindi number "teen" as 3 (safety.js filterSafe). */
export const forModel = (t) => filterSafe(scrubbed(t));

/** The reply model call, injectable for tests of the guards (tests/lesson-truth.test.mjs); production uses azure.js. */
export const replyDeps = { chat, chatStream };

/**
 * round 5 (sim lab p43, main safety review): do the CHILD'S OWN WORDS trip the content filter? The reply prompt carries the
 * system brief, her earlier lines and the history as well, and a harm category can fire on that mix: the reply prompt for
 * "6 aur 5... 30... 3,00,000?" came back `sexual` (TEST lesson 2af743d2, turn 4) while the classifier and the labeller
 * passed the same words, and the child got the helpline script. The probe sends the child's recent words alone (masked as
 * the reply saw them, joined so a disclosure spread over several turns is judged whole) through the reply deployment, so
 * the same filter policy judges them. "harm": a harm or unreadable block; "clear": passed (or only an injection / copyright
 * detector fired); "unknown": the probe itself failed, which the caller treats as harm (it could not be cleared).
 * @returns {Promise<"harm"|"clear"|"unknown">}
 */
export async function childWordsTrip(words, { trace } = {}) {
  if (!words) return "clear";
  try {
    await replyDeps.chat(DEPLOY.reply, [{ role: "system", content: "Answer with one word: ok" }, { role: "user", content: words }],
      { maxTokens: 16, effort: "none", timeoutMs: 4000, retries: 1, trace, purpose: "filter_probe" });
    return "clear";
  } catch (e) {
    // 14.4: a block by the hate detectors alone is no child-safety signal (azure.js notChildSafety)
    if (isContentFilter(e)) return notChildSafety(e) ? "clear" : "harm";
    return "unknown";
  }
}

/** The child's words a filter probe judges: their last few turns and this one, masked, newest last. */
export const probeWords = (history, childText) =>
  [...history.filter((t) => t.who !== "teacher").slice(-4).map((t) => t.text), childText].filter((t) => typeof t === "string" && t.trim()).map(forModel).join("\n");

/**
 * 14.4.3: a sentence that hands a sum to the child ("total kitna?", "50 plus 30 kijiye", "how many metres?"): a question
 * or an instruction to them, with a working-out cue. "Agla step dekhein?" is not one.
 */
const COMPUTE_CUE = /(?<![\p{L}])(?:kitn[aeiā]|how\s+(?:many|much|far|long)|what\s+is|total|jod|jodo|jodiye|jodkar|plus|minus|guna|times|ghata|bhaag|divide|multiply|add|subtract|nikal\p{L}*|calculate|work\s+out|kya\s+(?:hoga|milega|aayega|aata))(?![\p{L}])|[+×÷=]|\d\s*[-x*]\s*\d/iu;
const TO_THEM = /[?？]\s*$|(?<![\p{L}])(?:batao|bataao|bataiye|boliye|bolo|kijiye|karo|kariye|nikalo|nikaliye|socho|sochiye|tell\s+me|try)\s*[.!।]?\s*$/iu;
/**
 * 14.4.3 (sim lab 6da8f599 p30 r3 #7): the card's choices listed in her text-lane line, where they are the buttons. → how
 * many of `item`'s option texts the reply names (its first 25 characters, the label a chip shows).
 */
const optionHead = (o) => String(o?.text ?? "").replace(/\s+/g, " ").trim().slice(0, 25).toLowerCase();
export const optionsNamed = (text, item) => (item?.diagnostic ? item.options.filter((o) => optionHead(o).length >= 4 && String(text).replace(/\s+/g, " ").toLowerCase().includes(optionHead(o))).length : 0);
/** The reply with each option text taken out, and the list scaffolding around it (a bullet, "1)", "A.", " ya ", " or "). */
export function withoutOptions(text, item) {
  let out = String(text ?? "").replace(/\s+/g, " ");
  for (const o of item?.options ?? []) {
    const t = String(o.text ?? "").replace(/\s+/g, " ").trim();
    if (t.length < 4) continue;
    const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(?:\\s*(?:[-•*]|\\(?[a-d1-4][).]))?\\s*${esc}[.,;]?(?:\\s+(?:ya|or)(?=\\s))?`, "giu"), " ");
  }
  return out.replace(/\s+(?:ya|or)\s+(?=[.?!]|$)/giu, " ").replace(/\s{2,}/g, " ").replace(/\s+([.,?!])/g, "$1").replace(/^[\s?.,;!—-]+/, "").trim();
}
/**
 * 14.4.3 (QA on ac4e8e88, 905a3e50 / b28d919f: the worked example shown whole but with a park of her own, 6 m by 4 m): on a
 * worked-example move every number she states is the kit's worked example's, the move's content's or the child's own
 * (0-2 are words like "do baar"). → the numbers of `text` that none of those carry.
 */
const NUMS = /\d+(?:[.,]\d+)*(?!\d|(?:d|st|nd|rd|th)\b)/giu;
const numsOf = (t) => new Set((String(t ?? "").match(NUMS) ?? []).map((n) => n.replace(/,/g, "")));
export function foreignNumbers(text, { kit, content = [], childText = "" } = {}) {
  const we = kit?.workedExample;
  const base = numsOf([we?.problem, ...(we?.steps ?? []), ...content.filter((l) => typeof l === "string"), childText].join(" "));
  // a number worked out from two of them (2 kg → 2000 g, 50 + 30), a unit's 10 / 100 / 1000, and a 0-led group read out
  // of one of them ("1 lakh, 07 thousand, 040") are the example's own too
  // (two DIFFERENT numbers of the example, each 3 or more: "6 m by 4 m" is never 3 + 3 or 2 + 2)
  const vals = [...base].map(Number).filter(Number.isFinite).slice(0, 40);
  const ok = new Set([...base, "0", "1", "2", "10", "100", "1000"]);
  const add = (v) => { if (Number.isFinite(v) && v >= 0) ok.add(String(Math.round(v * 1000) / 1000)); };
  for (const a of vals) for (const k of [10, 100, 1000]) { add(a * k); add(a / k); }
  for (const a of vals) for (const b of vals) if (a !== b && a >= 3 && b >= 3) { add(a + b); add(a - b); add(a * b); add(a / b); }
  return [...numsOf(text)].filter((n) => !ok.has(String(Number(n))) && !(n.startsWith("0") && [...base].some((x) => x.includes(n))));
}
export const asksToCompute = (x) => TO_THEM.test(String(x).trim()) && COMPUTE_CUE.test(String(x));

/** Keep whole sentences up to `max` words (last-resort guard after one rewrite failed). */
export function trimToWords(text, max) {
  const parts = p5Flag("GUARDS") ? sentences(text) : String(text).match(/[^.!?।]+[.!?।]*\s*/g) ?? [text];
  let out = "";
  for (const s of parts.length ? parts : [text]) {
    if (words(out + s) > max) break;
    out += s;
  }
  return (out || String(text).split(/\s+/).slice(0, max).join(" ") + "…").trim();
}

/** Moves whose turn must put the active item's question to the child (at rung 0, before any nudge). */
export const POSING_MOVES = new Set(["practice", "probe", "retrieval", "greet"]);
/** Moves that end the exchange or hold it; every other turn must hand the floor back. */
export const CLOSING_MOVES = new Set(["wrap", "safeguard"]);
/**
 * Teaching turns with no item on the table: what they say must not answer the question that comes next
 * (measured in evals/director-sim.mjs: an explain turn said "use one-fourth kehte hain", and the next item,
 * "Ek tukde ko kya kehte hain?", was scored as an unaided correct answer).
 */
export const TEACHING_MOVES = new Set(["hook", "explain", "worked_example", "reteach"]);
/**
 * Scripts a written reply may use: Roman for Hinglish/English (the compiled rule asks for it), Roman or
 * Devanagari for Hindi. Measured in evals/director-sim.mjs: a stray Gujarati word and Devanagari fragments
 * inside Roman Hinglish both reached the child before this check.
 */
// F18 (evals/owner-truth s09 t17): `\p{M}` accepted ANY script's combining marks, so Gujarati vowel signs (U+0A82,
// U+0AC7) passed as "Latin". Script=Inherited is the shared combining set (accents on Latin); a script's own marks belong
// to that script (Devanagari's to Devanagari, allowed only for Hindi).
const LATIN = /^[\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]*$/u;
const SCRIPT_OK = { hinglish: LATIN, english: LATIN, hindi: /^[\p{Script=Latin}\p{Script=Devanagari}\p{Script=Common}\p{Script=Inherited}]*$/u };
const OFF_SCRIPT = { hinglish: /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/gu, english: /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/gu,
  hindi: /[^\p{Script=Latin}\p{Script=Devanagari}\p{Script=Common}\p{Script=Inherited}]/gu };
/** Is a written reply in the scripts its language allows? Exported for tests. */
export const scriptOk = (t, lang) => (SCRIPT_OK[lang] ?? LATIN).test(String(t ?? ""));
/**
 * round 7 (PIPELINE §A Brain "rewrite, never strip"; open-e2e-gutted-replies: a reply stripped to "ने?"): the turn without
 * its sentences in a script the language does not allow. Whole sentences go, never single letters out of a word. Exported.
 */
export const withoutOffScript = (t, lang) => (p5Flag("GUARDS") ? sentences(t) : String(t ?? "").match(/[^.!?।]+[.!?।]*\s*/g) ?? [])
  .map((x) => String(x).trim()).filter((x) => x && scriptOk(x, lang)).join(" ").trim();
/** A reply the repairs left as a fragment (fewer than four words), unless it is exactly the pinned question. Exported. */
export const isFragment = (t, askEnd = null) => {
  const r = String(t ?? "").trim();
  return !(askEnd && r === String(askEnd).trim()) && words(r) < 4;
};

/**
 * What the child reads when no reply could be written (the model failed twice): content where there is
 * some — the question on the table — else a fixed line for the move. Never a throw after the turn's
 * evidence is decided: the lesson goes on. The safeguard line carries the helpline (the floor's contract).
 */
/** Both crisis lines, from the one source (compiler/floor.js HELPLINES; the floor and V2 §16 name them together). */
const HELPLINE_LINE = HELPLINES.map((h) => `${h.name} ${h.number}`).join(" or ");
const HELPLINE_LINE_HI = HELPLINES.map((h) => `${h.name} ${h.number}`).join(" ya ");
export const FALLBACK = {
  english: { wrap: "That's all for today. See you next time!", safeguard: `What you said matters. Please tell a grown-up you trust, or call ${HELPLINE_LINE}. Are you okay right now?`,
    safeguardCheck: `Are you okay right now? If anything is worrying you, tell a grown-up you trust, or call ${HELPLINE_LINE}.`,
    // round 7 (PIPELINE §A Brain "zero spoken failure"): a plain re-ask, never "I lost my words"
    other: "Tell me that once more? I'm listening.",
    heard: "Thanks for telling me! Let's keep going.",
    // round 7 (main's full-run judgement #9): a heard "pata nahi" is a stuck signal: help, never "say that again"
    stuck: "That's okay. Let's take it one small step together.",
    checkinStop: "That's okay. We can keep going, take a short break, or stop for today. You choose.",
    checkinRel: "That's okay, stopping is completely fine. Are you okay right now, and is a grown-up nearby?",
    forgetSafety: "That is not something to forget, because your safety matters. You did the right thing by telling. Please tell a grown-up you trust, so they can help." },
  hinglish: { wrap: "Aaj ke liye itna hi. Phir milte hain!", safeguard: `Tumne jo bataya, woh zaroori hai. Kisi bade ko batao jis par bharosa ho, ya ${HELPLINE_LINE_HI} pe call karo. Kya tum abhi theek ho?`,
    safeguardCheck: `Kya tum abhi theek ho? Agar koi baat pareshan kar rahi hai, toh kisi bade ko batao jis par bharosa ho, ya ${HELPLINE_LINE_HI} pe call karo.`,
    other: "Ek baar phir se batao, kya kaha tumne?",
    heard: "Accha, batane ke liye thanks! Chalo, aage badhte hain.",
    stuck: "Koi baat nahi. Chalo, isko ek chhote step mein saath mein dekhte hain.",
    checkinStop: "Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.",
    checkinRel: "Theek hai, rukna bilkul theek hai. Kya tum abhi theek ho, aur koi bada paas hai?",
    forgetSafety: "Isse bhoolna theek nahi hoga, kyunki tumhari safety zaroori hai. Tumne batakar bilkul sahi kiya. Kisi bade ko zaroor batao jis par tumhe bharosa ho, taaki woh tumhari madad kar sakein." },
};
// round 2 safety floor (adversarial B2, 2026-10-07): a stop check-in is an OFFER to stop, never a teaching turn. Before
// this it was guarded as one: her honest "aaj ke liye yahin rok dete hain" tripped the goodbye check ("wrap"), the rewrite
// note said "the lesson goes on … end with one question about the same thing", stripWrap cut the stop option, and the child
// who said "bas, aaj ke liye itna hi" heard "ab isi jagah se continue karte hain — 1 kg mein kitne grams…?" (w2flow-walk
// pass 2; reproduced without a model). A check-in now must name the stop option and must not ask a lesson question or
// hold them for "one more"; what cannot be rewritten clean is the fixed check-in line below, never the lesson's question.
// round 3 fix (adversarial B5): on a forget request after a disclosure (relational overlay forget_after_safety) her line never
// promises to forget it or keep it secret (the incident row and the hand-off stand, so the promise would be false). PURE.
const FORGET_PROMISE = /(?<![\p{L}])(?:i(?:'ll| will| can| am going to)? (?:forget|not remember|keep (?:it|this|that|your secret)(?: a)? secret)|i won'?t (?:remember|keep|tell|say)|(?:it'?s|it is|this is|that'?s|that is) (?:our|a|just our) secret|(?:our|a) little secret|forgotten|between (?:us|you and me)|nobody will know|no one will know|bhool (?:jaung[ia]|jaunga|jaungi|jaati|jaata|gayi|gaya|chuk[ia]|chuke|di|diya|dungi|dunga)|bhula (?:dungi|dunga|diya|di|deti|deta)|yaad nahi\s+rakh(?:ungi|unga|ti|ta|enge|oongi)|nahi\s+rakh(?:ungi|unga|oongi|enge)|kisi ko (?:nahi|nahin|na) bata(?:ungi|unga|oongi|yenge|enge|aungi|aunga)|(?:raaz|raz|secret) (?:rakh(?:ungi|unga|enge|te|ti)?|rahega|rahegi|hai)|hamara (?:raaz|secret)|mita (?:diya|di|dungi|dunga|deti|deta)|भूल (?:जाऊँगी|जाऊंगी|जाऊँगा|जाऊंगा|गई|गया)|याद नहीं रखूँगी|याद नहीं रखूंगी|किसी को नहीं बताऊँगी|किसी को नहीं बताऊंगी|राज़|राज)(?![\p{L}])/iu;
export const promisesForget = (t) => FORGET_PROMISE.test(String(t ?? ""));

/** The child's options include stopping (Roman Hinglish / English / Devanagari). */
const STOP_OFFER = /(?<![\p{L}])(?:rok|rukna|ruk|ruke|rukte|rukenge|stop|stopping|bas|band|khatam|khatm|chhutti|for today|aaj ke liye|end (?:here|now|for today))|रोक|रुक|बस|बंद|ख़?त्म|आज के लिए/iu;
/** "One more / a last / first a small check" — holding a child who asked to stop (NEVER MANIPULATE). */
const HOLD_WORDS = /(?<![\p{L}])(?:(?:pehle|first|before (?:you go|we stop|stopping))\b[^.?!।]{0,30}\b(?:check|question|sawal|sawaal|sum|try)|(?:last|aakhri|akhri|one more|ek aur|bas ek)\s+(?:chhota\s+sa\s+|small\s+|quick\s+|little\s+)?(?:check|question|sawal|sawaal|sum|try|problem))/iu;
/** A check-in's words: what is wrong with them (none: an honest offer of the three choices). Exported for tests. */
export function checkInProblems(t, { kind = "stop", active = null, lang = "hinglish" } = {}) {
  const text = String(t ?? "");
  const out = [];
  const asksLesson = (active && (text.includes(promptFor(active, lang)) || posesItem(text, active, lang)))
    || (String(text).match(/[^.!?।]*[?？]/g) ?? []).some((q) => /\d/.test(q)) || HOLD_WORDS.test(text);
  if (asksLesson) out.push("hold");
  if (!STOP_OFFER.test(text)) out.push("nostop");
  // round 3 (conversation; local battery base-head-1, "end the lesson"): "Okay, Meher. We'll stop the lesson here." named
  // the stop and offered nothing else, and the child's "yes" then got "Lesson ended … <a question>". A stop check-in is a
  // CHOICE: going on (or a break) is offered as well. (The relational check-in "rel" only has to say stopping is fine.)
  if (kind === "stop" && p5Flag("R3CONV") && !GO_ON_OFFER.test(text)) out.push("nochoice");
  // round 3 integration (owner-3 on the integrated local tree, 2026-10-09, 2 of 10 stop phrases): the R3 say-back "in their
  // words" turned "lesson khatam" into "Theek hai Aarav, aap lesson khatam karna chahte hain—keep going, …": goodbye words
  // on a turn that goes on (F9 mixed signal; owner-3 RX.wrapWords). A stop check-in carries none of the owner's goodbye
  // words; the check-in's own rewrite ("offer stopping as one of the choices, not as a goodbye"), then the fixed line, apply.
  if (kind === "stop" && p5Flag("R3CONV") && CHECKIN_GOODBYE.test(text)) out.push("wrap");
  return out;
}
/** The owner-3 acceptance's goodbye words (tests/prod/_owner.mjs RX.wrapWords), read on a stop check-in only. */
const CHECKIN_GOODBYE = /\b(?:aaj ke liye (?:bas )?(?:itna|yahin)|lesson (?:yahin )?(?:khatam|khatm)|phir milenge|phir milte hain|goodbye|bye[\s-]*bye|see you|that'?s all for today|let'?s stop (?:here|for today)|yahin rok(?:te| dete) hain)\b/i;
/** The child's options include going on or a short break (Roman Hinglish / English / Devanagari). */
const GO_ON_OFFER = /(?<![\p{L}])(?:continue|keep\s+going|carry\s+on|go\s+on|aage|chalte\s+rah|jaari|padhte\s+rah|karte\s+rah|break|pause|aaram|thoda\s+ruk)|आगे|जारी|ब्रेक/iu;
/**
 * The fixed safeguarding line (both helplines) in the child's language mode and address form: W2-I's vetted opening
 * (server/relational/openings.js, identical to the client's src/lesson/safetyStrings.ts) and then one check-in question.
 */
const CHECK_Q = { en: "Are you safe right now?", hinglish: { tum: "Kya tum abhi safe ho?", aap: "Kya aap abhi safe hain?" }, hi: { tum: "क्या तुम अभी सुरक्षित हो?", aap: "क्या आप अभी सुरक्षित हैं?" } };
/**
 * F10 (evals/owner-truth patch 05, reconciled with W2-I's openings): a fallback safeguard line whose trigger was ONLY the
 * classifier model or the content filter ("I'm done" read as distress) gets the neutral check-in wording, never "what you
 * said matters". Every other trigger (the predicate's families, the relational floor, an unknown/legacy state) keeps the
 * vetted disclosure opening. W2-I's CHECK opening (openings.js) names Childline only, and a fallback line must name both
 * helplines (tests/lesson-truth "safeguard fallback names ... Tele-MANAS 14416"), so the check form is patch 05's
 * two-helpline line; Devanagari has no vetted two-helpline check line yet, so it keeps the disclosure opening.
 * Wording only: the predicate, the hold and the helplines are unchanged.
 */
const CHECK_ONLY_KINDS = new Set(["model", "content_filter"]);
/**
 * 14.4 (main safety review; QA TEST bfb56c4f t1 "ye sawaal mujhe maar dalega": no detector read distress, yet the reteach
 * line asked "kya aap khud ko nuksan pahunchane ki baat kar rahe hain?" and gave 1098 / 14416; f3ebe9b0 and e35b9ea0 the
 * same shape, the second inside a check-in): the REPLY MODEL never makes the safeguarding call. The tier is the Director's
 * (state.js checkTier on the predicate, the reads and the floor); a reply that names a helpline or asks about hurting
 * themself on a turn that is not the full script, in a lesson with no full script yet, is a problem ("harmtalk"):
 * rewritten, else the move's fixed line.
 */
const HARM_TALK = /(?<![\p{L}\p{M}\p{N}])(?:child ?line|tele[\s-]?manas|1098|14416|help ?line|चाइल्डलाइन|टेली[\s-]?मानस|हेल्पलाइन|suicid\w*|aatm ?hatya|atmhatya|आत्महत्या)(?![\p{L}\p{M}\p{N}])|(?<![\p{L}\p{M}])(?:khud|apne ?(?:aap|ap)|apne|खुद|अपने ?आप)\s*(?:ko|को)\s+(?:\S+\s+){0,1}(?:nuksan|nuksaan|nukasan|nuqsan|nuqsaan|harm|maar|maarne|kill|नुकसान|नुक़सान|मारने)|(?<![\p{L}\p{M}])(?:khud|apne ?(?:aap|ap)|खुद|अपने ?आप)\s*(?:ko|को)\s+(?:hurt|chot|चोट|हर्ट)\s+(?:pahunchane|pahuchane|pohnchane|karne|dene|पहुंचाने|पहुँचाने|करने)|(?<![\p{L}\p{M}])(?:apni|अपनी)\s+(?:jaan|जान)\s+(?:lene|dene|लेने|देने)|self[\s-]?harm|(?<![\p{L}\p{M}])(?:aap|tum|tu|आप|तुम)\s+(?:abhi\s+|ghar\s+(?:par|pe|mein|me)\s+|अभी\s+)?(?:safe|surakshit|सेफ|सुरक्षित)\s+(?:hain|ho|hai|hoon|mehsoos|feel|हैं|हो)|(?:are|do)\s+you\s+(?:feel(?:ing)?\s+)?safe\b|(?:want|wanting|wanted|thinking|thought|think|feel like|feeling like|plan\w*|try\w*)\s+(?:of\s+|about\s+|to\s+)?(?:hurt|harm|kill)(?:ing)?\s+yourself|(?:harm|kill)(?:ing)?\s+yourself|(?:marne|mar jaane|khatam karne|jaan dene)\s+(?:ka|ke|ki)\s+(?:khayal|khyal|vichar|soch|mann|man|baat|baatein|baaten)|(?<![\p{L}\p{M}])(?:nuksan|nuksaan|nukasan|nuqsan|nuqsaan|hurt|harm|chot|नुकसान|नुक़सान|चोट)\s+(?:pahunchane|pahuchane|pohnchane|karne|dene|पहुंचाने|पहुँचाने|करने)\s+(?:ka|ke|ki|का|के|की)\s+(?:khayal|khyal|vichar|soch|irada|ख़याल|खयाल|ख्याल|विचार)|(?:ghar|घर)\s+(?:mein|me|pe|par|में|पर)\s+(?:kisi|koi|किसी|कोई)\s+(?:se\s+|से\s+)?(?:dar|darr|hurt|maar|डर)/iu;
export const harmTalk = (text) => HARM_TALK.test(String(text ?? ""));
/** 14.4.1: the child's turn when their words could not be shown to the reply model (a context filter block): a note, never a line */
const MASKED_TURN = "(their reply is not shown here: no guessing at it and no quoting it; a warm thanks in a few words, then carry on with the move)";
/** A child line the predicate's idiom checks read as the lesson's own pressure, said as what it means (the reply's history only). */
export const idiomMeaning = (text) => (lessonHyperbole(String(text ?? "")) ? "(they said the studying feels like too much for them)"
  : lessonIdiom(String(text ?? "")) ? "(they said this question is too hard for them)" : null);
/** May a reply on this (next) state carry safety talk of its own? Only the full script's turns, or once one has happened. */
export const safetyTalkAllowed = (state) => state?.safeguardedAt != null
  || (state?.lastMove?.kind === "safeguard" && state?.lastMove?.tier !== "check") || !!state?.safeguard?.carried;
export function safeguardLine(ctx = {}, { kind = null } = {}) {
  const mode = safetyModeOf(ctx.lang);
  if (CHECK_ONLY_KINDS.has(kind) && mode !== "hi") {
    const line = FALLBACK[mode === "en" ? "english" : "hinglish"].safeguardCheck;
    return ctx.address === "aap" && mode !== "en" ? toAap(line) : line;
  }
  const open = safetyOpeningFor(ctx.lang, { address: ctx.address });
  const q = open.mode === "en" ? CHECK_Q.en : CHECK_Q[open.mode][ctx.address === "aap" ? "aap" : "tum"];
  return `${open.text} ${q}`;
}
// round 5 (sim lab voice lane; persona p19): the safeguard's STAY turn (the episode's second turn: "stay with them and keep
// listening") whose model line broke a guard fell back to the FIRST turn's fixed line, word for word ("Aapne mujhe batakar
// bilkul sahi kiya..." twice in a row, after the child had answered). The stay turn has its own fixed line: she is here,
// no hurry, both helplines named (the floor's requirement), and a door left open instead of the same question again.
const STAY = {
  en: { tum: "I'm right here, and there's no hurry. If anything is worrying you, a grown-up you trust can help, and you can call Childline 1098 or Tele-MANAS 14416 any time. You can tell me whatever you want to.",
    aap: "I'm right here, and there's no hurry. If anything is worrying you, a grown-up you trust can help, and you can call Childline 1098 or Tele-MANAS 14416 any time. You can tell me whatever you want to." },
  hinglish: { tum: "Main yahin hoon, koi jaldi nahi hai. Agar koi baat pareshan kar rahi ho, toh jis bade par bharosa ho woh madad kar sakte hain, aur Childline 1098 ya Tele-MANAS 14416 pe kabhi bhi call kar sakte ho. Jo mann ho, mujhe bata sakte ho.",
    aap: "Main yahin hoon, koi jaldi nahi hai. Agar koi baat pareshan kar rahi ho, toh jis bade par bharosa ho woh madad kar sakte hain, aur Childline 1098 ya Tele-MANAS 14416 pe kabhi bhi call kar sakte hain. Jo mann ho, mujhe bata sakte hain." },
  hi: { tum: "मैं यहीं हूँ, कोई जल्दी नहीं है। अगर कोई बात परेशान कर रही हो, तो जिस बड़े पर भरोसा हो वे मदद कर सकते हैं, और चाइल्डलाइन 1098 या टेली-मानस 14416 पर कभी भी फ़ोन कर सकते हो। जो मन हो, मुझे बता सकते हो।",
    aap: "मैं यहीं हूँ, कोई जल्दी नहीं है। अगर कोई बात परेशान कर रही हो, तो जिस बड़े पर भरोसा हो वे मदद कर सकते हैं, और चाइल्डलाइन 1098 या टेली-मानस 14416 पर कभी भी फ़ोन कर सकते हैं। जो मन हो, मुझे बता सकते हैं।" },
};
// round 5 (14.2): the check-in a lesson opens on when it starts within hours of a safeguarding incident (state.js decide,
// `carried`). Fixed, like every safeguarding line. Discreet: no word of what was said or that anything was; both
// helplines; the choice to start slowly or stop. {name} is the child's first name.
const CARRIED = {
  en: { tum: "Hi {name}! Before we start: how are you feeling today? If anything ever worries you, a grown-up you trust can help, and you can call Childline 1098 or Tele-MANAS 14416 any time. Shall we start slowly, or stop for today? Either is fine.",
    aap: "Hi {name}! Before we start: how are you feeling today? If anything ever worries you, a grown-up you trust can help, and you can call Childline 1098 or Tele-MANAS 14416 any time. Shall we start slowly, or stop for today? Either is fine." },
  hinglish: { tum: "Namaste {name}! Shuru karne se pehle ek baat: aaj mann kaisa hai? Agar kabhi koi baat pareshan kare, toh jis bade par bharosa ho woh madad kar sakte hain, aur Childline 1098 ya Tele-MANAS 14416 pe kabhi bhi call kar sakte ho. Dheere se shuru karein, ya aaj ke liye bas? Dono theek hain.",
    aap: "Namaste {name}! Shuru karne se pehle ek baat: aaj mann kaisa hai? Agar kabhi koi baat pareshan kare, toh jis bade par bharosa ho woh madad kar sakte hain, aur Childline 1098 ya Tele-MANAS 14416 pe kabhi bhi call kar sakte hain. Dheere se shuru karein, ya aaj ke liye bas? Dono theek hain." },
  hi: { tum: "नमस्ते {name}! शुरू करने से पहले एक बात: आज मन कैसा है? अगर कभी कोई बात परेशान करे, तो जिस बड़े पर भरोसा हो वे मदद कर सकते हैं, और चाइल्डलाइन 1098 या टेली-मानस 14416 पर कभी भी फ़ोन कर सकते हो। धीरे से शुरू करें, या आज के लिए बस? दोनों ठीक हैं।",
    aap: "नमस्ते {name}! शुरू करने से पहले एक बात: आज मन कैसा है? अगर कभी कोई बात परेशान करे, तो जिस बड़े पर भरोसा हो वे मदद कर सकते हैं, और चाइल्डलाइन 1098 या टेली-मानस 14416 पर कभी भी फ़ोन कर सकते हैं। धीरे से शुरू करें, या आज के लिए बस? दोनों ठीक हैं।" },
};
/** The fixed check-in a lesson opens on after a recent safeguarding incident. Exported for tests. */
export function carriedCheckInLine(ctx = {}) {
  const mode = safetyModeOf(ctx.lang);
  const line = CARRIED[mode === "en" ? "en" : mode === "hi" ? "hi" : "hinglish"][ctx.address === "aap" ? "aap" : "tum"];
  const name = String(ctx.firstName ?? "").trim().split(/\s+/)[0] ?? "";
  return name ? line.replace("{name}", name) : line.replace(" {name}!", "!").replace(" {name}", "");
}
/** The fixed line for the safeguard's stay turn (never the first turn's line again). Exported for tests. */
export function safeguardStayLine(ctx = {}) {
  const mode = safetyModeOf(ctx.lang);
  return STAY[mode === "en" ? "en" : mode === "hi" ? "hi" : "hinglish"][ctx.address === "aap" ? "aap" : "tum"];
}
// 14.4.3: the fixed line for the helped tier (state.js: help is in place) when no model line could be written: she is here, they
// did the right thing, the number is on their screen (not re-said), the door left open; no question about being safe
const HELPED = {
  en: { tum: "I'm right here, and there's no hurry. You did the right thing. Childline's number is on your screen whenever you need it. You can tell me whatever you want to.",
    aap: "I'm right here, and there's no hurry. You did the right thing. Childline's number is on your screen whenever you need it. You can tell me whatever you want to." },
  hinglish: { tum: "Main yahin hoon, koi jaldi nahi hai. Tumne bilkul sahi kiya. Childline ka number screen par hai, jab bhi zaroorat ho. Jo mann ho, mujhe bata sakte ho.",
    aap: "Main yahin hoon, koi jaldi nahi hai. Aapne bilkul sahi kiya. Childline ka number screen par hai, jab bhi zaroorat ho. Jo mann ho, mujhe bata sakte hain." },
  hi: { tum: "मैं यहीं हूँ, कोई जल्दी नहीं है। तुमने बिल्कुल सही किया। चाइल्डलाइन का नंबर स्क्रीन पर है, जब भी ज़रूरत हो। जो मन हो, मुझे बता सकते हो।",
    aap: "मैं यहीं हूँ, कोई जल्दी नहीं है। आपने बिल्कुल सही किया। चाइल्डलाइन का नंबर स्क्रीन पर है, जब भी ज़रूरत हो। जो मन हो, मुझे बता सकते हैं।" },
};
/** The fixed line for the helped tier (help in place: no numbers re-said). Exported for tests. */
export function safeguardHelpedLine(ctx = {}) {
  const mode = safetyModeOf(ctx.lang);
  return HELPED[mode === "en" ? "en" : mode === "hi" ? "hi" : "hinglish"][ctx.address === "aap" ? "aap" : "tum"];
}
/** Safeguard tiers whose turns are not held to Childline's number: the check-in (none yet) and helped (on the board, not re-said). */
export const UNNUMBERED_TIERS = new Set(["check", "helped"]);
// 14.4: the fixed line for the check-in tier when no model line could be written: noticing and one open question, no numbers
const CHECK_IN = {
  en: { tum: "That sounds hard. Are you okay right now? You can tell me what happened.", aap: "That sounds hard. Are you okay right now? You can tell me what happened." },
  hinglish: { tum: "Yeh sunke lag raha hai kuch mushkil hai. Kya tum abhi theek ho? Jo hua, mujhe bata sakte ho.", aap: "Yeh sunke lag raha hai kuch mushkil hai. Kya aap abhi theek hain? Jo hua, mujhe bata sakte hain." },
  hi: { tum: "यह सुनकर लग रहा है कुछ मुश्किल है। क्या तुम अभी ठीक हो? जो हुआ, मुझे बता सकते हो।", aap: "यह सुनकर लग रहा है कुछ मुश्किल है। क्या आप अभी ठीक हैं? जो हुआ, मुझे बता सकते हैं।" },
};
/** The fixed check-in line (the check-in tier's fallback). Exported for tests. */
export function distressCheckLine(ctx = {}) {
  const mode = safetyModeOf(ctx.lang);
  return CHECK_IN[mode === "en" ? "en" : mode === "hi" ? "hi" : "hinglish"][ctx.address === "aap" ? "aap" : "tum"];
}
export function fallbackReply(state, item) {
  if (state.lastMove?.kind === "safeguard" && state.lastMove?.tier === "check") return distressCheckLine(state.ctx);
  if (state.lastMove?.kind === "safeguard" && state.lastMove?.tier === "helped") return safeguardHelpedLine(state.ctx);
  if (state.lastMove?.kind === "safeguard") {
    // (14.4.3: the same story told on, a restart, is never the opening's line again: its "are you safe?" was asked already)
    return (state.safeguard?.calm ?? 0) >= 1 || state.lastMove?.sameStory ? safeguardStayLine(state.ctx) : safeguardLine(state.ctx, { kind: state.safeguard?.kind ?? null });
  }
  const lang = state.ctx.lang;
  const kind = state.lastMove?.kind;
  // round 2 safety floor: a check-in the model could not write is the fixed offer of the choices (stop named), never
  // "say that again" (that asks a child who said stop to say it twice)
  if (state.lastMove?.checkin) {
    const line = FALLBACK[lang === "english" ? "english" : "hinglish"][state.lastMove.checkin === "rel" ? "checkinRel" : "checkinStop"];
    return state.ctx.address === "aap" && lang !== "english" ? toAap(line) : line;
  }
  if (item && !CLOSING_MOVES.has(kind)) {
    // round 7 (full-run judgement #2): an English card in a Hindi / Hinglish lesson is shown, never read: point to it instead
    const english = lang !== "english" && looksEnglish(promptFor(item, lang));
    const q = english ? (state.ctx.address === "aap" ? ENGLISH_CARD_LINE.aap : ENGLISH_CARD_LINE.tum) : promptFor(item, lang);
    // round 2 (conversation): a model outage (429 / timeout / every repair failed) on a turn that answers a request or puts
    // the question again is no longer a bare re-ask: a fixed code lead for what the move is doing, then the question
    // (conversation/fallback-lead.js; owner-2 prod R3 x4 + R2). Same kill switch as the lead slot.
    if (!p5Flag("LEADSLOT")) return q;
    const lead = fallbackLead({ request: state.lastMove?.request ?? null, hint: hintStatements(item, state.lastMove?.hintLevel),
      rePose: state.pinItem === item.id && (state.pinRun ?? 0) > 1, lang });
    if (!lead) return q;
    return composeTurn(state.ctx.address === "aap" && lang !== "english" ? toAap(lead) : lead, q);
  }
  const lines = FALLBACK[lang === "english" ? "english" : "hinglish"];
  // round 7 (main's full-run judgement #9: "Ek baar phir se batao, kya kaha tumne?" on a heard "pata nahi"): the re-ask is only
  // for a turn with no words heard; a stuck signal gets help, any other heard words the "heard" line
  const lastChild = [...(state.recent ?? [])].reverse().find((t) => t.who === "child")?.text ?? "";
  const heardNow = /[\p{L}\p{N}]/u.test(lastChild);
  const stuckNow = /(?<![\p{L}])(?:pata\s+nahi|nahi\s+pata|maloom\s+nahi|malum\s+nahi|samajh\s+nahi|nahi\s+samjh|don'?t\s+know|no\s+idea|nahi\s+aata|nahi\s+ata|पता\s+नहीं)(?![\p{L}])/iu.test(lastChild);
  const line = lines[kind] ?? (stuckNow ? lines.stuck : heardNow ? lines.heard : lines.other);
  // The fixed lines are written in tum forms; an "aap" child hears them in aap forms (G-REG-1).
  return state.ctx.address === "aap" && lang !== "english" ? toAap(line) : line;
}
/**
 * 14.4 (live on the real filter: "humne race lagayi", two class 8 answers about British rule): a block of the CONTEXT whose
 * child's words pass (or trip only a detector that is no child-safety signal) never gets "say that again": the same words
 * would trip it again. The move's own fixed line when it has one (an item's question, a check-in, a wrap), else a warm
 * carry-on. Exported for tests.
 */
export function filterNeutralReply(state, item) {
  const line = fallbackReply(state, item);
  const lang = state.ctx.lang;
  const lines = FALLBACK[lang === "english" ? "english" : "hinglish"];
  const aap = state.ctx.address === "aap" && lang !== "english";
  if (line !== (aap ? toAap(lines.other) : lines.other)) return line;
  return aap ? toAap(lines.heard) : lines.heard;
}

/**
 * The draft up to (not including) its first question, then the item's own question; a lead sentence that repeats part of
 * the question is dropped (F20) and, with `noLeak`, so is one that states the item's key (F17: a leak that survived the
 * rewrite used to replace the WHOLE turn with the bare question — 38/394 replies in the owner's session). Exported for tests.
 */
export function repairDrift(draft, item, lang, { noLeak = false } = {}) {
  const parts = p5Flag("GUARDS") ? sentences(draft) : String(draft).match(/[^.!?।]+[.!?।]*\s*/g) ?? [];
  const lead = [];
  for (const x of parts) {
    if (/[?？]/.test(x)) break;
    if (noLeak && revealsAnswer(x, item)) continue;
    lead.push(x);
  }
  return joinAsk(lead.join("").replace(/^[\s”"'’)\]]+/, "").trim(), promptFor(item, lang));
}

/** Sentences of `text` that do not state `item`'s key (what is left of a teaching turn after a leak survived). */
export const withoutLeaks = (text, item) => (p5Flag("GUARDS") ? sentences(text) : String(text).match(/[^.!?।]+[.!?।]*\s*/g) ?? []).filter((x) => !revealsAnswer(x, item)).join("").trim();
/**
 * Is what is left of a gutted teaching turn still a turn? F18 (evals/owner-truth s06 t2): every sentence of an explanation
 * "revealed" the next item, and the remainder was "” Aapka question?". A remainder must open on a word, carry some
 * content, and hand the floor back. Exported for tests.
 */
// p5-interaction (owner-2 s2 t11, R6.gutted: "What unit fraction represents one pot?" shipped as a whole explain turn): a
// remainder must also be a turn's worth of words (GUTTED_MIN, the battery's own bar); else the rewrite stands and the next
// item is marked spoiled.
export const GUTTED_MIN = 9;
export const coherentRemainder = (t) => !!t && !/^[\s”"'’)\]]/.test(t) && words(t) >= (p5Flag("GUARDS") ? GUTTED_MIN : 6) && handsBack(t);
/**
 * An upcoming item whose key is a STATEMENT of the idea being taught (a why / teach-back item, or a key of 6+ words such
 * as "Any question that can be checked by trying something") cannot be kept out of the explanation that teaches it: the
 * ahead-leak check would gut the turn (F18). Its answer is still discounted if said (brain/turn.js spoiledBy → spoiled →
 * hintsUsed 4), so evidence stays honest. Exported for tests.
 */
export const statementKey = (item) => !!item && (["why", "teachback"].includes(item.kind) || words(item.answer) >= 6);

/**
 * Text-mode teacher reply from the SAME compiled instructions, guarded on the bytes: an answer leak before
 * rung 4 (on the active item, or — on a teaching turn — on the item that comes next), a posing turn that
 * does not pose the item (drift), or an over-long turn gets one rewrite; a leak or drift that survives is
 * replaced by the question itself (content), or the leaking sentences are dropped, never shipped. A model
 * failure falls back (fallbackReply) instead of throwing.
 */
/** r5-latency: the reply lane's hedge point (~p95 of taxila-fast replies, n = 86, 2026-10-14); 0 turns it off. */
export const REPLY_HEDGE_MS = () => { const v = Number(process.env.TAXILA_REPLY_HEDGE_MS ?? 2200); return Number.isFinite(v) && v > 0 ? v : 0; };
export async function textReply({ instructions, state, kit, childText, trace, history = state.recent.slice(0, -1), verdict = state.lastVerdict ?? "ungraded", ui = null, module = null, overflow = true, onClause = null, clauseFix = null }) {
  const item = state.lastMove?.itemId ? findItem(state, kit, state.lastMove.itemId) : null;
  const next = !item && TEACHING_MOVES.has(state.lastMove?.kind) ? upcomingItem(state, kit) : null;
  const ahead = next && !statementKey(next) ? next : null;
  const lang = state.ctx.lang;
  // A diagnostic's options are content read aloud, so they do not count against the turn length.
  // round 7 A8: "chhota bolo" (the short method) lowers the long-reply cap for the rest of the lesson
  const max = (state.methods?.includes("short") ? Math.min(25, REPLY_MAX_WORDS[state.ctx.ageBand]) : REPLY_MAX_WORDS[state.ctx.ageBand])
    + (item?.diagnostic ? words(item.options.map((o) => o.text).join(" ")) : 0);
  const guardable = item && state.hintLevel < 4 && state.pendingWhy !== item.id;
  const posingTurn = guardable && state.hintLevel === 0 && POSING_MOVES.has(state.lastMove.kind);
  // p5-interaction: a thinking-aloud wait hands back by letting them go on, never by a question (the "thinkq" guard below)
  const thinkingWait = p5Flag("GUARDS") && state.lastMove?.request === "thinking";
  // round 7 (judgement #4): words were heard this turn (a letter or a digit), and the move is not the unclear-line repair
  const heardWords = /[\p{L}\p{N}]/u.test(String(childText ?? "")) && state.lastMove?.request !== "unclear";
  // round 7 (judgement #11): is a game really up (a play piece or a mounted activity)? Only then may a game act
  // (the move's visual "game" is what was ASKED for, not what is up: turn.js's askTruth says which)
  const gameUp = !!(state.playOn || module?.id || state.module?.id);
  // round 7 (full-run judgement #1): the child said something this turn (an answer to be graded, or not)
  const answeredNow = /[\p{L}\p{N}]/u.test(String(childText ?? ""));
  const kitText = (kit?.items ?? []).map((i) => `${i.prompt_en ?? ""} ${i.prompt_hi ?? ""}`).join(" ").replace(/\s+/g, " ");
  // round 7 (main's full-run judgement #4: her own question "kitne groups?" got "4", and her next line asked something new):
  // with no card on the table, a short answer to the question her last line asked is answered first, never skipped
  const herLastQ = [...(history ?? [])].reverse().find((t) => t.who === "teacher")?.text ?? "";
  const saidNow = String(childText ?? "").trim();
  const ownQAnswered = !item && /[?？]\s*$/.test(herLastQ.trim()) && answeredNow && !state.lastMove?.request && words(saidNow) <= 8
    && !CLOSING_MOVES.has(state.lastMove?.kind) && !state.lastMove?.checkin;
  const bareNumberSaid = /^\s*-?\d+(?:[.,/]\d+)?\s*\??\s*$/.test(saidNow) ? saidNow.replace(/[^\d.,/-]/g, "") : null;
  // round 2 safety floor: a check-in hands back by the choices it offers (the chips wait), never by a lesson question
  const checkin = state.lastMove?.checkin ?? null;
  const activeItem = checkin && state.activeItemId ? findItem(state, kit, state.activeItemId) : null;
  // round 3: a granted break hands back nothing (breakYes: "no question now"); before this the hand-back check made the
  // rewrite add a lesson question to "brb" / "can we pause for a bit?" (local battery base-head-1: 3 of 3 breaks rewritten)
  const restBreak = p5Flag("R3CONV") && state.lastMove?.kind === "break" && state.lastMove?.request === "break";
  // round 3 fix (adversarial B5): this turn answers a forget request after a disclosure (state.rel: the accepted overlay)
  const forgetSafety = state.rel?.overlay?.shapeId === "forget_after_safety";
  // 14.4.3 (release replay on c5a55681, r2 t3: "…milta hai 80. Ab doosri same jodi bhi 80 hai—total kitna?" after two
  // don't-knows): a worked part SHOWN to a stuck child (state.js move.stuck) asks them to work out nothing. Before this the
  // hand-back check read a showing turn as "flat" and its rewrite put the sum back to the child.
  const showOnly = ["worked_example", "reteach"].includes(state.lastMove?.kind) && !!state.lastMove?.stuck;
  const mustHandBack = !CLOSING_MOVES.has(state.lastMove.kind) && !thinkingWait && !checkin && !restBreak && !showOnly;
  // 14.4.3: on the text lane a diagnostic's choices are the buttons, never listed in her line (never on a safeguard turn)
  const readsOptions = state.mode === "text" && !!item?.diagnostic && state.lastMove?.kind !== "safeguard";
  // 14.4.3: a worked-example move uses the kit's numbers only (foreignNumbers); never a safeguard turn (it is a worked move)
  const workedNums = (state.lastMove?.kind === "worked_example" || (state.lastMove?.kind === "reteach" && !!state.lastMove?.stuck)) && !!kit?.workedExample;
  const foreignOf = (t) => (workedNums ? foreignNumbers(t, { kit, content: state.lastContent ?? [], childText }) : []);
  const whyProbe = !!item && state.pendingWhy === item.id;
  // A comparison across kinds of quantity (45,000 fans vs 4,500 km) in the teacher's OWN words; the kit's posed
  // question is verified content and is not judged here.
  const own = (t) => (item ? String(t).split(promptFor(item, lang)).join(" ") : String(t));
  // r5 QA D38 (14.3): an English lesson (no address) holds a code-switched Hinglish line to the parent's / class address
  // (aap only: a code-switched "aap" to a younger child is not wrong, and is never worth a rewrite's second)
  const address = state.ctx.address ?? (state.ctx.mixAddress === "aap" ? "aap" : null);
  const kindNow = state.lastMove?.kind;
  // The floor's NEVER rules on the teacher's own words (director/safety.js; verified kit content is not judged).
  const floorContent = floorContentOf(item);
  // 14.4: the check-in tier names no helpline yet (state.js checkTier); every other safeguard turn must
  // ... nor the helped tier (14.4.3: help is in place, the numbers are on the board and not re-said)
  const floorOf = (t) => floorViolations(t, { content: floorContent, requireHelpline: kindNow === "safeguard" && !UNNUMBERED_TIERS.has(state.lastMove?.tier), goodbye: kindNow === "wrap" });
  // 14.4: a turn that is not the full script, in a lesson with none yet, carries no safety talk of its own (harmTalk)
  const talkOk = safetyTalkAllowed(state) || forgetSafety;
  // G-ASK parity: a turn with a pinned question (UiDirectives.ask for THIS item) ends on that question and asks no
  // other — a corrective move (hint, re-teach, repair) re-poses the same item, it never moves to a side question.
  // Any other handing-back turn asks one question at most (audit flows G4: "…14 times 14 karke batayiye. 9² kitna hota hai?").
  // round 7 (main's full-run judgement #2, #3: "1/3 means 1 of ___ equal groups" read aloud in a Hinglish lesson, even right after
  // "hindi mein batao"): a card with no form in the lesson's language is shown, never read. Her line is not bound to it (no
  // pinned ending, no lead slot, no drift repair back to it); she asks the same question in her own words in the lesson's
  // language, and a line that reads the English card is caught (readscard).
  const cardText = item ? promptFor(item, lang) : null;
  const englishCard = !!cardText && lang !== "english" && looksEnglish(cardText);
  // round 7 (main's full-run judgement #11: the same card read word for word three or four turns running): when her last line
  // already read the card, a re-pose asks it in fresh words (the card stays on the screen), never the same sentence again
  const herLast = [...(history ?? [])].reverse().find((t) => t.who === "teacher")?.text ?? "";
  const cardRepeat = !englishCard && !!item && ui?.ask?.itemId === item.id && !!ui.ask.text && readsCard(herLast, ui.ask.text)
    && (state.pinItem === item.id && (state.pinRun ?? 0) > 1);
  const pinned = englishCard || cardRepeat ? null : item && ui?.ask?.itemId === item.id ? ui.ask.text : null;
  const parityOf = (t) => askParity(t, pinned);
  // a check-in that SAYS goodbye ("aaj ke liye yahin rok dete hain") while the child has not chosen yet is a mixed signal
  // (owner-3: the lesson goes on after it); it is still caught, but its repair is the check-in's own (below), never
  // stripWrap — which cut the stop option out and left "the lesson goes on" (adversarial B2)
  const wrapping = !CLOSING_MOVES.has(kindNow);
  // round 3: a turn whose move answers a request that is not an answer ("thoda break chahiye", "can we play a game") has no
  // answer to praise: "Bilkul, aap break lijiye" agrees to the request (base-head-1: caught as praise, rewritten, then
  // shipped flat). Only an UNVERIFIED reading is relaxed; a graded wrong answer keeps every praise check.
  const NOT_ANSWERS = new Set(["break", "stop", "identity", "uptake", "decline", "park", "detour", "adult", "language", "change_topic", "boredom", "back",
    "visual", "story", "example", "another", "slower", "repeat", "clarify", "answer_q", "adapt", "adopt", "harder", "easier", "skip", "know", "frustration"]);
  const wordsVerdict = p5Flag("R3CONV") && verdict === "unverified" && NOT_ANSWERS.has(String(state.lastMove?.request ?? "")) ? "ungraded" : verdict;
  // round 3 fix (experience B6): her OWN closed sum ("2000 + 50 = ___?") answered with a bare number is checked in code for
  // her words ("Haan, 2000 g…" to a wrong 2000): never evidence, only what her line may agree with
  // QA 14.4.1 ("nahi nahi, 160" to her own "2 × 80?" got a wrong operation named): also when the move after it poses the
  // next card, as long as no kit item was on the table when they answered (state.js priorItemId)
  const lastAsked = !item || state.priorItemId === null ? history.filter((x) => x.who === "teacher").at(-1)?.text ?? null : null;
  const selfV = lastAsked ? selfPosedVerdict(lastAsked, childText) : null;
  const praiseOf = (t) => praiseProblem(t, selfV === "incorrect" ? "not_yet" : selfV === "correct" ? "correct" : wordsVerdict);
  // p5-interaction guards (conversation/guards.js): her earlier lines of this lesson (the repeat guard reads the last six)
  const G = p5Flag("GUARDS");
  const earlier = G ? history.filter((t) => t.who === "teacher").slice(-6).map((t) => t.text) : [];
  // p5-interaction (owner-2 R4: a 40-word question re-read in full on every hint turn): once the question has been posed,
  // a re-pose ends on the card's form of it (UiDirectives.ask.text, ≤ 120 characters: the question sentence itself)
  const rePose = !!item && state.pinItem === item.id && (state.pinRun ?? 0) > 1;
  const askEnd = englishCard || cardRepeat ? null : item ? (G && pinned && rePose ? pinned : promptFor(item, lang)) : null;
  // Round 3 (conversation stream; kill switch TAXILA_P5_R3CONV=off): the question was posed on the last turn (a re-pose),
  // so a turn that ends on the card's form of it has posed it; the "drift" check (half the full prompt's content words)
  // asks only for a FIRST pose. Before this, a re-pose at rung 0 (a request answered, a question of theirs, small talk)
  // that ended on the card form tripped drift on every turn (the lead slot itself ends on the card form): base-head-1 had
  // drift on 26 of 90 turns, and the rewrite or the drift repair dropped what the draft had said to the child
  // ("pehle mera sawaal": the rainbow answer cut, insistence "engages_brief" no).
  const R3 = G && p5Flag("R3CONV");
  // round 3: the help requests whose turn must carry a line of her own before the card question (never only the question)
  const helpAsk = R3 && HELP_ASKS.has(String(state.lastMove?.request ?? ""));
  const mustPose = posingTurn && !(R3 && pinned && rePose);
  const firstPose = R3 && !!pinned && !rePose && posingTurn;
  // round 3 (conversation; smoke on the round-3 tree): confirming a RIGHT answer names the parts of the question they just
  // answered ("Haan — Flag A mein 4 equal sections hain") while the screen already shows the next idea (thirds): the parts
  // check read that as naming parts the screen does not show, and the repair cut the confirmation (8 of 94 turns, then
  // "noconfirm" on what shipped). The answered item's own question and key are verified content: their parts may be named.
  const answered = R3 && verdict === "correct" && state.itemsDone?.length ? findItem(state, kit, state.itemsDone.at(-1)) : null;
  const partsLines = answered ? [promptFor(answered, lang), String(answered.answer ?? "")] : undefined;
  // round 3 fix (owner-4 "example do", 2 of 2 local runs): a REQUESTED example / story / other way brings its own numbers
  // ("12 mangoes ka 1/3 hissa") beside the board; only her sentences ABOUT the screen are held to what it shows. Every such
  // sentence was stripped as "parts the screen does not show" and the turn shipped the model-failure line.
  const ownWay = ["example", "story", "another"].includes(state.lastMove?.request);
  const aboutScreen = (t) => (ownWay ? (String(t ?? "").match(/[^.!?।]+[.!?।]*\s*/g) ?? []).filter((x) => SCREEN_SENTENCE.test(x)).join("") : t);
  // round 2 (conversation): a lead-slot turn's length is its OWN words (the card question after them is verified content,
  // like a diagnostic's options): within the lead budget it is not "long"
  const slotState = { on: false };
  const slotLength = (t) => slotState.on && !!askEnd && String(t).trim().endsWith(String(askEnd).trim())
    && words(String(t).trim().slice(0, String(t).trim().length - String(askEnd).trim().length)) <= (LEAD_MAX_WORDS[state.ctx.ageBand] ?? 30);
  // G-PRAISE-2: after a right answer the acknowledgement never states a wrong option as the result (say.js correctsRight).
  const right = verdict === "correct" && state.lastRight?.wrong?.length ? { ...state.lastRight, nextPrompt: item ? promptFor(item, lang) : ahead ? promptFor(ahead, lang) : "" } : null;
  // dc-r7-script-walk-v3: a scripted move (G2: no kit derivation; G3: its authored point never counts as a leak)
  const scripted = !!state.lastMove?.scriptBeat;
  const point = state.lastMove?.point ?? null;
  const notPoint = (t) => (point ? String(t).split(point).join(" ") : String(t));
  const problems = (t) => [
    floorOf(t).length && "floor",
    !talkOk && harmTalk(t) && "harmtalk",
    forgetSafety && promisesForget(t) && "forget",
    praiseOf(t) === "praise" && "praise",
    praiseOf(t) === "contradicts" && "deny",
    // QA 14.4.1: a mistake of theirs named when nothing graded their answer wrong (director/say.js claimsMistake)
    // (never on a safeguard turn: its reassurance is no feedback on an answer, and no pedagogy guard rewrites safety copy)
    kindNow !== "safeguard" && praiseOf(t) === "claims" && "claim",
    right && correctsRight(t, right) && "corrects",
    screenProblem(t, ui, module, { coming: (!!state.lastMove?.visual && state.lastMove?.request === "visual") || (!!state.lastMove?.scriptBeat?.board && !ui?.studioSlot) }) && "screen",
    // W2-B #1: the line names parts the mounted module does not show (she said quarters over fifths). Her OWN words only:
    // the kit's posed question is verified content (W2-E: the replay showed the predicate flagging a verified question
    // that names halves/quarters/eighths beside a 1/2-only predict screen, which cost a rewrite and her lead-in).
    screenContradiction(aboutScreen(own(t)), module, partsLines) && "parts",
    registerBroken(t, address) && "register",
    leaksStage(t) && "stage",
    namesUiPart(own(t)) && "uiword",
    saysCantShow(t) && "cantshow",
    // round 7 (main's hybrid-pilot judgement #4): never a claim that she did not hear words that were heard
    heardWords && claimsNotHeard(t) && "notheard",
    // round 7 (main's full-run judgement #1): a verdict word only on a turn graded correct (partial keeps its own rule)
    answeredNow && !["correct", "partial"].includes(verdict) && selfV !== "correct" && affirmsAnswer(t) && "affirms",
    // round 7 (judgement #6): no verdict on what nothing graded
    ["ungraded", "unverified", "attempt"].includes(verdict) && negatesAnswer(t, childText) && "negates",
    // round 7 (judgement #5): a bracketed step of the lesson's content said so it is misheard ("2 times 50 plus 30")
    bracketSlip(t, state.lastContent ?? []) && "bracket",
    // (full-run judgement #10: with a game up, "Game ne 3 jumps register kiye" on a SPOKEN "3": a game event arrives as a
    // module-only turn with no words, so on a turn they spoke the game did nothing to describe)
    (!gameUp || answeredNow) && gameActs(t) && "gameclaim",
    // (full-run judgement #4) their number answer to her own question is answered, never ignored
    ownQAnswered && bareNumberSaid && !String(t).includes(bareNumberSaid) && "ignored",
    // dc-r7-script-walk-v2 R1: a scripted beat's must-say words are in her line
    kindNow !== "safeguard" && state.lastMove?.mustSay?.length && !saidMust(t, state.lastMove.mustSay, lang) && "mustsay",
    // round 7 T3 (listening contract): their own question is answered first, never met with a question back
    listenOn() && kindNow !== "safeguard" && !checkin && wordsVerdict === "ungraded" && childAsks(childText) && !state.lastMove?.request?.startsWith?.("visual")
      && /[?？]\s*$/.test(sentences(String(t))[0] ?? "") && "dodged",
    // (full-run judgement #6, #5)
    kindNow !== "safeguard" && belowLevel(t, state.ctx?.classLevel, kitText) && "level",
    !CLOSING_MOVES.has(kindNow) && answerInQuestion(t) && "answerinq",
    !scripted && !CLOSING_MOVES.has(kindNow) && underived(t, item, kit?.workedExample?.problem) && "underived",
    (guardable && revealsAnswer(notPoint(t), item) || ahead && revealsAnswer(notPoint(t), ahead)) && "leak",
    mixedUnitComparison(own(t)) && "units",
    // round 3 fix (experience B6): an arithmetic result she states that is false ("1 by 4 ko 3 se multiply karne par 3 by 12")
    !!arithmeticSlip(own(t)) && "math",
    mustPose && !englishCard && !cardRepeat && !posesItem(t, item, lang) && "drift",
    cardRepeat && readsCard(t, ui.ask.text) && "samecard",
    englishCard && readsCard(t, cardText) && "readscard",
    whyProbe && !asksWhy(t) && "nowhy",
    // round 3: a turn that ends on the pinned kit question has handed the floor back, whatever its verb ("…sabse bade
    // tukde se sabse chhote tak lagao." has no "?" and no listed verb: every pose of it was "flat" and rewritten)
    mustHandBack && !handsBack(t) && !(R3 && pinned && parityOf(t).endsOnAsk) && "flat",
    showOnly && sentences(t).some(asksToCompute) && "quiz",
    readsOptions && optionsNamed(t, item) >= 2 && "options",
    foreignOf(t).length > 0 && "invented",
    rateAsFraction(t) && "ratefrac",
    !scriptOk(t, lang) && "script",
    words(t) > max && !slotLength(t) && "long",
    pinned && !parityOf(t).endsOnAsk && "ask",
    mustHandBack && parityOf(t).questions > 1 && "twoq",
    wrapping && wrapsUp(t) && "wrap",
    // p5-interaction: the reply is only the question again (owner-2 R3, 9 / 90), or a line she already said (R4, 8 / 90)
    // round 3: a welcome back is short by nature ("Wapas aa gaye, Riya!"): two own words are a response there
    // round 3 (owner-2 on both trees: "samajh nahi aaya" on a faded step got only the step's question, R3 + R7.same_again): a
    // turn answering a request for help carries a real line of its own even on a first pose
    G && pinned && isBare(t, promptFor(item, lang), pinned, helpAsk ? undefined : !rePose ? 1 : R3 && state.lastMove?.request === "back" ? 2 : undefined) && "bare",
    G && repeatsEarlier(t, earlier) && "same",
    // a mid-thought gets no question (conversation-v2 thinking_aloud 1/8: "new_question"); a right answer is confirmed
    // before anything else (answer_correct 4/8: a covert probe with no uptake)
    thinkingWait && /[?？]/.test(t) && "thinkq",
    G && verdict === "correct" && !CLOSING_MOVES.has(kindNow) && !checkin && !confirmsFirst(t) && "noconfirm",
    ...(checkin ? checkInProblems(t, { kind: checkin, active: activeItem, lang }) : []),
  ].filter(Boolean);
  // The code repairs for the turn's shape (no model call): goodbye sentences out of a non-wrap turn, then the turn
  // ends on the pinned question (or keeps only its last question).
  const shapeFix = (t, f) => {
    let out = f.includes("wrap") ? stripWrap(t) : t;
    if (pinned) out = endOnAsk(out, askEnd);
    else if (f.includes("drift")) out = repairDrift(out, item, lang);
    // round 7 ("rewrite, never strip"): a check-in's offer is never cut to its last question ("Aap kya chunenge?")
    else if (f.includes("twoq") && !checkin) out = lastQuestionOnly(out, { keepContent: R3 });
    return out;
  };
  const SHAPE = new Set(["drift", "flat", "ask", "twoq", "wrap"]);
  const messages = [
    { role: "system", content: instructions },
    // The turn being answered is the last message (childText); by default it is the newest recent row.
    // Every turn reaches the reply model with direct identifiers masked (scrubPii), history and this turn alike.
    // Teacher turns too: on the voice lane her transcript came from a model that heard the child's audio unmasked,
    // so it can repeat a phone number, school or address back.
    // 14.4 (QA TEST d359423b / a9c3136d, 9ad86661; model-only replay 4 of 6 runs): a past child line the predicate's idiom checks
    // read as the lesson's own pressure ("main mar jaunga itna padh ke", "ye sawaal mujhe maar dalega") reached every later
    // draft word for word, and the reply made the safeguarding call on it turns after the Director had made its own ("turant
    // batayiye… akele mat rahiye"; once "aap marne ki baat keh rahi hain", which the next turn's read took for the child's).
    // Until a full script has happened it reaches the reply model as what it means. The turn being answered is never changed.
    ...history.map((t) => ({ role: t.who === "teacher" ? "assistant" : "user", content: t.who !== "teacher" && !talkOk && idiomMeaning(t.text) || forModel(t.text) })),
    { role: "user", content: childText ? forModel(childText) : "(the child has joined the lesson and is listening)" },
  ];
  const replyT0 = performance.now();
  // Replies take ~1-2 s (measured in evals/director-sim.mjs); a stuck call is cut at 6 s and retried once.
  // r5-latency: hedged (azure.js hedged): a call still out at REPLY_HEDGE_MS gets an identical twin, the first answer wins
  // overflow: false for a speculative bet (brain/turn.js speculate): a throttled bet just loses, the real reply still moves;
  // the real reply's hedge twin goes to the overflow account (azure.js chat twin, 14.4), a bet's never does
  const ask = (msgs) => replyDeps.chat(DEPLOY.reply, msgs, { maxTokens: 220, effort: "none", timeoutMs: 6000, trace, hedgeMs: REPLY_HEDGE_MS(), ...(overflow ? { twin: "overflow" } : { overflow: false }) }).then((r) => r.text.trim());
  let reply;
  const guardSlot = {};
  // The content filter blocking the reply call (the child's words are in it) is a safety signal, not an
  // outage: the caller fails CLOSED to the safeguarding protocol (turn(): `filtered`).
  // 14.4: `probe` is what the child's own words alone did (childWordsTrip); a probe that could not run is UNSURE: the caller
  // opens a check-in (one gentle question, no helplines yet; the next turn escalates unless the child is clearly fine)
  const blocked = (probe = "harm") => ({ reply: fallbackReply(state, item), filtered: true, ...(probe === "unknown" ? { unsure: true } : {}),
    guard: { caught: ["content_filter"], rewritten: false, replaced: true } });
  // 14.4 (main safety review; owner census dad0c9db t22: "pata nahi" got the helpline script with no disclosure anywhere in
  // the lesson): a block on a REWRITE or REPAIR call (the brief, her draft and the child's words) is judged as every other
  // reply-side block. A non-harm detector: a neutral line. Otherwise the child's own words alone decide: clear, a neutral
  // line; a harm block, the safeguard; a probe that could not run, the check-in.
  // v6.1 (director9 c5-t02 offtopic T7: a filtered rewrite spoke only the card, dropping the beat's explanation and the aside):
  // in a scripted turn the neutral line is the move's own authored words (the closures, the point or rendered lines, a parked
  // aside's acknowledgement) and then the card; anything else keeps the fixed neutral line
  const scriptNeutral = () => {
    const lm = state.lastMove ?? {};
    if (!(lm.scriptBeat || lm.splitClose) || CLOSING_MOVES.has(lm.kind)) return null;
    const en = state.ctx?.lang === "english";
    const d = (x) => { const t = String(x ?? "").replace(/\s+/g, " ").trim(); return t ? (/[.!?\u0964]$/.test(t) ? t : `${t}.`) : null; };
    const parked = (state.later ?? []).find((p) => p.at === state.turn && p.servedAt == null);
    const parts = [
      lm.gave?.answer ? (en ? `The last question's answer was ${lm.gave.answer}.` : `Pichhle sawaal ka jawab ${lm.gave.answer} tha.`) : null,
      lm.closed?.answer ? (en ? `And the earlier question's answer was ${lm.closed.answer}.` : `Aur pehle wale sawaal ka jawab ${lm.closed.answer} tha.`) : null,
      parked ? pickOf(PARK_ACK[en ? "english" : "hinglish"], state)(parked.topic) : null,
      ...(lm.rendered?.length ? lm.rendered.map(d) : [d(lm.point)]),
      ui?.ask?.text ? String(ui.ask.text).trim() : null,
    ].filter(Boolean);
    const line = parts.join(" ").replace(/\s+/g, " ").trim();
    return line && !problems(line).some((p) => ENFORCED.has(p)) ? line : null;
  };
  const neutralLine = () => scriptNeutral() ?? filterNeutralReply(state, item);
  const blockedAfterDraft = async (e, code) => {
    if (nonHarmFilter(e)) return { reply: neutralLine(), guard: { caught: ["content_filter_nonharm"], rewritten: false, replaced: true } };
    const probe = await childWordsTrip(probeWords(history, childText), { trace });
    if (probe === "clear") {
      console.warn(`[lesson] ${code} blocked but the child's own words pass: a neutral line`);
      return { reply: neutralLine(), guard: { caught: [code], rewritten: false, replaced: true } };
    }
    console.warn(`[lesson] ${code} blocked; the child's own words ${probe === "harm" ? "trip the filter" : "could not be cleared"}`);
    return blocked(probe);
  };
  // round 7 A5 (PIPELINE §A Brain item 10, joint with Voice): the STREAMED reply. The one-call draft streams; the moment its
  // first sentence is complete it is put through lockFirstSentence (every per-sentence guard on its own, and `s1 + the
  // pinned question` passes every guard of the whole turn) and, locked, handed to onClause: TTS starts while the rest is
  // written. The whole draft then takes every guard as before; a final reply that no longer starts with s1 becomes the
  // lock's own fallback (s1 + the question), so a sent clause is never withdrawn. The lead-slot draft streams the same way
  // (its lead's first sentence). Never early on a closing, check-in, why, thinking, break or diagnostic turn, or a turn with
  // no pinned question (those send their clauses after the whole guard). Kill switch TAXILA_R7_CLAUSE_STREAM=off.
  const clauseOn = typeof onClause === "function" && clauseStreamOn();
  const clause = { sent: null, why: null };
  const streamAsk = async (msgs) => {
    let tried = false;
    const onDelta = (_d, text) => {
      if (tried) return;
      const s1 = firstClosedSentence(text);
      if (!s1) return;
      tried = true;
      const lock = lockFirstSentence({ reply: text, s1, askEnd: pinned ? askEnd : null, problems, spoken: true, confirmNeeded: G && verdict === "correct", t0: replyT0,
        closing: CLOSING_MOVES.has(kindNow) || !!checkin || forgetSafety || whyProbe || thinkingWait || restBreak || !!item?.diagnostic });
      if (!lock.locked) { clause.why = lock.why; return; }
      // a post-fix the caller makes to her whole line (turn.js: self-gender, the affirmation opener) must leave s1 as it is
      if (clauseFix && clauseFix(lock.s1) !== lock.s1) { clause.why = "s1_postfix"; return; }
      clause.sent = lock;
      try { onClause({ i: 0, text: lock.s1 }); } catch (e) { console.warn("[lesson] onClause threw:", e?.message); }
    };
    try {
      return (await replyDeps.chatStream(DEPLOY.reply, msgs, { maxTokens: 220, effort: "none", timeoutMs: 6000, stallMs: 3000, quotaLane: "hot", trace, onDelta,
        ...(overflow ? {} : { overflow: false }) })).text.trim();
    } catch (e) {
      // a content-filter block is the safeguarding path below, exactly as on the one-call path
      if (isContentFilter(e)) throw e;
      // a stream that died after s1 was sent: the lock's fallback (s1 + the question) passes every guard
      if (clause.sent) return clause.sent.fallback;
      return ask(msgs);
    }
  };
  // round 2 (conversation): the LEAD SLOT. A turn that answers a request before the card question, or puts the same
  // question again, is written as two parts: the model writes only what comes before the question, code adds the question
  // byte for byte (conversation/compose.js). A lead that comes back unusable falls through to the one-call path.
  // (full-run judgement #8: "story" got a fill-in-the-blank: the lead slot's word cap squeezed the story out; a story turn takes
  // the one-call path, with its own room)
  const slot = G && p5Flag("LEADSLOT") && !!item && !englishCard && !cardRepeat && state.lastMove?.request !== "story" && leadSlotWanted({ request: state.lastMove?.request ?? null, rePose, pinned, diagnostic: !!item?.diagnostic,
    whyProbe, closing: CLOSING_MOVES.has(kindNow), firstPose: firstPose && !checkin });
  // round 3: a first pose with no request is a bridge into a new question (shorter lead, a right answer confirmed first)
  const bridge = firstPose && !state.lastMove?.request;
  const shortLead = bridge || (R3 && state.lastMove?.request === "back");
  const leadMax = (bridge ? LEAD_MAX_FIRST : LEAD_MAX_WORDS)[state.ctx.ageBand] ?? 30;
  const leadCall = async (why = null, draft = null) => {
    const extra = [...(draft ? [{ role: "assistant", content: draft }] : []), { role: "system", content: leadSlotNote({ lead: state.lastMove?.lead ?? null, why, ageBand: state.ctx.ageBand,
      first: bridge, confirm: R3 && verdict === "correct" && !checkin, noAnswer: R3 && bridge && (wordsVerdict === "unverified" || wordsVerdict === "attempt") }) }];
    const raw = clauseOn && !draft ? await streamAsk([...messages, ...extra]) : await ask([...messages, ...extra]);
    const lead = cleanLead(raw, askEnd, leadMax);
    return leadOk(lead, [item?.answer, ...(item?.acceptable ?? [])], shortLead ? { min: LEAD_MIN_FIRST } : undefined) ? composeTurn(lead, askEnd) : null;
  };
  // round 3: a one-call turn gets its own shape LAST (compose.js turnNote): a request's note first when the move answers one
  // with no card question, then the turn shape (end on the card question; or hand the floor back, no goodbye). Not on a
  // check-in, a granted break, a thinking-aloud wait, a why-probe or a closing move (each has its own shape).
  const reqNote = R3 && !pinned && !CLOSING_MOVES.has(kindNow) && !checkin && state.lastMove?.lead ? requestNote(state.lastMove.lead) : null;
  const shapeNote = R3 && !CLOSING_MOVES.has(kindNow) && !checkin && !restBreak && !thinkingWait && !whyProbe && !item?.diagnostic && mustHandBack
    ? turnNote({ ask: pinned ? askEnd : null, maxWords: TURN_WORDS[state.ctx.ageBand] ?? 25 }) : null;
  const cardNote = englishCard && !CLOSING_MOVES.has(kindNow) ? `The question on the screen is in English: never read it out; ask the same question in your own words in their language (${lang === "hindi" ? "simple Hindi" : "Hinglish"}), keeping its numbers, and never its answer.` : null;
  const repeatNote = cardRepeat && !CLOSING_MOVES.has(kindNow) ? "Your last turn already read the question on the screen word for word: ask it again in fresh words (shorter, or from another side), keeping its numbers, never the same sentence and never its answer." : null;
  const ownQNote = ownQAnswered ? `They answered your last question with "${saidNow.replace(/"/g, "'").slice(0, 60)}": respond to that answer FIRST (what fits, what does not, the right one if it is not), never skip it and never just echo it back ("you said …"); then the move.` : null;
  // round 7 S2: a worked part code renders (state.lastMove.rendered): her words are one framing sentence, code says the rest
  // (dc-r7-script-walk-v3 V1: a scripted remediation's authored explanation is spoken by code the same way)
  const workedLines = (kindNow === "worked_example" || (kindNow === "reteach" && ["remediation", "explain"].includes(state.lastMove?.scriptBeat?.kind))) && state.lastMove?.rendered?.length ? state.lastMove.rendered : null;
  const workedNote = workedLines ? "Right after your words, code says what is given, each calculation and the result: write ONE short sentence in the lesson's language that states the problem (who, what, the numbers it gives, what we want to find), with no question." : null;
  // v6.4 H2″: an aside returned to now: her ONE line answering what they said (returnLineOk holds it)
  const retSaid = state.lastMove?.returned?.said ?? null;
  const retNote = retSaid ? returnNoteOf(retSaid, state.lastMove.returned.topic, lang) : null;
  const lastNotes = [reqNote, shapeNote, cardNote, repeatNote, ownQNote, workedNote, retNote].filter(Boolean).join(" ");
  try {
    reply = slot ? (await leadCall()) : null;
    if (reply) { guardSlot.used = true; slotState.on = true; }
    const oneCall = lastNotes ? [...messages, { role: "system", content: lastNotes }] : messages;
    reply ??= clauseOn ? await streamAsk(oneCall) : await ask(oneCall);
  } catch (e) {
    // round 4 (stream 4A, 2026-10-10): a block on the COMPLETION (HTTP 200, finish_reason content_filter: the filter judged
    // the model's own words, not the child's) gets ONE fresh reply before the turn fails closed. In context, "explain it
    // differently" (Zoya, class 5, states of water) drew 1 completion block in 58 lessons and the child got the helplines;
    // the child's words had passed the predicate and the model distress read. A block on the PROMPT (HTTP 400: the child's
    // words are in it) and a second completion block still fail CLOSED, as before.
    let again = null;
    // round 5 (sim lab baseline, main safety review): a block whose categories are KNOWN and are only prompt-injection or
    // copyright detectors ("jailbreak": a child's maths answer, "6 aur 5... 30... 3,00,000?") is not a child-safety signal.
    // One retry on the system prompt and this turn only (the history may carry what tripped it); if that is blocked too, a
    // neutral fallback line, never the helplines. Harm categories (sexual, self_harm, violence, hate) and unreadable blocks
    // still fail CLOSED below, exactly as before.
    const neutral = (code) => ({ reply: neutralLine(), guard: { caught: [code], rewritten: false, replaced: true } });
    const lone = [messages[0], messages[messages.length - 1], ...(lastNotes ? [{ role: "system", content: lastNotes }] : [])];
    // 14.4.1 (sim lab p26h on 5c127d1a, QA 4b3d875c: a class 8 answer about the British, blocked on hate on the prompt and on
    // this turn alone, got only the fixed carry-on, with no question): one more try with their words NOT shown, so her line is
    // the move's own; blocked or failed, the fixed line as before. Their words still reached every read and the probe.
    const masked = () => ask([messages[0], { role: "user", content: MASKED_TURN }, ...(lastNotes ? [{ role: "system", content: lastNotes }] : [])]).catch(() => null);
    let triedLone = false;
    if (isContentFilter(e) && nonHarmFilter(e)) {
      console.warn(`[lesson] reply blocked by a non-harm filter (${e.filterCats.join(",")}): one retry on this turn alone`);
      triedLone = true;
      try { again = await ask(lone); } catch (e2) { if (isContentFilter(e2) && !nonHarmFilter(e2)) e = e2; }
      if (!again && !(isContentFilter(e) && !nonHarmFilter(e))) {
        const m = await masked();
        if (!m) return neutral("content_filter_nonharm");
        again = m; guardSlot.masked = true;
      }
    }
    // round 5 (sim lab p43, main safety review): a HARM (or unreadable) block on the PROMPT is the filter judging the whole
    // mix (the brief, her lines, the history, the child's words), not the child. The safeguard fires only when the CHILD'S
    // OWN WORDS trip it: a probe of their recent words alone (childWordsTrip) runs beside one retry on this turn alone. The
    // probe blocked on a harm category, or failing for any reason, fails CLOSED exactly as before, whatever the retry did.
    // A clear probe: the retry's reply if it came back, else a neutral line, never the helplines. The completion block
    // (HTTP 200, below) is unchanged: there the prompt with the child's words already passed.
    if (!again && isContentFilter(e) && !nonHarmFilter(e) && e.status !== 200) {
      const cats = (e.filterCats ?? []).join(",") || "unreadable";
      const [retry, probe] = await Promise.all([
        triedLone ? null : ask(lone).catch(() => null),
        childWordsTrip(probeWords(history, childText), { trace }),
      ]);
      if (probe !== "clear") {
        console.warn(`[lesson] reply prompt blocked (${cats}); the child's own words ${probe === "harm" ? "trip the filter" : "could not be cleared"}: fail closed`);
        return blocked(probe);
      }
      console.warn(`[lesson] reply prompt blocked (${cats}) but the child's own words pass: ${retry ? "the retry on this turn alone" : "a neutral line"}`);
      const got = retry ?? await masked();
      if (!got) return neutral("content_filter_context");
      again = got;
      guardSlot.filter = "context";
      if (!retry) guardSlot.masked = true;
    }
    if (!again && isContentFilter(e) && e.status === 200 && !nonHarmFilter(e)) {
      console.warn("[lesson] reply completion blocked by the content filter: one fresh reply");
      // main safety review: if the fresh reply fails for any other reason (a timeout, a 5xx), the ORIGINAL block stands
      // and the turn fails closed; only a second filter block replaces it (same outcome)
      try { again = await ask(lastNotes ? [...messages, { role: "system", content: lastNotes }] : messages); } catch (e2) { if (isContentFilter(e2)) e = e2; }
    }
    if (again) reply = again;
    else {
      if (isContentFilter(e) && nonHarmFilter(e)) return neutral("content_filter_nonharm");
      // 14.3.1 (main safety review; sim lab rel143 p16 r2, TEST 955a17b7 t12): HER OWN reply about chips packets and nitrogen
      // was blocked on completion twice. The prompt with the child's words had passed and the classifier read the answer
      // correct, yet the turn failed closed to the helpline script, and the lesson held helplines two more turns. A block on
      // HER completion is a safeguard only when the child's own words trip the filter (the 14.2 prompt-side rule): a clear
      // probe gives a neutral line, never the helplines; a harm or unreadable probe fails CLOSED exactly as before.
      if (isContentFilter(e) && e.status === 200) {
        const probe = await childWordsTrip(probeWords(history, childText), { trace });
        if (probe === "clear") {
          console.warn("[lesson] her reply was blocked on completion but the child's own words pass: a neutral line");
          return neutral("content_filter_output");
        }
        console.warn("[lesson] her reply was blocked on completion and the child's own words could not be cleared");
        return blocked(probe);
      }
      if (isContentFilter(e)) { console.warn("[lesson] reply blocked by the content filter"); return blocked(); }
      console.warn("[lesson] reply unavailable, falling back:", e.message);
      return { reply: fallbackReply(state, item), guard: { caught: ["unavailable"], rewritten: false, replaced: true } };
    }
  }
  let found = problems(reply);
  const guard = { caught: found, rewritten: false, replaced: false, ...(found.length ? { firstDraft: reply } : {}), ...(guardSlot.used ? { leadSlot: true } : {}), ...(guardSlot.filter ? { filter: guardSlot.filter } : {}), ...(guardSlot.masked ? { masked: true } : {}) };
  // r4-latency (TAXILA_TTS_FIRST_SENTENCE, SHADOW): can the draft's first TTS sentence be LOCKED now — could it start speaking
  // while the rest of the turn is still being guarded or rewritten? Locked only when it passes every per-sentence guard on its
  // own, names nothing on the screen (the child would still see the last turn's), asks nothing, and the minimal turn
  // `s1 + the pinned kit question` passes EVERY guard of the whole turn, so a final reply that starts with s1 always exists.
  // Shadow records the lock and whether the final reply (today's path, unchanged) still starts with s1; nothing else moves.
  const early = firstSentenceMode() === "off" ? null
    : lockFirstSentence({ reply, askEnd: pinned ? askEnd : null, problems, closing: CLOSING_MOVES.has(kindNow) || !!checkin || forgetSafety || whyProbe || thinkingWait || restBreak || !!item?.diagnostic,
      spoken: state.mode !== "text", confirmNeeded: G && verdict === "correct", t0: replyT0 });
  // Drift (a posing turn that asked some other question) is repaired without a model call when it is the
  // only problem besides the hand-back the posed question supplies: what the draft said BEFORE its first
  // question (the acknowledgement), then the verified question itself — what the rewrite produced in 9/9
  // measured drift rewrites (5 the question alone, 4 acknowledgement + question; evals/cascade-latency.mjs,
  // 2026-10-02), at ~1 s less. Every guard runs again on the result; anything left goes to the rewrite.
  // The same holds for the G-ASK parity, two-question and goodbye problems (a pure shape fix, measured below).
  if (found.length && !checkin && found.every((p) => SHAPE.has(p))) {
    const repaired = shapeFix(reply, found);
    if (!problems(repaired).length) {
      reply = repaired;
      found = [];
      guard.repaired = true;
    }
  }
  // r5 QA D38: an English lesson's code-switched line in tum forms is held to aap by the closed tum → aap lexicon, without a
  // model call; the rewrite below runs only if the register is still broken or something else is
  if (found.includes("register") && !state.ctx.address && address === "aap") {
    const fixed = toAap(reply);
    if (!registerBroken(fixed, address)) { reply = fixed; guard.repaired = true; found = problems(reply); }
  }
  // round 7 latency cut 1 (main, after director6: 44% of turns paid a second model call): in script mode, a draft whose only
  // problems are ones the final assembly below fixes in code — the beat's point (mustsay, on an explain beat with a point),
  // the missing "not right" (uncorrected) or the missing yes (noconfirm) — is not rewritten: the rewrite's words would be
  // replaced by the assembly anyway. Any other problem keeps today's rewrite. Kill switch TAXILA_R7_SKIP_REWRITE=off.
  const scriptTurnEarly = scripted || !!(item && (item.scriptAsk || item.scriptCheck || item.scriptThen));
  // (v6 R2, main: "the invented guard replaces the line instead of repairing it": the assembly keeps none of an invented draft's
  // sentences, so its rewrite is never needed)
  const ASSEMBLY_FIXES = (p) => p === "uncorrected" || p === "noconfirm" || p === "invented" || (p === "mustsay" && !!point && kindNow === "explain");
  if (found.length && skipRewriteOn() && scriptTurnEarly && listenOn() && kindNow !== "safeguard" && !CLOSING_MOVES.has(kindNow) && !checkin
    && !forgetSafety && !clause.sent && found.every((p) => ASSEMBLY_FIXES(p) || (p === "long" && longTrimOn()))) {
    guard.rewriteSkipped = [...found];
    // cut 2 (TAXILA_R7_LONG_TRIM, default OFF until a judged A/B): "long" is her own words trimmed in code to the turn budget,
    // the card kept whole; the assembly then puts the authored parts back in their places
    if (found.includes("long")) {
      const cardT = ui?.ask?.text ? String(ui.ask.text).replace(/\s+/g, " ").trim() : null;
      const own0 = cardT && String(reply).includes(cardT) ? String(reply).replace(cardT, " ").replace(/\s+/g, " ").trim() : String(reply).trim();
      const budget = Math.max(8, (TURN_WORDS[state.ctx.ageBand] ?? 25) - (cardT ? words(cardT) : 0));
      reply = [trimToWords(own0, budget), cardT].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      guard.longTrimmed = true;
    }
    found = [];
  }
  if (found.length) {
    const asked = G && ["example", "story", "another"].includes(state.lastMove?.request);
    const why = [found.includes("leak") && asked && "it gives away the answer to the question — keep what they asked for, but with different numbers and a different case from the question, so its answer is never stated",
      found.includes("leak") && !asked && (ahead
      ? "it states the answer to the practice question that comes next — explain with different numbers or a different example, and do not answer that question"
      : "it gives away the key answer — the hint ladder has not reached rung 4"),
      found.includes("drift") && `it must ask exactly this question and no other: "${promptFor(item, lang)}"`,
      found.includes("nowhy") && "it must ask how they knew or why — about the question they just answered, not a new problem; the reason is theirs to give",
      found.includes("flat") && !found.includes("nowhy") && "it never hands the floor back — end with one question for the child about the same thing (and do not answer it yourself)",
      found.includes("script") && (lang === "hindi" ? "write it in Roman or Devanagari only" : "write it in Roman script only — no Devanagari or any other script"),
      found.includes("long") && `it is too long — at most ${TURN_WORDS[state.ctx.ageBand]} words`,
      found.includes("units") && "it asks which is bigger between two different kinds of quantity — compare like with like (two counts, or two lengths in one unit)",
      found.includes("math") && (() => { const x = arithmeticSlip(own(reply)); return x ? `it states a result that is not true (${x.claim}: the true value is ${x.value}) — say it correctly, or leave the sum out` : null; })(),
      found.includes("floor") && `it breaks the safety floor — ${floorOf(reply).map((k) => FLOOR_FIX[k]).filter(Boolean).join("; ")}`,
      found.includes("harmtalk") && (state.lastMove?.kind === "safeguard"
        ? "a check-in asks only if they are okay — no helpline yet, and never whether they are safe or want to hurt themself"
        : "it brings up a helpline or asks whether they want to hurt themself, but nothing they said is about being unsafe (the safety check read their words) — no helpline and no question about harm: answer warmly, as their teacher, about what they actually said"),
      found.includes("forget") && "it promises to forget or keep secret what they told you about being unsafe — never promise that; say kindly that telling was right and that a grown-up they trust should know so they can help",
      // round 3: on a turn with no answer to judge (a filler, an unverified reply) "start from what they actually did" made the
      // rewrite echo the filler ("Tumne bas “haan” kaha", 4 of ~500 turns on the paired battery): there it says go straight on
      found.includes("praise") && (R3 && (wordsVerdict === "unverified" || wordsVerdict === "attempt")
        ? "it praises or agrees as if they answered, but there is no answer of theirs to judge this turn — no praise or agreement word; go straight on with the move, without commenting on what they said"
        : `it agrees with or praises their answer, but their answer was not marked right — no agreement or praise word for it; ${R3 ? "start from what they actually did" : "name what is sensible in it"}, then the next step`),
      found.includes("deny") && "it says their answer is wrong, but it was right — confirm it plainly",
      found.includes("claim") && "it says they made a mistake, but nothing checked their answer as wrong — say nothing about right or wrong or what they did; go straight on with the move",
      found.includes("corrects") && `it implies their answer was wrong or that the answer is something else, but their answer ${JSON.stringify(String(right.key))} was right — confirm it plainly and do not name any other answer as the result`,
      found.includes("screen") && "it sends them to the screen (to tap or pick something, or to look at a picture or diagram), but nothing of that is on the screen this turn — talk about the thing itself, its parts and its numbers, plainly as across a table; never mention a picture, the screen, words or imagining",
      found.includes("parts") && `it names parts the screen does not show — ${screenContradiction(aboutScreen(own(reply)), module, partsLines)?.onScreen ?? ""}`,
      found.includes("cantshow") && "it says you cannot show or draw — never say that; talk about the idea itself in words, and point at the screen only at what is on it now",
      found.includes("negates") && "it tells them their answer is wrong (like '4 nahi'), but nothing checked it against a key — no verdict either way: respond to the point of what they said and what part of it fits, or ask what they mean",
      found.includes("level") && `it is below class ${state.ctx?.classLevel} (counting on, a tiny sum of your own, or how many sides a shape has) — help at their class's level: show the step itself, then back to the question`,
      found.includes("answerinq") && "its question asks for what your line just said (the answer is inside the question) — ask for the next thing they work out, not what you told them",
      found.includes("underived") && `it puts a number on the card (${underived(reply, item, kit?.workedExample?.problem)}) that they never saw come from anywhere — first say in one line the step that made it, then the card`,
      found.includes("mustsay") && `this beat must say these words as they are: ${(state.lastMove?.mustSay ?? []).join(", ")} — keep everything else, add them where they fit`,
      found.includes("dodged") && "they asked you a question: your first sentence answers it plainly (or, if it is for later, says when you will come back to it), never a question back",
      found.includes("ignored") && `it ignores their answer (${bareNumberSaid}) to your last question — respond to it first (what fits, what does not, the right one if it is not), then go on`,
      found.includes("samecard") && "it reads the question on the screen word for word again, as your last turn did — ask it in fresh words, keeping its numbers",
      found.includes("readscard") && `it reads the English question card aloud — ask that question in your own words in their language instead, keeping its numbers`,
      found.includes("affirms") && "it tells them their answer is right (sahi, haan wahi, correct), but nothing checked it as right this turn — no verdict word: respond to the point of what they said, then the next step",
      found.includes("notheard") && "it says you could not hear them, but you heard their words — never say that; respond to what they said and ask what they mean",
      found.includes("gameclaim") && "it says a game did or showed something, but no game is on the screen — it is a spoken game between you two: say what YOU and THEY do",
      found.includes("bracket") && "it says a bracketed step so it is misheard (like '2 times 50 plus 30' for 2 × (50 + 30)) — say the bracket first, then the multiple ('50 plus 30, that is 80, times 2')",
      found.includes("stage") && "it reads out a field name, markup or a text picture (like 'Whiteboard:', brackets or rows of symbols like ●●●) — plain spoken words only; the board draws pictures, never your words",
      found.includes("uiword") && "it names a screen part by an internal name (chips, bar1) — say what the child sees: the buttons on the screen, strip A or B",
      found.includes("register") && (address === "aap" ? "it uses tum forms — address the child with aap forms only (aap, aapka; verbs ending -iye)" : "it uses aap — address the child with tum forms (tum, tumhara)"),
      found.includes("ask") && !found.includes("drift") && `it must end by asking exactly this question, and ask nothing else: "${askEnd}"`,
      found.includes("twoq") && !found.includes("ask") && "it asks more than one question — keep only one question, at the end",
      found.includes("wrap") && (checkin ? "it already says goodbye, but they have not chosen yet — offer stopping as one of the choices (stop for today), not as a goodbye"
        : "it says goodbye or that the lesson is over, but the lesson goes on — no goodbye words"),
      found.includes("bare") && (rePose || helpAsk ? "it is only the question again — first answer what they just said, or give the nudge or the step, in one short line of your own; then the question"
        : "it is only the question — say a short bridge of your own first (a few words to what they said), then the question"),
      found.includes("same") && "it repeats what you already said earlier, almost word for word — say something new (a different nudge, example or way in); then the question",
      found.includes("ratefrac") && "it reads a rate (so many runs in so many balls) as a fraction; a fraction is a part of one whole split into equal parts — use a whole split into equal parts",
      found.includes("invented") && `it uses numbers that are not in the worked example (${foreignOf(reply).join(", ")}) — use only the worked example in LESSON NOW, with its own numbers`,
      found.includes("options") && "it lists the answer choices, but they are the buttons on the screen — do not list or read them; say your line, then ask the question",
      found.includes("quiz") && "they were stuck: say each step's result yourself and ask them to work out nothing — at most ask if they want to see the next step",
      found.includes("thinkq") && "they are in the middle of a thought — ask nothing at all; only a few words that let them go on and finish it",
      found.includes("noconfirm") && "their answer was right — open by confirming it in a few words, naming what they got right, before anything else",
      found.includes("hold") && "they asked to stop: it asks a lesson question or holds them for one more — this turn asks nothing about the lesson; only offer the choices",
      found.includes("nostop") && (checkin === "rel" ? "it must say plainly that stopping now is fine" : "it leaves out stopping — name all three choices: keep going, a short break, or stop for today"),
      found.includes("nochoice") && !found.includes("nostop") && "it only names stopping — they have not chosen yet: name all three choices, keep going, a short break, or stop for today",
    ].filter(Boolean).join("; and ");
    try {
      reply = await ask([...messages, { role: "assistant", content: reply }, { role: "system", content: checkin
        ? `Rewrite that turn: ${why}. Same check-in, same language, one or two short warm sentences, then wait for their choice.`
        : `Rewrite that turn: ${why}. Same move, same language, one idea, end by handing the floor back.` }]);
      guard.rewritten = true;
      found = problems(reply);
    } catch (e) {
      if (isContentFilter(e)) return await blockedAfterDraft(e, "content_filter_rewrite");
      console.warn("[lesson] rewrite unavailable, guarding the draft:", e.message); // the draft's problems stand
    }
    guard.afterRewrite = found;
    if (checkin && (found.includes("floor") || found.includes("hold") || found.includes("nostop") || found.includes("wrap") || found.includes("nochoice"))) {
      // a check-in that still asks a lesson question, holds them, or drops the stop option is never sent: the fixed line
      reply = fallbackReply(state, null);
      guard.replaced = true;
    } else if (found.includes("forget")) {
      // round 3 fix (adversarial B5): a promise to forget a disclosure is never sent: the fixed honest line
      const line = FALLBACK[lang === "english" ? "english" : "hinglish"].forgetSafety;
      reply = address === "aap" && lang !== "english" ? toAap(line) : line;
      guard.replaced = true;
    } else if (found.includes("floor") || found.includes("harmtalk")) {
      // A teacher line that still breaks the floor, or still makes the safeguarding call itself, is never sent: the fixed
      // line for the move (or the question).
      reply = fallbackReply(state, item);
      guard.replaced = true;
    } else if (found.includes("leak") && ahead) {
      // what is left must still be a turn (F18); else the rewrite stands and the next item is marked spoiled (turn.js)
      const left = withoutLeaks(reply, ahead).replace(/^[\s”"'’)\]]+/, "");
      // p5-interaction (owner-4 "story ki tarah batao": the story was cut to "Agar cake 12 pieces ka ho, ek part mein kitne?"):
      // when the child ASKED for this teaching (a story, an example, another way, slower, a picture), their request wins over
      // the next item's evidence value: the rewrite stands and that item is marked spoiled (its answer is discounted)
      if (coherentRemainder(left) && !(G && state.lastMove?.request)) { reply = left; guard.replaced = true; } else guard.spoilsAhead = ahead.id;
    } else if (found.includes("leak") || found.includes("drift")) {
      // the acknowledgement before the drift / leak stays, then the verified question (F17: never the bare question when
      // the child's words got an answer in the draft)
      reply = repairDrift(reply, item, lang, { noLeak: true });
      if (problems(reply).includes("leak")) reply = askEnd;
      guard.replaced = true;
      // p5-interaction (acceptance 2026-10-05, the req:story chip: 2 / 6 requested stories were cut to the bare question
      // because the story's numbers stated the key): a REQUESTED story / example / other way gets one more attempt with
      // other numbers; it is used only when no truth problem is left (a leak still ships the question alone)
      if (G && item && state.lastMove?.request && isBare(reply, askEnd, pinned)) {
        try {
          const again = await ask([...messages, { role: "assistant", content: guard.firstDraft ?? reply }, { role: "system", content: `Rewrite that turn: they asked for it this way, so keep it that way, but use different numbers and things from the question so it never gives away or works out the question's answer; two short sentences, then end by asking exactly this question: "${askEnd}". Same language.` }]);
          let a = again;
          if (problems(a).includes("long")) a = trimToWords(a, max);
          if (!problems(a).filter((p) => !SOFT_FIX.has(p)).length && !problems(a).includes("long") && !isBare(a, askEnd, pinned)) { reply = a; guard.reasked = true; }
        } catch (e) { if (isContentFilter(e)) return await blockedAfterDraft(e, "content_filter_repair"); }
      }
    } else {
      if (found.includes("units")) { reply = withoutMixedUnits(reply) || fallbackReply(state, item); guard.replaced = true; }
      if (found.includes("script")) reply = withoutOffScript(reply, lang);
      // What is left of a turn whose words contradicted the verdict or the screen: those sentences go; if nothing
      // that hands the floor back is left, the item's question (or the move's fixed line) is the turn.
      const keepOr = (t) => (t && handsBack(t) ? t : item && !CLOSING_MOVES.has(kindNow) && state.pendingWhy !== item.id
        ? joinAsk(t ?? "", askEnd) : t || fallbackReply(state, item));
      // a false sum that survived the rewrite: its sentence goes (the rest of the turn stands, or the question / fixed line)
      if (found.includes("math")) { reply = keepOr(sentences(reply).filter((x) => !arithmeticSlip(own(x))).join(" ").trim()); guard.replaced = true; }
      if (found.includes("praise")) { reply = keepOr(stripPraise(reply)); guard.replaced = true; }
      if (found.includes("claim")) { reply = keepOr(stripClaim(reply)); guard.replaced = true; }
      if (found.includes("invented")) { reply = sentences(reply).filter((x) => !foreignOf(x).length).join(" ").trim() || fallbackReply(state, item); guard.replaced = true; }
      if (found.includes("options")) { reply = keepOr(withoutOptions(reply, item)); guard.replaced = true; }
      if (found.includes("quiz")) { reply = sentences(reply).filter((x) => !asksToCompute(x)).join(" ").trim() || fallbackReply(state, item); guard.replaced = true; }
      if (found.includes("corrects")) { reply = keepOr(stripCorrection(reply, right)); guard.replaced = true; }
      if (found.includes("screen")) { reply = keepOr(stripScreenRefs(reply, { stageEmpty: emptyStage(ui, module) })); guard.replaced = true; }
      // W2-B fixer: a rewrite that still names part counts the screen does not show loses those sentences
      if (found.includes("parts")) {
        // a requested example keeps its own sentences: only the ones about the screen are taken out
        const keepOwn = ownWay ? (x) => !SCREEN_SENTENCE.test(x) : null;
        reply = keepOr(keepOwn ? (String(reply).match(/[^.!?।]+[.!?।]*\s*/g) ?? []).filter((x) => keepOwn(x) || !screenContradiction(x, module, partsLines)).join("").trim() || null
          : stripStrayParts(reply, module, partsLines, { keep: item ? promptFor(item, lang) : "" }));
        guard.replaced = true;
      }
      if (found.includes("register") && address === "aap") { reply = toAap(reply); guard.repaired = true; }
      if (found.includes("stage")) { reply = stripStage(reply) || fallbackReply(state, item); guard.replaced = true; }
      if (found.includes("uiword")) { reply = plainUiWords(reply, lang); guard.repaired = true; }
      if (found.includes("cantshow")) { reply = keepOr(stripCantShow(reply)); guard.replaced = true; }
      if (found.includes("notheard")) { reply = keepOr(withoutNotHeard(reply)); guard.replaced = true; }
      if (found.includes("negates")) { reply = keepOr(withoutNegation(reply, childText)); guard.repaired = true; }
      if (found.includes("affirms")) { reply = keepOr(withoutAffirm(reply)); guard.replaced = true; }
      if (found.includes("bracket")) { reply = sayBrackets(reply, state.lastContent ?? [], lang); guard.repaired = true; }
      if (found.includes("gameclaim")) { reply = keepOr(withoutGameActs(reply)); guard.replaced = true; }
      // round 7 (main's director2 judgement: "your guards detect but don't prevent"): the block-2 guards had only the rewrite.
      // A rewrite that keeps the problem now gets a code repair, never ships as it is.
      if (found.includes("ratefrac")) { reply = keepOr(sentences(reply).filter((x) => !rateAsFraction(x)).join(" ").trim()); guard.replaced = true; }
      if (found.includes("level")) { reply = keepOr(sentences(reply).filter((x) => !belowLevel(x, state.ctx?.classLevel, kitText)).join(" ").trim()); guard.replaced = true; }
      if (found.includes("answerinq")) { const s = sentences(reply); reply = keepOr(s.slice(0, -1).join(" ").trim()); guard.replaced = true; }
      if (found.includes("underived")) {
        const lead = derivationLead(underived(reply, item, kit?.workedExample?.problem), kit?.workedExample, lang);
        if (lead) { reply = joinAsk(lead, askEnd ?? pinned ?? ""); guard.replaced = true; }
      }
      if (found.includes("ignored") && bareNumberSaid != null) { reply = `${ignoredLead(bareNumberSaid, lang, state)} ${reply}`.trim(); guard.repaired = true; }
      if (found.includes("readscard")) { reply = fallbackReply(state, item); guard.replaced = true; }
      if (found.includes("long")) reply = trimToWords(reply, max);
      // Last: the turn's shape (goodbye words out, the pinned question at the end, one question), in code.
      const left = problems(reply).filter((p) => SHAPE.has(p));
      if (left.length) {
        const fixed = shapeFix(reply, left);
        // p5-interaction: the shape fix drops every question that is not the pinned one; when that leaves only the question
        // (the model's uptake was itself a question: owner-2 R3), the last lead question stays before it instead (goodbye
        // sentences still go)
        // ship5 integration (p5 x W1 "one question per turn", tests/prod/w1a-battery): on a hint turn the rung's own kit
        // hint, as STATEMENTS only, leads first; a lead question is the last resort (it makes the turn two questions).
        const hintLead = G && pinned && kindNow === "hint" ? hintStatements(item, state.lastMove?.hintLevel) : "";
        const alt = G && pinned && isBare(fixed, askEnd, pinned)
          ? (hintLead ? joinAsk(hintLead, askEnd) : keepLastLeadQuestion(left.includes("wrap") ? stripWrap(reply) : reply, askEnd)) : null;
        reply = alt && !isBare(alt, askEnd, pinned) ? alt : fixed;
        guard.repaired = true;
      }
    }
    // QA 14.4.1: a mistake of theirs nothing graded survives no branch above (the drift repair keeps the acknowledgement
    // before the question, and a claim is usually that acknowledgement): its sentences go
    if (kindNow !== "safeguard" && problems(reply).some((p) => p === "claim" || p === "deny") && claimsMistake(reply)) {
      const left = stripClaim(reply);
      reply = left && handsBack(left) ? left : item && !CLOSING_MOVES.has(kindNow) ? joinAsk(left, askEnd) : left || fallbackReply(state, item);
      guard.replaced = true;
    }
  }
  if (G) {
    // p5-interaction: a teaching turn the repairs above left gutted (owner-2 R6, 3 / 90: "What do you predict?" as a whole
    // hook, after the mixed-units strip) gets one more attempt at a full turn; it is used only when it is clean.
    // (a strip that left nothing put the fixed "lost my words" line on a teaching turn: owner-2 R2 on a local run — the same retry)
    const fixedLine = !item && reply === fallbackReply(state, null);
    if (TEACHING_MOVES.has(kindNow) && (words(reply) < GUTTED_MIN || fixedLine) && !guard.final) {
      try {
        const floorWhy = guard.firstDraft ? floorOf(guard.firstDraft).map((k) => FLOOR_FIX[k]).filter(Boolean).join("; ") : "";
        const again = await ask([...messages, { role: "assistant", content: guard.firstDraft ?? reply }, { role: "system", content: `Rewrite that turn as a full turn: the same idea in two or three short sentences, then one small question about it${ahead ? "; do not answer the practice question that comes next" : ""}; compare only like with like${floorWhy ? `; ${floorWhy}` : ""}; same language.` }]);
        // only the soft problems may remain, and they are repaired in code; any truth problem (floor, leak, praise, deny,
        // units, screen, parts) keeps the turn as it was
        const hard = problems(again).filter((p) => !SOFT_FIX.has(p));
        if (words(again) >= GUTTED_MIN && !hard.length) {
          let a = again;
          const soft = problems(a);
          if (soft.includes("wrap")) a = stripWrap(a) || a;
          if (soft.includes("script")) a = withoutOffScript(a, lang);
          if (soft.includes("register") && address === "aap") a = toAap(a);
          if (soft.includes("stage")) a = stripStage(a) || a;
          if (soft.includes("uiword")) a = plainUiWords(a, lang);
          if (soft.includes("cantshow")) a = stripCantShow(a) || a;
          if (soft.includes("notheard")) a = withoutNotHeard(a) || a;
          if (soft.includes("negates")) a = withoutNegation(a, childText) || a;
          if (soft.includes("affirms")) a = withoutAffirm(a) || a;
          if (soft.includes("bracket")) a = sayBrackets(a, state.lastContent ?? [], lang);
          if (soft.includes("gameclaim")) a = withoutGameActs(a) || a;
          if (words(a) > max) a = trimToWords(a, max);
          if (words(a) >= GUTTED_MIN && !problems(a).filter((p) => !SOFT_FIX.has(p)).length) { reply = a; guard.regutted = true; }
        }
      } catch (e) { if (isContentFilter(e)) return await blockedAfterDraft(e, "content_filter_repair"); }
    }
    // round 7 (PIPELINE §A Brain "rewrite, never strip"): a turn the repairs left as a fragment ("ने?", "Aap kya chunenge?")
    // is never sent: the move's own full line (a check-in's fixed offer of the choices; with a card, its lead and question)
    if (!CLOSING_MOVES.has(kindNow) && (guard.replaced || guard.repaired) && isFragment(reply, askEnd)) {
      reply = fallbackReply(state, item);
      guard.unfragmented = true;
    }
    // a hint turn still only the question after the rewrite: the rung's own kit hint (verified content that never states
    // the key, never a teacher note) leads the question
    if (item && kindNow === "hint" && problems(reply).includes("bare")) {
      // ship5 integration: statements only, so the repaired turn still asks ONE question (a kit hint can itself ask one)
      const h = hintStatements(item, state.lastMove?.hintLevel);
      if (h) { reply = joinAsk(h, askEnd); guard.repaired = true; }
    }
    // round 2 (conversation): a turn still only the question, or a line she already said, after every repair above: one
    // lead-slot call (the model writes only the response to what they said; code adds the question). Used only when the
    // joined turn has no problem the old one did not have; never after a floor or leak catch (a truth repair stands).
    // round 3: a leak caught on the first draft no longer bars this repair: the leak repair left only the question (owner-2
    // R3 "bare question after a wrong answer": a kit hint whose numbers equal the key, cut, then nothing to say), and the new
    // lead is checked against the key (leadOk) and the joined turn may carry no problem the repaired one did not, a leak
    // included. A floor catch still bars it (rj-conv-lead-repair-after-floor).
    if (p5Flag("LEADSLOT") && item && pinned && !whyProbe && !item.diagnostic && !CLOSING_MOVES.has(kindNow) && !guard.caught.some((c) => c === "floor" || (c === "leak" && !R3))) {
      const left = problems(reply);
      if (left.includes("bare") || left.includes("same")) {
        try {
          const why = left.includes("bare") ? "your last try was only the question: first respond to what they just said (or give the nudge or the step) in your own words"
            : "your last try repeated what you said earlier: say something new (a different nudge, example or way in)";
          const again = await leadCall(why, guard.firstDraft ?? reply);
          if (again) {
            const was = new Set(left), prevOn = slotState.on;
            slotState.on = true;
            const now = problems(again);
            if (!now.includes("bare") && !now.includes("same") && !now.includes("leak") && now.every((p) => was.has(p))) { reply = again; guard.leadRepair = true; } else slotState.on = prevOn;
          }
        } catch (e) { if (isContentFilter(e)) return await blockedAfterDraft(e, "content_filter_repair"); }
      }
    }
    // round 3: a re-pose STILL only the question after every model repair gets the fixed code lead (conversation/
    // fallback-lead.js: the kit hint's statements when safe and not said yet, else a generic nudge she has not said this
    // lesson), never the bare question: owner-2 R3 on prod 4 of 90 turns. Code lines, never prompt text (nothing to recite).
    if (R3 && item && pinned && (rePose || helpAsk) && !whyProbe && !item.diagnostic && !CLOSING_MOVES.has(kindNow) && !checkin && !guard.caught.includes("floor")
      && problems(reply).includes("bare")) {
      const fixedLead = fallbackLead({ request: state.lastMove?.request ?? null, hint: hintStatements(item, state.lastMove?.hintLevel), rePose: true, lang, avoid: earlier });
      if (fixedLead) {
        const joined = composeTurn(address === "aap" && lang !== "english" ? toAap(fixedLead) : fixedLead, askEnd);
        const was = new Set(problems(reply)), prevOn = slotState.on;
        slotState.on = true;
        const now = problems(joined);
        if (!now.includes("bare") && now.every((p) => was.has(p))) { reply = joined; guard.codeLead = true; } else slotState.on = prevOn;
      }
    }
    // round 7 (main's block 2 #11): a card she already read word for word, and the model STILL gave back only the card after
    // the samecard repair: never a bare re-read. The fixed code lead she has not said yet goes before it (as above).
    if (R3 && cardRepeat && item && (rePose || helpAsk) && !whyProbe && !item.diagnostic && !CLOSING_MOVES.has(kindNow) && !checkin && !guard.caught.includes("floor")
      && isBare(reply, promptFor(item, lang), ui.ask.text)) {
      const fixedLead = fallbackLead({ request: state.lastMove?.request ?? null, hint: hintStatements(item, state.lastMove?.hintLevel), rePose: true, lang, avoid: earlier });
      if (fixedLead) { reply = composeTurn(address === "aap" && lang !== "english" ? toAap(fixedLead) : fixedLead, ui.ask.text); guard.codeLead = true; }
    }
    // the cut marks the repairs leave (an orphan quote, an empty fragment) and a lead sentence that re-poses the question
    // round 7 (director2): deterministic repairs on every turn — a made-up diagnosis of their mistake, a mixed-script word,
    // "see it in words"
    if (kindNow !== "safeguard" && verdict !== "misconception" && madeUpDiagnosis(reply)) {
      const left = withoutDiagnosis(reply);
      reply = left && handsBack(left) ? left : item && !CLOSING_MOVES.has(kindNow) ? joinAsk(left, askEnd ?? pinned ?? "") : left || fallbackReply(state, item);
      guard.replaced = true; guard.caught = [...guard.caught, "diagnosis"];
    }
    { const u = withoutInWords(unmixWords(reply)); if (u !== reply) { reply = u; guard.repaired = true; } }
    // (director2 c6: "Tum bharo. Khaali jagah bharo: …"): a bare "fill it" sentence before a card that says it already goes
    if (/^(?:khaali\s+jagah\s+bharo|fill\s+(?:in\s+)?the\s+(?:gap|blank))/i.test(String(askEnd ?? pinned ?? "").trim())) {
      const kept = sentences(reply).filter((x) => !/^\s*(?:(?:ab|chalo|tum|aap)\s+)*(?:bharo|bhariye|fill\s+it(?:\s+in)?)\s*[.!]?\s*$/i.test(x));
      if (kept.length && kept.join(" ").trim() !== reply.trim()) { reply = kept.join(" ").trim(); guard.repaired = true; }
    }
    // round 7 (director2 c6 steering: "cricket ke baare mein" was parked by the Director, but her line never named it): a topic
    // parked this turn is said with its promise when her words left it out
    // (v4 W6: any topic parked this turn, an aside kept by the Director included, not only an explicit park request)
    if (kindNow !== "safeguard" && (state.later ?? []).some((p) => p.at === state.turn && p.servedAt == null)) {
      const e = (state.later ?? []).find((p) => p.at === state.turn && p.servedAt == null);
      const key = e ? (String(e.topic).toLowerCase().match(/\p{L}{4,}/gu) ?? []).find((w) => !PARK_STOP.has(w)) : null;
      if (key && !new RegExp(`\\b${key}`, "i").test(reply)) {
        reply = `${pickOf(PARK_ACK[lang === "english" ? "english" : "hinglish"], state)(e.topic)} ${reply}`.trim();
        guard.repaired = true;
      }
    }
    // round 7 (director2 c6 steering: "hindi mein batao" got the same line, no word that it was heard): the switch is said
    if (state.lastMove?.request === "language" && kindNow !== "safeguard" && !/\b(?:hindi|english|angrezi)\b|हिंदी|हिन्दी/i.test(reply)) {
      reply = `${pickOf(LANG_ACK[lang === "english" ? "english" : "hindi"], state)} ${reply}`.trim(); guard.repaired = true;
    }
    // (director3: "Riya" in 8-9 of 11 lines) her name opens a line at most once in three turns
    {
      const nm = String(state.ctx?.firstName ?? "").trim().split(/\s+/)[0];
      const recent = [...(history ?? [])].filter((t) => t.who === "teacher").slice(-2).map((t) => t.text ?? "").join(" ");
      if (nm && new RegExp(`\\b${nm}\\b`, "i").test(recent)) {
        const cut = reply.replace(new RegExp(`^\\s*${nm}\\s*[,—–-]\\s*`, "i"), "");
        if (cut !== reply && cut.trim()) { reply = cut.charAt(0).toUpperCase() + cut.slice(1); guard.repaired = true; }
      }
    }
    // dc-r7-script-walk-v2 R4: a sentence that contradicts the screen is dropped (never on a safeguard turn); a line left empty
    // falls back to the move's own fixed line
    if (kindNow !== "safeguard" && state.lastMove?.scriptBeat) {
      // (the card's own question is verified content, never checked against the board: a transfer question may name other
      // numbers or another shape, Learning's c6 s2/e2, s3/e1-e2)
      const cardQ = [ui?.ask?.text, item ? promptFor(item, lang) : null].filter(Boolean).map((x) => String(x).replace(/\s+/g, " ").trim());
      const inCard = (x) => { const t = x.replace(/\s+/g, " ").trim().replace(/[.!?।]+$/, ""); return t.length > 3 && cardQ.some((q) => q.includes(t)); };
      const bad = screenContradictions(reply, screenFacts(ui, state.lastMove)).filter((x) => !inCard(x));
      if (bad.length) {
        const kept = sentences(reply).filter((x) => !bad.some((b) => b.trim() === x.trim()));
        reply = kept.join(" ").trim() || fallbackReply(state, item);
        guard.repaired = true; guard.caught = [...guard.caught, "screenmismatch"];
      }
    }
    // round 7 T3 (listening contract): a wrong answer is ALWAYS corrected, first: graded wrong (or wrong to her own closed sum),
    // and her first sentence does not say it is not right → code says it before her line (never on a safeguard or closing turn)
    // (K1: only a GRADED wrong answer to the keyed question just asked; never her own unkeyed question's check)
    if (listenOn() && kindNow !== "safeguard" && !CLOSING_MOVES.has(kindNow) && !checkin && answeredNow && verdict === "not_yet"
      && !NOT_RIGHT.test(sentences(reply)[0] ?? reply)) {
      // (their words carrying the key — "1/3" said of a 1/3 card in a wrong form — are never repeated: that would say the key)
      const key = String(item?.answer ?? "").trim();
      // (director5: "1/2 sahi nahi hai. 1/2? Achha, dekhte hain…": the model's echo of their answer and its hedge contradict the
      // lead; they go)
      const echo = saidNow.replace(/[?？!.]+$/, "").trim().toLowerCase();
      const kept = sentences(reply).filter((x) => { const t = x.trim().toLowerCase().replace(/[?？!.]+$/, "");
        return !(echo && t === echo) && !/^(?:achha|accha|acha|hmm+|chalo|theek hai),?\s*(?:dekhte|dekhtey)\s+hain/i.test(x.trim()); });
      reply = `${notRightLead(key && saidNow.includes(key) ? "" : saidNow, lang)} ${kept.join(" ")}`.trim();
      guard.repaired = true; guard.caught = [...guard.caught, "uncorrected"];
    }
    const tidied = tidyAround(reply, pinned ? askEnd : null);
    if (tidied && tidied !== reply) { reply = tidied; guard.tidied = true; }
  }
  // ship5 fixer (experience B4: "apna maths sawaal likho" to a child talking hands-free): on a spoken lane her OWN words ask
  // the child to say it, never to write or type it (the pinned kit question is verified content and is left byte for byte)
  if (state.mode !== "text") {
    const spoken = speakNotWrite(reply, askEnd);
    if (spoken !== reply) { reply = spoken; guard.spoken = true; }
  }
  // 14.4 (QA TEST a9c3136d t8, 9ad86661): the goodbye strip took her only sentence ("…padhai rok dete hain—…?"), the full-turn
  // retry raised self-harm again and was refused, and the child got "" and a module tray. A turn is never empty: the fixed line.
  if (!String(reply ?? "").trim()) { reply = fallbackReply(state, item); guard.replaced = true; guard.emptied = true; }
  // round 7 S2: a code-rendered worked part is one framing sentence of hers (no numbers, no question; a fixed one when hers is
  // not that), the code lines, then the card when one is posed, else a fixed check-in question
  if (workedLines) {
    const first = sentences(reply)[0] ?? "";
    const whole = workedLines.some((l) => /^(?:Toh jawab|So the answer is):/.test(l));
    // her framing may state the problem with its own numbers (the invented guard holds them to the kit); never a question
    const remedy = kindNow === "reteach";
    // v6.1 R11 (director9: "Pehla kadam dekho" introduced step 2): a scripted worked step is framed by code with ITS step's
    // label (R7: never her words about which step it is)
    const stepN = Number(/^worked:step(\d+)$/.exec(String(state.lastMove?.scriptBeat?.beatId ?? ""))?.[1]) || null;
    const stepFrame = scripted && stepN && !remedy ? stepLabel(stepN, lang) : null;
    const framing = stepFrame ?? (first && !/[?？]/.test(first) && words(first) <= (remedy ? 15 : 30) && !foreignOf(first).length && !((remedy || scripted) && /\d/.test(first)) && !(scripted && RULE_SAID.test(first)) ? first.trim()
      : pickOf((remedy ? REMEDY_FRAME : whole ? WORKED_FRAME : WORKED_FRAME_PART)[lang === "english" ? "english" : "hinglish"], state));
    // (v6.1 R9: a scripted step's check-in only where state.js allowed one; else a statement)
    const ask = item && ui?.ask?.itemId === item.id ? ui.ask.text : pickOf((scripted && !state.lastMove?.checkinOk ? WORKED_GO : WORKED_ASK)[lang === "english" ? "english" : "hinglish"], state);
    // v3 K2: a remediation follows a graded wrong answer, and its board goes up on this turn, so the verdict is said first:
    // her lead when it says "not right" (and not the key), else code's
    const key0 = String(state.lastMove?.content?.find((c) => /^its answer: /.test(c))?.slice(12) ?? "").trim();
    const lead = remedy && verdict === "not_yet" ? (NOT_RIGHT.test(first.replace(/\bkoi\s+baat\s+nahi?n?\b/gi, "")) && words(first) <= 15 && !(key0 && first.includes(key0)) ? first.trim()
      : notRightLead(key0 && saidNow.includes(key0) ? "" : saidNow, lang)) : null;
    reply = [lead ?? framing, ...workedLines, ask].join(" ").replace(/\s+/g, " ").trim();
    if (problems(reply).includes("bracket")) reply = sayBrackets(reply, state.lastContent ?? [], lang); // spoken: "50 plus 30, that is 80, times 2"
    if (problems(reply).includes("ignored") && bareNumberSaid != null) reply = `${ignoredLead(bareNumberSaid, lang, state)} ${reply}`;
    guard.workedCode = true;
  }
  // round 7 S3: a card let go after two misses plus help has its answer and why said, in code, when her line left them out
  const gave = state.lastMove?.gave;
  // (v4 W2: in script mode the give-up is one clean sentence said by the final assembly below, never glued here)
  const scriptCardNow = !!state.lastMove?.scriptBeat || !!(item && (item.scriptAsk || item.scriptCheck || item.scriptThen));
  if (gave?.answer && !scriptCardNow && kindNow !== "safeguard" && !new RegExp(`(?<![\\d.])${gave.answer.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}(?![\\d])`).test(reply)) {
    reply = `${pickOf(GAVE_LINE[lang === "english" ? "english" : "hinglish"], state)(gave.answer, gave.why)} ${reply}`.trim();
    guard.gaveAnswer = true;
  }
  // round 7 S1 (main's director2 decision: "guards ENFORCE, a flagged draft never ships"): after the rewrite and every code
  // repair, a line still carrying a truth or teaching problem is replaced by the move's fixed code line (built from the item's
  // fields), when that line is itself clean of them. Never on a safeguard turn (rj-r1442).
  if (kindNow !== "safeguard" && !forgetSafety) {
    // (a leak the design let stand, a requested example whose next item is marked spoiled instead, is not enforced)
    const bad = problems(reply).filter((p) => ENFORCED.has(p) && !(p === "leak" && guard.spoilsAhead && state.lastMove?.request));
    if (bad.length) {
      const card = ui?.ask?.text ?? askEnd ?? null;
      const cands = [
        !scripted && bad.includes("underived") && card ? (() => { const l = derivationLead(underived(reply, item, kit?.workedExample?.problem), kit?.workedExample, lang); return l ? joinAsk(l, card) : null; })() : null,
        englishCard ? (address === "aap" ? ENGLISH_CARD_LINE.aap : ENGLISH_CARD_LINE.tum) : null,
        // (director3: "Chalo, isko ek chhote step mein saath mein dekhte hain." alone, content-free) no card: the fixed line carries
        // the lesson's own content, the worked example's first lines rendered in code
        !item ? contentFallback(state, kit, lang) : null,
        fallbackReply(state, item),
      ].filter(Boolean);
      const fixed = cands.find((c) => !problems(c).some((p) => ENFORCED.has(p)));
      if (fixed) { guard.enforced = bad; reply = fixed; guard.replaced = true; }
      else guard.unenforced = bad;
    }
  }
  // director6 (K1/K2, after every repair above): the verdict on a graded answer is the FIRST thing she says.
  // - wrong: the not-right sentence leads. A give-up reveal of the previous card ("Pichhle sawaal ka jawab …") or an S1 fixed
  //   line had pushed it second or dropped it (14 of director6's 16 verdict misses); a later one is moved up, a missing one
  //   added by code (never the key)
  // - right: her line never negates their answer ("Riya, 1/8 nahi; …" to a graded-right 1/8, director6's one right answer
  //   called wrong); the negation goes and the line leads with a plain yes
  if (listenOn() && kindNow !== "safeguard" && !CLOSING_MOVES.has(kindNow) && !checkin && answeredNow && !clause.sent) {
    const ss = sentences(reply);
    const isLead = (x) => NOT_RIGHT.test(String(x).replace(/\bkoi\s+baat\s+nahi?n?\b/gi, "")) && !affirmsAnswer(x);
    if (verdict === "not_yet" && ss.length && !isLead(ss[0])) {
      const key = String(item?.answer ?? "").trim();
      const at = ss.findIndex((x) => isLead(x) && words(x) <= 12 && !(key && x.includes(key)));
      reply = at > 0 ? [ss[at], ...ss.filter((_, i) => i !== at)].join(" ").replace(/\s+/g, " ").trim()
        : `${notRightLead(key && saidNow.includes(key) ? "" : saidNow, lang)} ${reply}`.trim();
      guard.verdictFirst = at > 0 ? "moved" : "added";
    } else if (verdict === "correct" && (negatesAnswer(reply, saidNow) || !affirmsAnswer(ss[0] ?? ""))) {
      // (an S1 fixed line or the card alone carries no yes: the graded-right answer is still confirmed first)
      const yes = lang === "english" ? "Yes, that's right." : "Haan, sahi hai.";
      const neg = negatesAnswer(reply, saidNow);
      reply = `${yes} ${neg ? withoutNegation(reply, saidNow) : reply}`.replace(/\s+/g, " ").trim();
      guard.verdictFirst = neg ? "unnegated" : "confirmed";
    }
  }
  // dc-r7-script-walk-v4 W1/W3 (director6: guards left the bare card 45 times, deleted authored says and steps, doubled the point,
  // put it mid-ask): in script mode the turn is ASSEMBLED last, from parts no guard can cut. Guards above act on her own clauses;
  // here the order is fixed: the verdict → one clean give-up sentence → the authored text → the card, whole.
  // - authored text: the code-rendered remediation say or worked lines; on an explain beat her own lines when they carry the
  //   point, else ONE short clause of hers then the point verbatim (never both, never mid-ask)
  // - a turn that would be the bare card says the card's own authored line first ("Yaad karo: …")
  const scriptTurn = !!state.lastMove?.scriptBeat || !!state.lastMove?.splitClose || !!(item && (item.scriptAsk || item.scriptCheck || item.scriptThen));
  if (scriptTurn && kindNow !== "safeguard" && !CLOSING_MOVES.has(kindNow) && !checkin && !clause.sent && !forgetSafety) {
    const norm = (x) => String(x ?? "").replace(/\s+/g, " ").trim();
    const dot = (x) => (/[.!?।]$/.test(norm(x)) ? norm(x) : `${norm(x)}.`);
    const card = ui?.ask?.text ? norm(ui.ask.text) : null;
    const cardSs = card ? sentences(card).map(norm) : [];
    const gaveA = state.lastMove?.gave?.answer ? norm(state.lastMove.gave.answer) : null;
    const key0s = String(item?.answer ?? "").trim();
    // v5 B5: a give-up or a close says the answer AND its why (state.js scriptWhyOf: the authored rule)
    const whyS = (w) => (w && String(w).trim() ? (lang === "english" ? `, because ${joinable(w, { lower: true })}` : `, kyunki ${joinable(w, { lower: true })}`) : "");
    // v6 (director8 c4 ×6: "Pichhle sawaal ka jawab nahi tha" heard as "there was no answer"): a yes/no key is said as the
    // right answer named, never as "<nahi> tha"
    const yesNo = (a) => /^(?:haan|ha|nahi|nahin|yes|no)$/i.test(String(a ?? "").trim());
    // v6.1 R11 (director9 c6 steering T21: "Pichhle sawaal ka jawab 30 cm tha" for the card still in front of them): the card let
    // go is "the last question" only once another card is posed in its place; otherwise it is "this question"
    const nextCard = !!card;
    const gw = whyS(state.lastMove?.gave?.why);
    const gaveS = gaveA ? (lang === "english" ? (nextCard ? (yesNo(gaveA) ? `The last question's right answer: ${gaveA}${gw}.` : `The last question's answer was ${gaveA}${gw}.`)
        : yesNo(gaveA) ? `This question's right answer: ${gaveA}${gw}.` : `This question's answer is ${gaveA}${gw}.`)
      : nextCard ? (yesNo(gaveA) ? `Pichhle sawaal ka sahi jawab: ${gaveA}${gw}.` : `Pichhle sawaal ka jawab ${gaveA} tha${gw}.`)
        : yesNo(gaveA) ? `Is sawaal ka sahi jawab: ${gaveA}${gw}.` : `Is sawaal ka jawab ${gaveA} hai${gw}.`) : null;
    const isGave = (x) => !!gaveA && /^(?:pichhle sawaal|pichhla sawaal|is sawaal ka|woh wala|the last|this question|that one)/i.test(x);
    let ss = sentences(reply).map(norm).filter(Boolean)
      .filter((x) => !isGave(x) && !(card && (cardSs.includes(x) || (x.length > 3 && card.includes(x.replace(/[.!?।]+$/, ""))))));
    const graded = listenOn() && answeredNow && (verdict === "not_yet" || verdict === "correct");
    let lead = graded && ss.length ? ss.shift() : null;
    // v6 R2 (main, director8: c4 stuck T33 'Yahan "Yes" galat hai … isliye khaya hissa 2/3 hai' was flagged invented, repaired
    // and kept, and said the worked answer before it was derived): in a scripted turn every number she says must be one this
    // turn's authored text, the card just graded (its prompt; its key once graded right) or the child's words carry. A sentence
    // of hers stating any other number goes; a verdict lead stating one is replaced by code's verdict. A draft the invented
    // guard caught keeps none of her sentences: the authored parts and code's verdict are the line.
    const graded0 = state.lastGraded ?? null;
    const okNums = new Set();
    for (const t of [point, ...(workedLines ?? []), card, state.lastMove?.cardPoint, ...(state.lastMove?.sayFirst ?? []), state.lastMove?.gave?.answer, state.lastMove?.gave?.why,
      state.lastMove?.closed?.answer, state.lastMove?.closed?.why, state.lastMove?.workedDone?.answer, state.lastMove?.workedDone?.why, state.lastMove?.returned?.line,
      ...(state.lastMove?.mustSay ?? []), graded0?.prompt, verdict === "correct" ? graded0?.key : null, ...(verdict === "correct" ? graded0?.accept ?? [] : []), saidNow, ...(item?.hints ?? [])]) {
      for (const n of String(t ?? "").match(/\d+(?:[./]\d+)?/g) ?? []) { okNums.add(n); for (const k of n.split(/[./]/)) okNums.add(k); }
    }
    // (a working shown in the sentence, "8 + 3 = 11", from numbers it may say, is arithmetic, not a stated key)
    const worked = (x) => { const ok = new Set(); for (const m of String(x).matchAll(/(\d+)\s*([+\-×x*])\s*(\d+)\s*=\s*(\d+)/g)) {
      const [a1, op, b1, c1] = [Number(m[1]), m[2], Number(m[3]), Number(m[4])];
      if ((op === "+" && a1 + b1 === c1) || (op === "-" && a1 - b1 === c1) || ("×x*".includes(op) && a1 * b1 === c1)) ok.add(m[4]); } return ok; };
    const strayNums = (x) => { const w = worked(x); return (String(x).match(/\d+(?:[./]\d+)?/g) ?? []).filter((n) => !okNums.has(n) && !w.has(n)); };
    const inventedDraft = (guard.caught ?? []).includes("invented");
    // (v6.4 P2, director12 c5-t02 stuck 46: "1/10 sahi nahi hai." was a 5-word page of its own before the remediation's page, and
    // the turn could not be paged: when another board's page follows the verdict, it is the bare one, said on that page)
    const codeVerdict = () => (verdict === "not_yet" ? notRightLead(key0s && saidNow.includes(key0s) || (state.lastMove?.simplerBeat?.board && JSON.stringify(state.lastMove.simplerBeat.board) !== JSON.stringify(state.lastMove?.cardBeat?.board ?? state.lastMove?.scriptBeat?.board ?? null)) ? "" : saidNow, lang) : lang === "english" ? "Yes, that's right." : "Haan, sahi hai.");
    if (lead && (inventedDraft || strayNums(lead).length)) { guard.falseNumbers = [...(guard.falseNumbers ?? []), ...strayNums(lead)]; lead = codeVerdict(); guard.verdictCode = true; }
    // v6.1 R11 (director9 c4 ×8: "Yes sahi nahi hai", their English said back): a not-right verdict in a scripted turn is code's
    if (lead && verdict === "not_yet" && !guard.verdictCode) { const cv = codeVerdict(); if (norm(lead) !== norm(cv)) { lead = cv; guard.verdictCode = "notRight"; } }
    // v6.1 R11 (director9: a stray Devanagari switch mid-lesson): her lines are in the lesson's script, never a sudden Devanagari one
    { const n0 = ss.length; ss = ss.filter((x) => !/\p{Script=Devanagari}/u.test(x)); if (ss.length < n0) guard.scriptSwitch = n0 - ss.length; }
    const before = ss.length;
    ss = inventedDraft ? [] : ss.filter((x) => { const bad = strayNums(x); if (bad.length) guard.falseNumbers = [...(guard.falseNumbers ?? []), ...bad]; return !bad.length; });
    if (ss.length < before) guard.strayDropped = before - ss.length;
    // v5 B5: one verdict sentence per turn ("Haan, sahi hai. Haan, 4/6 sahi hai."): a second verdict of the same sign right after
    // the lead is one too many; the richer of the two stays (a bare code verdict gives way to hers)
    // (v6.2 H5, director10 c5-t02 steering T19: "Koi baat nahi, isko ek baar aur aaram se dekhte hain." read as a "no" and replaced
    // code's "1/8 sahi nahi hai.": a consolation is no verdict)
    const polarity = (x) => { const y = String(x).replace(/\bkoi\s+baat\s+nahi?n?\b/gi, "").replace(/^[\s,]+/, "");
      return NOT_RIGHT.test(y.split(/[,—–-]/)[0]) && !affirmsAnswer(y) ? "no" : affirmsAnswer(y) ? "yes" : null; };
    const verdictLike = (x) => polarity(x) && words(x) <= 12 && !/[?？]/.test(x);
    while (lead && ss.length && verdictLike(ss[0]) && polarity(ss[0]) === polarity(lead)) {
      const nxt = ss.shift();
      if (words(lead) <= 4 && words(nxt) > words(lead) && !guard.verdictCode) lead = nxt;
    }
    // v6 R5 (director8: "Haan, sahi hai. Haan, 28 m." 9× in c6, 5× in c5-t02): one verdict sentence per turn. A later sentence of
    // hers that opens with a verdict of the same sign loses its verdict words; what is left stays only when it says something
    // (a reason), never a bare restatement of their answer
    if (lead && polarity(lead)) {
      const sign = polarity(lead);
      const yesHead = /^(?:(?:haan|ha|yes|bilkul|sahi|shabash|bahut\s+badhiya|well\s+done|right|correct|exactly|ekdam)\b[\s,!.—–-]*)+/iu;
      const noHead = /^(?:(?:nahi|nahin|no|not\s+quite|galat)\b[\s,!.—–-]*)+/iu;
      // (v6.4 P2, director12 c5-t02 steady 64: "Haan, Gopi ke paas zyada hai." lost "Gopi" as if it were her name: only the child's
      // own name is a name head)
      const fn = String(state.ctx?.firstName ?? "").trim().split(/\s+/)[0];
      const nameHead = fn ? new RegExp(`^${fn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s,!.—–-]+`, "iu") : /^\u0000/u;
      const verdictWords = sign === "yes" ? /^(?:[\d/.]+(?:\s*(?:cm|m|km|kg|g|l|ml))?\s+)?(?:bilkul\s+)?(?:sahi|right|correct)(?:\s+(?:hai|h|is))?[\s,!.—–-]*/iu
        : /^(?:\S+\s+){0,3}?(?:sahi\s+nahi|galat|not\s+right)(?:\s+(?:hai|h|is))?[\s,!.—–-]*/iu;
      ss = ss.flatMap((x) => {
        if (/[?？]/.test(x)) return [x];
        const opens = sign === "yes" ? yesHead.test(x) || (verdict === "correct" && polarity(x) === "yes") : noHead.test(x) || polarity(x) === "no";
        if (!opens) return [x];
        const rest = x.replace(sign === "yes" ? yesHead : noHead, "").replace(nameHead, "").replace(verdictWords, "").trim();
        guard.verdictOnce = (guard.verdictOnce ?? 0) + 1;
        return rest && words(rest) >= 4 && !/^[\d/.\s]+(?:cm|m|km)?[.!]?$/.test(rest) ? [dot(rest.charAt(0).toUpperCase() + rest.slice(1))] : [];
      });
    }
    // v6 (main, director8 c5-t01 steady T65: "Haan, sahi hai. 4/6 nahi… tumne marks aur gaps ko mila diya" to a right 4/6): no
    // sentence of hers contradicts code's verdict: after a right answer nothing says it is not right or names a mix-up of
    // theirs; after a wrong one nothing affirms it
    if (lead && graded) {
      const n0 = ss.length;
      ss = verdict === "correct"
        ? ss.filter((x) => !(polarity(x) === "no" || negatesAnswer(x, saidNow) || /(?<![\p{L}])(?:galat|mila\s+diya|mila\s+di|mix\s+kar|confuse|ulta)(?![\p{L}])/iu.test(x)))
        : ss.filter((x) => polarity(x) !== "yes");
      if (ss.length < n0) guard.verdictContradiction = n0 - ss.length;
    }
    // v6.1 R7 (main, director9: "chhota denominator wala fraction pehle aata hai", "Cheenti har kinaare se do baar guzarti hai",
    // right verdicts with wrong reasons ×4): no model-written teaching in script mode.
    // - a right answer's reason is the card's AUTHORED why (turn.js lastGraded.why), else none: her reason goes, code says it
    // - a sentence of hers that states a rule ("… kyunki …", "… hota hai") is no part of a turn whose teaching is authored
    // - any sentence of hers that states the card's listed wrong answer (wrongIfMis) as true goes
    const wims = [graded0?.wrongIfMis, (item?.scriptAsk ?? item?.scriptCheck ?? item?.scriptThen)?.wrongIfMis].filter((x) => x != null && String(x).trim()).map((x) => String(x).trim().toLowerCase());
    const statesMis = (x) => { const t = ` ${String(x).toLowerCase()} `; return wims.some((w) => new RegExp(`(?<![\\p{L}\\p{N}/])${w.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}(?![\\p{L}\\p{N}/])`, "u").test(t))
      && !/(?<![\p{L}])(?:nahi|nahin|not|galat|sahi\s+nahi)(?![\p{L}])/iu.test(t); };
    { const n0 = ss.length; ss = ss.filter((x) => !statesMis(x)); if (ss.length < n0) guard.misStated = n0 - ss.length; }
    if (lead && verdict === "correct" && graded) {
      const bare = String(lead).split(/(?<![\p{L}])(?:kyunki|because|isliye|matlab|since)(?![\p{L}])/iu)[0].replace(/[\s,;]+$/, "").trim();
      const why = graded0?.why ? String(graded0.why).trim() : null;
      const hadWhy = bare.length < String(lead).replace(/[.!?।]+$/, "").trim().length;
      if (hadWhy || why) {
        const why1 = why ? (lang === "english" ? `, because ${joinable(why, { lower: true })}` : `, kyunki ${joinable(why, { lower: true })}`) : "";
        lead = dot(`${(bare && affirmsAnswer(bare) ? bare : lang === "english" ? "Yes, that's right" : "Haan, sahi hai").replace(/[.!?।]+$/, "")}${why1}`);
        guard.rightWhy = why ? "authored" : "none";
      }
    }
    // v6.2 H4 (director10 c4: "Zaroor. Now try."): a bare English filler in a Hinglish lesson goes
    if (lang !== "english") { const n0 = ss.length; ss = ss.filter((x) => !/^(?:now\s+try|try\s+now|let'?s\s+(?:try|go|see)|try\s+it|go\s+on|okay|ok|good|great|nice|well\s+done)[.!]?$/i.test(norm(x))); if (ss.length < n0) guard.fillerDropped = n0 - ss.length; }
    // (director10 c4 offtopic T23: "Bilkul, no sahi hai: …" — their English word said back in the verdict): code's yes
    if (lead && verdict === "correct" && lang !== "english" && /(?<![\p{L}])(?:no|yes)(?![\p{L}])/iu.test(lead)) {
      const w0 = graded0?.why ? String(graded0.why).trim() : null;
      lead = dot(`${lang === "english" ? "Yes, that's right" : "Haan, sahi hai"}${w0 ? (lang === "english" ? `, because ${joinable(w0, { lower: true })}` : `, kyunki ${joinable(w0, { lower: true })}`) : ""}`);
      guard.verdictCode = "echo"; }
    // (every scripted turn: the teaching is the script's; a rule or reason in her words is model-written teaching)
    { const n0 = ss.length; ss = ss.filter((x) => !RULE_SAID.test(x)); if (ss.length < n0) guard.ruleDropped = n0 - ss.length; }
    // v4 W6: a topic parked this turn keeps its promise sentence, and a parked topic served now keeps its return (code says a
    // short one when her words left it out); they come after the verdict, before the teaching
    const keyOf = (t) => (String(t ?? "").toLowerCase().match(/\p{L}{4,}/gu) ?? []).find((w) => !PARK_STOP.has(w)) ?? null;
    const parkedNow = (state.later ?? []).find((p) => p.at === state.turn && p.servedAt == null);
    const ret = state.lastMove?.returned ?? null;
    const aside = [], retMine = [];
    for (const [topic, kind] of [[parkedNow?.topic, "park"], [ret?.topic, "return"]]) {
      const k = keyOf(topic);
      if (!k) continue;
      // (a return's candidates are all her sentences naming it: H2″ picks the one line that passes)
      const mine = ss.filter((x) => new RegExp(`\\b${k}`, "i").test(x)).slice(0, kind === "return" ? 6 : 2);
      ss = ss.filter((x) => !mine.includes(x));
      // v5 B3 (director7: "Virat wali baat mujhe yaad hai" ×8): a return is one line of REAL content: her own sentence about it,
      // else the script's authored interest line (state.js returnLineOf); never the "I remember" stub
      // (v6.4 H2″: no code line — the return is hers, held to returnLineOk below)
      const authoredReturn = null;
      // v6 R4 (director8: "Virat ka cover drive boundary ke poore round jaisa", "tumne kaha tha ki tumhe woh pasand hain"): a
      // return of hers is content about the thing itself: never an analogy to the lesson, never words put in their mouth
      const real = mine.filter((x) => words(x) >= 6 && !/(?:yaad hai|i remember)/i.test(x) && !/\d/.test(x)
        && !/(?<![\p{L}])(?:jaisa|jaise|jaisi|ki\s+tarah|socho|like\s+(?:a|the)|just\s+like)(?![\p{L}])/iu.test(x)
        && !/(?<![\p{L}])(?:tumne|aapne|you)\s+(?:kaha|bataya|bola|said|told)|tumhe\s+\S+(?:\s+\S+)?\s+pasand|you\s+like/iu.test(x));
      if (kind === "return" && mine.length > real.length) guard.returnFiltered = mine.length - real.length;
      // v6.1 R10 (director9: "Sixer ke baad ball boundary ke paar—wah, cricket mein fractions bhi gaps gin-gin kar…"): a park of
      // hers is the promise alone, never an analogy to the lesson (no lesson words, no numbers); else code's promise
      const LESSON_W = /(?<![\p{L}])(?:fraction\w*|bhinn|line|rekha|gap\w*|mark\w*|nishaan|hiss\w*|tukd\w*|bhuja\w*|parimap|perimeter|denominator|numerator|sawaal)(?![\p{L}])/iu;
      const parkOk = mine.filter((x) => !/\d/.test(x) && !LESSON_W.test(x) && !/^\s*\p{L}+\s*:\s/u.test(x) && !/(?<![\p{L}])(?:jaisa|jaise|jaisi|ki\s+tarah|bhi|like)(?![\p{L}])/iu.test(x) && !RULE_SAID.test(x));
      if (kind === "park" && mine.length > parkOk.length) guard.parkFiltered = mine.length - parkOk.length;
      // (v6.3 R2: a park is promised once: when code's promise is said, her own promise sentence that names no topic goes)
      if (kind === "park" && !parkOk.length) { const n0 = ss.length; ss = ss.filter((x) => !(PROMISE_SAID.test(x) && !/\d/.test(x))); if (ss.length < n0) guard.parkDup = n0 - ss.length; }
      if (kind === "park") aside.push(...(parkOk.length ? parkOk : [pickOf(PARK_ACK[lang === "english" ? "english" : "hinglish"], state)(topic)]));
      else retMine.push(...mine.filter((x) => !/^(?:aur|and about)\s+\p{L}+\s+(?:ki baat\s*)?:/iu.test(x)));
    }
    // v6.4 H2″ (main, director12): the return is ONE line of hers that answers what they said — their question too — with one of their
    // words, at most 20 words, no lesson numbers, no new promise, no fixed template; else one short retry; else none this turn
    // (an "Aur X ki baat: …" of hers — the old code return, said again from her history — always goes)
    { const n0 = ss.length; ss = ss.filter((x) => !/^(?:aur|and about)\s+\p{L}+\s+(?:ki baat\s*)?:/iu.test(x)); if (ss.length < n0) guard.returnFiltered = (guard.returnFiltered ?? 0) + n0 - ss.length; }
    if (ret?.topic) {
      const said0 = ret.said ?? "";
      const pool = [...retMine, ...ss.filter((x) => !retMine.includes(x) && returnLineOk(x, said0, ret.topic))];
      let line = pool.find((x) => returnLineOk(x, said0, ret.topic)) ?? null;
      ss = ss.filter((x) => x !== line);
      if (!line && said0) {
        try {
          const r = await replyDeps.chat(DEPLOY.reply, [{ role: "system", content: returnNoteOf(said0, ret.topic, lang, true) }, { role: "user", content: said0 }], { maxTokens: 60, effort: "none", timeoutMs: 3000, trace });
          const c = (String(r?.text ?? "").match(/[^.!?\u0964]+[.!?\u0964]?/) ?? [""])[0].trim();
          if (returnLineOk(c, said0, ret.topic)) { line = dot(c); guard.returnRetry = true; }
        } catch { /* no line: the return is not said this turn */ }
      }
      if (line) { aside.push(line); guard.returnSaid = true; } else guard.returnMissed = true;
    }
    // v6.3 H2′ (director11: "Aur Virat ki baat: …" mid-card, before the promised card was closed): an open aside that is neither
    // parked nor returned on this turn is not talked about by her either (a sentence naming it with no number of the lesson goes)
    {
      const n0 = ss.length;
      for (const e of (state.later ?? []).filter((p) => p.share && p.servedAt == null && p !== parkedNow)) {
        const k = keyOf(e.topic);
        if (k && (!ret || keyOf(ret.topic) !== k)) ss = ss.filter((x) => !(new RegExp(`\\b${k}`, "i").test(x) && !/\d/.test(x)));
      }
      if (ss.length < n0) guard.asideEarly = n0 - ss.length;
    }
    // v5 B5 (director7 c5-t01 T61): her lines never put a method in the child's mouth ("Tumne upar ke 2 ko neeche ke 5 se
    // jodkar …") that the authored text does not use: a sentence about what THEY did with an operation word goes
    const OPS = /(?<![\p{L}])(?:jod\w*|ghata\w*|guna\w*|bhaag\w*|add\w*|subtract\w*|multipl\w*|divid\w*|mila\w*)/iu;
    const authoredText = [point, ...(workedLines ?? []), card, state.lastMove?.cardPoint].filter(Boolean).join(" ");
    ss = ss.filter((x) => !(/^(?:tumne|aapne|you)\b/i.test(x) && OPS.test(x) && !OPS.test(authoredText)));
    // v6 R3/R5 (director8: verbatim repeats of 63–67-word turns): no sentence of her previous turn is said again in her own words
    // (the authored parts and the card are code's, and stay)
    const herPrev = norm([...(state.recent ?? [])].reverse().find((t) => t.who === "teacher")?.text ?? "").toLowerCase();
    const saidBefore = (x) => { const t = norm(x).toLowerCase().replace(/[.!?\u0964]+$/, ""); return !!herPrev && t.length > 12 && herPrev.includes(t); };
    { const n0 = ss.length; ss = ss.filter((x) => !saidBefore(x)); if (ss.length < n0) guard.repeatDropped = n0 - ss.length; }
    // v6 R3: a probe answered: one line that takes up how they thought (hers when she wrote one), before anything new
    let ack = null;
    if (state.lastMove?.probeAck && answeredNow) {
      const a0 = ss[0];
      // v6.1 R8 (main, director9 c6 stuck T23: "Is aayat ke kinaare par ek baar dhaaga lagana hai." — e3's opening — was taken
      // as the acknowledgement and said over e2's board): hers is the acknowledgement only when it takes up what THEY said
      const takesUp = (x) => /^(?:achha|accha|acha|theek|thik|hmm+|ok(?:ay)?|samajh\s+(?:gayi|gaya)|i\s+see|good|nice)\b|(?<![\p{L}])(?:tumne|tumhara|tumhari|tumhe|you|your)(?![\p{L}])/iu.test(x);
      // (v6.3 R2: and only on a confident read of what they said; otherwise code's acknowledgement)
      if (a0 && state.lastReadConfident !== false && words(a0) <= 12 && !/\d/.test(a0) && !/[?？]/.test(a0) && !polarity(a0) && takesUp(a0) && !RULE_SAID.test(a0)) { ack = a0; ss = ss.slice(1); }
      // v6.2 H3 (main, director10: "Theek, yeh tumhari soch thi." to "woh toh ho gaya na"): code's line says they told how they thought
      // only when they did (a reason in their words); anything else is a plain "okay"
      else {
        if (a0 && state.lastReadConfident === false && takesUp(a0) && !/[?？]/.test(a0)) { ss = ss.slice(1); guard.ackCode = true; }
        ack = REASON_SAID.test(saidNow) ? pickOf(PROBE_ACK[lang === "english" ? "english" : "hinglish"], state) : lang === "english" ? "Okay." : "Theek hai.";
      }
      guard.probeAck = true;
    }
    // v6 R3: a repeated miss on an adding card names exactly what their total left out
    const miss = kindNow === "hint" && verdict === "not_yet" && card ? missingPieces(card, saidNow, item?.answer) : null;
    const unit = String(item?.answer ?? "").match(/\d\s*([a-zA-Z]+)\s*$/)?.[1] ?? "";
    const missS = miss ? (() => { const xs = miss.map((n) => `${n}${unit ? ` ${unit}` : ""}`); const list = xs.length > 1 ? `${xs.slice(0, -1).join(", ")} ${lang === "english" ? "and" : "aur"} ${xs.at(-1)}` : xs[0];
      return lang === "english" ? `Your total leaves out ${list}.` : `Tumhare jod mein ${list} nahi juda.`; })() : null;
    if (missS) { ss = ss.filter((x) => !/chhoot|left out|miss|bhool/i.test(x)); guard.missingNamed = miss; }
    // v6 R3: a picture they asked for is described by code from the board it sends; her own lines that point at the screen,
    // ask a question of their own, or carry a number go (the card is the one question)
    // (Studio's alternate view, main/Studio on director8 c5-t02: when the live card's board was already up, a second view of the
    // same numbers is drawn and flagged; her words then say it is the same numbers in the new view. A board code cannot describe
    // still gets an acknowledgement: a picture ask is never ignored, and the beat and card stay)
    const visualAsk = (state.lastMove?.request === "visual" || !!state.lastMove?.visual) && state.lastMove?.visual !== "game";
    const alt = visualAsk ? state.lastMove?.altView ?? null : null;
    const ALT_WORD = { parts: ["patti", "bars"], bars: ["patti", "bars"], line: ["sankhya rekha", "a number line"], groups: ["groups", "groups"] };
    const asked = !visualAsk ? null
      : alt ? (() => { const w = ALT_WORD[alt.view ?? alt] ?? ALT_WORD.parts; const nums = [...new Set(Array.isArray(alt?.labels) && alt.labels.length ? alt.labels.map(String) : JSON.stringify(state.lastMove?.scriptBeat?.board ?? {}).match(/\d+\/\d+/g) ?? [])].filter((n) => !item?.answer || !String(item.answer).includes(n)).slice(0, 3);
        // (Studio: a bar card's second view is a number line: "0 se 1 ki sankhya rekha, 8 barabar gaps, nishaan 1/8 par")
        // (Studio wholes@1: a compare card's two wholes drawn, "whole1 3 unequal parts · whole2 3 equal parts", named by code)
        if ((alt.view ?? alt) === "wholes" && Array.isArray(alt.wholes) && alt.wholes.length) {
          const bp = state.lastMove?.scriptBeat?.board?.params ?? {};
          const names = alt.names ?? [bp.left?.title, bp.right?.title].filter((x) => typeof x === "string" && x.trim());
          const one = (w, i) => { const n = names[i] ?? (lang === "english" ? `whole ${i + 1}` : `${i + 1} wala`); const sh = w.shaded != null ? (lang === "english" ? `, ${w.shaded} shaded` : `, ${w.shaded} rangin`) : "";
            return lang === "english" ? `${n} in ${w.parts} ${w.equal ? "equal" : "unequal"} pieces${sh}` : `${n} ke ${w.parts} ${w.equal ? "barabar" : "alag-alag"} tukde${sh}`; };
          return lang === "english" ? `Look: ${alt.wholes.map(one).join("; ")}.` : `Dekho: ${alt.wholes.map(one).join("; ")}.`;
        }
        if ((alt.view ?? alt) === "line") return lang === "english" ? `Look, the same on a number line from 0 to 1${alt.gaps ? `, ${alt.gaps} equal gaps` : ""}${nums.length ? `, marked at ${nums.join(" and ")}` : ""}.`
          : `Dekho, yahi 0 se 1 ki sankhya rekha par${alt.gaps ? `, ${alt.gaps} barabar gaps` : ""}${nums.length ? `, nishaan ${nums.join(" aur ")} par` : ""}.`;
        return lang === "english" ? `Look, ${nums.length ? `the same ${nums.join(" and ")}` : "the same numbers"}, now as ${w[1]}.` : `Dekho, ${nums.length ? `yahi ${nums.join(" aur ")}` : "yahi numbers"} ab ${w[0]} par.`; })()
      : boardWords(state.lastMove?.scriptBeat?.board, lang, item?.answer) ?? (lang === "english" ? "Let's see it in a picture." : "Chalo, ise picture mein dekhte hain.");
    if (asked) { ss = ss.filter((x) => !/(?:screen|board|dekho|yahan|look|see)/i.test(x) && !/[?？]/.test(x) && !/\d/.test(x)).slice(0, 1); guard.boardWords = true; }
    const clean = (x) => x && !/[?？]/.test(x) && words(x) <= 14 && !foreignOf(x).length;
    const oneClause = (x) => { const c = String(x).split(/[,;:—–]|\s-\s/)[0]; return dot(words(c) >= 3 ? c : x); };
    let body;
    if (workedLines?.length) {
      // (the model's own words on a code-rendered turn: only a framing sentence, and only when no verdict leads)
      // (v6 R5, director8 c6 T51/T73: "Pehla joda: 24 cm plus 18 cm barabar 42 cm." before the step derived it): her framing on a
      // scripted worked or remediation turn carries no number; the code lines carry them, in order
      const frame = !lead && clean(ss[0]) && !/\d/.test(ss[0]) && !RULE_SAID.test(ss[0]) ? ss[0] : null;
      body = [...(frame ? [frame] : []), ...workedLines.map(norm)];
    } else if (point && kindNow === "explain" && state.lastMove?.smaller) {
      // v6 R3 (director8: "pata nahi" / "samajh nahi aaya" got the same beat in the same words, 0/4 in c6): the SAME idea
      // smaller: her own new short lines (never her last turn's), else ONE sentence of the authored point, not all of it
      // v6.1 R7/R8 (director9: c5-t01 T27 "chhota denominator wala fraction pehle aata hai", a misconception stated as a rule, came
      // from her own "smaller" lines): the beat's AUTHORED simpler (format 2.3), else ONE sentence of the authored point; never hers
      const simpler = state.lastMove?.simpler ? norm(state.lastMove.simpler) : null;
      const ps = sentences(point).map(norm).filter(Boolean);
      const p1 = ps.find((x) => !saidBefore(x)) ?? ps[0] ?? point;
      body = simpler ? sentences(simpler).map(norm).filter(Boolean).map(dot) : [dot(p1)];
      guard.smaller = simpler ? "authored" : "point";
    } else if (point && kindNow === "explain") {
      // v6.1 R7: the point is said in its authored words (her paraphrase of it is model-written teaching); one short framing
      // clause of hers may lead in
      const li = ss.find((x) => clean(x) && !/\d/.test(x) && !RULE_SAID.test(x)); body = [...(li ? [oneClause(li)] : []), dot(point)]; guard.pointSaid = true;
    } else if (state.lastMove?.simpler) {
      // v6.1 R8: the live card's authored simpler on "pata nahi" / "samajh nahi aaya" (never a model-written hint)
      body = sentences(norm(state.lastMove.simpler)).map(norm).filter(Boolean).map(dot);
      guard.smaller = "authored";
    } else if (graded && verdict === "not_yet" && !workedLines?.length) {
      // v6.2 H1 (director10: "Upar khaye tukde likho: 3. Neeche kul barabar tukde: 4." over the live card): a hint after a
      // wrong answer is authored or nothing; with no simpler the turn is code's verdict and the card
      body = [];
      if (ss.length) guard.hintDropped = ss.length;
    } else {
      body = ss;
      // v6.3 R7 (main, director11 c4 steady T48: "Dobara check karke dekha: tukde barabar hain aur 1 tukda khaya gaya." — hers,
      // false for the unequal laddoo, said before the next card): on a scripted card turn her own words are framing only; a sentence
      // of hers that carries the lesson (a number, a lesson word, a rule) is model-written teaching and goes
      if (card && state.lastMove?.scriptBeat) {
        const n0 = body.length;
        body = body.filter((x) => !/\d/.test(x) && !LESSON_SAID.test(x) && !RULE_SAID.test(x));
        if (body.length < n0) guard.teachDropped = n0 - body.length;
      }
      // (v6.2, director10 c4 offtopic T29: "Yaad karo: …" re-read the point over the second view a picture ask drew)
      // (v6.4 Q1, main on director12: "Yaad karo: …" recited over the live card ×9: a live card is never under a recital; a bare card
      // turn is the card, framed below when it is said again)
    }
    const closedA = state.lastMove?.closed?.answer ? norm(state.lastMove.closed.answer) : null;
    const closedW = whyS(state.lastMove?.closed?.why);
    const wd = state.lastMove?.workedDone;
    const wdA = wd?.answer ? joinable(String(wd.answer).replace(/^\s*(?:toh|so)\s+/i, "")) : null, wdW = wd?.why ? joinable(wd.why, { lower: true }) : null;
    // v6 (director8 c6 stuck T37: "Toh poora jawab: … 28 m …" then "Aur pehle wale sawaal ka jawab 28 m tha" with the same why):
    // a close is said once: the earlier card's close goes when the give-up or the worked answer already says its answer
    const numsIn = (t) => (String(t ?? "").match(/\d+(?:[./]\d+)?/g) ?? []).join(" ");
    const sameAnswer = (a, b) => !!a && !!b && (a === b || (!!numsIn(a) && numsIn(b).split(" ").includes(numsIn(a))));
    const closedS = closedA && !sameAnswer(closedA, gaveA) && !sameAnswer(closedA, wdA) ? (lang === "english" ? (yesNo(closedA) ? `And the earlier question's right answer: ${closedA}${closedW}.` : `And the earlier question's answer was ${closedA}${closedW}.`)
      : yesNo(closedA) ? `Aur pehle wale sawaal ka sahi jawab: ${closedA}${closedW}.` : `Aur pehle wale sawaal ka jawab ${closedA} tha${closedW}.`) : null;
    if (closedS || closedA) ss = ss.filter((x) => !/^aur pehle wale sawaal|^and the earlier question/i.test(x));
    let doneS = wdA ? (lang === "english" ? `So the full answer: ${wdA}${wdW ? `, because ${wdW}` : ""}.` : `Toh poora jawab: ${wdA}${wdW ? `, kyunki ${wdW}` : ""}.`) : null;
    // v6.4 T1″ (main, director12: 9 turns "Haan, sahi hai, kyunki … Toh poora jawab: …" on the worked card answered right): one close
    // per worked card. "Toh poora jawab" with its why is the close; the verdict before it is said bare (its own praise kept). With
    // no authored why for the close, the verdict's why is the close and "Toh poora jawab" is not said.
    if (doneS && lead && verdict === "correct") {
      const b = String(lead).split(/(?<![\p{L}])(?:kyunki|because)(?![\p{L}])/iu)[0].replace(/[\s,;:—–-]+$/, "").trim();
      if (b.length < String(lead).replace(/[.!?।]+$/, "").trim().length) {
        if (wdW) { lead = dot(b); guard.oneClose = "worked"; } else { doneS = null; guard.oneClose = "verdict"; }
      }
    }
    // (a worked step with no card ends on a short check-in, never mid-air)
    // v6.1 R9: a check-in only where state.js allowed one (once per beat, on new teaching); else a statement that goes on
    // (v6.2, director10: "Yeh kadam saaf hai?" after something that was no step: a step's check-in names a step only on a worked step)
    const goOn = () => pickOf((state.lastMove?.checkinOk ? (kindNow === "worked_example" ? WORKED_ASK : BEAT_ASK) : WORKED_GO)[lang === "english" ? "english" : "hinglish"], state);
    const tail = card ?? (workedLines?.length && kindNow === "worked_example" ? goOn()
      : state.lastMove?.splitClose ? pickOf(SPLIT_ASK[lang === "english" ? "english" : "hinglish"], state)
      // (v6.3 R2, main on director11: "Ab agla kadam dekhte hain." and then the same beat's card: the teaching half of a split turn
      // is followed by ITS card, so it says a question on this comes, never a next step)
      : state.lastMove?.splitTeach ? (state.lastMove?.checkinOk ? goOn() : pickOf(SPLIT_CARD[lang === "english" ? "english" : "hinglish"], state)) : null);
    // (v6 R5: the first half of a split turn says the closures only: none of her own teaching)
    if (state.lastMove?.splitClose) body = [];
    // v6.4 Q1 (main, director12: "mujhe khud try karne do", "sawaal kya hai?", "phir se bolo", an unclear reply each got a recital
    // before the card): a turn that answered nothing re-poses ONLY the card — no teaching, no recap, none of her lines
    const NON_ANSWER = new Set(["selftry", "repeat", "unclear", "off_format", "which"]);
    if (card && NON_ANSWER.has(String(state.lastMove?.request ?? "")) && !graded) { if (body.length) guard.reposeOnly = body.length; body = []; }
    // v6.4 R3: a card said again word for word gets a frame ("Phir se dekho:"), never the same words with nothing new
    if (card && !lead && !body.length && herPrev && herPrev.includes(norm(card).toLowerCase())) { body = [lang === "english" ? "Here it is again:" : "Phir se dekho:"]; guard.reposeFrame = true; }
    // v5 B5: a turn is at most about 60 words, except a worked step: her own sentences go first (from the end), never the
    // verdict, a closure, authored text or the card
    const MAX_WORDS = state.ctx?.plainWords ? 45 : 60;
    const total = () => words([lead, ...aside, gaveS, doneS, closedS, ...(state.lastMove?.sayFirst ?? []), ...body, tail].filter(Boolean).join(" "));
    const own = body === ss && !(point && kindNow === "explain") ? body : null;
    if (!workedLines?.length && total() > MAX_WORDS) {
      if (own) { while (own.length && total() > MAX_WORDS) own.pop(); guard.trimmed = true; }
      else if (point && kindNow === "explain" && !(body.length === 1 && body[0] === dot(point))) { body = [dot(point)]; guard.trimmed = true; }
      if (total() > MAX_WORDS && aside.length > 1) { aside.splice(1); guard.trimmed = true; }
    }
    // v5 B4: the authored bridge (and the hook's interest line) at a skill change, said by code unless her lines carry it
    // v6: a bridge with no board of its own never sends their eyes to the screen ("Wahi 8 laddoo dekho:" over another board)
    const unpointed = (x) => (state.lastMove?.bridgeBeat?.board ? x : norm(String(x).replace(/\s*\b(?:screen|board)\s+(?:par|pe)\b/gi, "").replace(/\s+dekho\b(?=\s*[:,.]|\s)/gi, "").replace(/\s+([:,.])/g, "$1")));
    const first = (state.lastMove?.sayFirst ?? []).map(dot).filter((x) => !pointSaid([...ss, ...body].join(" "), x)).map(unpointed);
    // v6 (main, director8 hand judges: 10 / 4 / 45 firm contradictions, the checker saw 1 / 0 / 0): everything about the card
    // they just answered is said FIRST and together (the verdict with its reason, a give-up, the worked answer), so it is one
    // segment on THAT card's board; then a missed card's close (its own board); then the bridge (its own segment); then a parked
    // aside, the teaching and the card. The parts' texts ride on guard.parts (brain/propose.js places the segments from them).
    if (asked) body = [asked, ...body.filter((x) => !/(?:screen|board)\s+(?:par|pe)|on the screen/i.test(x))];
    // v6 R5 (director8: "Yeh hexagon hai. Yeh hexagon hai."; 24 c5-t02 turns asked two questions): a sentence is said once
    // (the card's own sentences win), and with a card or a check-in to end on, no other question of hers is asked
    const keyS = (x) => norm(x).toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, "").trim();
    const seenS = new Set((tail ? sentences(tail) : []).map(keyS));
    const once = (xs) => xs.filter(Boolean).map(norm).filter((x) => { const kk = keyS(x); if (!kk || seenS.has(kk)) { if (kk) guard.dupDropped = (guard.dupDropped ?? 0) + 1; return false; } seenS.add(kk); return true; });
    // (v6.3 W1, main on director11 c5-t02 steady T65: a worked example poses its question before "Diya hai …"; an authored worked
    // line keeps its question — "Kisne kam cake khaya?" was dropped as a second question)
    const authoredQ = new Set((workedLines ?? []).map(norm));
    const noQ = (xs) => (tail ? xs.filter((x) => { const q = /[?？]/.test(x) && !authoredQ.has(norm(x)); if (q) guard.secondQuestion = (guard.secondQuestion ?? 0) + 1; return !q; }) : xs);
    // v6.1 (main's split policy B: "first trim HER own words"): a scripted turn over the word cap loses her own sentences in the
    // body (lead-ins, framings, her lines) before anything authored or code's is touched
    {
      const capW = state.ctx?.plainWords ? 45 : 60;
      const authoredS = new Set([...(point ? sentences(point) : []), ...(workedLines ?? []), ...(state.lastMove?.simpler ? sentences(state.lastMove.simpler) : []),
        ...(state.lastMove?.cardPoint ? [state.lastMove.cardPoint] : [])].map((x) => norm(x).toLowerCase().replace(/[.!?\u0964]+$/, "")));
      const total = [lead, ack, missS, gaveS, doneS, closedS, ...first, ...aside, ...body, tail].filter(Boolean).join(" ").split(/\s+/).filter(Boolean).length;
      if (total > capW) {
        const mineOnly = (x) => !authoredS.has(norm(x).toLowerCase().replace(/[.!?\u0964]+$/, "")) && ![...authoredS].some((a) => a && norm(x).toLowerCase().includes(a));
        const kept = body.filter((x) => !mineOnly(x));
        if (kept.length && kept.length < body.length) { guard.trimmedHers = body.length - kept.length; body = kept; }
      }
    }
    // v6.2 T1 (main, director10 c4 stuck T15: chocolate, roti and cakes in one turn): at most one close per turn: the worked close,
    // else a give-up, else a missed card's close (a stale one is dropped, never stacked)
    let [g2, d2, c2] = [gaveS, doneS, closedS];
    if (d2) { if (g2) guard.closeDropped = (guard.closeDropped ?? 0) + 1; if (c2) guard.closeDropped = (guard.closeDropped ?? 0) + 1; g2 = null; c2 = null; }
    else if (g2 && c2) { c2 = null; guard.closeDropped = (guard.closeDropped ?? 0) + 1; }
    // v6.2 T2 (director10 c5-t01 ×5, c4 ×2): each why is said once — not again in this turn, nor straight after her last turn said it
    {
      const usedWhy = [];
      const keyW = (w) => String(w ?? "").toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
      const prevW = keyW(herPrev);
      const once1 = (x) => {
        if (!x) return x;
        const m = /,\s*(?:kyunki|because)\s+([^.!?\u0964]+)([.!?\u0964]?)\s*$/iu.exec(x);
        if (!m) return x;
        const k = keyW(m[1]);
        if (k && (usedWhy.includes(k) || (prevW && prevW.includes(k)))) { guard.whyOnce = (guard.whyOnce ?? 0) + 1; return `${x.slice(0, m.index)}${m[2] || "."}`; }
        usedWhy.push(k);
        return x;
      };
      lead = once1(lead); g2 = once1(g2); d2 = once1(d2); c2 = once1(c2);
    }
    // (director10 steady c4 T46, Studio: "Toh poora jawab: barfi ka 2/3 …" rode on the then-card's 3/4 grid) a worked answer that
    // closes another card than the one just answered (its close is the worked beat's, state.js closedBeat) is said with that close,
    // on the worked board, never on the answered card's
    const doneApart = !!d2 && state.lastMove?.closedBeat?.beatId === "worked" && state.lastMove?.closeBeat?.beatId !== "worked";
    const prevPart = once([lead, ...noQ([ack, missS, g2, doneApart ? null : d2].filter(Boolean))]);
    const closedP = once([doneApart ? d2 : null, c2]);
    first.splice(0, first.length, ...once(first));
    const asideP = once(noQ(aside));
    body = once(noQ(body));
    const assembled = [...prevPart, ...closedP, ...first, ...asideP, ...body, tail].filter(Boolean).map(norm).join(" ").replace(/\s+/g, " ").trim();
    if (assembled && assembled !== norm(reply)) { reply = assembled; guard.assembled = true; }
    // v6 R4: Hindi asked for: her spoken words in Hindi from here on (the card and the beat's must-say words stay)
    const hindiOn = state.ctx?.lang === "hindi" && !!state.ctx?.langPinned;
    const keepW = (state.lastMove?.mustSay ?? []).flatMap((m) => (typeof m === "object" && m ? [m.hi, m.en] : [m]));
    const hw = (x) => (hindiOn && x ? inHindiWords(x, { keep: keepW, card }) : x);
    if (hindiOn) { const h = hw(reply); if (h !== reply) { reply = h; guard.hindiWords = true; } }
    // v6.2 H4 (main, director10 c4 ×10: "Ab in dono numbers se bhinn likho. Ab in dono numbers se bhinn likho."): a sentence is said
    // once, after the Hindi words too (two that differed only by "fraction" / "bhinn" are one); a copy in the card is the one kept
    {
      const kS = (x) => norm(x).toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
      const cardT = card ? kS(hw(card)) : "";
      const all = sentences(reply).map(norm).filter(Boolean);
      const out = [];
      all.forEach((x, i) => {
        const k = kS(x);
        const later = all.slice(i + 1).some((y) => kS(y) === k);
        if (k.length > 10 && (out.some((y) => kS(y) === k) || (later && cardT.includes(k)))) { guard.dupDropped = (guard.dupDropped ?? 0) + 1; return; }
        // v6.4 P2 (main, director12: "Riya.", "Ke paas zyada hai." left by a strip): a sentence that is only her name, or opens on a
        // postposition, is a fragment, never said
        const fnm = String(state.ctx?.firstName ?? "").trim().split(/\s+/)[0];
        if ((fnm && new RegExp(`^${fnm}[.!,]?$`, "i").test(x.trim())) || /^(?:ke|ki|ka|se|mein|ko|ne)\s/i.test(x.trim())) { guard.fragmentDropped = (guard.fragmentDropped ?? 0) + 1; return; }
        out.push(x);
      });
      const r2 = out.join(" ").replace(/\s+/g, " ").trim();
      if (r2 && r2 !== reply) reply = r2;
    }
    const bridgeS = state.lastMove?.bridgeSaid ? first.find((x) => x === unpointed(dot(state.lastMove.bridgeSaid))) ?? null : null;
    // v6.3 P1 (main, director11: a remediation's simpler said over the follow-up card's board): the authored simpler said this turn
    // is a part of its own, so it pages on the board its words describe (state.js simplerBeat)
    const simplerK = state.lastMove?.simpler ? new Set(sentences(norm(state.lastMove.simpler)).map(keyS)) : null;
    const simplerP = simplerK ? body.filter((x) => simplerK.has(keyS(x))) : [];
    guard.parts = { ...(prevPart.length ? { prev: hw(prevPart.join(" ")) } : {}), ...(closedP.length ? { closed: hw(closedP.join(" ")) } : {}), ...(bridgeS ? { bridge: hw(norm(bridgeS)) } : {}),
      ...(lead ? { verdict: hw(norm(lead)) } : {}), ...(simplerP.length ? { simpler: hw(simplerP.join(" ")) } : {}) };
  }
  // v6.2 H4 (director10 c4 offtopic T23, a break move: "Bilkul, no sahi hai: …"): on any move, a right answer is never confirmed by
  // saying their English word back
  if (answeredNow && verdict === "correct" && lang !== "english" && !clause.sent) {
    const r0 = String(reply).replace(/^((?:\p{L}+,\s*)?)(?:no|yes)\s+(sahi\s+hai)/iu, (m, a, b) => `${a}${b}`);
    if (r0 !== reply) { reply = r0; guard.echoVerdict = true; }
  }
  // round 7 A5: a sent clause is never withdrawn (see streamAsk); the lock's fallback passes every guard
  if (clause.sent && !String(reply).replace(/\s+/g, " ").trim().startsWith(clause.sent.s1)) { reply = clause.sent.fallback; guard.clauseFallback = true; }
  // The final words, checked once more (debug and the evals read it): what reached the child.
  const final = problems(reply).filter((p) => p !== "long" || words(reply) > max);
  if (final.length) guard.final = final;
  if (clauseOn) guard.clause = clause.sent ? { sent: true, s1Ms: clause.sent.ms } : { sent: false, ...(clause.why ? { why: clause.why } : {}) };
  if (early) {
    const kept = early.locked ? String(reply).trim().startsWith(early.s1) : false;
    guard.early = { mode: firstSentenceMode(), locked: early.locked, ...(early.why ? { why: early.why } : {}), ...(early.locked ? { kept, lockedMs: early.ms } : {}),
      finalMs: Math.round(performance.now() - replyT0) };
  }
  // The floor families of what will actually be said (the cascade speaks exactly this): [] after the guard, unless
  // even the fixed line broke a rule. The caller turns a non-empty list into the next correction and an incident.
  const floor = final.includes("floor") ? floorOf(reply) : [];
  return { reply, guard, ...(floor.length ? { floor } : {}) };
}

/**
 * p5-interaction: the reply with every question but its LAST lead question and the pinned one dropped, ending on the pinned
 * question (the fallback when the strict one-question fix would leave only the bare question). Exported for tests.
 */
/**
 * p5-interaction: the reply with the cut marks of the repairs tidied (conversation/guards.js tidy) and, when it ends on
 * the pinned question, every lead sentence that is that question again dropped (a copy, a re-wording, a second form of a
 * blanked question: owner-2 s1 t6 "Khaali jagah bhariye: 2/5 is ___ the middle. Khaali jagah bhariye: Check: …"). The
 * question itself is verified content and is kept byte for byte. Exported for tests.
 */
/**
 * ship5 integration: the rung's kit hint (verified content) as a lead with its QUESTION sentences dropped, or "" when
 * nothing is left, it states the key, or it is a teacher's shape note. Exported for tests.
 */
export function hintStatements(item, hintLevel) {
  const h = stripRungLabel(String(item?.hints?.[(hintLevel ?? 1) - 1] ?? "")).replace(/\s+/g, " ").trim();
  if (!h || revealsAnswer(h, item) || hintShapeWords(h)) return "";
  // round 3: a kit hint with no closing stop ran into the question ("…as places they live What are microbes…?", base-head-1)
  const out = sentences(h).map((x) => x.trim()).filter((x) => x && !/[?？]/.test(x)).map((x) => (/[.!।…]$/.test(x) ? x : `${x}.`)).join(" ").trim();
  // it opens her turn: a capital first letter ("look at the step just before…" came out lower-case)
  return out ? out[0].toUpperCase() + out.slice(1) : "";
}

export function keepLastLeadQuestion(reply, ask) {
  const r = String(reply ?? "").split(String(ask ?? "")).join(" ");
  const ss = sentences(r).map((x) => x.trim()).filter(Boolean);
  const qi = ss.map((x) => /[?？]/.test(x)).lastIndexOf(true);
  const lead = ss.filter((x, i) => !/[?？]/.test(x) || i === qi).join(" ");
  return `${leadWithoutQuestion(lead, ask) || lead} ${String(ask ?? "").trim()}`.replace(/\s{2,}/g, " ").trim();
}

export function tidyAround(reply, ask) {
  const r = String(reply ?? "").trim();
  if (ask && r.endsWith(String(ask).trim())) {
    const lead = leadWithoutQuestion(r.slice(0, r.length - String(ask).trim().length), ask);
    return `${tidy(lead)} ${String(ask).trim()}`.replace(/\s{2,}/g, " ").trim();
  }
  return tidy(r);
}

/** p5-interaction: does a reply to a RIGHT answer confirm it in its first two sentences (agreement / praise of the answer)? */
// round 3 (conversation; base-head-1): "Kabir, haan, 1 player bach jaata hai" and "Aarav, aapne … bilkul sahi groups se
// banaya" were caught as NOT confirming (the name before "haan"; "sahi" not right before a listed verb) and rewritten
// (~1-2 s each). A confirmation word in a statement among the first two sentences counts; a negated one never does. This is
// a quality check on a turn after a RIGHT answer (no truth guard is loosened: praise / deny keep their own predicates).
const CONFIRM_WORD = /(?<![\p{L}])(?:bilkul|sahi|correct(?:ly)?|right|haan|haa+n?|yes|yep|exactly|ekdam|sha+ba+sh|well\s+done|perfect|great|badhiya|zabardast|theek\s+(?:kaha|bataya|socha|pakda))(?![\p{L}])(?!\s+(?:nahi|nahin|not|hai\s+kya))|सही|बिल्कुल|हाँ|शाबाश/iu;
function confirmsFirst(t) {
  const head = sentences(t).slice(0, 2).join(" ");
  if (praiseProblem(head, "not_yet") === "praise") return true;
  return p5Flag("R3CONV") && sentences(t).slice(0, 2).some((x) => !/[?？]/.test(x) && CONFIRM_WORD.test(x));
}

/** Imperatives to write / type → the spoken form (her own words only; the pinned question at the end is kept). Exported for tests. */
const WRITE_TO_SAY = [
  [/\blikh\s+(?:kar|ke)\s+(?:bhejo|batao|dikhao)\b/gi, "bolkar batao"], [/\blikh\s+(?:kar|ke)\s+(?:bhejiye|bataiye|dikhaiye)\b/gi, "bolkar bataiye"],
  [/\blikh\s+do\b/gi, "bata do"], [/\blikh\s+dijiye\b/gi, "bata dijiye"], [/\blikhiye\b/gi, "bataiye"], [/\blikho\b/gi, "batao"],
  // round 5 (owner 2026-10-14, phone, voice-first: "homework type karke bhejo" twice): the forms the first list missed
  [/\btype\s+kar\s*ke\s+(?:bhejo|bhej\s+do|batao|send\s+karo|dikhao)\b/gi, "bolkar batao"], [/\btype\s+kar\s*ke\s+(?:bhejiye|bataiye|dikhaiye)\b/gi, "bolkar bataiye"],
  [/\blikh\s*(?:kar|ke)\s*(?:bhejo|batao|dikhao)\b/gi, "bolkar batao"], [/\blikh\s*(?:kar|ke)\s*(?:bhejiye|bataiye|dikhaiye)\b/gi, "bolkar bataiye"],
  [/\b(?:type|message)\s+(?:karna|karein|karenge|karo\s+na)\b/gi, "bolna"], [/\bmessage\s+(?:karo|kar\s+do|bhejo)\b/gi, "bolo"],
  [/टाइप\s*(?:करके|कर\s*के)\s*(?:भेजो|बताओ|भेज\s*दो)/g, "बोलकर बताओ"], [/टाइप\s*(?:करो|कर\s*दो)/g, "बोलो"], [/लिख\s*(?:कर|के)\s*(?:भेजो|बताओ)/g, "बोलकर बताओ"],
  [/\btype\s+(?:it\s+)?(?:and\s+send(?:\s+it)?|it\s+in|in\s+the\s+chat)\b/gi, "say it"],
  [/\btype\s+(?:karo|kar\s+do)\b/gi, "bolo"], [/\btype\s+(?:kijiye|kariye|kar\s+dijiye)\b/gi, "boliye"],
  [/\b(?:write|type)\s+(?:it|that|this|your\s+answer|the\s+answer)(?:\s+down)?\b/gi, "say it"], [/\bwrite\s+down\b/gi, "say"],
  // round 5 (QA D20, session-first intake: "homework ka question bhejo" n=2/2 to a voice-first class 4 child): they say it
  [/\b(question|sawaal|sawal|swaal|prashn|homework)\s+bhej\s*(?:o|do|dijiye)\b/gi, (m) => `${m.split(/\s+/)[0]} bolo`], [/(सवाल|प्रश्न|होमवर्क)\s*भेजो/g, (m) => `${m.split(/\s+/)[0].replace("भेजो", "")} बोलो`],
  // round 5 (main, owner-5-visual V3.child_draws on the voice lane: after "animation dikhao na" she told the CHILD to draw
  // it): no drawing pad exists in the lesson, so on a spoken lane the child pictures it and says it, never draws it
  [/\b(?:draw|drawing|chitra|picture)\s+(?:bana\s*)?(?:kar|ke|bana)\s*(?:ke|kar)?\s+(?:dikhao|batao|bhejo)\b/gi, "bolkar batao"],
  [/\b(?:bana|banaa)\s*(?:kar|ke)\s+(?:dikhao|bhejo)\b/gi, "bolkar batao"],
  [/\b(?:draw|drawing|sketch)\s+(?:karo|kar\s+lo|kar\s+do|banao)\b/gi, "mann mein socho"], [/\b(?:draw|drawing|sketch)\s+(?:kijiye|kariye|banaiye)\b/gi, "mann mein sochiye"],
  [/\b(?:chitra|tasveer|picture)\s+banao\b/gi, "tasveer socho"], [/\b(?:copy|kaagaz|kagaz|notebook)\s+(?:par|pe|mein)\s+bana(?:o|kar)\b/gi, "mann mein socho"],
  [/(?:ड्रॉ|ड्रा|चित्र)\s*(?:करो|बनाओ)/g, "मन में सोचो"], [/बना\s*(?:कर|के)\s*(?:दिखाओ|भेजो)/g, "बोलकर बताओ"],
  [/\bdraw\s+(it|this|that)\s+and\s+show\s+me\b/gi, (m) => m.replace(/draw/i, "picture").replace(/show/i, "tell")],
  [/\b(?:can\s+you\s+|now\s+|please\s+)?draw\s+(?:it|this|that|a|an|the|one)\b/gi, (m) => m.replace(/draw/i, "picture")],
];
export function speakNotWrite(reply, askEnd = null) {
  const r = String(reply ?? "");
  const ask = askEnd ? String(askEnd).trim() : "";
  const cut = ask && r.trim().endsWith(ask) ? r.trim().length - ask.length : r.length;
  let lead = r.slice(0, cut);
  for (const [re, to] of WRITE_TO_SAY) lead = lead.replace(re, (m) => { const t = typeof to === "function" ? to(m) : to; return /^\p{Lu}/u.test(m) ? t[0].toUpperCase() + t.slice(1) : t; });
  return lead + r.slice(cut);
}

// ───────────── r4-latency: the first TTS sentence, locked early (TAXILA_TTS_FIRST_SENTENCE) ─────────────

/**
 * PURE. round 7 A5: the first sentence of a draft still being streamed, once it is closed: an end mark (. ! ? । …) followed by
 * a space and more text, the same ends server/voice/sentences.js splits on (never "3.5", "Rs. 5", an initial). null until then.
 */
export function firstClosedSentence(text) {
  const t = String(text ?? "").replace(/\s+/g, " ").replace(/^ /, "");
  for (const m of t.matchAll(/([.!?।॥…]+["'”’)\]]*) (?=\S)/g)) {
    const word = t.slice(0, m.index).split(" ").pop() ?? "";
    if (m[1] === "." && (/^(rs|dr|mr|mrs|ms|no|st|vs|etc|e\.g|i\.e)$/i.test(word) || /^[A-Z]$/.test(word))) continue;
    return t.slice(0, m.index + m[1].length).trim();
  }
  return null;
}
/** round 7 A5: the streamed, clause-guarded reply (on unless TAXILA_R7_CLAUSE_STREAM=off; only a client that asks streams). */
export const clauseStreamOn = (env = process.env) => !/^(off|0|false)$/i.test(String(env.TAXILA_R7_CLAUSE_STREAM ?? ""));
/** off (default) | shadow (lock decided and logged on guard.early; behaviour unchanged). The live mode is not built yet. */
export const firstSentenceMode = (env = process.env) => (/^shadow$/i.test(String(env.TAXILA_TTS_FIRST_SENTENCE ?? "")) ? "shadow" : "off");

/** The guards a single sentence can fail on its own (truth, safety, register, screen, script). The rest judge the whole
 *  turn's shape (ask, flat, drift, twoq, long, bare, nowhy, noconfirm) and are checked on `s1 + the question` instead. */
export const PER_SENTENCE = new Set(["floor", "harmtalk", "forget", "praise", "deny", "claim", "quiz", "invented", "corrects", "screen", "parts", "register", "stage", "uiword", "cantshow", "notheard", "bracket", "negates", "gameclaim", "affirms",
  "leak", "units", "math", "script", "thinkq", "wrap", "same"]);

/**
 * PURE (given the turn's own `problems`). Lock the draft's first TTS sentence (server/voice/sentences.js splitSentences,
 * the same split the speech parts use) when ALL hold: a spoken lane; not a closing / check-in / forget-after-safety / why /
 * thinking / break / diagnostic turn; a pinned kit question; the draft has more than one sentence; s1 asks nothing and
 * names nothing on the screen or in the UI; s1 fails no per-sentence guard; on a right answer s1 confirms it; and the
 * minimal turn joinAsk(s1, question) fails no guard at all (so a final reply that starts with s1 always exists).
 * @returns {{ locked: true, s1: string, fallback: string, ms: number } | { locked: false, why: string }}
 */
export function lockFirstSentence({ reply, s1: closed = null, askEnd, problems, closing, spoken, confirmNeeded, t0 = performance.now() }) {
  const no = (why) => ({ locked: false, why });
  if (!spoken) return no("text_lane");
  if (closing) return no("turn_kind");
  if (!askEnd) return no("no_pinned_question");
  // round 7 A5: a streamed draft hands its first CLOSED sentence (firstClosedSentence), the rest still being written
  const parts = closed ? [closed] : splitSentences(String(reply ?? "").trim());
  if (!closed && parts.length < 2) return no("one_sentence");
  const s1 = parts[0].trim();
  if (/[?？]/.test(s1)) return no("s1_asks");
  if (SCREEN_SENTENCE.test(s1) || namesUiPart(s1)) return no("s1_screen");
  if (words(s1) < 2) return no("s1_short");
  const own = problems(s1).filter((p) => PER_SENTENCE.has(p));
  if (own.length) return no(`s1_${own[0]}`);
  if (confirmNeeded && !confirmsFirst(s1)) return no("s1_noconfirm");
  const fallback = joinAsk(s1, askEnd);
  if (!fallback.startsWith(s1)) return no("join");
  const whole = problems(fallback);
  if (whole.length) return no(`min_${whole[0]}`);
  return { locked: true, s1, fallback, ms: Math.round(performance.now() - t0) };
}

// ───────────── round 5 (14.4, main; open-r143-affirm-on-no-answer): no affirmation that approves what nobody said ─────────────
// Sim lab p30 @f444f064 #6: the child tapped "No — insects have six legs…" (graded right) and her reply opened "Yes, Pihu—
// earthworm has no legs": a bare Yes before a negative fact agrees with the opposite of what the child said. And an
// opener of agreement on a not-yet / partly-right answer, or on no input at all, approves an answer that was not given.
// (a) not_yet / partial verdict, or truly empty input (no words, no tap): the leading affirmation goes, the rest stands.
// (b) a right answer that itself opens with No / nahi / नहीं: a bare Yes / Haan opener becomes "Right" / "Sahi" / "सही"
// (agreeing with the child), never a Yes before their No. Ungraded / unverified / attempt turns are left alone (main: 175
// mostly-fine openers on 14.2 when they were in). PURE.
const AFFIRM = "(?:ji\\s+haan|yes|yeah|yep|haa+n?|han|bilkul(?:\\s+sahi)?|ekdam\\s+sahi|sahi(?:\\s+(?:hai|kaha|jawab|baat))?|right|correct|exactly|sha+ba+sh|very\\s+good|well\\s+done|great|हाँ|हां|बिल्कुल(?:\\s+सही)?|सही|शाबाश)";
const YES_ONLY = /^(?:ji\s+haan|yes|yeah|yep|haa+n?|han|हाँ|हां)$/iu;
const NO_FIRST = /^\s*(?:no|nope|nahi|nahin|nhi|na|नहीं|ना)(?![\p{L}])/iu;
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function affirmOpenerFix(reply, { verdict = null, empty = false, answer = "", name = null, lang = "hinglish" } = {}) {
  const text = String(reply ?? "");
  const lead = name ? `(?:${escapeRe(name)}\\s*[,،—–-]?\\s*)?` : "";
  if (verdict === "not_yet" || verdict === "partial" || empty) {
    const m = text.match(new RegExp(`^\\s*(${lead})((?:${AFFIRM}(?![\\p{L}-])\\s*[,!.।—–-]*\\s*)+)`, "iu"));
    if (!m) return { text, fix: null };
    const rest = text.slice(m[0].length).trim();
    if (!rest) return { text, fix: null };
    const named = m[1] ? `${m[1].trim().replace(/[,،—–-]+$/, "")}, ` : "";
    const body = named ? rest : rest[0].toUpperCase() + rest.slice(1);
    return { text: `${named}${body}`, fix: "strip" };
  }
  if (verdict === "correct" && NO_FIRST.test(String(answer ?? ""))) {
    const m = text.match(new RegExp(`^(\\s*)(${AFFIRM})(?![\\p{L}])`, "iu"));
    if (!m || !YES_ONLY.test(m[2])) return { text, fix: null };
    const word = /[ऀ-ॿ]/.test(m[2]) ? "सही" : lang === "english" ? "Right" : "Sahi";
    return { text: `${m[1]}${word}${text.slice(m[0].length)}`, fix: "polarity" };
  }
  return { text, fix: null };
}
