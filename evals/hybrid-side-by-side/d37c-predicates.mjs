// to-brain 054 C (docs/patches/to-brain/054-director36-the-turns-shape-walk-only.md, C.5; main's rulings on C3, C5, C6): keys, reasons and
// help as said. Registered in dry-predicates.mjs after d37b; all six gated (tests/r8-d37-054c.test.mjs pins each on made rows).
//   ownKeyNoReason      C1: an own step's key after a miss or a request (the worked example's your-step, her turn's cell at it, not a right
//                       answer) that does not say the step's own `why`, or says "Toh poora jawab" after it.
//   keyValueTwice       C2: a key whose value (every number of the card's `key`) is said twice in the key and its reason.
//                       (RULING-C2 item 2: gated for every key but a teach-back's; teachbackKeyValueTwice, pending, reads the teach-back's)
//   capBeforeOwnReason  C3: a key at a card where the child's answer was the card's named wrong answer (`wrongIfMis` with `whyAltAsHelp`, or a
//                       `wrongAnswers` entry with its `why`) and that answer's reason was never said at the card.
//   ownStepWorkedHelp   C4: help at an own step (her turn's cell at the your-step) that says the worked problem's `simpler`.
//   thenHelpOtherBoard  C5: help at a follow-up card (her turn's cell at a remediation's `then`) that says that remediation's `sayAlt` or
//                       `simpler` — a remediation's wording is written about its own board.
// And C3's re-pin, by name (main's ruling on question 5):
//   questionFiveTimes   (053 B3, gated, as d35a's) allows a fifth hearing only on a turn whose body is the card's named wrong answer's reason
//                       (its marked whyAlt, or that answer's wrongAnswers why) said for the first time at that card, the child's line before
//                       it being that answer; reads as before everywhere else.
//   spentWithShortUnsaid C6: the "nothing easier" line (seam helpSpent) at a keyed card whose `whyShort` she has not said.
import { helpPart, at, normSentence, sentencesOf, TEACHBACK_PART } from "../../server/director/help.js";
import { saidIn } from "../../server/director/script.js";
import { wrongList } from "../../server/grading/script-answer.js";
import { D35A_PREDICATES } from "./d35a-predicates.mjs";

const seamsOf = (r) => (r?.seams ?? []).map((x) => x.right);
const nk = (t) => normSentence(t);
/** The script node of a compile.js part id (a card, a check, a follow-up card, the your-step), or null. */
export function nodeOfPart(script, partId) {
  try { const p = helpPart(script, /:teachback$/.test(String(partId ?? "")) ? TEACHBACK_PART : partId); return p ? { part: p, node: at(script, p.path) } : null; } catch { return null; }
}
const partOf = (r) => String(r?.cell?.part ?? "");
const isOwnStep = (p) => /:worked:yourStep$/.test(p);
const remOf = (p) => /^(.*-s\d+):rem:(\d+):then$/.exec(p);
const KEY_WORDS = /(?<![\p{L}])(?:iska jawab hai|is sawaal ka(?: sahi)? jawab|the answer (?:here )?is|this question's answer)(?![\p{L}])/iu;
/** Whether a teacher row says a card's key: its seam, or the key's words. */
export const keyRow = (r) => r?.who === "teacher" && (seamsOf(r).includes("key") || KEY_WORDS.test(String(r.text ?? "")));
/** Whether a text says a wording: any of its sentences, read normalised. */
const saysAny = (text, w) => { const T = nk(text); return !!w && sentencesOf(w).some((s) => { const k = nk(s); return k.length > 8 && T.includes(k); }); };
/** Whether a text says a reason clause whole (normalised). */
const saysWhole = (text, w) => { const k = nk(String(w ?? "").replace(/[.!?।]+$/, "")); return !!k && nk(text).includes(k); };
const NUMS = (t) => String(t ?? "").match(/\d+(?:[./]\d+)?/g) ?? [];
const hi = (x) => saidIn(x, "hinglish");
const before = (L, i) => L.rows.slice(0, i).filter((x) => x.who === "teacher").map((x) => String(x.text ?? ""));
/** The child's answer read against a list of written answers: normalised equal, or the same numbers. */
function sameAnswer(child, w) {
  const a = nk(child), b = nk(w);
  if (!a || !b) return false;
  if (a === b) return true;
  const na = NUMS(child).join(" "), nb = NUMS(w).join(" ");
  return !!na && na === nb;
}
/** The child's line before row i. */
const childBefore = (L, i) => { for (let j = i - 1; j >= 0; j--) if (L.rows[j].who === "child") return String(L.rows[j].text ?? ""); return ""; };

/** The named wrong answer's reason for the child's line at a card node: its marked whyAlt, or a wrongAnswers entry's why; else null. */
function namedReason(n, child) {
  if (!n) return null;
  if (n.whyAltAsHelp === true && wrongList(n.wrongIfMis).some((w) => sameAnswer(child, w)) && hi(n.whyAlt)) return hi(n.whyAlt);
  for (const w of Array.isArray(n.wrongAnswers) ? n.wrongAnswers : []) if ([w?.answer, ...(w?.accept ?? [])].some((x) => x != null && sameAnswer(child, String(x))) && hi(w?.why)) return hi(w.why);
  return null;
}
/** C2: a key whose value (every number of the card's `key`) is said twice in the key and its reason (any key). */
function keyValueTwice0(L, r, i, ctx) {
  if (!keyRow(r)) return null;
  const n = nodeOfPart(ctx?.script, partOf(r))?.node;
  const keyN = NUMS(n?.key);
  if (!n?.key || !keyN.length) return null;
  // (the key and its reason: from the turn's start to the end of the card's why where it is said, else the key's own sentence)
  const T = String(r.text ?? "").replace(/\s+/g, " ");
  const why = hi(n.why);
  let seg = T;
  if (why) { const tail = String(why).replace(/[.!?।]+$/, "").slice(-12); const k = T.lastIndexOf(tail); if (k >= 0) seg = T.slice(0, k + tail.length); else seg = sentencesOf(T).filter((s) => KEY_WORDS.test(s)).join(" ") || T; }
  const got = NUMS(seg);
  return keyN.every((x) => got.filter((y) => y === x).length >= 2) ? `the key's value (${n.key}) said twice in the key and its reason` : null;
}
const isTeachback = (p) => /(?:^|:)teachback$/.test(p);
export const D37C_PREDICATES = {
  questionFiveTimes(L, r, i, ctx) {
    const was = D35A_PREDICATES.questionFiveTimes(L, r, i, ctx);
    if (!was || !/ heard a 5th time$/.test(was)) return was;
    const reason = namedReason(nodeOfPart(ctx?.script, partOf(r))?.node, childBefore(L, i));
    return reason && saysAny(r.text, reason) && !before(L, i).some((t) => saysAny(t, reason)) ? null : was;
  },
  ownKeyNoReason(L, r, i, ctx) {
    if (r.who !== "teacher" || !isOwnStep(partOf(r)) || !keyRow(r) || String(r.cell?.column ?? "") === "right") return null;
    const n = nodeOfPart(ctx?.script, partOf(r))?.node;
    const why = hi(n?.why);
    if (!why) return null;
    if (/toh poora jawab|so the full answer/i.test(String(r.text ?? ""))) return `an own step's key with "Toh poora jawab" after it`;
    return saysWhole(r.text, why) ? null : `an own step's key without the step's own reason ("${why.slice(0, 50)}…")`;
  },
  // (main's second ruling on cause C, item 2: gated for every key but a teach-back's — the teach-back's keys are read by the pending
  // teachbackKeyValueTwice below)
  keyValueTwice(L, r, i, ctx) {
    if (isTeachback(partOf(r))) return null;
    return keyValueTwice0(L, r, i, ctx);
  },
  /** RULING-C2 item 2 (pending): keyValueTwice at a teach-back's key — the rows left, listed for main. */
  teachbackKeyValueTwice(L, r, i, ctx) {
    return isTeachback(partOf(r)) ? keyValueTwice0(L, r, i, ctx) : null;
  },
  capBeforeOwnReason(L, r, i, ctx) {
    if (!keyRow(r) || String(r.cell?.column ?? "") === "right") return null;
    const n = nodeOfPart(ctx?.script, partOf(r))?.node;
    if (!n) return null;
    const child = childBefore(L, i);
    const reason = namedReason(n, child);
    if (!reason) return null;
    const said = [...before(L, i), String(r.text ?? "")].some((t) => saysAny(t, reason));
    return said ? null : `the key at the named wrong answer "${child}" with its reason never said ("${reason.slice(0, 50)}…")`;
  },
  ownStepWorkedHelp(L, r, i, ctx) {
    if (r.who !== "teacher" || !isOwnStep(partOf(r)) || keyRow(r)) return null;
    const p = nodeOfPart(ctx?.script, partOf(r))?.part;
    const ws = p?.worked ? hi(at(ctx.script, `${p.worked}.simpler`)) : null;
    return ws && saysAny(r.text, ws) ? `help at an own step from the worked problem's simpler ("${ws.slice(0, 50)}…")` : null;
  },
  thenHelpOtherBoard(L, r, i, ctx) {
    if (r.who !== "teacher" || seamsOf(r).includes("remediation")) return null;
    const m = remOf(partOf(r));
    if (!m) return null;
    const sk = (ctx?.script?.skills ?? []).find((s) => s.skillId === m[1]);
    const rem = sk?.remediation?.[Number(m[2])];
    const w = [hi(rem?.sayAlt), hi(rem?.simpler)].filter(Boolean).find((x) => saysAny(r.text, x));
    return w ? `help at a follow-up card in its remediation's wording ("${w.slice(0, 50)}…")` : null;
  },
  spentWithShortUnsaid(L, r, i, ctx) {
    if (r.who !== "teacher" || !seamsOf(r).includes("helpSpent")) return null;
    // (the card keyed: her turn's cell, else the last key row before it)
    let part = partOf(r);
    let n = nodeOfPart(ctx?.script, part)?.node;
    if (!n?.whyShort) for (let j = i - 1; j >= 0; j--) if (keyRow(L.rows[j])) { part = partOf(L.rows[j]); n = nodeOfPart(ctx?.script, part)?.node; break; }
    const ws = hi(n?.whyShort);
    if (!ws) return null;
    let k = -1;
    for (let j = i - 1; j >= 0; j--) if (keyRow(L.rows[j]) && partOf(L.rows[j]) === part) { k = j; break; }
    if (k < 0) return null;
    const said = [...before(L, i), String(r.text ?? "")].some((t) => saysAny(t, ws));
    return said ? null : `"nothing easier" at a keyed card with its whyShort unsaid ("${ws.slice(0, 50)}…")`;
  },
};
