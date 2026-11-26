// dc-r8-director29 (docs/patches/to-brain/045): the predicates Brain 045 adds, each written from the order's law and pinned non-zero on
// its director29 rows (tests/r8-director29-045.test.mjs) before it is trusted to read 0 on the dry matrix.
//   pictureDrawn   P1: on a picture turn the held panel Studio drew is the board the plan named — its template the preselected board's,
//                  its unit the intent's unit (never the lesson's held unit by default)

/** P1 (steering row 14 in all four pilots): read by dry-predicates' pictureDrawn, with its director22 reads. */
export function pictureNamedFlag(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const pic = !!r.held?.picture || /·\s*visual/.test(String(ctx?.prevRead ?? ""));
    if (!pic || !r.held) return null;
    // (Brain 048 G5: a picture request with nothing new to draw is answered as help — the card's hint, paged as help is; no picture is drawn)
    if (r.cell?.picture === "hint" && !r.held.picture) return null;
    const pre = r.screen?.preselected ?? null;
    const panel = r.held.layout?.panels?.find((p) => p.role === "held") ?? null;
    const drawn = panel?.template ?? r.held.pages?.[0]?.template ?? null;
    if (pre?.template && drawn && pre.template !== drawn) return `the picture drew ${drawn}, the plan named ${pre.template}`;
    const want = r.held.intent?.unit ?? null;
    if (panel?.unit && want && panel.unit !== want) return `the held panel is ${panel.unit}, the plan named ${want}`;
    return null;
}

/** P2: where a part's own words start — its recorded start, past any lead sentence the record folded into it (a seam's joint form: the
 *  easier-words line, a back-to line) — the one start every page is read against (c5-t01 stuck 8). */
export function partStartOf(r, p) {
  const t = String(r.text ?? "");
  const forms = (r.seams ?? []).filter((x) => x.joint && x.form).map((x) => String(x.form).replace(/\s+/g, " ").trim().toLowerCase());
  let at = p.from ?? 0;
  for (;;) {
    const rest = t.slice(at);
    const lead = rest.match(/^\s*/)[0].length;
    const f = forms.find((x) => rest.slice(lead).toLowerCase().startsWith(x));
    if (!f) return at + lead;
    at += lead + f.length;
  }
}

import { endsOnYourTurn, atQuestionOf } from "../../server/director/question-run.js";
import { otherFigureOf, sharesThing } from "../../server/brain/seams.js";
import { ownHelpLast } from "./d31-predicates.mjs";
import { newPointBeforeCheckin, lastReplyAt, REPLY_SEAMS } from "./d37a-predicates.mjs";
import { POINT_WHOLE, FIRST_TEACH_MAX } from "../../scripts/lesson-scripts/check.mjs";
const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const said = (x) => (x && typeof x === "object" ? x.hi ?? x.en : x) ?? "";

/** P3: a turn that tells an asked step after the step's simpler was said — the second request's answer, as the order rules. */
export function stepToldAfterSimpler(L, r, i, script) {
  if (!r?.stepAnswer?.told) return false;
  const m = /^(.+)-s(\d+):worked:step(\d+)$/.exec(String(r.stepAnswer.beat ?? ""));
  if (!m) return false;
  const sk = (script?.skills ?? []).find((k) => k.skillId === `${m[1]}-s${m[2]}`);
  const simpler = low(said(sk?.workedExample?.steps?.[Number(m[3]) - 1]?.simpler));
  if (!simpler) return false;
  return (L.rows ?? []).slice(0, i).filter((x) => x.who === "teacher").some((x) => low(x.text).includes(simpler.slice(0, 40)));
}

const TAUGHT = new Set(["point", "card", "returnCard", "workedProblem", "stepAsk", "remediation", "help", "quickAsk", "quick", "verdict", "missVerdict", "key"]);

/** P6: a turn's help is about another figure — it names a number the card does not (server/brain/seams.js otherFigureOf; c5-t01 stuck 64, 70,
 *  offtopic 30). The help is the row's text from its first help part to its card part (or its end); the card is the row's card. */
export function helpOtherFigure(r, script = null) {
  const pp = r?.pageParts ?? [];
  const h = pp.find((p) => ["simpler", "help"].includes(p.part));
  if (!h || !r?.card) return false;
  const c = pp.find((p) => p.part === "card" && (p.from ?? 0) > (h.from ?? 0));
  const t = String(r.text ?? "");
  const help = t.slice(h.from ?? 0, c ? c.from : t.length);
  // (Brain 046 Q5, c5-t02 steering 10: help said from another wording — a remediation's sayAlt, a point's pointAlt, a problem's problemAlt — is
  // about another figure whatever numbers it names: "Pizza party socho" names none)
  const alts = (() => { const out = []; const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) { if (["sayAlt", "pointAlt", "problemAlt"].includes(k)) out.push(low(said(v)).slice(0, 40)); else walk(v); } }; walk(script ?? {}); return out.filter((x) => x.length >= 20); })();
  if (alts.some((a) => low(help).includes(a)) && !sharesThing(help, String(r.card))) return true;
  // (the card's own ask.simpler counts the card's thing in numbers of its own: about the card — dry offtopic c4 56)
  // (d32 step 0, staged c6-ch07-t01 steady 50: and a worked yourStep's, a check's and a remediation follow-up's own simpler — "Jitne zyada
  // dost, utna chhota hissa. Hissa 1/6 se bada chahiye …" at "2, 4 ya 7?" is about the card)
  const own = (script?.skills ?? []).flatMap((k) => [...(k.explain ?? []).map((b) => b.ask?.simpler), k.workedExample?.yourStep?.simpler, ...(k.checks ?? []).map((c) => c.simpler),
    ...(k.remediation ?? []).map((x) => x.then?.simpler)].map((v) => low(said(v)).slice(0, 40))).filter((x) => x.length >= 20);
  if (own.some((a) => low(help).includes(a))) return false;
  return otherFigureOf(help, String(r.card));
}

/** Brain 046 Q2: the card a row asks (its walk item, else its card's words) → that card's `hindi` form in the script, or null. */
export function hindiFormAt(script, r) {
  const id = String(r?.check?.itemId ?? "");
  const m = /^script:(.+?):(?:ask:(.+)|then:(.+)|([^:]+))$/.exec(id);
  const sk = m ? (script?.skills ?? []).find((k) => k.skillId === m[1]) : null;
  const o = !sk ? null : m[2] === "worked" ? sk.workedExample?.yourStep : m[2] ? (sk.explain ?? []).find((b) => b.id === m[2])?.ask
    : m[3] ? (sk.remediation ?? []).find((x) => x.targets === m[3])?.then : (sk.checks ?? []).find((c) => c.id === m[4]);
  const st = /^stepask:(.+):(\d+)$/.exec(id);
  const o2 = st ? (script?.skills ?? []).find((k) => k.skillId === st[1])?.workedExample?.steps?.[Number(st[2])]?.ask : null;
  // (an asked step whose row records no step item: its cell's part, "<skill>:worked:step<n>" — the staged c6-ch07-t01's dry steady 36)
  const cp = !o && !o2 ? /^(.+?-s\d+):worked:step(\d+)(?::ask)?$/.exec(String(r?.cell?.part ?? "")) : null;
  const o3 = cp ? (script?.skills ?? []).find((k) => k.skillId === cp[1])?.workedExample?.steps?.[Number(cp[2]) - 1]?.ask : null;
  const h = (o ?? o2 ?? o3)?.hindi;
  return h ? said(h) : null;
}
/** d31 046 follow-up: the script object a row's card is (its walk item, else the object whose prompt is the row's card), or null. */
export function cardObjAt(script, r) {
  const id = String(r?.check?.itemId ?? "");
  const m = /^script:(.+?):(?:ask:(.+)|then:(.+)|([^:]+))$/.exec(id);
  const sk = m ? (script?.skills ?? []).find((k) => k.skillId === m[1]) : null;
  const o = !sk ? null : m[2] === "worked" ? sk.workedExample?.yourStep : m[2] ? (sk.explain ?? []).find((b) => b.id === m[2])?.ask
    : m[3] ? (sk.remediation ?? []).find((x) => x.targets === m[3])?.then : (sk.checks ?? []).find((c) => c.id === m[4]);
  const c = low(r?.card);
  if (o && (!c || slotless(said(o.prompt)).every((x) => c.includes(x)) || slotless(o.prompt?.en ?? "").every((x) => c.includes(x)))) return o;
  if (!c) return null;
  for (const k of script?.skills ?? []) for (const x of [...(k.explain ?? []).map((b) => b.ask), ...(k.checks ?? []), ...(k.remediation ?? []).map((y) => y.then), k.workedExample?.yourStep]) {
    if (x?.prompt && [said(x.prompt), x.prompt?.en].some((t) => t && slotless(t).length && slotless(t).every((y) => c.includes(y)))) return x;
  }
  return null;
}
/** A form's stretches with no {slot} in them, each lowercased and trimmed of end punctuation (empty ones dropped). */
const slotless = (t) => low(t).split(/\{\w+\}/).map((x) => x.replace(/^[\s,.:;!?]+|[\s,.:;!?]+$/g, "")).filter((x) => x.length >= 3);
/** A sentence's key: its letters and numbers only. */
const qKey = (t) => low(t).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const sentencesOf = (t) => String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?\u0964])\s+/).filter(Boolean);
/** d31 046 follow-up rule 2: the child's own words asking to hear the question. */
const HEAR_Q = /(?<![\p{L}])(?:phir\s+se|fir\s+se|dobara|repeat|kya\s+bola|kya\s+kaha|sawaal\s+kya|kaunsa\s+sawaal|which|again)(?![\p{L}])/iu;
/** Whether a row says its card in a self-contained form: the whole card, its reask, or its Hindi form. */
function selfContained(script, r) {
  const t = low(r?.text);
  if (r?.card && t.includes(low(r.card))) return "whole";
  const o = cardObjAt(script, r);
  for (const f of [o?.reask?.hi ?? o?.reask, o?.reask?.en]) if (typeof f === "string" && slotless(f).length && slotless(f).every((x) => t.includes(x))) return "reask";
  if (hindiFormSaid(script, r)) return "hindi";
  return null;
}
/** Brain 046 Q2: whether a row asks its card's `hindi` form — a Hindi request's answer, as the order rules (the form is new words, and the
 *  card's question). */
export function hindiFormSaid(script, r) {
  const f = hindiFormAt(script, r);
  if (!f) return false;
  // (a form with a slot — "{friend} ka kehna hai …" — is said filled: its longest stretch with no slot is read)
  const piece = low(f).replace(/[.!?।]+$/, "").split(/\{\w+\}/).sort((a, b) => b.length - a.length)[0] ?? "";
  return low(r?.text).includes(piece.trim().slice(0, 60));
}
/** Brain 046 Q4: a turn that holds a right verdict, a new point and its card (a close, a point, a card — the turn's seams). */
/** to-brain 049 B6.1, main's ruling of 2026-11-23: a verdict, reason, point and card turn is said whole up to this many words. */
export const VPC_WHOLE_MAX = 70;
export const vpcOf = (r) => { const sm = (r?.seams ?? []).map((x) => x.right); const v = sm.indexOf("verdict"), p = sm.indexOf("point"), c = sm.lastIndexOf("card"); return v >= 0 && p > v && c > p; };
const wordsOf = (t) => String(t ?? "").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
/** The card a row's close closes, with its full why said in the row: { card, why } or null. */
function fullWhyIn(script, r) {
  const cl = (r?.pageParts ?? []).find((p) => p.part === "close");
  const id = String(cl?.beat ?? "");
  if (!id) return null;
  const t = low(r.text);
  for (const sk of script?.skills ?? []) {
    const c = id.startsWith("then:") ? (sk.remediation ?? []).find((x) => `then:${x.targets}` === id)?.then : (sk.checks ?? []).find((x) => x.id === id) ?? (sk.explain ?? []).find((x) => x.id === id)?.ask;
    const why = low(said(c?.why)).replace(/^(?:kyunki|because)\s+/, "");
    if (c?.whyShort && why && t.includes(why.slice(0, 40))) return { card: c, why };
  }
  return null;
}
/** Brain 047 R2: a row that says a card with no `reask` whole where the short ask may not stand (it has a seam record and no own hint straight
 *  before its question). */
export function reaskNoFormAt(r, ctx) {
  const o = cardObjAt(ctx?.script, r);
  // (a card that asks for an imagined change — askWhole — never takes the short ask: with no reask, its whole is its only form, whatever help
  // came before; first walked by Brain 049 B5's dry, offtopic c4-ch05-t01 58)
  // (to-brain 051 C4: after a clarify or a give-up with no answer the short ask may not stand either — the question itself is said)
  const noAnswer = !!ctx?.prevIntent && !["right", "miss", "partial"].includes(String(ctx.prevIntent));
  return !!o && !o.reask && !!r?.card && low(r.text).includes(low(r.card)) && (r.seams ?? []).length > 0 && (!ownHelpLast(r, ctx?.script) || !!o.askWhole || noAnswer);
}
/** Brain 046 Q5: the question a turn ends on — its last sentence, where it asks. */
const lastAsk = (r) => { const ss = String(r?.text ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?\u0964])\s+/); const q = ss.at(-1) ?? ""; return /[?？]\s*$/.test(q) ? low(q) : null; };
/** Brain 046 Q6: the script object a compile part id names ("S:e2:card", "S:e2:point", "S:rem:0:then", "S:rem:0", "S:check:c1",
 *  "S:worked:yourStep", "S:worked:problem"), or null. */
export function partObjectOfId(script, part) {
  const m = /^(.+?-s\d+):(.+)$/.exec(String(part ?? ""));
  const sk = m ? (script?.skills ?? []).find((k) => k.skillId === m[1]) : null;
  if (!sk) return null;
  const b = m[2].split(":");
  if (b[0] === "rem") { const r = sk.remediation?.[Number(b[1])]; return b[2] === "then" ? r?.then ?? null : r ?? null; }
  if (b[0] === "check") return (sk.checks ?? []).find((c) => c.id === b[1]) ?? null;
  if (b[0] === "worked") return b[1] === "yourStep" ? sk.workedExample?.yourStep?.board ? sk.workedExample.yourStep : sk.workedExample ?? null : sk.workedExample ?? null;
  const e = (sk.explain ?? []).find((x) => x.id === b[0]);
  return e ? (b[1] === "card" && e.ask?.board ? e.ask : e) : null;
}
/** The card a close's beat names ("e2", "c1", "then:<mix-up>") in any skill, or null. */
function cardOfBeat(script, beat, part = null) {
  const id = String(beat ?? "");
  const S = /^(.+?-s\d+):/.exec(String(part ?? ""))?.[1] ?? null;
  for (const sk of (script?.skills ?? []).filter((k) => !S || k.skillId === S)) {
    const c = id.startsWith("then:") ? (sk.remediation ?? []).find((x) => `then:${x.targets}` === id)?.then : (sk.checks ?? []).find((x) => x.id === id) ?? (sk.explain ?? []).find((x) => x.id === id)?.ask;
    if (c) return c;
  }
  return null;
}
/** Every authored viewCaption in a script, with the object it is written beside. */
function captionsOf(script) {
  const out = [];
  const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (!o || typeof o !== "object") return; if (o.viewCaption) out.push({ o, t: low(said(o.viewCaption)) }); for (const v of Object.values(o)) walk(v); };
  walk(script);
  return out.filter((c) => c.t.length >= 20);
}
/** Brain 046 Q6: the lead-in of a right verdict to its why — ", kyunki", ". Dekho,", a colon — or null. */
export function whyLeadOf(r) {
  if (!(r?.seams ?? []).some((x) => x.right === "verdict")) return null;
  const t = String(r.text ?? "");
  return /^[^.?!:]{3,40}, kyunki /.test(t) ? "kyunki" : /^[^.?!:]{3,40}\. Dekho, /.test(t) ? "dekho" : /^[^.?!:]{3,25}: /.test(t) && !/^(?:toh poora jawab|iska jawab|is sawaal ka|yahan sahi jawab)/i.test(t) ? "colon" : null;
}
/** d38 RULING-A7 P3: the hearings of a question before row i — her turns ending on one of its forms (this check's count) — and the question
 *  her last turn ending on a question asked. */
export function heardBefore(L, i, script) {
  let P = null;
  for (let j = i - 1; j >= 0 && !P; j--) if (L.rows[j].who === "teacher") { const a = atQuestionOf(script, L.rows[j].text); if (a && a !== "?short") P = a; }
  if (!P) return { P: null, n: 0 };
  let n = 0;
  for (let j = 0; j < i; j++) if (L.rows[j].who === "teacher" && atQuestionOf(script, L.rows[j].text) === P) n++;
  return { P, n };
}
/** d38 RULING-A7 P3: row i is her reply to a side-topic, then the told answer (a `key` seam) and its check-in and nothing else, at a question
 *  heard five times before it. */
function keyAtReturn(L, r, i, script) {
  const k = (r.seams ?? []).map((x) => x.right), at = lastReplyAt(r);
  if (!script || at < 0 || k.slice(at + 1).join(">") !== "key>checkin") return false;
  return heardBefore(L, i, script).n >= 5;
}
export const D30_PREDICATES = {
  /** d31 046 follow-up rule 1: a re-ask ends on the card's reask, its whole question, its Hindi form or a short ask — never on a proper part
   *  of the card's question, its last sentence alone or the clause after its colon (dry d31f steady c6-ch07-t01 6, c5-ch02-t03 10, 84,
   *  c6-ch06-t01 90, c5-ch02-t02 8, c4-ch05-t01 16; offtopic c5-ch02-t01 22, 62; stuck c5-ch02-t01 40). A one-sentence card with no reask
   *  keeps the clause after its colon. Gated. */
  reaskWhole(L, r, i, ctx) {
    if (r.who !== "teacher" || !r.card) return null;
    const q = lastAsk(r);
    if (!q || selfContained(ctx?.script, r)) return null;
    const cs = sentencesOf(r.card), c0 = cs.at(-1) ?? "";
    const o = cardObjAt(ctx?.script, r);
    const reask = o?.reask ? said(o.reask) : null;
    const parts = new Set();
    if (cs.length >= 2) parts.add(qKey(c0));
    const m0 = c0.split(/[:;]\s+/).at(-1) ?? "";
    if (m0 !== c0 && (cs.length >= 2 || reask)) parts.add(qKey(m0));
    return parts.has(qKey(q)) ? `a re-ask on a part of the card's question: "${q.slice(0, 60)}"` : null;
  },
  /** d31 046 follow-up 3b: the wrap's two turns never open on the same `wrap.ack` form (dry d31f steady c6-ch07-t01 88, 90: "Achha, tumne
   *  dil se bataya." twice). Gated. */
  wrapAckTwice(L, r, i, ctx) {
    if (r.who !== "teacher" || String(r.move ?? "") !== "wrap") return null;
    const forms = (ctx?.script?.wrap?.ack ?? []).flatMap((f) => [f?.hi ?? f, f?.en]).filter((x) => typeof x === "string" && x.trim()).map((x) => low(x));
    const t = low(r.text);
    const f = forms.filter((x) => t.startsWith(x)).sort((a, b) => b.length - a.length)[0] ?? null;
    const p = ctx.wrapAck ?? null;
    ctx.wrapAck = f;
    return f && p === f ? `both wrap turns open on "${f.slice(0, 40)}"` : null;
  },
  /** d31 046 follow-up rule 2: a request to hear the question ("sawaal kya hai?", "phir se bolo") at a live card is answered with its reask,
   *  its whole question or its Hindi form; at an asked worked step, with the step's question (dry d31f steady c4-ch01-t02 14,
   *  c4-ch05-t01 14; stuck c4-ch01-t02 16). Gated. */
  clarifyAsked(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.prevT) return null;
    if (!(String(ctx?.prevIntent ?? "") === "repeat" || /·\s*(?:repeat|which)\b/.test(String(ctx?.prevRead ?? ""))) || !HEAR_Q.test(String(ctx?.prevChild ?? ""))) return null;
    if (r.card) return selfContained(ctx.script, r) ? null : `a request to hear the question answered without it: "${String(r.text ?? "").slice(0, 60)}"`;
    const step = (x) => (x?.seams ?? []).some((y) => y.right === "stepAsk");
    return step(ctx.prevT) && !step(r) ? "a request to hear the step's question answered without it" : null;
  },
  /** dc-r8-director30 Brain 046 Q6: a picture's caption is the one written for the part the picture is of — never another part's caption
   *  found by an identical board (c5-t01 offtopic 26: e2's caption on a follow-up card; c4 steady 18: the point's on the card's). Gated. */
  captionPart(L, r, i, ctx) {
    if (r.who !== "teacher" || String(r.cell?.column ?? "") !== "picture" || !ctx?.script) return null;
    const own = partObjectOfId(ctx.script, r.cell?.part);
    if (!own) return null;
    const t = low(r.text);
    const hit = captionsOf(ctx.script).find((c) => t.includes(c.t.slice(0, 50)));
    return hit && hit.o !== own && low(said(own.viewCaption)).slice(0, 50) !== hit.t.slice(0, 50) ? `another part's caption said on ${r.cell.part}: "${hit.t.slice(0, 50)}"` : null;
  },
  /** Q6: `whyShort` is on a row only where the card's short reason was said in the full why's place (c5-t02 steady 50, 66, 92, 94, stuck 74,
   *  offtopic 52, 76: set because the short text sits inside the full why). Gated. */
  whyShortSet(L, r, i, ctx) {
    if (r.who !== "teacher" || !r.whyShort) return null;
    const t = low(r.text).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ");
    const k = (x) => low(x).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim().replace(/^(?:kyunki|because)\s+/, "");
    const cl = (r.pageParts ?? []).find((p) => p.part === "close");
    if (!cl) return null;
    const card = cardOfBeat(ctx?.script, cl.beat, r.cell?.part);
    return card?.why && t.includes(k(said(card.why)).slice(0, 40)) ? "whyShort on a row that said the full why" : null;
  },
  /** Q6: every teacher row that answers a child's line has its cell (c5-t01 and c5-t02 stuck 22, a "haan"). Gated. */
  cellMissing(L, r, i) {
    if (r.who !== "teacher" || r.cell || (L.rows ?? [])[i - 1]?.who !== "child") return null;
    return "a teacher row with no cell";
  },
  /** Q6: a miss is recorded as a miss, never `verdict` (c5-t02 steady 98: the closing question's miss). Gated. */
  missAsVerdict(L, r, i, ctx) {
    if (r.who !== "teacher" || !/^(?:incorrect|partial|misconception)\b/.test(String(ctx?.prevRead ?? ""))) return null;
    if (!(r.seams ?? []).some((x) => x.right === "verdict")) return null;
    const s0 = String(r.text ?? "").split(/(?<=[.!?\u0964])\s+/)[0] ?? "";
    return /(?<![\p{L}])(?:sahi\s+nahi|nahi\s+hai|galat|theek\s+nahi)(?![\p{L}])/iu.test(s0) && !/^(?:haan|bilkul|sahi)\b/i.test(s0) ? `a miss recorded as verdict: "${s0.slice(0, 50)}"` : null;
  },
  /** Q6: the verdict's lead-in to its why ("Dekho,", "kyunki", a colon) is not the one of the verdict before it. Gated. */
  whyLeadRunning(L, r, i, ctx) {
    const f = whyLeadOf(r);
    // (a right verdict with no lead-in — a worked close said short — stands between two: they are not running)
    if (!f) { if ((r.seams ?? []).some((x) => x.right === "verdict") && /^(?:haan|bilkul|sahi)\b/i.test(String(r.text ?? ""))) ctx.prevWhyLead = null; return null; }
    const p = ctx.prevWhyLead ?? null;
    ctx.prevWhyLead = f;
    return p === f ? `the why's lead-in "${f}" in two verdicts running` : null;
  },
  /** dc-r8-director30 Brain 046 Q5: a worked example's close going into the next card (or its point) says joints.afterWorked between them
   *  (c5-t01 steady 26, 56, stuck 34, offtopic 48, steering 36; c5-t02 steady 26, 64, 82, stuck 34, offtopic 72, steering 36). Gated. */
  workedSeam(L, r) {
    if (r.who !== "teacher") return null;
    const pp = r.pageParts ?? [], c = pp.findIndex((p) => p.part === "close" && p.beat === "worked");
    if (c < 0 || !["card", "body"].includes(pp[c + 1]?.part ?? "") || /^(?:worked|rem:)/.test(String(pp[c + 1]?.beat ?? ""))) return null;
    // (a wrong answer's close into its remediation takes beforeRemediation, never this seam)
    if ((r.seams ?? []).some((x) => x.right === "missVerdict" || x.right === "remediation")) return null;
    return (r.seams ?? []).some((x) => x.joint === "afterWorked") ? null : "a worked example's close into the next card with no afterWorked seam";
  },
  /** dc-r8-director30 Brain 046 Q5: no re-ask sentence is said in two turns running — the question a turn ends on, the same as the turn of
   *  hers before it ended on, on the same card (c5-t01 steady 8, stuck 62, 70, 72, offtopic 22, 62, steering 10; c5-t02 steady 88, 90; c6
   *  steady 88; c4 steering 14, 16). Gated. A question of two words or fewer, and her return or AI question, is no re-ask. */
  reaskRunning(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.prevT || !r.card) return null;
    // (a request for Hindi at a card with no hindi form: the switch line and the whole card, which may be the question her turn before ended on
    // — Brain 047 R8)
    if (String(ctx?.prevIntent ?? "") === "hindi" && !hindiFormAt(ctx?.script, r)) return null;
    // (and the card's `hindi` form said to a request for Hindi is no re-ask: the order keeps it out of the rotation — the form is said as
    // written, whatever question it ends on; dry steady c5-t01 36, c3's form ends on the card's own question)
    if (String(ctx?.prevIntent ?? "") === "hindi" && hindiFormSaid(ctx?.script, r)) return null;
    // (Brain 049 B4: across her invitation turn — joints.yourTurn, which asks nothing — the turn after it is read against the question-turn
    // before it: the order makes that turn the question again, never the same sentence)
    const pT = endsOnYourTurn(ctx.script, ctx.prevT.text) && ctx.prevPrevT ? ctx.prevPrevT : ctx.prevT;
    const q = lastAsk(r), p = lastAsk(pT);
    if (!q || q !== p || q.split(" ").length < 4) return null;
    // (d31 046 follow-up: a card of two or more sentences with no reask has one self-contained form, the whole card — its last sentence
    // alone is never said (reaskWhole). Said whole again, it is the answer to a request to hear the question (rule 2), or the re-ask
    // after help about another figure, where the short ask may not stand (P6))
    const o = cardObjAt(ctx?.script, r);
    if (!o?.reask && sentencesOf(r.card ?? "").length >= 2 && low(r.text).includes(low(r.card))
      && ((String(ctx?.prevIntent ?? "") === "repeat" && HEAR_Q.test(String(ctx?.prevChild ?? ""))) || helpOtherFigure(r, ctx?.script))) return null;
    // (Brain 047 R2: everywhere the short ask may not stand — no own hint said straight before — a card with no reask is said whole, one
    // sentence or more; counted by reaskNoForm, pending, until every card has its reask. A row with no seam record — before director23 —
    // cannot say what preceded its question: read as before)
    if (reaskNoFormAt(r, ctx)) return null;
    if (low(r.card) !== low(pT.card ?? "") && String(r.check?.itemId ?? "") !== String(pT.check?.itemId ?? "-")) return null;
    return `the same re-ask two turns running: "${q.slice(0, 60)}"`;
  },
  /** Brain 047 R2's fallback, counted: a card with no `reask` said whole again two turns running where the short ask may not stand (no own hint
   *  straight before) — the card has no other form (Learning 020's first pass left some cards without one). Pending. */
  reaskNoForm(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.prevT || !r.card) return null;
    const q = lastAsk(r);
    return q && q === lastAsk(ctx.prevT) && reaskNoFormAt(r, ctx) ? `the whole card again two turns running: it has no reask ("${q.slice(0, 50)}")` : null;
  },
  /** dc-r8-director30 Brain 046 Q4: a verdict, a point and a card in one turn over 65 words says the card's short reason where it has one
   *  (c4 steady 42, stuck 64, steering 56; c5-t02 stuck 74, offtopic 52). Gated. */
  vpcLong(L, r, i, ctx) {
    if (r.who !== "teacher" || !vpcOf(r) || wordsOf(r.text) <= 65) return null;
    return fullWhyIn(ctx?.script, r) ? `a verdict, a point and a card in ${wordsOf(r.text)} words with the full why, where the card has a short one` : null;
  },
  /** Brain 047 R6, counted (pending until the walk splits such a turn): a verdict-point-card turn over 65 words with the short reason. */
  // (to-brain 049 B6.1, main's ruling of 2026-11-23: such a turn is said whole up to 70 words — gated above 70, a turn of that kind over 70
  // not split; the turns of 66 to 70 said whole are counted by vpcWhole, d33-predicates)
  vpcUnlisted(L, r, i, ctx) {
    if (r.who !== "teacher" || !vpcOf(r) || wordsOf(r.text) <= VPC_WHOLE_MAX || fullWhyIn(ctx?.script, r)) return null;
    // (Brain 047 R6: with Learning 020's cuts every other verdict-point-card turn fits; one over 65 with the short reason is a fault unless its
    // point is listed whole — POINT_WHOLE in the checker, said as the verdict and its reason ending on a check-in, then the point and its card)
    const pt = (r.pageParts ?? []).find((p) => p.part === "point" || p.part === "body");
    const sk = String(r.check?.itemId ?? "").split(":")[1] ?? "";
    const listed = POINT_WHOLE.some((w) => w.topicId === ctx?.script?.topicId && (!sk || w.skillId === sk) && (!pt?.beat || w.explainId === pt.beat));
    return listed ? null : `a verdict, a point and a card in ${wordsOf(r.text)} words with the short reason, and the point not listed whole`;
  },
  /** Brain 047 R6: the first teaching turn after the start line — hook, point and card, the start line counted — is held to 75 words
   *  (FIRST_TEACH_MAX; director31: 6 rows at 76 to 80). Gated. */
  firstTeachLong(L, r, i) {
    if (r.who !== "teacher") return null;
    const sm = (r.seams ?? []).map((x) => x.right);
    if (!sm.includes("hook") || !sm.includes("point")) return null;
    if ((L?.rows ?? []).slice(0, i).some((x) => x.who === "teacher" && (x.seams ?? []).some((y) => y.right === "point"))) return null;
    const n = wordsOf(r.text);
    return n > FIRST_TEACH_MAX ? `the first teaching turn is ${n} words > ${FIRST_TEACH_MAX}` : null;
  },
  /** Q4: a skill's bridge never rides in a turn that holds a verdict, a point and a card — it goes with the verdict (c4 steady 42, stuck 64,
   *  steering 56). Gated. */
  vpcBridge(L, r) {
    if (r.who !== "teacher" || !vpcOf(r) || !(r.seams ?? []).some((x) => x.right === "bridge")) return null;
    return `a bridge in a verdict-point-card turn (${(r.seams ?? []).map((x) => x.right).join(" > ")})`;
  },
  /** dc-r8-director30 Brain 046 Q2: the "nothing easier" line (helpSpent) is never the answer to a request for Hindi — the card's `hindi` form
   *  is (c4, c5-t02, c6 offtopic 32). Brain 047 R8: nor at a card with no form — the switch line, its unsaid help, then the whole card
   *  (director31 c4 offtopic 32). Gated. */
  hindiSpentCold(L, r, i, ctx) {
    if (r.who !== "teacher" || String(ctx?.prevIntent ?? r.cell?.column ?? "") !== "hindi" && String(r.cell?.column ?? "") !== "hindi") return null;
    if (!(r.seams ?? []).some((x) => x.joint === "helpSpent")) return null;
    // (Brain 049 B1: at a card with no hindi form a Hindi request is a help request — with its help spent the honest "nothing easier" line
    // and the question in its other wording is the answer; only a card that keeps a form is never answered so)
    return hindiFormAt(ctx?.script, r) ? `a request for Hindi answered with the "nothing easier" line` : null;
  },
  /** P6: the short ask ("Ab phir se socho, jawab kya hoga?") only after help about the card's own figure — help about another figure is
   *  followed by the card's own re-ask (c5-t01 stuck 64, 70, offtopic 30). Gated. */
  reaskFigure(L, r, i, ctx) {
    if (r.who !== "teacher" || !(r.seams ?? []).some((x) => x.right === "reaskShort")) return null;
    return helpOtherFigure(r, ctx?.script) ? "the short ask after help about another figure" : null;
  },
  /** P6: a turn that holds her reply to an aside never ends on a check-in, whatever follows the reply (c4 offtopic 46: reply, bridge, point,
   *  check-in; c5-t02 offtopic 38: reply, point, check-in). Gated (Brain 046 Q3): where the card is held for a due return the turn ends on the return's question. */
  replyCheckin(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const sm = r.seams ?? [];
    // (a worked example that asks no step ends each told step on its own step check-in — that walk's, read by workedCheckin: the
    // point-card fixture's steering c4 38)
    if (sm.at(-2)?.right === "workedStep") return null;
    // (to-brain 054 A, main's fifth ruling item 3 — A(i) is design D2: a check-in at the end of a reply's turn is allowed ONLY when a new point,
    // told for the first time, stands between the reply and the check-in. A reply followed straight by a check-in — or by anything else, as
    // before — is still flagged: a check-in after a bare reply checks nothing)
    // (main's sixth ruling item 2: exactly D2 — her joint and ONE new point between, nothing else; and every reply seam is read: a park, a
    // return, her line to a side-topic at a check-in (seam aside) opening the turn, as well as her replies)
    if (newPointBeforeCheckin(L, r, i, REPLY_SEAMS)) return null;
    // (d38 RULING-A7 P3: the told answer at a return — her reply, then the key (the row's own `key` seam) and its check-in, nothing else
    // between — where the open question has been heard five times: the told answer is the new thing, as a new point is)
    if (keyAtReturn(L, r, i, ctx?.script)) return null;
    return lastReplyAt(r) >= 0 && sm.at(-1)?.right === "checkin" ? `her reply's turn (${sm.map((x) => x.right).join(" > ")}) ends on a check-in` : null;
  },
  /** P4: the "nothing easier" line is never said before something has been taught (row 4 in stuck c4, c5-t02, c6; offtopic c4; steering c4,
   *  c5-t02, c6: a second request at the greeting). */
  helpSpentCold(L, r, i) {
    if (r.who !== "teacher" || !(r.seams ?? []).some((x) => x.joint === "helpSpent")) return null;
    const UNIT = /^(?:e\d+|rem:|then:|worked|check|c\d)/;
    const taught = (L.rows ?? []).slice(0, i).some((x) => x.who === "teacher" && (x.pageParts ?? []).some((p) => ["body", "card", "simpler", "stepAsk", "quick"].includes(p.part) && UNIT.test(String(p.beat ?? ""))));
    return taught ? null : "the \"nothing easier\" line with nothing taught before it";
  },
  /** P3: at an asked worked step a give-up or a clarify gets the step's simpler first; the step is told only at the second request or after
   *  a wrong answer (c4 stuck 36; c5-t01 stuck 20; c5-t02 stuck 20, offtopic 16, steering 28; c6 stuck 20, offtopic 16, steering 28). */
  // (dc-r8-director30 Brain 046 Q1: and read on its cue as keyEarly reads a key's — a step is told only at a second request (a give-up or a
  // clarify, its simpler said) or after a wrong answer to it; never after a yes, an aside, a remark or anything else: c5-t01 stuck 22,
  // c5-t02 stuck 22, offtopic 18, c6 stuck 22, offtopic 18)
  stepToldEarly(L, r, i, ctx) {
    if (r.who !== "teacher" || !r.stepAnswer?.told) return null;
    const req = String(ctx?.prevIntent ?? r.cell?.column ?? "");
    const wrong = /^(?:incorrect|partial|misconception)\b/.test(String(ctx?.prevRead ?? "")) || !!r.stepAnswer.miss || ["wrong", "misconception"].includes(String(r.cell?.column ?? ""));
    if (wrong) return null;
    if (!["give_up", "clarify"].includes(req) && !["give_up", "clarify"].includes(String(r.cell?.column ?? ""))) return `the step told on a cue that is no request and no wrong answer (${req || r.cell?.column || "none"}: "${String(ctx?.prevChild ?? "").slice(0, 30)}")`;
    const m = /^(.+)-s(\d+):worked:step(\d+)$/.exec(String(r.stepAnswer.beat ?? ""));
    if (!m) return null;
    const sk = (ctx.script?.skills ?? []).find((k) => k.skillId === `${m[1]}-s${m[2]}`);
    const simpler = low(said(sk?.workedExample?.steps?.[Number(m[3]) - 1]?.simpler));
    if (!simpler) return null;
    const before = (L.rows ?? []).slice(0, i).filter((x) => x.who === "teacher").map((x) => low(x.text)).join(" ");
    return before.includes(simpler.slice(0, 40)) ? null : `the step ${m[3]} told at a ${req} with its simpler unsaid`;
  },
};
