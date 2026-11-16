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
function kindOf(p, i, list, info) {
  const t = norm(p.text);
  switch (p.part) {
    case "close": return info.miss && i === list.findIndex((q) => q.part === "close") ? "missVerdict" : "verdict";
    case "closed": return "closed";
    case "bridge": return "bridge";
    case "aside":
      if (sentencesOf(t).some((x) => info.carriers?.find((m) => m.re.test(low(x)))?.kind === "asidePark")) return "park";
      if ((info.returnLine && low(t).includes(low(info.returnLine).slice(0, 30))) || sentencesOf(t).some((x) => info.carriers?.find((m) => m.re.test(low(x)))?.kind === "asideReturn")) return "return";
      if (AI_LINE.test(t)) return /[?？]\s*$/.test(t) ? "aiQuestion" : "aiLine";
      if (info.tryFirst && low(t).startsWith(low(info.tryFirst).slice(0, 20))) return "tryFirst";
      // (her reply to the child's aside, or to the child's answer to her return; any other aside part — a check-in, a split close's
      // question — is no reply)
      // (on a turn that answers the child's aside with no reply line of hers, its first aside part is the acknowledgement)
      if ((info.replyLine && low(t).includes(low(info.replyLine).slice(0, 30))) || (!info.replyLine && info.asideAck && i === list.findIndex((q) => q.part === "aside"))) return info.afterAi ? "aiReply" : "asideReply";
      return "aside";
    case "card": return info.returnCard ? "returnCard" : "card";
    default:
      if (info.tryFirst && low(t).startsWith(low(info.tryFirst).slice(0, 20))) return "tryFirst";
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
    const form = j && forms?.length ? seamForm(forms, state, j) : null;
    seams.push({ left: prevKind, right: k, joint: form ? j : null, ...(form ? { form } : {}) });
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
  return { list: out.map(({ joint, ...p }) => p), seams, jointsUsed: used, said };
}

/** The reply and its parts after the seam pass. */
export function applySeams(reply, list, args) {
  if (!list?.length) return null;
  const r = seamPass(list, args);
  return { ...r, reply: joinParts(r.list) };
}

export const _test = { kindOf, jointMatchers, scriptFor };
