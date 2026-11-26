// dc-r8-director23 S, the seam pass. No code path adds a joint: when a turn's parts are assembled, this one function walks each pair of
// neighbouring parts and decides the seam from a table keyed by the two kinds; it puts at most one joint at a seam and none between a
// point and its own card or a verdict and its own why; a filler word that opens two neighbouring parts is said once; forms rotate by a
// seed from the lesson id and the count of that joint so far. It writes the turn's seams (`guard.seams`: for each pair, the two kinds,
// the joint kind or none, the form) and the seam predicates read that list and nothing else.
import { jointOf, scriptFor } from "../director/script.js";
import { joinParts } from "./lineParts.js";
import { FALLBACK_JOINTS, helpJoint, openerOf, rotationPick } from "../director/help.js";

const norm = (x) => String(x ?? "").replace(/\s+/g, " ").trim();
const low = (x) => norm(x).toLowerCase().replace(/[.!?।:]+$/, "");
const sentencesOf = (t) => norm(t).split(/(?<=[.!?।])\s+/).filter(Boolean);

/** The joints this pass owns (a park and a return carry the aside: they are parts of their own, not joints). */
export const SEAM_JOINTS = ["backTo", "afterAside", "afterAiLine", "beforeRemediation", "afterTryFirst", "beforeWorked", "afterKeyReturn", "afterPark", "afterWorked"];
// (code's own neutral after-aside line, before the scripts had afterAside)
// (dc-r8-director26 J1 item 3: code's lead into a worked problem, for a script without joints.beforeWorked — the compile report lists the
// hole; a problem done together, never a question to the child)
export const CODE_SEAM_FORMS = Object.freeze({
  beforeWorked: { hinglish: ["Ab ek sawaal saath mein karte hain.", "Chalo, ab ek sawaal milkar hal karte hain.", "Ab isi tarah ka ek sawaal saath mein dekhte hain."],
    english: ["Now let's do one together.", "Let's work one out together.", "Now let's solve one together."] },
  // (dc-r8-director27 Brain 043 R2: code's invitation to do the next problem together, for a script without joints.workedInvite — the
  // compile report lists the hole; a question, no promise, no praise)
  workedInvite: { hinglish: ["Agla sawaal saath mein karein?", "Ek sawaal milkar hal karein?", "Ab ek sawaal saath mein karke dekhein?"],
    english: ["Shall we do the next one together?", "Shall we work one out together?", "Shall we try one together now?"] },
  // (dc-r8-director27 P3: code's after-key return for a script without joints.afterKeyReturn — help.js FALLBACK_JOINTS; the compile report
  // lists the hole)
  // (a getter: help.js and this module import each other through compile.js — read at use, never at load)
  get afterKeyReturn() { return { hinglish: FALLBACK_JOINTS.afterKeyReturn.map((f) => f.hi), english: FALLBACK_JOINTS.afterKeyReturn.map((f) => f.en) }; },
  // (dc-r8-director30 Brain 046 Q5: code's seam from a worked example's close into the next card, for a script without joints.afterWorked —
  // six words or fewer; the compile report lists the hole)
  afterWorked: { hinglish: ["Ab tumhari baari, naya sawaal.", "Chalo, ab agla sawaal.", "Ab ek sawaal tumhare liye."],
    english: ["Now your turn, a new one.", "Now, the next question.", "Here's one for you now."] },
});
const CODE_JOINTS = { afterAside: ["Chalo, jahan the wahin se aage chalte hain.", "Achha, ab wapas apne sawaal par.", "Theek hai, ab aage badhte hain.", "Okay, back to where we were.", "Right, let's pick up where we left off."],
  beforeWorked: [...CODE_SEAM_FORMS.beforeWorked.hinglish, ...CODE_SEAM_FORMS.beforeWorked.english],
  get afterKeyReturn() { return [...CODE_SEAM_FORMS.afterKeyReturn.hinglish, ...CODE_SEAM_FORMS.afterKeyReturn.english]; },
  afterWorked: [...CODE_SEAM_FORMS.afterWorked.hinglish, ...CODE_SEAM_FORMS.afterWorked.english] };

/** The seam table: [left kind, right kind] → the joint that seam takes. Anything not listed takes none — a point and its own card, a
 *  verdict and its own why, a bridge and the unit it opens, a park and the card it leads into. */
export const SEAM_TABLE = [
  // (her reply to the child's aside or to her return's question, into the lesson)
  // (dc-r8-director27 P5: the back-to line on every return to an earlier card, whatever led there — her reply to an aside too: c4 offtopic 32,
  // c5-t01 steady 46, c4 stuck 36. One joint at the seam: the back-to, which takes her back from the aside as well)
  ["asideReply", "point", "afterAside"], ["asideReply", "help", "afterAside"], ["asideReply", "card", "afterAside"], ["asideReply", "returnCard", "backTo"], ["asideReply", "remediation", "afterAside"],
  ["aside", "returnCard", "backTo"],
  // (dc-r8-director30 Brain 046 Q3: her one line to an aside said again — or a sad line — is a reply too: its joint into the live part on every
  // path, a card and a point alike — c5-t01 offtopic 58, c5-t02 offtopic 36, c6 offtopic 36)
  ["aside", "point", "afterAside"], ["aside", "card", "afterAside"], ["aside", "help", "afterAside"], ["aside", "remediation", "afterAside"], ["aside", "bridge", "afterAside"],
  ["aside", "caption", "afterAside"], ["aside", "stepAsk", "afterAside"], ["aside", "workedStep", "afterAside"], ["asideReply", "stepAsk", "afterAside"], ["asideReply", "workedStep", "afterAside"],
  ["aiReply", "stepAsk", "afterAiLine"], ["aiReply", "workedStep", "afterAiLine"],
  // (to-brain 054 D3's added item: the honest line alone, asked again straight after the first exchange, goes on into the step it held)
  ["aiLine", "stepAsk", "afterAiLine"], ["aiLine", "workedStep", "afterAiLine"],
  // (d29 final, with Learning 017's scripts: a park before a return to an earlier card — steering c6 34, stuck c6 40 — P5's back-to too)
  ["park", "returnCard", "backTo"],
  // (dc-r8-director29 Brain 045 P6: a park line is followed by its authored joint into the live part — joints.afterPark where the script writes
  // one; where it has none (Learning 018's park forms lead back themselves) the turn goes straight on: no code form)
  ["park", "point", "afterPark"], ["park", "card", "afterPark"], ["park", "help", "afterPark"], ["park", "remediation", "afterPark"],
  // (d30, Learning 018's park-form decision — every park line is followed by one afterPark form, then the live part: a worked example's told
  // step, its asked step or its problem too — dry offtopic c5-t02 18, c6 18)
  ["park", "workedStep", "afterPark"], ["park", "stepAsk", "afterPark"], ["park", "workedProblem", "afterPark"],
  // (her AI line, or her reply after it, into the lesson)
  ["aiLine", "point", "afterAiLine"], ["aiLine", "help", "afterAiLine"], ["aiLine", "card", "afterAiLine"], ["aiLine", "returnCard", "backTo"], ["aiLine", "remediation", "afterAiLine"],
  // (dc-r8-director29 Brain 045 P6, c4 offtopic 46: her reply into the next skill's bridge — the joint back before it, as before a point)
  ["asideReply", "bridge", "afterAside"], ["aiLine", "bridge", "afterAiLine"], ["aiReply", "bridge", "afterAiLine"],
  ["aiReply", "point", "afterAiLine"], ["aiReply", "card", "afterAiLine"], ["aiReply", "returnCard", "backTo"], ["aiReply", "remediation", "afterAiLine"],
  // (main's ruling A3 item 2 of d38, to-brain 055 C3 at a return: her reply or park into the told answer at a card — the key with its reason,
  // recorded as a verdict — keeps its back-to-work joint, as into the card it would have asked)
  ["asideReply", "verdict", "afterAside"], ["aiReply", "verdict", "afterAiLine"], ["aside", "verdict", "afterAside"], ["park", "verdict", "afterPark"],
  // (main's ruling A4 of d38: and into C1's help at a return — the AI line's reply too, as into the step it would have asked)
  ["aiReply", "help", "afterAiLine"],
  // (a miss verdict into its remediation)
  ["missVerdict", "remediation", "beforeRemediation"],
  // (a return to an earlier card: after a then-card's verdict in the same turn, or opening a turn after another unit)
  ["verdict", "returnCard", "backTo"], ["missVerdict", "returnCard", "backTo"], ["closed", "returnCard", "backTo"], ["bridge", "returnCard", "backTo"], ["start", "returnCard", "backTo"],
  // (the Hindi switch opens the turn it is asked on — said by the language pass, recorded here)
  ["start", "hindiSwitch", "hindiSwitch"],
  // (dc-r8-director25 H4: help's joints open the turn help says them on — the decision's, recorded here)
  ["start", "startAnyway", "startAnyway"], ["start", "helpSpent", "helpSpent"], ["start", "afterKeyGoOn", "afterKeyGoOn"], ["start", "helpToCard", "helpToCard"],
  // (Brain 044 T5: after a key, the "nothing easier" line, then the after-key return into the earlier card)
  ["helpSpent", "returnCard", "backTo"], ["helpSpent", "afterKeyGoOn", "afterKeyGoOn"], ["helpSpent", "helpToCard", "helpToCard"],
  // (her go-ahead to try first, into the card)
  ["tryFirst", "card", "afterTryFirst"], ["tryFirst", "returnCard", "afterTryFirst"],
  // (Brain 044 T7: her go-ahead to try an asked step, into the step's question again)
  ["tryFirst", "stepAsk", "afterTryFirst"],
  // (dc-r8-director25 L2 item 5: a picture's caption takes the seams a point takes; a key, the ones the verdict it follows takes)
  ["asideReply", "caption", "afterAside"], ["aiLine", "caption", "afterAiLine"], ["aiReply", "caption", "afterAiLine"],
  ["key", "returnCard", "backTo"], ["key", "remediation", "beforeRemediation"],
  // (dc-r8-director26 J1 item 3: a verdict, a key or a closed card into a worked problem — c6 steady 16, 58, 86, stuck 34, offtopic 42,
  // steering 40; c5-t02 steady 20, 72, 132, steering 42: "Bilkul sahi, kyunki … Phoolon ki ek kyari …" with nothing between)
  ["verdict", "workedProblem", "beforeWorked"], ["missVerdict", "workedProblem", "beforeWorked"], ["key", "workedProblem", "beforeWorked"], ["closed", "workedProblem", "beforeWorked"],
  // (dc-r8-director27 P5, c4 steady 46: her reply to an aside straight into a worked problem — the lead-in on that path too; one joint, the
  // problem's)
  ["asideReply", "workedProblem", "beforeWorked"], ["aiReply", "workedProblem", "beforeWorked"], ["aiLine", "workedProblem", "beforeWorked"],
  // (dc-r8-director27 Brain 042 Q2: the lead-in, the problem and what follows it up to the first question are one turn — after a verdict whose
  // why left no room, the problem opens its own turn, and its lead-in with it)
  ["start", "workedProblem", "beforeWorked"],
  // (to-brain 054 A: the no-other-drawing line at a key's check-in, then the go-on line the check-in would have taken)
  ["noPicture", "afterKeyGoOn", "afterKeyGoOn"],
];
const TABLE = new Map(SEAM_TABLE.map(([a, b, j]) => [`${a}>${b}`, j]));
/** dc-r8-director29 Brain 045 P6: help about another figure — it names a number (a whole number past 1, or a part of a fraction) the card does
 *  not (c5-t01 stuck 64: 3/3 of a pizza before a card on 1/5; offtopic 30: 6 marks before a card of 7; stuck 70: halves of a roti in sixths
 *  before 4/6). Help that works the card's own numbers — c4 steady 86's 15 pencils in 3 groups, on its own board — is about the card. */
export function otherFigureOf(helpText, cardText) {
  const nums = (t) => (String(t ?? "").match(/\d+(?:\s*\/\s*\d+)?/g) ?? []).flatMap((x) => x.split("/").map((y) => y.trim())).filter((y) => Number(y) > 1);
  const card = new Set(nums(cardText));
  // (Brain 046 Q5: help in another wording that names no number — a sayAlt's pizza — and the card's own ask.simpler, which counts the card's
  // thing in numbers of its own, are read by their rung: brain/say.js ALT_RUNGS, OWN_RUNGS)
  return !!card.size && nums(helpText).some((n) => !card.has(n));
}
/** Words that name no thing a card is about: the lesson's own talk and Hinglish function words. */
const FIGURE_STOP = new Set(["barabar", "hissa", "hisse", "hisson", "line", "board", "socho", "dekho", "wala", "wale", "wali", "kitne", "kitna", "kitni", "kaunsa", "kaunsi",
  "kaun", "hain", "hota", "hoti", "hote", "jaata", "jaati", "jaate", "pehle", "baad", "beech", "upar", "neeche", "number", "fraction", "gaps", "gap", "mark", "marks", "jawab",
  "sawaal", "batao", "yahan", "wahan", "isliye", "kyunki", "phir", "dono", "teeno", "aadha", "poora", "poori", "tukde", "tukda", "tukdon", "zyada", "chhota", "chhoti", "bada",
  "badi", "milega", "milta", "chalo", "isko", "usko", "unka", "inka", "tumne", "tumhe", "tumhari", "tumhara", "aur", "hai", "kis", "toh", "par", "bhi", "yeh", "woh", "jab", "tab",
  "kya", "har", "mein", "karo", "liye", "yahi", "wahi", "isse", "agar", "kuch", "sirf", "raha", "rahi", "rahe", "mila", "mile", "wapas", "pehla", "pehli", "doosra", "doosri",
  "utna", "utne", "jitna", "jitne", "jitni", "gino", "baar", "kaise", "aise", "jaise", "ise", "use", "abhi", "nahi", "sahi", "the", "and", "for", "you", "how", "many", "teen",
  "chaar", "paanch", "kahan", "saath", "baat", "aate", "aata", "aati", "ek-ek", "do-do", "line", "lines", "bache", "bacha", "bachi", "bachega", "bachegi", "hue", "hua", "hui",
  "liya", "liye", "diya", "kiya", "gaya", "gayi", "gaye", "kata", "kati", "kate", "kaat", "kaata", "baante", "baanto", "banta", "bante", "banti", "bani", "bana", "banate", "uska",
  "uski", "uske", "naam", "kehta", "kehti", "kehte", "sakte", "sakta", "sakti", "ruka", "ruki", "ruke", "rakho", "lagao", "jodo", "chalte", "chalti", "paas", "door", "aage", "peeche", "isi", "usi", "wali", "khada", "khade", "khadi"]);
/** Whether help names a thing of the card's — a word of three letters or more that is not lesson talk ("laddoo", "dor", "roti"). */
export function sharesThing(helpText, cardText) {
  const w = (t) => new Set((String(t ?? "").toLowerCase().match(/[\p{L}-]{3,}/gu) ?? []).filter((x) => !FIGURE_STOP.has(x)));
  const c = w(cardText);
  return [...w(helpText)].some((x) => c.has(x));
}
/** Brain 043 R2: her last turn ended on her invitation to do the problem together, and this turn is the problem it invited (the walk marks
 *  it afterInvite) — straight after it, never after a detour. */
export function invitedJustNow(kit, state, lang = "hinglish") {
  if (!state?.lastMove?.afterInvite) return false;
  const own = jointOf(kit, "workedInvite", lang);
  const forms = own?.length ? own : CODE_SEAM_FORMS.workedInvite[lang === "english" ? "english" : "hinglish"];
  const lastT = low([...(state.recent ?? [])].filter((t) => t.who === "teacher").at(-1)?.text ?? "");
  return !!lastT && forms.some((f) => lastT.endsWith(low(f)));
}
const HELP_JOINT_KINDS = new Set(["helpSpent", "afterKeyGoOn", "helpToCard", "startAnyway"]);
export const seamJoint = (left, right) => TABLE.get(`${left}>${right}`) ?? null;

const FILLER = /^(achha|acha|theek hai|thik hai|chalo|toh|haan|okay|ok|so|right|alright)\s*[,!.]\s*/i;
const FILLER_ONLY = /^(?:(?:hmm+|achha|acha|theek hai|thik hai|haan|okay|ok|accha|wah|oh)[\s,!.]*)+$/i;
const AI_LINE = /(?:main ai teacher hoon|main ai hoon|i'm an ai|i am an ai|meri (?:apni )?koi pasand nahi|no favourites for me)/i;

/** A lesson's own start for a joint kind: two lessons do not open on the same form (the eval runs every lesson with one seed). */
export function seamStart(lessonKey, kind) {
  // (no lesson to key on — a unit test's bare state — starts every list at its first form, as before the rotation)
  if (lessonKey == null) return 0;
  const h = [...`${lessonKey}|${kind}`].reduce((a, c) => Math.imul(a ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
  return Math.imul(h, 2654435761) >>> 0;
}
export const lessonKeyOf = (state) => { const k = state?.ctx?.lessonKey ?? state?.ctx?.sessionId ?? state?.lessonId ?? null; return k == null ? null : String(k); };
/** The form a seam says: rotated from the lesson's start by how many of that joint she has said. */
export function seamForm(forms, state, kind, bad = null) {
  if (!forms?.length) return null;
  const n = state?.jointN?.[kind] ?? 0;
  // (d37 RULING-G item 8: a form taken out of turn — `bad`, the fresh-form rule — keeps the rotation: help.js rotationPick, with the cycle
  // record brain/turn.js countJoints keeps in jointN["<kind>~done"]; with nothing bad, the plain rotation's form)
  return forms[rotationPick(forms.length, seamStart(lessonKeyOf(state), kind), n, state?.jointN?.[`${kind}~done`], bad ? (ix) => bad(forms[ix]) : undefined)];
}

/** dc-r8-director24 M (main's 035): the model writes the joins, in the turn's own reply call; code checks each and falls back to the
 *  authored form. A join passes when it is one sentence of at most JOIN_MAX_WORDS words with no digit, no question, no screen word, no
 *  script term of a card she has not yet answered, and is none of her last four turns' sentences. → null when it passes, else why. */
export const JOIN_MAX_WORDS = 12;
const SCREEN_WORD = /(?<![\p{L}])(?:buttons?|screen|click|clik|tap|scroll|swipe|page|app|neeche\s+dabao|upar\s+dabao)(?![\p{L}])/iu;
const FRACTION_WORD = /(?<![\p{L}])(?:aadha|aadhi|aadhe|tihaai|chauthaai|bhinn|ansh|half|halves|third|thirds|quarter|quarters|fraction|fractions|numerator|denominator)(?![\p{L}])/iu;
export function joinProblem(text, { kit = null, state = null, lang = "hinglish" } = {}) {
  const t = norm(text);
  if (!t) return "empty";
  if (sentencesOf(t).length > 1) return "two sentences";
  if (t.split(" ").length > JOIN_MAX_WORDS) return "over 12 words";
  if (/\d/.test(t)) return "a digit";
  if (FRACTION_WORD.test(t)) return "a fraction word";
  if (/[?？]/.test(t)) return "a question";
  if (SCREEN_WORD.test(t)) return "a screen word";
  const sc = scriptFor(kit)?.script;
  if (sc) {
    const answered = new Set((state?.rightLog ?? []).map((x) => String(x.id)));
    const L = lang === "english" ? "en" : "hi";
    const cards = [];
    for (const sk of sc.skills ?? []) {
      for (const b of sk.explain ?? []) if (b.ask?.prompt && !answered.has(`script:${sk.skillId}:ask:${b.id}`)) cards.push(b.ask.prompt);
      for (const c of sk.checks ?? []) if (c.prompt && !answered.has(`script:${sk.skillId}:${c.id}`)) cards.push(c.prompt);
      if (sk.workedExample?.problem && !answered.has(`script:${sk.skillId}:ask:worked`)) cards.push(sk.workedExample.problem);
    }
    const cardText = low(cards.map((p) => (typeof p === "string" ? p : `${p.hi ?? ""} ${p.en ?? ""}`)).join(" | "));
    const word = (w) => new RegExp(`(?<![\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "iu");
    for (const term of sc.terms ?? []) for (const w of [term?.[L], term?.hi, term?.en]) {
      const k = low(String(w ?? "").replace(/\s*\(.*\)\s*/g, " "));
      if (k.length >= 3 && word(k).test(low(t)) && word(k).test(cardText)) return `the term "${k}" of a card not yet answered`;
    }
  }
  const lastFour = (state?.recent ?? []).filter((x) => x.who === "teacher").slice(-4).flatMap((x) => sentencesOf(x.text ?? "")).map(low);
  if (lastFour.includes(low(t))) return "one of her last four turns";
  return null;
}

/** The reason lead-ins of rightWhyLead's forms by index: 0 ", kyunki", 1 a sentence of its own ("Dekho,", "Suno," as its openers). */
export const WHY_LEAD_RE = [/(?<![\p{L}])(?:kyunki|kyonki|because)(?![\p{L}])/iu, /(?<![\p{L}])(?:dekho|suno)(?![\p{L}])/iu];
const RIGHT_WORD = /(?<![\p{L}])(?:sahi|theek|thik|bilkul|ekdum|haan|right|correct|exactly|yes|perfect)(?![\p{L}])/iu;
/** The turn's verdict opener: { at, record } — the index of the verdict part and what its seam records — with the part's text swapped
 *  in place when the model's opener passes; null when the verdict opens on no code frame. */
function verdictOpener(parts, kinds, { kit, state, lang, info }) {
  const at = kinds.findIndex((k) => k === "verdict" || k === "missVerdict");
  if (at < 0) return null;
  const t = norm(parts[at].text);
  const frame = (info.verdictFrames ?? []).map((f) => norm(f).replace(/[.!?:]+$/, "")).filter(Boolean).sort((a, b) => b.length - a.length).find((f) => t.toLowerCase().startsWith(f.toLowerCase()));
  if (!frame) return null;
  const kind = kinds[at];
  const mine = norm(info.modelJoins?.[kind] ?? "").replace(/[.!?:,]+$/, "");
  let bad = mine ? joinProblem(mine, { kit, state, lang }) : null;
  if (mine && !bad) bad = kind === "verdict" ? (MISS_WORD.test(mine) || !RIGHT_WORD.test(mine) ? "not a right verdict" : null) : !MISS_WORD.test(mine) ? "no miss word" : null;
  // (d37 close item 3: a model's right-verdict opener that says the reason lead-in her verdict before used — state.whyJoint.last, the
  // rotation brain/say.js rightWhyLead keeps — falls back to the table's frame, as the walk rotates them)
  if (mine && !bad && kind === "verdict" && WHY_LEAD_RE[state?.whyJoint?.last]?.test(mine)) bad = "the reason lead-in of her verdict before";
  if (mine && !bad) parts[at] = { ...parts[at], text: `${mine}${t.slice(frame.length)}` };
  return { at, record: { by: mine && !bad ? "model" : "authored", form: mine && !bad ? mine : frame, ...(bad ? { fellBack: bad } : {}) } };
}

/** Every form of the joints this pass owns, as sentence matchers (slots match anything). */
function jointMatchers(kit, lang, kinds = SEAM_JOINTS) {
  const out = [];
  for (const kind of kinds) {
    const forms = [...(jointOf(kit, kind, lang) ?? []), ...(jointOf(kit, kind, lang === "english" ? "hinglish" : "english") ?? []), ...(CODE_JOINTS[kind] ?? [])];
    for (const f of forms) for (const s of sentencesOf(f)) { const k = low(s); if (k.replace(/\{\w+\}/g, "").length > 6) out.push({ kind, re: new RegExp(`^${k.split(/\{\w+\}/).map((y) => y.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".{1,40}?")}$`, "u") }); }
  }
  return out;
}

/** The kind of one assembled part, for the table. */
// (dc-r8-director23 record, main's 035 item 1: a miss verdict is recorded only where a miss word is said; a check-in is no aside; the
// hook's greet-simpler is no verdict; the closing key turn's verdict is no point; the Hindi switch is in the record)
const MISS_WORD = /(?<![\p{L}])(?:nahi|nahin|galat|not\s+(?:quite|yet|it|this)|that's\s+not)(?![\p{L}])/iu;
const VERDICT_HEAD = /^(?:nahi,|nahin,|yeh jawab|abhi yeh|haan, sahi|haan, bilkul|bilkul sahi|bilkul theek|sahi jawab|not quite|not yet|yes, that|exactly right|that's right|(?:\S+\s){1,3}(?:sahi\s)?nahi(?:\s+hai)?[,.]|(?:\S+\s){1,3}sahi nahi)/iu;
const CHECKIN_Q = /(?:theek hai|saaf hua|saaf hai|samajh aaya|samjhe|clear|make sense|got it)\s*[?？]\s*$/iu;
/** dc-r8-director25 L2 item 5: the head of a key sentence (brain/say.js GAVE_FORMS, and the worked answer's "Iska jawab hai …"). */
const KEY_HEAD = /^(?:is\s+sawaal\s+ka\s+(?:sahi\s+)?jawab|iska\s+(?:sahi\s+)?jawab|yahan\s+(?:sahi\s+)?jawab|this\s+question's\s+(?:right\s+)?answer|the\s+(?:right\s+)?answer\s+here|here\s+the\s+(?:right\s+)?answer)(?![\p{L}])/iu;
function kindOf(p, i, list, info) {
  const t = norm(p.text);
  // (dc-r8-director25 L2 item 5: a part that brain/say.js named — what was covered, the wrap's acknowledgement, the sentence to her, the
  // goodbye, greetSimpler, a picture's caption, a key — is recorded as what it is)
  if (p.kind) return p.kind;
  if (info.greetSimpler && low(t).startsWith(low(info.greetSimpler).slice(0, 30))) return "greetSimpler";
  if (p.part === "alt" || (info.caption && low(t).startsWith(low(info.caption).slice(0, 30)))) return "caption";
  // (a key said on its own — a give-up's, or the worked answer said as help — is a key, not a verdict or a point)
  if (["close", "body", "simpler"].includes(p.part) && KEY_HEAD.test(t)) return "key";
  // (Brain 045 P7: the start line after a second request at the greeting is the help joint it is, never a second hook — no hook > hook)
  if (info.helpJoint?.kind === "startAnyway" && info.helpJoint.form && i === 0 && low(t).startsWith(low(info.helpJoint.form).slice(0, 20))) return "startAnyway";
  // (Brain 045 P7: on the greeting's own turn, what follows its simpler wording is the greeting's question — never a point)
  if (info.greetTurn && i > 0 && /[?？]\s*$/.test(t) && list.slice(0, i).some((q, k) => kindOf(q, k, list, { ...info, greetTurn: false }) === "greetSimpler")) return "greetAsk";
  if (info.greet && (p.part === "close" || p.part === "closed")) return "hook";
  if (info.workedProblem && ["body", "held"].includes(p.part) && low(t).startsWith(low(info.workedProblem).slice(0, 30))) return "workedProblem";
  // (dc-r8-director26, the record: help's joint — the go-on line, helpSpent, helpToCard — is recorded as what it is, never as a verdict; a
  // help wording is recorded as help, never as a point)
  if (info.helpJoint?.form && (i === 0 || (i === 1 && info.helpJoint.spent)) && low(t).startsWith(low(info.helpJoint.form).slice(0, 20))) return info.helpJoint.kind;
  // (Brain 044 T5: the "nothing easier" line said before the go-on line after a key)
  if (info.helpJoint?.spent?.form && i === 0 && low(t).startsWith(low(info.helpJoint.spent.form).slice(0, 20))) return info.helpJoint.spent.kind === "noPicture" ? "noPicture" : "helpSpent";
  if (p.part === "simpler") return "help";
  // (dc-r8-director27 P7: code's frame before a card said again — "Phir se dekho:" — is no point)
  if (["body", "held"].includes(p.part) && /^(?:Phir se dekho|Ek baar aur dekho|Ek baar phir dekho|Sawaal yeh hai|Dhyan se dekho|Here it is again|Once more|The question is|Look again|One more look)\s*:\s*$/i.test(t)) return "repose";
  switch (p.part) {
    // (Brain 046 Q6, c5-t02 steady 98: the closing question's miss — graded by the end's own walk, with no lastVerdict — is a miss verdict
    // where its head reads as one, as the default case reads an authored end's verdict)
    // (to-brain 053 D: a yes-or-no key said as the fact after a miss — "Nahi, tile ka kona right angle hai; …" — is the key, recorded as one:
    // director34 c4-ch01-t02 stuck 42 was logged missVerdict)
    case "close": if (info.keyFact && i === list.findIndex((q) => q.part === "close")) return "key";
      // (to-brain 054 C2: a key said as its why alone, with no verdict before it, is the key)
      if (info.keyWhy && i === list.findIndex((q) => q.part === "close") && norm(t).startsWith(norm(info.keyWhy).slice(0, 40))) return "key";
      // (d38 RULING-A8 Q6: a yes-or-no key said as its why alone at a give-up is the key — where no side-topic line leads the turn)
      if (info.ynHelpKey && i === list.findIndex((q) => q.part === "close") && !list.slice(0, i).some((q) => q.part === "aside") && norm(t).startsWith(norm(info.ynHelpKey).slice(0, 40))) return "key";
      return (info.miss || (info.authoredEnd && VERDICT_HEAD.test(t) && !/^(?:haan|bilkul|sahi|yes|exactly|that's right)\b/i.test(t) && MISS_WORD.test(sentencesOf(t)[0] ?? "")))
      && i === list.findIndex((q) => q.part === "close") && MISS_WORD.test(t) ? "missVerdict" : "verdict";
    case "closed": return "closed";
    case "bridge": return "bridge";
    case "aside":
      if (sentencesOf(t).some((x) => info.carriers?.find((m) => m.re.test(low(x)))?.kind === "asidePark")) return "park";
      if ((info.returnLine && low(t).includes(low(info.returnLine).slice(0, 30))) || sentencesOf(t).some((x) => info.carriers?.find((m) => m.re.test(low(x)))?.kind === "asideReturn")) return "return";
      if (AI_LINE.test(t)) return /[?？]\s*$/.test(t) ? "aiQuestion" : "aiLine";
      if (CHECKIN_Q.test(t) && sentencesOf(t).length === 1) return "checkin";
      if (info.tryFirst && low(t).startsWith(low(info.tryFirst).slice(0, 20))) return "tryFirst";
      // (her reply to the child's aside, or to the child's answer to her return; any other aside part — a check-in, a split close's
      // question — is no reply)
      // (on a turn that answers the child's aside with no reply line of hers, its first aside part is the acknowledgement)
      if ((info.replyLine && low(t).includes(low(info.replyLine).slice(0, 30))) || (!info.replyLine && info.asideAck && i === list.findIndex((q) => q.part === "aside"))) return info.afterAi ? "aiReply" : "asideReply";
      return "aside";
    case "card": return info.returnCard ? "returnCard" : "card";
    default:
      if (info.tryFirst && low(t).startsWith(low(info.tryFirst).slice(0, 20))) return "tryFirst";
      // (dc-r8-director27 P7, c4 steady 138: "Haan, sahi hai, kyunki … nahi jaate" is a right verdict — a right head wins over a "nahi" in its why)
      if (info.authoredEnd && i === 0 && VERDICT_HEAD.test(t)) return !/^(?:haan|bilkul|sahi|yes|exactly|that's right)\b/i.test(t) && MISS_WORD.test(sentencesOf(t)[0] ?? "") ? "missVerdict" : "verdict";
      // (main's fifth ruling on cause C, correction 2: a teach-back's key said as its why alone with no verdict before it — a give-up's — is
      // the key; dry steady c4-ch01-t02 104)
      if (info.authoredEnd && info.keyWhy && i === 0 && norm(t).startsWith(norm(info.keyWhy).slice(0, 40))) return "key";
      if (CHECKIN_Q.test(t) && sentencesOf(t).length === 1) return "checkin";
      return info.remediation ? "remediation" : "point";
  }
}

/**
 * The seam pass over a finished turn. `list` is the turn's ordered parts; `info` says what code knows about them:
 *   { miss, returnCard, remediation, park, returnLine, tryFirst, afterAi }.
 * Returns { list, seams, jointsUsed, said: {kind: form} } — the parts with every owned joint removed and the table's joints placed.
 */
export function seamPass(list0, { kit, state, lang = "hinglish", info = {} }) {
  const matchers = jointMatchers(kit, lang);
  const jointKindOf = (s) => matchers.find((m) => m.re.test(low(s)))?.kind ?? null;
  // 1. no joint survives from an earlier pass: each part loses its owned joint sentences
  const stripped = [];
  for (const p of list0 ?? []) {
    const kept = sentencesOf(p.text).filter((s) => !jointKindOf(s));
    if (kept.length) stripped.push({ ...p, text: kept.join(" ") });
  }
  // 2. the table, at each seam (and at the turn's start)
  const carriers = jointMatchers(kit, lang, ["asidePark", "asideReturn"]);
  let kinds = stripped.map((p, i) => kindOf(p, i, stripped, { ...info, carriers }));
  // (dc-r8-director26 J1 item 2: the go-on line is a joint of this table — where the back-to joint follows, it is not said. c5-t01 stuck 30,
  // steering 18; c5-t02 stuck 46; c6 stuck 30, steering 18: "…abhi aage badhte hain. Achha, ab pehle wale sawaal ko phir se dekhte hain." —
  // two joints that contradict each other)
  // (dc-r8-director27 P3, fd-one-joint-left-requests-unanswered: dropping the go-on line left a back-to line and a bare card that said nothing
  // to the child — c5-t01 stuck 30, steering 18. After a key with nothing left to say on it, the return to the earlier card is led by ONE
  // authored form that says both: this will come again, and now back to the earlier question (afterKeyReturn). P5, c6 steering 32: before
  // the aside's return the go-on line is not said — the return is led by its own form)
  const intoReturn = kinds.includes("returnCard") && info.returnCard ? "returnCard" : kinds.includes("return") ? "return" : null;
  if (info.helpJoint?.kind === "afterKeyGoOn" && info.helpJoint.form && intoReturn) {
    const goK = sentencesOf(info.helpJoint.form).map(low);
    const at = stripped.findIndex((p) => sentencesOf(p.text).some((x) => goK.includes(low(x))));
    // (to-brain 049 B6, 047 R5's third bullet — supersedes P5's choice for the aside's return: "nothing easier" is never followed in the
    // same turn by an aside's return; before the return the go-on line is said in its place, as director/state.js helpAfter does when the
    // walk's move carries the return. Here the return was decided after the walk, by say.js's due park: fixture c4-ch05-t01 stuck 46,
    // "Isko main aur aasaan nahi keh paa rahi. Waise, cricket …")
    if (at >= 0 && at < kinds.indexOf(intoReturn) && intoReturn === "return") {
      if (info.helpJoint.spent?.form) {
        const spK = sentencesOf(info.helpJoint.spent.form).map(low);
        for (let n = 0; n <= at; n++) stripped[n] = { ...stripped[n], text: sentencesOf(stripped[n].text).filter((x) => !spK.includes(low(x))).join(" ") };
        for (let n = at; n >= 0; n--) if (!stripped[n].text.trim()) stripped.splice(n, 1);
        info = { ...info, helpJoint: { kind: info.helpJoint.kind, form: info.helpJoint.form, by: info.helpJoint.by } };
        kinds = stripped.map((p, i) => kindOf(p, i, stripped, { ...info, carriers }));
      }
    } else if (at >= 0 && at < kinds.indexOf(intoReturn)) {
      const rest = sentencesOf(stripped[at].text).filter((x) => !goK.includes(low(x)));
      // (before the aside's return the go-on line's "we go on" contradicts the return — c6 steering 32, its judge: "abhi aage badhte hain. Ab
      // cricket ki baat karte hain". The request is still answered: the helpSpent line, then the return)
      // (Brain 044 T5: the "nothing easier" line already said before the go-on line is not said twice)
      const spentJ = intoReturn === "return" && !info.helpJoint.spent ? helpJoint(scriptFor(kit)?.script, "helpSpent", { lang, lessonKey: lessonKeyOf(state), n: state?.helpJointN?.helpSpent ?? 0 }) : null;
      if (spentJ?.text) stripped[at] = { ...stripped[at], text: [spentJ.text, ...rest].join(" ") };
      else if (rest.length) stripped[at] = { ...stripped[at], text: rest.join(" ") }; else stripped.splice(at, 1);
      info = { ...info, helpJoint: spentJ?.text ? { kind: "helpSpent", form: spentJ.text, by: spentJ.by } : info.helpJoint.spent ? { kind: "helpSpent", form: info.helpJoint.spent.form, by: info.helpJoint.spent.by } : null, goOnDropped: info.helpJoint.form, ...(intoReturn === "returnCard" ? { afterKeyReturn: true } : {}) };
      kinds = stripped.map((p, i) => kindOf(p, i, stripped, { ...info, carriers }));
    }
  }
  // (d37 RULING-G item 8: one go-on or back-to-work line a turn — offtopic c4-ch05-t01 54, "Koi baat nahi, chalo aage badhte hain. Haan,
  // cricket, yeh tumne bataya tha na! Theek hai, ab phir se apne kaam par lagte hain. …": where the go-on line leads a turn whose reply to a
  // side-topic is followed by this table's back-to joint, the first is dropped and the turn opens on her reply; a "nothing easier" line
  // before it stays)
  if (info.helpJoint?.kind === "afterKeyGoOn" && info.helpJoint.form && !info.noReplyJoint) {
    const goK = sentencesOf(info.helpJoint.form).map(low);
    const at = stripped.findIndex((p) => sentencesOf(p.text).some((x) => goK.includes(low(x))));
    const backAt = kinds.findIndex((k, i) => i > at && i + 1 < kinds.length && ["aside", "asideReply", "aiLine", "aiReply", "park"].includes(k)
      && ["afterAside", "afterAiLine", "backTo"].includes(seamJoint(k, kinds[i + 1]) ?? ""));
    if (at >= 0 && backAt > at) {
      const rest = sentencesOf(stripped[at].text).filter((x) => !goK.includes(low(x)));
      if (rest.length) stripped[at] = { ...stripped[at], text: rest.join(" ") }; else stripped.splice(at, 1);
      const sp = info.helpJoint.spent;
      info = { ...info, helpJoint: sp?.form ? { kind: sp.kind === "noPicture" ? "noPicture" : "helpSpent", form: sp.form, by: sp.by } : null, goOnDropped: info.helpJoint.form };
      kinds = stripped.map((p, i) => kindOf(p, i, stripped, { ...info, carriers }));
    }
  }
  // (to-brain 049 B6, the same rule where help's joint is the "nothing easier" line alone — no key, so no go-on line: nothing in its place)
  if (info.helpJoint?.kind === "helpSpent" && info.helpJoint.form && kinds.includes("return")) {
    const spK = sentencesOf(info.helpJoint.form).map(low);
    const at = stripped.findIndex((p) => sentencesOf(p.text).some((x) => spK.includes(low(x))));
    if (at >= 0 && at < kinds.indexOf("return")) {
      const rest = sentencesOf(stripped[at].text).filter((x) => !spK.includes(low(x)));
      if (rest.length) stripped[at] = { ...stripped[at], text: rest.join(" ") }; else stripped.splice(at, 1);
      info = { ...info, helpJoint: null };
      kinds = stripped.map((p, i) => kindOf(p, i, stripped, { ...info, carriers }));
    }
  }
  // (dc-r8-director24 M: the verdict's opener in the model's words — the code frame at the head of the turn's verdict is swapped for
  // hers when it passes the join checks and says the verdict it opens: a right word on a right answer, a miss word on a miss)
  const opener = verdictOpener(stripped, kinds, { kit, state, lang, info });
  const out = [], seams = [], said = {}, used = [], picks = {};
  let prevKind = "start";
  // (dc-r8-director25 L2 item 5: the record's left kind — a key said inside a verdict's part is recorded as its own part, after the
  // verdict; the joint is still decided by the part's kind, so what is said does not change)
  let recLeft = "start";
  stripped.forEach((p, i) => {
    const k = kinds[i];
    // (to-brain 054 A(i) D2, with main's second ruling fix 3: on the turn after her reply's point turn, her line to the side-topic said there leads
    // into the card with no second go-on joint — "back to work" is never said in two turns running. The seam's left is that reply said again,
    // replyAgain: the table has no row for it, so it takes no joint)
    if (info.noReplyJoint && ["asideReply", "aiReply", "park", "aside", "aiQuestion", "aiLine"].includes(prevKind) && i > 0) prevKind = recLeft = "replyAgain";
    // (no joint between a point and its own card, a verdict and its own why: those are not in the table)
    // (help's joint is said by help, not by this table: its seam is recorded, with its form, below)
    let j = HELP_JOINT_KINDS.has(k) ? null : seamJoint(prevKind, k);
    if (j === "backTo" && info.afterKeyReturn) j = "afterKeyReturn";
    // (dc-r8-director30 Brain 046 Q5: a worked example's close — "Toh poora jawab: …" — into the next card or its point takes joints.afterWorked:
    // c5-t01 steady 26, 56, stuck 34, offtopic 48, steering 36; c5-t02 steady 26, 64, 82, stuck 34, offtopic 72, steering 36)
    if (!j && prevKind === "verdict" && ["card", "point"].includes(k) && i > 0 && stripped[i - 1]?.part === "close" && (state?.lastMove?.closeBeat?.beatId === "worked" || !!state?.lastMove?.workedDone)) j = "afterWorked";
    // (Brain 046 Q3: the Hindi switch, read as her aside line until the record renames it, takes no reply's joint)
    if (j === "afterAside" && prevKind === "aside" && info.hindiSwitch && i > 0 && low(sentencesOf(stripped[i - 1].text).join(" ")) === low(info.hindiSwitch)) j = null;
    // (Brain 043 R2: after her invitation to do the problem together the turn starts at the problem — no lead-in)
    if (j === "beforeWorked" && prevKind === "start" && invitedJustNow(kit, state, lang)) j = null;
    // (a return that opens a turn takes backTo only when another unit came between — info.returnCard says so)
    if (j && used.includes(j)) j = null;
    const own = j ? jointOf(kit, j, lang) : null;
    const forms = own?.length ? own : j ? CODE_SEAM_FORMS[j]?.[lang === "english" ? "english" : "hinglish"] ?? null : null;
    // (d37 RULING-G item 8, the walk's fresh-form rule: a joint never opens on the words the sentence before it opened on — the next form of
    // its own rotation that does not (the rotation kept: seamForm), else the form as picked)
    const before = out.length ? sentencesOf(out.at(-1).text).at(-1) : "";
    let form = j && forms?.length ? seamForm(forms, state, j, before ? (f) => openerOf(f) === openerOf(before) : null) : null;
    if (form) picks[j] = { ix: forms.indexOf(form), len: forms.length };
    // (dc-r8-director24 M: the model's join for this seam, when it wrote one and it passes; else the authored form. The seam records
    // which was said, and why the model's fell back)
    const mine = j && form ? norm(info.modelJoins?.[j] ?? "") : "";
    const bad = mine ? joinProblem(mine, { kit, state, lang }) : null;
    if (mine && !bad) form = /[.!।]$/.test(mine) ? mine : `${mine}.`;
    seams.push({ left: recLeft, right: k, joint: form ? j : null, ...(form ? { form, by: mine && !bad ? "model" : own?.length ? "authored" : "code", ...(bad ? { fellBack: bad } : {}) } : {}) });
    if (opener && i === opener.at) seams.at(-1).opener = opener.record;
    // (to-brain 051 C6, the record: the invitation — joints.yourTurn — is its own seam kind, with its form)
    if (k === "yourTurn" && !form) Object.assign(seams.at(-1), { joint: "yourTurn", form: p.text, by: "authored" });
    // (dc-r8-director26 J1: the back-to joint said where the go-on line was dropped carries the lesson on — its record says so)
    if (form && j === "backTo" && info.goOnDropped) seams.at(-1).goOn = true;
    recLeft = k;
    if ((k === "verdict" || k === "missVerdict") && sentencesOf(p.text).slice(1).some((x) => KEY_HEAD.test(x) || (info.keyWhy && norm(x).startsWith(norm(info.keyWhy).slice(0, 40))))) { seams.push({ left: k, right: "key", joint: null }); recLeft = "key"; }
    // (a joint into a return, a remediation or the card she invited a try at is said over the board it leads into — as the card's own
    // words were; a joint out of an aside reply is no unit's, and the board waits for her first unit part)
    if (form) { out.push({ part: /^after(?:Aside|AiLine)$/.test(j) ? "aside" : "body", text: form, joint: j }); said[j] = form; used.push(j); }
    out.push(p);
    // (Brain 044 T5: help's own joint that opens the turn leaves the seam after it as the turn's start — the back-to or after-key return still
    // leads a return to an earlier card after the "nothing easier" line)
    prevKind = k;
  });
  // 3. a filler that opens two neighbouring parts is said once ("Achha, toh … Achha, ab …")
  for (let i = 1; i < out.length; i++) {
    // (main on director23: "Achha, toh … Achha, ab …", and "Hmm, achha, theek hai. Achha, ab …" — a part that opens on a filler after a
    // part that opened on one, or after an acknowledgement of fillers only, loses its own)
    const a = (FILLER_ONLY.test(sentencesOf(out[i - 1].text).at(-1) ?? "") ? "ack" : FILLER.exec(out[i - 1].text)?.[1]?.toLowerCase()), b = FILLER.exec(out[i].text)?.[1]?.toLowerCase();
    if (a && b && (a === b || a === "ack")) {
      const t = out[i].text.replace(FILLER, "");
      out[i] = { ...out[i], text: t.charAt(0).toUpperCase() + t.slice(1) };
      if (out[i].joint) said[out[i].joint] = out[i].text;
      const s = seams.find((x) => x.form && x.joint === out[i].joint); if (s) s.form = out[i].text;
    }
  }
  // (the Hindi switch, said at the turn's start, is in the record: its own seam, the joint it is)
  // (dc-r8-director25 item 8: with who wrote the form — the script's, or code's own when the script has none)
  if (info.hindiSwitch && out.length && low(out[0].text).startsWith(low(info.hindiSwitch).slice(0, 20))) {
    // (Brain 044 T8: the switch line said as the opener part is one line, recorded once — as the switch: c6 steady 4, row 4's empty opener seam)
    if (seams[0]?.right === "opener" && !seams[0].joint && low(out[0].text) === low(info.hindiSwitch)) { seams.shift(); if (seams[0]) seams[0] = { ...seams[0], left: "hindiSwitch" }; }
    // (Brain 045 P7: one start seam a turn — the switch line opens the turn, and what was its opening part follows it; a part that is the
    // switch line itself, recorded as an aside, is that line, recorded once)
    if (seams[0]?.left === "start" && ["aside", "opener"].includes(seams[0].right) && !seams[0].joint && low(sentencesOf(out[0].text).join(" ")) === low(info.hindiSwitch)) { seams.shift(); if (seams[0]) seams[0] = { ...seams[0], left: "hindiSwitch" }; }
    else if (seams[0]?.left === "start") seams[0] = { ...seams[0], left: "hindiSwitch" };
    seams.unshift({ left: "start", right: "hindiSwitch", joint: "hindiSwitch", form: info.hindiSwitch, by: info.hindiSwitchBy ?? "authored" });
  }
  // (dc-r8-director25 H4: help's joint — helpSpent, afterKeyGoOn — the form the decision picked, and who wrote it)
  // (Brain 044 T5: after the "nothing easier" line the go-on line is the second part)
  if (info.helpJoint?.form && out.length && (low(out[0].text).startsWith(low(info.helpJoint.form).slice(0, 20)) || (info.helpJoint.spent && out[1] && low(out[1].text).startsWith(low(info.helpJoint.form).slice(0, 20))))) {
    const at = seams.find((x) => x.right === info.helpJoint.kind && !x.joint);
    if (at) Object.assign(at, { joint: info.helpJoint.kind, form: info.helpJoint.form, by: info.helpJoint.by });
    else { if (seams[0]?.left === "start") seams[0] = { ...seams[0], left: info.helpJoint.kind }; seams.unshift({ left: "start", right: info.helpJoint.kind, joint: info.helpJoint.kind, form: info.helpJoint.form, by: info.helpJoint.by }); }
  }
  // (Brain 044 T5: the "nothing easier" line said before the go-on line after a key — its own seam, the help it is)
  // (to-brain 054 A: or the no-other-drawing line, before the go-on line after a key — a picture asked at a key's check-in with nothing left)
  const spK = info.helpJoint?.spent?.kind === "noPicture" ? "noPicture" : "helpSpent";
  if (info.helpJoint?.spent?.form && out.length && low(out[0].text).startsWith(low(info.helpJoint.spent.form).slice(0, 20)) && !seams.some((x) => x.joint === spK)) {
    const rec = { joint: spK, form: info.helpJoint.spent.form, by: info.helpJoint.spent.by ?? "authored" };
    const at = seams.find((x) => x.right === spK && !x.joint);
    if (at) Object.assign(at, rec); else { if (seams[0]?.left === "start") seams[0] = { ...seams[0], left: spK }; seams.unshift({ left: "start", right: spK, ...rec }); }
  }
  // (dc-r8-director27 P1: a joint keeps its mark — it is said over the board of the part it leads into, and the page builder reads that)
  return { list: out.map(({ joint, ...p }) => (joint ? { ...p, joint } : p)), seams, jointsUsed: used, said, picks };
}

/** The reply and its parts after the seam pass. */
export function applySeams(reply, list, args) {
  if (!list?.length) return null;
  const r = seamPass(list, args);
  return { ...r, reply: joinParts(r.list) };
}

export const _test = { kindOf, jointMatchers, scriptFor };
