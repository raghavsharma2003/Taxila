// to-brain 051 C4 to C6 (docs/patches/to-brain/051-director33-screen-stays-answer-boards-named-miss-cap.md, decision dc-r8-director33): the
// predicates Brain B adds, each pinned on its director33 rows (tests/r8-director33-051b.test.mjs, replayed with that run's own script snapshot)
// before it reads the dry matrix.
//   questionThreeRunning  C4 (widens d32's): a question ends three of her turns running by what the child hears — the card, its reask, its
//                         hindi form, a short ask, a picture turn, an aside reply that returns to it; a request to hear it or a Hindi request
//                         is no exemption. The third ends on the invitation; a turn that parks an aside or replies to one, or has no help in
//                         it, ends on the question (and counts)
//   yourTurnNotThird      C4 (widens d32's): the invitation only where her two turns before were at one question by that count
//   inviteAfterPark       C4: the invitation in a turn that parks an aside or replies to one
//   inviteNoHelp          C4: the invitation in a turn with no help in it
//   shortAskNoAnswer      C4: a short ask in a turn whose help did not follow an answer (a clarify, a give-up, a request with no answer)
//   hindiNoFormNoLine     C5: a language request at a card with no `hindi` form, at a script with `joints.easierWords`, and none of its forms
//                         said
//   returnAsksAgain       C6 (widens d33's): and a return that asks when, after an aside that said when ("kal", "aaj", …); a return that asks
//                         what they like in it, to a child who told what they like
import { atQuestionOf, endsOnYourTurn, endsOnShortAsk, runOfTwo, endsOnReaskOf } from "../../server/director/question-run.js";
import { helpPart, at as atPath, sentencesOf as helpSentences, normSentence as helpNorm } from "../../server/director/help.js";
import { D33_PREDICATES } from "./d33-predicates.mjs";

const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
/** to-brain 053 B2: her turn after try-first or a bare yes at the question just said — she waits (the short ask, then the invitation). */
const b2Turn = (r) => ["try_first", "yes"].includes(String(r?.cell?.column ?? ""));
const qKey = (t) => low(t).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
/** Seam kinds that are help: a hint or another wording, a picture's caption, a remediation, the noPicture or nothing-easier line, a Hindi
 *  form said for a language request (the switch line before it). */
const HELP_SEAMS = new Set(["help", "caption", "remediation", "simpler", "noPicture", "helpSpent", "hindiSwitch", "easierWords"]);
/** Seam kinds of a turn that parks an aside or replies to one. */
const ASIDE_SEAMS = new Set(["park", "aiQuestion", "aiReply", "asideReply", "return"]);
const seamsOf = (r) => (r?.seams ?? []).map((x) => x.right);
/** Whether a teacher row parks an aside or replies to one (its seams, or the walk's column). */
export const asideTurn = (r) => seamsOf(r).some((k) => ASIDE_SEAMS.has(k)) || ["aside", "aside_reply"].includes(String(r?.cell?.column ?? ""));
/** Whether a teacher row has help in it. */
export const helpTurn = (r) => seamsOf(r).some((k) => HELP_SEAMS.has(k)) || String(r?.cell?.column ?? "") === "picture";
/** Whether a teacher row ends on the invitation (joints.yourTurn), by its words or its seam. */
const invites = (script, r) => endsOnYourTurn(script, r?.text) || seamsOf(r).at(-1) === "yourTurn";
/** The question a teacher row is at by C4's count: its path, "?short" for a short ask (the pending question's), or null. */
const atOf = (script, r) => (invites(script, r) ? null : atQuestionOf(script, r?.text));
/** The run of her turns at one question ending at row i (C4's count): { n, path } — an invitation or a turn at no question ends it. */
export function runAt(L, i, script) {
  const a = atOf(script, L.rows[i]);
  if (!a) return { n: 0, path: null };
  let path = a === "?short" ? null : a, n = 1;
  for (let j = i - 1; j >= 0; j--) {
    const y = L.rows[j];
    if (y.who !== "teacher") continue;
    const b = atOf(script, y);
    if (!b) break;
    if (b !== "?short") { if (path && b !== path) break; path = b; }
    n++;
  }
  return { n, path };
}
/** The child's row before a teacher row. */
const childBefore = (L, i) => { for (let j = i - 1; j >= 0; j--) if (L.rows[j].who === "child") return L.rows[j]; return null; };
/** Whether the child's row reads an answer (right or wrong). */
const ANSWER_READS = /^(?:correct|incorrect|misconception|partial|right|wrong)/;
const answered = (c) => !!c && (["right", "miss", "partial"].includes(String(c.intent ?? "")) || ANSWER_READS.test(String(c.read ?? "")));

/** A child's line that says when (C6: the return in code's forms does not ask it again). */
export const TIME_WORD = /(?<![\p{L}])(?:kal|aaj|parso|parson|abhi|yesterday|today)(?![\p{L}])/iu;
/** A question asking when. */
const ASKS_WHEN = /(?:kab ki baat|kab hua|kab (?:khela|kiya|gaye)|when was that|when did)/i;
/** A question asking what the child likes in it. */
const ASKS_LIKE = /(?:pasand|achha lag|achhi lag|sabse achha|sabse achhi|favou?rite|like (?:most|best)|enjoy most)/i;
const lastQOf = (t) => (String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter((x) => /\?\s*$/.test(x)).at(-1) ?? "");

/** d37 RULING-G item 7: help at a card said in its POINT's wording (a sentence of the point's pointAlt or simpler, by the script) that ends on
 *  the card's own `reask` — the one turn questionThreeRunning and yourTurnNotThird allow (stuck c5-ch02-t01 12, c5-ch02-t02 12, c5-ch02-t03 12). */
export function pointHelpReaskAt(r, script, prevT = null) {
  const part = String(r?.cell?.part ?? "");
  if (!script || !/:card$/.test(part)) return false;
  let p = null;
  try { p = helpPart(script, part); } catch { p = null; }
  const qp = `.${String(p?.path ?? "").replace(/^\./, "")}`;
  // (or, where her turn before ended on that reask, the card's own question — the reask is not said twice running)
  const askQ = (x) => qKey(String(x ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).at(-1) ?? "");
  const prompt = atPath(script, `${String(p?.path ?? "")}.prompt`);
  const endsOnPrompt = !!prevT && endsOnReaskOf(script, qp, prevT.text) && [prompt?.hi, prompt?.en, typeof prompt === "string" ? prompt : null].filter(Boolean).some((x) => askQ(x) && askQ(x) === askQ(r.text));
  if (!p?.point || !p?.path || !(endsOnReaskOf(script, qp, r.text) || endsOnPrompt)) return false;
  const ss = new Set(helpSentences(String(r.text ?? "")).map(helpNorm));
  return ["pointAlt", "simpler"].some((f) => { const v = atPath(script, `${p.point}.${f}`); return [v?.hi, v?.en, typeof v === "string" ? v : null].filter(Boolean).some((x) => helpSentences(x).map(helpNorm).some((y) => ss.has(y))); });
}
export const D34B_PREDICATES = {
  /** to-brain 049 B6 (d33's), and to-brain 051 C6: a return never asks when after the aside said when (director33 c5-t01 steady 40, c5-t03
   *  steering 50: "Tumne sixer ki baat ki thi: woh kab ki baat hai?" after "kal maine cricket khela"), nor what they like in it to a child who
   *  told what they like (c6-ch07-t01 offtopic 68, after row 37's "sixer" to her question what they like best). Gated. */
  returnAsksAgain(L, r, i, ctx) {
    const was = D33_PREDICATES.returnAsksAgain(L, r, i, ctx);
    if (was || r.who !== "teacher" || !r.returnSaid) return was;
    const q = lastQOf(r.text);
    if (!q) return null;
    const rows = (L.rows ?? []).slice(0, i);
    const asides = rows.filter((x) => x.who === "child" && ["aside", "aside_reply"].includes(String(x.intent ?? "")));
    if (ASKS_WHEN.test(q)) { const t = asides.find((x) => TIME_WORD.test(String(x.text ?? ""))); if (t) return `asks when after the aside said it: "${String(t.text).slice(0, 40)}"`; }
    if (ASKS_LIKE.test(q)) {
      const k = rows.findIndex((x, n) => x.who === "child" && n > 0 && rows[n - 1].who === "teacher" && ASKS_LIKE.test(lastQOf(rows[n - 1].text)) && String(x.text ?? "").trim());
      // (told: their answer to her own question what they like best — "mujhe cricket pasand hai" is no answer to what they like in it)
      if (k >= 0) return `asks what they like in it after they told it: "${String(rows[k].text).slice(0, 40)}"`;
    }
    return null;
  },
  /** to-brain 051 C4: a question ends at most two of her turns running by what the child hears (the wider count: d32's read only the forms
   *  ending "?" and let a Hindi turn and a request to hear it out). director33: c6 stuck 66; c4-ch01 steady 8, 10; c5-t01 offtopic 26, 28,
   *  stuck 38, 50; c5-t03 offtopic 26, 28, stuck 8; c4 offtopic 34, steering 10, 12, stuck 18; c4-ch06 stuck 8, 18, 42, offtopic 44;
   *  c5-t02 stuck 48; c6-ch07-t03 stuck 74. Gated. */
  questionThreeRunning(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.script) return null;
    // (the turns that rightly end on the question: one that parks an aside or replies to one, one with no help in it — they count)
    if (asideTurn(r) || !helpTurn(r)) return null;
    // (d37 RULING-G item 7: the point's wording said as help at a card, ending on the card's reask — allowed)
    if (pointHelpReaskAt(r, ctx.script, ctx.prevT)) return null;
    const { n, path } = runAt(L, i, ctx.script);
    return n >= 3 ? `the question ${path ?? "(a short ask)"} ends ${n} of her turns running` : null;
  },
  /** to-brain 051 C4: the invitation only on a turn whose two turns before were at one question by the wider count. Gated. */
  yourTurnNotThird(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.script || !invites(ctx.script, r)) return null;
    // (to-brain 053 B2: after try-first or a bare yes, the second such turn waits with the invitation, the short ask said the turn before)
    if (b2Turn(r)) return null;
    const two = [];
    for (let j = i - 1; j >= 0 && two.length < 2; j--) if (L.rows[j].who === "teacher") two.unshift(L.rows[j]);
    return two.length === 2 && runOfTwo(ctx.script, two.map((x) => (invites(ctx.script, x) ? "" : x.text))) ? null
      : "a turn ends on the invitation (joints.yourTurn) where her two turns before did not end on one question";
  },
  /** to-brain 051 C4: the invitation is never said in a turn that parks an aside or replies to one (director33 c5-t02 offtopic 18; c6
   *  offtopic 18; c4-ch01 offtopic 14). Gated. */
  inviteAfterPark(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.script || !invites(ctx.script, r)) return null;
    return asideTurn(r) ? `the invitation in a turn that ${seamsOf(r).includes("park") ? "parks an aside" : "replies to an aside"}` : null;
  },
  /** to-brain 051 C4: the invitation is never said in a turn with no help in it (director33 c4-ch01 steady 30). Gated. */
  inviteNoHelp(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.script || !invites(ctx.script, r) || asideTurn(r) || b2Turn(r)) return null;
    return helpTurn(r) ? null : `the invitation in a turn with no help in it (${seamsOf(r).join(", ")})`;
  },
  /** to-brain 051 C4: a short ask ("Ab phir se socho, jawab kya hoga?") only after help that followed an answer — after a clarify or a give-up
   *  with no answer, the question itself (director33 c5-t01 offtopic 24). Gated. */
  shortAskNoAnswer(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.script || !endsOnShortAsk(ctx.script, r.text)) return null;
    // (to-brain 053 B2: after try-first or a bare yes at the question just said, the short ask is the wait — no answer is due before it)
    if (["try_first", "yes"].includes(String(r.cell?.column ?? ""))) return null;
    const c = childBefore(L, i);
    return answered(c) ? null : `a short ask after "${String(c?.text ?? "").slice(0, 30)}" (${String(c?.intent ?? c?.read ?? "?")}), no answer`;
  },
  /** to-brain 051 C5: a language request at a card with no `hindi` form opens with one form of the script's `joints.easierWords` — read only
   *  where the script has them (none does yet: 0). Gated. */
  hindiNoFormNoLine(L, r, i, ctx) {
    const forms = (ctx?.script?.joints?.easierWords ?? []).flatMap((f) => [f?.hi ?? (typeof f === "string" ? f : null), f?.en]).filter(Boolean).map(qKey);
    if (r.who !== "teacher" || !forms.length) return null;
    const c = childBefore(L, i);
    if (String(c?.intent ?? "") !== "hindi" && String(r.cell?.column ?? "") !== "hindi") return null;
    if (seamsOf(r).includes("hindiSwitch")) return null;
    const t = qKey(r.text);
    // (to-brain 052 A4: with the help spent she says the honest nothing-easier line (051 C5): a turn that says a joints.helpSpent form, read
    // from the script, or carries its seam, is not flagged — offtopic-c6-ch07-t01 row 32)
    const spent = (ctx.script.joints?.helpSpent ?? []).flatMap((f) => [f?.hi ?? (typeof f === "string" ? f : null), f?.en]).filter(Boolean).map(qKey);
    if (seamsOf(r).includes("helpSpent") || spent.some((f) => f && t.includes(f))) return null;
    return forms.some((f) => f && t.includes(f)) ? null : "a language request at a card with no Hindi form, and no easierWords line";
  },
};
