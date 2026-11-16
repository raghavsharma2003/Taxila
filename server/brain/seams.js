// dc-r8-director23 S, the seam pass. No code path adds a joint: when a turn's parts are assembled, this one function walks each pair of
// neighbouring parts and decides the seam from a table keyed by the two kinds; it puts at most one joint at a seam and none between a
// point and its own card or a verdict and its own why; a filler word that opens two neighbouring parts is said once; forms rotate by a
// seed from the lesson id and the count of that joint so far. It writes the turn's seams (`guard.seams`: for each pair, the two kinds,
// the joint kind or none, the form) and the seam predicates read that list and nothing else.
import { jointOf, scriptFor } from "../director/script.js";
import { joinParts } from "./lineParts.js";

const norm = (x) => String(x ?? "").replace(/\s+/g, " ").trim();
const low = (x) => norm(x).toLowerCase().replace(/[.!?।:]+$/, "");
const sentencesOf = (t) => norm(t).split(/(?<=[.!?।])\s+/).filter(Boolean);

/** The joints this pass owns (a park and a return carry the aside: they are parts of their own, not joints). */
export const SEAM_JOINTS = ["backTo", "afterAside", "afterAiLine", "beforeRemediation", "afterTryFirst"];
// (code's own neutral after-aside line, before the scripts had afterAside)
const CODE_JOINTS = { afterAside: ["Chalo, jahan the wahin se aage chalte hain.", "Achha, ab wapas apne sawaal par.", "Theek hai, ab aage badhte hain.", "Okay, back to where we were.", "Right, let's pick up where we left off."] };

/** The seam table: [left kind, right kind] → the joint that seam takes. Anything not listed takes none — a point and its own card, a
 *  verdict and its own why, a bridge and the unit it opens, a park and the card it leads into. */
export const SEAM_TABLE = [
  // (her reply to the child's aside or to her return's question, into the lesson)
  ["asideReply", "point", "afterAside"], ["asideReply", "card", "afterAside"], ["asideReply", "returnCard", "afterAside"], ["asideReply", "remediation", "afterAside"],
  // (her AI line, or her reply after it, into the lesson)
  ["aiLine", "point", "afterAiLine"], ["aiLine", "card", "afterAiLine"], ["aiLine", "returnCard", "afterAiLine"], ["aiLine", "remediation", "afterAiLine"],
  ["aiReply", "point", "afterAiLine"], ["aiReply", "card", "afterAiLine"], ["aiReply", "returnCard", "afterAiLine"], ["aiReply", "remediation", "afterAiLine"],
  // (a miss verdict into its remediation)
  ["missVerdict", "remediation", "beforeRemediation"],
  // (a return to an earlier card: after a then-card's verdict in the same turn, or opening a turn after another unit)
  ["verdict", "returnCard", "backTo"], ["missVerdict", "returnCard", "backTo"], ["closed", "returnCard", "backTo"], ["bridge", "returnCard", "backTo"], ["start", "returnCard", "backTo"],
  // (the Hindi switch opens the turn it is asked on — said by the language pass, recorded here)
  ["start", "hindiSwitch", "hindiSwitch"],
  // (her go-ahead to try first, into the card)
  ["tryFirst", "card", "afterTryFirst"], ["tryFirst", "returnCard", "afterTryFirst"],
];
const TABLE = new Map(SEAM_TABLE.map(([a, b, j]) => [`${a}>${b}`, j]));
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
export function joinProblem(text, { kit = null, state = null, lang = "hinglish" } = {}) {
  const t = norm(text);
  if (!t) return "empty";
  if (sentencesOf(t).length > 1) return "two sentences";
  if (t.split(" ").length > JOIN_MAX_WORDS) return "over 12 words";
  if (/\d/.test(t)) return "a digit";
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
function kindOf(p, i, list, info) {
  const t = norm(p.text);
  if (info.greet && (p.part === "close" || p.part === "closed")) return "hook";
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
      if (info.authoredEnd && i === 0 && VERDICT_HEAD.test(t)) return MISS_WORD.test(sentencesOf(t)[0] ?? "") ? "missVerdict" : "verdict";
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
  const kinds = stripped.map((p, i) => kindOf(p, i, stripped, { ...info, carriers }));
  const out = [], seams = [], said = {}, used = [];
  let prevKind = "start";
  stripped.forEach((p, i) => {
    const k = kinds[i];
    // (no joint between a point and its own card, a verdict and its own why: those are not in the table)
    let j = seamJoint(prevKind, k);
    // (a return that opens a turn takes backTo only when another unit came between — info.returnCard says so)
    if (j && used.includes(j)) j = null;
    const forms = j ? jointOf(kit, j, lang) : null;
    let form = j && forms?.length ? seamForm(forms, state, j) : null;
    // (dc-r8-director24 M: the model's join for this seam, when it wrote one and it passes; else the authored form. The seam records
    // which was said, and why the model's fell back)
    const mine = j && form ? norm(info.modelJoins?.[j] ?? "") : "";
    const bad = mine ? joinProblem(mine, { kit, state, lang }) : null;
    if (mine && !bad) form = /[.!।]$/.test(mine) ? mine : `${mine}.`;
    seams.push({ left: prevKind, right: k, joint: form ? j : null, ...(form ? { form, by: mine && !bad ? "model" : "authored", ...(bad ? { fellBack: bad } : {}) } : {}) });
    // (a joint into a return, a remediation or the card she invited a try at is said over the board it leads into — as the card's own
    // words were; a joint out of an aside reply is no unit's, and the board waits for her first unit part)
    if (form) { out.push({ part: /^after(?:Aside|AiLine)$/.test(j) ? "aside" : "body", text: form, joint: j }); said[j] = form; used.push(j); }
    out.push(p);
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
  if (info.hindiSwitch && out.length && low(out[0].text).startsWith(low(info.hindiSwitch).slice(0, 20))) seams.unshift({ left: "start", right: "hindiSwitch", joint: "hindiSwitch", form: info.hindiSwitch });
  return { list: out.map(({ joint, ...p }) => p), seams, jointsUsed: used, said };
}

/** The reply and its parts after the seam pass. */
export function applySeams(reply, list, args) {
  if (!list?.length) return null;
  const r = seamPass(list, args);
  return { ...r, reply: joinParts(r.list) };
}

export const _test = { kindOf, jointMatchers, scriptFor };
