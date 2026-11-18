// dc-r8-director23 S, the seam pass. No code path adds a joint: when a turn's parts are assembled, this one function walks each pair of
// neighbouring parts and decides the seam from a table keyed by the two kinds; it puts at most one joint at a seam and none between a
// point and its own card or a verdict and its own why; a filler word that opens two neighbouring parts is said once; forms rotate by a
// seed from the lesson id and the count of that joint so far. It writes the turn's seams (`guard.seams`: for each pair, the two kinds,
// the joint kind or none, the form) and the seam predicates read that list and nothing else.
import { jointOf, scriptFor } from "../director/script.js";
import { joinParts } from "./lineParts.js";
import { FALLBACK_JOINTS, helpJoint } from "../director/help.js";

const norm = (x) => String(x ?? "").replace(/\s+/g, " ").trim();
const low = (x) => norm(x).toLowerCase().replace(/[.!?।:]+$/, "");
const sentencesOf = (t) => norm(t).split(/(?<=[.!?।])\s+/).filter(Boolean);

/** The joints this pass owns (a park and a return carry the aside: they are parts of their own, not joints). */
export const SEAM_JOINTS = ["backTo", "afterAside", "afterAiLine", "beforeRemediation", "afterTryFirst", "beforeWorked", "afterKeyReturn"];
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
});
const CODE_JOINTS = { afterAside: ["Chalo, jahan the wahin se aage chalte hain.", "Achha, ab wapas apne sawaal par.", "Theek hai, ab aage badhte hain.", "Okay, back to where we were.", "Right, let's pick up where we left off."],
  beforeWorked: [...CODE_SEAM_FORMS.beforeWorked.hinglish, ...CODE_SEAM_FORMS.beforeWorked.english],
  get afterKeyReturn() { return [...CODE_SEAM_FORMS.afterKeyReturn.hinglish, ...CODE_SEAM_FORMS.afterKeyReturn.english]; } };

/** The seam table: [left kind, right kind] → the joint that seam takes. Anything not listed takes none — a point and its own card, a
 *  verdict and its own why, a bridge and the unit it opens, a park and the card it leads into. */
export const SEAM_TABLE = [
  // (her reply to the child's aside or to her return's question, into the lesson)
  // (dc-r8-director27 P5: the back-to line on every return to an earlier card, whatever led there — her reply to an aside too: c4 offtopic 32,
  // c5-t01 steady 46, c4 stuck 36. One joint at the seam: the back-to, which takes her back from the aside as well)
  ["asideReply", "point", "afterAside"], ["asideReply", "help", "afterAside"], ["asideReply", "card", "afterAside"], ["asideReply", "returnCard", "backTo"], ["asideReply", "remediation", "afterAside"],
  ["aside", "returnCard", "backTo"],
  // (d29 final, with Learning 017's scripts: a park before a return to an earlier card — steering c6 34, stuck c6 40 — P5's back-to too)
  ["park", "returnCard", "backTo"],
  // (her AI line, or her reply after it, into the lesson)
  ["aiLine", "point", "afterAiLine"], ["aiLine", "help", "afterAiLine"], ["aiLine", "card", "afterAiLine"], ["aiLine", "returnCard", "backTo"], ["aiLine", "remediation", "afterAiLine"],
  ["aiReply", "point", "afterAiLine"], ["aiReply", "card", "afterAiLine"], ["aiReply", "returnCard", "backTo"], ["aiReply", "remediation", "afterAiLine"],
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
];
const TABLE = new Map(SEAM_TABLE.map(([a, b, j]) => [`${a}>${b}`, j]));
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
export function seamForm(forms, state, kind) {
  if (!forms?.length) return null;
  const n = state?.jointN?.[kind] ?? 0;
  return forms[(seamStart(lessonKeyOf(state), kind) + n) % forms.length];
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
  if (info.greet && (p.part === "close" || p.part === "closed")) return "hook";
  if (info.workedProblem && ["body", "held"].includes(p.part) && low(t).startsWith(low(info.workedProblem).slice(0, 30))) return "workedProblem";
  // (dc-r8-director26, the record: help's joint — the go-on line, helpSpent, helpToCard — is recorded as what it is, never as a verdict; a
  // help wording is recorded as help, never as a point)
  if (info.helpJoint?.form && (i === 0 || (i === 1 && info.helpJoint.spent)) && low(t).startsWith(low(info.helpJoint.form).slice(0, 20))) return info.helpJoint.kind;
  // (Brain 044 T5: the "nothing easier" line said before the go-on line after a key)
  if (info.helpJoint?.spent?.form && i === 0 && low(t).startsWith(low(info.helpJoint.spent.form).slice(0, 20))) return "helpSpent";
  if (p.part === "simpler") return "help";
  // (dc-r8-director27 P7: code's frame before a card said again — "Phir se dekho:" — is no point)
  if (["body", "held"].includes(p.part) && /^(?:Phir se dekho|Ek baar aur dekho|Ek baar phir dekho|Sawaal yeh hai|Dhyan se dekho|Here it is again|Once more|The question is|Look again|One more look)\s*:\s*$/i.test(t)) return "repose";
  switch (p.part) {
    case "close": return info.miss && i === list.findIndex((q) => q.part === "close") && MISS_WORD.test(t) ? "missVerdict" : "verdict";
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
    if (at >= 0 && at < kinds.indexOf(intoReturn)) {
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
  // (dc-r8-director24 M: the verdict's opener in the model's words — the code frame at the head of the turn's verdict is swapped for
  // hers when it passes the join checks and says the verdict it opens: a right word on a right answer, a miss word on a miss)
  const opener = verdictOpener(stripped, kinds, { kit, state, lang, info });
  const out = [], seams = [], said = {}, used = [];
  let prevKind = "start";
  // (dc-r8-director25 L2 item 5: the record's left kind — a key said inside a verdict's part is recorded as its own part, after the
  // verdict; the joint is still decided by the part's kind, so what is said does not change)
  let recLeft = "start";
  stripped.forEach((p, i) => {
    const k = kinds[i];
    // (no joint between a point and its own card, a verdict and its own why: those are not in the table)
    // (help's joint is said by help, not by this table: its seam is recorded, with its form, below)
    let j = HELP_JOINT_KINDS.has(k) ? null : seamJoint(prevKind, k);
    if (j === "backTo" && info.afterKeyReturn) j = "afterKeyReturn";
    // (Brain 043 R2: after her invitation to do the problem together the turn starts at the problem — no lead-in)
    if (j === "beforeWorked" && prevKind === "start" && invitedJustNow(kit, state, lang)) j = null;
    // (a return that opens a turn takes backTo only when another unit came between — info.returnCard says so)
    if (j && used.includes(j)) j = null;
    const own = j ? jointOf(kit, j, lang) : null;
    const forms = own?.length ? own : j ? CODE_SEAM_FORMS[j]?.[lang === "english" ? "english" : "hinglish"] ?? null : null;
    let form = j && forms?.length ? seamForm(forms, state, j) : null;
    // (dc-r8-director24 M: the model's join for this seam, when it wrote one and it passes; else the authored form. The seam records
    // which was said, and why the model's fell back)
    const mine = j && form ? norm(info.modelJoins?.[j] ?? "") : "";
    const bad = mine ? joinProblem(mine, { kit, state, lang }) : null;
    if (mine && !bad) form = /[.!।]$/.test(mine) ? mine : `${mine}.`;
    seams.push({ left: recLeft, right: k, joint: form ? j : null, ...(form ? { form, by: mine && !bad ? "model" : own?.length ? "authored" : "code", ...(bad ? { fellBack: bad } : {}) } : {}) });
    if (opener && i === opener.at) seams.at(-1).opener = opener.record;
    // (dc-r8-director26 J1: the back-to joint said where the go-on line was dropped carries the lesson on — its record says so)
    if (form && j === "backTo" && info.goOnDropped) seams.at(-1).goOn = true;
    recLeft = k;
    if ((k === "verdict" || k === "missVerdict") && sentencesOf(p.text).slice(1).some((x) => KEY_HEAD.test(x))) { seams.push({ left: k, right: "key", joint: null }); recLeft = "key"; }
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
    seams.unshift({ left: "start", right: "hindiSwitch", joint: "hindiSwitch", form: info.hindiSwitch, by: info.hindiSwitchBy ?? "authored" });
  }
  // (dc-r8-director25 H4: help's joint — helpSpent, afterKeyGoOn — the form the decision picked, and who wrote it)
  // (Brain 044 T5: after the "nothing easier" line the go-on line is the second part)
  if (info.helpJoint?.form && out.length && (low(out[0].text).startsWith(low(info.helpJoint.form).slice(0, 20)) || (info.helpJoint.spent && out[1] && low(out[1].text).startsWith(low(info.helpJoint.form).slice(0, 20))))) {
    const at = seams.find((x) => x.right === info.helpJoint.kind && !x.joint);
    if (at) Object.assign(at, { joint: info.helpJoint.kind, form: info.helpJoint.form, by: info.helpJoint.by });
    else seams.unshift({ left: "start", right: info.helpJoint.kind, joint: info.helpJoint.kind, form: info.helpJoint.form, by: info.helpJoint.by });
  }
  // (Brain 044 T5: the "nothing easier" line said before the go-on line after a key — its own seam, the help it is)
  if (info.helpJoint?.spent?.form && out.length && low(out[0].text).startsWith(low(info.helpJoint.spent.form).slice(0, 20)) && !seams.some((x) => x.joint === "helpSpent")) {
    const rec = { joint: "helpSpent", form: info.helpJoint.spent.form, by: info.helpJoint.spent.by ?? "authored" };
    const at = seams.find((x) => x.right === "helpSpent" && !x.joint);
    if (at) Object.assign(at, rec); else seams.unshift({ left: "start", right: "helpSpent", ...rec });
  }
  // (dc-r8-director27 P1: a joint keeps its mark — it is said over the board of the part it leads into, and the page builder reads that)
  return { list: out.map(({ joint, ...p }) => (joint ? { ...p, joint } : p)), seams, jointsUsed: used, said };
}

/** The reply and its parts after the seam pass. */
export function applySeams(reply, list, args) {
  if (!list?.length) return null;
  const r = seamPass(list, args);
  return { ...r, reply: joinParts(r.list) };
}

export const _test = { kindOf, jointMatchers, scriptFor };
